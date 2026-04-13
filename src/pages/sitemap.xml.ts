export const prerender = true;

import { getCollection } from 'astro:content';
import { cities, regions } from '../data/cities';

const SITE = 'https://www.enomia.app';

const staticPages = [
  { url: '/', changefreq: 'weekly', priority: '1.0' },
  { url: '/blog/', changefreq: 'weekly', priority: '0.8' },
  { url: '/simulateur-rentabilite-airbnb', changefreq: 'monthly', priority: '0.9' },
  { url: '/facture-location-saisonniere', changefreq: 'monthly', priority: '0.9' },
  { url: '/facture-airbnb', changefreq: 'monthly', priority: '0.9' },
  { url: '/facture-booking', changefreq: 'monthly', priority: '0.9' },
  { url: '/contrat-location-saisonniere', changefreq: 'monthly', priority: '0.9' },
  { url: '/contrat-airbnb', changefreq: 'monthly', priority: '0.9' },
  { url: '/contrat-location-gite', changefreq: 'monthly', priority: '0.9' },
  { url: '/contrat-location-mobil-home', changefreq: 'monthly', priority: '0.9' },
];

export async function GET() {
  const posts = await getCollection('blog');

  const postEntries = posts
    .filter((post) => post.data.status === 'en-ligne')
    .map((post) => ({
      url: `/blog/${post.slug}`,
      changefreq: 'monthly',
      priority: '0.7',
      lastmod: post.data.updatedAt ?? post.data.publishedAt,
    }));

  const cityEntries = cities.map((c) => ({
    url: `/conciergerie-airbnb/${c.regionSlug}/${c.slug}`,
    changefreq: 'monthly',
    priority: '0.85',
    lastmod: c.updatedAt,
  }));

  const regionEntries = regions
    .filter((r) => cities.some((c) => c.regionSlug === r.slug))
    .map((r) => ({
      url: `/conciergerie-airbnb/${r.slug}`,
      changefreq: 'monthly',
      priority: '0.8',
      lastmod: '2026-04-13',
    }));

  const pillarEntry = {
    url: '/conciergerie-airbnb',
    changefreq: 'monthly',
    priority: '0.9',
    lastmod: '2026-04-13',
  };

  const allEntries = [
    ...staticPages.map((p) => ({ ...p, lastmod: undefined })),
    pillarEntry,
    ...regionEntries,
    ...cityEntries,
    ...postEntries,
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allEntries
  .map(
    (entry) => `  <url>
    <loc>${SITE}${entry.url}</loc>${entry.lastmod ? `\n    <lastmod>${entry.lastmod.split('T')[0]}</lastmod>` : ''}
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
