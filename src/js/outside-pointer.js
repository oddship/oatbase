const elements = new Set();

document.addEventListener('pointerdown', event => {
  elements.forEach(element => {
    if (!element.contains(event.target)) element.close();
  });
});

export function closeOnOutsidePointer(element, signal) {
  elements.add(element);
  signal.addEventListener('abort', () => elements.delete(element), { once: true });
}
