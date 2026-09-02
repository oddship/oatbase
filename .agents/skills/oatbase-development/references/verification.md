# Verification, accessibility, and performance

## Fast verification ladder

Run the narrowest relevant checks first, then broaden for shared code or release work:

```sh
bun run build
bun test tests/source.test.js tests/docs.test.js
bun scripts/browser-smoke.js tests/browser.html
bun scripts/browser-smoke.js tests/docs-browser.html
bun scripts/playwright-test.js tests/e2e/components.pw.js --project=chromium
```

Run the full `bun test` / `make test` cross-browser workflow when a shared component contract, theme, accessibility rule, browser compatibility layer, or release boundary changes. A single intermittent browser failure may be rerun in isolation to diagnose it, but a reproducible failure is not a flake.

Keep verification resource-conscious:

- Run source and documentation tests before launching a browser.
- Use the browser smoke fixtures for fast integration feedback.
- The checked-in Chromium workflow is intentionally one worker; do not add parallel workers merely to reduce elapsed time on a local development machine.
- Reserve the full Firefox/WebKit matrix for changes that need it or an explicit release check.
- Avoid running the full ladder twice after only a documentation assertion changes; rerun the failed narrow layer, then perform one final complete pass.

## Rendered documentation checks

- Serve the canonical checkout being edited and use a fresh navigation or cache-busting query after changing static HTML or scripts.
- Confirm the expected server is listening before interpreting the page. If the usual port is occupied, use a clearly identified alternate port rather than trusting an existing browser DOM.
- Inspect the rendered semantic snapshot and the visual layout. Source assertions cannot reveal stale assets, overflow, popup containment, uneven cards, or an incorrect theme label.
- Exercise the state being documented: open disclosures and popups, change filters and themes, click copy actions, and verify empty states only appear when their predicates are true.
- A browser process blocked by its host sandbox is an infrastructure failure. Rerun only that check with the required permission; do not weaken the browser test or mark it passed from source inspection.

## Bundle measurement

Run:

```sh
bun .agents/skills/oatbase-development/scripts/report-size.js
```

The reporter measures aggregate raw, gzip, and Brotli payloads and estimates minified per-component ESM costs. Existing source tests enforce the complete bundle below 28,000 gzip bytes and the extension layer below 18,000 gzip bytes.

At v0.1.0 the initial reference aggregate measurements are approximately:

- Complete Oat-inclusive bundle: 116,994 raw / 23,021 gzip / 20,311 Brotli bytes.
- Extension-only bundle: 74,876 raw / 13,321 gzip / 11,819 Brotli bytes.
- Optional tooltip compatibility CSS + ESM: about 1,089 gzip bytes when chosen.

Always remeasure instead of treating these numbers as permanent. Compare the same build, version banner, concatenation method, and compression settings.

Keep README and introductory size claims aligned with the reporter's output. Rounded decimal-kilobyte prose must round the measured byte counts correctly; tests should continue to enforce the byte thresholds.

Optimize for the user's real loading path:

- Individual imports are usually the largest saving.
- Raw-byte reduction is not proof of transfer improvement. Repeated code can compress better than a generalized helper.
- Record runtime effects such as listener count, observer scope, eager DOM work, and cleanup separately from transfer size.
- Keep passive/rAF scroll work, scoped observers, shared outside-pointer dispatch, and opt-in global compatibility behavior.
- Reject changes that merely move bytes between files or make the default aggregate smaller by silently dropping documented behavior.

## Accessibility and interaction

Verify relevant combinations of:

- Keyboard navigation, Escape, Enter/Space, arrow/Home/End behavior, focus restoration, and one predictable Tab stop where appropriate.
- Accessible names, roles, state attributes, `aria-activedescendant`, live feedback, focus visibility, and forced-colors behavior.
- Native disabled, required, validity, form reset, form submission, and no-JavaScript fallback.
- Light/dark/system modes and every shipped theme. Measure text, control, faint-text, and focus-token contrast; do not infer WCAG conformance from visual inspection.
- Reduced motion for drawers, dialogs, and animated feedback.
- Popup and overlay containment at narrow viewports and docs preview boundaries.

Automated axe checks do not cover the full WCAG surface. Report them as automated findings, then include the manual keyboard and semantic checks actually performed.

## Package dry run

Before a public push, run `npm pack --dry-run` after the build and inspect the package scope, version, file list, tarball size, and exported artifacts. If the host npm cache is read-only, point `npm_config_cache` at a task-specific temporary directory rather than changing the user's global npm configuration.

## CSS consistency

- Prefer Oat spacing, type, radius, motion, shadow, and layering tokens.
- Use `rem`, logical properties, and component hooks for scalable geometry.
- Reserve raw pixels for physical strokes, focus outlines, one-pixel hidden-control geometry, or similarly justified cases. `tests/source.test.js` maintains the permitted list.
- Test all themes in light and dark modes after changing semantic colors. A contrast fix in one theme can create a regression in another.
- Avoid theme-specific component selectors; themes should remain token maps.
