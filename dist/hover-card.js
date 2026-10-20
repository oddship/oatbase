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

  // src/js/hover-card.js
  var exports_hover_card = {};
  __export(exports_hover_card, {
    OtHoverCard: () => OtHoverCard
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

  // src/js/hover-card.js
  class OtHoverCard extends HTMLElement {
    #ready;
    #abort;
    #timer;
    #stop;
    #pinned = false;
    connectedCallback() {
      this.#ready?.abort();
      this.#ready = connectWhenReady(this, () => this.#connect());
    }
    #connect() {
      this.#cleanup();
      this.trigger = this.querySelector(":scope > [popovertarget]");
      this.popup = this.querySelector(":scope > [popover]");
      if (!this.trigger || !this.popup || !this.popup.showPopover)
        return;
      this.#abort = new AbortController;
      const signal = this.#abort.signal;
      this.trigger.setAttribute("aria-expanded", "false");
      this.trigger.addEventListener("click", (event) => {
        event.preventDefault();
        if (this.#pinned && this.popup.matches(":popover-open"))
          this.close();
        else {
          this.open();
          this.#pinned = true;
        }
      }, { signal });
      this.addEventListener("pointerenter", (event) => {
        if (event.pointerType !== "touch")
          this.open();
      }, { signal });
      this.addEventListener("pointerleave", () => this.#later(), { signal });
      this.addEventListener("focusin", () => {
        clearTimeout(this.#timer);
      }, { signal });
      this.addEventListener("focusout", () => this.#later(), { signal });
      this.popup.addEventListener("pointerenter", () => clearTimeout(this.#timer), { signal });
      this.popup.addEventListener("pointerleave", () => this.#later(), { signal });
      this.popup.addEventListener("toggle", (event) => {
        this.#stop?.();
        this.#stop = undefined;
        this.trigger.setAttribute("aria-expanded", String(event.newState === "open"));
        if (event.newState === "open")
          this.#stop = watchPosition(this.popup, this.trigger);
        else
          this.#pinned = false;
      }, { signal });
    }
    open() {
      clearTimeout(this.#timer);
      if (this.isConnected && this.popup?.showPopover && !this.popup.matches(":popover-open"))
        this.popup.showPopover();
    }
    close() {
      clearTimeout(this.#timer);
      if (this.popup?.matches(":popover-open"))
        this.popup.hidePopover();
    }
    #later() {
      clearTimeout(this.#timer);
      this.#timer = setTimeout(() => {
        if (!this.contains(document.activeElement))
          this.close();
      }, 150);
    }
    #cleanup() {
      clearTimeout(this.#timer);
      this.#stop?.();
      this.#abort?.abort();
    }
    disconnectedCallback() {
      this.#ready?.abort();
      this.#cleanup();
    }
  }
  define("ot-hover-card", OtHoverCard);
})();
