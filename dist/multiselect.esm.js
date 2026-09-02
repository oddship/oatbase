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
export {
  OtMultiselect
};
