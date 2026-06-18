// Données auteur Enomia — SOURCE UNIQUE de vérité pour la bio et le Schema Person.
// Importé par le template blog ([slug].astro), AuthorSchema.astro, AuthorBubble.astro
// et la page auteur.
//
// ⚠️ RÈGLE : les bios sont FIGÉES mot pour mot (cohérence d'entité pour les IA et le
// Knowledge Graph : la même phrase partout consolide la fiche « Marc Chenut »).
// Ne pas paraphraser localement — modifier ICI, ça se propage partout.
// Au lancement du logiciel Enomia : ajouter « Il est le fondateur d'Enomia, le logiciel
// de gestion conçu pour les loueurs en courte durée. » et mettre à jour jobTitle.
//
// LinkedIn volontairement absent du sameAs : Marc Chenut apparaît comme directeur
// commercial Neocamino sur LinkedIn, ce qui fait pencher le Knowledge Graph vers
// Neocamino. À ajouter quand le profil LinkedIn aura été mis à jour.

const CLOUDINARY = 'https://res.cloudinary.com/dv2btcpc2/image/upload';
const PHOTO_ID = 'v1775507331/Marc_1_a6ndja.png';
const PERSON_ID = 'https://www.enomia.app/auteur/marc-chenut#person';

/** URL de la photo de Marc, largeur au choix (Cloudinary). */
export const authorPhoto = (w = 400) => `${CLOUDINARY}/q_auto,f_auto,w_${w}/${PHOTO_ID}`;

/** Micro-bio — bulle des pages outils. FIGÉE 2026-06-11. */
export const AUTHOR_BIO_MICRO =
  "Marc Chenut, investisseur en location courte durée depuis 2019 et auteur de La Méthode 97 %. Une expertise pointue de la location saisonnière : autour de 15 % de rendement net, applicable presque partout en France.";

/** Bio longue — encart auteur des articles + page auteur. FIGÉE 2026-06-11. */
export const AUTHOR_BIO_ARTICLE =
  "Marc Chenut est investisseur en location courte durée depuis 2019. Son expertise pointue de la location saisonnière lui permet d'atteindre autour de 15 % de rendement net : 4 logements, près de 7 000 € nets par mois, sans conciergerie et sans avoir quitté son emploi. Il détaille sa méthode, applicable presque partout en France et actionnable dès la lecture, dans La Méthode 97 %.";

export const marcChenut = {
  '@type': 'Person',
  '@id': PERSON_ID,
  name: 'Marc Chenut',
  image: authorPhoto(400),
  description: AUTHOR_BIO_ARTICLE,
  jobTitle: 'Investisseur en location courte durée',
  url: 'https://www.enomia.app/auteur/marc-chenut',
  knowsAbout: [
    'location courte durée',
    'location saisonnière',
    'rentabilité Airbnb',
    'fiscalité LMNP',
    'réglementation des meublés de tourisme',
    'gestion locative courte durée',
    'tarification dynamique',
    'réservation directe',
  ],
} as const;

/** Le livre — relié à la Person pour le Knowledge Graph. ISBN à ajouter à la parution KDP. */
export const livreMethode97 = {
  '@type': 'Book',
  '@id': 'https://www.enomia.app/livre#book',
  name: 'La Méthode 97 %',
  description:
    '4 logements loués à la nuit. 7 000 € nets par mois. 4 heures de gestion. Sans conciergerie, sans quitter mon emploi.',
  inLanguage: 'fr',
  author: { '@id': PERSON_ID },
  publisher: { '@type': 'Organization', name: 'Enomia Éditions' },
} as const;
