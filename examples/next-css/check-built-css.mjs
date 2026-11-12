import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

async function files(directory) {
  return (await Promise.all((await readdir(directory, { withFileTypes: true })).map(entry =>
    entry.isDirectory() ? files(join(directory, entry.name)) : join(directory, entry.name)))).flat();
}
const styles = (await files('.next/static')).filter(file => file.endsWith('.css'));
assert(styles.length, 'Production build must emit CSS');
const css = (await Promise.all(styles.map(file => readFile(file, 'utf8')))).join('\n');
assert(!/@media[^{}]*layer\s*\(/.test(css), 'A cascade layer became a non-matching media query');
for (const layer of ['theme', 'base', 'components', 'product']) {
  assert(new RegExp(`@layer\\s+${layer}\\s*\\{`).test(css), `Missing ${layer} rules`);
}
assert(/--primary\s*:\s*#006a73\b/i.test(css), 'Consumer theme override missing');
assert(css.includes('.item-group'), 'Staged Oatbase CSS missing');
console.log('Production CSS: Oatbase rules, internal cascade layers, and consumer tokens present.');
