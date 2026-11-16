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
  #labelNode;
  #status;
  connectedCallback() {
    this.#abort?.abort();
    this.#abort = new AbortController;
    this.button = this.querySelector("[data-copy-button]");
    this.source = this.#source();
    this.#labelNode = this.button?.querySelector("[data-copy-label]") || this.button;
    this.#label = this.#labelNode?.textContent?.trim() || "";
    this.#status = this.#ensureStatus();
    this.toggleAttribute("data-enhanced", Boolean(this.button && this.source));
    this.#reserveFeedbackWidth(this.dataset.copied || "Copied");
    this.button?.addEventListener("click", () => this.copy(), { signal: this.#abort.signal });
  }
  disconnectedCallback() {
    this.#abort?.abort();
    clearTimeout(this.#feedbackTimer);
    this.#restoreLabel();
    if (this.#status)
      this.#status.textContent = "";
  }
  #source() {
    const id = this.button?.dataset.copyTarget || this.dataset.copyTarget;
    return id && document.getElementById(id) || this.querySelector("[data-copy-source]");
  }
  #ensureStatus() {
    if (!this.button || !this.source)
      return;
    let status = this.querySelector("[data-copy-status]");
    if (!status) {
      status = document.createElement("span");
      status.dataset.copyStatus = "";
      this.append(status);
    }
    status.classList.add("visually-hidden");
    status.setAttribute("aria-live", "polite");
    status.setAttribute("aria-atomic", "true");
    status.textContent = "";
    return status;
  }
  get value() {
    const source = this.#source();
    return source && "value" in source ? source.value : source?.textContent?.trim() || "";
  }
  #reserveFeedbackWidth(feedback) {
    if (!this.button)
      return;
    const clone = this.button.cloneNode(true);
    const label = clone.querySelector("[data-copy-label]");
    if (label)
      label.textContent = feedback;
    else
      clone.textContent = feedback;
    clone.style.cssText = "position:fixed!important;inset:0 auto auto 0!important;inline-size:max-content!important;visibility:hidden!important;pointer-events:none!important";
    this.append(clone);
    const width = Math.ceil(Math.max(this.button.getBoundingClientRect().width, clone.getBoundingClientRect().width));
    clone.remove();
    this.button.style.minInlineSize = `${width}px`;
  }
  #restoreLabel() {
    if (this.#labelNode)
      this.#labelNode.textContent = this.#label;
  }
  async copy() {
    const value = this.value;
    if (!value)
      return;
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const active = document.activeElement;
      const area = Object.assign(document.createElement("textarea"), { value });
      area.style.cssText = "position:fixed;opacity:0";
      document.body.append(area);
      area.select();
      let copied = false;
      try {
        copied = document.execCommand("copy");
      } catch {} finally {
        area.remove();
        active?.focus({ preventScroll: true });
      }
      if (!copied) {
        const message = this.dataset.copyError || "Unable to copy. Select the text and copy it manually.";
        if (this.#status)
          this.#status.textContent = message;
        emit(this, "oatbase:copy-error", { value, message });
        return false;
      }
    }
    const feedback = this.dataset.copied || "Copied";
    this.#reserveFeedbackWidth(feedback);
    if (this.#labelNode)
      this.#labelNode.textContent = feedback;
    if (this.#status)
      this.#status.textContent = feedback;
    emit(this, "oatbase:copy", { value });
    clearTimeout(this.#feedbackTimer);
    this.#feedbackTimer = setTimeout(() => {
      this.#restoreLabel();
      if (this.#status)
        this.#status.textContent = "";
    }, 1200);
    return true;
  }
}
define("ot-copy", OtCopy);

// src/js/action-field.js
class OtActionField extends OtCopy {
}
define("ot-action-field", OtActionField);
export {
  OtActionField
};
