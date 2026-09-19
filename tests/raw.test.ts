import { readFile, readdir } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { rawMarkdown } from '../src/lib/raw';

const POSTS = 'src/content/posts';

describe('raw .md route', async () => {
  const files = (await readdir(POSTS)).filter((f) => f.endsWith('.md'));

  it('has posts to check', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('serves %s byte for byte', async (name) => {
    const file = `${POSTS}/${name}`;
    const res = await rawMarkdown(file);
    const served = new Uint8Array(await res.arrayBuffer());
    const disk = new Uint8Array(await readFile(file));
    expect(served.length).toBe(disk.length);
    expect(Buffer.compare(Buffer.from(served), Buffer.from(disk))).toBe(0);
  });

  it('labels it as UTF-8 Markdown', async () => {
    const res = await rawMarkdown(`${POSTS}/${files[0]}`);
    expect(res.headers.get('content-type')).toBe('text/markdown; charset=utf-8');
  });
});
