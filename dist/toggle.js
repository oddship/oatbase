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

  // src/js/toggle.js
  var exports_toggle = {};
  __export(exports_toggle, {
    OtToggle: () => OtToggle
  });

  // src/js/base.js
  function define(name, constructor) {
    if (!customElements.get(name))
      customElements.define(name, constructor);
  }
  function emit(element, name, detail) {
    element.dispatchEvent(new CustomEvent(name, {
      bubbles: true,
      composed: true,
      detail
    }));
  }

  // src/js/toggle.js
  class OtToggle extends HTMLElement {
    connectedCallback() {
      this.button = this.querySelector(":scope > button");
      if (!this.button)
        return;
      this.button.type = "button";
      this.pressed = this.hasAttribute("pressed") || this.button.getAttribute("aria-pressed") === "true";
      this.button.addEventListener("click", this);
    }
    disconnectedCallback() {
      this.button?.removeEventListener("click", this);
    }
    handleEvent() {
      if (this.button.disabled || this.button.getAttribute("aria-disabled") === "true")
        return;
      this.pressed = !this.pressed;
      emit(this, "oatbase:change", { pressed: this.pressed });
    }
    get pressed() {
      return this.hasAttribute("pressed");
    }
    set pressed(value) {
      this.toggleAttribute("pressed", Boolean(value));
      this.button?.setAttribute("aria-pressed", String(Boolean(value)));
    }
  }
  define("ot-toggle", OtToggle);
})();
