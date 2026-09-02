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
// src/js/command.js
class OtCommand extends HTMLElement {
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
  get items() {
    return [...this.list.querySelectorAll("[data-command-item]")];
  }
  get visibleItems() {
    return this.items.filter((item) => !item.closest("li")?.hidden && !item.hasAttribute("aria-disabled"));
  }
  open() {
    if (!this.dialog.open)
      this.dialog.showModal();
    this.search.value = "";
    this.#filter();
    requestAnimationFrame(() => this.search.focus());
    emit(this, "oatbase:open");
  }
  close() {
    if (this.dialog.open)
      this.dialog.close();
    emit(this, "oatbase:close");
  }
  #connect() {
    this.#abort?.abort();
    this.#abort = new AbortController;
    const signal = this.#abort.signal;
    this.dialog = this.querySelector(":scope > dialog");
    this.search = this.dialog?.querySelector("[data-command-search]");
    this.list = this.dialog?.querySelector("[data-command-list]");
    if (!this.dialog || !this.search || !this.list)
      return;
    this.list.id ||= uid("oatbase-command");
    this.search.setAttribute("aria-controls", this.list.id);
    this.querySelectorAll("[data-command-open]").forEach((trigger) => {
      trigger.addEventListener("click", (event) => {
        event.preventDefault();
        this.open();
      }, { signal });
    });
    this.querySelectorAll("[data-command-close]").forEach((trigger) => {
      trigger.addEventListener("click", () => this.close(), { signal });
    });
    this.search.addEventListener("input", () => this.#filter(), { signal });
    this.search.addEventListener("keydown", (event) => this.#onKeydown(event), { signal });
    this.list.addEventListener("pointermove", (event) => this.#onPointerMove(event), { signal });
    this.list.addEventListener("click", (event) => {
      const item = event.target.closest("[data-command-item]");
      if (item && !item.hasAttribute("aria-disabled"))
        this.#activate(item);
    }, { signal });
    this.dialog.addEventListener("click", (event) => {
      const rect = this.dialog.getBoundingClientRect();
      const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
      if (outside)
        this.close();
    }, { signal });
    document.addEventListener("keydown", (event) => {
      const shortcut = this.dataset.shortcut?.toLowerCase();
      const wantsModK = shortcut === "mod+k" && (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      if (wantsModK) {
        event.preventDefault();
        this.dialog.open ? this.close() : this.open();
      }
    }, { signal });
    this.#filter();
  }
  #filter() {
    const query = this.search.value.trim().toLocaleLowerCase();
    this.items.forEach((item) => {
      const terms = `${item.textContent} ${item.dataset.keywords || ""}`.toLocaleLowerCase();
      item.closest("li").hidden = !terms.includes(query);
    });
    this.list.querySelectorAll("[data-command-group]").forEach((group) => {
      let sibling = group.nextElementSibling;
      let hasVisibleItem = false;
      while (sibling && !sibling.hasAttribute("data-command-group")) {
        if ((sibling.matches("[data-command-item]") || sibling.querySelector("[data-command-item]")) && !sibling.hidden)
          hasVisibleItem = true;
        sibling = sibling.nextElementSibling;
      }
      group.hidden = !hasVisibleItem;
    });
    this.querySelector("[data-command-empty]")?.toggleAttribute("hidden", this.visibleItems.length > 0);
    this.#active = this.visibleItems.length ? 0 : -1;
    const active = setActive(this.visibleItems, this.#active);
    if (active)
      this.search.setAttribute("aria-activedescendant", active.id ||= uid("oatbase-command-item"));
    else
      this.search.removeAttribute("aria-activedescendant");
  }
  #onKeydown(event) {
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      this.#active = nextIndex(event.key, this.#active, this.visibleItems.length);
      const active = setActive(this.visibleItems, this.#active);
      if (active)
        this.search.setAttribute("aria-activedescendant", active.id ||= uid("oatbase-command-item"));
    } else if (event.key === "Enter" && this.#active >= 0) {
      event.preventDefault();
      this.#activate(this.visibleItems[this.#active]);
    }
  }
  #onPointerMove(event) {
    const item = event.target.closest("[data-command-item]");
    if (!item || item.closest("li")?.hidden || item.hasAttribute("aria-disabled"))
      return;
    this.#active = this.visibleItems.indexOf(item);
    setActive(this.visibleItems, this.#active);
  }
  #activate(item) {
    if (!item)
      return;
    const value = item.dataset.value || item.textContent.trim();
    const accepted = this.dispatchEvent(new CustomEvent("oatbase:select", {
      bubbles: true,
      composed: true,
      cancelable: true,
      detail: { value, item }
    }));
    if (!accepted)
      return;
    if (!item.hasAttribute("data-keep-open"))
      this.close();
  }
}
define("ot-command", OtCommand);
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
// src/js/theme-switcher.js
class OtThemeSwitcher extends HTMLElement {
  #abort;
  #theme = "system";
  connectedCallback() {
    this.#abort?.abort();
    this.#abort = new AbortController;
    const signal = this.#abort.signal;
    this.key = this.dataset.storageKey || "oatbase-theme";
    let initial = this.dataset.default || "system";
    try {
      initial = localStorage.getItem(this.key) || initial;
    } catch {}
    this.#theme = ["system", "light", "dark"].includes(initial) ? initial : "system";
    this.buttons = [...this.querySelectorAll("[data-theme-value]")];
    this.toggleButton = this.buttons.length ? null : this.querySelector("button");
    this.toggleContents = this.toggleButton ? [...this.toggleButton.querySelectorAll("[data-theme-content]")] : [];
    this.toggleLabel = this.toggleButton?.querySelector("[data-theme-label]");
    this.toggleAttribute("data-group", this.buttons.length > 1);
    this.buttons.forEach((button) => button.addEventListener("click", () => this.value = button.dataset.themeValue, { signal }));
    this.toggleButton?.addEventListener("click", () => {
      const values = ["system", "light", "dark"];
      this.value = values[(values.indexOf(this.#theme) + 1) % values.length];
    }, { signal });
    this.#apply(false);
  }
  disconnectedCallback() {
    this.#abort?.abort();
  }
  get value() {
    return this.#theme;
  }
  set value(value) {
    if (!["system", "light", "dark"].includes(value))
      return;
    this.#theme = value;
    this.#apply(true);
  }
  #target() {
    if (!this.dataset.target)
      return this.ownerDocument.documentElement;
    try {
      return this.ownerDocument.querySelector(this.dataset.target);
    } catch {
      return null;
    }
  }
  #apply(notify) {
    const target = this.#target();
    if (target) {
      target.style.colorScheme = this.#theme === "system" ? "light dark" : this.#theme;
      if (this.#theme === "system")
        target.removeAttribute("data-theme");
      else
        target.dataset.theme = this.#theme;
    }
    try {
      localStorage.setItem(this.key, this.#theme);
    } catch {}
    this.buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.themeValue === this.#theme)));
    if (this.toggleButton) {
      const label = this.#theme === "light" ? "Light" : this.#theme === "dark" ? "Dark" : "System";
      if (this.toggleContents.length) {
        this.toggleContents.forEach((content) => {
          content.hidden = content.dataset.themeContent !== this.#theme;
        });
        if (this.toggleLabel)
          this.toggleLabel.textContent = label;
      } else {
        this.toggleButton.textContent = label;
      }
      this.toggleButton.dataset.theme = this.#theme;
      this.toggleButton.setAttribute("aria-label", `Theme: ${this.#theme}. Click to change.`);
    }
    if (notify)
      emit(this, "change", { value: this.#theme });
  }
}
define("ot-theme-switcher", OtThemeSwitcher);
// src/js/copy-button.js
class OtCopy extends HTMLElement {
  #abort;
  #feedbackTimer;
  #label;
  connectedCallback() {
    this.#abort?.abort();
    this.#abort = new AbortController;
    this.button = this.querySelector("[data-copy-button]");
    this.source = this.#source();
    this.#label = this.button?.textContent || "";
    this.#reserveFeedbackWidth(this.dataset.copied || "Copied");
    this.button?.addEventListener("click", () => this.copy(), { signal: this.#abort.signal });
  }
  disconnectedCallback() {
    this.#abort?.abort();
    clearTimeout(this.#feedbackTimer);
  }
  #source() {
    const id2 = this.button?.dataset.copyTarget || this.dataset.copyTarget;
    return id2 && document.getElementById(id2) || this.querySelector("[data-copy-source]");
  }
  get value() {
    const source = this.#source();
    return source && "value" in source ? source.value : source?.textContent?.trim() || "";
  }
  #reserveFeedbackWidth(feedback) {
    if (!this.button)
      return;
    const clone = this.button.cloneNode(true);
    clone.textContent = feedback;
    clone.style.cssText = "position:fixed!important;inset:0 auto auto 0!important;inline-size:max-content!important;visibility:hidden!important;pointer-events:none!important";
    this.append(clone);
    const width = Math.ceil(Math.max(this.button.getBoundingClientRect().width, clone.getBoundingClientRect().width));
    clone.remove();
    this.button.style.minInlineSize = `${width}px`;
  }
  async copy() {
    const value = this.value;
    if (!value)
      return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const area = Object.assign(document.createElement("textarea"), { value });
      document.body.append(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    const feedback = this.dataset.copied || "Copied";
    this.#reserveFeedbackWidth(feedback);
    this.button.textContent = feedback;
    emit(this, "oatbase:copy", { value });
    clearTimeout(this.#feedbackTimer);
    this.#feedbackTimer = setTimeout(() => {
      if (this.button)
        this.button.textContent = this.#label;
    }, 1200);
  }
}
define("ot-copy", OtCopy);
// src/js/multiselect.js
class OtMultiselect extends HTMLElement {
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
    return [...this.select?.selectedOptions || []].map((option) => option.value);
  }
  set value(values) {
    const selected = new Set([].concat(values).map(String));
    [...this.select?.options || []].forEach((option) => {
      option.selected = selected.has(option.value);
    });
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
    this.#active = 0;
    setActive(this.enabledOptions, this.#active);
  }
  close() {
    if (!this.list)
      return;
    this.list.hidden = true;
    this.button.setAttribute("aria-expanded", "false");
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
    this.select = this.querySelector(":scope > select[multiple]");
    if (!this.select)
      return;
    this.#build();
    this.button.addEventListener("click", () => this.toggle(), { signal });
    this.button.addEventListener("keydown", (event) => this.#keydown(event), { signal });
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
    const id2 = uid("oatbase-multiselect");
    this.button = document.createElement("button");
    this.button.type = "button";
    this.button.className = "outline";
    this.button.dataset.generated = "";
    this.button.setAttribute("aria-haspopup", "listbox");
    this.button.setAttribute("aria-controls", id2);
    this.button.setAttribute("aria-expanded", "false");
    this.list = document.createElement("ul");
    this.list.id = id2;
    this.list.hidden = true;
    this.list.dataset.generated = "";
    this.list.setAttribute("role", "listbox");
    this.list.setAttribute("aria-multiselectable", "true");
    [...this.select.options].forEach((source, index) => {
      const option = document.createElement("li");
      option.id = `${id2}-option-${index + 1}`;
      option._source = source;
      option.dataset.index = index;
      option.setAttribute("role", "option");
      option.setAttribute("aria-disabled", String(source.disabled));
      option.textContent = source.textContent;
      this.list.append(option);
    });
    this.append(this.button, this.list);
  }
  #keydown(event) {
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      if (this.list.hidden)
        this.open();
      this.#active = nextIndex(event.key, this.#active, this.enabledOptions.length);
      setActive(this.enabledOptions, this.#active);
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      if (this.list.hidden)
        this.open();
      else
        this.#choose(this.enabledOptions[this.#active]);
    } else if (event.key === "Escape")
      this.close();
  }
  #choose(option) {
    const source = option?._source;
    if (!source || source.disabled)
      return;
    source.selected = !source.selected;
    this.#sync();
    this.select.dispatchEvent(new Event("change", { bubbles: true }));
    emit(this, "oatbase:change", { value: this.value, option: source });
  }
  #sync() {
    const selected = [...this.select.selectedOptions];
    this.button.textContent = selected.length ? selected.map((option) => option.textContent).join(", ") : this.dataset.placeholder || "Select options";
    this.button.disabled = this.select.disabled;
    this.options.forEach((option) => option.setAttribute("aria-selected", String(option._source.selected)));
  }
}
define("ot-multiselect", OtMultiselect);
// src/js/password-field.js
class OtPassword extends HTMLElement {
  #abort;
  connectedCallback() {
    this.#abort?.abort();
    this.#abort = new AbortController;
    this.input = this.querySelector("input");
    this.button = this.querySelector("[data-password-toggle]");
    if (!this.input || !this.button)
      return;
    this.button.type = "button";
    this.button.addEventListener("click", () => this.toggle(), { signal: this.#abort.signal });
    this.#sync();
  }
  disconnectedCallback() {
    this.#abort?.abort();
  }
  toggle(force) {
    const visible = force ?? this.input.type === "password";
    this.input.type = visible ? "text" : "password";
    this.#sync();
    this.input.focus();
  }
  #sync() {
    const visible = this.input.type === "text";
    this.button.setAttribute("aria-pressed", String(visible));
    this.button.setAttribute("aria-label", visible ? "Hide password" : "Show password");
    this.button.textContent = visible ? this.dataset.hideLabel || "Hide" : this.dataset.showLabel || "Show";
  }
}
define("ot-password", OtPassword);
// src/js/splitter.js
class OtSplitter extends HTMLElement {
  #abort;
  #dragging = false;
  connectedCallback() {
    this.#abort?.abort();
    this.#abort = new AbortController;
    const signal = this.#abort.signal;
    this.handle = this.querySelector("[data-splitter]");
    if (!this.handle)
      return;
    this.handle.type = "button";
    this.handle.setAttribute("role", "separator");
    this.handle.setAttribute("aria-orientation", this.separatorOrientation);
    this.handle.setAttribute("aria-valuemin", String(this.min));
    this.handle.setAttribute("aria-valuemax", String(this.max));
    this.handle.addEventListener("pointerdown", (event) => {
      this.#dragging = true;
      this.handle.setPointerCapture?.(event.pointerId);
      this.#setFromPointer(event);
    }, { signal });
    this.handle.addEventListener("pointermove", (event) => this.#dragging && this.#setFromPointer(event), { signal });
    this.handle.addEventListener("pointerup", () => {
      this.#dragging = false;
    }, { signal });
    this.handle.addEventListener("keydown", (event) => {
      const keys = this.vertical ? ["ArrowUp", "ArrowDown", "Home", "End"] : ["ArrowLeft", "ArrowRight", "Home", "End"];
      if (!keys.includes(event.key))
        return;
      event.preventDefault();
      const backward = event.key === "ArrowLeft" || event.key === "ArrowUp";
      const next = event.key === "Home" ? this.min : event.key === "End" ? this.max : this.value + (backward ? -5 : 5);
      this.value = next;
    }, { signal });
    this.value = Number(this.dataset.value || 50);
  }
  disconnectedCallback() {
    this.#abort?.abort();
  }
  get min() {
    return Number(this.dataset.min || 20);
  }
  get max() {
    return Number(this.dataset.max || 80);
  }
  get vertical() {
    return this.getAttribute("aria-orientation") === "vertical";
  }
  get separatorOrientation() {
    return this.vertical ? "horizontal" : "vertical";
  }
  get value() {
    return Number(this.handle?.getAttribute("aria-valuenow") || 50);
  }
  set value(value) {
    const next = Math.min(this.max, Math.max(this.min, Math.round(Number(value))));
    this.style.setProperty("--split", `${next}%`);
    this.handle?.setAttribute("aria-valuenow", String(next));
    emit(this, "oatbase:resize", { value: next });
  }
  #setFromPointer(event) {
    const bounds = this.getBoundingClientRect();
    this.value = this.vertical ? (event.clientY - bounds.top) / bounds.height * 100 : (event.clientX - bounds.left) / bounds.width * 100;
  }
}
define("ot-splitter", OtSplitter);
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
// src/js/toggle.js
class OtToggle extends HTMLElement {
  connectedCallback() {
    this.button = this.querySelector(":scope > button");
    if (!this.button)
      return;
    this.button.type = "button";
    this.pressed = this.hasAttribute("pressed") || this.button.getAttribute("aria-pressed") === "true";
    this.button.addEventListener("click", this);
  }
  disconnectedCallback() {
    this.button?.removeEventListener("click", this);
  }
  handleEvent() {
    if (this.button.disabled || this.button.getAttribute("aria-disabled") === "true")
      return;
    this.pressed = !this.pressed;
    emit(this, "oatbase:change", { pressed: this.pressed });
  }
  get pressed() {
    return this.hasAttribute("pressed");
  }
  set pressed(value) {
    this.toggleAttribute("pressed", Boolean(value));
    this.button?.setAttribute("aria-pressed", String(Boolean(value)));
  }
}
define("ot-toggle", OtToggle);
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
// src/js/otp-input.js
class OtOtp extends HTMLElement {
  #complete = false;
  connectedCallback() {
    this.input = this.querySelector(":scope > input");
    if (!this.input)
      return;
    this.length = Math.min(12, Math.max(1, Number(this.dataset.length || this.input.maxLength || 6)));
    if (this.input.maxLength < 1)
      this.input.maxLength = this.length;
    this.slots = this.querySelector(":scope > [data-otp-slots]") || document.createElement("span");
    this.slots.dataset.otpSlots = "";
    this.slots.setAttribute("aria-hidden", "true");
    this.slots.style.setProperty("--otp-length", this.length);
    if (!this.slots.isConnected)
      this.append(this.slots);
    this.slots.replaceChildren(...Array.from({ length: this.length }, () => document.createElement("span")));
    this.input.addEventListener("input", this);
    this.form = this.input.form;
    this.form?.addEventListener("reset", this);
    this.dataset.enhanced = "";
    this.#render(false);
  }
  disconnectedCallback() {
    this.input?.removeEventListener("input", this);
    this.form?.removeEventListener("reset", this);
  }
  handleEvent(event) {
    if (event.type === "reset")
      setTimeout(() => this.#render(false));
    else
      this.#render(true);
  }
  get value() {
    return this.input?.value || "";
  }
  set value(value) {
    if (!this.input)
      return;
    this.input.value = String(value).slice(0, this.length);
    this.#render(false);
  }
  #render(fromInput) {
    if (!this.input || !this.slots)
      return;
    if (this.input.inputMode === "numeric") {
      const sanitized = this.input.value.replace(/\D/g, "").slice(0, this.length);
      if (sanitized !== this.input.value)
        this.input.value = sanitized;
    } else if (this.input.value.length > this.length) {
      this.input.value = this.input.value.slice(0, this.length);
    }
    const value = this.input.value;
    const cursor = Math.min(this.length - 1, value.length);
    [...this.slots.children].forEach((slot, index) => {
      slot.textContent = value[index] || " ";
      slot.toggleAttribute("data-filled", index < value.length);
      slot.toggleAttribute("data-active", index === cursor);
    });
    this.toggleAttribute("data-complete", value.length === this.length);
    const complete = value.length === this.length;
    if (fromInput && complete && !this.#complete)
      emit(this, "oatbase:complete", { value });
    this.#complete = complete;
  }
}
define("ot-otp", OtOtp);
// src/js/lightbox.js
class OtLightbox extends HTMLElement {
  #abort;
  #activeIndex = -1;
  #trigger;
  connectedCallback() {
    this.#abort?.abort();
    this.#abort = new AbortController;
    this.dialog = this.querySelector(":scope > dialog[data-lightbox-dialog]");
    this.image = this.dialog?.querySelector("[data-lightbox-image]");
    this.caption = this.dialog?.querySelector("[data-lightbox-caption]");
    this.status = this.dialog?.querySelector("[data-lightbox-status]");
    this.previousButton = this.dialog?.querySelector("[data-lightbox-previous]");
    this.nextButton = this.dialog?.querySelector("[data-lightbox-next]");
    this.closeButton = this.dialog?.querySelector("[data-lightbox-close]");
    if (!this.dialog || !this.image || typeof this.dialog.showModal !== "function")
      return;
    const options = { signal: this.#abort.signal };
    this.addEventListener("click", (event) => this.#click(event), options);
    this.dialog.addEventListener("keydown", (event) => this.#keydown(event), options);
    this.dialog.addEventListener("close", () => this.#closed(), options);
    this.previousButton?.addEventListener("click", () => this.previous(), options);
    this.nextButton?.addEventListener("click", () => this.next(), options);
    this.closeButton?.addEventListener("click", () => this.close(), options);
    this.toggleAttribute("data-enhanced", true);
  }
  disconnectedCallback() {
    this.#abort?.abort();
  }
  get items() {
    return [...this.querySelectorAll("[data-lightbox-item]")].filter((item) => !this.dialog?.contains(item));
  }
  get currentIndex() {
    return this.#activeIndex;
  }
  open(item = 0) {
    const items = this.items;
    const index = typeof item === "number" ? item : items.indexOf(item);
    if (!items.length || index < 0 || index >= items.length || !this.dialog || !this.image)
      return;
    this.#trigger = items[index];
    this.#show(index);
    if (!this.dialog.open)
      this.dialog.showModal();
    emit(this, "oatbase:open", { index, item: items[index] });
  }
  close() {
    this.dialog?.close();
  }
  next() {
    const length = this.items.length;
    if (length)
      this.#show((this.#activeIndex + 1 + length) % length);
  }
  previous() {
    const length = this.items.length;
    if (length)
      this.#show((this.#activeIndex - 1 + length) % length);
  }
  #click(event) {
    const item = event.target.closest?.("[data-lightbox-item]");
    if (!item || this.dialog.contains(item))
      return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    this.open(item);
  }
  #keydown(event) {
    if (event.key === "ArrowRight")
      this.next();
    else if (event.key === "ArrowLeft")
      this.previous();
    else if (event.key === "Home")
      this.#show(0);
    else if (event.key === "End")
      this.#show(this.items.length - 1);
    else
      return;
    event.preventDefault();
  }
  #show(index) {
    const items = this.items;
    const item = items[index];
    if (!item)
      return;
    const sourceImage = item.matches("img") ? item : item.querySelector("img");
    const source = item.dataset.lightboxSrc || item.getAttribute("href") || sourceImage?.currentSrc || sourceImage?.src;
    if (!source)
      return;
    const figure = item.closest("figure");
    const caption = item.dataset.lightboxCaption ?? figure?.querySelector("figcaption")?.textContent.trim() ?? "";
    this.image.src = source;
    this.image.alt = item.dataset.lightboxAlt ?? sourceImage?.alt ?? "";
    if (this.caption) {
      this.caption.textContent = caption;
      this.caption.hidden = !caption;
    }
    if (this.status)
      this.status.textContent = `${index + 1} of ${items.length}`;
    if (this.previousButton)
      this.previousButton.disabled = items.length < 2;
    if (this.nextButton)
      this.nextButton.disabled = items.length < 2;
    this.#activeIndex = index;
    this.#preload(items[(index - 1 + items.length) % items.length]);
    this.#preload(items[(index + 1) % items.length]);
    emit(this, "oatbase:change", { index, item, source });
  }
  #preload(item) {
    if (!item || this.items.length < 2)
      return;
    const sourceImage = item.matches("img") ? item : item.querySelector("img");
    const source = item.dataset.lightboxSrc || item.getAttribute("href") || sourceImage?.currentSrc || sourceImage?.src;
    if (source)
      Object.assign(new Image, { src: source });
  }
  #closed() {
    const trigger = this.#trigger;
    this.#trigger = null;
    trigger?.focus?.({ preventScroll: true });
    emit(this, "oatbase:close", { index: this.#activeIndex, item: this.items[this.#activeIndex] });
  }
}
define("ot-lightbox", OtLightbox);
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
      const id2 = decodeURIComponent(link.hash.slice(1));
      const target = id2 ? document.getElementById(id2) : null;
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
// src/js/data-table.js
var collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

class OtDataTable extends HTMLElement {
  #abort;
  #order = new WeakMap;
  #sort = { index: -1, direction: "none" };
  connectedCallback() {
    this.#abort?.abort();
    this.#abort = new AbortController;
    const signal = this.#abort.signal;
    this.table = this.querySelector(":scope > table, :scope > .scroll-area > table");
    if (!this.table)
      return;
    this.filter = this.querySelector("[data-table-filter]");
    this.selectAll = this.querySelector("[data-table-select-all]");
    this.status = this.querySelector("[data-table-status]");
    this.selectedStatus = this.querySelector("[data-table-selected]");
    this.empty = this.querySelector("[data-table-empty]");
    this.#prepareHeaders(signal);
    this.refresh();
    this.filter?.addEventListener("input", () => this.#filter(), { signal });
    this.table.addEventListener("change", (event) => {
      if (event.target.matches("[data-table-select-row]"))
        this.#selectionChanged(event.target);
      else if (event.target.matches("[data-table-select-all]"))
        this.#toggleVisible(event.target.checked);
    }, { signal });
    this.addEventListener("oatbase:refresh", () => this.refresh(), { signal });
    this.dataset.enhanced = "";
  }
  disconnectedCallback() {
    this.#abort?.abort();
  }
  get rows() {
    return [...this.table?.tBodies[0]?.rows || []];
  }
  get visibleRows() {
    return this.rows.filter((row) => !row.hidden);
  }
  get selectedRows() {
    return this.rows.filter((row) => row.querySelector("[data-table-select-row]:checked"));
  }
  refresh() {
    this.rows.forEach((row, index) => {
      if (!this.#order.has(row))
        this.#order.set(row, index);
    });
    this.#filter(false);
  }
  #prepareHeaders(signal) {
    [...this.table.tHead?.rows[0]?.cells || []].forEach((header, index) => {
      if (!header.hasAttribute("data-sort"))
        return;
      let button = header.querySelector(":scope > [data-table-sort]");
      if (!button) {
        button = document.createElement("button");
        button.type = "button";
        button.dataset.tableSort = "";
        button.className = "ghost";
        button.append(...header.childNodes);
        header.append(button);
      }
      header.setAttribute("aria-sort", "none");
      button.addEventListener("click", () => this.#sortBy(header, index), { signal });
    });
  }
  #sortBy(header, index) {
    const direction = this.#sort.index !== index || this.#sort.direction === "none" ? "ascending" : this.#sort.direction === "ascending" ? "descending" : "none";
    this.#sort = { index, direction };
    [...this.table.tHead?.rows[0]?.cells || []].filter((cell) => cell.hasAttribute("data-sort")).forEach((cell) => cell.setAttribute("aria-sort", cell === header ? direction : "none"));
    const type = header.dataset.sort || "text";
    const rows = [...this.rows].sort((left, right) => {
      if (direction === "none")
        return this.#order.get(left) - this.#order.get(right);
      const result = this.#compare(this.#value(left, index), this.#value(right, index), type);
      return direction === "ascending" ? result : -result;
    });
    this.table.tBodies[0].append(...rows);
    emit(this, "oatbase:sort", { index, direction, type, header });
  }
  #value(row, index) {
    const cell = row.cells[index];
    return cell?.dataset.sortValue ?? cell?.textContent.trim() ?? "";
  }
  #compare(left, right, type) {
    if (type === "number")
      return (Number(left) || 0) - (Number(right) || 0);
    if (type === "date")
      return (Date.parse(left) || 0) - (Date.parse(right) || 0);
    return collator.compare(left, right);
  }
  #filter(announce = true) {
    const query = this.filter?.value.trim().toLocaleLowerCase() || "";
    this.rows.forEach((row) => {
      const haystack = (row.dataset.filterValue || row.textContent).toLocaleLowerCase();
      row.hidden = Boolean(query && !haystack.includes(query));
    });
    const visible = this.visibleRows.length;
    const total = this.rows.length;
    if (this.status)
      this.status.value = query ? `${visible} of ${total} rows` : `${total} rows`;
    if (this.empty)
      this.empty.hidden = visible > 0;
    this.#syncSelection();
    if (announce)
      emit(this, "oatbase:filter", { query, visible, total });
  }
  #toggleVisible(checked) {
    this.visibleRows.forEach((row) => {
      const input = row.querySelector("[data-table-select-row]:not(:disabled)");
      if (input)
        input.checked = checked;
    });
    this.#syncSelection();
    this.#emitSelection();
  }
  #selectionChanged(input) {
    input.closest("tr")?.toggleAttribute("data-selected", input.checked);
    this.#syncSelection();
    this.#emitSelection();
  }
  #syncSelection() {
    this.rows.forEach((row) => row.toggleAttribute("data-selected", Boolean(row.querySelector("[data-table-select-row]:checked"))));
    const visibleInputs = this.visibleRows.map((row) => row.querySelector("[data-table-select-row]:not(:disabled)")).filter(Boolean);
    const checked = visibleInputs.filter((input) => input.checked).length;
    if (this.selectAll) {
      this.selectAll.checked = visibleInputs.length > 0 && checked === visibleInputs.length;
      this.selectAll.indeterminate = checked > 0 && checked < visibleInputs.length;
    }
    if (this.selectedStatus)
      this.selectedStatus.value = `${this.selectedRows.length} selected`;
  }
  #emitSelection() {
    emit(this, "oatbase:select", {
      rows: this.selectedRows,
      values: this.selectedRows.map((row) => row.querySelector("[data-table-select-row]")?.value).filter((value) => value != null)
    });
  }
}
define("ot-data-table", OtDataTable);
// src/js/repeater.js
class OtRepeater extends HTMLElement {
  #abort;
  #initialMarkup;
  #nextIndex = 0;
  connectedCallback() {
    this.#abort?.abort();
    this.#abort = new AbortController;
    const signal = this.#abort.signal;
    this.list = this.querySelector(":scope > [data-repeater-list]");
    this.template = this.querySelector(":scope > template[data-repeater-template]");
    if (!this.list || !this.template)
      return;
    if (this.#initialMarkup == null)
      this.#initialMarkup = this.list.innerHTML;
    this.#prepareItems();
    this.addEventListener("click", (event) => this.#onClick(event), { signal });
    this.closest("form")?.addEventListener("reset", () => queueMicrotask(() => this.#reset()), { signal });
    this.dataset.enhanced = "";
    this.refresh();
  }
  disconnectedCallback() {
    this.#abort?.abort();
  }
  get items() {
    return [...this.list?.querySelectorAll(":scope > [data-repeater-item]") || []];
  }
  get min() {
    return Math.max(0, Number(this.dataset.min) || 0);
  }
  get max() {
    return Math.max(this.min, Number(this.dataset.max) || Infinity);
  }
  add() {
    if (!this.template || this.items.length >= this.max)
      return null;
    const index = this.#nextIndex++;
    const fragment = this.template.content.cloneNode(true);
    const elements2 = [...fragment.querySelectorAll("*")];
    elements2.forEach((element) => {
      [...element.attributes].forEach((attribute) => {
        if (attribute.value.includes("__index__")) {
          element.setAttribute(attribute.name, attribute.value.replaceAll("__index__", String(index)));
        }
      });
      if (element.hasAttribute("data-repeater-number"))
        element.textContent = String(index + 1);
    });
    const item = fragment.querySelector("[data-repeater-item]");
    if (!item)
      return null;
    item.dataset.repeaterIndex = index;
    this.list.append(fragment);
    this.refresh();
    item.querySelector('[data-repeater-focus], input:not([type="hidden"]), select, textarea, button')?.focus();
    emit(this, "oatbase:add", { item, index });
    return item;
  }
  remove(item) {
    if (!item?.matches?.("[data-repeater-item]") || !this.list?.contains(item) || this.items.length <= this.min)
      return false;
    const index = Number(item.dataset.repeaterIndex);
    const focusTarget = item.previousElementSibling?.querySelector("[data-repeater-remove]") || item.nextElementSibling?.querySelector("[data-repeater-remove]") || this.querySelector("[data-repeater-add]");
    item.remove();
    this.refresh();
    focusTarget?.focus();
    emit(this, "oatbase:remove", { item, index });
    return true;
  }
  refresh() {
    const items = this.items;
    const atMin = items.length <= this.min;
    const atMax = items.length >= this.max;
    this.querySelectorAll("[data-repeater-add]").forEach((button) => {
      button.disabled = atMax;
    });
    items.forEach((item, position) => {
      item.querySelectorAll("[data-repeater-remove]").forEach((button) => {
        button.disabled = atMin;
      });
      item.querySelectorAll("[data-repeater-position]").forEach((output) => {
        output.value = String(position + 1);
      });
    });
    this.toggleAttribute("data-empty", items.length === 0);
  }
  #prepareItems() {
    this.#nextIndex = 0;
    this.items.forEach((item) => {
      const existing = Number(item.dataset.repeaterIndex);
      const index = Number.isFinite(existing) ? existing : this.#nextIndex;
      item.dataset.repeaterIndex = index;
      this.#nextIndex = Math.max(this.#nextIndex, index + 1);
    });
  }
  #onClick(event) {
    const add = event.target.closest("[data-repeater-add]");
    if (add && this.contains(add)) {
      event.preventDefault();
      this.add();
      return;
    }
    const remove = event.target.closest("[data-repeater-remove]");
    if (remove && this.contains(remove)) {
      event.preventDefault();
      this.remove(remove.closest("[data-repeater-item]"));
    }
  }
  #reset() {
    this.list.innerHTML = this.#initialMarkup;
    this.#prepareItems();
    this.refresh();
    emit(this, "oatbase:reset", { items: this.items });
  }
}
define("ot-repeater", OtRepeater);
// src/js/log-viewer.js
class OtLogViewer extends HTMLElement {
  #abort;
  #observer;
  #frame;
  connectedCallback() {
    this.#abort?.abort();
    this.#observer?.disconnect();
    this.#abort = new AbortController;
    const signal = this.#abort.signal;
    this.log = this.querySelector(':scope > [role="log"], :scope > .scroll-area[role="log"]');
    if (!this.log)
      return;
    this.content = this.log.querySelector("[data-log-content]") || this.log;
    this.follow = this.querySelector("[data-log-follow]");
    this.status = this.querySelector("[data-log-status]");
    this.log.setAttribute("aria-relevant", this.log.getAttribute("aria-relevant") || "additions text");
    this.follow?.addEventListener("change", () => {
      this.toggleAttribute("data-following", this.follow.checked);
      if (this.follow.checked)
        this.#scrollToEnd();
      emit(this, "oatbase:follow", { following: this.follow.checked });
    }, { signal });
    this.log.addEventListener("scroll", () => this.#onScroll(), { signal, passive: true });
    this.#observer = new MutationObserver(() => this.#scheduleRefresh());
    this.#observer.observe(this.content, { childList: true, subtree: true, characterData: true });
    this.dataset.enhanced = "";
    this.refresh();
  }
  disconnectedCallback() {
    this.#abort?.abort();
    this.#observer?.disconnect();
    if (this.#frame)
      cancelAnimationFrame(this.#frame);
  }
  get lineCount() {
    const rows = this.content?.querySelectorAll?.("[data-log-line]");
    if (rows?.length)
      return rows.length;
    const value = this.content?.textContent || "";
    return value ? value.replace(/\r\n?/g, `
`).replace(/\n$/, "").split(`
`).length : 0;
  }
  append(value) {
    if (!this.content)
      return;
    if (this.content.querySelector("[data-log-line]")) {
      String(value).replace(/^\r?\n/, "").split(/\r?\n/).forEach((line) => {
        const row = document.createElement("span");
        row.dataset.logLine = "";
        row.textContent = line;
        this.content.append(row);
      });
      this.#scheduleRefresh();
      return;
    }
    this.content.append(document.createTextNode(String(value)));
    this.#scheduleRefresh();
  }
  refresh() {
    const lines = this.lineCount;
    if (this.status)
      this.status.value = `${lines} ${lines === 1 ? "line" : "lines"}`;
    const following = Boolean(this.follow?.checked);
    this.toggleAttribute("data-following", following);
    if (following)
      this.#scrollToEnd();
    emit(this, "oatbase:update", { lines, following });
  }
  #scheduleRefresh() {
    if (this.#frame)
      return;
    this.#frame = requestAnimationFrame(() => {
      this.#frame = 0;
      this.refresh();
    });
  }
  #scrollToEnd() {
    if (this.log)
      this.log.scrollTop = this.log.scrollHeight;
  }
  #onScroll() {
    if (!this.follow?.checked)
      return;
    const distance = this.log.scrollHeight - this.log.scrollTop - this.log.clientHeight;
    if (distance <= 2)
      return;
    this.follow.checked = false;
    this.toggleAttribute("data-following", false);
    emit(this, "oatbase:follow", { following: false, reason: "scroll" });
  }
}
define("ot-log-viewer", OtLogViewer);
export {
  OtTree,
  OtToolbar,
  OtToggle,
  OtThemeSwitcher,
  OtSplitter,
  OtSelect,
  OtScrollspy,
  OtRepeater,
  OtReadingProgress,
  OtPassword,
  OtOtp,
  OtMultiselect,
  OtLogViewer,
  OtLightbox,
  OtFootnotes,
  OtDataTable,
  OtCopy,
  OtCommand,
  OtCombobox
};
