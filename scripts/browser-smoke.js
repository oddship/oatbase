import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import { chromium } from '@playwright/test';

const root = resolve(import.meta.dir, '..');
const fixture = process.argv[2] || 'tests/browser.html';
const buildDirectory = process.argv[3];

if (buildDirectory && !/^[a-zA-Z0-9._-]+$/.test(buildDirectory)) {
  throw new Error(`Invalid build directory: ${buildDirectory}`);
}

const playwrightBrowser = chromium.executablePath();
const browserExecutable = existsSync(playwrightBrowser)
  ? playwrightBrowser
  : Bun.which('chromium') || Bun.which('google-chrome');
if (!browserExecutable) {
  throw new Error('Chromium or Google Chrome is required for browser smoke tests.');
}

const profile = await mkdtemp(join(tmpdir(), 'oatbase-chrome-'));
const fixtureUrl = pathToFileURL(resolve(root, fixture));
if (buildDirectory) fixtureUrl.searchParams.set('build', buildDirectory);

const browser = await chromium.launch({
  executablePath: browserExecutable,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--allow-file-access-from-files'],
  tracesDir: profile
});

try {
  const page = await browser.newPage();
  await page.goto(fixtureUrl.href, { waitUntil: 'load', timeout: 30_000 });
  await page.waitForFunction(() => ['pass', 'fail'].includes(document.body.dataset.test), null, { timeout: 30_000 });
  const state = await page.locator('body').getAttribute('data-test');
  if (state !== 'pass') {
    const detail = await page.locator('#test-error').textContent().catch(() => 'Unknown browser failure');
    throw new Error(`Browser smoke test failed:\n${detail}`);
  }
} finally {
  await browser.close();
  await rm(profile, { recursive: true, force: true });
}

console.log(`Browser smoke test passed${buildDirectory ? ` for ${buildDirectory}` : ''}.`);
