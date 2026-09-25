// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  currentIndex,
  mountTravel,
  pointAtS,
  pointAtY,
  route,
  sampleRoute,
  sections,
  slice,
  yToS,
} from '../src/scripts/travel';

const rect = (x: number, y: number, w: number, h: number) =>
  ({ x, y, left: x, top: y, right: x + w, bottom: y + h, width: w, height: h, toJSON: () => ({}) }) as DOMRect;
const box = (e: Element, x: number, y: number, w: number, h: number) =>
  Object.defineProperty(e, 'getBoundingClientRect', { configurable: true, value: () => rect(x, y, w, h) });
const distance = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);

describe('corner route', () => {
  it('uses the single diagonal and final vertical when dx <= D', () => {
    expect(route({ x: 100, y: 20 }, 10, 120, 500, 16)).toEqual([
      { x: 100, y: 20 }, { x: 10, y: 110 }, { x: 10, y: 500 },
    ]);
  });

  it('uses equal diagonal drops around a horizontal when dx > D', () => {
    expect(route({ x: 200, y: 0 }, 0, 100, 500, 16)).toEqual([
      { x: 200, y: 0 }, { x: 160, y: 40 }, { x: 40, y: 40 }, { x: 0, y: 80 }, { x: 0, y: 500 },
    ]);
  });

  it('drops an exit that is already below the list top', () => {
    expect(route({ x: 200, y: 200 }, 10, 100, 500, 16)).toEqual([
      { x: 10, y: 100 }, { x: 10, y: 500 },
    ]);
  });

  it('keeps offsets below one pixel as a vertical route', () => {
    expect(route({ x: 5.99, y: 10 }, 5.5, 100, 500, 16)).toEqual([
      { x: 5.99, y: 10 }, { x: 5.99, y: 500 },
    ]);
  });

  it('uses only horizontal, vertical, or 45-degree segments and never rises', () => {
    const routes = [
      route({ x: 100, y: 20 }, 10, 120, 500, 16),
      route({ x: 200, y: 0 }, 0, 100, 500, 16),
      route({ x: 200, y: 200 }, 10, 100, 500, 16),
      route({ x: 5.99, y: 10 }, 5.5, 100, 500, 16),
    ];
    for (const points of routes) for (let i = 1; i < points.length; i++) {
      const a = points[i - 1]!, b = points[i]!;
      const dx = Math.abs(b.x - a.x), dy = b.y - a.y;
      expect(dy).toBeGreaterThanOrEqual(0);
      expect(dx < 1e-6 || dy < 1e-6 || Math.abs(dx - dy) < 1e-6).toBe(true);
    }
  });
});

describe('rounded route samples', () => {
  it('samples a constant-radius quarter turn within the chord-error limit and keeps analytic length', () => {
    const path = sampleRoute([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 100 }], 10);
    const arc = path.points.filter((p) => p.arcCenter);
    expect(arc.length).toBeGreaterThan(2);
    for (const p of arc) expect(distance(p, p.arcCenter!)).toBeCloseTo(10, 2);
    for (let i = 1; i < arc.length; i++) {
      const a = arc[i - 1]!, b = arc[i]!;
      const theta = Math.acos(Math.min(1, ((a.x - pCenter(arc)!.x) * (b.x - pCenter(arc)!.x) + (a.y - pCenter(arc)!.y) * (b.y - pCenter(arc)!.y)) / 100));
      expect(10 * (1 - Math.cos(theta / 2))).toBeLessThanOrEqual(0.25);
    }
    expect(path.length).toBeCloseTo(90 + 10 * Math.PI / 2 + 90, 1);
    expect(path.points.map((p) => p.s)).toEqual([...path.points.map((p) => p.s)].sort((a, b) => a - b));
  });

  it('maps reading-line y continuously to monotone arc length and locates the final vertical', () => {
    const path = sampleRoute(route({ x: 200, y: 0 }, 0, 100, 500, 16), 16);
    const startY = path.points[0]!.y;
    expect(pointAtY(path, path.verticalY)).toEqual(pointAtS(path.points, path.connectorS));
    expect(pointAtY(path, path.verticalY)!.y).toBeCloseTo(path.verticalY, 6);
    expect(yToS(path, path.verticalY)).toBeCloseTo(path.connectorS, 8);
    expect(yToS(path, path.verticalY + 0.0001) - path.connectorS).toBeCloseTo(0.0001, 6);
    expect(path.connectorS - yToS(path, path.verticalY - 0.0001)).toBeGreaterThan(0);
    let last = yToS(path, startY);
    for (let y = startY + 1; y <= 500; y++) {
      const next = yToS(path, y);
      expect(next).toBeGreaterThanOrEqual(last);
      last = next;
    }
  });

  it('keeps rounded points when a slice crosses a bend', () => {
    const path = sampleRoute(route({ x: 200, y: 0 }, 0, 100, 500, 16), 16);
    const arc = path.points.filter((p) => p.arcCenter);
    const d = slice(path.points, arc[0]!.s - 1, arc.at(-1)!.s + 1);
    expect((d.match(/L/g) ?? []).length).toBeGreaterThan(2);
  });

  it('assigns entry hues by arc length and cuts sections at the reached distance', () => {
    const path = sampleRoute([{ x: 5.5, y: 100 }, { x: 5.5, y: 1200 }], 16);
    const s = sections(path.points, [{ s: 200, hue: 'amarillo' }, { s: 500, hue: 'azul' }, { s: 800, hue: 'rojo' }], 550);
    expect(s.map((x) => x.hue)).toEqual(['amarillo', 'azul', 'rojo', null]);
    expect(s.map((x) => x.d)).toEqual([
      'M5.5 100.0L5.5 300.0', 'M5.5 300.0L5.5 600.0', 'M5.5 600.0L5.5 650.0', '',
    ]);
  });
});

const pCenter = (arc: Array<{ arcCenter?: { x: number; y: number } }>) => arc[0]?.arcCenter;

describe('other travel helpers', () => {
  it('picks the last node at or above the line, else the first', () => {
    expect(currentIndex([300, 600, 900], 100)).toBe(0);
    expect(currentIndex([300, 600, 900], 600)).toBe(1);
    expect(currentIndex([300, 600, 900], Infinity)).toBe(2);
    expect(currentIndex([], 500)).toBe(-1);
  });
});

function build(hideSecond = false) {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubGlobal('scrollY', 0);
  document.body.innerHTML = `
    <div class="index">
      <svg><circle id="exit"></circle></svg>
      <ol class="entries" data-thread>
        <li class="entry" data-post-hue="amarillo"><p class="d"><span class="node"></span></p></li>
        <li class="entry" data-post-hue="azul"${hideSecond ? ' hidden' : ''}><p class="d"><span class="node"></span></p></li>
        <li class="entry" data-post-hue="rojo"><p class="d"><span class="node"></span></p></li>
      </ol>
    </div>
    <footer class="site-foot"><svg class="net"><circle id="f1"></circle><circle id="f2"></circle></svg></footer>`;
  const root = document.querySelector<HTMLElement>('.index')!;
  const list = document.querySelector<HTMLElement>('[data-thread]')!;
  box(root, 0, 0, 1000, 1100);
  box(document.getElementById('exit')!, 20, 95, 10, 10); // centre (25, 100)
  box(list, 0, 200, 800, 900); // thread at x 5.5, from y 200
  document.querySelectorAll('.node').forEach((n, i) => box(n, 0, 300 * (i + 1) - 6, 12, 12)); // 300, 600, 900
  box(document.getElementById('f1')!, 0, 1198, 4, 4); // top-left node: centre y 1200
  box(document.getElementById('f2')!, 20, 1210, 4, 4);
  const travel = mountTravel(root, list, document.getElementById('exit') as unknown as SVGCircleElement, document.querySelector('.site-foot .net'));
  const fills = () => [...root.querySelectorAll('svg.wire .fill path')];
  return { root, travel, fills, entries: [...document.querySelectorAll<HTMLElement>('.entry')] };
}

afterEach(() => { vi.unstubAllGlobals(); document.body.innerHTML = ''; });

describe('mountTravel', () => {
  it('keeps the geometry shape and measures nodes from the exit to the footer mark', () => {
    const { travel, entries } = build();
    const g = travel.layout();
    expect(Object.keys(g)).toEqual(['top', 'start', 'end', 'nodes']);
    expect(g.start).toBe(100);
    expect(g.end).toBe(1200);
    expect(g.nodes.map((n) => n.y)).toEqual([300, 600, 900]);
    expect(g.nodes[0]!.entry).toBe(entries[0]);
  });

  it('clips the constant-width layers with exactly one user-space variable-width outline', () => {
    const { root, travel } = build();
    travel.layout();
    const clips = root.querySelectorAll('svg.wire clipPath');
    expect(clips).toHaveLength(1);
    expect(clips[0]!.getAttribute('clipPathUnits')).toBe('userSpaceOnUse');
    expect(clips[0]!.querySelector('path')!.getAttribute('d')).toContain('Z');
  });

  it('fills to the furthest reading-line distance in section hues without pulling back', () => {
    const { travel, fills } = build();
    travel.layout();
    travel.reach(650);
    travel.reach(400);
    const f = fills();
    expect(f).toHaveLength(4);
    expect(f[2]!.getAttribute('d')).toBe('M5.5 600.0L5.5 650.0');
    expect((f[1] as SVGElement).style.getPropertyValue('--sec')).toBe('var(--hl-azul)');
    expect((f[3] as SVGElement).style.getPropertyValue('--sec')).toBe('var(--fg)');
    expect(f[3]!.hasAttribute('d')).toBe(false);
  });

  it('leaves hidden entries out of the thread', () => {
    const { travel, fills } = build(true);
    const g = travel.layout();
    expect(g.nodes.map((n) => n.y)).toEqual([300, 900]);
    expect((fills()[1] as SVGElement).style.getPropertyValue('--sec')).toBe('var(--hl-rojo)');
  });

  it('resets reach on layout', () => {
    const { travel, fills } = build();
    travel.layout();
    travel.reach(650);
    travel.layout();
    expect(fills().every((p) => !p.hasAttribute('d'))).toBe(true);
  });

  it('previews an entry below reach at half strength without moving reach', () => {
    const { root, travel, fills, entries } = build();
    travel.layout();
    travel.reach(400);
    travel.preview(entries[2]!);
    expect(root.querySelector('.lit:not(.ahead)')!.getAttribute('d')).toMatch(/L5\.5 400\.0$/);
    expect(root.querySelector('.lit:not(.ahead)')!.getAttribute('d')!.match(/L/g)!.length).toBeGreaterThan(2);
    expect(root.querySelector('.lit.ahead')!.getAttribute('d')).toBe('M5.5 400.0L5.5 900.0');
    expect(fills()[1]!.getAttribute('d')).toBe('M5.5 300.0L5.5 400.0');
    travel.preview(null);
    expect(root.querySelector('.lit.ahead')!.hasAttribute('d')).toBe(false);
  });

  it('puts the here-ring on the mapped thread in the current hue', () => {
    const { root, travel } = build();
    travel.layout();
    travel.here(450, 'rojo');
    const ring = root.querySelector('.here .ring')!;
    expect(ring.getAttribute('cx')).toBe('5.5');
    expect(ring.getAttribute('cy')).toBe('450.0');
    expect((root.querySelector('.here') as SVGElement).style.getPropertyValue('--here')).toBe('var(--hl-rojo)');
  });

  it('removes its svg on destroy', () => {
    const { root, travel } = build();
    travel.destroy();
    expect(root.querySelector('svg.wire')).toBeNull();
  });
});
