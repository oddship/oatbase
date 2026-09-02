import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const browser = Bun.which('chromium') || Bun.which('google-chrome');
if (!browser) throw new Error('Chromium or Google Chrome is required.');

const root = resolve(import.meta.dir, '..');
const mobile = process.argv.includes('--mobile');
const route = process.argv.slice(2).find(argument => argument.startsWith('/')) || '';
const output = mobile ? '/tmp/oatbase-docs-mobile.png' : '/tmp/oatbase-docs.png';
const profile = await mkdtemp(join(tmpdir(), 'oatbase-docs-chrome-'));
const child = Bun.spawn([
  browser,
  '--headless',
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--allow-file-access-from-files',
  `--user-data-dir=${profile}`,
  `--window-size=${mobile ? '390,844' : '1440,1100'}`,
  '--virtual-time-budget=3000',
  `--screenshot=${output}`,
  `${pathToFileURL(resolve(root, 'docs/index.html')).href}${route ? `#${route}` : ''}`
], { stdout: 'pipe', stderr: 'pipe' });

const [errors, exitCode] = await Promise.all([
  new Response(child.stderr).text(),
  child.exited
]);
await rm(profile, { recursive: true, force: true });

if (exitCode !== 0) throw new Error(errors || `Chromium exited with ${exitCode}`);
console.log(output);
