import { describe, expect, it } from 'vitest';
import { HUES, hueAt } from '../src/lib/hue';

describe('the hue cycle', () => {
  it('is amarillo, azul, rojo, in the order they appear on the flag', () => {
    expect(HUES).toEqual(['amarillo', 'azul', 'rojo']);
  });

  it('runs the flag\'s order down the list and starts over', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(hueAt)).toEqual(
      ['amarillo', 'azul', 'rojo', 'amarillo', 'azul', 'rojo', 'amarillo'],
    );
  });

  it('gives the newest post amarillo, so the list always opens on the flag\'s first', () => {
    expect(hueAt(0)).toBe('amarillo');
  });

  it('always returns one of the three, however long the list', () => {
    for (let i = 0; i < 200; i++) expect(HUES).toContain(hueAt(i));
  });
});
