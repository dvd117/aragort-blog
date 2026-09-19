// @ts-check
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import sitemap from '@astrojs/sitemap';
import rehypeMarginNotes from './src/lib/rehype-margin-notes.ts';
import { readdirSync, rmSync } from 'node:fs';
import { buildFamily, FAMILIES, shippedFonts } from './src/lib/families.ts';

/** Ship only the chosen family's font files (all four in the preview). */
const pruneFamilies = () => ({
  name: 'aragort-prune-families',
  hooks: {
    'astro:build:done': ({ dir }) => {
      const keep = shippedFonts(buildFamily(), process.env.ARAGORT_PREVIEW === '1');
      const candidates = new Set(Object.values(FAMILIES).flatMap((f) => f.fonts));
      const fonts = new URL('fonts/', dir);
      for (const file of readdirSync(fonts)) {
        if (candidates.has(file) && !keep.has(file)) rmSync(new URL(file, fonts));
      }
    },
  },
});

export default defineConfig({
  site: 'https://aragort.com',
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  integrations: [sitemap(), pruneFamilies()],
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
