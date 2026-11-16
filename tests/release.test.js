import { describe, expect, test } from 'bun:test';
import { releaseTag, verifyRelease } from '../scripts/verify-release.js';

const pkg = { name: '@oddship/oatbase', version: '0.2.0', publishConfig: { access: 'public' }, repository: { url: 'git+https://github.com/oddship/oatbase.git' } };
const lock = { version: '0.2.0', packages: { '': { version: '0.2.0' } } };
const manifest = { version: '0.2.0' };

describe('release boundary', () => {
  test('normalizes stable tags and allows main only for dry runs', () => {
    expect(releaseTag('0.2.0')).toBe('v0.2.0');
    expect(releaseTag('v0.2.0')).toBe('v0.2.0');
    expect(releaseTag('main', true)).toBe('main');
    for (const ref of ['main', 'v01.2.0', 'v0.2.0-beta', 'refs/heads/main', 'v0.2.0\nx=1', 'v0.2.0;echo bad', '../v0.2.0']) {
      expect(() => releaseTag(ref)).toThrow();
    }
  });
  test('accepts matching public release metadata', () => {
    expect(verifyRelease('v0.2.0', pkg, lock, manifest)).toEqual({ version: '0.2.0', tag: 'v0.2.0', filename: 'oddship-oatbase-0.2.0.tgz' });
    expect(verifyRelease('main', pkg, lock, manifest, true).version).toBe('0.2.0');
  });
  test('rejects mismatched versions, identity and repository metadata', () => {
    expect(() => verifyRelease('v0.1.0', pkg, lock, manifest)).toThrow();
    expect(() => verifyRelease('v0.2.0', pkg, { ...lock, version: '0.1.0' }, manifest)).toThrow();
    expect(() => verifyRelease('v0.2.0', pkg, lock, { version: '0.1.0' })).toThrow();
    expect(() => verifyRelease('v0.2.0', { ...pkg, name: 'oatbase' }, lock, manifest)).toThrow();
    expect(() => verifyRelease('v0.2.0', { ...pkg, private: true }, lock, manifest)).toThrow();
    expect(() => verifyRelease('v0.2.0', { ...pkg, repository: { url: 'https://github.com/other/repo' } }, lock, manifest)).toThrow();
  });
});

import { createHash } from 'node:crypto';
import { registryState, verifyRegistryArtifact } from '../scripts/verify-registry.js';

const bytes = Buffer.from('the verified npm package');
const registryMetadata = { name: pkg.name, version: pkg.version, dist: { integrity: `sha512-${createHash('sha512').update(bytes).digest('base64')}` } };

test('an existing version is accepted only when the published artifact matches exactly', () => {
  expect(verifyRegistryArtifact(registryMetadata, '0.2.0', bytes).published).toBe(true);
  expect(() => verifyRegistryArtifact(registryMetadata, '0.2.1', bytes)).toThrow();
  expect(() => verifyRegistryArtifact(registryMetadata, '0.2.0', Buffer.from('a different package'))).toThrow();
  expect(() => verifyRegistryArtifact({ ...registryMetadata, name: 'another-package' }, '0.2.0', bytes)).toThrow();
});

test('a registry failure cannot masquerade as an unpublished version', async () => {
  const missing = async () => ({ status: 404, ok: false });
  const failed = async () => ({ status: 503, ok: false });
  expect(await registryState('0.2.0', bytes, true, missing)).toEqual({ published: false, version: '0.2.0' });
  await expect(registryState('0.2.0', bytes, false, missing)).rejects.toThrow();
  await expect(registryState('0.2.0', bytes, true, failed)).rejects.toThrow();
});
