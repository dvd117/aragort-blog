// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { afterEach, expect, it, vi } from 'vitest';
import { initAbout } from '../src/scripts/about';

const rect = (x: number, y: number, w: number, h: number) =>
  ({ x, y, left: x, top: y, right: x + w, bottom: y + h, width: w, height: h, toJSON: () => ({}) }) as DOMRect;
const box = (e: Element, get: () => DOMRect) => Object.defineProperty(e, 'getBoundingClientRect', { configurable: true, value: get });

/** A thread 900px tall at document y 100, stations at 20, 300, 600 and 880 down it. */
function build({ height = 3000, reduce = false } = {}) {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: reduce, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0; });
  vi.stubGlobal('innerHeight', 800); // reading line 520px down the viewport
  vi.stubGlobal('scrollY', 0);
  Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: height });
  document.body.innerHTML = `
    <ol class="about-thread" data-about-thread>
      ${[0, 1, 2, 3].map(() => '<li class="about-node-item"><span class="about-node"><span class="hue-dot"></span></span></li>').join('')}
    </ol>`;
  const thread = document.querySelector<HTMLElement>('[data-about-thread]')!;
  const items = [...document.querySelectorAll<HTMLElement>('.about-node-item')];
  box(thread, () => rect(0, 100 - scrollY, 500, 900));
  items.forEach((item, i) => box(item.querySelector('.about-node')!, () => rect(0, 100 + [20, 300, 600, 880][i]! - 7 - scrollY, 14, 14)));
  const scrollTo = (y: number) => { vi.stubGlobal('scrollY', y); window.dispatchEvent(new Event('scroll')); };
  initAbout();
  return { thread, items, scrollTo };
}

const lit = (items: HTMLElement[]) => items.map((i) => i.classList.contains('is-lit'));
afterEach(() => { vi.unstubAllGlobals(); document.body.innerHTML = ''; });

it('fills to the reading line and lights the stations above it, each in its band', () => {
  const { thread, items } = build(); // line at 420 down the thread
  expect(thread.style.getPropertyValue('--lit')).toBe('420px');
  expect(thread.style.getPropertyValue('--end')).toBe('880px');
  expect(lit(items)).toEqual([true, true, false, false]);
  expect(items.map((i) => i.dataset.band)).toEqual(['0', '1', '2', '2']);
  expect(items[1]!.querySelector('.about-node')!.classList.contains('pulse')).toBe(true);
});

it('holds the fill at the furthest point reached and pulses each station once', () => {
  const { thread, items, scrollTo } = build();
  const node = items[2]!.querySelector('.about-node')!;
  const add = vi.spyOn(node.classList, 'add');
  scrollTo(300); // line 720
  expect(thread.style.getPropertyValue('--lit')).toBe('720px');
  scrollTo(0);
  scrollTo(300);
  expect(thread.style.getPropertyValue('--lit')).toBe('720px');
  expect(lit(items)).toEqual([true, true, true, false]);
  expect(add.mock.calls.filter((args) => args.includes('pulse'))).toHaveLength(1);
});

it('ends at the contacts: stops at their station and lights the terminal bar', () => {
  const { thread, items, scrollTo } = build();
  expect(thread.classList.contains('is-ended')).toBe(false);
  scrollTo(2000);
  expect(thread.style.getPropertyValue('--lit')).toBe('880px');
  expect(lit(items)).toEqual([true, true, true, true]);
  expect(thread.classList.contains('is-ended')).toBe(true);
});

it('counts the page bottom as reaching the contacts', () => {
  const { thread } = build({ height: 800 });
  expect(thread.style.getPropertyValue('--lit')).toBe('880px');
  expect(thread.classList.contains('is-ended')).toBe(true);
});

it('lights everything at once under reduced motion, with no pulse', () => {
  const { thread, items } = build({ reduce: true });
  expect(lit(items)).toEqual([true, true, true, true]);
  expect(thread.classList.contains('is-ended')).toBe(true);
  expect(document.querySelector('.pulse')).toBeNull();
});

it('draws the thread as the landing track, not a flag gradient', () => {
  const css = readFileSync('src/components/AboutContent.astro', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  expect(css).not.toMatch(/linear-gradient/);
  expect(css).toMatch(/\.about-thread::before\s*\{[^}]*background:\s*var\(--net\)[^}]*opacity:\s*var\(--track-alpha\)/);
  expect(css).toMatch(/\.about-thread::after\s*\{[^}]*background:\s*var\(--fg\)[^}]*clip-path/);
  expect(css).toMatch(/\.about-node-item\.is-lit \.about-node\s*\{[^}]*border-color:\s*var\(--node\)/);
  expect(css).toMatch(/\.about-thread\.is-ended \.contact-item::before\s*\{[^}]*background:\s*var\(--fg\)/);
});
