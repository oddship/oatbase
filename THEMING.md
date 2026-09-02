# Theming Oatbase

Oat owns the visual language. Oatbase inherits it and adds only component structure.

## Contract

- Oat’s semantic color, type, spacing, radius, shadow, motion, and layering variables are the global theme API.
- Oatbase does not replace Oat’s root contract and does not ship a theme provider or configuration runtime. Optional preset selectors remap the same variables through the ordinary cascade.
- Oatbase-specific custom properties describe component geometry that Oat cannot express. They are prefixed with `--oatbase-` and always have a fallback at the declaration site.
- Overrides work through the ordinary CSS cascade: globally, within a subtree, or on one component.
- System, light, and dark are appearance modes, not separate component themes.

The complete Oatbase stylesheet already includes Oat. Place custom overrides after that stylesheet. With extension-only imports, load Oat first; the extensions themselves can be loaded before or after the overrides because they read variables where each component is rendered.

```css
:root {
  --primary: light-dark(#315c45, #9bd4b4);
  --primary-foreground: light-dark(#fff, #102117);
  --background: light-dark(#faf8f2, #10110f);
  --card: light-dark(#fff, #181a17);
  --font-sans: Inter, system-ui, sans-serif;
  --radius-medium: 0.25rem;
}
```

## Component hooks

Use a component hook only when the component’s geometry needs to differ from its default.

| Hook | Default | Purpose |
| --- | --- | --- |
| `--oatbase-overlay-background` | `rgb(0 0 0 / 0.45)` | Command and drawer backdrop |
| `--oatbase-drawer-size` | `min(28rem, 90vw)` | Left and right drawer size |
| `--oatbase-drawer-max-height` | `min(85dvh, 48rem)` | Top and bottom drawer limit |
| `--oatbase-drawer-motion-offset` | `1.5rem` | Drawer entrance and exit distance |
| `--oatbase-command-width` | `min(40rem, calc(100% - var(--space-8)))` | Command dialog width |
| `--oatbase-command-max-height` | `min(34rem, calc(100dvh - var(--space-8)))` | Command dialog height limit |
| `--oatbase-command-list-max-height` | `min(27rem, 65dvh)` | Command results height limit |
| `--oatbase-listbox-max-height` | `min(18rem, 50dvh)` | Combobox, Select, and Multiselect popup limit |
| `--oatbase-otp-cell-size` | `3rem` | OTP cell size |
| `--oatbase-otp-gap` | `var(--space-2)` | Gap between OTP cells |
| `--oatbase-chart-height` | `12rem` | Minimum chart plotting height |
| `--oatbase-chart-grid-size` | `3rem` | Chart grid interval |
| `--oatbase-splitter-min-height` | `14rem` | Minimum splitter height |
| `--oatbase-splitter-handle-size` | `0.75rem` | Splitter handle hit area |
| `--oatbase-splitter-grip-size` | `2.5rem` | Splitter grip length |
| `--oatbase-empty-min-height` | `15rem` | Minimum empty-state height |
| `--oatbase-empty-compact-min-height` | `8rem` | Compact empty-state minimum height |
| `--oatbase-empty-content-width` | `32rem` | Empty-state content width limit |
| `--oatbase-scrollbar-size` | `0.625rem` | Scroll Area scrollbar thickness |
| `--oatbase-toolbar-offset` | `var(--space-3)` | Sticky toolbar offset |
| `--oatbase-stepper-marker-size` | `2rem` | Stepper marker size |
| `--oatbase-stepper-track-size` | `0.5rem` | Stepper progress-track thickness |
| `--oatbase-timeline-marker-size` | `0.75rem` | Timeline marker size |
| `--oatbase-rating-size` | `1.75rem` | Rating symbol size |
| `--oatbase-stat-value-size` | `1.75rem` | Statistic value size |
| `--oatbase-lightbox-width` | `min(72rem, calc(100% - var(--space-8)))` | Lightbox dialog width |
| `--oatbase-lightbox-image-height` | `calc(100dvh - 12rem)` | Lightbox image height limit |
| `--oatbase-footnote-width` | `min(24rem, calc(100% - var(--space-8)))` | Footnote preview width |
| `--oatbase-footnote-max-height` | `min(18rem, calc(100dvh - var(--space-8)))` | Footnote preview height limit |
| `--oatbase-prose-width` | `68ch` | Prose measure |
| `--oatbase-log-min-height` | `12rem` (`8rem` in compact density) | Log output minimum height |
| `--oatbase-log-max-height` | `28rem` | Log output maximum height |

```css
.verification-code {
  --oatbase-otp-cell-size: 2.75rem;
  --oatbase-otp-gap: var(--space-1);
}
```

Do not mirror every declaration as a custom property. A public hook should represent a useful, safe customization that preserves semantics, keyboard behavior, and accessibility.

## Appearance modes

Oat uses `color-scheme` and `light-dark()`. The Oatbase theme switcher persists `system`, `light`, or `dark`, updates `color-scheme`, and sets `data-theme="light|dark"` for explicit choices. System mode removes the attribute and follows the operating system.

## Optional presets

Oatbase ships four alternative token maps and an explicit Oat reset for nested scopes. Oat’s unmodified palette remains the default at the document root.

```js
// Load every preset, including the scoped Oat reset.
import '@oddship/oatbase/themes';

// Or load one preset.
import '@oddship/oatbase/themes/doordarshan.css';
```

Apply a preset globally or to a subtree:

```html
<html data-oat-theme="doordarshan">

<section data-oat-theme="forest">
  <!-- Only this subtree uses Forest. -->
</section>

<section data-oat-theme="oat">
  <!-- Restores Oat even when an ancestor uses another preset. -->
</section>
```

Available values are `oat`, `doordarshan`, `forest`, `ocean`, and `paper`. Remove `data-oat-theme` to restore Oat at the document root; use `data-oat-theme="oat"` to restore it inside a themed ancestor. Preset selection and light/dark appearance are deliberately independent.

The Doordarshan preset maps the palette and typography from [oddship/doordarshan-zola](https://github.com/oddship/doordarshan-zola) into Oat variables. It references IBM Plex Mono first and falls back to the system monospace stack; applications may load the font separately.

## Density

Density is a scoped remapping of Oat’s spacing scale, not a component variant. Apply it to a subtree when both Oat and Oatbase controls in that area should become denser.

```css
[data-density="compact"] {
  --space-1: 0.1875rem;
  --space-2: 0.375rem;
  --space-3: 0.5625rem;
  --space-4: 0.75rem;
}
```

Keep touch targets and form usability intact when reducing density.
