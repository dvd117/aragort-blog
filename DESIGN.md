---
version: alpha
name: Reticulárea
description: >
  A personal essay site built on one figure: a frozen net after Gego's Reticulárea, which
  is the mark, the landing's hero, the portrait on Sobre mí and the reading rail. One sans
  family (Geist) set large and tight for display, calm for reading. Near-black by default,
  bone text, ochre as the one brand accent, and five muted hues that each belong to a post.
webgl: none
colors:
  # Dark (the default theme)
  night: "#0c0e11"
  night-panel: "#15181c"
  bone: "#ece9e1"
  bone-read: "#d9d6ce"
  slate: "#9ea3aa"
  night-rule: "#23272d"
  ochre: "#e2a638"
  # Light ("Claro")
  paper: "#f7f6f2"
  paper-panel: "#eeece6"
  graphite: "#15171a"
  graphite-2: "#5a5f66"
  paper-rule: "#dcdad3"
  ochre-ui-light: "#b8801b"
  ochre-text-light: "#8b6114"
  # Sepia
  sepia: "#f3ead6"
  sepia-panel: "#e9dec5"
  sepia-ink: "#33291d"
  sepia-ink-2: "#6a5943"
  sepia-rule: "#d6c8a8"
  ochre-text-sepia: "#805a13"
  # Alto contraste
  black: "#000000"
  black-panel: "#141414"
  white: "#ffffff"
  silver: "#d0d0d0"
  contrast-rule: "#9a9a9a"
  ochre-contrast: "#ffd166"
  # Post hues, dark values (light/sepia/contrast values in README)
  teal: "#43a3a0"
  brick: "#c36855"
  sky: "#4587ba"
  moss: "#759a4c"
color-aliases:
  c-bg: night
  c-bg-alt: night-panel
  c-fg: bone
  c-fg-2: slate
  c-accent: ochre
  c-border: night-rule
  c-bg-light: paper
  c-bg-light-alt: paper-panel
  c-fg-light: graphite
  c-fg-light-2: graphite-2
  c-border-light: paper-rule
  c-accent-light: ochre-text-light
  c-bg-sepia: sepia
  c-fg-sepia: sepia-ink
  c-fg-sepia-2: sepia-ink-2
  c-border-sepia: sepia-rule
  c-bg-contrast: black
  c-fg-contrast: white
  c-fg-contrast-2: silver
  c-border-contrast: contrast-rule
surfaces:
  primary:
    bg: c-bg
    fg: c-fg
    muted: c-fg-2
    border: c-border
  alt:
    bg: c-bg-light
    fg: c-fg-light
    muted: c-fg-light-2
    border: c-border-light
  sepia:
    bg: c-bg-sepia
    fg: c-fg-sepia
    muted: c-fg-sepia-2
    border: c-border-sepia
  contrast:
    bg: c-bg-contrast
    fg: c-fg-contrast
    muted: c-fg-contrast-2
    border: c-border-contrast
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: 9
    fluidMin: 3.6
    fontWeight: 700
    lineHeight: 0.92
    letterSpacing: "-0.055em"
  h1:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: 6.5
    fluidMin: 2.6
    fontWeight: 700
    lineHeight: 0.92
    letterSpacing: "-0.055em"
  h2:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: 2.9
    fluidMin: 1.6
    fontWeight: 620
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  h3:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: 1.81
    fluidMin: 1.63
    fontWeight: 620
    lineHeight: 1.12
    letterSpacing: "-0.035em"
  lead:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: 1.3125
    fluidMin: 1.125
    fontWeight: 400
    lineHeight: 1.5
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: 1.25
    fluidMin: 1.125
    fontWeight: 400
    lineHeight: 1.65
  small:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: 0.875
    fontWeight: 400
    lineHeight: 1.4
  mono:
    fontFamily: "Geist Mono, ui-monospace, Menlo, monospace"
    fontSize: 0.875
    fontWeight: 500
    lineHeight: 1.4
spacing:
  page: 1
  page-wide: 2.5
  section: 3
  stack: 1.35
  inline: 0.9
radius:
  none: 0
  sm: 2
  md: 8
  pill: 999
motion:
  bounce: 0
  ease-out: "cubic-bezier(0.2, 0, 0, 1)"
  duration-ui: "140ms"
  duration-draw: "220ms"
  duration-page: "280ms"
  duration-net: "320ms"
  stagger: "30ms"
---

## Overview

This is David Aragort's site: essays in Spanish about the country Venezuela can be, and
what he learned doing the work. The site should read as one person's considered writing,
not a publication and not a product.

Everything visual comes from one figure: **the net**, after Gego's *Reticulárea*. Its
geometry is frozen (`src/assets/net/geometry.ts`, generated once by
`scripts/generate-net.py`), so the mark is identical on every build. The same net is the
header mark, the landing hero, the Sobre mí portrait and the reading rail. Structure is
drawn as the net: the list of posts hangs on a thread from it, the About story is a thread
of nodes, and reading lights it node by node.

It refuses to be: a dashboard, a card grid, a newsletter template, or a site with
decoration that means nothing.

## Audience conditions

- **Who and where:** Spanish-speaking readers, many in Venezuela, mostly on phones. Some
  are on patchy mobile data and mid-range Android.
- **Weight:** static Astro, no client framework. Fonts are self-hosted: Geist and Geist
  Mono, Latin subset, about 52 KB with the italic. Newsreader and Atkinson Hyperlegible
  are downloaded only when a reader picks them in Ajustes.
- **Privacy:** no analytics and no external requests at runtime. The CSP in the
  `Caddyfile` enforces this. The "Sigue donde quedaste" position is stored on the device
  only and forgotten after 30 days.
- **Access:** reading settings (size, leading, tracking, measure, typeface, theme,
  underline all links, reduce motion, read aloud) are part of the product, not extras.
  Every theme passes WCAG 2.2 AA; Alto contraste passes AAA for body text.
- **WebGL:** `none`. The net is SVG and CSS, which is enough for every effect it needs.

## Colors

- **Theme resolution:** the reader's saved choice first, then the OS preference, then
  dark. The base CSS is dark.
- **Ochre** is the brand: the wordmark node, the focus ring, global UI marks.
- **The five post hues** (ochre, teal, brick, sky, moss) each belong to one post, set in
  frontmatter or hashed from the slug. A hue colours its post's rail, progress line,
  footnote markers, note edge, link underline and hover band, and the dot beside its date.
- **The net** is drawn in the text colour at low alpha (`--net-alpha`, .26 to .55 by
  context). Lit parts go to ochre or the post's hue.

## Typography

- **Geist** carries everything: display, UI and body. **Geist Mono** is for the source
  view, the version line and footnote numbers. Italic is never synthesized.
- **Display** is set huge and tight: weight 700, tracking −.055em, leading .92. Page
  titles (Escritos, Sobre mí, the post title) use it.
- **Titles** (index entries, chapters) are weight 620, tracking −.035em.
- **Reading** runs at 18px on a phone and 20px on desktop, leading 1.65, 63ch measure.
  The first paragraph is one step larger (the lead).
- Large type over the net gets a halo in the page colour (`text-shadow`) so the wires
  never touch the letters.

## Layout

- One `.wrap`: max 1240px, gutter 16px on a phone and 40px from 900px.
- **Landing, phone:** the net bleeds off the right edge behind the title; a wire leaves
  its exit node and becomes the thread down the left gutter; each entry hangs on the
  thread by its hue node.
- **Landing, desktop (≥900px):** two columns, the title and lede on the left and the net
  on the right at fuller strength.
- **Post:** a single column on a phone, with a 3px progress hairline. From 1000px, a
  150px sticky rail on the left. From 1100px, footnotes move into a 14rem margin column.
- **Sobre mí:** a portrait net over a thread of paragraphs. From 900px, the portrait is
  sticky on the left and the thread runs on the right.

## Depth

Almost none. Surfaces are flat, separated by 1px rules. The only raised element is the
Ajustes panel (a bottom sheet on phones, a popover on desktop). Depth comes from the net
passing behind type, not from shadows.

## Motion

Functional only, 120 to 360ms, never looping, and off under `prefers-reduced-motion` or
Ajustes' "Reducir movimiento".

- **Between pages:** cross-document View Transitions, CSS only. An index title becomes the
  post title; the hero net shrinks into the header mark; Escritos and Sobre mí morph into
  each other; the old page fades out (160ms) and the new one rises 12px (260ms).
- **Landing:** hovering or focusing an entry lights its path through the net, the wire and
  the thread in the entry's hue. On a phone, the entry at mid-screen does.
- **Post:** the rail and the header mark light node by node as you read. At the end the
  net completes with one pulse.

## Do's and Don'ts

- **Do** make structure out of the net: threads, nodes, wires. **Don't** add cards, boxes
  or icons the net could replace.
- **Do** keep one family. **Don't** bring in a second display face.
- **Do** give every colour a meaning. **Don't** colour anything for variety.
- **Don't** add a runtime request, a tracker or a third-party embed.
- **Don't** ship a theme that passes contrast in only one mode.

## Known failures (extract, 2026-09-19)

Found in review and in the browser. These are bugs in the shipped design, not style notes.

1. **Links and bold look alike.** In a post, a link is a hue underline with a hue band on
   hover, and `strong` is a permanent hue band (`post.css:25`, `:151`). Both use the post
   hue, so the reader cannot tell what is clickable.
2. **Colour without meaning on Sobre mí.** Its four paragraphs use teal, sky, moss and
   ochre. Those hues belong to posts; here they are decoration, and it reads as busy.
3. **Small landscape breaks the landing.** The phone composition applies below 900px
   wide, whatever the height. At 844×390 the net, sized in `vw`, becomes about 810px
   wide, spills past the list and the footer, and the wire runs diagonally up-left across
   the entry's date, because the exit node sits below the top of the thread.
4. **The net only comes alive for readers who hover a post,** and its colours depend on
   how many posts exist. A first visitor who does not hover sees a static figure.
5. **The landing feels empty with one post.** The layout is built for a list.
6. **The phone header is loaded while reading:** mark, title, time left, Escritos and Aa
   in 390px.

## Decided (2026-09-19, not yet built)

- **Links are the hue.** Link text is set in the post's hue with a faint hue underline
  that goes solid and 2px on hover. External links carry a ↗ joined to their last word
  (never wrapping alone) and a hidden "abre en otra pestaña"; they open in a new tab.
- **Bold keeps its highlighter band** in the hue, text in `fg`. Colour on the letters
  means clickable; colour behind them means emphasis. In Alto contraste, bold drops its
  underline and is weight only.
- **Sobre mí** is ochre plus neutrals: no post hues.
- **Dark is OLED:** `--bg: #000`. Reading text drops to `#cfccc4` against halation;
  panels and rules are re-derived so they still separate from pure black.
- **Dark for everyone by default.** The OS preference is no longer read; any other theme
  (including "Sistema") is a manual choice in Ajustes.
- **Light themes:** hue text stays at 4.5:1, but UI marks that only need 3:1 (net, dots,
  bands) get more saturation.
- **One net.** The rail is regenerated with the hero's exact topology (40 nodes, 84
  edges) laid out as a column. Landing → post on desktop: the hero flies to the rail slot
  and its nodes glide into the column (~450ms, JS on arrival; without View Transitions the
  rail draws in). Phone: the hero shrinks into the header mark, as now. The mark keeps
  its own 12-node geometry.
- **The net responds to everyone:** the nearest node lights in ochre under the cursor
  and trails off (~600ms); on a phone a tap sends a 2–3 hop pulse; one pulse on the first
  arrival of a session. The post-hue path on entry hover stays.
- **The net drifts in 3D, everywhere, including the header mark.** Each node has a depth.
  The net turns a few degrees at most, and near nodes move more than far ones. The cursor
  tilts it on desktop; scroll tilts it on a phone (no gyroscope: it needs a permission
  prompt). Posts get half amplitude and freeze while scrolling; the landing and Sobre mí
  get full amplitude.
- **Layout by shape, not width.** Short landscape (height ≤ 500px) gets a compact
  desktop composition: title left, net contained right, never bleeding. Tall phones
  keep the current composition.
- **Landing under 3 posts: a featured post** (date, near-display title, description,
  its En corto as a teaser, "Leer · N min") and a "quién escribe" strip (mark, one line,
  link to Sobre mí). From 3 posts the list returns, decided at build time.
- **Phone reading header:** mark (home) · title and time left · Aa as an icon. No nav
  links while reading. Landing and Sobre mí keep the full header.
- **The rail is the index (desktop):** chapter nodes on the rail with short labels,
  current one lit, clickable; the column grows to ~200px. "En este texto" is phone-only,
  closed by default.
- **Chapter headings:** a mono number in the hue (`01`…). Desktop: hanging in the margin,
  aligned with its rail node. Phone: above the heading, with a short hue rule.
- **Post meta:** date · N min (no word count). `p.sig` links to Sobre mí.
- **Header:** 58px with a 42px mark on desktop, 56px with a 38px mark on a phone. The
  mark stays the full 12-node A, and so does the favicon (thinned versions rejected).
- **Transitions:** titles and the net move without stretching (cross-fade at natural
  size); the old page stays opaque under the new one (6px rise, 200ms); same-origin
  pages are prerendered on hover or focus.

Implementation order and verification: `docs/superpowers/specs/2026-09-19-v4-redesign-design.md`.

## Motion (rule, replaces "never looping")

Ambient motion is allowed for the net only, for impact. It is bounded:

1. **Reduced motion stops everything:** the OS setting or Ajustes' "Reducir movimiento".
   This is the WCAG 2.2.2 pause mechanism.
2. **One shared loop per page, capped at 30fps.** It stops when no net is on screen or
   the tab is hidden. No library.
3. **Small amplitude:** a few px and degrees. Wires never enter the text halo.
4. Everything else stays functional: 120–360ms, no loops.
