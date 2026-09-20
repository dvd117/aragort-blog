# Reporting a security problem

Write to **hola@aragort.com**. Say what you found, how to reproduce it, and what
you think it lets someone do. You will get an answer within a week; if you do
not, assume the mail went astray and send it again.

Please do not open a public issue for anything that could be used before it is
fixed. Issues are disabled on this repository, so if you would rather not use
mail, GitHub's private vulnerability reporting is enabled and goes to the same
person.

This is a personal site, maintained by one person. There is no bounty and no
formal SLA. What there is: a real report gets read and acted on, and you will be
credited if you want to be.

## What is in scope

This repository and what it serves at `aragort.com`. The site is static, so the
surface is smaller than it looks:

- **The response headers.** `Caddyfile` sets them, and the Content-Security-Policy
  is generated at build time by `scripts/csp.mjs`, which walks `dist/` and writes
  a hash per inline script. A way to make that generator emit a policy that does
  not cover a script it shipped is in scope.
- **The build.** Anything that turns a Markdown post into HTML: the rehype
  plugins, and in particular the one that puts `rel="noopener noreferrer"` on
  external links. The OG cards are rendered at build time by satori and resvg
  from fonts in this repo.
- **The raw post sources** served as `text/markdown` at `/escritos/<slug>.md`.
- **The container.** `Dockerfile` and the Caddy configuration it bakes in.

## What is not

- The CDN and the host. TLS is terminated in front of this container, and the
  edge appends headers of its own. Report those to their operators.
- Build-time-only dependency advisories. Nothing in the build pipeline is
  reachable by a visitor: the OG cards are rendered once, at build, from local
  fonts. If you can show a path from a visitor's request to one of those
  packages, that is in scope and I would like to see it.
- Anything that needs a stolen credential, physical access, or a compromised
  maintainer machine to begin with.
- Reports from an automated scanner with nothing behind them: missing headers
  flagged on a page with no session and no login, TLS ciphers the CDN chose, a
  version number in a banner. If you think one of these is actually exploitable
  here, show the exploit and it is in scope.

## What the site knows about a visitor

So you know what is worth protecting: nothing. There are no accounts, no
sessions, no cookies set by this site, no analytics, no forms and no endpoint
that takes input. The page makes no external request at runtime; the fonts are
self-hosted and the Content-Security-Policy pins every subresource to `'self'`.

The read-aloud control uses the browser's own speech synthesis. It sends no
audio anywhere.
