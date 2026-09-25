import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

const css = readFileSync('src/styles/index.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

it('places desktop dates and titles in the text column and Leer beside the bullet row', () => {
  expect(css).toMatch(/@media \(min-width: 900px\)[\s\S]*?\.entry\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\) auto/);
  expect(css).toMatch(/\.entry \.d, \.entry \.t, \.entry \.ex, \.entry \.tag\s*\{\s*grid-column:\s*1 \/ -1;/);
  expect(css).toMatch(/\.entry\.feature \.teaser\s*\{\s*grid-column:\s*1;/);
  expect(css).toMatch(/\.entry\.feature \.more\s*\{\s*grid-column:\s*2;/);
});

it('keeps the desktop station gutter and aligns Quién escribe with the text column', () => {
  expect(css).toMatch(/\.entries\s*\{[^}]*--list-indent:\s*2\.25rem;\s*padding-left:\s*var\(--list-indent\)/);
  expect(css).toMatch(/\.who\s*\{\s*padding-left:\s*2\.25rem;/);
});
