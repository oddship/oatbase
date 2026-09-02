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

  // src/js/select.js
  var exports_select = {};
  __export(exports_select, {
    OtSelect: () => OtSelect
  });

  // src/js/base.js
  var id = 0;
  var uid = (prefix = "oatbase") => `${prefix}-${++id}`;
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
  function setActive(items, index) {
    items.forEach((item, current) => item.toggleAttribute("data-active", current === index));
    const active = items[index];
    active?.scrollIntoView({ block: "nearest" });
    return active;
  }
  function nextIndex(key, current, length) {
    if (!length)
      return -1;
    if (key === "ArrowDown")
      return (current + 1 + length) % length;
    if (key === "ArrowUp")
      return (current - 1 + length) % length;
    if (key === "Home")
      return 0;
    if (key === "End")
      return length - 1;
    return current;
  }
  function emit(element, name, detail) {
    element.dispatchEvent(new CustomEvent(name, {
      bubbles: true,
      composed: true,
      detail
    }));
  }

  // src/js/outside-pointer.js
  var elements = new Set;
  document.addEventListener("pointerdown", (event) => {
    elements.forEach((element) => {
      if (!element.contains(event.target))
        element.close();
    });
  });
  function closeOnOutsidePointer(element, signal) {
    elements.add(element);
    signal.addEventListener("abort", () => elements.delete(element), { once: true });
  }

  // src/js/select.js
  class OtSelect extends HTMLElement {
    #abort;
    #readyAbort;
    #active = -1;
    connectedCallback() {
      this.#readyAbort?.abort();
      this.#readyAbort = connectWhenReady(this, () => this.#connect());
    }
    disconnectedCallback() {
      this.#readyAbort?.abort();
      this.#abort?.abort();
    }
    get value() {
      return this.select?.value || "";
    }
    set value(value) {
      if (!this.select)
        return;
      this.select.value = String(value);
      this.#sync();
    }
    get options() {
      return [...this.list?.querySelectorAll('[role="option"]') || []];
    }
    get enabledOptions() {
      return this.options.filter((option) => option.getAttribute("aria-disabled") !== "true");
    }
    open() {
      if (this.select?.disabled)
        return;
      this.list.hidden = false;
      this.button.setAttribute("aria-expanded", "true");
      this.#active = this.enabledOptions.findIndex((option) => option.getAttribute("aria-selected") === "true");
      const active = setActive(this.enabledOptions, this.#active);
      if (active)
        this.button.setAttribute("aria-activedescendant", active.id);
    }
    close() {
      if (!this.list)
        return;
      this.list.hidden = true;
      this.button.setAttribute("aria-expanded", "false");
      this.button.removeAttribute("aria-activedescendant");
      setActive(this.enabledOptions, -1);
      this.#active = -1;
    }
    toggle() {
      this.list.hidden ? this.open() : this.close();
    }
    #connect() {
      this.#abort?.abort();
      this.#abort = new AbortController;
      const signal = this.#abort.signal;
      this.select = this.querySelector(":scope > select");
      if (!this.select)
        return;
      this.#build();
      this.button.addEventListener("click", () => this.toggle(), { signal });
      this.button.addEventListener("keydown", (event) => this.#onKeydown(event), { signal });
      this.list.addEventListener("pointermove", (event) => this.#onPointerMove(event), { signal });
      this.list.addEventListener("click", (event) => {
        const option = event.target.closest('[role="option"]');
        if (option && option.getAttribute("aria-disabled") !== "true")
          this.#choose(option);
      }, { signal });
      this.select.addEventListener("change", () => this.#sync(), { signal });
      closeOnOutsidePointer(this, signal);
      this.dataset.enhanced = "";
      this.#sync();
    }
    #build() {
      this.querySelectorAll(":scope > [data-generated]").forEach((element) => element.remove());
      const listId = uid("oatbase-select");
      this.button = document.createElement("button");
      this.button.type = "button";
      this.button.className = "outline";
      this.button.dataset.generated = "";
      this.button.setAttribute("aria-haspopup", "listbox");
      this.button.setAttribute("aria-controls", listId);
      this.button.setAttribute("aria-expanded", "false");
      const label = this.select.getAttribute("aria-label");
      if (label)
        this.button.setAttribute("aria-label", label);
      this.list = document.createElement("ul");
      this.list.id = listId;
      this.list.hidden = true;
      this.list.dataset.generated = "";
      this.list.setAttribute("role", "listbox");
      [...this.select.options].forEach((source, index) => {
        if (!source.value && source.disabled)
          return;
        const option = document.createElement("li");
        option.id = `${listId}-option-${index + 1}`;
        option._source = source;
        option.dataset.index = index;
        option.setAttribute("role", "option");
        option.setAttribute("aria-disabled", String(source.disabled));
        option.textContent = source.textContent;
        this.list.append(option);
      });
      this.append(this.button, this.list);
    }
    #onKeydown(event) {
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        if (this.list.hidden)
          this.open();
        this.#active = nextIndex(event.key, this.#active, this.enabledOptions.length);
        const active = setActive(this.enabledOptions, this.#active);
        if (active)
          this.button.setAttribute("aria-activedescendant", active.id);
      } else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (this.list.hidden)
          this.open();
        else if (this.#active >= 0)
          this.#choose(this.enabledOptions[this.#active]);
      } else if (event.key === "Escape") {
        this.close();
      }
    }
    #onPointerMove(event) {
      const option = event.target.closest('[role="option"]');
      if (!option || option.getAttribute("aria-disabled") === "true")
        return;
      this.#active = this.enabledOptions.indexOf(option);
      setActive(this.enabledOptions, this.#active);
    }
    #choose(option) {
      const source = option._source;
      if (!source || source.disabled)
        return;
      this.select.selectedIndex = source.index;
      this.#sync();
      this.close();
      this.select.dispatchEvent(new Event("change", { bubbles: true }));
      emit(this, "oatbase:change", { value: source.value, option: source });
      this.button.focus();
    }
    #sync() {
      const source = this.select.options[this.select.selectedIndex];
      this.button.textContent = source?.value ? source.textContent : this.dataset.placeholder || source?.textContent || "Select an option";
      this.button.disabled = this.select.disabled;
      this.options.forEach((option) => option.setAttribute("aria-selected", String(option._source === source)));
    }
  }
  define("ot-select", OtSelect);
})();
