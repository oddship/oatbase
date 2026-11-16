import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function releaseTag(ref, dryRun = false) {
  if (ref === 'main' && dryRun) return 'main';
  if (typeof ref !== 'string') throw new Error('A release ref is required.');
  const tag = ref.startsWith('v') ? ref : `v${ref}`;
  if (!/^v(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(tag)) {
    throw new Error('Use an existing stable tag such as v0.2.0; main is allowed only for dry runs.');
  }
  return tag;
}

export function verifyRelease(ref, pkg, lock, manifest, dryRun = false) {
  const tag = releaseTag(ref, dryRun);
  if (pkg.name !== '@oddship/oatbase' || pkg.private || pkg.publishConfig?.access !== 'public') {
    throw new Error('Expected the public @oddship/oatbase package.');
  }
  if (!/^\d+\.\d+\.\d+$/.test(pkg.version) || releaseTag(pkg.version) === 'main') {
    throw new Error('The package must have a stable version.');
  }
  if (tag !== 'main' && tag !== `v${pkg.version}`) throw new Error('Tag and package version do not match.');
  if (lock.version !== pkg.version || lock.packages?.['']?.version !== pkg.version || manifest.version !== pkg.version) {
    throw new Error('Package, lockfile and component manifest versions must match.');
  }
  if (pkg.repository?.url !== 'git+https://github.com/oddship/oatbase.git') {
    throw new Error('The package repository must match oddship/oatbase for provenance.');
  }
  return { version: pkg.version, tag, filename: `oddship-oatbase-${pkg.version}.tgz` };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [pkg, lock, manifest] = await Promise.all(['package.json', 'package-lock.json', 'components.json'].map(async file => JSON.parse(await readFile(file, 'utf8'))));
  const result = verifyRelease(process.argv[2], pkg, lock, manifest, process.argv.includes('--dry-run'));
  console.log(JSON.stringify(result));
}
