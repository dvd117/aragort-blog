/**
 * `---` in Markdown becomes a small net fragment instead of a plain rule:
 * three nodes on two wires, drawn in the post's hue by CSS. Still a separator
 * for assistive tech (role="separator").
 */
import type { Element, Root, RootContent } from 'hast';

const svg = (): Element => ({
  type: 'element', tagName: 'svg',
  properties: { viewBox: '0 0 96 16', ariaHidden: 'true', focusable: 'false' },
  children: [
    { type: 'element', tagName: 'line', properties: { x1: 8, y1: 10, x2: 48, y2: 5 }, children: [] },
    { type: 'element', tagName: 'line', properties: { x1: 48, y1: 5, x2: 88, y2: 11 }, children: [] },
    { type: 'element', tagName: 'circle', properties: { cx: 8, cy: 10, r: 3 }, children: [] },
    { type: 'element', tagName: 'circle', properties: { cx: 48, cy: 5, r: 3, className: ['on'] }, children: [] },
    { type: 'element', tagName: 'circle', properties: { cx: 88, cy: 11, r: 3 }, children: [] },
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
