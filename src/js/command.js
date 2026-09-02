import { connectWhenReady, define, emit, nextIndex, setActive, uid } from './base.js';

class OtCommand extends HTMLElement {
  #abort;
  #readyAbort;
  #active = -1;

  connectedCallback() {
    this.#readyAbort?.abort();
    this.#readyAbort = connectWhenReady(this, () => this.#connect());
  }

  disconnectedCallback() {
    this.#readyAbort?.abort();
    this.#abort?.abort();
  }

  get items() {
    return this.list ? [...this.list.querySelectorAll('[data-command-item]')] : [];
  }

  get visibleItems() {
    return this.items.filter(item => !item.hidden && !item.closest('li')?.hidden && !item.hasAttribute('aria-disabled'));
  }

  get query() {
    return this.search?.value.trim() || '';
  }

  open() {
    if (!this.dialog.open) this.dialog.showModal();
    this.search.setAttribute('aria-expanded', 'true');
    this.search.value = '';
    this.#query();
    requestAnimationFrame(() => this.search.focus());
    emit(this, 'oatbase:open');
  }

  close() {
    if (this.dialog.open) this.dialog.close();
    this.search?.setAttribute('aria-expanded', 'false');
    emit(this, 'oatbase:close');
  }

  #connect() {
    this.#abort?.abort();
    this.#abort = new AbortController();
    const signal = this.#abort.signal;
    this.dialog = this.querySelector(':scope > dialog');
    this.search = this.dialog?.querySelector('[data-command-search]');
    this.list = this.dialog?.querySelector('[data-command-list]');
    if (!this.dialog || !this.search || !this.list) return;

    this.list.id ||= uid('oatbase-command');
    this.list.setAttribute('role', 'listbox');
    this.search.setAttribute('role', 'combobox');
    this.search.setAttribute('aria-autocomplete', 'list');
    this.search.setAttribute('aria-expanded', String(this.dialog.open));
    this.search.setAttribute('aria-controls', this.list.id);

    this.querySelectorAll('[data-command-open]').forEach(trigger => {
      trigger.addEventListener('click', event => {
        event.preventDefault();
        this.open();
      }, { signal });
    });
    this.querySelectorAll('[data-command-close]').forEach(trigger => {
      trigger.addEventListener('click', () => this.close(), { signal });
    });
    this.search.addEventListener('input', () => this.#query(), { signal });
    this.search.addEventListener('keydown', event => this.#onKeydown(event), { signal });
    this.list.addEventListener('pointermove', event => this.#onPointerMove(event), { signal });
    this.list.addEventListener('click', event => {
      const item = event.target.closest('[data-command-item]');
      if (item && !item.hasAttribute('aria-disabled')) this.#activate(item);
    }, { signal });
    this.dialog.addEventListener('click', event => {
      const rect = this.dialog.getBoundingClientRect();
      const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
      if (outside) this.close();
    }, { signal });
    this.dialog.addEventListener('close', () => this.search.setAttribute('aria-expanded', 'false'), { signal });
    document.addEventListener('keydown', event => {
      const shortcut = this.dataset.shortcut?.toLowerCase();
      const wantsModK = shortcut === 'mod+k' && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      if (wantsModK) {
        event.preventDefault();
        this.dialog.open ? this.close() : this.open();
      }
    }, { signal });
    this.refresh();
  }

  refresh() {
    if (!this.list || !this.search) return;
    this.#filter();
    this.#sync();
  }

  #query() {
    const accepted = this.dispatchEvent(new CustomEvent('oatbase:query', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { query: this.query }
    }));
    if (accepted) this.#filter();
    this.#sync();
  }

  #filter() {
    if (this.dataset.filter !== 'manual') {
      const query = this.query.toLocaleLowerCase();
      this.items.forEach(item => {
        const terms = `${item.textContent} ${item.dataset.keywords || ''}`.toLocaleLowerCase();
        const row = item.closest('li') || item;
        row.hidden = !terms.includes(query);
      });
    }
  }

  #sync() {
    this.items.forEach(item => {
      item.id ||= uid('oatbase-command-item');
      item.setAttribute('role', 'option');
    });
    this.list.querySelectorAll('[data-command-group]').forEach(group => {
      let sibling = group.nextElementSibling;
      let hasVisibleItem = false;
      while (sibling && !sibling.hasAttribute('data-command-group')) {
        if ((sibling.matches('[data-command-item]') || sibling.querySelector('[data-command-item]')) && !sibling.hidden) hasVisibleItem = true;
        sibling = sibling.nextElementSibling;
      }
      group.hidden = !hasVisibleItem;
    });
    const items = this.visibleItems;
    this.querySelector('[data-command-empty]')?.toggleAttribute('hidden', items.length > 0);
    const current = items.findIndex(item => item.hasAttribute('data-active'));
    this.#setActive(current >= 0 ? current : items.length ? 0 : -1);
  }

  #onKeydown(event) {
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      this.#setActive(nextIndex(event.key, this.#active, this.visibleItems.length));
    } else if (event.key === 'Enter' && this.#active >= 0) {
      event.preventDefault();
      this.#activate(this.visibleItems[this.#active]);
    }
  }

  #onPointerMove(event) {
    const item = event.target.closest('[data-command-item]');
    if (!item || item.closest('li')?.hidden || item.hasAttribute('aria-disabled')) return;
    this.#setActive(this.visibleItems.indexOf(item));
  }

  #setActive(index) {
    this.#active = index;
    const items = this.visibleItems;
    const active = setActive(items, index);
    this.items.forEach(item => item.setAttribute('aria-selected', String(item === active)));
    if (active) this.search.setAttribute('aria-activedescendant', active.id);
    else this.search.removeAttribute('aria-activedescendant');
  }

  #activate(item) {
    if (!item) return;
    const value = item.dataset.value || item.textContent.trim();
    const accepted = this.dispatchEvent(new CustomEvent('oatbase:select', {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { value, item }
    }));
    if (!accepted) return;
    if (!item.hasAttribute('data-keep-open')) this.close();
  }
}

define('ot-command', OtCommand);

export { OtCommand };
