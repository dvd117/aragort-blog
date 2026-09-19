import { describe, expect, it } from 'vitest';
import { DEFAULTS, headScript, parseSettings, SCHEMA, serializeSettings, toAttributes, type Settings } from '../src/lib/settings';

describe('reading settings: serialization', () => {
  it('stores only what differs from the defaults', () => {
    expect(serializeSettings(DEFAULTS)).toBe('{}');
    expect(serializeSettings({ ...DEFAULTS, theme: 'sepia', size: '4' })).toBe('{"theme":"sepia","size":"4"}');
  });

  it('round-trips every value of every setting', () => {
    for (const [key, spec] of Object.entries(SCHEMA)) {
      for (const value of spec.values) {
        const s = { ...DEFAULTS, [key]: value } as Settings;
        expect(parseSettings(serializeSettings(s))).toEqual(s);
      }
    }
  });

  it('ignores unknown keys and invalid values', () => {
    const s = parseSettings('{"theme":"neon","size":"9","font":"atkinson","evil":"<script>"}');
    expect(s).toEqual({ ...DEFAULTS, font: 'atkinson' });
  });

  it('falls back to defaults on corrupt or odd storage', () => {
    expect(parseSettings('{not json')).toEqual(DEFAULTS);
    expect(parseSettings('[1,2]')).toEqual(DEFAULTS);
    expect(parseSettings('null')).toEqual(DEFAULTS);
    expect(parseSettings(null)).toEqual(DEFAULTS);
  });

  it('migrates the v1 theme once, and only when nothing newer is stored', () => {
    expect(parseSettings(null, 'dark').theme).toBe('dark');
    expect(parseSettings('{"theme":"sepia"}', 'dark').theme).toBe('sepia');
    expect(parseSettings(null, 'purple').theme).toBe('dark');
  });
});

describe('reading settings: attributes', () => {
  it('removes attributes for defaults, so the base CSS applies', () => {
    const attrs = toAttributes(DEFAULTS);
    expect(Object.values(attrs).every((v) => v === null)).toBe(true);
    expect(Object.keys(attrs)).toContain('data-theme');
  });

  it('sets one attribute per changed setting', () => {
    const attrs = toAttributes({ ...DEFAULTS, theme: 'contrast', focus: 'on', motion: 'reduce' });
    expect(attrs['data-theme']).toBe('contrast');
    expect(attrs['data-focus']).toBe('on');
    expect(attrs['data-motion']).toBe('reduce');
    expect(attrs['data-size']).toBeNull();
  });
});

describe('reading settings: head script', () => {
  // Run the inline script against a tiny fake DOM and storage.
  function runHead(stored: Record<string, string>): Record<string, string> {
    const attrs: Record<string, string> = {};
    const document = { documentElement: { setAttribute: (k: string, v: string) => { attrs[k] = v; } } };
    const localStorage = { getItem: (k: string) => stored[k] ?? null };
    new Function('document', 'localStorage', headScript())(document, localStorage);
    return attrs;
  }

  it('applies the same attributes as the panel would', () => {
    const s: Settings = { ...DEFAULTS, theme: 'sepia', size: '5', font: 'atkinson', links: 'all' };
    const expected = Object.fromEntries(Object.entries(toAttributes(s)).filter(([, v]) => v !== null));
    expect(runHead({ 'aragort-lectura': serializeSettings(s) })).toEqual(expected);
  });

  it('rejects invalid stored values before they reach the page', () => {
    expect(runHead({ 'aragort-lectura': '{"theme":"x\\" onload=\\"alert(1)","size":"2"}' })).toEqual({ 'data-size': '2' });
  });

  it('migrates the v1 theme key', () => {
    expect(runHead({ 'aragort-theme': 'dark' })).toEqual({});
    expect(runHead({ 'aragort-theme': 'light' })).toEqual({ 'data-theme': 'light' });
  });

  it('with nothing saved sets no theme: the base CSS is dark, for everyone', () => {
    expect(runHead({})).toEqual({});
    expect(DEFAULTS.theme).toBe('dark');
  });

  it('Sistema is an explicit choice that follows the OS', () => {
    expect(runHead({ 'aragort-lectura': '{"theme":"system"}' })).toEqual({ 'data-theme': 'system' });
    expect(runHead({ 'aragort-lectura': '{"theme":"dark"}' })).toEqual({});
  });

  it('survives corrupt storage without throwing', () => {
    expect(runHead({ 'aragort-lectura': '{oops' })).toEqual({});
  });
});
