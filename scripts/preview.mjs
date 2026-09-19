#!/usr/bin/env node
/**
 * Build a small multi-page preview in preview/: index, posts, Sobre mí, 404,
 * with every link and asset made relative, so it works when served from any
 * subpath (a private artifact, a folder on a server). Page-to-page motion is
 * cross-document View Transitions, so it needs real pages, not one file.
 *
 *   node scripts/preview.mjs           # real post plus the labelled test posts
 *                                      # (tests/fixtures/posts), to show hues,
 *                                      # net navigation and the next-post card
 *   node scripts/preview.mjs --real    # only src/content/posts
 *
 * The output is not committed (preview/ is ignored).
 */
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'preview');
const build = join(root, 'preview-build');
const real = process.argv.includes('--real');

rmSync(out, { recursive: true, force: true });
rmSync(build, { recursive: true, force: true });
const env = { ...process.env, ARAGORT_SPECIMEN: '1' }; // all four families + the Tipo switcher
if (!real) env.ARAGORT_POSTS_DIR = 'tests/fixtures/posts';
execFileSync('npx', ['astro', 'build', '--outDir', build], { cwd: root, env, stdio: 'inherit' });

// Keep the pages and what they load. Feeds, sitemap and OG images are not part of the preview.
const keep = (rel) => !/^(og\/|sitemap|robots\.txt$|rss\.xml$)/.test(rel);
const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) walk(abs);
    else files.push(relative(build, abs).split('\\').join('/'));
  }
};
walk(build);

/** Root-relative URL -> relative to the file that references it. Directories get index.html. */
const relativize = (from, url) => {
  const [pathPart, rest = ''] = url.split(/(?=[?#])/);
  let target = pathPart.replace(/^\//, '');
  if (target === '' || target.endsWith('/')) target += 'index.html';
  const r = posix.relative(posix.dirname(from), target) || 'index.html';
  return r + rest;
};

let rewritten = 0;
for (const rel of files.filter(keep)) {
  const src = join(build, rel);
  const dest = join(out, rel);
  mkdirSync(dirname(dest), { recursive: true });
  if (/\.(html|css)$/.test(rel)) {
    let text = readFileSync(src, 'utf8');
    text = text.replace(/\b(href|src)="(\/(?!\/)[^"]*)"/g, (_, attr, url) => { rewritten++; return `${attr}="${relativize(rel, url)}"`; });
    text = text.replace(/url\((["']?)(\/(?!\/)[^)"']*)\1\)/g, (_, q, url) => { rewritten++; return `url(${q}${relativize(rel, url)}${q})`; });
    // RSS and the OG image are dropped from the preview: neutralise what points at them.
    text = text.replace(/<link rel="alternate" type="application\/rss\+xml"[^>]*>/g, '');
    text = text.replace(/<meta (property="og:image"|name="twitter:card")[^>]*>/g, '');
    text = text.replace(/<a href="(?:\.\.\/)*rss\.xml">RSS<\/a>/g, '<span>RSS</span>');
    writeFileSync(dest, text);
  } else {
    cpSync(src, dest);
  }
}
rmSync(build, { recursive: true, force: true });

// Guard: nothing may still point at the site root.
const leftovers = [];
const check = (dir) => {
  for (const name of readdirSync(dir)) {
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) { check(abs); continue; }
    if (!/\.(html|css)$/.test(name)) continue;
    const t = readFileSync(abs, 'utf8');
    for (const m of t.matchAll(/\b(?:href|src)="(\/(?!\/)[^"]*)"|url\(["']?(\/(?!\/)[^)"']*)/g)) leftovers.push(`${relative(out, abs)}: ${m[1] ?? m[2]}`);
  }
};
check(out);
if (leftovers.length) { console.error('Root-relative URLs left:\n' + leftovers.join('\n')); process.exit(1); }

const size = (dir) => readdirSync(dir).reduce((n, f) => { const a = join(dir, f); return n + (statSync(a).isDirectory() ? size(a) : statSync(a).size); }, 0);
console.log(`\npreview/ ready (${real ? 'real content only' : 'real post + labelled test posts'}): ${rewritten} URLs made relative, ${(size(out) / 1024).toFixed(0)} KB.`);
console.log('Open preview/index.html through any static server, from any path.');
if (!existsSync(join(out, 'index.html'))) process.exit(1);
