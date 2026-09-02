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
export {
  OtSplitter
};
