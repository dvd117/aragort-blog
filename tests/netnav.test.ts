// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { mountNetNav } from '../src/scripts/netnav';

const rect = (x: number, y: number, w: number, h: number) =>
  ({ x, y, left: x, top: y, right: x + w, bottom: y + h, width: w, height: h, toJSON: () => ({}) }) as DOMRect;
const box = (e: Element, x: number, y: number, w: number, h: number) =>
  Object.defineProperty(e, 'getBoundingClientRect', { configurable: true, value: () => rect(x, y, w, h) });

/** Hero net: circle 0 is the exit; entries' regions are nodes 1, 2, 3 (each wired to 0). */
function build({ scroll = 0, height = 3000 } = {}) {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0; });
  vi.stubGlobal('innerHeight', 800); // reading line at 520 + scrollY
  vi.stubGlobal('scrollY', scroll);
  Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: height });
  document.body.innerHTML = `
    <div class="index" data-netnav-root>
      <div class="net-wrap" data-netnav data-exit="0"><svg>
        <circle></circle><circle></circle><circle></circle><circle></circle>
        <line data-a="0" data-b="1"></line><line data-a="0" data-b="2"></line><line data-a="0" data-b="3"></line>
      </svg></div>
      <ol class="entries" data-thread>
        <li class="entry" data-post-hue="amarillo" data-region="0,1"><p class="d"><span class="node"></span></p><a class="more" href="#">Leer</a></li>
        <li class="entry" data-post-hue="azul" data-region="0,2"><p class="d"><span class="node"></span></p><a class="more" href="#">Leer</a></li>
        <li class="entry" data-post-hue="rojo" data-region="0,3"><p class="d"><span class="node"></span></p><a class="more" href="#">Leer</a></li>
      </ol>
    </div>
    <footer class="site-foot"><svg class="net"><circle id="f1"></circle></svg></footer>`;
  // Rects are viewport-relative: at mount they are shifted up by the scroll, so the root
  // always sits at document y 0 and every root-relative y below holds whatever the scroll.
  const o = -scroll;
  box(document.querySelector('.index')!, 0, o, 1000, 1100);
  box(document.querySelector('[data-netnav] circle')!, 300, o + 95, 10, 10);
  box(document.querySelector('[data-thread]')!, 0, o + 200, 800, 900);
  document.querySelectorAll('.node').forEach((n, i) => box(n, 0, o + 300 * (i + 1) - 6, 12, 12));
  box(document.getElementById('f1')!, 0, o + 1198, 4, 4);
  const entries = [...document.querySelectorAll<HTMLElement>('.entry')];
  const circles = [...document.querySelectorAll<SVGCircleElement>('[data-netnav] circle')];
  const scrollTo = (y: number) => { vi.stubGlobal('scrollY', y); window.dispatchEvent(new Event('scroll')); };
  return { entries, circles, scrollTo, dispose: mountNetNav() };
}

const fills = () => [...document.querySelectorAll('svg.wire .fill path')].map((p) => p.getAttribute('d') ?? '');
const current = () => [...document.querySelectorAll('.entry.is-current')];

afterEach(() => { vi.unstubAllGlobals(); document.body.innerHTML = ''; });

it('passes the first node at the top of the page and makes it current', () => {
  const { entries, circles } = build();
  expect(current()).toEqual([entries[0]]);
  expect(entries[0]!.querySelector('.node')!.classList.contains('pulse')).toBe(true);
  expect(circles[1]!.classList.contains('path')).toBe(true);
  expect(circles[2]!.classList.contains('path')).toBe(false);
});

it('travels down: passes the next node, lights its region, moves current', () => {
  const { entries, circles, scrollTo } = build();
  scrollTo(200); // line 720
  expect(current()).toEqual([entries[1]]);
  expect(circles[2]!.classList.contains('path')).toBe(true);
  expect(fills()[2]).toBe('M5.5 600.0L5.5 720.0');
});

it('holds the fill when scrolling back up, but current follows', () => {
  const { entries, scrollTo } = build();
  scrollTo(200);
  scrollTo(0);
  expect(current()).toEqual([entries[0]]);
  expect(fills()[2]).toBe('M5.5 600.0L5.5 720.0');
});

it('opens mid-page with everything above the reading line already passed', () => {
  const { entries } = build({ scroll: 500 }); // line 1020
  expect(entries.every((e) => e.querySelector('.node')!.classList.contains('pulse'))).toBe(true);
  expect(current()).toEqual([entries[2]]);
});

it('counts the page bottom as reaching the end, even on a short page', () => {
  const { entries, scrollTo } = build({ height: 900 });
  scrollTo(100); // bottom: 100 + 800 >= 899; line only 620
  expect(entries[2]!.querySelector('.node')!.classList.contains('pulse')).toBe(true);
  expect(current()).toEqual([entries[2]]);
  expect(document.querySelector('.site-foot .net')!.classList.contains('pulse')).toBe(true);
  expect(fills().at(-1)).toBe('M5.5 900.0L5.5 1200.0');
});

it('hover lights a region and previews, but never passes a node', () => {
  const { entries, circles } = build();
  entries[2]!.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
  expect(circles[3]!.classList.contains('path')).toBe(true);
  expect(entries[2]!.querySelector('.node')!.classList.contains('pulse')).toBe(false);
  expect(document.querySelector('.lit.ahead')!.getAttribute('d')).toBe('M5.5 520.0L5.5 900.0');
  expect(fills()[2]).toBe(''); // the line is at 520: section 2 (600 -> 900) has not started
  expect(fills()[1]).toBe('M5.5 300.0L5.5 520.0');
});

it('re-measures when Buscar filters, keeping what was already lit', () => {
  const { entries, circles, scrollTo } = build();
  scrollTo(200);
  entries[1]!.hidden = true;
  document.querySelector('[data-thread]')!.dispatchEvent(new CustomEvent('thread:filter'));
  expect(fills()).toHaveLength(3); // two visible entries + tail
  expect(circles[2]!.classList.contains('path')).toBe(true);
  expect(current()).toEqual([entries[0]]);
});

it('cleans up on dispose', () => {
  const { dispose } = build();
  dispose();
  expect(document.querySelector('svg.wire')).toBeNull();
  expect(current()).toEqual([]);
});
