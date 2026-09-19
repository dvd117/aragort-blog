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

### Versions

At build time each post shows `v<n> · editado <date>` when its file has more than one commit and the last commit is later than the filename date. The count comes from `git log --follow`, so renames keep their history.

**Shallow-clone caveat.** Dokploy (like most CI) may build from a shallow clone. In a shallow clone, or with no git at all, the history is incomplete. The site then shows **no version line at all**, never a wrong number. To get versions in production, build from a full clone: set the clone depth to full in Dokploy, or run `git fetch --unshallow` before `npm run build`. The Docker build keeps `.git` in its context for this reason (see `.dockerignore`).

## Development

```sh
npm ci
npm run dev       # http://localhost:4321, drafts visible
npm run build     # static site in dist/
npm test          # vitest
```

Requires Node 22.12 or later. Markdown uses Astro's `unified()` processor (remark/rehype) rather than the default Sätteri pipeline, because the margin-note plugin is a standard rehype plugin.

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
| Dark | Body text (reading) (`fg-read` on `bg`) | 13.31 | 4.5 |
| Dark | Titles (`fg` on `bg`) | 15.93 | 4.5 |
| Dark | Muted text (`fg-2` on `bg`) | 7.61 | 4.5 |
| Dark | Muted on panel (`fg-2` on `panel`) | 7.02 | 4.5 |
| Dark | Ochre text (`link` on `bg`) | 8.97 | 4.5 |
| Dark | Ochre text on panel (`link` on `panel`) | 8.26 | 4.5 |
| Dark | Link text on highlighter band (`fg` on `band .28`) | 9.22 | 4.5 |
| Dark | Link text on hover band (`fg` on `band .45`) | 6.03 | 4.5 |
| Dark | Net nodes, focus ring, progress (UI) (`ochre` on `bg`) | 8.97 | 3 |

Band pairs are the ochre highlight composited over the page background before the ratio is taken.
