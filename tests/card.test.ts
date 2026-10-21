import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { card, vcard } from '../src/lib/card';

const caddyfile = readFileSync('Caddyfile', 'utf8');
const page = readFileSync('src/pages/card.astro', 'utf8');

describe('the /card vCard', () => {
  const v = vcard();

  it('is a CRLF vCard 3.0 the phone importers read', () => {
    expect(v.startsWith('BEGIN:VCARD\r\nVERSION:3.0\r\n')).toBe(true);
    expect(v.endsWith('END:VCARD\r\n')).toBe(true);
    expect(v.replace(/\r\n/g, '')).not.toContain('\n');
  });

  it('carries the same contacts as the page', () => {
    expect(v).toContain('FN:David Aragort\r\n');
    expect(v).toContain('N:Aragort;David;;;\r\n');
    expect(v).toContain(`EMAIL;TYPE=INTERNET:${card.email}\r\n`);
    expect(v).toContain(`URL:${card.linkedin.href}\r\n`);
    expect(v).toContain(`URL:${card.signal.href}\r\n`);
    expect(v).toContain('URL:https://ateneo-abierto.org/funders\r\n');
  });

  it('names Ateneo Abierto in the role, so the page can link it', () => {
    expect(card.role).toContain(card.ateneo.name);
  });

  it('escapes the commas in the role', () => {
    expect(v).toContain('TITLE:Digital security specialist\\, digital rights advocate and Ateneo Abierto founder\r\n');
  });
});

describe('the /card page', () => {
  it('is English inside the Spanish site and kept out of search', () => {
    expect(page).toContain('lang="en"');
    expect(page).toMatch(/<Base [^>]*noindex/);
  });

  it('links the vCard Caddy serves as text/vcard', () => {
    expect(page).toContain('href="/david-aragort.vcf"');
    expect(caddyfile).toMatch(/@vcard path \*\.vcf\s+header @vcard Content-Type "text\/vcard; charset=utf-8"/);
  });
});
