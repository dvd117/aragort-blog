import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { parsePostFilename } from './lib/posts';

const posts = defineCollection({
  loader: glob({
    pattern: '*.md',
    base: './src/content/posts',
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
  }),
});

export const collections = { posts };
