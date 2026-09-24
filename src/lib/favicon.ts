import { Resvg } from '@resvg/resvg-js';
import { nets } from '../assets/net/geometry';
import { FLAG_COLORS, FLAG_PATH, flagNodes } from './flag';
import type { FlagHue } from './flag';

const VIEW_BOX_SIZE = 48;
const VIEW_BOX_CENTER = 24;
const TOUCH_ICON_SIZE = 180;
const TARGET_FLAG_HEIGHT = 30;
const CARD_RADIUS = 10;
const NODE_RADIUS = 4.6;
const WIRE_STROKE_WIDTH = 2.4;
const DARK_CARD = '#15171a';

type FlagPoint = { readonly node: number; readonly hue: FlagHue; readonly x: number; readonly y: number };
type FlagWire = { readonly from: FlagPoint; readonly to: FlagPoint; readonly hue: FlagHue };
type FlagGeometry = { readonly nodes: readonly FlagPoint[]; readonly wires: readonly FlagWire[] };

/** Apply the same uniform scale and translation to the frozen flag path for both icons. */
function flagGeometry(): FlagGeometry {
  const source = FLAG_PATH.map((node) => {
    const [x, y] = nets.mark.nodes[node]!;
    const hue = flagNodes.get(node);
    if (!hue) throw new Error(`Missing flag hue for mark node ${node}`);
    return { node, hue, x, y };
  });
  const minX = Math.min(...source.map(({ x }) => x));
  const maxX = Math.max(...source.map(({ x }) => x));
  const minY = Math.min(...source.map(({ y }) => y));
  const maxY = Math.max(...source.map(({ y }) => y));
  const scale = TARGET_FLAG_HEIGHT / (maxY - minY);
  const translateX = VIEW_BOX_CENTER - ((minX + maxX) / 2) * scale;
  const translateY = VIEW_BOX_CENTER - ((minY + maxY) / 2) * scale;
  const nodes = source.map(({ node, hue, x, y }) => ({
    node,
    hue,
    x: x * scale + translateX,
    y: y * scale + translateY,
  }));
  const wires = nodes.slice(0, -1).map((from, index) => ({
    from,
    to: nodes[index + 1]!,
    hue: from.hue,
  }));
  return { nodes, wires };
}

function flagElements(geometry: FlagGeometry): string {
  const wires = geometry.wires.map(({ from, to, hue }) =>
    `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" data-logo-wire="${from.node}-${to.node}" data-logo-hue="${hue}" stroke="${FLAG_COLORS[hue]}" stroke-width="${WIRE_STROKE_WIDTH}" stroke-linecap="round"/>`);
  const nodes = geometry.nodes.map(({ node, hue, x, y }) =>
    `<circle cx="${x}" cy="${y}" r="${NODE_RADIUS}" data-logo-node="${node}" data-logo-hue="${hue}" fill="${FLAG_COLORS[hue]}" stroke="${FLAG_COLORS[hue]}"/>`);
  return [...wires, ...nodes].join('');
}

/** The flag thread on the dark card; the same in every colour scheme, like the OG card. */
function iconSvg(size: number, cardRadius: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${VIEW_BOX_SIZE} ${VIEW_BOX_SIZE}"><rect width="${VIEW_BOX_SIZE}" height="${VIEW_BOX_SIZE}" rx="${cardRadius}" fill="${DARK_CARD}"/>${flagElements(flagGeometry())}</svg>`;
}

/** A compact 48x48 favicon with only the three flag nodes of the frozen mark. */
export function faviconSvg(): string {
  return iconSvg(VIEW_BOX_SIZE, CARD_RADIUS);
}

/** Render the full-bleed 180px icon used by iOS, which rounds the corners itself. */
export function touchIconPng(): Buffer {
  return Buffer.from(new Resvg(iconSvg(TOUCH_ICON_SIZE, 0), { fitTo: { mode: 'width', value: TOUCH_ICON_SIZE } }).render().asPng());
}
