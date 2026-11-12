# React and Next.js

Oatbase is framework-free. A React application can use its complete CSS without
loading any JavaScript. React then owns state, event handlers, modal focus,
keyboard models, and cleanup. Native buttons, forms, links, and disclosures keep
their platform behavior. Use semantic Oat tokens for appearance; do not create a
parallel button or theme system.

## Local checkout workflow

Build this checkout with `npm ci` and `bun run build` (Bun and Make are required).
Copy `dist/oatbase.css`, `LICENSE`, and `THIRD_PARTY_NOTICES.md` into your application
vendor directory, and record the upstream commit and checksum for updates. This
is the complete Oat-inclusive CSS; extensions-only CSS assumes Oat is already
loaded. These instructions do not depend on registry or CDN publication.

In an App Router root layout, import a global stylesheet:

```jsx
import './globals.css';
export default function Layout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
```

Declare layer order and use ordinary imports in `globals.css`:

```css
@layer theme, base, components, animations, utilities, product;
@import './vendor/oatbase.css';
@import './product.css';
```

Oatbase already declares its layers internally. Put consumer overrides inside
`@layer product { ... }` in `product.css`; the later layer wins in the ordinary
cascade. Unlayered rules outrank normal layered rules, so audit framework resets
and utility CSS before attributing a conflict to Oatbase. Do not wrap the entire
Oatbase import in another layer without deliberately revisiting layer order.

Doot observed its Next webpack CSS pipeline rewriting `@import ... layer(name)`
into `@media layer(name)`, which did not match. Ordinary imports with layers
inside the files worked there. This is an observed consumer/toolchain issue,
not a claim that every Next version or bundler has this bug. Inspect emitted
production CSS as well as development rendering when changing the pipeline.

## Interaction ownership

```jsx
'use client';
import { useState } from 'react';
export function Review() {
  const [count, setCount] = useState(0);
  return <>
    <button type="button" onClick={() => setCount(value => value + 1)}>
      Record review
    </button>
    <output role="status">Reviews recorded: {count}</output>
  </>;
}
```

Do not also import `@oddship/oatbase` or the global Oat JavaScript for interactions
React manages. CSS alone does not supply Toolbar roving focus, dialogs' application
focus coordination, custom-element enhancements, or tooltip behavior. Either own
those in React or opt into a focused Oatbase enhancer and let it own the same
interaction exclusively. For CSS-only toolbars, use a named `role="group"` with
ordinary Tab stops unless you implement the toolbar keyboard model.

The [responsive native details recipe](docs/recipes/responsive-details.js) can
be initialized from an effect on an **uncontrolled** details ref: return its cleanup
from the effect, leave `open` to the recipe, and do not add a competing React state
handler. Alternatively coordinate `open`, viewport changes, native toggles, focus
restoration, and effect cleanup entirely in React. Keep summary visible and
keyboard operable. Start closed on server and client for consistent hydration;
no-JS users can still open the disclosure. Warnings, approvals, and primary content
stay outside it.

## Production verification

The isolated [Next fixture](examples/next-css) pins its own development-only
framework dependencies. They are not Oatbase runtime or peer dependencies.
From this checkout after building Oatbase:

```sh
cd examples/next-css
npm ci
npm run build
```

`stage.mjs` copies this worktree's distribution into the fixture before building.
The webpack production build checks active internal layers, consumer theme tokens,
Oatbase rules, and absence of malformed media queries. The browser-check configuration starts and stops only the
fixture on loopback port 43128. Verify computed styles, hydration, one increment per click,
and native keyboard disclosure operation with:

```sh
# From the repository root (install Playwright Chromium first):
OATBASE_NEXT_FIXTURE=1 bun scripts/playwright-test.js --config examples/next-css/playwright.config.js
```

For manual inspection, `npm start` in the fixture directory serves the same
production build on port 43128. The GitHub CI fixture job runs the build and
browser check together.

A passing pinned fixture verifies that configuration, not every Next release,
Turbopack, browser, React wrapper, or consumer cascade. Recheck your production
output and real interaction ownership when upgrading. Build in a staging copy,
never over a running application's production build directory.
