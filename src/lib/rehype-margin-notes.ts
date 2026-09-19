/**
 * Margin notes from standard Markdown footnotes.
 *
 * In the source a note is an ordinary footnote, so the raw .md stays readable:
 *
 *     ...de Steph Ango[^ango], uno de los...
 *
 *     [^ango]: stephango.com/file-over-app
 *
 * This plugin removes GFM's footnotes section and places each note in an
 * <aside class="note"> right after the top-level block that cites it. CSS puts
 * the aside in the margin at >= 1100px and leaves it inline, under its
 * paragraph, below that.
 */
import type { Element, ElementContent, Root, RootContent } from 'hast';

const isEl = (n: unknown, tag?: string): n is Element =>
  typeof n === 'object' && n !== null && (n as Element).type === 'element' && (!tag || (n as Element).tagName === tag);

function findAll(node: Element | Root, test: (n: Element) => boolean, acc: Element[] = []): Element[] {
  for (const child of node.children) {
    if (!isEl(child)) continue;
    if (test(child)) acc.push(child);
    findAll(child, test, acc);
  }
  return acc;
}

function textOf(node: Element): string {
  return node.children.map((c) => (c.type === 'text' ? c.value : isEl(c) ? textOf(c) : '')).join('');
}

const isBackref = (n: ElementContent) => isEl(n, 'a') && 'dataFootnoteBackref' in n.properties;

/** Paragraphs of a footnote definition, without GFM's back-reference arrows. */
function definitionParagraphs(li: Element): ElementContent[][] {
  return li.children
    .filter((c): c is Element => isEl(c, 'p'))
    .map((p) => {
      const kids = p.children.filter((c) => !isBackref(c));
      const last = kids.at(-1);
      if (last?.type === 'text') last.value = last.value.replace(/\s+$/, '');
      return kids;
    });
}

const h = (tagName: string, properties: Element['properties'], children: ElementContent[]): Element =>
  ({ type: 'element', tagName, properties, children });

export default function rehypeMarginNotes() {
  return (tree: Root) => {
    const at = tree.children.findIndex((n) => isEl(n, 'section') && 'dataFootnotes' in n.properties);
    if (at === -1) return;
    const section = tree.children[at] as Element;

    const defs = new Map<string, ElementContent[][]>();
    for (const li of findAll(section, (n) => n.tagName === 'li')) {
      defs.set(String(li.properties.id), definitionParagraphs(li));
    }
    tree.children.splice(at, 1);

    const emitted = new Set<string>();
    const out: RootContent[] = [];
    for (const block of tree.children) {
      out.push(block);
      if (!isEl(block)) continue;
      const refs = findAll(block, (n) => n.tagName === 'a' && 'dataFootnoteRef' in n.properties);
      const notes: Element[] = [];
      for (const ref of refs) {
        const target = String(ref.properties.href ?? '').replace(/^#/, '');
        const n = textOf(ref);
        const id = `nota-${n}`;
        ref.properties = { href: `#${id}`, id: ref.properties.id, className: ['nref'], ariaLabel: `Nota ${n}` };
        if (emitted.has(id)) continue;
        emitted.add(id);
        const [first = [], ...rest] = defs.get(target) ?? [];
        notes.push(h('p', { id }, [h('span', { className: ['n'] }, [{ type: 'text', value: n }]), { type: 'text', value: ' ' }, ...first]));
        for (const para of rest) notes.push(h('p', {}, para));
      }
      if (notes.length) {
        out.push({ type: 'text', value: '\n' }, h('aside', { className: ['note'], ariaLabel: notes.length > 1 ? 'Notas' : 'Nota' }, notes));
      }
    }
    tree.children = out;
  };
}
