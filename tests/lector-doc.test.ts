import { describe, expect, it } from 'vitest';
import { MAX_BYTES, countWords, documentTitle, stripFrontmatter, tooLarge } from '../src/lib/lector-doc';

describe('stripFrontmatter', () => {
  it('removes a leading block and lifts its title', () => {
    const { body, title } = stripFrontmatter('---\ntitle: Mi nota\ntags: [a]\n---\n\nHola.');
    expect(body).toBe('Hola.');
    expect(title).toBe('Mi nota');
  });

  it('strips quotes around the title', () => {
    expect(stripFrontmatter('---\ntitle: "Con comillas"\n---\n\nX.').title).toBe('Con comillas');
  });

  it('returns no title when the block has none', () => {
    const { body, title } = stripFrontmatter('---\ntags: [a]\n---\n\nHola.');
    expect(body).toBe('Hola.');
    expect(title).toBeNull();
  });

  it('leaves a document with no frontmatter untouched', () => {
    const { body, title } = stripFrontmatter('# Hola\n\nTexto.');
    expect(body).toBe('# Hola\n\nTexto.');
    expect(title).toBeNull();
  });

  it('keeps a later --- as a real divider', () => {
    const { body } = stripFrontmatter('---\ntitle: T\n---\n\nUno.\n\n---\n\nDos.');
    expect(body).toBe('Uno.\n\n---\n\nDos.');
  });
});

describe('documentTitle', () => {
  it('prefers frontmatter, then a heading, then the filename', () => {
    expect(documentTitle({ frontmatter: 'A', heading: 'B', filename: 'c.md' })).toBe('A');
    expect(documentTitle({ frontmatter: null, heading: 'B', filename: 'c.md' })).toBe('B');
    expect(documentTitle({ frontmatter: null, heading: null, filename: 'c.md' })).toBe('c.md');
    expect(documentTitle({ frontmatter: null, heading: null })).toBe('Sin título');
  });
});

describe('countWords', () => {
  it('counts words separated by any whitespace', () => {
    expect(countWords('  uno  dos\ntres\t cuatro ')).toBe(4);
  });

  it('counts an empty document as zero', () => {
    expect(countWords('   ')).toBe(0);
  });
});

describe('tooLarge', () => {
  it('refuses input over the cap and accepts input under it', () => {
    expect(tooLarge('x'.repeat(10))).toBe(false);
    expect(tooLarge('x'.repeat(MAX_BYTES + 1))).toBe(true);
  });

  it('uses UTF-8 bytes for multibyte input', () => {
    expect(tooLarge('é'.repeat(MAX_BYTES / 2 + 1))).toBe(true);
  });
});
