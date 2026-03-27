import { config } from '@keystatic/core';

export default config({
  storage: {
    kind: 'github',
    repo: 'enomia-app/enomia',
  },
  collections: {
    blog: {
      label: 'Articles du Blog',
      slugField: 'slug',
      path: 'keystatic/blog/*/',
      format: { data: 'json' },
      columns: ['title', 'slug', 'publishedAt', 'category'],
      schema: {
        title: {
          label: 'Titre de l\'article',
          type: 'string',
          validation: { isRequired: true },
        },
        slug: {
          label: 'Slug (URL de l\'article)',
          type: 'string',
          validation: { isRequired: true },
        },
        metaTitle: {
          label: 'Titre SEO (meta title)',
          type: 'string',
          validation: { isRequired: true, length: { max: 60 } },
        },
        metaDescription: {
          label: 'Description SEO (meta description)',
          type: 'string',
          validation: { isRequired: true, length: { max: 160 } },
        },
        excerpt: {
          label: 'Résumé court (160 caractères)',
          type: 'string',
          validation: { isRequired: true, length: { max: 160 } },
        },
        featuredImage: {
          label: 'Image de couverture',
          type: 'object',
          fields: {
            src: {
              label: 'URL de l\'image',
              type: 'string',
              validation: { isRequired: true },
            },
            alt: {
              label: 'Texte alternatif (alt text)',
              type: 'string',
              validation: { isRequired: true },
            },
          },
          validation: { isRequired: true },
        },
        publishedAt: {
          label: 'Date de publication',
          type: 'datetime',
          validation: { isRequired: true },
        },
        updatedAt: {
          label: 'Date de mise à jour',
          type: 'datetime',
        },
        category: {
          label: 'Catégorie (Pilier éditorial)',
          type: 'select',
          options: [
            { label: 'Chiffres & Stratégie', value: 'chiffres-strategie' },
            { label: 'Automatiser & Gérer', value: 'automatiser-gerer' },
            { label: 'Lancer & Optimiser', value: 'lancer-optimiser' },
            { label: 'Trouver & Acheter', value: 'trouver-acheter' },
          ],
          validation: { isRequired: true },
        },
        youtubeVideoId: {
          label: 'Vidéo YouTube (URL complète)',
          type: 'string',
          description: 'Ex: https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        },
        content: {
          label: 'Contenu (avec H1, H2, H3)',
          type: 'rich-text',
          validation: { isRequired: true },
        },
        authorName: {
          label: 'Nom de l\'auteur',
          type: 'string',
          validation: { isRequired: true },
        },
        authorBio: {
          label: 'Bio courte de l\'auteur',
          type: 'string',
        },
      },
    },
  },
});
