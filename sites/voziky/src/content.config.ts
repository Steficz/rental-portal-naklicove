import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'zod'

const legal = defineCollection({
  loader: glob({ pattern: '*.md', base: '../../content/legal/voziky' }),
  schema: z.object({ title: z.string().optional(), operator: z.string().optional() })
})

const spolecne = defineCollection({
  loader: glob({ pattern: '*.md', base: '../../content/legal/spolecne' }),
  schema: z.object({ title: z.string().optional(), operator: z.string().optional() })
})

export const collections = { legal, spolecne }
