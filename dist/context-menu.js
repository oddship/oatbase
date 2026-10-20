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

  // src/js/context-menu.js
  var exports_context_menu = {};
  __export(exports_context_menu, {
    OtContextMenu: () => OtContextMenu
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

  // src/js/popup-position.js
  function watchPosition(popup, anchor, point) {
    const abort = new AbortController;
    const position = () => {
      const box = anchor.getBoundingClientRect();
      const x = point?.x ?? box.left;
      const y = point?.y ?? box.bottom;
      popup.style.left = `${Math.max(8, Math.min(x, innerWidth - popup.offsetWidth - 8))}px`;
      popup.style.top = `${Math.max(8, Math.min(y, innerHeight - popup.offsetHeight - 8))}px`;
    };
    position();
    window.addEventListener("resize", position, { signal: abort.signal });
    window.addEventListener("scroll", position, { signal: abort.signal, capture: true, passive: true });
    const observer = new ResizeObserver(position);
    observer.observe(popup);
    return () => {
      abort.abort();
      observer.disconnect();
    };
  }

  // src/js/context-menu.js
  class OtContextMenu extends HTMLElement {
    #ready;
    #abort;
    #stop;
    #point;
    #returnTo;
    #pending;
    #frame;
    connectedCallback() {
      this.#ready?.abort();
      this.#ready = connectWhenReady(this, () => this.#connect());
    }
    #connect() {
      this.#abort?.abort();
      this.#stop?.();
      this.popup = this.querySelector(":scope > [popover]:not(.ot-tooltip)");
      this.target = this.querySelector(":scope > [data-context-target]");
      this.trigger = this.querySelector("[popovertarget]");
      if (!this.popup?.showPopover || !this.target || !this.trigger)
        return;
      this.#abort = new AbortController;
      const signal = this.#abort.signal;
      this.trigger.setAttribute("aria-expanded", "false");
      this.target.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        this.#pending?.abort();
        const point = { x: event.clientX, y: event.clientY };
        const open = () => {
          this.#frame = requestAnimationFrame(() => {
            this.#frame = 0;
            if (this.isConnected)
              this.open(point);
          });
        };
        if (event.buttons & 2) {
          this.#pending = new AbortController;
          const pending = this.#pending;
          window.addEventListener("pointerup", () => {
            pending.abort();
            open();
          }, { once: true, signal: pending.signal });
          window.addEventListener("pointercancel", () => pending.abort(), { once: true, signal: pending.signal });
          window.addEventListener("blur", () => pending.abort(), { once: true, signal: pending.signal });
        } else
          open();
      }, { signal });
      this.target.addEventListener("keydown", (event) => {
        if (event.key === "ContextMenu" || event.shiftKey && event.key === "F10") {
          event.preventDefault();
          this.open();
        }
      }, { signal });
      this.trigger.addEventListener("click", () => {
        this.#point = undefined;
      }, { signal });
      this.popup.addEventListener("beforetoggle", (event) => {
        if (event.newState === "open")
          this.#returnTo = document.activeElement;
      }, { signal });
      this.popup.addEventListener("toggle", (event) => {
        this.#stop?.();
        this.#stop = undefined;
        const open = event.newState === "open";
        this.trigger.setAttribute("aria-expanded", String(open));
        if (open) {
          this.#stop = watchPosition(this.popup, this.target, this.#point);
          this.items[0]?.focus();
        } else if (this.#returnTo?.isConnected && (this.popup.contains(document.activeElement) || document.activeElement === document.body))
          this.#returnTo.focus();
      }, { signal });
      this.popup.addEventListener("keydown", (event) => {
        const items = this.items, index = items.indexOf(event.target);
        let next;
        if (event.key === "ArrowDown")
          next = (index + 1) % items.length;
        if (event.key === "ArrowUp")
          next = (index - 1 + items.length) % items.length;
        if (event.key === "Home")
          next = 0;
        if (event.key === "End")
          next = items.length - 1;
        if (next !== undefined && items.length) {
          event.preventDefault();
          items[next].focus();
        }
        if (event.key === "Tab")
          this.close();
      }, { signal });
      this.popup.addEventListener("click", (event) => {
        const item = event.target.closest('[role="menuitem"]');
        if (!this.items.includes(item))
          return;
        const selected = new CustomEvent("oatbase:select", { bubbles: true, composed: true, cancelable: true, detail: { value: item.dataset.value || "", item } });
        if (this.dispatchEvent(selected))
          this.close();
      }, { signal });
    }
    get items() {
      return [...this.popup?.querySelectorAll('[role="menuitem"]') || []].filter((item) => !item.disabled && item.getAttribute("aria-disabled") !== "true" && !item.hidden);
    }
    open(point) {
      if (!this.popup?.showPopover)
        return;
      this.#point = point;
      this.popup.showPopover();
    }
    close() {
      if (this.popup?.matches(":popover-open"))
        this.popup.hidePopover();
    }
    disconnectedCallback() {
      this.#ready?.abort();
      this.#abort?.abort();
      this.#stop?.();
      this.#pending?.abort();
      if (this.#frame)
        cancelAnimationFrame(this.#frame);
    }
  }
  define("ot-context-menu", OtContextMenu);
})();
