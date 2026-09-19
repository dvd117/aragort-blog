/**
 * Enfoque: marks the block on the reading line (40% down the viewport) as
 * .is-reading. CSS dims the rest only while data-focus="on".
 */
export function initFocus(): void {
  const prose = document.querySelector<HTMLElement>('.post .prose');
  if (!prose) return;
  let current: Element | null = null;
  let queued = false;

  const update = () => {
    queued = false;
    if (document.documentElement.getAttribute('data-focus') !== 'on') return;
    const line = innerHeight * 0.4;
    let pick: Element | null = null;
    for (const el of prose.children) {
      const r = el.getBoundingClientRect();
      if (r.height === 0) continue;
      pick = el;
      if (r.bottom > line) break;
    }
    if (pick !== current) {
      current?.classList.remove('is-reading');
      pick?.classList.add('is-reading');
      current = pick;
    }
  };
  const schedule = () => { if (!queued) { queued = true; requestAnimationFrame(update); } };
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  document.addEventListener('ajustes:change', schedule);
  update();
}
