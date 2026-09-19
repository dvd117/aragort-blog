/**
 * Motion while reading, driven by one scroll position:
 * - desktop rail: nodes light in reading order (static under reduced motion);
 * - top hairline (phone): position, always, no transition;
 * - the header mark and the compact bar's mark: the rail in miniature, in the post's hue;
 * - compact bar: appears on scroll-up with the mark, the title and "quedan N min";
 * - at the end: every net completes with one short pulse, and the end card appears.
 */
import { reduced } from './motion';

export function initReading(minutes: number): void {
  const grid = document.querySelector<HTMLElement>('.post-grid');
  const prose = document.querySelector<HTMLElement>('.post .prose');
  const bar = document.querySelector<HTMLElement>('.progress');
  const mini = document.querySelector<HTMLElement>('[data-minibar]');
  const left = document.querySelector<HTMLElement>('[data-left]');
  const card = document.querySelector<HTMLElement>('[data-done]');
  const header = document.querySelector<HTMLElement>('header.site');
  const rail = document.querySelector<SVGSVGElement>('.rail .net');
  if (!grid || !prose || !bar) return;

  const marks = [...document.querySelectorAll<SVGSVGElement>('.site .brand .net, [data-minibar] .net, .post .sig .net')];
  const railNodes = rail ? [...rail.querySelectorAll<SVGCircleElement>('circle')] : [];
  const railWires = rail ? [...rail.querySelectorAll<SVGLineElement>('line')] : [];
  const nets = [...marks, ...(rail ? [rail] : [])];

  let lastY = scrollY;
  let complete = false;
  let queued = false;
  card?.classList.add('pending');

  const lightMarks = (k: number) => {
    for (const m of marks) {
      const n = m.querySelectorAll('circle').length;
      const upTo = Math.round(k * n);
      m.querySelectorAll<SVGCircleElement>('circle').forEach((c) => c.classList.toggle('p', Number(c.dataset.o) < upTo));
      m.querySelectorAll<SVGLineElement>('line').forEach((l) => l.classList.toggle('p', Number(l.dataset.a) < upTo && Number(l.dataset.b) < upTo));
    }
  };

  const finish = () => {
    if (complete) return;
    complete = true;
    lightMarks(1);
    railNodes.forEach((c) => c.classList.add('on'));
    railWires.forEach((l) => l.classList.add('on'));
    if (!reduced()) nets.forEach((n) => { n.classList.add('pulse'); setTimeout(() => n.classList.remove('pulse'), 400); });
    card?.classList.add('show');
    if (left) left.textContent = 'terminado';
  };

  const update = () => {
    queued = false;
    const r = grid.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.65 - r.top) / r.height));
    bar.style.transform = `scaleX(${p.toFixed(4)})`;

    const end = prose.getBoundingClientRect().bottom <= innerHeight - 24;
    if (end) finish();
    if (!complete) {
      lightMarks(p);
      if (rail) {
        const still = reduced();
        rail.classList.toggle('live', !still);
        const k = still ? 0 : Math.round(p * railNodes.length);
        railNodes.forEach((c) => c.classList.toggle('on', Number(c.dataset.o) < k));
        railWires.forEach((l) => l.classList.toggle('on', Number(l.dataset.a) < k && Number(l.dataset.b) < k));
      }
      if (left) left.textContent = `quedan ${Math.max(1, Math.ceil(minutes * (1 - p)))} min`;
    }

    // Compact bar: shown while scrolling up, once the header is out of view.
    if (mini && header) {
      const below = header.getBoundingClientRect().bottom < 0;
      const up = scrollY < lastY - 4;
      const down = scrollY > lastY + 4;
      if (!below) mini.classList.remove('show');
      else if (up) mini.classList.add('show');
      else if (down) mini.classList.remove('show');
    }
    lastY = scrollY;
  };

  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  document.addEventListener('ajustes:change', update);
  card?.addEventListener('focusin', finish); // keyboard readers who jump to the end
  requestAnimationFrame(update); // first layout read after first paint, not during load
}
