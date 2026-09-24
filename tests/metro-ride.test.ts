import { describe, expect, it } from 'vitest';
import { advanceHighWater, chapterProgress, currentChapterIndex, markStopLit, rideAxis } from '../src/scripts/metro-ride';

describe('metro ride', () => {
  it('keeps a requested horizontal strip horizontal at desktop widths without changing direction A defaults', () => {
    expect(rideAxis('horizontal', false)).toBe('x');
    expect(rideAxis(undefined, false)).toBe('y');
    expect(rideAxis(undefined, true)).toBe('x');
  });

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

  it('follows the chapter the reader is actually in, including when they scroll back', () => {
    const headings = [100, 400, 900];
    expect(currentChapterIndex(headings, 700)).toBe(1);
    expect(currentChapterIndex(headings, 150)).toBe(0);
  });

  it('maps the reading line to a bounded position between the first and last chapter', () => {
    const headings = [100, 400, 900];
    expect(chapterProgress(headings, 650)).toBe(0.6875);
    expect(chapterProgress(headings, 0)).toBe(0);
    expect(chapterProgress(headings, 1100)).toBe(1);
  });
});
