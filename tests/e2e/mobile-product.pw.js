import { test, expect } from '@playwright/test';

const recipe = '/docs/recipes/mobile-product.html';

test('compact recipe contains long content and touch targets at narrow widths', async ({ page }) => {
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(recipe);
    const overflow = await page.locator('main').evaluate(root => [...root.querySelectorAll('*')].filter(element => {
      const rect = element.getBoundingClientRect();
      // Firefox exposes zero clientWidth for inline text despite a nonzero
      // scrollWidth. Check those fragments against viewport bounds instead.
      const scrolls = element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 1;
      return rect.width && rect.height && (rect.left < -1 || rect.right > innerWidth + 1 || scrolls);
    }).map(element => `${element.tagName}.${element.className}: ${element.clientWidth}/${element.scrollWidth} ${element.getBoundingClientRect().left}-${element.getBoundingClientRect().right}`));
    expect(overflow).toEqual([]);
    const targets = await page.locator('main :is(button, a.item, input, select, summary):visible').evaluateAll(elements => elements.map(element => element.getBoundingClientRect().height));
    expect(targets.every(height => height >= 44)).toBe(true);
    expect(await page.locator('input').evaluate(element => getComputedStyle(element).fontSize)).toBe('16px');
  }
});

test('responsive disclosure preserves toggles and restores focus before viewport collapse', async ({ page }) => {
  await page.setViewportSize({ width: 1000, height: 844 });
  await page.goto(recipe);
  const details = page.locator('[data-responsive-details]');
  const summary = details.locator('summary');
  await expect(details).toHaveAttribute('open', '');
  await details.getByRole('link').focus();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(details).not.toHaveAttribute('open');
  await expect(summary).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(details).toHaveAttribute('open', '');
  await page.setViewportSize({ width: 400, height: 844 });
  await expect(details).toHaveAttribute('open', '');
  await page.keyboard.press('Space');
  await expect(details).not.toHaveAttribute('open');
  await page.setViewportSize({ width: 1000, height: 844 });
  await expect(details).toHaveAttribute('open', '');
  await summary.click();
  await expect(details).not.toHaveAttribute('open');
});

test('recipe cleanup stops viewport updates', async ({ page }) => {
  await page.goto(recipe);
  await page.evaluate(async () => {
    const { responsiveDetails } = await import('/docs/recipes/responsive-details.js');
    const details = document.createElement('details');
    details.id = 'cleanup';
    details.innerHTML = '<summary>Extra context</summary><p>Notes</p>';
    document.querySelector('main').append(details);
    responsiveDetails(details)();
    details.open = true;
  });
  await page.setViewportSize({ width: 320, height: 844 });
  await expect(page.locator('#cleanup')).toHaveAttribute('open', '');
});

test('native context and forms remain usable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 320, height: 844 } });
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:43127${recipe}`);
  await page.locator('[data-responsive-details] summary').click();
  await expect(page.locator('[data-responsive-details] p')).toBeVisible();
  await page.getByRole('textbox').fill('Workshop');
  await page.getByRole('button', { name: 'Save settings' }).click();
  await expect(page).toHaveURL(/project=Workshop/);
  await context.close();
});

test('wrapped toolbar retains roving keyboard navigation', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto(recipe);
  const buttons = page.getByRole('toolbar').getByRole('button');
  await expect(buttons.nth(1)).toHaveAttribute('tabindex', '-1');
  await buttons.first().focus();
  await page.keyboard.press('ArrowRight');
  await expect(buttons.nth(1)).toBeFocused();
  await page.keyboard.press('End');
  await expect(buttons.last()).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.locator('a.item').first()).toBeFocused();
});

test('touch does not leave a supplementary tooltip painted over the product', async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(`http://127.0.0.1:43127${recipe}`);
  await page.getByRole('button', { name: 'New project', exact: true }).tap();
  const tip = page.locator('.ot-tooltip');
  await expect(tip).toHaveCount(1);
  await expect(tip).toHaveCSS('visibility', 'hidden');
  await expect(page.getByRole('button', { name: 'New project', exact: true })).toBeVisible();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: 'New project', exact: true })).toBeFocused();
  await expect(tip).toHaveCSS('visibility', 'visible');
  await page.keyboard.press('Escape');
  expect(await tip.evaluate(element => element.matches(':popover-open'))).toBe(false);
  await context.close();
});
