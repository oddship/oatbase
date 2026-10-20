// Enhance Oat 1.x's shared native popover without creating a second tooltip.
const selector = '.ot-tooltip';
const gutter = 16;
let active, trigger, closeTimer, frame;
let releasing = false;

function position(tip, target) {
  if (!tip.matches(':popover-open') || !target?.isConnected) return;
  const rect = target.getBoundingClientRect();
  const style = getComputedStyle(tip, '::after');
  const width = parseFloat(style.width);
  const height = parseFloat(style.height);
  const space = { top: rect.top, bottom: innerHeight - rect.bottom, left: rect.left, right: innerWidth - rect.right };
  const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
  let placement = target.dataset.tooltipPlacement || 'top';
  if (!(placement in opposite)) placement = 'top';
  const needed = (placement === 'left' || placement === 'right' ? width : height) + 10 + gutter;
  if (space[placement] < needed && space[opposite[placement]] > space[placement]) placement = opposite[placement];
  if ((placement === 'left' || placement === 'right') && space[placement] < needed) placement = space.bottom > space.top ? 'bottom' : 'top';
  tip.dataset.tooltipPlacement = placement;
  const horizontal = placement === 'top' || placement === 'bottom';
  const start = horizontal ? rect.left + rect.width / 2 - width / 2 : rect.top + rect.height / 2 - height / 2;
  const size = horizontal ? width : height;
  const viewport = horizontal ? innerWidth : innerHeight;
  const shift = Math.max(gutter, Math.min(start, viewport - gutter - size)) - start;
  tip.style.setProperty('--oatbase-tooltip-shift-x', `${horizontal ? shift : 0}px`);
  tip.style.setProperty('--oatbase-tooltip-shift-y', `${horizontal ? 0 : shift}px`);
}

function cancelClose() { clearTimeout(closeTimer); }
function deferClose() {
  cancelClose();
  const target = trigger;
  closeTimer = setTimeout(() => {
    if (active?.matches(':hover') || target?.matches(':hover, :focus-visible')) return;
    // Let Oat clear its own active-trigger state as well as the popover.
    releasing = true;
    try { target?.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, relatedTarget: document.body })); }
    finally { releasing = false; }
  }, 150);
}

document.addEventListener('toggle', event => {
  if (!event.target.matches?.(selector)) return;
  cancelClose(); cancelAnimationFrame(frame);
  if (event.newState !== 'open') { active = trigger = null; return; }
  active = event.target;
  trigger = active.previousElementSibling;
  const tip = active, target = trigger;
  frame = requestAnimationFrame(() => position(tip, target));
}, true);

for (const type of ['mouseover', 'mouseout']) document.addEventListener(type, event => {
  if (releasing || !active?.matches(':popover-open')) return;
  const onTip = event.target.closest?.(selector) === active;
  const fromTrigger = trigger?.contains(event.target);
  if (onTip || (type === 'mouseout' && fromTrigger)) {
    // Keep Oat from treating its own generated tooltip as another trigger.
    event.stopImmediatePropagation();
    if (type === 'mouseover') cancelClose();
    else deferClose();
  } else if (type === 'mouseover' && fromTrigger) cancelClose();
}, true);
