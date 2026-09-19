import type { APIRoute, GetStaticPaths } from 'astro';
import { getPosts } from '../../lib/collection';
import { renderOgImage } from '../../lib/og';

export const getStaticPaths = (async () => {
  const posts = await getPosts();
  return posts.map((post) => ({ params: { slug: post.slug }, props: { title: post.title } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOgImage(props.title as string);
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
};
