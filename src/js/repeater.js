import { define, emit } from './base.js';

class OtRepeater extends HTMLElement {
  #abort;
  #initialMarkup;
  #nextIndex = 0;

  connectedCallback() {
    this.#abort?.abort();
    this.#abort = new AbortController();
    const signal = this.#abort.signal;
    this.list = this.querySelector(':scope > [data-repeater-list]');
    this.template = this.querySelector(':scope > template[data-repeater-template]');
    if (!this.list || !this.template) return;

    if (this.#initialMarkup == null) this.#initialMarkup = this.list.innerHTML;
    this.#prepareItems();
    this.addEventListener('click', event => this.#onClick(event), { signal });
    this.closest('form')?.addEventListener('reset', () => queueMicrotask(() => this.#reset()), { signal });
    this.dataset.enhanced = '';
    this.refresh();
  }

  disconnectedCallback() { this.#abort?.abort(); }

  get items() { return [...(this.list?.querySelectorAll(':scope > [data-repeater-item]') || [])]; }
  get min() { return Math.max(0, Number(this.dataset.min) || 0); }
  get max() { return Math.max(this.min, Number(this.dataset.max) || Infinity); }

  add() {
    if (!this.template || this.items.length >= this.max) return null;
    const index = this.#nextIndex++;
    const fragment = this.template.content.cloneNode(true);
    const elements = [...fragment.querySelectorAll('*')];
    elements.forEach(element => {
      [...element.attributes].forEach(attribute => {
        if (attribute.value.includes('__index__')) {
          element.setAttribute(attribute.name, attribute.value.replaceAll('__index__', String(index)));
        }
      });
      if (element.hasAttribute('data-repeater-number')) element.textContent = String(index + 1);
    });
    const item = fragment.querySelector('[data-repeater-item]');
    if (!item) return null;
    item.dataset.repeaterIndex = index;
    this.list.append(fragment);
    this.refresh();
    item.querySelector('[data-repeater-focus], input:not([type="hidden"]), select, textarea, button')?.focus();
    emit(this, 'oatbase:add', { item, index });
    return item;
  }

  remove(item) {
    if (!item?.matches?.('[data-repeater-item]') || !this.list?.contains(item) || this.items.length <= this.min) return false;
    const index = Number(item.dataset.repeaterIndex);
    const focusTarget = item.previousElementSibling?.querySelector('[data-repeater-remove]')
      || item.nextElementSibling?.querySelector('[data-repeater-remove]')
      || this.querySelector('[data-repeater-add]');
    item.remove();
    this.refresh();
    focusTarget?.focus();
    emit(this, 'oatbase:remove', { item, index });
    return true;
  }

  refresh() {
    const items = this.items;
    const atMin = items.length <= this.min;
    const atMax = items.length >= this.max;
    this.querySelectorAll('[data-repeater-add]').forEach(button => { button.disabled = atMax; });
    items.forEach((item, position) => {
      item.querySelectorAll('[data-repeater-remove]').forEach(button => { button.disabled = atMin; });
      item.querySelectorAll('[data-repeater-position]').forEach(output => { output.value = String(position + 1); });
    });
    this.toggleAttribute('data-empty', items.length === 0);
  }

  #prepareItems() {
    this.#nextIndex = 0;
    this.items.forEach(item => {
      const existing = Number(item.dataset.repeaterIndex);
      const index = Number.isFinite(existing) ? existing : this.#nextIndex;
      item.dataset.repeaterIndex = index;
      this.#nextIndex = Math.max(this.#nextIndex, index + 1);
    });
  }

  #onClick(event) {
    const add = event.target.closest('[data-repeater-add]');
    if (add && this.contains(add)) {
      event.preventDefault();
      this.add();
      return;
    }
    const remove = event.target.closest('[data-repeater-remove]');
    if (remove && this.contains(remove)) {
      event.preventDefault();
      this.remove(remove.closest('[data-repeater-item]'));
    }
  }

  #reset() {
    this.list.innerHTML = this.#initialMarkup;
    this.#prepareItems();
    this.refresh();
    emit(this, 'oatbase:reset', { items: this.items });
  }
}

define('ot-repeater', OtRepeater);
export { OtRepeater };
