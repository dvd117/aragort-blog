/** Run `fn` once the page is really shown: now, or when a prerendered page is activated. */
export function whenActive(fn: () => void): void {
  if ((document as Document & { prerendering?: boolean }).prerendering) {
    document.addEventListener('prerenderingchange', fn, { once: true });
  } else fn();
}
