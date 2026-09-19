/**
 * Net as navigation: each post owns a node in the hero net, reached by a short
 * path from the lit ochre node. Paths are computed at build time from the
 * frozen geometry, so the page only toggles classes.
 */
import type { NetGeometry } from '../assets/net/geometry';

function neighbours(g: NetGeometry): number[][] {
  const adj: number[][] = g.nodes.map(() => []);
  for (const [a, b] of g.edges) { adj[a]!.push(b); adj[b]!.push(a); }
  return adj;
}

/** Breadth-first distances and parents from `start`. */
function bfs(g: NetGeometry, start: number) {
  const adj = neighbours(g);
  const dist = new Array<number>(g.nodes.length).fill(-1);
  const parent = new Array<number>(g.nodes.length).fill(-1);
  dist[start] = 0;
  const queue = [start];
  for (let q = queue.shift(); q !== undefined; q = queue.shift()) {
    for (const n of adj[q]!.slice().sort((x, y) => x - y)) {
      if (dist[n] !== -1) continue;
      dist[n] = dist[q]! + 1;
      parent[n] = q;
      queue.push(n);
    }
  }
  return { dist, parent };
}

function hash(text: string): number {
  let h = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(text)) { h ^= byte; h = Math.imul(h, 0x01000193) >>> 0; }
  return h;
}

/** Node indices from the start node to the post's node: 4 to 6 nodes, stable per slug. */
export function pathFor(g: NetGeometry, slug: string, start = g.lit[0] ?? 0): number[] {
  const { dist, parent } = bfs(g, start);
  let pool = dist.map((d, i) => [d, i] as const).filter(([d]) => d >= 3 && d <= 5).map(([, i]) => i);
  if (pool.length === 0) pool = dist.map((d, i) => [d, i] as const).filter(([d]) => d > 0).map(([, i]) => i);
  const target = pool[hash(slug) % pool.length]!;
  const path: number[] = [];
  for (let n = target; n !== -1; n = parent[n]!) path.unshift(n);
  return path;
}

/** The node where the net meets the list's thread: the bottom-left-most node. */
export function exitNode(g: NetGeometry): number {
  let best = 0;
  let score = -Infinity;
  g.nodes.forEach(([x, y], i) => { const s = y - x; if (s > score) { score = s; best = i; } });
  return best;
}

/** Shortest path from the lit ochre node to the exit node, node indices. */
export function exitPath(g: NetGeometry, start = g.lit[0] ?? 0): number[] {
  const { parent } = bfs(g, start);
  const path: number[] = [];
  for (let n = exitNode(g); n !== -1; n = parent[n]!) path.unshift(n);
  return path;
}
