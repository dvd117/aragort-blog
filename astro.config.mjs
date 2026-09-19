// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import rehypeMarginNotes from './src/lib/rehype-margin-notes.ts';

export default defineConfig({
  site: 'https://aragort.com',
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  markdown: {
    // unified (remark/rehype) instead of the default Sätteri pipeline, for the
    // standard rehype plugin API: footnotes become margin notes.
    processor: unified({
      gfm: true,
      smartypants: true,
      rehypePlugins: [rehypeMarginNotes],
    }),
  },
});
