import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: 'https://naklicove.cz',
  integrations: [sitemap()],
  output: 'static',
  vite: {
    resolve: { alias: { '@nk/shared': new URL('../../packages/shared/src', import.meta.url).pathname } }
  }
})
