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

  // src/js/combobox.js
  var exports_combobox = {};
  __export(exports_combobox, {
    OtCombobox: () => OtCombobox
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

  // src/js/combobox.js
  class OtCombobox extends HTMLElement {
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
      this.#syncFromSelect();
    }
    get options() {
      return [...this.list?.querySelectorAll('[role="option"]') || []];
    }
    get visibleOptions() {
      return this.options.filter((option) => !option.hidden && option.getAttribute("aria-disabled") !== "true");
    }
    open() {
      if (this.input?.disabled)
        return;
      this.list.hidden = false;
      this.input.setAttribute("aria-expanded", "true");
    }
    close() {
      if (!this.list)
        return;
      this.list.hidden = true;
      this.input?.setAttribute("aria-expanded", "false");
      this.input?.removeAttribute("aria-activedescendant");
      setActive(this.visibleOptions, -1);
      this.#active = -1;
    }
    #connect() {
      this.#abort?.abort();
      this.#abort = new AbortController;
      const signal = this.#abort.signal;
      this.select = this.querySelector(":scope > select");
      if (!this.select)
        return;
      this.#build();
      this.input.addEventListener("input", () => this.#filter(), { signal });
      this.input.addEventListener("focus", () => this.open(), { signal });
      this.input.addEventListener("keydown", (event) => this.#onKeydown(event), { signal });
      this.list.addEventListener("pointermove", (event) => this.#onPointerMove(event), { signal });
      this.list.addEventListener("click", (event) => this.#onClick(event), { signal });
      this.select.addEventListener("change", () => this.#syncFromSelect(), { signal });
      this.select.form?.addEventListener("reset", () => queueMicrotask(() => this.#syncFromSelect()), { signal });
      closeOnOutsidePointer(this, signal);
      this.dataset.enhanced = "";
      this.#syncFromSelect();
    }
    #build() {
      this.querySelectorAll(":scope > [data-generated]").forEach((element) => element.remove());
      const listId = uid("oatbase-combobox");
      this.input = document.createElement("input");
      this.input.type = "search";
      this.input.autocomplete = "off";
      this.input.placeholder = this.dataset.placeholder || "Search…";
      this.input.disabled = this.select.disabled;
      this.input.dataset.generated = "";
      this.input.setAttribute("role", "combobox");
      this.input.setAttribute("aria-autocomplete", "list");
      this.input.setAttribute("aria-controls", listId);
      this.input.setAttribute("aria-expanded", "false");
      const label = this.select.getAttribute("aria-label");
      if (label)
        this.input.setAttribute("aria-label", label);
      this.list = document.createElement("ul");
      this.list.id = listId;
      this.list.hidden = true;
      this.list.dataset.generated = "";
      this.list.setAttribute("role", "listbox");
      [...this.select.options].forEach((source, index) => this.#appendOption(source, index));
      if (this.hasAttribute("data-allow-custom")) {
        this.create = document.createElement("li");
        this.create.id = `${listId}-create`;
        this.create.dataset.create = "";
        this.create.dataset.generated = "";
        this.create.setAttribute("role", "option");
        this.create.setAttribute("aria-selected", "false");
        this.create.hidden = true;
        this.list.append(this.create);
      }
      this.empty = document.createElement("li");
      this.empty.dataset.empty = "";
      this.empty.dataset.generated = "";
      this.empty.textContent = this.dataset.empty || "No results found.";
      this.empty.hidden = true;
      this.list.append(this.empty);
      this.append(this.input, this.list);
    }
    #filter() {
      const value = this.input.value.trim();
      const query = value.toLocaleLowerCase();
      const selected = this.select.options[this.select.selectedIndex];
      if (selected && this.input.value !== selected.textContent) {
        this.select.selectedIndex = -1;
        this.options.forEach((option) => option.setAttribute("aria-selected", "false"));
      }
      const sourceOptions = this.options.filter((option) => !option.hasAttribute("data-create"));
      sourceOptions.forEach((option) => {
        const terms = `${option.textContent} ${option.dataset.keywords}`.toLocaleLowerCase();
        option.hidden = !terms.includes(query);
      });
      if (this.create) {
        const exactMatch = sourceOptions.some((option) => {
          const source = option._source;
          return option.textContent.trim().toLocaleLowerCase() === query || source?.value.toLocaleLowerCase() === query;
        });
        this.create.hidden = !value || exactMatch;
        this.create.dataset.value = value;
        this.create.textContent = (this.dataset.createLabel || "Create “{value}”").replace("{value}", value);
      }
      this.empty.hidden = this.visibleOptions.length > 0;
      this.#active = -1;
      this.open();
    }
    #onKeydown(event) {
      if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        this.open();
        this.#active = nextIndex(event.key, this.#active, this.visibleOptions.length);
        const active = setActive(this.visibleOptions, this.#active);
        if (active)
          this.input.setAttribute("aria-activedescendant", active.id);
      } else if (event.key === "Enter" && (this.#active >= 0 || this.create && !this.create.hidden)) {
        event.preventDefault();
        this.#choose(this.#active >= 0 ? this.visibleOptions[this.#active] : this.create);
      } else if (event.key === "Escape") {
        this.close();
      }
    }
    #onPointerMove(event) {
      const option = event.target.closest('[role="option"]');
      if (!option || option.hidden || option.getAttribute("aria-disabled") === "true")
        return;
      this.#active = this.visibleOptions.indexOf(option);
      setActive(this.visibleOptions, this.#active);
    }
    #onClick(event) {
      const option = event.target.closest('[role="option"]');
      if (option && option.getAttribute("aria-disabled") !== "true")
        this.#choose(option);
    }
    #choose(option) {
      if (!option)
        return;
      if (option.hasAttribute("data-create")) {
        const value = option.dataset.value.trim();
        if (!value)
          return;
        const source2 = new Option(value, value, true, true);
        source2.dataset.custom = "";
        this.select.append(source2);
        const presentation = this.#appendOption(source2, source2.index, this.create);
        emit(this, "oatbase:create", { value, option: source2 });
        option = presentation;
      }
      const source = option._source;
      this.select.selectedIndex = source.index;
      this.#syncFromSelect();
      this.close();
      this.select.dispatchEvent(new Event("change", { bubbles: true }));
      emit(this, "oatbase:change", { value: source.value, option: source });
      this.input.focus();
    }
    #appendOption(source, index, before = null) {
      if (!source.value && source.disabled)
        return null;
      const option = document.createElement("li");
      option.id = `${this.list.id}-option-${index + 1}`;
      option._source = source;
      option.dataset.index = index;
      option.dataset.keywords = source.dataset.keywords || "";
      option.setAttribute("role", "option");
      option.setAttribute("aria-disabled", String(source.disabled));
      option.setAttribute("aria-selected", "false");
      option.textContent = source.textContent;
      this.list.insertBefore(option, before);
      return option;
    }
    #syncFromSelect() {
      const source = this.select.options[this.select.selectedIndex];
      this.input.value = source && source.value ? source.textContent : "";
      this.input.disabled = this.select.disabled;
      this.options.forEach((option) => {
        option.setAttribute("aria-selected", String(option._source === source));
      });
    }
  }
  define("ot-combobox", OtCombobox);
})();
