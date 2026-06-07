import { loveRoomListings } from './loveRoomListings';
import { loveRoomCitiesMeta } from './loveRoomCities';

// Données du hub love room (/love-room). Les ROOMS viennent de loveRoomListings.ts (généré, Google Places).
// L'éditorial par ville (intro, scène, FAQ) est GÉNÉRÉ ici à partir de loveRoomCitiesMeta + des rooms :
// 3 variantes par bloc, choisies de façon déterministe par slug → variation anti-duplicate.
// L'unicité de chaque page vient surtout des vraies annonces (différentes par ville).

export type LoveRoom = {
  name: string;
  area: string;
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

export type LoveRoomFaq = { q: string; a: string };

export type LoveRoomRegion = { slug: string; displayName: string; description: string; searchVolume: number };

export const loveRoomRegions: LoveRoomRegion[] = [
  { slug: 'ile-de-france', displayName: 'Île-de-France', description: "Paris et sa couronne concentrent la plus forte demande de love rooms de France. L'offre intra-muros est rare et chère ; la grande couronne (jusqu'à 1h) propose des suites avec spa bien plus accessibles.", searchVolume: 2850 },
  { slug: 'auvergne-rhone-alpes', displayName: 'Auvergne-Rhône-Alpes', description: "Autour de Lyon, du Beaujolais, d'Annecy et des Alpes, l'une des offres de love rooms les plus denses de France : de la suite design en ville aux villas avec piscine intérieure à la campagne.", searchVolume: 970 },
  { slug: 'provence-alpes-cote-dazur', displayName: "Provence-Alpes-Côte d'Azur", description: "De Marseille à Nice, le soleil et l'ambiance méditerranéenne portent une belle offre de love rooms avec jacuzzi et spa privatif, en ville comme dans l'arrière-pays.", searchVolume: 1060 },
  { slug: 'occitanie', displayName: 'Occitanie', description: "Toulouse, Montpellier et la côte méditerranéenne : une offre de love rooms en forte croissance, des suites urbaines aux adresses plus confidentielles de l'arrière-pays.", searchVolume: 930 },
  { slug: 'nouvelle-aquitaine', displayName: 'Nouvelle-Aquitaine', description: "De Bordeaux au Bassin d'Arcachon, l'œnotourisme et le littoral atlantique nourrissent une offre de chambres romantiques avec spa privatif de plus en plus riche.", searchVolume: 360 },
  { slug: 'pays-de-la-loire', displayName: 'Pays de la Loire', description: "Autour de Nantes et d'Angers, une offre de love rooms variée, entre suites de ville et adresses nature, à courte distance pour une escapade à deux.", searchVolume: 1150 },
  { slug: 'hauts-de-france', displayName: 'Hauts-de-France', description: "Lille et sa métropole sont l'un des berceaux de la love room en France : forte densité de suites avec jacuzzi et spa privatif, du Vieux-Lille à Roubaix et Tourcoing.", searchVolume: 600 },
  { slug: 'alsace', displayName: 'Grand Est', description: "Strasbourg, Metz, Nancy et le vignoble alsacien : un tourisme romantique toute l'année et une jolie offre de suites avec spa privatif, en ville comme au vert.", searchVolume: 2540 },
  { slug: 'centre-val-de-loire', displayName: 'Centre-Val de Loire', description: "Tours, Amboise et la Vallée de la Loire : châteaux, vignobles et une offre de love rooms idéale pour un week-end romantique à moins de 1h30 de Paris.", searchVolume: 360 },
  { slug: 'bretagne', displayName: 'Bretagne', description: "De Rennes à la côte, la Bretagne combine patrimoine, bord de mer et une offre de love rooms en plein essor, en ville comme dans la campagne et le littoral proche.", searchVolume: 4530 },
  { slug: 'normandie', displayName: 'Normandie', description: "Rouen, la côte fleurie et les plages : la Normandie, toute proche de Paris, propose une belle offre de chambres romantiques avec jacuzzi et spa privatif.", searchVolume: 5140 },
  { slug: 'bourgogne-franche-comte', displayName: 'Bourgogne-Franche-Comté', description: "Dijon, Beaune et les vignobles : la Bourgogne-Franche-Comté allie œnotourisme et patrimoine, avec une offre de love rooms et suites avec spa privatif en ville comme au vert.", searchVolume: 360 },
  { slug: 'corse', displayName: 'Corse', description: "Ajaccio, Bastia et le littoral : la Corse propose des hébergements romantiques avec jacuzzi ou spa privatif, idéaux pour une parenthèse à deux face à la mer.", searchVolume: 300 },
];

export type LoveRoomCity = {
  slug: string;
  displayName: string;
  region: string;
  regionSlug: string;
  metaTitle: string;
  metaDescription: string;
  title: string;
  kwPrincipal: string;
  searchVolume: number;
  radiusKm: number;
  estimatedSupply: number;
  found: number;
  avgRating: number;
  totalReviews: number;
  communes: string[];
  priceTypicalLow: number;
  priceTypicalHigh: number;
  introCustom: string;
  sceneIntro: string;
  rooms: LoveRoom[];
  extraFaq: LoveRoomFaq[];
  nearby: string[];
  updatedAt: string;
  verified: boolean;
};

// Choix déterministe d'une variante par slug (même ville = toujours la même variante).
function pick<T>(arr: T[], slug: string): T {
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return arr[h % arr.length];
}

function nearbyFor(m: { slug: string; regionSlug: string }): string[] {
  const others = loveRoomCitiesMeta.filter((c) => c.slug !== m.slug);
  const sameRegion = others.filter((c) => c.regionSlug === m.regionSlug);
  const rest = others
    .filter((c) => c.regionSlug !== m.regionSlug)
    .sort((a, b) => b.searchVolume - a.searchVolume);
  return [...sameRegion, ...rest].slice(0, 3).map((c) => c.slug);
}

function genCity(m: (typeof loveRoomCitiesMeta)[number]): LoveRoomCity {
  const rooms: LoveRoom[] = loveRoomListings[m.slug] || [];
  const prices = rooms.map((r) => r.priceFrom).filter((p): p is number => typeof p === 'number');
  const minP = prices.length ? Math.min(...prices) : 120;
  const maxP = prices.length ? Math.max(...prices) : 350;
  const rated = rooms.filter((r) => typeof r.rating === 'number' && r.rating > 0);
  const avgRating = rated.length ? Math.round((rated.reduce((s, r) => s + (r.rating || 0), 0) / rated.length) * 10) / 10 : 0;
  const totalReviews = rooms.reduce((s, r) => s + (r.reviews || 0), 0);
  const communes = [...new Set(rooms.map((r) => r.area).filter(Boolean))];
  const found = (m as { found?: number }).found ?? rooms.length;
  const V = m.displayName;
  const R = m.radiusKm;

  const introCustom = pick(
    [
      `Vous cherchez une **love room à ${V}** pour une nuit ou un week-end en amoureux ? On a fait le tri parmi les chambres avec jacuzzi ou spa privatif de ${V} et des environs (rayon ${R} km), pour ne garder que les mieux notées sur Google. Avec, en prime, nos astuces pour payer moins cher et réserver en direct.`,
      `Une **love room à ${V}**, c'est l'idée parfaite pour surprendre l'autre. Entre les annonces qui se ressemblent et les prix qui s'envolent le samedi soir, on a sélectionné les meilleures chambres avec jacuzzi ou spa privatif de ${V} et alentour, notes Google à l'appui.`,
      `Offrez-vous une parenthèse à deux dans une **love room à ${V}** : jacuzzi ou spa privatif, intimité totale, décoration soignée. Voici notre sélection des adresses les mieux notées de ${V} et dans un rayon de ${R} km, avec nos conseils pour réserver en direct et payer moins cher.`,
    ],
    m.slug
  );

  const sceneIntro = pick(
    [
      `À ${V} et autour, l'offre de love rooms va de la suite design en ville aux adresses plus confidentielles de la campagne proche, à moins d'une heure. La plupart proposent jacuzzi ou spa privatif, parfois sauna, hammam ou piscine. Les prix grimpent le week-end et autour de la Saint-Valentin : réserver en semaine reste le meilleur plan.`,
      `Le bassin de ${V} compte de belles adresses de love rooms, en ville comme dans un rayon de ${R} km pour celles et ceux qui veulent vraiment s'isoler. Jacuzzi privatif, déco à thème, options massage ou champagne : chaque adresse a sa personnalité. Pensez au « day-use » (à la journée) pour un tarif plus doux.`,
      `Autour de ${V}, les love rooms misent sur l'intimité : entrée indépendante, jacuzzi ou spa rien que pour vous, et souvent de petites attentions (bougies, pétales, planches gourmandes). On a privilégié les adresses aux meilleurs avis Google, en ville comme dans la campagne proche.`,
    ],
    m.slug
  );

  const extraFaq: LoveRoomFaq[] = [
    {
      q: `Quel est le prix d'une love room à ${V} ?`,
      a: `Comptez à partir d'environ ${minP} € la nuit en semaine pour une chambre avec jacuzzi privatif à ${V} ou dans les environs. Les tarifs montent le week-end et autour de la Saint-Valentin ; réserver en semaine ou en « day-use » revient nettement moins cher.`,
    },
    {
      q: `Faut-il être en plein centre de ${V} pour trouver une love room ?`,
      a: `Non. La love room est un achat « destination » : beaucoup de couples acceptent de rouler 30 minutes à 1h pour une nuit à deux. Notre sélection couvre un rayon de ${R} km autour de ${V} et affiche la distance de chaque adresse.`,
    },
    {
      q: `Comment payer sa love room à ${V} moins cher ?`,
      a: `Réservez en semaine (souvent 30 à 40 % de moins que le samedi), évitez la Saint-Valentin et les vacances scolaires, pensez à la formule à la journée, et réservez en direct auprès du propriétaire pour éviter les frais de service des plateformes.`,
    },
  ];

  return {
    slug: m.slug,
    displayName: V,
    region: m.region,
    regionSlug: m.regionSlug,
    metaTitle: `Love Room ${V} : chambres avec jacuzzi privatif (2026)`,
    metaDescription: `Les meilleures love rooms à ${V} et autour : chambres avec jacuzzi ou spa privatif, notes Google, prix, distance, et nos astuces pour payer moins cher et réserver en direct.`,
    title: `Love room ${V} : les meilleures chambres avec jacuzzi privatif`,
    kwPrincipal: `love room ${m.slug.replace(/-/g, ' ')}`,
    searchVolume: m.searchVolume,
    radiusKm: R,
    estimatedSupply: Math.max(rooms.length * 3, 25),
    found,
    avgRating,
    totalReviews,
    communes,
    priceTypicalLow: minP,
    priceTypicalHigh: maxP,
    introCustom,
    sceneIntro,
    rooms,
    extraFaq,
    nearby: nearbyFor(m),
    updatedAt: '2026-06-06',
    verified: false,
  };
}

export const loveRoomCities: LoveRoomCity[] = loveRoomCitiesMeta.map(genCity);

// ─── Helpers ─────────────────────────────────────────────────────────
export function getLoveRoomCityBySlug(slug: string): LoveRoomCity | undefined {
  return loveRoomCities.find((c) => c.slug === slug);
}
export function getLoveRoomRegionBySlug(slug: string): LoveRoomRegion | undefined {
  return loveRoomRegions.find((r) => r.slug === slug);
}
export function getLoveRoomCitiesByRegion(regionSlug: string): LoveRoomCity[] {
  return loveRoomCities.filter((c) => c.regionSlug === regionSlug);
}

export type RankedLoveRoom = LoveRoom & { citySlug: string; regionSlug: string; cityName: string };

// Meilleures love rooms (note × log(nb avis)). Filtrable par région. Dédup par nom.
export function getTopLoveRooms(opts?: { regionSlug?: string; limit?: number }): RankedLoveRoom[] {
  const flat: RankedLoveRoom[] = loveRoomCities.flatMap((c) =>
    c.rooms.map((r) => ({ ...r, citySlug: c.slug, regionSlug: c.regionSlug, cityName: c.displayName }))
  );
  const pool = opts?.regionSlug ? flat.filter((r) => r.regionSlug === opts.regionSlug) : flat;
  const sc = (r: RankedLoveRoom) => (r.rating ?? 0) * Math.log10((r.reviews ?? 0) + 1);
  const seen = new Set<string>();
  return pool
    .filter((r) => r.rating && r.reviews)
    .sort((a, b) => sc(b) - sc(a))
    .filter((r) => (seen.has(r.name) ? false : (seen.add(r.name), true)))
    .slice(0, opts?.limit ?? 10);
}
