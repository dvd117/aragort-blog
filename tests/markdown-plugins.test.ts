import { describe, expect, it } from 'vitest';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { markdownOptions, rehypePlugins } from '../src/lib/markdown-plugins';

const render = async (md: string) =>
  (await (await createMarkdownProcessor({ ...markdownOptions, rehypePlugins })).render(md)).code;

describe('the shared markdown plugin list', () => {
  it('applies all four plugins in one pass', async () => {
    const code = await render(
      'Texto[^n] y [malo](javascript:alert(1)) y [fuera](https://a.test).\n\n---\n\n[^n]: La nota.',
    );
    expect(code).toContain('<aside class="note"');           // margin notes
    expect(code).toContain('class="net-hr"');                // net divider
    expect(code).toContain('target="_blank"');               // external links
    expect(code).not.toContain('javascript:');               // safe urls
  });

  it('keeps smartypants and gfm on', async () => {
    const code = await render('"comillas" y ~~tachado~~');
    expect(code).toContain('“comillas”');
    expect(code).toContain('<del>tachado</del>');
  });
});
