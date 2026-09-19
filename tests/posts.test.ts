import { describe, expect, it } from 'vitest';
import { countWords, formatDateEs, isVisible, parsePostFilename, PostFilenameError } from '../src/lib/posts';

describe('parsePostFilename', () => {
  it('takes the date and slug from a valid name', () => {
    expect(parsePostFilename('2026-09-27-por-que-deje-los-chatbots.md')).toEqual({
      date: '2026-09-27',
      slug: 'por-que-deje-los-chatbots',
    });
  });

  it('accepts a path and uses only the basename', () => {
    expect(parsePostFilename('src/content/posts/2026-01-05-uno.md')).toEqual({ date: '2026-01-05', slug: 'uno' });
  });

  it('accepts a leap day', () => {
    expect(parsePostFilename('2028-02-29-bisiesto.md').date).toBe('2028-02-29');
  });

  it.each([
    ['no date', 'por-que-deje-los-chatbots.md'],
    ['no slug', '2026-09-27.md'],
    ['uppercase slug', '2026-09-27-Chatbots.md'],
    ['accented slug', '2026-09-27-por-qué.md'],
    ['double hyphen', '2026-09-27-a--b.md'],
    ['trailing hyphen', '2026-09-27-chatbots-.md'],
    ['wrong extension', '2026-09-27-chatbots.mdx'],
    ['short year', '26-09-27-chatbots.md'],
    ['month 13', '2026-13-01-chatbots.md'],
    ['30 February', '2026-02-30-chatbots.md'],
    ['29 February, not a leap year', '2027-02-29-chatbots.md'],
  ])('rejects %s', (_label, name) => {
    expect(() => parsePostFilename(name)).toThrow(PostFilenameError);
  });

  it('names the file and the expected pattern in the error', () => {
    expect(() => parsePostFilename('borrador.md')).toThrow(/borrador\.md.*YYYY-MM-DD-slug\.md/);
  });
});

describe('drafts', () => {
  it('keeps drafts out of production builds', () => {
    expect(isVisible({ draft: true }, false)).toBe(false);
  });
  it('shows drafts in dev', () => {
    expect(isVisible({ draft: true }, true)).toBe(true);
  });
  it('publishes posts without the flag, or with draft: false', () => {
    expect(isVisible({}, false)).toBe(true);
    expect(isVisible({ draft: false }, false)).toBe(true);
  });
  it('parses a draft filename like any other', () => {
    expect(parsePostFilename('2026-10-04-la-terminal-y-github.md').slug).toBe('la-terminal-y-github');
  });
});

describe('formatDateEs', () => {
  it('writes the date in Spanish, without shifting the day', () => {
    expect(formatDateEs('2026-09-27')).toBe('27 de septiembre de 2026');
    expect(formatDateEs('2026-01-01')).toBe('1 de enero de 2026');
  });
});

describe('countWords', () => {
  it('counts link text, not URLs or Markdown syntax', () => {
    expect(countWords('Un [enlace largo](https://example.com/a/b) y *énfasis*.')).toBe(5);
  });
});
