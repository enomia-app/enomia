import { getCollection } from 'astro:content';
import { getCityBySlug, getRegionBySlug } from '../data/cities';
import { getCityRentabiliteBySlug } from '../data/cities-rentabilite';

const STATIC_PAGES = new Set<string>([
  '/',
  '/blog',
  '/calcul-taxe-de-sejour',
  '/confidentialite',
  '/conciergerie-airbnb',
  '/contrat-airbnb',
  '/contrat-lcd-dashboard',
  '/contrat-location-gite',
  '/contrat-location-mobil-home',
  '/contrat-location-saisonniere',
  '/facturation-lcd',
  '/facture-airbnb',
  '/facture-booking',
  '/facture-location-saisonniere',
  '/mentions-legales',
  '/simulateur-lcd',
  '/simulateur-rentabilite-airbnb',
  '/estimation-airbnb',
  '/rentabilite-airbnb',
  '/tarif-conciergerie-airbnb',
]);

const VERCEL_REDIRECTS = new Set<string>([
  '/conciergerie-bordeaux',
  '/conciergerie-lyon',
  '/conciergerie-marseille',
  '/conciergerie-nice',
  '/conciergerie-strasbourg',
  '/conciergerie-toulouse',
  '/conciergerie-lille',
]);

let publishedBlogSlugs: Set<string> | null = null;

async function getPublishedBlogSlugs(): Promise<Set<string>> {
  if (publishedBlogSlugs) return publishedBlogSlugs;
  const posts = await getCollection('blog', ({ data }) => data.status === 'en-ligne');
  publishedBlogSlugs = new Set(posts.map((p) => p.slug));
  return publishedBlogSlugs;
}

export async function isPageAvailable(href: string | undefined | null): Promise<boolean> {
  if (!href) return true;
  if (/^(https?:|mailto:|tel:|#|\/\/)/i.test(href)) return true;

  const path = href.split('#')[0].split('?')[0];
  if (/\.(css|js|png|jpg|jpeg|webp|svg|ico|pdf|woff2?)$/i.test(path)) return true;

  if (STATIC_PAGES.has(path)) return true;
  if (VERCEL_REDIRECTS.has(path)) return true;

  const blogMatch = path.match(/^\/blog\/([^/]+)$/);
  if (blogMatch) {
    const slugs = await getPublishedBlogSlugs();
    return slugs.has(blogMatch[1]);
  }

  const regionMatch = path.match(/^\/conciergerie-airbnb\/([^/]+)$/);
  if (regionMatch) {
    return !!getRegionBySlug(regionMatch[1]);
  }

  const cityMatch = path.match(/^\/conciergerie-airbnb\/([^/]+)\/([^/]+)$/);
  if (cityMatch) {
    const region = getRegionBySlug(cityMatch[1]);
    const city = getCityBySlug(cityMatch[2]);
    return !!(region && city && city.regionSlug === cityMatch[1]);
  }

  const rentabiliteCityMatch = path.match(/^\/rentabilite-airbnb\/([^/]+)$/);
  if (rentabiliteCityMatch) {
    const city = getCityRentabiliteBySlug(rentabiliteCityMatch[1]);
    return !!(city && city.status === 'en-ligne');
  }

  return false;
}
