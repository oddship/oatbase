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
export {
  OtOtp
};
