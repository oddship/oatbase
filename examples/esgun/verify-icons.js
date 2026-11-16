import { readFile } from 'node:fs/promises';
import { gzipSync, brotliCompressSync } from 'node:zlib';
import { copyIcon, checkIcon, sparklesIcon } from '../../src/icons/tabler.js';

const javascript = await readFile(new URL('./dist/assets/app.js', import.meta.url), 'utf8');
const path = svg => /<path d="([^"]+)"/.exec(svg)?.[1];
if (!javascript.includes(path(copyIcon))) throw new Error('The selected Copy icon is missing');
for (const unused of [checkIcon, sparklesIcon]) {
  if (javascript.includes(path(unused))) throw new Error('An unused icon survived tree shaking');
}
console.log(JSON.stringify({
  selectedIcons: ['copy'], unusedIconsRemoved: ['check', 'sparkles'],
  icon: { raw: copyIcon.length, gzip: gzipSync(copyIcon).length, brotli: brotliCompressSync(copyIcon).length }
}));
