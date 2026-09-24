/**
 * Buscar. One box under the hero narrows the list as you type: title,
 * description, "Las tres ideas" lines and the date, accent- and case-insensitive, so "deje"
 * finds "dejé" and "septiembre" finds the date. It searches what the landing already
 * shows, not the body of the posts -- no index is shipped.
 * Every change is announced on the list as "thread:filter", so the thread can re-measure.
 *
 * The box only appears with JS (it is built here), so the list is never left unfiltered
 * behind a control that does nothing. Hiding an entry hides its node on the thread with
 * it; the net keeps whatever it has already lit, because light is never taken away.
 */
/** Below this many entries the box is noise; raise it if the list stays short. */
const MIN_ENTRIES = 1;

const fold = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

export function initFilter(): void {
  const list = document.querySelector<HTMLElement>('[data-thread]');
  const entries = [...document.querySelectorAll<HTMLElement>('.entry')];
  const hero = document.querySelector<HTMLElement>('.hero');
  if (!list || !hero || entries.length < MIN_ENTRIES) return;

  const haystack = new Map(entries.map((e) => [e, fold(e.innerText)]));

  const form = document.createElement('form');
  form.className = 'filter';
  form.setAttribute('role', 'search');
  form.addEventListener('submit', (e) => e.preventDefault());

  const id = 'buscar';
  const label = document.createElement('label');
  label.className = 'visually-hidden';
  label.htmlFor = id;
  label.textContent = 'Buscar escritos';

  const box = document.createElement('input');
  box.type = 'search';
  box.id = id;
  box.placeholder = 'Buscar';
  box.autocomplete = 'off';
  box.setAttribute('aria-describedby', 'buscar-n');

  const count = document.createElement('p');
  count.id = 'buscar-n';
  count.className = 'filter-n';
  count.setAttribute('role', 'status'); // announced only when it changes

  form.append(label, box, count);
  hero.after(form);

  const apply = () => {
    const q = fold(box.value.trim());
    let shown = 0;
    for (const entry of entries) {
      const hit = !q || haystack.get(entry)!.includes(q);
      entry.hidden = !hit;
      if (hit) shown++;
    }
    list.classList.toggle('is-filtered', Boolean(q));
    count.textContent = !q
      ? ''
      : shown === 0
        ? 'Ningún escrito coincide'
        : `${shown} de ${entries.length} escritos`;
    // The thread (netnav.ts) re-measures: hidden entries leave it, and their sections with them.
    list.dispatchEvent(new CustomEvent('thread:filter'));
  };

  box.addEventListener('input', apply);
  // Escape clears the box, whatever the browser's own search widget does.
  box.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && box.value) { e.preventDefault(); box.value = ''; apply(); }
  });
}
