import type { APIRoute } from 'astro';
import { vcard } from '../lib/card';

// Caddy sets the served Content-Type by extension (Caddyfile, @vcard).
export const GET: APIRoute = () =>
  new Response(vcard(), { headers: { 'Content-Type': 'text/vcard; charset=utf-8' } });
