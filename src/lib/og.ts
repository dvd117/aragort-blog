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
import { buildFamily, FAMILIES } from './families';

const DARK = { bg: '#0c0e11', fg: '#ece9e1', muted: '#9ea3aa', ochre: '#e2a638' };

function markSvg(): string {
  const g = nets.mark;
  const lit = new Set<number>(g.lit);
  const lines = g.edges
    .map(([a, b]) => {
      const on = lit.has(a) && lit.has(b);
      return `<line x1="${g.nodes[a]![0]}" y1="${g.nodes[a]![1]}" x2="${g.nodes[b]![0]}" y2="${g.nodes[b]![1]}" stroke="${on ? DARK.ochre : DARK.fg}" stroke-opacity="${on ? 1 : 0.6}" stroke-width="0.6"/>`;
    })
    .join('');
  const dots = g.nodes
    .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${g.r}" fill="${lit.has(i) ? DARK.ochre : DARK.bg}" stroke="${lit.has(i) ? DARK.ochre : DARK.fg}" stroke-width="0.6"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 ${g.w + 4} ${g.h + 4}">${lines}${dots}</svg>`;
}

let font: Promise<Buffer> | undefined;
// Relative to the project root: the build runs there, and bundling moves import.meta.url.
const loadFont = () => (font ??= readFile(resolve('src/assets/og', FAMILIES[buildFamily()].og)));

type Node = { type: string; props: Record<string, unknown> };
const el = (type: string, style: Record<string, unknown>, children?: unknown, extra: Record<string, unknown> = {}): Node =>
  ({ type, props: { style, children, ...extra } });

export async function renderOgImage(title: string): Promise<Uint8Array> {
  const data = await loadFont();
  const mark = `data:image/svg+xml;base64,${Buffer.from(markSvg()).toString('base64')}`;
  const size = title.length > 60 ? 84 : title.length > 36 ? 104 : 124;
  const tree = el('div', {
    width: 1200, height: 630, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    background: DARK.bg, color: DARK.fg, padding: '64px 80px',
  }, [
    el('img', { width: 160, height: 120 }, undefined, { src: mark, width: 160, height: 120 }),
    el('div', { display: 'flex', fontFamily: 'Site', fontWeight: 700, fontSize: size, lineHeight: 0.98, letterSpacing: '-0.04em', maxWidth: 1040 }, title),
    el('div', { display: 'flex', justifyContent: 'space-between', fontFamily: 'Site', fontWeight: 700, fontSize: 30, color: DARK.muted }, [
      el('span', {}, 'David Aragort'),
      el('span', { color: DARK.ochre }, 'aragort.com'),
    ]),
  ]);
  const svg = await satori(tree as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Site', data, weight: 700, style: 'normal' },
    ],
  });
  return new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
}
