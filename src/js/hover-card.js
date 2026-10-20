import { connectWhenReady, define } from './base.js';
import { watchPosition } from './popup-position.js';

class OtHoverCard extends HTMLElement {
  #ready; #abort; #timer; #stop; #pinned = false;
  connectedCallback() { this.#ready?.abort(); this.#ready = connectWhenReady(this, () => this.#connect()); }
  #connect() {
    this.#cleanup();
    this.trigger = this.querySelector(':scope > [popovertarget]');
    this.popup = this.querySelector(':scope > [popover]');
    if (!this.trigger || !this.popup || !this.popup.showPopover) return;
    this.#abort = new AbortController(); const signal = this.#abort.signal;
    this.trigger.setAttribute('aria-expanded', 'false');
    this.trigger.addEventListener('click', event => {
      event.preventDefault();
      if (this.#pinned && this.popup.matches(':popover-open')) this.close();
      else { this.open(); this.#pinned = true; }
    }, { signal });
    this.addEventListener('pointerenter', event => { if (event.pointerType !== 'touch') this.open(); }, { signal });
    this.addEventListener('pointerleave', () => this.#later(), { signal });
    this.addEventListener('focusin', () => { clearTimeout(this.#timer); }, { signal });
    this.addEventListener('focusout', () => this.#later(), { signal });
    this.popup.addEventListener('pointerenter', () => clearTimeout(this.#timer), { signal });
    this.popup.addEventListener('pointerleave', () => this.#later(), { signal });
    this.popup.addEventListener('toggle', event => {
      this.#stop?.(); this.#stop = undefined;
      this.trigger.setAttribute('aria-expanded', String(event.newState === 'open'));
      if (event.newState === 'open') this.#stop = watchPosition(this.popup, this.trigger);
      else this.#pinned = false;
    }, { signal });
  }
  open() { clearTimeout(this.#timer); if (this.isConnected && this.popup?.showPopover && !this.popup.matches(':popover-open')) this.popup.showPopover(); }
  close() { clearTimeout(this.#timer); if (this.popup?.matches(':popover-open')) this.popup.hidePopover(); }
  #later() { clearTimeout(this.#timer); this.#timer = setTimeout(() => { if (!this.contains(document.activeElement)) this.close(); }, 150); }
  #cleanup() { clearTimeout(this.#timer); this.#stop?.(); this.#abort?.abort(); }
  disconnectedCallback() { this.#ready?.abort(); this.#cleanup(); }
}
define('ot-hover-card', OtHoverCard);
export { OtHoverCard };
