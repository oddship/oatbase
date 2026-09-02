import { resolve } from 'node:path';

const root = resolve(import.meta.dir, '..');
const environment = { ...process.env };

async function nixPath(attribute) {
  const child = Bun.spawn(['nix-build', '<nixpkgs>', '-A', attribute, '--no-out-link'], {
    cwd: root,
    stdout: 'pipe',
    stderr: 'inherit'
  });
  const [output, exitCode] = await Promise.all([new Response(child.stdout).text(), child.exited]);
  if (exitCode !== 0) throw new Error(`Could not resolve Nix package: ${attribute}`);
  return output.trim().split('\n').at(-1);
}

if (process.platform === 'linux' && Bun.which('nix-build') && !environment.PLAYWRIGHT_BROWSERS_PATH) {
  const [browsers, gl, gstLibav] = await Promise.all([
    nixPath('playwright-driver.browsers'),
    nixPath('libglvnd'),
    nixPath('gst_all_1.gst-libav')
  ]);
  environment.PLAYWRIGHT_BROWSERS_PATH = browsers;
  environment.PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = 'true';
  environment.LD_LIBRARY_PATH = [`${gl}/lib`, environment.LD_LIBRARY_PATH].filter(Boolean).join(':');
  environment.GST_PLUGIN_PATH = [`${gstLibav}/lib/gstreamer-1.0`, environment.GST_PLUGIN_PATH].filter(Boolean).join(':');
}

const playwright = resolve(root, 'node_modules/.bin/playwright');
const child = Bun.spawn([playwright, 'test', ...process.argv.slice(2)], {
  cwd: root,
  env: environment,
  stdin: 'inherit',
  stdout: 'inherit',
  stderr: 'inherit'
});
process.exit(await child.exited);
