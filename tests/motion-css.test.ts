import { globSync, readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

/** The motion craft bar (AGENTS.md section 7), checked where it can be: in the source. */
const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const files = globSync('src/styles/*.css').map((f) => [f, strip(readFileSync(f, 'utf8'))] as const);

it('never transitions everything, eases in, or scales from nothing', () => {
  const bad: string[] = [];
  for (const [f, css] of files) {
    if (/transition\s*:\s*all\b/.test(css)) bad.push(`${f}: transition: all`);
    if (/\bease-in\b(?!-out)/.test(css)) bad.push(`${f}: ease-in`);
    if (/scale\(\s*0\s*\)/.test(css)) bad.push(`${f}: scale(0)`);
  }
  expect(bad).toEqual([]);
});
