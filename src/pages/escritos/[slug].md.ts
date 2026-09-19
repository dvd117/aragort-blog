import type { APIRoute, GetStaticPaths } from 'astro';
import { getPosts } from '../../lib/collection';
import { rawMarkdown } from '../../lib/raw';

/**
 * /escritos/<slug>.md: the post's source file, byte-identical to the repo.
 * The static server must send text/markdown; charset=utf-8 for .md (see Caddyfile).
 */
export const getStaticPaths = (async () => {
  const posts = await getPosts();
  return posts.map((post) => ({ params: { slug: post.slug }, props: { file: post.file } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => rawMarkdown(props.file as string);
