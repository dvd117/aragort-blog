/**
 * The net, alive (DESIGN.md, "Motion"). Every .net on the page drifts in 3D: each node
 * has a fixed depth, the net turns a few degrees, and a gentle perspective moves near
 * nodes more than far ones. On top of the drift each node hangs on a spring, so every
 * force moves it with inertia:
 * - gravity: the cursor (desktop) or a finger on the net (phone) pulls nearby nodes in;
 * - a click or a tap sends a ring outward from that point, and the nodes spring back;
 * - on a phone, scrolling swings the net against its motion (near nodes more), then it settles.
 * Nets with data-respond (hero, portrait) also glow under the cursor, and the first page
 * of a session opens with one pulse from the net's lit node. One rAF loop per page at 30fps,
 * stopped off screen, in a hidden tab and under reduced motion. On posts the amplitude
 * is halved and the net holds still while you scroll.
 */
import { reduced } from './motion';

type Pt = [number, number];
interface Live {
  svg: SVGSVGElement; w: number; h: number;
  base: Pt[]; rest: Pt[]; z: number[];
  pos: Pt[]; vel: Pt[];
  circles: SVGCircleElement[];
  lines: { el: SVGLineElement; a: number; b: number }[];
  adj: number[][];
  pinned: Set<number>; responsive: boolean; visible: boolean;
}

const FRAME = 1000 / 30;
const PERIOD_A = 19000, PERIOD_B = 23000;
const MAX_DEG = 2.5, TILT_DEG = 1;
// Springs, per 30fps frame: a little overshoot, settled in about a second.
const K = 0.16, DAMP = 0.26;
// Gravity: nodes within PULL_R px lean toward the pointer, up to PULL_MAX px.
const PULL_R = 160, PULL_MAX = 20;
// The ring: pushes nodes within RING_R px outward, travelling at RING_SPEED px/ms.
const RING_R = 280, RING_KICK = 9, RING_SPEED = 0.9;
// Scroll swing (phone): px of kick per px scrolled, and its cap per frame.
const SWING = 0.05, SWING_MAX = 6;
// Nothing strays further than this from where the drift puts it.
const MAX_OFF = 30;
// Forces are sized for the hero; a smaller net gets them in proportion to its width
// (a 38px mark about 1/11 of the pull), with a floor so it still answers a little.
const REF_W = 420, MIN_SIZE = 0.09;
const sizeOf = (n: Live, px: number) => Math.min(1, Math.max(MIN_SIZE, (n.w * px) / REF_W));
const SESSION_KEY = 'aragort-net-pulsed';
const rad = (d: number) => (d * Math.PI) / 180;
const depth = (i: number) => ((Math.imul(i + 1, 2654435761) >>> 0) % 1000) / 500 - 1;

const nets: Live[] = [];
let amp = 1, onPost = false;
let tiltX = 0, tiltY = 0, targetX = 0, targetY = 0;
let clock = 0, last = 0, lastScroll = -Infinity, scheduled = false;
let pointer: { x: number; y: number } | null = null;
const kicks: { n: Live; i: number; at: number; v: Pt }[] = [];
const timers = new Map<Element, number>();

function angles(t: number): [number, number] {
  return [
    rad(Math.sin((t / PERIOD_A) * 2 * Math.PI) * MAX_DEG * amp + tiltX),
    rad(Math.cos((t / PERIOD_B) * 2 * Math.PI) * MAX_DEG * 0.6 * amp + tiltY),
  ];
}

/** Perspective projection of one net at angles (a, b), in viewBox units. */
function project(n: Live, a: number, b: number): Pt[] {
  const cx = n.w / 2, cy = n.h / 2, span = Math.max(n.w, n.h), D = span * 3, Z = span * 0.35;
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
  return n.base.map(([x0, y0], i) => {
    const x = x0 - cx, y = y0 - cy, z = n.z[i]! * Z;
    const x1 = x * ca + z * sa, z1 = -x * sa + z * ca;
    const y1 = y * cb - z1 * sb, z2 = y * sb + z1 * cb;
    const f = D / (D - z2);
    return [cx + x1 * f, cy + y1 * f];
  });
}

/** Base positions plus the drift, so at rest (angles 0) every node is exactly where it was drawn. */
function positions(n: Live, t: number): Pt[] {
  const [a, b] = angles(t);
  return project(n, a, b).map(([x, y], i) =>
    n.pinned.has(i) ? n.base[i]! : [n.base[i]![0] + x - n.rest[i]![0], n.base[i]![1] + y - n.rest[i]![1]]);
}

function draw(n: Live, pts: Pt[]): void {
  n.circles.forEach((c, i) => { c.setAttribute('cx', pts[i]![0].toFixed(1)); c.setAttribute('cy', pts[i]![1].toFixed(1)); });
  for (const l of n.lines) {
    const p = pts[l.a]!, q = pts[l.b]!;
    l.el.setAttribute('x1', p[0].toFixed(1)); l.el.setAttribute('y1', p[1].toFixed(1));
    l.el.setAttribute('x2', q[0].toFixed(1)); l.el.setAttribute('y2', q[1].toFixed(1));
  }
}

/** Screen px per viewBox unit, and the inverse screen transform. */
function scale(n: Live): { px: number; inv: DOMMatrix } | null {
  const m = n.svg.getScreenCTM();
  return m ? { px: Math.hypot(m.a, m.b) || 1, inv: m.inverse() } : null;
}

function register(svg: SVGSVGElement): Live {
  const vb = svg.viewBox.baseVal;
  const circles = [...svg.querySelectorAll<SVGCircleElement>('circle')];
  const base = circles.map((c) => [Number(c.getAttribute('cx')), Number(c.getAttribute('cy'))] as Pt);
  const lines = [...svg.querySelectorAll<SVGLineElement>('line')].map((el) => ({ el, a: Number(el.dataset.a), b: Number(el.dataset.b) }));
  const adj: number[][] = base.map(() => []);
  for (const { a, b } of lines) { adj[a]?.push(b); adj[b]?.push(a); }
  const n: Live = {
    svg, w: vb.width, h: vb.height, base, rest: [], z: base.map((_, i) => depth(i)),
    pos: base.map(([x, y]) => [x, y]), vel: base.map(() => [0, 0]),
    circles, lines, adj,
    pinned: new Set((svg.dataset.pin ?? '').split(',').filter(Boolean).map(Number)),
    responsive: svg.hasAttribute('data-respond'), visible: false,
  };
  n.rest = project(n, 0, 0);
  nets.push(n);
  return n;
}

const shouldRun = () => !reduced() && !document.hidden && nets.some((n) => n.visible);
function schedule(): void { if (!scheduled) { scheduled = true; requestAnimationFrame(frame); } }

/** One spring step for one net: pull toward the drift target plus the pointer's gravity. */
function step(n: Live, target: Pt[], now: number): void {
  const s = pointer ? scale(n) : null;
  const p = s && pointer ? new DOMPoint(pointer.x, pointer.y).matrixTransform(s.inv) : null;
  const px = s?.px ?? scale(n)?.px ?? 1, f = sizeOf(n, px);
  const R = (PULL_R * Math.max(f, 0.3)) / px, maxPull = (PULL_MAX * amp * f) / px, cap = (MAX_OFF * f) / px;
  for (let i = 0; i < n.pos.length; i++) {
    if (n.pinned.has(i)) { n.pos[i] = [...n.base[i]!]; n.vel[i] = [0, 0]; continue; }
    let [tx, ty] = target[i]!;
    const [x, y] = n.pos[i]!;
    if (p) {
      const dx = p.x - x, dy = p.y - y, d = Math.hypot(dx, dy);
      if (d > 0.01 && d < R) { const f = Math.min(d, maxPull * (1 - d / R) ** 2) / d; tx += dx * f; ty += dy * f; }
    }
    const v = n.vel[i]!;
    v[0] += K * (tx - x) - DAMP * v[0];
    v[1] += K * (ty - y) - DAMP * v[1];
    let nx = x + v[0], ny = y + v[1];
    const ox = nx - target[i]![0], oy = ny - target[i]![1], o = Math.hypot(ox, oy);
    if (o > cap) { nx = target[i]![0] + (ox * cap) / o; ny = target[i]![1] + (oy * cap) / o; }
    n.pos[i] = [nx, ny];
  }
  // Ring kicks whose moment has come.
  for (let k = kicks.length - 1; k >= 0; k--) {
    const kick = kicks[k]!;
    if (kick.n !== n || kick.at > now) continue;
    const v = n.vel[kick.i]!; v[0] += kick.v[0]; v[1] += kick.v[1];
    kicks.splice(k, 1);
  }
}

function frame(now: number): void {
  scheduled = false;
  if (!shouldRun()) {
    if (reduced()) nets.forEach((n) => { n.pos = n.base.map(([x, y]) => [x, y]); n.vel = n.base.map(() => [0, 0]); draw(n, n.base); });
    kicks.length = 0;
    return;
  }
  schedule();
  if (now - last < FRAME) return;
  const dt = Math.min(100, now - last);
  last = now;
  const frozen = onPost && now - lastScroll < 400;
  if (!frozen) clock += dt;
  tiltX += (targetX - tiltX) * 0.08;
  tiltY += (targetY - tiltY) * 0.08;
  for (const n of nets) {
    if (!n.visible || frozen) continue;
    const target = positions(n, clock);
    step(n, target, now);
    draw(n, n.pos);
  }
}

/** Light a node and its wires in the ruling hue; the glow fades on its own (CSS, 600ms). */
function glow(n: Live, i: number): void {
  const els = [n.circles[i], ...n.lines.filter((l) => l.a === i || l.b === i).map((l) => l.el)];
  for (const el of els) {
    if (!el) continue;
    el.classList.add('glow');
    clearTimeout(timers.get(el));
    timers.set(el, window.setTimeout(() => el.classList.remove('glow'), 160));
  }
}

/** A pulse of light: the node, then its neighbours, two more hops out, 90ms apart. */
function pulse(n: Live, start: number, hops = 3): void {
  let ring = [start];
  const seen = new Set(ring);
  for (let h = 0; h <= hops && ring.length; h++) {
    const now = ring;
    setTimeout(() => now.forEach((i) => glow(n, i)), h * 90);
    ring = now.flatMap((i) => n.adj[i]!).filter((j) => !seen.has(j) && (seen.add(j), true));
  }
}

/** A ring of motion from a screen point: nodes are pushed outward as it reaches them. */
function ring(x: number, y: number): void {
  const now = performance.now();
  for (const n of nets) {
    if (!n.visible) continue;
    const s = scale(n);
    if (!s) continue;
    const p = new DOMPoint(x, y).matrixTransform(s.inv);
    n.pos.forEach(([nx, ny], i) => {
      if (n.pinned.has(i)) return;
      const f = sizeOf(n, s.px), R = RING_R * Math.max(f, 0.3);
      const dx = nx - p.x, dy = ny - p.y, d = Math.hypot(dx, dy) * s.px;
      if (d >= R || d < 0.5) return;
      const kick = (RING_KICK * amp * f * (1 - d / R)) / s.px;
      kicks.push({ n, i, at: now + d / RING_SPEED, v: [(dx / Math.hypot(dx, dy)) * kick, (dy / Math.hypot(dx, dy)) * kick] });
    });
  }
  schedule();
}

/** The node nearest a screen point, within maxPx, or -1. */
function nearest(n: Live, x: number, y: number, maxPx: number): number {
  const m = n.svg.getScreenCTM();
  if (!m) return -1;
  const p = new DOMPoint(x, y).matrixTransform(m.inverse());
  let best = -1, bd = (maxPx / m.a) ** 2;
  n.circles.forEach((c, i) => {
    const dx = Number(c.getAttribute('cx')) - p.x, dy = Number(c.getAttribute('cy')) - p.y, d = dx * dx + dy * dy;
    if (d < bd) { bd = d; best = i; }
  });
  return best;
}

/** Is a screen point on (or within reach of) any visible net? */
const nearNet = (x: number, y: number, pad: number) => nets.some((n) => {
  if (!n.visible) return false;
  const r = n.svg.getBoundingClientRect();
  return x > r.left - pad && x < r.right + pad && y > r.top - pad && y < r.bottom + pad;
});

export function initNetLive(): void {
  onPost = !!document.querySelector('.post');
  amp = onPost ? 0.5 : 1;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) { const n = nets.find((x) => x.svg === e.target); if (n) n.visible = e.isIntersecting; }
    schedule();
  });
  document.querySelectorAll<SVGSVGElement>('svg.net').forEach((svg) => io.observe(register(svg).svg));

  const fine = matchMedia('(pointer: fine)');
  // Desktop: the cursor tilts the net, pulls nodes in, and lights the nearest one.
  addEventListener('pointermove', (e) => {
    if (reduced()) return;
    if (e.pointerType === 'mouse') {
      targetX = ((e.clientX / innerWidth) - 0.5) * 2 * TILT_DEG;
      targetY = -((e.clientY / innerHeight) - 0.5) * 2 * TILT_DEG;
      pointer = { x: e.clientX, y: e.clientY };
      for (const n of nets) if (n.responsive && n.visible) { const i = nearest(n, e.clientX, e.clientY, 36); if (i !== -1) glow(n, i); }
    } else if (pointer) pointer = { x: e.clientX, y: e.clientY }; // a finger held on the net
    schedule();
  }, { passive: true });
  document.addEventListener('pointerleave', () => { pointer = null; schedule(); });
  document.documentElement.addEventListener('mouseleave', () => { pointer = null; schedule(); });

  // A click or a tap sends a ring; a finger on the net pulls it like the cursor does.
  let down: { x: number; y: number; t: number } | null = null;
  addEventListener('pointerdown', (e) => {
    if (reduced() || !nearNet(e.clientX, e.clientY, 40)) return;
    if (e.pointerType === 'mouse') { ring(e.clientX, e.clientY); return; }
    down = { x: e.clientX, y: e.clientY, t: performance.now() };
    pointer = { x: e.clientX, y: e.clientY };
    schedule();
  }, { passive: true });
  const release = (e: PointerEvent) => {
    if (e.pointerType === 'mouse') return;
    if (down && performance.now() - down.t < 300 && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 10) ring(e.clientX, e.clientY);
    down = null; pointer = null; schedule();
  };
  addEventListener('pointerup', release, { passive: true });
  addEventListener('pointercancel', (e) => { if (e.pointerType !== 'mouse') { down = null; pointer = null; schedule(); } }, { passive: true });

  // Phone: scroll tilts the net and swings it against the motion, with inertia.
  let lastY = scrollY;
  addEventListener('scroll', () => {
    lastScroll = performance.now();
    const dy = scrollY - lastY; lastY = scrollY;
    if (!fine.matches && !onPost && !reduced()) {
      targetY = Math.sin(scrollY / 500) * TILT_DEG;
      const kick = Math.max(-SWING_MAX, Math.min(SWING_MAX, dy * SWING));
      for (const n of nets) {
        if (!n.visible) continue;
        const px = scale(n)?.px ?? 1, f = sizeOf(n, px);
        n.vel.forEach((v, i) => { if (!n.pinned.has(i)) v[1] += (kick * f * (1 + n.z[i]! * 0.5)) / px; });
      }
    }
    schedule();
  }, { passive: true });
  document.addEventListener('visibilitychange', schedule);
  document.addEventListener('ajustes:change', schedule);

  // One pulse of light from the net's lit node on the first page of a session.
  let pulsed = true;
  try { pulsed = sessionStorage.getItem(SESSION_KEY) === '1'; sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* storage off: skip it */ }
  if (!pulsed && !reduced()) {
    const target = nets.find((n) => n.responsive) ?? nets.find((n) => n.svg.closest('.site'));
    const lit = target?.circles.findIndex((c) => c.classList.contains('on')) ?? -1;
    if (target && lit !== -1) setTimeout(() => pulse(target, lit), 350);
  }
  schedule();
}
