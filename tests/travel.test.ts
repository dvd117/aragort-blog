// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  mountTravel,
  pointAtS,
  pointAtY,
  route,
  sampleRoute,
  slice,
  yToS,
} from '../src/scripts/travel';

const indexCss = readFileSync('src/styles/index.css', 'utf8');

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

  it('never leaves a horizontal shorter than 4r: the diagonals shorten instead', () => {
    const points = route({ x: 121, y: 0 }, 0, 112, 500, 16);
    expect(points).toEqual([
      { x: 121, y: 0 }, { x: 92.5, y: 28.5 }, { x: 28.5, y: 28.5 }, { x: 0, y: 57 }, { x: 0, y: 500 },
    ]);
    expect(points[1]!.x - points[2]!.x).toBe(64);
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
      route({ x: 121, y: 0 }, 0, 112, 500, 16),
      route({ x: 70, y: 0 }, 0, 20, 500, 16),
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
});

const pCenter = (arc: Array<{ arcCenter?: { x: number; y: number } }>) => arc[0]?.arcCenter;

function build(hideSecond = false) {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubGlobal('scrollY', 0);
  document.body.innerHTML = `
    <div class="index">
      <svg><circle id="exit"></circle></svg>
      <ol class="entries" data-thread>
        <li class="entry" data-hue="amarillo"><p class="d"><span class="node"></span></p></li>
        <li class="entry" data-hue="azul"${hideSecond ? ' hidden' : ''}><p class="d"><span class="node"></span></p></li>
        <li class="entry" data-hue="rojo"><p class="d"><span class="node"></span></p></li>
      </ol>
    </div>
  `;
  const root = document.querySelector<HTMLElement>('.index')!;
  const list = document.querySelector<HTMLElement>('[data-thread]')!;
  box(root, 0, 0, 1000, 1100);
  box(document.getElementById('exit')!, 20, 95, 10, 10); // centre (25, 100)
  box(list, 0, 200, 800, 900); // thread at x 6, from y 200
  document.querySelectorAll('.node').forEach((n, i) => box(n, 0, 300 * (i + 1) - 6, 12, 12)); // 300, 600, 900
  const travel = mountTravel(root, list, document.getElementById('exit') as unknown as SVGCircleElement);
  const fills = () => [...root.querySelectorAll('svg.wire .fill path')];
  return { root, travel, fills, entries: [...document.querySelectorAll<HTMLElement>('.entry')] };
}

afterEach(() => { vi.unstubAllGlobals(); document.body.innerHTML = ''; });

describe('mountTravel', () => {
  it('draws the resting connector down to the pill cap above the first station', () => {
    const { root, travel } = build();
    travel.layout();
    expect(root.querySelector('.base')!.getAttribute('d')).toMatch(/L6\.0 294\.0$/);
  });

  it('keeps the geometry shape and measures nodes from the exit to the last station', () => {
    const { travel, entries } = build();
    const g = travel.layout();
    expect(Object.keys(g)).toEqual(['top', 'start', 'end', 'nodes']);
    expect(g.start).toBe(100);
    expect(g.end).toBe(900);
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

  it('fills hue bands to the nearest-station midpoint boundaries', () => {
    const { travel, fills } = build();
    travel.layout();
    travel.reach(650);
    travel.reach(400);
    const f = fills();
    expect(f).toHaveLength(3);
    expect(f.map((p) => p.getAttribute('data-hue'))).toEqual(['amarillo', 'azul', 'rojo']);
    expect(f.map((p) => p.getAttribute('d'))).toEqual([
      'M6.0 294.0L6.0 450.0',
      'M6.0 450.0L6.0 650.0',
      null,
    ]);
    expect(indexCss).toMatch(/\.wire \.fill-band\s*\{[^}]*stroke:\s*var\(--hue-ui\)/);
    expect(indexCss).not.toContain('--sec');
  });

  it('leaves hidden entries out of the thread', () => {
    const { travel, fills } = build(true);
    const g = travel.layout();
    expect(g.nodes.map((n) => n.y)).toEqual([300, 900]);
    expect(fills()).toHaveLength(2);
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
    expect(root.querySelector('.lit:not(.ahead)')!.getAttribute('d')).toMatch(/L6\.0 400\.0$/);
    expect(root.querySelector('.lit:not(.ahead)')!.getAttribute('d')!.match(/L/g)!.length).toBeGreaterThan(2);
    expect(root.querySelector('.lit.ahead')!.getAttribute('d')).toBe('M6.0 400.0L6.0 900.0');
    expect(fills()).toHaveLength(3);
    expect(fills()[0]!.getAttribute('d')).toBe('M6.0 294.0L6.0 400.0');
    expect(fills()[1]!.hasAttribute('d')).toBe(false);
    expect(indexCss).toMatch(/\.wire \.lit\s*\{[^}]*stroke:\s*var\(--fg\)/);
    expect(indexCss).toMatch(/\.wire \.lit\.ahead\s*\{\s*opacity:\s*\.5;?\s*\}/);
    expect(indexCss).not.toContain('--trail');
    travel.preview(null);
    expect(root.querySelector('.lit.ahead')!.hasAttribute('d')).toBe(false);
  });

  it('does not add a reading-line marker to the thread', () => {
    const { root, travel } = build();
    travel.layout();
    expect(root.querySelector('.here')).toBeNull();
  });

  it('removes its svg on destroy', () => {
    const { root, travel } = build();
    travel.destroy();
    expect(root.querySelector('svg.wire')).toBeNull();
  });
});
