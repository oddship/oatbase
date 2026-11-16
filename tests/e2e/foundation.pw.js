import { test, expect } from '@playwright/test';

test('foundation provides Oat behavior and supports a separately loaded component', async ({ page }) => {
  await page.goto('/tests/foundation.html');
  await page.waitForFunction(() => customElements.get('ot-copy') && customElements.get('ot-dropdown'));
  expect(await page.evaluate(() => ['ot-command', 'ot-combobox', 'ot-calendar', 'ot-theme-switcher'].filter(name => customElements.get(name)))).toEqual([]);
  const trigger = page.getByRole('button', { name: 'Open menu' });
  await trigger.click();
  await expect(page.getByRole('menuitem')).toBeVisible();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toBeFocused();
  await expect(page.locator('ot-copy')).toHaveAttribute('data-enhanced', '');
  expect(await page.locator('body').evaluate(element => getComputedStyle(element).getPropertyValue('--foreground').trim())).not.toBe('');
});
