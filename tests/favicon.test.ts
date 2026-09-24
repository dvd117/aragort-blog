import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { nets } from '../src/assets/net/geometry';
import { ratio } from '../src/lib/contrast';
import { FLAG_COLORS, FLAG_LIGHT_COLORS, FLAG_PATH, flagNodes } from '../src/lib/flag';
import { faviconSvg, touchIconPng } from '../src/lib/favicon';

const svg = faviconSvg();
const circles = [...svg.matchAll(/<circle\b[^>]*\/?\s*>/g)].map(([tag]) => tag!);
const lines = [...svg.matchAll(/<line\b[^>]*\/?\s*>/g)].map(([tag]) => tag!);

function attribute(tag: string, name: string): string {
  const value = tag.match(new RegExp(`\\b${name}="([^"]+)"`))?.[1];
  if (value === undefined) throw new Error(`Missing ${name} on ${tag}`);
  return value;
}

function point(tag: string): readonly [number, number] {
  return [Number(attribute(tag, 'cx')), Number(attribute(tag, 'cy'))];
}

describe('favicon', () => {
  it('draws only the three flag nodes and their two ordered wires', () => {
    expect(circles).toHaveLength(3);
    expect(lines).toHaveLength(2);
    expect(circles.map((tag) => [Number(attribute(tag, 'data-logo-node')), attribute(tag, 'data-logo-hue')]))
      .toEqual([...flagNodes]);
    expect(lines.map((tag) => [
      ...attribute(tag, 'data-logo-wire').split('-').map(Number),
      attribute(tag, 'data-logo-hue'),
    ])).toEqual([
      [9, 10, 'amarillo'],
      [10, 11, 'azul'],
    ]);
  });

  it('keeps the frozen geometry in place with one centred, unrotated scale', () => {
    const source = [...FLAG_PATH].map((node) => nets.mark.nodes[node]!);
    expect(source).toEqual([[40.3, 3.1], [41, 15.2], [45, 30.9]]);

    const target = circles.map(point);
    const ratios: number[] = [];
    for (let i = 0; i < source.length; i++) {
      for (let j = i + 1; j < source.length; j++) {
        const original = Math.hypot(source[i]![0] - source[j]![0], source[i]![1] - source[j]![1]);
        const drawn = Math.hypot(target[i]![0] - target[j]![0], target[i]![1] - target[j]![1]);
        ratios.push(drawn / original);
      }
    }
    const scale = ratios.reduce((sum, value) => sum + value, 0) / ratios.length;
    expect(Math.max(...ratios) - Math.min(...ratios)).toBeLessThan(1e-6);
    for (let i = 1; i < source.length; i++) {
      expect(target[i]![0] - target[0]![0]).toBeCloseTo((source[i]![0] - source[0]![0]) * scale, 6);
      expect(target[i]![1] - target[0]![1]).toBeCloseTo((source[i]![1] - source[0]![1]) * scale, 6);
    }
    const xs = target.map(([x]) => x);
    const ys = target.map(([, y]) => y);
    const width = Math.max(...xs) - Math.min(...xs);
    const height = Math.max(...ys) - Math.min(...ys);
    expect((Math.min(...xs) + Math.max(...xs)) / 2).toBeCloseTo(24, 6);
    expect((Math.min(...ys) + Math.max(...ys)) / 2).toBeCloseTo(24, 6);
    expect(height).toBeGreaterThanOrEqual(28);
    expect(height).toBeLessThanOrEqual(32);
    expect(ys[0]).toBeLessThan(ys[1]!);
    expect(ys[1]).toBeLessThan(ys[2]!);
    expect(width).toBeGreaterThan(0);
  });

  it('uses the flag palettes with accessible contrast on both card schemes', () => {
    for (const color of Object.values(FLAG_COLORS)) {
      expect(svg).toContain(color);
      expect(ratio(color, '#15171a')).toBeGreaterThanOrEqual(3);
    }
    for (const color of Object.values(FLAG_LIGHT_COLORS)) {
      expect(svg).toContain(color);
      expect(ratio(color, '#ece9e1')).toBeGreaterThanOrEqual(3);
    }
    expect(svg).toContain('@media (prefers-color-scheme:dark)');
  });

  it('renders the Apple touch icon as a 180 by 180 PNG', () => {
    const png = touchIconPng();
    expect(png.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(png.readUInt32BE(16)).toBe(180);
    expect(png.readUInt32BE(20)).toBe(180);
  });

  it('does not leave the old public favicon in place', () => {
    expect(existsSync('public/favicon.svg')).toBe(false);
  });
});
