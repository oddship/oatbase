import { connectWhenReady, define } from './base.js';
import { watchPosition } from './popup-position.js';

class OtContextMenu extends HTMLElement {
  #ready; #abort; #stop; #point; #returnTo; #pending; #frame;
  connectedCallback() { this.#ready?.abort(); this.#ready = connectWhenReady(this, () => this.#connect()); }
  #connect() {
    this.#abort?.abort(); this.#stop?.();
    this.popup = this.querySelector(':scope > [popover]');
    this.target = this.querySelector(':scope > [data-context-target]');
    this.trigger = this.querySelector('[popovertarget]');
    if (!this.popup?.showPopover || !this.target || !this.trigger) return;
    this.#abort = new AbortController(); const signal = this.#abort.signal;
    this.trigger.setAttribute('aria-expanded', 'false');
    this.target.addEventListener('contextmenu', event => {
      event.preventDefault(); this.#pending?.abort();
      const point = { x: event.clientX, y: event.clientY };
      const open = () => { this.#frame = requestAnimationFrame(() => { this.#frame = 0; if (this.isConnected) this.open(point); }); };
      // An auto popover opened during right-button down is light-dismissed by
      // that same gesture. Wait for release, then open after native dismissal.
      if (event.buttons & 2) {
        this.#pending = new AbortController();
        const pending = this.#pending;
        window.addEventListener('pointerup', () => { pending.abort(); open(); }, { once: true, signal: pending.signal });
        window.addEventListener('pointercancel', () => pending.abort(), { once: true, signal: pending.signal });
        window.addEventListener('blur', () => pending.abort(), { once: true, signal: pending.signal });
      } else open();
    }, { signal });
    this.target.addEventListener('keydown', event => {
      if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) { event.preventDefault(); this.open(); }
    }, { signal });
    this.trigger.addEventListener('click', () => { this.#point = undefined; }, { signal });
    this.popup.addEventListener('beforetoggle', event => { if (event.newState === 'open') this.#returnTo = document.activeElement; }, { signal });
    this.popup.addEventListener('toggle', event => {
      this.#stop?.(); this.#stop = undefined;
      const open = event.newState === 'open';
      this.trigger.setAttribute('aria-expanded', String(open));
      if (open) { this.#stop = watchPosition(this.popup, this.target, this.#point); this.items[0]?.focus(); }
      else if (this.#returnTo?.isConnected && (this.popup.contains(document.activeElement) || document.activeElement === document.body)) this.#returnTo.focus();
    }, { signal });
    this.popup.addEventListener('keydown', event => {
      const items = this.items, index = items.indexOf(event.target); let next;
      if (event.key === 'ArrowDown') next = (index + 1) % items.length;
      if (event.key === 'ArrowUp') next = (index - 1 + items.length) % items.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = items.length - 1;
      if (next !== undefined && items.length) { event.preventDefault(); items[next].focus(); }
      if (event.key === 'Tab') this.close();
    }, { signal });
    this.popup.addEventListener('click', event => {
      const item = event.target.closest('[role="menuitem"]');
      if (!this.items.includes(item)) return;
      const selected = new CustomEvent('oatbase:select', { bubbles: true, composed: true, cancelable: true, detail: { value: item.dataset.value || '', item } });
      if (this.dispatchEvent(selected)) this.close();
    }, { signal });
  }
  get items() { return [...(this.popup?.querySelectorAll('[role="menuitem"]') || [])].filter(item => !item.disabled && item.getAttribute('aria-disabled') !== 'true' && !item.hidden); }
  open(point) { if (!this.popup?.showPopover) return; this.#point = point; this.popup.showPopover(); }
  close() { if (this.popup?.matches(':popover-open')) this.popup.hidePopover(); }
  disconnectedCallback() { this.#ready?.abort(); this.#abort?.abort(); this.#stop?.(); this.#pending?.abort(); if (this.#frame) cancelAnimationFrame(this.#frame); }
}
define('ot-context-menu', OtContextMenu);
export { OtContextMenu };
