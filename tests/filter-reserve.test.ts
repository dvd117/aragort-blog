import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

const css = readFileSync('src/styles/index.css', 'utf8');

// filter.ts builds Buscar after first paint; the landing holds its place so the list does not jump (CLS).
it('holds the Buscar box its place only where scripts run, until filter.ts inserts it', () => {
  expect(css).toMatch(/@media \(scripting: enabled\) \{ \.index:has\(\.entries\):not\(:has\(\.filter\)\) \.hero \{ margin-bottom: calc\(var\(--filter-h\) \+ var\(--filter-gap\)\); \} \}/);
  expect(css).toMatch(/\.filter \{[^}]*margin: 0 0 var\(--filter-gap\)/);
});
