import { describe, expect, it } from 'vitest';
import { HUES, hueFor } from '../src/lib/hue';

describe('hue per post', () => {
  it('is deterministic for a slug', () => {
    expect(hueFor('por-que-deje-los-chatbots')).toBe(hueFor('por-que-deje-los-chatbots'));
    const first = ['a', 'b', 'la-terminal-y-github'].map((s) => hueFor(s));
    expect(['a', 'b', 'la-terminal-y-github'].map((s) => hueFor(s))).toEqual(first);
  });

  it('pins known slugs, so a refactor cannot silently recolour published posts', () => {
    expect(hueFor('por-que-deje-los-chatbots')).toBe('azul');
  });

  it('respects the frontmatter choice', () => {
    for (const h of HUES) expect(hueFor('por-que-deje-los-chatbots', h)).toBe(h);
  });

  it('always returns one of the flag\'s three hues and uses all of them', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const h = hueFor(`texto-${i}`);
      expect(HUES).toContain(h);
      seen.add(h);
    }
    expect(seen.size).toBe(HUES.length);
  });

  it('does not depend on anything but the slug', () => {
    expect(hueFor('uno')).toBe(hueFor('uno', undefined));
  });
});
