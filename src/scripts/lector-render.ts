/**
 * A pasted document, rendered the way a post is.
 *
 * The plugin list comes from src/lib/markdown-plugins.ts, so /lector and /escritos
 * cannot drift. The processor itself is built here rather than imported from
 * @astrojs/markdown-remark, whose wrapper drags MDX, acorn and source-map into the
 * bundle -- none of which belong in a browser.
 *
 * Heading ids and the chapter list are added here and not in the shared list: the
 * build already gets both from Astro, and slugging twice would change post output.
 */
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkSmartypants from 'remark-smartypants';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import GithubSlugger from 'github-slugger';
import type { Element, Root } from 'hast';
import { rehypePlugins } from '../lib/markdown-plugins.ts';
import { countWords, documentTitle, stripFrontmatter } from '../lib/lector-doc.ts';
import { readingMinutes } from '../lib/posts.ts';

export interface RenderedDoc {
  html: string;
  title: string;
  minutes: number;
  chapters: Array<{ id: string; text: string }>;
}

const textOf = (node: Element): string =>
  node.children.map((c) => (c.type === 'text' ? c.value : c.type === 'element' ? textOf(c) : '')).join('');

/** Keep text from raw HTML without ever allowing its tags into the output tree. */
const visibleRawHtml = (value: string): string => value.replace(/<[^>]*>/g, '');

/** Slug every heading and collect the h2s, which are this document's chapters. */
function rehypeHeadings(collect: {
  h1: string | null;
  chapters: RenderedDoc['chapters'];
  removeTitleHeading: boolean;
}) {
  return (tree: Root) => {
    const slugger = new GithubSlugger();
    let removedTitleHeading = false;
    const walk = (parent: Root | Element) => {
      for (let i = 0; i < parent.children.length; i++) {
        const child = parent.children[i];
        if (child.type !== 'element') continue;
        if (/^h[1-6]$/.test(child.tagName)) {
          const text = textOf(child);
          const id = typeof child.properties.id === 'string' ? child.properties.id : slugger.slug(text);
          child.properties.id = id;
          if (child.tagName === 'h1' && collect.h1 === null) collect.h1 = text;
          if (child.tagName === 'h2') collect.chapters.push({ id, text });
          if (child.tagName === 'h1' && collect.removeTitleHeading && !removedTitleHeading) {
            parent.children.splice(i, 1);
            i--;
            removedTitleHeading = true;
            continue;
          }
        }
        walk(child);
      }
    };
    walk(tree);
  };
}

/** Plain text of the rendered document, for the word count. */
const stripTags = (html: string): string => html.replace(/<[^>]*>/g, ' ');

export function renderMarkdown(source: string, filename?: string): RenderedDoc {
  const { body, title: frontmatter } = stripFrontmatter(source);
  const collect: {
    h1: string | null;
    chapters: RenderedDoc['chapters'];
    removeTitleHeading: boolean;
  } = { h1: null, chapters: [], removeTitleHeading: !frontmatter };

  const file = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkSmartypants)
    .use(remarkRehype, {
      handlers: {
        html: (_state, node) => ({ type: 'text', value: visibleRawHtml(node.value) }),
      },
    })
    .use(rehypePlugins as never)
    .use(rehypeHeadings, collect)
    .use(rehypeStringify)
    .processSync(body);

  const html = String(file);
  return {
    html,
    title: documentTitle({ frontmatter, heading: collect.h1, filename }),
    minutes: readingMinutes(countWords(stripTags(html))),
    chapters: collect.chapters,
  };
}
