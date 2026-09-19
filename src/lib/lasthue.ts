/**
 * The hue that rules a page with no post of its own (the landing, "Sobre mí"): the hue of
 * the last post read on this device. It is remembered by the post page and applied to
 * <html> before first paint, so the site opens in the colour you left it in. Nothing is
 * remembered until a post is opened; until then the default ochre rules.
 */
import { HUES } from './hue';

export const LAST_HUE_KEY = 'aragort-hue';

/** Stored value -> hue, or null. Anything that is not one of the five hues is ignored. */
export function parseLastHue(raw: string | null | undefined): string | null {
  return typeof raw === 'string' && (HUES as readonly string[]).includes(raw) ? raw : null;
}

/** Inline, in <head>, on pages with no hue of their own. Minified by hand: it runs first. */
export function lastHueScript(): string {
  return `try{var h=localStorage.getItem(${JSON.stringify(LAST_HUE_KEY)});` +
    `if(${JSON.stringify(HUES)}.indexOf(h)>-1)document.documentElement.setAttribute('data-hue',h)}catch(e){}`;
}
