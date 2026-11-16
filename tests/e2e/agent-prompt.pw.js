import { test, expect } from '@playwright/test';

const text = 'Inspect this repository.\nBuild a local preview.\nAsk before publishing.';

test('copies the displayed prompt and preserves its icon, label, focus and feedback width', async ({ page }) => {
  await page.addInitScript(() => {
    window.copied = [];
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => window.copied.push(text) } });
  });
  await page.goto('/tests/agent-prompt.html');
  const prompt = page.locator('ot-copy[data-enhanced]');
  const button = prompt.locator('[data-copy-button]');
  await expect(button).toBeVisible();
  const width = (await button.boundingBox()).width;
  await button.focus();
  await page.keyboard.press('Enter');
  await expect(prompt.locator('[data-copy-status]')).toHaveText('Prompt copied');
  expect(await page.evaluate(() => window.copied)).toEqual([text]);
  await expect(button.locator('svg')).toHaveCount(1);
  await expect(button).toBeFocused();
  expect((await button.boundingBox()).width).toBe(width);
  await expect(button).toHaveText('Copy agent prompt');
  await expect(button.locator('svg')).toHaveCount(1);
  await prompt.evaluate(element => { element.remove(); document.querySelector('main').append(element); });
  await button.click();
  expect(await page.evaluate(() => window.copied)).toEqual([text, text]);
});

test('reports clipboard denial without claiming success', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('Denied'); } } });
    document.execCommand = () => false;
    window.copyEvents = [];
    document.addEventListener('oatbase:copy', () => window.copyEvents.push('success'));
    document.addEventListener('oatbase:copy-error', () => window.copyEvents.push('error'));
  });
  await page.goto('/tests/agent-prompt.html');
  const button = page.getByRole('button', { name: 'Copy agent prompt' });
  await button.click();
  await expect(page.locator('[data-copy-status]')).toContainText('Unable to copy');
  await expect(button).toBeFocused();
  await expect(button).toHaveText('Copy agent prompt');
  expect(await page.evaluate(() => window.copyEvents)).toEqual(['error']);
});

test('retains a selectable source without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/tests/agent-prompt.html`);
  await expect(page.locator('[data-copy-button]')).toBeHidden();
  await expect(page.locator('[data-copy-source]')).toHaveText(text);
  await expect(page.getByLabel('Selectable agent prompt')).toBeVisible();
  await context.close();
});

for (const width of [320, 768, 1280]) {
  test(`contains the prompt in a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto('/tests/agent-prompt.html');
    await expect(page.locator('ot-copy')).toHaveAttribute('data-enhanced', '');
    expect(await page.locator('ot-copy, section, pre, button').evaluateAll(nodes => nodes.every(node => {
      const rect = node.getBoundingClientRect();
      return rect.left >= 0 && rect.right <= innerWidth && node.scrollWidth <= node.clientWidth + 1;
    }))).toBe(true);
  });
}

test('keeps an SVG-only Oat icon button square and named', async ({ page }) => {
  await page.goto('/tests/agent-prompt.html');
  const button = page.getByRole('button', { name: 'Open documentation' });
  const box = await button.boundingBox();
  expect(box.width).toBeGreaterThanOrEqual(40);
  expect(Math.abs(box.width - box.height)).toBeLessThanOrEqual(1);
  await expect(button.locator('svg')).toHaveAttribute('aria-hidden', 'true');
});
