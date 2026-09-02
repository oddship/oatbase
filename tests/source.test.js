import { describe, expect, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const root = new URL('../', import.meta.url);

describe('package', () => {
  test('publishes all declared entry points', async () => {
    const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
    expect(pkg.name).toBe('@oddship/oatbase');
    expect(pkg.publishConfig).toEqual({ access: 'public' });
    expect(pkg.repository.url).toBe('git+https://github.com/oddship/oatbase.git');
    const exported = Object.values(pkg.exports).flatMap(value => typeof value === 'string' ? [value] : Object.values(value));
    const paths = [pkg.main, pkg.module, pkg.style, ...exported];
    for (const path of paths) {
      expect((await Bun.file(new URL(path, root)).exists())).toBe(true);
    }
  });

  test('publishes a truthful component dependency manifest', async () => {
    const manifest = JSON.parse(await readFile(new URL('components.json', root), 'utf8'));
    expect(manifest.version).toBe('0.1.0');
    expect(manifest.package).toBe('@oddship/oatbase');
    expect(manifest.components.find(component => component.name === 'data-table')).toEqual(expect.objectContaining({
      implementation: 'javascript', dependencies: []
    }));
    expect(manifest.optIns.find(component => component.name === 'tooltip-compat')).toBeTruthy();
  });

  test('keeps the complete browser payload below 28 KB compressed', async () => {
    const css = await Bun.file(new URL('dist/oatbase.min.css', root)).arrayBuffer();
    const js = await Bun.file(new URL('dist/oatbase.min.js', root)).arrayBuffer();
    const compressedBytes = gzipSync(Buffer.concat([Buffer.from(css), Buffer.from(js)])).byteLength;
    expect(compressedBytes).toBeLessThan(28_000);
  });

  test('keeps the extension-only browser payload below 18 KB compressed', async () => {
    const css = await Bun.file(new URL('dist/extensions.min.css', root)).arrayBuffer();
    const js = await Bun.file(new URL('dist/extensions.min.js', root)).arrayBuffer();
    const compressedBytes = gzipSync(Buffer.concat([Buffer.from(css), Buffer.from(js)])).byteLength;
    expect(compressedBytes).toBeLessThan(18_000);
  });
});

describe('source', () => {
  test('uses Oat tokens instead of hard-coded component colors', async () => {
    const css = await readFile(new URL('src/css/extensions.css', root), 'utf8');
    expect(css).toContain('./components/combobox.css');
    expect(css).toContain('./components/drawer.css');

    const bundle = await readFile(new URL('dist/oatbase.css', root), 'utf8');
    for (const token of ['--foreground', '--card', '--border', '--accent', '--z-dropdown']) {
      expect(bundle).toContain(`var(${token})`);
    }
  });

  test('makes the default bundle self-contained and preserves extension-only entries', async () => {
    const [pkg, fullCss, fullJs, extensionCss, extensionJs, tooltipCss, tooltipJs, notice] = await Promise.all([
      readFile(new URL('package.json', root), 'utf8').then(JSON.parse),
      readFile(new URL('dist/oatbase.css', root), 'utf8'),
      readFile(new URL('dist/oatbase.js', root), 'utf8'),
      readFile(new URL('dist/extensions.css', root), 'utf8'),
      readFile(new URL('dist/extensions.js', root), 'utf8'),
      readFile(new URL('dist/tooltip-compat.css', root), 'utf8'),
      readFile(new URL('dist/tooltip-compat.js', root), 'utf8'),
      readFile(new URL('THIRD_PARTY_NOTICES.md', root), 'utf8')
    ]);
    expect(pkg.peerDependencies).toBeUndefined();
    expect(pkg.exports['./extensions']).toBeTruthy();
    expect(pkg.exports['./extensions.css']).toBe('./dist/extensions.css');
    expect(fullCss).toContain('includes @knadh/oat');
    expect(fullCss).toContain('@layer theme,base,components,animations,utilities');
    expect(fullJs).toContain('ot-tabs');
    expect(extensionCss).not.toContain('@layer theme,base,components,animations,utilities');
    expect(extensionJs).not.toContain('ot-tabs');
    expect(pkg.exports['./tooltip-compat']).toBeTruthy();
    expect(pkg.exports['./tooltip-compat.css']).toBe('./dist/tooltip-compat.css');
    for (const aggregate of [fullJs, extensionJs]) {
      expect(aggregate).not.toContain('oatbaseTooltipPlacement');
    }
    expect(tooltipCss).toContain('--oatbase-tooltip-shift');
    expect(tooltipJs).toContain('oatbaseTooltipPlacement');
    expect(notice).toContain('Copyright (c) 2026 Kailash Nadh');
  });

  test('exposes only prefixed component geometry hooks with local fallbacks', async () => {
    const [bundle, theming, docs] = await Promise.all([
      readFile(new URL('dist/oatbase.css', root), 'utf8'),
      readFile(new URL('THEMING.md', root), 'utf8'),
      readFile(new URL('docs/index.html', root), 'utf8')
    ]);
    const hooks = [...new Set([...bundle.matchAll(/var\((--oatbase-[a-z0-9-]+),/g)].map(match => match[1]))].sort();
    const documentedHooks = text => [...new Set(text.match(/--oatbase-[a-z0-9-]+/g) || [])].sort();
    const themingTable = theming.match(/## Component hooks[\s\S]*?(?=\n## )/)?.[0] || '';
    const docsTable = docs.match(/<h2 id="component-hooks"[\s\S]*?<\/table>/)?.[0] || '';
    expect(hooks.length).toBeGreaterThan(0);
    expect(documentedHooks(themingTable)).toEqual(hooks);
    expect(documentedHooks(docsTable)).toEqual(hooks);
    expect(bundle).not.toMatch(/:root\s*\{[^}]*--oatbase-/s);
  });

  test('cancels component setup deferred until DOM readiness', async () => {
    const base = await readFile(new URL('src/js/base.js', root), 'utf8');
    expect(base).toContain("document.addEventListener('DOMContentLoaded'");
    expect(base).toContain('signal: controller.signal');
    expect(base).toContain('element.isConnected');

    for (const component of ['combobox', 'select', 'multiselect', 'command']) {
      const source = await readFile(new URL(`src/js/${component}.js`, root), 'utf8');
      expect(source).toContain('connectWhenReady');
      expect(source).toContain('this.#readyAbort?.abort()');
      expect(source).not.toContain("document.addEventListener('DOMContentLoaded'");
    }
  });

  test('reserves raw pixels for physical strokes and hidden-control geometry', async () => {
    const componentDirectory = new URL('src/css/components/', root);
    const themeDirectory = new URL('src/css/themes/', root);
    const files = [
      new URL('src/css/oat-compat.css', root),
      new URL('src/css/utilities.css', root),
      new URL('docs/docs.css', root),
      ...(await Array.fromAsync(new Bun.Glob('*.css').scan({ cwd: componentDirectory.pathname, absolute: true }))).map(path => new URL(`file://${path}`)),
      ...(await Array.fromAsync(new Bun.Glob('*.css').scan({ cwd: themeDirectory.pathname, absolute: true }))).map(path => new URL(`file://${path}`))
    ];
    const forbidden = [];
    const properties = /(?:^|[;{])\s*((?:font-size|padding(?:-[\w-]+)?|margin(?:-[\w-]+)?|gap|row-gap|column-gap|(?:min-|max-)?(?:width|height|inline-size|block-size)))\s*:\s*([^;}]*)/gm;
    const allowedPhysicalGeometry = new Set([
      'src/css/utilities.css:width:1px',
      'src/css/utilities.css:height:1px',
      'src/css/utilities.css:margin:-1px',
      'src/css/components/password-field.css:margin-inline-start:-1px',
      'src/css/components/splitter.css:width:2px',
      'src/css/components/chart.css:min-height:2px',
      'src/css/components/segmented-control.css:inline-size:1px',
      'src/css/components/segmented-control.css:block-size:1px',
      'src/css/components/rating.css:inline-size:1px',
      'src/css/components/rating.css:block-size:1px'
    ]);
    for (const file of files) {
      const css = await readFile(file, 'utf8');
      for (const match of css.matchAll(properties)) {
        const relative = file.pathname.replace(root.pathname, '');
        const declaration = `${relative}:${match[1]}:${match[2].trim()}`;
        if (/(?:\d*\.)?\d+px\b/.test(match[2]) && !allowedPhysicalGeometry.has(declaration)) forbidden.push(declaration);
      }
    }
    expect(forbidden).toEqual([]);
  });

  test('keeps appearance selection compatible with Oat theme selectors', async () => {
    const source = await readFile(new URL('src/js/theme-switcher.js', root), 'utf8');
    expect(source).toContain("target.dataset.theme = this.#theme");
    expect(source).toContain("target.removeAttribute('data-theme')");
    expect(source).toContain("target.style.colorScheme");
    expect(source).toContain('this.ownerDocument.querySelector(this.dataset.target)');
  });

  test('ships independently loadable themes as Oat token maps', async () => {
    const tokens = [
      '--background', '--foreground', '--card', '--card-foreground', '--primary',
      '--primary-foreground', '--secondary', '--secondary-foreground', '--muted',
      '--muted-foreground', '--faint', '--faint-foreground', '--accent', '--danger',
      '--danger-foreground', '--success', '--success-foreground', '--warning',
      '--warning-foreground', '--border', '--input', '--ring'
    ];
    for (const theme of ['oat', 'doordarshan', 'forest', 'ocean', 'paper']) {
      const css = await readFile(new URL(`dist/themes/${theme}.css`, root), 'utf8');
      expect(css).toContain(`[data-oat-theme="${theme}"]`);
      for (const token of tokens) expect(css).toContain(`${token}:`);
      expect(css).not.toMatch(/\b(button|input|dialog|ot-)\b\s*[,{]/);
    }
  });

  test('registers each custom element defensively', async () => {
    const bundle = await readFile(new URL('dist/oatbase.js', root), 'utf8');
    for (const element of [
      'ot-action-field', 'ot-combobox', 'ot-command', 'ot-select', 'ot-theme-switcher', 'ot-copy',
      'ot-multiselect', 'ot-password', 'ot-splitter', 'ot-tree', 'ot-toggle',
      'ot-toolbar', 'ot-otp', 'ot-lightbox', 'ot-scrollspy', 'ot-footnotes',
      'ot-reading-progress', 'ot-data-table', 'ot-repeater', 'ot-log-viewer'
    ]) {
      expect(bundle).toContain(element);
    }
    expect(bundle).toContain('customElements.get(name)');
  });

  test('shares outside-pointer handling across enhanced controls', async () => {
    const [outsidePointer, ...controls] = await Promise.all([
      readFile(new URL('src/js/outside-pointer.js', root), 'utf8'),
      ...['combobox', 'select', 'multiselect'].map(name =>
        readFile(new URL(`src/js/${name}.js`, root), 'utf8'))
    ]);
    expect(outsidePointer).toContain("document.addEventListener('pointerdown'");
    for (const control of controls) expect(control).not.toContain("document.addEventListener('pointerdown'");
  });

  test('reserves copy feedback width before changing the button label', async () => {
    const source = await readFile(new URL('src/js/copy-button.js', root), 'utf8');
    expect(source).toContain('#reserveFeedbackWidth(feedback)');
    expect(source).toContain("this.#reserveFeedbackWidth(this.dataset.copied || 'Copied')");
    expect(source.indexOf('this.#reserveFeedbackWidth(feedback)')).toBeLessThan(source.indexOf('this.button.textContent = feedback'));
  });

  test('composes action fields from copy behavior with a useful no-JavaScript fallback', async () => {
    const [source, css, copy] = await Promise.all([
      readFile(new URL('src/js/action-field.js', root), 'utf8'),
      readFile(new URL('src/css/components/action-field.css', root), 'utf8'),
      readFile(new URL('src/js/copy-button.js', root), 'utf8')
    ]);
    expect(source).toContain('class OtActionField extends OtCopy');
    expect(source).toContain("define('ot-action-field', OtActionField)");
    expect(css).toContain('overflow-wrap: anywhere');
    expect(css).toContain('ot-action-field:not([data-enhanced]) [data-copy-button]');
    expect(copy).toContain("status.setAttribute('aria-live', 'polite')");
  });

  test('keeps drawers native and CSS-only', async () => {
    const css = await readFile(new URL('dist/drawer.css', root), 'utf8');
    const js = await readFile(new URL('dist/oatbase.js', root), 'utf8');
    expect(css).toContain('dialog[data-variant="drawer"]');
    expect(js).not.toContain('ot-drawer');
  });

  test('keeps the native select as the combobox fallback', async () => {
    const css = await readFile(new URL('dist/combobox.css', root), 'utf8');
    const demo = await readFile(new URL('docs/components.js', root), 'utf8');
    expect(css).toContain('ot-combobox:not([data-enhanced]) > select');
    expect(demo).toMatch(/<ot-combobox[\s\S]*?<select name="framework"/);
  });

  test('keeps the native select as the enhanced select fallback', async () => {
    const css = await readFile(new URL('dist/select.css', root), 'utf8');
    expect(css).toContain('ot-select:not([data-enhanced]) > select');
    expect(css).toContain('ot-select[data-enhanced] > select');
  });

  test('keeps tree rows and disclosure columns aligned', async () => {
    const css = await readFile(new URL('src/css/components/tree.css', root), 'utf8');
    expect(css).toContain('justify-content: flex-start');
    expect(css).toContain('flex: 0 0 1em');
  });

  test('keeps command results aligned as readable menu rows', async () => {
    const css = await readFile(new URL('src/css/components/command.css', root), 'utf8');
    expect(css).toContain('justify-content: flex-start');
    expect(css).toContain('text-align: start');
  });

  test('provides an inline keyboard hint for compact controls', async () => {
    const css = await readFile(new URL('src/css/components/kbd.css', root), 'utf8');
    expect(css).toContain('kbd[data-variant="inline"]');
    expect(css).toMatch(/kbd\[data-variant="inline"\]\s*\{[^}]*background: transparent;[^}]*border: 0;[^}]*box-shadow: none;/s);
  });

  test('keeps the OTP input as the form and no-JavaScript fallback', async () => {
    const css = await readFile(new URL('src/css/components/otp-input.css', root), 'utf8');
    const source = await readFile(new URL('src/js/otp-input.js', root), 'utf8');
    expect(css).toContain('ot-otp[data-enhanced] > input');
    expect(source).toContain("this.input = this.querySelector(':scope > input')");
    expect(source).not.toContain('attachShadow');
  });

  test('keeps choice cards native and CSS-only', async () => {
    const css = await readFile(new URL('src/css/components/choice-card.css', root), 'utf8');
    const js = await readFile(new URL('dist/oatbase.js', root), 'utf8');
    expect(css).toContain('[data-choice-card]:has(> input:checked)');
    expect(js).not.toContain('ot-choice-card');
  });

  test('keeps the empty state compatible with native hidden semantics', async () => {
    const css = await readFile(new URL('dist/empty.css', root), 'utf8');
    expect(css).toContain('[data-variant="empty"][hidden]');
    expect(css).toContain('display: none');
  });

  test('keeps horizontal scroll areas on one overflowing row', async () => {
    const css = await readFile(new URL('src/css/components/scroll-area.css', root), 'utf8');
    expect(css).toMatch(/\[data-orientation="horizontal"\]\s*\{[^}]*flex-wrap: nowrap;[^}]*overflow-x: auto;/s);
    expect(css).toContain('.scroll-area[data-orientation="horizontal"] > * { flex: 0 0 auto; }');
  });

  test('enhances a native table without external runtime dependencies', async () => {
    const [source, css, aggregate, pkg] = await Promise.all([
      readFile(new URL('src/js/data-table.js', root), 'utf8'),
      readFile(new URL('src/css/components/data-table.css', root), 'utf8'),
      readFile(new URL('dist/extensions.js', root), 'utf8'),
      readFile(new URL('package.json', root), 'utf8').then(JSON.parse)
    ]);
    expect(source).toContain("this.querySelector(':scope > table");
    expect(source).toContain("define('ot-data-table'");
    expect(source).toContain("'oatbase:sort'");
    expect(source).toContain("'oatbase:filter'");
    expect(source).toContain("'oatbase:select'");
    expect(source).not.toContain('oat-table');
    expect(aggregate).toContain('ot-data-table');
    expect(css).toContain('th[data-sort]');
    expect(pkg.dependencies).toBeUndefined();
    expect(pkg.exports['./data-table']).toBeTruthy();
  });

  test('keeps Flowctl-derived coordination native and dependency-free', async () => {
    const [repeater, logViewer, combobox, stepper, aggregate, pkg] = await Promise.all([
      readFile(new URL('src/js/repeater.js', root), 'utf8'),
      readFile(new URL('src/js/log-viewer.js', root), 'utf8'),
      readFile(new URL('src/js/combobox.js', root), 'utf8'),
      readFile(new URL('src/css/components/stepper.css', root), 'utf8'),
      readFile(new URL('dist/extensions.js', root), 'utf8'),
      readFile(new URL('package.json', root), 'utf8').then(JSON.parse)
    ]);
    expect(repeater).toContain("template[data-repeater-template]");
    expect(repeater).toContain("this.closest('form')");
    expect(repeater).toContain("'oatbase:add'");
    expect(logViewer).toContain("[role=\"log\"]");
    expect(logViewer).toContain('MutationObserver');
    expect(logViewer).not.toContain('fetch(');
    expect(combobox).toContain("new Option(value, value, true, true)");
    expect(combobox).toContain("'oatbase:create'");
    expect(stepper).toContain('[data-variant="status"]');
    expect(aggregate).toContain('ot-repeater');
    expect(aggregate).toContain('ot-log-viewer');
    expect(pkg.dependencies).toBeUndefined();
    expect(pkg.exports['./repeater']).toBeTruthy();
    expect(pkg.exports['./log-viewer']).toBeTruthy();
  });

  test('ships CSS-only document components and compositional variants', async () => {
    const [prose, descriptions, item, empty, toolbar, splitter] = await Promise.all([
      readFile(new URL('src/css/components/prose.css', root), 'utf8'),
      readFile(new URL('src/css/components/description-list.css', root), 'utf8'),
      readFile(new URL('src/css/components/item.css', root), 'utf8'),
      readFile(new URL('src/css/components/empty.css', root), 'utf8'),
      readFile(new URL('src/css/components/toolbar.css', root), 'utf8'),
      readFile(new URL('src/css/components/splitter.css', root), 'utf8')
    ]);
    expect(prose).toContain('[data-prose]');
    expect(descriptions).toContain('[data-description-list]');
    expect(item).toContain('[data-unread]');
    expect(empty).toContain('[data-layout="inline"]');
    expect(toolbar).toContain('[data-floating]');
    expect(splitter).toContain('[aria-orientation="vertical"]');
  });

  test('keeps document helpers composed from useful native elements', async () => {
    const [lightbox, scrollspy, footnotes, reading] = await Promise.all([
      readFile(new URL('src/js/lightbox.js', root), 'utf8'),
      readFile(new URL('src/js/scrollspy.js', root), 'utf8'),
      readFile(new URL('src/js/footnotes.js', root), 'utf8'),
      readFile(new URL('src/js/reading-progress.js', root), 'utf8')
    ]);
    expect(lightbox).toContain("dialog[data-lightbox-dialog]");
    expect(lightbox).toContain("querySelectorAll('[data-lightbox-item]')");
    expect(scrollspy).toContain("querySelectorAll('a[href^=\"#\"]')");
    expect(scrollspy).toContain("setAttribute('aria-current', 'location')");
    expect(footnotes).toContain("document.createElement('ot-dropdown')");
    expect(footnotes).toContain("setAttribute('popover', 'auto')");
    expect(reading).toContain("querySelector('progress')");
  });
});
