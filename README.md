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
- **The raw source** of every post is served at `/escritos/<slug>.md`, byte-identical to the repo file, as `text/markdown; charset=utf-8`.

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

Each post owns one of five muted hues: `ochre` (the brand), `teal`, `brick`, `sky`, `moss`. Set it with `hue:` in the frontmatter, or leave it out: it is then assigned from the slug by a hash (`src/lib/hue.ts`), stable across builds and independent of post order. The hue colours the post's reading rail, progress line, footnote markers, margin-note edge and link highlight, and a small dot beside the date on the index and the post. Ochre stays for the wordmark node and global UI. Links are set in the hue (text); dots, nodes, rails and rules use a more saturated UI variant in the light themes (3:1).

Each value is the colour used as text and UI in that theme: ratio on the page / on the note panel (needs 4.5, and 7 in alto contraste). Text on each hue's highlight band stays at 8.6 or more.

| Hue | Light | Dark | Sepia | Alto contraste |
|---|---|---|---|---|
| ochre | `#8b6114` 5.09 / 4.66 | `#e2a638` 9.75 / 8.77 | `#805a13` 5.18 / 4.64 | `#ffd166` 14.56 / 12.78 |
| teal | `#2f7472` 5.03 / 4.6 | `#43a3a0` 6.99 / 6.28 | `#2c6b69` 5.14 / 4.6 | `#48b0ac` 8.08 / 7.09 |
| brick | `#aa4e3c` 5.03 / 4.6 | `#d4735f` 6.42 / 5.77 | `#9d4837` 5.14 / 4.6 | `#d39082` 8.08 / 7.09 |
| sky | `#386e97` 5.05 / 4.62 | `#5b9bd0` 7.04 / 6.34 | `#34658c` 5.18 / 4.64 | `#75a6cc` 8.08 / 7.09 |
| moss | `#567138` 5.09 / 4.66 | `#759a4c` 6.48 / 5.83 | `#506833` 5.21 / 4.67 | `#84ac56` 8.02 / 7.03 |


## Reading settings, motion and the preview

**Ajustes de lectura** (the "Aa Ajustes" button in the header) is a bottom sheet on phones and a popover on desktop. It offers:
- text size, line spacing, letter spacing and column width;
- the typeface: Newsreader, Instrument Sans, or Atkinson Hyperlegible, which is downloaded only when chosen;
- the theme: Sistema, Claro, Oscuro, Sepia or Alto contraste;
- highlighting the paragraph being read, underlining every link, and reducing motion;
- reading aloud, with a local Spanish voice only (the control is hidden when there is none).

**Theme resolution:** the reader's saved choice first. With nothing saved, the OS preference applies (light or dark). With no preference, or none readable, the site is dark (OLED black). The base CSS is dark and a `prefers-color-scheme: light` rule applies only when nothing is saved, so there is no flash.

Each setting is one `data-*` attribute on `<html>`, applied before first paint by an inline script generated from `src/lib/settings.ts`, and stored in `localStorage` (`aragort-lectura`).

**Motion** is functional, 120 to 360ms, never looping, and off under `prefers-reduced-motion` or the panel's "Reducir movimiento":
- Moving between pages uses cross-document View Transitions, CSS only. An index title becomes the post title, the hero net shrinks into the header mark, "Escritos" and "Sobre mí" morph into each other, and every page rises in 12px.
- On the index, hovering or focusing an entry lights its path through the net. On a phone, the entry in the middle of the screen does, in a sticky net band.
- On a post, the header mark lights node by node as you read. A compact bar with the time left appears on scroll-up, and footnote markers draw a wire to their margin note (on a phone, a tap opens the note).
- At the end of a post, the net completes with one pulse and a card offers the next post and "Escríbeme".
- "Sigue donde quedaste" offers to jump back to the last paragraph read. It is stored on the device only and forgotten after 30 days.

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

On a post, the rail's nodes light up in reading order from 1000px wide. Below that, a 3px hairline at the top shows progress. Under `prefers-reduced-motion` the rail stays fully drawn and static. The hairline keeps reporting position, with no transition.

## Container

```sh
docker build -t aragort-blog .
docker run --rm -p 8080:80 aragort-blog
curl -sI http://localhost:8080/escritos/por-que-deje-los-chatbots.md   # text/markdown; charset=utf-8
```

The Dockerfile has two stages: Node builds the site (with `git`, for versions), then Caddy serves `dist/` on port 80. Caddy was chosen for its one-file config, which covers the `.md` content type, immutable caching for hashed assets and fonts, security headers and the 404 page. TLS is terminated in front of it (Traefik on Dokploy).

## Contrast (WCAG 2.2, computed)

| Theme | Pair | Ratio | Needs |
|---|---|---|---|
| Light | Body text (`fg` on `bg`) | 16.61 | 4.5 |
| Light | Muted text (`fg-2` on `bg`) | 5.95 | 4.5 |
| Light | Muted on panel (notes, toggle) (`fg-2` on `panel`) | 5.45 | 4.5 |
| Light | Ochre text (source link, note numbers) (`link` on `bg`) | 5.09 | 4.5 |
| Light | Ochre text on panel (`link` on `panel`) | 4.66 | 4.5 |
| Light | Link text on highlighter band (`fg` on `band .38`) | 12.90 | 4.5 |
| Light | Link text on hover band (`fg` on `band .60`) | 11.03 | 4.5 |
| Light | Net nodes, focus ring, progress (UI) (`ochre` on `bg`) | 3.16 | 3 |
| Light | Pressed toggle label (`bg` on `fg`) | 16.61 | 4.5 |
| Dark | Body text (reading) (`fg-read` on `bg`) | 13.09 | 4.5 |
| Dark | Titles (`fg` on `bg`) | 17.31 | 4.5 |
| Dark | Muted text (`fg-2` on `bg`) | 8.27 | 4.5 |
| Dark | Muted on panel (`fg-2` on `panel`) | 7.44 | 4.5 |
| Dark | Ochre text (`link` on `bg`) | 9.75 | 4.5 |
| Dark | Ochre text on panel (`link` on `panel`) | 8.77 | 4.5 |
| Dark | Link text on highlighter band (`fg` on `band .28`) | 10.75 | 4.5 |
| Dark | Link text on hover band (`fg` on `band .45`) | 6.69 | 4.5 |
| Dark | Net nodes, focus ring, progress (UI) (`ochre` on `bg`) | 9.75 | 3 |

Band pairs are the ochre highlight composited over the page background before the ratio is taken.
