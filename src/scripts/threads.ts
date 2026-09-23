/**
 * Note threads. Desktop (notes in the margin): hovering or focusing a footnote
 * marker draws one thin net-style wire to its note. Phone (notes inline):
 * notes rest on one line; tapping the marker opens its note with a short
 * highlight. Without JS, notes stay fully open.
 */
import { reduced } from './motion';

const MARGIN = '(min-width: 1100px)';

export function mountThreads(root: HTMLElement): () => void {
  const prose = root.querySelector<HTMLElement>('.prose');
  const grid = root.querySelector<HTMLElement>('.post-grid');
  const markers = [...root.querySelectorAll<HTMLAnchorElement>('.prose .nref')];
  if (!prose || !grid || markers.length === 0) return () => {};

  const offs: Array<() => void> = [];
  const timers: number[] = [];
  const on = (
    target: EventTarget,
    type: string,
    fn: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions,
  ) => {
    target.addEventListener(type, fn, options);
    offs.push(() => target.removeEventListener(type, fn, options));
  };

  const margin = matchMedia(MARGIN);
  const noteOf = (m: HTMLAnchorElement) => document.getElementById(decodeURIComponent(m.hash.slice(1)))?.closest<HTMLElement>('.note') ?? null;
  const notes = [...prose.querySelectorAll<HTMLElement>(':scope > .note')];
  const noteAnchors = new Map<HTMLElement, HTMLElement>();
  for (const m of markers) {
    const note = noteOf(m);
    if (note && !noteAnchors.has(note)) noteAnchors.set(note, m.closest<HTMLElement>('p, li') ?? m);
  }

  // Desktop notes cannot stay in their grid rows: the tallest note makes that row as tall
  // as its content, stretching the paragraph beside it and leaving a blank in the text.
  // Keep each note at its marker's paragraph, then push only one that would meet the note
  // above it. The final note's overhang becomes padding after the prose, keeping the author
  // block clear; ResizeObserver and resize run this only after layout changes, never scrolling.
  const noteGap = 16;
  let layoutFrame = 0;
  let disposed = false;
  const layoutNotes = () => {
    if (!margin.matches) {
      prose.classList.remove('notes-ready');
      prose.style.removeProperty('--note-tail');
      for (const note of notes) note.style.removeProperty('top');
      return;
    }

    prose.classList.add('notes-ready');
    const proseRect = prose.getBoundingClientRect();
    const oldTail = Number.parseFloat(prose.style.getPropertyValue('--note-tail')) || 0;
    const contentHeight = Math.max(0, proseRect.height - oldTail);
    let previousBottom = Number.NEGATIVE_INFINITY;

    for (const note of notes) {
      const anchor = noteAnchors.get(note);
      if (!anchor) continue;
      const marginTop = Number.parseFloat(getComputedStyle(note).marginTop) || 0;
      const anchorTop = anchor.getBoundingClientRect().top - proseRect.top;
      const top = Math.max(anchorTop, previousBottom + noteGap - marginTop);
      note.style.top = `${Math.round(top * 100) / 100}px`;
      previousBottom = note.getBoundingClientRect().bottom - proseRect.top;
    }

    const tail = Number.isFinite(previousBottom) ? Math.max(0, previousBottom - contentHeight) : 0;
    if (Math.abs(tail - oldTail) > 0.5) prose.style.setProperty('--note-tail', `${Math.round(tail * 100) / 100}px`);
  };
  const scheduleLayout = () => {
    if (disposed || layoutFrame) return;
    layoutFrame = requestAnimationFrame(() => {
      layoutFrame = 0;
      if (!disposed) layoutNotes();
    });
  };
  layoutNotes();
  const layoutObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(scheduleLayout);
  layoutObserver?.observe(prose);
  for (const note of notes) layoutObserver?.observe(note);
  if (document.fonts) void document.fonts.ready.then(scheduleLayout);

  // Phone: notes rest compact (CSS, keyed on html.js), opened by their marker.
  const flash = (note: HTMLElement) => {
    note.classList.remove('is-flash');
    void note.offsetWidth; // restart the highlight
    note.classList.add('is-flash');
    timers.push(window.setTimeout(() => note.classList.remove('is-flash'), 240));
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
    on(m, 'click', (e) => {
      if (margin.matches) { e.preventDefault(); draw(m); return; }
      e.preventDefault();
      open(note, m);
    });
    on(note, 'click', (e) => {
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
    on(m, 'pointerenter', () => draw(m));
    on(m, 'focus', () => draw(m));
    on(m, 'pointerleave', () => { if (document.activeElement !== m) clear(); });
    on(m, 'blur', clear);
  }
  on(window, 'resize', () => { clear(); scheduleLayout(); });

  return () => {
    disposed = true;
    if (layoutFrame) cancelAnimationFrame(layoutFrame);
    layoutObserver?.disconnect();
    for (const off of offs.splice(0)) off();
    for (const t of timers.splice(0)) clearTimeout(t);
    prose.classList.remove('notes-ready');
    prose.style.removeProperty('--note-tail');
    for (const note of notes) note.style.removeProperty('top');
    svg.remove();
    lit?.classList.remove('is-lit');
    lit = null;
  };
}

/** The article page: one mount against the whole document, never disposed. */
export function initThreads(): void {
  const post = document.querySelector<HTMLElement>('.post');
  if (post) mountThreads(post);
}
