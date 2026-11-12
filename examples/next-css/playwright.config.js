import base from '../../playwright.config.js';
import { fileURLToPath } from 'node:url';

export default {
  ...base,
  testDir: fileURLToPath(new URL('../../tests/e2e/', import.meta.url)),
  testMatch: 'next-css.pw.js',
  outputDir: fileURLToPath(new URL('../../test-results/next-css/', import.meta.url)),
  workers: 1,
  projects: base.projects.filter(project => project.name === 'chromium'),
  webServer: {
    command: 'npm start',
    cwd: fileURLToPath(new URL('./', import.meta.url)),
    url: 'http://127.0.0.1:43128',
    reuseExistingServer: false
  }
};
