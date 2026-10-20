import { connectWhenReady, define, emit, uid } from './base.js';

const date = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return undefined;
  const result = new Date(`${value}T12:00:00`);
  return Number.isNaN(+result) || iso(result) !== value ? undefined : result;
};
const iso = value => `${String(value.getFullYear()).padStart(4, '0')}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
const civil = (year, month, day = 1) => { const result = new Date(0); result.setFullYear(year, month, day); result.setHours(12, 0, 0, 0); return result; };
const shift = (value, days) => { const result = new Date(value); result.setDate(result.getDate() + days); return result; };

class OtCalendar extends HTMLElement {
  #ready; #abort; #observer; #day; #panel; #resetFrame;
  connectedCallback() { this.#ready?.abort(); this.#ready = connectWhenReady(this, () => this.#connect()); }
  #connect() {
    this.#cleanup();
    this.input = this.querySelector(':scope > input[type="date"]');
    if (!this.input) return;
    this.#abort = new AbortController(); const signal = this.#abort.signal;
    this.#panel = document.createElement('div'); this.#panel.dataset.calendarPanel = '';
    this.append(this.#panel);
    this.#day = this.#clamp(date(this.input.value) || new Date());
    this.#panel.addEventListener('click', event => {
      const button = event.target.closest('button'); if (!button || button.disabled || button.getAttribute('aria-disabled') === 'true') return;
      if (button.dataset.day) { this.value = button.dataset.day; this.input.dispatchEvent(new Event('input', { bubbles: true })); this.input.dispatchEvent(new Event('change', { bubbles: true })); emit(this, 'oatbase:change', { value: this.value }); this.#focus(); }
      else if (button.dataset.month) { this.#moveMonth(Number(button.dataset.month)); this.refresh(); this.#panel.querySelector(`[data-month="${button.dataset.month}"]`)?.focus(); }
    }, { signal });
    this.#panel.addEventListener('keydown', event => {
      if (!event.target.matches('[data-day]')) return;
      const rtl = getComputedStyle(this).direction === 'rtl';
      let delta = { ArrowLeft: rtl ? 1 : -1, ArrowRight: rtl ? -1 : 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
      if (event.key === 'Home') delta = -this.#day.getDay();
      if (event.key === 'End') delta = 6 - this.#day.getDay();
      if (event.key === 'PageUp' || event.key === 'PageDown') { event.preventDefault(); this.#moveMonth(event.key === 'PageUp' ? -1 : 1); }
      else if (delta !== undefined) { event.preventDefault(); this.#day = this.#clamp(shift(this.#day, delta)); }
      else return;
      this.refresh(); this.#focus();
    }, { signal });
    this.input.addEventListener('change', () => { const selected = date(this.value); if (selected) this.#day = this.#clamp(selected); this.refresh(); }, { signal });
    this.input.form?.addEventListener('reset', () => {
      if (this.#resetFrame) cancelAnimationFrame(this.#resetFrame);
      this.#resetFrame = requestAnimationFrame(() => { this.#resetFrame = 0; if (this.isConnected) { this.#day = this.#clamp(date(this.value) || new Date()); this.refresh(); } });
    }, { signal });
    this.#observer = new MutationObserver(() => { this.#day = this.#clamp(this.#day); this.refresh(); });
    this.#observer.observe(this.input, { attributes: true, attributeFilter: ['min', 'max', 'step', 'disabled', 'readonly'] });
    // Fieldset disability is native and can change independently of the input.
    const fieldset = this.closest('fieldset');
    if (fieldset) this.#observer.observe(fieldset, { attributes: true, attributeFilter: ['disabled'] });
    this.dataset.enhanced = ''; this.refresh();
  }
  get value() { return this.input?.value || ''; }
  set value(value) { if (!this.input) return; this.input.value = value; const selected = date(this.value); if (selected) this.#day = this.#clamp(selected); this.refresh(); }
  #clamp(value) { const min = date(this.input.min), max = date(this.input.max); return min && value < min ? min : max && value > max ? max : value; }
  #moveMonth(delta) {
    const day = this.#day.getDate(); const target = civil(this.#day.getFullYear(), this.#day.getMonth() + delta);
    target.setDate(Math.min(day, civil(target.getFullYear(), target.getMonth() + 1, 0).getDate()));
    this.#day = this.#clamp(target);
  }
  #focus() { this.#panel.querySelector(`[data-day="${iso(this.#day)}"]`)?.focus(); }
  refresh() {
    if (!this.#panel) return;
    const focused = this.#panel.contains(document.activeElement);
    const active = this.#clamp(this.#day); this.#day = active;
    const year = active.getFullYear(), month = active.getMonth();
    const locale = this.lang || document.documentElement.lang || 'en';
    let title, weekday, dayLabel;
    try {
      title = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(active);
      weekday = new Intl.DateTimeFormat(locale, { weekday: 'short' });
      dayLabel = new Intl.DateTimeFormat(locale, { dateStyle: 'full' });
    } catch { title = new Intl.DateTimeFormat('en', { year: 'numeric', month: 'long' }).format(active); weekday = new Intl.DateTimeFormat('en', { weekday: 'short' }); dayLabel = new Intl.DateTimeFormat('en', { dateStyle: 'full' }); }
    const label = uid('calendar-month');
    const header = document.createElement('div'); header.dataset.calendarHeader = '';
    const blocked = this.input.matches(':disabled') || this.input.readOnly;
    for (const [delta, text] of [[-1, 'Previous month'], [1, 'Next month']]) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'outline small'; button.dataset.month = delta; button.textContent = delta < 0 ? '‹' : '›'; button.setAttribute('aria-label', text); button.disabled = blocked;
      header.append(button);
    }
    const heading = document.createElement('strong'); heading.id = label; heading.textContent = title; heading.setAttribute('aria-live', 'polite'); header.insertBefore(heading, header.lastChild);
    const table = document.createElement('table'); table.setAttribute('aria-labelledby', label);
    const head = document.createElement('thead'); const row = document.createElement('tr');
    for (let d = 0; d < 7; d++) { const th = document.createElement('th'); th.scope = 'col'; th.textContent = weekday.format(new Date(2026, 0, 4 + d)); row.append(th); } head.append(row); table.append(head);
    const body = document.createElement('tbody'); let tr;
    const first = civil(year, month); const total = civil(year, month + 1, 0).getDate();
    for (let slot = 0; slot < Math.ceil((first.getDay() + total) / 7) * 7; slot++) {
      if (slot % 7 === 0) { tr = document.createElement('tr'); body.append(tr); }
      const td = document.createElement('td'); tr.append(td); const day = slot - first.getDay() + 1;
      if (day < 1 || day > total) continue;
      const candidate = civil(year, month, day); const value = iso(candidate);
      const button = document.createElement('button'); button.type = 'button'; button.className = 'ghost small'; button.dataset.day = value; button.textContent = day; button.tabIndex = value === iso(active) ? 0 : -1;
      button.setAttribute('aria-label', dayLabel.format(candidate)); button.setAttribute('aria-pressed', String(this.value === value));
      button.disabled = blocked;
      button.setAttribute('aria-disabled', String(Boolean((this.input.min && value < this.input.min) || (this.input.max && value > this.input.max) || (this.input.step !== 'any' && !this.#stepValid(value)))));
      td.append(button);
    }
    table.append(body); this.#panel.replaceChildren(header, table);
    if (focused) this.#focus();
  }
  #stepValid(value) {
    const step = Number(this.input.step || 1); if (!(step > 0)) return true;
    const base = date(this.input.min) ? Date.parse(this.input.min) : date(this.input.defaultValue) ? Date.parse(this.input.defaultValue) : 0;
    return Math.abs(((Date.parse(value) - base) / 86400000 / step) % 1) < 1e-8;
  }
  #cleanup() { this.#abort?.abort(); this.#observer?.disconnect(); this.#panel?.remove(); if (this.#resetFrame) cancelAnimationFrame(this.#resetFrame); this.#resetFrame = 0; }
  disconnectedCallback() { this.#ready?.abort(); this.#cleanup(); this.removeAttribute('data-enhanced'); }
}
define('ot-calendar', OtCalendar);
export { OtCalendar };
