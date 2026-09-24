import { existsSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { GROUNDS, LINES, ROUTES, STATIONS } from '../src/data/metro';
import { ratio } from '../src/lib/contrast';
import { buildMap, lineOf, stopsOf, transfers } from '../src/lib/metro-map';

describe('metro source data', () => {
  it('defines the five ordered lines with both direction colours', () => {
    expect(LINES).toEqual([
      { id: 'l1', num: 1, name: 'El punto de quiebre', colour: { pol: '#d4501a', anden: '#f2792b' } },
      { id: 'l2', num: 2, name: 'Las herramientas del practicante', colour: { pol: '#a67c00', anden: '#f3c12e' } },
      { id: 'l3', num: 3, name: 'La infraestructura propia', colour: { pol: '#1c5fae', anden: '#4e93e6' } },
      { id: 'l4', num: 4, name: 'El contexto del sector', colour: { pol: '#1b7f45', anden: '#35b168' } },
      { id: 'l5', num: 5, name: 'Otros escritos', colour: { pol: '#566170', anden: '#8f98a3' } },
    ]);
  });

  it('defines the exact shared grounds and eleven unique stations', () => {
    expect(GROUNDS).toEqual({
      pol: { bg: '#f1ebdd', ink: '#17140f', ink2: '#5a5246' },
      anden: { bg: '#0b0c0e', fg: '#ecebe6', fg2: '#9ea3aa' },
    });
    expect(STATIONS).toHaveLength(11);
    expect(new Set(STATIONS.map((station) => station.id)).size).toBe(11);
  });

  it('stores every station title, map label, home line and coordinate verbatim', () => {
    expect(STATIONS).toEqual([
      { id: 'chatbots', title: 'Por qué dejé los chatbots', label: 'Por qué dejé\nlos chatbots', home: 'l1', slug: 'por-que-deje-los-chatbots', pos: [0, 6], labelSide: 'N' },
      { id: 'terminal', title: 'La terminal y GitHub', label: 'La terminal\ny GitHub', home: 'l2', pos: [4, 6], labelSide: 'S' },
      { id: 'instrucciones', title: 'Tus instrucciones, tus reglas', label: 'Tus instrucciones,\ntus reglas', home: 'l2', pos: [4, 4], labelSide: 'E' },
      { id: 'usalos', title: 'Úsalos todos', label: 'Úsalos todos', home: 'l2', pos: [4, 2], labelSide: 'E' },
      { id: 'nodependas', title: 'No dependas de una sola empresa', label: 'No dependas de\nuna sola empresa', home: 'l2', pos: [6, 0], labelSide: 'E' },
      { id: 'markdown', title: 'Markdown como sustrato', label: 'Markdown\ncomo sustrato', home: 'l3', pos: [8, 6], labelSide: 'N' },
      { id: 'sincronizo', title: 'Cómo sincronizo todo', label: 'Cómo sincronizo\ntodo', home: 'l3', pos: [8, 8], labelSide: 'E' },
      { id: 'wiki', title: 'Mi wiki personal con LLMs', label: 'Mi wiki personal\ncon LLMs', home: 'l3', pos: [10, 10], labelSide: 'E' },
      { id: 'carrera', title: 'La carrera de los modelos', label: 'La carrera de\nlos modelos', home: 'l4', pos: [12, 6], labelSide: 'S' },
      { id: 'anthropic', title: 'Anthropic y los cambios de política', label: 'Anthropic y los\ncambios de política', home: 'l4', pos: [14, 4], labelSide: 'E' },
      { id: 'cuba', title: 'El acceso a Internet como nuevo motor de la movilización social en Cuba', label: 'Internet\nen Cuba', home: 'l5', slug: 'acceso-a-internet-y-movilizacion-social-en-cuba', pos: [0, 8], labelSide: 'E' },
    ]);
  });

  it('marks exactly the live stations and each slug exists as a post', () => {
    const live = STATIONS.filter((station) => station.slug);
    const postFiles = readdirSync('src/content/posts');
    expect(live.map(({ id, slug }) => [id, slug])).toEqual([
      ['chatbots', 'por-que-deje-los-chatbots'],
      ['cuba', 'acceso-a-internet-y-movilizacion-social-en-cuba'],
    ]);
    expect(live).toHaveLength(2);
    for (const station of live) {
      const postFile = postFiles.find((file) => file.endsWith(`-${station.slug}.md`));
      expect(postFile).toBeDefined();
      expect(existsSync(`src/content/posts/${postFile}`)).toBe(true);
    }
  });

  it('keeps every line colour at 3:1 and every ground text colour at 4.5:1', () => {
    for (const line of LINES) {
      expect(ratio(line.colour.pol, GROUNDS.pol.bg)).toBeGreaterThanOrEqual(3);
      expect(ratio(line.colour.anden, GROUNDS.anden.bg)).toBeGreaterThanOrEqual(3);
    }
    expect(ratio(GROUNDS.pol.ink, GROUNDS.pol.bg)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(GROUNDS.pol.ink2, GROUNDS.pol.bg)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(GROUNDS.anden.fg, GROUNDS.anden.bg)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(GROUNDS.anden.fg2, GROUNDS.anden.bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps em and en dashes out of the data strings', () => {
    expect(JSON.stringify({ LINES, GROUNDS, STATIONS })).not.toMatch(/[—–]/);
  });
});

const pointOnSegment = (point: [number, number], a: [number, number], b: [number, number]) => {
  const cross = (point[0] - a[0]) * (b[1] - a[1]) - (point[1] - a[1]) * (b[0] - a[0]);
  const dot = (point[0] - a[0]) * (b[0] - a[0]) + (point[1] - a[1]) * (b[1] - a[1]);
  const lengthSquared = (b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2;
  return Math.abs(cross) < 1e-7 && dot >= 0 && dot <= lengthSquared;
};

const liesOnRoute = (point: [number, number], lineId: keyof typeof ROUTES) => {
  const track = ROUTES[lineId].track;
  return track.slice(0, -1).some((a, index) => pointOnSegment(point, a, track[index + 1]!));
};

describe('metro route data', () => {
  it('uses only horizontal, vertical or 45-degree track segments', () => {
    for (const route of Object.values(ROUTES)) {
      for (const [index, a] of route.track.slice(0, -1).entries()) {
        const b = route.track[index + 1]!;
        const dx = Math.abs(b[0] - a[0]);
        const dy = Math.abs(b[1] - a[1]);
        expect(dx === 0 || dy === 0 || dx === dy).toBe(true);
      }
    }
  });

  it('places each station on its home track and every ordered stop on its route', () => {
    for (const station of STATIONS) expect(liesOnRoute(station.pos, station.home)).toBe(true);
    for (const [lineId, route] of Object.entries(ROUTES) as [keyof typeof ROUTES, (typeof ROUTES)[keyof typeof ROUTES]][]) {
      for (const stopId of route.stops) {
        const station = STATIONS.find(({ id }) => id === stopId)!;
        expect(liesOnRoute(station.pos, lineId)).toBe(true);
      }
    }
  });

  it('derives only the four interchanges from routes that share a stop', () => {
    expect(transfers().map(({ id }) => id)).toEqual(['chatbots', 'terminal', 'markdown', 'carrera']);
  });

  it('returns ordered station stops and the live post home line', () => {
    expect(stopsOf('l2').map(({ id }) => id)).toEqual(['terminal', 'instrucciones', 'usalos', 'nodependas']);
    expect(lineOf('por-que-deje-los-chatbots')).toEqual(LINES[0]);
    expect(lineOf('acceso-a-internet-y-movilizacion-social-en-cuba')).toEqual(LINES[4]);
    expect(lineOf('not-a-live-post')).toBeUndefined();
  });
});

type Box = { left: number; right: number; top: number; bottom: number };
type XY = [number, number];

const labelBox = (label: { x: number; y: number; textAnchor: string; lines: string[] }): Box => {
  const width = Math.max(...label.lines.map((line) => line.length * 15 * 0.56));
  const left = label.textAnchor === 'middle' ? label.x - width / 2 : label.textAnchor === 'end' ? label.x - width : label.x;
  return { left, right: left + width, top: label.y - 15 * 0.8, bottom: label.y + (label.lines.length - 1) * 18 + 15 * 0.2 };
};

const orient = (a: XY, b: XY, c: XY) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
const onSegment = (a: XY, b: XY, p: XY) =>
  Math.abs(orient(a, b, p)) < 1e-7 && p[0] >= Math.min(a[0], b[0]) - 1e-7 && p[0] <= Math.max(a[0], b[0]) + 1e-7 && p[1] >= Math.min(a[1], b[1]) - 1e-7 && p[1] <= Math.max(a[1], b[1]) + 1e-7;
const segmentsCross = (a: XY, b: XY, c: XY, d: XY) => {
  const o1 = orient(a, b, c), o2 = orient(a, b, d), o3 = orient(c, d, a), o4 = orient(c, d, b);
  return (o1 * o2 < 0 && o3 * o4 < 0) || onSegment(a, b, c) || onSegment(a, b, d) || onSegment(c, d, a) || onSegment(c, d, b);
};
const segmentCrossesBox = (a: XY, b: XY, box: Box) => {
  const inside = ([x, y]: XY) => x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
  if (inside(a) || inside(b)) return true;
  const corners: XY[] = [[box.left, box.top], [box.right, box.top], [box.right, box.bottom], [box.left, box.bottom]];
  return corners.some((corner, index) => segmentsCross(a, b, corner, corners[(index + 1) % corners.length]!));
};

const pathPoints = (d: string): XY[] => [...d.matchAll(/[ML]\s*(-?[\d.]+)\s+(-?[\d.]+)/g)].map((match) => [Number(match[1]), Number(match[2])]);

describe('metro render model', () => {
  it('builds one direction-coloured path for every line at the requested unit', () => {
    const pol = buildMap('pol');
    const anden = buildMap('anden');
    expect(pol.tracks.map(({ id, colour }) => [id, colour])).toEqual(LINES.map(({ id, colour }) => [id, colour.pol]));
    expect(anden.tracks.map(({ id, colour }) => [id, colour])).toEqual(LINES.map(({ id, colour }) => [id, colour.anden]));
    const station = (id: string, model = pol) => model.stations.find((item) => item.id === id)!;
    expect(station('terminal').x - station('chatbots').x).toBeCloseTo(4 * 48, 8);
    const scaled = buildMap('pol', { unit: 72 });
    expect(station('terminal', scaled).x - station('chatbots', scaled).x).toBeCloseTo(4 * 72, 8);
  });

  it('models full accessible titles, live links, served lines and interchange state', () => {
    const pol = buildMap('pol');
    const byId = (id: string) => pol.stations.find((station) => station.id === id)!;
    expect(byId('chatbots')).toMatchObject({
      id: 'chatbots', title: 'Por qué dejé los chatbots', labelLines: ['Por qué dejé', 'los chatbots'],
      live: true, href: '/exp/pol/por-que-deje-los-chatbots/', lines: ['l1', 'l5'], transfer: true,
    });
    expect(byId('terminal')).toMatchObject({ live: false, href: null, lines: ['l1', 'l2'], transfer: true });
    expect(byId('instrucciones')).toMatchObject({ live: false, href: null, lines: ['l2'], transfer: false });
    expect(buildMap('anden').stations.find(({ id }) => id === 'cuba')).toMatchObject({ href: '/exp/anden/acceso-a-internet-y-movilizacion-social-en-cuba/' });
  });

  it('keeps every label box inside the viewBox, separate, and clear of the track paths', () => {
    const map = buildMap('pol');
    const boxes = map.labels.map((label) => ({ id: label.stationId, box: labelBox(label) }));
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i]!.box, b = boxes[j]!.box;
        expect(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top,
          `${boxes[i]!.id} label overlaps ${boxes[j]!.id}`).toBe(true);
      }
    }
    for (const { id, box } of boxes) {
      for (const track of map.tracks) {
        const points = pathPoints(track.d);
        for (let index = 0; index < points.length - 1; index++) {
          expect(segmentCrossesBox(points[index]!, points[index + 1]!, box), `${id} label crosses ${track.id}`).toBe(false);
        }
      }
    }
    const [left, top, width, height] = map.viewBox.split(/\s+/).map(Number);
    for (const { id, box } of boxes) {
      expect(box.left, `${id} left`).toBeGreaterThanOrEqual(left!);
      expect(box.top, `${id} top`).toBeGreaterThanOrEqual(top!);
      expect(box.right, `${id} right`).toBeLessThanOrEqual(left! + width!);
      expect(box.bottom, `${id} bottom`).toBeLessThanOrEqual(top! + height!);
    }
  });
});
