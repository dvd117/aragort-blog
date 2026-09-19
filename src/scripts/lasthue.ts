/**
 * The visit's hue roll, on the client, and the post hue worth remembering.
 * Both read what the inline head script (src/lib/lasthue.ts) already settled.
 */
import { LAST_HUE_KEY, ROLL_KEY, rollHue } from '../lib/lasthue';

/** The offset the inline script drew for this visit. 0 if it never ran. */
export function hueRoll(): number {
  try { return Number(sessionStorage.getItem(ROLL_KEY)) || 0; } catch { return 0; }
}

/** A post's base hue as this visit shows it. */
export function rolled(base: string): string {
  return rollHue(base, hueRoll());
}

/** Remember this post's *base* hue, so the landing and "Sobre mí" open in it next time. */
export function rememberHue(base: string): void {
  try { localStorage.setItem(LAST_HUE_KEY, base); } catch { /* private mode */ }
}
