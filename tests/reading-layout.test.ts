// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { initReading } from '../src/scripts/reading';

const rect = (top: number, height: number) => ({
  top,
  bottom: top + height,
  left: 0,
  right: 600,
  width: 600,
  height,
  x: 0,
  y: top,
  toJSON: () => ({}),
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

it('recomputes chapter placement when a selected font finishes loading', () => {
  let headingTops = [100, 400, 700];
  const fonts = Object.assign(new EventTarget(), {
    ready: new Promise<void>(() => {}),
  });
  Object.defineProperty(document, 'fonts', { configurable: true, value: fonts });
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn() })));
  vi.stubGlobal('innerHeight', 800);
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callback(0); return 1; });
  document.body.innerHTML = `
    <header class="site"></header>
    <article class="post">
      <div class="post-grid">
        <div class="prose">
          <h2 id="one">Uno</h2><p>Texto.</p>
          <h2 id="two">Dos</h2><p>Texto.</p>
          <h2 id="three">Tres</h2><p>Texto.</p>
        </div>
        <nav class="rail-toc" aria-label="Capítulos"><ol>
          <li><a href="#one">Uno</a></li><li><a href="#two">Dos</a></li><li><a href="#three">Tres</a></li>
        </ol></nav>
      </div>
    </article>
    <div class="progress"></div>`;

  const grid = document.querySelector<HTMLElement>('.post-grid')!;
  const prose = document.querySelector<HTMLElement>('.post .prose')!;
  Object.defineProperty(grid, 'getBoundingClientRect', { configurable: true, value: () => rect(0, 1000) });
  Object.defineProperty(prose, 'getBoundingClientRect', { configurable: true, value: () => rect(0, 1000) });
  [...prose.querySelectorAll<HTMLElement>('h2')].forEach((heading, index) => {
    Object.defineProperty(heading, 'getBoundingClientRect', {
      configurable: true,
      value: () => rect(headingTops[index]!, 40),
    });
  });
  [...prose.children].forEach((block) => {
    if (block.tagName === 'H2') return;
    Object.defineProperty(block, 'getBoundingClientRect', { configurable: true, value: () => rect(0, 100) });
  });

  initReading(5);
  const ticks = [...document.querySelectorAll<HTMLElement>('.site .tick')];
  expect(ticks.map((tick) => tick.style.left)).toEqual(['10.00%', '40.00%', '70.00%']);

  document.dispatchEvent(new CustomEvent('ajustes:change'));
  headingTops = [180, 520, 880];
  fonts.dispatchEvent(new Event('loadingdone'));

  expect(ticks.map((tick) => tick.style.left)).toEqual(['18.00%', '52.00%', '88.00%']);
});
