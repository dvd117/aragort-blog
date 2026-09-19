import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { parsePostFilename } from './lib/posts';
import { HUES } from './lib/hue';

const posts = defineCollection({
  loader: glob({
    pattern: '*.md',
    // ARAGORT_POSTS_DIR points a build at test fixtures (screenshots, previews); never used in production.
    base: process.env.ARAGORT_POSTS_DIR ?? './src/content/posts',
    // The id is the filename without .md. Parsing here fails the build on a bad name.
    generateId: ({ entry }) => {
      parsePostFilename(entry);
      return entry.replace(/\.md$/, '');
    },
  }),
  schema: z.strictObject({
    title: z.string().min(1),
    description: z.string().optional(),
    draft: z.boolean().optional(),
    hue: z.enum(HUES).optional(),
  }),
});

export const collections = { posts };
