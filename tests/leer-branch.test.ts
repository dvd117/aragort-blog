import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

const page = readFileSync('src/pages/index.astro', 'utf8');
const css = readFileSync('src/styles/index.css', 'utf8');
const globalCss = readFileSync('src/styles/global.css', 'utf8');

it('builds the branch into the markup, hidden from screen readers', () => {
  expect(page).toMatch(/<a class="more"[^>]*><svg class="branch"[^>]*aria-hidden="true"/);
  expect(page).toMatch(/class="b-lit"[^>]*pathLength="1"/);
});

it('keeps each date station neutral around a persistent, hue-bearing view-transition dot', () => {
  expect(page).toMatch(/<span class="node" aria-hidden="true"><span class="hue-dot" style=\{`view-transition-name: dot-\$\{p\.slug\}`\}><\/span><\/span>/);
  expect(page).not.toMatch(/class="node"[^>]*style=/);
  expect(css).toMatch(/@media\s*\(min-width:\s*900px\)[\s\S]*?\.node\s*\{[^}]*width:\s*18px[^}]*height:\s*18px[^}]*border-width:\s*3px/);
  expect(css).toMatch(/\.node\s+\.hue-dot\s*\{[^}]*width:\s*5px[^}]*height:\s*5px[^}]*background:\s*var\(--hue-ui\)/);
  expect(css).toMatch(/@media\s*\(min-width:\s*900px\)[\s\S]*?\.node \.hue-dot\s*\{[^}]*width:\s*6px[^}]*height:\s*6px/);
  expect(css).toMatch(/\.entry\.is-reached\s+\.node\s*\{[^}]*border-color:\s*var\(--hue-ui\)/);
  expect(css).toMatch(/\.node\s*\{[^}]*width:\s*14px[^}]*height:\s*14px[^}]*border:\s*2\.5px solid var\(--fg\)/);
});

it('draws the branch on hover, on focus and for the current entry', () => {
  for (const sel of ['.more:hover .branch .b-lit', '.more:focus-visible .branch .b-lit', '.entry.is-current .more .branch .b-lit']) {
    expect(css).toContain(sel);
  }
  expect(css).toMatch(/\.more \.branch \.b-rest\s*\{[^}]*stroke-width:\s*2\.5[^}]*linecap:\s*round/);
  expect(css).toMatch(/\.more \.branch circle\s*\{[^}]*fill:\s*var\(--bg\)[^}]*stroke-width:\s*1\.5/);
  expect(css).toMatch(/\.more:hover \.branch circle[^}]*stroke:\s*var\(--hue-ui\)/);
  expect(css).not.toMatch(/\.more:hover \.branch circle[^}]*fill:\s*var\(--hue-ui\)/);
});

it('shows the keyboard state at once, with no transition', () => {
  expect(css).toMatch(/\.more:focus-visible \.branch :is\(circle, \.b-lit\) \{ transition: none; \}/);
});

it('sizes the landing track per breakpoint and uses the quiet resting-strength token', () => {
  expect(css).toMatch(/:root\s*\{[^}]*--track-w:\s*4px[^}]*--track-r:\s*16px/);
  expect(css).toMatch(/@media\s*\(min-width:\s*900px\)\s*\{\s*:root\s*\{[^}]*--track-w:\s*6px[^}]*--track-r:\s*24px/s);
  expect(css).toMatch(/\.entries::before\s*\{[^}]*left:\s*calc\(6px - var\(--track-w\) \/ 2\)[^}]*width:\s*var\(--track-w\)[^}]*opacity:\s*var\(--track-alpha\)/);
  expect(globalCss).toMatch(/\.who-thread::before\s*\{[^}]*left:\s*calc\(6px - var\(--track-w\) \/ 2\)[^}]*width:\s*var\(--track-w\)[^}]*opacity:\s*var\(--track-alpha\)/);
});

it('insets the phone search box away from the curved connector', () => {
  expect(css).toMatch(/@media\s*\(max-width:\s*430px\)\s*\{\s*\.filter\s*\{[^}]*padding-inline-start:\s*clamp\(2\.5rem,\s*calc\(80vw - 13\.5rem\),\s*8rem\)/);
});

it('draws the footer terminus bar and thin tail without JavaScript', () => {
  expect(css).toMatch(/body:has\(\.index \.who\) \.site-foot::before[^}]*width:\s*var\(--track-w\)[^}]*1px 12px/);
  expect(css).toMatch(/body:has\(\.index \.who\) \.site-foot::after[^}]*width:\s*var\(--station-d\)[^}]*height:\s*var\(--track-w\)/);
  expect(css).toMatch(/body:has\(\.index \.who\) \.site-foot\.is-reached::after[^}]*background:\s*var\(--fg\)/);
});
