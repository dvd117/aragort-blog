/**
 * The travelled thread (landing). This file only draws: the lit layer over the resting
 * thread, from the net's exit node down past every entry to the footer mark. netnav.ts
 * decides what is reached and what is current; this turns those numbers into paths.
 *
 * - reach: the fill runs from the exit node down to the lowest point reached this visit.
 *   Each section takes the hue of the entry it leads to, so the flag comes in as you go;
 *   the tail after the last entry is David's line, in the text colour.
 * - here: a hollow ring on the thread at the reading line, in the current entry's hue.
 * - preview: desktop hover draws an entry's trail from the exit node to its node. The part
 *   below reach is at half strength -- a look ahead, not travel.
 *
 * Every y is in root coordinates. The resting thread stays CSS, so without JS the page is
 * exactly what it was.
 */
import { reduced } from './motion';

export interface Pt { x: number; y: number }
export interface Section { hue: string | null; d: string }
export interface TravelGeometry { top: number; start: number; end: number; nodes: Array<{ entry: HTMLElement; y: number }> }
export interface Travel {
  layout(): TravelGeometry;
  reach(y: number): void;
  here(y: number, hue: string): void;
  preview(entry: HTMLElement | null): void;
  destroy(): void;
}

/** Exit node -> top of the list -> straight down. An exit below the list top is dropped. */
export const polyline = (exit: Pt, top: Pt, endY: number): Pt[] =>
  exit.y < top.y ? [exit, top, { x: top.x, y: endY }] : [top, { x: top.x, y: endY }];

/** The point at height y on a polyline that only ever runs down, clamped to its ends. */
export function pointAt(poly: Pt[], y: number): Pt {
  if (y <= poly[0]!.y) return poly[0]!;
  for (let i = 1; i < poly.length; i++) {
    const a = poly[i - 1]!, b = poly[i]!;
    if (y <= b.y) return { x: a.x + (b.x - a.x) * ((y - a.y) / (b.y - a.y)), y };
  }
  return poly.at(-1)!;
}

const fmt = (p: Pt, i: number) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;

/** The stretch between heights y0 and y1 as an SVG path, corners included; '' if empty. */
export function slice(poly: Pt[], y0: number, y1: number): string {
  if (y1 <= y0) return '';
  return [pointAt(poly, y0), ...poly.filter((p) => p.y > y0 && p.y < y1), pointAt(poly, y1)].map(fmt).join('');
}

/** One section per entry (the stretch that leads to its node), then the tail; cut at reach. */
export function sections(poly: Pt[], nodes: Array<{ y: number; hue: string }>, reach: number): Section[] {
  const out: Section[] = [];
  let from = poly[0]!.y;
  for (const n of nodes) {
    out.push({ hue: n.hue, d: slice(poly, from, Math.min(n.y, reach)) });
    from = n.y;
  }
  out.push({ hue: null, d: slice(poly, from, Math.min(poly.at(-1)!.y, reach)) });
  return out;
}

/** The last node at or above the line; the first when none is yet; -1 with no nodes. */
export function currentIndex(ys: number[], line: number): number {
  let i = 0;
  ys.forEach((y, k) => { if (y <= line) i = k; });
  return ys.length ? i : -1;
}

const ns = 'http://www.w3.org/2000/svg';
const make = <K extends keyof SVGElementTagNameMap>(tag: K, cls?: string): SVGElementTagNameMap[K] => {
  const el = document.createElementNS(ns, tag);
  if (cls) el.setAttribute('class', cls);
  return el;
};

export function mountTravel(root: HTMLElement, list: HTMLElement, exit: SVGCircleElement, foot: SVGSVGElement | null): Travel {
  const svg = make('svg', 'wire');
  svg.setAttribute('aria-hidden', 'true');
  const base = make('path', 'base');
  const fill = make('g', 'fill');
  const lit = make('path', 'lit');
  const ahead = make('path', 'lit ahead');
  for (const p of [lit, ahead]) p.setAttribute('pathLength', '1');
  const mark = make('g', 'here');
  mark.setAttribute('visibility', 'hidden');
  const halo = make('circle', 'halo');
  const ring = make('circle', 'ring');
  for (const c of [halo, ring]) c.setAttribute('r', '4');
  mark.append(halo, ring);
  svg.append(base, fill, lit, ahead, mark);
  root.prepend(svg);

  let poly: Pt[] = [{ x: 0, y: 0 }];
  let nodes: Array<{ entry: HTMLElement; y: number; hue: string }> = [];
  let reachY = 0;

  const centre = (el: Element, r: DOMRect): Pt => {
    const b = el.getBoundingClientRect();
    return { x: b.left + b.width / 2 - r.left, y: b.top + b.height / 2 - r.top };
  };
  // The landing's thread ends at the footer mark's top-left node (index.css draws the rest).
  const footNode = () => {
    const circles = [...(foot?.querySelectorAll('circle') ?? [])];
    return circles.sort((a, b) => {
      const p = a.getBoundingClientRect(), q = b.getBoundingClientRect();
      return p.left + p.top - (q.left + q.top);
    })[0] ?? null;
  };

  const render = () => {
    const secs = sections(poly, nodes, reachY);
    while (fill.children.length < secs.length) fill.append(make('path'));
    while (fill.children.length > secs.length) fill.lastElementChild!.remove();
    secs.forEach((s, i) => {
      const p = fill.children[i] as SVGPathElement;
      if (!s.d) p.removeAttribute('d');
      else if (p.getAttribute('d') !== s.d) p.setAttribute('d', s.d);
      p.style.setProperty('--sec', s.hue ? `var(--hl-${s.hue})` : 'var(--fg)');
    });
  };

  const draw = (p: SVGPathElement, d: string) => {
    if (!d) { p.removeAttribute('d'); return; }
    p.setAttribute('d', d);
    if (reduced()) { p.style.strokeDashoffset = '0'; return; }
    p.style.transition = 'none';
    p.style.strokeDashoffset = '1';
    void p.getBoundingClientRect();
    p.style.transition = '';
    p.style.strokeDashoffset = '0';
  };

  const layout = (): TravelGeometry => {
    const r = root.getBoundingClientRect();
    const l = list.getBoundingClientRect();
    const e = centre(exit, r);
    const top = { x: l.left + 5.5 - r.left, y: l.top - r.top };
    const end = footNode();
    poly = polyline(e, top, end ? centre(end, r).y : l.bottom - r.top);
    base.setAttribute('d', [e, top].map(fmt).join(''));
    nodes = [...list.querySelectorAll<HTMLElement>('.entry:not([hidden])')].flatMap((entry) => {
      const node = entry.querySelector('.node');
      return node ? [{ entry, y: centre(node, r).y, hue: entry.dataset.postHue ?? 'amarillo' }] : [];
    });
    reachY = poly[0]!.y;
    lit.removeAttribute('d');
    ahead.removeAttribute('d');
    render();
    return { top: r.top + scrollY, start: poly[0]!.y, end: poly.at(-1)!.y, nodes: nodes.map(({ entry, y }) => ({ entry, y })) };
  };

  return {
    layout,
    reach(y) {
      const next = Math.min(y, poly.at(-1)!.y);
      if (next <= reachY) return;
      reachY = next;
      render();
    },
    here(y, hue) {
      const p = pointAt(poly, y);
      for (const c of [halo, ring]) { c.setAttribute('cx', p.x.toFixed(1)); c.setAttribute('cy', p.y.toFixed(1)); }
      mark.style.setProperty('--here', `var(--hl-${hue})`);
      mark.removeAttribute('visibility');
    },
    preview(entry) {
      const n = entry ? nodes.find((x) => x.entry === entry) : undefined;
      if (!n) { lit.removeAttribute('d'); ahead.removeAttribute('d'); return; }
      svg.style.setProperty('--trail', `var(--hl-${n.hue})`);
      const start = poly[0]!.y;
      draw(lit, slice(poly, start, Math.min(n.y, reachY)));
      draw(ahead, slice(poly, Math.max(start, reachY), n.y));
    },
    destroy() { svg.remove(); },
  };
}
