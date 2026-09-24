import type { APIRoute } from 'astro';
import { touchIconPng } from '../lib/favicon';

export const GET: APIRoute = () =>
  new Response(touchIconPng(), { headers: { 'Content-Type': 'image/png' } });
