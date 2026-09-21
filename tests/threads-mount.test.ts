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

function stubEnv() {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  vi.stubGlobal('innerHeight', 800);
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
