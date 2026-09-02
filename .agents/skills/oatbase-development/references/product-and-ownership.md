# Product philosophy and ownership

## The layers

- **The web platform** owns useful native semantics and fallback behavior: controls, forms, `details`, `dialog`, popovers, tables, landmarks, and ordinary events.
- **Oat core** owns the visual foundation, semantic tokens, and its existing primitive/component surface.
- **Oatbase** fills deliberate product-pattern gaps with semantic CSS and small web components. It must not fork Oat's token system or duplicate an Oat component merely to make the catalog look larger.
- **Applications and documentation** compose primitives into product-specific layouts. Repeated, broadly useful composition may justify an Oatbase component; a one-off docs arrangement does not.
- **Compatibility enhancers** repair or extend optional behavior and should be separate entry points when their global cost is not universally useful.

Basecoat and other libraries are coverage and API research inputs, not implementation templates. Match the useful product need while retaining Oat's smaller, native-first model.

## Ownership decision

Before adding a component, answer in order:

1. Can semantic HTML satisfy the requirement with Oat styling? Document that Oat-native pattern.
2. Does Oat already ship the component or behavior? Reuse it and classify the docs entry as `Oat core`.
3. Is the missing behavior broadly reusable across Oat applications? Add the smallest Oatbase extension.
4. Is it only a composition of existing pieces for one screen or example? Keep it in the application/docs.
5. Does it add global listeners or compatibility behavior that most pages do not need? Prefer an explicit opt-in entry.

The tooltip boundary is the model example: Oat owns the tooltip; `tooltip-compat` is separately loaded for viewport flipping, shifting, hoverable content, and Escape dismissal. Neither aggregate pays its five listeners.

## Enhancement contract

For JavaScript-enhanced controls:

- Keep the native form element in light DOM and make it the source of truth.
- Generate presentation around it; do not replace its value, validity, disabled state, form reset, or submission semantics with parallel state.
- Synchronize programmatic value changes and native `change` events.
- Emit an Oatbase event only when it provides useful component-level detail.
- Implement the expected keyboard model and stable accessible name, role, state, focus, and active-descendant behavior.
- Use `AbortController` for instance listeners and cleanup on disconnect.
- Centralize delegated document listeners used by multiple instances. Preserve compatibility hooks that tests or consumers already use unless a breaking change is deliberate.
- Avoid runtime dependencies.

## Styling and themes

Oat owns appearance. Consume variables such as `--background`, `--foreground`, `--card`, `--primary`, `--border`, `--input`, `--ring`, spacing, radius, type, motion, shadow, and z-index tokens.

An Oatbase custom property is justified only for component geometry that applications plausibly need to tune. Prefix it `--oatbase-` and use it at the declaration site with a fallback:

```css
width: var(--oatbase-command-width, min(40rem, calc(100% - var(--space-8))));
```

Themes remap the Oat semantic variables. They must not ship parallel component rules, JavaScript providers, or theme-specific markup. Density and radius are scoped token remaps rather than separate component APIs.

## Distribution boundaries

- `@oddship/oatbase` and `@oddship/oatbase/css` are the complete Oat-inclusive boundary.
- `@oddship/oatbase/extensions` and `extensions.css` are for projects that already load Oat.
- Every Oatbase addition should be independently importable when technically useful.
- Optional compatibility behavior belongs outside both aggregates unless the user explicitly chooses a different tradeoff.
- The package remains self-contained: no required peer dependency on Oat for the complete bundle.

## Public distribution claims

- Describe the complete bundle as self-contained with no external runtime dependency. Do not generalize that statement to extension-only entry points: those deliberately assume the application already loads Oat.
- Before the first public release, document the local source-checkout workflow and its real build prerequisites. Do not publish speculative npm, unpkg, jsDelivr, or other registry URLs as if they work.
- When registry publication becomes real, update installation copy as one release-boundary change rather than leaving conflicting local and published instructions.
- Keep package scope, repository URL, export paths, visible version, cache busters, and package-manager examples consistent.
- Treat bundle-size claims as measured release facts. Prefer thresholds in durable introductory copy and exact current measurements in release-oriented copy; rerun the reporter before changing either.
