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
export {
  OtLightbox
};
