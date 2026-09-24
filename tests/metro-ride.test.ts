import { describe, expect, it } from 'vitest';
import { advanceHighWater, markStopLit } from '../src/scripts/metro-ride';

describe('metro ride', () => {
  it('keeps the furthest chapter progress reached, bounded to the strip', () => {
    expect(advanceHighWater(0.72, 0.31)).toBe(0.72);
    expect(advanceHighWater(0.31, 0.72)).toBe(0.72);
    expect(advanceHighWater(0.72, 2)).toBe(1);
    expect(advanceHighWater(0.31, -1)).toBe(0.31);
  });

  it('lights a service stop once', () => {
    const marker = { dataset: {} as DOMStringMap };
    expect(markStopLit(marker)).toBe(true);
    expect(markStopLit(marker)).toBe(false);
    expect(marker.dataset.lit).toBe('true');
  });
});
