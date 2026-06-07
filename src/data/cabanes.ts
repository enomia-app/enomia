import { cabaneListings } from './cabaneListings';
import { cabaneZonesMeta } from './cabaneZones';

// Données du hub cabane (/cabane). Niche RÉGION/ZONE-led (≠ love room ville-led) : on indexe par
// région / département / massif. Les CABANES viennent de cabaneListings.ts (généré, Google Places).
// L'éditorial par zone (intro, scène, FAQ) est généré ici : 3 variantes par bloc, choix déterministe
// par slug → variation anti-duplicate. L'unicité vient surtout des vraies annonces (≠ par zone).

export type Cabane = {
  name: string;
  area: string;
  dept: string;
  distanceKm: number;
  priceFrom?: number;
  features: string[];
  vibe: string;
  description?: string;
  rating?: number;
  reviews?: number;
  url?: string;
  source: string;
  recentReviews?: { author?: string | null; rating?: number | null; when?: string | null; text: string }[];
};

export type CabaneFaq = { q: string; a: string };

export type CabaneZone = {
  slug: string;
  displayName: string;
  type: string;
  searchVolume: number;
  radiusKm: number;
  found: number;
  lat?: number;
  lng?: number;
  metaTitle: string;
  metaDescription: string;
  title: string;
  kwPrincipal: string;
  intro: string;
  scene: string;
  cabanes: Cabane[];
  faq: CabaneFaq[];
  nearby: string[];
  avgRating: number;
  totalReviews: number;
  communes: string[];
  updatedAt: string;
};

const TYPE_LABEL: Record<string, string> = { region: 'région', departement: 'département', massif: 'massif' };
const typeLabel = (t: string) => TYPE_LABEL[t] || 'région';

function pick<T>(arr: T[], slug: string): T {
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return arr[h % arr.length];
}

function kmBetween(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371, toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLng = toRad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// Maillage interne par proximité géographique réelle entre zones (haversine).
function nearbyFor(m: { slug: string; searchVolume: number; lat?: number; lng?: number }): string[] {
  const others = cabaneZonesMeta.filter((z) => z.slug !== m.slug) as Array<{ slug: string; searchVolume: number; lat?: number; lng?: number }>;
  if (typeof m.lat === 'number' && typeof m.lng === 'number') {
    const withCoords = others.filter((z) => typeof z.lat === 'number' && typeof z.lng === 'number');
    if (withCoords.length) {
      return withCoords
        .map((z) => ({ slug: z.slug, d: kmBetween({ lat: m.lat!, lng: m.lng! }, { lat: z.lat!, lng: z.lng! }) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 4)
        .map((z) => z.slug);
    }
  }
  return others.sort((a, b) => b.searchVolume - a.searchVolume).slice(0, 4).map((z) => z.slug);
}

function genZone(m: (typeof cabaneZonesMeta)[number]): CabaneZone {
  const cabanes: Cabane[] = (cabaneListings[m.slug] || []).slice().sort((a, b) => (b.rating || 0) - (a.rating || 0));
  const rated = cabanes.filter((c) => typeof c.rating === 'number' && c.rating > 0);
  const avgRating = rated.length ? Math.round((rated.reduce((s, c) => s + (c.rating || 0), 0) / rated.length) * 10) / 10 : 0;
  const totalReviews = cabanes.reduce((s, c) => s + (c.reviews || 0), 0);
  const communes = [...new Set(cabanes.map((c) => c.area).filter(Boolean))];
  const found = (m as { found?: number }).found ?? cabanes.length;
  const Z = m.displayName;
  const lab = typeLabel(m.type);
  const prep = m.type === 'massif' ? 'dans le' : m.type === 'departement' ? 'en' : 'en';
  const inZone = m.type === 'massif' ? `dans le ${Z}` : `en ${Z}`;

  const intro = pick(
    [
      `Envie d'une **cabane ${inZone}** pour une nuit insolite à deux ou en famille ? On a passé au crible les cabanes perchées, cabanes dans les bois et lodges nature de la ${lab}, pour ne garder que les mieux notés sur Google. Avec, en prime, nos conseils pour réserver en direct et payer moins cher.`,
      `Une **cabane ${inZone}**, c'est la promesse d'une vraie déconnexion : perché dans les arbres, au bord d'un étang ou en pleine forêt. On a sélectionné les adresses les mieux notées de la ${lab}, avec spa, bain nordique ou poêle à bois, notes Google à l'appui.`,
      `Offrez-vous une parenthèse nature dans une **cabane ${inZone}** : cabane perchée, hébergement insolite, intimité totale loin de tout. Voici notre sélection des adresses les mieux notées ${inZone}, avec nos astuces pour réserver en direct auprès du propriétaire.`,
    ],
    m.slug
  );

  const scene = pick(
    [
      `${Z} se prête particulièrement bien à la cabane insolite : forêts, reliefs et nature préservée. L'offre va de la cabane perchée toute simple au lodge avec spa privatif et bain nordique. Les week-ends et les vacances scolaires partent vite : pensez à réserver tôt et à viser la semaine pour un meilleur tarif.`,
      `Sur ${Z}, les cabanes misent sur le dépaysement : entrée indépendante, terrasse face à la nature, parfois jacuzzi ou sauna rien que pour vous. Chaque adresse a son caractère. On a privilégié les hébergements aux meilleurs avis Google, de la cabane perchée romantique au refuge familial.`,
      `Autour de ${Z}, on trouve aussi bien des cabanes dans les arbres que des cabanes au sol au bord de l'eau, souvent avec spa ou poêle à bois. C'est l'évasion à portée de route. Notre sélection couvre la ${lab} et affiche la commune et la note de chaque adresse.`,
    ],
    m.slug
  );

  const faq: CabaneFaq[] = [
    {
      q: `Combien coûte une nuit en cabane ${inZone} ?`,
      a: `Les tarifs varient selon le confort (spa, bain nordique, cabane perchée). Comptez en général de 120 à 250 € la nuit ${inZone}. Réserver en semaine et hors vacances scolaires revient nettement moins cher, et réserver en direct évite les frais de service des plateformes.`,
    },
    {
      q: `Quelle est la meilleure période pour une cabane ${inZone} ?`,
      a: `Le printemps et l'automne offrent le meilleur rapport calme/prix. L'été est prisé pour les cabanes au bord de l'eau, l'hiver pour celles avec poêle ou spa. Dans tous les cas, les week-ends partent vite : réservez à l'avance.`,
    },
    {
      q: `Comment réserver une cabane ${inZone} moins cher ?`,
      a: `Visez la semaine plutôt que le samedi, évitez les vacances scolaires, et surtout réservez en direct auprès du propriétaire (lien vers son site quand il existe) pour éviter la commission des plateformes de réservation.`,
    },
    {
      q: `Une cabane ${inZone}, c'est plutôt en amoureux ou en famille ?`,
      a: `Les deux. ${Z} compte des cabanes perchées romantiques pensées pour un week-end à deux, souvent avec spa ou bain nordique privatif, et des cabanes plus spacieuses ou familiales adaptées aux séjours avec enfants. Vérifiez la capacité et les équipements indiqués sur chaque adresse.`,
    },
  ];

  return {
    slug: m.slug,
    displayName: Z,
    type: m.type,
    searchVolume: m.searchVolume,
    radiusKm: m.radiusKm,
    found,
    lat: (m as { lat?: number }).lat,
    lng: (m as { lng?: number }).lng,
    metaTitle: `Cabane ${Z} : les meilleures cabanes insolites (2026)`,
    metaDescription: `Où dormir en cabane ${inZone} : cabanes perchées, dans les bois, avec spa ou bain nordique. Notes Google, communes, prix et astuces pour réserver en direct.`,
    title: `Cabane ${Z} : les meilleures cabanes insolites et perchées`,
    kwPrincipal: `cabane ${m.slug.replace(/-/g, ' ')}`,
    intro,
    scene,
    cabanes,
    faq,
    nearby: nearbyFor(m),
    avgRating,
    totalReviews,
    communes,
    updatedAt: '2026-06-07',
  };
}

export const cabaneZones: CabaneZone[] = cabaneZonesMeta.map(genZone);

// ─── Helpers ─────────────────────────────────────────────────────────
export function getCabaneZoneBySlug(slug: string): CabaneZone | undefined {
  return cabaneZones.find((z) => z.slug === slug);
}

export type RankedCabane = Cabane & { zoneSlug: string; zoneName: string };

export function getTopCabanes(opts?: { limit?: number }): RankedCabane[] {
  const flat: RankedCabane[] = cabaneZones.flatMap((z) => z.cabanes.map((c) => ({ ...c, zoneSlug: z.slug, zoneName: z.displayName })));
  const sc = (c: RankedCabane) => (c.rating ?? 0) * Math.log10((c.reviews ?? 0) + 1);
  const seen = new Set<string>();
  return flat
    .filter((c) => c.rating && c.reviews)
    .sort((a, b) => sc(b) - sc(a))
    .filter((c) => (seen.has(c.name) ? false : (seen.add(c.name), true)))
    .slice(0, opts?.limit ?? 10);
}
