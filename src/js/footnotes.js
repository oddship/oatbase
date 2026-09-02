import { connectWhenReady, define, emit, uid } from './base.js';

class OtFootnotes extends HTMLElement {
  #abort;
  #readyAbort;
  #entries = [];
  #revision = 0;

  connectedCallback() {
    this.#readyAbort?.abort();
    this.#readyAbort = connectWhenReady(this, () => this.refresh());
  }

  disconnectedCallback() {
    this.#readyAbort?.abort();
    this.#abort?.abort();
    this.#revision++;
  }

  get entries() { return [...this.#entries]; }

  refresh() {
    this.#abort?.abort();
    this.#abort = new AbortController();
    const canPopover = typeof HTMLElement.prototype.showPopover === 'function';
    const references = [...this.querySelectorAll('[data-footnote-ref], .footnote-reference a[href^="#"]')]
      .filter(reference => !reference.closest('[data-footnote-popover]'));

    this.#entries = references.map(reference => {
      const targetId = decodeURIComponent(reference.hash.slice(1));
      const definition = targetId && document.getElementById(targetId);
      if (!definition) return null;
      if (!canPopover) return { reference, definition, dropdown: null, popover: null };
      return this.#enhance(reference, definition, targetId);
    }).filter(Boolean);

    this.toggleAttribute('data-enhanced', canPopover && this.#entries.some(entry => entry.popover));
    this.#announce(canPopover);
    return this.entries;
  }

  #announce(enhanced) {
    const revision = ++this.#revision;
    const entries = this.entries;
    queueMicrotask(() => {
      if (this.isConnected && revision === this.#revision) {
        emit(this, 'oatbase:render', { entries, enhanced });
      }
    });
  }

  #enhance(reference, definition, targetId) {
    let dropdown = reference.closest('ot-dropdown[data-footnote-preview]');
    let popover = dropdown?.querySelector(':scope > [data-footnote-popover]');
    if (!dropdown || !popover) {
      dropdown = document.createElement('ot-dropdown');
      dropdown.dataset.footnotePreview = '';
      const parent = reference.parentNode;
      const next = reference.nextSibling;
      dropdown.append(reference);

      popover = document.createElement('aside');
      popover.id = uid('oatbase-footnote');
      popover.className = 'card';
      popover.dataset.footnotePopover = '';
      popover.setAttribute('popover', 'auto');
      popover.setAttribute('role', 'note');
      dropdown.append(popover);
      parent.insertBefore(dropdown, next);
    }

    popover.dataset.footnoteFor = targetId;
    popover.setAttribute('aria-label', `Footnote ${reference.textContent.trim()}`);
    reference.setAttribute('popovertarget', popover.id);
    reference.setAttribute('aria-controls', popover.id);
    this.#render(popover, definition);

    const entry = { reference, definition, dropdown, popover };
    reference.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      if (popover.matches(':popover-open')) popover.hidePopover();
      else popover.showPopover();
    }, { signal: this.#abort.signal });
    popover.addEventListener('toggle', event => {
      emit(this, 'oatbase:toggle', {
        ...entry,
        state: event.newState || (popover.matches(':popover-open') ? 'open' : 'closed')
      });
    }, { signal: this.#abort.signal });
    return entry;
  }

  #render(popover, definition) {
    const content = definition.cloneNode(true);
    content.removeAttribute('id');
    content.querySelector('.footnote-definition-label, [data-footnote-label]')?.remove();
    content.querySelectorAll('[id]').forEach(element => element.removeAttribute('id'));
    content.querySelectorAll('[data-footnote-backref], a[rev="footnote"]').forEach(element => element.remove());
    const body = document.createElement('div');
    while (content.firstChild) body.append(content.firstChild);
    popover.replaceChildren(body);
  }
}

define('ot-footnotes', OtFootnotes);
export { OtFootnotes };
