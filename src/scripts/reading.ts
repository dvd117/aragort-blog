/**
 * Motion while reading, driven by one scroll position:
 * - desktop rail: the flag is drawn in grey and painted as you go -- node by node in
 *   reading order, each one taking its own band's colour, so a post is read amarillo,
 *   then azul, then rojo. It follows where you are in both directions: scrolling back up
 *   gives the rail back, because a rail that stayed full after one pass stopped telling
 *   you anything (static under reduced motion);
 * - the progress line along the header's bottom edge: the same three bands, uncovered
 *   left to right. Its notches are the chapters, and on a phone they are the dock --
 *   tap one to go there, press or hover to open its number and title;
 * - the header mark: the rail in miniature, with "quedan N min" beside it;
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
  let chapterOf: (p: number) => string = () => '';
  // A phone has no room for the word: "2/4 · 6 min" instead of "2/4 · quedan 6 min".
  const terse = matchMedia('(max-width: 560px)');
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

  // Light every net to the same fraction of itself. The rail is grey until reading
  // reaches a node; the colour a node takes is its band's, not one ruling hue.
  const lightTo = (k: number, still: boolean) => {
    lightMarks(k);
    if (!rail) return;
    const upTo = still ? 0 : Math.round(k * railNodes.length);
    railNodes.forEach((c) => c.classList.toggle('on', Number(c.dataset.o) < upTo));
    railWires.forEach((l) => l.classList.toggle('on', Number(l.dataset.a) < upTo && Number(l.dataset.b) < upTo));
  };

  const finish = () => {
    if (complete) return;
    complete = true;
    if (!reduced()) nets.forEach((n) => { n.classList.add('pulse'); setTimeout(() => n.classList.remove('pulse'), 400); });
    card?.classList.add('show');
  };

  const update = () => {
    queued = false;
    const r = grid.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.65 - r.top) / r.height));
    // A clip, not a scale: the bar carries the flag's three bands and a transform would
    // squash them into the read part instead of uncovering them.
    bar.style.clipPath = `inset(0 ${((1 - p) * 100).toFixed(2)}% 0 0)`;

    const end = prose.getBoundingClientRect().bottom <= innerHeight - 24;
    if (end) finish();
    const still = reduced();
    rail?.classList.toggle('live', !still);
    // Everything follows where you are, both ways. Reading back up gives the rail and the
    // mark back, so they always answer "where am I" and never "how far did I once get".
    lightTo(end ? 1 : p, still);
    // Where you are now: the current chapter, its dot on the rail, and the time left.
    if (left) left.textContent = end
      ? `${chapterOf(1)}terminado`
      : `${chapterOf(p)}${terse.matches ? '' : 'quedan '}${Math.max(1, Math.ceil(minutes * (1 - p)))} min`;
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
    // The chapters on the progress line. On a phone this is the rail's dock: each notch
    // is a link to its chapter with a 40px tap target around it, and a press or a hover
    // opens its number and title under the line. On desktop the rail carries the dock, so
    // the host is made inert there -- the notches stay as marks and the same chapters are
    // not in the tab order twice.
    const host = document.createElement('nav');
    host.className = 'ticks';
    host.setAttribute('aria-label', 'Capítulos');
    ticks = heads.map((h, i) => {
      const a = document.createElement('a');
      a.className = 'tick';
      a.href = `#${h.id}`;
      const notch = document.createElement('i');
      notch.setAttribute('aria-hidden', 'true');
      const tt = document.createElement('span');
      tt.className = 'tt';
      const num = document.createElement('b');
      num.textContent = String(i + 1).padStart(2, '0');
      num.setAttribute('aria-hidden', 'true');
      const ttl = document.createElement('span');
      ttl.textContent = h.textContent ?? '';
      tt.append(num, ttl);
      a.append(notch, tt);
      return host.appendChild(a);
    });
    siteHeader.append(host);

    // A tap has no hover to show the label with, so the one you pressed opens for a
    // moment on the way to its chapter.
    let openTimer = 0;
    host.addEventListener('pointerdown', (e) => {
      const t = (e.target as Element).closest<HTMLElement>('.tick');
      if (!t) return;
      ticks.forEach((x) => x.classList.remove('is-open'));
      t.classList.add('is-open');
      clearTimeout(openTimer);
      openTimer = window.setTimeout(() => t.classList.remove('is-open'), 1600);
    });

    const dockMq = matchMedia('(min-width: 1000px)');
    const syncDock = () => { host.inert = dockMq.matches && tocLinks.length > 0; };
    dockMq.addEventListener('change', syncDock);
    syncDock();

    const place = () => {
      const g = grid.getBoundingClientRect();
      marks_ = heads.map((h) => (h.getBoundingClientRect().top - g.top) / g.height);
      // A chapter that opens the text needs no notch at 0%.
      ticks.forEach((t, i) => {
        const m = marks_[i]!;
        t.style.left = `${(m * 100).toFixed(2)}%`;
        t.hidden = m < 0.02;
        // Near either end a centred label would hang off the screen; those two anchor to
        // the gutter they are nearest instead.
        t.classList.toggle('at-start', m < 0.18);
        t.classList.toggle('at-end', m > 0.82);
      });
      // The chapter numbers in the text walk the flag with the reader: the headings in
      // the first third are amarillo, the middle azul, the last rojo. Fixed by position
      // in the text, so a number never changes colour while it is on the screen.
      heads.forEach((h, i) => {
        const band = String(Math.min(2, Math.floor(marks_[i]! * 3)));
        h.dataset.band = band;
        ticks[i]!.dataset.band = band;
        tocLinks[i]?.setAttribute('data-band', band);
      });
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
