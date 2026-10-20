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

  // src/js/menubar.js
  var exports_menubar = {};
  __export(exports_menubar, {
    OtMenubar: () => OtMenubar
  });

  // src/js/base.js
  function define(name, constructor) {
    if (!customElements.get(name))
      customElements.define(name, constructor);
  }
  function connectWhenReady(element, connect) {
    if (document.readyState !== "loading") {
      connect();
      return;
    }
    const controller = new AbortController;
    document.addEventListener("DOMContentLoaded", () => {
      if (element.isConnected)
        connect();
    }, { once: true, signal: controller.signal });
    return controller;
  }

  // src/js/menubar.js
  class OtMenubar extends HTMLElement {
    #ready;
    #abort;
    connectedCallback() {
      this.#ready?.abort();
      this.#ready = connectWhenReady(this, () => this.#connect());
    }
    #connect() {
      this.#abort?.abort();
      this.#abort = new AbortController;
      const signal = this.#abort.signal;
      this.refresh();
      this.querySelectorAll("[popover]").forEach((popup) => popup.addEventListener("toggle", (event) => {
        if (event.newState === "open")
          popup.querySelector('[role="menuitem"]:not(:disabled)')?.focus();
      }, { signal }));
      this.addEventListener("focusin", (event) => {
        if (this.items.includes(event.target))
          this.items.forEach((item) => {
            item.tabIndex = item === event.target ? 0 : -1;
          });
      }, { signal });
      this.addEventListener("keydown", (event) => {
        const popup = event.target.closest("[popover]");
        if (popup && ["ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
          const items = [...popup.querySelectorAll('[role="menuitem"]')].filter((item) => !item.disabled && item.getAttribute("aria-disabled") !== "true" && !item.hidden);
          if (!items.length)
            return;
          const current = items.indexOf(event.target);
          const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (current + (event.key === "ArrowUp" ? -1 : 1) + items.length) % items.length;
          event.preventDefault();
          event.stopPropagation();
          items[next].focus();
          return;
        }
        const trigger = this.items.find((item) => item === event.target || item.closest("ot-dropdown")?.contains(event.target));
        const index = this.items.indexOf(trigger);
        if (index < 0)
          return;
        const rtl = getComputedStyle(this).direction === "rtl";
        const step = { ArrowRight: rtl ? -1 : 1, ArrowLeft: rtl ? 1 : -1 }[event.key];
        if (step || ["Home", "End"].includes(event.key)) {
          event.preventDefault();
          event.stopPropagation();
          const popup2 = trigger.closest("ot-dropdown")?.querySelector("[popover]");
          const wasOpen = popup2?.matches(":popover-open");
          if (wasOpen)
            popup2.hidePopover();
          const next = this.items[event.key === "Home" ? 0 : event.key === "End" ? this.items.length - 1 : (index + step + this.items.length) % this.items.length];
          setTimeout(() => {
            if (this.isConnected) {
              next.focus();
              if (wasOpen)
                next.closest("ot-dropdown")?.querySelector("[popover]")?.showPopover();
            }
          }, 0);
        } else if (event.target === trigger && ["ArrowDown", "Enter", " "].includes(event.key)) {
          event.preventDefault();
          trigger.closest("ot-dropdown")?.querySelector("[popover]")?.showPopover();
        }
      }, { signal, capture: true });
    }
    get items() {
      return [...this.querySelectorAll(':scope > [role="menubar"] > ot-dropdown > [role="menuitem"]')].filter((item) => !item.disabled);
    }
    refresh() {
      this.items.forEach((item, index) => {
        item.tabIndex = index === 0 ? 0 : -1;
      });
    }
    disconnectedCallback() {
      this.#ready?.abort();
      this.#abort?.abort();
    }
  }
  define("ot-menubar", OtMenubar);
})();
