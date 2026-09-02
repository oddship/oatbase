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

  // src/js/footnotes.js
  var exports_footnotes = {};
  __export(exports_footnotes, {
    OtFootnotes: () => OtFootnotes
  });

  // src/js/base.js
  var id = 0;
  var uid = (prefix = "oatbase") => `${prefix}-${++id}`;
  function define(name, constructor) {
    if (!customElements.get(name))
      customElements.define(name, constructor);
  }

  // src/js/footnotes.js
  class OtFootnotes extends HTMLElement {
    #abort;
    connectedCallback() {
      this.#abort?.abort();
      this.#abort = new AbortController;
      if (typeof HTMLElement.prototype.showPopover !== "function")
        return;
      const references = [...this.querySelectorAll('[data-footnote-ref], .footnote-reference a[href^="#"]')];
      references.forEach((reference) => this.#enhance(reference));
      if (references.length)
        this.toggleAttribute("data-enhanced", true);
    }
    disconnectedCallback() {
      this.#abort?.abort();
    }
    #enhance(reference) {
      const targetId = decodeURIComponent(reference.hash.slice(1));
      const definition = targetId && document.getElementById(targetId);
      if (!definition)
        return;
      let dropdown = reference.closest("ot-dropdown[data-footnote-preview]");
      let popover = dropdown?.querySelector("[data-footnote-popover]");
      if (!dropdown || !popover) {
        dropdown = document.createElement("ot-dropdown");
        dropdown.dataset.footnotePreview = "";
        const parent = reference.parentNode;
        const next = reference.nextSibling;
        dropdown.append(reference);
        popover = document.createElement("aside");
        popover.id = uid("oatbase-footnote");
        popover.className = "card";
        popover.dataset.footnotePopover = "";
        popover.setAttribute("popover", "auto");
        popover.setAttribute("role", "note");
        popover.setAttribute("aria-label", `Footnote ${reference.textContent.trim()}`);
        const content = definition.cloneNode(true);
        content.removeAttribute("id");
        content.querySelector(".footnote-definition-label, [data-footnote-label]")?.remove();
        content.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
        content.querySelectorAll('[data-footnote-backref], a[rev="footnote"]').forEach((element) => element.remove());
        const body = document.createElement("div");
        while (content.firstChild)
          body.append(content.firstChild);
        popover.append(body);
        dropdown.append(popover);
        reference.setAttribute("popovertarget", popover.id);
        reference.setAttribute("aria-controls", popover.id);
        parent.insertBefore(dropdown, next);
      }
      reference.addEventListener("click", (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
          return;
        event.preventDefault();
        if (popover.matches(":popover-open"))
          popover.hidePopover();
        else
          popover.showPopover();
      }, { signal: this.#abort.signal });
    }
  }
  define("ot-footnotes", OtFootnotes);
})();
