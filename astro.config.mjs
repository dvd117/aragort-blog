// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://aragort.com',
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
