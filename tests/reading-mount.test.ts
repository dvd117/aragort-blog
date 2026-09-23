// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { mountReading } from '../src/scripts/reading';

const rect = (top: number, height: number) => ({
  top, bottom: top + height, left: 0, right: 600, width: 600, height,
  x: 0, y: top, toJSON: () => ({}),
});

function build() {
  document.body.innerHTML = `
    <header class="site"><a class="brand"><svg class="net"><line data-a="0" data-b="1"></line><circle data-o="0"></circle><circle data-o="1"></circle></svg></a></header>
    <article class="post">
      <div class="post-grid">
        <div class="prose">
          <h2 id="one">Uno</h2><p>Texto.</p>
          <h2 id="two">Dos</h2><p>Texto.</p>
          <h2 id="three">Tres</h2><p>Texto.</p>
        </div>
        <div class="sig"><svg class="net"><line data-a="0" data-b="1"></line><circle data-o="0"></circle><circle data-o="1"></circle></svg></div>
        <nav class="rail-toc"><ol>
          <li><a href="#one">Uno</a></li><li><a href="#two">Dos</a></li><li><a href="#three">Tres</a></li>
        </ol></nav>
      </div>
    </article>
    <div class="progress"></div>`;
  const article = document.querySelector<HTMLElement>('.post')!;
  const grid = document.querySelector<HTMLElement>('.post-grid')!;
  const prose = document.querySelector<HTMLElement>('.prose')!;
  let top = 0;
  Object.defineProperty(grid, 'getBoundingClientRect', { configurable: true, get: () => () => rect(top, 1000) });
  Object.defineProperty(prose, 'getBoundingClientRect', { configurable: true, get: () => () => rect(top, 1000) });
  [...prose.children].forEach((block) => {
    Object.defineProperty(block, 'getBoundingClientRect', { configurable: true, value: () => rect(0, 100) });
  });
  return { article, bar: document.querySelector<HTMLElement>('.progress')!, setTop: (t: number) => { top = t; } };
}

function buildPulseRoot() {
  const root = document.createElement('article');
  root.className = 'post';
  root.innerHTML = `
    <div class="post-grid">
      <div class="prose"><p>Texto.</p></div>
      <div class="rail"><svg class="net"></svg></div>
      <div class="sig"><svg class="net"></svg></div>
      <div data-done></div>
    </div>`;
  document.body.append(root);
  const grid = root.querySelector<HTMLElement>('.post-grid')!;
  const prose = root.querySelector<HTMLElement>('.prose')!;
  Object.defineProperty(grid, 'getBoundingClientRect', { configurable: true, value: () => rect(0, 1000) });
  Object.defineProperty(prose, 'getBoundingClientRect', { configurable: true, value: () => rect(0, 1000) });
  return {
    root,
    card: root.querySelector<HTMLElement>('[data-done]')!,
    railNet: root.querySelector<SVGSVGElement>('.rail .net')!,
    sigNet: root.querySelector<SVGSVGElement>('.sig .net')!,
  };
}

function stubTimers() {
  const pending = new Map<number, () => void>();
  let next = 1;
  vi.stubGlobal('setTimeout', (callback: () => void) => {
    const id = next++;
    pending.set(id, callback);
    return id;
  });
  vi.stubGlobal('clearTimeout', (id: number) => {
    pending.delete(id);
  });
  return pending;
}

function stubEnv() {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubGlobal('innerHeight', 800);
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 1; });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

it('stops updating the progress bar once the disposer has run', () => {
  stubEnv();
  const { article, bar, setTop } = build();

  const dispose = mountReading(article, { minutes: 5 });
  const before = bar.style.clipPath;
  expect(before).not.toBe('');

  dispose();
  setTop(-900);
  dispatchEvent(new Event('scroll'));

  expect(bar.style.clipPath).toBe(before);
});

it('keeps the site and signature logos static while reading', () => {
  stubEnv();
  const { article, setTop } = build();

  const dispose = mountReading(article, { minutes: 5 });
  setTop(-900);
  dispatchEvent(new Event('scroll'));

  expect(document.querySelectorAll('.site .brand .net .p, .sig .net .p')).toHaveLength(0);
  dispose();
});

it('removes the chapter notches it added to the site header', () => {
  stubEnv();
  const { article } = build();

  const dispose = mountReading(article, { minutes: 5 });
  expect(document.querySelectorAll('.site .tick')).toHaveLength(3);

  dispose();
  expect(document.querySelectorAll('.site .tick')).toHaveLength(0);
});

it('mounts twice without leaving duplicate notches behind', () => {
  stubEnv();
  const { article } = build();

  mountReading(article, { minutes: 5 })();
  const dispose = mountReading(article, { minutes: 5 });

  expect(document.querySelectorAll('.site .tick')).toHaveLength(3);
  dispose();
});

it('reads its article from the root it is given, not from the document', () => {
  stubEnv();
  build();
  const detached = document.createElement('div');

  const dispose = mountReading(detached, { minutes: 5 });

  expect(document.querySelectorAll('.site .tick')).toHaveLength(0);
  dispose();
});

it('clears pending net pulse timers when disposed', () => {
  stubEnv();
  const pending = stubTimers();
  document.body.innerHTML = '<header class="site"></header><div class="progress"></div>';
  const { root, card, railNet, sigNet } = buildPulseRoot();

  const dispose = mountReading(root, { minutes: 5 });
  card.dispatchEvent(new Event('focusin'));

  expect(railNet.classList.contains('pulse')).toBe(true);
  expect(sigNet.classList.contains('pulse')).toBe(false);
  expect(pending.size).toBe(1);

  dispose();

  expect(pending.size).toBe(0);
  expect(railNet.classList.contains('pulse')).toBe(true);
  expect(sigNet.classList.contains('pulse')).toBe(false);
});

it('keeps a second root mount independent when the first is disposed', () => {
  stubEnv();
  const pending = stubTimers();
  document.body.innerHTML = '<header class="site"></header><div class="progress"></div>';
  const first = buildPulseRoot();
  const second = buildPulseRoot();

  const disposeFirst = mountReading(first.root, { minutes: 5 });
  const disposeSecond = mountReading(second.root, { minutes: 5 });
  first.card.dispatchEvent(new Event('focusin'));
  second.card.dispatchEvent(new Event('focusin'));
  disposeFirst();

  expect(pending.size).toBe(1);
  [...pending.values()][0]!();
  expect(first.railNet.classList.contains('pulse')).toBe(true);
  expect(first.sigNet.classList.contains('pulse')).toBe(false);
  expect(second.railNet.classList.contains('pulse')).toBe(false);
  expect(second.sigNet.classList.contains('pulse')).toBe(false);

  disposeSecond();
});
