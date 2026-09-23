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
 * - the header mark: the static site logo, independent of reading; the time left and the
 *   progress line beside and below it answer where you are;
 * - every top-level block of the prose is given the band of the third of the text it
 *   sits in. The text itself does not take it -- links, bold, quotes and notes are the
 *   post's one hue -- but the rail's dock and the header's notch for a chapter read the
 *   band of the block it starts at, so the flag stays on the drawing and off the page;
 * - at the end: the rail completes with one short pulse, and the end card appears.
 */
import { reduced } from './motion';

export function mountReading(root: HTMLElement, opts: { minutes: number }): () => void {
  const { minutes } = opts;
  let disposed = false;
  const offs: Array<() => void> = [];
  const frames: number[] = [];
  const pulseTimers: number[] = [];
  /** Register a listener and remember how to remove it. */
  const on = (
    target: EventTarget | null | undefined,
    type: string,
    fn: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions,
  ) => {
    if (!target) return;
    target.addEventListener(type, fn, options);
    offs.push(() => target.removeEventListener(type, fn, options));
  };
  /** Request a frame and remember it, so a pending one can be cancelled on dispose. */
  const raf = (fn: FrameRequestCallback) => {
    const id = requestAnimationFrame((t) => { if (!disposed) fn(t); });
    frames.push(id);
    return id;
  };

  const grid = root.querySelector<HTMLElement>('.post-grid');
  const prose = root.querySelector<HTMLElement>('.prose');
  const bar = document.querySelector<HTMLElement>('.progress');
  const left = document.querySelector<HTMLElement>('[data-left]');
  const card = root.querySelector<HTMLElement>('[data-done]');
  const rail = root.querySelector<SVGSVGElement>('.rail .net');
  if (!grid || !prose || !bar) return () => {};

  const railNodes = rail ? [...rail.querySelectorAll<SVGCircleElement>('circle')] : [];
  // Drawn positions, read before the net starts to drift (netlive draws on the next frame).
  const railBase = railNodes.map((c) => [Number(c.getAttribute('cx')), Number(c.getAttribute('cy'))] as const);
  const railWires = rail ? [...rail.querySelectorAll<SVGLineElement>('line')] : [];
  const nets = rail ? [rail] : [];

  let complete = false;
  let chapterOf: (p: number) => string = () => '';
  // A phone has no room for the word: "2/4 · 6 min" instead of "2/4 · quedan 6 min".
  const terse = matchMedia('(max-width: 560px)');
  let queued = false;
  card?.classList.add('pending');

  // Light the rail to the reading position. It is grey until reading reaches a node; the
  // colour a node takes is its band's, not one ruling hue.
  const lightTo = (k: number, still: boolean) => {
    if (!rail) return;
    const upTo = still ? 0 : Math.round(k * railNodes.length);
    railNodes.forEach((c) => c.classList.toggle('on', Number(c.dataset.o) < upTo));
    railWires.forEach((l) => l.classList.toggle('on', Number(l.dataset.a) < upTo && Number(l.dataset.b) < upTo));
  };

  const finish = () => {
    if (complete) return;
    complete = true;
    if (!reduced()) nets.forEach((n) => {
      n.classList.add('pulse');
      const id = window.setTimeout(() => {
        if (disposed) return;
        n.classList.remove('pulse');
        const index = pulseTimers.indexOf(id);
        if (index >= 0) pulseTimers.splice(index, 1);
      }, 400);
      pulseTimers.push(id);
    });
    card?.classList.add('show');
  };

  /**
   * The band of each block. A block takes the band of its own middle, measured against
   * the same box the rail and the header's line are measured against -- so a chapter two
   * thirds down is rojo in the dock, and so is the rail beside it.
   *
   * It is measured rather than counted because the text's height is the reader's: the
   * size, the measure and the leading in Ajustes all move where a paragraph falls. It
   * runs on layout, never on scroll -- a colour that moved while you read would be the
   * one thing this is meant not to do.
   */
  const bandBlocks = () => {
    const g = grid.getBoundingClientRect();
    if (!g.height) return;
    for (const el of prose.children) {
      const r = el.getBoundingClientRect();
      const mid = (r.top + r.height / 2 - g.top) / g.height;
      (el as HTMLElement).dataset.band = String(Math.min(2, Math.max(0, Math.floor(mid * 3))));
    }
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
    // The rail follows where you are, both ways. Reading back up gives it back, so it
    // always answers "where am I" and never "how far did I once get".
    lightTo(end ? 1 : p, still);
    // Where you are now: the current chapter, its dot on the rail, and the time left.
    if (left) left.textContent = end
      ? `${chapterOf(1)}terminado`
      : `${chapterOf(p)}${terse.matches ? '' : 'quedan '}${Math.max(1, Math.ceil(minutes * (1 - p)))} min`;
  };

  // Anything that has to be measured is measured here, and only here: the blocks' bands,
  // and (below) the chapters' notches. `place` replaces this once there are chapters.
  let relayout = () => { bandBlocks(); update(); };

  on(window, 'scroll', () => { if (!queued) { queued = true; raf(update); } }, { passive: true });
  on(window, 'resize', () => relayout());
  on(document, 'ajustes:change', () => relayout());
  on(card, 'focusin', finish); // keyboard readers who jump to the end

  // Chapters (## headings): notches on the header's progress line where each begins,
  // and "n/total" before the time left.
  const heads = [...prose.querySelectorAll<HTMLElement>(':scope > h2')];
  const siteHeader = document.querySelector<HTMLElement>('header.site');
  let marks_: number[] = [];
  const tocLinks = [...root.querySelectorAll<HTMLAnchorElement>('.rail-toc a')];
  // The dock (desktop): each chapter sits beside the rail node where reading reaches it,
  // and a dot beside the current chapter's node marks where you are.
  const dot = rail && tocLinks.length ? rail.parentElement!.appendChild(document.createElement('span')) : null;
  dot?.classList.add('rail-dot');
  dot?.setAttribute('aria-hidden', 'true');
  const chapterNode = (m: number) => Math.min(railNodes.length - 1, Math.round(m * railNodes.length));
  const vb = rail?.viewBox.baseVal;
  const nodeAt = (i: number) => ({ y: (railBase[i]?.[1] ?? 0) / (vb?.height || 1) });
  let ticks: HTMLElement[] = [];
  let host: HTMLElement | null = null;
  let openTimer = 0;
  if (heads.length >= 3 && siteHeader) {
    // The chapters on the progress line. On a phone this is the rail's dock: each notch
    // is a link to its chapter with a 40px tap target around it, and a press or a hover
    // opens its number and title under the line. On desktop the rail carries the dock, so
    // the host is made inert and hidden by global.css; the same chapters are not duplicated.
    host = document.createElement('nav');
    const mountedHost = host;
    mountedHost.className = 'ticks';
    mountedHost.setAttribute('aria-label', 'Capítulos');
    const scrub = document.createElement('button');
    scrub.type = 'button';
    scrub.className = 'scrub-strip';
    scrub.tabIndex = -1;
    scrub.setAttribute('aria-hidden', 'true');
    mountedHost.append(scrub);
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
      return mountedHost.appendChild(a);
    });
    siteHeader.append(mountedHost);

    // A tap has no hover to show the label with, so the one you pressed opens for a
    // moment on the way to its chapter.
    on(mountedHost, 'pointerdown', (e: Event) => {
      const t = (e.target as Element).closest<HTMLElement>('.tick');
      if (!t) return;
      ticks.forEach((x) => x.classList.remove('is-open'));
      t.classList.add('is-open');
      clearTimeout(openTimer);
      openTimer = window.setTimeout(() => t.classList.remove('is-open'), 1600);
    });

    const dockMq = matchMedia('(min-width: 1000px)');
    const syncDock = () => { mountedHost.inert = dockMq.matches && tocLinks.length > 0; };
    on(dockMq, 'change', syncDock);
    syncDock();

    let pointerId: number | null = null;
    let startX = 0;
    let dragging = false;
    let pressTick: HTMLElement | null = null;
    let suppressClickTick: HTMLElement | null = null;
    let scrubTick: HTMLElement | null = null;
    const hideScrubTick = () => {
      scrubTick?.classList.remove('is-scrubbing');
      scrubTick = null;
    };
    const showScrubTick = (p: number) => {
      const current = Math.max(0, marks_.filter((m) => m <= p + 0.001).length - 1);
      const next = ticks[current] ?? null;
      if (next !== scrubTick) {
        hideScrubTick();
        scrubTick = next;
        scrubTick?.classList.add('is-scrubbing');
      }
    };
    const scrubTo = (clientX: number) => {
      const r = scrub.getBoundingClientRect();
      if (!r.width) return;
      const p = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
      const g = grid.getBoundingClientRect();
      const targetTop = innerHeight * 0.65 - p * g.height;
      window.scrollTo({ top: window.scrollY + g.top - targetTop, behavior: 'instant' });
      showScrubTick(p);
    };
    on(mountedHost, 'click', (e: Event) => {
      if (!suppressClickTick) return;
      const click = e as MouseEvent;
      const target = e.target as Element;
      const tick = target.closest<HTMLElement>('.tick');
      if (click.detail > 0 && (tick === suppressClickTick || target === mountedHost)) {
        e.preventDefault();
        e.stopPropagation();
      }
      suppressClickTick = null;
    }, { capture: true });
    on(mountedHost, 'pointerdown', (e: Event) => {
      const pointer = e as PointerEvent;
      if (dockMq.matches || pointerId !== null) return;
      const target = e.target as Element;
      const tick = target.closest<HTMLElement>('.tick');
      const surface = tick ?? target.closest<HTMLElement>('.scrub-strip');
      if (!surface) return;
      suppressClickTick = null;
      pressTick = tick;
      pointerId = pointer.pointerId;
      startX = pointer.clientX;
      dragging = false;
      surface.setPointerCapture(pointerId);
      if (!tick) e.preventDefault();
    });
    on(mountedHost, 'pointermove', (e: Event) => {
      const pointer = e as PointerEvent;
      if (pointerId !== pointer.pointerId) return;
      if (!dragging && Math.abs(pointer.clientX - startX) < 6) return;
      if (!dragging && pressTick) {
        pressTick.classList.remove('is-open');
        clearTimeout(openTimer);
      }
      dragging = true;
      e.preventDefault();
      scrubTo(pointer.clientX);
    });
    const endScrub = (e: Event) => {
      const pointer = e as PointerEvent;
      if (pointerId !== pointer.pointerId) return;
      if (e.type === 'pointerup' && dragging) suppressClickTick = pressTick;
      pointerId = null;
      if (dragging) hideScrubTick();
      dragging = false;
      pressTick = null;
    };
    on(mountedHost, 'pointerup', endScrub);
    on(mountedHost, 'pointercancel', endScrub);
    on(mountedHost, 'lostpointercapture', endScrub);

    const place = () => {
      bandBlocks();
      const g = grid.getBoundingClientRect();
      marks_ = heads.map((h) => (h.getBoundingClientRect().top - g.top) / g.height);
      // A chapter that opens the text needs no notch at 0%.
      ticks.forEach((t, i) => {
        const m = marks_[i]!;
        t.style.left = `${(m * 100).toFixed(2)}%`;
        t.hidden = m < 0.02;
      });
      // Near either end a centred label would hang off the screen; those anchor to the
      // gutter they are nearest instead. Measured, not a fixed fraction of the bar: a
      // long chapter title runs off from further in than a short one does, and a fixed
      // threshold let a label poke past the edge and gave the page a sideways scroll.
      const vw = document.documentElement.clientWidth;
      const gutter = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter')) || 16;
      ticks.forEach((t) => {
        const tt = t.querySelector<HTMLElement>('.tt');
        if (t.hidden || !tt) return;
        const r = t.getBoundingClientRect();
        const w = tt.offsetWidth;
        // Where a centred label would start, and where it is allowed to start.
        const want = r.left + r.width / 2 - w / 2;
        const min = gutter;
        const max = Math.max(gutter, vw - gutter - w);
        t.style.setProperty('--tt-shift', `${Math.round(Math.min(Math.max(want, min), max) - want)}px`);
      });
      // A heading is a block like any other, so bandBlocks has already given it its
      // band; the rail's dock and the header's notches take the same one, and the
      // chapter reads in one colour from the number in the margin to the notch up top.
      heads.forEach((h, i) => {
        const band = h.dataset.band ?? '0';
        ticks[i]!.dataset.band = band;
        tocLinks[i]?.setAttribute('data-band', band);
      });
      tocLinks.forEach((a, i) => { (a.parentElement as HTMLElement).style.top = `${(nodeAt(chapterNode(marks_[i]!)).y * 100).toFixed(2)}%`; });
      update();
    };
    relayout = place;
    on(document.fonts, 'loadingdone', () => relayout());
    document.fonts?.ready.then(() => { if (!disposed) place(); });
    raf(place);
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
  const h1 = root.querySelector<HTMLElement>('.post-head h1');
  let titleObserver: IntersectionObserver | null = null;
  if (site && h1 && 'IntersectionObserver' in window) {
    titleObserver = new IntersectionObserver(([e]) =>
      site.classList.toggle('reading', !e!.isIntersecting && e!.boundingClientRect.top < 0));
    titleObserver.observe(h1);
  }
  // Dock magnification: labels near the pointer grow, like the macOS dock.
  const dock = root.querySelector<HTMLElement>('.rail');
  if (dock && tocLinks.length) {
    const items = tocLinks.map((a) => a.parentElement as HTMLElement);
    on(dock, 'pointermove', (e: Event) => {
      if (reduced()) return;
      const pointer = e as PointerEvent;
      for (const li of items) {
        const r = li.getBoundingClientRect();
        const d = Math.abs(pointer.clientY - (r.top + r.height / 2));
        li.style.setProperty('--s', (1 + 0.35 * Math.max(0, 1 - d / 110)).toFixed(3));
      }
    });
    on(dock, 'pointerleave', () => items.forEach((li) => li.style.removeProperty('--s')));
  }
  document.fonts?.ready.then(() => { if (!disposed) relayout(); });
  raf(() => relayout()); // first layout read after first paint, not during load
  return () => {
    if (disposed) return;
    disposed = true;
    for (const off of offs.splice(0)) off();
    for (const id of frames.splice(0)) cancelAnimationFrame(id);
    for (const id of pulseTimers.splice(0)) clearTimeout(id);
    clearTimeout(openTimer);
    titleObserver?.disconnect();
    host?.remove();
    dot?.remove();
    site?.classList.remove('reading');
  };
}

/** The article page: one mount against the whole document, never disposed. */
export function initReading(minutes: number): void {
  mountReading(document.body, { minutes });
}
