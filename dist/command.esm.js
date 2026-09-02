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
export {
  OtCommand
};
