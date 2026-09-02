const components = window.OATBASE_COMPONENTS || [];
const fullExamples = window.OATBASE_FULL_EXAMPLES || [];
const presetNames = new Set(['oat', 'doordarshan', 'forest', 'ocean', 'paper']);

function applyPreset(value, target = document.documentElement, persist = false) {
  const preset = presetNames.has(value) ? value : 'oat';
  if (preset === 'oat' && target === document.documentElement) target.removeAttribute('data-oat-theme');
  else target.dataset.oatTheme = preset;
  if (persist) {
    try {
      if (preset === 'oat') localStorage.removeItem('oatbase-preset');
      else localStorage.setItem('oatbase-preset', preset);
    } catch { /* The selected preset still applies for this page view. */ }
  }
}

const pagePreset = document.querySelector('[data-theme-preset]');
pagePreset.value = document.documentElement.dataset.oatTheme || 'oat';
pagePreset.dispatchEvent(new Event('change', { bubbles: true }));
pagePreset.addEventListener('change', () => applyPreset(pagePreset.value, document.documentElement, true));

const labPreset = document.querySelector('[data-theme-lab-preset]');
const labSurface = document.querySelector('.docs-theme-surface');
applyPreset(labPreset.value, labSurface);
labPreset.addEventListener('change', () => applyPreset(labPreset.value, labSurface));

function componentIcon(component) {
  const icons = {
    callout: '!', chart: '▥', command: '⌘', drawer: '▤', empty: '◇', item: '☷', kbd: 'K',
    combobox: '⌕', select: '⌄', 'theme-switcher': '◐', 'copy-button': '⧉',
    multiselect: '☑', 'password-field': '●', rating: '★',
    'segmented-control': '▦', splitter: '↔', stat: '#', stepper: '①',
    timeline: '⋮', tree: '⌘', toggle: '◉', toolbar: '↔', 'choice-card': '▣',
    'otp-input': '•••', lightbox: '▣', scrollspy: '§', footnotes: '¹',
    'reading-progress': '↧'
  };
  return icons[component.slug] || component.name.slice(0, 1);
}

function componentImport(component) {
  if (component.imports) return component.imports;
  if (component.source === 'Oat core') {
    return `import '@oddship/oatbase/css';${component.js ? "\nimport '@oddship/oatbase';" : ''}`;
  }
  const lines = [`import '@oddship/oatbase/${component.slug}.css';`];
  if (component.js) lines.push(`import '@oddship/oatbase/${component.slug}';`);
  return lines.join('\n');
}

function componentJavaScript(component, example = {}) {
  if (example.javascript) return example.javascript.trim();
  if (component.javascript) return component.javascript.trim();

  const imports = componentImport(component)
    .split('\n')
    .filter(line => !/\/(?:css|[^']+\.css)'/.test(line));
  return `${imports.join('\n')}\n\n// The import registers the component; no application JavaScript is required.`;
}

function componentGridLink(component, { outlined = true } = {}) {
  const link = document.createElement('a');
  link.className = 'item col-6';
  if (outlined) link.dataset.variant = 'outline';
  link.href = `#/components/${component.slug}`;
  link.innerHTML = `<span data-slot="media">${componentIcon(component)}</span><section><h3>${component.name}</h3><p>${component.description}</p></section><span aria-hidden="true">›</span>`;
  return link;
}

function formatMarkup(markup) {
  const template = document.createElement('template');
  template.innerHTML = markup.trim();
  const voidElements = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
    'meta', 'param', 'source', 'track', 'wbr'
  ]);

  function formatNode(node, depth) {
    const indent = '  '.repeat(depth);
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.replace(/\s+/g, ' ').trim();
      return text ? `${indent}${text}` : '';
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return '';

    const tag = node.localName;
    const attributes = [...node.attributes]
      .map(attribute => ` ${attribute.name}="${attribute.value.replaceAll('&', '&amp;').replaceAll('"', '&quot;')}"`)
      .join('');
    const opening = `<${tag}${attributes}>`;
    if (voidElements.has(tag)) return `${indent}<${tag}${attributes}>`;

    const childNodes = tag === 'template' ? node.content.childNodes : node.childNodes;
    const children = [...childNodes].filter(child =>
      child.nodeType !== Node.TEXT_NODE || child.textContent.trim()
    );
    if (children.length === 1 && children[0].nodeType === Node.TEXT_NODE) {
      return `${indent}${opening}${children[0].textContent.replace(/\s+/g, ' ').trim()}</${tag}>`;
    }

    const content = children.map(child => formatNode(child, depth + 1)).filter(Boolean);
    return [`${indent}${opening}`, ...content, `${indent}</${tag}>`].join('\n');
  }

  return [...template.content.childNodes]
    .map(node => formatNode(node, 0))
    .filter(Boolean)
    .join('\n');
}

function highlightSource(codeElement, source) {
  const fragment = document.createDocumentFragment();

  function append(value, className) {
    if (!value) return;
    if (!className) {
      fragment.append(document.createTextNode(value));
      return;
    }
    const token = document.createElement('span');
    token.className = className;
    token.textContent = value;
    fragment.append(token);
  }

  function appendTag(value) {
    if (value.startsWith('<!--')) {
      append(value, 'syntax-comment');
      return;
    }

    const tag = value.match(/^(<\/?)([\w:-]+)([\s\S]*?)(\/?>)$/);
    if (!tag) {
      append(value);
      return;
    }

    append(tag[1], 'syntax-punctuation');
    append(tag[2], 'syntax-tag');

    const attributes = tag[3];
    const pattern = /(\s+)([^\s=/>]+)(?:\s*(=)\s*("[^"]*"|'[^']*'|[^\s>]+))?/g;
    let cursor = 0;
    for (const attribute of attributes.matchAll(pattern)) {
      append(attributes.slice(cursor, attribute.index));
      append(attribute[1]);
      append(attribute[2], 'syntax-attribute');
      append(attribute[3], 'syntax-punctuation');
      append(attribute[4], 'syntax-value');
      cursor = attribute.index + attribute[0].length;
    }
    append(attributes.slice(cursor));
    append(tag[4], 'syntax-punctuation');
  }

  const tags = /<!--[\s\S]*?-->|<\/?[A-Za-z][^>]*>/g;
  let cursor = 0;
  for (const tag of source.matchAll(tags)) {
    append(source.slice(cursor, tag.index));
    appendTag(tag[0]);
    cursor = tag.index + tag[0].length;
  }
  append(source.slice(cursor));
  codeElement.replaceChildren(fragment);
}

function highlightMarkup(codeElement, markup) {
  highlightSource(codeElement, formatMarkup(markup));
}

function highlightJavaScript(codeElement, source) {
  const fragment = document.createDocumentFragment();
  const tokens = /\/\*[\s\S]*?\*\/|\/\/[^\n]*|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`|\b(?:await|const|else|export|false|from|function|if|import|let|new|null|return|true)\b/g;
  let cursor = 0;

  for (const token of source.matchAll(tokens)) {
    fragment.append(document.createTextNode(source.slice(cursor, token.index)));
    const value = token[0];
    const span = document.createElement('span');
    span.className = value.startsWith('//') || value.startsWith('/*')
      ? 'syntax-comment'
      : /^[\'"`]/.test(value)
        ? 'syntax-value'
        : 'syntax-keyword';
    span.textContent = value;
    fragment.append(span);
    cursor = token.index + value.length;
  }
  fragment.append(document.createTextNode(source.slice(cursor)));
  codeElement.replaceChildren(fragment);
}

function initializeDemoCopySources(root = document) {
  root.querySelectorAll('[data-demo]').forEach(demo => {
    const sources = [...demo.querySelectorAll(':scope > [data-code-kind]')];
    if (!sources.length) return;
    demo.addEventListener('ot-tab-change', event => {
      if (event.target !== demo) return;
      const kind = event.detail.tab.dataset.codeKind || 'html';
      sources.forEach(source => source.toggleAttribute('data-copy-source', source.dataset.codeKind === kind));
    });
  });
}

function buildFullExamples() {
  const container = document.querySelector('[data-full-examples]');
  if (!container) return;

  const sections = fullExamples.map(example => {
    const section = document.createElement('section');
    section.className = 'docs-section';
    section.dataset.fullExample = example.slug;
    section.innerHTML = `
      <h2 id="example-${example.slug}">${example.title}</h2>
      <p>${example.description}</p>
      <ot-copy class="demo-copy">
        <ot-tabs class="demo demo-full" data-demo>
          <div class="demo-tabs" role="tablist" aria-label="${example.title}">
            <button type="button" class="ghost small" role="tab" data-view="preview" aria-selected="true">Preview</button>
            <button type="button" class="ghost small" role="tab" data-view="code" aria-selected="false">Full code</button>
          </div>
          <button type="button" class="ghost small demo-copy-button" data-copy-button>Copy</button>
          <iframe class="demo-frame" role="tabpanel" data-preview title="${example.title} preview" sandbox="allow-scripts allow-forms allow-modals" referrerpolicy="no-referrer" style="--demo-frame-height:${example.height || '35rem'}"></iframe>
          <pre class="demo-code" role="tabpanel" data-code data-copy-source hidden><code></code></pre>
        </ot-tabs>
      </ot-copy>`;
    section.querySelector('.demo-frame').srcdoc = example.source;
    highlightSource(section.querySelector('[data-code] code'), example.source.trim());
    return section;
  });

  container.replaceChildren(...sections);
}

function buildComponentPage(component) {
  const route = `/components/${component.slug}`;
  if (document.querySelector(`[data-page="${route}"]`)) return;
  const examples = component.examples?.length
    ? component.examples
    : [{ title: 'Preview', markup: component.markup }];
  const exampleSections = examples.map((example, index) => {
    const key = example.slug || (index === 0 ? 'preview' : `example-${index + 1}`);
    const javascriptTab = component.js
      ? '<button type="button" class="ghost small" role="tab" data-view="javascript" data-code-kind="javascript" aria-selected="false">JavaScript</button>'
      : '';
    const javascriptPanel = component.js
      ? '<pre class="demo-code" role="tabpanel" data-code data-code-kind="javascript" hidden><code></code></pre>'
      : '';
    return `<section class="docs-section" data-component-example="${index}">
      <h2 id="${component.slug}-${key}">${example.title}</h2>
      ${example.description ? `<p>${example.description}</p>` : ''}
      <ot-copy class="demo-copy">
      <ot-tabs class="demo" data-demo>
        <div class="demo-tabs" role="tablist" aria-label="${component.name}: ${example.title}">
          <button type="button" class="ghost small" role="tab" data-view="preview" aria-selected="true">Preview</button>
          <button type="button" class="ghost small" role="tab" data-view="code" data-code-kind="html" aria-selected="false">HTML</button>
          ${javascriptTab}
        </div>
        <button type="button" class="ghost small demo-copy-button" data-copy-button>Copy</button>
        <div class="demo-preview" role="tabpanel" data-preview${example.wide ? ' data-wide' : ''}${example.popup ? ' data-popup' : ''}></div>
        <pre class="demo-code" role="tabpanel" data-code data-code-kind="html" data-copy-source hidden><code></code></pre>
        ${javascriptPanel}
      </ot-tabs>
      </ot-copy>
    </section>`;
  }).join('');
  const apiSection = component.api?.length ? `<section class="docs-section">
    <h2 id="${component.slug}-api">API</h2>
    <table class="docs-api"><thead><tr><th>Surface</th><th>Purpose</th></tr></thead><tbody>
      ${component.api.map(([surface, purpose]) => `<tr><td><code>${surface}</code></td><td>${purpose}</td></tr>`).join('')}
    </tbody></table>
  </section>` : '';
  const article = document.createElement('article');
  article.className = 'docs-page';
  article.dataset.page = route;
  article.dataset.title = component.name;
  article.hidden = true;
  article.innerHTML = `
    <header>
      <span class="docs-eyebrow">Component · ${component.source}${component.js ? ' · JavaScript' : ' · CSS / native'}</span>
      <h1>${component.name}</h1>
      <p class="docs-lead">${component.description}</p>
    </header>
    ${exampleSections}
    <section class="docs-section">
      <h2 id="${component.slug}-usage">Usage</h2>
      <pre><code data-import></code></pre>
      <p>${component.usageNote || (component.source === 'Oat core' ? 'This pattern is provided by Oat itself. Oatbase documents and composes it without shipping a duplicate implementation.' : 'This addition uses Oat tokens and can be loaded independently or through the aggregate Oatbase bundle.')}</p>
    </section>
    ${apiSection}
    ${component.guidance ? `<section class="docs-section"><h2 id="${component.slug}-guidance">Guidance</h2>${component.guidance}</section>` : ''}`;
  article.querySelectorAll('[data-component-example]').forEach((section, index) => {
    const preview = section.querySelector('[data-preview]');
    preview.innerHTML = examples[index].markup;
    examples[index].mount?.(preview);
    highlightMarkup(section.querySelector('[data-code-kind="html"] code'), examples[index].markup);
    const javascript = section.querySelector('[data-code-kind="javascript"] code');
    if (javascript) highlightJavaScript(javascript, componentJavaScript(component, examples[index]));
  });
  article.querySelector('[data-import]').textContent = componentImport(component);
  document.querySelector('.docs-main').append(article);
}

function buildRegistry() {
  document.querySelectorAll('[data-component-count]').forEach(element => element.textContent = components.length);

  function componentNavItem(component) {
    const link = document.createElement('a');
    link.href = `#/components/${component.slug}`;
    link.dataset.route = `/components/${component.slug}`;
    link.textContent = component.name;
    if (component.js) {
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = 'JS';
      link.append(badge);
    }
    const item = document.createElement('li');
    item.append(link);
    return item;
  }

  for (const source of ['Oat core', 'Oatbase']) {
    const sourceComponents = components
      .filter(component => component.source === source)
      .sort((a, b) => a.name.localeCompare(b.name));
    document.querySelectorAll(`[data-source-count="${source}"]`)
      .forEach(element => { element.textContent = sourceComponents.length; });
    document.querySelector(`[data-source="${source}"] [data-component-nav]`)
      .replaceChildren(...sourceComponents.map(componentNavItem));
  }

  const commandGroup = document.querySelector('#docs-command-components');
  document.querySelectorAll('#docs-command-dialog [data-command-item][data-route^="/components/"]').forEach(item => item.closest('li').remove());
  const commandEmpty = document.querySelector('#docs-command-dialog [data-command-empty]');
  components.forEach(component => {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.commandItem = '';
    button.dataset.route = `/components/${component.slug}`;
    button.dataset.value = component.slug;
    button.dataset.keywords = `${component.description} ${component.source}`;
    button.textContent = component.name;
    item.append(button);
    commandEmpty.before(item);
  });

  const grid = document.querySelector('[data-component-grid]');
  const featuredSlugs = grid.dataset.components?.split(',').map(value => value.trim()).filter(Boolean);
  const gridComponents = featuredSlugs?.length
    ? featuredSlugs.map(slug => components.find(component => component.slug === slug)).filter(Boolean)
    : components;
  grid.replaceChildren(...gridComponents.map(component => componentGridLink(component, { outlined: false })));

  const catalog = document.querySelector('[data-component-catalog]');
  const catalogInputs = [...document.querySelectorAll('[name="catalog-source"]')];
  const catalogSearch = document.querySelector('[data-catalog-search]');
  const catalogCount = document.querySelector('[data-catalog-count]');
  const catalogEmpty = document.querySelector('[data-catalog-empty]');
  function renderCatalog(source = catalogInputs.find(input => input.checked)?.value || 'Oatbase') {
    const sourceComponents = source === 'All'
      ? components
      : components.filter(component => component.source === source);
    const query = catalogSearch.value.trim().toLocaleLowerCase();
    const visibleComponents = query
      ? sourceComponents.filter(component =>
          `${component.name} ${component.slug} ${component.description}`.toLocaleLowerCase().includes(query))
      : sourceComponents;
    catalog.replaceChildren(...visibleComponents.map(componentGridLink));
    const label = source === 'Oatbase' ? 'additions' : source === 'Oat core' ? 'core patterns' : 'patterns';
    catalogCount.textContent = query
      ? `${visibleComponents.length} of ${sourceComponents.length} ${label}`
      : `${visibleComponents.length} ${label}`;
    catalogEmpty.hidden = visibleComponents.length > 0;
  }
  catalogInputs.forEach(input => input.addEventListener('change', () => renderCatalog(input.value)));
  catalogSearch.addEventListener('input', () => renderCatalog());
  document.querySelectorAll('[data-catalog-preset]').forEach(link => link.addEventListener('click', () => {
    const input = catalogInputs.find(candidate => candidate.value === link.dataset.catalogPreset);
    if (!input) return;
    input.checked = true;
    catalogSearch.value = '';
    renderCatalog(input.value);
  }));
  renderCatalog();

  components.forEach(buildComponentPage);
}

buildRegistry();
buildFullExamples();
initializeDemoCopySources();

document.querySelectorAll('.docs-page .docs-eyebrow').forEach(metadata => {
  if (!metadata.textContent.trim().toLowerCase().startsWith('component')) return;
  const values = metadata.textContent.split('·').map(value => value.trim()).filter(Boolean);
  if (values.length === 2) {
    const slug = metadata.closest('[data-page]')?.dataset.page.split('/').at(-1);
    const source = components.find(component => component.slug === slug)?.source;
    if (source) values.splice(1, 0, source);
  }
  metadata.classList.add('docs-meta');
  metadata.setAttribute('role', 'list');
  metadata.setAttribute('aria-label', 'Component metadata');
  metadata.replaceChildren(...values.map((value, index) => {
    const item = document.createElement('span');
    item.className = 'badge';
    if (index !== 1) {
      item.classList.add('outline');
      item.dataset.variant = 'secondary';
    }
    item.setAttribute('role', 'listitem');
    item.dataset.meta = index === 0 ? 'type' : index === 1 ? 'source' : 'implementation';
    item.textContent = value;
    return item;
  }));
});

document.querySelectorAll('.demo-code code').forEach(code => {
  if (code.querySelector('[class^="syntax-"]')) return;
  if (code.closest('[data-code-kind="javascript"]')) highlightJavaScript(code, code.textContent.trim());
  else highlightMarkup(code, code.textContent);
});

const pages = [...document.querySelectorAll('[data-page]')];
const navLinks = [...document.querySelectorAll('[data-route]')];
const toc = document.querySelector('.docs-toc ul');

function currentRoute() {
  const route = location.hash.replace(/^#/, '') || '/';
  return pages.some(page => page.dataset.page === route) ? route : '/';
}

function renderRoute() {
  const route = currentRoute();
  const page = pages.find(candidate => candidate.dataset.page === route);
  pages.forEach(candidate => candidate.hidden = candidate !== page);
  navLinks.forEach(link => {
    link.toggleAttribute('aria-current', link.dataset.route === route);
    if (link.hasAttribute('aria-current')) link.setAttribute('aria-current', 'page');
  });
  document.querySelector('.docs-layout').removeAttribute('data-sidebar-open');
  document.title = `${page.dataset.title || 'Oatbase'} — Oatbase`;
  renderToc(page);
  scrollTo({ top: 0, behavior: 'instant' });
}

function renderToc(page) {
  const headings = [...page.querySelectorAll('h2[id], h3[id]')];
  toc.replaceChildren(...headings.map(heading => {
    const link = document.createElement('a');
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent;
    link.addEventListener('click', event => {
      event.preventDefault();
      heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    if (heading.tagName === 'H3') link.style.paddingInlineStart = 'var(--space-3)';
    const item = document.createElement('li');
    item.append(link);
    return item;
  }));
}

window.addEventListener('hashchange', renderRoute);
renderRoute();

const navSearch = document.querySelector('[data-nav-search]');
navSearch.addEventListener('input', () => {
  const query = navSearch.value.trim().toLocaleLowerCase();
  document.querySelectorAll('.docs-nav-group').forEach(group => {
    const items = [...group.querySelectorAll('li')];
    items.forEach(item => item.hidden = !item.textContent.toLocaleLowerCase().includes(query));
    group.hidden = items.length > 0 && items.every(item => item.hidden);
  });
  document.querySelector('.docs-nav-empty').hidden = [...document.querySelectorAll('.docs-nav-group')].some(group => !group.hidden);
});

document.addEventListener('oatbase:select', event => {
  const route = event.detail.item.dataset.route;
  if (route) location.hash = route;
});

document.addEventListener('submit', event => {
  if (event.target.closest('.docs-page') && event.target.method !== 'dialog') event.preventDefault();
});
