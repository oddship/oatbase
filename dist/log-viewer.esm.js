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

// src/js/log-viewer.js
class OtLogViewer extends HTMLElement {
  #abort;
  #observer;
  #frame;
  connectedCallback() {
    this.#abort?.abort();
    this.#observer?.disconnect();
    this.#abort = new AbortController;
    const signal = this.#abort.signal;
    this.log = this.querySelector(':scope > [role="log"], :scope > .scroll-area[role="log"]');
    if (!this.log)
      return;
    this.content = this.log.querySelector("[data-log-content]") || this.log;
    this.follow = this.querySelector("[data-log-follow]");
    this.status = this.querySelector("[data-log-status]");
    this.log.setAttribute("aria-relevant", this.log.getAttribute("aria-relevant") || "additions text");
    this.follow?.addEventListener("change", () => {
      this.toggleAttribute("data-following", this.follow.checked);
      if (this.follow.checked)
        this.#scrollToEnd();
      emit(this, "oatbase:follow", { following: this.follow.checked });
    }, { signal });
    this.log.addEventListener("scroll", () => this.#onScroll(), { signal, passive: true });
    this.#observer = new MutationObserver(() => this.#scheduleRefresh());
    this.#observer.observe(this.content, { childList: true, subtree: true, characterData: true });
    this.dataset.enhanced = "";
    this.refresh();
  }
  disconnectedCallback() {
    this.#abort?.abort();
    this.#observer?.disconnect();
    if (this.#frame)
      cancelAnimationFrame(this.#frame);
  }
  get lineCount() {
    const rows = this.content?.querySelectorAll?.("[data-log-line]");
    if (rows?.length)
      return rows.length;
    const value = this.content?.textContent || "";
    return value ? value.replace(/\r\n?/g, `
`).replace(/\n$/, "").split(`
`).length : 0;
  }
  append(value) {
    if (!this.content)
      return;
    if (this.content.querySelector("[data-log-line]")) {
      String(value).replace(/^\r?\n/, "").split(/\r?\n/).forEach((line) => {
        const row = document.createElement("span");
        row.dataset.logLine = "";
        row.textContent = line;
        this.content.append(row);
      });
      this.#scheduleRefresh();
      return;
    }
    this.content.append(document.createTextNode(String(value)));
    this.#scheduleRefresh();
  }
  refresh() {
    const lines = this.lineCount;
    if (this.status)
      this.status.value = `${lines} ${lines === 1 ? "line" : "lines"}`;
    const following = Boolean(this.follow?.checked);
    this.toggleAttribute("data-following", following);
    if (following)
      this.#scrollToEnd();
    emit(this, "oatbase:update", { lines, following });
  }
  #scheduleRefresh() {
    if (this.#frame)
      return;
    this.#frame = requestAnimationFrame(() => {
      this.#frame = 0;
      this.refresh();
    });
  }
  #scrollToEnd() {
    if (this.log)
      this.log.scrollTop = this.log.scrollHeight;
  }
  #onScroll() {
    if (!this.follow?.checked)
      return;
    const distance = this.log.scrollHeight - this.log.scrollTop - this.log.clientHeight;
    if (distance <= 2)
      return;
    this.follow.checked = false;
    this.toggleAttribute("data-following", false);
    emit(this, "oatbase:follow", { following: false, reason: "scroll" });
  }
}
define("ot-log-viewer", OtLogViewer);
export {
  OtLogViewer
};
