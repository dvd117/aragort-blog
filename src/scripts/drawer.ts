/**
 * The header's "Sobre mí" opens the panel instead of leaving the page. The link keeps its
 * href, so without JS, on middle-click and on "open in new tab" it still goes to
 * /sobre-mi/. The URL never changes: the panel is a view of this page, not a place.
 *
 * Escape, the focus trap and the backdrop are <dialog>'s own. Back closes it as well,
 * because a history entry is pushed while it is open -- without it, the first Back on a
 * post would leave the page with the panel still in mind.
 */
import { initAbout } from './about';
import { reduced } from './motion';

const CLOSING = 'is-closing';

export function initDrawer(): void {
  const drawer = document.querySelector<HTMLDialogElement>('#sobre-mi');
  const link = document.querySelector<HTMLAnchorElement>('[data-drawer-open]');
  if (!drawer || !link || typeof drawer.showModal !== 'function') return;

  let threaded = false;
  let pushed = false;

  const open = () => {
    if (drawer.open) return;
    drawer.showModal();
    link.setAttribute('aria-expanded', 'true');
    // The thread only starts once the panel is on screen; an observer on a closed dialog
    // never fires.
    if (!threaded) { threaded = true; initAbout(drawer); }
    history.pushState({ drawer: true }, '');
    pushed = true;
  };

  const close = (fromPop = false) => {
    if (!drawer.open) return;
    link.setAttribute('aria-expanded', 'false');
    if (pushed && !fromPop) { pushed = false; history.back(); return; }
    pushed = false;
    if (reduced()) { drawer.close(); return; }
    drawer.classList.add(CLOSING);
    // The timer is the one that has to be right: animationend can be missed, and a panel
    // that will not close is worse than one that closes a frame early.
    const done = () => {
      clearTimeout(timer);
      drawer.classList.remove(CLOSING);
      if (drawer.open) drawer.close();
    };
    const timer = window.setTimeout(done, 260);
    drawer.addEventListener('animationend', (e) => { if (e.target === drawer) done(); }, { once: true });
  };

  link.setAttribute('aria-expanded', 'false');
  link.setAttribute('aria-controls', 'sobre-mi');
  link.addEventListener('click', (e) => {
    // Leave the modified clicks alone: they are asking for the page, not the panel.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    open();
  });

  drawer.querySelector('[data-drawer-close]')?.addEventListener('click', () => close());
  // Clicking the page behind the panel closes it. A <dialog> stretches under its own
  // backdrop, so a click out there lands on the dialog element itself and never on
  // anything inside it -- but a press that *starts* inside and ends on the backdrop (a
  // drag, a text selection that runs off the edge) would land there too, so the press has
  // to have started outside as well.
  let fromOutside = false;
  drawer.addEventListener('pointerdown', (e) => { fromOutside = e.target === drawer; });
  drawer.addEventListener('click', (e) => { if (e.target === drawer && fromOutside) close(); });
  // Escape goes through <dialog>'s own cancel, which would skip the animation and leave
  // the pushed history entry behind.
  drawer.addEventListener('cancel', (e) => { e.preventDefault(); close(); });
  addEventListener('popstate', () => close(true));
}
