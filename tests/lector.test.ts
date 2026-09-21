// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { initLector } from '../src/scripts/lector';

const SHELL = `
  <header class="site"><div class="brand"><svg class="net"></svg></div><span data-left></span></header>
  <div class="lector">
    <section data-lector-empty>
      <textarea data-lector-paste></textarea>
      <input type="file" data-lector-file />
      <div data-lector-drop></div>
      <button type="button" data-lector-read>Leer</button>
      <p data-lector-status></p>
    </section>
    <article class="post" data-lector-shell hidden>
      <header class="post-head">
        <h1 data-lector-title tabindex="-1"></h1>
        <span data-lector-minutes></span>
        <div class="view">
          <button type="button" data-view="read" aria-pressed="true">Formato</button>
          <button type="button" data-view="md" aria-pressed="false">Markdown</button>
          <button type="button" data-lector-reset>Otro texto</button>
        </div>
      </header>
      <div class="post-grid">
        <div class="rail"><nav class="rail-toc" hidden><ol></ol></nav></div>
        <div class="prose" data-pane="read"></div>
        <div class="source" data-pane="md" hidden>
          <button type="button" data-copy><span>Copiar</span></button>
          <pre data-lector-source></pre>
        </div>
      </div>
    </article>
  </div>
  <div class="progress"></div>`;

const type = (markdown: string) => {
  document.querySelector<HTMLTextAreaElement>('[data-lector-paste]')!.value = markdown;
  document.querySelector<HTMLButtonElement>('[data-lector-read]')!.click();
};

const deferred = <T>() => {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((resolvePromise) => { resolve = resolvePromise; });
  return { promise, resolve };
};

const selectFile = (file: File) => {
  const input = document.querySelector<HTMLInputElement>('[data-lector-file]')!;
  Object.defineProperty(input, 'files', { configurable: true, value: [file] });
  input.dispatchEvent(new Event('change'));
};

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubGlobal('innerHeight', 800);
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 1; });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  sessionStorage.clear();
  document.body.innerHTML = SHELL;
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
  sessionStorage.clear();
});

it('renders pasted Markdown into the reading shell', () => {
  initLector();
  type('# Mi nota\n\nHola **mundo**.');

  const shell = document.querySelector<HTMLElement>('[data-lector-shell]')!;
  expect(shell.hidden).toBe(false);
  expect(document.querySelector('[data-lector-empty]')!.hasAttribute('hidden')).toBe(true);
  expect(document.querySelector('.prose')!.innerHTML).toContain('<strong>mundo</strong>');
  expect(document.querySelector('[data-lector-title]')!.textContent).toBe('Mi nota');
});

it('keeps the raw source available in the Markdown pane', () => {
  initLector();
  type('# T\n\nTexto.');
  expect(document.querySelector('[data-lector-source]')!.textContent).toBe('# T\n\nTexto.');
});

it('builds a chapter list only from three headings up', () => {
  initLector();
  type('## A\n\nx\n\n## B\n\ny');
  expect(document.querySelector<HTMLElement>('.rail-toc')!.hidden).toBe(true);

  document.querySelector<HTMLButtonElement>('[data-lector-reset]')!.click();
  type('## A\n\nx\n\n## B\n\ny\n\n## C\n\nz');
  expect(document.querySelector<HTMLElement>('.rail-toc')!.hidden).toBe(false);
  expect(document.querySelectorAll('.rail-toc a')).toHaveLength(3);
  expect([...document.querySelectorAll<HTMLElement>('.rail-toc .num')].every((num) => num.getAttribute('aria-hidden') === 'true')).toBe(true);
});

it('returns to the empty state and forgets the document on "Otro texto"', () => {
  initLector();
  type('# T\n\nTexto.');
  document.querySelector<HTMLButtonElement>('[data-lector-reset]')!.click();

  expect(document.querySelector<HTMLElement>('[data-lector-shell]')!.hidden).toBe(true);
  expect(document.querySelector('.prose')!.innerHTML).toBe('');
  expect(sessionStorage.getItem('aragort-lector')).toBeNull();
});

it('restores the document from sessionStorage on load', () => {
  sessionStorage.setItem('aragort-lector', JSON.stringify({ source: '# Guardado\n\nx.' }));
  initLector();
  expect(document.querySelector('[data-lector-title]')!.textContent).toBe('Guardado');
});

it('refuses input over the size cap without rendering it', () => {
  initLector();
  type('x'.repeat(2 * 1024 * 1024 + 1));

  expect(document.querySelector<HTMLElement>('[data-lector-shell]')!.hidden).toBe(true);
  expect(document.querySelector('[data-lector-status]')!.textContent).not.toBe('');
});

it('survives a second document without leaving the first one’s notches behind', () => {
  initLector();
  type('## A\n\nx\n\n## B\n\ny\n\n## C\n\nz');
  document.querySelector<HTMLButtonElement>('[data-lector-reset]')!.click();
  type('## D\n\nx\n\n## E\n\ny\n\n## F\n\nz');

  expect(document.querySelectorAll('.site .tick')).toHaveLength(3);
});

it('restores the reading chrome before mounting a valid replacement document', () => {
  initLector();
  type('# Primero\n\nTexto.');

  document.querySelector<HTMLButtonElement>('[data-view="md"]')!.click();
  const copy = document.querySelector<HTMLButtonElement>('[data-copy]')!;
  copy.dataset.state = 'done';
  copy.querySelector('span')!.textContent = 'Copiado';
  document.querySelector('.site .brand .net')!.classList.add('pulse');

  Object.defineProperty(document.querySelector<HTMLElement>('.prose')!, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({ top: 0, bottom: 1000, height: 1000 }),
  });

  type('# Segundo\n\nTexto.');

  expect(document.querySelector<HTMLElement>('[data-pane="read"]')!.hidden).toBe(false);
  expect(document.querySelector<HTMLElement>('[data-pane="md"]')!.hidden).toBe(true);
  expect(document.querySelector<HTMLButtonElement>('[data-view="read"]')!.getAttribute('aria-pressed')).toBe('true');
  expect(document.querySelector<HTMLButtonElement>('[data-view="md"]')!.getAttribute('aria-pressed')).toBe('false');
  expect(copy.dataset.state).toBeUndefined();
  expect(copy.querySelector('span')!.textContent).toBe('Copiar');
  expect(document.querySelector('.site .brand .net')!.classList.contains('pulse')).toBe(false);
});

it('clears reading chrome and completion state on "Otro texto"', () => {
  initLector();
  type('# Primero\n\nTexto.');

  document.querySelector<HTMLButtonElement>('[data-view="md"]')!.click();
  const copy = document.querySelector<HTMLButtonElement>('[data-copy]')!;
  copy.dataset.state = 'done';
  copy.querySelector('span')!.textContent = 'Copiado';
  document.querySelector('.site .brand .net')!.classList.add('pulse');

  document.querySelector<HTMLButtonElement>('[data-lector-reset]')!.click();

  expect(document.querySelector<HTMLElement>('[data-pane="read"]')!.hidden).toBe(false);
  expect(document.querySelector<HTMLElement>('[data-pane="md"]')!.hidden).toBe(true);
  expect(document.querySelector<HTMLButtonElement>('[data-view="read"]')!.getAttribute('aria-pressed')).toBe('true');
  expect(document.querySelector<HTMLButtonElement>('[data-view="md"]')!.getAttribute('aria-pressed')).toBe('false');
  expect(copy.dataset.state).toBeUndefined();
  expect(copy.querySelector('span')!.textContent).toBe('Copiar');
  expect(document.querySelector('.site .brand .net')!.classList.contains('pulse')).toBe(false);
});

it('shows terminado at the end without an empty done card', () => {
  initLector();
  type('# T\n\nTexto.');

  expect(document.querySelector('[data-done]')).toBeNull();
  const grid = document.querySelector<HTMLElement>('.post-grid')!;
  const prose = document.querySelector<HTMLElement>('.prose')!;
  Object.defineProperty(grid, 'getBoundingClientRect', { configurable: true, value: () => ({ top: 0, bottom: 700, height: 700 }) });
  Object.defineProperty(prose, 'getBoundingClientRect', { configurable: true, value: () => ({ top: 0, bottom: 700, height: 700 }) });

  dispatchEvent(new Event('scroll'));
  expect(document.querySelector('[data-left]')!.textContent).toContain('terminado');
});

it('does not let a stale file read overwrite newer pasted input', async () => {
  initLector();
  const oldFile = deferred<string>();
  selectFile({ name: 'viejo.md', size: 10, text: () => oldFile.promise } as unknown as File);

  type('# Nuevo\n\nTexto.');
  oldFile.resolve('# Viejo\n\nTexto.');
  await oldFile.promise;
  await Promise.resolve();

  expect(document.querySelector('[data-lector-title]')!.textContent).toBe('Nuevo');
});

it('invalidates a pending file read when "Otro texto" resets the reader', async () => {
  initLector();
  const oldFile = deferred<string>();
  selectFile({ name: 'viejo.md', size: 10, text: () => oldFile.promise } as unknown as File);

  document.querySelector<HTMLButtonElement>('[data-lector-reset]')!.click();
  oldFile.resolve('# Viejo\n\nTexto.');
  await oldFile.promise;
  await Promise.resolve();

  expect(document.querySelector<HTMLElement>('[data-lector-shell]')!.hidden).toBe(true);
});

it('invalidates a pending file read when a later oversized file is refused', async () => {
  initLector();
  const oldFile = deferred<string>();
  selectFile({ name: 'viejo.md', size: 10, text: () => oldFile.promise } as unknown as File);

  selectFile({ name: 'grande.md', size: 2 * 1024 * 1024 + 1, text: vi.fn() } as unknown as File);
  oldFile.resolve('# Viejo\n\nTexto.');
  await oldFile.promise;
  await Promise.resolve();

  expect(document.querySelector<HTMLElement>('[data-lector-shell]')!.hidden).toBe(true);
  expect(document.querySelector('[data-lector-status]')!.textContent).not.toBe('');
});

it('moves focus to the rendered title after reading a document', () => {
  initLector();
  type('# Mi título\n\nTexto.');

  const title = document.querySelector<HTMLElement>('[data-lector-title]')!;
  expect(title.getAttribute('tabindex')).toBe('-1');
  expect(document.activeElement).toBe(title);
});
