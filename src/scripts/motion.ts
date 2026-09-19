/** Less motion when the OS asks for it or the reader turned it off in Ajustes. */
export const reduced = (): boolean =>
  document.documentElement.getAttribute('data-motion') === 'reduce' ||
  matchMedia('(prefers-reduced-motion: reduce)').matches;
