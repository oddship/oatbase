import { createHash } from 'node:crypto';
import { appendFile, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { releaseTag } from './verify-release.js';

export function verifyRegistryArtifact(metadata, version, bytes) {
  const integrity = `sha512-${createHash('sha512').update(bytes).digest('base64')}`;
  if (metadata.name !== '@oddship/oatbase' || metadata.version !== version || metadata.dist?.integrity !== integrity) {
    throw new Error('The published package identity or tarball does not match the verified release artifact.');
  }
  return { published: true, version, integrity };
}

export async function registryState(version, bytes, allowMissing = false, fetcher = fetch) {
  releaseTag(version);
  const response = await fetcher(`https://registry.npmjs.org/@oddship%2foatbase/${encodeURIComponent(version)}`);
  if (response.status === 404 && allowMissing) return { published: false, version };
  if (!response.ok) throw new Error(`npm registry verification returned ${response.status}`);
  return verifyRegistryArtifact(await response.json(), version, bytes);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const version = process.argv[2];
  const bytes = await readFile(process.argv[3]);
  const allowMissing = process.argv.includes('--allow-missing');
  let result;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      result = await registryState(version, bytes, allowMissing);
      break;
    } catch (error) {
      if (allowMissing || attempt === 4) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `published=${result.published}\n`);
  console.log(JSON.stringify(result));
}
