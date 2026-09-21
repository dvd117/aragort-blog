import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { scriptHashes, policy } from '../scripts/csp.mjs';

const caddyfile = readFileSync('Caddyfile', 'utf8');
const sha = (s: string) => `sha256-${createHash('sha256').update(s).digest('base64')}`;

/**
 * The policy is generated from the built pages so that script-src can name every
 * inline script by hash. A hand-written hash would rot: one of the inline scripts
 * is bundled by Astro and its bytes change between builds.
 */
describe('CSP generation', () => {
  const read = (f: string) => (files as Record<string, string>)[f]!;
  const files = {
    'a.html': `<script>alert(1)</script><script src="/x.js"></script>`,
    'b.html': `<script type="speculationrules">{"prerender":[]}</script><script>alert(1)</script>`,
  };

  it('hashes every inline script and skips the ones with src', () => {
    expect(scriptHashes(Object.keys(files), read)).toEqual(
      [sha('alert(1)'), sha('{"prerender":[]}')].sort(),
    );
  });

  it('dedupes a script that repeats across pages', () => {
    // alert(1) appears in both files and must be named once.
    const hashes = scriptHashes(Object.keys(files), read);
    expect(hashes.filter((h) => h === sha('alert(1)'))).toHaveLength(1);
  });

  it('matches script tags regardless of case and allows whitespace before the closing bracket', () => {
    const html = {
      'uppercase.html': '<SCRIPT>upper()</SCRIPT >',
      'whitespace.html': '<script>lower()</script   >',
    };
    const readHtml = (file: string) => html[file as keyof typeof html];
    expect(scriptHashes(Object.keys(html), readHtml)).toEqual(
      [sha('upper()'), sha('lower()')].sort(),
    );
  });

  it('matches end tags that carry junk after the tag name, as HTML parsers do', () => {
    const html = { 'junk.html': '<script>junk()</script\t\n bar>' };
    const readHtml = (file: string) => html[file as keyof typeof html];
    expect(scriptHashes(Object.keys(html), readHtml)).toEqual([sha('junk()')]);
  });

  it('does not match tags whose names merely start with script', () => {
    const html = {
      'prefix.html': '<scripty>ignored()</script><script>real()</script>',
    };
    const readHtml = (file: string) => html[file as keyof typeof html];
    expect(scriptHashes(Object.keys(html), readHtml)).toEqual([sha('real()')]);
  });

  it('names the hashes in script-src and never falls back to unsafe-inline', () => {
    const p = policy([sha('alert(1)')]);
    expect(p).toContain(`script-src 'self' '${sha('alert(1)')}'`);
    expect(p).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(p.match(/script-src[^;]*/)![0]).not.toContain('unsafe-inline');
  });

  it("keeps 'unsafe-inline' for styles only: hashes cannot cover style attributes", () => {
    expect(policy([])).toContain("style-src 'self' 'unsafe-inline'");
  });

  it('locks down the rest: no objects, no framing, no form posts', () => {
    const p = policy([]);
    expect(p).toContain("object-src 'none'");
    expect(p).toContain("frame-ancestors 'none'");
    expect(p).toContain("form-action 'none'");
    expect(p).toContain("default-src 'self'");
  });
});

/** The Caddyfile must pull in the generated policy, not carry a stale copy of one. */
describe('Caddyfile headers', () => {
  it('imports the generated CSP instead of declaring its own', () => {
    expect(caddyfile).toContain('import /etc/caddy/csp.caddy');
    expect(caddyfile).not.toContain('Content-Security-Policy');
  });

  it('sets the headers that do not depend on the build', () => {
    expect(caddyfile).toContain('X-Content-Type-Options nosniff');
    expect(caddyfile).toContain('Referrer-Policy strict-origin-when-cross-origin');
    expect(caddyfile).toContain('Cross-Origin-Opener-Policy same-origin');
    expect(caddyfile).toContain('Strict-Transport-Security "max-age=31536000"');
    expect(caddyfile).toContain('Permissions-Policy "');
  });

  it('does not set Cross-Origin-Resource-Policy: OG cards are fetched cross-origin', () => {
    expect(caddyfile).not.toContain('Cross-Origin-Resource-Policy');
  });
});
