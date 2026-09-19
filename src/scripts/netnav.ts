/**
 * Net as navigation (index). Each entry carries a path through the hero net,
 * computed at build time. Desktop: hovering or focusing an entry lights its
 * path in the post's hue. Phone (no hover): the entry at mid-screen lights it,
 * in the sticky band above the list. Keyboard focus works everywhere.
 */
export function initNetNav(): void {
  const wrap = document.querySelector<HTMLElement>('[data-netnav]');
  const svg = wrap?.querySelector('svg');
  const entries = [...document.querySelectorAll<HTMLElement>('.entry[data-path]')];
  if (!wrap || !svg || entries.length === 0) return;

  const circles = [...svg.querySelectorAll<SVGCircleElement>('circle')];
  const lines = [...svg.querySelectorAll<SVGLineElement>('line')];
  let current: HTMLElement | null = null;

  const light = (entry: HTMLElement | null) => {
    if (entry === current) return;
    current = entry;
    for (const el of [...circles, ...lines]) { el.classList.remove('path'); el.style.removeProperty('--i'); }
    if (!entry) { wrap.removeAttribute('data-hue'); return; }
    wrap.setAttribute('data-hue', entry.dataset.hue ?? 'ochre');
    const path = (entry.dataset.path ?? '').split(',').map(Number);
    path.forEach((node, i) => {
      const c = circles[node];
      if (c) { c.classList.add('path'); c.style.setProperty('--i', String(i)); }
      const prev = path[i - 1];
      if (prev === undefined) return;
      const wire = lines.find((l) => {
        const a = Number(l.dataset.a), b = Number(l.dataset.b);
        return (a === prev && b === node) || (a === node && b === prev);
      });
      if (wire) { wire.classList.add('path'); wire.style.setProperty('--i', String(i)); }
    });
  };

  for (const entry of entries) {
    entry.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') light(entry); });
    entry.addEventListener('focusin', () => light(entry));
    entry.addEventListener('pointerdown', () => light(entry)); // a tap lights it on the way out
  }
  document.querySelector('.entries')?.addEventListener('pointerleave', (e) => {
    if ((e as PointerEvent).pointerType === 'mouse' && !document.activeElement?.closest('.entry')) light(null);
  });

  // Phone: follow the scroll. The entry nearest the middle of the screen is current.
  const phone = matchMedia('(hover: none), (max-width: 899px)');
  let queued = false;
  const follow = () => {
    queued = false;
    if (!phone.matches) return;
    const mid = innerHeight / 2;
    let best: HTMLElement | null = null;
    let bestDist = Infinity;
    for (const entry of entries) {
      const r = entry.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) continue;
      const d = Math.abs(r.top + r.height / 2 - mid);
      if (d < bestDist) { bestDist = d; best = entry; }
    }
    light(best);
  };
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(follow); } }, { passive: true });
  follow();
}
