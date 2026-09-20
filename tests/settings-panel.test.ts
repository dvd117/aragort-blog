// @vitest-environment happy-dom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { initSettingsPanel } from '../src/scripts/settings-panel';
import { LEGACY_THEME_KEY, STORAGE_KEY } from '../src/lib/settings';

beforeEach(() => {
  localStorage.clear();
  for (const key of ['theme', 'size', 'font', 'leading', 'tracking', 'measure', 'focus', 'links', 'motion']) {
    document.documentElement.removeAttribute(`data-${key}`);
  }
  document.body.innerHTML = `
    <button data-ajustes-open aria-expanded="false">Ajustes</button>
    <section id="ajustes" hidden>
      <h2 id="ajustes-title" tabindex="-1">Ajustes de lectura</h2>
      <input type="radio" name="theme" data-key="theme" value="system">
      <input type="radio" name="theme" data-key="theme" value="sepia">
      <input type="radio" name="size" data-key="size" value="3">
      <input type="radio" name="size" data-key="size" value="5">
      <input type="radio" name="font" data-key="font" value="sans">
      <input type="radio" name="font" data-key="font" value="serif">
      <input type="checkbox" data-key="focus" value="on">
      <input type="checkbox" data-key="links" value="all">
      <input type="checkbox" data-key="motion" value="reduce">
      <button data-ajustes-close>Cerrar</button>
      <button data-ajustes-reset>Restablecer</button>
    </section>`;
});

afterEach(() => {
  vi.restoreAllMocks();
});

it('applies and resets a preference', () => {
  initSettingsPanel();
  const input = document.querySelector<HTMLInputElement>('input[data-key="theme"][value="sepia"]')!;
  input.checked = true;
  input.dispatchEvent(new Event('change', { bubbles: true }));
  expect(document.documentElement.dataset.theme).toBe('sepia');
  expect(JSON.parse(localStorage.getItem('aragort-lectura')!)).toEqual({ theme: 'sepia' });
  document.querySelector<HTMLButtonElement>('[data-ajustes-reset]')!.click();
  expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  expect(localStorage.getItem('aragort-lectura')).toBeNull();
});

it('opens with the title focused and returns focus when closed', () => {
  initSettingsPanel();
  const open = document.querySelector<HTMLButtonElement>('[data-ajustes-open]')!;
  const panel = document.getElementById('ajustes')!;
  const title = document.getElementById('ajustes-title')!;

  open.click();
  expect(panel.hidden).toBe(false);
  expect(open.getAttribute('aria-expanded')).toBe('true');
  expect(document.activeElement).toBe(title);

  document.querySelector<HTMLButtonElement>('[data-ajustes-close]')!.click();
  expect(panel.hidden).toBe(true);
  expect(open.getAttribute('aria-expanded')).toBe('false');
  expect(document.activeElement).toBe(open);

  open.click();
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  expect(panel.hidden).toBe(true);
  expect(document.activeElement).toBe(open);
});

it('populates controls from saved values', () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: 'sepia', size: '5', font: 'serif', focus: 'on', links: 'all', motion: 'reduce' }));
  initSettingsPanel();

  expect(document.querySelector<HTMLInputElement>('input[data-key="theme"][value="sepia"]')!.checked).toBe(true);
  expect(document.querySelector<HTMLInputElement>('input[data-key="size"][value="5"]')!.checked).toBe(true);
  expect(document.querySelector<HTMLInputElement>('input[data-key="font"][value="serif"]')!.checked).toBe(true);
  expect(document.querySelector<HTMLInputElement>('input[data-key="focus"]')!.checked).toBe(true);
  expect(document.querySelector<HTMLInputElement>('input[data-key="links"]')!.checked).toBe(true);
  expect(document.querySelector<HTMLInputElement>('input[data-key="motion"]')!.checked).toBe(true);
});

it('toggles checkbox preferences back to their schema defaults', () => {
  initSettingsPanel();

  for (const key of ['focus', 'links', 'motion']) {
    const input = document.querySelector<HTMLInputElement>(`input[data-key="${key}"]`)!;
    input.checked = true;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(document.documentElement.hasAttribute(`data-${key}`)).toBe(true);

    input.checked = false;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    expect(document.documentElement.hasAttribute(`data-${key}`)).toBe(false);
  }
});

it('dispatches ajustes:change and clears both storage keys on reset', () => {
  const changed = vi.fn();
  document.addEventListener('ajustes:change', changed);
  localStorage.setItem(LEGACY_THEME_KEY, 'dark');
  initSettingsPanel();

  const theme = document.querySelector<HTMLInputElement>('input[data-key="theme"][value="sepia"]')!;
  theme.checked = true;
  theme.dispatchEvent(new Event('change', { bubbles: true }));
  expect(changed).toHaveBeenCalledTimes(1);

  document.querySelector<HTMLButtonElement>('[data-ajustes-reset]')!.click();
  expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  expect(localStorage.getItem(LEGACY_THEME_KEY)).toBeNull();
  expect(changed).toHaveBeenCalledTimes(2);
  document.removeEventListener('ajustes:change', changed);
});

it('keeps applying changes when storage reads are blocked', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
  expect(() => initSettingsPanel()).not.toThrow();

  const theme = document.querySelector<HTMLInputElement>('input[data-key="theme"][value="sepia"]')!;
  theme.checked = true;
  expect(() => theme.dispatchEvent(new Event('change', { bubbles: true }))).not.toThrow();
  expect(document.documentElement.dataset.theme).toBe('sepia');
});

it('keeps applying and resetting changes when storage writes are blocked', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => { throw new Error('blocked'); });
  initSettingsPanel();

  const theme = document.querySelector<HTMLInputElement>('input[data-key="theme"][value="sepia"]')!;
  theme.checked = true;
  expect(() => theme.dispatchEvent(new Event('change', { bubbles: true }))).not.toThrow();
  expect(document.documentElement.dataset.theme).toBe('sepia');
  expect(() => document.querySelector<HTMLButtonElement>('[data-ajustes-reset]')!.click()).not.toThrow();
  expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
});

it('does not duplicate listeners when initialized again', () => {
  initSettingsPanel();
  initSettingsPanel();
  document.querySelector<HTMLButtonElement>('[data-ajustes-open]')!.click();
  expect(document.getElementById('ajustes')!.hidden).toBe(false);
});
