const selector = '[data-tooltip]';
const gutter = 16;

function tooltipTarget(event) {
  return event.target instanceof Element ? event.target.closest(selector) : null;
}

function prepareTooltip(element) {
  if (!element?.dataset.tooltip) return;
  element.removeAttribute('data-tooltip-dismissed');

  const original = element.dataset.oatbaseTooltipPlacement
    || element.dataset.tooltipPlacement
    || 'top';
  element.dataset.oatbaseTooltipPlacement = original;

  const rect = element.getBoundingClientRect();
  const availableWidth = Math.max(0, window.innerWidth - gutter * 2);
  const estimatedWidth = Math.min(320, availableWidth, Math.max(48, element.dataset.tooltip.length * 7 + 24));
  let placement = original;

  if (placement === 'left' && rect.left < estimatedWidth + gutter) placement = 'right';
  if (placement === 'right' && window.innerWidth - rect.right < estimatedWidth + gutter) placement = 'left';
  if (placement === 'top' && rect.top < 48) placement = 'bottom';
  if (placement === 'bottom' && window.innerHeight - rect.bottom < 48) placement = 'top';
  element.dataset.tooltipPlacement = placement;

  if (placement === 'top' || placement === 'bottom') {
    const center = rect.left + rect.width / 2;
    const left = center - estimatedWidth / 2;
    const right = center + estimatedWidth / 2;
    const shift = left < gutter
      ? gutter - left
      : right > window.innerWidth - gutter
        ? window.innerWidth - gutter - right
        : 0;
    element.style.setProperty('--oatbase-tooltip-shift', `${Math.round(shift)}px`);
  } else {
    element.style.removeProperty('--oatbase-tooltip-shift');
  }
}

function resetTooltip(element) {
  if (!element) return;
  element.removeAttribute('data-tooltip-dismissed');
  if (element.dataset.oatbaseTooltipPlacement) {
    element.dataset.tooltipPlacement = element.dataset.oatbaseTooltipPlacement;
  }
  element.style.removeProperty('--oatbase-tooltip-shift');
}

document.addEventListener('pointerenter', event => prepareTooltip(tooltipTarget(event)), true);
document.addEventListener('focusin', event => prepareTooltip(tooltipTarget(event)), true);
document.addEventListener('pointerleave', event => resetTooltip(tooltipTarget(event)), true);
document.addEventListener('focusout', event => resetTooltip(tooltipTarget(event)), true);
document.addEventListener('keydown', event => {
  if (event.key !== 'Escape') return;
  document.querySelectorAll(selector).forEach(element => {
    if (element.matches(':hover') || element === document.activeElement || element.contains(document.activeElement)) {
      element.setAttribute('data-tooltip-dismissed', '');
    }
  });
}, true);
