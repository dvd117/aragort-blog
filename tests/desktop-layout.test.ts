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
  expect(css).toMatch(/\.index \.who\s*\{\s*--who-indent:\s*2\.25rem;/);
});

it('leaves no later rule sending the bullets or Leer to the old date-column grid', () => {
  expect(css).not.toMatch(/\.entry\.feature \.teaser\s*\{\s*grid-column:\s*[2-9]/);
  expect(css).not.toMatch(/\.entry\.feature \.more\s*\{\s*grid-column:\s*[3-9]/);
});

it('splits each desktop post into a text column and an ideas column, and leaves phones flat', () => {
  expect(css).toMatch(/\.entry \.lhs, \.entry \.rhs\s*\{\s*display:\s*contents;/);
  const desktop = css.slice(css.lastIndexOf('@media (min-width: 900px)'));
  expect(desktop).toMatch(/\.entry\.feature\s*\{[^}]*grid-template-columns:\s*minmax\(0, 7fr\) minmax\(0, 5fr\)/);
  expect(desktop).toMatch(/\.entry\.feature \.lhs, \.entry\.feature \.rhs\s*\{[^}]*display:\s*grid/);
  expect(desktop).toMatch(/\.entry\.feature \.rhs\s*\{[^}]*grid-column:\s*2[^}]*border-left:\s*1px solid var\(--rule\)/);
  // Inside the ideas column "Leer" must not keep the 700px grid-column: 2.
  expect(desktop).toMatch(/\.entry\.feature \.more\s*\{[^}]*grid-column:\s*auto/);
});

it('groups each post as title and description, then ideas and Leer', () => {
  const page = readFileSync('src/pages/index.astro', 'utf8');
  expect(page).toMatch(/<div class="lhs">\s*<a class="t"[\s\S]*?class="ex"[\s\S]*?<\/div>\s*<div class="rhs">[\s\S]*?class="teaser"[\s\S]*?class="more"[\s\S]*?<\/div>/);
});
