(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  function __accessProp(key) {
    return this[key];
  }
  var __toCommonJS = (from) => {
    var entry = (__moduleCache ??= new WeakMap).get(from), desc;
    if (entry)
      return entry;
    entry = __defProp({}, "__esModule", { value: true });
    if (from && typeof from === "object" || typeof from === "function") {
      for (var key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(entry, key))
          __defProp(entry, key, {
            get: __accessProp.bind(from, key),
            enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
          });
    }
    __moduleCache.set(from, entry);
    return entry;
  };
  var __moduleCache;
  var __returnValue = (v) => v;
  function __exportSetter(name, newValue) {
    this[name] = __returnValue.bind(null, newValue);
  }
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, {
        get: all[name],
        enumerable: true,
        configurable: true,
        set: __exportSetter.bind(all, name)
      });
  };

  // src/js/message-scroller.js
  var exports_message_scroller = {};
  __export(exports_message_scroller, {
    OtMessageScroller: () => OtMessageScroller
  });

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

  // src/js/message-scroller.js
  class OtMessageScroller extends HTMLElement {
    #abort;
    #readyAbort;
    #mutation;
    #resize;
    #frame;
    #following = true;
    connectedCallback() {
      this.#readyAbort?.abort();
      this.#readyAbort = connectWhenReady(this, () => this.#connect());
    }
    #connect() {
      this.#cleanup();
      this.viewport = this.querySelector(":scope > [data-message-viewport]");
      this.content = this.viewport?.querySelector("[data-message-content]");
      if (!this.viewport || !this.content)
        return;
      this.#abort = new AbortController;
      const signal = this.#abort.signal;
      this.jump = this.querySelector(":scope > [data-message-jump]");
      this.#following = true;
      this.viewport.addEventListener("scroll", () => {
        if (this.#following && this.#frame)
          return;
        this.#setFollowing(this.#atEnd());
      }, { signal, passive: true });
      this.viewport.addEventListener("wheel", (event) => {
        if (event.deltaY < 0)
          this.#setFollowing(false);
      }, { signal, passive: true });
      this.viewport.addEventListener("touchstart", () => this.#setFollowing(false), { signal, passive: true });
      this.viewport.addEventListener("keydown", (event) => {
        if (event.target === this.viewport && ["ArrowUp", "PageUp", "Home"].includes(event.key))
          this.#setFollowing(false);
      }, { signal });
      this.jump?.addEventListener("click", () => this.scrollToEnd(), { signal });
      this.#mutation = new MutationObserver(() => this.refresh());
      this.#mutation.observe(this.content, { childList: true, subtree: true, characterData: true });
      this.#resize = new ResizeObserver(() => this.refresh());
      this.#resize.observe(this.content);
      this.#resize.observe(this.viewport);
      this.dataset.enhanced = "";
      this.scrollToEnd();
    }
    disconnectedCallback() {
      this.#readyAbort?.abort();
      this.#cleanup();
      this.removeAttribute("data-enhanced");
    }
    #cleanup() {
      this.#abort?.abort();
      this.#mutation?.disconnect();
      this.#resize?.disconnect();
      if (this.#frame)
        cancelAnimationFrame(this.#frame);
      this.#frame = 0;
    }
    get following() {
      return this.#following;
    }
    #atEnd() {
      return this.viewport.scrollHeight - this.viewport.scrollTop - this.viewport.clientHeight <= 2;
    }
    #setFollowing(following) {
      const changed = this.#following !== following;
      this.#following = following;
      this.toggleAttribute("data-at-end", following);
      if (this.jump)
        this.jump.hidden = following;
      if (changed)
        emit(this, "oatbase:follow", { following });
    }
    scrollToEnd() {
      if (!this.viewport)
        return;
      this.#setFollowing(true);
      this.viewport.scrollTo({ top: this.viewport.scrollHeight, behavior: "instant" });
    }
    refresh() {
      if (!this.viewport || !this.isConnected || this.#frame)
        return;
      this.#frame = requestAnimationFrame(() => {
        this.#frame = 0;
        if (this.#following)
          this.scrollToEnd();
        else
          this.#setFollowing(this.#atEnd());
      });
    }
  }
  define("ot-message-scroller", OtMessageScroller);
})();
