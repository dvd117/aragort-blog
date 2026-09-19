import { describe, expect, it } from 'vitest';
import { FEATURE_BELOW, landingMode } from '../src/lib/landing';

describe('landing mode', () => {
  it('features the latest post while there are fewer than three', () => {
    expect(FEATURE_BELOW).toBe(3);
    expect(landingMode(0)).toBe('empty');
    expect(landingMode(1)).toBe('featured');
    expect(landingMode(2)).toBe('featured');
    expect(landingMode(3)).toBe('list');
    expect(landingMode(40)).toBe('list');
  });
});
