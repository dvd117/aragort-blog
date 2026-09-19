import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ratio } from '../src/lib/contrast';

const css = readFileSync('src/styles/global.css', 'utf8');
// Per theme: page, panel, and the hues as text (4.5:1) and as UI marks (3:1).
// amarillo, azul, rojo -- the flag's order, muted to the page.
// `ui` covers both strengths a band is drawn in on the net: --hu-* / --hr-* at rest and
// --hl-* with the power in it (brighter on a dark screen, darker on paper).
const THEMES = {
  dark: { bg: '#000000', panel: '#101113', text: ['#e2a638', '#6298dd', '#e0705e'], ui: ['#ffc75e', '#93c2ff', '#ff9182'] },
  light: { bg: '#f7f6f2', panel: '#eeece6', text: ['#8b6114', '#2e5c9c', '#b23a35'], ui: ['#a86f10', '#2464be', '#c63a29', '#7a4a00', '#12408f', '#9d1e12'] },
  sepia: { bg: '#f3ead6', panel: '#e9dec5', text: ['#805a13', '#305a94', '#a83731'], ui: ['#2464be', '#c63a29', '#6d4200'] },
  contrast: { bg: '#000000', panel: '#141414', text: ['#ffd166', '#88b4e6', '#e89a90'], ui: [] as string[] },
};

describe('contrast (WCAG 2.2)', () => {
  for (const [name, t] of Object.entries(THEMES)) {
    const need = name === 'contrast' ? 7 : 4.5;
    it(`${name}: hue text passes on page and panel`, () => {
      for (const c of t.text) { expect(ratio(c, t.bg)).toBeGreaterThanOrEqual(need); expect(ratio(c, t.panel)).toBeGreaterThanOrEqual(4.5); }
    });
    it(`${name}: UI marks pass 3:1`, () => {
      for (const c of t.ui) expect(ratio(c, t.bg)).toBeGreaterThanOrEqual(3);
    });
  }
  it('the table matches global.css', () => {
    for (const t of Object.values(THEMES)) for (const c of [t.bg, t.panel, ...t.text, ...t.ui]) expect(css.toLowerCase()).toContain(c);
  });
});
