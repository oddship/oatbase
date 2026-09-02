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
    const id = this.button?.dataset.copyTarget || this.dataset.copyTarget;
    return id && document.getElementById(id) || this.querySelector("[data-copy-source]");
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
export {
  OtCopy
};
