/**
 * The travelled landing track. netnav.ts supplies the reading-line y; this module maps it
 * to distance along the rounded route and draws the resulting path sections.
 */
import { reduced } from './motion';

export interface Pt { x: number; y: number }
export interface CurvePoint extends Pt { s: number; arcCenter?: Pt }
export interface TravelPath {
  points: CurvePoint[];
  length: number;
  connectorS: number;
  verticalY: number;
}
export interface Section { hue: string | null; d: string }
export interface TravelGeometry { top: number; start: number; end: number; nodes: Array<{ entry: HTMLElement; y: number }> }
export interface Travel {
  layout(): TravelGeometry;
  reach(y: number): void;
  here(y: number, hue: string): void;
  preview(entry: HTMLElement | null): void;
  destroy(): void;
}

/** Sharp route corners in root coordinates, with y increasing down the page. */
export function route(exit: Pt, gutterX: number, topY: number, endY: number, r: number): Pt[] {
  const dx = exit.x - gutterX;
  const D = topY - exit.y;
  if (D <= 0) return [{ x: gutterX, y: topY }, { x: gutterX, y: endY }];
  if (Math.abs(dx) < 1) return [exit, { x: exit.x, y: endY }];
  // The landing exit is normally to the right of the gutter. Preserve a descending
  // 45-degree connection if an unusual layout reverses that relationship.
  if (dx < 0) return [exit, { x: gutterX, y: exit.y + Math.abs(dx) }, { x: gutterX, y: endY }];
  if (dx <= D) return [exit, { x: gutterX, y: exit.y + dx }, { x: gutterX, y: endY }];
  const a = Math.min(dx / 2, Math.max(0.4 * D, 2 * r));
  const y = exit.y + a;
  return [exit, { x: exit.x - a, y }, { x: gutterX + a, y }, { x: gutterX, y: y + a }, { x: gutterX, y: endY }];
}

/** Round a right-angle / 45-degree corner route; `s` is analytic arc length, not chord length. */
export function sampleRoute(corners: Pt[], r: number): TravelPath {
  if (corners.length < 2) throw new Error('A route needs a start and an end point');
  const points: CurvePoint[] = [{ ...corners[0]!, s: 0 }];
  let s = 0;
  let connectorS = 0;
  let verticalY = corners[0]!.y;
  const lastCorner = corners.length - 2;
  const appendLine = (p: Pt) => {
    const last = points.at(-1)!;
    const length = Math.hypot(p.x - last.x, p.y - last.y);
    if (length <= 1e-9) return;
    s += length;
    points.push({ ...p, s });
  };

  for (let i = 1; i < corners.length - 1; i++) {
    const prev = corners[i - 1]!, corner = corners[i]!, next = corners[i + 1]!;
    const inLength = Math.hypot(corner.x - prev.x, corner.y - prev.y);
    const outLength = Math.hypot(next.x - corner.x, next.y - corner.y);
    const u = { x: (corner.x - prev.x) / inLength, y: (corner.y - prev.y) / inLength };
    const v = { x: (next.x - corner.x) / outLength, y: (next.y - corner.y) / outLength };
    const cross = u.x * v.y - u.y * v.x;
    const dot = Math.max(-1, Math.min(1, u.x * v.x + u.y * v.y));
    const theta = Math.acos(dot);
    if (r <= 0 || theta < 1e-9 || Math.abs(cross) < 1e-9) {
      appendLine(corner);
      if (i === lastCorner) { connectorS = s; verticalY = corner.y; }
      continue;
    }

    const tangent = r * Math.tan(theta / 2);
    const from = { x: corner.x - u.x * tangent, y: corner.y - u.y * tangent };
    const to = { x: corner.x + v.x * tangent, y: corner.y + v.y * tangent };
    const direction = Math.sign(cross);
    const center = {
      x: from.x + -u.y * direction * r,
      y: from.y + u.x * direction * r,
    };
    appendLine(from);
    points.at(-1)!.arcCenter = center;
    const startAngle = Math.atan2(from.y - center.y, from.x - center.x);
    const endAngle = Math.atan2(to.y - center.y, to.x - center.x);
    let sweep = endAngle - startAngle;
    if (direction > 0) while (sweep < 0) sweep += Math.PI * 2;
    else while (sweep > 0) sweep -= Math.PI * 2;
    const maxStep = 2 * Math.acos(Math.max(-1, Math.min(1, 1 - 0.25 / r)));
    const count = Math.max(1, Math.ceil(Math.abs(sweep) / maxStep));
    for (let j = 1; j <= count; j++) {
      const angle = startAngle + sweep * j / count;
      const p = j === count ? to : { x: center.x + r * Math.cos(angle), y: center.y + r * Math.sin(angle) };
      s += r * Math.abs(sweep) / count;
      points.push({ ...p, s, arcCenter: center });
    }
    if (i === lastCorner) { connectorS = s; verticalY = to.y; }
  }
  appendLine(corners.at(-1)!);
  return { points, length: points.at(-1)!.s, connectorS, verticalY };
}

/** Convert reading-line y to arc length; the connector is linear in y, then the gutter is 1:1. */
export function yToS(path: TravelPath, y: number): number {
  const startY = path.points[0]!.y;
  if (y <= startY) return 0;
  let s: number;
  if (path.connectorS > 0 && path.verticalY > startY && y < path.verticalY) {
    s = path.connectorS * (y - startY) / (path.verticalY - startY);
  } else {
    s = path.connectorS + y - path.verticalY;
  }
  return Math.max(0, Math.min(path.length, s));
}

/** Point at a clamped analytic distance along sampled straights and circular arcs. */
export function pointAtS(points: CurvePoint[], s: number): Pt {
  if (s <= points[0]!.s) return { x: points[0]!.x, y: points[0]!.y };
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!, b = points[i]!;
    if (s <= b.s) {
      const t = (s - a.s) / (b.s - a.s);
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
  }
  const end = points.at(-1)!;
  return { x: end.x, y: end.y };
}

export function pointAtY(path: TravelPath, y: number): Pt {
  return pointAtS(path.points, yToS(path, y));
}

const fmt = (p: Pt, i: number) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;

/** A sampled stretch as an SVG path; all route samples between its arc-length endpoints remain. */
export function slice(points: CurvePoint[], s0: number, s1: number): string {
  if (s1 <= s0) return '';
  return [pointAtS(points, s0), ...points.filter((p) => p.s > s0 && p.s < s1), pointAtS(points, s1)].map(fmt).join('');
}

/** One hue section per entry (the stretch leading to its station), then the text-colour tail. */
export function sections(points: CurvePoint[], nodes: Array<{ s: number; hue: string }>, reach: number): Section[] {
  const out: Section[] = [];
  let from = 0;
  for (const n of nodes) {
    out.push({ hue: n.hue, d: slice(points, from, Math.min(n.s, reach)) });
    from = n.s;
  }
  out.push({ hue: null, d: slice(points, from, Math.min(points.at(-1)!.s, reach)) });
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
let clipSequence = 0;

function withPointAt(points: CurvePoint[], s: number): CurvePoint[] {
  if (points.some((p) => Math.abs(p.s - s) < 1e-8)) return points;
  const p = pointAtS(points, s);
  const at = points.findIndex((point) => point.s > s);
  return at < 0 ? [...points, { ...p, s }] : [...points.slice(0, at), { ...p, s }, ...points.slice(at)];
}

function outline(path: TravelPath, trackW: number, barS: number): string {
  const centerline = withPointAt(path.points, barS);
  const sections: Array<{ p: Pt; w: number; i: number }> = [];
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const widthAt = (s: number) => {
    if (path.connectorS <= 0 || s >= path.connectorS) return trackW;
    return 1 + (trackW - 1) * smooth(s / path.connectorS);
  };
  for (let i = 0; i < centerline.length; i++) {
    const p = centerline[i]!;
    if (Math.abs(p.s - barS) < 1e-8) sections.push({ p, w: trackW, i }, { p, w: 1, i });
    else sections.push({ p, w: p.s > barS ? 1 : widthAt(p.s), i });
  }
  const normalAt = (i: number) => {
    const p = centerline[i]!;
    let before = i - 1, after = i + 1;
    while (before >= 0 && Math.hypot(centerline[before]!.x - p.x, centerline[before]!.y - p.y) < 1e-8) before--;
    while (after < centerline.length && Math.hypot(centerline[after]!.x - p.x, centerline[after]!.y - p.y) < 1e-8) after++;
    const a = centerline[before >= 0 ? before : i]!, b = centerline[after < centerline.length ? after : i]!;
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    return { x: -dy / len, y: dx / len };
  };
  const left = sections.map(({ p, w, i }) => {
    const n = normalAt(i);
    return { x: p.x + n.x * w / 2, y: p.y + n.y * w / 2 };
  });
  const right = sections.map(({ p, w, i }) => {
    const n = normalAt(i);
    return { x: p.x - n.x * w / 2, y: p.y - n.y * w / 2 };
  }).reverse();
  return [...left, ...right].map(fmt).join('') + 'Z';
}

export function mountTravel(root: HTMLElement, list: HTMLElement, exit: SVGCircleElement, foot: SVGSVGElement | null): Travel {
  const svg = make('svg', 'wire');
  svg.setAttribute('aria-hidden', 'true');
  const defs = make('defs');
  const clip = document.createElementNS(ns, 'clipPath');
  const clipId = `landing-track-clip-${++clipSequence}`;
  clip.setAttribute('id', clipId);
  clip.setAttribute('clipPathUnits', 'userSpaceOnUse');
  const clipShape = make('path');
  clip.append(clipShape);
  defs.append(clip);
  const layers = make('g', 'layers');
  layers.setAttribute('clip-path', `url(#${clipId})`);
  const base = make('path', 'base');
  const fill = make('g', 'fill');
  const lit = make('path', 'lit');
  const ahead = make('path', 'lit ahead');
  for (const p of [lit, ahead]) p.setAttribute('pathLength', '1');
  layers.append(base, fill, lit, ahead);
  const mark = make('g', 'here');
  mark.setAttribute('visibility', 'hidden');
  const halo = make('circle', 'halo');
  const ring = make('circle', 'ring');
  mark.append(halo, ring);
  svg.append(defs, layers, mark);
  root.prepend(svg);

  let path: TravelPath = { points: [{ x: 0, y: 0, s: 0 }, { x: 0, y: 0, s: 0 }], length: 0, connectorS: 0, verticalY: 0 };
  let nodes: Array<{ entry: HTMLElement; y: number; hue: string }> = [];
  let reachS = 0;
  let trackW = 4;

  const centre = (el: Element, r: DOMRect): Pt => {
    const b = el.getBoundingClientRect();
    return { x: b.left + b.width / 2 - r.left, y: b.top + b.height / 2 - r.top };
  };
  // The landing track ends at the footer mark's top-left node.
  const footNode = () => {
    const circles = [...(foot?.querySelectorAll('circle') ?? [])];
    return circles.sort((a, b) => {
      const p = a.getBoundingClientRect(), q = b.getBoundingClientRect();
      return p.left + p.top - (q.left + q.top);
    })[0] ?? null;
  };

  const render = () => {
    const secs = sections(path.points, nodes.map((n) => ({ s: yToS(path, n.y), hue: n.hue })), reachS);
    while (fill.children.length < secs.length) fill.append(make('path'));
    while (fill.children.length > secs.length) fill.lastElementChild!.remove();
    secs.forEach((section, i) => {
      const p = fill.children[i] as SVGPathElement;
      if (!section.d) p.removeAttribute('d');
      else if (p.getAttribute('d') !== section.d) p.setAttribute('d', section.d);
      p.style.setProperty('--sec', section.hue ? `var(--hl-${section.hue})` : 'var(--fg)');
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
    const topX = l.left + 5.5 - r.left;
    const topY = l.top - r.top;
    const style = getComputedStyle(root);
    trackW = Number.parseFloat(style.getPropertyValue('--track-w')) || 4;
    const radius = Number.parseFloat(style.getPropertyValue('--track-r')) || 16;
    const end = footNode();
    const endY = end ? centre(end, r).y : l.bottom - r.top;
    const corners = route(e, topX, topY, endY, radius);
    path = sampleRoute(corners, radius);
    const barY = endY - 12;
    const barS = yToS(path, barY);
    clipShape.setAttribute('d', outline(path, trackW, barS));
    base.setAttribute('d', slice(path.points, 0, path.connectorS));
    svg.style.setProperty('--wire-w', `${trackW}px`);
    const hereR = trackW / 2 + 3;
    for (const c of [halo, ring]) c.setAttribute('r', String(hereR));
    nodes = [...list.querySelectorAll<HTMLElement>('.entry:not([hidden])')].flatMap((entry) => {
      const node = entry.querySelector('.node');
      return node ? [{ entry, y: centre(node, r).y, hue: entry.dataset.postHue ?? 'amarillo' }] : [];
    });
    reachS = 0;
    lit.removeAttribute('d');
    ahead.removeAttribute('d');
    render();
    return { top: r.top + scrollY, start: e.y, end: endY, nodes: nodes.map(({ entry, y }) => ({ entry, y })) };
  };

  return {
    layout,
    reach(y) {
      const next = yToS(path, y);
      if (next <= reachS) return;
      reachS = next;
      render();
    },
    here(y, hue) {
      const p = pointAtY(path, y);
      for (const c of [halo, ring]) { c.setAttribute('cx', p.x.toFixed(1)); c.setAttribute('cy', p.y.toFixed(1)); }
      mark.style.setProperty('--here', `var(--hl-${hue})`);
      mark.removeAttribute('visibility');
    },
    preview(entry) {
      const n = entry ? nodes.find((x) => x.entry === entry) : undefined;
      if (!n) { lit.removeAttribute('d'); ahead.removeAttribute('d'); return; }
      svg.style.setProperty('--trail', `var(--hl-${n.hue})`);
      const to = yToS(path, n.y);
      draw(lit, slice(path.points, 0, Math.min(to, reachS)));
      draw(ahead, slice(path.points, Math.min(reachS, to), to));
    },
    destroy() { svg.remove(); },
  };
}
