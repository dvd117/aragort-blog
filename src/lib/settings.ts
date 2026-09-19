/**
 * Reading settings ("Ajustes de lectura").
 *
 * Every setting is one data attribute on <html>; CSS custom properties do the
 * rest, so scripts only toggle attributes. The same schema drives the inline
 * head script (applied before first paint), the panel and the tests.
 */

export const STORAGE_KEY = 'aragort-lectura';
/** v1 stored only the theme under this key; it is migrated once. */
export const LEGACY_THEME_KEY = 'aragort-theme';

export const SCHEMA = {
  theme: { attr: 'data-theme', values: ['system', 'light', 'dark', 'sepia', 'contrast'], default: 'system' },
  size: { attr: 'data-size', values: ['1', '2', '3', '4', '5'], default: '3' },
  leading: { attr: 'data-leading', values: ['1', '2', '3'], default: '2' },
  tracking: { attr: 'data-tracking', values: ['1', '2'], default: '1' },
  measure: { attr: 'data-measure', values: ['1', '2', '3'], default: '2' },
  font: { attr: 'data-font', values: ['sans', 'serif', 'atkinson'], default: 'sans' },
  focus: { attr: 'data-focus', values: ['off', 'on'], default: 'off' },
  links: { attr: 'data-links', values: ['off', 'all'], default: 'off' },
  motion: { attr: 'data-motion', values: ['auto', 'reduce'], default: 'auto' },
} as const;

export type Key = keyof typeof SCHEMA;
export type Settings = { [K in Key]: (typeof SCHEMA)[K]['values'][number] };

export const DEFAULTS = Object.fromEntries(
  Object.entries(SCHEMA).map(([k, s]) => [k, s.default]),
) as Settings;

const isValue = <K extends Key>(key: K, v: unknown): v is Settings[K] =>
  typeof v === 'string' && (SCHEMA[key].values as readonly string[]).includes(v);

/** Stored JSON -> settings. Unknown keys and invalid values fall back to defaults. */
export function parseSettings(raw: string | null | undefined, legacyTheme?: string | null): Settings {
  const out: Settings = { ...DEFAULTS };
  let data: Record<string, unknown> = {};
  try {
    const parsed = raw ? JSON.parse(raw) : {};
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) data = parsed;
  } catch { /* corrupt storage: defaults */ }
  for (const key of Object.keys(SCHEMA) as Key[]) {
    const v = data[key];
    if (isValue(key, v)) (out as Record<Key, string>)[key] = v;
  }
  if (!raw && isValue('theme', legacyTheme)) out.theme = legacyTheme;
  return out;
}

/** Settings -> stored JSON, keeping only what differs from the defaults. */
export function serializeSettings(s: Settings): string {
  const diff: Partial<Record<Key, string>> = {};
  for (const key of Object.keys(SCHEMA) as Key[]) {
    if (isValue(key, s[key]) && s[key] !== DEFAULTS[key]) diff[key] = s[key];
  }
  return JSON.stringify(diff);
}

/** Settings -> attributes for <html>. Defaults are removed (null), so the base CSS applies. */
export function toAttributes(s: Settings): Record<string, string | null> {
  const attrs: Record<string, string | null> = {};
  for (const key of Object.keys(SCHEMA) as Key[]) {
    const v = s[key];
    attrs[SCHEMA[key].attr] = v === DEFAULTS[key] ? null : v;
  }
  return attrs;
}

/**
 * The inline <head> script: read storage, apply attributes before first paint.
 * Built from SCHEMA so the two can't drift. Plain ES5, no imports.
 */
export function headScript(): string {
  const table = Object.fromEntries(
    Object.entries(SCHEMA).map(([k, s]) => [k, [s.attr, s.values, s.default]]),
  );
  return `(function(){try{var T=${JSON.stringify(table)},d=document.documentElement,r=localStorage.getItem(${JSON.stringify(STORAGE_KEY)}),o={};` +
    `if(r){o=JSON.parse(r)||{}}else{var l=localStorage.getItem(${JSON.stringify(LEGACY_THEME_KEY)});if(l)o.theme=l}` +
    `for(var k in T){var v=o[k],t=T[k];if(typeof v==='string'&&t[1].indexOf(v)>-1&&v!==t[2])d.setAttribute(t[0],v)}}catch(e){}})();`;
}
