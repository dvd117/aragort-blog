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

/** Ochre -> target -> exit without visiting a node twice, or null if the net allows no such route. */
function through(g: NetGeometry, start: number, target: number): number[] | null {
  const exit = exitNode(g);
  const { parent: up } = bfs(g, start);
  const head: number[] = [];
  for (let n = target; n !== -1; n = up[n]!) head.unshift(n);
  if (target === exit) return head;
  const adj = neighbours(g);
  const blocked = new Set(head.slice(0, -1));
  const parent = new Array<number>(g.nodes.length).fill(-1);
  const seen = new Set([target]);
  const queue = [target];
  for (let q = queue.shift(); q !== undefined && !seen.has(exit); q = queue.shift()) {
    for (const n of adj[q]!.slice().sort((x, y) => x - y)) {
      if (seen.has(n) || blocked.has(n)) continue;
      seen.add(n); parent[n] = q; queue.push(n);
    }
  }
  if (!seen.has(exit)) return null;
  const tail: number[] = [];
  for (let n = exit; n !== target; n = parent[n]!) tail.unshift(n);
  return [...head, ...tail];
}

/** The post's own node on the landing: anywhere 3+ hops from the ochre node, off the shared
 *  exit path, with a route through it that never doubles back; chosen by the slug, so posts
 *  spread across the whole net. */
function pool(g: NetGeometry, start: number): number[] {
  const { dist } = bfs(g, start);
  const shared = new Set(exitPath(g, start));
  return dist.map((d, i) => [d, i] as const)
    .filter(([d, i]) => d >= 3 && !shared.has(i) && through(g, start, i))
    .map(([, i]) => i);
}

export function postNode(g: NetGeometry, slug: string, start = g.lit[0] ?? 0): number {
  const p = pool(g, start);
  return p.length ? p[hash(slug) % p.length]! : exitNode(g);
}

/** Routes for every post on the landing at once: each post keeps its hashed route unless an
 *  earlier post took it, then takes the next free one, so posts light different sections
 *  until the net runs out of them. Each result carries the post's own node, the one its
 *  region grows around. */
export function routeTable(g: NetGeometry, slugs: string[], start = g.lit[0] ?? 0): { route: number[]; own: number }[] {
  const p = pool(g, start), taken = new Set<string>();
  const exit = exitPath(g, start);
  return slugs.map((slug) => {
    if (!p.length) return { route: exit, own: exitNode(g) };
    const first = hash(slug) % p.length;
    let fallback: { route: number[]; own: number } | null = null;
    for (let tries = 0; tries < p.length; tries++) {
      const own = p[(first + tries) % p.length]!;
      const found = { route: through(g, start, own) ?? exit, own };
      fallback ??= found;
      if (!taken.has(found.route.join(','))) { taken.add(found.route.join(',')); return found; }
    }
    return fallback!; // the net is out of sections: share the post's own
  });
}

export function routesFor(g: NetGeometry, slugs: string[], start = g.lit[0] ?? 0): number[][] {
  return routeTable(g, slugs, start).map((r) => r.route);
}

/**
 * The post's route on the landing: from the ochre node through the post's own node on to
 * the exit node, where the wire leaves for the thread. Each post crosses its own region
 * and the route never doubles back.
 */
export function routeFor(g: NetGeometry, slug: string, start = g.lit[0] ?? 0): number[] {
  return through(g, start, postNode(g, slug, start)) ?? exitPath(g, start);
}

/**
 * The post's region on the landing: its route, then the nodes one wire away from the
 * post's own node. A post lights a patch of the net, not a line through it, so a handful
 * of posts already read as a filling net. Ordered: route first, then the halo, so the
 * landing can stagger the draw-in.
 */
export function regionOf(g: NetGeometry, route: number[], own: number): number[] {
  const seen = new Set(route);
  const halo = neighbours(g)[own]?.slice().sort((a, b) => a - b).filter((n) => !seen.has(n)) ?? [];
  return [...route, ...halo];
}

/** regionsFor is routesFor, each route grown into its region. */
export function regionsFor(g: NetGeometry, slugs: string[], start = g.lit[0] ?? 0): number[][] {
  return routeTable(g, slugs, start).map(({ route, own }) => regionOf(g, route, own));
}
