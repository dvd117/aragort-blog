/**
 * Generate the Content-Security-Policy header from the built site.
 *
 * The site needs inline scripts: reading settings and the last hue are applied
 * before first paint, so they cannot be deferred to a file. Rather than open
 * script-src with 'unsafe-inline', every inline script in dist/ is hashed here
 * and the hashes go into the header. One of them is bundled by Astro and its
 * bytes change between builds, so the hashes are computed from the output, never
 * written by hand.
 *
 * style-src keeps 'unsafe-inline' on purpose: hashes do not cover inline style
 * attributes (view-transition names, the net's per-node values) and there is no
 * source expression that does. Style injection cannot execute script here.
 *
 * Usage: node scripts/csp.mjs <dist dir> <output Caddy snippet>
 */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/** Every .html file under a directory. */
function htmlFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...htmlFiles(p));
    else if (entry.name.endsWith('.html')) out.push(p);
  }
  return out;
}

/** sha256-… for every inline <script> (no src) in the built pages, deduped and sorted. */
export function scriptHashes(files, read = (f) => readFileSync(f, 'utf8')) {
  const hashes = new Set();
  for (const file of files) {
    for (const m of read(file).matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
      if (/\ssrc\s*=/i.test(m[1])) continue;
      hashes.add(`sha256-${createHash('sha256').update(m[2]).digest('base64')}`);
    }
  }
  return [...hashes].sort();
}

/** The full policy, given the inline-script hashes. */
export function policy(hashes) {
  const sources = ["'self'", ...hashes.map((h) => `'${h}'`)].join(' ');
  return [
    "default-src 'self'",
    `script-src ${sources}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'none'",
    "object-src 'none'",
  ].join('; ');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [dist = 'dist', out = 'csp.caddy'] = process.argv.slice(2);
  const hashes = scriptHashes(htmlFiles(dist));
  writeFileSync(out, `Content-Security-Policy "${policy(hashes)}"\n`);
  console.log(`csp: ${hashes.length} inline script hash(es) -> ${out}`);
}
