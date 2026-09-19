/**
 * Sigue donde quedaste. Remembers, on this device only, the last paragraph read
 * in each post, and on return offers to jump there. Non-blocking, dismissible,
 * forgotten after 30 days or once the post is finished.
 */
import { reduced } from './motion';

const KEY = 'aragort-sigue';
const MAX_AGE = 30 * 24 * 60 * 60 * 1000;
type Store = Record<string, { i: number; t: number }>;

const read = (): Store => {
  try {
    const data = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return data && typeof data === 'object' && !Array.isArray(data) ? data : {};
  } catch { return {}; }
};
const write = (s: Store) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode */ } };

export function initResume(slug: string): void {
  const paras = [...document.querySelectorAll<HTMLElement>('.post .prose > p')];
  if (paras.length < 4) return;

  const now = Date.now();
  const store = read();
  for (const [k, v] of Object.entries(store)) {
    if (typeof v?.i !== 'number' || typeof v?.t !== 'number' || now - v.t > MAX_AGE) delete store[k];
  }
  write(store);
  const saved = store[slug];

  // Offer to resume: only from the top of the page, not when a link points inside it.
  if (saved && saved.i >= 2 && saved.i < paras.length && scrollY < 120 && !location.hash) {
    const box = document.createElement('div');
    box.className = 'resume';
    box.setAttribute('role', 'region');
    box.setAttribute('aria-label', 'Seguir leyendo');
    const text = document.createElement('p');
    text.textContent = 'Sigue donde quedaste';
    const go = document.createElement('button');
    go.type = 'button';
    go.textContent = `Ir al párrafo ${saved.i + 1}`;
    const no = document.createElement('button');
    no.type = 'button';
    no.className = 'resume-x';
    no.setAttribute('aria-label', 'Descartar');
    no.textContent = '×';
    box.append(text, go, no);
    document.body.append(box);
    requestAnimationFrame(() => box.classList.add('in'));

    const hide = () => { box.remove(); removeEventListener('scroll', far); };
    const far = () => { if (scrollY > 600) hide(); };
    addEventListener('scroll', far, { passive: true });
    no.addEventListener('click', hide);
    go.addEventListener('click', () => {
      const p = paras[saved.i]!;
      p.tabIndex = -1;
      p.scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' });
      p.focus({ preventScroll: true });
      hide();
    });
  }

  // Remember the paragraph on the reading line; forget the post once finished.
  let last = -1;
  let queued = false;
  const track = () => {
    queued = false;
    const line = innerHeight * 0.4;
    let i = 0;
    for (; i < paras.length - 1; i++) if (paras[i]!.getBoundingClientRect().bottom > line) break;
    if (i === last) return;
    last = i;
    const s = read();
    if (i >= paras.length - 2) delete s[slug];
    else if (i >= 2) s[slug] = { i, t: Date.now() };
    else return;
    write(s);
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(track); } }, { passive: true });
}
