import { define, emit } from './base.js';

class OtToggle extends HTMLElement {
  connectedCallback() {
    this.button = this.querySelector(':scope > button');
    if (!this.button) return;

    this.button.type = 'button';
    this.pressed = this.hasAttribute('pressed') || this.button.getAttribute('aria-pressed') === 'true';
    this.button.addEventListener('click', this);
  }

  disconnectedCallback() { this.button?.removeEventListener('click', this); }
  handleEvent() {
    if (this.button.disabled || this.button.getAttribute('aria-disabled') === 'true') return;
    this.pressed = !this.pressed;
    emit(this, 'oatbase:change', { pressed: this.pressed });
  }

  get pressed() { return this.hasAttribute('pressed'); }
  set pressed(value) {
    this.toggleAttribute('pressed', Boolean(value));
    this.button?.setAttribute('aria-pressed', String(Boolean(value)));
  }
}

define('ot-toggle', OtToggle);
export { OtToggle };
