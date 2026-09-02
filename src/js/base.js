let id = 0;

export const uid = (prefix = 'oatbase') => `${prefix}-${++id}`;

export function define(name, constructor) {
  if (!customElements.get(name)) customElements.define(name, constructor);
}

export function connectWhenReady(element, connect) {
  if (document.readyState !== 'loading') {
    connect();
    return undefined;
  }

  const controller = new AbortController();
  document.addEventListener('DOMContentLoaded', () => {
    if (element.isConnected) connect();
  }, { once: true, signal: controller.signal });
  return controller;
}

export function setActive(items, index) {
  items.forEach((item, current) => item.toggleAttribute('data-active', current === index));
  const active = items[index];
  active?.scrollIntoView({ block: 'nearest' });
  return active;
}

export function nextIndex(key, current, length) {
  if (!length) return -1;
  if (key === 'ArrowDown') return (current + 1 + length) % length;
  if (key === 'ArrowUp') return (current - 1 + length) % length;
  if (key === 'Home') return 0;
  if (key === 'End') return length - 1;
  return current;
}

export function emit(element, name, detail) {
  element.dispatchEvent(new CustomEvent(name, {
    bubbles: true,
    composed: true,
    detail
  }));
}
