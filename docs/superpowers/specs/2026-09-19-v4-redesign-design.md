# v4 redesign: feedback round of 2026-09-19

**Status:** approved in conversation, section by section. **Source of truth for visual
rules:** `DESIGN.md`, sections "Decided" and "Motion". This spec says what changes in
the code, in what order, and how each change is verified.

## Goal

Act on David's review of v4: make clickable things obviously clickable, give every colour
a meaning, fix the layouts on phone, desktop and short landscape, make the net one
living element that everyone experiences, and make moving between pages smooth.

## Out of scope

- A new mark or favicon. **The mark stays A** (12 nodes, 21 edges), and so does the
  favicon. Thinned versions (10, 9, 8 nodes) and simplified versions were tried and
  rejected; revisit later if needed.
- New themes, new typefaces, analytics, any runtime request.
- Rewriting post content beyond the Sobre mí text below.

## Work units

Each unit is one commit (conventional commits, no AI attribution), built and verified
before the next. The order reduces risk: content and colour first, the net engine last.

### 1. Content and small fixes

- **Post meta:** `date · N min`. Remove the word count (`[slug].astro`).
- **`p.sig`** links to `/sobre-mi/`.
- **"En este texto"** stays a closed `<details>` on phones (desktop moves to the rail in
  unit 6).
- **Sobre mí text** (`src/pages/sobre-mi.astro`), David's words:
  1. "Hola, soy David Aragort, caraqueño. Desde 2019 trabajo en derechos digitales,
     ayudando a personas y organizaciones de Venezuela y la región a protegerse y
     fortalecer su seguridad en internet. Creo que la autonomía empieza por aprender
     cosas que nadie te pueda quitar."
  2. "Hoy quiero aportar lo que sé y lo que he aprendido haciendo para reconstruir
     Venezuela, y [Ateneo Abierto](https://ateneo-abierto.org) es mi forma de hacerlo."
  3. "Fui [Freedom Fellow](https://youtu.be/oS2N8cz7p4w) de la Human Rights Foundation
     y formo parte del Leadership Council de la
     [Youth Democracy Network](https://youthdemocracynetwork.org/leadershipcouncil)."
     This is its own paragraph, keeping the `.cred` treatment. The Freedom Fellow link is
     David's HRF Ignite Talk.
  4. "Siempre estoy buscando colaborar con gente que, como yo, trabaja por una misión y
     por sus valores. Si te identificas, escríbeme a hola@aragort.com y hablemos."
  Paragraph 2 keeps the comma before "y" on purpose: the clauses have different subjects.

### 2. Colour semantics and external links

- **Links (prose, notes, Sobre mí):** text in the hue, a 1px underline at 45% of the hue,
  solid and 2px on hover. `data-links="all"` keeps working.
- **Bold:** unchanged band; in Alto contraste, weight only (drop the underline).
- **External links:** a new rehype plugin, `src/lib/rehype-external-links.ts`. An
  absolute `http(s)` URL not on `aragort.com` gets `target="_blank"`,
  `rel="noopener noreferrer"`, a visually hidden "(abre en otra pestaña)", and a ↗ glued
  to the last word in a `white-space: nowrap` span so it never wraps alone. Hand-written
  links in `.astro` pages (Sobre mí, contact list) get the same markup via a small
  component. `mailto:` links are not external.
- **Sobre mí:** every node, the thread and links in ochre. No post hues.
- **Brighter link hues in dark:** raise brick and sky toward 6:1 on `#000`. Recompute the
  README table.
- **Light themes:** hue text stays at ≥4.5:1; net lines, dots and bands (3:1 needed) get
  more saturated values.

### 3. Theme: OLED dark by default

- Dark `--bg: #000`, `--fg-read: #cfccc4`; re-derive `--panel` and `--rule` so the
  panels and rules still separate from black (check `--fg-2` on `--panel` ≥ 4.5:1).
- The default theme becomes `dark` in `src/lib/settings.ts`. The
  `prefers-color-scheme: light` rules are removed. "Sistema" stays in Ajustes as an
  explicit choice, and a reader's stored value is respected.
- Update the README (theme resolution, contrast table) and `settings.test.ts`.

### 4. Header

- Height 58px with a 42px mark on desktop, 56px with a 38px mark on a phone.
- **Phone, reading a post:** mark (home) · title and time left · Aa as an icon only,
  with an accessible name "Ajustes de lectura". No nav links while reading. The landing
  and Sobre mí keep the full header.
- Update `scroll-padding-top` and heading `scroll-margin-top` to the new height.

### 5. Layout

- **Short landscape** (`(max-height: 500px) and (orientation: landscape)`): a compact
  two-column composition, with the title and lede on the left and the net contained on
  the right (never wider than its column). The index wire is recomputed so the exit
  node is always above the top of the thread.
- **Landing with fewer than 3 posts:** the latest post is featured: its date, the title
  near display size, the description, its `resumen` bullets as a teaser, and
  "Leer · N min". Below it, a "quién escribe" strip: the mark, one sentence, and a link to
  Sobre mí. Three posts or more renders the list. The threshold is a constant, tested.

### 6. Post: the rail is the index; chapter headings

- **Desktop (≥1000px):** the rail column is about 200px. Chapter `h2`s map to rail nodes
  in reading order; each shows its short title beside the node, the current one is lit,
  and each is a link to its anchor. The `<details>` index is hidden on desktop.
- **Chapter headings:** a Geist Mono number (`01`…) in the hue. On desktop it hangs in
  the margin, aligned with its node; on a phone it sits above the heading with a short
  hue rule. Numbers are generated, not written in the Markdown.

### 7. One net geometry

- `scripts/generate-net.py` generates the **rail from the hero's topology**: the same 40
  nodes and 84 edges, with positions laid out for the 200×780 column (the hero's grid
  rotated, cols ↔ rows, with jitter re-applied from a fixed seed). The mark and hero stay
  byte-identical. The favicon stays as it is.
- A test asserts `rail.edges` equals `hero.edges` and the node counts match.

### 8. The net engine (`src/scripts/netlive.ts`)

One module drives every net on a page (mark, hero, portrait, rail).

- **3D drift:** each node gets a fixed depth z (seeded). A slow rotation of a few degrees
  is projected with a gentle perspective, so near nodes move more. On desktop the cursor
  tilts the net toward it; on a phone, scroll does. There is no gyroscope.
- **Amplitude:** full on the landing and Sobre mí; half on posts, frozen while scrolling
  and resumed about 400ms after. Wires never enter the text halo.
- **Response:** on desktop, the node nearest the cursor lights in ochre with its edges and
  fades over about 600ms. On a phone, a tap sends a pulse two or three hops from the
  tapped node. On the first arrival of a session, one pulse starts from the ochre node.
  The post-hue path on entry hover (`netnav.ts`) keeps working on top.
- **Budget:** one `requestAnimationFrame` loop, capped at 30fps. It stops when no net
  intersects the viewport (IntersectionObserver) or the document is hidden. No library.
- **Reduced motion** (OS or `data-motion="reduce"`): no loop, static nets, no pulses.
  Toggling it in Ajustes takes effect immediately.

### 9. Landing → post morph

- On desktop, the hero net takes the rail's place. On `pageswap` the hero's node
  positions in screen space go to `sessionStorage`. On `pagereveal` the rail starts from
  those positions and interpolates to its own in about 450ms, then hands over to the
  reading progress.
- On a phone, the hero shrinks into the header mark, as now.
- Without View Transitions, or under reduced motion, the rail simply appears.

### 10. Transitions and preloading

- The title and net groups don't stretch: `::view-transition-old/new` use
  `object-fit`-style sizing (`height: 100%; width: auto` or `object-fit: none`), and the
  old and new cross-fade at their natural size while the group moves.
- The root: the old page stays opaque; the new one fades in on top with a 6px rise, in
  200ms. The flying elements take 280–320ms; the net morph (unit 9) is the one exception,
  at about 450ms.
- **Preloading:** a speculation-rules script with `eagerness: "moderate"` (hover,
  pointerdown, focus) to prerender same-origin pages. Other browsers are unaffected.
  The current CSP already allows it (`script-src 'unsafe-inline'`).

## Verification

- **Unit tests (vitest):** the external-links plugin (external vs. internal vs.
  `mailto`, arrow glued to the last word, hidden text); rail/hero topology; the
  featured-landing threshold; settings defaults.
- **Contrast:** recompute every pair in the README for all four themes, and fail the
  unit if any pair drops below its requirement.
- **Browser (Chrome DevTools MCP):** 390×844 phone, 844×390 landscape, 1400×800 desktop,
  in dark and light, with reduced motion on and off. Check that no net crosses a text
  halo; that the header does not overflow at 390px; that the transitions do not stretch
  (slowed to 10× with `playbackRate`); that the 3D loop stops off-screen (check
  `document.getAnimations()` and the rAF count); and that CPU stays reasonable with 4×
  throttling.
- `npm run build`, `npm test` and `npm run check` pass after every unit.

## Risks

- **Speculation rules prerender runs page scripts early.** `resume.ts` and `reading.ts`
  must wait for `document.prerendering` to end before reading scroll positions or
  writing storage.
- **Per-node JS animation on posts** could cost battery on low-end Android. The 30fps
  cap, the scroll freeze and the off-screen stop are the mitigation; measure with 4× CPU
  throttling.
- **The rail's new layout** changes which nodes light in reading order; reading progress
  must still map from 0 to 100%.
