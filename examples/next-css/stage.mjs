import { copyFile, mkdir } from 'node:fs/promises';
// This fixture consumes only this checkout's reviewed build, never a CDN.
await mkdir(new URL('./app/vendor/', import.meta.url), { recursive: true });
await copyFile(new URL('../../dist/oatbase.css', import.meta.url), new URL('./app/vendor/oatbase.css', import.meta.url));
