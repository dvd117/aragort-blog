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
  expect(items.map((i) => i.dataset.band)).toEqual(['0', '1', '1', '2']);
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

it('runs the flag once: amarillo first, rojo at the contacts, azul between', () => {
  const { items } = build();
  expect(items.map((i) => i.dataset.band)).toEqual(['0', '1', '1', '2']);
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

/** The page: a hero net whose exit node (circle 1) is at root y 100, and a thread at root y
 *  200 with three stations 20, 300 and 600 down it. The root sits at page y 0. */
function buildPage({ vh = 300 } = {}) {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0; });
  vi.stubGlobal('innerHeight', vh);
  vi.stubGlobal('scrollY', 0);
  Object.defineProperty(document.documentElement, 'scrollHeight', { configurable: true, value: 3000 });
  document.body.innerHTML = `
    <div class="about wrap">
      <header class="about-hero"><div class="portrait-net" data-path="0,1"><svg>
        <circle></circle><circle></circle><line data-a="0" data-b="1"></line>
      </svg></div></header>
      <ol class="about-thread" data-about-thread>
        ${[0, 1, 2].map(() => '<li class="about-node-item"><span class="about-node"><span class="hue-dot"></span></span></li>').join('')}
      </ol>
    </div>`;
  const about = document.querySelector<HTMLElement>('.about')!;
  const thread = document.querySelector<HTMLElement>('[data-about-thread]')!;
  const items = [...document.querySelectorAll<HTMLElement>('.about-node-item')];
  box(about, () => rect(0, -scrollY, 1000, 1000));
  box(document.querySelectorAll('circle')[1]!, () => rect(295, 95 - scrollY, 10, 10));
  box(thread, () => rect(0, 200 - scrollY, 600, 620));
  items.forEach((item, i) => box(item.querySelector('.about-node')!, () => rect(-1, 200 + [20, 300, 600][i]! - 7 - scrollY, 14, 14)));
  const scrollTo = (y: number) => { vi.stubGlobal('scrollY', y); window.dispatchEvent(new Event('scroll')); };
  initAbout();
  return { about, thread, items, scrollTo };
}
const wireFill = () => document.querySelector('svg.wire .fill path')?.getAttribute('d') ?? '';

it('on the page, draws the wire from the portrait exit node into the thread', () => {
  const { about, thread } = buildPage();
  expect(about.querySelector(':scope > svg.wire')).not.toBeNull();
  expect(thread.classList.contains('has-wire')).toBe(true);
  expect(wireFill()).toMatch(/^M300\.0 100\.0/);
});

it('on the page, rests the fill at the first station and then travels with the reading line', () => {
  const { items, scrollTo } = buildPage(); // line at 195, above the thread
  expect(wireFill()).toMatch(/L6\.0 220\.0$/);
  expect(items[0]!.classList.contains('is-lit')).toBe(true);
  scrollTo(400); // line 595: 395 down the thread
  expect(wireFill()).toMatch(/L6\.0 595\.0$/);
  expect(items.map((i) => i.classList.contains('is-lit'))).toEqual([true, true, false]);
});

it('in the panel, keeps the thread line and draws no wire', () => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  document.body.innerHTML = `<dialog id="sobre-mi"><div class="drawer-body"><div class="about compact">
    <header class="portrait"><div class="portrait-net" data-path="0,1"><svg><circle></circle><circle></circle></svg></div></header>
    <ol class="about-thread" data-about-thread><li class="about-node-item"><span class="about-node"></span></li></ol>
  </div></div></dialog>`;
  initAbout(document.querySelector('#sobre-mi')!);
  expect(document.querySelector('svg.wire')).toBeNull();
  expect(document.querySelector('.about-thread')!.classList.contains('has-wire')).toBe(false);
});

it('sets the credentials as a paragraph on their own station, in the story type', () => {
  const src = readFileSync('src/components/AboutContent.astro', 'utf8');
  expect(src).not.toMatch(/class="cred"|\.cred\b/);
  expect(src).toMatch(/<li class="about-node-item">\s*<span class="about-node"[^>]*>[\s\S]*?<\/span>\s*<p>Fui <ExtLink[^>]*>Freedom Fellow<\/ExtLink> de la Human Rights Foundation y formo parte/);
});
