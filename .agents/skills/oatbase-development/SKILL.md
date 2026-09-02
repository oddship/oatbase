---
name: oatbase-development
description: Develop, document, theme, optimize, or audit the Oatbase component library while preserving Oat UI's native-first ownership and token contracts. Use for work inside the Oatbase source checkout; do not use for unrelated component libraries or ordinary application UI work.
---

# Oatbase Development

Treat Oatbase as a focused extension layer for Oat, not a second foundation. Deliver the smallest coherent change that keeps semantic HTML, progressive enhancement, package boundaries, documentation, and verification aligned.

## Route the task

- Read [references/product-and-ownership.md](references/product-and-ownership.md) when deciding whether something belongs to Oat core, Oatbase, application composition, or an opt-in compatibility layer. Also read it for theming or public API decisions.
- Read [references/component-and-docs.md](references/component-and-docs.md) when adding or changing a component, entry point, example, recipe, generated docs page, public content, or distribution file.
- Read [references/verification.md](references/verification.md) for performance work, CSS consistency, accessibility audits, rendered documentation, browser behavior, release checks, or any change that affects shared infrastructure.

Read only the references relevant to the request. For a component addition or significant refactor, read all three.

## Non-negotiable decisions

1. Inspect Oat and the existing Oatbase registry before inventing a primitive. Reuse or document Oat when it already owns the behavior.
2. Prefer semantic native HTML and CSS. Add JavaScript only for behavior the platform and Oat do not provide.
3. Keep the native element as the source of truth for enhanced controls. Preserve no-JavaScript behavior, native form submission, disabled/reset states, and ordinary events.
4. Use Oat's semantic tokens for appearance. Expose only useful geometry hooks, prefix them `--oatbase-`, and provide local fallbacks.
5. Do not add permanent global listeners to an aggregate for optional behavior. Delegate one shared listener when many instances need the same behavior, or ship an explicit opt-in entry point.
6. Measure raw, gzip, and Brotli output. Reject abstractions that improve source aesthetics while worsening transfer size or runtime behavior.
7. Dogfood Oat and Oatbase in the documentation. Keep `docs.css` for documentation shell/layout needs, not reusable product patterns.

## Working method

- Inspect the related source, package exports, Makefile targets, documentation registry, and tests before editing.
- Preserve unrelated user changes and existing ownership boundaries.
- Keep source, checked-in `dist/`, documentation imports, tests, and visible version/cache-buster values consistent when the requested change affects them. Do not bump a version for read-only analysis.
- Keep release copy truthful to the current state: distinguish the complete self-contained bundle from extension-only imports, and distinguish local-checkout instructions from published registry or CDN instructions.
- Prefer focused entry points over forcing every feature into the complete or extension aggregate.
- Verify behavior in proportion to risk. A visual preview alone is not evidence that keyboard, fallback, event, form, theme, or compressed-size contracts still hold.
- When reviewing rendered docs, confirm that the browser is serving the current canonical checkout. A stale in-memory page or an occupied development port is not verification.

## Completion

Report the outcome, meaningful bundle deltas, and verification performed. Mention deliberately rejected optimizations when measurement showed they were regressions. Do not claim all browsers or all WCAG criteria passed unless those checks actually ran.
