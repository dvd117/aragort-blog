/**
 * Back to top: appears after about one and a half screens of scroll, bottom-right
 * (thumb reach on a phone). Smooth only when motion is allowed. Focus goes to the
 * start of the content, so keyboard readers land where they asked to go.
 */
import { reduced } from './motion';

export function initToTop(): void {
  const btn = document.querySelector<HTMLButtonElement>('[data-to-top]');
  const main = document.getElementById('contenido');
  if (!btn || !main) return;
  let queued = false;
  const update = () => {
    queued = false;
    btn.hidden = scrollY < innerHeight * 1.5;
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  btn.addEventListener('click', () => {
    scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
    main.tabIndex = -1;
    main.focus({ preventScroll: true });
  });
  update();
}
