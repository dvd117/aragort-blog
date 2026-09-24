import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FLAG_COLORS, FLAG_PATH, flagNodes } from '../src/lib/flag';
import { nets } from '../src/assets/net/geometry';

const css = readFileSync('src/styles/global.css', 'utf8');
const g = nets.mark;
const path = [...FLAG_PATH];
const netComponent = readFileSync('src/components/Net.astro', 'utf8');

/**
 * The card carries the flag on the mark: three nodes, top to bottom, each joined to the
 * next. The geometry is generated and committed, so these hold -- unless someone reruns
 * scripts/generate-net.py, which is exactly when this should fail rather than ship a card
 * with the flag scattered over the drawing.
 */
describe('OG card: the flag on the mark', () => {
  it('is three nodes of the mark', () => {
    expect(path).toHaveLength(3);
    expect(path).toEqual([9, 10, 11]);
    expect([...flagNodes.keys()]).toEqual(path);
    for (const n of path) expect(g.nodes[n]).toBeDefined();
  });

  it('runs top to bottom, in the flag order', () => {
    const ys = path.map((n) => g.nodes[n]![1]);
    expect([...ys].sort((a, b) => a - b)).toEqual(ys);
  });

  it('is a connected path, so the flag descends one thread', () => {
    const joined = (a: number, b: number) =>
      g.edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
    for (let i = 0; i < path.length - 1; i++) {
      expect(joined(path[i]!, path[i + 1]!), `nodes ${path[i]} and ${path[i + 1]} are not joined`).toBe(true);
    }
  });

  it('uses the dark theme hues, as global.css declares them', () => {
    for (const hex of Object.values(FLAG_COLORS)) expect(css).toContain(hex);
  });

  it('puts no hue on the card text', () => {
    const og = readFileSync('src/lib/og.ts', 'utf8');
    const text = og.slice(og.indexOf('export async function renderOgImage'));
    for (const hex of Object.values(FLAG_COLORS)) expect(text).not.toContain(hex);
  });

  it('lets the in-page mark use the same shared path as the card', () => {
    expect(netComponent).toContain("import { flagNodes } from '../lib/flag'");
    expect(netComponent).toContain('data-logo');
  });
});
