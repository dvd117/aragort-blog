/** Remember this post's hue, so the landing and "Sobre mí" open in it next time. */
import { LAST_HUE_KEY } from '../lib/lasthue';

export function rememberHue(hue: string): void {
  try { localStorage.setItem(LAST_HUE_KEY, hue); } catch { /* private mode */ }
}
