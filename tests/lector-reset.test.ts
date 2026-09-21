// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { initLector } from '../src/scripts/lector';

const PAGE = `
  <header class="site">
    <div class="brand"><svg class="net"><circle data-o="0"></circle></svg></div>
    <span class="left" data-left></span>
    <div class="progress"></div>
  </header>
  <div class="lector">
    <section data-lector-empty>
      <textarea data-lector-paste></textarea>
      <button type="button" data-lector-read>Leer</button>
      <p data-lector-status></p>
    </section>
    <article class="post" data-lector-shell hidden>
      <header class="post-head"><h1 data-lector-title tabindex="-1"></h1><span data-lector-minutes></span><button type="button" data-lector-reset>Otro texto</button></header>
      <div class="post-grid"><div class="prose" data-pane="read"></div><div class="source" data-pane="md" hidden><pre data-lector-source></pre></div><nav class="rail-toc" hidden><ol></ol></nav></div>
    </article>
  </div>`;

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubGlobal('innerHeight', 800);
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 1; });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  sessionStorage.clear();
  document.body.innerHTML = PAGE;
  const grid = document.querySelector<HTMLElement>('.post-grid')!;
  const prose = document.querySelector<HTMLElement>('.prose')!;
  Object.defineProperty(grid, 'getBoundingClientRect', { configurable: true, value: () => ({ top: 0, bottom: 1000, height: 1000 }) });
  Object.defineProperty(prose, 'getBoundingClientRect', { configurable: true, value: () => ({ top: 0, bottom: 1000, height: 1000 }) });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
  sessionStorage.clear();
});

it('restores the fresh header exactly after Otro texto', () => {
  const header = document.querySelector<HTMLElement>('header.site')!;
  const freshHeader = header.outerHTML;
  initLector();

  const paste = document.querySelector<HTMLTextAreaElement>('[data-lector-paste]')!;
  paste.value = '# Documento\n\nTexto.';
  document.querySelector<HTMLButtonElement>('[data-lector-read]')!.click();
  expect(header.outerHTML).not.toBe(freshHeader);

  document.querySelector<HTMLButtonElement>('[data-lector-reset]')!.click();
  expect(header.outerHTML).toBe(freshHeader);
});
