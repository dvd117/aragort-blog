import { describe, expect, it } from 'vitest';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import rehypeExternalLinks, { isExternal } from '../src/lib/rehype-external-links';

const render = async (md: string) =>
  (await (await createMarkdownProcessor({ gfm: true, rehypePlugins: [rehypeExternalLinks] })).render(md)).code;

describe('external links', () => {
  it('knows what is external', () => {
    expect(isExternal('https://stephango.com/file-over-app')).toBe(true);
    expect(isExternal('http://example.org')).toBe(true);
    expect(isExternal('https://aragort.com/sobre-mi/')).toBe(false);
    expect(isExternal('https://www.aragort.com/')).toBe(false);
    expect(isExternal('/sobre-mi/')).toBe(false);
    expect(isExternal('#nota-1')).toBe(false);
    expect(isExternal('mailto:hola@aragort.com')).toBe(false);
  });

  it('opens in a new tab, says so, and glues the arrow to the last word', async () => {
    const html = await render('Lee [archivos por encima de aplicaciones](https://stephango.com/file-over-app).');
    expect(html).toContain('<a href="https://stephango.com/file-over-app" target="_blank" rel="noopener noreferrer" class="ext">');
    expect(html).toContain('archivos por encima de <span class="ext-tail">aplicaciones<span class="ext-arrow" aria-hidden="true">↗</span></span><span class="visually-hidden"> (abre en otra pestaña)</span></a>');
  });

  it('handles a one-word link', async () => {
    const html = await render('[Markdown](https://es.wikipedia.org/wiki/Markdown)');
    expect(html).toContain('<span class="ext-tail">Markdown<span class="ext-arrow" aria-hidden="true">↗</span></span>');
  });

  it('wraps a trailing element whole when the link does not end in text', async () => {
    const html = await render('[el archivo `AGENTS.md`](https://agents.md/)');
    expect(html).toContain('el archivo <span class="ext-tail"><code>AGENTS.md</code><span class="ext-arrow" aria-hidden="true">↗</span></span>');
  });

  it('breaks inside a label that is one long element, instead of nowrapping all of it', async () => {
    const html = await render('[*According to Kentik data, traffic from Cuba dropped for two hours*](https://twitter.com/DougMadory/status/1354581571840389127)');
    // The arrow glues to the last word *inside* the <em>, so the label can still wrap.
    expect(html).toContain('two <span class="ext-tail">hours<span class="ext-arrow" aria-hidden="true">↗</span></span></em>');
    expect(html).not.toContain('<span class="ext-tail"><em>');
  });

  it('leaves internal links and mailto alone', async () => {
    const html = await render('[Sobre mí](/sobre-mi/) y [correo](mailto:hola@aragort.com)');
    expect(html).toBe('<p><a href="/sobre-mi/">Sobre mí</a> y <a href="mailto:hola@aragort.com">correo</a></p>');
  });
});
