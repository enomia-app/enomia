import { config, collection, fields } from '@keystatic/core';

export default config({
  storage: process.env.NODE_ENV === 'production'
    ? {
        kind: 'github',
        repo: 'enomia-app/enomia',
        branchPrefix: 'keystatic/',
      }
    : {
        kind: 'local',
      },
  collections: {
    blog: collection({
      label: 'Articles du Blog',
      slugField: 'title',
      path: 'src/content/blog/*',
      format: { contentField: 'content' },
      columns: ['title', 'publishedAt', 'category'],
      schema: {
        title: fields.slug({
          name: {
            label: 'Titre de l\'article',
            validation: { isRequired: true },
          },
          slug: {
            label: 'Slug (URL)',
          },
        }),
        metaTitle: fields.text({
          label: 'Titre SEO (max 60 car.)',
          validation: { isRequired: true, length: { max: 60 } },
        }),
        metaDescription: fields.text({
          label: 'Description SEO (max 160 car.)',
          multiline: true,
          validation: { isRequired: true, length: { max: 160 } },
        }),
        excerpt: fields.text({
          label: 'Résumé court (max 160 car.)',
          multiline: true,
          validation: { isRequired: true, length: { max: 160 } },
        }),
        featuredImage: fields.object({
          label: 'Image de couverture',
          fields: {
            src: fields.text({
              label: 'URL de l\'image',
              validation: { isRequired: true },
            }),
            alt: fields.text({
              label: 'Texte alternatif',
              validation: { isRequired: true },
            }),
          },
        }),
        publishedAt: fields.datetime({
          label: 'Date de publication',
          validation: { isRequired: true },
        }),
        updatedAt: fields.datetime({
          label: 'Date de mise à jour',
        }),
        category: fields.select({
          label: 'Catégorie',
          options: [
            { label: 'Chiffres & Stratégie', value: 'chiffres-strategie' },
            { label: 'Automatiser & Gérer', value: 'automatiser-gerer' },
            { label: 'Lancer & Optimiser', value: 'lancer-optimiser' },
            { label: 'Trouver & Acheter', value: 'trouver-acheter' },
          ],
          defaultValue: 'chiffres-strategie',
        }),
        order: fields.integer({
          label: 'Ordre d\'affichage (1 = premier)',
          validation: { isRequired: false },
        }),
        featured: fields.checkbox({
          label: 'Article mis en avant (Top 5)',
          defaultValue: false,
        }),
        formationStep: fields.integer({
          label: 'Étape de la formation (1-10, laisser vide si non applicable)',
          validation: { isRequired: false },
        }),
        youtubeVideoId: fields.text({
          label: 'ID Vidéo YouTube (ex: dQw4w9WgXcQ)',
          description: 'Uniquement l\'ID, pas l\'URL complète',
        }),
        ratingValue: fields.number({
          label: 'Note de l\'article (ex: 4.8)',
          description: 'Entre 1 et 5 — apparaît dans les étoiles Google',
          validation: { isRequired: false },
        }),
        ratingCount: fields.integer({
          label: 'Nombre d\'avis',
          description: 'Utilisé pour le schema.org AggregateRating',
          validation: { isRequired: false },
        }),
        authorName: fields.text({
          label: 'Nom de l\'auteur',
          validation: { isRequired: true },
        }),
        authorBio: fields.text({
          label: 'Bio courte de l\'auteur',
          multiline: true,
        }),
        content: fields.markdoc({
          label: 'Contenu de l\'article',
        }),
      },
    }),
  },
});
