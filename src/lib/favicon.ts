import { Resvg } from '@resvg/resvg-js';
import { nets } from '../assets/net/geometry';
import { FLAG_COLORS, FLAG_LIGHT_COLORS, FLAG_PATH, flagNodes } from './flag';
import type { FlagHue } from './flag';

const VIEW_BOX_SIZE = 48;
const VIEW_BOX_CENTER = 24;
const TOUCH_ICON_SIZE = 180;
const TARGET_FLAG_HEIGHT = 30;
const CARD_RADIUS = 10;
const NODE_RADIUS = 4.6;
const WIRE_STROKE_WIDTH = 2.4;
const DARK_CARD = '#15171a';
const LIGHT_CARD = '#ece9e1';

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

function flagElements(geometry: FlagGeometry, inlineColors: boolean): string {
  const wires = geometry.wires.map(({ from, to, hue }) => {
    const color = inlineColors ? ` stroke="${FLAG_COLORS[hue]}"` : '';
    return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" data-logo-wire="${from.node}-${to.node}" data-logo-hue="${hue}"${color} stroke-width="${WIRE_STROKE_WIDTH}" stroke-linecap="round"/>`;
  });
  const nodes = geometry.nodes.map(({ node, hue, x, y }) => {
    const color = inlineColors ? ` fill="${FLAG_COLORS[hue]}" stroke="${FLAG_COLORS[hue]}"` : '';
    return `<circle cx="${x}" cy="${y}" r="${NODE_RADIUS}" data-logo-node="${node}" data-logo-hue="${hue}"${color}/>`;
  });
  return [...wires, ...nodes].join('');
}

function hueRules(colors: Readonly<Record<FlagHue, string>>): string {
  return Object.entries(colors)
    .map(([hue, color]) => `[data-logo-hue="${hue}"]{fill:${color};stroke:${color}}`)
    .join('\n');
}

/** A compact 48x48 favicon with only the three flag nodes of the frozen mark. */
export function faviconSvg(): string {
  const geometry = flagGeometry();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${VIEW_BOX_SIZE}" height="${VIEW_BOX_SIZE}" viewBox="0 0 ${VIEW_BOX_SIZE} ${VIEW_BOX_SIZE}"><style>
.card{fill:${DARK_CARD}}
line{stroke:${LIGHT_CARD};stroke-width:${WIRE_STROKE_WIDTH};stroke-linecap:round}
circle{fill:${LIGHT_CARD}}
${hueRules(FLAG_COLORS)}
@media (prefers-color-scheme:dark){
.card{fill:${LIGHT_CARD}}
line{stroke:${DARK_CARD}}
circle{fill:${DARK_CARD}}
${hueRules(FLAG_LIGHT_COLORS)}
}
</style><rect class="card" width="${VIEW_BOX_SIZE}" height="${VIEW_BOX_SIZE}" rx="${CARD_RADIUS}"/>${flagElements(geometry, false)}</svg>`;
}

/** Render the dark-card, full-bleed 180px icon used by iOS. */
export function touchIconPng(): Buffer {
  const geometry = flagGeometry();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${TOUCH_ICON_SIZE}" height="${TOUCH_ICON_SIZE}" viewBox="0 0 ${VIEW_BOX_SIZE} ${VIEW_BOX_SIZE}"><rect width="${VIEW_BOX_SIZE}" height="${VIEW_BOX_SIZE}" fill="${DARK_CARD}"/>${flagElements(geometry, true)}</svg>`;
  return Buffer.from(new Resvg(svg, { fitTo: { mode: 'width', value: TOUCH_ICON_SIZE } }).render().asPng());
}
