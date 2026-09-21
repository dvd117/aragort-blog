// @vitest-environment happy-dom
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/components/ReadingSettings.astro', 'utf8');

describe('ReadingSettings speech scope', () => {
  it('keeps read-aloud out of the lector shell while matching published posts', () => {
    expect(source).toContain("document.querySelector('.post:not([data-lector-shell]) .prose')");

    document.body.innerHTML = `
      <article class="post" data-lector-shell><div class="prose"></div></article>
      <article class="post"><div class="prose"></div></article>`;
    const guard = '.post:not([data-lector-shell]) .prose';

    expect(document.querySelector('article[data-lector-shell] .prose')?.matches(guard)).toBe(false);
    expect(document.querySelector('article.post:not([data-lector-shell]) .prose')?.matches(guard)).toBe(true);
  });
});
