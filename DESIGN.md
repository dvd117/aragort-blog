---
version: alpha
name: Reticulárea
description: >
  A personal essay site built on one figure: a frozen net after Gego's Reticulárea, which
  is the mark, the landing's hero, the portrait on Sobre mí and the reading rail. One sans
  family (Geist) set large and tight for display, calm for reading. OLED black when dark,
  bone text, and the flag's three colours -- amarillo, azul, rojo -- muted, one belonging
  to each post and ruling the whole page while it is the one in hand.
webgl: none
colors:
  # Dark (the base CSS; the OS preference picks light or dark)
  night: "#000000"
  night-panel: "#101113"
  bone: "#ece9e1"
  bone-read: "#cfccc4"
  slate: "#9ea3aa"
  night-rule: "#24272c"
  focus: "#e2a638"
  # Light ("Claro")
  paper: "#f7f6f2"
  paper-panel: "#eeece6"
  graphite: "#15171a"
  graphite-2: "#5a5f66"
  paper-rule: "#dcdad3"
  focus-light: "#b8801b"
  amarillo-text-light: "#8b6114"
  # Sepia
  sepia: "#f3ead6"
  sepia-panel: "#e9dec5"
  sepia-ink: "#33291d"
  sepia-ink-2: "#6a5943"
  sepia-rule: "#d6c8a8"
  amarillo-text-sepia: "#805a13"
  # Alto contraste
  black: "#000000"
  black-panel: "#141414"
  white: "#ffffff"
  silver: "#d0d0d0"
  contrast-rule: "#9a9a9a"
  amarillo-contrast: "#ffd166"
  # Post hues: the flag's three, dark values (light/sepia/contrast values in README)
  amarillo: "#e2a638"
  azul: "#6298dd"
  rojo: "#e0705e"
color-aliases:
  c-bg: night
  c-bg-alt: night-panel
  c-fg: bone
  c-fg-2: slate
  c-accent: amarillo
  c-border: night-rule
  c-bg-light: paper
  c-bg-light-alt: paper-panel
  c-fg-light: graphite
  c-fg-light-2: graphite-2
  c-border-light: paper-rule
  c-accent-light: amarillo-text-light
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

- **Theme resolution:** the reader's saved choice first, then the OS preference (light or
  dark), then dark. The base CSS is dark. Dark is OLED black (`#000`), with reading text
  at `#cfccc4` against halation; panels (`#101113`) and rules (`#24272c`) still separate
  from black. "Sistema" is the first option in Ajustes.
- **`--focus`** is the focus ring: the one mark that never changes hue.
  Nothing else is a fixed brand colour any more -- the wordmark node and every other lit
  node take the ruling hue like everything else.
- **The favicon is the flag thread.** Only the mark's three flag nodes -- amarillo, azul,
  rojo, at their place in the net -- on the dark card in every theme, like the OG card,
  because the whole net is mush at 16px. It is built from the frozen geometry
  (`src/lib/favicon.ts`), with a 180px Apple touch icon beside it.
- **The three post hues are the flag's**, in the order they appear on it: amarillo, azul,
  rojo, muted to the page. A quiet reference, not a flag drawn on the screen. Each belongs
  to one post by its place in the list. A hue colours its post's reading rail, footnote
  markers, note edge, links, chapter numbers and the dot beside its date. On the landing,
  the station ring takes that hue when reached; the track fill stays `--fg` in every theme.
- **The big nets are drawn as the flag.** The hero (landing and Sobre mí portrait) takes
  its resting colour in three bands by height -- amarillo over azul over rojo, each node
  and wire in the band its midpoint falls in. The small marks do not: three bands in 48px
  would be mush, so they keep the ruling hue. Anything lit still goes to the ruling hue, so
  the trail reads on top of the bands instead of dissolving into them. The landing track is
  one text-colour line, not a sequence of post hues.
- **One hue rules the chrome at a time.** The hue lives on `<html>`, so the chrome
  shares it -- links, dots, rules, and the small marks (header mark, rail, footer mark). No
  mark keeps a colour of its own. On a post it is the post's. On the landing and Sobre mí
  it is the hue of the last post read on this device, so leaving a post does not lose its
  colour. Three things show all three hues, and all are the flag rather than decoration:
  the big nets' bands, the travelled thread on the landing, where each section belongs
  to its post, and the stations on Sobre mí, which take the band they hang in.
- **The order never shuffles.** Down the list the hues run amarillo -> azul -> rojo ->
  amarillo, by position: the newest post is amarillo, the one under it azul, then rojo, and
  round again. Nothing is hashed and nothing is rolled -- the flag's order is the point, so
  there is nothing to randomise. It is fixed at build time, so it works with JS off.
- **Colour means something.** Colour on the letters means clickable: links are set in the
  hue with a faint hue underline that goes solid and 2px on hover. Colour behind the
  letters means emphasis: bold keeps its hue band, text in `fg`. In Alto contraste bold is
  weight only. External links carry a ↗ joined to their last word (never wrapping alone)
  and a hidden "abre en otra pestaña", and open in a new tab.
- **Text and marks:** hue text stays at 4.5:1; UI marks that only need 3:1 (net, dots,
  rails, rules) use a more saturated `--hue-ui` in the light themes.
- **The net** is drawn in the text colour at low alpha (`--net-alpha`, .26 to .55 by
  context). Lit parts go to the ruling hue.

## Typography

- **Geist** carries everything: display, UI and body. **Geist Mono** is for the source
  view, the version line, footnote numbers and chapter numbers. Italic is never synthesized.
- **Display** is set huge and tight: weight 700, tracking −.055em, leading .92. Page
  titles (Escritos, Sobre mí, the post title, the featured post) use it.
- **Titles** (index entries, chapters) are weight 620, tracking −.035em.
- **Chapter numbers** (`01`…) are generated, not written, in the hue and Geist Mono. On
  desktop they hang in the gap beside the text; on a phone they sit above the heading on a
  short hue rule. Screen readers skip them.
- **Reading** runs at 18px on a phone and 20px on desktop, leading 1.65, 63ch measure.
  The first paragraph is one step larger (the lead).
- Large type over the net gets a halo in the page colour (`text-shadow`) so the wires
  never touch the letters.

## Layout

- One `.wrap`: max 1240px, gutter 16px on a phone and 40px from 900px.
- **Layout by shape, not width.** Short landscape (height ≤ 500px) gets a compact
  two-column composition: title left, net contained right, never bleeding past the list.
- **Header:** 58px with a 42px mark on desktop, 56px with a 38px mark on a phone. Reading a
  post on a phone: mark · title and time left · Sobre mí · Aa. The nav is one short pill
  now, so it stays while reading -- it is the only way to "Sobre mí" from a post.
- **Landing, phone:** the net bleeds off the right edge behind the title; a 1px wire leaves
  its exit node and tapers into the 4px track (6px from 900px) down the left gutter, drawn
  as a transit diagram: every segment horizontal, vertical or 45°, every bend one radius
  (16px; 24px from 900px), and no horizontal run shorter than four radii. Each date hangs from it on a 14px station (18px from 900px): a
  page-colour disc, neutral ring and persistent dot in the post's hue, centered on the date
  line. The static rail and stations remain without JS. The track runs past the last
  visible post and ends at a station on the "quién escribe" rule; its horizontal terminal
  bar sits under that disc and shows on either side of the ring. The bar rests in the
  low-alpha net colour and turns to full `--fg` when reached. The terminal station's centre
  is the site's amarillo, not a post hue.
- **Buscar:** only when there are at least eight published posts, one box sits between the
  hero and the list, hard against its right edge and below the net's reach on every width,
  so it never sits on a node or a wire; on phones its inline-start is inset to clear the
  diagonal connector. With enough posts and JavaScript enabled, the page holds its space
  while the box is inserted. With today's two posts there is no box and no reserved height.
  Filled rather than outlined, so it
  reads as a control and not as one more hairline. It narrows the list as
  you type over what the landing already shows -- title, description, the three ideas and the
  date -- accent- and case-insensitive, so "deje" finds "dejé". Built by
  `src/scripts/filter.ts`, so it is never there without the JS to drive it; Escape clears
  it. No search index is shipped; post bodies are not searched.
- **Landing, desktop (≥900px):** two columns, the title and lede on the left (as wide as
  they need) and the net taking the rest of the width on the right, at fuller strength.
- **Every post is expanded on the landing:** date, near-display title, description and the
  three ideas as a teaser. From 900px each post is two columns under its date, which sits
  just after the station: the title and description on the left (7fr), the three ideas and
  "Leer · N min" on the right (5fr) behind a 1px `--rule`, with 5.5rem between posts.
  "Leer" is a plain post-hue link with a 1px 45% hue underline that becomes full hue and
  2px on hover or focus. It has no spur. Below 900px the two groups are transparent to the
  entry's grid, so the phone list is unchanged. After the posts, a "quién escribe" strip carries the name, one
  sentence and a link to Sobre mí without another mark; the footer keeps its independent
  mark. The track ends on the strip's rule, the thread's last stop, and never runs into the
  footer.
- **Post:** a single column on a phone, with a progress hairline and a closed "En este
  texto". From 1000px, a 150px sticky rail. At rest the chapter numbers sit beside their nodes,
  the current one in the hue with a dot beside its node; hovering or focusing the rail opens
  a dock: each number grows into a pill with its title, the ones near the pointer magnified. From 1100px, footnotes
  move into a 14rem margin column. The Markdown view has "Copiar" beside the file link.
- **Sobre mí:** most readers see it as the panel the header opens (below), but a search
  for David's name lands on the page, so the page is a first impression and opens the way
  the landing does. Its hero is the landing's at every width: title and the first
  paragraph as the lede over the net (bleeding off the right on a phone, beside them from
  900px), and a wire from the net's pinned exit node into the thread, which runs down one
  column below. At rest the fill reaches at least the first station. The panel has a
  column's width, so it stays stacked -- title, net, then the thread, with the first
  paragraph as its first station -- and fills the thread's own line instead of a wire.
  Either way the thread follows the landing's rules: the same track and `--fg` fill, moved
  by the reading line (of the panel, in the drawer) and held at the furthest point
  reached; ring stations with a coloured centre that pulse once and take their ring
  colour when passed; and the terminal bar under the contacts' station. The flag is in
  the stations, not the line: amarillo at the top, rojo at the contacts, azul between.
  The credentials are two quiet lines under their paragraph, a step down in size and
  colour.
- **Nav:** one item. The post's Formato/Markdown toggle with a single segment -- a pill on
  a panel that raises while "Sobre mí" is open or is the page you are on, with no
  transition: it swaps the way the toggle's buttons do, at once. "Escritos" is gone from
  here; the wordmark is already the way home, and on the landing the tab only repeated the
  title under it.
- **"Sobre mí" is a panel, not a departure.** It slides in from the right over what you are
  reading -- a column at 30rem on desktop, the whole screen as a sheet under 600px -- so
  one press of "Volver" puts you back on the same line instead of costing a page load. The
  URL never changes: the panel is a view of this page, not a place. It is a `<dialog>`, so
  Escape, the focus trap and the backdrop are the browser's; Back closes it too. Without JS
  the header's link goes to /sobre-mi/, which is still a real page for direct links,
  sharing and search.
- **Quién escribe:** one block ends the landing and every post: a hairline `--rule` as wide
  as the sentence's measure, a small mono "Quién escribe" label, the name in display type,
  then the sentence and the way through to "Sobre mí". No mark on either page: the header
  and footer carry it. On posts it sits flush with the text column; on the landing it
  lines up with the post titles and carries the thread's terminal station on its rule.
- **Footer:** the mark, "David Aragort" and three icon links, all on one centre line (the
  mark sits in a box the height of an icon link and pinned to the top of the row) —
  GitHub (the source of this site), CC BY-SA (the licence, as the three canonical glyphs)
  and RSS. The icons are
  drawn in the net's hand: hairlines in `currentColor`, hollow rings, 44px tap targets,
  each carrying its words for screen readers and as a tooltip. They take the ruling hue on
  hover. The writing is CC BY-SA 4.0; every served `.md` closes with its licence line.

## Depth

Almost none. Surfaces are flat, separated by 1px rules. The only raised element is the
Ajustes panel (a bottom sheet on phones, a popover on desktop). Depth comes from the net
passing behind type, not from shadows.

## Motion

I use one curve and three durations: `--ease: cubic-bezier(.2, 0, 0, 1)`,
`--dur-ui: 140ms`, `--dur-draw: 220ms`, and `--dur-page: 280ms`. The net is the one
ambient exception (see the rule below). All of it is off under `prefers-reduced-motion`
or Ajustes' "Reducir movimiento".

- **Between pages:** cross-document View Transitions, CSS only. Titles and nets stay on
  their own pages instead of scaling between them. The pages fade through: the old one is
  gone in 120ms, the new one rises 6px in over `--dur-page` from 60ms, so two pages of
  display type never overlap. Only the hue dot travels, from the landing entry to the post.
  The nav's raised tab does not travel between pages -- it swaps like the Formato/Markdown
  toggle. Same-origin pages are prerendered on hover or focus.
- Each page's net stays on its own page.
- **The net is alive:** every net drifts in 3D (each node has a depth; a few degrees of
  turn, near nodes move more). Each node hangs on a spring, so every force moves it with
  inertia: the cursor (or a finger on the net) pulls nearby nodes in like gravity; a
  click or a tap sends a ring outward that springs back; on a phone, scrolling swings the
  net against its motion and it settles. Posts get half amplitude and hold still while
  scrolling. The node under the cursor glows in the ruling hue and fades (~600ms); the
  first page of a session opens with one pulse of light from the net's lit node.
- **Landing:** moving down the page travels the rounded route by arc length. It leaves the
  net as a 1px wire and tapers through the connector into the 4px gutter track (6px from
  900px), which rests in `--net` at `--track-alpha`. Its fill is one `--fg` colour in every
  theme and holds at the furthest point reached; it runs through every visible station and
  stops at the center of the "quién escribe" station, never past it. A horizontal bar,
  twice the station diameter and beneath that disc, is the terminus: it rests with the
  track and turns to full `--fg` when reached. A page too short
  to scroll there counts as reached at its bottom. Passing a station pulses it once and
  turns its ring to the post's hue; its centre dot keeps that hue visible at rest. Reaching
  the terminal pulses the "quién escribe" station once, not a second time, turns its ring
  amarillo and keeps the bar in `--fg`; resize and Buscar remeasure without unlighting what
  was reached.
  The reading line (65% of the viewport, as on a post) moves the fill; it has no separate
  marker. At rest the fill never stops short of the first station, so it never hangs
  halfway between the net and the list. On the first landing of a session it **arrives**:
  350ms in, alongside the net's first-page pulse, it draws from the exit to that station
  over 600ms on `--ease`, and the station passes as usual. Later visits open already
  there; reduced motion skips the draw. On desktop, hovering or focusing an entry
  previews the trail in `--fg` (the look
  ahead is half strength) and lights its region, but only scrolling travels. Passing an
  entry also lights its **region** of the net: its route (the net's lit node → the post's
  node → exit) plus the nodes one wire away from its own node. A wire lights once both of
  its nodes are lit, so separate regions knit together and the net visibly fills as the
  archive grows. **The net only ever gains light.** The footer mark is independent; there is
  no track or pulse on it.
- **Post:** the rail and the header mark light node by node as you read, as a **high-water
  mark** — the light holds at the furthest you have read and never recedes, so jumping
  back with the chapter dock does not unread the text. The chapter dot and the time left
  follow where you actually are. At the end the net completes with one pulse.

## Do's and Don'ts

- **Do** make structure out of the net: threads, nodes, wires. **Don't** add cards, boxes
  or icons the net could replace.
- **Do** keep one family. **Don't** bring in a second display face.
- **Do** give every colour a meaning. **Don't** colour anything for variety.
- **Don't** add a runtime request, a tracker or a third-party embed.
- **Don't** ship a theme that passes contrast in only one mode.

## Fixed in the 2026-09-19 round

1. **Links and bold looked alike:** links are now the hue as text; bold keeps the band
   (`post.css`, Colors above).
2. **Colour without meaning on Sobre mí:** it is one hue plus neutrals (`sobre-mi.astro`).
3. **Small landscape broke the landing:** a short-landscape composition keeps the net in
   its column, above the thread (`index.css`).
4. **The net only came alive on hover:** it drifts and answers everyone (`netlive.ts`).
5. **The landing felt empty with one post:** it features the latest post under three
   (`index.astro`).
6. **The phone header was loaded while reading:** the nav was two items competing with the
   post title; it is one now and fits (`Header.astro`).

## Motion (rule)

Ambient motion is allowed for the net only, for impact. It is bounded:

1. **Reduced motion stops everything:** the OS setting or Ajustes' "Reducir movimiento".
   This is the WCAG 2.2.2 pause mechanism.
2. **One shared loop per page, capped at 30fps.** It stops when the tab is hidden. The
   sticky header mark drifts too, so it runs while the page is visible (measured: 2.6%
   scripting at 4× CPU throttling). No library.
3. **Bounded amplitude:** drift 2.5°, cursor tilt 1°; gravity up to 20px within 160px of
   the pointer; a ring kick of 9px within 280px; nothing strays more than 30px from its
   drifting place. Those figures are for the hero; smaller nets get them in proportion to
   their width (the 42px mark moves under 2px). Wires never enter the text halo.
4. Everything else stays functional: 120–360ms, no loops. The one exception is the
   landing's arrival (600ms, once per session, see Landing above).
