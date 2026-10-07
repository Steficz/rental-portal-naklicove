import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { z } from 'zod'

const domov = defineCollection({
  loader: glob({ pattern: 'domov.md', base: '../../content/3dtisk' }),
  schema: z.object({ title: z.string(), intro: z.string() })
})

const cenik = defineCollection({
  loader: glob({ pattern: 'cenik.md', base: '../../content/3dtisk' }),
  schema: z.object({
    title: z.string(),
    materials: z.array(z.object({
      id: z.string(), name: z.string(), g_cm3: z.number(), price_per_g: z.number()
    })),
    fix: z.number(),
    fix_free_over_g: z.number(),
    min_order: z.number(),
    overhead_h: z.number(),
    layer_speeds: z.record(z.string(), z.number())
  })
})

const legal = defineCollection({
  loader: glob({ pattern: '*.md', base: '../../content/legal/3dtisk' }),
  schema: z.object({ title: z.string().optional(), operator: z.string().optional() })
})

const spolecne = defineCollection({
  loader: glob({ pattern: '*.md', base: '../../content/legal/spolecne' }),
  schema: z.object({ title: z.string().optional(), operator: z.string().optional() })
})

export const collections = { domov, cenik, legal, spolecne }
