// Listeners exist only while a particular popover is open.
export function watchPosition(popup, anchor, point) {
  const abort = new AbortController();
  const position = () => {
    const box = anchor.getBoundingClientRect();
    const x = point?.x ?? box.left;
    const y = point?.y ?? box.bottom;
    popup.style.left = `${Math.max(8, Math.min(x, innerWidth - popup.offsetWidth - 8))}px`;
    popup.style.top = `${Math.max(8, Math.min(y, innerHeight - popup.offsetHeight - 8))}px`;
  };
  position();
  window.addEventListener('resize', position, { signal: abort.signal });
  window.addEventListener('scroll', position, { signal: abort.signal, capture: true, passive: true });
  const observer = new ResizeObserver(position);
  observer.observe(popup);
  return () => { abort.abort(); observer.disconnect(); };
}
