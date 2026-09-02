import { define } from './base.js';

class OtReadingProgress extends HTMLElement {
  #abort;
  #frame;

  connectedCallback() {
    this.#abort?.abort();
    this.#abort = new AbortController();
    this.refresh();
  }

  disconnectedCallback() {
    this.#abort?.abort();
    cancelAnimationFrame(this.#frame);
  }

  refresh() {
    this.#abort?.abort();
    this.#abort = new AbortController();
    this.progress = this.querySelector('progress');
    this.target = this.#query(this.dataset.target);
    this.root = this.#query(this.dataset.scrollRoot);
    if (!this.progress || !this.target) return;
    this.progress.max = 100;
    const options = { passive: true, signal: this.#abort.signal };
    (this.root || window).addEventListener('scroll', () => this.#schedule(), options);
    window.addEventListener('resize', () => this.#schedule(), options);
    this.toggleAttribute('data-enhanced', true);
    this.#update();
  }

  #query(selector) {
    if (!selector) return null;
    try { return document.querySelector(selector); } catch { return null; }
  }

  #schedule() {
    cancelAnimationFrame(this.#frame);
    this.#frame = requestAnimationFrame(() => this.#update());
  }

  #update() {
    const rootRect = this.root?.getBoundingClientRect();
    const targetRect = this.target.getBoundingClientRect();
    const scroll = this.root?.scrollTop || window.scrollY;
    const viewport = this.root?.clientHeight || window.innerHeight;
    const targetStart = scroll + targetRect.top - (rootRect?.top || 0);
    const distance = Math.max(1, this.target.scrollHeight - viewport);
    const value = Math.min(100, Math.max(0, ((scroll - targetStart) / distance) * 100));
    this.progress.value = value;
  }
}

define('ot-reading-progress', OtReadingProgress);
export { OtReadingProgress };
