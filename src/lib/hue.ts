/**
 * Each post owns one hue: `hue` in its frontmatter, or one assigned from the slug.
 * The three are the flag's, in the order they appear on it -- amarillo, azul, rojo --
 * muted to the page's palette: a quiet reference, not a flag drawn on the screen.
 * The assignment is a hash, so it never changes between builds and does not depend on
 * the order of posts.
 */
export const HUES = ['amarillo', 'azul', 'rojo'] as const;
export type Hue = (typeof HUES)[number];

/** FNV-1a, 32-bit. Small, stable, good enough to spread slugs over the three hues. */
function fnv1a(text: string): number {
  let h = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(text)) {
    h ^= byte;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

export function hueFor(slug: string, chosen?: Hue): Hue {
  return chosen ?? HUES[fnv1a(slug) % HUES.length]!;
}
