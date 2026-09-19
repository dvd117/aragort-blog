import { describe, expect, it } from 'vitest';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import rehypeMarginNotes from '../src/lib/rehype-margin-notes';
import rehypeNetDivider from '../src/lib/rehype-net-divider';

const render = async (md: string) =>
  (await (await createMarkdownProcessor({ gfm: true, rehypePlugins: [rehypeMarginNotes, rehypeNetDivider] })).render(md));

describe('Markdown conventions', () => {
  it('turns --- into a net divider that is still a separator', async () => {
    const { code } = await render('Uno.\n\n---\n\nDos.');
    expect(code).not.toContain('<hr');
    expect(code).toContain('<div role="separator" class="net-hr"><svg viewBox="0 0 96 16"');
  });

  it('reports ## headings with ids, which become the chapters', async () => {
    const r = await render('## El primer problema\n\nA.\n\n## ¿Qué te llevas contigo?\n\nB.');
    const chapters = r.metadata.headings.filter((h) => h.depth === 2);
    expect(chapters.map((h) => h.text)).toEqual(['El primer problema', '¿Qué te llevas contigo?']);
    expect(r.code).toContain(`id="${chapters[0]!.slug}"`);
  });

  it('keeps blockquotes and bold as plain Markdown (styled by CSS)', async () => {
    const { code } = await render('> La conversación es desechable; el archivo no.\n\nTexto **clave**.');
    expect(code).toContain('<blockquote>');
    expect(code).toContain('<strong>clave</strong>');
  });
});
