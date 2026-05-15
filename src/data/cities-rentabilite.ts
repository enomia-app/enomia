/**
 * Base de données des estimations rentabilité Airbnb par ville.
 *
 * Sources : ordres de grandeur 2026 calibrés à partir de :
 *   - Données publiques (Insee, déclarations Loi Le Meur des mairies)
 *   - Annonces actives Airbnb (échantillon par ville)
 *   - Expérience d'exploitation (panel Enomia)
 *
 * Précision : ~70-80% (suffisant pour SEO + ordre de grandeur utilisateur).
 * À refresh trimestriellement, ou basculer sur Airbtics API quand budget activé.
 *
 * Format :
 *   - slug         : URL-safe (sans accents, lowercase, tirets)
 *   - name         : nom affiché à l'utilisateur
 *   - region       : pour grouper et faciliter le maillage géo
 *   - category     : metropole | tourisme-balneaire | station-ski | patrimoine | peripherie | grand-evenement
 *   - t2           : data pour T2 35m² standard (le format le plus polyvalent)
 *   - reliability  : low | medium | high (basé sur volume d'annonces actives)
 *   - publishAt    : date de publication progressive (cron passe en-ligne)
 *   - status       : "brouillon" | "en-ligne"
 *   - neighbors    : liste de 3-5 villes voisines pour le maillage interne
 *   - context      : contexte spécifique de la ville (atouts, contraintes, saisonnalité)
 */

export interface CityRentabilite {
  slug: string;
  name: string;
  region: string;
  category:
    | 'metropole'
    | 'tourisme-balneaire'
    | 'station-ski'
    | 'patrimoine'
    | 'peripherie'
    | 'tourisme-affaires';
  /** Prix au m² 2026 fourchette typique (T2 standard, hors quartiers premium) */
  priceM2: { min: number; max: number };
  t2: {
    caAnnualMin: number; // €
    caAnnualMax: number; // €
    occupancyMin: number; // %
    occupancyMax: number; // %
    nightlyMin: number; // €
    nightlyMax: number; // €
    rendementNetMin: number; // %
    rendementNetMax: number; // %
  };
  /** Statut réglementaire LCD de la ville */
  regulation: {
    status: 'libre' | 'restreint' | 'tendu' | 'interdit-residence-principale';
    /** Détail : numéro d'enregistrement, plafond annuel, compensation, etc. */
    detail: string;
    /** Compensation requise pour transformer un logement en meublé de tourisme ? */
    compensation: boolean;
    /** Local commercial = échappatoire si copro le permet */
    localCommercialAlternative: boolean;
  };
  reliability: 'low' | 'medium' | 'high';
  publishAt: string; // ISO date YYYY-MM-DD
  status: 'brouillon' | 'en-ligne';
  neighbors: string[]; // slugs des villes voisines
  context: string; // 1-2 phrases sur le contexte spécifique
}

export const citiesRentabilite: CityRentabilite[] = [
  // ─── Top 10 grandes métropoles ─────────────────────────────────────
  {
    slug: 'paris',
    name: 'Paris',
    region: 'Île-de-France',
    category: 'metropole',
    priceM2: { min: 10500, max: 13500 },
    regulation: { status: 'tendu', detail: "Quota strict d'autorisations dans les 1er-11e arrondissements (zone tendue). Numéro d'enregistrement obligatoire (téléprocédure mairie). Plafond 90 jours/an pour résidence principale. Compensation obligatoire dans certaines zones.", compensation: true, localCommercialAlternative: true },
    t2: { caAnnualMin: 28000, caAnnualMax: 52000, occupancyMin: 75, occupancyMax: 90, nightlyMin: 110, nightlyMax: 180, rendementNetMin: 4, rendementNetMax: 9 },
    reliability: 'high',
    publishAt: '2026-04-28',
    status: 'en-ligne',
    neighbors: ['versailles', 'saint-denis', 'boulogne-billancourt'],
    context: 'Marché le plus mature de France. Loi Le Meur impose 90 jours/an pour résidence principale et plafond d\'autorisations dans les 1er-11e. Demande forte toute l\'année, pic mai-octobre.',
  },
  {
    slug: 'lyon',
    name: 'Lyon',
    region: 'Auvergne-Rhône-Alpes',
    category: 'metropole',
    priceM2: { min: 4800, max: 6200 },
    regulation: { status: 'tendu', detail: "Lyon est passé en zone tendue en 2024. Numéro d'enregistrement obligatoire. Compensation requise dans les 1er, 2e, 3e, 6e arrondissements depuis 2025. Plafond 120 jours/an pour résidence principale.", compensation: true, localCommercialAlternative: true },
    t2: { caAnnualMin: 18000, caAnnualMax: 32000, occupancyMin: 70, occupancyMax: 85, nightlyMin: 80, nightlyMax: 130, rendementNetMin: 8, rendementNetMax: 15 },
    reliability: 'high',
    publishAt: '2026-04-30',
    status: 'en-ligne',
    neighbors: ['villeurbanne', 'saint-genis-laval', 'vienne'],
    context: 'Demande mixte tourisme + voyageurs d\'affaires (deuxième pôle économique français). Quartiers premium : Presqu\'île, 6e, Brotteaux. Première couronne offre des rendements supérieurs avec moins de saisonnalité.',
  },
  {
    slug: 'marseille',
    name: 'Marseille',
    region: 'Provence-Alpes-Côte d\'Azur',
    category: 'metropole',
    priceM2: { min: 3200, max: 4500 },
    regulation: { status: 'restreint', detail: "Numéro d'enregistrement obligatoire depuis 2023. Pas de compensation pour le moment, mais le Conseil municipal a voté en 2025 le principe d'un quota dans les 1er-7e arrondissements (mise en œuvre en cours). Plafond 90 jours/an pour résidence principale.", compensation: false, localCommercialAlternative: true },
    t2: { caAnnualMin: 16000, caAnnualMax: 28000, occupancyMin: 65, occupancyMax: 80, nightlyMin: 75, nightlyMax: 120, rendementNetMin: 9, rendementNetMax: 16 },
    reliability: 'high',
    publishAt: '2026-05-02',
    status: 'en-ligne',
    neighbors: ['aix-en-provence', 'cassis', 'toulon'],
    context: 'Forte saisonnalité (juin-septembre = 50% du CA). Quartiers premium : Vieux-Port, Le Panier, Endoume. Prix d\'achat encore accessibles donnent les meilleurs rendements net du top 10.',
  },
  {
    slug: 'bordeaux',
    name: 'Bordeaux',
    region: 'Nouvelle-Aquitaine',
    category: 'metropole',
    priceM2: { min: 4500, max: 5800 },
    regulation: { status: 'tendu', detail: "Quota strict + numéro d'enregistrement obligatoire. Compensation requise pour transformer un logement en meublé de tourisme depuis 2022. Plafond 120 jours/an pour résidence principale.", compensation: true, localCommercialAlternative: true },
    t2: { caAnnualMin: 15000, caAnnualMax: 26000, occupancyMin: 70, occupancyMax: 82, nightlyMin: 80, nightlyMax: 125, rendementNetMin: 7, rendementNetMax: 13 },
    reliability: 'high',
    publishAt: '2026-05-04',
    status: 'en-ligne',
    neighbors: ['arcachon', 'la-rochelle', 'biarritz'],
    context: 'Marché tendu avec quota d\'autorisations (Loi Le Meur). Quartiers premium : Chartrons, hyper-centre, Saint-Pierre. Demande forte toute l\'année (vinexpo, événements œnotouristiques).',
  },
  {
    slug: 'toulouse',
    name: 'Toulouse',
    region: 'Occitanie',
    category: 'metropole',
    priceM2: { min: 3700, max: 4800 },
    regulation: { status: 'libre', detail: "Numéro d'enregistrement obligatoire mais pas de quota global. Plafond 90 jours/an pour résidence principale (Loi Le Meur nationale). Le marché reste accessible pour les nouveaux investisseurs.", compensation: false, localCommercialAlternative: true },
    t2: { caAnnualMin: 13000, caAnnualMax: 22000, occupancyMin: 65, occupancyMax: 78, nightlyMin: 70, nightlyMax: 110, rendementNetMin: 9, rendementNetMax: 15 },
    reliability: 'high',
    publishAt: '2026-05-06',
    status: 'en-ligne',
    neighbors: ['carcassonne', 'albi', 'montauban'],
    context: 'Demande dominée par voyageurs d\'affaires (aéronautique, Airbus). Quartiers premium : Capitole, Carmes, Saint-Étienne. Rendements solides grâce à l\'occupation lissée toute l\'année.',
  },
  {
    slug: 'nice',
    name: 'Nice',
    region: 'Provence-Alpes-Côte d\'Azur',
    category: 'tourisme-balneaire',
    priceM2: { min: 5200, max: 7500 },
    regulation: { status: 'tendu', detail: "Numéro d'enregistrement obligatoire. Compensation requise dans le centre-ville (Vieux Nice, Carré d'Or) depuis 2024. Plafond 90 jours/an pour résidence principale. Contrôles renforcés en saison estivale.", compensation: true, localCommercialAlternative: true },
    t2: { caAnnualMin: 18000, caAnnualMax: 35000, occupancyMin: 60, occupancyMax: 78, nightlyMin: 90, nightlyMax: 180, rendementNetMin: 6, rendementNetMax: 12 },
    reliability: 'high',
    publishAt: '2026-05-08',
    status: 'en-ligne',
    neighbors: ['antibes', 'cannes', 'menton'],
    context: 'Forte saisonnalité (juin-août = 45% du CA). Pricing dynamique indispensable. Quartiers premium : Vieux Nice, Promenade des Anglais, Carré d\'Or.',
  },
  {
    slug: 'nantes',
    name: 'Nantes',
    region: 'Pays de la Loire',
    category: 'metropole',
    priceM2: { min: 3700, max: 4800 },
    regulation: { status: 'libre', detail: "Numéro d'enregistrement obligatoire. Pas de quota global. Plafond 90 jours/an pour résidence principale. Marché accessible aux nouveaux investisseurs.", compensation: false, localCommercialAlternative: true },
    t2: { caAnnualMin: 12000, caAnnualMax: 21000, occupancyMin: 65, occupancyMax: 78, nightlyMin: 65, nightlyMax: 105, rendementNetMin: 9, rendementNetMax: 15 },
    reliability: 'medium',
    publishAt: '2026-05-10',
    status: 'en-ligne',
    neighbors: ['rennes', 'la-rochelle', 'angers'],
    context: 'Demande mixte tourisme + affaires + étudiants. Quartiers premium : Bouffay, Graslin, Île de Nantes. Saisonnalité modérée, occupation plus stable que les villes balnéaires.',
  },
  {
    slug: 'strasbourg',
    name: 'Strasbourg',
    region: 'Grand Est',
    category: 'metropole',
    priceM2: { min: 3700, max: 4800 },
    regulation: { status: 'restreint', detail: "Numéro d'enregistrement obligatoire. Pas de compensation pour le moment mais quota envisagé pour la Petite France (zone touristique sensible). Plafond 90 jours/an résidence principale.", compensation: false, localCommercialAlternative: true },
    t2: { caAnnualMin: 13000, caAnnualMax: 23000, occupancyMin: 65, occupancyMax: 80, nightlyMin: 70, nightlyMax: 115, rendementNetMin: 9, rendementNetMax: 15 },
    reliability: 'medium',
    publishAt: '2026-05-12',
    status: 'en-ligne',
    neighbors: ['colmar', 'metz', 'nancy'],
    context: 'Marché européen (Parlement européen, Conseil de l\'Europe). Pic décembre (marché de Noël). Quartiers premium : Petite France, Krutenau, hyper-centre.',
  },
  {
    slug: 'montpellier',
    name: 'Montpellier',
    region: 'Occitanie',
    category: 'metropole',
    priceM2: { min: 3700, max: 4800 },
    regulation: { status: 'libre', detail: "Numéro d'enregistrement obligatoire. Pas de quota global. Plafond 90 jours/an pour résidence principale. Marché accessible.", compensation: false, localCommercialAlternative: true },
    t2: { caAnnualMin: 13000, caAnnualMax: 23000, occupancyMin: 65, occupancyMax: 80, nightlyMin: 70, nightlyMax: 115, rendementNetMin: 9, rendementNetMax: 16 },
    reliability: 'medium',
    publishAt: '2026-05-14',
    status: 'en-ligne',
    neighbors: ['nimes', 'perpignan', 'avignon'],
    context: 'Demande étudiants (8e ville étudiante de France) + tourisme. Quartiers premium : Écusson, Antigone, Comédie. Rendements solides grâce aux prix d\'achat encore accessibles.',
  },
  {
    slug: 'lille',
    name: 'Lille',
    region: 'Hauts-de-France',
    category: 'metropole',
    priceM2: { min: 3500, max: 4500 },
    regulation: { status: 'libre', detail: "Numéro d'enregistrement obligatoire. Pas de quota global. Plafond 90 jours/an pour résidence principale. Le Vieux-Lille fait l'objet de discussions pour un éventuel quota futur.", compensation: false, localCommercialAlternative: true },
    t2: { caAnnualMin: 12000, caAnnualMax: 21000, occupancyMin: 65, occupancyMax: 80, nightlyMin: 65, nightlyMax: 105, rendementNetMin: 10, rendementNetMax: 17 },
    reliability: 'medium',
    publishAt: '2026-05-16',
    status: 'brouillon',
    neighbors: ['roubaix', 'tourcoing', 'arras'],
    context: 'Demande dominée par voyageurs d\'affaires (Eurostar, Bruxelles 35min). Quartiers premium : Vieux-Lille, Centre, Wazemmes. Prix d\'achat les plus bas du top 10 = meilleurs rendements net.',
  },

  // ─── Tourisme balnéaire / mer ──────────────────────────────────────
  {
    slug: 'cannes',
    name: 'Cannes',
    region: 'Provence-Alpes-Côte d\'Azur',
    category: 'tourisme-balneaire',
    priceM2: { min: 7000, max: 12000 },
    regulation: { status: 'restreint', detail: "Numéro d'enregistrement obligatoire. Quota partiel sur la Croisette et le Suquet en saison Festival. Plafond 90 jours/an résidence principale. Contrôles très renforcés en mai (Festival) et juillet-août.", compensation: false, localCommercialAlternative: true },
    t2: { caAnnualMin: 22000, caAnnualMax: 42000, occupancyMin: 55, occupancyMax: 72, nightlyMin: 100, nightlyMax: 220, rendementNetMin: 5, rendementNetMax: 11 },
    reliability: 'high',
    publishAt: '2026-05-18',
    status: 'brouillon',
    neighbors: ['antibes', 'nice', 'saint-tropez'],
    context: 'Très forte saisonnalité (juin-août + Festival = 60% du CA). Pricing dynamique indispensable. Quartiers premium : Croisette, Forville, Suquet. Prix d\'achat élevés tirent le rendement net vers le bas.',
  },
  {
    slug: 'biarritz',
    name: 'Biarritz',
    region: 'Nouvelle-Aquitaine',
    category: 'tourisme-balneaire',
    priceM2: { min: 7500, max: 11000 },
    regulation: { status: 'tendu', detail: "Quota d'autorisations strict depuis 2023. Compensation possible mais difficile (peu de locaux commerciaux disponibles). Plafond 90 jours/an résidence principale. Marché ultra-tendu.", compensation: true, localCommercialAlternative: false },
    t2: { caAnnualMin: 20000, caAnnualMax: 38000, occupancyMin: 55, occupancyMax: 72, nightlyMin: 95, nightlyMax: 200, rendementNetMin: 5, rendementNetMax: 10 },
    reliability: 'high',
    publishAt: '2026-05-20',
    status: 'brouillon',
    neighbors: ['bayonne', 'saint-jean-de-luz', 'hossegor'],
    context: 'Saisonnalité marquée (juin-septembre = 55% du CA). Quartiers premium : Centre, Côte des Basques, Beaurivage. Marché tendu avec quota d\'autorisations Loi Le Meur.',
  },
  {
    slug: 'la-rochelle',
    name: 'La Rochelle',
    region: 'Nouvelle-Aquitaine',
    category: 'tourisme-balneaire',
    priceM2: { min: 4500, max: 5800 },
    regulation: { status: 'restreint', detail: "Numéro d'enregistrement obligatoire. Quota partiel dans le Vieux-Port. Plafond 90 jours/an résidence principale. Marché modérément tendu.", compensation: false, localCommercialAlternative: true },
    t2: { caAnnualMin: 14000, caAnnualMax: 24000, occupancyMin: 60, occupancyMax: 78, nightlyMin: 70, nightlyMax: 130, rendementNetMin: 8, rendementNetMax: 14 },
    reliability: 'medium',
    publishAt: '2026-05-22',
    status: 'brouillon',
    neighbors: ['bordeaux', 'ile-de-re', 'royan'],
    context: 'Demande mixte tourisme balnéaire + Francofolies. Quartiers premium : Vieux-Port, Saint-Jean-d\'Acre. Saisonnalité modérée grâce aux ailes de saison (avril-mai et septembre-octobre).',
  },
  {
    slug: 'saint-malo',
    name: 'Saint-Malo',
    region: 'Bretagne',
    category: 'tourisme-balneaire',
    priceM2: { min: 4500, max: 5800 },
    regulation: { status: 'tendu', detail: "Quota d'autorisations dans l'Intra-muros depuis 2024. Compensation requise pour transformer un logement en meublé de tourisme dans la cité historique. Plafond 90 jours/an résidence principale.", compensation: true, localCommercialAlternative: false },
    t2: { caAnnualMin: 14000, caAnnualMax: 25000, occupancyMin: 58, occupancyMax: 75, nightlyMin: 70, nightlyMax: 130, rendementNetMin: 8, rendementNetMax: 14 },
    reliability: 'medium',
    publishAt: '2026-05-24',
    status: 'brouillon',
    neighbors: ['dinan', 'cancale', 'rennes'],
    context: 'Saisonnalité marquée (juillet-août = 50% du CA). Pic événementiel : Route du Rhum tous les 4 ans. Quartiers premium : Intra-muros, Saint-Servan.',
  },
  {
    slug: 'honfleur',
    name: 'Honfleur',
    region: 'Normandie',
    category: 'patrimoine',
    priceM2: { min: 4500, max: 6500 },
    regulation: { status: 'tendu', detail: "Très peu d'autorisations disponibles depuis 2024 (commune classée patrimoine). Compensation requise dans le centre historique. Plafond 90 jours/an résidence principale.", compensation: true, localCommercialAlternative: true },
    t2: { caAnnualMin: 13000, caAnnualMax: 23000, occupancyMin: 60, occupancyMax: 75, nightlyMin: 70, nightlyMax: 130, rendementNetMin: 8, rendementNetMax: 14 },
    reliability: 'medium',
    publishAt: '2026-05-26',
    status: 'brouillon',
    neighbors: ['deauville', 'cabourg', 'le-havre'],
    context: 'Demande couples week-end + courts séjours patrimoniaux. Saisonnalité modérée (avril-octobre). Quartiers premium : Vieux Bassin, Sainte-Catherine. Très peu d\'autorisations disponibles depuis 2024.',
  },
  {
    slug: 'deauville',
    name: 'Deauville',
    region: 'Normandie',
    category: 'tourisme-balneaire',
    priceM2: { min: 7500, max: 11000 },
    regulation: { status: 'restreint', detail: "Numéro d'enregistrement obligatoire. Quota partiel sur le front de mer. Plafond 90 jours/an résidence principale. Contrôles renforcés en saison touristique.", compensation: false, localCommercialAlternative: true },
    t2: { caAnnualMin: 16000, caAnnualMax: 30000, occupancyMin: 55, occupancyMax: 70, nightlyMin: 85, nightlyMax: 170, rendementNetMin: 5, rendementNetMax: 10 },
    reliability: 'medium',
    publishAt: '2026-05-28',
    status: 'brouillon',
    neighbors: ['honfleur', 'cabourg', 'trouville'],
    context: 'Forte saisonnalité (juillet-août + week-ends + festival du film américain). Prix d\'achat élevés. Quartiers premium : Front de mer, Centre, Cœur de ville.',
  },
  {
    slug: 'saint-tropez',
    name: 'Saint-Tropez',
    region: 'Provence-Alpes-Côte d\'Azur',
    category: 'tourisme-balneaire',
    priceM2: { min: 14000, max: 22000 },
    regulation: { status: 'restreint', detail: "Numéro d'enregistrement obligatoire. Quota partiel en centre-ville. Plafond 90 jours/an résidence principale. Marché ultra-premium avec peu d'autorisations dispos.", compensation: false, localCommercialAlternative: false },
    t2: { caAnnualMin: 28000, caAnnualMax: 55000, occupancyMin: 50, occupancyMax: 65, nightlyMin: 150, nightlyMax: 350, rendementNetMin: 4, rendementNetMax: 8 },
    reliability: 'high',
    publishAt: '2026-05-30',
    status: 'brouillon',
    neighbors: ['cannes', 'sainte-maxime', 'cogolin'],
    context: 'Saisonnalité extrême (juillet-août = 65% du CA, pic Voiles de Saint-Tropez). Marché ultra-premium. Prix d\'achat très élevés tirent le rendement net vers le bas malgré les tarifs records.',
  },
  {
    slug: 'antibes',
    name: 'Antibes',
    region: 'Provence-Alpes-Côte d\'Azur',
    category: 'tourisme-balneaire',
    priceM2: { min: 5500, max: 8000 },
    regulation: { status: 'restreint', detail: "Numéro d'enregistrement obligatoire. Pas de compensation pour l'instant mais quota envisagé pour le Vieil Antibes. Plafond 90 jours/an résidence principale.", compensation: false, localCommercialAlternative: true },
    t2: { caAnnualMin: 18000, caAnnualMax: 32000, occupancyMin: 60, occupancyMax: 75, nightlyMin: 85, nightlyMax: 160, rendementNetMin: 6, rendementNetMax: 12 },
    reliability: 'medium',
    publishAt: '2026-06-01',
    status: 'brouillon',
    neighbors: ['cannes', 'nice', 'juan-les-pins'],
    context: 'Pic juin-août. Quartiers premium : Vieil Antibes, Cap d\'Antibes, Juan-les-Pins. Demande aussi sur Yachting Festival et Jazz à Juan.',
  },
  {
    slug: 'bayonne',
    name: 'Bayonne',
    region: 'Nouvelle-Aquitaine',
    category: 'patrimoine',
    priceM2: { min: 4500, max: 5800 },
    regulation: { status: 'restreint', detail: "Numéro d'enregistrement obligatoire. Pas de compensation mais marché tendu (proximité Biarritz). Plafond 90 jours/an résidence principale.", compensation: false, localCommercialAlternative: true },
    t2: { caAnnualMin: 13000, caAnnualMax: 23000, occupancyMin: 62, occupancyMax: 76, nightlyMin: 65, nightlyMax: 120, rendementNetMin: 8, rendementNetMax: 14 },
    reliability: 'medium',
    publishAt: '2026-06-03',
    status: 'brouillon',
    neighbors: ['biarritz', 'anglet', 'saint-jean-de-luz'],
    context: 'Demande balnéaire (proximité Biarritz) + patrimoniale + événementielle (Fêtes de Bayonne). Quartiers premium : Grand Bayonne, Petit Bayonne, Saint-Esprit. Prix d\'achat plus accessibles que Biarritz.',
  },
  {
    slug: 'saint-jean-de-luz',
    name: 'Saint-Jean-de-Luz',
    region: 'Nouvelle-Aquitaine',
    category: 'tourisme-balneaire',
    priceM2: { min: 7500, max: 11000 },
    regulation: { status: 'tendu', detail: "Quota d'autorisations depuis 2024 (suite à la pression sur le marché basque). Compensation envisagée. Plafond 90 jours/an résidence principale.", compensation: false, localCommercialAlternative: true },
    t2: { caAnnualMin: 16000, caAnnualMax: 28000, occupancyMin: 58, occupancyMax: 73, nightlyMin: 80, nightlyMax: 150, rendementNetMin: 6, rendementNetMax: 11 },
    reliability: 'medium',
    publishAt: '2026-06-05',
    status: 'brouillon',
    neighbors: ['biarritz', 'bayonne', 'hendaye'],
    context: 'Saisonnalité marquée (juin-septembre). Quartiers premium : Front de mer, Centre. Marché tendu sur les biens de qualité.',
  },

  // ─── Stations de ski ────────────────────────────────────────────────
  {
    slug: 'annecy',
    name: 'Annecy',
    region: 'Auvergne-Rhône-Alpes',
    category: 'tourisme-balneaire',
    priceM2: { min: 6000, max: 9000 },
    regulation: { status: 'tendu', detail: "Quota d'autorisations strict dans la Vieille Ville et au bord du lac. Compensation requise depuis 2023. Plafond 90 jours/an résidence principale. Marché très tendu.", compensation: true, localCommercialAlternative: true },
    t2: { caAnnualMin: 18000, caAnnualMax: 32000, occupancyMin: 68, occupancyMax: 82, nightlyMin: 85, nightlyMax: 150, rendementNetMin: 7, rendementNetMax: 13 },
    reliability: 'high',
    publishAt: '2026-06-07',
    status: 'brouillon',
    neighbors: ['chamonix', 'megeve', 'aix-les-bains'],
    context: 'Double saison été (lac) + hiver (ski). Quartiers premium : Vieille Ville, Bord du Lac. Marché tendu avec quota d\'autorisations Loi Le Meur.',
  },
  {
    slug: 'chamonix',
    name: 'Chamonix',
    region: 'Auvergne-Rhône-Alpes',
    category: 'station-ski',
    priceM2: { min: 8500, max: 13000 },
    regulation: { status: 'restreint', detail: "Numéro d'enregistrement obligatoire. Pas de quota global mais autorisations encadrées. Plafond 90 jours/an résidence principale. Marché tendu en saison hiver et été.", compensation: false, localCommercialAlternative: true },
    t2: { caAnnualMin: 22000, caAnnualMax: 42000, occupancyMin: 65, occupancyMax: 82, nightlyMin: 100, nightlyMax: 200, rendementNetMin: 6, rendementNetMax: 11 },
    reliability: 'high',
    publishAt: '2026-06-09',
    status: 'brouillon',
    neighbors: ['megeve', 'saint-gervais', 'les-houches'],
    context: 'Double saison été (alpinisme, randonnée) + hiver (ski). Demande internationale forte. Quartiers premium : Centre, Praz, Argentière. Pic Ultra-Trail du Mont-Blanc en août.',
  },
  {
    slug: 'megeve',
    name: 'Megève',
    region: 'Auvergne-Rhône-Alpes',
    category: 'station-ski',
    priceM2: { min: 11000, max: 18000 },
    regulation: { status: 'restreint', detail: "Numéro d'enregistrement obligatoire. Marché premium peu régulé. Plafond 90 jours/an résidence principale. Quota envisagé pour 2027.", compensation: false, localCommercialAlternative: true },
    t2: { caAnnualMin: 24000, caAnnualMax: 45000, occupancyMin: 60, occupancyMax: 78, nightlyMin: 110, nightlyMax: 220, rendementNetMin: 5, rendementNetMax: 10 },
    reliability: 'medium',
    publishAt: '2026-06-11',
    status: 'brouillon',
    neighbors: ['chamonix', 'saint-gervais', 'flaine'],
    context: 'Marché premium ski/montagne. Saison hiver concentre 60% du CA. Prix d\'achat très élevés. Quartiers premium : Centre, Mont d\'Arbois, Rochebrune.',
  },

  // ─── Patrimoine / villes moyennes ──────────────────────────────────
  {
    slug: 'aix-en-provence',
    name: 'Aix-en-Provence',
    region: 'Provence-Alpes-Côte d\'Azur',
    category: 'patrimoine',
    priceM2: { min: 5200, max: 7500 },
    regulation: { status: 'restreint', detail: "Numéro d'enregistrement obligatoire. Pas de compensation pour le moment. Quota envisagé pour le centre historique. Plafond 90 jours/an résidence principale.", compensation: false, localCommercialAlternative: true },
    t2: { caAnnualMin: 15000, caAnnualMax: 26000, occupancyMin: 65, occupancyMax: 78, nightlyMin: 80, nightlyMax: 140, rendementNetMin: 7, rendementNetMax: 12 },
    reliability: 'medium',
    publishAt: '2026-06-13',
    status: 'brouillon',
    neighbors: ['marseille', 'avignon', 'cassis'],
    context: 'Demande mixte tourisme + étudiants + festivals (Festival d\'Art Lyrique). Quartiers premium : Mazarin, Centre Historique. Saisonnalité étalée sur juin-octobre.',
  },
  {
    slug: 'avignon',
    name: 'Avignon',
    region: 'Provence-Alpes-Côte d\'Azur',
    category: 'patrimoine',
    priceM2: { min: 3500, max: 4800 },
    regulation: { status: 'libre', detail: "Numéro d'enregistrement obligatoire. Pas de quota. Plafond 90 jours/an résidence principale. Marché accessible.", compensation: false, localCommercialAlternative: true },
    t2: { caAnnualMin: 13000, caAnnualMax: 23000, occupancyMin: 62, occupancyMax: 76, nightlyMin: 70, nightlyMax: 125, rendementNetMin: 8, rendementNetMax: 14 },
    reliability: 'medium',
    publishAt: '2026-06-15',
    status: 'brouillon',
    neighbors: ['aix-en-provence', 'nimes', 'arles'],
    context: 'Pic Festival d\'Avignon (juillet) avec tarifs × 3-4. Quartiers premium : Intra-muros, Place de l\'Horloge. Hors festival, demande modérée.',
  },
  {
    slug: 'carcassonne',
    name: 'Carcassonne',
    region: 'Occitanie',
    category: 'patrimoine',
    priceM2: { min: 2200, max: 3000 },
    regulation: { status: 'libre', detail: "Numéro d'enregistrement obligatoire. Pas de quota. Plafond 90 jours/an résidence principale. Marché très accessible aux nouveaux investisseurs.", compensation: false, localCommercialAlternative: true },
    t2: { caAnnualMin: 11000, caAnnualMax: 19000, occupancyMin: 60, occupancyMax: 73, nightlyMin: 60, nightlyMax: 110, rendementNetMin: 9, rendementNetMax: 15 },
    reliability: 'low',
    publishAt: '2026-06-17',
    status: 'brouillon',
    neighbors: ['narbonne', 'toulouse', 'perpignan'],
    context: 'Tourisme patrimoine (Cité médiévale UNESCO). Saisonnalité avril-octobre. Quartiers premium : Cité, Bastide Saint-Louis. Prix d\'achat très accessibles = bons rendements.',
  },
  {
    slug: 'colmar',
    name: 'Colmar',
    region: 'Grand Est',
    category: 'patrimoine',
    priceM2: { min: 3000, max: 4000 },
    regulation: { status: 'libre', detail: "Numéro d'enregistrement obligatoire. Pas de quota. Plafond 90 jours/an résidence principale. Marché accessible.", compensation: false, localCommercialAlternative: true },
    t2: { caAnnualMin: 12000, caAnnualMax: 21000, occupancyMin: 60, occupancyMax: 75, nightlyMin: 65, nightlyMax: 115, rendementNetMin: 9, rendementNetMax: 15 },
    reliability: 'low',
    publishAt: '2026-06-19',
    status: 'brouillon',
    neighbors: ['strasbourg', 'mulhouse', 'eguisheim'],
    context: 'Pic décembre (marché de Noël = 25% du CA en 5 semaines). Demande aussi été (Route des Vins). Quartiers premium : Petite Venise, Centre.',
  },
  {
    slug: 'sarlat',
    name: 'Sarlat',
    region: 'Nouvelle-Aquitaine',
    category: 'patrimoine',
    priceM2: { min: 2500, max: 3500 },
    regulation: { status: 'libre', detail: "Numéro d'enregistrement obligatoire. Pas de quota dans cette commune patrimoniale. Plafond 90 jours/an résidence principale. Marché très accessible — opportunités pour rendement net élevé.", compensation: false, localCommercialAlternative: true },
    t2: { caAnnualMin: 11000, caAnnualMax: 19000, occupancyMin: 55, occupancyMax: 70, nightlyMin: 60, nightlyMax: 110, rendementNetMin: 9, rendementNetMax: 15 },
    reliability: 'low',
    publishAt: '2026-06-21',
    status: 'brouillon',
    neighbors: ['bordeaux', 'rocamadour', 'bergerac'],
    context: 'Tourisme patrimoine (médiéval) + gastronomie (foie gras). Saisonnalité avril-octobre. Pas de quota Loi Le Meur. Prix d\'achat très bas = rendements parmi les meilleurs.',
  },

  // ─── Métropoles secondaires ─────────────────────────────────────────
  {
    slug: 'rennes',
    name: 'Rennes',
    region: 'Bretagne',
    category: 'metropole',
    priceM2: { min: 3700, max: 4800 },
    regulation: { status: 'libre', detail: "Numéro d'enregistrement obligatoire. Pas de quota. Plafond 90 jours/an résidence principale. Marché accessible.", compensation: false, localCommercialAlternative: true },
    t2: { caAnnualMin: 11000, caAnnualMax: 20000, occupancyMin: 65, occupancyMax: 78, nightlyMin: 60, nightlyMax: 100, rendementNetMin: 9, rendementNetMax: 15 },
    reliability: 'low',
    publishAt: '2026-06-23',
    status: 'brouillon',
    neighbors: ['saint-malo', 'nantes', 'brest'],
    context: 'Demande étudiants + voyageurs d\'affaires. Quartiers premium : Centre Historique, Thabor, Sainte-Anne. Saisonnalité modérée. Prix d\'achat accessibles pour la Bretagne.',
  },
  {
    slug: 'ajaccio',
    name: 'Ajaccio',
    region: 'Corse',
    category: 'tourisme-balneaire',
    priceM2: { min: 4500, max: 6000 },
    regulation: { status: 'restreint', detail: "Numéro d'enregistrement obligatoire. Pas de compensation mais saisonnalité forte concentre les contrôles l'été. Plafond 90 jours/an résidence principale.", compensation: false, localCommercialAlternative: true },
    t2: { caAnnualMin: 14000, caAnnualMax: 25000, occupancyMin: 58, occupancyMax: 73, nightlyMin: 75, nightlyMax: 145, rendementNetMin: 7, rendementNetMax: 13 },
    reliability: 'low',
    publishAt: '2026-06-25',
    status: 'brouillon',
    neighbors: ['bastia', 'porto-vecchio', 'calvi'],
    context: 'Saisonnalité marquée (juin-septembre = 55% du CA). Quartiers premium : Centre Historique, Sanguinaires. Prix d\'achat plus accessibles que la Côte d\'Azur pour profil similaire.',
  },
];

// Helpers
export function getCityRentabiliteBySlug(slug: string): CityRentabilite | undefined {
  return citiesRentabilite.find((c) => c.slug === slug);
}

export function getPublishedCitiesRentabilite(): CityRentabilite[] {
  return citiesRentabilite.filter((c) => c.status === 'en-ligne');
}

export function getCitiesRentabiliteByCategory(category: CityRentabilite['category']): CityRentabilite[] {
  return citiesRentabilite.filter((c) => c.category === category);
}

export function getNeighborsRentabilite(slug: string): CityRentabilite[] {
  const city = getCityRentabiliteBySlug(slug);
  if (!city) return [];
  return city.neighbors
    .map((n) => getCityRentabiliteBySlug(n))
    .filter((c): c is CityRentabilite => c !== undefined);
}
