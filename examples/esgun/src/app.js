import './app.css';
import '@knadh/oat/oat.min.js';
import '../../../src/js/data-table.js';
import '../../../src/js/copy-button.js';

document.querySelector('ot-data-table')?.addEventListener('oatbase:select', event => {
  document.querySelector('[data-selection]').value = `${event.detail.values.length} selected`;
});
