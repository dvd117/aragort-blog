import { readFile, readdir } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { licenceFooter, rawMarkdown } from '../src/lib/raw';
import { LICENCE } from '../src/lib/licence';

const POSTS = 'src/content/posts';

describe('raw .md route', async () => {
  const files = (await readdir(POSTS)).filter((f) => f.endsWith('.md'));

  it('has posts to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('serves %s byte for byte, then the licence line', async (name) => {
    const file = `${POSTS}/${name}`;
    const year = name.slice(0, 4);
    const served = Buffer.from(await (await rawMarkdown(file, year)).arrayBuffer());
    const disk = await readFile(file);
    expect(Buffer.compare(served.subarray(0, disk.length), disk)).toBe(0);
    const tail = served.subarray(disk.length).toString('utf8');
    expect(tail.endsWith(`---\n\nDavid Aragort, ${year}. ${LICENCE.name}:\n${LICENCE.url}\n`)).toBe(true);
  });

  it('keeps a blank line before the rule, so it never turns the last paragraph into a heading', () => {
    expect(licenceFooter('texto final.', '2026')).toMatch(/^\n\n---\n/);
    expect(licenceFooter('texto final.\n', '2026')).toMatch(/^\n---\n/);
  });

  it('labels it as UTF-8 Markdown', async () => {
    const res = await rawMarkdown(`${POSTS}/${files[0]}`, '2026');
    expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
  });
});
