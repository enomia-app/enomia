#!/usr/bin/env node
// Pour chaque prospect angle="conciergerie-ville", tente de matcher le nom de domaine
// avec une ville connue (cities.ts) et store la fiche Enomia précise dans p.fiche_enomia.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Parse cities.ts via regex pour extraire { slug, regionSlug, displayName }
function loadCitiesMapping() {
  const src = fs.readFileSync(path.join(ROOT, 'src/data/cities.ts'), 'utf8');
  const cities = [];
  const blockRe = /slug:\s*'([^']+)',[\s\S]{0,400}?regionSlug:\s*'([^']+)'/g;
  let m;
  while ((m = blockRe.exec(src)) !== null) {
    const [, slug, regionSlug] = m;
    if (slug && regionSlug) cities.push({ slug, regionSlug });
  }
  return cities;
}

// Map { domain → { citySlug, regionSlug } } via parsing par bloc de cities.ts.
function loadConciergerieToCityMap() {
  const src = fs.readFileSync(path.join(ROOT, 'src/data/cities.ts'), 'utf8');
  const map = new Map();

  // Trouve toutes les positions où démarre un city block : `    slug: 'xxx',\n    displayName:`
  const cityHeaderRe = /(?:^|\n)  \{\s*\n    slug:\s*'([^']+)',\s*\n    displayName:[\s\S]*?\n    regionSlug:\s*'([^']+)'/g;
  const cities = [];
  let m;
  while ((m = cityHeaderRe.exec(src)) !== null) {
    cities.push({ citySlug: m[1], regionSlug: m[2], start: m.index });
  }

  for (let i = 0; i < cities.length; i++) {
    const start = cities[i].start;
    const end = cities[i + 1]?.start || src.length;
    const block = src.slice(start, end);
    const urlRe = /url:\s*'(https?:\/\/[^']+)'/g;
    let um;
    while ((um = urlRe.exec(block)) !== null) {
      try {
        const host = new URL(um[1]).hostname.replace(/^www\./, '');
        if (!map.has(host)) map.set(host, { citySlug: cities[i].citySlug, regionSlug: cities[i].regionSlug });
      } catch {}
    }
  }
  return map;
}

function inferCitySlugFromDomain(domain, cities) {
  // ex: conciergerie-marseille.fr → "marseille"
  // ex: hospitality-aix-en-provence.com → "aix-en-provence"
  const clean = domain.toLowerCase().replace(/^www\./, '').replace(/\.(fr|com|net|io|eu|org)$/, '');
  // Try direct slug match (longest first)
  const sortedSlugs = cities.map(c => c.slug).sort((a, b) => b.length - a.length);
  for (const slug of sortedSlugs) {
    // word boundary match in domain (dash-separated)
    const re = new RegExp(`(^|[-.])${slug}([-.]|$)`);
    if (re.test(clean)) return slug;
  }
  return null;
}

const cities = loadCitiesMapping();
const conciergerieToCity = loadConciergerieToCityMap();
console.log(`📚 ${cities.length} villes + ${conciergerieToCity.size} conciergeries référencées (avec leur ville)`);

const crmPath = path.join(ROOT, '.claude/backlinks-data.json');
const data = JSON.parse(fs.readFileSync(crmPath, 'utf8'));

let listees = 0, mappedByDomain = 0, fallback = 0;
for (const p of data.prospects) {
  if (p.angle !== 'conciergerie-ville') continue;
  const domain = (p.site || '').replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');

  // 1. Est-ce qu'on liste déjà cette conciergerie ? (lookup direct dans cities.ts)
  const listedEntry = conciergerieToCity.get(domain);
  p.est_listee_sur_enomia = !!listedEntry;

  // 2. Construire fiche URL — priorité : ville où on les liste > ville inférée du domaine > home
  if (listedEntry) {
    p.fiche_enomia = `https://www.enomia.app/conciergerie-airbnb/${listedEntry.regionSlug}/${listedEntry.citySlug}`;
    listees++;
    console.log(`🟢 référencée                       ${domain.padEnd(40)} → ${listedEntry.citySlug}`);
  } else {
    const slug = inferCitySlugFromDomain(domain, cities);
    if (slug) {
      const city = cities.find(c => c.slug === slug);
      p.fiche_enomia = `https://www.enomia.app/conciergerie-airbnb/${city.regionSlug}/${slug}`;
      mappedByDomain++;
      console.log(`🔵 ville inférée (non référencée)   ${domain.padEnd(40)} → ${slug}`);
    } else {
      p.fiche_enomia = 'https://www.enomia.app/conciergerie-airbnb';
      fallback++;
      console.log(`⚪ inconnu                          ${domain.padEnd(40)} → fallback home`);
    }
  }
}

fs.writeFileSync(crmPath, JSON.stringify(data, null, 2));
console.log(`\n💾 ${listees} référencées avec fiche précise | ${mappedByDomain} ville inférée | ${fallback} fallback home`);
