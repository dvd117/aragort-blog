/**
 * Motion while reading, driven by one scroll position:
 * - desktop rail: nodes light in reading order (static under reduced motion). The light is
 *   a high-water mark: it holds at the furthest you have read and never recedes, so a jump
 *   back with the dock does not unread the text;
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
  // Drawn positions, read before the net starts to drift (netlive draws on the next frame).
  const railBase = railNodes.map((c) => [Number(c.getAttribute('cx')), Number(c.getAttribute('cy'))] as const);
  const railWires = rail ? [...rail.querySelectorAll<SVGLineElement>('line')] : [];
  const nets = [...marks, ...(rail ? [rail] : [])];

  let complete = false;
  // The light is a high-water mark: it shows the furthest you have read, and never
  // recedes. The chapter dot and "quedan N min" follow where you actually are.
  let peak = 0;
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
    peak = 1;
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
    const still = reduced();
    rail?.classList.toggle('live', !still);
    if (p > peak) {
      peak = p;
      lightMarks(peak);
      if (rail) {
        const k = still ? 0 : Math.round(peak * railNodes.length);
        railNodes.forEach((c) => c.classList.toggle('on', Number(c.dataset.o) < k));
        railWires.forEach((l) => l.classList.toggle('on', Number(l.dataset.a) < k && Number(l.dataset.b) < k));
      }
    }
    // Where you are now: the current chapter, its dot on the rail, and the time left.
    // These move both ways, so jumping back with the dock is never a dead end.
    if (left) left.textContent = end ? `${chapterOf(p)}terminado` : `${chapterOf(p)}quedan ${Math.max(1, Math.ceil(minutes * (1 - p)))} min`;

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
  // The dock (desktop): each chapter sits beside the rail node where reading reaches it,
  // and a dot beside the current chapter's node marks where you are.
  const dot = rail && tocLinks.length ? rail.parentElement!.appendChild(document.createElement('span')) : null;
  dot?.classList.add('rail-dot');
  dot?.setAttribute('aria-hidden', 'true');
  const chapterNode = (m: number) => Math.min(railNodes.length - 1, Math.round(m * railNodes.length));
  const vb = rail?.viewBox.baseVal;
  const nodeAt = (i: number) => ({ y: (railBase[i]?.[1] ?? 0) / (vb?.height || 1) });
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
      tocLinks.forEach((a, i) => { (a.parentElement as HTMLElement).style.top = `${(nodeAt(chapterNode(marks_[i]!)).y * 100).toFixed(2)}%`; });
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
    if (dot && rail) {
      const n = nodeAt(chapterNode(marks_[Math.max(0, current)]!));
      dot.style.left = `${(rail.getBoundingClientRect().width + 6).toFixed(1)}px`; // the dock's edge, at the node's height
      dot.style.top = `${(n.y * 100).toFixed(2)}%`;
      dot.hidden = current < 0;
    }
    return n ? `${n}/${marks_.length} · ` : '';
  };

  // The header carries the post title once the page's own title has scrolled away.
  const site = document.querySelector<HTMLElement>('header.site');
  const h1 = document.querySelector<HTMLElement>('.post-head h1');
  if (site && h1 && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => site.classList.toggle('reading', !e!.isIntersecting && e!.boundingClientRect.top < 0))
      .observe(h1);
  }
  // Dock magnification: labels near the pointer grow, like the macOS dock.
  const dock = document.querySelector<HTMLElement>('.rail');
  if (dock && tocLinks.length) {
    const items = tocLinks.map((a) => a.parentElement as HTMLElement);
    dock.addEventListener('pointermove', (e) => {
      if (reduced()) return;
      for (const li of items) {
        const r = li.getBoundingClientRect();
        const d = Math.abs(e.clientY - (r.top + r.height / 2));
        li.style.setProperty('--s', (1 + 0.35 * Math.max(0, 1 - d / 110)).toFixed(3));
      }
    });
    dock.addEventListener('pointerleave', () => items.forEach((li) => li.style.removeProperty('--s')));
  }
  requestAnimationFrame(update); // first layout read after first paint, not during load
}
