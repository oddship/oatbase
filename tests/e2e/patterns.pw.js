import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.goto('/tests/patterns.html');
  await expect(page.locator('ot-calendar')).toHaveAttribute('data-enhanced', '');
});

test('native fields, disclosures and media remain usable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage(); await page.goto('/tests/patterns.html');
  await expect(page.locator('ot-calendar input')).toBeVisible();
  await expect(page.locator('ot-calendar [data-calendar-panel]')).toHaveCount(0);
  await expect(page.locator('[data-question]')).toHaveCount(3);
  for (const item of await page.locator('[data-question]').all()) await expect(item).toBeVisible();
  await expect(page.locator('[data-question-submit]')).toBeVisible();
  await expect(page.locator('[data-question-actions]')).toBeHidden();
  await expect(page.locator('[data-carousel-controls]')).toBeHidden();
  await page.locator('ot-context-menu button[popovertarget]').click();
  await expect(page.locator('#pattern-context')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('ot-hover-card > button').focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#pattern-hover-card')).toBeVisible();
  await context.close();
});

test('calendar preserves native value, constraints, reset and input/change events', async ({ page }) => {
  const calendar = page.locator('ot-calendar'); const input = calendar.locator('input');
  await calendar.evaluate(host => { window.dateEvents = []; host.input.addEventListener('change', () => window.dateEvents.push(host.input.value)); });
  await calendar.locator('[data-day="2026-10-22"]').click();
  await expect(input).toHaveValue('2026-10-22');
  expect(await page.locator('#form-calendar').evaluate(form => new FormData(form).get('appointment'))).toBe('2026-10-22');
  expect(await page.evaluate(() => window.dateEvents)).toEqual(['2026-10-22']);
  await page.getByRole('button', { name: 'Reset calendar', exact: true }).click();
  await expect(input).toHaveValue('2026-10-20');
  await expect(calendar.locator('[data-day="2026-10-20"]')).toHaveAttribute('aria-pressed', 'true');
  await input.evaluate(input => { input.min = '2026-10-20'; input.step = '2'; });
  await expect(calendar.locator('[data-day="2026-10-19"]')).toHaveAttribute('aria-disabled', 'true');
  await expect(calendar.locator('[data-day="2026-10-21"]')).toHaveAttribute('aria-disabled', 'true');
  await calendar.locator('[data-day="2026-10-21"]').evaluate(button => button.click());
  await expect(input).toHaveValue('2026-10-20');
  await input.evaluate(input => { input.disabled = true; });
  await expect(calendar.locator('[data-day="2026-10-22"]')).toBeDisabled();
});

test('calendar navigates dates and months by keyboard and handles leap years', async ({ page }) => {
  const calendar = page.locator('ot-calendar');
  await calendar.locator('[data-day="2026-10-20"]').focus();
  await page.keyboard.press('ArrowRight');
  await expect(calendar.locator('[data-day="2026-10-21"]')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(calendar.locator('[data-day="2026-10-28"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(calendar.locator('input')).toHaveValue('2026-10-28');
  await calendar.evaluate(calendar => { calendar.input.min = ''; calendar.input.max = ''; calendar.value = '2028-02-29'; });
  await expect(calendar.locator('[data-day="2028-02-29"]')).toHaveAttribute('aria-pressed', 'true');
  await calendar.locator('[data-day="2028-02-29"]').focus(); await page.keyboard.press('PageDown');
  await expect(calendar.locator('[data-day="2028-03-29"]')).toBeFocused();
  await page.keyboard.press('PageUp'); await expect(calendar.locator('[data-day="2028-02-29"]')).toBeFocused();
  await calendar.evaluate(calendar => { calendar.value = '0004-02-29'; });
  await expect(calendar.locator('[data-day="0004-02-29"]')).toHaveAttribute('aria-pressed', 'true');
});

test('carousel supports buttons, keyboard, RTL, empty state and dynamic slides', async ({ page }) => {
  const carousel = page.locator('ot-carousel');
  await carousel.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(carousel.locator('[data-carousel-status]')).toHaveText('2 of 2');
  await expect(carousel.getByRole('button', { name: 'Next', exact: true })).toBeDisabled();
  const track = carousel.locator('[data-carousel-track]'); await track.focus(); await page.keyboard.press('Home');
  await expect(carousel.locator('[data-carousel-status]')).toHaveText('1 of 2');
  await carousel.evaluate(element => { element.dir = 'rtl'; element.goTo(0); });
  await track.focus(); await page.keyboard.press('ArrowLeft');
  await expect(carousel.locator('[data-carousel-status]')).toHaveText('2 of 2');
  await track.evaluate(track => track.replaceChildren());
  await expect(carousel.locator('[data-carousel-status]')).toHaveText('No slides');
  await expect(carousel.getByRole('button', { name: 'Previous', exact: true })).toBeDisabled();
});

test('context menu supports keyboard, pointer positioning, disabled items and cancelable selection', async ({ page }) => {
  const host = page.locator('ot-context-menu'); const target = host.locator('[data-context-target]');
  await target.focus(); await page.keyboard.press('Shift+F10');
  await expect(host.getByRole('menuitem', { name: 'Open project', exact: true })).toBeFocused();
  await page.keyboard.press('End');
  await expect(host.getByRole('menuitem', { name: 'Archive project', exact: true })).toBeFocused();
  await host.evaluate(host => host.addEventListener('oatbase:select', event => { event.preventDefault(); window.selectedAction = event.detail.value; }, { once: true }));
  await page.keyboard.press('Enter'); expect(await page.evaluate(() => window.selectedAction)).toBe('archive');
  await expect(host.locator('[popover]')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(target).toBeFocused();
  await target.click({ button: 'right' }); await expect(host.locator('[popover]')).toBeVisible();
  expect(await host.locator('[popover]').evaluate(popup => { const r = popup.getBoundingClientRect(); return r.x >= 0 && r.y >= 0 && r.right <= innerWidth && r.bottom <= innerHeight; })).toBe(true);
});

test('hover card keeps interactive content reachable and dismisses with Escape', async ({ page }) => {
  const host = page.locator('ot-hover-card'); const trigger = host.locator(':scope > button');
  await trigger.hover(); await expect(host.locator('[popover]')).toBeVisible();
  await host.getByRole('link', { name: 'View repository' }).hover();
  await expect(host.locator('[popover]')).toBeVisible();
  await trigger.focus(); await page.keyboard.press('Escape'); await expect(host.locator('[popover]')).toBeHidden();
  await page.keyboard.press('Enter'); await expect(host.locator('[popover]')).toBeVisible();
});

test('menubar uses one tab stop and opens and switches application menus', async ({ page }) => {
  const host = page.locator('ot-menubar'); const file = host.locator('button[popovertarget="pattern-file-menu"]'); const edit = host.locator('button[popovertarget="pattern-edit-menu"]');
  await expect(file).toHaveAttribute('tabindex', '0'); await expect(edit).toHaveAttribute('tabindex', '-1');
  // Oat inserts its shared tooltip popover beside the titled trigger.
  await file.evaluate(element => { element.title = 'File actions'; });
  await edit.evaluate(element => { element.title = 'Edit actions'; });
  await file.focus(); await page.keyboard.press('ArrowRight'); await expect(edit).toBeFocused();
  await page.keyboard.press('ArrowDown'); await expect(host.locator('#pattern-edit-menu').getByRole('menuitem', { name: 'New document' })).toBeFocused();
  await page.keyboard.press('ArrowUp'); await expect(host.locator('#pattern-edit-menu').getByRole('menuitem', { name: 'Open document' })).toBeFocused();
  await page.keyboard.press('ArrowDown'); await expect(host.locator('#pattern-edit-menu').getByRole('menuitem', { name: 'New document' })).toBeFocused();
  await page.keyboard.press('ArrowLeft'); await expect(host.locator('#pattern-file-menu')).toBeVisible();
  await page.keyboard.press('Escape'); await expect(file).toBeFocused();
});

test('questionnaire validates each step, retains native FormData and restores reset defaults', async ({ page }) => {
  const host = page.locator('ot-questionnaire');
  await host.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(host.locator('[data-question-progress]')).toHaveText('Question 1 of 3');
  await host.getByRole('radio', { name: 'Application', exact: true }).check();
  await host.locator('form').evaluate(form => form.requestSubmit());
  await expect(host.locator('[data-question-progress]')).toHaveText('Question 2 of 3');
  await host.getByRole('checkbox', { name: 'Search', exact: true }).check();
  await host.getByRole('button', { name: 'Skip', exact: true }).click();
  await expect(host.locator('[data-question-progress]')).toHaveText('Question 3 of 3');
  await expect(host.getByRole('button', { name: 'Next', exact: true })).toBeHidden();
  await expect(host.getByRole('button', { name: 'Skip', exact: true })).toBeHidden();
  await host.getByRole('textbox', { name: 'Name', exact: true }).fill('Atlas');
  await host.evaluate(host => host.addEventListener('oatbase:submit', event => { event.preventDefault(); window.answers = [...event.detail.data.entries()]; }));
  await host.getByRole('button', { name: 'Save answers' }).click();
  expect(await page.evaluate(() => window.answers)).toEqual([['project', 'app'], ['features', 'search'], ['details', ''], ['name', 'Atlas']]);
  await host.getByRole('button', { name: 'Reset', exact: true }).click();
  await expect(host.locator('[data-question-progress]')).toHaveText('Question 1 of 3');
  await expect(host.getByRole('radio', { name: 'Application', exact: true })).not.toBeChecked();
});

test('optional controls clean up and reconnect without duplicated generated content', async ({ page }) => {
  const before = await page.locator('ot-calendar table').count();
  await page.evaluate(() => { for (const name of ['ot-calendar', 'ot-carousel', 'ot-context-menu', 'ot-hover-card', 'ot-menubar', 'ot-questionnaire']) { const element = document.querySelector(name); const parent = element.parentNode; element.remove(); parent.append(element); } });
  await expect(page.locator('ot-calendar table')).toHaveCount(before);
  await expect(page.locator('ot-questionnaire [data-question]:not([hidden])')).toHaveCount(1);
});

test('new patterns fit narrow screens and pass axe in every palette and mode', async ({ page }) => {
  // Audit settled palette colors rather than Oat's theme-color transitions.
  await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' });
  test.setTimeout(150_000); await page.setViewportSize({ width: 390, height: 844 });
  for (const preset of ['oat', 'doordarshan', 'forest', 'ocean', 'paper']) {
    for (const mode of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: mode });
      await page.locator('html').evaluate((root, { preset, mode }) => { root.dataset.oatTheme = preset; root.dataset.theme = mode; root.style.colorScheme = mode; }, { preset, mode });
      expect(await page.locator('main').evaluate(main => main.scrollWidth <= main.clientWidth + 1), `${preset} ${mode} overflow`).toBe(true);
      const result = await new AxeBuilder({ page }).options({ iframes: false }).include('main').analyze();
      expect(result.violations, `${preset} ${mode}`).toEqual([]);
    }
  }
});

test('open informational and context popovers fit narrow viewports and have accessible content', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const tag of ['ot-context-menu', 'ot-hover-card']) {
    const host = page.locator(tag);
    await host.locator('[popovertarget]').click();
    await expect(host.locator('[popover]')).toBeVisible();
    expect(await host.locator('[popover]').evaluate(popup => { const r = popup.getBoundingClientRect(); return r.x >= 0 && r.y >= 0 && r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1; })).toBe(true);
    const results = await new AxeBuilder({ page }).options({ iframes: false }).include(tag).analyze();
    expect(results.violations).toEqual([]);
    await page.keyboard.press('Escape');
  }
});
