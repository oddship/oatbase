import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const outputDirectory = resolve(fileURLToPath(root), process.argv[2] || 'dist');
const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const oat = (await readFile(new URL('node_modules/@knadh/oat/oat.min.css', root), 'utf8')).trimEnd();
const extensions = (await readFile(resolve(outputDirectory, 'extensions.css'), 'utf8')).trimEnd();
const extensionsMin = (await readFile(resolve(outputDirectory, 'extensions.min.css'), 'utf8')).trimEnd();
const banner = `/*! Oatbase v${pkg.version} includes @knadh/oat (MIT); THIRD_PARTY_NOTICES.md */`;

await mkdir(outputDirectory, { recursive: true });
await Promise.all([
  writeFile(resolve(outputDirectory, 'extensions.css'), `${extensions}\n`),
  writeFile(resolve(outputDirectory, 'extensions.min.css'), extensionsMin),
  writeFile(resolve(outputDirectory, 'oatbase.css'), `${banner}\n${oat}\n${extensions}\n`),
  writeFile(resolve(outputDirectory, 'oatbase.min.css'), `${banner}${oat}${extensionsMin}`),
]);
