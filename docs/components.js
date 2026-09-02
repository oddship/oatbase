window.OATBASE_COMPONENTS = [
  {
    slug: 'accordion', name: 'Accordion', source: 'Oat core', js: false,
    description: 'Collapsible content using native details and summary elements.',
    markup: `<div><details name="faq"><summary>What is Oatbase?</summary><p class="p-4">A focused extension collection for Oat UI.</p></details><details name="faq"><summary>Does it need a framework?</summary><p class="p-4">No. It works with plain semantic HTML.</p></details></div>`
  },
  {
    slug: 'action-field', name: 'Action Field', source: 'Oatbase', js: true,
    description: 'A prominent, copyable value with native contextual actions.',
    examples: [
      {
        title: 'Contact action', slug: 'preview',
        description: 'The address and mail link remain useful without JavaScript; copying appears after enhancement.',
        markup: `<ot-action-field role="group" aria-labelledby="contact-address-label" data-copied="Copied address">
  <span id="contact-address-label" data-action-field-label>Email address</span>
  <div data-action-field-body>
    <span data-action-field-value data-copy-source>hello@example.com</span>
    <div data-action-field-actions>
      <a class="button" href="mailto:hello@example.com">Email me</a>
      <button type="button" class="outline" data-copy-button>Copy</button>
    </div>
  </div>
  <small data-action-field-hint>Replies usually arrive within two working days.</small>
</ot-action-field>`
      },
      {
        title: 'Long value', slug: 'long-value',
        description: 'Long values wrap while actions move onto another line when space is limited.',
        markup: `<ot-action-field role="group" aria-labelledby="repository-url-label" data-copied="Copied URL">
  <span id="repository-url-label" data-action-field-label>Repository clone URL</span>
  <div data-action-field-body>
    <code data-action-field-value data-copy-source>https://github.com/example/a-project-with-a-deliberately-long-name.git</code>
    <div data-action-field-actions>
      <a class="button" href="https://github.com/example/a-project-with-a-deliberately-long-name">Open repository</a>
      <button type="button" class="outline" data-copy-button>Copy URL</button>
    </div>
  </div>
</ot-action-field>`
      }
    ],
    usageNote: 'Action Field composes Oat’s native links and buttons with Oatbase copy behavior. The application owns action destinations and the value’s meaning.',
    api: [
      ['data-action-field-label', 'Labels the value; reference its id from aria-labelledby on the host.'],
      ['data-action-field-body', 'Groups the prominent value and its contextual actions.'],
      ['data-action-field-value / data-copy-source', 'Marks readable content as both the displayed value and clipboard source.'],
      ['data-action-field-actions', 'Contains any native links or buttons associated with the value.'],
      ['data-copy-button', 'Marks the progressively enhanced copy action; hidden until enhancement succeeds.'],
      ['data-action-field-hint', 'Adds optional supporting text below the value.'],
      ['data-copied', 'Customizes the temporary button label and polite live-region announcement.'],
      ['value / copy()', 'Reads the normalized source text or copies it programmatically.'],
      ['oatbase:copy', 'Emits the copied value after success.'],
      ['--oatbase-action-field-value-size', 'Overrides the prominent value size.']
    ]
  },
  {
    slug: 'alert', name: 'Alert', source: 'Oat core', js: false,
    description: 'Semantic feedback messages with status variants.',
    markup: `<div class="vstack"><div role="alert"><strong>Heads up.</strong> This is an informational alert.</div><div role="alert" data-variant="success"><strong>Saved.</strong> Your changes are live.</div><div role="alert" data-variant="warning"><strong>Check this.</strong> Review before continuing.</div><div role="alert" data-variant="danger"><strong>Error.</strong> Something went wrong.</div></div>`
  },
  {
    slug: 'alert-dialog', name: 'Alert Dialog', source: 'Oat core', js: false,
    description: 'A native modal dialog for decisions that require confirmation.',
    markup: `<div><button commandfor="registry-alert-dialog" command="show-modal" data-variant="danger">Delete project</button><dialog id="registry-alert-dialog" closedby="closerequest"><form method="dialog"><header><h3>Delete project?</h3><p>This action cannot be undone.</p></header><footer><button class="outline" value="cancel">Cancel</button><button data-variant="danger" value="delete">Delete</button></footer></form></dialog></div>`
  },
  {
    slug: 'avatar', name: 'Avatar', source: 'Oat core', js: false,
    description: 'Images, initials, and grouped identities.',
    markup: `<div class="vstack">
  <section class="vstack">
    <strong>Initials</strong>
    <div class="hstack">
      <figure data-variant="avatar" class="small" aria-label="Ada Lovelace"><abbr title="Ada Lovelace">AL</abbr></figure>
      <figure data-variant="avatar" aria-label="Grace Hopper"><abbr title="Grace Hopper">GH</abbr></figure>
      <figure data-variant="avatar" class="large" aria-label="Linus Torvalds"><abbr title="Linus Torvalds">LT</abbr></figure>
    </div>
  </section>
  <section class="vstack">
    <strong>Images</strong>
    <div class="hstack">
      <figure data-variant="avatar" class="small"><img src="./assets/avatar-sample.svg" alt="Abstract profile illustration"></figure>
      <figure data-variant="avatar"><img src="./assets/avatar-sample.svg" alt="Abstract profile illustration"></figure>
      <figure data-variant="avatar" class="large"><img src="./assets/avatar-sample.svg" alt="Abstract profile illustration"></figure>
    </div>
  </section>
  <section class="vstack">
    <strong>Groups</strong>
    <div class="hstack">
      <figure data-variant="avatar" role="group" class="small" aria-label="Small project team">
        <figure data-variant="avatar" aria-label="Ada Lovelace"><abbr title="Ada Lovelace">AL</abbr></figure>
        <figure data-variant="avatar" aria-label="Grace Hopper"><abbr title="Grace Hopper">GH</abbr></figure>
        <figure data-variant="avatar" aria-label="Linus Torvalds"><abbr title="Linus Torvalds">LT</abbr></figure>
      </figure>
      <figure data-variant="avatar" role="group" aria-label="Project team">
        <figure data-variant="avatar" aria-label="Ada Lovelace"><abbr title="Ada Lovelace">AL</abbr></figure>
        <figure data-variant="avatar" aria-label="Grace Hopper"><abbr title="Grace Hopper">GH</abbr></figure>
        <figure data-variant="avatar" aria-label="Linus Torvalds"><abbr title="Linus Torvalds">LT</abbr></figure>
      </figure>
      <figure data-variant="avatar" role="group" class="large" aria-label="Large project team">
        <figure data-variant="avatar" aria-label="Ada Lovelace"><abbr title="Ada Lovelace">AL</abbr></figure>
        <figure data-variant="avatar" aria-label="Grace Hopper"><abbr title="Grace Hopper">GH</abbr></figure>
        <figure data-variant="avatar" aria-label="Linus Torvalds"><abbr title="Linus Torvalds">LT</abbr></figure>
      </figure>
    </div>
  </section>
</div>`
  },
  {
    slug: 'badge', name: 'Badge', source: 'Oat core', js: false,
    description: 'Compact labels for state, category, and metadata.',
    examples: [
      { title: 'Variants', slug: 'preview', markup: `<div class="hstack"><span class="badge">Default</span><span class="badge" data-variant="secondary">Secondary</span><span class="badge outline">Outline</span><span class="badge" data-variant="success">Success</span><span class="badge" data-variant="warning">Warning</span><span class="badge" data-variant="danger">Danger</span></div>` },
      { title: 'Removable badge', slug: 'removable', description: 'A nested button is revealed on hover or keyboard focus.', markup: `<span class="badge" data-variant="secondary">Accessibility<button type="button" aria-label="Remove Accessibility">×</button></span>` }
    ]
  },
  {
    slug: 'breadcrumb', name: 'Breadcrumb', source: 'Oat core', js: false,
    description: 'Semantic navigation showing the current hierarchy.',
    markup: `<nav aria-label="Breadcrumb"><ol class="unstyled hstack"><li><a href="#/">Home</a></li><li aria-hidden="true">/</li><li><a href="#/">Components</a></li><li aria-hidden="true">/</li><li aria-current="page"><strong>Breadcrumb</strong></li></ol></nav>`
  },
  {
    slug: 'button', name: 'Button', source: 'Oat core', js: false,
    description: 'Native buttons and links with semantic variants and sizes.',
    examples: [
      { title: 'Variants', slug: 'preview', markup: `<div class="hstack"><button>Primary</button><button data-variant="secondary">Secondary</button><button class="outline">Outline</button><button class="ghost">Ghost</button><button data-variant="danger">Danger</button><button class="outline" data-variant="danger">Danger outline</button><button disabled>Disabled</button></div>` },
      { title: 'Sizes', slug: 'sizes', markup: `<div class="hstack"><button class="small">Small</button><button>Default</button><button class="large">Large</button></div>` },
      { title: 'Icons and links', slug: 'icons-links', markup: `<div class="hstack"><button class="icon small" aria-label="Add item">＋</button><button class="icon" aria-label="Open settings">⚙</button><button class="icon large" aria-label="Share">↗</button><a class="button" href="#/components/button">Link button</a></div>` }
    ]
  },
  {
    slug: 'button-group', name: 'Button Group', source: 'Oat core', js: false,
    description: 'Related actions displayed as one connected control.',
    markup: `<menu class="buttons"><li><button class="outline">Left</button></li><li><button class="outline">Center</button></li><li><button class="outline">Right</button></li></menu>`
  },
  {
    slug: 'card', name: 'Card', source: 'Oat core', js: false,
    description: 'A contained surface for related content and actions.',
    markup: `<article class="card"><header><h3>Project update</h3><p>Everything you need in one place.</p></header><p>The design system now has complete component coverage.</p><footer class="hstack"><button class="outline small">Dismiss</button><button class="small">View</button></footer></article>`
  },
  {
    slug: 'grid', name: 'Grid', source: 'Oat core', js: false,
    description: 'A responsive twelve-column layout that collapses to four columns on small screens.',
    examples: [
      { title: 'Column spans', slug: 'preview', markup: `<div class="row"><div class="col-4 card">Four columns</div><div class="col-8 card">Eight columns</div><div class="col-6 card">Six columns</div><div class="col-6 card">Six columns</div></div>` },
      { title: 'Offsets and end alignment', slug: 'offsets', markup: `<div class="row"><div class="col-4 offset-2 card">Offset by two</div><div class="col-3 col-end card">Aligned to end</div></div>` }
    ],
    api: [['.container', 'Centers content with a configurable maximum width.'], ['.row', 'Creates the responsive grid.'], ['.col-1 … .col-12', 'Sets a column span.'], ['.offset-1 … .offset-6', 'Offsets a column.'], ['.col-end', 'Aligns a column to the final grid line.']]
  },
  {
    slug: 'callout', name: 'Callout', source: 'Oatbase', js: false,
    description: 'A semantic aside for persistent notes, caveats, and supporting guidance.',
    markup: `<aside data-callout><strong>No-JavaScript fallback.</strong> The original native control remains available and submits the same value.</aside>`
  },
  {
    slug: 'chart', name: 'Chart', source: 'Oatbase', js: false,
    description: 'A dependency-free semantic bar chart pattern.',
    markup: `<figure data-variant="chart"><figcaption><strong>Weekly visitors</strong><small>Last 7 days</small></figcaption><div data-chart-bars role="img" aria-label="Visitors: Monday 45, Tuesday 62, Wednesday 38, Thursday 74, Friday 86, Saturday 58, Sunday 70"><span data-chart-bar data-label="Mon" style="--value:45"></span><span data-chart-bar data-label="Tue" style="--value:62"></span><span data-chart-bar data-label="Wed" style="--value:38"></span><span data-chart-bar data-label="Thu" style="--value:74"></span><span data-chart-bar data-label="Fri" style="--value:86"></span><span data-chart-bar data-label="Sat" style="--value:58"></span><span data-chart-bar data-label="Sun" style="--value:70"></span></div><ul data-chart-legend aria-label="Chart notes"><li>Peak: Friday, 86</li><li>Average: 62</li></ul></figure>`
  },
  {
    slug: 'checkbox', name: 'Checkbox', source: 'Oat core', js: false,
    description: 'Native checkboxes with checked, unchecked, and disabled states.',
    markup: `<fieldset><legend>Notifications</legend><div class="vstack"><label><input type="checkbox" checked> Email notifications</label><label><input type="checkbox"> Product updates</label><label><input type="checkbox" checked disabled> Checked and disabled</label><label><input type="checkbox" disabled> Disabled option</label></div></fieldset>`
  },
  {
    slug: 'combobox', name: 'Combobox', source: 'Oatbase', js: true,
    description: 'Searchable selection backed by a native select.',
    examples: [
      { title: 'Existing choices', slug: 'preview', popup: true, markup: `<label data-field>Framework<ot-combobox data-placeholder="Search frameworks…" data-empty="No frameworks found."><select name="framework" aria-label="Framework"><option value="" disabled selected>Select a framework</option><option value="django" data-keywords="python server">Django</option><option value="rails" data-keywords="ruby server">Ruby on Rails</option><option value="svelte" data-keywords="javascript client">Svelte</option></select></ot-combobox></label>` },
      { title: 'Creatable', slug: 'creatable', popup: true, markup: `<label data-field>Environment<ot-combobox data-allow-custom data-placeholder="Select or create…" data-create-label="Add “{value}”"><select name="environment" aria-label="Environment"><option value="" disabled selected>Select an environment</option><option>Development</option><option>Staging</option><option>Production</option></select></ot-combobox><small data-hint>Type a new environment and press Enter to add it to the native select.</small></label>` }
    ],
    api: [['data-placeholder', 'Placeholder for the generated search input.'], ['data-empty', 'Message shown when filtering has no results.'], ['data-allow-custom', 'Offers the typed value as a new native option when no exact match exists.'], ['data-create-label', 'Formats the custom option label; {value} is replaced with the typed text.'], ['value', 'Reads or assigns the underlying native select value.'], ['oatbase:change', 'Emits { value, option } after selection.'], ['oatbase:create', 'Emits { value, option } after adding a custom native option.']]
  },
  {
    slug: 'command', name: 'Command', source: 'Oatbase', js: true,
    description: 'A command menu with local or application-supplied results and global keyboard access.',
    javascript: `import '@oddship/oatbase/command';

const command = document.querySelector('ot-command');
command.addEventListener('oatbase:query', async event => {
  const results = await searchCommands(event.detail.query);
  command.list.replaceChildren(...results.map(commandRow));
  command.refresh();
});`,
    api: [['data-filter="manual"', 'Leaves result filtering and insertion to the application.'], ['data-command-open / data-command-close', 'Opt existing buttons into opening or closing the palette.'], ['data-command-search / data-command-list', 'Identify the query input and semantic result list.'], ['data-command-item', 'Marks a selectable result; dynamically inserted items are indexed by refresh().'], ['query', 'Returns the current trimmed query string.'], ['items / visibleItems', 'Expose all results or the currently available results.'], ['open() / close()', 'Control the native dialog programmatically.'], ['refresh()', 'Reindexes application-supplied results and synchronizes active, empty, and accessible state.'], ['oatbase:query', 'Cancelable event with { query }; manual mode never applies local filtering.'], ['oatbase:select', 'Cancelable event with { value, item }.'], ['oatbase:open / oatbase:close', 'Report palette lifecycle changes.']]
  },
  {
    slug: 'dialog', name: 'Dialog', source: 'Oat core', js: false,
    description: 'Native modal content with browser-managed focus and Escape handling.',
    markup: `<div><button commandfor="registry-dialog" command="show-modal">Open dialog</button><dialog id="registry-dialog" closedby="any"><form method="dialog"><header><h3>Edit profile</h3><p>Update the information below.</p></header><div><label data-field>Name<input value="Ada Lovelace"></label></div><footer><button class="outline" value="cancel">Cancel</button><button value="save">Save</button></footer></form></dialog></div>`
  },
  { slug: 'drawer', name: 'Drawer', source: 'Oatbase', js: false, description: 'A native dialog positioned against a viewport edge.' },
  {
    slug: 'dropdown-menu', name: 'Dropdown Menu', source: 'Oat core', js: true,
    description: 'A keyboard-aware menu built with popover and Oat’s dropdown component.',
    markup: `<ot-dropdown><button popovertarget="registry-dropdown" class="outline">Open menu</button><menu popover id="registry-dropdown"><button role="menuitem" class="ghost">Profile</button><button role="menuitem" class="ghost">Settings</button><hr><button role="menuitem" class="ghost" data-variant="danger">Sign out</button></menu></ot-dropdown>`,
    api: [['popovertarget', 'References the menu popover and acts as its trigger.'], ['role="menuitem"', 'Opts an item into focus and Arrow Up/Down navigation.'], ['Escape', 'Closes through the native Popover API and restores trigger focus.']]
  },
  {
    slug: 'empty', name: 'Empty', source: 'Oatbase', js: false,
    description: 'A clear empty state with optional media and actions.',
    examples: [
      { title: 'Centered', slug: 'preview', markup: `<section data-variant="empty"><span data-slot="media">◇</span><h3>No projects yet</h3><p>Create a project to start organizing work.</p><div data-slot="actions"><button>Create project</button><button class="outline">Import</button></div></section>` },
      { title: 'Compact and inline', slug: 'compact', markup: `<div class="vstack"><section data-variant="empty" data-size="compact"><h3>No matching issues</h3><p>Clear filters to see every issue.</p></section><section data-variant="empty" data-layout="inline"><div><h3>No notifications</h3><p>You are all caught up.</p></div><div data-slot="actions"><button class="outline small">Refresh</button></div></section></div>` }
    ]
  },
  {
    slug: 'field', name: 'Field', source: 'Oat core', js: false,
    description: 'Labels, form controls, hints, and validation messages as one semantic unit.',
    examples: [
      { title: 'Hint', slug: 'preview', markup: `<label data-field>Email<input type="email" placeholder="you@example.com" aria-describedby="registry-email-hint"><small id="registry-email-hint" data-hint>We will only use this for account notifications.</small></label>` },
      { title: 'Validation error', slug: 'validation', markup: `<label data-field>Username<input value="a" aria-invalid="true" aria-describedby="registry-username-error"><small id="registry-username-error" class="error">Use at least three characters.</small></label>` }
    ]
  },
  {
    slug: 'input', name: 'Input', source: 'Oat core', js: false,
    description: 'Native text-like and file inputs styled contextually without classes.',
    examples: [
      { title: 'Text-like inputs', slug: 'preview', markup: `<div class="vstack"><input type="email" placeholder="Email"><input type="password" placeholder="Password"><input type="search" placeholder="Search…" disabled></div>` },
      { title: 'File input', slug: 'file', markup: `<label data-field>Project file<input type="file" accept=".html,.css,.js"><small data-hint>HTML, CSS, or JavaScript.</small></label>` }
    ]
  },
  {
    slug: 'input-group', name: 'Input Group', source: 'Oat core', js: false,
    description: 'Inputs, labels, selects, and buttons connected into one control.',
    markup: `<fieldset class="group"><legend>https://</legend><input type="text" placeholder="subdomain"><select aria-label="Domain"><option>.example.com</option><option>.example.net</option></select><button>Go</button></fieldset>`
  },
  {
    slug: 'item', name: 'Item', source: 'Oatbase', js: false,
    description: 'Composable rows for lists, settings, navigation, and master-detail views.',
    examples: [
      { title: 'States and metadata', slug: 'preview', wide: true, markup: `<nav class="item-group" aria-label="Inbox"><a class="item" aria-current="page" data-unread href="#/components/item"><span data-slot="media">A</span><section><h3>Accessibility review</h3><p>Three unresolved comments.</p></section><time data-slot="meta" datetime="2026-09-01">Sep 1</time></a><a class="item" href="#/components/item"><span data-slot="media">R</span><section><h3>Release notes</h3><p>Draft ready for review.</p></section><span data-slot="actions"><span class="badge">Draft</span></span></a><span class="item" aria-busy="true"><span data-slot="media">…</span><section><h3>Loading project</h3><p>Fetching the latest state.</p></section></span></nav>` },
      { title: 'Connected group', slug: 'connected', markup: `<div class="item-group" data-connected><a class="item" href="#/components/item"><section><h3>Profile</h3><p>Name and avatar</p></section><span aria-hidden="true">›</span></a><a class="item" href="#/components/item"><section><h3>Security</h3><p>Password and passkeys</p></section><span aria-hidden="true">›</span></a></div>` }
    ]
  },
  { slug: 'kbd', name: 'Kbd', source: 'Oatbase', js: false, description: 'Native keyboard hints and grouped key combinations.' },
  {
    slug: 'label', name: 'Label', source: 'Oat core', js: false,
    description: 'Native form labels with automatic control association.',
    markup: `<label for="registry-username">Username<input id="registry-username" placeholder="ada"></label>`
  },
  {
    slug: 'native-select', name: 'Native Select', source: 'Oat core', js: false,
    description: 'The browser’s native select with Oat styling and behavior.',
    markup: `<label data-field>Timezone<select><option value="">Select a timezone</option><option>Asia/Kolkata</option><option>Europe/London</option><option>America/New_York</option></select></label>`
  },
  {
    slug: 'pagination', name: 'Pagination', source: 'Oat core', js: false,
    description: 'Navigation between result pages using linked button groups.',
    markup: `<nav aria-label="Pagination"><menu class="buttons"><li><a href="#/" class="button outline small">← Previous</a></li><li><a href="#/" class="button outline small">1</a></li><li><a href="#/" class="button small" aria-current="page">2</a></li><li><a href="#/" class="button outline small">3</a></li><li><a href="#/" class="button outline small">Next →</a></li></menu></nav>`
  },
  {
    slug: 'popover', name: 'Popover', source: 'Oat core', js: true,
    description: 'Rich contextual content positioned from a trigger.',
    markup: `<ot-dropdown><button popovertarget="registry-popover" class="outline">Open popover</button><article class="card" popover id="registry-popover"><header><h3>Share project</h3><p>Anyone with the link can view.</p></header><label data-field>Link<input value="https://example.com/project"></label></article></ot-dropdown>`,
    api: [['popover', 'Uses the native Popover API for light dismissal and Escape handling.'], ['popovertarget', 'Associates the native trigger with its popover.'], ['ot-dropdown', 'Adds viewport-aware positioning and restores trigger focus.']]
  },
  {
    slug: 'progress', name: 'Progress', source: 'Oat core', js: false,
    description: 'Native progress and meter elements for work and bounded measurements.',
    examples: [
      { title: 'Progress', slug: 'preview', markup: `<div class="vstack"><label>Uploading <progress value="64" max="100">64%</progress></label><label>Preparing <progress>Working…</progress></label></div>` },
      { title: 'Meter', slug: 'meter', markup: `<div class="vstack"><label>Storage healthy <meter min="0" max="100" low="45" high="80" optimum="20" value="28">28%</meter></label><label>Storage filling <meter min="0" max="100" low="45" high="80" optimum="20" value="68">68%</meter></label><label>Storage critical <meter min="0" max="100" low="45" high="80" optimum="20" value="92">92%</meter></label></div>` }
    ]
  },
  {
    slug: 'radio-group', name: 'Radio Group', source: 'Oat core', js: false,
    description: 'A native fieldset of mutually exclusive choices.',
    markup: `<fieldset><legend>Notification frequency</legend><div class="vstack"><label><input type="radio" name="frequency" checked> Daily</label><label><input type="radio" name="frequency"> Weekly</label><label><input type="radio" name="frequency"> Never</label></div></fieldset>`
  },
  {
    slug: 'select', name: 'Select', source: 'Oatbase', js: true,
    description: 'A custom listbox progressively enhanced from a native select.',
    popup: true,
    markup: `<label data-field>Fruit<ot-select data-placeholder="Select a fruit"><select name="fruit" aria-label="Fruit"><option value="" disabled selected>Select a fruit</option><option value="apple">Apple</option><option value="banana">Banana</option><option value="blueberry" disabled>Blueberry (unavailable)</option><option value="grapes">Grapes</option></select></ot-select><small data-hint>The native select remains the form value and no-JavaScript fallback.</small></label>`,
    api: [['data-placeholder', 'Fallback text when the native select has no chosen value.'], ['value', 'Reads or assigns the underlying native select value.'], ['oatbase:change', 'Emits the selected value and source option.'], ['option[disabled]', 'Produces a visible but unavailable listbox option.']]
  },
  {
    slug: 'scroll-area', name: 'Scroll Area', source: 'Oatbase', js: false,
    description: 'Contained overflow with subtle, theme-aware scrollbars.',
    examples: [
      { title: 'Vertical', slug: 'preview', markup: `<div class="scroll-area card" role="region" aria-label="Review checklist" tabindex="0" style="max-height:15rem"><div class="vstack"><h3>Review checklist</h3><p><strong>Semantics</strong> Confirm the native document remains useful before enhancement.</p><p><strong>Keyboard</strong> Exercise the expected focus and arrow-key paths.</p><p><strong>Forms</strong> Verify submission, reset, validity, and disabled state.</p><p><strong>Themes</strong> Check every preset in light and dark appearance.</p><p><strong>Motion</strong> Respect reduced-motion preferences.</p><p><strong>Size</strong> Measure raw, gzip, and Brotli output.</p><p>The native scrollbar inherits the active Oat theme.</p></div></div>` },
      { title: 'Horizontal', slug: 'horizontal', markup: `<div class="scroll-area card" data-orientation="horizontal" role="region" aria-label="Day itinerary" tabindex="0" style="max-width:32rem"><article class="card" style="min-width:16rem"><header class="hstack justify-between"><strong>Kyoto</strong><time datetime="08:20">08:20</time></header><p>Morning train from platform four.</p></article><article class="card" style="min-width:16rem"><header class="hstack justify-between"><strong>Uji</strong><time datetime="11:30">11:30</time></header><p>Tea workshop beside the river.</p></article><article class="card" style="min-width:16rem"><header class="hstack justify-between"><strong>Nara</strong><time datetime="16:10">16:10</time></header><p>Lantern walk before sunset.</p></article></div>` }
    ],
    api: [['tabindex="0"', 'Makes overflowing content reachable by keyboard without adding custom JavaScript.'], ['role="region" and aria-label', 'Give the focusable scroll container a useful accessible name.'], ['data-orientation="horizontal"', 'Lays direct children out in one horizontally scrollable row.']]
  },
  {
    slug: 'sidebar', name: 'Sidebar', source: 'Oat core', js: true,
    description: 'Responsive application navigation with desktop and mobile behavior.',
    markup: `<div data-sidebar-layout="always" style="height:18rem;border:1px solid var(--border);border-radius:var(--radius-medium);overflow:hidden"><nav data-topnav><button data-sidebar-toggle aria-label="Toggle sidebar">☰</button><strong>Workspace</strong></nav><aside data-sidebar><header><strong>Navigation</strong></header><nav><ul><li><a href="#/" aria-current="page">Overview</a></li><li><a href="#/">Projects</a></li><li><details open><summary>Settings</summary><ul><li><a href="#/">Profile</a></li><li><a href="#/">Team</a></li></ul></details></li></ul></nav><footer><small>Signed in</small></footer></aside><main class="p-4"><h3>Dashboard</h3><p>Main application content.</p></main></div>`,
    api: [['data-sidebar-layout', 'Creates the top navigation, sidebar, and main-content grid.'], ['data-sidebar-layout="always"', 'Also permits collapsing the sidebar on desktop.'], ['data-sidebar-toggle', 'Toggles data-sidebar-open on the nearest layout.'], ['data-sidebar-open', 'Represents the visible mobile sidebar or collapsed desktop sidebar state.']]
  },
  {
    slug: 'skeleton', name: 'Skeleton', source: 'Oat core', js: false,
    description: 'Placeholder surfaces that preserve layout while content loads.',
    markup: `<article class="card"><div role="status" class="skeleton box"><span class="visually-hidden">Loading profile image</span></div><div role="status" class="skeleton line"><span class="visually-hidden">Loading name</span></div><div role="status" class="skeleton line"><span class="visually-hidden">Loading description</span></div><div role="status" class="skeleton line" style="width:75%"><span class="visually-hidden">Loading description</span></div></article>`
  },
  {
    slug: 'slider', name: 'Slider', source: 'Oat core', js: false,
    description: 'A styled native range input with optional live output.',
    markup: `<label data-field>Temperature <output id="registry-temperature-output">50</output><input type="range" min="0" max="100" value="50" oninput="document.getElementById('registry-temperature-output').value=this.value"></label>`
  },
  {
    slug: 'spinner', name: 'Spinner', source: 'Oat core', js: false,
    description: 'Loading indicators through the semantic aria-busy state.',
    examples: [
      { title: 'Sizes', slug: 'preview', markup: `<div class="hstack"><span aria-busy="true" data-spinner="small"><span class="visually-hidden">Loading</span></span><span aria-busy="true"><span class="visually-hidden">Loading</span></span><span aria-busy="true" data-spinner="large"><span class="visually-hidden">Loading</span></span><button aria-busy="true" disabled>Loading</button></div>` },
      { title: 'Overlay', slug: 'overlay', markup: `<article class="card" aria-busy="true" data-spinner="overlay"><div><h3>Project activity</h3><p>Refreshing the latest events and collaborators.</p><button disabled>View activity</button></div></article>` }
    ]
  },
  {
    slug: 'switch', name: 'Switch', source: 'Oat core', js: false,
    description: 'A native checkbox presented as an immediate on/off setting.',
    markup: `<div class="vstack"><label><input type="checkbox" role="switch" checked> Email notifications</label><label><input type="checkbox" role="switch"> Public profile</label><label><input type="checkbox" role="switch" disabled> Disabled</label></div>`
  },
  {
    slug: 'table', name: 'Table', source: 'Oat core', js: false,
    description: 'Readable native tables with responsive horizontal overflow.',
    markup: `<div class="table"><table><thead><tr><th>Project</th><th>Status</th><th>Members</th><th>Updated</th></tr></thead><tbody><tr><td>Oatbase</td><td><span class="badge" data-variant="success">Active</span></td><td>4</td><td><time datetime="2026-09-02">Sep 2</time></td></tr><tr><td>Website</td><td><span class="badge" data-variant="warning">Review</span></td><td>7</td><td><time datetime="2026-09-01">Sep 1</time></td></tr><tr><td>Mobile</td><td><span class="badge">Backlog</span></td><td>3</td><td><time datetime="2026-08-29">Aug 29</time></td></tr></tbody><tfoot><tr><th scope="row">Total</th><td></td><td>14</td><td></td></tr></tfoot></table></div>`
  },
  {
    slug: 'tabs', name: 'Tabs', source: 'Oat core', js: true,
    description: 'Keyboard-accessible sections with roving tab focus.',
    markup: `<ot-tabs><div role="tablist" aria-label="Account"><button role="tab" aria-selected="true">Account</button><button role="tab" aria-selected="false">Password</button></div><section role="tabpanel"><p>Update your account details.</p></section><section role="tabpanel" hidden><p>Change your password.</p></section></ot-tabs>`,
    api: [['data-anchor', 'Optionally synchronizes the active tab with a named URL hash parameter.'], ['activeIndex', 'Reads or changes the active zero-based tab index.'], ['ot-tab-change', 'Emits the active index and tab after activation.']]
  },
  {
    slug: 'tag-input', name: 'Tag Input', source: 'Oat core', js: true,
    description: 'Multiple free-form values progressively enhanced from a native text input.',
    examples: [
      { title: 'Interactive tags', slug: 'preview', markup: `<label data-field>Topics<ot-taginput value="design, accessibility"><input placeholder="Add a topic…" maxlength="24" list="registry-topic-options"></ot-taginput><datalist id="registry-topic-options"><option value="performance"></option><option value="semantics"></option><option value="testing"></option></datalist><small data-hint>Press Enter or comma to add a tag; Backspace removes the last.</small></label>` },
      { title: 'Disabled', slug: 'disabled', markup: `<label data-field>Locked topics<ot-taginput value="stable, reviewed" disabled><input placeholder="No changes allowed"></ot-taginput></label>` }
    ],
    api: [['value', 'Reads or assigns an array of strings or displayable objects.'], ['disabled', 'Reflects the disabled attribute onto the native input.'], ['input', 'Bubbles after a tag is added or removed; detail contains the current values.']]
  },
  {
    slug: 'textarea', name: 'Textarea', source: 'Oat core', js: false,
    description: 'A native multiline text field with vertical resizing.',
    markup: `<label data-field>Message<textarea rows="5" placeholder="Write a message…"></textarea><small data-hint>Maximum 500 characters.</small></label>`
  },
  {
    slug: 'theme-switcher', name: 'Theme Switcher', source: 'Oatbase', js: true,
    description: 'System, light, and dark appearance selection with persistence.',
    examples: [
      { title: 'Explicit choices', slug: 'preview', markup: `<section id="theme-explicit-preview" class="card vstack"><ot-theme-switcher data-storage-key="oatbase-demo-theme" data-target="#theme-explicit-preview"><button type="button" class="ghost small" data-theme-value="system">System</button><button type="button" class="ghost small" data-theme-value="light">Light</button><button type="button" class="ghost small" data-theme-value="dark">Dark</button></ot-theme-switcher><small class="text-light">This preview is independently themed.</small></section>` },
      { title: 'Compact toggle', slug: 'toggle', markup: `<section id="theme-toggle-preview" class="card vstack"><ot-theme-switcher data-storage-key="oatbase-toggle-theme" data-target="#theme-toggle-preview"><button type="button" class="outline icon" data-theme-toggle><span data-theme-content="system" aria-hidden="true">◐</span><span data-theme-content="light" aria-hidden="true">☀</span><span data-theme-content="dark" aria-hidden="true">☾</span><span class="visually-hidden" data-theme-label>Change theme</span></button></ot-theme-switcher><small class="text-light">The compact control cycles the scoped surface.</small></section>` }
    ],
    api: [['data-storage-key', 'Selects the localStorage key used for persistence.'], ['data-default', 'Sets the initial mode when no saved preference exists.'], ['data-target', 'Scopes appearance to an element selected in the current document; defaults to the document root.'], ['data-theme-value', 'Creates an explicit system, light, or dark choice.'], ['data-theme-toggle', 'Cycles one compact button through the three modes.'], ['change', 'Emits the selected mode in event.detail.value.']]
  },
  {
    slug: 'toast', name: 'Toast', source: 'Oat core', js: true,
    description: 'Transient, non-blocking notifications through Oat’s global toast API.',
    markup: `<div class="hstack"><button onclick="window.ot?.toast('Project saved')">Default</button><button class="outline" onclick="window.ot?.toast('Your changes are live.', 'Saved', { variant: 'success' })">Success</button><button class="outline" onclick="window.ot?.toast('Review your changes.', 'Warning', { variant: 'warning', placement: 'bottom-center' })">Warning</button><button class="outline" data-variant="danger" onclick="window.ot?.toast('The upload failed.', 'Error', { variant: 'danger', duration: 0 })">Persistent error</button></div>`,
    api: [['ot.toast(message, title, options)', 'Shows a text toast. Options include variant, placement, and duration.'], ['ot.toast.el(element, options)', 'Shows cloned custom markup or a template.'], ['ot.toast.clear(placement)', 'Clears all toasts or one placement.']]
  },
  {
    slug: 'tooltip', name: 'Tooltip', source: 'Oat core', js: true,
    description: 'Short contextual labels for controls and unfamiliar icons.',
    imports: `import '@oddship/oatbase/css';
import '@oddship/oatbase';
import '@oddship/oatbase/tooltip-compat.css';
import '@oddship/oatbase/tooltip-compat';`,
    usageNote: 'Oat provides the semantic tooltip foundation. The separately loaded Oatbase compatibility enhancer adds viewport flipping, shifting, hoverable content, and Escape dismissal without adding global listeners to either aggregate bundle.',
    markup: `<div class="hstack"><button class="outline icon" title="Tooltip on top" aria-label="Top placement">↑</button><button class="outline icon" title="Tooltip on bottom" data-tooltip-placement="bottom" aria-label="Bottom placement">↓</button><button class="outline icon" title="Tooltip on left" data-tooltip-placement="left" aria-label="Left placement">←</button><button class="outline icon" title="Tooltip on right" data-tooltip-placement="right" aria-label="Right placement">→</button></div>`,
    api: [['title', 'Converted to data-tooltip after load while preserving an accessible name.'], ['data-tooltip-placement', 'Sets the preferred top, bottom, left, or right placement; Oatbase flips and shifts it to remain in the viewport.'], ['Escape', 'Dismisses the visible tooltip until its trigger loses hover and focus.']]
  },
  {
    slug: 'upload', name: 'Upload', source: 'Oat core', js: true,
    description: 'A native file input enhanced with drag-and-drop and removable file badges.',
    examples: [
      { title: 'File picker', slug: 'preview', markup: `<ot-upload><input type="file" name="assets" multiple accept="image/*" hidden><button type="button">Choose images</button><div data-files><small data-hint>Drop images here or use the file picker.</small></div></ot-upload>` },
      { title: 'Disabled', slug: 'disabled', markup: `<ot-upload><input type="file" disabled hidden><button type="button" disabled>Uploads disabled</button><div data-files><small data-hint>File changes are locked.</small></div></ot-upload>` }
    ],
    api: [['input[type="file"]', 'Remains the native form control and source of truth.'], ['multiple', 'Allows more than one dropped or selected file.'], ['data-files', 'Receives removable badges for selected files.'], ['change', 'The native change event bubbles after selection, dropping, or removal.']]
  },
  {
    slug: 'copy-button', name: 'Copy Button', source: 'Oatbase', js: true,
    description: 'Copy text from a nearby semantic source with accessible feedback.',
    examples: [
      { title: 'Nearby source', slug: 'preview', markup: `<ot-copy><input data-copy-source value="npm install @oddship/oatbase" readonly aria-label="Install command"><button type="button" class="outline" data-copy-button>Copy</button></ot-copy>` },
      { title: 'External target', slug: 'target', markup: `<div class="vstack"><pre id="registry-copy-target"><code>import '@oddship/oatbase/css';</code></pre><ot-copy data-copy-target="registry-copy-target" data-copied="Copied import"><button type="button" class="outline" data-copy-button>Copy import</button></ot-copy></div>` }
    ],
    api: [['data-copy-source', 'Marks a descendant input, textarea, or text container as the source.'], ['data-copy-target', 'References a source elsewhere by id.'], ['data-copied', 'Customizes the temporary success label.'], ['value', 'Returns the normalized source text.'], ['oatbase:copy', 'Emits the copied value after success.']]
  },
  {
    slug: 'multiselect', name: 'Multiselect', source: 'Oatbase', js: true,
    description: 'Multiple selection progressively enhanced from a native select.',
    popup: true,
    markup: `<label data-field>Project members<ot-multiselect data-placeholder="Choose members"><select name="members" multiple aria-label="Project members"><option value="ada" selected>Ada Lovelace</option><option value="grace">Grace Hopper</option><option value="margaret" selected>Margaret Hamilton</option><option value="barbara" disabled>Barbara Liskov (unavailable)</option></select></ot-multiselect><small data-hint>Select any number of available people.</small></label>`,
    api: [['data-placeholder', 'Text shown when no options are selected.'], ['value', 'Reads or assigns an array of native option values.'], ['oatbase:change', 'Emits the values and most recently changed source option.'], ['option[disabled]', 'Produces a visible but unavailable option.']]
  },
  {
    slug: 'password-field', name: 'Password Field', source: 'Oatbase', js: true,
    description: 'A native password input with an accessible visibility toggle.',
    markup: `<label data-field>Password<ot-password data-show-label="Reveal" data-hide-label="Conceal"><input type="password" value="correct horse battery staple" autocomplete="current-password"><button type="button" class="outline" data-password-toggle>Reveal</button></ot-password><small data-hint>The input remains a native password control.</small></label>`,
    api: [['data-password-toggle', 'Marks the button that changes the native input type.'], ['data-show-label', 'Customizes the concealed-state button label.'], ['data-hide-label', 'Customizes the visible-state button label.']]
  },
  {
    slug: 'rating', name: 'Rating', source: 'Oatbase', js: false,
    description: 'A keyboard-accessible rating built from native radio inputs.',
    markup: `<fieldset data-rating><legend>Rate this component</legend><input id="rating-5" type="radio" name="rating" value="5" aria-label="5 stars"><label for="rating-5" aria-hidden="true">★</label><input id="rating-4" type="radio" name="rating" value="4" aria-label="4 stars" checked><label for="rating-4" aria-hidden="true">★</label><input id="rating-3" type="radio" name="rating" value="3" aria-label="3 stars"><label for="rating-3" aria-hidden="true">★</label><input id="rating-2" type="radio" name="rating" value="2" aria-label="2 stars"><label for="rating-2" aria-hidden="true">★</label><input id="rating-1" type="radio" name="rating" value="1" aria-label="1 star"><label for="rating-1" aria-hidden="true">★</label></fieldset>`
  },
  {
    slug: 'segmented-control', name: 'Segmented Control', source: 'Oatbase', js: false,
    description: 'A compact single-choice control backed by native radio inputs.',
    markup: `<fieldset data-segmented><legend>View density</legend><label><input type="radio" name="density" value="comfortable" checked><span>Comfortable</span></label><label><input type="radio" name="density" value="compact"><span>Compact</span></label><label><input type="radio" name="density" value="dense"><span>Dense</span></label></fieldset>`
  },
  {
    slug: 'splitter', name: 'Splitter', source: 'Oatbase', js: true,
    description: 'Resizable two-panel layout with pointer and keyboard control.',
    examples: [
      { title: 'Horizontal split', slug: 'preview', wide: true, markup: `<ot-splitter data-value="42" data-min="25" data-max="75"><section><strong>Navigation</strong><p>Drag the divider or use Left and Right.</p></section><button type="button" data-splitter aria-label="Resize panels"></button><section><strong>Content</strong><p>Both panes remain independently scrollable.</p></section></ot-splitter>` },
      { title: 'Vertical split', slug: 'vertical', wide: true, markup: `<ot-splitter aria-orientation="vertical" data-value="45" data-min="25" data-max="75"><section><strong>Editor</strong><p>Use Up and Down to resize.</p></section><button type="button" data-splitter aria-label="Resize editor and console"></button><section><strong>Console</strong><p>Output remains scrollable.</p></section></ot-splitter>` }
    ],
    api: [['aria-orientation', 'Selects a horizontal panel arrangement by default or a vertical stack.'], ['data-value', 'Initial first-panel percentage.'], ['data-min / data-max', 'Clamp the allowed percentage range.'], ['value', 'Reads or changes the current percentage.'], ['oatbase:resize', 'Emits the current value during pointer or keyboard resizing.']]
  },
  {
    slug: 'log-viewer', name: 'Log Viewer', source: 'Oatbase', js: true,
    description: 'A dependency-free live log surface with follow-tail behavior.',
    examples: [
      {
        title: 'Live output',
        slug: 'preview',
        markup: `<ot-log-viewer><header data-log-toolbar><strong>Deployment output</strong><label><input type="checkbox" data-log-follow checked> Follow</label><output data-log-status aria-live="polite"></output></header><pre class="scroll-area" role="log" aria-label="Deployment output" tabindex="0"><code data-log-content><span data-log-line>10:42:01  Preparing release</span><span data-log-line>10:42:03  Upload complete</span><span data-log-line>10:42:04  Health check passed</span></code></pre><footer><button type="button" class="outline small" data-log-append>Append line</button></footer></ot-log-viewer>`,
        javascript: `import '@oddship/oatbase/log-viewer';

const viewer = document.querySelector('ot-log-viewer');
const appendButton = document.querySelector('[data-log-append]');

appendButton.addEventListener('click', () => {
  viewer.append('10:42:05  Worker ready');
});`,
        mount(root) {
          const viewer = root.querySelector('ot-log-viewer');
          root.querySelector('[data-log-append]').addEventListener('click', () => {
            viewer.append('10:42:05  Worker ready');
          });
        }
      },
      { title: 'Compact', slug: 'compact', markup: `<ot-log-viewer data-size="compact"><pre class="scroll-area" role="log" aria-label="Build output" tabindex="0"><code data-log-content><span data-log-line>$ bun test</span><span data-log-line>42 pass · 0 fail</span></code></pre></ot-log-viewer>` }
    ],
    api: [['[role="log"]', 'Required semantic, keyboard-focusable log region.'], ['data-log-content', 'Optional mutation boundary and line-count source.'], ['data-log-follow', 'Native checkbox that controls follow-tail behavior.'], ['data-log-status', 'Receives the current line count.'], ['append(value)', 'Appends application-provided text without parsing or fetching it.'], ['oatbase:update', 'Emits { lines, following } when content changes.'], ['oatbase:follow', 'Emits when follow mode changes or user scrolling disables it.']]
  },
  {
    slug: 'repeater', name: 'Repeater', source: 'Oatbase', js: true,
    description: 'Add and remove repeated native form fields from a semantic template.',
    markup: `<form><ot-repeater data-min="1" data-max="4" data-layout="key-value"><div data-repeater-list><fieldset data-repeater-item><legend>Variable <output data-repeater-position>1</output></legend><label data-field>Key<input name="variables[0][key]" value="REGION"></label><span data-repeater-separator aria-hidden="true">=</span><label data-field>Value<input name="variables[0][value]" value="us-east-1"></label><button type="button" class="ghost" data-repeater-remove aria-label="Remove variable 1">Remove</button></fieldset></div><div data-repeater-actions><button type="button" class="outline" data-repeater-add>Add variable</button><button type="reset" class="ghost">Reset</button></div><template data-repeater-template><fieldset data-repeater-item><legend>Variable <output data-repeater-position></output></legend><label data-field>Key<input name="variables[__index__][key]" data-repeater-focus></label><span data-repeater-separator aria-hidden="true">=</span><label data-field>Value<input name="variables[__index__][value]"></label><button type="button" class="ghost" data-repeater-remove>Remove</button></fieldset></template></ot-repeater></form>`,
    api: [['data-repeater-list', 'Required container for direct repeated children.'], ['template[data-repeater-template]', 'Required native template cloned by add().'], ['__index__', 'Replaced in cloned attribute values with a stable item index.'], ['data-min / data-max', 'Disable removal or addition at the declared limits.'], ['add() / remove(item)', 'Mutate the native field collection and return the result.'], ['items', 'Returns the current direct repeated elements.'], ['oatbase:add / oatbase:remove / oatbase:reset', 'Describe changes without replacing native form submission.']]
  },
  {
    slug: 'stat', name: 'Stat', source: 'Oatbase', js: false,
    description: 'Responsive key metrics using a semantic description list.',
    markup: `<dl data-stats><div><dt>Revenue</dt><dd>$24.8k<small>↑ 12% this month</small></dd></div><div><dt>Customers</dt><dd>1,429<small>↑ 84 this week</small></dd></div><div><dt>Churn</dt><dd>1.8%<small>↓ 0.3 points</small></dd></div></dl>`
  },
  {
    slug: 'stepper', name: 'Stepper', source: 'Oatbase', js: false,
    description: 'Progress through an ordered multi-step task.',
    examples: [
      { title: 'Task progress', slug: 'preview', markup: `<ol data-stepper aria-label="Checkout progress"><li data-complete>Account</li><li aria-current="step">Shipping</li><li>Payment</li><li>Confirm</li></ol>` },
      { title: 'Compact status track', slug: 'status', markup: `<ol data-stepper data-variant="status" aria-label="Workflow run"><li data-status="complete" aria-label="Validate: complete">Validate</li><li data-status="complete" aria-label="Build: complete">Build</li><li data-status="running" aria-current="step" aria-label="Deploy: running">Deploy</li><li data-status="waiting" aria-label="Verify: waiting">Verify</li></ol>` }
    ],
    api: [['data-complete', 'Marks a completed step in task progress.'], ['aria-current="step"', 'Identifies the active step.'], ['data-variant="status"', 'Uses a compact workflow-status track.'], ['data-status', 'Styles complete, running, waiting, failed, skipped, or cancelled states; include the state in accessible text.']]
  },
  {
    slug: 'timeline', name: 'Timeline', source: 'Oatbase', js: false,
    description: 'Chronological events represented as a semantic ordered list.',
    markup: `<ol data-timeline><li data-status="complete"><div data-slot="header"><time datetime="2026-09-01">September 1, 2026</time><span class="badge" data-variant="success">Ready</span></div><h3>Release prepared</h3><p>Version 0.1.0 is ready for publication.</p><div data-slot="actions"><a href="#/installation">Review installation</a></div></li><li aria-current="step"><time datetime="2026-08-31">August 31, 2026</time><h3>Review approved</h3><p>Accessibility checks passed.</p></li><li data-status="pending"><time datetime="2026-08-29">August 29, 2026</time><h3>Work started</h3><p>The extension entered development.</p></li></ol>`
  },
  {
    slug: 'tree', name: 'Tree', source: 'Oatbase', js: true,
    description: 'Hierarchical navigation with disclosure and arrow-key movement.',
    markup: `<ot-tree aria-label="Project files"><ul><li aria-expanded="true"><button type="button">src</button><ul><li aria-expanded="true"><button type="button">components</button><ul><li><button type="button">button.js</button></li><li><button type="button">dialog.js</button></li></ul></li><li><button type="button">index.js</button></li></ul></li><li aria-expanded="false"><button type="button">tests</button><ul><li><button type="button">app.test.js</button></li></ul></li><li><button type="button">package.json</button></li></ul></ot-tree>`,
    api: [['aria-expanded', 'Marks branch items and controls disclosure state.'], ['Arrow Up / Arrow Down', 'Moves through visible tree items.'], ['Arrow Right / Arrow Left', 'Expands or collapses the current branch.'], ['Home / End', 'Moves to the first or last visible item.']]
  },
  {
    slug: 'toggle', name: 'Toggle', source: 'Oatbase', js: true,
    description: 'An independent on/off action backed by a native pressed button.',
    markup: `<div class="hstack"><ot-toggle><button type="button" class="outline" aria-pressed="false">Pin sidebar</button></ot-toggle><ot-toggle pressed><button type="button" class="outline" aria-pressed="true">Pinned</button></ot-toggle><ot-toggle><button type="button" class="outline" aria-pressed="false" disabled>Unavailable</button></ot-toggle></div>`,
    api: [['pressed', 'Boolean attribute and property synchronized with aria-pressed.'], ['oatbase:change', 'Emits the new pressed state.'], ['disabled / aria-disabled', 'Prevents state changes through the native button.']]
  },
  {
    slug: 'toolbar', name: 'Toolbar', source: 'Oatbase', js: true,
    description: 'Related controls with one Tab stop and arrow-key navigation.',
    examples: [
      { title: 'Horizontal', slug: 'preview', markup: `<div class="hstack"><ot-toolbar role="toolbar" aria-label="Text formatting"><ot-toggle><button type="button" class="ghost" aria-pressed="true"><strong>B</strong><span class="visually-hidden">Bold</span></button></ot-toggle><ot-toggle><button type="button" class="ghost" aria-pressed="false"><em>I</em><span class="visually-hidden">Italic</span></button></ot-toggle><span role="separator" aria-orientation="vertical"></span><button type="button" class="ghost">Undo</button><button type="button" class="ghost">Redo</button></ot-toolbar></div>` },
      { title: 'Vertical', slug: 'vertical', markup: `<div class="hstack"><ot-toolbar role="toolbar" aria-label="Canvas tools" aria-orientation="vertical"><button type="button" class="ghost">Select</button><button type="button" class="ghost">Draw</button><span role="separator" aria-orientation="horizontal"></span><button type="button" class="ghost">Comment</button></ot-toolbar></div>` },
      { title: 'Full-width and floating', slug: 'layouts', wide: true, markup: `<div class="vstack"><ot-toolbar data-full role="toolbar" aria-label="Document actions"><button type="button" class="ghost">Back</button><span data-slot="spacer"></span><button type="button" class="ghost">Preview</button><button type="button">Publish</button></ot-toolbar><ot-toolbar data-floating role="toolbar" aria-label="Floating tools"><button type="button" class="ghost">Move</button><button type="button" class="ghost">Comment</button></ot-toolbar></div>` }
    ],
    api: [['aria-orientation', 'Selects horizontal or vertical layout and arrow-key axis.'], ['data-toolbar-item', 'Opts a non-button interactive descendant into roving focus.'], ['aria-disabled', 'Excludes an item from keyboard navigation.']]
  },
  {
    slug: 'choice-card', name: 'Choice Card', source: 'Oatbase', js: false,
    description: 'Rich single or multiple choices backed by native form inputs.',
    examples: [
      { title: 'Single choice', slug: 'preview', wide: true, markup: `<fieldset data-choice-cards><legend>Choose a plan</legend><label data-choice-card><input type="radio" name="registry-plan" value="starter" checked><span><strong>Starter</strong><small>For personal projects.</small></span></label><label data-choice-card><input type="radio" name="registry-plan" value="team"><span><strong>Team</strong><small>For collaborating groups.</small></span></label><label data-choice-card><input type="radio" name="registry-plan" value="business" disabled><span><strong>Business</strong><small>Contact sales to enable.</small></span></label></fieldset>` },
      { title: 'Multiple choices', slug: 'multiple', wide: true, markup: `<fieldset data-choice-cards><legend>Include reports</legend><label data-choice-card><input type="checkbox" name="reports" value="weekly" checked><span><strong>Weekly summary</strong><small>Activity and project health.</small></span></label><label data-choice-card><input type="checkbox" name="reports" value="security"><span><strong>Security digest</strong><small>Authentication and access events.</small></span></label></fieldset>` }
    ]
  },
  {
    slug: 'otp-input', name: 'OTP Input', source: 'Oatbase', js: true,
    description: 'A segmented verification-code view over one native, autofill-friendly input.',
    examples: [
      { title: 'Verification code', slug: 'preview', markup: `<form><div data-field><label for="registry-otp">Verification code</label><ot-otp data-length="6"><input id="registry-otp" name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required aria-describedby="registry-otp-hint"></ot-otp><small id="registry-otp-hint" data-hint>Enter the six-digit code sent to your device.</small></div></form>` },
      { title: 'Disabled', slug: 'disabled', markup: `<div data-field><label for="registry-otp-disabled">Used code</label><ot-otp data-length="4"><input id="registry-otp-disabled" value="4821" maxlength="4" disabled></ot-otp></div>` }
    ],
    api: [['data-length', 'Sets one to twelve visual slots; defaults to maxlength or six.'], ['value', 'Reads or assigns the underlying native input value.'], ['data-complete', 'Reflects when every slot is filled.'], ['oatbase:complete', 'Emits once when input reaches the configured length.']]
  },
  {
    slug: 'lightbox', name: 'Lightbox', source: 'Oatbase', js: true,
    description: 'An image viewer composed from native links, Dialog, Toolbar, and Buttons.',
    markup: `<ot-lightbox>
  <div class="row">
    <figure class="card col-6">
      <a href="./assets/lightbox-sample-a.svg" data-lightbox-item>
        <img src="./assets/lightbox-sample-a.svg" alt="Abstract saffron sun over blue water" style="display:block;width:100%;height:8rem;object-fit:cover">
      </a>
      <figcaption>Saffron sunset</figcaption>
    </figure>
    <figure class="card col-6">
      <a href="./assets/lightbox-sample-b.svg" data-lightbox-item>
        <img src="./assets/lightbox-sample-b.svg" alt="Abstract green hills under a pale sky" style="display:block;width:100%;height:8rem;object-fit:cover">
      </a>
      <figcaption>Quiet hills</figcaption>
    </figure>
  </div>
  <dialog data-lightbox-dialog closedby="any" aria-label="Image viewer">
    <figure>
      <img data-lightbox-image alt="">
      <figcaption data-lightbox-caption></figcaption>
    </figure>
    <footer>
      <span data-lightbox-status aria-live="polite"></span>
      <ot-toolbar role="toolbar" aria-label="Image controls">
        <button type="button" class="ghost" data-lightbox-previous>← Previous</button>
        <button type="button" class="ghost" data-lightbox-next>Next →</button>
        <button type="button" class="ghost" data-lightbox-close>Close</button>
      </ot-toolbar>
    </footer>
  </dialog>
</ot-lightbox>`,
    api: [['data-lightbox-item', 'Marks a native link or image as a viewable item.'], ['data-lightbox-dialog', 'Marks the composed native dialog.'], ['data-lightbox-image / data-lightbox-caption', 'Receive the active item’s accessible image and caption.'], ['data-lightbox-previous / next / close', 'Opt existing buttons into gallery controls.'], ['open(), close(), next(), previous()', 'Control the viewer without replacing native dialog behavior.'], ['oatbase:open / change / close', 'Expose lifecycle and active-item detail.']]
  },
  {
    slug: 'scrollspy', name: 'Scrollspy', source: 'Oatbase', js: true,
    description: 'Keeps semantic table-of-contents links synchronized with visible headings.',
    markup: `<div class="row">
  <ot-scrollspy class="col-4" data-target="#scrollspy-demo" data-scroll-root="#scrollspy-demo">
    <nav aria-label="Article sections">
      <ul class="unstyled vstack">
        <li><a href="#scrollspy-start">Start</a></li>
        <li><a href="#scrollspy-middle">Middle</a></li>
        <li><a href="#scrollspy-finish">Finish</a></li>
      </ul>
    </nav>
  </ot-scrollspy>
  <article id="scrollspy-demo" class="scroll-area card col-8" role="region" aria-label="Scrollspy article" tabindex="0" style="max-height:14rem">
    <section id="scrollspy-start" style="min-height:12rem"><h3>Start</h3><p>Native links remain useful before enhancement.</p></section>
    <section id="scrollspy-middle" style="min-height:12rem"><h3>Middle</h3><p>The active link receives aria-current.</p></section>
    <section id="scrollspy-finish" style="min-height:12rem"><h3>Finish</h3><p>Scroll position, not styling, is the component’s concern.</p></section>
  </article>
</div>`,
    api: [['data-target', 'Scopes referenced headings to an article or content container.'], ['data-scroll-root', 'Optionally observes an overflow container instead of the page.'], ['data-offset', 'Moves the activation line by a pixel value.'], ['activeId', 'Returns the currently active heading id.'], ['refresh()', 'Re-reads links and targets after application-driven changes.'], ['oatbase:change', 'Emits the active id and heading.']]
  },
  {
    slug: 'footnotes', name: 'Footnotes', source: 'Oatbase', js: true,
    description: 'Adds Oat popover previews to native footnote references without hiding definitions.',
    markup: `<ot-footnotes>
  <p>Oatbase prefers useful native fallbacks.<sup class="footnote-reference"><a href="#footnote-demo-one" data-footnote-ref>1</a></sup></p>
  <ol>
    <li id="footnote-demo-one" data-footnote><p>The reference remains an ordinary anchor, and this original definition remains in the document.</p></li>
  </ol>
</ot-footnotes>`,
    api: [['data-footnote-ref', 'Marks a native anchor whose hash references a definition.'], ['data-footnote', 'Optionally identifies definitions; ordinary id targets also work.'], ['.footnote-reference a', 'Supports Zola’s generated reference markup by default.'], ['.footnote-definition', 'Supports Zola’s generated definition markup by default.']]
  },
  {
    slug: 'reading-progress', name: 'Reading Progress', source: 'Oatbase', js: true,
    description: 'Connects a native progress element to an article or scroll container.',
    markup: `<ot-reading-progress data-target="#reading-progress-content" data-scroll-root="#reading-progress-demo">
  <label>Reading progress <progress value="0" max="100">0%</progress></label>
  <div id="reading-progress-demo" class="scroll-area card" role="region" aria-label="Reading progress article" tabindex="0" style="max-height:14rem">
    <article id="reading-progress-content">
      <section style="min-height:12rem"><h3>Native first</h3><p>The progress element remains understandable without JavaScript.</p></section>
      <section style="min-height:12rem"><h3>Just enough behavior</h3><p>Scroll this article to update its bounded value.</p></section>
      <section style="min-height:12rem"><h3>Complete</h3><p>Layout and placement remain application decisions.</p></section>
    </article>
  </div>
</ot-reading-progress>`,
    api: [['data-target', 'References the article whose reading extent is measured.'], ['data-scroll-root', 'Optionally uses an overflow container instead of the page.'], ['progress', 'Remains the native exposed progress element.'], ['refresh()', 'Reconnects after targets or scroll roots change.']]
  },
  {
    slug: 'data-table', name: 'Data Table', source: 'Oatbase', js: true,
    description: 'Sorting, filtering, and row selection layered onto a native table.',
    examples: [
      { title: 'Interactive table', slug: 'preview', wide: true, markup: `<ot-data-table data-sticky>
  <div data-table-toolbar>
    <label data-field>Filter projects<input type="search" data-table-filter placeholder="Name, owner, or status"></label>
    <output data-table-status aria-live="polite"></output>
    <output data-table-selected aria-live="polite"></output>
  </div>
  <div class="scroll-area" role="region" aria-label="Projects" tabindex="0">
    <table>
      <thead><tr><th><input type="checkbox" data-table-select-all aria-label="Select all visible projects"></th><th data-sort="text">Project</th><th data-sort="text">Owner</th><th data-sort="number">Issues</th><th data-sort="date">Updated</th></tr></thead>
      <tbody>
        <tr><td><input type="checkbox" data-table-select-row value="atlas" aria-label="Select Atlas"></td><th scope="row">Atlas</th><td>Ada</td><td data-sort-value="12">12</td><td data-sort-value="2026-08-31">Aug 31</td></tr>
        <tr><td><input type="checkbox" data-table-select-row value="beacon" aria-label="Select Beacon"></td><th scope="row">Beacon</th><td>Grace</td><td data-sort-value="4">4</td><td data-sort-value="2026-09-01">Sep 1</td></tr>
        <tr><td><input type="checkbox" data-table-select-row value="canvas" aria-label="Select Canvas"></td><th scope="row">Canvas</th><td>Margaret</td><td data-sort-value="21">21</td><td data-sort-value="2026-08-28">Aug 28</td></tr>
      </tbody>
    </table>
  </div>
  <section data-variant="empty" data-size="compact" data-table-empty hidden><h3>No projects found</h3><p>Try another filter.</p></section>
</ot-data-table>` },
      { title: 'Compact density', slug: 'compact', wide: true, markup: `<ot-data-table data-density="compact"><table><thead><tr><th data-sort="text">Member</th><th data-sort="text">Role</th><th>Status</th></tr></thead><tbody><tr><th scope="row">Ada Lovelace</th><td>Admin</td><td><span class="badge" data-variant="success">Active</span></td></tr><tr><th scope="row">Grace Hopper</th><td>Editor</td><td><span class="badge">Invited</span></td></tr></tbody></table></ot-data-table>` }
    ],
    api: [['data-sort="text | number | date"', 'Makes a header sortable using cell text or data-sort-value.'], ['data-table-filter', 'Filters rows by their text or data-filter-value.'], ['data-table-select-row / data-table-select-all', 'Keeps row selection in native checkboxes; select-all affects visible rows.'], ['data-table-status / data-table-selected', 'Optional live outputs for result and selection counts.'], ['refresh()', 'Re-reads application-added rows.'], ['oatbase:sort / filter / select', 'Emit user-driven table state without owning remote data or pagination.']],
    guidance: '<p>Keep fetching, pagination, saved views, column visibility, and destructive bulk actions in application code. Oatbase coordinates the table already in the document.</p>'
  },
  {
    slug: 'description-list', name: 'Description List', source: 'Oatbase', js: false,
    description: 'Aligned key-value metadata built from a native description list.',
    examples: [
      { title: 'Aligned', slug: 'preview', markup: `<dl data-description-list><div><dt>Repository</dt><dd>oddship/oatbase</dd></div><div><dt>License</dt><dd>MIT</dd></div><div><dt>Runtime dependencies</dt><dd>None</dd></div></dl>` },
      { title: 'Stacked', slug: 'stacked', markup: `<dl data-description-list data-layout="stacked"><div><dt>Deploy URL</dt><dd>https://example.test</dd></div><div><dt>Last release</dt><dd><time datetime="2026-09-01">September 1, 2026</time></dd></div></dl>` }
    ]
  },
  {
    slug: 'prose', name: 'Prose', source: 'Oatbase', js: false,
    description: 'Readable long-form content that preserves native document structure.',
    markup: `<article data-prose><h2>Native documents first</h2><p>Prose supplies a measured reading width and consistent flow spacing without changing the meaning of headings, lists, quotes, figures, or tables.</p><blockquote><p>The document remains the interface.</p></blockquote><h3>Useful defaults</h3><ul><li>Responsive media</li><li>Readable list rhythm</li><li>Token-driven spacing</li></ul></article>`
  }
];
