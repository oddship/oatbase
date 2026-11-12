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

    expect(index).toContain('href="./dist/oatbase.css?v=0.1.0-oat1"');
    expect(index).toContain('src="./dist/oatbase.js?v=0.1.0-oat1"');
    expect(examples).toContain('href="./dist/oatbase.css"');
    expect(index).not.toContain('../dist/');
    expect(examples).not.toContain('../dist/');
    await access(join(output, 'dist', 'oatbase.css'));
    await access(join(output, 'assets', 'avatar-sample.svg'));
    const recipe = await readFile(join(output, 'recipes/mobile-product.html'), 'utf8');
    expect(recipe).not.toContain('../../dist/');
    for (const match of recipe.matchAll(/<(?:a|link|script)\b[^>]*\b(?:href|src)="([^"#]+)"/g)) {
      if (!match[1].startsWith('http')) await access(new URL(match[1], `file://${output}/recipes/mobile-product.html`));
    }
    await access(join(output, 'recipes/responsive-details.js'));
    await access(join(output, '.nojekyll'));
  });
});
