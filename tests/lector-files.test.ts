// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { initLector } from '../src/scripts/lector';
import * as lectorRender from '../src/scripts/lector-render';

const PAGE = `
  <header class="site"><div class="brand"><svg class="net"></svg></div><span data-left></span><div class="progress"></div></header>
  <div class="lector">
    <section data-lector-empty>
      <textarea data-lector-paste></textarea>
      <input type="file" data-lector-file />
      <div data-lector-drop></div>
      <button type="button" data-lector-read>Leer</button>
      <p data-lector-status></p>
    </section>
    <article class="post" data-lector-shell hidden>
      <header class="post-head"><h1 data-lector-title tabindex="-1"></h1><span data-lector-minutes></span><button type="button" data-lector-reset>Otro texto</button></header>
      <div class="post-grid"><div class="rail"><nav class="rail-toc" hidden><ol></ol></nav></div><div class="prose" data-pane="read"></div><div class="source" data-pane="md" hidden><button type="button" data-copy><span>Copiar</span></button><pre data-lector-source></pre></div></div>
    </article>
  </div>`;

const type = (markdown: string) => {
  document.querySelector<HTMLTextAreaElement>('[data-lector-paste]')!.value = markdown;
  document.querySelector<HTMLButtonElement>('[data-lector-read]')!.click();
};

const drop = (file: File) => {
  const event = new Event('drop', { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', { value: { files: [file] } });
  document.dispatchEvent(event);
};

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubGlobal('innerHeight', 800);
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 1; });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  sessionStorage.clear();
  document.body.innerHTML = PAGE;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
  sessionStorage.clear();
});

it('refuses a dropped binary file without replacing the open document', () => {
  initLector();
  type('# Inicial\n\nTexto.');

  drop(new File(['\x89PNG'], 'foto.png', { type: 'image/png' }));

  expect(document.querySelector('[data-lector-title]')!.textContent).toBe('Inicial');
  expect(document.querySelector('[data-lector-status]')!.textContent).toBe('Ese archivo no parece Markdown o texto plano.');
});

it('accepts an uppercase Markdown filename when the MIME type is empty', async () => {
  initLector();
  drop(new File(['# Notas\n\nTexto.'], 'notas.MD', { type: '' }));
  await Promise.resolve();
  await Promise.resolve();

  expect(document.querySelector('[data-lector-title]')!.textContent).toBe('Notas');
});

it('keeps the open document when rendering a replacement fails', () => {
  initLector();
  type('# Inicial\n\nTexto.');
  const render = vi.spyOn(lectorRender, 'renderMarkdown').mockImplementation(() => { throw new Error('falló'); });

  expect(() => type('# Nuevo\n\nTexto.')).not.toThrow();
  expect(document.querySelector('[data-lector-title]')!.textContent).toBe('Inicial');
  expect(document.querySelector('.prose')!.textContent).toContain('Texto.');
  expect(document.querySelector<HTMLElement>('[data-lector-shell]')!.hidden).toBe(false);
  expect(document.querySelector('[data-lector-status]')!.textContent).toBe('No se pudo leer ese archivo.');
  render.mockRestore();
});

it('does not mark a new document copied when an old clipboard write resolves', async () => {
  initLector();
  type('# Inicial\n\nTexto.');
  let resolve!: () => void;
  const pending = new Promise<void>((done) => { resolve = done; });
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn(() => pending) } });

  document.querySelector<HTMLButtonElement>('[data-copy]')!.click();
  document.querySelector<HTMLButtonElement>('[data-lector-reset]')!.click();
  type('# Nuevo\n\nTexto.');
  resolve();
  await Promise.resolve();
  await Promise.resolve();

  expect(document.querySelector('[data-copy]')!.dataset.state).toBeUndefined();
  expect(document.querySelector('[data-copy] span')!.textContent).toBe('Copiar');
});
