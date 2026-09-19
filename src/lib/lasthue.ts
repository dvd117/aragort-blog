/**
 * Which hue rules a page.
 *
 * Every post owns a *base* hue, fixed at build time (frontmatter, or hashed from the slug).
 * What a visitor actually sees is that base rolled forward by one offset, drawn once per
 * visit and kept in sessionStorage: the five hues keep their order, only the starting point
 * moves. So the same post is teal on one visit and sky on the next, while two posts that
 * were neighbours in the order still are.
 *
 * The base lives on `<html data-hue-base>`; the rolled hue on `<html data-hue>`, which is
 * what every stylesheet reads. A page with no post of its own (the landing, "Sobre mí")
 * takes the base of the last post read on this device, so leaving a post and coming back
 * to the landing keeps its colour.
 *
 * All of it is applied by one inline script before first paint, so the page never flashes
 * a hue it is about to drop.
 */
import { HUES } from './hue';

export const LAST_HUE_KEY = 'aragort-hue';
/** The visit's starting point in the hue order. Per tab, not per device: sessionStorage. */
export const ROLL_KEY = 'aragort-hue-roll';

/** Stored value -> hue, or null. Anything that is not one of the five hues is ignored. */
export function parseLastHue(raw: string | null | undefined): string | null {
  return typeof raw === 'string' && (HUES as readonly string[]).includes(raw) ? raw : null;
}

/** A base hue rolled forward by `offset`, keeping the order of HUES. */
export function rollHue(base: string, offset: number): string {
  const i = HUES.indexOf(base as (typeof HUES)[number]);
  if (i === -1) return base;
  const n = HUES.length;
  return HUES[(((i + offset) % n) + n) % n]!;
}

/**
 * Inline, in <head>, on every page. Picks the visit's offset, works out the base hue
 * (the page's own, else the last post read), and writes both attributes. Minified by
 * hand: it runs before anything else.
 */
export function hueScript(): string {
  return `try{var H=${JSON.stringify(HUES)},E=document.documentElement,` +
    `o=sessionStorage.getItem(${JSON.stringify(ROLL_KEY)});` +
    `if(o===null){o=String(Math.floor(Math.random()*H.length));sessionStorage.setItem(${JSON.stringify(ROLL_KEY)},o)}` +
    `o=Number(o)||0;` +
    `var b=E.getAttribute('data-hue')||localStorage.getItem(${JSON.stringify(LAST_HUE_KEY)}),i=H.indexOf(b);` +
    `if(i>-1){E.setAttribute('data-hue-base',b);E.setAttribute('data-hue',H[(i+o)%H.length])}}catch(e){}`;
}
