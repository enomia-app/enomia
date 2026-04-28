// Données auteur Enomia — source unique de vérité pour le Schema Person.
// Importé par le template blog ([slug].astro) et le composant AuthorSchema.astro.
//
// LinkedIn volontairement absent du sameAs : Marc Chenut apparaît comme directeur
// commercial Neocamino sur LinkedIn, ce qui fait pencher le Knowledge Graph vers
// Neocamino. À ajouter quand le profil LinkedIn aura été mis à jour.
export const marcChenut = {
  '@type': 'Person',
  '@id': 'https://www.enomia.app/auteur/marc-chenut#person',
  name: 'Marc Chenut',
  image:
    'https://res.cloudinary.com/dv2btcpc2/image/upload/q_auto,f_auto,w_400/v1775507331/Marc_1_a6ndja.png',
  description:
    "J'exploite 9 biens en location courte durée avec un rendement net de 12 à 18% sur chacun des investissements. La clé : un taux d'occupation supérieur à 93% et une gestion de moins d'une heure par bien et par mois, sans conciergerie. Je partage ma méthode en détail, gratuitement, sur le blog et sur YouTube.",
  jobTitle: 'Investisseur Location Courte Durée, fondateur Enomia',
  url: 'https://www.enomia.app/auteur/marc-chenut',
} as const;
