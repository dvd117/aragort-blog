import { describe, expect, it } from 'vitest';
import { HUES } from '../src/lib/hue';
import { LAST_HUE_KEY, ROLL_KEY, hueScript, parseLastHue, rollHue } from '../src/lib/lasthue';

/** Run the inline head script against a fake page and report what it wrote to <html>. */
const run = (opts: { hue?: string | null; stored?: string | null; roll?: string | null }) => {
  const attrs: Record<string, string> = {};
  if (opts.hue) attrs['data-hue'] = opts.hue;
  const session: Record<string, string> = {};
  if (opts.roll !== undefined && opts.roll !== null) session[ROLL_KEY] = opts.roll;
  const fn = new Function('localStorage', 'sessionStorage', 'document', 'Math', hueScript());
  fn(
    { getItem: (k: string) => (k === LAST_HUE_KEY ? (opts.stored ?? null) : null) },
    { getItem: (k: string) => session[k] ?? null, setItem: (k: string, v: string) => { session[k] = v; } },
    {
      documentElement: {
        getAttribute: (k: string) => attrs[k] ?? null,
        setAttribute: (k: string, v: string) => { attrs[k] = v; },
      },
    },
    Math,
  );
  return { hue: attrs['data-hue'], base: attrs['data-hue-base'], roll: session[ROLL_KEY] };
};

describe('rolling the hue order', () => {
  it('keeps the order of the five hues and only moves the starting point', () => {
    for (let offset = 0; offset < 8; offset++) {
      const rolled = HUES.map((h) => rollHue(h, offset));
      expect(new Set(rolled).size).toBe(HUES.length); // still a permutation
      // Neighbours in HUES are still neighbours after the roll.
      for (let i = 1; i < HUES.length; i++) {
        const a = HUES.indexOf(rolled[i - 1]! as (typeof HUES)[number]);
        const b = HUES.indexOf(rolled[i]! as (typeof HUES)[number]);
        expect((b - a + HUES.length) % HUES.length).toBe(1);
      }
    }
  });

  it('offset 0 changes nothing, and a full turn comes home', () => {
    for (const h of HUES) {
      expect(rollHue(h, 0)).toBe(h);
      expect(rollHue(h, HUES.length)).toBe(h);
      expect(rollHue(h, -1)).toBe(rollHue(h, HUES.length - 1));
    }
  });

  it('leaves anything that is not a hue alone', () => {
    expect(rollHue('rojo', 3)).toBe('rojo');
  });
});

describe('which hue rules a page', () => {
  it('accepts only the five hues from storage', () => {
    for (const h of HUES) expect(parseLastHue(h)).toBe(h);
    for (const bad of ['rojo', '', 'OCHRE', null, undefined]) expect(parseLastHue(bad)).toBe(null);
  });

  it("rolls the page's own hue and keeps the base beside it", () => {
    expect(run({ hue: 'ochre', roll: '0' })).toMatchObject({ hue: 'ochre', base: 'ochre' });
    expect(run({ hue: 'ochre', roll: '2' })).toMatchObject({ hue: HUES[2], base: 'ochre' });
    expect(run({ hue: 'moss', roll: '1' })).toMatchObject({ hue: HUES[0], base: 'moss' });
  });

  it('falls back to the last post read when the page has no hue of its own', () => {
    expect(run({ stored: 'teal', roll: '0' })).toMatchObject({ hue: 'teal', base: 'teal' });
    expect(run({ stored: 'teal', roll: '3' })).toMatchObject({ hue: rollHue('teal', 3), base: 'teal' });
  });

  it('leaves <html> untouched when there is no hue anywhere, or a bad one', () => {
    expect(run({ roll: '2' }).hue).toBe(undefined);
    expect(run({ stored: 'rojo', roll: '2' }).hue).toBe(undefined);
  });

  it('draws the offset once per visit and reuses it after', () => {
    const first = run({ hue: 'ochre' });
    expect(Number(first.roll)).toBeGreaterThanOrEqual(0);
    expect(Number(first.roll)).toBeLessThan(HUES.length);
    // The same stored offset gives the same hue every time it runs again.
    expect(run({ hue: 'ochre', roll: first.roll! }).hue).toBe(first.hue);
  });

  it('does not throw when storage is blocked', () => {
    const boom = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } };
    const fn = new Function('localStorage', 'sessionStorage', 'document', 'Math', hueScript());
    expect(() => fn(boom, boom, { documentElement: { getAttribute: () => null, setAttribute: () => {} } }, Math)).not.toThrow();
  });
});
