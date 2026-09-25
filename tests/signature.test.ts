import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

const signature = readFileSync('src/components/Signature.astro', 'utf8');
const landing = readFileSync('src/pages/index.astro', 'utf8');
const post = readFileSync('src/pages/escritos/[slug].astro', 'utf8');
const footer = readFileSync('src/components/Footer.astro', 'utf8');

it('lets the landing signature omit its mark while post signatures and footer keep theirs', () => {
  expect(signature).toMatch(/mark\?: boolean/);
  expect(signature).toMatch(/const \{ mark = true \} = Astro\.props/);
  expect(signature).toMatch(/\{mark && <Net name="mark" logo \/>\}/);
  expect(signature).not.toContain('thread');
  expect(landing).toContain('<Signature mark={false} />');
  expect(post).toContain('<Signature />');
  expect(footer).toContain('<Net name="mark" logo />');
});
