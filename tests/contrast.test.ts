import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ratio } from '../src/lib/contrast';

const css = readFileSync('src/styles/global.css', 'utf8');
// Per theme: page, panel, and the hues as text (4.5:1) and as UI marks (3:1).
const THEMES = {
  dark: { bg: '#0c0e11', panel: '#15181c', text: ['#e2a638', '#43a3a0', '#d4735f', '#5b9bd0', '#759a4c'], ui: [] as string[] },
  light: { bg: '#f7f6f2', panel: '#eeece6', text: ['#8b6114', '#2f7472', '#aa4e3c', '#386e97', '#567138'], ui: ['#b8801b', '#2f8f8b', '#c4553f', '#3a82bd', '#5f8c2e'] },
  sepia: { bg: '#f3ead6', panel: '#e9dec5', text: ['#805a13', '#2c6b69', '#9d4837', '#34658c', '#506833'], ui: ['#2f8f8b', '#c4553f', '#3a82bd', '#5f8c2e'] },
  contrast: { bg: '#000000', panel: '#141414', text: ['#ffd166', '#48b0ac', '#d39082', '#75a6cc', '#84ac56'], ui: [] as string[] },
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
