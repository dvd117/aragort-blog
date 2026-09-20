# aragort-blog repository instructions

## Read first

Read `BRIEF.md` and `DESIGN.md` before making non-trivial changes. `BRIEF.md` is
project-local and gitignored; keep it local. `DESIGN.md` is tracked and defines
the established visual language. Do not turn later polish into a redesign.

## Project and architecture

- This is a static Astro 7 site in TypeScript, built to `dist/` and served by
  Caddy. It has no client framework, database, auth layer, analytics, or
  runtime external requests.
- Keep the existing architecture: Astro pages/components, native browser APIs,
  `src/scripts/` for small client controllers, and CSS in `src/styles/`.
  Prefer existing dependencies and browser features over new dependencies.
- Self-hosted fonts and artwork are part of the product. Preserve the net
  geometry, desktop reading rail, margin notes, source view, Spanish labels,
  settings schema/storage keys, and existing article behavior unless the user
  explicitly changes the scope.

## Content and scope

- Published writing lives in `src/content/posts/`. Follow the filename,
  frontmatter, slug, draft, and licensing rules documented in `README.md`.
  Do not rewrite or reformat article prose, artwork, or citations as incidental
  cleanup; preserve existing edits.
- There is no Markdown editor or account system. Do not add redesigns, accounts,
  tracking, comments, editor features, or speculative abstractions without
  separate approval.
- Code is MIT-licensed and the site's writing is CC BY-SA 4.0. Read `LICENSE`
  and `LICENSE-CONTENT.md` before changing licensing or reusing assets; third-
  party photographs, illustrations, and fonts retain their own licenses.

## Deployment and security

- The production image is the two-stage `Dockerfile`: Node 22 builds the
  static site and Caddy serves it on port 80. Dokploy/Hetzner and Deflect sit
  in front of the origin; TLS is terminated upstream.
- Caddy owns content types, caching, security headers, CSP import, and the
  fallback redirect. `scripts/csp.mjs` generates hashes from the built pages.
  Do not hand-edit generated CSP output or weaken headers to make a feature
  work.
- There is currently no tracked Compose file. Do not invent one for a task.
  Never commit secrets, `.env` contents, tokens, or personal data. Keep
  runtime requests self-hosted unless explicitly approved.

## UI and accessibility

- Use semantic HTML and native `<button>`, `<a>`, form, and heading elements.
  Every interactive control must be keyboard reachable with a visible focus
  state and usable at narrow widths and large text. Preserve WCAG AA contrast
  expectations and `prefers-reduced-motion` behavior.
- Name animated properties; never use `transition: all`. Animate only
  `transform` and `opacity`, keep UI motion short, and do not animate layout
  properties. Do not add WebGL or heavy client code.
- For UI work, verify the cheapest tier that answers the question: inspect the
  diff, run text/route checks, then use a real browser only when composition,
  rendering, interaction, zoom, or audio needs it. Unit-test mocks do not prove
  browser rendering or audible speech; report unavailable checks explicitly.

## Validation

Before claiming a change is complete, run the relevant fresh checks and record
exact results:

```sh
npm test
npm run build
git diff --check
```

`npm run check` is valid only when the already-installed `@astrojs/check` is
available; never accept an interactive dependency install silently. For preview
or content checks, use the existing fixture switch (`ARAGORT_POSTS_DIR=tests/fixtures/posts`),
`node scripts/preview.mjs`, and the route/content checks described in `README.md`.
Do not substitute fixture content for a production-content check.

## Change discipline and Git

- Make the smallest change that solves the request. Read files and tests before
  editing, state ambiguous assumptions, and avoid unrelated cleanup or
  dependency upgrades.
- Add a focused regression test for a reproduced bug. Preserve public selectors,
  settings contracts, and content routes unless the request explicitly changes
  them.
- Use conventional commit messages. Stage explicit paths only; never use
  `git add -A`, force-add ignored scaffolding, force-push, or add AI/co-author
  attribution. Check `git status`, the diff, and staged paths before commits.
- Treat `main` as protected during feature work. Reconcile current `main` and
  `origin/main` without discarding changes, then rerun the full validation on
  the integrated result before merging or pushing.
