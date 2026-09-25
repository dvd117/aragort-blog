/**
 * Net as navigation (landing). The hero net, a wire from its exit node and the thread down
 * the list are one line, and moving down the page travels along it (travel.ts draws it).
 * On every width:
 * - the reading line (65% of the viewport, as on a post) sets the high-water reach; the
 *   thread stays lit down to the furthest point reached this visit;
 * - passing an entry's node pulses it once and lights the entry's region of the net: its
 *   route through its own node to the exit, plus the nodes one wire away (data-region).
 *   The net only ever gains light, and a wire lights once both of its nodes are lit;
 * - the terminal is the station on "Quién escribe" after the list (the last visible
 *   station if there is none). Reaching it pulses that station once and lights the
 *   terminal bar. A page too short to scroll to it counts as reached at the bottom, or
 *   its last nodes could never light.
 * Desktop hover or keyboard focus previews an entry's trail and lights its region, but
 * never moves reach: only travel does.
 */
import { reduced } from './motion';
import { mountTravel, type TravelGeometry } from './travel';

const LINE = 0.65;

export function mountNetNav(): () => void {
  const root = document.querySelector<HTMLElement>('[data-netnav-root]');
  const wrap = document.querySelector<HTMLElement>('[data-netnav]');
  const net = wrap?.querySelector('svg');
  const list = document.querySelector<HTMLElement>('[data-thread]');
  const entries = [...document.querySelectorAll<HTMLElement>('.entry')];
  if (!root || !wrap || !net || !list || entries.length === 0) return () => {};

  const exit = (wrap.dataset.exit ?? '').split(',').filter(Boolean).map(Number);
  const circles = [...net.querySelectorAll<SVGCircleElement>('circle')];
  const lines = [...net.querySelectorAll<SVGLineElement>('line')];
  const exitCircle = circles[exit.at(-1) ?? 0];
  if (!exitCircle) return () => {};
  const stop = root.querySelector<HTMLElement>('.who .node');
  const travel = mountTravel(root, list, exitCircle, stop);

  const offs: Array<() => void> = [];
  const on = (target: EventTarget, type: string, fn: EventListener, options?: AddEventListenerOptions) => {
    target.addEventListener(type, fn, options);
    offs.push(() => target.removeEventListener(type, fn, options));
  };

  // Cumulative: every node any entry has lit so far. Nothing is ever unlit.
  const lit = new Set<number>();
  const lightRegion = (entry: HTMLElement) => {
    // Only the nodes new to this entry draw in, one by one; the rest are already lit.
    for (const el of [...circles, ...lines]) el.style.removeProperty('--i');
    const region = (entry.dataset.region ?? '').split(',').filter(Boolean).map(Number);
    (region.length ? region : exit).forEach((n, i) => {
      if (!lit.has(n)) { lit.add(n); circles[n]?.style.setProperty('--i', String(i)); }
      circles[n]?.classList.add('path');
    });
    // A wire lights once both of its nodes are lit, so separate regions knit together.
    for (const wireEl of lines) {
      const a = Number(wireEl.dataset.a), b = Number(wireEl.dataset.b);
      if (!lit.has(a) || !lit.has(b) || wireEl.classList.contains('path')) continue;
      wireEl.style.setProperty('--i', String(Math.max(region.indexOf(a), region.indexOf(b), 0)));
      wireEl.classList.add('path');
    }
  };

  const pulse = (el: Element | null | undefined) => {
    if (!el || reduced()) return;
    el.classList.remove('pulse');
    void el.getBoundingClientRect(); // restart it
    el.classList.add('pulse');
    el.addEventListener('animationend', () => el.classList.remove('pulse'), { once: true });
  };

  let geo: TravelGeometry;
  const passed = new Set<HTMLElement>();
  let ended = false;

  const tick = () => {
    const line = scrollY + innerHeight * LINE - geo.top;
    const bottom = scrollY + innerHeight >= document.documentElement.scrollHeight - 1;
    const y = Math.min(Math.max(line, geo.start), geo.end);
    const reach = bottom ? geo.end : y;
    travel.reach(reach);
    for (const n of geo.nodes) {
      if (n.y > reach || passed.has(n.entry)) continue;
      passed.add(n.entry);
      n.entry.classList.add('is-reached');
      lightRegion(n.entry);
      pulse(n.entry.querySelector('.node'));
    }
    if (reach >= geo.end && !ended) {
      ended = true;
      if (stop) { stop.closest('.who')?.classList.add('is-reached'); pulse(stop); }
    }
  };

  // Layout resets reach; put it back at the furthest node already passed (or the end, once
  // the terminal is lit), so a resize or a filter never unlights anything, then let the
  // reading line take it from there.
  const relayout = () => {
    geo = travel.layout();
    travel.reach(ended ? geo.end : Math.max(geo.start, ...geo.nodes.filter((n) => passed.has(n.entry)).map((n) => n.y)));
    tick();
  };

  const show = (entry: HTMLElement) => { lightRegion(entry); travel.preview(entry); };
  for (const entry of entries) {
    on(entry, 'pointerenter', (e) => { if ((e as PointerEvent).pointerType === 'mouse') show(entry); });
    on(entry, 'focusin', () => show(entry));
    on(entry, 'pointerdown', () => lightRegion(entry));
  }
  on(list, 'pointerleave', (e) => {
    if ((e as PointerEvent).pointerType === 'mouse' && !document.activeElement?.closest('.entry')) travel.preview(null);
  });
  on(list, 'focusout', (e) => {
    if (!list.contains((e as FocusEvent).relatedTarget as Node | null)) travel.preview(null);
  });

  let queued = false;
  on(window, 'scroll', () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; tick(); });
  }, { passive: true });
  on(window, 'resize', relayout);
  on(list, 'thread:filter', relayout);
  let disposed = false;
  document.fonts?.ready.then(() => { if (!disposed) relayout(); });
  relayout();

  return () => {
    disposed = true;
    for (const off of offs.splice(0)) off();
    travel.destroy();
  };
}

/** The landing: one mount once the first frame has laid out, never disposed. */
export function initNetNav(): void {
  requestAnimationFrame(() => { mountNetNav(); });
}
