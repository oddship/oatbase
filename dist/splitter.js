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

  // src/js/splitter.js
  var exports_splitter = {};
  __export(exports_splitter, {
    OtSplitter: () => OtSplitter
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

  // src/js/splitter.js
  class OtSplitter extends HTMLElement {
    #abort;
    #dragging = false;
    connectedCallback() {
      this.#abort?.abort();
      this.#abort = new AbortController;
      const signal = this.#abort.signal;
      this.handle = this.querySelector("[data-splitter]");
      if (!this.handle)
        return;
      this.handle.type = "button";
      this.handle.setAttribute("role", "separator");
      this.handle.setAttribute("aria-orientation", this.separatorOrientation);
      this.handle.setAttribute("aria-valuemin", String(this.min));
      this.handle.setAttribute("aria-valuemax", String(this.max));
      this.handle.addEventListener("pointerdown", (event) => {
        this.#dragging = true;
        this.handle.setPointerCapture?.(event.pointerId);
        this.#setFromPointer(event);
      }, { signal });
      this.handle.addEventListener("pointermove", (event) => this.#dragging && this.#setFromPointer(event), { signal });
      this.handle.addEventListener("pointerup", () => {
        this.#dragging = false;
      }, { signal });
      this.handle.addEventListener("keydown", (event) => {
        const keys = this.vertical ? ["ArrowUp", "ArrowDown", "Home", "End"] : ["ArrowLeft", "ArrowRight", "Home", "End"];
        if (!keys.includes(event.key))
          return;
        event.preventDefault();
        const backward = event.key === "ArrowLeft" || event.key === "ArrowUp";
        const next = event.key === "Home" ? this.min : event.key === "End" ? this.max : this.value + (backward ? -5 : 5);
        this.value = next;
      }, { signal });
      this.value = this.#storedValue() ?? this.#number(this.dataset.value || 50, 50);
    }
    disconnectedCallback() {
      this.#abort?.abort();
    }
    get min() {
      return this.#number(this.dataset.min || 20, 20);
    }
    get max() {
      return Math.max(this.min, this.#number(this.dataset.max || 80, 80));
    }
    get storageKey() {
      return this.dataset.storageKey || "";
    }
    get vertical() {
      return this.getAttribute("aria-orientation") === "vertical";
    }
    get separatorOrientation() {
      return this.vertical ? "horizontal" : "vertical";
    }
    get value() {
      return Number(this.handle?.getAttribute("aria-valuenow") || 50);
    }
    set value(value) {
      const number = Number(value);
      if (!Number.isFinite(number))
        return;
      const next = Math.min(this.max, Math.max(this.min, Math.round(number)));
      this.style.setProperty("--split", `${next}%`);
      this.handle?.setAttribute("aria-valuenow", String(next));
      if (this.storageKey) {
        try {
          localStorage.setItem(this.storageKey, String(next));
        } catch {}
      }
      emit(this, "oatbase:resize", { value: next });
    }
    #number(value, fallback) {
      const number = Number(value);
      return Number.isFinite(number) ? number : fallback;
    }
    #storedValue() {
      if (!this.storageKey)
        return;
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (stored === null || !stored.trim())
          return;
        const value = Number(stored);
        return Number.isFinite(value) ? value : undefined;
      } catch {
        return;
      }
    }
    #setFromPointer(event) {
      const bounds = this.getBoundingClientRect();
      this.value = this.vertical ? (event.clientY - bounds.top) / bounds.height * 100 : (event.clientX - bounds.left) / bounds.width * 100;
    }
  }
  define("ot-splitter", OtSplitter);
})();
