// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { mountThreads } from '../src/scripts/threads';

function build() {
  document.body.innerHTML = `
    <article class="post">
      <div class="post-grid">
        <div class="prose">
          <p>Texto<a class="nref" href="#nota-1" id="ref-1">1</a>.</p>
          <aside class="note"><p id="nota-1"><span class="n">1</span> La nota.</p></aside>
        </div>
      </div>
    </article>`;
  return {
    article: document.querySelector<HTMLElement>('.post')!,
    grid: document.querySelector<HTMLElement>('.post-grid')!,
    marker: document.querySelector<HTMLAnchorElement>('.nref')!,
    note: document.querySelector<HTMLElement>('.note')!,
  };
}

function stubEnv(desktop = false) {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: desktop, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubGlobal('innerHeight', 800);
}

function buildTwoNotes() {
  document.body.innerHTML = `
    <article class="post">
      <div class="post-grid">
        <div class="prose">
          <p id="p-1">Texto<a class="nref" href="#nota-1">1</a>.</p>
          <aside class="note"><p id="nota-1"><span class="n">1</span> La primera nota.</p></aside>
          <p id="p-2">Más texto<a class="nref" href="#nota-2">2</a>.</p>
          <aside class="note"><p id="nota-2"><span class="n">2</span> La segunda nota.</p></aside>
        </div>
      </div>
    </article>`;
  return {
    article: document.querySelector<HTMLElement>('.post')!,
    prose: document.querySelector<HTMLElement>('.prose')!,
    first: document.querySelector<HTMLElement>('.note')!,
    second: document.querySelectorAll<HTMLElement>('.note')[1]!,
    paragraphs: [...document.querySelectorAll<HTMLElement>('.prose > p')],
  };
}

function rect(x: number, y: number, width: number, height: number): DOMRect {
  return { x, y, left: x, top: y, right: x + width, bottom: y + height, width, height, toJSON: () => ({}) } as DOMRect;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

it('removes the thread svg it appended when disposed', () => {
  stubEnv();
  const { article, grid } = build();

  const dispose = mountThreads(article);
  expect(grid.querySelector('svg.thread')).not.toBeNull();

  dispose();
  expect(grid.querySelector('svg.thread')).toBeNull();
});

it('stops opening notes from their marker once disposed', () => {
  stubEnv();
  const { article, marker, note } = build();

  const dispose = mountThreads(article);
  dispose();
  marker.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));

  expect(note.classList.contains('is-open')).toBe(false);
});

it('reads its markers from the root it is given', () => {
  stubEnv();
  const { grid } = build();
  const detached = document.createElement('div');

  const dispose = mountThreads(detached);

  expect(grid.querySelector('svg.thread')).toBeNull();
  dispose();
});

it('lets desktop notes hang below their citing paragraphs and pushes colliding notes down', () => {
  stubEnv(true);
  const { article, prose, first, second, paragraphs } = buildTwoNotes();
  first.style.marginTop = '4px';
  second.style.marginTop = '4px';

  vi.spyOn(prose, 'getBoundingClientRect').mockReturnValue(rect(100, 100, 500, 110));
  vi.spyOn(paragraphs[0]!, 'getBoundingClientRect').mockReturnValue(rect(100, 120, 200, 40));
  vi.spyOn(paragraphs[1]!, 'getBoundingClientRect').mockReturnValue(rect(100, 160, 200, 30));
  vi.spyOn(first, 'getBoundingClientRect').mockImplementation(() => rect(400, 100 + (parseFloat(first.style.top) || 0) + 4, 100, 80));
  vi.spyOn(second, 'getBoundingClientRect').mockImplementation(() => rect(400, 100 + (parseFloat(second.style.top) || 0) + 4, 100, 100));

  const dispose = mountThreads(article);

  expect(first.style.top).toBe('20px');
  expect(second.style.top).toBe('116px');
  expect(prose.style.getPropertyValue('--note-tail')).toBe('110px');

  dispose();
});
