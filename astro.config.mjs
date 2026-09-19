// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import rehypeMarginNotes from './src/lib/rehype-margin-notes.ts';
import rehypeNetDivider from './src/lib/rehype-net-divider.ts';

export default defineConfig({
  site: 'https://aragort.com',
  output: 'static',
  // Fixture builds (ARAGORT_POSTS_DIR) keep their own content cache, so test posts can
  // never be served from a cache shared with a real build.
  cacheDir: process.env.ARAGORT_POSTS_DIR ? './node_modules/.astro-fixtures' : './node_modules/.astro',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  integrations: [sitemap()],
  markdown: {
    // unified (remark/rehype) instead of the default Sätteri pipeline, for the
    // standard rehype plugin API: footnotes become margin notes.
    processor: unified({
      gfm: true,
      smartypants: true,
      rehypePlugins: [rehypeMarginNotes, rehypeNetDivider],
    }),
  },
});
