import { globSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Buscar hides an entry by setting `hidden` on it (src/scripts/filter.ts). The UA rule
 * behind that attribute is `[hidden] { display: none }` at specificity 0,1,0 -- so any
 * rule of ours that sets `display` on the same element with as much specificity, or more,
 * wins and the entry stays on screen while the count claims it is gone. That is the bug
 * this file guards: every such rule needs a `[hidden]` override that outranks it.
 */
const SELECTORS_HIDDEN_BY_JS = ['.entry'];

const files = globSync('src/**/*.{css,astro}');
/** Comments would otherwise be read as part of the following selector. */
const strip = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const sources = files.map((f) => [f, strip(readFileSync(f, 'utf8'))] as const);

/** Rough CSS specificity: [ids, classes+attrs+pseudo-classes, elements]. Good enough to compare siblings. */
const specificity = (sel: string): [number, number, number] => [
  (sel.match(/#[\w-]+/g) ?? []).length,
  (sel.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g) ?? []).length,
  (sel.match(/(?:^|[\s>+~])[a-z][\w-]*/gi) ?? []).length,
];
const outranks = (a: string, b: string) => {
  const [x, y] = [specificity(a), specificity(b)];
  return x[0] !== y[0] ? x[0] > y[0] : x[1] !== y[1] ? x[1] > y[1] : x[2] > y[2];
};

/** Every `selector { declarations }` pair, @media wrappers included (their braces are skipped). */
const rules = (css: string) =>
  [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].flatMap(([, sels, decls]) =>
    sels!.split(',').map((s) => ({ sel: s.trim(), decls: decls! })),
  );

describe('Buscar: the CSS lets an entry be hidden', () => {
  for (const base of SELECTORS_HIDDEN_BY_JS) {
    it(`no rule outranks the [hidden] override for ${base}`, () => {
      const override = `${base}[hidden]`;
      const offenders: string[] = [];
      let declared = false;

      for (const [file, css] of sources) {
        for (const { sel, decls } of rules(css)) {
          if (sel === override && /display\s*:\s*none/.test(decls)) declared = true;
          // A rule that targets the same element (its last compound ends in `.entry`)
          // and sets display: it must not outrank, or tie with, the override.
          const last = sel.split(/[\s>+~]+/).pop() ?? '';
          if (!last.includes(base) || sel === override) continue;
          if (!/(?:^|;)\s*display\s*:/.test(decls)) continue;
          if (!outranks(override, sel)) offenders.push(`${file}: ${sel} { ${decls.trim()} }`);
        }
      }

      expect(declared, `${override} { display: none } is missing`).toBe(true);
      expect(offenders, `these rules would keep a filtered entry on screen:\n${offenders.join('\n')}`).toEqual([]);
    });
  }
});
