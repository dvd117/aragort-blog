import {
  DEFAULTS,
  LEGACY_THEME_KEY,
  parseSettings,
  serializeSettings,
  STORAGE_KEY,
  toAttributes,
  type Key,
  type Settings,
} from '../lib/settings';

let teardown: (() => void) | undefined;

export function initSettingsPanel(): void {
  teardown?.();
  teardown = undefined;

  const root = document.documentElement;
  const btn = document.querySelector<HTMLButtonElement>('[data-ajustes-open]');
  const panel = document.getElementById('ajustes');
  const title = document.getElementById('ajustes-title');
  if (!panel) return;

  const load = (): Settings => {
    try {
      return parseSettings(localStorage.getItem(STORAGE_KEY), localStorage.getItem(LEGACY_THEME_KEY));
    } catch {
      return { ...DEFAULTS };
    }
  };
  let state = load();

  const save = () => {
    try { localStorage.setItem(STORAGE_KEY, serializeSettings(state)); } catch { /* private mode */ }
    try { localStorage.removeItem(LEGACY_THEME_KEY); } catch { /* private mode */ }
  };

  const sync = () => {
    panel.querySelectorAll<HTMLInputElement>('input[data-key]').forEach((input) => {
      input.checked = state[input.dataset.key as Key] === input.value;
    });
  };

  const apply = () => {
    for (const [attr, value] of Object.entries(toAttributes(state))) {
      if (value === null) root.removeAttribute(attr);
      else root.setAttribute(attr, value);
    }
    sync();
    document.dispatchEvent(new CustomEvent('ajustes:change'));
  };

  const onChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const key = input.dataset.key as Key | undefined;
    if (!key) return;
    const value = input.type === 'checkbox'
      ? (input.checked ? input.value : DEFAULTS[key])
      : input.value;
    state = { ...state, [key]: value } as Settings;
    save();
    apply();
  };

  const open = () => {
    if (!btn) return;
    panel.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    title?.focus();
  };
  const close = () => {
    if (!btn || panel.hidden) return;
    panel.hidden = true;
    btn.setAttribute('aria-expanded', 'false');
    btn.focus();
  };
  const onKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') close();
  };
  const onToggle = () => (panel.hidden ? open() : close());
  const onReset = () => {
    state = { ...DEFAULTS };
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* private mode */ }
    try { localStorage.removeItem(LEGACY_THEME_KEY); } catch { /* private mode */ }
    apply();
  };

  panel.addEventListener('change', onChange);
  btn?.addEventListener('click', onToggle);
  const closeButton = panel.querySelector('[data-ajustes-close]');
  closeButton?.addEventListener('click', close);
  const resetButton = panel.querySelector('[data-ajustes-reset]');
  resetButton?.addEventListener('click', onReset);
  document.addEventListener('keydown', onKeydown);

  sync();

  teardown = () => {
    panel.removeEventListener('change', onChange);
    btn?.removeEventListener('click', onToggle);
    closeButton?.removeEventListener('click', close);
    resetButton?.removeEventListener('click', onReset);
    document.removeEventListener('keydown', onKeydown);
  };
}
