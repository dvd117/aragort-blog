/**
 * Note threads. Desktop (notes in the margin): hovering or focusing a footnote
 * marker draws one thin net-style wire to its note. Phone (notes inline):
 * notes rest on one line; tapping the marker opens its note with a short
 * highlight. Without JS, notes stay fully open.
 */
import { reduced } from './motion';

const MARGIN = '(min-width: 1100px)';

export function initThreads(): void {
  const prose = document.querySelector<HTMLElement>('.post .prose');
  const grid = document.querySelector<HTMLElement>('.post-grid');
  const markers = [...document.querySelectorAll<HTMLAnchorElement>('.post .prose .nref')];
  if (!prose || !grid || markers.length === 0) return;

  const margin = matchMedia(MARGIN);
  const noteOf = (m: HTMLAnchorElement) => document.getElementById(decodeURIComponent(m.hash.slice(1)))?.closest<HTMLElement>('.note') ?? null;

  // Phone: notes rest compact (CSS, keyed on html.js), opened by their marker.
  const flash = (note: HTMLElement) => {
    note.classList.remove('is-flash');
    void note.offsetWidth; // restart the highlight
    note.classList.add('is-flash');
    setTimeout(() => note.classList.remove('is-flash'), 240);
  };
  const open = (note: HTMLElement, marker?: HTMLAnchorElement) => {
    note.classList.add('is-open');
    marker?.setAttribute('aria-expanded', 'true');
    flash(note);
    const r = note.getBoundingClientRect();
    if (r.bottom > innerHeight || r.top < 0) note.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' });
  };
  for (const m of markers) {
    const note = noteOf(m);
    if (!note) continue;
    m.setAttribute('aria-controls', note.id || (note.id = `n-${m.hash.slice(1)}`));
    m.setAttribute('aria-expanded', 'false');
    m.addEventListener('click', (e) => {
      if (margin.matches) { e.preventDefault(); draw(m); return; }
      e.preventDefault();
      open(note, m);
    });
    note.addEventListener('click', (e) => {
      if (!margin.matches && !(e.target as Element).closest('a')) open(note);
    });
  }

  // Desktop: one SVG path from the marker to its note.
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'thread');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(ns, 'path');
  svg.append(path);
  grid.append(svg);

  let lit: HTMLElement | null = null;
  const clear = () => {
    svg.classList.remove('on');
    lit?.classList.remove('is-lit');
    lit = null;
  };
  const draw = (m: HTMLAnchorElement) => {
    const note = noteOf(m);
    if (!margin.matches || !note) return;
    const g = grid.getBoundingClientRect();
    const a = m.getBoundingClientRect();
    const b = note.getBoundingClientRect();
    const block = m.closest('p, li') ?? m;
    const edge = block.getBoundingClientRect().right - g.left + 10;
    // Up from the marker into the gap above its line, along the gap past the
    // column, then across to the note: a wire with kinks, never over the text.
    const x1 = (a.left + a.right) / 2 - g.left, y1 = a.top - g.top;
    const gap = y1 - 5;
    const x2 = b.left - g.left - 6, y2 = b.top - g.top + 12;
    const pts = [[x1, y1], [x1 + 5, gap], [edge, gap], [x2, y2]];
    path.setAttribute('d', pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x!.toFixed(1)} ${y!.toFixed(1)}`).join(''));
    const len = Math.ceil(path.getTotalLength());
    path.style.strokeDasharray = `${len}`;
    svg.classList.remove('on');
    path.style.strokeDashoffset = reduced() ? '0' : `${len}`;
    void path.getBoundingClientRect();
    svg.classList.add('on');
    path.style.strokeDashoffset = '0';
    lit?.classList.remove('is-lit');
    lit = note;
    note.classList.add('is-lit');
  };
  for (const m of markers) {
    m.addEventListener('pointerenter', () => draw(m));
    m.addEventListener('focus', () => draw(m));
    m.addEventListener('pointerleave', () => { if (document.activeElement !== m) clear(); });
    m.addEventListener('blur', clear);
  }
  addEventListener('resize', clear);
}
