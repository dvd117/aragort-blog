/**
 * Which hue rules a page.
 *
 * Every post owns one of the flag's three, fixed at build time by its place in the list
 * (see hue.ts) and never shuffled: the order is the flag's and it stays put. The hue lives
 * on `<html data-hue>`, which is what every stylesheet reads, so one colour rules the whole
 * page at a time.
 *
 * A page with no post of its own (the landing, "Sobre mí") takes the hue of the last post
 * read on this device, so leaving a post and coming back to the landing keeps its colour.
 * It is applied by one inline script before first paint, so the page never flashes a hue
 * it is about to drop.
 */
import { HUES } from './hue';

export const LAST_HUE_KEY = 'aragort-hue';

/** Stored value -> hue, or null. Anything that is not one of the three hues is ignored. */
export function parseLastHue(raw: string | null | undefined): string | null {
  return typeof raw === 'string' && (HUES as readonly string[]).includes(raw) ? raw : null;
}

/**
 * Inline, in <head>, on a page with no hue of its own. Minified by hand: it runs first.
 */
export function hueScript(): string {
  return `try{var H=${JSON.stringify(HUES)},E=document.documentElement;` +
    `if(!E.getAttribute('data-hue')){var b=localStorage.getItem(${JSON.stringify(LAST_HUE_KEY)});` +
    `if(H.indexOf(b)>-1)E.setAttribute('data-hue',b)}}catch(e){}`;
}
