import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

const page = readFileSync('src/pages/index.astro', 'utf8');
const css = readFileSync('src/styles/index.css', 'utf8');
const globalCss = readFileSync('src/styles/global.css', 'utf8');

it('keeps Leer as a plain text link with no spur markup or styles', () => {
  expect(page).toMatch(/<a class="more"[^>]*>Leer · \{p\.minutes\} min<\/a>/);
  expect(page).not.toContain('branch');
  expect(css).not.toContain('.branch');
});

it('uses the post hue and the same subtle underline as the signature link', () => {
  expect(css).toMatch(/\.more\s*\{[^}]*display:\s*inline-block[^}]*min-height:\s*44px[^}]*color:\s*var\(--hue\)[^}]*text-decoration:\s*underline 1px color-mix\(in srgb, var\(--hue\) 45%, transparent\)[^}]*text-underline-offset:\s*\.2em/);
  expect(css).toMatch(/\.more:hover,\s*\.more:focus-visible\s*\{[^}]*text-decoration-color:\s*var\(--hue\)[^}]*text-decoration-thickness:\s*2px/);
  expect(globalCss).toMatch(/\.who a\s*\{[^}]*text-decoration:\s*underline 1px color-mix\(in srgb, var\(--hue\) 45%, transparent\)[^}]*text-underline-offset:\s*\.2em/);
});

it('keeps a 6px stop and its named view-transition dot in the DOM', () => {
  expect(page).toMatch(/<span class="node" aria-hidden="true"><span class="hue-dot" style=\{`view-transition-name: dot-\$\{p\.slug\}`\}><\/span><\/span>/);
  expect(page).not.toMatch(/class="node"[^>]*style=/);
  expect(css).toMatch(/\.node\s*\{[^}]*width:\s*6px[^}]*height:\s*6px[^}]*background:\s*transparent/);
  expect(css).toMatch(/\.node\s+\.hue-dot\s*\{[^}]*width:\s*6px[^}]*height:\s*6px[^}]*background:\s*var\(--fg-2\)[^}]*opacity:\s*\.45/);
  expect(css).toMatch(/\.entry\.is-slider-covered\s+\.node \.hue-dot\s*\{[^}]*background:\s*var\(--bg\)[^}]*opacity:\s*1/);
  expect(css).not.toMatch(/\.entry\.is-reached\s+\.node\s*\{[^}]*border-color/);
  expect(css).not.toMatch(/@media\s*\(min-width:\s*900px\)[\s\S]*?\.node\s*\{[^}]*width:\s*18px/);
});

it('keeps the pill and grey stops in server markup without JS-generated fill or knob', () => {
  expect(page).toContain('<span class="node" aria-hidden="true">');
  expect(page).not.toContain('track-knob');
  expect(page).not.toContain('fill-band');
  expect(css).toMatch(/\.node \.hue-dot\s*\{[^}]*background:\s*var\(--fg-2\)[^}]*opacity:\s*\.45/);
  expect(css).toMatch(/\.entry::before\s*\{[^}]*background:\s*var\(--panel\)/);
});

it('sizes the landing track per breakpoint and uses the quiet resting-strength token', () => {
  expect(css).toMatch(/:root\s*\{[^}]*--track-w:\s*4px[^}]*--track-r:\s*16px/);
  expect(css).toMatch(/:root\s*\{[^}]*--pill-w:\s*12px/);
  expect(css).toMatch(/@media\s*\(min-width:\s*900px\)\s*\{\s*:root\s*\{[^}]*--track-w:\s*6px[^}]*--track-r:\s*24px[^}]*--pill-w:\s*16px/s);
  expect(css).toMatch(/\.entry::before\s*\{[^}]*left:\s*calc\(6px - var\(--list-indent\) - var\(--pill-w\) \/ 2\)[^}]*width:\s*var\(--pill-w\)[^}]*background:\s*var\(--panel\)[^}]*border-inline:\s*1px solid var\(--rule\)/);
  expect(globalCss).not.toContain('.who-thread::before');
});

it('insets the phone search box away from the curved connector', () => {
  expect(css).toMatch(/@media\s*\(max-width:\s*430px\)\s*\{\s*\.index\[data-search\]\s+\.filter\s*\{[^}]*padding-inline-start:\s*clamp\(2\.5rem,\s*calc\(80vw - 13\.5rem\),\s*8rem\)/);
});
