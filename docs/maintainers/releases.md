# Releasing Oatbase

The `Publish npm` workflow in `.github/workflows/publish-npm.yml` builds a tagged
release, verifies its checked-in distributions and metadata, and publishes the
verified tarball to npm. The release commit must be reachable from `main` and have
a successful `CI` workflow run on that exact commit.

Stable `vX.Y.Z` tags trigger publishing. The workflow can also be dispatched
manually for an existing stable tag. Manual runs default to a dry run; `main` is
accepted only for dry runs. A dry run uploads an `npm-package` artifact and never
runs the publishing job.

## First publication from your machine

npm requires the package to exist before a trusted publisher can be configured.
Bootstrap once from an authenticated maintainer's local machine. GitHub does not
need an npm token or a bootstrap secret.

1. Merge the release preparation and wait for its exact `main` commit's CI to pass.
2. Run `Publish npm` with `version=main` and `dry_run=true`. Download the
   `npm-package` artifact from that successful run and extract it.
3. Inspect `pack.json` and the tarball. Confirm the package name is
   `@oddship/oatbase`, the version is `0.2.0`, and that your npm account can publish
   under `@oddship`.
4. On your machine, run:

   ```sh
   npm login --registry=https://registry.npmjs.org
   npm publish ./oddship-oatbase-0.2.0.tgz --access public
   ```

   Complete npm's 2FA prompt. Publish the downloaded tarball, rather than rebuilding
   a different local checkout. This one local publication does not have GitHub
   Actions provenance; subsequent Actions publications do.
5. When ready for the next actual release, in the package's npm settings, add a GitHub trusted publisher with owner
   `oddship`, repository `oatbase`, and workflow filename `publish-npm.yml`.
   Leave environment blank and allow direct `npm publish`.

The npm CLI can configure the same relationship when using a supported version:

```sh
npm trust github @oddship/oatbase --file publish-npm.yml --repo oddship/oatbase --allow-publish
```

This needs npm 11.15.0 or newer, package write access, and account 2FA. npm requires
the first successful OIDC publication within two days of creating the trusted
publisher; verifying an already published version does not activate that trust. Follow
[npm's trusted publishing guide](https://docs.npmjs.com/trusted-publishers/) and
[CLI documentation](https://docs.npmjs.com/cli/v11/commands/npm-trust/).

## Later releases

Update `package.json`, the root lockfile versions, `components.json`, visible docs
version, and asset cache-buster versions together. Rebuild and commit `dist/`,
review the package dry run, merge, and wait for main CI.

Tag that exact tested commit and push the tag. For example, the next release after
the local bootstrap is:

```sh
git tag -a v0.2.1 <tested-main-commit> -m 'Release v0.2.1'
git push origin v0.2.1
```

The package metadata must also be `0.2.1`; the workflow rejects mismatches. Do not
reuse or move published tags. To retry a run, select its existing tag in a manual
workflow dispatch using that tag as both the workflow ref and the version input.
For example:

```sh
gh workflow run publish-npm.yml --repo oddship/oatbase --ref v0.2.1 -f version=v0.2.1 -f dry_run=false
```

The workflow rejects publication if its workflow revision differs from the
selected release commit, so provenance refers to the code actually packaged.
The workflow publishes with OIDC and verifies the registry's
SHA-512 integrity against the uploaded tarball. Existing published versions are
immutable. A retry verifies an identical existing artifact and skips publication;
a different artifact at that version fails instead of being overwritten.

For the initial local bootstrap, create `v0.2.0` at its matching commit only after
publication and trusted-publisher setup. Its automated run verifies that the
already published artifact matches and avoids attempting to publish it again.

## CDN files

Public npm releases are automatically served by unpkg and jsDelivr. After a
version is published, pin that version explicitly:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@oddship/oatbase@0.2.0/dist/oatbase.min.css">
<script src="https://cdn.jsdelivr.net/npm/@oddship/oatbase@0.2.0/dist/oatbase.min.js" defer></script>
```

The corresponding unpkg paths work too. Load focused files such as
`agent-prompt.css`, `icon.css`, and `copy-button.js` only when needed. Do not load
Oat separately with Oatbase's complete bundle.

These npm/CDN URLs are future release examples until publication is verified.
Source checkouts and commit-pinned GitHub CDN assets remain usable before that.
