import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://jrbayguade.github.io',
  base: '/ai-weekly',
  trailingSlash: 'always',
  build: { format: 'directory' },
});
