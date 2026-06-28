import { defineConfig } from 'astro/config';
import { readFileSync } from 'node:fs';
import keystatic from '@keystatic/astro';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';
import markdoc from '@astrojs/markdoc';

// 301 : anciennes URLs flat /rentabilite-airbnb/<ville> -> nouvelles URLs nichées /rentabilite-airbnb/<region>/<ville>.
// La destination est calculée depuis le dataset (bonne région garantie). Villes absentes -> hub.
const renta = JSON.parse(readFileSync(new URL('./src/data/rentabilite-villes.json', import.meta.url)));
const rentaBySlug = Object.fromEntries(renta.villes.map((v) => [v.slug, v]));
const OLD_FLAT = ['aix-en-provence', 'ajaccio', 'annecy', 'antibes', 'avignon', 'bayonne', 'biarritz', 'bordeaux', 'cannes', 'carcassonne', 'chamonix', 'colmar', 'deauville', 'honfleur', 'la-rochelle', 'lille', 'lyon', 'marseille', 'megeve', 'montpellier', 'nantes', 'nice', 'paris', 'rennes', 'saint-jean-de-luz', 'saint-malo', 'saint-tropez', 'sarlat', 'strasbourg', 'toulouse'];
const OLD_RENAME = { sarlat: 'sarlat-la-caneda' };
const rentaRedirects = {};
for (const old of OLD_FLAT) {
  const newSlug = OLD_RENAME[old] || old;
  const v = rentaBySlug[newSlug];
  rentaRedirects[`/rentabilite-airbnb/${old}`] = {
    status: 301,
    destination: v ? `/rentabilite-airbnb/${v.region_slug}/${newSlug}` : '/rentabilite-airbnb',
  };
}

export default defineConfig({
  site: 'https://www.enomia.app',
  trailingSlash: 'never',
  integrations: [react(), markdoc(), keystatic()],
  output: 'server',
  adapter: vercel(),
  redirects: rentaRedirects,
});
