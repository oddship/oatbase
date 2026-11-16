import { test, expect } from '@playwright/test';

for (const width of [320, 768]) {
  test(`reading content contains long source URLs at ${width}px`, async ({ page, baseURL }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.setContent(`<link rel="stylesheet" href="${baseURL}/dist/oatbase.css">
      <main style="padding:1rem;display:grid;grid-template-columns:minmax(0,1fr)">
        <article data-prose><h1>Source notes</h1><p><a href="#">https://example.test/${'a'.repeat(600)}</a></p></article>
        <dl data-description-list><div><dt>Original source</dt><dd><a href="#">https://example.test/${'b'.repeat(450)}</a></dd></div></dl>
      </main>`);
    await page.locator('main').waitFor();
    await expect.poll(() => page.evaluate(() => {
      const nodes = [...document.querySelectorAll('main, article, p, dl, dd, a')];
      return nodes.flatMap(node => {
        const rectangles = [...node.getClientRects()];
        const outsideViewport = rectangles.some(rect => rect.left < 0 || rect.right > innerWidth);
        // Inline anchors have no client box; Firefox still exposes a scrollWidth.
        const blockOverflows = getComputedStyle(node).display !== 'inline'
          && node.scrollWidth > node.clientWidth + 1;
        return outsideViewport || blockOverflows ? [{
          tag: node.tagName, outsideViewport, blockOverflows,
          scrollWidth: node.scrollWidth, clientWidth: node.clientWidth
        }] : [];
      });
    })).toEqual([]);
  });
}
