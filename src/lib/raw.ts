import { readFile } from 'node:fs/promises';

/** A post's source file as served at /escritos/<slug>.md: the exact bytes, as Markdown. */
export async function rawMarkdown(file: string): Promise<Response> {
  const bytes = await readFile(file);
  return new Response(bytes, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
}
