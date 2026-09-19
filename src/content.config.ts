import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { parsePostFilename } from './lib/posts';

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
    /**
     * "En corto": three short lines under the title. Exactly three, because three is the
     * flag -- the bullets are amarillo, azul, rojo, in order, on the post and on the
     * landing alike. A post either has the three or has none.
     */
    resumen: z.array(z.string().min(1)).length(3).optional(),
  }),
});

export const collections = { posts };
