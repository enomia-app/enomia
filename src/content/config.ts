import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    metaTitle: z.string(),
    metaDescription: z.string(),
    excerpt: z.string(),
    featuredImage: z.object({ src: z.string(), alt: z.string() }).optional(),
    publishedAt: z.string(),
    updatedAt: z.string().optional(),
    category: z.enum(['chiffres-strategie','automatiser-gerer','lancer-optimiser','trouver-acheter']),
    order: z.number().optional(),
    featured: z.boolean().default(false),
    formationStep: z.number().optional(),
    youtubeVideoId: z.string().optional(),
    ratingValue: z.number().optional(),
    ratingCount: z.number().optional(),
    authorName: z.string(),
    authorBio: z.string().optional(),
  }),
});

export const collections = { blog };
