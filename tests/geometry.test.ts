import { describe, expect, it } from 'vitest';
import { nets } from '../src/assets/net/geometry';
import { mapByOrder } from '../src/lib/netmap';

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
  it('maps every rail node to a hero node, in order, first to first and last to last', () => {
    const m = mapByOrder(nets.hero.nodes.length, nets.rail.nodes.length);
    expect(m).toHaveLength(42);
    expect(m[0]).toBe(0);
    expect(m.at(-1)).toBe(39);
    for (let i = 1; i < m.length; i++) expect(m[i]!).toBeGreaterThanOrEqual(m[i - 1]!);
    expect(new Set(m).size).toBe(40); // every hero node is used
  });
});
