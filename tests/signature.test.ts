import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

const signature = readFileSync('src/components/Signature.astro', 'utf8');
const landing = readFileSync('src/pages/index.astro', 'utf8');
const post = readFileSync('src/pages/escritos/[slug].astro', 'utf8');
const footer = readFileSync('src/components/Footer.astro', 'utf8');

it('signs every page without a mark: the header and footer carry it', () => {
  expect(signature).not.toContain('<Net');
  expect(signature).toMatch(/<p class="who-k" id="who-k">Quién escribe<\/p>/);
  expect(signature).toContain('aria-labelledby="who-k"');
  expect(footer).toContain('<Net name="mark" logo />');
});

it('puts the thread\'s terminal station only on the landing signature', () => {
  expect(signature).toMatch(/const \{ stop = false \} = Astro\.props/);
  expect(signature).toMatch(/\{stop && <span class="node" aria-hidden="true">/);
  expect(landing).toContain('<Signature stop />');
  expect(post).toContain('<Signature />');
});
