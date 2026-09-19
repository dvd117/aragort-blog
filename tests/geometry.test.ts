import { describe, expect, it } from 'vitest';
import { nets } from '../src/assets/net/geometry';

describe('one net', () => {
  it('the rail has the hero topology, node for node', () => {
    expect(nets.rail.nodes.length).toBe(nets.hero.nodes.length);
    expect(nets.rail.edges).toEqual(nets.hero.edges);
  });
  it('the rail is a column whose indices run top to bottom (reading order)', () => {
    expect(nets.rail.w).toBe(110);
    expect(nets.rail.h).toBe(780);
    const ys = nets.rail.nodes.map(([, y]) => y);
    for (let i = 1; i < ys.length; i++) expect(ys[i]!).toBeGreaterThanOrEqual(ys[i - 1]!);
  });
});
