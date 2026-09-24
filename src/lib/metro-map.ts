import { LINES, ROUTES, STATIONS, type Direction, type LineId, type MetroLine, type MetroStation } from '../data/metro';

const DEFAULT_UNIT = 48;
const TRACK_WIDTH = 9;
const FONT_SIZE = 15;
const LINE_HEIGHT = 18;
const LABEL_GAP = FONT_SIZE + 6;
const VIEWBOX_PADDING = 16;

type TextAnchor = 'start' | 'middle' | 'end';
type Point = [number, number];

export interface RenderTrack {
  id: LineId;
  d: string;
  colour: string;
}

export interface RenderStation {
  x: number;
  y: number;
  id: MetroStation['id'];
  title: string;
  labelLines: string[];
  live: boolean;
  href: string | null;
  lines: LineId[];
  transfer: boolean;
}

export interface RenderLabel {
  stationId: MetroStation['id'];
  x: number;
  y: number;
  textAnchor: TextAnchor;
  lines: string[];
}

export interface MetroMapModel {
  viewBox: string;
  tracks: RenderTrack[];
  stations: RenderStation[];
  labels: RenderLabel[];
}

interface LabelPlacement extends RenderLabel {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

function servedLines(stationId: MetroStation['id']): LineId[] {
  return LINES.filter((line) => ROUTES[line.id].stops.includes(stationId)).map(({ id }) => id);
}

function placeLabel(station: MetroStation, unit: number): LabelPlacement {
  const [gridX, gridY] = station.pos;
  const stationX = gridX * unit;
  const stationY = gridY * unit;
  const lines = station.label.split('\n');
  let x = stationX;
  let y = stationY;
  let textAnchor: TextAnchor = 'middle';

  switch (station.labelSide) {
    case 'N':
      y = stationY - LABEL_GAP - (lines.length - 1) * LINE_HEIGHT;
      break;
    case 'S':
      y = stationY + LABEL_GAP + FONT_SIZE * 0.8;
      break;
    case 'E':
      x = stationX + LABEL_GAP - 3;
      y = stationY - ((lines.length - 1) * LINE_HEIGHT) / 2 + FONT_SIZE * 0.2;
      textAnchor = 'start';
      break;
    case 'W':
      x = stationX - LABEL_GAP + 3;
      y = stationY - ((lines.length - 1) * LINE_HEIGHT) / 2 + FONT_SIZE * 0.2;
      textAnchor = 'end';
      break;
  }

  const width = Math.max(...lines.map((line) => line.length * FONT_SIZE * 0.56));
  const left = textAnchor === 'middle' ? x - width / 2 : textAnchor === 'end' ? x - width : x;
  return {
    stationId: station.id,
    x,
    y,
    textAnchor,
    lines,
    left,
    right: left + width,
    top: y - FONT_SIZE * 0.8,
    bottom: y + (lines.length - 1) * LINE_HEIGHT + FONT_SIZE * 0.2,
  };
}

const format = (value: number) => String(Number(value.toFixed(2)));

export function transfers(): MetroStation[] {
  return STATIONS.filter((station) => servedLines(station.id).length > 1);
}

export function stopsOf(lineId: LineId): MetroStation[] {
  return ROUTES[lineId].stops.map((stationId) => STATIONS.find(({ id }) => id === stationId)!);
}

export function lineOf(slug: string): MetroLine | undefined {
  const station = STATIONS.find((candidate) => candidate.slug === slug);
  return station && LINES.find((line) => line.id === station.home);
}

export function buildMap(direction: Direction, opts: { unit?: number } = {}): MetroMapModel {
  const unit = opts.unit ?? DEFAULT_UNIT;
  const rawTracks = LINES.map((line) => ({
    line,
    points: ROUTES[line.id].track.map(([x, y]) => [x * unit, y * unit] as Point),
  }));
  const labels = STATIONS.map((station) => placeLabel(station, unit));
  const halfTrack = TRACK_WIDTH / 2;
  const minX = Math.min(...rawTracks.flatMap(({ points }) => points.map(([x]) => x - halfTrack)), ...labels.map(({ left }) => left));
  const maxX = Math.max(...rawTracks.flatMap(({ points }) => points.map(([x]) => x + halfTrack)), ...labels.map(({ right }) => right));
  const minY = Math.min(...rawTracks.flatMap(({ points }) => points.map(([, y]) => y - halfTrack)), ...labels.map(({ top }) => top));
  const maxY = Math.max(...rawTracks.flatMap(({ points }) => points.map(([, y]) => y + halfTrack)), ...labels.map(({ bottom }) => bottom));
  const offsetX = VIEWBOX_PADDING - minX;
  const offsetY = VIEWBOX_PADDING - minY;
  const viewWidth = maxX - minX + VIEWBOX_PADDING * 2;
  const viewHeight = maxY - minY + VIEWBOX_PADDING * 2;

  const shift = ([x, y]: Point): Point => [Number((x + offsetX).toFixed(2)), Number((y + offsetY).toFixed(2))];
  const tracks = rawTracks.map(({ line, points }) => ({
    id: line.id,
    d: points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${format(shift(point)[0])} ${format(shift(point)[1])}`).join(' '),
    colour: line.colour[direction],
  }));
  const stations: RenderStation[] = STATIONS.map((station) => {
    const [x, y] = shift([station.pos[0] * unit, station.pos[1] * unit]);
    const lines = servedLines(station.id);
    return {
      x,
      y,
      id: station.id,
      title: station.title,
      labelLines: station.label.split('\n'),
      live: Boolean(station.slug),
      href: station.slug ? `/exp/${direction}/${station.slug}/` : null,
      lines,
      transfer: lines.length > 1,
    };
  });
  const shiftedLabels = labels.map(({ left: _left, right: _right, top: _top, bottom: _bottom, ...label }) => ({
    ...label,
    x: Number((label.x + offsetX).toFixed(2)),
    y: Number((label.y + offsetY).toFixed(2)),
  }));

  return {
    viewBox: `0 0 ${format(viewWidth)} ${format(viewHeight)}`,
    tracks,
    stations,
    labels: shiftedLabels,
  };
}
