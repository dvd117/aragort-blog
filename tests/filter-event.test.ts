// @vitest-environment happy-dom
import { afterEach, expect, it, vi } from 'vitest';
import { initFilter } from '../src/scripts/filter';

function build(search = true) {
  document.body.innerHTML = `
    <div class="index"${search ? ' data-search' : ''}>
      <section class="hero"></section>
      <ol class="entries" data-thread>
        <li class="entry"><a class="t">Uno</a></li>
        <li class="entry"><a class="t">Dos</a></li>
      </ol>
    </div>`;
  return document.querySelector<HTMLElement>('[data-thread]')!;
}

afterEach(() => { document.body.innerHTML = ''; vi.restoreAllMocks(); });

it('tells the thread when typing changes the list', () => {
  const list = build();
  initFilter();
  const heard = vi.fn();
  list.addEventListener('thread:filter', heard);
  const box = document.querySelector<HTMLInputElement>('#buscar')!;
  box.value = 'uno';
  box.dispatchEvent(new Event('input'));
  expect(heard).toHaveBeenCalledTimes(1);
});

it('tells the thread when Escape clears the box', () => {
  const list = build();
  initFilter();
  const box = document.querySelector<HTMLInputElement>('#buscar')!;
  box.value = 'uno';
  box.dispatchEvent(new Event('input'));
  const heard = vi.fn();
  list.addEventListener('thread:filter', heard);
  box.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  expect(heard).toHaveBeenCalledTimes(1);
  expect(box.value).toBe('');
});

it('does not build the search box without the page mark', () => {
  build(false);
  initFilter();
  expect(document.querySelector('.filter')).toBeNull();
});
