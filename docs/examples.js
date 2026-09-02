window.OATBASE_FULL_EXAMPLES = [
  {
    slug: 'project-dashboard',
    title: 'Project dashboard',
    description: 'A responsive application shell composed from Sidebar, Stat, Chart, Item, Badge, and native navigation.',
    height: '38.75rem',
    source: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Project dashboard</title>
  <link rel="stylesheet" href="../dist/oatbase.css">
  <script src="../dist/oatbase.js" defer></script>
</head>
<body>
  <div data-sidebar-layout="always">
    <nav data-topnav>
      <button type="button" data-sidebar-toggle aria-label="Toggle navigation">☰</button>
      <strong>Oddship</strong>
      <span class="badge" data-variant="success">Live</span>
    </nav>

    <aside data-sidebar>
      <header><strong>Workspace</strong></header>
      <nav aria-label="Workspace navigation">
        <ul>
          <li><a href="#overview" aria-current="page">Overview</a></li>
          <li><a href="#activity">Activity</a></li>
          <li><a href="#members">Members</a></li>
          <li><details open><summary>Projects</summary><ul><li><a href="#oatbase">Oatbase</a></li><li><a href="#doordarshan">Doordarshan</a></li></ul></details></li>
        </ul>
      </nav>
      <footer><small class="text-light">Signed in as rohan</small></footer>
    </aside>

    <main class="p-4">
      <header class="hstack justify-between mb-6">
        <div><h1>Overview</h1><p class="text-light">A small operational view built from composable primitives.</p></div>
        <button type="button">New project</button>
      </header>

      <dl data-stats class="mb-6">
        <div><dt>Active projects</dt><dd>12<small>↑ 2 this month</small></dd></div>
        <div><dt>Contributors</dt><dd>48<small>Across 7 teams</small></dd></div>
        <div><dt>Deployments</dt><dd>184<small>99.98% successful</small></dd></div>
      </dl>

      <div class="row">
        <figure class="card col-7" data-variant="chart">
          <figcaption><strong>Weekly deployments</strong><small>Last 7 days</small></figcaption>
          <div data-chart-bars role="img" aria-label="Deployments by day: 18, 24, 21, 32, 38, 25, 31">
            <span data-chart-bar data-label="Mon" style="--value:18"></span><span data-chart-bar data-label="Tue" style="--value:24"></span><span data-chart-bar data-label="Wed" style="--value:21"></span><span data-chart-bar data-label="Thu" style="--value:32"></span><span data-chart-bar data-label="Fri" style="--value:38"></span><span data-chart-bar data-label="Sat" style="--value:25"></span><span data-chart-bar data-label="Sun" style="--value:31"></span>
          </div>
        </figure>

        <section class="card col-5" aria-labelledby="recent-projects">
          <h2 id="recent-projects">Recent projects</h2>
          <div class="item-group">
            <a class="item" href="#oatbase"><span data-slot="media">O</span><section><strong>Oatbase</strong><p>Updated <time datetime="2026-09-02T10:34:00Z">10:34 UTC</time></p></section><span>›</span></a>
            <a class="item" href="#doordarshan"><span data-slot="media">D</span><section><strong>Doordarshan</strong><p>Updated <time datetime="2026-09-01">Sep 1</time></p></section><span>›</span></a>
            <a class="item" href="#website"><span data-slot="media">W</span><section><strong>Website</strong><p>Updated <time datetime="2026-08-29">Aug 29</time></p></section><span>›</span></a>
          </div>
        </section>
      </div>
    </main>
  </div>
</body>
</html>`
  },
  {
    slug: 'account-settings',
    title: 'Account settings',
    description: 'A complete native form using Field, Select, Password Field, Choice Card, Switch, Callout, and grouped actions.',
    height: '42.5rem',
    source: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Account settings</title>
  <link rel="stylesheet" href="../dist/oatbase.css">
  <script src="../dist/oatbase.js" defer></script>
</head>
<body>
  <nav data-topnav><strong>Account</strong><a href="#profile">Profile</a><a href="#security">Security</a></nav>
  <main class="container" style="max-width:48rem">
    <header class="mb-6"><h1>Account settings</h1><p class="text-light">Native controls remain valid, submittable, and useful before enhancement.</p></header>

    <form class="card vstack gap-6" onsubmit="event.preventDefault(); window.ot?.toast('Account settings saved', 'Saved', { variant: 'success' })">
      <section>
        <h2>Profile</h2>
        <div class="row">
          <label data-field class="col-6">Display name<input name="name" value="Rohan Verma" required></label>
          <label data-field class="col-6">Email<input type="email" name="email" value="rohan@example.com" required></label>
        </div>
        <label data-field>Timezone
          <ot-select><select name="timezone" aria-label="Timezone"><option>Asia/Kolkata</option><option>Europe/London</option><option>America/New_York</option></select></ot-select>
          <small data-hint>Used for activity dates and scheduled reports.</small>
        </label>
      </section>

      <section>
        <h2>Security</h2>
        <label data-field>Current password
          <ot-password data-show-label="Show" data-hide-label="Hide"><input type="password" name="password" value="correct horse battery staple" autocomplete="current-password"><button type="button" class="outline" data-password-toggle>Show</button></ot-password>
        </label>
        <aside data-callout><strong>Passkeys recommended.</strong> Add a device-bound passkey after saving your profile.</aside>
      </section>

      <fieldset data-choice-cards>
        <legend>Default workspace</legend>
        <label data-choice-card><input type="radio" name="workspace" value="personal" checked><span><strong>Personal</strong><small>Private experiments and drafts.</small></span></label>
        <label data-choice-card><input type="radio" name="workspace" value="oddship"><span><strong>Oddship</strong><small>Shared projects and releases.</small></span></label>
      </fieldset>

      <section class="vstack">
        <label><input type="checkbox" role="switch" name="digest" checked> Weekly activity digest</label>
        <label><input type="checkbox" role="switch" name="security"> Security alerts</label>
      </section>

      <footer class="hstack justify-end"><button type="reset" class="outline">Reset</button><button type="submit">Save changes</button></footer>
    </form>
  </main>
</body>
</html>`
  },
  {
    slug: 'long-form-article',
    title: 'Long-form article',
    description: 'A publishing layout composed from Reading Progress, Scrollspy, Lightbox, Footnotes, Toolbar, and native article structure.',
    height: '42.5rem',
    source: `<!doctype html>
<html lang="en" data-oat-theme="doordarshan">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>A field guide to small interfaces</title>
  <link rel="stylesheet" href="../dist/oatbase.css">
  <link rel="stylesheet" href="../dist/themes/doordarshan.css">
  <script src="../dist/oatbase.js" defer></script>
</head>
<body>
  <nav data-topnav><strong>Field notes</strong><a href="#article">Read</a><a href="#notes">Notes</a></nav>
  <ot-reading-progress data-target="#article"><label class="visually-hidden" for="reading-progress">Reading progress</label><progress id="reading-progress" value="0" max="100">0%</progress></ot-reading-progress>

  <main class="container" style="max-width:64rem">
    <div class="row">
      <ot-scrollspy class="col-3" data-target="#article">
        <nav aria-label="On this page"><ul class="unstyled vstack"><li><a href="#small-pieces">Small pieces</a></li><li><a href="#native-first">Native first</a></li><li><a href="#quiet-tools">Quiet tools</a></li></ul></nav>
      </ot-scrollspy>

      <section class="col-9">
      <ot-footnotes>
        <article id="article" data-prose>
          <header class="mb-8"><span class="badge" data-variant="secondary">Field guide</span><h1>A field guide to small interfaces</h1><p class="text-light">How a restrained component vocabulary makes a site easier to understand, extend, and keep.</p></header>

          <section id="small-pieces"><h2>Small pieces</h2><p>A useful interface starts with ordinary document structure. Components should clarify repeated relationships, not erase the underlying HTML.<sup class="footnote-reference"><a href="#note-one" data-footnote-ref>1</a></sup></p></section>

          <ot-lightbox>
            <div class="row mt-6 mb-6">
              <figure class="card col-6"><a href="./assets/lightbox-sample-a.svg" data-lightbox-item><img src="./assets/lightbox-sample-a.svg" alt="Abstract saffron sun over blue water" style="display:block;width:100%;height:10rem;object-fit:cover"></a><figcaption>Saffron sunset</figcaption></figure>
              <figure class="card col-6"><a href="./assets/lightbox-sample-b.svg" data-lightbox-item><img src="./assets/lightbox-sample-b.svg" alt="Abstract green hills under a pale sky" style="display:block;width:100%;height:10rem;object-fit:cover"></a><figcaption>Quiet hills</figcaption></figure>
            </div>
            <dialog data-lightbox-dialog closedby="any" aria-label="Image viewer"><figure><img data-lightbox-image alt=""><figcaption data-lightbox-caption></figcaption></figure><footer><span data-lightbox-status aria-live="polite"></span><ot-toolbar role="toolbar" aria-label="Image controls"><button type="button" class="ghost" data-lightbox-previous>← Previous</button><button type="button" class="ghost" data-lightbox-next>Next →</button><button type="button" class="ghost" data-lightbox-close>Close</button></ot-toolbar></footer></dialog>
          </ot-lightbox>

          <section id="native-first"><h2>Native first</h2><p>Links should still navigate, forms should still submit, and disclosure should still disclose when enhancement is unavailable. That baseline is a feature, not an implementation detail.</p></section>
          <section id="quiet-tools"><h2>Quiet tools</h2><p>The best supporting controls stay close to the content and preserve its reading rhythm. Scroll position, notes, and image viewing can be enhanced without turning the article into an application.</p></section>

          <footer id="notes"><h2>Notes</h2><ol><li id="note-one" data-footnote><p>Oatbase uses small Web Components only where browser behavior needs coordination.</p></li></ol></footer>
        </article>
      </ot-footnotes>
      </section>
    </div>
  </main>
</body>
</html>`
  },
  {
    slug: 'data-management',
    title: 'Data management',
    description: 'A filterable and selectable project table with application-owned bulk actions.',
    height: '38rem',
    source: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Project data</title>
  <link rel="stylesheet" href="../dist/oatbase.css">
  <script src="../dist/oatbase.js" defer></script>
</head>
<body>
  <main class="container" style="max-width:64rem">
    <header class="hstack justify-between"><div><span class="badge">Workspace</span><h1>Projects</h1><p class="text-light">Sort, filter, and select native table rows.</p></div><button>New project</button></header>
    <ot-data-table data-sticky>
      <div data-table-toolbar>
        <label data-field>Filter<input type="search" data-table-filter placeholder="Project or owner"></label>
        <ot-toolbar role="toolbar" aria-label="Selected project actions" data-bulk-actions hidden><button type="button" class="outline">Archive</button><button type="button" data-variant="danger">Delete</button></ot-toolbar>
        <output data-table-status aria-live="polite"></output><output data-table-selected aria-live="polite"></output>
      </div>
      <div class="scroll-area" role="region" aria-label="Projects" tabindex="0"><table><thead><tr><th><input type="checkbox" data-table-select-all aria-label="Select all visible projects"></th><th data-sort="text">Project</th><th data-sort="text">Owner</th><th data-sort="number">Issues</th><th>Status</th></tr></thead><tbody>
        <tr><td><input type="checkbox" data-table-select-row value="atlas" aria-label="Select Atlas"></td><th scope="row">Atlas</th><td>Ada</td><td>12</td><td><span class="badge" data-variant="success">Active</span></td></tr>
        <tr><td><input type="checkbox" data-table-select-row value="beacon" aria-label="Select Beacon"></td><th scope="row">Beacon</th><td>Grace</td><td>4</td><td><span class="badge">Draft</span></td></tr>
        <tr><td><input type="checkbox" data-table-select-row value="canvas" aria-label="Select Canvas"></td><th scope="row">Canvas</th><td>Margaret</td><td>21</td><td><span class="badge" data-variant="warning">Review</span></td></tr>
      </tbody></table></div>
      <section data-variant="empty" data-size="compact" data-table-empty hidden><h2>No projects found</h2><p>Try another filter.</p></section>
    </ot-data-table>
  </main>
  <script>document.addEventListener('oatbase:select',event=>{const toolbar=document.querySelector('[data-bulk-actions]');toolbar.hidden=event.detail.values.length===0})</script>
</body>
</html>`
  },
  {
    slug: 'master-detail-inbox',
    title: 'Master-detail inbox',
    description: 'A responsive inbox assembled from Item, Splitter, Toolbar, Badge, and native article structure.',
    height: '38rem',
    source: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Inbox</title>
  <link rel="stylesheet" href="../dist/oatbase.css">
  <script src="../dist/oatbase.js" defer></script>
</head>
<body>
  <main class="container" style="max-width:64rem">
    <header class="hstack justify-between"><div><span class="badge">12 unread</span><h1>Inbox</h1></div><button>Compose</button></header>
    <ot-splitter data-value="38" data-min="28" data-max="65">
      <nav class="item-group" aria-label="Messages">
        <a class="item" href="#message" aria-current="page" data-unread><figure data-slot="media" data-variant="avatar">AL</figure><section><h2>Accessibility review</h2><p>The table keyboard flow looks good.</p></section><time data-slot="meta" datetime="2026-09-02T10:42:00Z">10:42</time></a>
        <a class="item" href="#message"><figure data-slot="media" data-variant="avatar">GH</figure><section><h2>Release notes</h2><p>Ready for a final pass.</p></section><time data-slot="meta" datetime="2026-09-02T09:18:00Z">09:18</time></a>
      </nav>
      <button type="button" data-splitter aria-label="Resize message list"></button>
      <article id="message" data-prose><header><span class="badge" data-variant="success">Review</span><h2>Accessibility review</h2><p>From Ada Lovelace · <time datetime="2026-09-02">September 2, 2026</time></p></header><p>The native table remains readable before enhancement. Sorting and filtering only coordinate the rows already in the document.</p><ot-toolbar role="toolbar" aria-label="Message actions"><button type="button">Reply</button><button type="button" class="outline">Forward</button><button type="button" class="ghost">Archive</button></ot-toolbar></article>
    </ot-splitter>
  </main>
</body>
</html>`
  },
  {
    slug: 'workflow-execution',
    title: 'Workflow execution',
    description: 'A Flowctl-inspired run workspace composed from status Stepper, Item, Splitter, Toolbar, and Log Viewer.',
    height: '40rem',
    source: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Workflow execution</title>
  <link rel="stylesheet" href="../dist/oatbase.css">
  <script src="../dist/oatbase.js" defer></script>
</head>
<body>
  <main class="container" style="max-width:68rem">
    <header class="hstack justify-between mb-6"><div><span class="badge" data-variant="success">Running</span><h1>Deploy production</h1><p class="text-light">Application state rendered through reusable Oat and Oatbase primitives.</p></div><ot-toolbar role="toolbar" aria-label="Run actions"><button type="button" class="outline">Cancel</button><button type="button">Rerun</button></ot-toolbar></header>

    <ol data-stepper data-variant="status" aria-label="Workflow status" class="mb-6"><li data-status="complete" aria-label="Validate: complete">Validate</li><li data-status="complete" aria-label="Build: complete">Build</li><li data-status="running" aria-current="step" aria-label="Deploy: running">Deploy</li><li data-status="waiting" aria-label="Verify: waiting">Verify</li></ol>

    <ot-splitter data-value="34" data-min="24" data-max="55">
      <aside class="vstack gap-2">
        <label data-field>Filter actions<input type="search" id="action-filter" placeholder="Action name"></label>
        <nav class="item-group" aria-label="Workflow actions" id="actions">
          <button type="button" class="item" aria-current="page"><span data-slot="media">✓</span><section><strong>Validate</strong><p>Completed in 1.2s</p></section></button>
          <button type="button" class="item"><span data-slot="media">✓</span><section><strong>Build</strong><p>Completed in 8.4s</p></section></button>
          <button type="button" class="item"><span data-slot="media">↻</span><section><strong>Deploy</strong><p>Running for 12s</p></section></button>
          <button type="button" class="item"><span data-slot="media">·</span><section><strong>Verify</strong><p>Waiting</p></section></button>
        </nav>
      </aside>
      <button type="button" data-splitter aria-label="Resize action list and log output"></button>
      <section>
        <ot-log-viewer>
          <header data-log-toolbar><strong>Deploy output</strong><label><input type="checkbox" data-log-follow checked> Follow</label><output data-log-status aria-live="polite"></output></header>
          <pre class="scroll-area" role="log" aria-label="Deploy output" tabindex="0"><code data-log-content><span data-log-line>10:42:01  Resolving deployment target</span><span data-log-line>10:42:04  Uploading release artifact</span><span data-log-line>10:42:09  Starting service</span><span data-log-line>10:42:12  Waiting for health check</span></code></pre>
        </ot-log-viewer>
      </section>
    </ot-splitter>
  </main>
  <script>
    const filter = document.querySelector('#action-filter');
    filter.addEventListener('input', () => document.querySelectorAll('#actions .item').forEach(item => { item.hidden = !item.textContent.toLowerCase().includes(filter.value.toLowerCase()) }));
    document.querySelector('#actions').addEventListener('click', event => { const item = event.target.closest('.item'); if (!item) return; document.querySelectorAll('#actions .item').forEach(row => row.removeAttribute('aria-current')); item.setAttribute('aria-current', 'page') });
  </script>
</body>
</html>`
  }
];
