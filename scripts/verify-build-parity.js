import { readdir, readFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import { dirname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repository = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const baselineDirectory = resolve(repository, process.argv[2] || 'dist');
const candidateDirectory = resolve(repository, process.argv[3] || 'dist-esgun');
const requireByteEquality = process.argv.includes('--require-byte-equal');
const manifest = JSON.parse(await readFile(resolve(repository, 'scripts/build-artifacts.json'), 'utf8'));
const config = JSON.parse(await readFile(resolve(repository, 'esgun.config.json'), 'utf8'));
const pkg = JSON.parse(await readFile(resolve(repository, 'package.json'), 'utf8'));
const failures = [];

function fail(message) {
  failures.push(message);
}

function expectedArtifacts() {
  const artifacts = new Set();
  const scripts = [...manifest.javascript.aggregates, ...manifest.javascript.components];
  const styles = [...manifest.stylesheets.aggregates, ...manifest.stylesheets.components.map(name => ({ name }))];
  for (const entry of scripts) {
    artifacts.add(`${entry.name}.js`);
    artifacts.add(`${entry.name}.esm.js`);
    if (entry.minified) artifacts.add(`${entry.name}.min.js`);
  }
  for (const entry of styles) {
    artifacts.add(`${entry.name}.css`);
    if (entry.minified) artifacts.add(`${entry.name}.min.css`);
  }
  for (const copy of manifest.copies) artifacts.add(copy.output);
  return [...artifacts].sort();
}

async function filesUnder(directory, prefix = '') {
  const entries = await readdir(resolve(directory, prefix), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...await filesUnder(directory, path));
    else if (entry.isFile()) files.push(path);
  }
  return files.sort();
}

function compareSets(label, expected, actual) {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  for (const file of expected) if (!actualSet.has(file)) fail(`${label} is missing ${file}`);
  for (const file of actual) if (!expectedSet.has(file)) fail(`${label} has unexpected artifact ${file}`);
}

async function exists(path) {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
}

function relativeOutput(input, outputPattern) {
  const name = input.slice(input.lastIndexOf('/') + 1).replace(/\.[^.]+$/, '');
  return outputPattern.replaceAll('[name]', name);
}

async function verifyManifestSources() {
  const sourceEntries = [
    ...manifest.javascript.aggregates,
    ...manifest.javascript.components,
    ...manifest.stylesheets.aggregates.filter(entry => entry.source),
    ...manifest.stylesheets.components.map(name => ({ source: name === 'utilities' ? 'src/css/utilities.css' : `src/css/components/${name}.css` })),
    ...manifest.copies,
  ];
  for (const entry of sourceEntries) {
    const source = entry.source;
    if (!source || !await exists(resolve(repository, source))) fail(`manifest source does not exist: ${source}`);
  }
}

async function verifyConfig() {
  if (manifest.schemaVersion !== 1) fail(`unsupported artifact manifest schema: ${manifest.schemaVersion}`);
  if (config.root !== 'dist-esgun') fail('EsGun pilot root must remain isolated at dist-esgun');
  if (config.target !== 'esnext') fail('EsGun pilot target must preserve the source-level modern JavaScript contract');

  const expectedScripts = new Map(
    [...manifest.javascript.aggregates, ...manifest.javascript.components].map(entry => [entry.source, entry.name])
  );
  const configuredScripts = new Map(
    [...config.entrySets['script-aggregates'], ...config.entrySets.scripts].map(entry => [entry.input, entry.output])
  );
  for (const [source, output] of expectedScripts) {
    if (configuredScripts.get(source) !== output) fail(`EsGun config does not map ${source} to ${output}`);
  }
  for (const [source] of configuredScripts) {
    if (!expectedScripts.has(source)) fail(`EsGun config has an unmanifested script entry: ${source}`);
  }

  const styleInputs = [];
  for (const entry of [...config.entrySets['style-aggregates'], ...config.entrySets.styles]) {
    if (!entry.input.includes('*')) {
      styleInputs.push([entry.input, entry.output]);
      continue;
    }
    const directory = resolve(repository, dirname(entry.input));
    const suffix = entry.input.slice(entry.input.lastIndexOf('*') + 1);
    for (const file of await readdir(directory)) {
      if (file.endsWith(suffix)) {
        const input = `${dirname(entry.input)}/${file}`;
        styleInputs.push([input, relativeOutput(input, entry.output)]);
      }
    }
  }
  const configuredStyles = new Map(styleInputs);
  const expectedStyles = new Map([
    ['src/css/extensions.css', 'extensions'],
    ...manifest.stylesheets.components.map(name => [
      name === 'utilities' ? 'src/css/utilities.css' : `src/css/components/${name}.css`,
      name,
    ]),
  ]);
  for (const [source, output] of expectedStyles) {
    if (configuredStyles.get(source) !== output) fail(`EsGun config does not map ${source} to ${output}`);
  }
  for (const [source] of configuredStyles) {
    if (!expectedStyles.has(source)) fail(`EsGun config has an unmanifested stylesheet entry: ${source}`);
  }

  const requiredProfiles = {
    'css-readable': { format: 'esm', minify: false, splitting: false, suffix: '' },
    'css-minified': { format: 'esm', minify: true, splitting: false, suffix: '.min' },
    'esm-readable': { format: 'esm', minify: false, splitting: false, suffix: '.esm' },
    'iife-readable': { format: 'iife', minify: false, splitting: false, suffix: '' },
    'iife-minified': { format: 'iife', minify: true, splitting: false, suffix: '.min' },
  };
  for (const [name, requirement] of Object.entries(requiredProfiles)) {
    const profile = config.profiles[name];
    if (!profile) {
      fail(`EsGun config is missing profile ${name}`);
      continue;
    }
    for (const [field, expected] of Object.entries(requirement)) {
      const actual = field === 'suffix' ? profile[field] || '' : profile[field];
      if (actual !== expected) fail(`EsGun profile ${name}.${field} must be ${JSON.stringify(expected)}`);
    }
    if (profile?.outdir !== config.root) fail(`EsGun profile ${name}.outdir must match the isolated root`);
  }

  const configuredCopies = new Map(config.copies.map(copy => [copy.from, copy.to]));
  if (configuredCopies.get('src/css/themes.css') !== `${config.root}/themes.css`) {
    fail('EsGun config must copy the aggregate theme stylesheet verbatim');
  }
  if (configuredCopies.get('src/css/themes') !== `${config.root}/themes`) {
    fail('EsGun config must copy the individual theme directory verbatim');
  }
}

async function verifyPackageExports() {
  const exported = Object.values(pkg.exports).flatMap(value => typeof value === 'string' ? [value] : Object.values(value));
  const paths = [pkg.main, pkg.module, pkg.style, ...exported];
  for (const path of new Set(paths)) {
    const resolved = path.startsWith('./dist/')
      ? resolve(candidateDirectory, path.slice('./dist/'.length))
      : resolve(repository, path);
    if (!await exists(resolved)) fail(`package export does not exist in candidate build: ${path}`);
  }
}

async function verifyFullStylesheetAssembly() {
  const oat = (await readFile(resolve(repository, 'node_modules/@knadh/oat/oat.min.css'), 'utf8')).trimEnd();
  const extensions = (await readFile(resolve(candidateDirectory, 'extensions.css'), 'utf8')).trimEnd();
  const extensionsMin = (await readFile(resolve(candidateDirectory, 'extensions.min.css'), 'utf8')).trimEnd();
  const banner = `/*! Oatbase v${pkg.version} includes @knadh/oat (MIT); THIRD_PARTY_NOTICES.md */`;
  const expectedReadable = `${banner}\n${oat}\n${extensions}\n`;
  const expectedMinified = `${banner}${oat}${extensionsMin}`;
  if (await readFile(resolve(candidateDirectory, 'oatbase.css'), 'utf8') !== expectedReadable) {
    fail('candidate oatbase.css is not the exact banner + Oat + readable extensions assembly');
  }
  if (await readFile(resolve(candidateDirectory, 'oatbase.min.css'), 'utf8') !== expectedMinified) {
    fail('candidate oatbase.min.css is not the exact banner + Oat + minified extensions assembly');
  }
}

async function verifyCopiedThemes() {
  for (const copy of manifest.copies) {
    const source = await readFile(resolve(repository, copy.source));
    const output = await readFile(resolve(candidateDirectory, copy.output));
    if (!source.equals(output)) fail(`candidate copied asset differs from source: ${copy.output}`);
  }
}

async function verifyJavaScript() {
  const entries = [...manifest.javascript.aggregates, ...manifest.javascript.components];
  for (const entry of entries) {
    const esmPath = resolve(candidateDirectory, `${entry.name}.esm.js`);
    const iifePath = resolve(candidateDirectory, `${entry.name}.js`);
    const esm = await readFile(esmPath, 'utf8');
    const iife = await readFile(iifePath, 'utf8');
    if (!entry.sideEffectOnly && !/\bexport\s*\{/.test(esm)) fail(`${entry.name}.esm.js does not expose an ESM export block`);
    if (/\bexport\s*\{/.test(iife)) fail(`${entry.name}.js unexpectedly contains an ESM export block`);
    for (const path of [esmPath, iifePath]) {
      const checked = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
      if (checked.status !== 0) fail(`${relative(candidateDirectory, path)} failed node --check: ${checked.stderr.trim()}`);
    }
    if (entry.minified) {
      const minifiedPath = resolve(candidateDirectory, `${entry.name}.min.js`);
      const minified = await readFile(minifiedPath);
      if (minified.byteLength >= Buffer.byteLength(iife)) fail(`${entry.name}.min.js is not smaller than its readable IIFE`);
      const checked = spawnSync(process.execPath, ['--check', minifiedPath], { encoding: 'utf8' });
      if (checked.status !== 0) fail(`${entry.name}.min.js failed node --check: ${checked.stderr.trim()}`);
    }
  }
}

function digest(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

async function measure(directory, files) {
  const parts = await Promise.all(files.map(file => readFile(resolve(directory, file))));
  const bytes = Buffer.concat(parts);
  return {
    raw: bytes.byteLength,
    gzip: gzipSync(bytes).byteLength,
    brotli: brotliCompressSync(bytes).byteLength,
  };
}

function signed(value) {
  return value > 0 ? `+${value}` : String(value);
}

const expected = expectedArtifacts();
await verifyManifestSources();
await verifyConfig();
for (const [label, directory] of [['baseline', baselineDirectory], ['candidate', candidateDirectory]]) {
  try {
    compareSets(label, expected, await filesUnder(directory));
  } catch (error) {
    fail(`${label} directory cannot be read: ${error.message}`);
  }
}

if (failures.length === 0) {
  await verifyPackageExports();
  await verifyFullStylesheetAssembly();
  await verifyCopiedThemes();
  await verifyJavaScript();

  let changed = 0;
  for (const file of expected) {
    const baseline = await readFile(resolve(baselineDirectory, file));
    const candidate = await readFile(resolve(candidateDirectory, file));
    if (digest(baseline) !== digest(candidate)) {
      changed += 1;
      if (requireByteEquality) fail(`byte output differs: ${file}`);
    }
  }
  const baselineSize = await measure(baselineDirectory, expected);
  const candidateSize = await measure(candidateDirectory, expected);
  console.log(`Artifact set: ${expected.length} files; ${changed} differ byte-for-byte`);
  console.log(`Baseline:  ${baselineSize.raw} raw / ${baselineSize.gzip} gzip / ${baselineSize.brotli} Brotli bytes`);
  console.log(`Candidate: ${candidateSize.raw} raw / ${candidateSize.gzip} gzip / ${candidateSize.brotli} Brotli bytes`);
  console.log(`Delta:     ${signed(candidateSize.raw - baselineSize.raw)} raw / ${signed(candidateSize.gzip - baselineSize.gzip)} gzip / ${signed(candidateSize.brotli - baselineSize.brotli)} Brotli bytes`);

  const loadingPaths = {
    complete: ['oatbase.min.css', 'oatbase.min.js'],
    extensions: ['extensions.min.css', 'extensions.min.js'],
  };
  for (const [name, files] of Object.entries(loadingPaths)) {
    const baselinePath = await measure(baselineDirectory, files);
    const candidatePath = await measure(candidateDirectory, files);
    console.log(`${name}: ${baselinePath.gzip} -> ${candidatePath.gzip} gzip (${signed(candidatePath.gzip - baselinePath.gzip)}); ${baselinePath.brotli} -> ${candidatePath.brotli} Brotli (${signed(candidatePath.brotli - baselinePath.brotli)})`);
    if (candidatePath.gzip > baselinePath.gzip) fail(`${name} candidate regresses gzip transfer size by ${candidatePath.gzip - baselinePath.gzip} bytes`);
    if (candidatePath.brotli > baselinePath.brotli) fail(`${name} candidate regresses Brotli transfer size by ${candidatePath.brotli - baselinePath.brotli} bytes`);
  }
}

if (failures.length > 0) {
  console.error(`Build parity failed with ${failures.length} issue${failures.length === 1 ? '' : 's'}:`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log('Build contract parity passed.');
}
