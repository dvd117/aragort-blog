import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getPosts } from '../lib/collection';

/** Full-content feed. Dates are midnight in Caracas (UTC-4). */
export const GET: APIRoute = async (context) => {
  const posts = await getPosts();
  return rss({
    title: 'David Aragort',
    description: 'Escritos de David Aragort.',
    site: context.site!,
    items: posts.map((p) => ({
      title: p.title,
      pubDate: new Date(`${p.date}T00:00:00-04:00`),
      description: p.description,
      link: `/escritos/${p.slug}/`,
      content: p.entry.rendered?.html ?? '',
    })),
    customData: '<language>es</language>',
  });
};
