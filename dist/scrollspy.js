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

  // src/js/scrollspy.js
  var exports_scrollspy = {};
  __export(exports_scrollspy, {
    OtScrollspy: () => OtScrollspy
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

  // src/js/scrollspy.js
  class OtScrollspy extends HTMLElement {
    #abort;
    #listeners;
    #observer;
    #frame;
    #activeId = "";
    connectedCallback() {
      this.#abort?.abort();
      this.#abort = new AbortController;
      this.#observer?.disconnect();
      this.#observer = new MutationObserver(() => this.refresh());
      this.#observer.observe(this, { childList: true, subtree: true });
      this.refresh();
    }
    disconnectedCallback() {
      this.#abort?.abort();
      this.#listeners?.abort();
      this.#observer?.disconnect();
      cancelAnimationFrame(this.#frame);
    }
    get activeId() {
      return this.#activeId;
    }
    refresh() {
      this.#listeners?.abort();
      this.#listeners = new AbortController;
      const scope = this.#query(this.dataset.target) || document;
      this.links = [...this.querySelectorAll('a[href^="#"]')];
      this.targets = this.links.map((link) => {
        const id = decodeURIComponent(link.hash.slice(1));
        const target = id ? document.getElementById(id) : null;
        return target && (scope === document || scope.contains(target)) ? target : null;
      }).filter(Boolean);
      this.root = this.#query(this.dataset.scrollRoot);
      if (!this.targets.length) {
        this.removeAttribute("data-enhanced");
        return;
      }
      const options = { passive: true, signal: this.#listeners.signal };
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
      if (!this.targets?.length)
        return;
      const offset = Number.parseFloat(this.dataset.offset || "16") || 0;
      const rootTop = this.root?.getBoundingClientRect().top || 0;
      const reference = rootTop + offset;
      let active = this.targets[0];
      for (const target of this.targets) {
        if (target.getBoundingClientRect().top <= reference + 1)
          active = target;
        else
          break;
      }
      const atEnd = this.root ? this.root.scrollTop + this.root.clientHeight >= this.root.scrollHeight - 1 : window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 1;
      if (atEnd)
        active = this.targets.at(-1);
      if (!active || active.id === this.#activeId)
        return;
      this.#activeId = active.id;
      this.links.forEach((link) => {
        const selected = decodeURIComponent(link.hash.slice(1)) === active.id;
        if (selected)
          link.setAttribute("aria-current", "location");
        else
          link.removeAttribute("aria-current");
        link.toggleAttribute("data-active", selected);
      });
      emit(this, "oatbase:change", { id: active.id, target: active });
    }
  }
  define("ot-scrollspy", OtScrollspy);
})();
