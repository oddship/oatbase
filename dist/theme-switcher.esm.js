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

// src/js/theme-switcher.js
class OtThemeSwitcher extends HTMLElement {
  #abort;
  #theme = "system";
  connectedCallback() {
    this.#abort?.abort();
    this.#abort = new AbortController;
    const signal = this.#abort.signal;
    this.key = this.dataset.storageKey || "oatbase-theme";
    let initial = this.dataset.default || "system";
    try {
      initial = localStorage.getItem(this.key) || initial;
    } catch {}
    this.#theme = ["system", "light", "dark"].includes(initial) ? initial : "system";
    this.buttons = [...this.querySelectorAll("[data-theme-value]")];
    this.toggleButton = this.buttons.length ? null : this.querySelector("button");
    this.toggleContents = this.toggleButton ? [...this.toggleButton.querySelectorAll("[data-theme-content]")] : [];
    this.toggleLabel = this.toggleButton?.querySelector("[data-theme-label]");
    this.toggleAttribute("data-group", this.buttons.length > 1);
    this.buttons.forEach((button) => button.addEventListener("click", () => this.value = button.dataset.themeValue, { signal }));
    this.toggleButton?.addEventListener("click", () => {
      const values = ["system", "light", "dark"];
      this.value = values[(values.indexOf(this.#theme) + 1) % values.length];
    }, { signal });
    this.#apply(false);
  }
  disconnectedCallback() {
    this.#abort?.abort();
  }
  get value() {
    return this.#theme;
  }
  set value(value) {
    if (!["system", "light", "dark"].includes(value))
      return;
    this.#theme = value;
    this.#apply(true);
  }
  #target() {
    if (!this.dataset.target)
      return this.ownerDocument.documentElement;
    try {
      return this.ownerDocument.querySelector(this.dataset.target);
    } catch {
      return null;
    }
  }
  #apply(notify) {
    const target = this.#target();
    if (target) {
      target.style.colorScheme = this.#theme === "system" ? "light dark" : this.#theme;
      if (this.#theme === "system")
        target.removeAttribute("data-theme");
      else
        target.dataset.theme = this.#theme;
    }
    try {
      localStorage.setItem(this.key, this.#theme);
    } catch {}
    this.buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.themeValue === this.#theme)));
    if (this.toggleButton) {
      const label = this.#theme === "light" ? "Light" : this.#theme === "dark" ? "Dark" : "System";
      if (this.toggleContents.length) {
        this.toggleContents.forEach((content) => {
          content.hidden = content.dataset.themeContent !== this.#theme;
        });
        if (this.toggleLabel)
          this.toggleLabel.textContent = label;
      } else {
        this.toggleButton.textContent = label;
      }
      this.toggleButton.dataset.theme = this.#theme;
      this.toggleButton.setAttribute("aria-label", `Theme: ${this.#theme}. Click to change.`);
    }
    if (notify)
      emit(this, "change", { value: this.#theme });
  }
}
define("ot-theme-switcher", OtThemeSwitcher);
export {
  OtThemeSwitcher
};
