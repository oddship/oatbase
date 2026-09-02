# Oatbase

Advanced, semantic components for [Oat UI](https://oat.ink). Oatbase fills the gap between Oat's small core and the richer controls application UIs often need, without introducing a framework, Tailwind, or runtime dependencies.

[Browse the documentation and interactive examples.](https://oddship.github.io/oatbase/)

## Oatbase additions

| Component | Markup | JavaScript |
| --- | --- | --- |
| Item / item group | `.item`, `.item-group` | No |
| Callout | `[data-callout]` | No |
| Empty state | `[data-variant="empty"]` | No |
| Keyboard hint | `<kbd>`, `.kbd-group` | No |
| Combobox | `<ot-combobox>` | Yes |
| Command palette | `<ot-command>` | Yes |
| Drawer | `<dialog data-variant="drawer">` | No |
| Chart | `[data-variant="chart"]` | No |
| Select | `<ot-select>` | Yes |
| Scroll area | `.scroll-area` | No |
| Theme switcher | `<ot-theme-switcher>` | Yes |
| Copy button | `<ot-copy>` | Yes |
| Action field | `<ot-action-field>` | Yes |
| Multiselect | `<ot-multiselect>` | Yes |
| Password field | `<ot-password>` | Yes |
| Splitter | `<ot-splitter>` | Yes |
| Tree | `<ot-tree>` | Yes |
| Rating | `[data-rating]` | No |
| Segmented control | `[data-segmented]` | No |
| Stat | `[data-stats]` | No |
| Stepper | `[data-stepper]` | No |
| Timeline | `[data-timeline]` | No |
| Toggle | `<ot-toggle>` | Yes |
| Toolbar | `<ot-toolbar>` | Yes |
| Choice card | `[data-choice-card]` | No |
| OTP input | `<ot-otp>` | Yes |
| Lightbox | `<ot-lightbox>` | Yes |
| Scrollspy | `<ot-scrollspy>` | Yes |
| Footnote previews | `<ot-footnotes>` | Yes |
| Reading progress | `<ot-reading-progress>` | Yes |
| Data table | `<ot-data-table>` around a native `<table>` | Yes |
| Repeater | `<ot-repeater>` with a native `<template>` | Yes |
| Log viewer | `<ot-log-viewer>` around `[role="log"]` | Yes |
| Description list | `[data-description-list]` | No |
| Prose | `[data-prose]` | No |

Oatbase also includes a small `.visually-hidden` accessibility utility.

## Complete component coverage

The documentation covers 69 routed patterns. Oatbase ships the 35 extensions above and documents 34 Oat-core patterns without shipping duplicate CSS or JavaScript:

Accordion, Alert, Alert Dialog, Avatar, Badge, Breadcrumb, Button, Button Group, Card, Checkbox, Dialog, Dropdown Menu, Field, Grid, Input, Input Group, Label, Native Select, Pagination, Popover, Progress and Meter, Radio Group, Sidebar, Skeleton, Slider, Spinner, Switch, Table, Tabs, Tag Input, Textarea, Toast, Tooltip, and Upload.

Every component has a routed, interactive page in `docs/index.html`. The machine-readable coverage registry is `docs/components.js`.

## Install

> **Release status:** Oatbase has not been published to npm or a CDN yet. It will publish as `@oddship/oatbase`; use a local source checkout while the first release is prepared.

Enter the checked-in Nix development shell, or install Bun, Node.js/npm, and GNU Make. Then build the distribution from the Oatbase directory:

```sh
npm ci
make dist
```

Then install that directory from your application, adjusting the relative path as needed:

```sh
npm install ../oatbase
```

```js
import '@oddship/oatbase/css';
import '@oddship/oatbase';
```

For a static site, copy the built distribution into its public assets:

```sh
cp -R ../oatbase/dist ./public/vendor/oatbase
```

```html
<link rel="stylesheet" href="/vendor/oatbase/oatbase.min.css">

<script src="/vendor/oatbase/oatbase.min.js" defer></script>
```

CSS-only applications can use `@oddship/oatbase/css` without loading JavaScript. For an application that already loads Oat, `@oddship/oatbase/extensions.css` and `@oddship/oatbase/extensions` provide the extension-only aggregates. Every Oatbase addition also has an independent entry point, such as `@oddship/oatbase/chart.css`, `@oddship/oatbase/drawer.css`, or `@oddship/oatbase/select` plus `@oddship/oatbase/select.css`.

The v0.1.0 complete Oat-inclusive browser payload is 28.1 kB gzipped, and the extension-only aggregate is 18.3 kB gzipped. Individual entry points and `components.json` support selective application bundles; `examples/esgun/` demonstrates that path without making EsGun a library dependency.

The Flowctl audit added only the reusable boundaries: Repeater coordinates repeated native fields, Log Viewer coordinates a semantic live log, Combobox can create native options, and Stepper has a compact status track. Page headers, validation summaries, action rails, schedule forms, and workflow workspaces remain recipes or blocks. CodeMirror, graph layout, cron/timezone conversion, ANSI parsing, streaming, and virtualization remain application or specialist-library concerns.

Oat supplies its native tooltip pattern. Viewport flipping, shifting, hoverable content, and Escape dismissal are an explicit Oatbase compatibility enhancement so applications that do not need them register no tooltip listeners:

```js
import '@oddship/oatbase/tooltip-compat.css';
import '@oddship/oatbase/tooltip-compat';
```

## Examples

### Combobox

The native select is the source of truth and remains visible and functional if JavaScript fails. Oatbase enhances it into a searchable combobox.

```html
<ot-combobox data-placeholder="Search frameworks…" data-empty="No frameworks found.">
  <select name="framework" aria-label="Framework">
    <option value="" disabled selected>Choose a framework</option>
    <option value="rails" data-keywords="ruby">Ruby on Rails</option>
    <option value="django" data-keywords="python">Django</option>
    <option value="laravel" data-keywords="php">Laravel</option>
  </select>
</ot-combobox>
```

Read or assign `combobox.value`. The underlying select emits its native `change` event; the component also emits `oatbase:change` with `{ value, option }`.

### Command palette

```html
<ot-command data-shortcut="mod+k">
  <button data-command-open commandfor="command-menu" command="show-modal">
    Open command menu <kbd>⌘ K</kbd>
  </button>
  <dialog id="command-menu" closedby="any">
    <input data-command-search type="search" placeholder="Type a command…" aria-label="Commands">
    <ul data-command-list>
      <li data-command-group>Navigation</li>
      <li><button type="button" data-command-item data-value="home">Go home</button></li>
      <li><button type="button" data-command-item data-value="settings">Open settings</button></li>
      <li data-command-empty hidden>No commands found.</li>
    </ul>
  </dialog>
</ot-command>
```

Listen for `oatbase:select`. Calling `preventDefault()` keeps the palette open; `detail` contains `{ value, item }`.

For application or server results, add `data-filter="manual"` and listen for `oatbase:query`. Replace the native list rows, then call `refresh()` to reindex keyboard and accessible state:

```js
const command = document.querySelector('ot-command');

command.addEventListener('oatbase:query', async event => {
  const results = await searchCommands(event.detail.query);
  command.list.replaceChildren(...results.map(commandRow));
  command.refresh();
});
```

The application owns fetching, cancellation, and result markup. Oatbase continues to own active-item navigation, empty-state synchronization, selection, and `aria-activedescendant`. The current trimmed value is available as `command.query`.

### Drawer

```html
<button commandfor="notifications" command="show-modal">Open drawer</button>
<dialog id="notifications" data-variant="drawer" data-side="right" closedby="any">
  <form method="dialog">
      <header><h3>Notifications</h3></header>
      <div data-drawer-body>Drawer content</div>
      <footer><button value="done">Done</button></footer>
  </form>
</dialog>
```

Supported sides are `bottom`, `top`, `left`, and `right`. This is only CSS around a native dialog; Oat's existing `commandfor` support handles opening it.

### Action field

Action Field presents a value and arbitrary contextual actions. It inherits Copy Button behavior, while the value and native action links remain useful if JavaScript does not load. The copy control is revealed only after enhancement.

```html
<ot-action-field role="group" aria-labelledby="contact-label" data-copied="Copied address">
  <span id="contact-label" data-action-field-label>Email address</span>
  <div data-action-field-body>
    <span data-action-field-value data-copy-source>hello@example.com</span>
    <div data-action-field-actions>
      <a class="button" href="mailto:hello@example.com">Email me</a>
      <button type="button" class="outline" data-copy-button>Copy</button>
    </div>
  </div>
</ot-action-field>
```

For a focused install, import `@oddship/oatbase/action-field.css` and `@oddship/oatbase/action-field`. Read `value`, call `copy()`, or listen for `oatbase:copy`; `data-copied` changes both the temporary button label and its polite live-region announcement.

### Data table

Data Table enhances a native table in place. Headers marked with `data-sort` become sortable, `data-table-filter` filters existing rows, and native checkboxes preserve form and no-JavaScript behavior.

```html
<ot-data-table>
  <input type="search" data-table-filter aria-label="Filter projects">
  <table>
    <thead><tr><th data-sort="text">Project</th><th data-sort="number">Issues</th></tr></thead>
    <tbody><tr><th scope="row">Atlas</th><td>12</td></tr></tbody>
  </table>
</ot-data-table>
```

Fetching, server pagination, caching, saved views, column visibility, row actions, and mutations remain application concerns. Replace or append native rows, then call `refresh()`.

### Toggle and toolbar

Toggle buttons preserve native button semantics and expose state through `aria-pressed`. Toolbars progressively enhance ordinary controls with one Tab stop and wrapping arrow-key navigation.

```html
<ot-toolbar role="toolbar" aria-label="Text formatting">
  <ot-toggle><button type="button" aria-pressed="false">Bold</button></ot-toggle>
  <ot-toggle><button type="button" aria-pressed="false">Italic</button></ot-toggle>
  <button type="button">Undo</button>
</ot-toolbar>
```

### Choice cards

Choice cards are CSS around native radio buttons or checkboxes, so validation, submission, reset, disabled state, and no-JavaScript behavior remain browser-owned.

```html
<fieldset data-choice-cards>
  <legend>Choose a plan</legend>
  <label data-choice-card>
    <input type="radio" name="plan" value="starter" checked>
    <span><strong>Starter</strong><small>For personal projects.</small></span>
  </label>
</fieldset>
```

### OTP input

OTP uses one real input for mobile keyboards, password-manager autofill, constraints, form submission, and reset. JavaScript adds only the segmented presentation and completion event.

```html
<label for="verification-code">Verification code</label>
<ot-otp data-length="6">
  <input id="verification-code" name="code" inputmode="numeric"
    autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required>
</ot-otp>
```

### Document helpers

Lightbox, Scrollspy, Footnotes, and Reading Progress compose existing Oat controls around useful native fallbacks. Image links still navigate, table-of-contents links still work, footnote references still reach their definitions, and reading progress remains a native `<progress>` element when JavaScript is unavailable.

```html
<ot-scrollspy data-target="#article">
  <nav aria-label="On this page">
    <a href="#introduction">Introduction</a>
    <a href="#examples">Examples</a>
  </nav>
</ot-scrollspy>

<article id="article">…</article>
```

## Principles

- Prefer an Oat or native HTML element whenever it already solves the problem.
- Oat remains the visual foundation and is bundled by the default Oatbase entry point.
- Native form controls and dialogs provide the fallback and form semantics.
- All interactive controls support keyboard navigation and expose ARIA state.
- No global initialization API is needed. Custom elements upgrade when they enter the DOM.
- The complete browser bundle is self-contained and requires no external runtime dependencies.

## Theming

Oatbase inherits Oat's semantic color, typography, spacing, radius, shadow, and motion variables. It does not ship a second global contract or a JavaScript theme provider. A small set of prefixed CSS custom properties is available for component-specific geometry such as drawer width, command height, and OTP cell size.

Four alternative CSS-only presets—Doordarshan, Forest, Ocean, and Paper—plus an explicit scoped Oat reset can be loaded together with `@oddship/oatbase/themes` or independently from `@oddship/oatbase/themes/*.css`. Set `data-oat-theme` on the document root or any subtree to apply one; use `data-oat-theme="oat"` to restore Oat inside another preset.

See [THEMING.md](./THEMING.md) for the contract, supported hooks, scoped density, and appearance-mode behavior.

## Development

The checked-in Nix flake provides Bun, Node.js/npm, GNU Make, and the wrapped Playwright browsers on Linux. Enter it directly or let Direnv load it from `.envrc`:

```sh
nix develop
npm ci
make dist
make test
```

On Apple Silicon macOS, run `npx playwright install` once after `npm ci`; nixpkgs supplies the wrapped browsers automatically on Linux. Intel macOS is no longer supported by the pinned nixpkgs unstable revision, so use the non-Nix setup there.

```sh
direnv allow
```

Without Nix, install [Bun](https://bun.sh), Node.js/npm, and GNU Make, then run `npm ci` and `npx playwright install` before the Make targets. The fast suite uses a system Chromium or Chrome; the component contract harness uses Playwright’s Chromium, Firefox, and WebKit browsers.

The Playwright runner uses the browser path exported by the development shell. On NixOS outside the shell it can still resolve the wrapped browser bundle from `nixpkgs`; on other systems it uses Playwright’s normal browser installation.

`make test` is the resource-conscious local gate: it runs unit tests, both browser-smoke pages, and the Chromium Playwright project with one worker. Before a release or shared browser-contract change, run the complete engine matrix with `make test-all`. Local Playwright concurrency can be raised explicitly with `OATBASE_PLAYWRIGHT_WORKERS=2`; keeping it at the default of one minimizes peak CPU and memory use.

An opt-in EsGun release-build pilot is available without changing the default Bun build. It exercises named EsGun profiles for readable and minified IIFE output, readable ESM output, aggregate and component CSS, stable filenames, and copied themes. The separate Node assembly step adds Oat and the version/license banner to the complete CSS bundle. Until the profile support is released, point `ESGUN` at a compatible local checkout:

```sh
ESGUN="go -C ../esgun run ." make verify-esgun
```

The pilot writes to ignored `dist-esgun/`. Its parity verifier requires the exact checked artifact manifest, validates every package export against the candidate directory, checks JavaScript formats and syntax, verifies byte-exact theme copies and full-CSS assembly, reports raw, gzip, and Brotli deltas, and runs the shared browser-smoke fixture against the candidate bundle. Use `make dist` and `make test` for the supported release workflow until this parity gate passes with a released EsGun binary.

The Playwright harness verifies no-JavaScript fallbacks, keyboard and focus behavior, native form contracts, ARIA snapshots, axe accessibility checks, and light, dark, and forced-colors visual baselines. Update intentional visual changes with `npm run test:e2e:update`.

Open `docs/index.html` after building to use the interactive documentation site. It includes routed component pages, live Preview/Code tabs, copyable examples, navigation search, a command palette, responsive mobile navigation, and theme switching without a documentation framework.

## License

MIT. Oatbase is an independent extension and is not affiliated with Basecoat or Oat.
