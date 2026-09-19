import type { APIRoute } from 'astro';
import { renderOgImage } from '../../lib/og';

/** Card for Sobre mí. */
export const GET: APIRoute = async () =>
  new Response(await renderOgImage('Sobre mí · David Aragort'), { headers: { 'Content-Type': 'image/png' } });
