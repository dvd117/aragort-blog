/**
 * External links open in a new tab, and say so. An absolute http(s) URL outside
 * aragort.com gets target="_blank", rel="noopener noreferrer", a visually hidden
 * "(abre en otra pestaña)", and a ↗ glued to its last word (white-space: nowrap in
 * CSS) so the arrow never wraps onto a line by itself.
 */
import type { Element, ElementContent, Root } from 'hast';

const OWN = new Set(['aragort.com', 'www.aragort.com']);

export function isExternal(href: string): boolean {
  if (!/^https?:\/\//i.test(href)) return false;
  try { return !OWN.has(new URL(href).hostname.toLowerCase()); } catch { return false; }
}

const h = (tagName: string, properties: Element['properties'], children: ElementContent[]): Element =>
  ({ type: 'element', tagName, properties, children });

function mark(a: Element): void {
  a.properties = { ...a.properties, target: '_blank', rel: ['noopener', 'noreferrer'], className: ['ext'] };
  const arrow = h('span', { className: ['ext-arrow'], ariaHidden: 'true' }, [{ type: 'text', value: '↗' }]);
  const kids = a.children;
  const last = kids.at(-1);
  let tail: Element;
  if (last?.type === 'text') {
    const text = last.value.replace(/\s+$/, '');
    const cut = text.lastIndexOf(' ');
    const head = cut === -1 ? '' : text.slice(0, cut + 1);
    tail = h('span', { className: ['ext-tail'] }, [{ type: 'text', value: text.slice(cut + 1) }, arrow]);
    kids.splice(-1, 1, ...(head ? [{ type: 'text' as const, value: head }] : []), tail);
  } else if (last) {
    tail = h('span', { className: ['ext-tail'] }, [last, arrow]);
    kids.splice(-1, 1, tail);
  } else return;
  kids.push(h('span', { className: ['visually-hidden'] }, [{ type: 'text', value: ' (abre en otra pestaña)' }]));
}

function walk(node: Root | Element): void {
  for (const child of node.children) {
    if (child.type !== 'element') continue;
    if (child.tagName === 'a' && isExternal(String(child.properties.href ?? ''))) mark(child);
    else walk(child);
  }
}

export default function rehypeExternalLinks() {
  return (tree: Root) => walk(tree);
}
