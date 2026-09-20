# syntax=docker/dockerfile:1

# Build: Node renders the static site. git is here so post versions can be read
# from history; on a shallow clone the site builds anyway and shows no versions.
FROM node:25-slim AS build
RUN apt-get update \
 && apt-get install -y --no-install-recommends git ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# Test posts can never reach an image: tests/fixtures is outside the build context
# (.dockerignore) and the fixtures switch is cleared here.
RUN git config --global --add safe.directory /app \
 && env -u ARAGORT_POSTS_DIR npm run build \
 && node scripts/csp.mjs dist csp.caddy

# Serve: Caddy, static files only. TLS is terminated in front (Traefik on Dokploy).
FROM caddy:2-alpine
COPY Caddyfile /etc/caddy/Caddyfile
# The CSP is generated from the built pages (a hash per inline script), so it
# lives beside the Caddyfile rather than inside it.
COPY --from=build /app/csp.caddy /etc/caddy/csp.caddy
COPY --from=build /app/dist /srv
EXPOSE 80
