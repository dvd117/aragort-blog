// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { currentIndex, mountTravel, pointAt, polyline, sections, slice } from '../src/scripts/travel';

const rect = (x: number, y: number, w: number, h: number) =>
  ({ x, y, left: x, top: y, right: x + w, bottom: y + h, width: w, height: h, toJSON: () => ({}) }) as DOMRect;
const box = (e: Element, x: number, y: number, w: number, h: number) =>
  Object.defineProperty(e, 'getBoundingClientRect', { configurable: true, value: () => rect(x, y, w, h) });

describe('geometry', () => {
  const poly = polyline({ x: 305, y: 100 }, { x: 5.5, y: 200 }, 1200);

  it('runs from the exit node to the top of the list, then straight down', () => {
    expect(poly).toEqual([{ x: 305, y: 100 }, { x: 5.5, y: 200 }, { x: 5.5, y: 1200 }]);
  });
  it('drops the exit when it sits below the top of the list', () => {
    expect(polyline({ x: 305, y: 250 }, { x: 5.5, y: 200 }, 1200)).toEqual([{ x: 5.5, y: 200 }, { x: 5.5, y: 1200 }]);
  });
  it('finds the point at a height, along the diagonal wire too', () => {
    expect(pointAt(poly, 150)).toEqual({ x: 155.25, y: 150 });
    expect(pointAt(poly, 700)).toEqual({ x: 5.5, y: 700 });
    expect(pointAt(poly, 50)).toEqual({ x: 305, y: 100 });
    expect(pointAt(poly, 5000)).toEqual({ x: 5.5, y: 1200 });
  });
  it('slices the thread between two heights, corners included', () => {
    expect(slice(poly, 100, 300)).toBe('M305.0 100.0L5.5 200.0L5.5 300.0');
    expect(slice(poly, 300, 300)).toBe('');
  });
  it('gives each section the hue of the entry it leads to, and cuts at reach', () => {
    const s = sections(poly, [{ y: 300, hue: 'amarillo' }, { y: 600, hue: 'azul' }, { y: 900, hue: 'rojo' }], 650);
    expect(s.map((x) => x.hue)).toEqual(['amarillo', 'azul', 'rojo', null]);
    expect(s[0]!.d).toBe('M305.0 100.0L5.5 200.0L5.5 300.0');
    expect(s[1]!.d).toBe('M5.5 300.0L5.5 600.0');
    expect(s[2]!.d).toBe('M5.5 600.0L5.5 650.0');
    expect(s[3]!.d).toBe('');
  });
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
  box(document.getElementById('exit')!, 300, 95, 10, 10); // centre (305, 100)
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
  it('measures the thread from the exit node to the footer mark', () => {
    const { travel, entries } = build();
    const g = travel.layout();
    expect(g.start).toBe(100);
    expect(g.end).toBe(1200);
    expect(g.nodes.map((n) => n.y)).toEqual([300, 600, 900]);
    expect(g.nodes[0]!.entry).toBe(entries[0]);
  });

  it('fills down to reach in section hues and never pulls back', () => {
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
    expect(root.querySelector('.lit:not(.ahead)')!.getAttribute('d')).toBe('M305.0 100.0L5.5 200.0L5.5 400.0');
    expect(root.querySelector('.lit.ahead')!.getAttribute('d')).toBe('M5.5 400.0L5.5 900.0');
    expect(fills()[1]!.getAttribute('d')).toBe('M5.5 300.0L5.5 400.0');
    travel.preview(null);
    expect(root.querySelector('.lit.ahead')!.hasAttribute('d')).toBe(false);
  });

  it('puts the here-ring on the thread in the current hue', () => {
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
