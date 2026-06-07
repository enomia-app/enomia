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

// ─── Pages par ENVIE (amoureux / famille) — cross-cut intent × région ───
// Classement d'audience dérivé des vraies données (nom + desc + équipements + avis),
// pas d'IA ni d'invention : on range chaque cabane selon les signaux présents.
export type CabaneIntent = 'amoureux' | 'famille';

const ROMANTIC_WORDS = ['amoureux', 'romantique', 'en couple', 'couple', 'jacuzzi', 'spa privatif', 'spa ', 'bain nordique', 'balneo', 'intim', 'escapade', 'saint valentin', 'en duo', 'cocon'];
const FAMILY_WORDS = ['famille', 'familial', 'enfant', 'spacieu', 'tribu', 'aire de jeux', 'trampoline', 'plusieurs chambres', 'grande capacite', '4 personnes', '5 personnes', '6 personnes', '8 personnes', 'parc'];

function audienceScore(c: Cabane): { romantic: number; family: number } {
  const t = `${c.name} ${c.description || ''} ${c.features.join(' ')} ${(c.recentReviews || []).map((r) => r.text).join(' ')}`
    .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const hits = (words: string[]) => words.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0);
  return { romantic: hits(ROMANTIC_WORDS), family: hits(FAMILY_WORDS) };
}

export type IntentZoneGroup = { zone: CabaneZone; cabanes: Cabane[] };

// Cabanes pertinentes pour l'envie, groupées par zone (région), top N/zone.
// amoureux = signal romantique dominant ; famille = présence d'un signal famille (sous-ensemble plus rare → pages distinctes).
export function getCabanesByIntent(intent: CabaneIntent, perZone = 5): IntentZoneGroup[] {
  const groups: IntentZoneGroup[] = [];
  for (const z of cabaneZones.slice().sort((a, b) => b.searchVolume - a.searchVolume)) {
    const scored = z.cabanes.map((c) => ({ c, s: audienceScore(c) }));
    const picks = intent === 'amoureux'
      ? scored.filter((x) => x.s.romantic > 0 && x.s.romantic >= x.s.family).sort((a, b) => b.s.romantic - a.s.romantic)
      : scored.filter((x) => x.s.family > 0).sort((a, b) => b.s.family - a.s.family);
    const cabanes = picks.slice(0, perZone).map((x) => x.c);
    if (cabanes.length) groups.push({ zone: z, cabanes });
  }
  return groups;
}

export const CABANE_INTENTS: Record<CabaneIntent, {
  slug: string; kw: string; h1: string; metaTitle: string; metaDescription: string; lede: string; faq: CabaneFaq[];
}> = {
  amoureux: {
    slug: 'en-amoureux',
    kw: 'cabane en amoureux',
    h1: 'Cabane en amoureux : les plus belles cabanes romantiques par région',
    metaTitle: 'Cabane en amoureux : cabanes romantiques avec spa (2026)',
    metaDescription: 'Cabane en amoureux : sélection des cabanes perchées et insolites les plus romantiques, avec spa ou bain nordique privatif, région par région. Notes Google, réservation en direct.',
    lede: "Une cabane perchée rien que pour vous deux, un bain nordique sous les étoiles, le silence de la forêt : la **cabane en amoureux** est l'escapade romantique par excellence. Voici notre sélection des adresses les plus intimistes (spa ou jacuzzi privatif, capacité deux personnes), région par région.",
    faq: [
      { q: "Quelle cabane choisir pour un week-end en amoureux ?", a: "Privilégiez une cabane perchée ou insolite avec spa, jacuzzi ou bain nordique privatif, prévue pour deux personnes, avec une vraie intimité (pas de vis-à-vis). Les adresses ci-dessous sont classées selon ces critères, par région." },
      { q: "Combien coûte une cabane romantique avec jacuzzi ?", a: "Comptez de 130 à 280 € la nuit pour une cabane romantique avec spa ou bain nordique privatif, selon la région et la saison. Réserver en semaine et en direct revient nettement moins cher." },
      { q: "Peut-on réserver une cabane en amoureux en direct ?", a: "Oui, et c'est conseillé : en passant par le site du propriétaire plutôt qu'une plateforme, vous évitez les frais de service et le propriétaire vous fait souvent un geste pour une occasion spéciale." },
    ],
  },
  famille: {
    slug: 'en-famille',
    kw: 'cabane en famille',
    h1: 'Cabane en famille : les meilleures cabanes pour les enfants par région',
    metaTitle: 'Cabane en famille : cabanes insolites pour enfants (2026)',
    metaDescription: 'Cabane en famille : sélection des cabanes insolites spacieuses et adaptées aux enfants, région par région. Notes Google, équipements et réservation en direct.',
    lede: "Réveiller les enfants dans une cabane au milieu des arbres, partager une nuit insolite en tribu : la **cabane en famille** transforme un simple week-end en souvenir. Voici notre sélection des cabanes les plus spacieuses et adaptées aux familles, région par région.",
    faq: [
      { q: "Quelle cabane choisir avec des enfants ?", a: "Visez une cabane spacieuse (plusieurs couchages), de plain-pied ou avec un accès sécurisé, idéalement avec un terrain ou des activités sur place. Les adresses ci-dessous sont retenues pour leur capacité et leur cadre familial, par région." },
      { q: "Les cabanes perchées conviennent-elles aux enfants ?", a: "Certaines oui, d'autres non : tout dépend de la hauteur, de l'accès (échelle ou passerelle) et de l'âge des enfants. Vérifiez la description et les avis de chaque adresse, qui précisent souvent si le lieu est adapté aux familles." },
      { q: "Comment réserver une cabane en famille moins cher ?", a: "Réservez hors vacances scolaires et en semaine, et passez en direct auprès du propriétaire quand c'est possible pour éviter les frais de service des plateformes." },
    ],
  },
};

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
