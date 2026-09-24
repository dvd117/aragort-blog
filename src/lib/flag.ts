export const FLAG_PATH = [9, 10, 11] as const;
const FLAG_ORDER = ['amarillo', 'azul', 'rojo'] as const;
export type FlagHue = (typeof FLAG_ORDER)[number];

/** The OG card's dark palette, shared with the static favicon. */
export const FLAG_COLORS = { amarillo: '#e2a638', azul: '#6298dd', rojo: '#e0705e' } as const;

/** Node index -> its hue, for the connected path on the mark. */
export const flagNodes: ReadonlyMap<number, FlagHue> = new Map(
  FLAG_PATH.map((node, i) => [node, FLAG_ORDER[i]!] as const),
);
