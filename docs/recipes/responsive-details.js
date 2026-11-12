/** Opt-in recipe: initialize one native disclosure; call cleanup when unmounting. */
export function responsiveDetails(details, query = '(min-width: 48rem)') {
  const summary = details.querySelector(':scope > summary');
  if (!summary || typeof matchMedia !== 'function') return () => {};
  const media = matchMedia(query);
  const sync = () => {
    // Move focus before hiding a focused descendant. Keep summary operable.
    if (!media.matches && details.contains(document.activeElement)) summary.focus();
    details.open = media.matches;
  };
  sync();
  media.addEventListener('change', sync);
  return () => media.removeEventListener('change', sync);
}
