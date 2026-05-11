/**
 * Pour un slug de ville (typiquement issu de cities.ts conciergerie),
 * retourne l'URL de la page rentabilité correspondante SI elle existe et est en ligne.
 *
 * Si la ville a une page dédiée en-ligne dans cities-rentabilite.ts → URL :
 *   `/rentabilite-airbnb/[slug]`
 *
 * Sinon → null (le template n'affiche pas le cross-link).
 *
 * Usage dans le template /conciergerie-airbnb/[region]/[ville].astro :
 *   const rentabilitePath = getRentabilitePathForVille(c.slug);
 *   {rentabilitePath && (
 *     <a href={rentabilitePath}>Rentabilité Airbnb à {c.name}</a>
 *   )}
 */

import { citiesRentabilite } from '../data/cities-rentabilite';

export interface RentabiliteLink {
  href: string;
  label: string;
}

export function getRentabilitePathForVille(slug: string): string | null {
  const city = citiesRentabilite.find((c) => c.slug === slug && c.status === 'en-ligne');
  if (!city) return null;
  return `/rentabilite-airbnb/${city.slug}`;
}

export function getRentabiliteLinkForVille(slug: string, cityName: string): RentabiliteLink | null {
  const href = getRentabilitePathForVille(slug);
  if (!href) return null;
  return {
    href,
    label: `Rentabilité Airbnb à ${cityName}`,
  };
}
