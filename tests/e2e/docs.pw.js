import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.beforeEach(async ({ page }) => {
  await page.goto('/docs/index.html#/components');
  await expect(page.locator('[data-component-catalog] > .item')).toHaveCount(35);
});

test('component catalog dogfoods Oat and Oatbase primitives through filtering', async ({ page }) => {
  const toolbar = page.locator('.docs-catalog-toolbar');
  const catalog = page.locator('[data-component-catalog]');
  const empty = page.locator('[data-catalog-empty]');

  await expect(toolbar.locator('[data-segmented]')).toBeVisible();
  await expect(toolbar.locator('fieldset.group')).toBeVisible();
  await expect(toolbar.locator('.badge')).toHaveText('35 additions');
  await expect(catalog).toHaveClass(/\brow\b/);
  await expect(catalog.locator('> .item.col-6').first()).toBeVisible();
  await expect(empty).toHaveAttribute('data-variant', 'empty');
  await expect(empty).toBeHidden();

  await page.locator('[data-catalog-search]').fill('lightbox');
  await expect(catalog.locator('> .item')).toHaveCount(1);
  await expect(toolbar.locator('.badge')).toHaveText('1 of 35 additions');
  await expect(empty).toBeHidden();

  await page.locator('[data-catalog-search]').fill('no-component-matches-this');
  await expect(catalog.locator('> .item')).toHaveCount(0);
  await expect(empty).toBeVisible();
});

test('persisted palette restores the enhanced select label', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('oatbase-preset', 'doordarshan'));
  await page.reload();

  await expect(page.locator('html')).toHaveAttribute('data-oat-theme', 'doordarshan');
  await expect(page.locator('[data-theme-preset]')).toHaveValue('doordarshan');
  await expect(page.locator('.docs-palette-switcher > button')).toHaveText('Doordarshan');
});

test('scoped Oat preview does not inherit the page preset', async ({ page }) => {
  await page.evaluate(() => {
    const select = document.querySelector('[data-theme-preset]');
    select.value = 'doordarshan';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('html')).toHaveAttribute('data-oat-theme', 'doordarshan');

  const surface = page.locator('.docs-theme-surface');
  await expect(surface).toHaveAttribute('data-oat-theme', 'oat');
  const colors = await page.locator('html, .docs-theme-surface').evaluateAll(elements =>
    elements.map(element => getComputedStyle(element).getPropertyValue('--primary').trim())
  );
  expect(colors[1]).not.toBe(colors[0]);
});

test('persisted appearance wins over independently stored theme demos on reload', async ({ page }) => {
  await page.evaluate(() => {
    localStorage.setItem('oatbase-theme', 'light');
    localStorage.setItem('oatbase-demo-theme', 'dark');
    localStorage.setItem('oatbase-toggle-theme', 'dark');
  });
  await page.reload();

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await page.locator('html').evaluate(element => element.style.colorScheme)).toBe('light');
  await expect(page.locator('.docs-theme-button')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('.docs-theme-button [data-theme-content="light"]')).toBeVisible();
  await expect(page.locator('#theme-explicit-preview')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('#theme-toggle-preview')).toHaveAttribute('data-theme', 'dark');
});

test('behavioral component demos expose complete HTML and JavaScript', async ({ page }) => {
  await page.goto('/docs/index.html#/components/repeater');
  const component = page.locator('[data-page="/components/repeater"]');
  const demo = component.locator('[data-demo]').first();

  await expect(demo.locator('[role="tab"]')).toHaveText(['Preview', 'HTML', 'JavaScript']);
  await demo.locator('[data-view="javascript"]').click();
  await expect(demo.locator('[role="tabpanel"][data-code-kind="html"]')).toBeHidden();
  await expect(demo.locator('[role="tabpanel"][data-code-kind="javascript"]')).toBeVisible();
  await expect(demo.locator('[role="tabpanel"][data-code-kind="javascript"]')).toContainText("import '@oddship/oatbase/repeater';");
  await expect(demo.locator('[role="tabpanel"][data-code-kind="javascript"]')).toHaveAttribute('data-copy-source', '');

  await demo.locator('[data-view="code"]').click();
  await expect(demo.locator('[role="tabpanel"][data-code-kind="html"]')).toBeVisible();
  await expect(demo.locator('[role="tabpanel"][data-code-kind="html"]')).toContainText('variables[__index__][key]');
  await expect(demo.locator('[role="tabpanel"][data-code-kind="html"]')).toHaveAttribute('data-copy-source', '');
});

test('log viewer documentation wires its live action through the component API', async ({ page }) => {
  await page.goto('/docs/index.html#/components/log-viewer');
  const demo = page.locator('[data-page="/components/log-viewer"] [data-demo]').first();
  const viewer = demo.locator('ot-log-viewer');

  await expect(viewer.locator('[data-log-status]')).toHaveText('3 lines');
  await demo.getByRole('button', { name: 'Append line' }).click();
  await expect(viewer.locator('[data-log-line]')).toHaveCount(4);
  await expect(viewer.locator('[data-log-line]').last()).toHaveText('10:42:05  Worker ready');
  await expect(viewer.locator('[data-log-status]')).toHaveText('4 lines');

  await demo.locator('[data-view="javascript"]').click();
  await expect(demo.locator('[role="tabpanel"][data-code-kind="javascript"]')).toContainText("viewer.append('10:42:05  Worker ready')");
});

test('chart keeps its axis labels clear of the semantic legend', async ({ page }) => {
  await page.goto('/docs/index.html#/components/chart');
  const chart = page.locator('[data-page="/components/chart"] [data-variant="chart"]');
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const geometry = await chart.evaluate(figure => {
      const bars = figure.querySelector('[data-chart-bars]');
      const bar = bars.querySelector('[data-chart-bar]');
      const legend = figure.querySelector('[data-chart-legend]');
      const barBox = bar.getBoundingClientRect();
      const labelStyle = getComputedStyle(bar, '::after');
      const labelTop = barBox.top + Number.parseFloat(labelStyle.top);
      const labelBottom = labelTop + Number.parseFloat(labelStyle.lineHeight);
      return {
        labelBottom,
        legendTop: legend.getBoundingClientRect().top,
        itemMargins: [...legend.children].map(item => getComputedStyle(item).marginBlockEnd)
      };
    });

    expect(geometry.legendTop, `${width}px legend clearance`).toBeGreaterThanOrEqual(geometry.labelBottom);
    expect(geometry.itemMargins, `${width}px legend margins`).toEqual(['0px', '0px']);
  }
});

test('full examples render complete isolated pages and expose their source', async ({ page }) => {
  await page.goto('/docs/index.html#/examples');
  const examples = page.locator('[data-full-example]');
  await expect(examples).toHaveCount(6);
  for (const frame of await examples.locator('iframe').all()) {
    await expect(frame).toHaveAttribute('sandbox', 'allow-scripts allow-forms allow-modals');
    await expect(frame).toHaveAttribute('referrerpolicy', 'no-referrer');
  }

  const dashboard = page.frameLocator('[data-full-example="project-dashboard"] iframe');
  await expect(dashboard.locator('[data-sidebar-layout]')).toBeVisible();
  await expect(dashboard.locator('[data-stats]')).toBeVisible();
  await expect(dashboard.locator('[data-chart-bars]')).toBeVisible();

  const settings = page.frameLocator('[data-full-example="account-settings"] iframe');
  await expect(settings.getByRole('button', { name: 'Save changes' })).toBeVisible();
  await expect(settings.locator('ot-password')).toBeVisible();

  const article = page.frameLocator('[data-full-example="long-form-article"] iframe');
  await expect(article.locator('ot-reading-progress')).toBeVisible();
  await expect(article.locator('ot-lightbox')).toBeVisible();
  await expect(article.locator('ot-footnotes').locator('xpath=..')).toHaveClass(/col-9/);
  expect(await article.locator('#article').evaluate(element => element.getBoundingClientRect().width)).toBeGreaterThan(480);
  expect(await article.locator('html').evaluate(() => {
    try {
      return Boolean(window.parent.document.querySelector('.docs-header'));
    } catch {
      return false;
    }
  })).toBe(false);

  const workflow = page.frameLocator('[data-full-example="workflow-execution"] iframe');
  await expect(workflow.locator('ot-log-viewer[data-enhanced]')).toBeVisible();
  await expect(workflow.locator('[data-stepper][data-variant="status"]')).toBeVisible();
  await expect(workflow.locator('ot-splitter')).toBeVisible();
  await expect(workflow.getByRole('separator')).toHaveAttribute('aria-valuenow', '34');
  expect(await article.locator('html').evaluate(() => {
    try {
      localStorage.getItem('oatbase-theme');
      return true;
    } catch {
      return false;
    }
  })).toBe(false);

  const first = examples.first();
  await first.locator('[data-view="code"]').click();
  await expect(first.locator('.demo-frame')).toBeHidden();
  await expect(first.locator('[data-code]')).toBeVisible();
  await expect(first.locator('[data-code]')).toContainText('<!doctype html>');
});

test('catalog layout remains stable in the widest shipped typography theme', async ({ page }) => {
  await page.locator('[data-theme-preset]').evaluate(select => {
    select.value = 'doordarshan';
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('html')).toHaveAttribute('data-oat-theme', 'doordarshan');

  const descriptionContrast = await page.locator('[data-component-catalog] > .item p').first().evaluate(element => {
    const parse = value => value.match(/[\d.]+/g).slice(0, 3).map(Number);
    const luminance = color => {
      const channels = parse(color).map(channel => channel / 255).map(channel =>
        channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
      );
      return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
    };
    const foreground = luminance(getComputedStyle(element).color);
    const background = luminance(getComputedStyle(element.closest('.item')).backgroundColor);
    return (Math.max(foreground, background) + 0.05) / (Math.min(foreground, background) + 0.05);
  });
  expect(descriptionContrast).toBeGreaterThanOrEqual(4.5);
  expect(descriptionContrast).toBeLessThan(6);

  const toolbar = page.locator('.docs-catalog-toolbar');
  const controls = await toolbar.locator(':scope > *').evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect();
    return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
  }));

  for (let index = 0; index < controls.length; index += 1) {
    for (let other = index + 1; other < controls.length; other += 1) {
      const a = controls[index];
      const b = controls[other];
      const overlapX = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      const overlapY = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      expect(overlapX <= 0 || overlapY <= 0).toBe(true);
    }
  }

  await page.setViewportSize({ width: 390, height: 844 });
  const pageWidth = await page.locator('.docs-main').evaluate(element => element.getBoundingClientRect().width);
  const firstItemWidth = await page.locator('[data-component-catalog] > .item').first().evaluate(element => element.getBoundingClientRect().width);
  expect(firstItemWidth).toBeGreaterThan(pageWidth * 0.85);
});

test('generated demos and highlighted code pass axe in every palette and mode', async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto('/docs/index.html#/components/select');
  const componentPage = page.locator('[data-page="/components/select"]');
  await componentPage.locator('[data-view="code"]').click();
  const htmlCode = componentPage.locator('[data-code][data-code-kind="html"]');
  await expect(htmlCode).toBeVisible();
  await htmlCode.locator('code').evaluate(code => {
    const comment = document.createElement('span');
    comment.className = 'syntax-comment';
    comment.textContent = '<!-- syntax contrast fixture -->';
    code.append(document.createTextNode('\n'), comment);
  });
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });

  for (const preset of ['', 'doordarshan', 'forest', 'ocean', 'paper']) {
    for (const mode of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: mode });
      await page.evaluate(({ preset, mode }) => {
        const root = document.documentElement;
        root.dataset.theme = mode;
        root.style.colorScheme = mode;
        if (preset) root.dataset.oatTheme = preset;
        else root.removeAttribute('data-oat-theme');
      }, { preset, mode });
      const results = await new AxeBuilder({ page }).include('[data-page="/components/select"]').analyze();
      expect(results.violations, `${preset || 'oat'} ${mode}`).toEqual([]);
    }
  }
});
