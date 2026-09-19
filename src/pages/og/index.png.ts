import type { APIRoute } from 'astro';
import { renderOgImage } from '../../lib/og';
import { LEDE } from '../../lib/site';

/** Card for the landing: the name and the lede. */
export const GET: APIRoute = async () =>
  new Response(await renderOgImage('David Aragort', LEDE), { headers: { 'Content-Type': 'image/png' } });
