import { gzipSync, brotliCompressSync } from 'node:zlib';

const groups = {
  complete: ['dist/oatbase.min.css', 'dist/oatbase.min.js'],
  extensions: ['dist/extensions.min.css', 'dist/extensions.min.js'],
  'data-table': ['dist/data-table.css', 'dist/data-table.js']
};

for (const [name, files] of Object.entries(groups)) {
  const buffers = await Promise.all(files.map(async file => Buffer.from(await Bun.file(file).arrayBuffer())));
  const source = Buffer.concat(buffers);
  const row = {
    bundle: name,
    raw: source.byteLength,
    gzip: gzipSync(source).byteLength,
    brotli: brotliCompressSync(source).byteLength
  };
  console.log(`${row.bundle.padEnd(12)} raw ${String(row.raw).padStart(7)}  gzip ${String(row.gzip).padStart(6)}  brotli ${String(row.brotli).padStart(6)}`);
}
