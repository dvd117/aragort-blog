import { describe, expect, it } from 'vitest';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import rehypeSafeUrls from '../src/lib/rehype-safe-urls';

const render = async (md: string) =>
  (await (await createMarkdownProcessor({ gfm: true, rehypePlugins: [rehypeSafeUrls] })).render(md)).code;

describe('rehype-safe-urls', () => {
  it('drops a javascript: href but keeps the link text', async () => {
    const code = await render('[pulsa](javascript:alert(1))');
    expect(code).not.toContain('javascript:');
    expect(code).toContain('pulsa');
  });

  it('drops data: and vbscript: hrefs', async () => {
    const code = await render('[a](data:text/html,<b>x</b>) [b](vbscript:msgbox)');
    expect(code).not.toContain('data:text/html');
    expect(code).not.toContain('vbscript:');
  });

  it('ignores whitespace and control characters used to hide a scheme', async () => {
    const code = await render('[x](<\u0009java\u0000script:alert(1)>)');
    expect(code).not.toMatch(/href="[^"]*script:/);
  });

  it('keeps http, https, mailto and fragment hrefs', async () => {
    const code = await render('[a](https://a.test) [b](http://b.test) [c](mailto:x@y.test) [d](#sec)');
    expect(code).toContain('href="https://a.test"');
    expect(code).toContain('href="http://b.test"');
    expect(code).toContain('href="mailto:x@y.test"');
    expect(code).toContain('href="#sec"');
  });

  it('replaces a remote image with its alt text', async () => {
    const code = await render('![Un diagrama](https://evil.test/x.png)');
    expect(code).not.toContain('evil.test');
    expect(code).toContain('<span class="img-alt">Un diagrama</span>');
  });

  it('rejects protocol-relative remote URLs', async () => {
    const code = await render('[sitio](//evil.test/x) ![Un diagrama](//evil.test/x.png)');
    expect(code).not.toContain('evil.test');
    expect(code).toContain('<span class="img-alt">Un diagrama</span>');
  });

  it('keeps a data: image and a relative one', async () => {
    const code = await render('![a](data:image/gif;base64,R0lGOD) ![b](/local.png)');
    expect(code).toContain('src="data:image/gif;base64,R0lGOD"');
    expect(code).toContain('src="/local.png"');
  });

  it('never emits an event-handler attribute', async () => {
    const code = await render('[x](https://a.test "t")\n\n![y](/b.png)');
    expect(code).not.toMatch(/\son[a-z]+=/i);
  });
});
