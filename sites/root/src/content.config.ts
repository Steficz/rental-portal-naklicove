import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'zod'

const uvod = defineCollection({
  loader: glob({ pattern: 'uvod.md', base: '../../content/landing' }),
  schema: z.object({ title: z.string(), perex: z.string() })
})

const sluzby = defineCollection({
  loader: glob({ pattern: '*.md', base: '../../content/landing/sluzby' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    href: z.string(),
    accent: z.string(),
    label: z.string()
  })
})

export const collections = { uvod, sluzby }
