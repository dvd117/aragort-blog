import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

const indexCss = readFileSync('src/styles/index.css', 'utf8');
const globalCss = readFileSync('src/styles/global.css', 'utf8');
const rules = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const indexRules = rules(indexCss);

it('draws a bordered panel pill from above the first station to the last station', () => {
  expect(indexRules).toMatch(/:root\s*\{[^}]*--pill-w:\s*12px/);
  expect(indexRules).toMatch(/@media\s*\(min-width:\s*900px\)\s*\{\s*:root\s*\{[^}]*--pill-w:\s*16px/s);
  expect(indexRules).toMatch(/\.entry::before\s*\{[^}]*left:\s*calc\(6px - var\(--list-indent\) - var\(--pill-w\) \/ 2\)[^}]*width:\s*var\(--pill-w\)[^}]*background:\s*var\(--panel\)[^}]*border-inline:\s*1px solid var\(--rule\)/);
  expect(indexRules).toMatch(/\.entry:first-child::before[^{}]*\{[^}]*top:\s*calc\(var\(--entry-pt\) \+ \.7em - var\(--pill-w\) \/ 2\)[^}]*border-radius:\s*999px 999px 0 0/);
  expect(indexRules).toMatch(/\.entry[^{}]*::before\s*\{[^}]*bottom:\s*calc\(100% - var\(--entry-pt\) - \.7em\)[^}]*border-radius:\s*0 0 999px 999px/);
});

it('removes the terminal bar in the pill experiment', () => {
  expect(indexRules).not.toMatch(/\.entry[^{}]*::after\s*\{/);
});

it('does not draw the landing route through the signature or onto the footer', () => {
  expect(indexRules).not.toMatch(/[^{}]*\.site-foot[^{}]*\{/);
  expect(rules(globalCss)).not.toMatch(/\.who-thread::before\s*\{/);
});
