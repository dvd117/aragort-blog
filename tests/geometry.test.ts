import { describe, expect, it } from 'vitest';
import { nets } from '../src/assets/net/geometry';

describe('the rail and the hero', () => {
  it('the rail is its own column whose indices run top to bottom (reading order)', () => {
    expect([nets.rail.w, nets.rail.h, nets.rail.nodes.length]).toEqual([150, 780, 42]);
    const ys = nets.rail.nodes.map(([, y]) => y);
    for (let i = 1; i < ys.length; i++) expect(ys[i]!).toBeGreaterThanOrEqual(ys[i - 1]!);
  });
  it('the hero indices run left to right (reading order)', () => {
    const xs = nets.hero.nodes.map(([x]) => x);
    for (let i = 1; i < xs.length; i++) expect(xs[i]!).toBeGreaterThanOrEqual(xs[i - 1]!);
  });
});
