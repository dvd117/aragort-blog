import { describe, expect, it } from 'vitest';
import { nets } from '../src/assets/net/geometry';
import { pathFor } from '../src/lib/netpath';

const hero = nets.hero;
const wired = (a: number, b: number) => hero.edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

describe('net as navigation', () => {
  it('starts at the lit ochre node and follows real wires', () => {
    const path = pathFor(hero, 'por-que-deje-los-chatbots');
    expect(path[0]).toBe(hero.lit[0]);
    for (let i = 1; i < path.length; i++) expect(wired(path[i - 1]!, path[i]!)).toBe(true);
  });

  it('is short: four to six nodes', () => {
    for (const slug of ['a', 'la-terminal-y-github', 'tus-instrucciones-tus-reglas', 'x-y-z']) {
      const n = pathFor(hero, slug).length;
      expect(n).toBeGreaterThanOrEqual(4);
      expect(n).toBeLessThanOrEqual(6);
    }
  });

  it('is stable per slug', () => {
    expect(pathFor(hero, 'uno')).toEqual(pathFor(hero, 'uno'));
  });
});
