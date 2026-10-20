import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const gap = viewport => viewport.evaluate(element => element.scrollHeight - element.scrollTop - element.clientHeight);
const append = page => page.locator('[data-message-content]').evaluate(element => {
  const message = document.createElement('p');
  message.textContent = 'A newly appended reply. '.repeat(12);
  element.append(message);
});

test.beforeEach(async ({ page }) => {
  await page.goto('/tests/ai-elements.html');
  await expect(page.locator('ot-message-scroller')).toHaveAttribute('data-enhanced', '');
});

test('native disclosures, forms, and history work without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/tests/ai-elements.html');
  await expect(page.getByRole('region', { name: 'Conversation' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Jump to latest' })).toBeHidden();
  await page.getByText('Read config · failed', { exact: true }).click();
  await expect(page.getByText('Invalid configuration.')).toBeVisible();
  await page.getByRole('textbox', { name: 'Message' }).fill('A draft');
  expect(await page.locator('#prompt').evaluate(form => new FormData(form).get('prompt'))).toBe('A draft');
  await page.getByRole('button', { name: 'Clear' }).click();
  await expect(page.getByRole('textbox', { name: 'Message' })).toHaveValue('');
  await context.close();
});

test('scroller follows growth, pauses for a reader, and resumes without stealing focus', async ({ page }) => {
  const host = page.locator('ot-message-scroller');
  const viewport = host.locator('[data-message-viewport]');
  await expect.poll(() => gap(viewport)).toBeLessThanOrEqual(2);
  await append(page);
  await expect.poll(() => gap(viewport)).toBeLessThanOrEqual(2);
  await viewport.evaluate(element => { element.scrollTop = 0; });
  await expect.poll(() => host.evaluate(element => element.following)).toBe(false);
  const position = await viewport.evaluate(element => element.scrollTop);
  await append(page);
  await expect(viewport).toHaveJSProperty('scrollTop', position);
  const jump = page.getByRole('button', { name: 'Jump to latest' });
  await expect(jump).toBeVisible();
  // Programmatic action must not move the reader's focus into the conversation.
  await page.getByRole('textbox', { name: 'Message' }).focus();
  await host.evaluate(element => element.scrollToEnd());
  await expect(page.getByRole('textbox', { name: 'Message' })).toBeFocused();
  await expect.poll(() => gap(viewport)).toBeLessThanOrEqual(2);
  await expect(jump).toBeHidden();
});

test('keyboard reading pauses following and changes emit one event per transition', async ({ page }) => {
  const host = page.locator('ot-message-scroller');
  const viewport = host.locator('[data-message-viewport]');
  await host.evaluate(element => {
    window.followEvents = [];
    element.addEventListener('oatbase:follow', event => window.followEvents.push(event.detail));
  });
  await viewport.focus();
  await page.keyboard.press('Home');
  await expect(viewport).toHaveJSProperty('scrollTop', 0);
  await expect.poll(() => host.evaluate(element => element.following)).toBe(false);
  await append(page);
  await page.getByRole('button', { name: 'Jump to latest' }).click();
  await expect.poll(() => host.evaluate(element => element.following)).toBe(true);
  expect(await page.evaluate(() => window.followEvents)).toEqual([{ following: false }, { following: true }]);
});

test('resize and text-only stream changes follow the latest content', async ({ page }) => {
  const viewport = page.locator('[data-message-viewport]');
  await page.locator('[data-message-content]').evaluate(content => {
    window.streamText = document.createTextNode('Start');
    content.append(window.streamText);
  });
  await page.evaluate(() => { window.streamText.data += ' streamed content'.repeat(200); });
  await expect.poll(() => gap(viewport)).toBeLessThanOrEqual(2);
  await page.locator('[data-message-content]').evaluate(content => {
    const imagePlaceholder = document.createElement('div');
    imagePlaceholder.id = 'delayed-media';
    imagePlaceholder.style.height = '2rem';
    content.append(imagePlaceholder);
  });
  await expect.poll(() => gap(viewport)).toBeLessThanOrEqual(2);
  await page.locator('#delayed-media').evaluate(element => { element.style.height = '20rem'; });
  await expect.poll(() => gap(viewport)).toBeLessThanOrEqual(2);
});

test('disconnect cleans up observation and reconnect remains idempotent', async ({ page }) => {
  await page.locator('ot-message-scroller').evaluate(element => {
    window.detached = element;
    element.remove();
    element.content.append(document.createTextNode('Detached update'));
  });
  await page.evaluate(() => new Promise(requestAnimationFrame));
  expect(await page.evaluate(() => window.detached.hasAttribute('data-enhanced'))).toBe(false);
  await page.locator('main').evaluate(main => main.prepend(window.detached));
  await expect(page.locator('ot-message-scroller')).toHaveAttribute('data-enhanced', '');
  await expect.poll(() => gap(page.locator('[data-message-viewport]'))).toBeLessThanOrEqual(2);
});

test('trace supports keyboard disclosure and themes preserve readable primitives', async ({ page }) => {
  // Palette contrast must be measured after color transitions have settled.
  await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; }' });
  const summary = page.getByText('Read config · failed', { exact: true });
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Invalid configuration.')).toBeVisible();
  for (const preset of ['oat', 'doordarshan', 'forest', 'ocean', 'paper']) {
    for (const mode of ['light', 'dark']) {
      await page.emulateMedia({ colorScheme: mode });
      await page.locator('html').evaluate((element, { preset, mode }) => {
        element.dataset.oatTheme = preset;
        element.dataset.theme = mode;
        element.style.colorScheme = mode;
      }, { preset, mode });
      const results = await new AxeBuilder({ page }).options({ iframes: false }).include('main').analyze();
      expect(results.violations, `${preset} ${mode}`).toEqual([]);
    }
  }
});

test('all AI recipes render, have valid example scripts, and fit mobile', async ({ page }) => {
  test.setTimeout(150_000);
  await page.goto('/docs/index.html#/ai-elements');
  await expect(page.locator('[data-ai-grid] > a')).toHaveCount(21);
  const recipes = await page.evaluate(() => window.OATBASE_COMPONENTS.filter(component => component.source === 'AI recipe').map(component => ({ slug: component.slug, scripts: component.examples.map(example => example.javascript).filter(Boolean) })));
  await page.setViewportSize({ width: 390, height: 844 });
  for (const recipe of recipes) {
    for (const script of recipe.scripts) expect(() => new Function(script)).not.toThrow();
    await page.goto(`/docs/index.html#/components/${recipe.slug}`);
    const article = page.locator(`[data-page="/components/${recipe.slug}"]`);
    await expect(article).toBeVisible();
    expect(await article.evaluate(element => element.scrollWidth <= element.clientWidth + 1), recipe.slug).toBe(true);
    const results = await new AxeBuilder({ page }).options({ iframes: false }).include(`[data-page="/components/${recipe.slug}"]`).analyze();
    expect(results.violations, recipe.slug).toEqual([]);
  }
});

test('confirmation, prompt, and suggestion demos expose decisions without making requests', async ({ page }) => {
  await page.goto('/docs/index.html#/components/ai-confirmation');
  const approval = page.locator('[data-approval]');
  await approval.getByRole('button', { name: 'Deny', exact: true }).click();
  await expect(approval.getByRole('status')).toHaveText('Request denied.');
  await expect(approval.getByRole('button', { name: 'Approve', exact: true })).toBeDisabled();
  await page.goto('/docs/index.html#/components/ai-prompt-input');
  const form = page.locator('[data-prompt]');
  await form.getByRole('textbox', { name: 'Message', exact: true }).fill('Explain this');
  await form.getByRole('button', { name: 'Send message' }).click();
  await expect(form.getByRole('status')).toHaveText('Draft ready: Explain this. No request sent.');
  await expect(form.getByRole('textbox', { name: 'Message', exact: true })).toHaveValue('Explain this');
  await form.getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(form.getByRole('status')).toBeEmpty();
  await page.goto('/docs/index.html#/components/ai-suggestion');
  await page.locator('[data-suggestions]').getByRole('button', { name: 'Explain the build' }).click();
  await expect(page.locator('[data-suggestions] output')).toHaveText('Selected: Explain the build. No request sent.');
});


test('inline citation opens with the keyboard and Escape dismisses it', async ({ page }) => {
  await page.goto('/docs/index.html#/components/ai-inline-citation');
  const trigger = page.getByRole('button', { name: 'Source 1', exact: true });
  await trigger.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#ai-citation-source')).toBeVisible();
  await expect(page.locator('#ai-citation-source a')).toHaveAttribute('href', 'https://oat.ink/');
  await page.keyboard.press('Escape');
  await expect(page.locator('#ai-citation-source')).toBeHidden();
  await expect(trigger).toBeFocused();
});

test('focused scroller imports enhance late markup and tolerate duplicate registration', async ({ page }) => {
  await page.route('**/tests/focused-ai.html', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html lang="en"><title>Focused scroller</title><main><h1>Conversation</h1></main></html>' }));
  await page.goto('/tests/focused-ai.html');
  await page.addStyleTag({ url: '/node_modules/@knadh/oat/oat.min.css' });
  await page.addStyleTag({ url: '/dist/message-scroller.css' });
  await page.addScriptTag({ url: '/dist/message-scroller.js' });
  await page.addScriptTag({ url: '/dist/message-scroller.js' });
  await page.locator('main').evaluate(main => main.insertAdjacentHTML('beforeend', '<ot-message-scroller hidden><section data-message-viewport role="region" aria-label="History" tabindex="0"><div data-message-content><p>Initial reply</p></div></section><button data-message-jump type="button">Latest</button></ot-message-scroller>'));
  await expect(page.locator('ot-message-scroller')).toBeHidden();
  await page.locator('ot-message-scroller').evaluate(element => { element.hidden = false; });
  await expect(page.locator('ot-message-scroller')).toHaveAttribute('data-enhanced', '');
  await expect(page.locator('ot-message-scroller')).toBeVisible();
});
