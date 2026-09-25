import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

const css = readFileSync('src/styles/index.css', 'utf8');

// filter.ts builds Buscar after first paint; the landing holds its place so the list does not jump (CLS).
it('holds the Buscar box its place only where scripts run, until filter.ts inserts it', () => {
  expect(css).toMatch(/@media \(scripting: enabled\) \{ \.index\[data-search\]:has\(\.entries\):not\(:has\(\.filter\)\) \.hero \{ margin-bottom: calc\(var\(--filter-h\) \+ var\(--filter-gap\)\); \} \}/);
  expect(css).toMatch(/@media \(max-width: 430px\) \{ \.index\[data-search\] \.filter \{ padding-inline-start:/);
  expect(css).toMatch(/\.index\[data-search\] \{ --filter-gap: 2rem; --filter-h:/);
  expect(css).toMatch(/\.filter \{[^}]*margin: 0 0 var\(--filter-gap\)/);
});
