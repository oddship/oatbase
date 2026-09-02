import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export async function buildPages(outputPath = resolve(root, '_site')) {
  const output = resolve(outputPath);
  if (output === root || !output.startsWith(`${root}${sep}`)) {
    throw new Error('The Pages output must be a directory inside the repository.');
  }

  await rm(output, { recursive: true, force: true });
  await mkdir(output, { recursive: true });
  await cp(resolve(root, 'docs'), output, { recursive: true });
  await cp(resolve(root, 'dist'), resolve(output, 'dist'), { recursive: true });

  for (const relativePath of ['index.html', 'examples.js']) {
    const path = resolve(output, relativePath);
    const source = await readFile(path, 'utf8');
    await writeFile(path, source.replaceAll('../dist/', './dist/'));
  }

  await writeFile(resolve(output, '.nojekyll'), '');
  return output;
}

if (import.meta.main) {
  const output = await buildPages(process.argv[2]);
  console.log(`GitHub Pages artifact staged at ${output}`);
}
