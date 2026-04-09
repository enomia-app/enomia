export const prerender = true;

import { getCollection } from 'astro:content';
import { cities } from '../data/cities';

const SITE = 'https://www.enomia.app';

const staticPages = [
  { url: '/', changefreq: 'weekly', priority: '1.0' },
  { url: '/blog/', changefreq: 'weekly', priority: '0.8' },
  { url: '/simulateur-rentabilite-airbnb', changefreq: 'monthly', priority: '0.9' },
  { url: '/facture-location-saisonniere', changefreq: 'monthly', priority: '0.9' },
  { url: '/facture-airbnb', changefreq: 'monthly', priority: '0.9' },
  { url: '/facture-booking', changefreq: 'monthly', priority: '0.9' },
];

export async function GET() {
  const posts = await getCollection('blog');

  const postEntries = posts
    .filter((post) => !post.data.draft)
    .map((post) => ({
      url: `/blog/${post.slug}/`,
      changefreq: 'monthly',
      priority: '0.7',
      lastmod: post.data.updatedAt ?? post.data.publishedAt,
    }));

  const cityEntries = cities.map((c) => ({
    url: `/conciergerie-${c.slug}`,
    changefreq: 'monthly',
    priority: '0.85',
    lastmod: c.updatedAt,
  }));

  const pillarEntry = {
    url: '/conciergerie-airbnb',
    changefreq: 'monthly',
    priority: '0.9',
    lastmod: '2026-04-09',
  };

  const allEntries = [
    ...staticPages.map((p) => ({ ...p, lastmod: undefined })),
    pillarEntry,
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
