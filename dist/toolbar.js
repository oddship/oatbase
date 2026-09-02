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

  // src/js/toolbar.js
  var exports_toolbar = {};
  __export(exports_toolbar, {
    OtToolbar: () => OtToolbar
  });

  // src/js/base.js
  function define(name, constructor) {
    if (!customElements.get(name))
      customElements.define(name, constructor);
  }

  // src/js/toolbar.js
  class OtToolbar extends HTMLElement {
    connectedCallback() {
      if (!this.hasAttribute("role"))
        this.setAttribute("role", "toolbar");
      if (!this.hasAttribute("aria-orientation"))
        this.setAttribute("aria-orientation", "horizontal");
      this.refresh();
      this.addEventListener("focusin", this);
      this.addEventListener("keydown", this);
    }
    disconnectedCallback() {
      this.removeEventListener("focusin", this);
      this.removeEventListener("keydown", this);
    }
    handleEvent(event) {
      if (event.type === "keydown")
        return this.#keydown(event);
      const index = this.items.indexOf(event.target);
      if (index >= 0)
        this.#activate(index, false);
    }
    refresh() {
      this.items = [...this.children].map((item) => item.matches("ot-toggle") ? item.querySelector("button") : item).filter((item) => item?.matches("button:not(:disabled), a[href], [data-toolbar-item]") && item.getAttribute("aria-disabled") !== "true");
      const current = Math.max(0, this.items.findIndex((item) => item.tabIndex === 0));
      this.items.forEach((item, index) => {
        item.tabIndex = index === current ? 0 : -1;
      });
    }
    #activate(index, focus = true) {
      if (!this.items.length)
        return;
      const normalized = (index + this.items.length) % this.items.length;
      this.items.forEach((item, current) => {
        item.tabIndex = current === normalized ? 0 : -1;
      });
      if (focus)
        this.items[normalized].focus();
    }
    #keydown(event) {
      const index = this.items.indexOf(event.target);
      if (index < 0)
        return;
      const vertical = this.getAttribute("aria-orientation") === "vertical";
      let next = index;
      if (event.key === "Home")
        next = 0;
      else if (event.key === "End")
        next = this.items.length - 1;
      else if (vertical && event.key === "ArrowDown")
        next = index + 1;
      else if (vertical && event.key === "ArrowUp")
        next = index - 1;
      else if (!vertical && event.key === "ArrowRight")
        next = index + 1;
      else if (!vertical && event.key === "ArrowLeft")
        next = index - 1;
      else
        return;
      event.preventDefault();
      this.#activate(next);
    }
  }
  define("ot-toolbar", OtToolbar);
})();
