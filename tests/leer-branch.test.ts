import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

const page = readFileSync('src/pages/index.astro', 'utf8');
const css = readFileSync('src/styles/index.css', 'utf8');

it('builds the branch into the markup, hidden from screen readers', () => {
  expect(page).toMatch(/<a class="more"[^>]*><svg class="branch"[^>]*aria-hidden="true"/);
  expect(page).toMatch(/class="b-lit"[^>]*pathLength="1"/);
});

it('draws the branch on hover, on focus and for the current entry', () => {
  for (const sel of ['.more:hover .branch .b-lit', '.more:focus-visible .branch .b-lit', '.entry.is-current .more .branch .b-lit']) {
    expect(css).toContain(sel);
  }
});

it('shows the keyboard state at once, with no transition', () => {
  expect(css).toMatch(/\.more:focus-visible \.branch :is\(circle, \.b-lit\) \{ transition: none; \}/);
});
