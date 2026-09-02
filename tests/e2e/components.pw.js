import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe.configure({ mode: 'serial' });

test.beforeEach(async ({ page }) => {
  await page.goto('/tests/harness.html');
  await page.locator('ot-otp[data-enhanced]').waitFor();
});

test('retains useful native controls without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:43127/tests/harness.html');

  await expect(page.locator('#fixture-toggle button')).toBeVisible();
  await expect(page.locator('#fixture-toolbar button')).toHaveCount(4);
  await expect(page.locator('#fixture-choices input')).toHaveCount(3);
  await expect(page.locator('#fixture-otp-input')).toBeVisible();
  await expect(page.locator('#fixture-otp')).not.toHaveAttribute('data-enhanced', '');
  await expect(page.locator('#fixture-lightbox [data-lightbox-item]')).toHaveCount(2);
  await expect(page.locator('#fixture-scrollspy a')).toHaveCount(2);
  await expect(page.locator('#fixture-note')).toBeVisible();
  await expect(page.locator('#fixture-footnotes [data-footnote-ref]')).toHaveAttribute('href', '#fixture-note');
  await expect(page.locator('#fixture-reading progress')).toBeVisible();
  await expect(page.locator('#fixture-creatable select')).toBeVisible();
  await expect(page.locator('#fixture-repeater [data-repeater-item]')).toHaveCount(1);
  await expect(page.locator('#fixture-log [role="log"]')).toBeVisible();
  await expect(page.locator('#fixture-action-field [data-action-field-value]')).toBeVisible();
  await expect(page.locator('#fixture-action-field a')).toHaveAttribute('href', 'mailto:hello+projects-and-collaboration@example.com');
  await expect(page.locator('#fixture-action-field [data-copy-button]')).toBeHidden();
  await context.close();
});

test('action field preserves native actions, announces copying, and contains long values', async ({ page }) => {
  const field = page.locator('#fixture-action-field');
  await expect(field).toHaveAttribute('data-enhanced', '');
  await expect(field.getByRole('link', { name: 'Email me' })).toHaveAttribute('href', 'mailto:hello+projects-and-collaboration@example.com');
  await field.getByRole('button', { name: 'Copy' }).click();
  await expect(field.locator('[data-copy-status]')).toHaveText('Copied address');
  await expect(field.getByRole('button', { name: 'Copied address' })).toBeVisible();

  await page.setViewportSize({ width: 320, height: 640 });
  expect(await field.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  expect(await field.locator('[data-action-field-value]').evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
});

test('toggle synchronizes its native pressed state and emits one change', async ({ page }) => {
  await page.evaluate(() => {
    window.toggleChanges = [];
    document.querySelector('#fixture-toggle').addEventListener('oatbase:change', event => window.toggleChanges.push(event.detail));
  });
  const button = page.getByRole('button', { name: 'Pin sidebar' });
  await button.click();
  await expect(button).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#fixture-toggle')).toHaveAttribute('pressed', '');
  expect(await page.evaluate(() => window.toggleChanges)).toEqual([{ pressed: true }]);

  await page.locator('#fixture-toggle').evaluate(element => { element.pressed = false; });
  await expect(button).toHaveAttribute('aria-pressed', 'false');
});

test('toolbar exposes one Tab stop and supports wrapping arrow navigation', async ({ page }) => {
  const toolbar = page.getByRole('toolbar', { name: 'Text formatting' });
  const buttons = toolbar.getByRole('button');
  await expect(buttons).toHaveCount(4);
  expect(await buttons.evaluateAll(items => items.map(item => item.tabIndex))).toEqual([0, -1, -1, -1]);

  await buttons.nth(0).focus();
  await page.keyboard.press('ArrowRight');
  await expect(buttons.nth(1)).toBeFocused();
  await page.keyboard.press('End');
  await expect(buttons.nth(3)).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(buttons.nth(0)).toBeFocused();
  await page.keyboard.press('ArrowLeft');
  await expect(buttons.nth(3)).toBeFocused();
});

test('data table enhances native rows with sorting, filtering, and visible selection', async ({ page }) => {
  const table = page.locator('#fixture-data-table');
  await table.locator('th[data-sort="text"] [data-table-sort]').click();
  await expect(table.locator('tbody tr').first()).toContainText('Atlas');

  await table.locator('[data-table-filter]').fill('beacon');
  await expect(table.locator('tbody tr:visible')).toHaveCount(1);
  await expect(table.locator('[data-table-status]')).toHaveText('1 of 2 rows');

  await table.locator('[data-table-select-all]').check();
  await expect(table.locator('[data-table-selected]')).toHaveText('1 selected');
  await expect(table.locator('tbody tr:visible [data-table-select-row]')).toBeChecked();

  await table.locator('[data-table-filter]').fill('missing');
  await expect(table.locator('[data-table-empty]')).toBeVisible();
});

test('creatable combobox appends a real native option and submits its value', async ({ page }) => {
  const combo = page.locator('#fixture-creatable');
  const input = combo.getByRole('combobox');
  await input.fill('Canary');
  await expect(combo.locator('[data-create]')).toBeVisible();
  await page.keyboard.press('Enter');
  await expect(combo.locator('select')).toHaveValue('Canary');
  await expect(combo.locator('select option[data-custom]')).toHaveText('Canary');
});

test('command keeps application-supplied results keyboard and accessibility state current', async ({ page }) => {
  const command = page.locator('#fixture-command');
  await command.getByRole('button', { name: 'Search projects' }).click();
  const input = command.getByRole('combobox', { name: 'Search projects' });
  await input.fill('remote');

  await expect(command.getByRole('option')).toHaveCount(2);
  const first = command.getByRole('option').first();
  await expect(first).toHaveAttribute('aria-selected', 'true');
  await expect(input).toHaveAttribute('aria-activedescendant', await first.getAttribute('id'));

  await page.keyboard.press('ArrowDown');
  const second = command.getByRole('option').nth(1);
  await expect(second).toHaveAttribute('aria-selected', 'true');
  await expect(input).toHaveAttribute('aria-activedescendant', await second.getAttribute('id'));

  await input.fill('missing');
  await expect(command.getByText('No projects found.')).toBeVisible();
  await expect(input).not.toHaveAttribute('aria-activedescendant');
  await expect(command.getByRole('option')).toHaveCount(0);
});

test('repeater clones native fields, enforces limits, removes, and resets', async ({ page }) => {
  const repeater = page.locator('#fixture-repeater');
  const add = repeater.getByRole('button', { name: 'Add variable' });
  await add.click();
  await expect(repeater.locator('[data-repeater-item]')).toHaveCount(2);
  await expect(repeater.locator('input[name="variables[1][key]"]')).toBeFocused();
  await add.click();
  await expect(add).toBeDisabled();
  await repeater.locator('[data-repeater-item]').last().getByRole('button', { name: 'Remove' }).click();
  await expect(repeater.locator('[data-repeater-item]')).toHaveCount(2);
  await page.getByRole('button', { name: 'Reset variables' }).click();
  await expect(repeater.locator('[data-repeater-item]')).toHaveCount(1);
  await expect(repeater.locator('input[name="variables[0][key]"]')).toHaveValue('REGION');
});

test('log viewer counts mutations and user scrolling disables follow mode', async ({ page }) => {
  const viewer = page.locator('#fixture-log');
  await expect(viewer.locator('[data-log-status]')).toHaveText('2 lines');
  await viewer.evaluate(element => element.append('\nComplete'));
  await expect(viewer.locator('[data-log-status]')).toHaveText('3 lines');
  await viewer.evaluate(element => element.append('\nOne\nTwo\nThree\nFour\nFive\nSix\nSeven\nEight'));
  await expect(viewer.locator('[data-log-status]')).toHaveText('11 lines');
  await viewer.locator('[role="log"]').evaluate(element => {
    element.style.minBlockSize = '1rem';
    element.style.blockSize = '1rem';
    element.scrollTop = 0;
    element.dispatchEvent(new Event('scroll'));
  });
  await expect(viewer.locator('[data-log-follow]')).not.toBeChecked();
});

test('choice cards preserve native radio, disabled, reset, and submission behavior', async ({ page }) => {
  const team = page.getByRole('radio', { name: /Team/ });
  const business = page.getByRole('radio', { name: /Business/ });
  await expect(business).toBeDisabled();
  await team.check();
  await expect(team).toBeChecked();
  expect(await page.locator('#fixture-form').evaluate(form => Object.fromEntries(new FormData(form)))).toMatchObject({ plan: 'team', code: '12' });

  await page.getByRole('button', { name: 'Reset form' }).click();
  await expect(page.getByRole('radio', { name: /Starter/ })).toBeChecked();
});

test('OTP uses one native input for filtering, completion, forms, and reset', async ({ page }) => {
  await page.evaluate(() => {
    window.completedCodes = [];
    document.querySelector('#fixture-otp').addEventListener('oatbase:complete', event => window.completedCodes.push(event.detail.value));
  });
  const input = page.getByRole('textbox', { name: 'Verification code' });
  await input.fill('12a34');
  await expect(input).toHaveValue('1234');
  await input.fill('123456');
  await expect(page.locator('#fixture-otp')).toHaveAttribute('data-complete', '');
  await expect(page.locator('[data-otp-slots] > span')).toHaveText(['1', '2', '3', '4', '5', '6']);
  expect(await page.evaluate(() => window.completedCodes)).toEqual(['123456']);

  await page.getByRole('button', { name: 'Submit form' }).click();
  await expect(page.locator('#form-output')).toContainText('"code":"123456"');
  await page.getByRole('button', { name: 'Reset form' }).click();
  await expect(input).toHaveValue('12');
  await expect(page.locator('[data-otp-slots] > span').nth(0)).toHaveText('1');
  await expect(page.locator('[data-otp-slots] > span').nth(2)).toHaveText('\u00a0');
});

test('lightbox composes native links, dialog, toolbar controls, and focus restoration', async ({ page }) => {
  const lightbox = page.locator('#fixture-lightbox');
  const items = lightbox.locator('[data-lightbox-item]');
  await items.first().click();
  await expect(lightbox.locator('dialog')).toBeVisible();
  await expect(lightbox.locator('[data-lightbox-image]')).toHaveAttribute('alt', 'Saffron sunset');
  await expect(lightbox.locator('[data-lightbox-status]')).toHaveText('1 of 2');
  await page.keyboard.press('ArrowRight');
  await expect(lightbox.locator('[data-lightbox-image]')).toHaveAttribute('alt', 'Quiet hills');
  await lightbox.getByRole('button', { name: 'Close' }).click();
  await expect(lightbox.locator('dialog')).not.toBeVisible();
  await expect(items.first()).toBeFocused();
});

test('lightbox selector enhances generated images and discovers dynamic content', async ({ page }) => {
  const lightbox = page.locator('#fixture-lightbox-selector');
  const images = lightbox.locator('[data-generated-gallery] img');
  await expect(images).toHaveCount(2);
  await expect(images.first()).toHaveAttribute('role', 'button');
  await expect(images.first()).toHaveAttribute('tabindex', '0');
  await images.first().focus();
  await page.keyboard.press('Enter');
  await expect(lightbox.locator('dialog')).toBeVisible();
  await expect(lightbox.locator('[data-lightbox-image]')).toHaveAttribute('alt', 'Generated saffron sunset');
  await expect(lightbox.locator('[data-lightbox-caption]')).toHaveText('Generated sunset');
  await lightbox.getByRole('button', { name: 'Close generated viewer' }).click();
  await expect(images.first()).toBeFocused();

  await lightbox.locator('[data-generated-gallery]').evaluate(gallery => {
    const image = document.createElement('img');
    image.src = '../docs/assets/lightbox-sample-a.svg';
    image.alt = 'Dynamically inserted image';
    gallery.append(image);
  });
  await expect(images).toHaveCount(3);
  await lightbox.evaluate(element => element.refresh());
  await expect(images.last()).toHaveAttribute('role', 'button');
  await images.last().focus();
  await page.keyboard.press(' ');
  await expect(lightbox.locator('[data-lightbox-image]')).toHaveAttribute('alt', 'Dynamically inserted image');
});

test('scrollspy and reading progress follow a supplied scroll container', async ({ page }) => {
  await expect(page.locator('#fixture-scrollspy a').first()).toHaveAttribute('aria-current', 'location');
  await page.locator('#fixture-scroll-root').evaluate(element => {
    element.scrollTop = element.scrollHeight;
    element.dispatchEvent(new Event('scroll'));
  });
  await expect(page.locator('#fixture-scrollspy a').last()).toHaveAttribute('aria-current', 'location');

  await page.locator('#fixture-reading-root').evaluate(element => {
    element.scrollTop = element.scrollHeight;
    element.dispatchEvent(new Event('scroll'));
  });
  await expect.poll(() => page.locator('#fixture-reading progress').evaluate(element => element.value)).toBeGreaterThan(95);
});

test('footnotes compose Oat popovers while preserving their original definitions', async ({ page }) => {
  const footnotes = page.locator('#fixture-footnotes');
  await footnotes.evaluate(element => {
    window.footnoteLifecycle = [];
    element.addEventListener('oatbase:render', event => {
      window.footnoteLifecycle.push({
        type: 'render',
        enhanced: event.detail.enhanced,
        entries: event.detail.entries.map(entry => ({
          reference: entry.reference.getAttribute('href'),
          definition: entry.definition.id,
          popover: entry.popover?.dataset.footnoteFor
        }))
      });
    });
    element.addEventListener('oatbase:toggle', event => {
      window.footnoteLifecycle.push({ type: 'toggle', state: event.detail.state, definition: event.detail.definition.id });
    });
    element.refresh();
  });
  await expect.poll(() => page.evaluate(() => window.footnoteLifecycle[0])).toEqual({
    type: 'render',
    enhanced: true,
    entries: [{ reference: '#fixture-note', definition: 'fixture-note', popover: 'fixture-note' }]
  });
  await expect(footnotes.locator('[data-footnote-popover]')).toHaveAttribute('data-footnote-for', 'fixture-note');
  await footnotes.locator('[data-footnote-ref]').click();
  await expect(footnotes.locator('[data-footnote-popover]')).toBeVisible();
  await expect(footnotes.locator('[data-footnote-popover]')).toContainText('original definition remains available');
  await expect.poll(() => page.evaluate(() => window.footnoteLifecycle.some(event => event.type === 'toggle' && event.state === 'open'))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(footnotes.locator('[data-footnote-popover]')).not.toBeVisible();
  await expect(page.locator('#fixture-note')).toBeVisible();

  await footnotes.evaluate(element => {
    element.querySelector('#fixture-note p').textContent = 'The refreshed source definition.';
    const paragraph = document.createElement('p');
    paragraph.innerHTML = 'A later note<sup><a href="#fixture-note-two" data-footnote-ref>2</a></sup>.';
    const definition = document.createElement('li');
    definition.id = 'fixture-note-two';
    definition.dataset.footnote = '';
    definition.innerHTML = '<p>A dynamically inserted definition.</p>';
    element.prepend(paragraph);
    element.querySelector('ol').append(definition);
    element.refresh();
  });
  await expect(footnotes.locator('[data-footnote-popover]')).toHaveCount(2);
  await expect(footnotes.locator('[data-footnote-for="fixture-note"]')).toContainText('The refreshed source definition.');
  await expect.poll(() => footnotes.evaluate(element => element.entries.length)).toBe(2);
});

test('exposes a stable accessible tree', async ({ page }) => {
  await expect(page.locator('#fixture-toggle')).toMatchAriaSnapshot(`
    - button "Pin sidebar"
  `);
  await expect(page.locator('#fixture-toolbar')).toMatchAriaSnapshot(`
    - toolbar "Text formatting":
      - button "B Bold"
      - button "I Italic"
      - separator
      - button "Undo"
      - button "Redo"
  `);
  await expect(page.locator('#otp-field')).toMatchAriaSnapshot(`
    - text: Verification code
    - textbox "Verification code": "12"
    - text: Enter the six-digit code sent to your device.
  `);
});

test('has no automatically detectable accessibility violations in default and active states', async ({ page, browserName }) => {
  for (const theme of ['light', 'dark']) {
    await page.emulateMedia({ colorScheme: theme });
    await page.evaluate(value => {
      document.documentElement.dataset.theme = value;
      document.documentElement.style.colorScheme = value;
    }, theme);
    const axe = new AxeBuilder({ page });
    // Axe/WebKit currently resolves Oat's light-dark() foreground and background
    // tokens from different schemes. The computed-token test below covers WCAG
    // contrast in WebKit while this scan continues to exercise every other rule.
    if (browserName === 'webkit') axe.disableRules(['color-contrast']);
    const themedResults = await axe.analyze();
    expect(themedResults.violations).toEqual([]);
  }

  await page.getByRole('button', { name: 'Pin sidebar' }).click();
  await page.getByRole('radio', { name: /Team/ }).check();
  await page.getByRole('textbox', { name: 'Verification code' }).fill('123456');
  const activeAxe = new AxeBuilder({ page });
  if (browserName === 'webkit') activeAxe.disableRules(['color-contrast']);
  const results = await activeAxe.analyze();
  expect(results.violations).toEqual([]);
});

test('inherits scoped Oat tokens and accepts component geometry hooks', async ({ page }) => {
  await page.evaluate(() => {
    const scope = document.createElement('section');
    scope.id = 'theme-scope';
    scope.style.setProperty('--foreground', 'rgb(16 96 64)');
    scope.style.setProperty('--oatbase-otp-cell-size', '2.5rem');
    scope.innerHTML = '<ot-otp data-length="4"><input aria-label="Scoped code" value="12" maxlength="4"></ot-otp>';
    document.body.append(scope);
  });
  await page.locator('#theme-scope ot-otp[data-enhanced]').waitFor();
  const firstCell = page.locator('#theme-scope [data-otp-slots] > span').first();
  expect(await firstCell.evaluate(element => getComputedStyle(element).color)).toBe('rgb(16, 96, 64)');
  expect(await firstCell.evaluate(element => getComputedStyle(element).blockSize)).toBe('40px');
});

test('shipped themes remap Oat tokens without changing component behavior', async ({ page }) => {
  test.setTimeout(60_000);
  const backgrounds = new Set();
  for (const preset of ['doordarshan', 'forest', 'ocean', 'paper']) {
    for (const mode of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: mode });
      await page.evaluate(({ preset, mode }) => {
        document.documentElement.dataset.theme = mode;
        document.documentElement.style.colorScheme = mode;
        document.documentElement.dataset.oatTheme = preset;
      }, { preset, mode });
      backgrounds.add(await page.locator('body').evaluate(element => getComputedStyle(element).backgroundColor));
      const results = await new AxeBuilder({ page }).analyze();
      expect(results.violations).toEqual([]);
    }
  }
  expect(backgrounds.size).toBeGreaterThanOrEqual(5);
});

test('every palette keeps control, faint text, and focus tokens above WCAG contrast thresholds', async ({ page }) => {
  test.setTimeout(60_000);
  const palettes = ['', 'doordarshan', 'forest', 'ocean', 'paper'];
  for (const preset of palettes) {
    for (const mode of ['light', 'dark']) {
      const ratios = await page.evaluate(({ preset, mode }) => {
        const root = document.documentElement;
        root.dataset.theme = mode;
        root.style.colorScheme = mode;
        if (preset) root.dataset.oatTheme = preset;
        else root.removeAttribute('data-oat-theme');

        const probe = document.createElement('span');
        probe.hidden = true;
        document.body.append(probe);
        const resolve = token => {
          probe.style.color = `var(${token})`;
          return getComputedStyle(probe).color;
        };
        const channels = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
        const luminance = value => {
          const rgb = channels(value).map(channel => channel / 255).map(channel =>
            channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
          );
          return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
        };
        const ratio = (foreground, background) => {
          const a = luminance(resolve(foreground));
          const b = luminance(resolve(background));
          return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        };
        const result = {
          inputOnPage: ratio('--input', '--background'),
          inputOnCard: ratio('--input', '--card'),
          faintOnPage: ratio('--faint-foreground', '--background'),
          faintOnCard: ratio('--faint-foreground', '--card'),
          focusOnPage: ratio('--ring', '--background'),
          focusOnCard: ratio('--ring', '--card'),
          primaryText: ratio('--primary-foreground', '--primary'),
          secondaryText: ratio('--secondary-foreground', '--secondary'),
          dangerText: ratio('--danger-foreground', '--danger'),
          successText: ratio('--success-foreground', '--success'),
          warningText: ratio('--warning-foreground', '--warning')
        };
        probe.remove();
        return result;
      }, { preset, mode });

      expect(ratios.inputOnPage, `${preset || 'oat'} ${mode} input/page`).toBeGreaterThanOrEqual(3);
      expect(ratios.inputOnCard, `${preset || 'oat'} ${mode} input/card`).toBeGreaterThanOrEqual(3);
      expect(ratios.faintOnPage, `${preset || 'oat'} ${mode} faint/page`).toBeGreaterThanOrEqual(4.5);
      expect(ratios.faintOnCard, `${preset || 'oat'} ${mode} faint/card`).toBeGreaterThanOrEqual(4.5);
      expect(ratios.focusOnPage, `${preset || 'oat'} ${mode} focus/page`).toBeGreaterThanOrEqual(3);
      expect(ratios.focusOnCard, `${preset || 'oat'} ${mode} focus/card`).toBeGreaterThanOrEqual(3);
      expect(ratios.primaryText, `${preset || 'oat'} ${mode} primary text`).toBeGreaterThanOrEqual(4.5);
      expect(ratios.secondaryText, `${preset || 'oat'} ${mode} secondary text`).toBeGreaterThanOrEqual(4.5);
      expect(ratios.dangerText, `${preset || 'oat'} ${mode} danger text`).toBeGreaterThanOrEqual(4.5);
      expect(ratios.successText, `${preset || 'oat'} ${mode} success text`).toBeGreaterThanOrEqual(4.5);
      expect(ratios.warningText, `${preset || 'oat'} ${mode} warning text`).toBeGreaterThanOrEqual(4.5);
    }
  }
});

test('tooltip content is hoverable, viewport-safe, and dismissible with Escape', async ({ page }) => {
  const tooltip = page.locator('#fixture-tooltip');
  await tooltip.focus();
  await expect(tooltip).toHaveAttribute('data-tooltip', 'Helpful tooltip content');
  await page.keyboard.press('Escape');
  await expect(tooltip).toHaveAttribute('data-tooltip-dismissed', '');
  await tooltip.blur();
  await expect(tooltip).not.toHaveAttribute('data-tooltip-dismissed', '');

  await page.setViewportSize({ width: 320, height: 640 });
  await tooltip.focus();
  const pseudo = await tooltip.evaluate(element => {
    const style = getComputedStyle(element, '::after');
    return { maxWidth: style.maxWidth, pointerEvents: style.pointerEvents };
  });
  expect(parseFloat(pseudo.maxWidth)).toBeLessThanOrEqual(288);
  expect(pseudo.pointerEvents).toBe('auto');
});

test('theme switcher exposes explicit selectors and clears them for system mode', async ({ page }) => {
  await page.evaluate(() => {
    const switcher = document.createElement('ot-theme-switcher');
    switcher.dataset.storageKey = 'oatbase-e2e-theme';
    switcher.innerHTML = '<button type="button" data-theme-value="system">System</button><button type="button" data-theme-value="dark">Dark</button>';
    document.body.append(switcher);
  });
  await page.getByRole('button', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await page.locator('html').evaluate(element => element.style.colorScheme)).toBe('dark');
  await page.getByRole('button', { name: 'System' }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme');
  expect(await page.locator('html').evaluate(element => element.style.colorScheme)).toBe('light dark');
});

test('theme switcher can scope appearance without changing the document', async ({ page }) => {
  const originalMode = await page.locator('html').evaluate(element => element.style.colorScheme);
  await page.evaluate(() => {
    const target = document.createElement('section');
    target.id = 'scoped-theme-target';
    const switcher = document.createElement('ot-theme-switcher');
    switcher.dataset.storageKey = 'oatbase-e2e-scoped-theme';
    switcher.dataset.target = '#scoped-theme-target';
    switcher.innerHTML = '<button type="button" data-theme-value="light">Light</button><button type="button" data-theme-value="dark">Dark</button>';
    target.append(switcher);
    document.body.append(target);
  });
  await page.locator('#scoped-theme-target').getByRole('button', { name: 'Dark' }).click();
  await expect(page.locator('#scoped-theme-target')).toHaveAttribute('data-theme', 'dark');
  expect(await page.locator('#scoped-theme-target').evaluate(element => element.style.colorScheme)).toBe('dark');
  expect(await page.locator('html').evaluate(element => element.style.colorScheme)).toBe(originalMode);
});

test('drawer motion is removed when reduced motion is requested', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.evaluate(() => {
    const drawer = document.createElement('dialog');
    drawer.dataset.variant = 'drawer';
    drawer.dataset.side = 'right';
    drawer.innerHTML = '<section><p>Reduced motion drawer</p></section>';
    document.body.append(drawer);
    drawer.showModal();
  });
  expect(await page.locator('dialog[data-variant="drawer"]').evaluate(element => getComputedStyle(element).animationName)).toBe('none');
});

for (const theme of ['light', 'dark']) {
  test(`matches the ${theme} component visual baseline`, async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Visual baselines are intentionally captured once in Chromium.');
    await page.evaluate(value => {
      document.documentElement.dataset.theme = value;
      document.documentElement.style.colorScheme = value;
    }, theme);
    await expect(page.locator('#fixture')).toHaveScreenshot(`components-${theme}.png`, { animations: 'disabled' });
  });
}

test('matches the forced-colors component visual baseline', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Visual baselines are intentionally captured once in Chromium.');
  await page.emulateMedia({ forcedColors: 'active' });
  await expect(page.locator('#fixture')).toHaveScreenshot('components-forced-colors.png', { animations: 'disabled' });
});
