import { describe, expect, it } from 'vitest';
import { nets } from '../src/assets/net/geometry';
import { exitNode, exitPath, pathFor, postNode, routeFor, routesFor } from '../src/lib/netpath';

const hero = nets.hero;
const wired = (a: number, b: number) => hero.edges.some(([x, y]) => (x === a && y === b) || (x === b && y === a));

describe('net as navigation', () => {
  it('starts at the lit ochre node and follows real wires', () => {
    const path = pathFor(hero, 'por-que-deje-los-chatbots');
    expect(path[0]).toBe(hero.lit[0]);
    for (let i = 1; i < path.length; i++) expect(wired(path[i - 1]!, path[i]!)).toBe(true);
  });

  it('is short: four to six nodes', () => {
    for (const slug of ['a', 'la-terminal-y-github', 'tus-instrucciones-tus-reglas', 'x-y-z']) {
      const n = pathFor(hero, slug).length;
      expect(n).toBeGreaterThanOrEqual(4);
      expect(n).toBeLessThanOrEqual(6);
    }
  });

  it('is stable per slug', () => {
    expect(pathFor(hero, 'uno')).toEqual(pathFor(hero, 'uno'));
  });
});

describe('net meets the thread', () => {
  it('exits at the bottom-left of the net', () => {
    const e = exitNode(hero);
    const [ex, ey] = hero.nodes[e]!;
    for (const [x, y] of hero.nodes) expect(y - x).toBeLessThanOrEqual(ey - ex);
  });
  it('reaches the exit from the lit node along real wires', () => {
    const path = exitPath(hero);
    expect(path[0]).toBe(hero.lit[0]);
    expect(path.at(-1)).toBe(exitNode(hero));
    for (let i = 1; i < path.length; i++) expect(wired(path[i - 1]!, path[i]!)).toBe(true);
  });
});

describe('each post lights its own section', () => {
  const slugs = ['por-que-deje-los-chatbots', 'la-terminal-y-github', 'tus-instrucciones-tus-reglas', 'no-dependas-de-una-sola-empresa', 'corta'];
  it('runs from the ochre node through the post\'s own node to the exit, along real wires', () => {
    for (const slug of slugs) {
      const route = routeFor(hero, slug);
      expect(route[0]).toBe(hero.lit[0]);
      expect(route).toContain(postNode(hero, slug));
      expect(route.at(-1)).toBe(exitNode(hero));
      for (let i = 1; i < route.length; i++) expect(wired(route[i - 1]!, route[i]!)).toBe(true);
      expect(new Set(route).size).toBe(route.length); // never visits a node twice
    }
  });
  it('differs between posts', () => {
    const routes = new Set(slugs.map((s) => routeFor(hero, s).join(',')));
    expect(routes.size).toBeGreaterThan(1);
  });
});

describe('the landing hands out sections', () => {
  it('gives posts different nodes while the net has room, and stays stable', () => {
    const slugs = ['por-que-deje-los-chatbots', 'la-terminal-y-github', 'tus-instrucciones-tus-reglas', 'no-dependas-de-una-sola-empresa', 'lo-que-todavia-no-funciona', 'convenciones-de-lectura', 'corta', 'entrada-de-prueba-con-en-corto', 'entrada-de-prueba-sin-descripcion', 'a', 'b', 'c'];
    const routes = routesFor(hero, slugs);
    expect(new Set(routes.map((r) => r.join(','))).size).toBe(slugs.length);
    expect(routesFor(hero, slugs)).toEqual(routes);
    for (const r of routes) { expect(r[0]).toBe(hero.lit[0]); expect(r.at(-1)).toBe(exitNode(hero)); }
  });
});
