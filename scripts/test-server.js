import { resolve, sep } from 'node:path';

const root = resolve(import.meta.dir, '..');
const port = Number(process.env.OATBASE_TEST_PORT || 43127);

const server = Bun.serve({
  hostname: '127.0.0.1',
  port,
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = decodeURIComponent(url.pathname === '/' ? '/tests/harness.html' : url.pathname);
    const path = resolve(root, `.${pathname}`);
    if (path !== root && !path.startsWith(`${root}${sep}`)) return new Response('Forbidden', { status: 403 });
    const file = Bun.file(path);
    if (!await file.exists()) return new Response('Not found', { status: 404 });
    return new Response(file);
  }
});

console.log(`Oatbase test server listening on ${server.url}`);
