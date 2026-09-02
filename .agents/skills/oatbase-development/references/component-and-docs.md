# Component and documentation workflow

## Source map

- `src/css/components/`: focused extension styles and optional compatibility styles.
- `src/js/`: web components, shared lifecycle utilities, and optional enhancers.
- `src/css/extensions.css` and `src/js/extensions.js`: extension-only aggregates.
- `src/js/index.js` plus `scripts/build-full-css.js`: complete Oat-inclusive bundles.
- `package.json`: public imports; every declared path must exist after the build.
- `Makefile`: checked-in distribution build graph.
- `docs/components.js`: machine-readable ownership, examples, API, guidance, and special imports.
- `docs/docs.js`: generated pages, navigation, copyable code, search, and docs-shell behavior.
- `docs/examples.js`: isolated full-page examples.
- `tests/source.test.js`, `tests/docs.test.js`, browser smoke fixtures, and Playwright tests: contract enforcement.

## Add or change a component

Adapt this checklist to the change; do not create empty surfaces just to satisfy it.

1. Search Oat and `docs/components.js`; decide `Oat core`, `Oatbase`, application composition, or opt-in compatibility ownership.
2. Start from the semantic fallback markup. Confirm forms, links, dialogs, details, and labels remain useful before JavaScript.
3. Add focused CSS using Oat tokens. Add a prefixed geometry hook only when it is a real public customization surface.
4. If behavior is needed, implement a defensive custom-element definition, idempotent connection, cleanup, keyboard behavior, native synchronization, and useful events.
5. Update both aggregate files only if the feature belongs in those boundaries. Optional behavior should remain individually loaded.
6. Add package exports and Makefile outputs together. Build before running package-export tests.
7. Add or expand the registry entry. Show meaningful variants, disabled/empty/error states, responsive or overflow behavior, and API details rather than one happy path.
8. Add targeted source/browser tests for the invariant that could regress. Prefer observable behavior over wording snapshots.
9. Rebuild `dist/`; keep package version, lockfile root version, docs badge, and docs asset cache busters aligned when preparing a visible local release.

## Documentation dogfooding

- Reuse Oatbase `Item`, `Kbd`, `Select`, `Tabs`, `Copy`, `Empty`, `Stat`, `Callout`, and other available primitives instead of recreating their styling in `docs.css`.
- Classify navigation explicitly as **Oatbase extensions** or **Oat core patterns**. Do not imply that documented Oat components are reimplemented by Oatbase.
- Generated component pages should contain live preview, readable syntax-highlighted source, copy action, usage/imports, API when one exists, and concise guidance when misuse is likely.
- For JavaScript components, document the complete useful public surface: declarative attributes and hooks, properties, methods, emitted events, event detail, and cancelability or lifecycle semantics. Do not let the demo be the only API specification.
- Use a component's `imports` and `usageNote` fields for exceptional loading contracts rather than hard-coding a one-off docs layout.
- Full examples belong in isolated iframes and must load only the dependencies their source shows. Dogfood the actual distribution entry points.
- Keep popup/listbox/drawer/lightbox examples within their preview geometry. Test open states, not only screenshots of closed controls.
- Avoid docs-only phrases and fixture content repeated across unrelated component pages; examples should clarify the component's own use.

## Recipes and public content

- A recipe should be a usable composition, not a title card. Link the primitives it composes, provide copyable semantic markup, and add JavaScript only when the application must coordinate state.
- State ownership beside the recipe: Oatbase may coordinate native elements, while fetching, persistence, permissions, mutations, domain validation, timezone conversion, and similar product logic remain application concerns.
- Reuse `Callout`, `Card`, native `details`, and `Copy` for recipe presentation. A docs recipe does not justify a new product component unless the behavior is repeated and broadly reusable.
- Keep public examples independent of the repository's development history. Internal milestone versions, audit notes, placeholder release logs, and implementation-process commentary belong in commits or changelogs, not generic component fixtures.
- Prefer stable, explicit sample metadata. Use `<time datetime="…">` for dates and times; avoid `today`, `yesterday`, `last week`, or other labels that become false as the docs age.
- Installation, theming, and dependency prose must agree across `README.md`, `THEMING.md`, and the rendered docs.

## Review questions

- Is this reusable product behavior or documentation layout?
- Could Oat or native HTML own it?
- Does the example demonstrate the source-of-truth element and fallback?
- Are metadata, ownership, import paths, counts, search, and command navigation consistent?
- Are all visible controls composed from shipped primitives where practical?
- Does a CSS selector live with the component it styles, or has product CSS leaked into `docs.css`?
- Could a first-time reader copy the recipe and understand which behavior Oatbase owns versus what their application must implement?
- Does public example content still make sense without knowing the repository's internal release history?
