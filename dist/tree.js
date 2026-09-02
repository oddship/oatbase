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

  // src/js/tree.js
  var exports_tree = {};
  __export(exports_tree, {
    OtTree: () => OtTree
  });

  // src/js/base.js
  function define(name, constructor) {
    if (!customElements.get(name))
      customElements.define(name, constructor);
  }

  // src/js/tree.js
  class OtTree extends HTMLElement {
    #abort;
    connectedCallback() {
      this.#abort?.abort();
      this.#abort = new AbortController;
      const root = this.querySelector(":scope > ul");
      if (!root)
        return;
      root.setAttribute("role", "tree");
      this.querySelectorAll("li").forEach((item) => {
        item.setAttribute("role", "treeitem");
        const group = item.querySelector(":scope > ul");
        if (group) {
          group.setAttribute("role", "group");
          if (!item.hasAttribute("aria-expanded"))
            item.setAttribute("aria-expanded", "false");
        }
        const control = item.firstElementChild;
        if (control)
          control.tabIndex = -1;
      });
      const first = this.visibleItems[0]?.firstElementChild;
      if (first)
        first.tabIndex = 0;
      this.addEventListener("click", (event) => {
        const item = event.target.closest('[role="treeitem"]');
        if (item?.hasAttribute("aria-expanded"))
          item.setAttribute("aria-expanded", String(item.getAttribute("aria-expanded") !== "true"));
      }, { signal: this.#abort.signal });
      this.addEventListener("keydown", (event) => this.#keydown(event), { signal: this.#abort.signal });
    }
    disconnectedCallback() {
      this.#abort?.abort();
    }
    get visibleItems() {
      return [...this.querySelectorAll('[role="treeitem"]')].filter((item) => item.offsetParent !== null);
    }
    #focus(item) {
      this.querySelectorAll('[role="treeitem"] > :first-child').forEach((control2) => {
        control2.tabIndex = -1;
      });
      const control = item?.firstElementChild;
      if (control) {
        control.tabIndex = 0;
        control.focus();
      }
    }
    #keydown(event) {
      const item = event.target.closest('[role="treeitem"]');
      if (!item)
        return;
      const items = this.visibleItems;
      const index = items.indexOf(item);
      if (event.key === "ArrowDown")
        this.#focus(items[index + 1] || items[0]);
      else if (event.key === "ArrowUp")
        this.#focus(items[index - 1] || items.at(-1));
      else if (event.key === "Home")
        this.#focus(items[0]);
      else if (event.key === "End")
        this.#focus(items.at(-1));
      else if (event.key === "ArrowRight" && item.hasAttribute("aria-expanded"))
        item.setAttribute("aria-expanded", "true");
      else if (event.key === "ArrowLeft" && item.getAttribute("aria-expanded") === "true")
        item.setAttribute("aria-expanded", "false");
      else
        return;
      event.preventDefault();
    }
  }
  define("ot-tree", OtTree);
})();
