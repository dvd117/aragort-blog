import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

const indexCss = readFileSync('src/styles/index.css', 'utf8');
const globalCss = readFileSync('src/styles/global.css', 'utf8');
const rules = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const indexRules = rules(indexCss);

it('draws contiguous per-entry rails and ends the static rail at the last visible station', () => {
  expect(indexRules).toMatch(/\.entry::before\s*\{[^}]*top:\s*0[^}]*bottom:\s*0[^}]*width:\s*var\(--track-w\)[^}]*background:\s*var\(--net\)[^}]*opacity:\s*var\(--track-alpha\)/);
  expect(indexRules).toMatch(/\.entry:not\(\[hidden\]\):not\(:has\(~ \.entry:not\(\[hidden\]\)\)\)::before\s*\{[^}]*bottom:\s*auto[^}]*height:\s*calc\(var\(--entry-pt\) \+ \.7em\)/);
});

it('centres a quiet terminal bar on the last station and turns it to ink when reached', () => {
  expect(indexRules).toMatch(/\.entry:not\(\[hidden\]\):not\(:has\(~ \.entry:not\(\[hidden\]\)\)\)::after\s*\{[^}]*left:\s*calc\(6px - var\(--list-indent\) - var\(--station-d\)\)[^}]*width:\s*calc\(2 \* var\(--station-d\)\)[^}]*height:\s*var\(--track-w\)[^}]*background:\s*var\(--net\)[^}]*opacity:\s*var\(--track-alpha\)/);
  expect(indexRules).toMatch(/\.entry\.is-reached:not\(\[hidden\]\):not\(:has\(~ \.entry:not\(\[hidden\]\)\)\)::after\s*\{[^}]*background:\s*var\(--fg\)[^}]*opacity:\s*1/);
});

it('does not draw the landing route through the signature or onto the footer', () => {
  expect(indexRules).not.toMatch(/[^{}]*\.site-foot[^{}]*\{/);
  expect(rules(globalCss)).not.toMatch(/\.who-thread::before\s*\{/);
});
