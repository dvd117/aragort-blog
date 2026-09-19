import { describe, expect, it } from 'vitest';
import { HUES } from '../src/lib/hue';
import { LAST_HUE_KEY, lastHueScript, parseLastHue } from '../src/lib/lasthue';

describe('the last post read rules the pages with no hue of their own', () => {
  it('accepts only the five hues', () => {
    for (const h of HUES) expect(parseLastHue(h)).toBe(h);
    for (const bad of ['rojo', '', 'OCHRE', null, undefined]) expect(parseLastHue(bad)).toBe(null);
  });

  it('applies the stored hue to <html> before first paint, and survives empty storage', () => {
    const run = (stored: string | null) => {
      const html: Record<string, string> = {};
      const fn = new Function('localStorage', 'document', lastHueScript());
      fn(
        { getItem: (k: string) => (k === LAST_HUE_KEY ? stored : null) },
        { documentElement: { setAttribute: (k: string, v: string) => { html[k] = v; } } },
      );
      return html['data-hue'];
    };
    expect(run('teal')).toBe('teal');
    expect(run(null)).toBe(undefined);
    expect(run('rojo')).toBe(undefined);
  });

  it('does not throw when storage is blocked', () => {
    const fn = new Function('localStorage', 'document', lastHueScript());
    expect(() => fn({ getItem: () => { throw new Error('denied'); } }, { documentElement: { setAttribute: () => {} } })).not.toThrow();
  });
});
