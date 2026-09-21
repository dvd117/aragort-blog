import { describe, expect, it } from 'vitest';
import { renderMarkdown } from '../src/scripts/lector-render';

describe('renderMarkdown', () => {
  it('renders gfm and applies the shared plugins', () => {
    const doc = renderMarkdown('Uno[^n] y [fuera](https://a.test).\n\n---\n\n[^n]: La nota.');
    expect(doc.html).toContain('<aside class="note"');
    expect(doc.html).toContain('class="net-hr"');
    expect(doc.html).toContain('target="_blank"');
  });

  it('drops a javascript: href from pasted input', () => {
    const doc = renderMarkdown('[pulsa](javascript:alert(1))');
    expect(doc.html).not.toContain('javascript:');
    expect(doc.html).toContain('pulsa');
  });

  it('renders a script tag as visible text, never as an element', () => {
    const doc = renderMarkdown('<script>alert(1)</script>');
    expect(doc.html).not.toContain('<script');
    expect(doc.html).toContain('alert(1)');
  });

  it('gives every h2 an id and reports it as a chapter', () => {
    const doc = renderMarkdown('## El primer problema\n\nA.\n\n## ¿Qué te llevas?\n\nB.');
    expect(doc.chapters.map((c) => c.text)).toEqual(['El primer problema', '¿Qué te llevas?']);
    expect(doc.html).toContain(`id="${doc.chapters[0]!.id}"`);
    expect(doc.chapters[1]!.id).not.toBe(doc.chapters[0]!.id);
  });

  it('gives two identical headings distinct ids', () => {
    const doc = renderMarkdown('## Notas\n\nA.\n\n## Notas\n\nB.');
    expect(doc.chapters[0]!.id).not.toBe(doc.chapters[1]!.id);
  });

  it('strips frontmatter and uses its title', () => {
    const doc = renderMarkdown('---\ntitle: Mi nota\n---\n\nHola.');
    expect(doc.title).toBe('Mi nota');
    expect(doc.html).not.toContain('net-hr');
    expect(doc.html).not.toContain('title:');
  });

  it('falls back to the first heading, then the filename', () => {
    expect(renderMarkdown('# Desde el h1\n\nX.').title).toBe('Desde el h1');
    expect(renderMarkdown('Sin encabezado.', 'notas.md').title).toBe('notas.md');
    expect(renderMarkdown('Sin nada.').title).toBe('Sin título');
  });

  it('computes minutes from the rendered text at 220 wpm', () => {
    expect(renderMarkdown('palabra '.repeat(440)).minutes).toBe(2);
    expect(renderMarkdown('corto').minutes).toBe(1);
  });

  it('replaces a remote image with its alt text', () => {
    const doc = renderMarkdown('![Un diagrama](https://evil.test/x.png)');
    expect(doc.html).not.toContain('evil.test');
    expect(doc.html).toContain('<span class="img-alt">Un diagrama</span>');
  });
});
