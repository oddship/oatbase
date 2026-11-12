# CSS-only Next fixture

Follow [INTEGRATIONS.md](../../INTEGRATIONS.md#production-verification).
This isolated fixture stages `../../dist/oatbase.css`; no Oat JavaScript is loaded.
Framework dependencies are pinned here, outside the Oatbase package.

`npm ci && npm run build` runs the webpack production build and checks the emitted
CSS. `npm start` uses loopback port 43128. Run the opt-in root Playwright test
with this directory’s Playwright config (which starts and stops the production server) to verify computed styles and React ownership.

The fixture uses one build worker. On hosts with tight thread limits, run the
build with `RAYON_NUM_THREADS=1 TOKIO_WORKER_THREADS=1`. No external fonts or
application data are used. Do not run this fixture inside a live app build.
