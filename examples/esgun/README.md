# EsGun selective bundle fixture

This application fixture imports only Oat, Data Table, and Copy Button entry points. It demonstrates the bundle-size path Oatbase supports without making EsGun a library dependency or replacing the release build. Until Oatbase is published, the two Oatbase imports point directly at this source checkout.

From this directory, install dependencies and run:

```sh
esgun install
esgun build
```

EsGun reads `esgun.config.json`, bundles the JavaScript and imported CSS, and copies the HTML shell into `dist/`. After publication, the relative Oatbase imports can be replaced with the equivalent `@oddship/oatbase/*` package entry points. The package-level `components.json` manifest lists the files and component dependencies an installer can select.
