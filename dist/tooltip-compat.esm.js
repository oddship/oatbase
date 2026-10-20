// src/js/tooltip-compat.js
var selector = ".ot-tooltip";
var gutter = 16;
var active;
var trigger;
var closeTimer;
var frame;
function position(tip, target) {
  if (!tip.matches(":popover-open") || !target?.isConnected)
    return;
  const rect = target.getBoundingClientRect();
  for (const key of ["left", "top", "width", "height"])
    tip.style[key] = `${rect[key]}px`;
  const style = getComputedStyle(tip, "::after");
  const width = parseFloat(style.width);
  const height = parseFloat(style.height);
  const space = { top: rect.top, bottom: innerHeight - rect.bottom, left: rect.left, right: innerWidth - rect.right };
  const opposite = { top: "bottom", bottom: "top", left: "right", right: "left" };
  let placement = target.dataset.tooltipPlacement || "top";
  if (!(placement in opposite))
    placement = "top";
  const needed = (placement === "left" || placement === "right" ? width : height) + 10 + gutter;
  if (space[placement] < needed && space[opposite[placement]] > space[placement])
    placement = opposite[placement];
  if ((placement === "left" || placement === "right") && space[placement] < needed)
    placement = space.bottom > space.top ? "bottom" : "top";
  tip.dataset.tooltipPlacement = placement;
  const horizontal = placement === "top" || placement === "bottom";
  const start = horizontal ? rect.left + rect.width / 2 - width / 2 : rect.top + rect.height / 2 - height / 2;
  const size = horizontal ? width : height;
  const viewport = horizontal ? innerWidth : innerHeight;
  const shift = Math.max(gutter, Math.min(start, viewport - gutter - size)) - start;
  tip.style.setProperty("--oatbase-tooltip-shift-x", `${horizontal ? shift : 0}px`);
  tip.style.setProperty("--oatbase-tooltip-shift-y", `${horizontal ? 0 : shift}px`);
}
function cancelClose() {
  clearTimeout(closeTimer);
}
function deferClose(tip, target) {
  cancelClose();
  closeTimer = setTimeout(() => {
    if (tip.matches(":hover") || target.matches(":hover, :focus-visible"))
      return;
    if (tip.matches(":popover-open"))
      tip.hidePopover();
  }, 150);
}
function preserve(tip, target) {
  if (!target.isConnected || tip.previousElementSibling !== target)
    return;
  if (!tip.matches(":popover-open"))
    tip.showPopover();
  position(tip, target);
}
document.addEventListener("toggle", (event) => {
  if (!event.target.matches?.(selector))
    return;
  cancelAnimationFrame(frame);
  if (event.newState !== "open") {
    cancelClose();
    active = trigger = null;
    return;
  }
  if (active !== event.target || trigger !== event.target.previousElementSibling)
    cancelClose();
  active = event.target;
  trigger = active.previousElementSibling;
  const tip = active, target = trigger;
  frame = requestAnimationFrame(() => position(tip, target));
}, true);
for (const type of ["mouseover", "mouseout"])
  window.addEventListener(type, (event) => {
    if (!active)
      return;
    const onTip = event.target.closest?.(selector) === active;
    const fromTrigger = trigger?.contains(event.target);
    if (!onTip && !fromTrigger)
      return;
    if (type === "mouseover")
      cancelClose();
    else
      deferClose(active, trigger);
    preserve(active, trigger);
  });
