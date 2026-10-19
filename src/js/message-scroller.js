import { connectWhenReady, define, emit } from './base.js';

// Follow new content only while the reader is at the end. Rendering and streaming
// remain application-owned; this component never moves focus or inserts HTML.
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
    this.viewport = this.querySelector(':scope > [data-message-viewport]');
    this.content = this.viewport?.querySelector('[data-message-content]');
    if (!this.viewport || !this.content) return;
    this.#abort = new AbortController();
    const signal = this.#abort.signal;
    this.jump = this.querySelector(':scope > [data-message-jump]');
    this.#following = true;
    this.viewport.addEventListener('scroll', () => {
      // A resize or newly appended message can dispatch scroll before our frame.
      // Explicit reader intent is captured separately below.
      if (this.#following && this.#frame) return;
      this.#setFollowing(this.#atEnd());
    }, { signal, passive: true });
    this.viewport.addEventListener('wheel', event => {
      if (event.deltaY < 0) this.#setFollowing(false);
    }, { signal, passive: true });
    this.viewport.addEventListener('touchstart', () => this.#setFollowing(false), { signal, passive: true });
    this.viewport.addEventListener('keydown', event => {
      if (event.target === this.viewport && ['ArrowUp', 'PageUp', 'Home'].includes(event.key)) this.#setFollowing(false);
    }, { signal });
    this.jump?.addEventListener('click', () => this.scrollToEnd(), { signal });
    this.#mutation = new MutationObserver(() => this.refresh());
    this.#mutation.observe(this.content, { childList: true, subtree: true, characterData: true });
    this.#resize = new ResizeObserver(() => this.refresh());
    this.#resize.observe(this.content);
    this.#resize.observe(this.viewport);
    this.dataset.enhanced = '';
    this.scrollToEnd();
  }

  disconnectedCallback() {
    this.#readyAbort?.abort();
    this.#cleanup();
    this.removeAttribute('data-enhanced');
  }

  #cleanup() {
    this.#abort?.abort();
    this.#mutation?.disconnect();
    this.#resize?.disconnect();
    if (this.#frame) cancelAnimationFrame(this.#frame);
    this.#frame = 0;
  }

  get following() { return this.#following; }

  #atEnd() {
    return this.viewport.scrollHeight - this.viewport.scrollTop - this.viewport.clientHeight <= 2;
  }

  #setFollowing(following) {
    const changed = this.#following !== following;
    this.#following = following;
    this.toggleAttribute('data-at-end', following);
    if (this.jump) this.jump.hidden = following;
    if (changed) emit(this, 'oatbase:follow', { following });
  }

  scrollToEnd() {
    if (!this.viewport) return;
    this.#setFollowing(true);
    this.viewport.scrollTo({ top: this.viewport.scrollHeight, behavior: 'instant' });
  }

  refresh() {
    if (!this.viewport || !this.isConnected || this.#frame) return;
    this.#frame = requestAnimationFrame(() => {
      this.#frame = 0;
      if (this.#following) this.scrollToEnd();
      else this.#setFollowing(this.#atEnd());
    });
  }
}

define('ot-message-scroller', OtMessageScroller);
export { OtMessageScroller };
