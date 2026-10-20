// src/js/base.js
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
function emit(element, name, detail) {
  element.dispatchEvent(new CustomEvent(name, {
    bubbles: true,
    composed: true,
    detail
  }));
}

// src/js/carousel.js
class OtCarousel extends HTMLElement {
  #ready;
  #abort;
  #observer;
  #resize;
  #frame;
  connectedCallback() {
    this.#ready?.abort();
    this.#ready = connectWhenReady(this, () => this.#connect());
  }
  #connect() {
    this.#cleanup();
    this.track = this.querySelector(":scope > [data-carousel-track]");
    if (!this.track)
      return;
    this.#abort = new AbortController;
    const signal = this.#abort.signal;
    this.addEventListener("click", (event) => {
      if (event.target.closest("[data-carousel-next]"))
        this.goTo(this.index + 1);
      if (event.target.closest("[data-carousel-previous]"))
        this.goTo(this.index - 1);
    }, { signal });
    this.track.addEventListener("scroll", () => this.#schedule(), { signal, passive: true });
    this.track.addEventListener("keydown", (event) => {
      if (event.target !== this.track)
        return;
      const rtl = getComputedStyle(this).direction === "rtl";
      const step = { ArrowLeft: rtl ? 1 : -1, ArrowRight: rtl ? -1 : 1 }[event.key];
      if (step || ["Home", "End"].includes(event.key)) {
        event.preventDefault();
        this.goTo(event.key === "Home" ? 0 : event.key === "End" ? this.slides.length - 1 : this.index + step);
      }
    }, { signal });
    this.#observer = new MutationObserver(() => this.refresh());
    this.#observer.observe(this.track, { childList: true });
    this.#resize = new ResizeObserver(() => this.#schedule());
    this.#resize.observe(this.track);
    this.dataset.enhanced = "";
    this.refresh();
  }
  get slides() {
    return [...this.track?.querySelectorAll(":scope > [data-carousel-slide]") || []];
  }
  get index() {
    const edge = this.track?.getBoundingClientRect().left || 0;
    const distances = this.slides.map((slide) => Math.abs(slide.getBoundingClientRect().left - edge));
    return distances.length ? distances.indexOf(Math.min(...distances)) : -1;
  }
  goTo(index) {
    const slide = this.slides[Math.max(0, Math.min(index, this.slides.length - 1))];
    if (!slide)
      return;
    const rtl = getComputedStyle(this).direction === "rtl";
    const box = slide.getBoundingClientRect();
    const track = this.track.getBoundingClientRect();
    this.track.scrollBy({ left: rtl ? box.right - track.right : box.left - track.left, behavior: "instant" });
    this.refresh();
  }
  refresh() {
    const index = this.index, total = this.slides.length;
    this.querySelectorAll("[data-carousel-previous]").forEach((button) => {
      button.disabled = index <= 0;
    });
    this.querySelectorAll("[data-carousel-next]").forEach((button) => {
      button.disabled = index < 0 || index >= total - 1;
    });
    const status = this.querySelector("[data-carousel-status]");
    if (status)
      status.textContent = total ? `${index + 1} of ${total}` : "No slides";
    emit(this, "oatbase:change", { index, total });
  }
  #schedule() {
    if (!this.#frame)
      this.#frame = requestAnimationFrame(() => {
        this.#frame = 0;
        this.refresh();
      });
  }
  #cleanup() {
    this.#abort?.abort();
    this.#observer?.disconnect();
    this.#resize?.disconnect();
    if (this.#frame)
      cancelAnimationFrame(this.#frame);
    this.#frame = 0;
  }
  disconnectedCallback() {
    this.#ready?.abort();
    this.#cleanup();
    this.removeAttribute("data-enhanced");
  }
}
define("ot-carousel", OtCarousel);
export {
  OtCarousel
};
