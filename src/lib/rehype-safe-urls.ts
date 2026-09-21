/**
 * URL allowlist for untrusted Markdown.
 *
 * The build's own posts are written by hand and need none of this, but the reader
 * at /lector renders whatever is pasted into it. Two separate lists, on purpose:
 *
 * - <a href>: no scheme (relative or #fragment), http:, https:, mailto:. A
 *   `javascript:` or `data:` href is a navigation vector, so the attribute is
 *   removed and only the link text survives.
 * - <img src>: no scheme, or data:. The CSP is `img-src 'self' data:`, so a remote
 *   image would be blocked and render broken; it is replaced by its alt text
 *   instead, which is honest about what happened and keeps the page's promise that
 *   it makes no external request.
 *
 * The reader can opt into `images: 'data-only'`; its pasted documents must not
 * request same-origin paths either, because the URL would leak a filename to logs.
 */
import type { Element, Root } from 'hast';

const HREF_SCHEMES = new Set(['http', 'https', 'mailto']);
const SRC_SCHEMES = new Set(['data']);
/** Characters a crafted URL uses to hide its scheme from a naive check. */
const HIDDEN = /[\u0000- \uFFFD]/g;
const SCHEME = /^([a-z][a-z0-9+.-]*):/i;

/** The URL's scheme in lower case, or null when it has none (relative or a fragment). */
function schemeOf(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  let decoded = value;
  try { decoded = decodeURIComponent(value); } catch { /* malformed escapes remain literal */ }
  const match = SCHEME.exec(decoded.replace(HIDDEN, ''));
  return match ? match[1]!.toLowerCase() : null;
}

const allowed = (value: unknown, schemes: Set<string>): boolean => {
  if (typeof value === 'string' && value.startsWith('//')) return false;
  const scheme = schemeOf(value);
  return scheme === null || schemes.has(scheme);
};

function altText(node: Element): string {
  const alt = node.properties.alt;
  return typeof alt === 'string' ? alt : '';
}

/** A refused image becomes its alt text, so the meaning survives the missing picture. */
const caption = (node: Element): Element => ({
  type: 'element',
  tagName: 'span',
  properties: { className: ['img-alt'] },
  children: [{ type: 'text', value: altText(node) }],
});

interface Options { images?: 'same-origin' | 'data-only'; }

export default function rehypeSafeUrls(options: Options = {}) {
  return (tree: Root) => {
    const walk = (parent: Root | Element) => {
      parent.children = parent.children.map((child) => {
        if (child.type !== 'element') return child;
        // Raw prefix, not schemeOf: " data:" or "%20data:" is a relative path to a browser.
        const imageAllowed = options.images === 'data-only'
          ? typeof child.properties.src === 'string' && /^data:/i.test(child.properties.src)
          : allowed(child.properties.src, SRC_SCHEMES);
        if (child.tagName === 'img' && !imageAllowed) {
          return caption(child);
        }
        if (child.tagName === 'a' && !allowed(child.properties.href, HREF_SCHEMES)) {
          delete child.properties.href;
        }
        walk(child);
        return child;
      }) as typeof parent.children;
    };
    walk(tree);
  };
}
