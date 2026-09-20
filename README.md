# aragort.com

David Aragort's site and blog. Static [Astro](https://astro.build) site with no client framework, no analytics and no external requests at runtime. Fonts are self-hosted (SIL OFL, licences in `public/fonts/`).

## Publishing

Editing the Markdown and pushing is the whole flow.

1. Add a file to `src/content/posts/` named `YYYY-MM-DD-slug.md`.
2. Give it frontmatter:

   ```yaml
   ---
   title: "Título del texto"          # required
   description: "Una línea."          # optional: index excerpt, OG and RSS
   draft: true                        # optional: only visible in `npm run dev`
   ---
   ```

3. Write the post in Markdown and push.

- **The date comes from the filename.** Renaming the file is how a post moves to another date. The slug is the rest of the name, and the post lives at `/escritos/<slug>/`.
- **A filename that doesn't match** `YYYY-MM-DD-slug.md` (lowercase letters, digits, hyphens, and a real date) **fails the build**, and so does a slug used twice. Unknown frontmatter keys fail the build too.
- **Drafts** (`draft: true`) never reach a production build. In `npm run dev` they're labelled "borrador".
- **The raw source** of every post is served at `/escritos/<slug>.md`, as `text/markdown; charset=utf-8`: the repo file byte for byte, then a closing rule and one licence line (`David Aragort, <year>. CC BY-SA 4.0:` and the licence URL, the year taken from the post's date). The writing is licensed CC BY-SA 4.0 (`src/lib/licence.ts`); the footer says so too.

### Margin notes

Notes are standard Markdown footnotes, so the raw `.md` stays readable:

```markdown
...como propone Steph Ango[^ango], los archivos...

[^ango]: [stephango.com/file-over-app](https://stephango.com/file-over-app)
```

`src/lib/rehype-margin-notes.ts` turns each footnote into an `<aside class="note">` right after the paragraph that cites it. From 1100px wide it sits in the margin; below that it stays inline, under its paragraph.

### External links

Links to other sites open in a new tab and carry a ↗; nothing to write in the Markdown.

### Versions

A post is **v1 when published**. Each commit to its file **after the filename date** adds one version; drafting commits on or before that date do not count. From v2 on the post shows `v<n> · editado <date>`, where the date is the last commit after publication. The history comes from `git log --follow`, so renaming the file to move the date keeps it.

**Dokploy must build with full git history.** In a shallow clone (depth 1, the usual CI default), or with no git at all, the history is incomplete. The site then shows **no version line at all**, never a wrong number. For the deploy step: set the Dokploy application's clone to full depth, or run `git fetch --unshallow` before `npm run build`. The Docker build keeps `.git` in its context for this reason (see `.dockerignore`) and installs `git` in the build stage.


### A hue per post

Each post owns one of the three colours of the Venezuelan flag, in the order they appear on it: `amarillo`, `azul`, `rojo`. They are muted to the page's palette — a quiet reference, not a flag drawn on the screen. Set one with `hue:` in the frontmatter, or leave it out: it is then assigned from the slug by a hash (`src/lib/hue.ts`), stable across builds and independent of post order. The order never shuffles.

Only one hue rules a page at a time. It sits on `<html>`, and everything reads it — links, dots, rules, the reading rail, the progress line, footnote markers, the margin-note edge, and every net on the page (header mark, hero, rail, portrait, footer mark). A post wears its own; the landing takes the hue of whichever entry is under the cursor, so a post's colour stays hidden until you reach for it and then takes the whole page. The landing and Sobre mí open in the hue of the last post read on this device, applied inline before first paint (`src/lib/lasthue.ts`). `--focus` is the one mark that never changes hue: the focus ring, and the favicon.

Links are set in the hue (text); dots, nodes, rails and rules use a more saturated UI variant in the light themes (3:1).

Each value is the colour used as text and UI in that theme: ratio on the page / on the note panel (needs 4.5, and 7 in alto contraste). Text on each hue's highlight band stays at 8.6 or more.

| Hue | Light | Dark | Sepia | Alto contraste |
|---|---|---|---|---|
| amarillo | `#8b6114` 5.09 / 4.66 | `#e2a638` 9.75 / 8.77 | `#805a13` 5.18 / 4.64 | `#ffd166` 14.56 / 12.78 |
| azul | `#2e5c9c` 6.21 / 5.68 | `#6298dd` 7.05 / 6.35 | `#305a94` 5.82 / 5.21 | `#88b4e6` 9.72 / 8.53 |
| rojo | `#b23a35` 5.47 / 5.01 | `#e0705e` 6.65 / 5.98 | `#a83731` 5.39 / 4.83 | `#e89a90` 9.46 / 8.3 |


## Reading settings, motion and the preview

**Ajustes de lectura** (the "Aa Ajustes" button in the header) is a bottom sheet on phones and a popover on desktop. It offers:
- text size, line spacing, letter spacing and column width;
- the typeface: Newsreader, Instrument Sans, or Atkinson Hyperlegible, which is downloaded only when chosen;
- the theme: Sistema, Claro, Oscuro, Sepia or Alto contraste;
- highlighting the paragraph being read, underlining every link, and reducing motion;
- reading aloud, with a local Spanish voice only (the control is hidden when there is none).

**Theme resolution:** the reader's saved choice first. With nothing saved, the OS preference applies (light or dark). With no preference, or none readable, the site is dark (OLED black). The base CSS is dark and a `prefers-color-scheme: light` rule applies only when nothing is saved, so there is no flash.

Each setting is one `data-*` attribute on `<html>`, applied before first paint by an inline script generated from `src/lib/settings.ts`, and stored in `localStorage` (`aragort-lectura`).

**Motion** is functional, 120 to 360ms, and off under `prefers-reduced-motion` or the panel's "Reducir movimiento". The net is alive: it drifts in 3D, a few degrees, on every page (half on posts, still while scrolling); each node hangs on a spring, so the cursor (or a finger on the net) pulls nodes in like gravity, a click or tap sends a ring outward that springs back, and on a phone scrolling swings the net and it settles. The node under the cursor glows, and the first page of a session opens with one pulse of light. One loop at 30fps, stopped in hidden tabs (the header mark keeps it running while the page is visible). All of it is off under reduced motion (OS or Ajustes):
- Moving between pages uses cross-document View Transitions, CSS only. An index title becomes the post title, the hero net shrinks into the header mark (on desktop it glides into the post's rail instead), and "Escritos" and "Sobre mí" morph into each other while the nav's raised tab slides from one to the other (the nav is a segmented control, the same shape as a post's Formato/Markdown toggle). The old page stays solid while the new one fades in on top (200ms, a 6px rise); titles hand over in sequence so two line breaks never overlap; same-origin pages are prerendered on hover or focus (Chromium; ignored elsewhere).
- On the index, hovering or focusing an entry lights its own region of the net (`regionsFor` in `src/lib/netpath.ts`: the entry's route, assigned oldest post first so sections never move, grown with the nodes one wire away from its own node). A wire lights once both of its nodes are lit, so regions knit together and the net fills as posts accumulate — about a quarter of it for one post, four fifths for six. Light is only ever added, never taken away; the lit trail recolours to the current entry's hue. On a phone, the entry in the middle of the screen does, in a sticky net band.
- On a post, the rail and header mark light node by node as you read, as a high-water mark: the light holds at the furthest point reached and never recedes, while the chapter dot and the time left keep following your position, so a jump back with the chapter dock is not a dead end. A compact bar with the time left appears on scroll-up, and footnote markers draw a wire to their margin note (on a phone, a tap opens the note).
- At the end of a post, the net completes with one pulse and a card offers the next post and "Escríbeme".
- "Sigue donde quedaste" offers to jump back to the last paragraph read. It is stored on the device only and forgotten after 30 days.

**Buscar.** A box between the hero and the list, hard against its right edge and clear of the net, narrows the list as you type, over the title, description, En corto and date the landing already shows — accent- and case-insensitive, Escape to clear (`src/scripts/filter.ts`). It is built in JS, so it never appears without something to drive it, and it ships no search index: post bodies are not searched.

**Preview.** `node scripts/preview.mjs` writes `preview/`, a small multi-page build with relative links that works from any subpath. It includes the labelled test posts in `tests/fixtures/posts` so hues and navigation can be judged; add `--real` for real content only.


## Type

Geist carries display, UI and body; Geist Mono the source view and small labels (Latin woff2, 52 KB together with the italic). Newsreader ("Serif") and Atkinson Hyperlegible stay as reader options in Ajustes, downloaded only when chosen. Italic is never synthesized (`font-synthesis: none`).

## Development

```sh
npm ci
npm run dev       # http://localhost:4321, drafts visible
npm run build     # static site in dist/
npm test          # vitest
```

Requires Node 22.12 or later. After changing a Markdown plugin (`src/lib/rehype-*.ts`), delete `node_modules/.astro`: Astro caches rendered posts and does not notice plugin changes. Markdown uses Astro's `unified()` processor (remark/rehype) rather than the default Sätteri pipeline, because the margin-note plugin is a standard rehype plugin.

## The net

The mark, the index figure and the reading rail share one frozen geometry, after Gego's *Reticulárea*: `src/assets/net/geometry.ts`. It was generated once by `scripts/generate-net.py` (standard library, fixed seeds) and is committed, so the mark is identical on every build. Rerun the script only to change the mark on purpose; it also writes `public/favicon.svg`.

The rail keeps its own column shape (42 nodes). Landing → post on desktop, each rail node starts from the hero node at the same place in reading order (`src/lib/netmap.ts`) and glides into the column.

On a post, the rail's nodes light up in reading order from 1000px wide, and stay lit once reached. Below that, a 3px hairline at the top shows progress. Under `prefers-reduced-motion` the rail stays fully drawn and static. The hairline keeps reporting position, with no transition.

## Container

```sh
docker build -t aragort-blog .
docker run --rm -p 8080:80 aragort-blog
curl -sI http://localhost:8080/escritos/por-que-deje-los-chatbots.md   # text/markdown; charset=utf-8
```

The Dockerfile has two stages: Node builds the site (with `git`, for versions), then Caddy serves `dist/` on port 80. Caddy was chosen for its one-file config, which covers the `.md` content type, immutable caching for hashed assets and fonts, security headers and the redirect that sends any miss back to the landing. TLS is terminated in front of it (Traefik on Dokploy).

### Security headers

`Strict-Transport-Security`, `Permissions-Policy` (every gated API denied; read aloud is speech synthesis, which is not gated), `Cross-Origin-Opener-Policy`, `X-Content-Type-Options` and `Referrer-Policy` are static, in the `Caddyfile`. `Cross-Origin-Resource-Policy` is deliberately **not** set: OG cards have to be fetchable cross-origin by social scrapers.

**What this file says is the origin's half of the answer.** In production a Deflect CDN edge sits in front and *appends* its own copies of some of these, so the browser receives two values and the winner depends on the header:

| Header | Origin (here) | Deflect appends | Effective |
|---|---|---|---|
| `Strict-Transport-Security` | `max-age=31536000` | `max-age=31536000; includeSubDomains; preload` | **origin** — first wins (RFC 6797 §8.1) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | `no-referrer-when-downgrade` | **Deflect** — last valid wins |
| `X-Frame-Options` | not set | `SAMEORIGIN` | Deflect's |
| `Content-Security-Policy-Report-Only` | not set | a much looser policy | Deflect's, report-only |

So the HSTS line here omits `includeSubDomains` and `preload` on purpose, but the edge adds them anyway and only header order keeps them from applying. Turn the edge toggle off rather than relying on order. The referrer case is the opposite and the edge's weaker value is the one in force — though nothing leaks today, because every external link carries `rel="noopener noreferrer"` (`src/lib/rehype-external-links.ts`) and the CSP confines subresources to `'self'`.

**Check this table against `curl -D - https://aragort.com/`, not against memory.**

**The CSP is generated from the built pages.** The site applies reading settings and the last hue before first paint, so those scripts must be inline. Rather than open `script-src` with `'unsafe-inline'`, `scripts/csp.mjs` hashes every inline script in `dist/` and writes the whole header to `csp.caddy`, which the `Caddyfile` imports. The Dockerfile runs it right after `astro build`. Hashes are never written by hand: one of the inline scripts is bundled by Astro and its bytes change between builds.

`style-src` keeps `'unsafe-inline'` on purpose. Hashes do not cover inline `style` attributes (view-transition names, the net's per-node values) and no source expression does; style injection cannot execute script here.

```sh
npm run build && node scripts/csp.mjs dist csp.caddy && cat csp.caddy
```

## Contrast (WCAG 2.2, computed)

| Theme | Pair | Ratio | Needs |
|---|---|---|---|
| Light | Body text (`fg` on `bg`) | 16.61 | 4.5 |
| Light | Muted text (`fg-2` on `bg`) | 5.95 | 4.5 |
| Light | Muted on panel (notes, toggle) (`fg-2` on `panel`) | 5.45 | 4.5 |
| Light | Accent text (source link, note numbers) (`link` on `bg`) | 5.09 | 4.5 |
| Light | Accent text on panel (`link` on `panel`) | 4.66 | 4.5 |
| Light | Link text on highlighter band (`fg` on `band .38`) | 12.90 | 4.5 |
| Light | Link text on hover band (`fg` on `band .60`) | 11.03 | 4.5 |
| Light | Net nodes, focus ring, progress (UI) (`focus` on `bg`) | 3.16 | 3 |
| Light | Pressed toggle label (`bg` on `fg`) | 16.61 | 4.5 |
| Dark | Body text (reading) (`fg-read` on `bg`) | 13.09 | 4.5 |
| Dark | Titles (`fg` on `bg`) | 17.31 | 4.5 |
| Dark | Muted text (`fg-2` on `bg`) | 8.27 | 4.5 |
| Dark | Muted on panel (`fg-2` on `panel`) | 7.44 | 4.5 |
| Dark | Accent text (`link` on `bg`) | 9.75 | 4.5 |
| Dark | Accent text on panel (`link` on `panel`) | 8.77 | 4.5 |
| Dark | Link text on highlighter band (`fg` on `band .28`) | 10.75 | 4.5 |
| Dark | Link text on hover band (`fg` on `band .45`) | 6.69 | 4.5 |
| Dark | Net nodes, focus ring, progress (UI) (`focus` on `bg`) | 9.75 | 3 |

Band pairs are the amarillo highlight composited over the page background before the ratio is taken.
