/**
 * Landing -> post on desktop: the hero net becomes the reading rail. On the landing, the
 * click on an entry stores where the hero's nodes are on screen. On the post, the rail
 * starts from those points (each rail node from the hero node at the same place in
 * reading order) and glides into its own shape in 450ms,
 * then reading lights it as usual. Phone, reduced motion, or no stored points: nothing.
 */
import { reduced } from './motion';
import { morphFrom } from './netlive';
import { mapByOrder } from '../lib/netmap';

const KEY = 'aragort-net-from';

export function rememberHero(): void {
  const svg = document.querySelector<SVGSVGElement>('.hero-net .net');
  if (!svg) return;
  document.addEventListener('click', (e) => {
    if (!(e.target as Element).closest?.('.entry a')) return;
    const pts = [...svg.querySelectorAll('circle')].map((c) => { const r = c.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    const seen = pts.filter(([x, y]) => x! >= 0 && x! <= innerWidth && y! >= 0 && y! <= innerHeight).length;
    if (seen < pts.length / 2) return;
    try { sessionStorage.setItem(KEY, JSON.stringify({ t: Date.now(), pts })); } catch { /* storage off */ }
  });
}

export function arriveOnRail(): void {
  let data: { t: number; pts: [number, number][] } | null = null;
  try { data = JSON.parse(sessionStorage.getItem(KEY) ?? 'null'); sessionStorage.removeItem(KEY); } catch { return; }
  if (!data || Date.now() - data.t > 4000 || reduced() || !matchMedia('(min-width: 1000px)').matches) return;
  const svg = document.querySelector<SVGSVGElement>('.rail .net');
  const m = svg?.getScreenCTM();
  if (!svg || !m) return;
  const inv = m.inverse();
  const from = data.pts.map(([x, y]) => { const p = new DOMPoint(x, y).matrixTransform(inv); return [p.x, p.y] as [number, number]; });
  const map = mapByOrder(from.length, svg.querySelectorAll('circle').length);
  morphFrom(svg, map.map((i) => from[i]!));
}
