/**
 * The three hues are the flag's, in the order they appear on it -- amarillo, azul, rojo --
 * muted to the page's palette: a quiet reference, not a flag drawn on the screen.
 *
 * They run in that order down the list and start over: the newest post is amarillo, the
 * one under it azul, then rojo, then amarillo again. Nothing is hashed and nothing is
 * rolled -- the order is the flag's and a post's place in the list is its colour.
 */
export const HUES = ['amarillo', 'azul', 'rojo'] as const;
export type Hue = (typeof HUES)[number];

/** Position in the list (newest is 0) -> hue. */
export function hueAt(index: number): Hue {
  const n = HUES.length;
  return HUES[((index % n) + n) % n]!;
}
