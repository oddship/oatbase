// src/js/base.js
function define(name, constructor) {
  if (!customElements.get(name))
    customElements.define(name, constructor);
}

// src/js/password-field.js
class OtPassword extends HTMLElement {
  #abort;
  connectedCallback() {
    this.#abort?.abort();
    this.#abort = new AbortController;
    this.input = this.querySelector("input");
    this.button = this.querySelector("[data-password-toggle]");
    if (!this.input || !this.button)
      return;
    this.button.type = "button";
    this.button.addEventListener("click", () => this.toggle(), { signal: this.#abort.signal });
    this.#sync();
  }
  disconnectedCallback() {
    this.#abort?.abort();
  }
  toggle(force) {
    const visible = force ?? this.input.type === "password";
    this.input.type = visible ? "text" : "password";
    this.#sync();
    this.input.focus();
  }
  #sync() {
    const visible = this.input.type === "text";
    this.button.setAttribute("aria-pressed", String(visible));
    this.button.setAttribute("aria-label", visible ? "Hide password" : "Show password");
    this.button.textContent = visible ? this.dataset.hideLabel || "Hide" : this.dataset.showLabel || "Show";
  }
}
define("ot-password", OtPassword);
export {
  OtPassword
};
