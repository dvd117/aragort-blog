// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { mountNetNav } from '../src/scripts/netnav';

const rect = (x: number, y: number, w: number, h: number) =>
  ({ x, y, left: x, top: y, right: x + w, bottom: y + h, width: w, height: h, toJSON: () => ({}) }) as DOMRect;
const box = (e: Element, x: number, y: number, w: number, h: number) =>
  Object.defineProperty(e, 'getBoundingClientRect', { configurable: true, value: () => rect(x, y, w, h) });

/** Hero net: circle 0 is the exit; entries' regions are nodes 1, 2, 3 (each wired to 0). */
function build({ scroll = 0, height = 3000, stop = false } = {}) {
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
        <li class="entry" data-region="0,1"><p class="d"><span class="node"></span></p><a class="more" href="#">Leer</a></li>
        <li class="entry" data-region="0,2"><p class="d"><span class="node"></span></p><a class="more" href="#">Leer</a></li>
        <li class="entry" data-region="0,3"><p class="d"><span class="node"></span></p><a class="more" href="#">Leer</a></li>
      </ol>
      ${stop ? '<aside class="who"><span class="node"></span></aside>' : ''}
    </div>`;
  // Rects are viewport-relative: at mount they are shifted up by the scroll, so the root
  // always sits at document y 0 and every root-relative y below holds whatever the scroll.
  const o = -scroll;
  box(document.querySelector('.index')!, 0, o, 1000, 1100);
  box(document.querySelector('[data-netnav] circle')!, 300, o + 95, 10, 10);
  box(document.querySelector('[data-thread]')!, 0, o + 200, 800, 900);
  document.querySelectorAll('.entry .node').forEach((n, i) => box(n, 0, o + 300 * (i + 1) - 6, 12, 12));
  if (stop) box(document.querySelector('.who .node')!, 0, o + 1000 - 6, 12, 12);
  const entries = [...document.querySelectorAll<HTMLElement>('.entry')];
  const circles = [...document.querySelectorAll<SVGCircleElement>('[data-netnav] circle')];
  const scrollTo = (y: number) => { vi.stubGlobal('scrollY', y); window.dispatchEvent(new Event('scroll')); };
  return { entries, circles, scrollTo, dispose: mountNetNav() };
}

const fills = () => [...document.querySelectorAll('svg.wire .fill path')].map((p) => p.getAttribute('d') ?? '');
afterEach(() => { vi.unstubAllGlobals(); document.body.innerHTML = ''; });

it('passes the first node at the top of the page', () => {
  const { entries, circles } = build();
  expect(entries[0]!.querySelector('.node')!.classList.contains('pulse')).toBe(true);
  expect(entries[0]!.classList.contains('is-reached')).toBe(true);
  expect(circles[1]!.classList.contains('path')).toBe(true);
  expect(circles[2]!.classList.contains('path')).toBe(false);
});

it('travels down: passes the next node and lights its region', () => {
  const { entries, circles, scrollTo } = build();
  scrollTo(200); // line 720
  expect(circles[2]!.classList.contains('path')).toBe(true);
  expect(fills()).toHaveLength(1);
  expect(fills()[0]).toMatch(/L6\.0 720\.0$/);
});

it('holds the fill when scrolling back up', () => {
  const { scrollTo } = build();
  scrollTo(200);
  scrollTo(0);
  expect(fills()[0]).toMatch(/L6\.0 720\.0$/);
});

it('keeps reached station rings lit and pulses the terminal station only once', () => {
  const { entries, scrollTo } = build();
  scrollTo(200);
  expect(entries.slice(0, 2).every((entry) => entry.classList.contains('is-reached'))).toBe(true);
  scrollTo(0);
  expect(entries.slice(0, 2).every((entry) => entry.classList.contains('is-reached'))).toBe(true);
  expect(entries[2]!.classList.contains('is-reached')).toBe(false);
  const terminal = entries[2]!.querySelector('.node')!;
  const add = vi.spyOn(terminal.classList, 'add');
  scrollTo(2300);
  expect(entries[2]!.classList.contains('is-reached')).toBe(true);
  expect(terminal.classList.contains('pulse')).toBe(true);
  expect(add.mock.calls.filter((args) => args.includes('pulse'))).toHaveLength(1);
});

it('opens mid-page with everything above the reading line already passed', () => {
  const { entries } = build({ scroll: 500 }); // line 1020
  expect(entries.every((e) => e.querySelector('.node')!.classList.contains('pulse'))).toBe(true);
});

it('counts the page bottom as reaching the end, even on a short page', () => {
  const { entries, scrollTo } = build({ height: 900 });
  scrollTo(100); // bottom: 100 + 800 >= 899; line only 620
  expect(entries[2]!.querySelector('.node')!.classList.contains('pulse')).toBe(true);
  expect(fills().at(-1)).toMatch(/L6\.0 900\.0$/);
});

it('keeps the terminal reached through a resize', () => {
  const { entries, scrollTo } = build({ height: 900 });
  scrollTo(100);
  scrollTo(0);
  window.dispatchEvent(new Event('resize'));
  expect(fills().at(-1)).toMatch(/L6\.0 900\.0$/);
  expect(entries[2]!.classList.contains('is-reached')).toBe(true);
});

it('hover lights a region and previews, but never passes a node', () => {
  const { entries, circles } = build();
  entries[2]!.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
  expect(circles[3]!.classList.contains('path')).toBe(true);
  expect(entries[2]!.querySelector('.node')!.classList.contains('pulse')).toBe(false);
  expect(document.querySelector('.lit.ahead')!.getAttribute('d')).toBe('M6.0 520.0L6.0 900.0');
  expect(fills()).toHaveLength(1);
  expect(fills()[0]).toMatch(/L6\.0 520\.0$/);
});

it('moves the terminal up when Buscar hides the last station, keeping what was already lit', () => {
  const { entries, circles, scrollTo } = build();
  scrollTo(200);
  entries[2]!.hidden = true;
  document.querySelector('[data-thread]')!.dispatchEvent(new CustomEvent('thread:filter'));
  expect(fills()).toHaveLength(1);
  expect(circles[2]!.classList.contains('path')).toBe(true);
  expect(entries.slice(0, 2).every((entry) => entry.classList.contains('is-reached'))).toBe(true);
  expect(fills()[0]).toMatch(/L6\.0 600\.0$/);
});

it('carries on past the last post to the Quién escribe station and pulses it once', () => {
  const { entries, scrollTo } = build({ stop: true });
  const who = document.querySelector('.who')!;
  const station = who.querySelector('.node')!;
  const add = vi.spyOn(station.classList, 'add');
  scrollTo(400); // line 920: past the last post, short of the stop
  expect(entries.every((entry) => entry.classList.contains('is-reached'))).toBe(true);
  expect(who.classList.contains('is-reached')).toBe(false);
  expect(fills().at(-1)).toMatch(/L6\.0 920\.0$/);
  scrollTo(500); // line 1020
  expect(fills().at(-1)).toMatch(/L6\.0 1000\.0$/);
  expect(who.classList.contains('is-reached')).toBe(true);
  scrollTo(700);
  window.dispatchEvent(new Event('resize'));
  expect(who.classList.contains('is-reached')).toBe(true);
  expect(add.mock.calls.filter((args) => args.includes('pulse'))).toHaveLength(1);
});

it('counts the page bottom as reaching the Quién escribe station', () => {
  build({ height: 900, stop: true });
  window.dispatchEvent(new Event('scroll'));
  vi.stubGlobal('scrollY', 100);
  window.dispatchEvent(new Event('scroll'));
  expect(fills().at(-1)).toMatch(/L6\.0 1000\.0$/);
  expect(document.querySelector('.who')!.classList.contains('is-reached')).toBe(true);
});

it('cleans up on dispose', () => {
  const { dispose } = build();
  dispose();
  expect(document.querySelector('svg.wire')).toBeNull();
});
