import { readdir, readFile } from 'node:fs/promises';
import { brotliCompressSync, gzipSync } from 'node:zlib';

const root = new URL('../../../../', import.meta.url);
const json = process.argv.includes('--json');

async function payload(paths) {
  return Buffer.concat(await Promise.all(paths.map(path => readFile(new URL(path, root)))));
}

function sizes(buffer) {
  return {
    raw: buffer.length,
    gzip: gzipSync(buffer, { level: 9 }).length,
    brotli: brotliCompressSync(buffer).length
  };
}

async function aggregate(name, paths, budget) {
  const measured = sizes(await payload(paths));
  return { name, paths, budget, ...measured, withinBudget: budget ? measured.gzip < budget : undefined };
}

const aggregates = await Promise.all([
  aggregate('complete', ['dist/oatbase.min.css', 'dist/oatbase.min.js'], 28_000),
  aggregate('extensions', ['dist/extensions.min.css', 'dist/extensions.min.js'], 18_000),
  aggregate('tooltip opt-in', ['dist/tooltip-compat.css', 'dist/tooltip-compat.esm.js'])
]);

const componentDirectory = new URL('src/css/components/', root);
const componentFiles = (await readdir(componentDirectory)).filter(file => file.endsWith('.css'));
const components = [];

for (const file of componentFiles) {
  const name = file.slice(0, -4);
  const entries = [new URL(`src/css/components/${file}`, root).pathname];
  const js = new URL(`src/js/${name}.js`, root);
  if (await Bun.file(js).exists()) entries.push(js.pathname);

  const build = await Bun.build({
    entrypoints: entries,
    format: 'esm',
    minify: true,
    target: 'browser',
    write: false
  });
  if (!build.success) throw new Error(`Could not measure ${name}`);
  const output = Buffer.concat(await Promise.all(
    build.outputs.map(async file => Buffer.from(await file.arrayBuffer()))
  ));
  components.push({ name, ...sizes(output) });
}

components.sort((left, right) => right.gzip - left.gzip);

if (json) {
  console.log(JSON.stringify({ aggregates, components }, null, 2));
} else {
  console.log('Aggregate browser payloads (bytes)');
  console.table(aggregates.map(({ name, raw, gzip, brotli, budget, withinBudget }) => ({
    name, raw, gzip, brotli, budget: budget || '', status: budget ? (withinBudget ? 'pass' : 'FAIL') : ''
  })));
  console.log('\nMinified independent component estimates (bytes)');
  console.table(components.map(({ name, raw, gzip, brotli }) => ({ name, raw, gzip, brotli })));
}
