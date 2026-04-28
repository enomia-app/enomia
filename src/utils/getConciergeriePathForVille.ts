/**
 * Pour un slug de ville (typiquement issu de cities-rentabilite.ts),
 * retourne l'URL de la page conciergerie correspondante.
 *
 * Si la ville a une page dédiée dans cities.ts (conciergerie BDD) → URL ville :
 *   `/conciergerie-airbnb/[regionSlug]/[citySlug]`
 *
 * Sinon → fallback vers la page outil générique tarif :
 *   `/tarif-conciergerie-airbnb`
 *
 * Usage dans le template /rentabilite-airbnb/[ville].astro :
 *   const conciergeriePath = getConciergeriePathForVille(city.slug);
 *   <a href={conciergeriePath}>Conciergeries Airbnb à {city.name}</a>
 *
 * Note : les slugs `cities-rentabilite` et `cities` doivent matcher pour qu'une
 * ville bénéficie du link direct (case-sensitive). Si tu ajoutes une ville
 * conciergerie pour une ville qui existe déjà dans cities-rentabilite, ce helper
 * la trouvera automatiquement à la prochaine build.
 */

import { getCityBySlug } from '../data/cities';

/** Renvoie aussi le label du lien adapté ('Conciergeries à X' vs 'Tarifs conciergerie'). */
export interface ConciergerieLink {
  href: string;
  label: string;
  isLocal: boolean;
}

export function getConciergeriePathForVille(slug: string): string {
  const city = getCityBySlug(slug);
  if (city) {
    return `/conciergerie-airbnb/${city.regionSlug}/${city.slug}`;
  }
  return '/tarif-conciergerie-airbnb';
}

export function getConciergerieLinkForVille(slug: string, cityName: string): ConciergerieLink {
  const city = getCityBySlug(slug);
  if (city) {
    return {
      href: `/conciergerie-airbnb/${city.regionSlug}/${city.slug}`,
      label: `Conciergeries Airbnb à ${cityName}`,
      isLocal: true,
    };
  }
  return {
    href: '/tarif-conciergerie-airbnb',
    label: 'Tarifs des conciergeries Airbnb',
    isLocal: false,
  };
}
