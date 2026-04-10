import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    metaTitle: z.string(),
    metaDescription: z.string(),
    excerpt: z.string(),
    featuredImage: z.object({ src: z.string(), alt: z.string() }).optional(),
    publishedAt: z.union([z.string(), z.date()]).transform(v => v instanceof Date ? v.toISOString() : v),
    updatedAt: z.union([z.string(), z.date()]).transform(v => v instanceof Date ? v.toISOString() : v).optional(),
    category: z.enum(['chiffres-rentabilite','outils-automatisation','fiscal-juridique','gestion']),
    order: z.number().optional(),
    featured: z.boolean().default(false),
    formationStep: z.number().optional(),
    youtubeVideoId: z.string().optional(),
    ratingValue: z.number().optional(),
    ratingCount: z.number().optional(),
    authorName: z.string(),
    authorBio: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
