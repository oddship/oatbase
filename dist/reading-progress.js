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

  // src/js/reading-progress.js
  var exports_reading_progress = {};
  __export(exports_reading_progress, {
    OtReadingProgress: () => OtReadingProgress
  });

  // src/js/base.js
  function define(name, constructor) {
    if (!customElements.get(name))
      customElements.define(name, constructor);
  }

  // src/js/reading-progress.js
  class OtReadingProgress extends HTMLElement {
    #abort;
    #frame;
    connectedCallback() {
      this.#abort?.abort();
      this.#abort = new AbortController;
      this.refresh();
    }
    disconnectedCallback() {
      this.#abort?.abort();
      cancelAnimationFrame(this.#frame);
    }
    refresh() {
      this.#abort?.abort();
      this.#abort = new AbortController;
      this.progress = this.querySelector("progress");
      this.target = this.#query(this.dataset.target);
      this.root = this.#query(this.dataset.scrollRoot);
      if (!this.progress || !this.target)
        return;
      this.progress.max = 100;
      const options = { passive: true, signal: this.#abort.signal };
      (this.root || window).addEventListener("scroll", () => this.#schedule(), options);
      window.addEventListener("resize", () => this.#schedule(), options);
      this.toggleAttribute("data-enhanced", true);
      this.#update();
    }
    #query(selector) {
      if (!selector)
        return null;
      try {
        return document.querySelector(selector);
      } catch {
        return null;
      }
    }
    #schedule() {
      cancelAnimationFrame(this.#frame);
      this.#frame = requestAnimationFrame(() => this.#update());
    }
    #update() {
      const rootRect = this.root?.getBoundingClientRect();
      const targetRect = this.target.getBoundingClientRect();
      const scroll = this.root?.scrollTop || window.scrollY;
      const viewport = this.root?.clientHeight || window.innerHeight;
      const targetStart = scroll + targetRect.top - (rootRect?.top || 0);
      const distance = Math.max(1, this.target.scrollHeight - viewport);
      const value = Math.min(100, Math.max(0, (scroll - targetStart) / distance * 100));
      this.progress.value = value;
    }
  }
  define("ot-reading-progress", OtReadingProgress);
})();
