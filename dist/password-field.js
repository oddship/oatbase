(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  function __accessProp(key) {
    return this[key];
  }
  var __toCommonJS = (from) => {
    var entry = (__moduleCache ??= new WeakMap).get(from), desc;
    if (entry)
      return entry;
    entry = __defProp({}, "__esModule", { value: true });
    if (from && typeof from === "object" || typeof from === "function") {
      for (var key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(entry, key))
          __defProp(entry, key, {
            get: __accessProp.bind(from, key),
            enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
          });
    }
    __moduleCache.set(from, entry);
    return entry;
  };
  var __moduleCache;
  var __returnValue = (v) => v;
  function __exportSetter(name, newValue) {
    this[name] = __returnValue.bind(null, newValue);
  }
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, {
        get: all[name],
        enumerable: true,
        configurable: true,
        set: __exportSetter.bind(all, name)
      });
  };

  // src/js/password-field.js
  var exports_password_field = {};
  __export(exports_password_field, {
    OtPassword: () => OtPassword
  });

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
})();
