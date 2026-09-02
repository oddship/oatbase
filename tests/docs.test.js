import { describe, expect, test } from 'bun:test';
import { readFile, readdir } from 'node:fs/promises';

globalThis.window = {};
await import('../docs/components.js');
const components = globalThis.window.OATBASE_COMPONENTS;
const basecoatSlugs = [
  'accordion', 'alert', 'alert-dialog', 'avatar', 'badge', 'breadcrumb', 'button',
  'button-group', 'card', 'chart', 'checkbox', 'combobox', 'command', 'dialog',
  'drawer', 'dropdown-menu', 'empty', 'field', 'input', 'input-group', 'item', 'kbd',
  'label', 'native-select', 'pagination', 'popover', 'progress', 'radio-group', 'select',
  'scroll-area', 'sidebar', 'skeleton', 'slider', 'spinner', 'switch', 'table', 'tabs',
  'textarea', 'theme-switcher', 'toast', 'tooltip'
];
const expandedSlugs = [
  'action-field', 'callout', 'copy-button', 'multiselect', 'password-field', 'rating', 'segmented-control',
  'splitter', 'stat', 'stepper', 'timeline', 'tree', 'toggle', 'toolbar', 'choice-card',
  'otp-input', 'grid', 'tag-input', 'upload', 'lightbox', 'scrollspy', 'footnotes',
  'reading-progress', 'data-table', 'description-list', 'prose', 'log-viewer', 'repeater'
];

const documentedMarkup = component => [
  component.markup,
  ...(component.examples || []).map(example => example.markup)
].filter(Boolean).join('\n');

describe('component coverage', () => {
  test('covers every Basecoat 1.0 component exactly once', () => {
    expect(components).toHaveLength(69);
    expect(new Set(components.map(component => component.slug)).size).toBe(69);
    for (const slug of basecoatSlugs) expect(components.some(component => component.slug === slug)).toBe(true);
    expect(components.map(component => component.slug).sort()).toEqual([...basecoatSlugs, ...expandedSlugs].sort());
  });

  test('gives every component a documented implementation path', async () => {
    const docs = await readFile(new URL('../docs/index.html', import.meta.url), 'utf8');
    for (const component of components) {
      expect(component.name).toBeTruthy();
      expect(component.description).toBeTruthy();
      expect(['Oat core', 'Oatbase']).toContain(component.source);
      const hasGeneratedPreview = Boolean(component.markup || component.examples?.length);
      const hasDedicatedPage = docs.includes(`data-page="/components/${component.slug}"`);
      expect(hasGeneratedPreview || hasDedicatedPage).toBe(true);
    }
  });

  test('marks JavaScript only where behavior requires it', () => {
    const oatbaseWebComponents = components
      .filter(component => component.source === 'Oatbase' && component.js)
      .map(component => component.slug);
    expect(oatbaseWebComponents).toEqual([
      'action-field', 'combobox', 'command', 'select', 'theme-switcher', 'copy-button',
      'multiselect', 'password-field', 'splitter', 'log-viewer', 'repeater', 'tree', 'toggle', 'toolbar', 'otp-input',
      'lightbox', 'scrollspy', 'footnotes', 'reading-progress', 'data-table'
    ]);
  });

  test('maps core components instead of duplicating them', () => {
    expect(components.filter(component => component.source === 'Oat core')).toHaveLength(34);
    expect(components.filter(component => component.source === 'Oatbase')).toHaveLength(35);
  });

  test('maps every component stylesheet and custom element shipped by Oat', async () => {
    const cssDir = new URL('../node_modules/@knadh/oat/css/', import.meta.url);
    const componentFiles = (await readdir(cssDir))
      .filter(file => file.endsWith('.css'))
      .map(file => file.replace('.css', ''))
      .filter(file => !['00-base', '01-theme', 'animations', 'utilities'].includes(file));
    const cssToDocs = {
      accordion: ['accordion'], alert: ['alert'], avatar: ['avatar'], badge: ['badge'],
      button: ['button', 'button-group', 'pagination'], card: ['card'],
      dialog: ['dialog', 'alert-dialog'], dropdown: ['dropdown-menu', 'popover'],
      form: ['checkbox', 'field', 'input', 'input-group', 'label', 'native-select', 'radio-group', 'slider', 'switch', 'textarea'],
      grid: ['grid'], progress: ['progress'], sidebar: ['sidebar'], skeleton: ['skeleton'],
      spinner: ['spinner'], table: ['table'], tabs: ['tabs'], taginput: ['tag-input'],
      toast: ['toast'], tooltip: ['tooltip'], upload: ['upload']
    };
    expect(componentFiles.sort()).toEqual(Object.keys(cssToDocs).sort());
    for (const slugs of Object.values(cssToDocs)) {
      for (const slug of slugs) expect(components.some(component => component.slug === slug)).toBe(true);
    }

    const customElementToDocs = {
      'ot-dropdown': 'dropdown-menu', 'ot-tabs': 'tabs',
      'ot-taginput': 'tag-input', 'ot-upload': 'upload'
    };
    const jsDir = new URL('../node_modules/@knadh/oat/js/', import.meta.url);
    const definitions = [];
    for (const file of (await readdir(jsDir)).filter(file => file.endsWith('.js'))) {
      const source = await readFile(new URL(file, jsDir), 'utf8');
      definitions.push(...[...source.matchAll(/customElements\.define\('([^']+)'/g)].map(match => match[1]));
    }
    expect(definitions.sort()).toEqual(Object.keys(customElementToDocs).sort());
    for (const slug of Object.values(customElementToDocs)) {
      expect(components.some(component => component.slug === slug)).toBe(true);
    }
  });

  test('demonstrates the full Oat avatar surface without duplicating it', () => {
    const avatar = components.find(component => component.slug === 'avatar');
    expect(avatar.source).toBe('Oat core');
    const markup = documentedMarkup(avatar);
    expect(markup).toContain('<img');
    expect(markup).toContain('class="small"');
    expect(markup).toContain('class="large"');
    expect(markup.match(/role="group"/g)).toHaveLength(3);
  });

  test('documents high-value variants and states instead of one happy path', () => {
    const surface = slug => documentedMarkup(components.find(component => component.slug === slug));
    expect(surface('button')).toContain('class="large"');
    expect(surface('button')).toContain('class="icon');
    expect(surface('badge')).toContain('badge outline');
    expect(surface('field')).toContain('aria-invalid="true"');
    expect(surface('progress')).toContain('<meter');
    expect(surface('skeleton')).toContain('role="status" class="skeleton box"');
    expect(surface('spinner')).toContain('data-spinner="overlay"');
    expect(surface('table')).toContain('class="table"');
    expect(surface('tooltip')).toContain('data-tooltip-placement="right"');
    const tooltip = components.find(component => component.slug === 'tooltip');
    expect(tooltip.imports).toContain("@oddship/oatbase/tooltip-compat.css");
    expect(tooltip.imports).toContain("@oddship/oatbase/tooltip-compat");
    expect(tooltip.usageNote).toContain('separately loaded');
    expect(surface('chart')).toContain('data-chart-legend');
    expect(surface('scroll-area')).toContain('data-orientation="horizontal"');
    expect(surface('scroll-area')).not.toContain('scroll-area card hstack');
    expect(surface('scroll-area')).toContain('aria-label="Day itinerary"');
    expect(surface('scroll-area')).not.toContain('Ideas waiting for review');
    expect(surface('toolbar')).toContain('aria-orientation="vertical"');
    expect(surface('splitter')).toContain('aria-orientation="vertical"');
    expect(surface('item')).toContain('data-unread');
    expect(surface('empty')).toContain('data-layout="inline"');
    expect(surface('data-table')).toContain('<table>');
    expect(surface('data-table')).toContain('data-table-select-row');
    expect(surface('combobox')).toContain('data-allow-custom');
    expect(surface('stepper')).toContain('data-variant="status"');
    expect(surface('repeater')).toContain('template data-repeater-template');
    expect(surface('log-viewer')).toContain('role="log"');
    expect(surface('log-viewer')).toContain('data-log-append');
    expect(surface('description-list')).toContain('<dl data-description-list');
    expect(surface('prose')).toContain('<article data-prose>');
    expect(surface('choice-card')).toContain('type="checkbox"');
    expect(surface('choice-card')).toContain('disabled');
    expect(surface('toast')).toContain("{ variant: 'warning'");
    expect(surface('action-field')).toContain('href="mailto:');
    expect(surface('action-field')).toContain('data-action-field-actions');
    expect(surface('action-field')).toContain('data-copy-button');
  });

  test('supports named examples and generated API sections', async () => {
    const source = await readFile(new URL('../docs/docs.js', import.meta.url), 'utf8');
    expect(source).toContain('component.examples?.length');
    expect(source).toContain('data-component-example');
    expect(source).toContain('component.api?.length');
    expect(source).toContain("example.popup ? ' data-popup' : ''");
  });

  test('shows complete HTML and JavaScript usage for behavioral components', async () => {
    const [script, docs] = await Promise.all([
      readFile(new URL('../docs/docs.js', import.meta.url), 'utf8'),
      readFile(new URL('../docs/index.html', import.meta.url), 'utf8')
    ]);
    expect(script).toContain('function componentJavaScript(component, example = {})');
    expect(script).toContain('examples[index].mount?.(preview)');
    expect(script).toContain('data-code-kind="html"');
    expect(script).toContain('data-code-kind="javascript"');
    expect(script).toContain('>JavaScript</button>');
    expect(script).toContain("tag === 'template' ? node.content.childNodes : node.childNodes");
    expect(docs).toContain('data-view="javascript" data-code-kind="javascript"');
    expect(docs).toContain("import '@oddship/oatbase/command';");
  });

  test('keeps demo actions outside ARIA tablists', async () => {
    const [docs, script] = await Promise.all([
      readFile(new URL('../docs/index.html', import.meta.url), 'utf8'),
      readFile(new URL('../docs/docs.js', import.meta.url), 'utf8')
    ]);
    for (const source of [docs, script]) {
      expect(source).not.toMatch(/class="demo-toolbar"[^>]*role="tablist"/);
      expect(source).toContain('class="demo-tabs" role="tablist"');
    }
  });

  test('documents keyboard-focusable named scroll regions and valid stat definitions', () => {
    const scrollArea = documentedMarkup(components.find(component => component.slug === 'scroll-area'));
    const scrollspy = documentedMarkup(components.find(component => component.slug === 'scrollspy'));
    const reading = documentedMarkup(components.find(component => component.slug === 'reading-progress'));
    for (const markup of [scrollArea, scrollspy, reading]) {
      expect(markup).toContain('role="region"');
      expect(markup).toContain('aria-label=');
      expect(markup).toContain('tabindex="0"');
    }

    const stat = documentedMarkup(components.find(component => component.slug === 'stat'));
    expect(stat).not.toMatch(/<\/dd><small>/);
    expect(stat).toMatch(/<dd>[^<]+<small>/);
  });

  test('ships complete iframe examples with visible, copyable source', async () => {
    const [docs, examples, script, styles] = await Promise.all([
      readFile(new URL('../docs/index.html', import.meta.url), 'utf8'),
      readFile(new URL('../docs/examples.js', import.meta.url), 'utf8'),
      readFile(new URL('../docs/docs.js', import.meta.url), 'utf8'),
      readFile(new URL('../docs/docs.css', import.meta.url), 'utf8')
    ]);
    expect(docs).toContain('data-page="/examples"');
    expect(docs).toContain('data-full-examples');
    expect(examples.match(/<!doctype html>/g)).toHaveLength(6);
    expect(examples).toContain('data-sidebar-layout="always"');
    expect(examples).toContain('<ot-password');
    expect(examples).toContain('<ot-reading-progress');
    expect(examples).toContain('<ot-lightbox>');
    expect(examples).toContain('<ot-data-table');
    expect(examples).toContain('<ot-splitter');
    expect(examples).toContain('<ot-log-viewer>');
    expect(examples).toContain('data-variant="status"');
    expect(examples).toContain('<section class="col-9">\n      <ot-footnotes>');
    expect(examples).not.toContain('<ot-footnotes class="col-9">');
    expect(examples).toContain('../dist/oatbase.css');
    expect(examples).not.toContain('unpkg.com');
    expect(script).toContain('function buildFullExamples()');
    expect(script).toContain("section.querySelector('.demo-frame').srcdoc = example.source");
    expect(script).toContain("highlightSource(section.querySelector('[data-code] code'), example.source.trim())");
    expect(script).toContain('sandbox="allow-scripts allow-forms allow-modals"');
    expect(script).toContain('referrerpolicy="no-referrer"');
    expect(script).not.toContain('allow-same-origin');
    expect(script).toContain("--demo-frame-height:${example.height || '35rem'}");
    expect(script).not.toMatch(/demo-frame[^>]+height:[^>]+px/);
    expect(styles).toContain('height: var(--demo-frame-height, 35rem);');
    expect(styles).toContain('.demo-frame[hidden] { display: none; }');
  });

  test('dogfoods Oat and Oatbase primitives in every full example', async () => {
    const examples = await readFile(new URL('../docs/examples.js', import.meta.url), 'utf8');
    const required = {
      'project-dashboard': ['data-sidebar-layout', 'data-stats', 'data-variant="chart"', 'class="item"', 'class="badge"'],
      'account-settings': ['<ot-select>', '<ot-password', 'data-choice-cards', 'data-callout', 'role="switch"'],
      'long-form-article': ['<ot-reading-progress', '<ot-scrollspy', '<ot-footnotes>', '<ot-lightbox>', '<ot-toolbar', 'data-prose']
      ,'data-management': ['<ot-data-table', 'data-table-filter', '<ot-toolbar', 'data-variant="empty"']
      ,'master-detail-inbox': ['<ot-splitter', 'class="item"', 'data-prose', '<ot-toolbar']
      ,'workflow-execution': ['<ot-splitter', '<ot-log-viewer', 'data-variant="status"', 'class="item"', '<ot-toolbar']
    };
    for (const [slug, primitives] of Object.entries(required)) {
      const start = examples.indexOf(`slug: '${slug}'`);
      const next = examples.indexOf('\n  {', start + 1);
      const source = examples.slice(start, next === -1 ? undefined : next);
      for (const primitive of primitives) expect(source).toContain(primitive);
    }
  });

  test('separates Oat core patterns from Oatbase extensions in navigation', async () => {
    const docs = await readFile(new URL('../docs/index.html', import.meta.url), 'utf8');
    expect(docs).toContain('data-source="Oat core"');
    expect(docs).toContain('data-source="Oatbase"');
    expect(docs).toContain('data-variant="inline" class="docs-search-shortcut">⌘ K</kbd>');
    expect(docs).toContain('its <code>--radius-*</code> scale');
    expect(docs).toContain('data-page="/customizing"');
    expect(docs).toContain('data-page="/recipes"');
    expect(docs).toContain('class="docs-theme-lab"');
    expect(docs).toContain('data-theme-preset');
    expect(docs).toContain("localStorage.getItem('oatbase-theme')");
    expect(docs).toContain('oddship/doordarshan-zola');
    expect(docs.match(/class="docs-theme-control"/g)).toHaveLength(2);
    expect(docs.match(/class="docs-theme-control-label"/g)).toHaveLength(3);
    expect(docs).not.toContain('<link rel="stylesheet" href="https://unpkg.com/@knadh/oat');
    expect(docs).not.toContain('<script src="https://unpkg.com/@knadh/oat');
    expect(docs).toContain('Oat’s CSS and JavaScript are already included.');
    expect(documentedMarkup(components.find(component => component.slug === 'theme-switcher'))).toContain('data-target="#theme-explicit-preview"');
  });

  test('documents the unreleased local installation path without dead registry URLs', async () => {
    const [docs, readme] = await Promise.all([
      readFile(new URL('../docs/index.html', import.meta.url), 'utf8'),
      readFile(new URL('../README.md', import.meta.url), 'utf8')
    ]);
    for (const source of [docs, readme]) {
      expect(source).toContain('has not been published');
      expect(source).toContain('npm install ../oatbase');
      expect(source).toContain("@oddship/oatbase/css");
      expect(source).not.toContain('https://unpkg.com/oatbase');
      expect(source).not.toContain('npm install oatbase\n');
    }
    expect(docs).toContain('id="local-package"');
    expect(docs).toContain('id="static-files"');
    expect(docs).toContain('<code>nix develop</code>');
    expect(docs).toContain('Bun, Node.js/npm, and GNU Make');
  });

  test('documents recipes as copyable compositions with explicit ownership boundaries', async () => {
    const docs = await readFile(new URL('../docs/index.html', import.meta.url), 'utf8');
    const start = docs.indexOf('data-page="/recipes"');
    const recipes = docs.slice(start, docs.indexOf('data-page="/examples"', start));
    expect(recipes).toContain('Copyable compositions:');
    expect(recipes).toContain('Fetching, validation, permissions, persistence, and mutations stay in application code.');
    expect(recipes.match(/<details><summary>/g)).toHaveLength(11);
    expect(recipes.match(/<ot-copy class="vstack">/g)).toHaveLength(11);
    expect(recipes).toContain('href="#/components/data-table"');
    expect(recipes).toContain('href="#/components/repeater"');
    expect(recipes).toContain("const projects = document.querySelector('#projects');");
  });

  test('documents the complete Command public surface', async () => {
    const docs = await readFile(new URL('../docs/index.html', import.meta.url), 'utf8');
    const start = docs.indexOf('data-page="/components/command"');
    const command = docs.slice(start, docs.indexOf('data-page="/components/drawer"', start));
    for (const surface of [
      'id="command-api"', 'data-command-open / data-command-close',
      'data-keep-open', 'items / visibleItems', 'open() / close()',
      'oatbase:select', 'oatbase:open / oatbase:close'
    ]) expect(command).toContain(surface);
  });

  test('keeps public documentation free of internal prototype release fixtures', async () => {
    const [docs, components, examples, readme] = await Promise.all([
      readFile(new URL('../docs/index.html', import.meta.url), 'utf8'),
      readFile(new URL('../docs/components.js', import.meta.url), 'utf8'),
      readFile(new URL('../docs/examples.js', import.meta.url), 'utf8'),
      readFile(new URL('../README.md', import.meta.url), 'utf8')
    ]);
    expect(components).not.toContain('Completed the component-documentation surface audit');
    expect(components).not.toContain('Expanded Avatar coverage');
    expect(`${docs}\n${components}\n${examples}`).not.toMatch(/>Today<|Updated today|Updated yesterday|Updated last week/);
    expect(readme).toContain('## Complete component coverage');
    expect(readme).not.toContain('## Full component port');
    expect(readme).toContain('requires no external runtime dependencies');
  });

  test('uses the Oddship package scope for every documented package import', async () => {
    const files = await Promise.all([
      readFile(new URL('../docs/index.html', import.meta.url), 'utf8'),
      readFile(new URL('../docs/docs.js', import.meta.url), 'utf8'),
      readFile(new URL('../README.md', import.meta.url), 'utf8'),
      readFile(new URL('../THEMING.md', import.meta.url), 'utf8')
    ]);
    for (const source of files) {
      expect(source).not.toMatch(/import ['"]oatbase(?:\/|['"])/);
      expect(source).not.toMatch(/`oatbase\//);
    }
    expect(files.join('\n')).toContain("import '@oddship/oatbase/drawer.css';");
  });

  test('dogfoods existing primitives in recent overview and catalog surfaces', async () => {
    const [docs, scripts, styles] = await Promise.all([
      readFile(new URL('../docs/index.html', import.meta.url), 'utf8'),
      readFile(new URL('../docs/docs.js', import.meta.url), 'utf8'),
      readFile(new URL('../docs/docs.css', import.meta.url), 'utf8')
    ]);
    expect(docs).toContain('class="card row gap-6 items-center docs-home-install"');
    expect(docs).toContain('complete Oat-inclusive CSS and JavaScript stays under 28&nbsp;kB gzipped');
    expect(docs).toContain('extension-only layer stays under 18&nbsp;kB');
    expect(docs).toContain('Individual entries let applications pay only for the pieces they use.');
    expect(docs).toContain('class="row gap-2 mt-6 docs-home-layers"');
    expect(docs).toContain('class="item col-6" data-variant="outline"');
    expect(docs).not.toContain('<span aria-hidden="true">→</span>');
    expect(docs).toContain('class="row gap-2 docs-component-grid"');
    expect(docs).toContain('data-title="Blocks"');
    const startingPoints = docs.match(/<div class="row gap-2 docs-component-grid"[\s\S]*?<\/div>/)?.[0];
    expect(startingPoints).not.toContain('data-variant="outline"');
    expect(scripts).toContain('componentGridLink(component, { outlined: false })');
    expect(docs).toContain('class="group docs-catalog-search"');
    expect(docs).toContain('class="badge docs-catalog-count"');
    expect(docs).toContain('data-variant="empty" data-catalog-empty hidden');
    expect(styles).not.toContain('.docs-home-layers {');
    expect(styles).not.toContain('.docs-component-grid {');
    expect(styles).not.toContain('.docs-catalog-search svg');
    expect(styles).not.toContain('.docs-home-layer-accent');
  });

  test('documents theming as Oat tokens plus scoped Oatbase geometry', async () => {
    const [contract, docs, styles] = await Promise.all([
      readFile(new URL('../THEMING.md', import.meta.url), 'utf8'),
      readFile(new URL('../docs/index.html', import.meta.url), 'utf8'),
      readFile(new URL('../docs/docs.css', import.meta.url), 'utf8')
    ]);
    expect(contract).toContain('Oat owns the visual language');
    expect(contract).toContain('--oatbase-otp-cell-size');
    expect(docs).toContain('No parallel theme:');
    expect(docs).toContain('data-segmented');
    expect(styles).toContain('.docs-theme-lab:has(');
    expect(styles).toContain('.docs-theme-control > [data-segmented]');
    expect(styles).not.toContain('--primary: light-dark(#315c45');
  });

  test('exports every Oatbase addition independently', async () => {
    const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
    for (const component of components.filter(component => component.source === 'Oatbase')) {
      expect(pkg.exports[`./${component.slug}.css`]).toBeTruthy();
      if (component.js) expect(pkg.exports[`./${component.slug}`]).toBeTruthy();
    }
  });

  test('keeps formatted example code hidden until its tab is selected', async () => {
    const [script, styles, docs] = await Promise.all([
      readFile(new URL('../docs/docs.js', import.meta.url), 'utf8'),
      readFile(new URL('../docs/docs.css', import.meta.url), 'utf8'),
      readFile(new URL('../docs/index.html', import.meta.url), 'utf8')
    ]);
    expect(script).toContain('function formatMarkup(markup)');
    expect(script).toContain('function highlightMarkup(codeElement, markup)');
    expect(script).toContain("highlightMarkup(section.querySelector('[data-code-kind=\"html\"] code'), examples[index].markup)");
    expect(script).toContain("demo.addEventListener('ot-tab-change'");
    expect(script).toContain("event.target.method !== 'dialog'");
    expect(script).toContain("metadata.setAttribute('aria-label', 'Component metadata')");
    expect(script).toContain("item.className = 'badge'");
    expect(script).not.toContain("navigator.clipboard.writeText");
    expect(script).not.toContain("const themeButton");
    expect(styles).toContain('.demo-code[hidden] { display: none; }');
    expect(styles).toContain('padding: var(--space-4);');
    expect(styles).toContain('.demo-preview[data-popup] { min-height: 26rem; }');
    expect(styles).toContain('"left . right"');
    expect(docs).toContain('class="docs-drawer-controls"');
    for (const side of ['top', 'right', 'bottom', 'left']) {
      expect(docs).toContain(`data-drawer-control="${side}"`);
    }
    expect(styles).toContain('.syntax-tag { color: var(--docs-syntax-tag); }');
    expect(styles).not.toContain('.docs-search-shortcut {');
    expect(styles).not.toContain('.docs-meta [role="listitem"]');
    expect(styles).not.toContain('[data-theme-toggle]::after');
    expect(styles).not.toContain('.docs-stat');
    expect(styles).not.toContain('.docs-callout');
  });
});
