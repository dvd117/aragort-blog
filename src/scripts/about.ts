/**
 * Sobre mí: each paragraph is a station on the thread, drawn the way the landing draws
 * its track (DESIGN.md, "Landing"): a track in the net colour, filled in --fg down to the
 * reading line (65% of the viewport, or of the panel) and held at the furthest point
 * reached. Passing a station pulses it once and turns its ring to the band it hangs in --
 * amarillo, azul, then rojo, so the story still reads through the flag once. The contacts
 * are the terminal: reaching them lights the bar under that station. The page bottom
 * counts as reaching it. The portrait net lights its path to where the thread begins.
 * Under reduced motion everything is lit from the start, with no pulse.
 */
import { reduced } from './motion';

const LINE = 0.65;

export function initAbout(root: ParentNode = document): void {
  const thread = root.querySelector<HTMLElement>('[data-about-thread]');
  const items = [...root.querySelectorAll<HTMLElement>('.about-node-item')];
  const portrait = root.querySelector<HTMLElement>('.portrait-net');
  if (!thread || items.length === 0) return;

  // Portrait: light the path from the net's lit node to the exit node.
  const path = (portrait?.dataset.path ?? '').split(',').filter(Boolean).map(Number);
  const svg = portrait?.querySelector('svg');
  if (svg) {
    const circles = [...svg.querySelectorAll<SVGCircleElement>('circle')];
    const lines = [...svg.querySelectorAll<SVGLineElement>('line')];
    path.forEach((n, i) => {
      circles[n]?.classList.add('path');
      const prev = path[i - 1];
      if (prev === undefined) return;
      lines.find((l) => {
        const a = Number(l.dataset.a), b = Number(l.dataset.b);
        return (a === prev && b === n) || (a === n && b === prev);
      })?.classList.add('path');
    });
  }

  // In the panel the drawer body scrolls; on the page, the window does.
  const scroller = root instanceof Element ? root.querySelector<HTMLElement>('.drawer-body') : null;

  // Station centres from the top of the thread, and which third of it each hangs in.
  // Measured, not counted: the paragraphs are different lengths and the reader's own
  // type size moves them.
  let ys: number[] = [];
  const measure = () => {
    const t = thread.getBoundingClientRect();
    if (!t.height) return false;
    ys = items.map((item) => {
      const n = item.querySelector<HTMLElement>('.about-node')!.getBoundingClientRect();
      return n.top + n.height / 2 - t.top;
    });
    items.forEach((item, i) => { item.dataset.band = String(Math.min(2, Math.max(0, Math.floor((ys[i]! / t.height) * 3)))); });
    thread.style.setProperty('--end', `${Math.round(ys.at(-1)!)}px`);
    return true;
  };

  const calm = reduced();
  let reach = 0;
  const passed = new Set<HTMLElement>();
  const pulse = (el: Element | null) => {
    if (!el || calm) return;
    el.classList.remove('pulse');
    void el.getBoundingClientRect(); // restart it
    el.classList.add('pulse');
    el.addEventListener('animationend', () => el.classList.remove('pulse'), { once: true });
  };

  const tick = () => {
    const end = ys.at(-1);
    if (end === undefined) return;
    let line: number, bottom: boolean;
    if (scroller) {
      const s = scroller.getBoundingClientRect();
      line = s.top + s.height * LINE;
      bottom = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 1;
    } else {
      line = innerHeight * LINE;
      bottom = scrollY + innerHeight >= document.documentElement.scrollHeight - 1;
    }
    const y = calm || bottom ? end : Math.min(Math.max(line - thread.getBoundingClientRect().top, ys[0]!), end);
    if (y > reach) reach = y;
    thread.style.setProperty('--lit', `${Math.round(reach)}px`);
    items.forEach((item, i) => {
      if (ys[i]! > reach + 0.5 || passed.has(item)) return;
      passed.add(item);
      item.classList.add('is-lit');
      pulse(item.querySelector('.about-node'));
    });
    thread.classList.toggle('is-ended', passed.has(items.at(-1)!));
  };

  // Layout resets reach to the furthest station already passed, so a resize never
  // unlights anything, then the reading line takes it from there.
  const relayout = () => {
    if (!measure()) return;
    reach = Math.max(0, ...items.map((item, i) => (passed.has(item) ? ys[i]! : 0)));
    tick();
  };

  let queued = false;
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; tick(); });
  };
  (scroller ?? window).addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', relayout);
  document.fonts?.ready.then(relayout);
  relayout();
}
