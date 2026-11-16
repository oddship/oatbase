# EsGun selective bundle fixture

This application fixture imports only Oat, Data Table, and Copy Button entry points. It demonstrates the bundle-size path Oatbase supports without making EsGun a library dependency or replacing the release build. Until Oatbase is published, the two Oatbase imports point directly at this source checkout.

From this directory, install dependencies and run:

```sh
esgun install
esgun build
```

EsGun reads `esgun.config.json`, bundles the JavaScript and imported CSS, and copies the HTML shell into `dist/`. After publication, the relative Oatbase imports can be replaced with the equivalent `@oddship/oatbase/*` package entry points. The package-level `components.json` manifest lists the files and component dependencies an installer can select.

The application imports `copyIcon` through the optional `icons/tabler` barrel.
Run `node verify-icons.js` after building to check that Copy is present and the
unused Check and Sparkles definitions are absent. No icon package is a fixture
runtime dependency. Inline the same SVG in a static template to avoid icon
JavaScript entirely.
