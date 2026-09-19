/**
 * Net as navigation (index). The hero net, a wire from its bottom-left node and
 * the thread down the list are one line. Choosing an entry lights, in one hue: the
 * entry's own region of the net (its route from the ochre node through its own node to
 * the exit, plus the nodes one wire away from it, data-region), the wire, and the thread
 * down to the entry's node. The net only ever gains light: regions already lit stay lit,
 * wires fill in as their nodes light, and the whole page takes the hue of the entry under
 * the cursor -- one colour at a time, never a carnival. Desktop: hover or keyboard focus.
 * Phone: the entry at mid-screen, as you scroll (a tap lights it on the way out).
 * Drawn in 220ms; instant under reduced motion.
 */
import { reduced } from './motion';

export function initNetNav(): void {
  const root = document.querySelector<HTMLElement>('[data-netnav-root]');
  const wrap = document.querySelector<HTMLElement>('[data-netnav]');
  const net = wrap?.querySelector('svg');
  const list = document.querySelector<HTMLElement>('[data-thread]');
  const entries = [...document.querySelectorAll<HTMLElement>('.entry')];
  if (!root || !wrap || !net || !list || entries.length === 0) return;

  const exit = (wrap.dataset.exit ?? '').split(',').filter(Boolean).map(Number);
  const circles = [...net.querySelectorAll<SVGCircleElement>('circle')];
  const lines = [...net.querySelectorAll<SVGLineElement>('line')];
  const exitCircle = circles[exit.at(-1) ?? 0];
  if (!exitCircle) return;

  // The wire: a base line always there, and the lit path on top.
  const ns = 'http://www.w3.org/2000/svg';
  const wire = document.createElementNS(ns, 'svg');
  wire.setAttribute('class', 'wire');
  wire.setAttribute('aria-hidden', 'true');
  const base = document.createElementNS(ns, 'path');
  base.setAttribute('class', 'base');
  const lit = document.createElementNS(ns, 'path');
  lit.setAttribute('class', 'lit');
  wire.append(base, lit);
  root.prepend(wire);

  let g = { ex: 0, ey: 0, tx: 0, ty: 0 };
  let current: HTMLElement | null = null;

  const layout = () => {
    const r = root.getBoundingClientRect();
    const c = exitCircle.getBoundingClientRect();
    const l = list.getBoundingClientRect();
    g = { ex: c.left + c.width / 2 - r.left, ey: c.top + c.height / 2 - r.top, tx: l.left + 5.5 - r.left, ty: l.top - r.top };
    base.setAttribute('d', `M${g.ex.toFixed(1)} ${g.ey.toFixed(1)}L${g.tx.toFixed(1)} ${g.ty.toFixed(1)}`);
    if (current) draw(current, false);
  };

  const draw = (entry: HTMLElement, animate: boolean) => {
    const r = root.getBoundingClientRect();
    const node = entry.querySelector('.node')!.getBoundingClientRect();
    const ny = node.top + node.height / 2 - r.top;
    lit.setAttribute('d', `M${g.ex.toFixed(1)} ${g.ey.toFixed(1)}L${g.tx.toFixed(1)} ${g.ty.toFixed(1)}L${g.tx.toFixed(1)} ${ny.toFixed(1)}`);
    const len = Math.ceil(lit.getTotalLength());
    lit.style.strokeDasharray = `${len}`;
    if (animate && !reduced()) {
      lit.style.transition = 'none';
      lit.style.strokeDashoffset = `${len}`;
      void lit.getBoundingClientRect();
      lit.style.transition = '';
    }
    lit.style.strokeDashoffset = '0';
  };

  // Cumulative: every node any entry has lit so far. Nothing is ever unlit.
  const on = new Set<number>();

  const light = (entry: HTMLElement | null) => {
    if (entry === current) return;
    current = entry;
    // Leaving the list keeps the trail (and its hue); only the thread segment lets go.
    if (!entry) { lit.removeAttribute('d'); return; }
    // The trail recolours at once; only the nodes new to this entry draw in, one by one.
    for (const el of [...circles, ...lines]) el.style.removeProperty('--i');
    // One hue rules the whole page: the net, the entries, the links. Never a mix.
    document.documentElement.setAttribute('data-hue', entry.dataset.postHue ?? 'ochre');
    const region = (entry.dataset.region ?? '').split(',').filter(Boolean).map(Number);
    (region.length ? region : exit).forEach((n, i) => {
      if (!on.has(n)) { on.add(n); circles[n]?.style.setProperty('--i', String(i)); }
      circles[n]?.classList.add('path');
    });
    // A wire lights once both of its nodes are lit, so separate regions knit together
    // as the trail grows.
    for (const wireEl of lines) {
      const a = Number(wireEl.dataset.a), b = Number(wireEl.dataset.b);
      if (!on.has(a) || !on.has(b) || wireEl.classList.contains('path')) continue;
      wireEl.style.setProperty('--i', String(Math.max(region.indexOf(a), region.indexOf(b), 0)));
      wireEl.classList.add('path');
    }
    draw(entry, true);
  };

  for (const entry of entries) {
    entry.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') light(entry); });
    entry.addEventListener('focusin', () => light(entry));
    entry.addEventListener('pointerdown', () => light(entry));
  }
  list.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse' && !document.activeElement?.closest('.entry')) light(null);
  });

  // Phone: the entry nearest the middle of the screen is current.
  const phone = matchMedia('(max-width: 899px), (hover: none) and (pointer: coarse)');
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
  addEventListener('resize', layout);
  document.fonts?.ready.then(layout);
  requestAnimationFrame(() => { layout(); follow(); });
}
