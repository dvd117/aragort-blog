import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

const indexCss = readFileSync('src/styles/index.css', 'utf8');
const globalCss = readFileSync('src/styles/global.css', 'utf8');
const rules = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const indexRules = rules(indexCss);

it('draws contiguous per-entry rails, the last one included, and bridges the gap to Quién escribe', () => {
  expect(indexRules).toMatch(/\.entry::before\s*\{[^}]*top:\s*0[^}]*bottom:\s*0[^}]*width:\s*var\(--track-w\)[^}]*background:\s*var\(--net\)[^}]*opacity:\s*var\(--track-alpha\)/);
  expect(indexRules).not.toMatch(/\.entry:not\(\[hidden\]\):not\(:has\(~ \.entry:not\(\[hidden\]\)\)\)::(before|after)/);
  expect(indexRules).toMatch(/\.index \.who::before\s*\{[^}]*left:\s*calc\(6px - var\(--track-w\) \/ 2\)[^}]*bottom:\s*100%[^}]*width:\s*var\(--track-w\)[^}]*background:\s*var\(--net\)[^}]*opacity:\s*var\(--track-alpha\)/);
});

it('centres a quiet terminal bar on the Quién escribe station and turns it to ink when reached', () => {
  expect(indexRules).toMatch(/\.index \.who::after\s*\{[^}]*left:\s*calc\(6px - var\(--station-d\)\)[^}]*width:\s*calc\(2 \* var\(--station-d\)\)[^}]*height:\s*var\(--track-w\)[^}]*background:\s*var\(--net\)[^}]*opacity:\s*var\(--track-alpha\)/);
  expect(indexRules).toMatch(/\.index \.who\.is-reached::after\s*\{[^}]*background:\s*var\(--fg\)[^}]*opacity:\s*1/);
  expect(indexRules).toMatch(/\.who \.node\s*\{[^}]*left:\s*calc\(6px - var\(--station-d\) \/ 2\)/);
});

it('ends the landing route at the signature, never onto the footer', () => {
  expect(indexRules).not.toMatch(/[^{}]*\.site-foot[^{}]*\{/);
  expect(rules(globalCss)).not.toMatch(/\.who-thread::before\s*\{/);
});
