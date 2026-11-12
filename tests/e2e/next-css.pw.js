import { test, expect } from '@playwright/test';

test('production CSS and React interaction ownership', async ({ page }) => {
  test.skip(!process.env.OATBASE_NEXT_FIXTURE, 'Build and start examples/next-css first');
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:43128');
  const button = page.getByRole('button', { name: 'Record review' });
  await expect(button).toHaveCSS('background-color', 'rgb(0, 106, 115)');
  await expect(button).toHaveCSS('min-height', '44px');
  await button.click();
  await expect(page.getByRole('status')).toHaveText('Reviews recorded: 1');
  await page.getByText('Supporting context', { exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('details p')).toBeVisible();
  expect(await page.evaluate(() => customElements.get('ot-toolbar'))).toBeUndefined();
  expect(errors).toEqual([]);
});
