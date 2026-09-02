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
    this.addEventListener("keydown", (event) => this.#itemKeydown(event), options);
    this.dialog.addEventListener("keydown", (event) => this.#keydown(event), options);
    this.dialog.addEventListener("close", () => this.#closed(), options);
    this.previousButton?.addEventListener("click", () => this.previous(), options);
    this.nextButton?.addEventListener("click", () => this.next(), options);
    this.closeButton?.addEventListener("click", () => this.close(), options);
    this.refresh();
    this.toggleAttribute("data-enhanced", true);
  }
  disconnectedCallback() {
    this.#abort?.abort();
  }
  get itemSelector() {
    return this.getAttribute("data-item-selector") || "[data-lightbox-item]";
  }
  get items() {
    try {
      return [...this.querySelectorAll(this.itemSelector)].filter((item) => !this.dialog?.contains(item) && item.closest("ot-lightbox") === this);
    } catch {
      return [];
    }
  }
  get currentIndex() {
    return this.#activeIndex;
  }
  refresh() {
    const items = this.items;
    for (const item of items)
      this.#prepareTrigger(this.#triggerFor(item));
    return items;
  }
  open(item = 0) {
    const items = this.items;
    const index = typeof item === "number" ? item : items.indexOf(item);
    if (!items.length || index < 0 || index >= items.length || !this.dialog || !this.image)
      return;
    this.#trigger = this.#triggerFor(items[index]);
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
    const item = this.#itemFromTarget(event.target);
    if (!item || this.dialog.contains(event.target))
      return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    this.open(item);
  }
  #itemKeydown(event) {
    if (this.dialog.contains(event.target))
      return;
    const item = this.#itemFromTarget(event.target);
    const trigger = item && this.#triggerFor(item);
    if (!item || !trigger.hasAttribute("data-lightbox-trigger"))
      return;
    if (event.key !== "Enter" && event.key !== " ")
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
    const link = this.#linkFor(item);
    const source = item.dataset.lightboxSrc || link?.dataset.lightboxSrc || link?.getAttribute("href") || sourceImage?.currentSrc || sourceImage?.src;
    if (!source)
      return;
    const figure = item.closest("figure");
    const caption = item.dataset.lightboxCaption ?? link?.dataset.lightboxCaption ?? figure?.querySelector("figcaption")?.textContent.trim() ?? "";
    this.image.src = source;
    this.image.alt = item.dataset.lightboxAlt ?? link?.dataset.lightboxAlt ?? sourceImage?.alt ?? "";
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
    const link = this.#linkFor(item);
    const source = item.dataset.lightboxSrc || link?.dataset.lightboxSrc || link?.getAttribute("href") || sourceImage?.currentSrc || sourceImage?.src;
    if (source)
      Object.assign(new Image, { src: source });
  }
  #itemFromTarget(target) {
    if (!(target instanceof Node))
      return;
    return this.items.find((item) => {
      const trigger = this.#triggerFor(item);
      return item === target || item.contains(target) || trigger === target || trigger?.contains(target);
    });
  }
  #linkFor(item) {
    if (item.matches("a[href]"))
      return item;
    const ancestor = item.closest("a[href]");
    if (ancestor?.closest("ot-lightbox") === this)
      return ancestor;
    return item.querySelector?.("a[href]");
  }
  #triggerFor(item) {
    return this.#linkFor(item) || (this.#isNativeTrigger(item) ? item : item.querySelector?.("button, input, select, textarea, summary, [tabindex]")) || item;
  }
  #isNativeTrigger(element) {
    return element?.matches?.("a[href], button, input, select, textarea, summary, [tabindex]");
  }
  #prepareTrigger(trigger) {
    if (!trigger || this.#isNativeTrigger(trigger))
      return;
    trigger.tabIndex = 0;
    if (!trigger.hasAttribute("role"))
      trigger.setAttribute("role", "button");
    if (!trigger.hasAttribute("aria-haspopup"))
      trigger.setAttribute("aria-haspopup", "dialog");
    trigger.toggleAttribute("data-lightbox-trigger", true);
  }
  #closed() {
    const trigger = this.#trigger;
    this.#trigger = null;
    trigger?.focus?.({ preventScroll: true });
    emit(this, "oatbase:close", { index: this.#activeIndex, item: this.items[this.#activeIndex] });
  }
}
define("ot-lightbox", OtLightbox);
export {
  OtLightbox
};
