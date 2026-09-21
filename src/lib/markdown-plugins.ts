/**
 * How a Markdown document becomes HTML on this site — the one definition.
 *
 * The build (astro.config.mjs) and the browser reader (src/scripts/lector-render.ts)
 * both take their rehype plugins and remark options from here, so a pasted document
 * renders exactly as a published post does. Only the list is shared: the two build
 * their own processors, because the build's wrapper pulls in MDX and acorn, which
 * have no business in a browser bundle.
 */
import rehypeMarginNotes from './rehype-margin-notes.ts';
import rehypeNetDivider from './rehype-net-divider.ts';
import rehypeExternalLinks from './rehype-external-links.ts';
import rehypeSafeUrls from './rehype-safe-urls.ts';

/** Order matters: notes are lifted before dividers and links are rewritten. */
export const rehypePlugins = [rehypeMarginNotes, rehypeNetDivider, rehypeExternalLinks, rehypeSafeUrls];

export const markdownOptions = { gfm: true, smartypants: true } as const;
