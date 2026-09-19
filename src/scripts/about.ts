/**
 * Sobre mí: each paragraph is a node on the thread and lights, in its hue, as it
 * comes into view; the thread's lit line grows to the last lit node. The portrait
 * net lights its path to where the thread begins. Under reduced motion everything
 * is lit from the start, with no transition.
 */
import { reduced } from './motion';

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

  const grow = () => {
    const lit = items.filter((i) => i.classList.contains('is-lit'));
    const last = lit.at(-1)?.querySelector<HTMLElement>('.about-node');
    if (!last) { thread.style.setProperty('--lit', '0px'); return; }
    const t = thread.getBoundingClientRect();
    const n = last.getBoundingClientRect();
    thread.style.setProperty('--lit', `${Math.round(n.top + n.height / 2 - t.top)}px`);
  };

  if (reduced() || !('IntersectionObserver' in window)) {
    items.forEach((i) => i.classList.add('is-lit'));
    grow();
    addEventListener('resize', grow);
    return;
  }

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-lit'); io.unobserve(e.target); }
    grow();
  }, { root: root instanceof Element ? root.querySelector('.drawer-body') : null, rootMargin: '0px 0px -30% 0px' });
  items.forEach((i) => io.observe(i));
  addEventListener('resize', grow);
}
