import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import rehypeMarginNotes from '../src/lib/rehype-margin-notes';

// The same pipeline the site uses: GFM footnotes in, margin notes out.
async function render(md: string): Promise<string> {
  const processor = await createMarkdownProcessor({ gfm: true, rehypePlugins: [rehypeMarginNotes] });
  return (await processor.render(md)).code;
}

describe('margin notes from footnotes (tests/fixtures/notes.md)', async () => {
  const html = await render(await readFile('tests/fixtures/notes.md', 'utf8'));
  const blocks = html.split('\n').filter(Boolean);

  it('removes the footnotes section', () => {
    expect(html).not.toContain('data-footnotes');
    expect(html).not.toContain('data-footnote-backref');
  });

  it('puts both notes of a paragraph in one aside right after it', () => {
    expect(blocks[0]).toMatch(/^<p>Me inspiré/);
    expect(blocks[1]).toMatch(/^<aside class="note" aria-label="Notas 1 y 2"><p id="nota-1">/);
    expect(blocks[1]).toContain('<p id="nota-2">');
    expect(blocks[1]).toContain('href="https://stephango.com/file-over-app"');
  });

  it('leaves paragraphs without notes alone', () => {
    expect(blocks[2]).toBe('<p>Un párrafo sin notas.</p>');
  });

  it('keeps a multi-paragraph note together', () => {
    expect(blocks[4]).toMatch(/^<aside class="note" aria-label="Nota 3"><p id="nota-3">/);
    expect(blocks[4]).toContain('Un segundo párrafo dentro de la nota.');
  });

  it('points each reference at its note', () => {
    expect(html).toContain('<a href="#nota-1" id="user-content-fnref-ango" class="nref" aria-label="Nota 1">1</a>');
    expect(html).toContain('href="#nota-3"');
    expect(html).not.toContain('footnote-label');
  });

  it('leaves a post without footnotes untouched', async () => {
    expect(await render('Solo texto.')).toBe('<p>Solo texto.</p>');
  });
});
