import { describe, expect, it } from 'vitest';
import { HUES } from '../src/lib/hue';
import { LAST_HUE_KEY, hueScript, parseLastHue } from '../src/lib/lasthue';

/** Run the inline head script against a fake page and report what it wrote to <html>. */
const run = (opts: { hue?: string | null; stored?: string | null }) => {
  const attrs: Record<string, string> = {};
  if (opts.hue) attrs['data-hue'] = opts.hue;
  const fn = new Function('localStorage', 'document', hueScript());
  fn(
    { getItem: (k: string) => (k === LAST_HUE_KEY ? (opts.stored ?? null) : null) },
    {
      documentElement: {
        getAttribute: (k: string) => attrs[k] ?? null,
        setAttribute: (k: string, v: string) => { attrs[k] = v; },
      },
    },
  );
  return attrs['data-hue'];
};

describe('the flag decides the hues', () => {
  it('is amarillo, azul, rojo, in the order they appear on the flag', () => {
    expect(HUES).toEqual(['amarillo', 'azul', 'rojo']);
  });
});

describe('which hue rules a page', () => {
  it('accepts only the three hues from storage', () => {
    for (const h of HUES) expect(parseLastHue(h)).toBe(h);
    for (const bad of ['rojo!', '', 'ROJO', 'teal', 'ochre', null, undefined]) expect(parseLastHue(bad)).toBe(null);
  });

  it("leaves a page that has a hue of its own alone", () => {
    // A post already wears its hue from the server; the last post read must not override it.
    expect(run({ hue: 'azul', stored: 'rojo' })).toBe('azul');
  });

  it('gives a page with no hue of its own the last post read', () => {
    for (const h of HUES) expect(run({ stored: h })).toBe(h);
  });

  it('leaves <html> untouched when there is no hue anywhere, or a stale one', () => {
    expect(run({})).toBe(undefined);
    expect(run({ stored: 'ochre' })).toBe(undefined); // a hue from before the flag
    expect(run({ stored: 'rojo!' })).toBe(undefined);
  });

  it('does not throw when storage is blocked', () => {
    const boom = { getItem: () => { throw new Error('denied'); } };
    const fn = new Function('localStorage', 'document', hueScript());
    expect(() => fn(boom, { documentElement: { getAttribute: () => null, setAttribute: () => {} } })).not.toThrow();
  });
});
