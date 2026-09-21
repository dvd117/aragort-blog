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

  it('leaves no tag behind when stripping one reassembles another', () => {
    for (const source of ['<scr<b></b>ipt>alert(1)</script>', '<<script>script>alert(1)</script>', '<div><img src=x onerror=alert(1)</div>']) {
      const doc = renderMarkdown(source);
      expect(doc.html).not.toMatch(/<(script|img)/i);
      expect(doc.html).not.toMatch(/&lt;(script|img)/i);
    }
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

  it('reserves margin-note ids before slugging headings', () => {
    const doc = renderMarkdown('## nota-1\n\nTexto[^1].\n\n[^1]: Una nota.');
    expect(doc.html).toContain('<h2 id="nota-1-1">nota-1</h2>');
    expect(doc.html).toContain('<p id="nota-1">');
  });

  it('reserves ids supplied by the page outside the reader shell', () => {
    const doc = renderMarkdown('## Contenido\n\nTexto.', undefined, ['contenido']);
    expect(doc.chapters[0]!.id).toBe('contenido-1');
  });

  it('keeps an otherwise unused heading slug unchanged', () => {
    expect(renderMarkdown('## Uno\n\nTexto.').chapters[0]!.id).toBe('uno');
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

  it('removes the h1 that supplied the reader title', () => {
    const doc = renderMarkdown('# Desde el h1\n\nX.');
    expect(doc.title).toBe('Desde el h1');
    expect(doc.html).not.toContain('<h1');
  });

  it('keeps an h1 when the title comes from frontmatter', () => {
    const doc = renderMarkdown('---\ntitle: Título de portada\n---\n\n# Encabezado visible\n\nX.');
    expect(doc.title).toBe('Título de portada');
    expect(doc.html).toContain('<h1 id="encabezado-visible">Encabezado visible</h1>');
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

  it('allows only data images in the reader', () => {
    const doc = renderMarkdown(
      '![Relativa](secreto/foto.png)\n\n![Raíz](/privado/foto.png)\n\n![Remota](https://evil.test/foto.png)\n\n![En línea](data:image/png;base64,AAA)',
    );
    expect(doc.html).toContain('<span class="img-alt">Relativa</span>');
    expect(doc.html).toContain('<span class="img-alt">Raíz</span>');
    expect(doc.html).toContain('<span class="img-alt">Remota</span>');
    expect(doc.html).toContain('<img src="data:image/png;base64,AAA" alt="En línea">');
  });

  it('refuses a data image disguised as a relative path', () => {
    // The browser resolves "%20data:..." against /lector/ and asks the server for it.
    const doc = renderMarkdown('![Espacio](< data:image/gif;base64,R0lGOD>)\n\n![Cifrada](%20data:image/gif;base64,R0lGOD)');
    expect(doc.html).toContain('<span class="img-alt">Espacio</span>');
    expect(doc.html).toContain('<span class="img-alt">Cifrada</span>');
    expect(doc.html).not.toContain('<img');
  });
});
