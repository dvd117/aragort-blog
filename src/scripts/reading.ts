/**
 * Motion while reading, driven by one scroll position:
 * - desktop rail: nodes light in reading order (static under reduced motion);
 * - the progress line along the header's bottom edge: position, always, no transition;
 * - the header mark: the rail in miniature, in the post's hue, with "quedan N min" beside it;
 * - at the end: every net completes with one short pulse, and the end card appears.
 */
import { reduced } from './motion';

export function initReading(minutes: number): void {
  const grid = document.querySelector<HTMLElement>('.post-grid');
  const prose = document.querySelector<HTMLElement>('.post .prose');
  const bar = document.querySelector<HTMLElement>('.progress');
  const left = document.querySelector<HTMLElement>('[data-left]');
  const card = document.querySelector<HTMLElement>('[data-done]');
  const rail = document.querySelector<SVGSVGElement>('.rail .net');
  if (!grid || !prose || !bar) return;

  const marks = [...document.querySelectorAll<SVGSVGElement>('.site .brand .net, .post .sig .net')];
  const railNodes = rail ? [...rail.querySelectorAll<SVGCircleElement>('circle')] : [];
  const railWires = rail ? [...rail.querySelectorAll<SVGLineElement>('line')] : [];
  const nets = [...marks, ...(rail ? [rail] : [])];

  let complete = false;
  let chapterOf: (p: number) => string = () => '';
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
    chapterOf(1); // every notch past, the last chapter current
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
      if (left) left.textContent = `${chapterOf(p)}quedan ${Math.max(1, Math.ceil(minutes * (1 - p)))} min`;
    }

  };

  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
  addEventListener('resize', update);
  document.addEventListener('ajustes:change', update);
  card?.addEventListener('focusin', finish); // keyboard readers who jump to the end

  // Chapters (## headings): notches on the header's progress line where each begins,
  // and "n/total" before the time left.
  const heads = [...prose.querySelectorAll<HTMLElement>(':scope > h2')];
  const siteHeader = document.querySelector<HTMLElement>('header.site');
  let marks_: number[] = [];
  const tocLinks = [...document.querySelectorAll<HTMLAnchorElement>('.rail-toc a')];
  let ticks: HTMLElement[] = [];
  if (heads.length >= 3 && siteHeader) {
    const host = document.createElement('div');
    host.className = 'ticks';
    host.setAttribute('aria-hidden', 'true');
    ticks = heads.map(() => host.appendChild(document.createElement('i')));
    siteHeader.append(host);
    const place = () => {
      const g = grid.getBoundingClientRect();
      marks_ = heads.map((h) => (h.getBoundingClientRect().top - g.top) / g.height);
      // A chapter that opens the text needs no notch at 0%.
      ticks.forEach((t, i) => { t.style.left = `${(marks_[i]! * 100).toFixed(2)}%`; t.hidden = marks_[i]! < 0.02; });
      tocLinks.forEach((a, i) => { (a.parentElement as HTMLElement).style.top = `${(marks_[i]! * 100).toFixed(2)}%`; });
      update();
    };
    addEventListener('resize', place);
    document.fonts?.ready.then(place);
    requestAnimationFrame(place);
  }
  chapterOf = (p: number) => {
    if (!marks_.length) return '';
    const n = marks_.filter((m) => m <= p + 0.001).length;
    ticks.forEach((t, i) => t.classList.toggle('past', marks_[i]! <= p + 0.001));
    const current = marks_.filter((m) => m <= p + 0.001).length - 1;
    tocLinks.forEach((a, i) => { a.classList.toggle('now', i === current); if (i === current) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
    return n ? `${n}/${marks_.length} · ` : '';
  };

  // The header carries the post title once the page's own title has scrolled away.
  const site = document.querySelector<HTMLElement>('header.site');
  const h1 = document.querySelector<HTMLElement>('.post-head h1');
  if (site && h1 && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => site.classList.toggle('reading', !e!.isIntersecting && e!.boundingClientRect.top < 0))
      .observe(h1);
  }
  requestAnimationFrame(update); // first layout read after first paint, not during load
}
