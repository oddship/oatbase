import { test, expect } from '@playwright/test';

for (const width of [320, 768]) {
  test(`reading content contains long source URLs at ${width}px`, async ({ page, baseURL }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.setContent(`<link rel="stylesheet" href="${baseURL}/dist/oatbase.css">
      <main style="padding:1rem;display:grid;grid-template-columns:minmax(0,1fr)">
        <article data-prose><h1>Source notes</h1><p><a href="#">https://example.test/${'long-source-identifier'.repeat(30)}</a></p></article>
        <dl data-description-list><div><dt>Original source</dt><dd><a href="#">https://example.test/${'original-source'.repeat(30)}</a></dd></div></dl>
      </main>`);
    await page.locator('main').waitFor();
    await expect.poll(() => page.evaluate(() => {
      const nodes = [...document.querySelectorAll('main, article, p, dl, dd, a')];
      return nodes.every(node => {
        const rect = node.getBoundingClientRect();
        return rect.left >= 0 && rect.right <= innerWidth && node.scrollWidth <= node.clientWidth + 1;
      });
    })).toBe(true);
  });
}
