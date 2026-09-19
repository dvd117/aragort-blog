/**
 * `---` in Markdown becomes a small net fragment instead of a plain rule: three nodes on
 * two wires. It has exactly three of them, so it is the flag laid out sideways --
 * amarillo, azul, rojo, left to right -- and it stays those three whatever hue the post
 * it sits in owns. Still a separator for assistive tech (role="separator").
 */
import type { Element, Root, RootContent } from 'hast';

const svg = (): Element => ({
  type: 'element', tagName: 'svg',
  properties: { viewBox: '0 0 96 16', ariaHidden: 'true', focusable: 'false' },
  children: [
    // A wire takes the band of the node it leaves, so the pair reads left to right.
    { type: 'element', tagName: 'line', properties: { x1: 8, y1: 10, x2: 48, y2: 5, dataBand: '0' }, children: [] },
    { type: 'element', tagName: 'line', properties: { x1: 48, y1: 5, x2: 88, y2: 11, dataBand: '1' }, children: [] },
    { type: 'element', tagName: 'circle', properties: { cx: 8, cy: 10, r: 3, dataBand: '0' }, children: [] },
    { type: 'element', tagName: 'circle', properties: { cx: 48, cy: 5, r: 3, dataBand: '1', className: ['on'] }, children: [] },
    { type: 'element', tagName: 'circle', properties: { cx: 88, cy: 11, r: 3, dataBand: '2' }, children: [] },
  ],
});

export default function rehypeNetDivider() {
  return (tree: Root) => {
    tree.children = tree.children.map((n): RootContent =>
      n.type === 'element' && n.tagName === 'hr'
        ? { type: 'element', tagName: 'div', properties: { role: 'separator', className: ['net-hr'] }, children: [svg()] }
        : n,
    );
  };
}
