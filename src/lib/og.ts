/**
 * Per-post Open Graph image, 1200x630, dark theme: the title in the site's type family
 * beside the net mark. Rendered at build with satori (SVG) and resvg (PNG).
 * Satori needs TTF, so src/assets/og holds Latin TTF subsets of the site fonts.
 */
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { nets } from '../assets/net/geometry';

const DARK = { bg: '#000000', fg: '#ece9e1', muted: '#9ea3aa' };
/** The dark theme's three hues, as `:root` declares them in global.css. */
const FLAG = { amarillo: '#e2a638', azul: '#6298dd', rojo: '#e0705e' } as const;

/**
 * A card carries no post's hue: the hue runs by place in the list, so it rotates with every
 * new post, while a card scraped once by WhatsApp or Telegram is cached for good and would
 * keep a colour the post no longer has. So the card carries the flag instead of a hue, and
 * carries it the way the site does -- on the drawing, never on the text (see the header
 * wordmark in global.css). These three nodes of the frozen mark run top to bottom and each
 * is joined to the next, so the flag descends the net in its own order. The geometry is
 * generated and committed, so the indices hold; tests/og.test.ts fails if they ever stop
 * being a connected path running downwards.
 */
const FLAG_PATH = [9, 10, 11] as const;
const FLAG_ORDER = ['amarillo', 'azul', 'rojo'] as const;
/** Node index -> its hue, for the three on the path. */
export const flagNodes: ReadonlyMap<number, string> = new Map(
  FLAG_PATH.map((n, i) => [n as number, FLAG[FLAG_ORDER[i]!] as string]),
);

function markSvg(): string {
  const g = nets.mark;
  const lines = g.edges
    .map(([a, b]) => {
      // A wire takes the flag only when both of its ends are on the path: the colour of the
      // upper end, so each band owns the wire leaving it.
      const on = flagNodes.has(a) && flagNodes.has(b);
      return `<line x1="${g.nodes[a]![0]}" y1="${g.nodes[a]![1]}" x2="${g.nodes[b]![0]}" y2="${g.nodes[b]![1]}" stroke="${on ? flagNodes.get(a)! : DARK.fg}" stroke-opacity="${on ? 1 : 0.6}" stroke-width="${on ? 0.9 : 0.6}"/>`;
    })
    .join('');
  const dots = g.nodes
    .map(([x, y], i) => {
      const hue = flagNodes.get(i);
      return `<circle cx="${x}" cy="${y}" r="${g.r}" fill="${hue ?? DARK.bg}" stroke="${hue ?? DARK.fg}" stroke-width="0.6"/>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 ${g.w + 4} ${g.h + 4}">${lines}${dots}</svg>`;
}

let fonts: Promise<{ bold: Buffer; regular: Buffer }> | undefined;
// Relative to the project root: the build runs there, and bundling moves import.meta.url.
const loadFonts = () =>
  (fonts ??= Promise.all([
    readFile(resolve('src/assets/og/geist-700.ttf')),
    readFile(resolve('src/assets/og/geist-400.ttf')),
  ]).then(([bold, regular]) => ({ bold, regular })));

type Node = { type: string; props: Record<string, unknown> };
const el = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}): Node =>
  ({ type, props: { style, children, ...extra } });

export const OG_SIZE = { width: 1200, height: 630 } as const;

/** A 1200x630 card: the net mark, a title, an optional line under it, and the site. */
export async function renderOgImage(title: string, subtitle?: string): Promise<Uint8Array> {
  const { bold, regular } = await loadFonts();
  const mark = `data:image/svg+xml;base64,${Buffer.from(markSvg()).toString('base64')}`;
  const size = title.length > 60 ? 84 : title.length > 36 ? 104 : 124;
  const tree = el('div', {
    width: 1200, height: 630, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    background: DARK.bg, color: DARK.fg, padding: '64px 80px',
  }, [
    el('img', { width: 160, height: 120 }, undefined, { src: mark, width: 160, height: 120 }),
    el('div', { display: 'flex', flexDirection: 'column', gap: 28 }, [
      el('div', { display: 'flex', fontFamily: 'Geist', fontWeight: 700, fontSize: size, lineHeight: 0.98, letterSpacing: '-0.045em', maxWidth: 1040 }, title),
      ...(subtitle ? [el('div', { display: 'flex', fontFamily: 'Geist', fontWeight: 400, fontSize: 40, lineHeight: 1.3, color: DARK.muted, maxWidth: 940 }, subtitle)] : []),
    ]),
    el('div', { display: 'flex', justifyContent: 'space-between', fontFamily: 'Geist', fontWeight: 700, fontSize: 30, color: DARK.muted }, [
      el('span', {}, title === 'David Aragort' ? '' : 'David Aragort'), // no name twice on the landing card
      el('span', { color: DARK.fg }, 'aragort.com'), // the flag is on the drawing; the text stays out of it
    ]),
  ]);
  const svg = await satori(tree as Parameters<typeof satori>[0], {
    ...OG_SIZE,
    fonts: [
      { name: 'Geist', data: bold, weight: 700, style: 'normal' },
      { name: 'Geist', data: regular, weight: 400, style: 'normal' },
    ],
  });
  return new Resvg(svg, { fitTo: { mode: 'width', value: OG_SIZE.width } }).render().asPng();
}
