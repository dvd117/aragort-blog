import { readFile } from 'node:fs/promises';
import { LICENCE } from './licence';

/** The licence line that closes a served .md, after a blank line and a rule. */
export function licenceFooter(source: string, year: string): string {
  return `${source.endsWith('\n') ? '' : '\n'}\n---\n\nDavid Aragort, ${year}. ${LICENCE.name}:\n${LICENCE.url}\n`;
}

/** A post's source as served at /escritos/<slug>.md: the file's exact bytes, then the licence line. */
export async function servedMarkdown(file: string, year: string): Promise<string> {
  const source = await readFile(file, 'utf8');
  return source + licenceFooter(source, year);
}

export async function rawMarkdown(file: string, year: string): Promise<Response> {
  const bytes = await readFile(file);
  const tail = Buffer.from(licenceFooter(bytes.toString('utf8'), year), 'utf8');
  return new Response(Buffer.concat([bytes, tail]), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
}
