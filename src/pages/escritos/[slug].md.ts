import type { APIRoute, GetStaticPaths } from 'astro';
import { readFile } from 'node:fs/promises';
import { getPosts } from '../../lib/collection';

/**
 * /escritos/<slug>.md: the post's source file, byte-identical to the repo.
 * The static server must send text/markdown; charset=utf-8 for .md (see Caddyfile).
 */
export const getStaticPaths = (async () => {
  const posts = await getPosts();
  return posts.map((post) => ({ params: { slug: post.slug }, props: { file: post.file } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const bytes = await readFile(props.file as string);
  return new Response(bytes, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
