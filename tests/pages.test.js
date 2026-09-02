import { afterAll, describe, expect, test } from 'bun:test';
import { access, mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPages } from '../scripts/build-pages.js';

const output = await mkdtemp(fileURLToPath(new URL('../.pages-test-', import.meta.url)));

afterAll(() => rm(output, { recursive: true, force: true }));

describe('GitHub Pages artifact', () => {
  test('hosts the docs at the repository Pages root', async () => {
    await buildPages(output);
    const [index, examples] = await Promise.all([
      readFile(join(output, 'index.html'), 'utf8'),
      readFile(join(output, 'examples.js'), 'utf8')
    ]);

    expect(index).toContain('href="./dist/oatbase.css?v=0.1.0"');
    expect(index).toContain('src="./dist/oatbase.js?v=0.1.0"');
    expect(examples).toContain('href="./dist/oatbase.css"');
    expect(index).not.toContain('../dist/');
    expect(examples).not.toContain('../dist/');
    await access(join(output, 'dist', 'oatbase.css'));
    await access(join(output, 'assets', 'avatar-sample.svg'));
    await access(join(output, '.nojekyll'));
  });
});
