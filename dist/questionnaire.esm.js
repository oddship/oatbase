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

// src/js/questionnaire.js
class OtQuestionnaire extends HTMLElement {
  #ready;
  #abort;
  #index = 0;
  #noValidate;
  connectedCallback() {
    this.#ready?.abort();
    this.#ready = connectWhenReady(this, () => this.#connect());
  }
  #connect() {
    this.#abort?.abort();
    this.form = this.querySelector(":scope > form");
    if (!this.form)
      return;
    this.#abort = new AbortController;
    const signal = this.#abort.signal;
    this.#noValidate = this.form.noValidate;
    this.form.noValidate = true;
    this.addEventListener("click", (event) => {
      if (event.target.closest("[data-question-next]"))
        this.next();
      if (event.target.closest("[data-question-previous]"))
        this.previous();
      if (event.target.closest("[data-question-skip]") && this.items[this.index]?.hasAttribute("data-optional"))
        this.#show(this.index + 1);
    }, { signal });
    this.form.addEventListener("submit", (event) => {
      if (this.index < this.items.length - 1) {
        event.preventDefault();
        this.next();
        return;
      }
      const invalid = this.items.findIndex((item) => !this.#valid(item));
      if (invalid >= 0) {
        event.preventDefault();
        this.#show(invalid);
        this.#report(this.items[invalid]);
        return;
      }
      const submitted = new CustomEvent("oatbase:submit", { bubbles: true, composed: true, cancelable: true, detail: { data: new FormData(this.form) } });
      if (!this.dispatchEvent(submitted))
        event.preventDefault();
    }, { signal });
    this.form.addEventListener("reset", () => queueMicrotask(() => {
      if (this.isConnected)
        this.#show(0, false);
    }), { signal });
    this.dataset.enhanced = "";
    this.#show(0, false);
  }
  get items() {
    return [...this.form?.querySelectorAll("[data-question]") || []];
  }
  get index() {
    return this.#index;
  }
  next() {
    const item = this.items[this.index];
    if (!item)
      return;
    if (!this.#valid(item)) {
      this.#report(item);
      return;
    }
    this.#show(this.index + 1);
  }
  previous() {
    this.#show(this.index - 1);
  }
  #valid(item) {
    return [...item.querySelectorAll("input, textarea, select")].every((input) => !input.willValidate || input.checkValidity());
  }
  #report(item) {
    [...item.querySelectorAll("input, textarea, select")].find((input) => input.willValidate && !input.validity.valid)?.reportValidity();
  }
  #show(index, focus = true) {
    this.#index = Math.max(0, Math.min(index, this.items.length - 1));
    this.items.forEach((item, current) => {
      item.hidden = current !== this.index;
    });
    this.querySelectorAll("[data-question-actions]").forEach((element) => {
      element.hidden = false;
    });
    this.querySelectorAll("[data-question-previous]").forEach((button) => {
      button.disabled = this.index <= 0;
    });
    this.querySelectorAll("[data-question-next]").forEach((button) => {
      button.hidden = this.index === this.items.length - 1;
    });
    this.querySelectorAll("[data-question-skip]").forEach((button) => {
      button.hidden = !this.items[this.index]?.hasAttribute("data-optional") || this.index === this.items.length - 1;
    });
    this.querySelectorAll("[data-question-submit]").forEach((button) => {
      button.hidden = this.index !== this.items.length - 1;
    });
    const output = this.querySelector("[data-question-progress]");
    if (output)
      output.textContent = `Question ${this.index + 1} of ${this.items.length}`;
    if (focus)
      this.items[this.index]?.querySelector("input:not(:disabled), textarea:not(:disabled), select:not(:disabled)")?.focus();
    emit(this, "oatbase:step", { index: this.index, total: this.items.length });
  }
  disconnectedCallback() {
    this.#ready?.abort();
    this.#abort?.abort();
    if (this.form)
      this.form.noValidate = this.#noValidate;
    this.items.forEach((item) => {
      item.hidden = false;
    });
    this.querySelectorAll("[data-question-actions]").forEach((element) => {
      element.hidden = true;
    });
    this.querySelectorAll("[data-question-submit]").forEach((button) => {
      button.hidden = false;
    });
    this.removeAttribute("data-enhanced");
  }
}
define("ot-questionnaire", OtQuestionnaire);
export {
  OtQuestionnaire
};
