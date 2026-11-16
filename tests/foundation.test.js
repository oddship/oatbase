import { test, expect } from 'bun:test';
import { gzipSync } from 'node:zlib';

test('foundation includes Oat and compatibility fixes without optional components', async () => {
  const css = await Bun.file('dist/foundation.min.css').text();
  const js = await Bun.file('dist/foundation.min.js').text();
  expect(css).toContain('--foreground');
  expect(css).toContain('data-oat-theme');
  expect(css).not.toContain('[data-prose]');
  expect(css).not.toContain('ot-combobox');
  expect(js).toContain('ot-dropdown');
  for (const name of ['ot-copy', 'ot-command', 'ot-calendar', 'ot-combobox', 'ot-theme-switcher']) expect(js).not.toContain(name);
  expect(gzipSync(Buffer.concat([Buffer.from(css), Buffer.from(js)])).length).toBeLessThan(13_000);
});
