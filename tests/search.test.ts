import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { hasSearch, SEARCH_MIN } from '../src/lib/search';

const page = readFileSync('src/pages/index.astro', 'utf8');

it('enables Buscar at eight posts, but not seven', () => {
  expect(SEARCH_MIN).toBe(8);
  expect(hasSearch(7)).toBe(false);
  expect(hasSearch(8)).toBe(true);
});

it('leaves the current two-post archive unmarked through the Astro helper condition', () => {
  expect(hasSearch(2)).toBe(false);
  expect(page).toMatch(/data-search=\{searchEnabled \? '' : undefined\}/);
});
