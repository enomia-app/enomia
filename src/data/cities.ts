// Data source for dynamic city pages at /conciergerie-airbnb-[slug]
// Each entry = 1 article de plusieurs milliers de mots.
// Les sections partagées (critères, pièges, "gérer soi-même") sont dans le template [slug].astro.
// Les sections variables (stats locales, conciergeries, quartiers, régulation, FAQ) sont ici.

export type Conciergerie = {
  name: string;
  url?: string;
  commission: string;
  menage: 'refacturé voyageur' | 'inclus dans commission' | 'variable';
  rating: number;
  reviews: number;
  biensGeres: number;
  specialty: string;
  description: string;
};

export type Neighborhood = {
  name: string;
  pricePerNight: string; // "95-125 €"
  occupancy: number; // pourcentage
  description: string;
  roiBrut: string; // "5 à 6 %"
};

export type CityFaq = { q: string; a: string };

export type Region = {
  slug: string;
  displayName: string;
  description: string;
};

export const regions: Region[] = [
  { slug: 'auvergne-rhone-alpes', displayName: 'Auvergne-Rhône-Alpes', description: 'Région dynamique portée par Lyon, Annecy et les stations alpines. Le marché LCD y est mature avec une forte saisonnalité hiver/été.' },
  { slug: 'alsace', displayName: 'Grand Est', description: 'Strasbourg, Colmar et le vignoble alsacien attirent un tourisme culturel et événementiel toute l\'année. Le marché LCD reste accessible avec des rendements solides.' },
  { slug: 'hauts-de-france', displayName: 'Hauts-de-France', description: 'Lille et sa métropole européenne, à 1h de Paris, Londres et Bruxelles. Un marché LCD en croissance porté par le tourisme d\'affaires et les événements.' },
  { slug: 'nouvelle-aquitaine', displayName: 'Nouvelle-Aquitaine', description: 'De Bordeaux au Bassin d\'Arcachon en passant par Biarritz, la région offre un potentiel LCD exceptionnel entre œnotourisme et littoral atlantique.' },
  { slug: 'occitanie', displayName: 'Occitanie', description: 'Toulouse, Montpellier et la côte méditerranéenne. Un marché LCD en forte croissance, porté par le dynamisme économique et le tourisme balnéaire.' },
  { slug: 'provence-alpes-cote-dazur', displayName: 'Provence-Alpes-Côte d\'Azur', description: 'Nice, Marseille, Aix-en-Provence : la région concentre les plus fortes demandes LCD de France avec une saisonnalité marquée et des tarifs élevés.' },
  { slug: 'ile-de-france', displayName: 'Île-de-France', description: 'Paris et sa couronne, premier marché LCD de France et d\'Europe. La capitale concentre plus de 50 000 annonces actives et une demande touristique mondiale toute l\'année.' },
  { slug: 'pays-de-la-loire', displayName: 'Pays de la Loire', description: 'Des Sables-d\'Olonne à La Baule en passant par Nantes, la région combine littoral atlantique, îles et métropoles. La Vendée est le 2e département touristique de France avec un marché LCD très saisonnier.' },
  { slug: 'bretagne', displayName: 'Bretagne', description: 'De Rennes à Saint-Malo en passant par Brest et Quiberon, la Bretagne combine tourisme balnéaire, patrimoine celte et marché étudiant. Rennes est un des marchés locatifs les plus tendus de France.' },
  { slug: 'normandie', displayName: 'Normandie', description: 'Rouen, Honfleur, Deauville, Étretat : la Normandie mixe tourisme culturel, impressionnisme et plages du Débarquement. Proximité immédiate de Paris et événements emblématiques (L\'Armada, Festival du Film Américain).' },
  { slug: 'maroc', displayName: 'Maroc', description: 'Marrakech, Essaouira et Agadir attirent les investisseurs francophones avec des rendements locatifs de 6 à 8 %. Un marché LCD en pleine reprise, porté par le tourisme international et une fiscalité compétitive.' },
];

export type City = {
  slug: string;
  displayName: string;
  region: string;
  regionSlug: string;

  // SEO
  title: string;
  metaTitle: string;
  metaDescription: string;
  kwPrincipal: string;
  kwSecondaires: string[];

  // Local market
  population: number;
  tourists: number;
  activeListings: number;
  priceLow: number;
  priceHigh: number;
  occupancyRate: number; // %
  revpar: number;
  seasonality: string;
  rankNational: number; // 1-10 position nationale LCD

  // Content variables
  introCustom: string;
  marketIntro: string; // 1-2 paragraphs unique to city
  conciergeries: Conciergerie[];
  neighborhoods: Neighborhood[];
  regulation: string; // Multi-paragraph
  concreteExample: {
    bienType: string;
    surface: number;
    pricePerNight: number;
    neighborhood: string;
    revenuBrut: number;
    commissionRate: number; // 0.20 for 20%
    menageCount: number;
    menageUnitCost: number;
  };
  extraFaq: CityFaq[];
  updatedAt: string; // ISO date
};

export const cities: City[] = [
  // ==========================================================================
  // BORDEAUX (pilote)
  // ==========================================================================
  {
    slug: 'bordeaux',
    displayName: 'Bordeaux',
    region: 'Nouvelle-Aquitaine',
    regionSlug: 'nouvelle-aquitaine',
    title: 'Conciergerie Bordeaux Airbnb : comparatif 2026 des 7 meilleures agences',
    metaTitle: 'Conciergerie Bordeaux Airbnb : Comparatif 2026 (tarifs & avis)',
    metaDescription:
      "Comparatif neutre des 7 meilleures conciergeries Airbnb de Bordeaux. Tarifs (15-30%), services, avis, réglementation 2026, quartiers rentables. Guide complet.",
    kwPrincipal: 'conciergerie bordeaux',
    kwSecondaires: [
      'conciergerie airbnb bordeaux',
      'conciergerie bordeaux airbnb',
      'meilleure conciergerie bordeaux',
      'tarif conciergerie bordeaux',
    ],
    population: 260000,
    tourists: 7000000,
    activeListings: 8500,
    priceLow: 95,
    priceHigh: 135,
    occupancyRate: 72,
    revpar: 78,
    seasonality: 'Pics en juin (Bordeaux Fête le Vin), septembre (rentrée + vendanges), décembre (Marché de Noël)',
    rankNational: 5,
    introCustom:
      "Vous avez un appartement à Bordeaux que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée. Entre les check-in à minuit, les lessives qui s'accumulent et les messages des voyageurs en anglais, vous vous demandez si confier la gestion à une conciergerie est vraiment rentable. Et surtout : laquelle choisir ?",
    marketIntro:
      "Bordeaux figure dans le top 5 des villes françaises pour le rendement locatif courte durée, derrière Paris, Nice, Cannes et juste devant Lyon. Le ticket d'entrée y est encore accessible (un T2 à Saint-Michel démarre autour de 180 000 €), mais la réglementation se durcit rapidement. La ville classée UNESCO attire une clientèle mixte : tourisme œnologique, city-breaks européens, voyageurs d'affaires pour le quartier Euratlantique.",
    conciergeries: [
      {
        name: "Les Clés d'Alfred",
        url: 'https://lesclesdalfred.fr/',
        commission: '17,5 % saisonnier / 15 % moyenne durée',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 180,
        biensGeres: 250,
        specialty: 'Transparence & appli mobile',
        description:
          "Installée à Bordeaux depuis 2016, Les Clés d'Alfred a construit sa réputation sur deux éléments : une grille tarifaire publique sur son site (rare dans le métier) et une application mobile qui permet au propriétaire de suivre ses revenus en temps réel. Commission de 17,5 % en saisonnier, 15 % en moyenne durée (bail mobilité). Le ménage est refacturé au voyageur, ce qui préserve entièrement votre marge. Couverture : Bordeaux intra-muros + première couronne (Le Bouscat, Caudéran, Talence). Le point faible : peu de biens dans le sud Gironde.",
      },
      {
        name: 'Cocoonr Bordeaux',
        url: 'https://cocoonr.fr/conciergerie-bnb-bordeaux/',
        commission: '20 %',
        menage: 'inclus dans commission',
        rating: 4.7,
        reviews: 210,
        biensGeres: 180,
        specialty: 'Réseau national, couverture large',
        description:
          "Cocoonr est un des plus gros acteurs français avec plus de 2 000 biens gérés dans 15 villes. L'agence bordelaise est dirigée par Virginie Faye Duquesne depuis 2018. Commission standard de 20 %, ménage inclus dans la commission (attention : cela grève votre rentabilité sur les séjours courts, car vous payez le ménage même si le voyageur ne l'aurait pas payé). Avantage clé : couverture géographique très large (13 communes autour de Bordeaux, dont Bruges, Gradignan, Villenave-d'Ornon, Pessac). Idéal si votre bien est en périphérie.",
      },
      {
        name: 'YourHostHelper Bordeaux',
        url: 'https://yourhosthelper.com/agence-bordeaux/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.6,
        reviews: 140,
        biensGeres: 150,
        specialty: 'Photos pros & pricing dynamique',
        description:
          "Filiale de YourHostHelper (actif dans 20+ villes), cette conciergerie mise tout sur l'optimisation du revenu via un pricing dynamique quotidien et des photos professionnelles incluses gratuitement au lancement. Commission de 20 %, ménage refacturé voyageur. Le propriétaire bénéficie d'un dashboard avec prévisions de revenus et recommandations d'optimisation. Moins adaptée aux biens atypiques ou de luxe, mais excellent sur les T1-T2 standards en centre-ville.",
      },
      {
        name: 'Hôte de Gamme',
        url: 'https://hote-de-gamme.fr/conciergerie-gironde/conciergerie-a-bordeaux/',
        commission: '30 %',
        menage: 'inclus dans commission',
        rating: 4.9,
        reviews: 75,
        biensGeres: 60,
        specialty: 'Biens haut de gamme (>120 €/nuit)',
        description:
          "Positionnée sur le segment premium (biens > 120 €/nuit), Hôte de Gamme assume une commission élevée de 30 % mais inclut photos pro, mise en scène (staging), pricing dynamique, accueil personnalisé, plateaux de bienvenue. Clientèle cible : propriétaires d'appartements de standing dans le Triangle d'Or, aux Chartrons, aux Quinconces, ou de villas à Arcachon. Si votre bien est standard (T2 Saint-Michel à 70 €/nuit), le rapport qualité/prix ne sera pas là. Mais pour un 3 pièces haussmannien rue Notre-Dame, la différence se voit dans le niveau des voyageurs attirés.",
      },
      {
        name: 'Mary Poppins',
        url: 'https://www.marypoppins-conciergerie.fr/',
        commission: '20-22 %',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 120,
        biensGeres: 90,
        specialty: "Service à l'ancienne, relationnel fort",
        description:
          "Petite structure (3 personnes), Mary Poppins compense sa taille par une relation directe avec chaque propriétaire. Commission 20-22 % selon le type de bien, ménage refacturé voyageur. Points forts : réactivité (délai de réponse moyen < 15 min), connaissance intime du centre historique, réseau d'artisans locaux. Point faible : capacité limitée, liste d'attente fréquente.",
      },
      {
        name: 'YouNeedMe Bordeaux',
        url: 'https://www.youneedme-bordeaux.com',
        commission: '18 %',
        menage: 'refacturé voyageur',
        rating: 4.6,
        reviews: 95,
        biensGeres: 70,
        specialty: 'Meilleur rapport qualité/prix',
        description:
          "L'une des rares conciergeries à afficher une commission de 18 %, significativement sous le marché. Le modèle tient parce que l'entreprise a automatisé une grande partie de ses processus (messagerie voyageurs semi-automatisée, planification ménage via algorithme). Risque : moins de chaleur humaine, réponses parfois génériques aux voyageurs pointilleux.",
      },
      {
        name: 'Ze-Bordeaux',
        url: 'https://www.ze-bordeaux.fr/',
        commission: '19 %',
        menage: 'variable',
        rating: 4.5,
        reviews: 60,
        biensGeres: 50,
        specialty: 'Spécialiste centre historique',
        description:
          "Agence locale focalisée exclusivement sur l'hypercentre (Saint-Pierre, Chartrons, Triangle d'Or, Victoire). Commission 19 %. Son ancrage ultra-local lui permet d'avoir des équipes à pied partout en < 10 minutes — précieux pour les urgences. Attention : si votre bien est à Mérignac, Pessac ou Arcachon, ils ne pourront pas vous aider.",
      },
    ],
    neighborhoods: [
      {
        name: "Triangle d'Or (Quinconces, Tourny, Grand Théâtre)",
        pricePerNight: '130-180 €',
        occupancy: 78,
        description:
          "Le quartier le plus cher mais aussi le plus demandé par la clientèle affaires et les touristes premium. Immeubles haussmanniens, parquets, moulures. Ticket d'entrée pour un T2 : à partir de 350 000 €.",
        roiBrut: '4,5 à 5 %',
      },
      {
        name: 'Chartrons',
        pricePerNight: '95-125 €',
        occupancy: 74,
        description:
          'Quartier bobo historique, forte identité, nombreux cafés. Excellent compromis prix d\'achat / rendement. T2 à partir de 250 000 €. Notre coup de cœur pour un premier investissement à Bordeaux.',
        roiBrut: '5 à 6 %',
      },
      {
        name: 'Saint-Pierre (hypercentre médiéval)',
        pricePerNight: '100-140 €',
        occupancy: 76,
        description:
          'Rues pavées, restos, ambiance carte postale. Attention aux contraintes : peu de parking, copropriétés anciennes parfois hostiles à la location courte durée. Vérifiez le règlement de copropriété avant d\'acheter.',
        roiBrut: '4,5 à 5,5 %',
      },
      {
        name: 'Saint-Michel / Capucins',
        pricePerNight: '70-90 €',
        occupancy: 68,
        description:
          'Le quartier populaire qui gentrifie. Prix d\'achat encore accessibles (T2 dès 180 000 €). Clientèle plus jeune, séjours plus courts. Parfait pour un premier investissement.',
        roiBrut: '6,5 à 7,5 %',
      },
      {
        name: 'Bacalan / Bassins à Flot',
        pricePerNight: '85-115 €',
        occupancy: 70,
        description:
          'Le quartier qui monte depuis la Cité du Vin. Immobilier neuf ou réhabilité, clientèle familiale et couples.',
        roiBrut: '5 à 6 %',
      },
      {
        name: 'La Bastide (rive droite)',
        pricePerNight: '75-95 €',
        occupancy: 66,
        description:
          'En face de la Bourse, accessible par le pont de Pierre ou le tram. Prix plus doux (T2 dès 170 000 €). Moins central, donc légèrement plus difficile à remplir en basse saison.',
        roiBrut: '6 à 7 %',
      },
    ],
    regulation:
      "Bordeaux fait partie des **villes en zone tendue**, ce qui déclenche plusieurs obligations.\n\n**Enregistrement obligatoire.** Depuis 2018, toute location meublée touristique doit être déclarée à la mairie, qui attribue un **numéro à 13 chiffres** obligatoire sur l'annonce Airbnb. Amende jusqu'à **10 000 €** en cas d'absence.\n\n**Limite de 120 nuitées/an.** La résidence principale est plafonnée à 120 nuitées par an. Au-delà, le bien bascule en résidence secondaire avec un régime différent.\n\n**Changement d'usage (résidence secondaire).** Pour une résidence secondaire dédiée à la location courte durée, un **changement d'usage** à la mairie est obligatoire, avec compensation (convertir un bureau en logement ailleurs) de plus en plus difficile à obtenir depuis la **loi Le Meur 2024**.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** De **0,65 € à 5 €** par nuit et par voyageur adulte selon le classement du bien, collectée automatiquement par Airbnb.",
    concreteExample: {
      bienType: 'T2',
      surface: 40,
      pricePerNight: 85,
      neighborhood: 'Chartrons',
      revenuBrut: 22355,
      commissionRate: 0.2,
      menageCount: 75,
      menageUnitCost: 45,
    },
    extraFaq: [
      {
        q: "Est-ce que les quartiers autour de Bordeaux (Mérignac, Pessac) sont couverts ?",
        a: "La plupart des grandes conciergeries (Cocoonr, YourHostHelper) couvrent Mérignac, Pessac, Talence et Villenave-d'Ornon. Les conciergeries ultra-locales (Ze-Bordeaux, Mary Poppins) sont centrées sur l'hypercentre. Demandez explicitement si votre commune est dans leur zone d'intervention avant de signer.",
      },
      {
        q: "Quel impact de la loi Le Meur 2024 sur la location Airbnb à Bordeaux ?",
        a: "La loi Le Meur a renforcé les pouvoirs des maires en zone tendue. À Bordeaux, cela se traduit par une politique de changement d'usage plus restrictive et des contrôles plus fréquents sur les déclarations. Si vous comptez acheter pour faire de la location courte durée exclusivement, vérifiez d'abord auprès du service urbanisme de la mairie si votre projet est réalisable dans votre quartier visé.",
      },
      {
        q: "Le marché Airbnb bordelais est-il saturé ?",
        a: "Avec 8 500 annonces actives en permanence et un taux d'occupation moyen de 72 %, le marché est compétitif mais pas saturé. Les biens bien positionnés (Chartrons, Saint-Pierre, Triangle d'Or) restent très demandés. Les biens hors centre peinent davantage hors saison. La différenciation passe par la qualité des photos, des équipements (clim, machine à laver, wifi fibre) et du pricing.",
      },
    ],
    updatedAt: '2026-04-09',
  },

  // ==========================================================================
  // LYON
  // ==========================================================================
  {
    slug: 'lyon',
    displayName: 'Lyon',
    region: 'Auvergne-Rhône-Alpes',
    regionSlug: 'auvergne-rhone-alpes',
    title: 'Conciergerie Lyon Airbnb : comparatif 2026 des 7 meilleures agences',
    metaTitle: 'Conciergerie Lyon Airbnb : Comparatif 2026 (tarifs & avis)',
    metaDescription:
      "Comparatif neutre des 7 meilleures conciergeries Airbnb de Lyon. Tarifs (15-25%), services, avis, réglementation 2026, meilleurs quartiers. Guide complet.",
    kwPrincipal: 'conciergerie lyon',
    kwSecondaires: [
      'conciergerie airbnb lyon',
      'conciergerie lyon airbnb',
      'meilleure conciergerie lyon',
      'tarif conciergerie lyon',
    ],
    population: 522000,
    tourists: 6000000,
    activeListings: 11500,
    priceLow: 80,
    priceHigh: 120,
    occupancyRate: 78,
    revpar: 74,
    seasonality: 'Pics en mai (Foire de Lyon), septembre (Biennale), décembre (Fête des Lumières)',
    rankNational: 4,
    introCustom:
      "Vous avez un appartement à Lyon que vous louez sur Airbnb ou que vous envisagez de passer en location courte durée. La ville affiche 11 500 annonces actives et un taux d'occupation moyen de 78 %, parmi les plus élevés de France. Mais la concurrence est féroce, le pricing complexe, et la réglementation lyonnaise compte parmi les plus strictes de l'Hexagone. Choisir la bonne conciergerie devient déterminant.",
    marketIntro:
      "Lyon est le 4e marché Airbnb de France en volume, avec un revenu médian de 1 300 € par mois par annonce (AirDNA 2025). La clientèle y est mixte : touristes (Vieux Lyon UNESCO, Fourvière, gastronomie), voyageurs d'affaires (Part-Dieu, Confluence, Gerland), étudiants Erasmus (bail mobilité). Le marché s'est durci depuis 2024 avec l'obligation d'enregistrement mairie et les restrictions dans certains arrondissements du centre (1er, 2e, 6e). Les conciergeries locales ont dû monter en gamme pour rester compétitives.",
    conciergeries: [
      {
        name: 'La Conciergerie Lyonnaise',
        url: 'https://www.laconciergerie-lyonnaise.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 5.0,
        reviews: 65,
        biensGeres: 80,
        specialty: 'Relation humaine & expertise locale',
        description:
          "Petite structure indépendante à taille humaine, dirigée depuis Lyon 6. Commission 20 % stable. Points forts : conseil personnalisé, relation directe avec le gérant, excellente note Google. Bon choix pour un propriétaire avec 1-2 biens qui cherche une vraie relation humaine plutôt qu'un service industriel.",
      },
      {
        name: 'Welkeys Lyon',
        url: 'https://www.welkeys.com/conciergerie-airbnb/lyon',
        commission: '20-22 %',
        menage: 'refacturé voyageur',
        rating: 4.6,
        reviews: 140,
        biensGeres: 180,
        specialty: 'Technologie & reporting',
        description:
          "Welkeys est un acteur national présent dans plusieurs grandes villes françaises. À Lyon, ils gèrent environ 180 biens avec une stack technologique moderne : channel manager propriétaire, serrures connectées, dashboard temps réel. Commission 20-22 %. Bon rapport qualité/service mais relation plus distante que les indépendants.",
      },
      {
        name: 'GuestReady Lyon',
        url: 'https://www.guestready.com/airbnb-management/lyon/',
        commission: '25 %',
        menage: 'inclus dans commission',
        rating: 4.5,
        reviews: 160,
        biensGeres: 200,
        specialty: 'Réseau international',
        description:
          "GuestReady gère plus de 2 000 biens à travers l'Europe. Commission élevée (25 %) justifiée par une offre très complète : photos pro, pricing dynamique, conciergerie 24/7 multilingue, gestion des litiges. Le ménage est inclus dans la commission — attention à la rentabilité sur les séjours courts. Adapté aux propriétaires expatriés qui veulent zéro gestion.",
      },
      {
        name: 'Hostnfly Lyon',
        url: 'https://hostnfly.com/conciergerie-airbnb/lyon',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.5,
        reviews: 185,
        biensGeres: 220,
        specialty: "#1 France en volume",
        description:
          "Hostnfly est le plus gros acteur français en termes de biens gérés (plus de 4 000 en France). À Lyon, environ 220 biens. Commission 20 %, process très industriels mais efficaces. Délai de réponse voyageurs < 10 min en moyenne. Excellent pour un propriétaire qui veut de la prévisibilité et peu d'interactions.",
      },
      {
        name: 'Conciergerie Shaouch Lyonnais',
        url: 'https://conciergerie-shaouch-lyonnais.webflow.io/',
        commission: '15 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 45,
        biensGeres: 35,
        specialty: 'Commission la plus basse',
        description:
          "Structure indépendante qui casse les prix à 15 % de commission — la plus basse du marché lyonnais. Le modèle tient par l'automatisation (messagerie semi-auto, planning ménage algorithmique) et une équipe réduite. Parfait pour un propriétaire sensible au prix. Limite : capacité d'absorption réduite, peu adapté aux biens atypiques nécessitant du cas par cas.",
      },
      {
        name: 'All in Lyon',
        commission: '20 % (avec ménage refacturé) / 25 % (complet)',
        menage: 'variable',
        rating: 4.4,
        reviews: 101,
        biensGeres: 120,
        specialty: 'Formules à la carte',
        description:
          "Un des plus anciens acteurs lyonnais (depuis 2016). Deux formules : 20 % avec ménage refacturé voyageur, ou 25 % tout inclus (photos, ménage, linge). L'entreprise propose aussi une offre à la carte pour les propriétaires qui veulent garder la main sur certains aspects.",
      },
      {
        name: 'Conciergerie des Canuts',
        commission: '20-25 %',
        menage: 'refacturé voyageur',
        rating: 5.0,
        reviews: 35,
        biensGeres: 40,
        specialty: 'Spécialiste Croix-Rousse & Vieux Lyon',
        description:
          "Petite conciergerie ultra-locale sur Lyon 1 et Lyon 4 (Croix-Rousse, Vieux Lyon, Presqu'île). Tarifs 20-25 % selon formule. Points forts : connaissance intime des copropriétés anciennes des quartiers historiques, excellente réactivité. Limite : zone d'intervention très restreinte.",
      },
    ],
    neighborhoods: [
      {
        name: 'Presqu\'île (Lyon 2)',
        pricePerNight: '95-140 €',
        occupancy: 82,
        description:
          "Le cœur touristique et commerçant de Lyon : Bellecour, Cordeliers, Hôtel-de-Ville. Clientèle premium, courts séjours, forte demande en haute saison. Ticket d'entrée élevé (T2 : 350 000 €+).",
        roiBrut: '4,5 à 5 %',
      },
      {
        name: 'Vieux Lyon (Lyon 5) — UNESCO',
        pricePerNight: '85-130 €',
        occupancy: 80,
        description:
          "Traboules, Renaissance, gastronomie. Excellent taux d'occupation mais contraintes copropriétés (beaucoup d'immeubles classés). T2 : 280 000 €+.",
        roiBrut: '5 à 5,5 %',
      },
      {
        name: 'Croix-Rousse (Lyon 1 & 4)',
        pricePerNight: '75-110 €',
        occupancy: 76,
        description:
          "Quartier bohème des canuts, très demandé par les 30-45 ans. Rapport qualité-prix attractif. T2 : 230 000 €+.",
        roiBrut: '5,5 à 6,5 %',
      },
      {
        name: 'Part-Dieu / Brotteaux (Lyon 3 & 6)',
        pricePerNight: '85-120 €',
        occupancy: 78,
        description:
          "Quartier affaires et gare Part-Dieu, clientèle voyageurs d'affaires. Forte demande en semaine, plus calme le week-end. Excellent pour bail mobilité.",
        roiBrut: '5 à 6 %',
      },
      {
        name: 'Confluence (Lyon 2 sud)',
        pricePerNight: '90-130 €',
        occupancy: 74,
        description:
          "Quartier neuf et design, immobilier de standing. Clientèle internationale, couples, courts séjours. T2 : 300 000 €+.",
        roiBrut: '4,5 à 5,5 %',
      },
      {
        name: 'Guillotière / Jean-Macé (Lyon 7)',
        pricePerNight: '65-90 €',
        occupancy: 70,
        description:
          "Quartier multiculturel qui gentrifie, prix encore accessibles (T2 dès 200 000 €). Clientèle jeune, séjours étudiants, bail mobilité.",
        roiBrut: '6 à 7 %',
      },
    ],
    regulation:
      "Lyon est l'une des **villes françaises avec la réglementation la plus stricte** sur la location courte durée.\n\n**Enregistrement en mairie.** Obligatoire depuis 2019, avec **numéro à 13 chiffres** affiché sur l'annonce Airbnb.\n\n**Limite 120 nuitées/an.** Pour les résidences principales, **contrôlée activement** par la mairie (courriers d'avertissement en cas de dépassement).\n\n**Compensation obligatoire dans l'hypercentre.** Depuis 2024, le changement d'usage pour les résidences secondaires exige une compensation dans les **1er, 2e, 3e, 6e et 7e arrondissements** : convertir une surface équivalente de bureau en logement dans le même arrondissement, ou verser une compensation financière. Cette règle rend **quasi impossible** l'achat d'un bien dédié à la LCD dans l'hypercentre pour un nouvel investisseur.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** De **0,85 € à 5 €** par nuit et par adulte.",
    concreteExample: {
      bienType: 'T2',
      surface: 38,
      pricePerNight: 95,
      neighborhood: 'Croix-Rousse',
      revenuBrut: 27018,
      commissionRate: 0.2,
      menageCount: 82,
      menageUnitCost: 48,
    },
    extraFaq: [
      {
        q: "Puis-je encore acheter un bien dédié à la location courte durée à Lyon en 2026 ?",
        a: "C'est devenu très difficile dans les arrondissements du centre (1er, 2e, 3e, 6e, 7e) à cause de la règle de compensation. Pratiquement, seuls les propriétaires qui possèdent déjà un bureau à convertir peuvent ajouter un logement LCD. Dans les arrondissements périphériques (4e, 5e, 8e, 9e), les contraintes sont moindres mais il est prudent de consulter le service urbanisme avant d'acheter. En résidence principale limitée à 120 jours, l'achat reste libre.",
      },
      {
        q: "Le Vieux Lyon est-il un bon quartier pour investir en Airbnb ?",
        a: "En rendement brut, oui (5 à 5,5 %), avec un très bon taux d'occupation et une clientèle internationale. Mais les immeubles classés UNESCO imposent des règles strictes sur les travaux, et certaines copropriétés interdisent explicitement la location courte durée. Vérifiez impérativement le règlement de copropriété avant d'acheter.",
      },
      {
        q: "La taxe de séjour est-elle automatiquement collectée par Airbnb à Lyon ?",
        a: "Oui, depuis 2018 Airbnb collecte et reverse automatiquement la taxe de séjour à la Métropole de Lyon. Vous n'avez rien à facturer en plus au voyageur. En revanche, vous devez vérifier que le classement de votre bien est correct, car une erreur peut déclencher un redressement de la collectivité.",
      },
    ],
    updatedAt: '2026-04-09',
  },

  // ==========================================================================
  // NICE
  // ==========================================================================
  {
    slug: 'nice',
    displayName: 'Nice',
    region: "Provence-Alpes-Côte d'Azur",
    regionSlug: 'provence-alpes-cote-dazur',
    title: 'Conciergerie Nice Airbnb : comparatif 2026 des meilleures agences',
    metaTitle: 'Conciergerie Nice Airbnb : Comparatif 2026 (tarifs & avis)',
    metaDescription:
      "Comparatif des meilleures conciergeries Airbnb à Nice. Tarifs (20-30%), services, quartiers rentables, réglementation 2026. Guide complet pour propriétaires.",
    kwPrincipal: 'conciergerie nice',
    kwSecondaires: ['conciergerie airbnb nice', 'conciergerie nice airbnb', 'meilleure conciergerie nice'],
    population: 342000,
    tourists: 5000000,
    activeListings: 9200,
    priceLow: 110,
    priceHigh: 180,
    occupancyRate: 74,
    revpar: 96,
    seasonality: "Saisonnalité extrême : avril-octobre >85% d'occupation, novembre-mars <55%",
    rankNational: 3,
    introCustom:
      "Nice, capitale de la Riviera française, concentre une demande touristique parmi les plus fortes du pays. Avec 9 200 annonces actives et un RevPAR de 96 €/nuit (3e meilleur de France), le marché niçois récompense les propriétaires bien organisés. Mais la saisonnalité extrême (90 % du revenu sur 6 mois), la réglementation durcie depuis 2024 et la concurrence entre conciergeries rendent le choix du prestataire crucial.",
    marketIntro:
      "Nice est le 3e marché Airbnb français en valeur (derrière Paris et Cannes). Le revenu moyen par annonce atteint 1 800 €/mois, porté par des prix très élevés l'été (150-250 €/nuit en juillet-août) et une clientèle internationale (60 % d'étrangers). L'aéroport international (2e de France) amène un flux continu d'arrivées courtes. Le marché est dominé par quelques gros acteurs nationaux (BnbLord, GuestReady) et une constellation de petites conciergeries haut de gamme.",
    conciergeries: [
      {
        name: 'BnbLord Nice',
        commission: '22-25 %',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 220,
        biensGeres: 280,
        specialty: 'Leader national sur la Côte',
        description:
          "BnbLord est l'un des plus gros acteurs de la Côte d'Azur avec 280 biens gérés à Nice. Commission 22-25 % selon formule, ménage refacturé voyageur. Points forts : équipes 24/7 multilingues, gestion complète des arrivées internationales tardives, photos pro incluses.",
      },
      {
        name: 'Hostnfly Nice',
        commission: '22 %',
        menage: 'refacturé voyageur',
        rating: 4.5,
        reviews: 195,
        biensGeres: 240,
        specialty: 'Process industriels rodés',
        description:
          "Acteur national majeur, Hostnfly gère 240 biens à Nice. Commission 22 %. Process très industriels, délai de réponse voyageurs < 10 min. Excellent pour propriétaires expatriés.",
      },
      {
        name: 'GuestReady Nice',
        commission: '25 %',
        menage: 'inclus dans commission',
        rating: 4.6,
        reviews: 160,
        biensGeres: 180,
        specialty: 'Réseau international premium',
        description:
          "GuestReady (présent dans 20+ villes européennes) concentre 180 biens à Nice. Commission 25 % tout inclus (photos, pricing dynamique, ménage). Adapté aux biens haut de gamme du Carré d'Or et de Cimiez.",
      },
      {
        name: 'Conciergerie Azur',
        commission: '20-25 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 85,
        biensGeres: 100,
        specialty: 'Indépendant niçois',
        description:
          "Structure indépendante implantée à Nice depuis 2017. Commission variable 20-25 % selon type de bien et volume. Points forts : connaissance intime du marché local, relation humaine, équipes sur place en centre-ville.",
      },
      {
        name: 'Nice Conciergerie Premium',
        commission: '28-30 %',
        menage: 'inclus dans commission',
        rating: 4.9,
        reviews: 60,
        biensGeres: 50,
        specialty: 'Segment luxe (>150 €/nuit)',
        description:
          "Positionnement ultra premium pour appartements de standing et villas. Commission 28-30 % tout inclus, mise en scène, service voiturier, conciergerie haut de gamme (réservations restaurants, spa, excursions).",
      },
    ],
    neighborhoods: [
      {
        name: "Carré d'Or / Promenade des Anglais",
        pricePerNight: '140-250 €',
        occupancy: 80,
        description:
          "Le quartier le plus prestigieux : Belle Époque, vue mer, prestige. T2 : 400 000 €+. Clientèle internationale fortunée.",
        roiBrut: '4 à 4,5 %',
      },
      {
        name: 'Vieux Nice',
        pricePerNight: '100-160 €',
        occupancy: 82,
        description:
          "Le cœur historique touristique : cours Saleya, ruelles colorées, restaurants. Très fort taux d'occupation mais copropriétés anciennes souvent complexes.",
        roiBrut: '5 à 6 %',
      },
      {
        name: 'Cimiez',
        pricePerNight: '110-170 €',
        occupancy: 72,
        description:
          "Quartier résidentiel chic sur les hauteurs : musée Matisse, arènes, calme. Clientèle familiale premium. T2 : 320 000 €+.",
        roiBrut: '4,5 à 5 %',
      },
      {
        name: 'Port de Nice',
        pricePerNight: '100-150 €',
        occupancy: 76,
        description:
          "Quartier branché en plein renouveau : ferries Corse, restos, proximité Vieux Nice. T2 : 280 000 €+.",
        roiBrut: '5 à 6 %',
      },
      {
        name: 'Musiciens / Libération',
        pricePerNight: '85-120 €',
        occupancy: 70,
        description:
          "Quartier résidentiel calme, prix plus accessibles, proche gare Thiers. Bon rendement, clientèle mixte.",
        roiBrut: '5,5 à 6,5 %',
      },
    ],
    regulation:
      "Nice applique une **réglementation parmi les plus strictes** de la Côte d'Azur.\n\n**Enregistrement mairie obligatoire** avec **numéro à 13 chiffres** sur l'annonce.\n\n**Limite 120 nuitées/an** pour les résidences principales, **renforcée par des contrôles réguliers**.\n\n**Compensation obligatoire.** Depuis 2024, le changement d'usage pour les résidences secondaires est soumis à **compensation obligatoire** dans les quartiers centraux, ce qui a **fait chuter le nombre de nouveaux meublés touristiques**.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** De **1 € à 5 €** par nuit et par voyageur adulte selon le classement, collectée automatiquement par Airbnb.",
    concreteExample: {
      bienType: 'T2',
      surface: 42,
      pricePerNight: 135,
      neighborhood: 'Vieux Nice',
      revenuBrut: 36450,
      commissionRate: 0.22,
      menageCount: 95,
      menageUnitCost: 55,
    },
    extraFaq: [
      {
        q: "Comment gérer la saisonnalité extrême de Nice ?",
        a: "Deux stratégies : (1) maximiser le revenu estival avec un pricing agressif (+50 à +80 % vs basse saison) et accepter que l'hiver soit creux ; (2) diversifier avec du bail mobilité en novembre-mars (Erasmus, stagiaires, télétravailleurs). Une bonne conciergerie fait les deux : courte durée touristique d'avril à octobre, location moyenne durée (1-10 mois) en hiver.",
      },
      {
        q: "Le marché niçois est-il encore accessible pour un nouvel investisseur ?",
        a: "Oui, mais uniquement en résidence principale ou dans les quartiers périphériques (Magnan, Libération, Saint-Roch). L'hypercentre en résidence secondaire dédiée LCD est devenu quasi impossible depuis 2024 à cause des règles de compensation. Vérifiez systématiquement auprès du service urbanisme avant d'acheter.",
      },
      {
        q: "Dois-je installer la climatisation dans mon Airbnb niçois ?",
        a: "Oui, c'est devenu quasi indispensable. En haute saison (juin-septembre), un appartement sans clim voit son taux d'occupation chuter de 25 à 40 % et ses avis plonger. Investissement : 1 500 à 3 000 € pour un T2. Rentabilisé en une saison.",
      },
    ],
    updatedAt: '2026-04-09',
  },

  // ==========================================================================
  // MARSEILLE
  // ==========================================================================
  {
    slug: 'marseille',
    displayName: 'Marseille',
    region: "Provence-Alpes-Côte d'Azur",
    regionSlug: 'provence-alpes-cote-dazur',
    title: 'Conciergerie Marseille Airbnb : comparatif 2026 des meilleures agences',
    metaTitle: 'Conciergerie Marseille Airbnb : Comparatif 2026 (tarifs & avis)',
    metaDescription:
      'Comparatif des meilleures conciergeries Airbnb à Marseille. Tarifs (18-25%), services, quartiers rentables, réglementation. Guide complet 2026.',
    kwPrincipal: 'conciergerie marseille',
    kwSecondaires: ['conciergerie airbnb marseille', 'conciergerie marseille airbnb', 'meilleure conciergerie marseille'],
    population: 873000,
    tourists: 5000000,
    activeListings: 7800,
    priceLow: 75,
    priceHigh: 115,
    occupancyRate: 68,
    revpar: 64,
    seasonality: 'Haute saison mai-septembre, creux en janvier-février',
    rankNational: 6,
    introCustom:
      "Marseille vit une révolution touristique depuis 10 ans : MuCEM, Notre-Dame de la Garde rénovée, Calanques inscrites en parc national, liaisons TGV. Le marché Airbnb y a doublé entre 2020 et 2025, avec 7 800 annonces actives et un taux d'occupation moyen de 68 %. Mais la diversité des quartiers, les contrastes de qualité et la spécificité de chaque arrondissement rendent le choix de conciergerie particulièrement important.",
    marketIntro:
      "Marseille est le 6e marché français en volume LCD mais offre des rendements bruts parmi les meilleurs des grandes villes (6 à 8 %), grâce à des prix d'achat encore accessibles. La clientèle est variée : tourisme culturel (MuCEM, Panier, Cours Julien), affaires (Euroméditerranée), touristes méditerranéens (Espagnols, Italiens, Maghrébins), et séjours longs (bail mobilité pour jeunes actifs). La conciergerie locale y est fragmentée, avec peu de gros acteurs nationaux implantés.",
    conciergeries: [
      {
        name: 'Welkeys Marseille',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.6,
        reviews: 115,
        biensGeres: 140,
        specialty: 'Plateforme nationale',
        description:
          "Welkeys gère 140 biens à Marseille avec leur stack technologique habituelle. Commission 20 %. Bon compromis couverture/prix pour les propriétaires qui veulent un service standardisé.",
      },
      {
        name: 'Hostnfly Marseille',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.4,
        reviews: 130,
        biensGeres: 160,
        specialty: 'Process rodés',
        description:
          "Hostnfly est présent à Marseille avec 160 biens. Commission 20 %, process industriels. Adapté aux propriétaires multi-biens.",
      },
      {
        name: 'Marseille Conciergerie',
        commission: '18-22 %',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 80,
        biensGeres: 70,
        specialty: 'Indépendant local',
        description:
          "Structure indépendante marseillaise, commission 18-22 % selon formule. Excellente connaissance du terrain, équipes réactives sur le Vieux-Port et alentours.",
      },
      {
        name: 'BnbLord Marseille',
        commission: '22 %',
        menage: 'inclus dans commission',
        rating: 4.5,
        reviews: 95,
        biensGeres: 110,
        specialty: 'Couverture multi-quartiers',
        description:
          "BnbLord couvre l'ensemble des arrondissements marseillais avec 110 biens. Commission 22 % tout inclus. Bon pour propriétaires qui veulent un seul interlocuteur.",
      },
      {
        name: 'Le Panier Conciergerie',
        commission: '20-25 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 55,
        biensGeres: 45,
        specialty: 'Spécialiste hypercentre & Panier',
        description:
          "Structure ultra-locale concentrée sur Le Panier, Vieux-Port et République. Excellente qualité de service mais zone d'intervention limitée.",
      },
    ],
    neighborhoods: [
      {
        name: 'Vieux-Port / Panier (1er & 2e)',
        pricePerNight: '90-140 €',
        occupancy: 75,
        description:
          "Cœur touristique et historique. Demande très forte, prix élevés, mais copropriétés anciennes souvent compliquées. T2 : 230 000 €+.",
        roiBrut: '5,5 à 6,5 %',
      },
      {
        name: 'Cours Julien / Notre-Dame-du-Mont (6e)',
        pricePerNight: '75-105 €',
        occupancy: 72,
        description:
          "Quartier alternatif branché, très demandé par les 25-40 ans. Ambiance, restos, streetart. T2 : 200 000 €+.",
        roiBrut: '6 à 7 %',
      },
      {
        name: 'Prado / Castellane (8e)',
        pricePerNight: '85-120 €',
        occupancy: 70,
        description:
          "Quartier résidentiel chic, proche plages. Clientèle familiale, touristes premium. T2 : 280 000 €+.",
        roiBrut: '5 à 6 %',
      },
      {
        name: 'Euroméditerranée / Joliette (2e)',
        pricePerNight: '80-115 €',
        occupancy: 72,
        description:
          "Quartier neuf (MuCEM, Terrasses du Port), immobilier récent. Clientèle affaires + touristes. T2 : 240 000 €+.",
        roiBrut: '5,5 à 6,5 %',
      },
      {
        name: 'Vauban / Endoume (7e)',
        pricePerNight: '90-130 €',
        occupancy: 73,
        description:
          "Quartier calme en bord de mer, proche Corniche. Clientèle familiale, séjours plus longs. T2 : 260 000 €+.",
        roiBrut: '5 à 6 %',
      },
    ],
    regulation:
      "**Enregistrement obligatoire.** Marseille a mis en place l'enregistrement pour les meublés touristiques en 2023, avec **numéro à 13 chiffres** sur l'annonce.\n\n**Limite 120 nuitées/an** pour résidence principale.\n\n**Pas de compensation obligatoire.** Contrairement à **Paris, Lyon ou Nice**, la ville n'a pas encore instauré de compensation pour le changement d'usage, ce qui **laisse plus de liberté aux investisseurs**.\n\n**⚠️ Attention copropriétés.** Certaines copropriétés du centre-ville ont voté **l'interdiction de la location courte durée** dans leur règlement — **toujours vérifier avant d'acheter**.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** De **0,50 € à 3 €** par nuit.",
    concreteExample: {
      bienType: 'T2',
      surface: 45,
      pricePerNight: 85,
      neighborhood: 'Cours Julien',
      revenuBrut: 21080,
      commissionRate: 0.2,
      menageCount: 78,
      menageUnitCost: 45,
    },
    extraFaq: [
      {
        q: "Marseille est-elle une bonne ville pour un premier investissement LCD ?",
        a: "Oui, pour trois raisons : les prix d'achat restent parmi les plus bas des grandes métropoles françaises, le rendement brut est supérieur à 6 % dans la plupart des quartiers, et la réglementation est moins restrictive que Paris/Lyon/Nice. Les meilleurs quartiers pour démarrer : Cours Julien, Notre-Dame-du-Mont, Joliette.",
      },
      {
        q: "Comment gérer les problèmes de sécurité ressentis par certains voyageurs ?",
        a: "Deux mesures : (1) choisir un quartier rassurant (éviter les 13e, 14e, 15e arrondissements pour du tourisme), (2) communiquer clairement dans l'annonce sur l'environnement réel, les transports, les commerces. Une bonne conciergerie sélectionne d'elle-même les quartiers dans lesquels elle opère pour éviter les avis négatifs.",
      },
      {
        q: "Les conciergeries marseillaises gèrent-elles les biens à Cassis, La Ciotat ou Aix ?",
        a: "Rarement. Pour ces communes, il faut chercher des conciergeries locales spécialisées (Cassis Conciergerie, Aix Conciergerie…). Les acteurs nationaux (Hostnfly, BnbLord) couvrent parfois Aix-en-Provence depuis Marseille mais avec des délais d'intervention plus longs.",
      },
    ],
    updatedAt: '2026-04-09',
  },

  // ==========================================================================
  // TOULOUSE
  // ==========================================================================
  {
    slug: 'toulouse',
    displayName: 'Toulouse',
    region: 'Occitanie',
    regionSlug: 'occitanie',
    title: 'Conciergerie Toulouse Airbnb : comparatif 2026 des meilleures agences',
    metaTitle: 'Conciergerie Toulouse Airbnb : Comparatif 2026 (tarifs & avis)',
    metaDescription:
      'Comparatif des meilleures conciergeries Airbnb à Toulouse. Tarifs (18-22%), services, quartiers rentables, réglementation. Guide complet 2026.',
    kwPrincipal: 'conciergerie toulouse',
    kwSecondaires: ['conciergerie airbnb toulouse', 'conciergerie toulouse airbnb'],
    population: 493000,
    tourists: 6000000,
    activeListings: 6400,
    priceLow: 70,
    priceHigh: 100,
    occupancyRate: 70,
    revpar: 58,
    seasonality: 'Rythme régulier toute l\'année avec pics sur les salons (aéronautique, Toulouse Game Show)',
    rankNational: 7,
    introCustom:
      "Toulouse, 4e ville de France, offre un marché Airbnb atypique : une forte demande tout au long de l'année portée par le secteur aéronautique (Airbus, salons professionnels), l'université et le tourisme culturel. 6 400 annonces actives, un taux d'occupation de 70 % stable, et des prix d'achat parmi les plus bas des grandes métropoles : Toulouse est un terrain de jeu favorable pour les propriétaires qui savent gérer.",
    marketIntro:
      "Toulouse se distingue par sa régularité : moins de saisonnalité qu'à Nice ou Bordeaux, grâce à une forte demande business continue (Airbus et sous-traitants génèrent des milliers de nuitées professionnelles mensuelles). Le revenu médian par annonce est de 900 €/mois (plus faible qu'à Lyon ou Nice), mais le rendement brut dépasse souvent 6 % grâce à des prix d'achat attractifs. La réglementation est plus souple que dans les autres métropoles, et le marché des conciergeries est encore peu concentré.",
    conciergeries: [
      {
        name: 'Hostnfly Toulouse',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.5,
        reviews: 145,
        biensGeres: 180,
        specialty: 'Leader local',
        description:
          "Hostnfly est le plus gros acteur national présent à Toulouse avec 180 biens. Commission 20 %, process industriels, reporting régulier. Bon choix pour propriétaires multi-biens ou expatriés.",
      },
      {
        name: 'Welkeys Toulouse',
        commission: '20-22 %',
        menage: 'refacturé voyageur',
        rating: 4.6,
        reviews: 105,
        biensGeres: 120,
        specialty: 'Technologie & reporting',
        description:
          "Welkeys couvre Toulouse avec 120 biens gérés. Commission 20-22 %. Points forts : channel manager propriétaire, photos pro, reporting clair.",
      },
      {
        name: 'Toulouse Conciergerie',
        commission: '18 %',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 85,
        biensGeres: 75,
        specialty: 'Meilleur prix local',
        description:
          "Structure indépendante toulousaine, commission 18 %. Bon rapport qualité/prix pour les propriétaires sensibles au tarif. Ancrage local fort sur Capitole, Carmes, Saint-Étienne.",
      },
      {
        name: 'YourHostHelper Toulouse',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.5,
        reviews: 95,
        biensGeres: 90,
        specialty: 'Pricing dynamique',
        description:
          "Filiale YourHostHelper, 90 biens à Toulouse. Commission 20 %, photos pro offertes, pricing dynamique quotidien. Excellent pour maximiser les périodes de salons.",
      },
      {
        name: 'Conciergerie Rose',
        commission: '20-24 %',
        menage: 'variable',
        rating: 4.8,
        reviews: 60,
        biensGeres: 55,
        specialty: 'Service premium',
        description:
          "Petite conciergerie positionnée sur le haut de gamme, commission 20-24 % selon formule. Prestations soignées, accueil personnalisé, plateaux de bienvenue. Clientèle exigeante.",
      },
    ],
    neighborhoods: [
      {
        name: 'Capitole / Saint-Étienne (1er arr.)',
        pricePerNight: '80-110 €',
        occupancy: 78,
        description:
          "Cœur historique de Toulouse. Demande très forte toute l'année. T2 : 250 000 €+.",
        roiBrut: '5 à 5,5 %',
      },
      {
        name: 'Carmes',
        pricePerNight: '75-105 €',
        occupancy: 76,
        description:
          "Quartier historique chic, cafés, restos. Très demandé par les touristes. T2 : 230 000 €+.",
        roiBrut: '5,5 à 6 %',
      },
      {
        name: 'Saint-Cyprien / Patte d\'Oie',
        pricePerNight: '65-90 €',
        occupancy: 72,
        description:
          "Rive gauche en pleine mutation, prix encore accessibles. T2 : 180 000 €+.",
        roiBrut: '6 à 7 %',
      },
      {
        name: "Jean-Jaurès / Matabiau",
        pricePerNight: '70-95 €',
        occupancy: 74,
        description:
          "Autour de la gare, clientèle affaires en semaine. Très stable. T2 : 200 000 €+.",
        roiBrut: '6 à 6,5 %',
      },
      {
        name: 'Compans-Caffarelli / Amidonniers',
        pricePerNight: '75-100 €',
        occupancy: 70,
        description:
          "Quartier calme proche centre, bien desservi. T2 : 210 000 €+.",
        roiBrut: '5,5 à 6,5 %',
      },
    ],
    regulation:
      "**Enregistrement en mairie.** Obligatoire depuis 2020, avec **numéro à 13 chiffres** sur l'annonce.\n\n**Limite 120 nuitées/an** pour résidence principale.\n\n**Pas de compensation obligatoire.** Pas d'obligation pour le changement d'usage en résidence secondaire, ce qui rend la ville **beaucoup plus accessible aux investisseurs LCD** que **Paris, Lyon ou Nice**.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** De **0,60 € à 3 €** par nuit, collectée par Airbnb.",
    concreteExample: {
      bienType: 'T2',
      surface: 42,
      pricePerNight: 80,
      neighborhood: 'Carmes',
      revenuBrut: 20440,
      commissionRate: 0.2,
      menageCount: 75,
      menageUnitCost: 45,
    },
    extraFaq: [
      {
        q: "Toulouse est-elle encore un marché accessible aux investisseurs LCD en 2026 ?",
        a: "Oui, c'est même l'une des grandes villes françaises les plus accessibles en 2026. Prix d'achat parmi les plus bas, réglementation souple (pas de compensation), demande soutenue. Les rendements bruts de 6 à 7 % sont atteignables dans les quartiers Saint-Cyprien ou Jean-Jaurès.",
      },
      {
        q: "Les salons Airbus et aéronautiques créent-ils vraiment des pics de demande ?",
        a: "Oui, et ces pics sont précieux. Le Salon du Bourget (biennale) génère des semaines à 300+ €/nuit, le Toulouse Space Show en octobre booste la demande. Une conciergerie rodée identifie ces dates et pratique un pricing agressif pour les capturer.",
      },
      {
        q: "Faut-il préférer un quartier central ou près de l'aéroport pour la clientèle business ?",
        a: "Le centre-ville fonctionne mieux. Les déplacements professionnels vers Airbus se font en voiture ou Uber, et les voyageurs préfèrent généralement loger en centre-ville pour profiter des restaurants et de l'ambiance, quitte à avoir 20 min de trajet.",
      },
    ],
    updatedAt: '2026-04-09',
  },

  // ==========================================================================
  // STRASBOURG
  // ==========================================================================
  {
    slug: 'strasbourg',
    displayName: 'Strasbourg',
    region: 'Grand Est',
    regionSlug: 'alsace',
    title: 'Conciergerie Strasbourg Airbnb : comparatif 2026 des meilleures agences',
    metaTitle: 'Conciergerie Strasbourg Airbnb : Comparatif 2026 (tarifs & avis)',
    metaDescription:
      'Comparatif des meilleures conciergeries Airbnb à Strasbourg. Tarifs (18-25%), services, réglementation 2026, meilleurs quartiers. Guide complet pour propriétaires.',
    kwPrincipal: 'conciergerie strasbourg',
    kwSecondaires: ['conciergerie airbnb strasbourg', 'conciergerie strasbourg airbnb', 'meilleure conciergerie strasbourg'],
    population: 287000,
    tourists: 4000000,
    activeListings: 4200,
    priceLow: 75,
    priceHigh: 120,
    occupancyRate: 72,
    revpar: 62,
    seasonality: "Pic en décembre (Marché de Noël), avril-juin (Institutions européennes), septembre (foires). Creux en janvier-février.",
    rankNational: 8,
    introCustom:
      "Strasbourg, siège du Parlement européen et capitale de Noël, reçoit 4 millions de touristes par an. Le marché Airbnb y affiche 4 200 annonces actives avec un taux d'occupation moyen de 72 %. Clientèle mixte très favorable : touristes internationaux, fonctionnaires européens (séjours longs), visiteurs de foires. Trouver la bonne conciergerie à Strasbourg suppose de comprendre ces trois publics qui n'ont pas les mêmes attentes.",
    marketIntro:
      "Strasbourg est un marché LCD atypique en France : la demande européenne (institutions, députés, stagiaires) lisse partiellement la saisonnalité. Le pic historique reste le Marché de Noël (28 novembre - 24 décembre), où les prix peuvent doubler. Le revenu médian par annonce atteint 1 100 €/mois (source AirDNA 2025). La ville a mis en place l'enregistrement obligatoire et applique une limite stricte de 120 jours aux résidences principales.",
    conciergeries: [
      {
        name: "La Conciergerie de l'Est",
        url: 'https://www.laconciergeriedelest.fr/',
        commission: '20-22 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 85,
        biensGeres: 90,
        specialty: 'Partenaire Luckey by Airbnb',
        description:
          "Structure locale sélectionnée par Airbnb pour faire partie du programme Luckey (conciergerie officielle Airbnb). Commission 20-22 % selon formule, ménage refacturé voyageur. Points forts : intégration native avec Airbnb, réactivité, connaissance intime de Strasbourg. Couverture : Strasbourg intra-muros + première couronne.",
      },
      {
        name: 'Nestify Strasbourg',
        url: 'https://www.nestify.fr/conciergerie-airbnb-strasbourg/',
        commission: '22-25 %',
        menage: 'inclus dans commission',
        rating: 4.6,
        reviews: 120,
        biensGeres: 140,
        specialty: 'Service complet A à Z',
        description:
          "Acteur national présent à Strasbourg avec environ 140 biens gérés. Commission 22-25 % tout inclus (photos, pricing, ménage, assistance 24/7 multilingue). Adapté aux propriétaires expatriés ou voulant zéro gestion. Stack technologique mature : channel manager, dashboard propriétaire.",
      },
      {
        name: 'Hostnfly Strasbourg',
        url: 'https://hostnfly.com/conciergerie-airbnb/strasbourg',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.5,
        reviews: 155,
        biensGeres: 180,
        specialty: 'Leader national en volume',
        description:
          "Hostnfly gère environ 180 biens à Strasbourg. Commission 20 %, process industriels. Délai de réponse voyageurs < 10 min en moyenne. Très bon choix pour un propriétaire qui cherche de la prévisibilité et un reporting clair.",
      },
      {
        name: 'La Conciergerie de Strasbourg',
        url: 'https://laconciergeriedestrasbourg.fr/',
        commission: '18-22 %',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 70,
        biensGeres: 60,
        specialty: 'Indépendant local',
        description:
          "Structure indépendante strasbourgeoise, commission 18-22 % selon volume et type de bien. Relation directe avec le gérant, excellente connaissance des copropriétés anciennes du centre historique (Petite France, Krutenau).",
      },
      {
        name: 'WeHost Strasbourg',
        url: 'https://www.wehost.fr/conciergerie-airbnb-strasbourg/',
        commission: '20-22 %',
        menage: 'refacturé voyageur',
        rating: 4.5,
        reviews: 95,
        biensGeres: 100,
        specialty: 'Simplicité et sécurité',
        description:
          "WeHost est présent dans toutes les grandes villes françaises. Commission 20-22 %, positionnement 'simple et sécurisé'. Assurance voyageur renforcée, gestion standardisée. Bon compromis pour un premier bien.",
      },
      {
        name: 'Prost Conciergerie',
        url: 'https://strasbourg-conciergerie.fr/',
        commission: '19-24 %',
        menage: 'variable',
        rating: 4.7,
        reviews: 55,
        biensGeres: 45,
        specialty: 'Proximité et sur-mesure',
        description:
          "Petite structure positionnée sur la qualité et le sur-mesure. Commission 19-24 % selon formule. Points forts : disponibilité, relation client, prestations premium pour les biens de standing près de la Cathédrale ou dans la Neustadt.",
      },
      {
        name: 'La Conciergerie des Rosiers',
        commission: '22-28 %',
        menage: 'inclus dans commission',
        rating: 4.9,
        reviews: 40,
        biensGeres: 30,
        specialty: 'Haut de gamme',
        description:
          "Positionnement premium pour biens de standing. Commission 22-28 % tout inclus. Services supplémentaires : conciergerie haut de gamme (réservations restaurants, excursions), accueil personnalisé, plateaux de bienvenue signature.",
      },
    ],
    neighborhoods: [
      {
        name: 'Centre historique / Cathédrale',
        pricePerNight: '95-140 €',
        occupancy: 78,
        description:
          "Le cœur touristique : Cathédrale, Place Kléber, Petite France. Très forte demande, prix élevés, mais copropriétés anciennes souvent complexes. T2 : 280 000 €+.",
        roiBrut: '4,5 à 5,5 %',
      },
      {
        name: 'Petite France',
        pricePerNight: '110-160 €',
        occupancy: 80,
        description:
          "Quartier UNESCO, maisons à colombages. Segment premium, clientèle internationale. Rare en marché (peu de biens disponibles). T2 : 350 000 €+.",
        roiBrut: '4 à 5 %',
      },
      {
        name: 'Neustadt (Quartier allemand)',
        pricePerNight: '90-130 €',
        occupancy: 74,
        description:
          "Inscrit UNESCO depuis 2017, architecture wilhelmienne. Appartements bourgeois spacieux, idéal clientèle famille et affaires institutions européennes. T2 : 290 000 €+.",
        roiBrut: '4,5 à 5,5 %',
      },
      {
        name: 'Krutenau',
        pricePerNight: '75-105 €',
        occupancy: 72,
        description:
          "Quartier étudiant et bohème, très animé. Bon rapport qualité-prix pour investir (T2 dès 220 000 €). Clientèle jeune, bail mobilité.",
        roiBrut: '5,5 à 6,5 %',
      },
      {
        name: 'Orangerie / Conseil des XV',
        pricePerNight: '85-120 €',
        occupancy: 70,
        description:
          "Quartier résidentiel calme proche du Parlement européen. Clientèle fonctionnaires européens en bail moyen-long. Excellent pour bail mobilité.",
        roiBrut: '5 à 6 %',
      },
      {
        name: 'Esplanade / Université',
        pricePerNight: '65-90 €',
        occupancy: 68,
        description:
          "Quartier universitaire, prix encore accessibles (T2 dès 180 000 €). Clientèle Erasmus, séjours longs 1-6 mois.",
        roiBrut: '6 à 7 %',
      },
    ],
    regulation:
      "**Enregistrement obligatoire** avec **numéro à 13 chiffres** affiché sur l'annonce Airbnb.\n\n**Limite 120 nuitées/an** strictement appliquée pour les résidences principales.\n\n**Changement d'usage au centre.** Depuis 2023, la ville demande une **autorisation de changement d'usage** pour les résidences secondaires dédiées à la LCD dans les quartiers centraux. Pas de compensation obligatoire à date, mais **des restrictions sont à l'étude**.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** De **0,75 € à 5 €** par nuit et par voyageur adulte, collectée automatiquement par Airbnb.\n\n**⚠️ Attention copropriétés.** Certaines copropriétés anciennes du **centre historique** ont inscrit **l'interdiction de la LCD** dans leur règlement — **à vérifier avant achat**.",
    concreteExample: {
      bienType: 'T2',
      surface: 42,
      pricePerNight: 95,
      neighborhood: 'Petite France',
      revenuBrut: 24930,
      commissionRate: 0.21,
      menageCount: 78,
      menageUnitCost: 45,
    },
    extraFaq: [
      {
        q: "Le Marché de Noël vaut-il à lui seul l'investissement à Strasbourg ?",
        a: "C'est un énorme booster, mais pas suffisant à lui seul. Pendant les 4 semaines du Marché de Noël (28 nov - 24 déc), les prix peuvent doubler et les biens sont quasi tous loués : un bon bien peut générer 4 000 à 7 000 € sur la période. Mais ça représente ~20 % du revenu annuel. Pour être rentable, il faut aussi capter les institutions européennes (sessions plénières du Parlement), les foires (avril, septembre), et le tourisme d'été.",
      },
      {
        q: "Les fonctionnaires européens sont-ils une clientèle intéressante ?",
        a: "Oui, très : séjours longs (de 1 semaine à plusieurs mois), peu d'usure du bien, paiements réguliers via l'institution. Beaucoup préfèrent le bail mobilité (1 à 10 mois) à la location courte durée. Les quartiers Orangerie, Wacken et Conseil des XV sont particulièrement demandés car proches des institutions.",
      },
      {
        q: "Comment gérer la barrière linguistique avec les voyageurs étrangers ?",
        a: "Toutes les conciergeries strasbourgeoises professionnelles répondent au minimum en français, anglais et allemand (Strasbourg est frontalière). Les meilleures ajoutent aussi l'espagnol et l'italien. C'est un critère à vérifier explicitement car un voyageur allemand qui reçoit une réponse en anglais approximatif laissera une note médiocre.",
      },
    ],
    updatedAt: '2026-04-09',
  },

  // ==========================================================================
  // LILLE
  // ==========================================================================
  {
    slug: 'lille',
    displayName: 'Lille',
    region: 'Hauts-de-France',
    regionSlug: 'hauts-de-france',
    title: 'Conciergerie Lille Airbnb : comparatif 2026 des meilleures agences',
    metaTitle: 'Conciergerie Lille Airbnb : Comparatif 2026 (tarifs & avis)',
    metaDescription:
      'Comparatif des meilleures conciergeries Airbnb à Lille. Tarifs (18-25%), services, réglementation 2026, quartiers rentables. Guide complet pour propriétaires.',
    kwPrincipal: 'conciergerie lille',
    kwSecondaires: ['conciergerie airbnb lille', 'conciergerie lille airbnb', 'meilleure conciergerie lille'],
    population: 235000,
    tourists: 2000000,
    activeListings: 3800,
    priceLow: 70,
    priceHigh: 110,
    occupancyRate: 70,
    revpar: 56,
    seasonality: "Pics en décembre (Marché de Noël), septembre (Braderie de Lille - 1er week-end), avril-juin (Euralille business). Creux en janvier.",
    rankNational: 9,
    introCustom:
      "Lille a connu une transformation spectaculaire ces 20 dernières années : Euralille, rénovation du Vieux-Lille, TGV à 1h de Paris, proximité Belgique. Le marché Airbnb y compte 3 800 annonces actives avec un taux d'occupation de 70 %. Clientèle mixte : voyageurs d'affaires (Euralille, sous-traitants de la grande distribution), touristes culturels, visiteurs belges du week-end, étudiants Erasmus. Choisir la bonne conciergerie dépend de votre quartier et de votre stratégie de saisonnalité.",
    marketIntro:
      "Lille est le 9e marché Airbnb français en volume et offre des rendements bruts parmi les meilleurs des grandes villes (6 à 7 %) grâce à des prix d'achat encore accessibles. La Braderie de Lille (plus grand marché aux puces d'Europe, 1er week-end de septembre) est le pic annuel : prix x2 à x3 sur 3 jours. Le revenu médian par annonce atteint 900 €/mois. La réglementation est modérée comparée à Paris/Lyon/Nice : enregistrement mairie obligatoire, 120 jours pour résidence principale, pas de compensation obligatoire à ce jour.",
    conciergeries: [
      {
        name: 'BnBeFree Lille',
        url: 'https://www.bnbefree.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 95,
        biensGeres: 110,
        specialty: 'Partenaire Luckey by Airbnb',
        description:
          "Structure locale partenaire du programme Luckey by Airbnb. Commission 20 %, ménage refacturé voyageur. Points forts : intégration native avec Airbnb, bonne visibilité sur la plateforme, services complets. Couverture : Lille métropole + Roubaix + Tourcoing.",
      },
      {
        name: 'Hostnfly Lille',
        url: 'https://www.hostnfly.com/conciergerie-airbnb/lille',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.5,
        reviews: 165,
        biensGeres: 200,
        specialty: 'Leader national',
        description:
          "Hostnfly gère environ 200 biens à Lille, le plus gros portefeuille local. Commission 20 %, process industriels très rodés. Délai de réponse voyageurs < 10 min. Idéal pour multi-biens et propriétaires expatriés.",
      },
      {
        name: 'Welkeys Lille',
        url: 'https://www.welkeys.com/conciergerie-airbnb/lille',
        commission: '20-22 %',
        menage: 'refacturé voyageur',
        rating: 4.6,
        reviews: 125,
        biensGeres: 150,
        specialty: 'Stack technologique',
        description:
          "Welkeys à Lille gère environ 150 biens. Commission 20-22 %. Points forts : channel manager propriétaire, photos pro, pricing dynamique quotidien. Bon équilibre entre couverture et qualité de service.",
      },
      {
        name: 'Conciergerie Magnifique',
        url: 'https://conciergerie-magnifique.com/',
        commission: '18-22 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 80,
        biensGeres: 75,
        specialty: 'Expert local Vieux-Lille',
        description:
          "Structure indépendante spécialisée sur le Vieux-Lille et l'hypercentre. Commission 18-22 % selon type de bien. Excellente connaissance des copropriétés anciennes, relation directe avec le gérant. Capacité limitée mais qualité reconnue.",
      },
      {
        name: 'QELIO Conciergerie',
        url: 'https://qelio.fr/',
        commission: '20-23 %',
        menage: 'refacturé voyageur',
        rating: 4.6,
        reviews: 70,
        biensGeres: 65,
        specialty: 'Service clé en main',
        description:
          "Structure lilloise avec un positionnement 'clé en main' : le propriétaire n'a strictement rien à faire. Commission 20-23 %. Gestion complète des voyageurs, maintenance, optimisation. Bon choix pour un propriétaire qui veut se décharger totalement.",
      },
      {
        name: 'Hôtecœur',
        url: 'https://hotecoeur.com/',
        commission: '19-22 %',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 60,
        biensGeres: 55,
        specialty: 'Expérience voyageur soignée',
        description:
          "Positionnement sur l'expérience voyageur et la relation humaine. Commission 19-22 %. Points forts : accueils personnalisés, plateaux de bienvenue, conseils locaux. Adapté aux biens de charme.",
      },
      {
        name: 'Conciergerie Lille',
        url: 'https://conciergerie-lille.com/',
        commission: '18-22 %',
        menage: 'refacturé voyageur',
        rating: 4.5,
        reviews: 90,
        biensGeres: 85,
        specialty: 'Gestion simplifiée',
        description:
          "Acteur local historique, commission 18-22 %. Formule simple et transparente, pas de frais cachés. Bon rapport qualité/prix pour un premier bien ou un propriétaire sensible au tarif.",
      },
    ],
    neighborhoods: [
      {
        name: 'Vieux-Lille',
        pricePerNight: '90-130 €',
        occupancy: 76,
        description:
          "Le quartier historique avec ses briques rouges et ses boutiques de créateurs. Très forte demande touristique et week-enders belges. T2 : 280 000 €+.",
        roiBrut: '4,5 à 5,5 %',
      },
      {
        name: 'Centre-ville / Grand Place',
        pricePerNight: '85-120 €',
        occupancy: 78,
        description:
          "Autour de la Grand Place, de la Vieille Bourse et de l'Opéra. Cœur commerçant et touristique. T2 : 250 000 €+.",
        roiBrut: '5 à 6 %',
      },
      {
        name: 'Euralille / Gare Lille Flandres',
        pricePerNight: '75-110 €',
        occupancy: 74,
        description:
          "Quartier business autour des gares TGV. Clientèle affaires majoritaire, très stable en semaine. Prix d'achat plus doux. T2 : 210 000 €+.",
        roiBrut: '5,5 à 6,5 %',
      },
      {
        name: 'Wazemmes',
        pricePerNight: '65-90 €',
        occupancy: 70,
        description:
          "Quartier multiculturel et vivant, connu pour son marché. En pleine gentrification. Prix encore accessibles (T2 dès 180 000 €). Clientèle jeune et alternative.",
        roiBrut: '6 à 7 %',
      },
      {
        name: 'Vauban / Solférino',
        pricePerNight: '75-105 €',
        occupancy: 72,
        description:
          "Quartier étudiant et résidentiel, proche de la Citadelle. Bon équilibre loyer/rendement. T2 : 220 000 €+.",
        roiBrut: '5,5 à 6,5 %',
      },
      {
        name: 'Saint-Maurice Pellevoisin',
        pricePerNight: '70-95 €',
        occupancy: 68,
        description:
          "Quartier résidentiel en développement, prix attractifs. Moins central mais bien desservi par le métro. T2 : 170 000 €+.",
        roiBrut: '6,5 à 7,5 %',
      },
    ],
    regulation:
      "**Enregistrement obligatoire** avec **numéro à 13 chiffres** affiché sur l'annonce Airbnb. Amende jusqu'à **10 000 €** en cas d'absence.\n\n**Limite 120 nuitées/an** pour les résidences principales.\n\n**Pas de compensation obligatoire.** À ce jour, Lille n'impose pas de compensation pour le changement d'usage en résidence secondaire, contrairement à **Paris, Lyon ou Nice** — ce qui **laisse plus de marge aux investisseurs**.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** De **0,60 € à 3 €** par nuit, collectée automatiquement par Airbnb.\n\n**⚠️ Attention Vieux-Lille.** Certaines copropriétés du **Vieux-Lille** ont voté **l'interdiction de la LCD** — **toujours vérifier avant d'acheter**.",
    concreteExample: {
      bienType: 'T2',
      surface: 45,
      pricePerNight: 80,
      neighborhood: 'Vieux-Lille',
      revenuBrut: 20440,
      commissionRate: 0.2,
      menageCount: 76,
      menageUnitCost: 42,
    },
    extraFaq: [
      {
        q: "La Braderie de Lille est-elle rentable pour un bien Airbnb ?",
        a: "Extrêmement. Le premier week-end de septembre, Lille reçoit 2 à 3 millions de visiteurs en 2 jours. Les prix Airbnb peuvent tripler (passer de 80 € à 250 €/nuit), et tous les biens sont loués plusieurs mois à l'avance. Un bon bien peut générer 800 à 1 200 € sur ces 2 jours. Une conciergerie rodée gère automatiquement ce pic via son pricing dynamique et des séjours minimum 2 nuits.",
      },
      {
        q: "Lille est-elle une bonne ville pour un premier investissement LCD ?",
        a: "Oui, pour plusieurs raisons : (1) prix d'achat parmi les plus bas des grandes métropoles françaises (T2 dès 180 000 €), (2) rendement brut supérieur à 6 % dans la plupart des quartiers, (3) réglementation plus souple que Paris/Lyon/Nice, (4) clientèle stable entre tourisme, affaires et Belges. Les meilleurs quartiers pour démarrer : Wazemmes, Euralille, Vauban.",
      },
      {
        q: "Les week-enders belges, une vraie clientèle pour Lille ?",
        a: "Oui, majeure. Bruxelles est à 35 min de Lille en TGV, Anvers à 1h, Gand à 50 min. Chaque week-end, des milliers de Belges viennent à Lille pour le shopping, la gastronomie et les événements culturels. Ils représentent environ 30 % des nuitées Airbnb lilloises. Conseil : optimiser l'annonce en néerlandais (la plupart des Flamands cherchent en néerlandais même s'ils parlent français).",
      },
    ],
    updatedAt: '2026-04-09',
  },
  // ==========================================================================
  // PARIS
  // ==========================================================================
  {
    slug: 'paris',
    displayName: 'Paris',
    region: 'Île-de-France',
    regionSlug: 'ile-de-france',
    title: 'Conciergerie Paris Airbnb : comparatif 2026 des 7 meilleures agences',
    metaTitle: 'Conciergerie Paris Airbnb : Comparatif 2026 (tarifs & avis)',
    metaDescription: 'Comparatif neutre des 7 meilleures conciergeries Airbnb à Paris. Tarifs (15-25 %), services, avis, réglementation 2026, quartiers rentables. Guide complet.',
    kwPrincipal: 'conciergerie airbnb paris',
    kwSecondaires: ['conciergerie paris', 'conciergerie paris airbnb', 'meilleure conciergerie paris', 'gestion locative airbnb paris', 'tarif conciergerie paris'],
    population: 2100000,
    tourists: 35000000,
    activeListings: 55000,
    priceLow: 90,
    priceHigh: 250,
    occupancyRate: 78,
    revpar: 135,
    seasonality: "Demande soutenue toute l'année. Pics de juin à septembre (tourisme estival, 88 % d'occupation), décembre (marchés de Noël, réveillon). Creux relatif en janvier-février (57 % d'occupation). Événements ponctuels (salons, Fashion Week, Roland-Garros) génèrent des pics de prix.",
    rankNational: 1,
    introCustom: "Vous avez un appartement à Paris que vous louez sur Airbnb ou que vous envisagez de passer en location courte durée. Entre la gestion des check-in à toute heure, le turnover élevé des voyageurs internationaux, les réglementations parisiennes parmi les plus strictes d'Europe et la concurrence de 55 000 annonces actives, vous vous demandez si confier la gestion à une conciergerie est vraiment rentable. Et surtout : laquelle choisir parmi la centaine d'agences présentes dans la capitale ?",
    marketIntro: "Paris est le premier marché Airbnb au monde en volume d'annonces et la première destination touristique mondiale. Avec 35 millions de visiteurs par an et un taux d'occupation médian de 78 %, la ville offre un potentiel de rendement exceptionnel en location courte durée. Le revenu annuel moyen d'une annonce atteint 43 000 €, soutenu par une clientèle mixte : tourisme international, voyageurs d'affaires, événements (salons, Fashion Week, Roland-Garros) et city-breaks européens. Mais la réglementation s'est durcie : depuis janvier 2025, la limite est passée de 120 à 90 jours pour les résidences principales, et les amendes sont salées. Choisir la bonne conciergerie est d'autant plus critique que le moindre faux pas réglementaire peut coûter 10 000 à 50 000 € d'amende.",
    conciergeries: [
      {
        name: 'Guester',
        url: 'https://www.guester.com/',
        commission: '18 %',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 320,
        biensGeres: 400,
        specialty: 'Excellence opérationnelle & ménage internalisé',
        description: "Guester s'est imposé comme la référence qualité de la conciergerie Airbnb à Paris en 2026. Son point fort : des équipes de ménage internalisées (pas de sous-traitance), un linge de qualité hôtelière et un outil de reporting transparent pour les propriétaires. Commission à partir de 18 % HT, ménage refacturé au voyageur. Présent dans une trentaine de villes en France, Guester combine l'échelle d'un acteur national et la qualité de service d'un indépendant.",
      },
      {
        name: 'HostnFly',
        url: 'https://hostnfly.com/',
        commission: '25 %',
        menage: 'refacturé voyageur',
        rating: 4.6,
        reviews: 3600,
        biensGeres: 3000,
        specialty: 'Volume & automatisation à grande échelle',
        description: "HostnFly est l'un des plus gros acteurs français de la conciergerie Airbnb, avec environ 150 000 réservations gérées par an. À Paris, la commission s'élève à 25 % TTC, plus élevée qu'en province, mais le service est complet : pricing dynamique, channel manager multi-plateformes, assurance incluse. Idéal pour les propriétaires qui veulent un service 100 % délégué sans compromis.",
      },
      {
        name: 'GuestReady',
        url: 'https://www.guestready.com/',
        commission: '20 %',
        menage: 'inclus dans commission',
        rating: 4.4,
        reviews: 280,
        biensGeres: 1200,
        specialty: 'Couverture internationale & portfolio large',
        description: "GuestReady est un acteur international présent à Paris, Londres, Dubaï et Porto, avec un portfolio de plus de 4 000 biens dans le monde. Commission de 20 %, ménage inclus dans la commission. Le modèle all-inclusive simplifie la gestion mais réduit la marge nette du propriétaire sur les séjours courts. Service fiable mais relation plus distante qu'avec les indépendants.",
      },
      {
        name: 'Welkeys',
        url: 'https://www.welkeys.com/',
        commission: '22 %',
        menage: 'refacturé voyageur',
        rating: 4.4,
        reviews: 850,
        biensGeres: 1200,
        specialty: 'Technologie & reporting propriétaire',
        description: "Welkeys gère environ 1 200 biens en France et se distingue par sa stack technologique : channel manager propriétaire, serrures connectées, dashboard temps réel pour les propriétaires. À Paris, la commission démarre à 22 %. Le ménage est refacturé au voyageur. Bon choix pour les propriétaires data-driven qui veulent suivre leurs performances de près.",
      },
      {
        name: 'Tranquille Emile',
        url: 'https://www.tranquilleemile.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.6,
        reviews: 130,
        biensGeres: 35,
        specialty: 'Biens de charme & service haut de gamme',
        description: "Spécialiste depuis 2015 de la location courte durée de biens de charme et d'exception à Paris. Tranquille Emile ne gère que 35 propriétés sélectionnées : l'équipe à taille humaine offre un suivi ultra-personnalisé. Commission de 20 % du CA hors ménage. Taux d'occupation moyen annoncé : 88 %. Note Google 4,6/5 avec 90 % d'avis 5 étoiles.",
      },
      {
        name: 'Check My Guest',
        url: 'https://www.checkmyguest.fr/',
        commission: '18 %',
        menage: 'variable',
        rating: 4.5,
        reviews: 600,
        biensGeres: 2000,
        specialty: 'Accompagnement investisseurs & gestion à grande échelle',
        description: "Check My Guest cible Paris et l'Île-de-France avec une approche orientée investisseurs : accompagnement depuis la conception du projet immobilier jusqu'à la gestion locative. Plus de 2 000 propriétaires font appel à leurs services. Commission à partir de 18 %. Attention : les avis sont très partagés — excellents retours sur la prise en charge initiale, mais des critiques récurrentes sur la qualité du ménage.",
      },
      {
        name: 'YourHostHelper Paris',
        url: 'https://yourhosthelper.com/conciergerie-paris-2/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.5,
        reviews: 210,
        biensGeres: 250,
        specialty: 'Photos pros & pricing dynamique',
        description: "YourHostHelper est un réseau national présent dans plus de 20 villes, dont Paris. Commission de 20 % sur les revenus locatifs, ménage refacturé au voyageur. Le service inclut des photos professionnelles au lancement, un pricing dynamique quotidien et un dashboard de suivi des performances. Bon rapport qualité/prix sur les T1-T2 standards.",
      },
    ],
    neighborhoods: [
      {
        name: 'Le Marais (3e-4e)',
        pricePerNight: '140-220 €',
        occupancy: 85,
        description: "Le quartier le plus demandé de Paris pour la location courte durée. Architecture historique, vie culturelle intense, commerces branchés et restaurants. Clientèle haut de gamme internationale. Ticket d'entrée élevé (T2 à partir de 550 000 €) mais rendement régulier grâce à un taux de remplissage exceptionnel toute l'année.",
        roiBrut: '4 à 5 %',
      },
      {
        name: 'Saint-Germain-des-Prés (6e)',
        pricePerNight: '150-250 €',
        occupancy: 80,
        description: "Quartier littéraire et intellectuel, cafés mythiques, galeries d'art. Les tarifs Airbnb sont parmi les plus élevés de Paris. Clientèle CSP+ et touristes culturels. Forte concurrence hôtelière, ce qui impose un standing irréprochable pour se démarquer. Attention : copropriétés souvent hostiles à la LCD.",
        roiBrut: '3,5 à 4,5 %',
      },
      {
        name: 'Montmartre (18e)',
        pricePerNight: '100-160 €',
        occupancy: 80,
        description: "Quartier emblématique, ambiance village, Sacré-Cœur, Place du Tertre. Prix d'achat plus accessibles que la rive gauche (T2 dès 350 000 €). Forte demande touristique mais saisonnalité plus marquée qu'en hypercentre. Excellent compromis rentabilité/charme pour un premier investissement parisien.",
        roiBrut: '5 à 6 %',
      },
      {
        name: 'Bastille / Oberkampf (11e)',
        pricePerNight: '100-150 €',
        occupancy: 77,
        description: "Quartier jeune et dynamique, vie nocturne, restaurants tendance, excellent maillage métro. Domine les réservations grâce à son mix entre authenticité parisienne et accessibilité. Prix d'achat encore raisonnables (T2 dès 380 000 €). Clientèle variée : touristes, digital nomads, voyageurs d'affaires.",
        roiBrut: '5 à 6 %',
      },
      {
        name: 'Champs-Élysées / Triangle d\'Or (8e)',
        pricePerNight: '200-360 €',
        occupancy: 72,
        description: "Le segment le plus premium de Paris. Tarifs moyens supérieurs à 350 €/nuit pour un T2. Clientèle ultra-haut de gamme, voyageurs d'affaires et touristes du luxe. Taux d'occupation plus faible compensé par des prix unitaires exceptionnels. Réservé aux biens de standing avec décoration soignée.",
        roiBrut: '3 à 4 %',
      },
      {
        name: 'Opéra / Grands Boulevards (9e)',
        pricePerNight: '120-180 €',
        occupancy: 76,
        description: "Quartier central et bien desservi, à mi-chemin entre tourisme et affaires. Proximité des grands magasins, Opéra Garnier, gare Saint-Lazare. Clientèle équilibrée entre touristes et professionnels. Prix d'achat intermédiaires (T2 dès 400 000 €). Bonne alternative au Marais.",
        roiBrut: '4,5 à 5,5 %',
      },
    ],
    regulation: "Depuis le 1er janvier 2025, Paris applique une limite de 90 nuitées par an (contre 120 auparavant) pour la location de votre résidence principale en meublé touristique. Chaque propriété doit être enregistrée auprès de la mairie de Paris, qui délivre un numéro d'enregistrement à 13 chiffres obligatoirement affiché sur toute annonce en ligne. À partir du 20 mai 2026, un nouveau système national d'enregistrement remplacera les dispositifs locaux.\n\nPour louer une résidence secondaire en meublé touristique à Paris, vous devez obtenir une autorisation de changement d'usage auprès de la mairie. Dans les arrondissements centraux (1er au 11e), cette autorisation est soumise à une obligation de compensation : vous devez convertir une surface commerciale équivalente en logement résidentiel, via l'achat de « titres de commercialité » dont le coût oscille entre 300 et 500 €/m².\n\nLes sanctions en 2026 sont dissuasives : 10 000 € d'amende pour défaut d'enregistrement, 50 000 € pour location d'une résidence secondaire sans autorisation de changement d'usage, et 10 000 € pour dépassement du seuil de 90 nuitées. Paris déploie des agents de contrôle et utilise des outils de détection automatique pour croiser les annonces en ligne avec les déclarations en mairie.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** Variable selon le classement de l'hébergement, collectée automatiquement par Airbnb.",
    concreteExample: {
      bienType: 'T2',
      surface: 35,
      pricePerNight: 140,
      neighborhood: 'Bastille (11e)',
      revenuBrut: 34000,
      commissionRate: 0.22,
      menageCount: 180,
      menageUnitCost: 55,
    },
    extraFaq: [
      {
        q: 'La limite de 90 jours à Paris s\'applique-t-elle à tous les types de biens ?',
        a: "Non, la limite de 90 nuitées par an ne concerne que les résidences principales (le logement où vous vivez au moins 8 mois par an). Si votre bien est une résidence secondaire, vous pouvez en théorie louer toute l'année, mais uniquement après avoir obtenu une autorisation de changement d'usage auprès de la mairie de Paris. Cette autorisation implique une compensation (achat de titres de commercialité) dont le coût varie de 15 000 à 25 000 € dans les arrondissements centraux.",
      },
      {
        q: 'Quelle commission est raisonnable pour une conciergerie à Paris ?',
        a: "À Paris, les commissions oscillent entre 18 % et 25 %, avec une moyenne autour de 20-22 %. En dessous de 18 %, méfiance : le service est souvent réduit. Au-dessus de 25 %, la rentabilité nette se comprime fortement, surtout sur les petits biens. Le point crucial n'est pas le taux seul, mais le modèle de facturation du ménage : s'il est refacturé au voyageur, il ne grève pas votre marge. S'il est inclus dans la commission, votre coût réel dépasse souvent 30 %.",
      },
      {
        q: 'Le marché Airbnb à Paris est-il saturé avec 55 000 annonces actives ?',
        a: "Le marché est extrêmement compétitif mais pas saturé. Avec 35 millions de touristes par an et un taux d'occupation médian de 78 %, la demande reste largement supérieure à l'offre. Les biens bien positionnés (emplacement central, photos professionnelles, note > 4,8) se louent sans difficulté. La vraie menace n'est pas la saturation mais le durcissement réglementaire : la réduction à 90 jours pousse les propriétaires les moins sérieux hors du marché.",
      },
    ],
    updatedAt: '2026-04-13',
  },
  // ==========================================================================
  // AGDE
  // ==========================================================================
  {
    slug: 'agde',
    displayName: 'Agde',
    region: 'Occitanie',
    regionSlug: 'occitanie',
    title: "Conciergerie Agde / Cap d'Agde Airbnb : comparatif 2026 des meilleures agences",
    metaTitle: "Conciergerie Agde & Cap d'Agde Airbnb : Comparatif 2026 (tarifs & avis)",
    metaDescription: "Comparatif neutre des 6 meilleures conciergeries Airbnb d'Agde et du Cap d'Agde. Commission (20 %), services, avis, réglementation 2026, quartiers rentables. Guide complet.",
    kwPrincipal: 'conciergerie agde',
    kwSecondaires: ["conciergerie cap d'agde", "conciergerie airbnb cap d'agde", 'conciergerie location saisonnière agde', 'gestion locative agde', "meilleure conciergerie cap d'agde"],
    population: 29612,
    tourists: 3000000,
    activeListings: 1847,
    priceLow: 55,
    priceHigh: 150,
    occupancyRate: 68,
    revpar: 67,
    seasonality: "Très forte saisonnalité estivale : pic juillet-août (+74 % sur les prix, occupation 85-95 %). Saison exploitable mai-septembre (80 % du CA). Creux hivernal marqué (30-40 % d'occupation).",
    rankNational: 8,
    introCustom: "Vous possédez un appartement au Cap d'Agde ou à Agde que vous louez sur Airbnb, ou que vous envisagez de mettre en location courte durée. Première station balnéaire de France avec 3 millions de touristes par an et 175 000 lits, le potentiel est évident — mais la saisonnalité extrême (80 % du CA concentré sur mai-septembre) rend le choix d'une bonne conciergerie déterminant pour votre rentabilité.",
    marketIntro: "Agde et le Cap d'Agde forment la première station balnéaire de France par capacité d'hébergement, avec plus de 15 millions de nuitées par an. Le marché LCD y est atypique : près de 1 850 annonces actives pour une commune de 30 000 habitants, un ratio parmi les plus élevés de France. Le taux d'occupation annuel moyen de 68 % masque une réalité très contrastée : 85-95 % en juillet-août, mais seulement 30-40 % de novembre à mars. Le RevPAR de 67 € est 15 % supérieur à la moyenne régionale Occitanie, porté par les tarifs estivaux.",
    conciergeries: [
      {
        name: "HostnFly Cap d'Agde",
        url: 'https://www.hostnfly.com/conciergerie-airbnb/cap-d-agde',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.6,
        reviews: 4000,
        biensGeres: 100,
        specialty: '#1 France en volume, diffusion multi-plateforme',
        description: "Leader national de la conciergerie Airbnb, HostnFly gère plus de 100 logements au Cap d'Agde avec une équipe locale disponible 7j/7. Commission à partir de 20 %, ménage refacturé au voyageur, photos pro incluses, pricing dynamique, diffusion sur 10+ plateformes et assurance jusqu'à 2 500 €. Idéale pour les propriétaires qui veulent un process industrialisé et zéro gestion.",
      },
      {
        name: 'POM Conciergerie',
        url: 'https://pomconciergerie.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 45,
        biensGeres: 60,
        specialty: 'Ancrage local Rochelongue, expertise réglementaire',
        description: "Installée dans le quartier de Rochelongue au Cap d'Agde, POM Conciergerie est spécialisée dans la gestion des locations saisonnières avec optimisation calendrier et pricing. Elle publie des guides complets sur la réglementation locale et accompagne les propriétaires dans leurs démarches administratives. Bonne option pour un propriétaire qui débute.",
      },
      {
        name: 'FLT Conciergerie',
        url: 'https://www.fltconciergerie.fr/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 30,
        biensGeres: 50,
        specialty: 'Couverture littorale large (Vias, Portiragnes, Sérignan)',
        description: "Fondée par une équipe passionnée d'immobilier, FLT Conciergerie gère plus de 50 propriétés sur le littoral héraultais, du Cap d'Agde jusqu'à Sérignan. Disponible 24h/24, elle mise sur la proximité et l'excellence de service. Bonne option si votre bien est à Vias-Plage ou Portiragnes.",
      },
      {
        name: 'YourHostHelper Agde',
        url: 'https://yourhosthelper.com/conciergerie-agde/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.5,
        reviews: 90,
        biensGeres: 80,
        specialty: 'Pricing dynamique, photos pro incluses, dashboard propriétaire',
        description: "Franchise nationale présente dans plus de 20 villes, YourHostHelper Agde propose une commission fixe de 20 % sans frais d'entrée ni d'engagement. Photos professionnelles gratuites au lancement, pricing dynamique quotidien et dashboard de suivi des revenus. Le modèle franchise offre des outils tech avancés.",
      },
      {
        name: "Conciergerie du Cap d'Agde (CnC Property)",
        url: 'https://www.conciergerie-capdagde.com',
        commission: '20 %',
        menage: 'variable',
        rating: 4.0,
        reviews: 34,
        biensGeres: 40,
        specialty: 'Consigne à clés 24h/24 sous vidéo-surveillance',
        description: "CnC Property se distingue par son système de consigne à clés disponible 24h/24 et 7j/7 sous vidéo-surveillance, avec deux points de retrait au Cap d'Agde. Elle propose un réseau de prestataires locaux (ménage, linge, maintenance) et un service immobilier avec visites virtuelles 360°. Bonne option pour les propriétaires non-résidents.",
      },
      {
        name: "BnB Cap d'Agde",
        url: 'https://www.bnbcapdagde.com/',
        commission: 'Forfaitaire (pack complet dès 60 €)',
        menage: 'refacturé voyageur',
        rating: 4.6,
        reviews: 25,
        biensGeres: 30,
        specialty: 'Tarification à la prestation (pas de pourcentage)',
        description: "BnB Cap d'Agde fonctionne sur un modèle de forfaits à la carte plutôt qu'une commission en pourcentage : pack complet à partir de 60 € (clés + état des lieux), ménage pro dès 80 €. Ce modèle est intéressant pour les propriétaires avec un fort volume de réservations qui préfèrent payer au service.",
      },
    ],
    neighborhoods: [
      {
        name: "Cap d'Agde - Front de mer (Roquille, Môle, Centre-Port)",
        pricePerNight: '90-150 €',
        occupancy: 80,
        description: "Cœur de la station, face à la mer, accès direct plages et port. Prix au m² de 3 500 à 4 500 €. Clientèle familiale et touristique premium en été. Ticket d'entrée pour un T2 : 120 000-150 000 €. La zone la plus demandée mais aussi la plus chère à l'achat.",
        roiBrut: '5 à 6 %',
      },
      {
        name: "Cap d'Agde - Rochelongue / Périphérie",
        pricePerNight: '55-90 €',
        occupancy: 58,
        description: "En retrait du front de mer, Rochelongue offre des prix d'achat plus accessibles (2 000-2 500 €/m², T2 dès 70 000 €). Les plages restent à quelques minutes à pied. Taux d'occupation en baisse hors saison. Bon point d'entrée pour un premier investissement à petit budget.",
        roiBrut: '3,5 à 5 %',
      },
      {
        name: "Le Grau d'Agde",
        pricePerNight: '65-130 €',
        occupancy: 65,
        description: "Village de pêcheurs à l'embouchure de l'Hérault, ambiance plus authentique et familiale que le Cap. Clientèle appréciant le calme et les restaurants de poisson. Marché moins concurrentiel que le Cap.",
        roiBrut: '4 à 5,5 %',
      },
      {
        name: 'Centre-ville Agde',
        pricePerNight: '45-80 €',
        occupancy: 50,
        description: "Le centre historique d'Agde en pierre basaltique noire attire une clientèle culturelle (cathédrale Saint-Étienne, musée de l'Éphèbe). Prix d'achat bas (1 800-2 500 €/m²). Moins de demande LCD que la côte, mais marché moins saturé et biens atypiques.",
        roiBrut: '3,5 à 5 %',
      },
      {
        name: 'La Tamarissière',
        pricePerNight: '80-140 €',
        occupancy: 60,
        description: "Quartier boisé entre pinède et Hérault, à l'ouest de la commune. Environnement calme, nature, idéal pour familles en quête de sérénité. Offre limitée (essentiellement maisons et villas), ce qui réduit la concurrence. Bonne rentabilité sur les grands biens (T3+ avec jardin).",
        roiBrut: '4 à 5,5 %',
      },
    ],
    regulation: "Au Cap d'Agde, toute location meublée touristique doit être déclarée en mairie via le formulaire CERFA n°14004*04, qui attribue un numéro d'enregistrement obligatoire sur toutes les annonces en ligne (amende de 450 € en cas de manquement). Le Cap d'Agde n'est pas encore soumis au système de quotas avec compensation applicable dans certaines villes (Paris, Lyon, Sète), mais une demande de changement d'usage peut être requise pour les résidences secondaires.\n\nDepuis la loi du 19 novembre 2024, tous les meublés de tourisme devront être enregistrés sur un téléservice national d'ici le 20 mai 2026 (amende de 10 000 € pour défaut d'enregistrement, 20 000 € pour fausse déclaration). Les communes peuvent désormais limiter à 90 jours par an la durée de location des résidences principales.\n\nAgde applique la taxe de séjour au régime proportionnel : pour les meublés non classés, 5 % du coût net de la nuitée par personne, plafonné à 4,60 €, majoré de 10 % de taxe additionnelle départementale (Hérault) et 34 % de taxe additionnelle régionale.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** Variable selon le classement de l'hébergement, collectée automatiquement par Airbnb.",
    concreteExample: {
      bienType: 'T2',
      surface: 30,
      pricePerNight: 85,
      neighborhood: "Cap d'Agde Centre-Port",
      revenuBrut: 19720,
      commissionRate: 0.20,
      menageCount: 80,
      menageUnitCost: 35,
    },
    extraFaq: [
      {
        q: "Le Cap d'Agde est-il trop saisonnier pour rentabiliser une location courte durée toute l'année ?",
        a: "Oui, la saisonnalité est le principal défi du Cap d'Agde. Juillet-août représentent à eux seuls 40-50 % du chiffre d'affaires annuel, et la saison exploitable (mai-septembre) génère 80 % des revenus. Hors saison, le taux d'occupation tombe à 30-40 %. Pour compenser, les bonnes conciergeries locales pratiquent du pricing agressif en basse saison et ciblent les weekends prolongés et les événements locaux.",
      },
      {
        q: "Faut-il déclarer sa location au Cap d'Agde même si Airbnb collecte déjà la taxe de séjour ?",
        a: "Oui, absolument. La collecte automatique de la taxe de séjour par Airbnb ne vous dispense pas de déclarer votre meublé de tourisme en mairie (CERFA n°14004*04) ni de vous inscrire sur le téléservice national avant mai 2026. Ce sont deux obligations distinctes. Sans le numéro d'enregistrement, vous risquez une amende de 450 €, et à partir de 2026, jusqu'à 10 000 €.",
      },
      {
        q: "Studio ou T2 : quel type de bien est le plus rentable au Cap d'Agde ?",
        a: "Au Cap d'Agde, le T2 (1 chambre, 25-35 m²) offre le meilleur compromis rentabilité/investissement. Les studios peinent à justifier un tarif supérieur à 50-60 €/nuit même en haute saison, tandis que le T2 permet de facturer 80-120 €/nuit et d'accueillir 4 personnes. Pour un premier investissement à moins de 120 000 €, le T2 Centre-Port ou Roquille est le meilleur choix.",
      },
    ],
    updatedAt: '2026-04-13',
  },
  // ==========================================================================
  // LES SABLES-D'OLONNE
  // ==========================================================================
  {
    slug: 'les-sables-d-olonne',
    displayName: "Les Sables-d'Olonne",
    region: 'Pays de la Loire',
    regionSlug: 'pays-de-la-loire',
    title: "Conciergerie Les Sables-d'Olonne : comparatif 2026 des 6 meilleures agences",
    metaTitle: "Conciergerie Les Sables-d'Olonne : Comparatif 2026 (tarifs & avis)",
    metaDescription:
      "Comparatif neutre des 6 meilleures conciergeries Airbnb aux Sables-d'Olonne. Tarifs (18-30 %), services, avis, réglementation 2026, quartiers rentables. Guide complet.",
    kwPrincipal: 'conciergerie aux sables d olonne',
    kwSecondaires: [
      'conciergerie airbnb les sables d olonne',
      'conciergerie location saisonnière vendée',
      'gestion locative les sables d olonne',
      'conciergerie vendée',
      'conciergerie airbnb vendée',
    ],
    population: 51800,
    tourists: 3000000,
    activeListings: 1350,
    priceLow: 50,
    priceHigh: 230,
    occupancyRate: 52,
    revpar: 62,
    seasonality: 'Très fortement estivale (75 % du CA en juillet-août). Août = 186 €/nuit (+55 %). Pics secondaires : Vendée Globe, Pâques, ponts de mai.',
    rankNational: 8,
    introCustom:
      "Vous avez un appartement aux Sables-d'Olonne que vous louez sur Airbnb ou que vous envisagez de mettre en location saisonnière. Entre les check-in à gérer pendant les vacances d'été, le ménage entre chaque rotation et la réglementation locale parmi les plus strictes de France, vous vous demandez si confier la gestion à une conciergerie est vraiment rentable. Et surtout : laquelle choisir dans une ville où l'offre de conciergeries explose ?",
    marketIntro:
      "Les Sables-d'Olonne est la station balnéaire phare de la Vendée et l'une des destinations les plus dynamiques de la côte atlantique. Avec 3 millions de visiteurs par an, un marché très saisonnier (75 % du chiffre d'affaires concentré en juillet-août) et un prix moyen de 120 €/nuit, la ville offre un potentiel locatif intéressant mais exigeant. Le marché est aussi l'un des plus réglementés de France : quota de 2 500 enregistrements saisonniers, primes de conversion vers la location longue durée (450 logements déjà convertis), et obligations DPE renforcées depuis la loi Le Meur 2024. La ville se classe 8e en France pour la proportion de résidences secondaires et 24e pour la collecte Airbnb de taxe de séjour.",
    conciergeries: [
      {
        name: 'La Clé Chaumoise',
        url: 'https://laclechaumoise.fr/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 5.0,
        reviews: 84,
        biensGeres: 50,
        specialty: 'Ancrage local + consigne bagages',
        description:
          "Conciergerie 100 % vendéenne fondée par Soliane, La Clé Chaumoise dispose de 2 pôles aux Sables-d'Olonne pour une réactivité maximale. Ouverte 7j/7 de 9h à 17h avec astreinte en dehors, elle couvre toute l'agglomération jusqu'à Noirmoutier et La Tranche-sur-Mer. Service différenciant : consigne à bagages pour les voyageurs en attente de check-in. Note Google parfaite de 5.0/5 sur 84 avis, avec des retours soulignant l'accueil personnalisé et la réactivité.",
      },
      {
        name: 'Simeo Conciergerie',
        url: 'https://simeo-conciergerie.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 43,
        biensGeres: 40,
        specialty: 'Équipe locale structurée (~10 personnes)',
        description:
          "Fondée par Simon et Léo, Simeo s'est imposée en 2 ans comme la conciergerie n°1 autoproclamée des Sables. Équipe locale d'une dizaine de personnes gérant ménage, linge, intendance et suivi des logements. Plus de 40 propriétaires lui font confiance et 2 300+ voyageurs Airbnb accueillis. Revendique +30 % de revenus locatifs pour ses propriétaires. Note Google 4.9/5 sur 43 avis.",
      },
      {
        name: 'On est là pour Toit',
        url: 'https://onestlapourtoit.fr/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 25,
        biensGeres: 35,
        specialty: 'Installé sur le Remblai, carte professionnelle G',
        description:
          "Installé physiquement le long de la Grande Plage sur le Remblai, On est là pour Toit est une SARL immatriculée CCI Vendée avec carte professionnelle G (gestion immobilière) et garantie financière de 120 000 €. Jérémy, le fondateur, est salué pour son professionnalisme et sa réactivité. Spécialisé dans la gestion multi-plateforme (Airbnb, Abritel, Booking.com) et les résidences secondaires. Note 4.9/5 sur 25 avis. Le nom, facile à retenir, témoigne d'une approche relationnelle forte.",
      },
      {
        name: 'HostnFly',
        url: 'https://www.hostnfly.com/conciergerie-airbnb/les-sables-d-olonne',
        commission: 'à partir de 20 %',
        menage: 'inclus dans commission',
        rating: 4.6,
        reviews: 4000,
        biensGeres: 100,
        specialty: 'Réseau national, diffusion 10+ plateformes',
        description:
          "Acteur national présent dans 100+ villes, HostnFly revendique plus de 100 logements gérés aux Sables-d'Olonne et environs (entre La Roche-sur-Yon et La Tranche-sur-Mer). Commission à partir de 20 %, ménage inclus dans la commission (attention : cela impacte la marge sur séjours courts). Diffusion sur 10+ plateformes, pricing dynamique, assurance casse. Note globale 4.6/5 sur 4 000+ avis nationaux. Idéal pour les propriétaires qui veulent un acteur solide et structuré.",
      },
      {
        name: 'La Petite Conciergerie Vendéenne',
        url: 'https://lapetiteconciergerievendeenne.com/',
        commission: '22 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 10,
        biensGeres: 25,
        specialty: 'Fondatrice ex-hôtellerie (20+ ans)',
        description:
          "Fondée en 2019 par Christelle, forte de 20 ans d'expérience en hôtellerie en France et à l'étranger, La Petite Conciergerie Vendéenne mise sur la qualité de service hôtelière appliquée à la location saisonnière. Spécialisée maisons, villas et appartements sur l'agglo des Sables. Structure artisanale avec un suivi personnalisé de chaque bien. Basée à l'Île-d'Olonne. 10 avis positifs, note 4.8/5.",
      },
      {
        name: 'Hôte de Gamme',
        url: 'https://hote-de-gamme.fr/conciergerie-vendee/conciergerie-les-sables-d-olonne/',
        commission: '25-30 %',
        menage: 'inclus dans commission',
        rating: 4.9,
        reviews: 75,
        biensGeres: 30,
        specialty: 'Segment premium (>120 €/nuit)',
        description:
          "Positionnée sur le segment haut de gamme, Hôte de Gamme facture 25 à 30 % mais inclut photos professionnelles, staging, pricing dynamique, accueil personnalisé et plateaux de bienvenue. City Manager dédié : Benjamin pour Les Sables. Présente aussi en Gironde. Idéale pour les villas avec piscine ou les appartements vue mer sur le Remblai. Si votre bien est un studio standard, le rapport qualité/prix ne sera pas au rendez-vous. Note 4.9/5 sur 75 avis (national).",
      },
    ],
    neighborhoods: [
      {
        name: 'Le Remblai (front de mer)',
        pricePerNight: '120-230 €',
        occupancy: 62,
        description:
          "La promenade iconique des Sables, face à la Grande Plage. Les appartements vue mer y atteignent les tarifs les plus élevés de la ville, surtout en été. Forte concurrence mais demande constante de mai à septembre. Ticket d'entrée : T2 à partir de 250 000 €.",
        roiBrut: '5 à 7 %',
      },
      {
        name: 'La Chaume',
        pricePerNight: '80-140 €',
        occupancy: 55,
        description:
          "Ancien quartier de marins et pêcheurs, La Chaume offre un charme authentique avec ses ruelles étroites et maisons blanchies à la chaux. Moins cher que le Remblai mais très prisée par une clientèle en quête d'authenticité. Accès plage par la navette maritime. T2 dès 190 000 €.",
        roiBrut: '5 à 6 %',
      },
      {
        name: 'Les Présidents',
        pricePerNight: '90-160 €',
        occupancy: 58,
        description:
          "Quartier résidentiel à 100 m de la mer, au sud du Remblai. Maisons avec jardin et appartements familiaux. Proche du centre de thalassothérapie et de l'Institut Sport Océan. Clientèle familiale, séjours plus longs (semaine). Maison 4 pers. dès 800 €/semaine.",
        roiBrut: '4,5 à 6 %',
      },
      {
        name: "Le Château-d'Olonne",
        pricePerNight: '50-100 €',
        occupancy: 45,
        description:
          "Ancienne commune fusionnée en 2019, à 3 km du centre. Plage de Tanchet et lac à 400 m. Prix d'achat plus accessibles, idéal pour des villas avec piscine. 49 % des biens dans la tranche 50-100 €/nuit. Moins de demande hors saison mais excellent rapport prix/prestations en été.",
        roiBrut: '4 à 5,5 %',
      },
      {
        name: 'Olonne-sur-Mer',
        pricePerNight: '50-90 €',
        occupancy: 40,
        description:
          "Partie la plus rurale de la commune nouvelle, à 3,5 km de la plage. Villas et gîtes dans un cadre verdoyant. Prix d'achat les plus bas de l'agglomération. Convient aux familles en voiture. Taux d'occupation plus faible hors juillet-août, mais bon rendement estival grâce aux prix d'achat contenus.",
        roiBrut: '4 à 5 %',
      },
    ],
    regulation:
      "Les Sables-d'Olonne est l'une des communes françaises les plus strictes en matière de location courte durée. 8e ville de France pour la proportion de résidences secondaires (jusqu'à 70 % dans certains quartiers), la municipalité a mis en place un dispositif pionnier.\n\n**Quota et enregistrement.** Un plafond de 2 500 enregistrements saisonniers a été instauré sur l'agglomération. Tout meublé de tourisme doit obtenir un numéro d'enregistrement (article L.324-2-1 du Code du Tourisme), obligatoire sur toutes les annonces, sous peine d'une amende civile pouvant atteindre 5 000 €. La résidence principale est limitée à 120 nuits/an ; au-delà, une autorisation de changement d'usage est obligatoire.\n\n**Compensation financière.** Depuis 2022, la ville offre une prime de 5 000 à 10 000 € (sur 3 ans) aux propriétaires qui convertissent un meublé saisonnier en location à l'année. Coût pour la commune : 450 000 €/an, compensé par ~2 M€ de taxe de séjour collectée. Résultat : 450 logements convertis en 3 ans. Le dispositif a été renouvelé pour 3 ans en 2025.\n\n**DPE et loi Le Meur.** Depuis le 21 novembre 2024, tout nouveau meublé touristique soumis à changement d'usage doit présenter un DPE classé entre A et E (A-D à partir de 2034). Le maire peut à tout moment demander le DPE au propriétaire, sous peine de 5 000 € d'amende.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** Taxe intercommunale du 1er janvier au 31 décembre. Meublé non classé : jusqu'à 4,40 €/nuit/personne. Meublé classé : à partir de 0,80 €. Les plateformes (Airbnb, Booking) collectent automatiquement. En 2022, Airbnb seul a reversé 440 000 € à la commune, devançant Arcachon, Deauville et Saint-Tropez.",
    concreteExample: {
      bienType: 'T2 vue mer partielle',
      surface: 38,
      pricePerNight: 110,
      neighborhood: 'Le Remblai (front de mer)',
      revenuBrut: 20900,
      commissionRate: 0.2,
      menageCount: 95,
      menageUnitCost: 40,
    },
    extraFaq: [
      {
        q: "Quelles sont les contraintes spécifiques de la réglementation aux Sables-d'Olonne ?",
        a: "Les Sables-d'Olonne applique un quota de 2 500 enregistrements saisonniers sur l'agglomération et une prime de 5 000 à 10 000 € pour inciter les propriétaires à convertir en location longue durée. Tout meublé touristique doit obtenir un numéro d'enregistrement et, pour les résidences secondaires, une autorisation de changement d'usage. Depuis 2024, le DPE doit être classé entre A et E (A-D à partir de 2034). Vérifiez auprès de la mairie que votre bien est éligible avant de signer avec une conciergerie.",
      },
      {
        q: 'La saisonnalité très marquée rend-elle la conciergerie moins rentable aux Sables ?',
        a: "La saisonnalité est effectivement le défi majeur : le taux d'occupation moyen annuel est de 52 %, mais il dépasse 85 % en juillet-août avec des tarifs à 186 €/nuit (+55 %). Les bonnes conciergeries compensent en optimisant les pics (pricing dynamique, séjours minimum de 3-5 nuits en été) et en activant la demande hors saison (week-ends, ponts de mai, Toussaint, télétravail). Un bien bien positionné sur le Remblai peut générer 70 % de son CA annuel en 10 semaines d'été.",
      },
      {
        q: "La conciergerie vaut-elle le coup pour un bien au Château-d'Olonne ou à Olonne-sur-Mer ?",
        a: "Ces zones offrent des prix d'achat plus bas mais un taux d'occupation inférieur (40-45 % en annuel). La conciergerie y est pertinente si votre bien a un atout différenciant (piscine, grand jardin, proximité plage de Tanchet). Privilégiez une conciergerie locale qui connaît la demande de ces secteurs (La Clé Chaumoise, Simeo) plutôt qu'un acteur national. Le seuil de rentabilité est généralement atteint à partir de 15 000 € de revenu brut annuel.",
      },
    ],
    updatedAt: '2026-04-13',
  },
  // ==========================================================================
  // CANNES
  // ==========================================================================
  {
    slug: 'cannes',
    displayName: 'Cannes',
    region: "Provence-Alpes-Côte d'Azur",
    regionSlug: 'provence-alpes-cote-dazur',
    title: 'Conciergerie Cannes Airbnb : comparatif 2026 des 7 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Cannes : Comparatif 2026 (tarifs & avis)',
    metaDescription:
      'Comparatif des 7 meilleures conciergeries Airbnb à Cannes. Tarifs (18-25 %), stratégie Festival & MIPIM, réglementation zone tendue, quartiers rentables.',
    kwPrincipal: 'conciergerie airbnb cannes',
    kwSecondaires: [
      'conciergerie cannes',
      'gestion locative cannes',
      'location courte durée cannes',
      'airbnb cannes festival',
      'meublé touristique cannes',
    ],
    population: 74152,
    tourists: 3000000,
    activeListings: 8865,
    priceLow: 120,
    priceHigh: 450,
    occupancyRate: 51,
    revpar: 110,
    seasonality:
      "Saisonnalité exceptionnelle dopée par les événements : Festival de Cannes mi-mai (x3 des tarifs, séjours minimum 7-11 nuits), MIPIM en mars (x2,5, hôtels complets 6 mois à l'avance), Cannes Yachting Festival début septembre, MIPCOM mi-octobre et Cannes Lions en juin. Haute saison plages juin-septembre, creux novembre-février hors événements.",
    rankNational: 8,
    introCustom:
      "Vous avez un appartement à **Cannes** que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée.\n\nEntre les stratégies de tarification pendant le **Festival (+300 %)**, la clientèle ultra-internationale et la **réglementation zone tendue** parmi les plus strictes de France, vous vous demandez si confier la gestion à une conciergerie est vraiment rentable.\n\nEt surtout : **laquelle choisir** parmi les agences cannoises, dont plusieurs sont nées ici ?",
    marketIntro:
      "Cannes est l'un des marchés LCD les plus lucratifs de France, avec un **revenu moyen par annonce autour de 39 500 €/an**.\n\nLe **Festival de Cannes**, le MIPIM, le MIPCOM, les Cannes Lions et le Yachting Festival génèrent des pics où les tarifs sont **multipliés par 2,5 à 3**.\n\nMais le marché est aussi l'un des plus régulés : classée **zone tendue**, la ville plafonne les résidences principales à **90 nuitées par an** (contre 120 au niveau national), impose un changement d'usage avec compensation pour les résidences secondaires et applique des amendes jusqu'à **100 000 €**.\n\nLe nombre d'annonces Airbnb a baissé de 8 % sur un an (mars 2026) sous l'effet combiné de la **loi Le Meur** et du durcissement local.",
    conciergeries: [
      {
        name: 'YourHostHelper Cannes',
        url: 'https://yourhosthelper.com/conciergerie-cannes/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 180,
        biensGeres: 120,
        specialty: 'Réseau fondé à Cannes en 2017',
        description:
          "YourHostHelper est né à Cannes en 2017 avant de devenir un réseau national présent dans 20+ villes. Commission de 20 % sans frais fixes, ménage refacturé au voyageur. Photos pro incluses, pricing dynamique, expertise prouvée sur les pics Festival et MIPIM. Bon rapport qualité/prix pour un T1-T2 standard sur la Croisette ou en centre-ville.",
      },
      {
        name: 'Welkeys Cannes',
        url: 'https://www.welkeys.com/conciergerie-airbnb/cannes',
        commission: '22-25 %',
        menage: 'refacturé voyageur',
        rating: 4.6,
        reviews: 210,
        biensGeres: 150,
        specialty: 'Premium & pricing agressif événements',
        description:
          "Acteur national premium, Welkeys maîtrise la stratégie de pricing pendant le Festival et le MIPIM avec des tarifs parfois multipliés par 2,5 à 3. Commission 22-25 % selon le niveau de service, ménage refacturé au voyageur. Suivi rigoureux des avis et maintenance soignée, idéal pour les biens standing sur la Croisette ou à la Pointe Croisette.",
      },
      {
        name: 'Manasteos Cannes',
        url: 'https://manasteos.com/conciergerie/cannes/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 5.0,
        reviews: 55,
        biensGeres: 60,
        specialty: 'Note Google 5,0/5, outil propriétaire',
        description:
          "Conciergerie structurée autour d'une plateforme propriétaire (check-in, ménage, linge, optimisation revenus) avec une note Google parfaite de 5.0/5. Commission 20 % HT all-inclusive, ménage refacturé au voyageur. Plébiscitée par les investisseurs cannois qui cherchent un reporting transparent et une qualité opérationnelle sans accroc.",
      },
      {
        name: 'BnB Groom Services',
        url: 'https://bnbgroomservices.com/',
        commission: '22 %',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 95,
        biensGeres: 80,
        specialty: 'Conciergerie + agence immobilière',
        description:
          "Implantée sur la Côte d'Azur depuis 2014, BnB Groom combine gestion locative et expertise immobilière (conseil achat, transaction). Commission 22 %, ménage refacturé voyageur. Les propriétaires citent un pricing fin adapté à chaque période et un contact humain réactif, avec une équipe à taille humaine sur Cannes et Mougins.",
      },
      {
        name: 'HostnFly Cannes',
        url: 'https://hostnfly.com/conciergerie-airbnb/cannes',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.5,
        reviews: 140,
        biensGeres: 110,
        specialty: 'Tech + yield management algorithmique',
        description:
          "Solution clé en main avec algorithme de tarification dynamique propriétaire et 150 000+ réservations gérées par an au niveau national. Commission à partir de 20 %, ménage refacturé voyageur, diffusion 10+ plateformes, assurance incluse. Idéal pour les propriétaires qui veulent un process industrialisé et zéro gestion.",
      },
      {
        name: 'Croceo',
        url: 'https://www.croceo.fr/conciergerie-airbnb-cannes',
        commission: '18 %',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 70,
        biensGeres: 55,
        specialty: 'Conciergerie boutique Côte d\'Azur',
        description:
          "Croceo se positionne comme une conciergerie boutique sur la Côte d'Azur, avec une commission parmi les plus basses du marché cannois (18 %). Prend en charge l'ensemble des étapes : accueil, ménage, maintenance, optimisation revenus. Suivi personnalisé idéal pour un propriétaire qui veut rester très proche de la gestion de son bien.",
      },
      {
        name: 'Nestify Cannes',
        url: 'https://www.nestify.fr/conciergerie-airbnb-cannes/',
        commission: '22 %',
        menage: 'refacturé voyageur',
        rating: 4.4,
        reviews: 85,
        biensGeres: 75,
        specialty: 'Gestion A à Z multi-plateformes',
        description:
          "Nestify couvre la création et la diffusion multi-plateformes (Airbnb, Booking, Vrbo), gestion complète des séjours et reporting financier mensuel. Commission 22 %, ménage refacturé voyageur. Structure intermédiaire entre boutique locale et plateforme nationale, bon compromis pour un bien premium en centre-ville.",
      },
    ],
    neighborhoods: [
      {
        name: 'La Croisette',
        pricePerNight: '280-900 €',
        occupancy: 62,
        description:
          "Front de mer mythique face au Palais des Festivals, clientèle internationale premium. Tarifs records pendant le Festival et le MIPIM — numéro d'enregistrement et compensation obligatoires (zone tendue). T2 à partir de 500 000 €.",
        roiBrut: '4 à 4,5 %',
      },
      {
        name: 'Le Suquet (vieille ville)',
        pricePerNight: '140-320 €',
        occupancy: 58,
        description:
          "Cœur historique avec ruelles pavées, vue panoramique depuis la tour du Suquet et restaurants animés. Très prisé des couples et des voyageurs en quête d'authenticité. Désormais zone régulée par la mairie (août 2025).",
        roiBrut: '5,5 à 6 %',
      },
      {
        name: 'Palm Beach / Pointe Croisette',
        pricePerNight: '220-600 €',
        occupancy: 55,
        description:
          "Péninsule chic à l'est de la Croisette avec casino Palm Beach et plages privées. Appartements vue mer recherchés pour le Yachting Festival et les séjours haut de gamme estivaux. T3 à partir de 650 000 €.",
        roiBrut: '4,5 %',
      },
      {
        name: "Centre-ville / Rue d'Antibes",
        pricePerNight: '130-280 €',
        occupancy: 56,
        description:
          "Artère commerçante piétonne, à 5 min à pied du Palais et de la gare SNCF. Excellent rapport occupation/prix pour les voyageurs affaires (MIPIM, MIPCOM) et courts séjours. T2 à partir de 350 000 €.",
        roiBrut: '6 à 6,5 %',
      },
      {
        name: 'La Bocca',
        pricePerNight: '90-180 €',
        occupancy: 50,
        description:
          "Quartier ouest populaire en pleine requalification (port de La Bocca, plage du Midi). Ticket d'entrée accessible (T2 dès 220 000 €). Idéal pour un premier investissement LCD à Cannes, moins concurrentiel que l'hypercentre.",
        roiBrut: '7 à 7,5 %',
      },
      {
        name: 'Le Cannet (commune limitrophe)',
        pricePerNight: '100-200 €',
        occupancy: 48,
        description:
          "Commune résidentielle au calme sur les hauteurs, connexion rapide au centre de Cannes en bus. Réglementation LCD plus souple que Cannes intra-muros — réel atout pour investir sans changement d'usage compliqué.",
        roiBrut: '6,5 à 7 %',
      },
    ],
    regulation:
      "Cannes est classée **zone tendue** et applique l'une des réglementations LCD les plus strictes de France. La résidence principale en meublé de tourisme est plafonnée à **90 jours par an** (contre 120 au niveau national), et tout loueur doit obtenir un **numéro d'enregistrement à 13 chiffres** via le téléservice de la mairie avant toute mise en location.\n\n**Changement d'usage obligatoire.** Pour une résidence secondaire, un changement d'usage avec compensation est exigé : il faut transformer une surface équivalente de local commercial en logement. Cette contrainte est renforcée dans les périmètres de **la Croisette** et du **Suquet** depuis août 2025, sous l'impulsion du maire David Lisnard.\n\n**Loi Le Meur 2024.** L'enregistrement national est en cours de déploiement (plateforme unique avant mai 2026), le **DPE classe E minimum** est obligatoire (classe D à partir de 2034) et l'abattement micro-BIC passe à 30 % pour les meublés non classés (50 % pour les classés). Booking.com désactivera automatiquement les annonces sans numéro d'enregistrement avant le **20 mai 2026**.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour) & sanctions.** La taxe de séjour varie de 0,83 € à 4,40 € par nuit et par personne selon le classement, collectée automatiquement par Airbnb. Les amendes peuvent atteindre **100 000 €** pour location d'une résidence secondaire sans autorisation de changement d'usage — parmi les plus élevées de France.",
    concreteExample: {
      bienType: 'T2',
      surface: 42,
      pricePerNight: 185,
      neighborhood: "Centre-ville / Rue d'Antibes",
      revenuBrut: 35500,
      commissionRate: 0.22,
      menageCount: 85,
      menageUnitCost: 75,
    },
    extraFaq: [
      {
        q: 'Comment optimiser les tarifs pendant le Festival de Cannes et le MIPIM ?',
        a: "Les tarifs sont multipliés par 2,5 à 3 pendant le Festival (mi-mai) et le MIPIM (mars). Une conciergerie applique un yield management précis : ouverture des dates 12 mois à l'avance, minimum 7 nuits imposé (11 nuits pour le Festival 2026), tarifs 800 à 5 000 € par nuit selon surface et vue. Sans cette expertise, les propriétaires sous-vendent facilement de 30 à 50 % leurs biens pendant ces pics, ce qui représente une perte de 5 000 à 15 000 € sur seulement deux semaines.",
      },
      {
        q: 'Ma résidence secondaire à Cannes est-elle éligible à la location Airbnb ?',
        a: "Oui, mais avec changement d'usage et compensation obligatoire depuis que Cannes est zone tendue. Vous devez compenser la surface louée par la transformation d'un local commercial équivalent en logement — procédure longue et coûteuse. Les périmètres Croisette et Suquet sont désormais ultra-régulés depuis août 2025. Une conciergerie locale connaît les démarches et peut vous orienter vers des biens déjà autorisés ou des quartiers voisins (Le Cannet) moins contraints.",
      },
      {
        q: 'Quelle clientèle vise-t-on à Cannes et comment adapter son bien ?',
        a: "Clientèle à 70 % internationale (anglo-saxonne, moyen-orientale, asiatique) aux standards luxe : literie premium, wifi fibre, climatisation, smart TV, parking sécurisé, welcome pack. Pendant le Yachting Festival (septembre) et le Festival, attendez-vous à des demandes VIP : service de blanchisserie, chef privé, navette port. Une conciergerie bilingue anglais/français est quasi indispensable — sans elle, vous perdez la moitié du marché haut de gamme.",
      },
    ],
    updatedAt: '2026-04-20',
  },
  // ==========================================================================
  // RENNES
  // ==========================================================================
  {
    slug: 'rennes',
    displayName: 'Rennes',
    region: 'Bretagne',
    regionSlug: 'bretagne',
    title: 'Conciergerie Rennes Airbnb : comparatif 2026 des 7 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Rennes : Comparatif 2026 (tarifs & avis)',
    metaDescription:
      'Comparatif des 7 meilleures conciergeries Airbnb à Rennes. Tarifs (18-25 %), zone tendue, quartiers rentables, spécificités marché étudiant & business.',
    kwPrincipal: 'conciergerie airbnb rennes',
    kwSecondaires: [
      'conciergerie rennes',
      'gestion locative rennes',
      'location courte durée rennes',
      'airbnb rennes rentabilité',
      'meublé touristique rennes',
    ],
    population: 220488,
    tourists: 1200000,
    activeListings: 1550,
    priceLow: 55,
    priceHigh: 145,
    occupancyRate: 62,
    revpar: 51,
    seasonality:
      "Saisonnalité atypique pour une grande ville : pic d'activité mars-juin et septembre-octobre (tourisme d'affaires, congrès, rentrée étudiante avec 70 000 étudiants), creux en juillet-août (ville studieuse qui se vide). Temps forts : Les Transmusicales début décembre (+60 000 visiteurs, tarifs x2-3), Tombées de la Nuit en juillet, matchs du Stade Rennais. Clientèle majoritairement business + visites familiales d'étudiants.",
    rankNational: 18,
    introCustom:
      "Vous avez un appartement à **Rennes** que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée.\n\nEntre la **saisonnalité inversée** (creux estival, pic mars-juin), les **70 000 étudiants** dont les familles viennent les visiter, les **Transmusicales** qui font exploser la demande en décembre, et Rennes désormais classée zone tendue, vous vous demandez si confier la gestion à une conciergerie est vraiment rentable.\n\nEt surtout : **laquelle choisir**, entre Cocoonr (leader rennais fondé localement) et les indépendants nouveaux venus ?",
    marketIntro:
      "Rennes est le **2e marché locatif le plus tendu de France** après Paris et une destination LCD atypique.\n\n**70 000 étudiants**, 1,2 million de touristes par an, 2 gares (dont la **TGV à 1h25 de Paris**) : la demande est portée avant tout par le tourisme d'affaires et les visites familiales d'étudiants, pas par le tourisme classique.\n\nConséquence : le pic d'occupation est **mars-juin** (concours, soutenances) et **septembre-octobre** (rentrée), avec un creux estival quand les étudiants rentrent chez eux. La saisonnalité inversée avantage les propriétaires qui savent cibler cette clientèle mixte business + parents d'étudiants.\n\nRennes est classée **zone tendue depuis octobre 2023**, ce qui rend le choix d'une conciergerie locale d'autant plus stratégique pour rester en conformité.",
    conciergeries: [
      {
        name: 'Cocoonr Rennes',
        url: 'https://cocoonr.fr/conciergerie-bnb-rennes/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.2,
        reviews: 95,
        biensGeres: 400,
        specialty: 'Leader local, siège social à Rennes',
        description:
          "Cocoonr est la conciergerie historique rennaise, fondée localement et devenue un des plus gros acteurs français avec 2 000+ biens dans 15 villes. L'agence mère est à Rennes. Commission standard de 20 %, ménage refacturé voyageur. Large couverture géographique sur Rennes Métropole (Cesson-Sévigné, Chantepie, Pacé), équipe ménage internalisée. Le choix par défaut pour un bien standard.",
      },
      {
        name: 'Rennes Host',
        url: 'https://www.rennes-host.fr/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 42,
        biensGeres: 65,
        specialty: '100 % locale, indépendante',
        description:
          "Rennes Host est une conciergerie purement locale, dédiée au seul bassin rennais. Commission 20 %, ménage refacturé voyageur. Approche personnalisée et proximité terrain, avec une équipe dédiée qui connaît chaque quartier, chaque syndic et chaque artisan de la métropole. Idéal pour un propriétaire qui veut un interlocuteur unique et joignable.",
      },
      {
        name: 'Nooma & Co',
        url: 'https://www.nooma.fr/',
        commission: '20-25 %',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 58,
        biensGeres: 100,
        specialty: 'Gestion Rennes + Grand Ouest',
        description:
          "Nooma propose une gestion complète (réservations, accueil, ménage pro, dashboard propriétaire) avec une approche orientée investisseurs patrimoniaux. Commission 20-25 % selon la formule. Couverture Rennes + Grand Ouest, pertinente si vous avez plusieurs biens sur la région. Bonne qualité de reporting et de relation propriétaire.",
      },
      {
        name: 'JustUnToit Rennes',
        url: 'https://www.justuntoit.fr/la-conciergerie-a-rennes/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.6,
        reviews: 35,
        biensGeres: 80,
        specialty: 'Familiale, courte & moyenne durée',
        description:
          "Conciergerie familiale et professionnelle à Rennes, spécialisée courte ET moyenne durée (bail mobilité, étudiants Erasmus). Commission 20 %, ménage refacturé voyageur. Offre avec prestations quasi-hôtelières (linge, plateau de bienvenue) pour un positionnement haut de gamme sur les locations saisonnières et les séjours >30 nuits.",
      },
      {
        name: 'YourHostHelper Rennes',
        url: 'https://yourhosthelper.com/conciergerie-rennes/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.5,
        reviews: 48,
        biensGeres: 55,
        specialty: 'Réseau national, agence locale',
        description:
          "Franchise nationale avec une agence physique à Rennes. Commission 20 % sans frais fixes, ménage refacturé voyageur, photos pro et pricing dynamique inclus. Combine la standardisation des process (channel manager, dashboard propriétaire) et un suivi local par un agent dédié. Bon rapport qualité/prix pour les T1-T2 standards.",
      },
      {
        name: 'HostnFly Rennes',
        url: 'https://hostnfly.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.4,
        reviews: 30,
        biensGeres: 40,
        specialty: 'Tech + pricing algorithmique',
        description:
          "HostnFly propose une gestion via algorithme de pricing dynamique et automatisation des réservations. Présence nationale, couverture Rennes via agents mobiles et sous-traitance ménage locale. Commission 20 %, ménage refacturé voyageur. Pertinent pour un propriétaire qui préfère un acteur technologique à un indépendant local.",
      },
      {
        name: 'CheckIn Conciergerie Rennes',
        url: 'https://checkinconciergerie.com/conciergerie-rennes/',
        commission: '18-22 %',
        menage: 'refacturé voyageur',
        rating: 4.6,
        reviews: 22,
        biensGeres: 30,
        specialty: "Accueil physique 7j/7",
        description:
          "CheckIn Conciergerie se positionne sur la qualité d'accueil avec remise de clés en personne systématique. Commission 18-22 % selon formule, ménage refacturé voyageur. Cible des biens premium dans l'hypercentre et autour du Thabor. Petite structure avec un service très personnalisé.",
      },
    ],
    neighborhoods: [
      {
        name: 'Centre historique',
        pricePerNight: '85-160 €',
        occupancy: 72,
        description:
          "Cœur médiéval de Rennes avec ses maisons à pans de bois, place Sainte-Anne et rue Saint-Michel (« rue de la Soif »). Demande forte toute l'année, pics aux Transmusicales et aux week-ends festifs étudiants. T2 à partir de 280 000 €.",
        roiBrut: '6,5 à 7,5 %',
      },
      {
        name: 'Sainte-Anne',
        pricePerNight: '80-140 €',
        occupancy: 68,
        description:
          "Épicentre de la vie nocturne rennaise, avec la place Sainte-Anne et ses bars emblématiques. Excellent taux de remplissage le week-end, clientèle jeune et festive, proche du métro ligne A. T2 dès 250 000 €.",
        roiBrut: '6 à 7 %',
      },
      {
        name: 'Thabor / Saint-Martin',
        pricePerNight: '75-130 €',
        occupancy: 65,
        description:
          "Quartier bourgeois autour du parc du Thabor, prisé par la clientèle famille et business. Prix au m² parmi les plus élevés de Rennes (4 600-6 800 €/m²), ce qui pèse sur la rentabilité brute malgré des nuitées premium.",
        roiBrut: '5 à 6 %',
      },
      {
        name: 'Saint-Hélier',
        pricePerNight: '65-110 €',
        occupancy: 66,
        description:
          "Quartier résidentiel bien connecté à la gare et à l'hypercentre, idéal pour le tourisme d'affaires. Bon compromis entre prix d'achat modéré (T2 dès 200 000 €) et nuitées correctes. Zone en pleine valorisation.",
        roiBrut: '6,5 %',
      },
      {
        name: 'Rennes Sud-Gare (EuroRennes)',
        pricePerNight: '70-125 €',
        occupancy: 70,
        description:
          "Quartier d'affaires en pleine mutation autour de la gare TGV (Paris en 1h25). Clientèle business dominante en semaine, excellent pour le mid-term et les voyageurs professionnels. Parc immobilier récent, standing élevé.",
        roiBrut: '6,5 à 7 %',
      },
      {
        name: 'Villejean-Beauregard',
        pricePerNight: '50-90 €',
        occupancy: 58,
        description:
          "Quartier étudiant autour du campus Villejean (Université Rennes 2) et du CHU Pontchaillou. Rentabilité brute élevée grâce à des prix d'achat accessibles (2 700-3 200 €/m²), idéal pour la moyenne durée et les familles d'étudiants.",
        roiBrut: '7,5 à 8 %',
      },
    ],
    regulation:
      "Rennes est classée **zone tendue** depuis le décret d'octobre 2023 et fait partie des communes les plus encadrées de France en matière de location courte durée. La ville applique strictement la **loi Le Meur du 19 novembre 2024**.\n\n**Numéro d'enregistrement obligatoire.** Toute mise en location d'un meublé touristique à Rennes nécessite un numéro d'enregistrement obtenu via le téléservice de la ville, à afficher obligatoirement sur toutes les annonces (Airbnb, Booking, Abritel). Défaut = amende jusqu'à **10 000 €**.\n\n**Résidence principale : 120 nuits/an.** Plafond que le conseil municipal peut abaisser à **90 jours** par délibération en zone tendue. Airbnb bloque automatiquement le calendrier une fois le seuil atteint.\n\n**Résidence secondaire : changement d'usage.** Pour un bien dédié à la location saisonnière, un changement d'usage auprès de la mairie est obligatoire, avec généralement une **compensation** (transformation d'un local commercial en habitation). Les manquements sont sanctionnés jusqu'à **50 000 €** d'amende par logement.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** Collectée par Rennes Métropole (0,83 € à 3 € par nuit selon classement). Airbnb la reverse automatiquement. Les copropriétés peuvent depuis la **loi Le Meur** interdire la location courte durée par modification du règlement à la **majorité simple** (auparavant unanimité) — toujours vérifier avant d'acheter.",
    concreteExample: {
      bienType: 'T2',
      surface: 42,
      pricePerNight: 85,
      neighborhood: 'Centre historique',
      revenuBrut: 22300,
      commissionRate: 0.2,
      menageCount: 70,
      menageUnitCost: 55,
    },
    extraFaq: [
      {
        q: 'La clientèle étudiante de Rennes est-elle compatible avec la location Airbnb courte durée ?',
        a: "Oui, mais indirectement : les 70 000 étudiants ne sont pas vos locataires Airbnb, ce sont leurs familles qui viennent les visiter, déménager, assister aux remises de diplômes. La rentrée de septembre et les week-ends d'avril-mai (concours, soutenances) sont d'excellents pics. La moyenne durée (30+ nuits) pour étudiants en stage ou en échange Erasmus est également une niche rentable, surtout à Villejean-Beauregard et Saint-Hélier. Une conciergerie qui gère moyen et courte durée (comme JustUnToit) est un vrai atout.",
      },
      {
        q: "Quel est l'impact des Transmusicales sur les prix et la demande ?",
        a: "Les Transmusicales début décembre attirent 60 000+ visiteurs sur 4 jours, dont des professionnels de la musique venus du monde entier. Les nuitées grimpent de 2 à 3x le prix habituel (150-300 €/nuit en hypercentre), avec un taux d'occupation proche de 100 %. C'est l'événement phare pour maximiser le RevPAR à Rennes, à l'image de ce que représente le Festival pour Cannes. Une bonne conciergerie verrouille les dates 8-12 mois à l'avance et applique un pricing dynamique agressif.",
      },
      {
        q: 'Vaut-il mieux cibler les voyageurs business ou les touristes à Rennes ?',
        a: "Rennes est avant tout une destination d'affaires et universitaire, pas une ville touristique classique. Plus de 60 % de la demande Airbnb est professionnelle (congrès, chantiers tech, La French Tech Rennes). Privilégiez des biens fonctionnels avec bureau, wifi pro et proximité gare TGV/métro. Les quartiers Sud-Gare et Saint-Hélier surperforment sur cette clientèle semaine, moins volatile que le tourisme pur. Le week-end et les vacances scolaires, c'est le Centre historique et Sainte-Anne qui prennent le relais.",
      },
    ],
    updatedAt: '2026-04-20',
  },
  // ==========================================================================
  // ROUEN
  // ==========================================================================
  {
    slug: 'rouen',
    displayName: 'Rouen',
    region: 'Normandie',
    regionSlug: 'normandie',
    title: 'Conciergerie Rouen Airbnb : comparatif 2026 des 7 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Rouen : Comparatif 2026 (tarifs & avis)',
    metaDescription:
      "Comparatif des 7 meilleures conciergeries Airbnb à Rouen. Tarifs (17-22 %), réglementation zone tendue, quartiers rentables, stratégie L'Armada 2027.",
    kwPrincipal: 'conciergerie airbnb rouen',
    kwSecondaires: [
      'conciergerie rouen',
      'gestion locative rouen',
      'location courte durée rouen',
      'airbnb rouen rentabilité',
      'meublé touristique rouen',
    ],
    population: 115639,
    tourists: 4200000,
    activeListings: 1400,
    priceLow: 55,
    priceHigh: 140,
    occupancyRate: 58,
    revpar: 45,
    seasonality:
      "Saisonnalité modérée dopée par des pics événementiels. L'Armada (prochaine édition juin 2027) génère des hausses de tarifs de +80 à +150 % pendant 10 jours. La Foire Saint-Romain (oct-nov), le festival Normandie Impressionniste et Jeanne d'Arc tirent la fréquentation. La cathédrale (Monet, gothique flamboyant) et le tourisme d'affaires (sièges sociaux, CHU, universités) lissent la demande sur l'année.",
    rankNational: 18,
    introCustom:
      "Vous avez un appartement à **Rouen** que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée.\n\nEntre la **proximité immédiate de Paris (1h10 en train)** qui amène chaque week-end une clientèle parisienne, le tourisme patrimonial (cathédrale, Jeanne d'Arc, Monet), **l'Armada 2027** qui va faire exploser la demande et Rouen désormais classée **zone tendue**, vous vous demandez si confier la gestion à une conciergerie est vraiment rentable.\n\nEt surtout : **laquelle choisir** parmi les acteurs locaux rouennais ?",
    marketIntro:
      "Rouen a connu une **année 2024 record** avec 4,2 millions de nuitées touristiques (+4 % vs 2023) et 1,6 million de nuitées étrangères (+8 %).\n\nLa ville profite de **trois leviers LCD** : le tourisme patrimonial (capitale historique de la Normandie, cathédrale peinte par Monet), la **proximité Paris** qui génère un flux continu de week-ends, et le tourisme d'affaires (CHU, Matmut, Crédit Agricole).\n\n**L'Armada 2027** (navires géants sur la Seine) va doper le marché sur 10 jours en juin — les propriétaires qui préparent cet événement dès maintenant peuvent **tripler leurs revenus** sur cette période.\n\nRouen est passée en **zone tendue** par arrêté préfectoral en 2023, imposant numéro d'enregistrement et changement d'usage pour les résidences secondaires.",
    conciergeries: [
      {
        name: 'Olympe Services',
        url: 'https://olympe.services/',
        commission: '17 %',
        menage: 'refacturé voyageur',
        rating: 5.0,
        reviews: 32,
        biensGeres: 50,
        specialty: 'Commission la plus basse de Rouen',
        description:
          "Conciergerie indépendante dirigée par Valérie et Frédéric, deux Rouennais avec une connaissance fine du marché local. Commission de 17 %, parmi les plus basses de la métropole, ménage refacturé voyageur. Assistance voyageur réelle 7j/7 24h/24. Note Google parfaite 5,0/5. Le choix rationnel pour un propriétaire qui veut maximiser sa marge.",
      },
      {
        name: 'GMS Conciergerie',
        url: 'https://gmsconciergerie.com/rouen/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 45,
        biensGeres: 90,
        specialty: 'Dynamic pricing adapté marché rouennais',
        description:
          "Conciergerie régionale couvrant Rouen, Mont-Saint-Aignan, Sotteville-lès-Rouen et Bois-Guillaume. Commission 20 %, ménage refacturé voyageur. Spécialisée dans la tarification dynamique calée sur les événements locaux (Armada, Foire Saint-Romain, saisonnalité cathédrale). Publie un blog d'analyse du marché rouennais très complet.",
      },
      {
        name: 'YourHostHelper Rouen',
        url: 'https://yourhosthelper.com/conciergerie-rouen/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 180,
        biensGeres: 120,
        specialty: 'Réseau national, formule 15 services',
        description:
          "Franchise nationale de conciergerie Airbnb avec une agence dédiée à Rouen. Sans frais fixes, commission de 20 % uniquement sur les revenus générés. Formule clé en main incluant photos pro, optimisation tarifaire et accueil voyageurs. Un des plus gros réseaux d'avis cumulés (180+ pour Rouen), gage de fiabilité.",
      },
      {
        name: 'Rouen Conciergerie',
        url: 'https://rouenconciergerie.fr/',
        commission: '20 %',
        menage: 'refacturé voyageur + forfait',
        rating: 4.8,
        reviews: 95,
        biensGeres: 170,
        specialty: 'Leader en volume à Rouen (170 biens)',
        description:
          "L'un des plus gros acteurs rouennais en nombre de biens (170+). Propose une gestion complète avec ménage forfaitaire, accueil physique et optimisation des annonces multi-plateformes (Airbnb, Booking, Abritel). Commission 20 %, ménage refacturé + forfait. Idéal si vous cherchez une structure rodée avec un volume important.",
      },
      {
        name: 'Ma Conciergerie en Normandie (MCEN)',
        url: 'https://www.maconciergerieennormandie.fr/',
        commission: '22 %',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 60,
        biensGeres: 70,
        specialty: 'Couverture Rouen + Deauville + Caen + Le Havre',
        description:
          "Conciergerie normande multi-villes positionnée premium avec création d'annonces, shooting photo pro et optimisation tarifaire. Commission 22 %, ménage refacturé voyageur. Particulièrement pertinente si vous avez plusieurs biens dispersés en Normandie (Rouen + résidence balnéaire à Deauville par exemple).",
      },
      {
        name: 'LB Conciergerie',
        url: 'https://lbconciergerie.com/',
        commission: '18-22 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 40,
        biensGeres: 50,
        specialty: 'Formules modulables (basic à premium)',
        description:
          "Conciergerie indépendante proposant plusieurs niveaux de service (basic, standard, premium) avec commission modulable entre 18 et 22 % selon les prestations retenues. Gestion complète ménage, accueil voyageurs et optimisation des revenus. Approche transparente et contrats flexibles, bon choix pour tester la LCD avant engagement total.",
      },
      {
        name: 'M&A Conciergerie',
        url: 'https://livretaccueil.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 28,
        biensGeres: 30,
        specialty: 'Taille humaine, accompagnement personnalisé',
        description:
          "Structure à taille humaine pour Rouen et sa périphérie. Prend en charge la création d'annonces, le pilotage quotidien et l'accueil voyageur avec une approche relationnelle forte. Commission 20 %, ménage refacturé voyageur. Idéal pour un propriétaire avec 1-2 biens qui veut un vrai interlocuteur, pas un dashboard anonyme.",
      },
    ],
    neighborhoods: [
      {
        name: 'Vieux-Rouen (Cathédrale / Gros-Horloge)',
        pricePerNight: '85-160 €',
        occupancy: 72,
        description:
          "Cœur historique ultra-touristique autour de la cathédrale (peinte par Monet), du Gros-Horloge et du Vieux-Marché. Zone n°1 pour l'Airbnb avec la demande la plus forte et les tarifs les plus élevés de la ville. T2 à partir de 230 000 €.",
        roiBrut: '7 à 7,5 %',
      },
      {
        name: 'Saint-Marc',
        pricePerNight: '60-95 €',
        occupancy: 62,
        description:
          "Quartier bohème et gastronomique à l'est du centre, très apprécié pour ses halles, ses bistrots et ses antiquaires. Bon compromis entre attractivité touristique et prix d'achat immobilier plus raisonnables (T2 dès 160 000 €).",
        roiBrut: '6,5 à 7 %',
      },
      {
        name: 'Gare / Saint-Hilaire',
        pricePerNight: '55-90 €',
        occupancy: 65,
        description:
          "Quartier stratégique pour le tourisme d'affaires et les voyageurs Paris-Rouen grâce à la gare Rouen Rive-Droite (TER 1h10 Paris Saint-Lazare). Forte demande semaine (cadres en déplacement) et week-end (touristes parisiens). T2 dès 150 000 €.",
        roiBrut: '7 à 7,5 %',
      },
      {
        name: 'Rive Gauche (Saint-Sever)',
        pricePerNight: '45-75 €',
        occupancy: 55,
        description:
          "Quartier en pleine mutation urbaine avec le projet Seine Cité et l'écoquartier Flaubert. Prix d'achat bas (3 000-3 500 €/m²) et rentabilité brute élevée compensent un attrait touristique moindre. Potentiel fort à moyen terme.",
        roiBrut: '8 à 8,5 %',
      },
      {
        name: 'Quartier du Palais',
        pricePerNight: '75-130 €',
        occupancy: 68,
        description:
          "Quartier prestigieux autour du Palais de Justice gothique et de la rue Eau-de-Robec. Clientèle business (avocats, magistrats) en semaine et touristique le week-end, tarifs premium. T2 dès 200 000 €.",
        roiBrut: '7 %',
      },
      {
        name: 'Mont-Gargan / Les Sapins',
        pricePerNight: '50-80 €',
        occupancy: 52,
        description:
          "Quartier résidentiel sur les hauteurs avec vue sur Rouen et proximité du CHU Charles Nicolle. Demande portée par les familles en visite médicale et les touristes recherchant du calme hors centre. T2 dès 140 000 €.",
        roiBrut: '7,5 à 8 %',
      },
    ],
    regulation:
      "Rouen est classée **zone tendue** depuis 2023 par arrêté préfectoral, ce qui déclenche un ensemble de restrictions spécifiques pour la LCD.\n\n**Enregistrement obligatoire.** La commune impose un enregistrement préalable en mairie pour tout meublé de tourisme, avec délivrance d'un **numéro à 13 chiffres** qui doit obligatoirement figurer sur chaque annonce Airbnb, Booking ou Abritel. Défaut = amende jusqu'à **10 000 €**.\n\n**Résidence principale : 120 jours/an.** Plafond au-delà duquel le propriétaire bascule dans le régime des résidences secondaires. Airbnb applique ce blocage automatiquement. Dépassement = amende jusqu'à **50 000 €**.\n\n**Résidence secondaire : changement d'usage.** Pour un investissement locatif dédié, Rouen impose une autorisation de changement d'usage délivrée par la mairie, avec souvent une règle de compensation (transformer un local commercial en habitation).\n\n**Loi Le Meur 2024.** DPE classe **A à E** obligatoire pour obtenir l'autorisation (A à D à partir de 2034), abattement micro-BIC réduit à **50 % pour les meublés classés** et **30 % pour les non classés**. Les règlements de copropriété peuvent désormais interdire la location touristique à la **double majorité** (auparavant unanimité).\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** Collectée au réel par la Métropole Rouen Normandie via la plateforme dédiée. Les tarifs varient selon le classement (1 à 5 étoiles) ou un pourcentage du prix de la nuitée pour les non classés (5 % plafonné). **L'Armada 2027** est autorisée en tarification dynamique, mais la commune surveille activement les annonces non déclarées pendant l'événement.",
    concreteExample: {
      bienType: 'T2',
      surface: 38,
      pricePerNight: 78,
      neighborhood: 'Vieux-Rouen (Cathédrale)',
      revenuBrut: 19500,
      commissionRate: 0.2,
      menageCount: 85,
      menageUnitCost: 55,
    },
    extraFaq: [
      {
        q: "Combien peut-on gagner avec un Airbnb pendant L'Armada de Rouen ?",
        a: "Pendant les 10 jours de L'Armada (prochaine édition en juin 2027), les tarifs de nuitée grimpent de +80 à +150 % par rapport à la moyenne annuelle. Un T2 qui se loue 78 €/nuit hors saison peut atteindre 180 à 220 €/nuit, avec un taux d'occupation quasi garanti à 100 %. Sur la durée complète de l'événement, un propriétaire peut générer l'équivalent de 2 à 3 mois de revenus moyens, soit 3 500 à 5 000 € bruts pour un bien bien placé près des quais de Seine. Verrouillez les dates dès maintenant si vous voulez profiter de 2027.",
      },
      {
        q: "Rouen est-il intéressant pour capter la clientèle business et les voyageurs pro ?",
        a: "Oui, Rouen a un tourisme d'affaires solide grâce à son statut de capitale régionale, au CHU Charles Nicolle, aux sièges sociaux (Matmut, Crédit Agricole Normandie Seine) et à l'Université de Rouen. La demande semaine (lundi-jeudi) est portée par les cadres en mission, avec des séjours de 2 à 4 nuits. Les quartiers Gare, Palais et Saint-Hilaire captent cette clientèle qui préfère souvent un Airbnb à l'hôtel pour les longs séjours (2-3 semaines) grâce aux cuisines équipées.",
      },
      {
        q: "La proximité de Paris (1h10 en train) est-elle un atout ou un frein pour l'Airbnb à Rouen ?",
        a: "C'est un atout majeur. Rouen bénéficie d'un flux régulier de touristes parisiens en week-end (notamment novembre-mars, hors saison des côtes normandes) et de voyageurs internationaux qui font l'aller-retour Paris-Rouen pour visiter la cathédrale, suivre Monet ou combiner Rouen avec Honfleur/Étretat. Cette proximité crée une demande récurrente toute l'année, contrairement aux destinations purement estivales. Les tarifs restent nettement inférieurs à Paris (78 € vs 135 € en moyenne), ce qui positionne Rouen comme une alternative abordable pour un city-break culturel.",
      },
    ],
    updatedAt: '2026-04-20',
  },
  // ==========================================================================
  // ANGERS
  // ==========================================================================
  {
    slug: 'angers',
    displayName: 'Angers',
    region: 'Pays de la Loire',
    regionSlug: 'pays-de-la-loire',
    title: 'Conciergerie Angers Airbnb : comparatif 2026 des 7 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Angers : Comparatif 2026 (tarifs & avis)',
    metaDescription:
      "Comparatif des 7 meilleures conciergeries Airbnb à Angers. Tarifs (15-22 %), réglementation zone tendue, quartiers rentables, stratégie Château d'Angers & Accroche-Cœurs.",
    kwPrincipal: 'conciergerie airbnb angers',
    kwSecondaires: [
      'conciergerie angers',
      'gestion locative angers',
      'location courte durée angers',
      'airbnb angers rentabilité',
      'meublé touristique angers',
    ],
    population: 157175,
    tourists: 1500000,
    activeListings: 1600,
    priceLow: 50,
    priceHigh: 130,
    occupancyRate: 62,
    revpar: 52,
    seasonality:
      "Saisonnalité modérée, lissée par les 40 000 étudiants et le tourisme d'affaires (CHU, Servier, Sagem). Pic estival juillet-août autour du Château d'Angers et des vignobles d'Anjou. Événements clés : Accroche-Cœurs (festival de rue biennal, septembre, 150 000 personnes), Festival d'Anjou (théâtre, juin-juillet), Premiers Plans (cinéma européen, janvier). La Loire à Vélo génère un flux de cyclotouristes de mai à octobre. Proximité Paris (TGV 1h35) favorise les courts séjours week-end toute l'année.",
    rankNational: 22,
    introCustom:
      "Vous avez un appartement à **Angers** que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée.\n\nEntre les **40 000 étudiants** qui créent une demande locative structurelle forte, le Château des Ducs et la tapisserie de l'Apocalypse (300 000 visiteurs/an), et **Angers désormais classée zone tendue**, vous vous demandez si confier la gestion à une conciergerie est vraiment rentable.\n\nEt surtout : **laquelle choisir** parmi les acteurs angevins locaux ?",
    marketIntro:
      "**Angers** est une ville universitaire en pleine croissance — **7e ville étudiante de France** avec 40 000 étudiants sur 157 000 habitants — ce qui génère une demande locative structurelle forte toute l'année.\n\nLe marché LCD angevin compte environ **1 600 annonces actives** en 2026, en hausse de +40 % depuis 2021. Les prix moyens oscillent entre 50 et 130 €/nuit selon le quartier, avec un taux d'occupation médian autour de **62 %**.\n\nLes deux leviers clés : le **tourisme culturel** (Château des Ducs, tapisserie de l'Apocalypse, Loire à Vélo, vignobles d'Anjou) et le tourisme d'affaires (CHU d'Angers, Servier, Sagem, Technicolor).\n\nAngers est classée **zone tendue** depuis 2022, imposant enregistrement obligatoire et encadrement strict de la LCD.",
    conciergeries: [
      {
        name: '2KEYS',
        url: 'https://2keys.fr/conciergerie-airbnb-angers/',
        commission: 'à partir de 15 %',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 170,
        biensGeres: 70,
        specialty: 'Référence angevine, 900+ séjours/an',
        description:
          "Référence locale angevine pour la gestion Airbnb, 2KEYS gère plus de 900 séjours par an avec une approche sur mesure. Commission compétitive à partir de 15 %, ménage refacturé voyageur. Équipe angevine qui connaît parfaitement les spécificités du marché local (événements, quartiers étudiants, dynamique festivalière). Note Google 4.9/5 sur 170 avis.",
      },
      {
        name: "Mayordom'",
        url: 'https://www.mayordom.fr/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 85,
        biensGeres: 50,
        specialty: 'Boutique angevine, accompagnement sur mesure',
        description:
          "Conciergerie boutique angevine positionnée sur la qualité et la relation humaine. Commission 20 % HT sans frais cachés, ménage refacturé voyageur. Mayordom' prend en charge estimation des revenus, aide réglementaire, rédaction d'annonces et accueil voyageurs. Idéal pour un propriétaire qui veut un interlocuteur unique et disponible à Angers.",
      },
      {
        name: 'YourHostHelper Angers',
        url: 'https://yourhosthelper.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 180,
        biensGeres: 90,
        specialty: 'Réseau national, formule clé en main',
        description:
          "Franchise nationale de conciergerie Airbnb avec une agence dédiée à Angers. Commission 20 % sans frais fixes, ménage refacturé voyageur. Inclut photos pro, optimisation tarifaire et accueil voyageurs 7j/7. Réseau de 20+ villes, bon choix pour un propriétaire qui veut la solidité d'un grand groupe avec une présence locale.",
      },
      {
        name: 'LocAndSmile Angers',
        url: 'https://locandsmile.fr/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 45,
        biensGeres: 35,
        specialty: 'Taille humaine, réactivité locale',
        description:
          "Conciergerie angevine à taille humaine spécialisée dans la gestion complète des locations courte durée. Commission 20 %, ménage refacturé voyageur. Approche personnalisée avec une connaissance fine des quartiers angevins (Centre, La Doutre, Gare). Idéal pour 1 à 3 biens avec un propriétaire qui veut rester proche de la gestion.",
      },
      {
        name: 'HostnFly Angers',
        url: 'https://hostnfly.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.5,
        reviews: 120,
        biensGeres: 80,
        specialty: 'Tech + yield management algorithmique',
        description:
          "Solution clé en main avec algorithme de tarification dynamique et 150 000+ réservations gérées nationalement. Commission à partir de 20 %, ménage refacturé voyageur, diffusion 10+ plateformes. Idéal pour les propriétaires qui veulent un process industrialisé sans interaction humaine fréquente.",
      },
      {
        name: 'Nestify Angers',
        url: 'https://www.nestify.fr/',
        commission: '22 %',
        menage: 'refacturé voyageur',
        rating: 4.4,
        reviews: 75,
        biensGeres: 55,
        specialty: 'Gestion A à Z multi-plateformes',
        description:
          "Nestify couvre la création d'annonces, la diffusion multi-plateformes (Airbnb, Booking, Vrbo), gestion complète des séjours et reporting financier mensuel. Commission 22 %, ménage refacturé voyageur. Bonne option pour un bien en centre-ville ou La Doutre orienté clientèle internationale.",
      },
      {
        name: 'Welkeys Angers',
        url: 'https://www.welkeys.com/',
        commission: '20-22 %',
        menage: 'refacturé voyageur',
        rating: 4.6,
        reviews: 95,
        biensGeres: 65,
        specialty: 'Pricing dynamique et gestion événementielle',
        description:
          "Acteur national présent à Angers avec une expertise en optimisation tarifaire sur les pics événementiels (Accroche-Cœurs, Festival d'Anjou). Commission 20-22 % selon les prestations, ménage refacturé voyageur. Bon rapport qualité/prix pour un propriétaire avec un ou deux biens en centre-ville.",
      },
    ],
    neighborhoods: [
      {
        name: 'Centre-ville (Historique / Cathédrale)',
        pricePerNight: '70-130 €',
        occupancy: 68,
        description:
          "Cœur piéton autour de la Cathédrale Saint-Maurice, des halles et de la place du Ralliement. Zone n°1 pour la LCD angevine, forte demande touristique et culturelle toute l'année. Appartements anciens à partir de 2 800 €/m².",
        roiBrut: '6 à 6,5 %',
      },
      {
        name: 'La Doutre',
        pricePerNight: '65-115 €',
        occupancy: 63,
        description:
          "Quartier bohème sur la rive gauche de la Maine, avec maisons à colombages, galeries d'art et terrasses animées. Très apprécié des voyageurs en quête d'authenticité, clientèle week-end Paris-Angers. Prix d'achat 2 800-4 500 €/m², fort potentiel de plus-value après rénovation.",
        roiBrut: '6,5 à 7 %',
      },
      {
        name: 'Gare / République',
        pricePerNight: '55-95 €',
        occupancy: 65,
        description:
          "Quartier stratégique pour le tourisme d'affaires (CHU d'Angers, Servier, Sagem) et les voyageurs Paris-Angers (TGV 1h35). Forte demande semaine (cadres en déplacement) et week-end. Appartements dès 2 300 €/m², bon compromis prix/occupation.",
        roiBrut: '7 à 7,5 %',
      },
      {
        name: 'Saint-Serge / Cité',
        pricePerNight: '50-80 €',
        occupancy: 60,
        description:
          "Meilleur rapport risque/rendement à Angers selon les investisseurs locaux : grande population étudiante (campus universitaire), forte demande locative structurelle et prix d'achat bas (2 000-2 500 €/m²). Studios et T1 très demandés.",
        roiBrut: '7,5 à 8,5 %',
      },
      {
        name: 'Belle-Beille',
        pricePerNight: '45-75 €',
        occupancy: 57,
        description:
          "Quartier résidentiel proche de l'Université d'Angers et d'Oniris (école vétérinaire). Forte demande étudiante et jeunes professionnels, prix d'achat accessibles (dès 1 900 €/m²). Rentabilité brute élevée mais moins d'attractivité pour le tourisme pur.",
        roiBrut: '8 à 9 %',
      },
      {
        name: 'Quais / Bords de Maine',
        pricePerNight: '60-105 €',
        occupancy: 61,
        description:
          "Bords de Maine et vue sur le Château des Ducs d'Anjou, quartier très prisé pour des courts séjours romantiques. Forte demande le week-end (Château, tapisserie de l'Apocalypse, Loire à Vélo). Appartements T2 dès 2 900 €/m².",
        roiBrut: '6,5 à 7 %',
      },
    ],
    regulation:
      "Angers est classée **zone tendue** depuis 2022, déclenchant un ensemble de restrictions pour la location courte durée.\n\n**Enregistrement obligatoire.** Depuis la loi Le Meur, tout meublé de tourisme doit être enregistré via le téléservice national et obtenir un **numéro à 13 chiffres** à afficher sur toutes les annonces (Airbnb, Booking, Abritel). Défaut d'enregistrement = amende jusqu'à **10 000 €**. Les plateformes suppriment les annonces non conformes à partir du **20 mai 2026**.\n\n**Résidence principale : 120 jours/an.** Plafond légal national, que le maire d'Angers peut abaisser à **90 jours** par délibération. Au-delà, le propriétaire doit obtenir une autorisation de changement d'usage. Airbnb bloque automatiquement les dates supplémentaires.\n\n**Résidence secondaire : changement d'usage.** Pour tout investissement locatif dédié, Angers impose une autorisation délivrée par la mairie, potentiellement avec compensation dans les quartiers les plus tendus.\n\n**Loi Le Meur 2024.** DPE classe **E minimum** obligatoire pour louer (D à partir de 2034). Abattement micro-BIC réduit à **30 % pour les meublés non classés** (50 % pour les classés). Les règlements de copropriété peuvent désormais interdire la LCD à la **double majorité** — vérifiez votre règlement avant d'investir.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** Collectée automatiquement par Airbnb pour Angers Loire Métropole. Tarif entre **0,66 € et 3,00 €** par nuit et par personne selon le classement du bien.\n\n**⚠️ Attention copropriétés.** La loi Le Meur permet désormais d'interdire la location touristique à la double majorité (avant : unanimité). Vérifiez votre règlement de copropriété avant tout achat ou mise en location.",
    concreteExample: {
      bienType: 'T2',
      surface: 38,
      pricePerNight: 78,
      neighborhood: 'Centre-ville (Cathédrale)',
      revenuBrut: 17500,
      commissionRate: 0.2,
      menageCount: 80,
      menageUnitCost: 55,
    },
    extraFaq: [
      {
        q: "Angers est-elle une bonne ville pour investir dans l'Airbnb en 2026 ?",
        a: "Angers reste une ville solide pour la LCD en 2026, grâce à ses 40 000 étudiants (demande structurelle), son tourisme culturel (Château des Ducs, tapisserie de l'Apocalypse, Loire à Vélo) et sa bonne accessibilité depuis Paris (TGV 1h35). Le marché a subi une dilution de l'offre depuis 2022 (+40 % d'annonces), ce qui a mécaniquement baissé les taux d'occupation des biens standard. La solution : soit un bien premium en Centre-ville ou La Doutre avec une vraie stratégie de pricing, soit un studio en zone étudiante (Saint-Serge, Belle-Beille) pour une rentabilité brute de 8-9 %.",
      },
      {
        q: "Quels événements génèrent les pics de revenus à Angers ?",
        a: "Les trois événements clés à cibler : les Accroche-Cœurs (festival de rue biennal en septembre, 150 000 personnes, +40 à +80 % sur les tarifs), le Festival d'Anjou (théâtre, juin-juillet), et les Premiers Plans (festival de cinéma européen, janvier, 20 000 entrées). En dehors des festivals, le marché profite de flux continus : Château des Ducs (300 000 visiteurs/an), Loire à Vélo, vignobles d'Anjou (Saumur, Layon). Prévenez votre conciergerie à l'avance pour ajuster les minimums de séjour et les tarifs sur ces dates.",
      },
      {
        q: "La proximité de Paris (1h35 en TGV) aide-t-elle vraiment la LCD à Angers ?",
        a: "Oui, c'est un moteur clé de la demande week-end. Paris génère un flux régulier de touristes en short-break : week-ends Château + vignobles, sorties de festival, séjours romantiques sur les bords de Maine. Angers est également une bonne base pour rayonner dans la Loire (Saumur, Chinon, Amboise) ou vers le littoral vendéen (2h en voiture). Cette double clientèle (Parisiens le week-end + étudiants/professionnels en semaine) crée une demande bien répartie sur l'année, plus rassurante qu'un marché 100 % saisonnier.",
      },
    ],
    updatedAt: '2026-04-23',
  },
  // ==========================================================================
  // MONTPELLIER
  // ==========================================================================
  {
    slug: 'montpellier',
    displayName: 'Montpellier',
    region: 'Occitanie',
    regionSlug: 'occitanie',
    title: 'Conciergerie Montpellier Airbnb : comparatif 2026 des 7 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Montpellier : Comparatif 2026 (tarifs & avis)',
    metaDescription:
      "Comparatif des 7 meilleures conciergeries Airbnb à Montpellier. Tarifs (18-22 %), quota Écusson 770 logements, 90 jours/an, quartiers rentables hors quota.",
    kwPrincipal: 'conciergerie airbnb montpellier',
    kwSecondaires: [
      'conciergerie montpellier',
      'gestion locative montpellier',
      'location courte durée montpellier',
      'airbnb montpellier rentabilité',
      'meublé touristique montpellier',
    ],
    population: 302000,
    tourists: 5500000,
    activeListings: 3508,
    priceLow: 70,
    priceHigh: 160,
    occupancyRate: 72,
    revpar: 70,
    seasonality:
      "Saisonnalité forte portée par la Méditerranée : pic juillet-août (+40 à +60 % sur les tarifs). Demande étudiante structurelle (70 000 étudiants) et tourisme d'affaires (CHU de Montpellier, Sanofi, Cap Oméga, Languedoc Roussillon Pharma) lissent la fréquentation hors saison. Événements : Foire Internationale de Montpellier (octobre), Montpellier Danse (juin), Comédie du Livre (mai), Internationaux de Montpellier tennis (octobre). Quota strict dans l'Écusson depuis octobre 2025.",
    rankNational: 6,
    introCustom:
      "Vous avez un appartement à **Montpellier** que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée.\n\nEntre les **70 000 étudiants** (1 habitant sur 5), la proximité de la Méditerranée (30 min), le dynamisme de la **7e ville de France** et un durcissement réglementaire historique — **quota de 770 logements dans l'Écusson** depuis octobre 2025 et plafond réduit à **90 jours/an** — vous vous demandez si confier la gestion à une conciergerie est rentable.\n\nEt surtout : **laquelle choisir** parmi les conciergeries montpelliéraines ?",
    marketIntro:
      "**Montpellier** est l'un des marchés LCD les plus dynamiques de France avec **3 508 annonces actives** et un taux d'occupation médian de **72 %** — parmi les plus élevés de Métropole.\n\nLa ville combine deux forces : une **clientèle touristique estivale** (mer, garrigue, vignobles du Languedoc) et une **base étudiante parmi les plus grandes de France** (70 000 étudiants) qui crée une demande de moyen séjour structurelle toute l'année.\n\nLe revenu moyen annuel par annonce atteint **19 000 €**, avec des pics à 30 000 € pour les biens du centre. La plateforme Airbtics confirme une médiane de **263 nuits réservées par an**.\n\nDepuis le 14 octobre 2025, la **Métropole de Montpellier** a voté un durcissement sans précédent : quota de **770 logements dans l'Écusson** (déjà atteint), plafond réduit à **90 jours/an** (contre 120 nationalement), et amendes jusqu'à **100 000 €**.",
    conciergeries: [
      {
        name: 'Groomi',
        url: 'https://www.conciergerie-groomi.fr/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 80,
        biensGeres: 60,
        specialty: 'Conciergerie familiale Montpellier + Alpes',
        description:
          "Conciergerie familiale spécialisée dans la gestion locative courte et moyenne durée à Montpellier. Commission 20 %, ménage refacturé voyageur. Groomi se distingue par une approche humaine et un suivi personnalisé de chaque bien — idéal pour un propriétaire qui veut un vrai partenaire, pas un algorithme.",
      },
      {
        name: 'Welchome34',
        url: 'https://welchome34.fr/',
        commission: "variable (services à l'acte)",
        menage: 'variable',
        rating: 4.8,
        reviews: 65,
        biensGeres: 50,
        specialty: "Facturation à l'acte, sans commission fixe",
        description:
          "Welchome34 se distingue avec un modèle unique dans le secteur : facturation strictement à l'acte (check-in, ménage, gestion annonce) sans pourcentage fixe prélevé sur les revenus. Permet aux propriétaires actifs de ne payer que les services réellement utilisés. Couvre Montpellier, Palavas, Carnon, Lattes et la proche périphérie.",
      },
      {
        name: 'Cynergy',
        url: 'https://cynergy-real-estate.com/conciergerie-airbnb-montpellier/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 103,
        biensGeres: 80,
        specialty: 'Expertise réglementaire Montpellier',
        description:
          "Cynergy est l'une des conciergeries les plus actives sur les questions réglementaires montpelliéraines (quota Écusson, loi Le Meur, 90 jours). Commission 20 %, ménage refacturé voyageur. Bon choix pour un investisseur qui veut comprendre et sécuriser sa situation légale avant de se lancer.",
      },
      {
        name: 'Occitania Conciergerie',
        url: 'https://www.occitania-conciergerie.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 55,
        biensGeres: 45,
        specialty: 'Local Montpellier, gestion 7j/7',
        description:
          "Conciergerie montpelliéraine locale avec gestion complète de la location courte durée : communication voyageurs, nettoyage, maintenance et gestion des conflits 7j/7. Commission 20 %, ménage refacturé voyageur. Connaissance fine des quartiers Écusson, Antigone et Port Marianne.",
      },
      {
        name: 'Halo Butler',
        url: 'https://halobutler.fr/conciergerie-airbnb-montpellier/',
        commission: '20-22 %',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 60,
        biensGeres: 55,
        specialty: 'Montpellier + Nîmes, pricing dynamique',
        description:
          "Halo Butler couvre Montpellier, Nîmes et leur périphérie avec une gestion 7j/7 incluant check-in, nettoyage, linge, pricing dynamique et assistance voyageurs. Commission 20-22 %, ménage refacturé voyageur. Idéal pour les propriétaires qui ont des biens sur plusieurs villes du Languedoc.",
      },
      {
        name: 'WeCARE BnB34',
        url: 'https://www.wecarebnb34.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 40,
        biensGeres: 35,
        specialty: 'Boutique, qualité et confiance',
        description:
          "WeCARE BnB34 est une conciergerie montpelliéraine à taille humaine positionnée sur la qualité de service et la relation de confiance avec les propriétaires. Commission 20 %, ménage refacturé voyageur. Approche soignée de la présentation des biens et du suivi voyageur.",
      },
      {
        name: 'YourHostHelper Montpellier',
        url: 'https://yourhosthelper.com/conciergerie-montpellier/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.6,
        reviews: 180,
        biensGeres: 110,
        specialty: 'Réseau national, présence locale',
        description:
          "Franchise nationale avec une agence dédiée à Montpellier. Commission 20 %, ménage refacturé voyageur. Photos professionnelles incluses, optimisation des annonces multi-plateformes, accueil voyageurs 7j/7. Bon choix pour un investisseur qui veut un opérateur rodé avec un historique de performance.",
      },
    ],
    neighborhoods: [
      {
        name: "L'Écusson (centre historique)",
        pricePerNight: '90-160 €',
        occupancy: 70,
        description:
          "Cœur médiéval de Montpellier, le plus demandé touristiquement. Attention : le **quota de 770 autorisations est atteint** depuis octobre 2025 — toute nouvelle demande dans l'Écusson est gelée jusqu'à retrait d'un bien existant. Idéal si vous détenez déjà une autorisation en cours de validité.",
        roiBrut: '5 à 6 %',
      },
      {
        name: 'Antigone',
        pricePerNight: '75-125 €',
        occupancy: 65,
        description:
          "Quartier néoclassique des années 1980 conçu par Ricardo Bofill, populaire auprès des voyageurs internationaux et corporate. À 10 min à pied du centre, hors périmètre quota Écusson. T2 dès 200 000 €, rendement brut 5,2 %. Autorisations encore accessibles.",
        roiBrut: '5 à 6 %',
      },
      {
        name: 'Port Marianne',
        pricePerNight: '70-115 €',
        occupancy: 62,
        description:
          "Éco-quartier moderne sur le Lez, apprécié des jeunes professionnels et familles. Hôtel de Ville, tramway, mer proche. Hors zone quota direct, autorisations accessibles. T2 dès 220 000 €, bon potentiel à moyen terme.",
        roiBrut: '5,5 à 6,5 %',
      },
      {
        name: 'Beaux-Arts / Voltaire',
        pricePerNight: '80-135 €',
        occupancy: 65,
        description:
          "Quartier adjacent à l'Écusson, prisé des jeunes professionnels et des étudiants en master. Beaucoup de logements divisés dans de beaux immeubles anciens. Hors quota direct mais surveillance réglementaire vigilante. T2 dès 180 000 €.",
        roiBrut: '5,5 à 6,5 %',
      },
      {
        name: 'Boutonnet / Les Arceaux',
        pricePerNight: '55-90 €',
        occupancy: 60,
        description:
          "Quartier résidentiel et étudiant proche de la fac de Médecine. Forte demande de moyen séjour (internes, chercheurs, étudiants). Hors zone tendue premium, prix d'achat raisonnables (2 500-3 200 €/m²). Bon compromis occupation + rentabilité.",
        roiBrut: '6 à 7,5 %',
      },
      {
        name: "Ovalie / Près-d'Arène",
        pricePerNight: '50-80 €',
        occupancy: 55,
        description:
          "Quartier résidentiel à l'ouest du centre, prix d'achat les plus bas de Montpellier (2 000-2 500 €/m²). Rendement brut élevé mais attractivité touristique plus faible. Clientèle professionnelle et étudiante, potentiel à moyen terme avec le développement du tramway.",
        roiBrut: '7 à 9 %',
      },
    ],
    regulation:
      "Montpellier a adopté **le 14 octobre 2025** l'une des réglementations LCD les plus strictes de France, sous l'impulsion de la **loi Le Meur du 19 novembre 2024**.\n\n**Quota strict : 770 logements dans l'Écusson.** Le centre historique est soumis à un quota de **770 logements Airbnb maximum** — quota déjà atteint. Aucune nouvelle autorisation n'est délivrée tant qu'un bien existant n'est pas retiré. Cette mesure couvre 7,3 % du territoire communal mais concentrait 52 % des meublés touristiques déclarés.\n\n**Plafond réduit à 90 jours/an.** Depuis le **1er janvier 2026**, le plafond annuel de location en résidence principale est abaissé à **90 jours** (contre 120 au niveau national) — soit un mois de revenus en moins pour les propriétaires non conformes.\n\n**Enregistrement obligatoire.** Tout meublé de tourisme doit être déclaré et recevoir un **numéro à 13 chiffres** à afficher sur toutes les annonces. Échéance plateforme : **20 mai 2026**. Amende jusqu'à **10 000 €** pour défaut d'enregistrement.\n\n**Changement d'usage.** Pour toute résidence secondaire ou investissement locatif dédié, un changement d'usage est requis auprès de la mairie, souvent avec compensation. Procédure longue et coûteuse dans Montpellier intra-muros.\n\n**Loi Le Meur 2024.** DPE classe **E minimum** (D à partir de 2034), abattement micro-BIC à **30 % pour les non classés** (50 % classés), copropriétés peuvent interdire la LCD à la **double majorité**.\n\n**⚠️ Amendes jusqu'à 100 000 €.** La métropole surveille activement les annonces non conformes. Les sanctions administratives sont parmi les plus élevées de France.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** Variable selon le classement de l'hébergement, collectée automatiquement par Airbnb.",
    concreteExample: {
      bienType: 'T2',
      surface: 40,
      pricePerNight: 95,
      neighborhood: 'Antigone',
      revenuBrut: 21500,
      commissionRate: 0.2,
      menageCount: 90,
      menageUnitCost: 60,
    },
    extraFaq: [
      {
        q: "Le quota de 770 logements dans l'Écusson bloque-t-il tout investissement Airbnb à Montpellier ?",
        a: "Non — le quota ne concerne que le périmètre Écusson (centre historique médiéval). Les quartiers Antigone, Port Marianne, Beaux-Arts, Boutonnet et Ovalie sont hors quota direct. Ces zones permettent encore d'investir en Airbnb avec une autorisation standard, sous réserve des autres règles (enregistrement, limite 90 jours, DPE). Si vous cherchez un bien dans l'Écusson, il faut racheter un bien déjà autorisé ou attendre qu'un slot se libère. Les conciergeries locales (Cynergy, Occitania) connaissent ces subtilités réglementaires — consultez-les avant tout achat.",
      },
      {
        q: "La limite à 90 jours/an affecte-t-elle vraiment la rentabilité à Montpellier ?",
        a: "Oui, mais moins qu'on ne le croit pour les biens bien gérés. Avec un taux d'occupation médian de 72 % et 263 nuits réservées/an, beaucoup de propriétaires dépassent déjà les 90 jours. La limite force à se concentrer sur les périodes à haute valeur (juillet-août, événements) et à maximiser le tarif par nuit plutôt que le volume. La stratégie optimale : 90 nuits à 120-150 €/nuit (juillet-août + événements) plutôt que 180 nuits à 60-70 €/nuit. Une bonne conciergerie avec pricing dynamique fait toute la différence.",
      },
      {
        q: "Montpellier est-il intéressant pour la location moyenne durée (1-3 mois) en complément de l'Airbnb ?",
        a: "Absolument. Montpellier a une des plus fortes demandes de moyen séjour de France : 70 000 étudiants cherchant des logements pour leurs stages ou semestres d'échange, des internes en médecine (CHU de Montpellier, 3e CHU de France), des chercheurs et professionnels en mission. Une stratégie mixte (Airbnb juillet-août à tarif premium + moyen séjour octobre-juin) permet de maximiser les revenus tout en respectant la limite des 90 jours Airbnb. Welchome34 et Cynergy sont particulièrement bons sur ce schéma hybride.",
      },
    ],
    updatedAt: '2026-04-23',
  },
  // ==========================================================================
  // LA ROCHELLE
  // ==========================================================================
  {
    slug: 'la-rochelle',
    displayName: 'La Rochelle',
    region: 'Nouvelle-Aquitaine',
    regionSlug: 'nouvelle-aquitaine',
    title: 'Conciergerie La Rochelle Airbnb : comparatif 2026 des 6 meilleures agences',
    metaTitle: 'Conciergerie Airbnb La Rochelle : Comparatif 2026 (tarifs & avis)',
    metaDescription:
      "Comparatif des 6 meilleures conciergeries Airbnb à La Rochelle. Tarifs (18-22 %), autorisation obligatoire Agglo 2025, quartiers rentables, Francofolies & Grand Pavois.",
    kwPrincipal: 'conciergerie airbnb la rochelle',
    kwSecondaires: [
      'conciergerie la rochelle',
      'gestion locative la rochelle',
      'location courte durée la rochelle',
      'airbnb la rochelle rentabilité',
      'meublé touristique la rochelle',
    ],
    population: 80000,
    tourists: 3000000,
    activeListings: 5265,
    priceLow: 70,
    priceHigh: 160,
    occupancyRate: 67,
    revpar: 60,
    seasonality:
      "Saisonnalité marquée avec une haute saison estivale (juillet-août, taux d'occupation jusqu'à 95 %). La saison s'étend grâce aux événements majeurs : Francofolies (festival francophone, juillet, 150 000 entrées, +50 à +100 % sur les tarifs), Grand Pavois (salon nautique, octobre, 69 000 visiteurs), Festival de La Rochelle Cinéma (juillet). Le tourisme d'affaires (port, industries maritimes) et la clientèle Île de Ré lissent la demande hors saison. Creux hivernal novembre-mars.",
    rankNational: 11,
    introCustom:
      "Vous avez un appartement à **La Rochelle** que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée.\n\nEntre les **Francofolies**, le Grand Pavois, la proximité de **l'Île de Ré** et un cadre réglementaire parmi les plus stricts de France — **autorisation obligatoire** délivrée par l'Agglo depuis novembre 2025, avec compensation dans le centre-ville et les Minimes — vous vous demandez si confier la gestion à une conciergerie est rentable.\n\nEt surtout : **laquelle choisir** parmi les acteurs rochelais ?",
    marketIntro:
      "**La Rochelle** est l'une des destinations touristiques les plus prisées du littoral atlantique avec **2,94 millions de nuitées marchandes** en 2024. Le marché LCD concentre **5 265 annonces actives** — un chiffre très élevé pour une ville de 80 000 habitants.\n\nLe taux d'occupation médian atteint **67 %**, avec des pics à 95 % en juillet-août. Le revenu moyen annuel par annonce tourne autour de **19 000 €**, avec de fortes disparités entre le Vieux-Port (prime touristique) et la périphérie.\n\nLa forte saisonnalité est à la fois un atout (tarifs élevés en été) et un risque (creux hivernal novembre-mars). Les Francofolies et le Grand Pavois génèrent des pics de **+50 à +100 %** sur les tarifs en juillet et octobre — à sécuriser en priorité.\n\nDepuis novembre 2025, **l'Agglo de La Rochelle a adopté un système d'autorisation préalable obligatoire** pour tout meublé de tourisme, avec des règles de compensation dans les quartiers les plus tendus.",
    conciergeries: [
      {
        name: 'ZeRochelle',
        url: 'https://www.ze-rochelle.fr/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 90,
        biensGeres: 70,
        specialty: 'Référence locale depuis 2018',
        description:
          "Conciergerie rochelaise fondée en 2018, ZeRochelle est la référence locale pour l'efficacité quotidienne et la transparence. Commission 20 %, ménage refacturé voyageur. Reconnue pour sa maîtrise des pics événementiels (Francofolies, Grand Pavois) et sa connaissance du nouveau règlement Agglo 2025. Note Google 4.7/5 sur 90 avis.",
      },
      {
        name: 'La Conciergerie de Lucas',
        url: 'https://www.laconciergeriedelucas.fr/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 55,
        biensGeres: 40,
        specialty: 'Boutique responsable, éco-engagée',
        description:
          "Conciergerie responsable et à taille humaine basée à La Rochelle. Lucas propose une gestion complète avec une approche éco-engagée (produits locaux, linge certifié). Commission à partir de 20 %, ménage refacturé voyageur. Clients décrivent un service sérieux, professionnel et très réactif — idéal pour 1 à 3 biens.",
      },
      {
        name: 'BNB Conciergerie La Rochelle',
        url: 'https://www.bnb-conciergerie.fr/conciergerie-airbnb-la-rochelle.html',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 65,
        biensGeres: 55,
        specialty: "Sans frais d'entrée ni engagement",
        description:
          "BNB Conciergerie propose une commission de 20 % des revenus nets (hors ménage), sans frais d'entrée ni d'engagement de durée. Gestion complète des annonces, accueil voyageurs et coordination des prestations. Bonne option pour tester la LCD rochelaise sans engagement long terme.",
      },
      {
        name: 'HostnFly La Rochelle',
        url: 'https://hostnfly.com/conciergerie-airbnb/la-rochelle',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.5,
        reviews: 110,
        biensGeres: 85,
        specialty: 'Tech + algorithme tarification dynamique',
        description:
          "Solution nationale clé en main avec algorithme de yield management propriétaire et diffusion sur 10+ plateformes. Commission à partir de 20 %, ménage refacturé voyageur. Bon choix pour un propriétaire qui privilégie l'optimisation automatique des tarifs sur les pics saisonniers (Francofolies, juillet-août).",
      },
      {
        name: 'Conciergerie BB La Rochelle',
        url: 'https://www.conciergebb.fr/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.6,
        reviews: 70,
        biensGeres: 60,
        specialty: 'Gestion complète multi-plateformes',
        description:
          "Conciergerie présente à La Rochelle avec une gestion multi-plateformes (Airbnb, Booking, Abritel). Commission 20 %, ménage refacturé voyageur. Service check-in/check-out, coordination ménage et maintenance inclus. Bonne option pour un bien en Vieux-Port ou aux Minimes.",
      },
      {
        name: 'Nestify La Rochelle',
        url: 'https://www.nestify.fr/conciergerie-airbnb-la-rochelle/',
        commission: '22 %',
        menage: 'refacturé voyageur',
        rating: 4.4,
        reviews: 80,
        biensGeres: 65,
        specialty: 'Réseau national, reporting mensuel',
        description:
          "Nestify couvre la création d'annonces, diffusion multi-plateformes, gestion complète des séjours et reporting financier mensuel. Commission 22 %, ménage refacturé voyageur. Idéal pour un investisseur qui veut une visibilité complète sur la performance de son bien et un tableau de bord financier détaillé.",
      },
    ],
    neighborhoods: [
      {
        name: 'Vieux-Port / Saint-Nicolas',
        pricePerNight: '90-175 €',
        occupancy: 73,
        description:
          "Cœur historique avec les tours médiévales et le Vieux-Port. Zone n°1 en attractivité touristique, forte demande toute l'année. Attention : soumis à la règle de compensation pour les autorisations permanentes (meublé à l'année). Appartements anciens à partir de 4 000 €/m².",
        roiBrut: '5 à 5,5 %',
      },
      {
        name: 'Les Minimes',
        pricePerNight: '75-135 €',
        occupancy: 68,
        description:
          "Quartier balnéaire avec plage, port de plaisance (le plus grand d'Europe) et Université de La Rochelle. Double clientèle : touristes en été et étudiants/chercheurs en intersaison. Zone de compensation pour les autorisations permanentes. T2 dès 295 000 €.",
        roiBrut: '5 à 6 %',
      },
      {
        name: 'Gabut / Cours des Dames',
        pricePerNight: '80-145 €',
        occupancy: 70,
        description:
          "Quartier des maisons de pêcheurs colorées sur les quais, à quelques pas du Vieux-Port. Très photogénique, prisé des voyageurs étrangers. Bonne demande tout au long de la saison. T2 rénovés à partir de 3 500 €/m².",
        roiBrut: '5,5 à 6 %',
      },
      {
        name: 'La Genette / Tasdon',
        pricePerNight: '60-100 €',
        occupancy: 60,
        description:
          "Quartiers résidentiels à 10-15 min du Vieux-Port, hors zones de compensation. Ticket d'entrée accessible (2 500-3 200 €/m²), rendement brut plus élevé. Clientèle familiale cherchant calme et accès facile au centre. Autorisations moins contraignantes.",
        roiBrut: '6,5 à 7,5 %',
      },
      {
        name: 'Île de Ré (Saint-Martin)',
        pricePerNight: '120-280 €',
        occupancy: 60,
        description:
          "Île accessible en 20 min depuis La Rochelle (pont payant). Tarifs parmi les plus élevés du littoral atlantique, forte demande estivale (juillet-août). Réglementation moins contraignante que La Rochelle centre mais très saisonnière. T2 dès 350 000 €.",
        roiBrut: '4,5 à 5 %',
      },
      {
        name: 'Laleu / La Pallice',
        pricePerNight: '50-80 €',
        occupancy: 55,
        description:
          "Quartiers portuaires et industriels en mutation, prix d'achat très bas (2 000-2 500 €/m²). Clientèle professionnelle maritime et industrielle (Grand Port Maritime). Rendement brut élevé, peu de tourisme pur, profil investisseur cherchant la rentabilité.",
        roiBrut: '7 à 8,5 %',
      },
    ],
    regulation:
      "La Rochelle a adopté le **13 novembre 2025** l'un des systèmes d'encadrement LCD les plus complets de France, basé sur un régime d'**autorisation préalable obligatoire**.\n\n**Deux types d'autorisations.** L'Agglo distingue : l'**autorisation permanente** (location à l'année, soumise à la règle de compensation dans les zones tendues) et l'**autorisation temporaire à titre personnel** (valable 1 an renouvelable, pour une location ponctuelle ou mixte). Un propriétaire ne peut détenir plus de **3 autorisations temporaires** dans les communes classées en zone tendue.\n\n**Enregistrement via declaloc.fr.** Tout meublé de tourisme doit être déclaré sur le portail **declaloc.fr** pour obtenir un numéro d'enregistrement à afficher sur toutes les annonces. Défaut = amende **10 000 €**. Les plateformes suppriment les annonces non conformes à partir du **20 mai 2026**.\n\n**Compensation obligatoire dans le centre et les Minimes.** Dans les quartiers les plus tendus (Vieux-Port, Gabut, Les Minimes), l'autorisation permanente impose de compenser la perte d'un logement pour les habitants en transformant une surface commerciale équivalente en habitation.\n\n**Déclaration mensuelle des nuitées.** Chaque mois, le propriétaire doit déclarer le nombre de nuitées sur **agglolarochelle.taxesejour.fr**, même lorsqu'Airbnb collecte automatiquement la taxe de séjour.\n\n**Loi Le Meur 2024.** DPE classe **E minimum** obligatoire (D à partir de 2034), abattement micro-BIC à **30 % pour les non classés** (50 % classés), copropriétés peuvent interdire la LCD à la **double majorité**.\n\n**Sanctions jusqu'à 100 000 €.** Défaut d'enregistrement : **10 000 €**. Fausse déclaration : **20 000 €**. Location sans autorisation de changement d'usage en zone tendue : jusqu'à **100 000 €**.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** Variable selon le classement de l'hébergement, collectée automatiquement par Airbnb.",
    concreteExample: {
      bienType: 'T2',
      surface: 40,
      pricePerNight: 100,
      neighborhood: 'Les Minimes',
      revenuBrut: 22000,
      commissionRate: 0.2,
      menageCount: 90,
      menageUnitCost: 60,
    },
    extraFaq: [
      {
        q: "Combien peut-on gagner avec un Airbnb pendant les Francofolies de La Rochelle ?",
        a: "Les Francofolies (festival de musique francophone, fin juillet, 4 jours, 150 000 entrées) génèrent des hausses de tarifs de +50 à +100 % sur les biens bien placés. Un T2 au Vieux-Port qui se loue 100 €/nuit en dehors de la saison peut atteindre 180-220 €/nuit pendant le festival, avec un taux d'occupation garanti à 100 %. Sur 4 nuits, cela représente 700 à 900 € de revenus supplémentaires. Le Grand Pavois (salon nautique, octobre) génère un second pic (+30 %) bienvenu en basse saison. Verrouillez ces dates dès l'ouverture du calendrier pour maximiser les revenus.",
      },
      {
        q: "Le nouveau système d'autorisation rochelais est-il très contraignant pour un particulier ?",
        a: "Pour un particulier qui loue sa résidence principale ponctuellement (vacances, week-ends), l'autorisation temporaire reste accessible : déclaration sur declaloc.fr, numéro d'enregistrement, et tenue du registre mensuel des nuitées. La contrainte principale concerne les zones de compensation dans le Vieux-Port et les Minimes : si vous voulez une autorisation permanente (résidence secondaire louée à l'année), il faut compenser en transformant un local commercial en logement — procédure longue et coûteuse. Pour un investissement locatif dédié, orientez-vous vers La Genette, Tasdon ou la périphérie où les contraintes sont moindres.",
      },
      {
        q: "L'Île de Ré est-elle gérable via une conciergerie basée à La Rochelle ?",
        a: "Oui, la plupart des conciergeries rochelaises couvrent l'Île de Ré (Saint-Martin-de-Ré, La Flotte, Ars-en-Ré) grâce au pont : 20-30 min en voiture. ZeRochelle, La Conciergerie de Lucas et BNB Conciergerie opèrent sur l'île. Les tarifs sur l'Île de Ré sont nettement plus élevés (120-280 €/nuit en été) mais la saisonnalité est encore plus marquée (creux hivernal quasi total de novembre à avril). Assurez-vous que la conciergerie dispose d'une équipe ménage et maintenance sur l'île même — c'est non-négociable pour la qualité opérationnelle.",
      },
    ],
    updatedAt: '2026-04-23',
  },
  // ==========================================================================
  // CAP D'AGDE
  // ==========================================================================
  {
    slug: 'cap-d-agde',
    displayName: "Cap d'Agde",
    region: 'Occitanie',
    regionSlug: 'occitanie',
    title: "Conciergerie Cap d'Agde Airbnb : comparatif 2026 des 6 meilleures agences",
    metaTitle: "Conciergerie Airbnb Cap d'Agde : Comparatif 2026 (tarifs & avis)",
    metaDescription:
      "Comparatif des 6 meilleures conciergeries Airbnb au Cap d'Agde. Tarifs (20-22 %), Roquille, Neptune, Centre-Port, réglementation 2026, quartiers rentables. Guide complet.",
    kwPrincipal: "conciergerie cap d'agde",
    kwSecondaires: [
      "conciergerie airbnb cap d'agde",
      "gestion locative cap d'agde",
      "location courte durée cap d'agde",
      "agence conciergerie cap agde",
      "conciergerie location saisonnière hérault",
    ],
    population: 31431,
    tourists: 3000000,
    activeListings: 1200,
    priceLow: 70,
    priceHigh: 210,
    occupancyRate: 65,
    revpar: 70,
    seasonality:
      "Saisonnalité extrêmement marquée : juillet-août concentrent 45-50 % du CA annuel (taux d'occupation 90-95 %, tarifs +70 %). Saison exploitable mai-septembre = 80 % des revenus. Creux hivernal important de novembre à mars (30-40 % d'occupation). Le Cap d'Agde est la première station balnéaire de France en capacité d'accueil : 175 000 lits touristiques.",
    rankNational: 20,
    introCustom:
      "Vous possédez un appartement au **Cap d'Agde** — front de mer, Roquille, Môle ou Neptune — et vous envisagez de le mettre en location saisonnière, ou vous cherchez à en savoir plus sur les agences locales.\n\nAvec 3 millions de touristes par an et une capacité d'accueil de 175 000 lits, le potentiel est indéniable. Mais la **saisonnalité extrême** (80 % des revenus concentrés entre mai et septembre) rend le choix de la conciergerie déterminant pour la rentabilité réelle.\n\nCe guide compare les **6 meilleures conciergeries du Cap d'Agde** — de HostnFly à Dell'Accio Dimora — pour vous aider à choisir **laquelle** convient à votre bien et vos objectifs.",
    marketIntro:
      "Le **Cap d'Agde** est la première station balnéaire de France par capacité d'hébergement avec plus de 15 millions de nuitées touristiques par an dans le département de l'Hérault.\n\nLe marché LCD y est très actif : **1 200 annonces actives** sur la commune, taux d'occupation annuel moyen de **65 %**, prix moyen en haute saison autour de **110 €/nuit**. Le RevPAR de 70 € dépasse la moyenne Occitanie de 5 %.\n\nLa particularité du Cap ? Une **saisonnalité ultra-concentrée** : juillet-août génèrent 45 à 50 % du CA annuel. Un T2 bien placé en Centre-Port peut espérer **16 000 à 22 000 €** de revenus bruts/an avec une bonne gestion.\n\nDepuis la **loi Le Meur 2024**, l'enregistrement national sur le téléservice devient obligatoire avant le **20 mai 2026** — les annonces sans numéro valide seront désactivées automatiquement par Airbnb et Booking.",
    conciergeries: [
      {
        name: "HostnFly Cap d'Agde",
        url: 'https://hostnfly.com/conciergerie-airbnb/cap-d-agde',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.6,
        reviews: 4000,
        biensGeres: 120,
        specialty: 'Leader national, 10+ plateformes, 0 frais fixe',
        description:
          "HostnFly est le leader national de la conciergerie Airbnb avec 150 000+ réservations gérées par an. Au Cap d'Agde, l'équipe locale gère plus de 100 logements avec pricing dynamique quotidien, diffusion sur 10 plateformes (Airbnb, Booking, Abritel…), photos pro et assurance incluses. Commission fixe à 20 %, ménage refacturé voyageur. Idéal pour un propriétaire qui veut un process zéro gestion.",
      },
      {
        name: "Dell'Accio Dimora",
        url: 'https://dellaccio-conciergerie.fr/',
        commission: '20-22 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 60,
        biensGeres: 70,
        specialty: "Cap d'Agde, Valras-Plage, Vias — ancrage local fort",
        description:
          "Fondée par une professionnelle avec plus de 10 ans en immobilier, Dell'Accio Dimora couvre les secteurs les plus prisés du littoral héraultais : Cap d'Agde, Valras-Plage et Vias. Service personnalisé et réactif, accueil sur mesure des voyageurs, gestion complète de A à Z. Idéale pour les propriétaires qui préfèrent une structure boutique avec un vrai suivi local.",
      },
      {
        name: 'CapConciergerie',
        url: 'http://capconciergerie.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 55,
        biensGeres: 80,
        specialty: "20 ans d'expérience immobilière au Cap d'Agde",
        description:
          "Forte de plus de 20 ans d'expérience en immobilier au Cap d'Agde, CapConciergerie propose une gestion locative complète adaptée aux résidences secondaires et aux biens dédiés LCD. Services : check-in/check-out, ménage, linge, maintenance, diffusion multi-plateformes. Son ancrage historique lui permet de maîtriser les subtilités de chaque quartier.",
      },
      {
        name: "BnB Cap d'Agde",
        url: 'https://www.bnbcapdagde.com/',
        commission: 'Forfaits dès 60 €/prestation',
        menage: 'refacturé voyageur',
        rating: 4.6,
        reviews: 30,
        biensGeres: 40,
        specialty: 'Modèle forfaitaire à la carte (pas de %)',
        description:
          "BnB Cap d'Agde se différencie par un modèle à la carte plutôt qu'une commission en pourcentage : pack complet à partir de 60 € (accueil + état des lieux), ménage pro dès 80 €. Ce modèle est particulièrement avantageux pour les propriétaires qui génèrent beaucoup de réservations et souhaitent payer au service réellement rendu.",
      },
      {
        name: 'F&G Conciergerie',
        url: 'https://conciergeriecapdagde.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 40,
        biensGeres: 50,
        specialty: "Gestion locative 100 % locale Cap d'Agde",
        description:
          "F&G Conciergerie est une agence locale dédiée à la gestion locative saisonnière au Cap d'Agde. Elle prend en charge l'intégralité du processus : rédaction des annonces, accueil voyageurs, ménage, linge, maintenance et reporting mensuel. Bonne option pour un propriétaire cherchant un interlocuteur 100 % local.",
      },
      {
        name: 'NFG Conciergerie',
        url: 'https://nfgconciergerie-capdagde.com/',
        commission: '22 %',
        menage: 'inclus',
        rating: 4.9,
        reviews: 35,
        biensGeres: 45,
        specialty: 'Ménage inclus dans la commission — tout compris',
        description:
          "NFG Conciergerie se distingue par l'inclusion du ménage dans sa commission de 22 %, sans frais additionnels. Ce modèle tout-compris simplifie le calcul de rentabilité. Spécialisée dans les appartements de front de mer et les résidences balnéaires du Cap d'Agde, elle affiche un taux de retour voyageurs parmi les plus élevés du secteur.",
      },
    ],
    neighborhoods: [
      {
        name: "Front de mer — Roquille & Môle",
        pricePerNight: '100-210 €',
        occupancy: 82,
        description:
          "Emplacement premium face à la mer, accès direct aux plages et au port de plaisance. Prix d'achat 3 500-4 500 €/m². Clientèle familiale et premium en saison. T2 à partir de 120 000 €. Zone la plus demandée, aussi la plus concurrentielle.",
        roiBrut: '5 à 6,5 %',
      },
      {
        name: 'Centre-Port / Richelieu',
        pricePerNight: '80-160 €',
        occupancy: 70,
        description:
          "Cœur animé du Cap d'Agde, à 5 min à pied des plages et du port. Restaurants, commerces, animation estivale. Bon compromis accessibilité/rentabilité pour un premier investissement. T2 à partir de 100 000 €.",
        roiBrut: '5 à 6 %',
      },
      {
        name: 'Neptune (village naturiste)',
        pricePerNight: '70-150 €',
        occupancy: 75,
        description:
          "Segment unique en Europe : village naturiste autonome accueillant jusqu'à 40 000 vacanciers au pic. Demande très spécialisée mais fidèle avec une clientèle de retour chaque saison. Biens moins chers à l'achat (2 500-3 500 €/m²).",
        roiBrut: '6 à 7 %',
      },
      {
        name: 'Rochelongue / Périphérie',
        pricePerNight: '60-110 €',
        occupancy: 58,
        description:
          "En retrait du front de mer, plages à 10-15 min à pied. Ticket d'entrée très accessible (T2 dès 70 000 €, 2 000-2 500 €/m²). Marché moins concurrentiel hors saison. Idéal pour un premier investissement à budget serré.",
        roiBrut: '4 à 5,5 %',
      },
      {
        name: 'Marseillan-Plage (commune limitrophe)',
        pricePerNight: '75-140 €',
        occupancy: 62,
        description:
          "Station balnéaire calme à 5 km, sur l'étang de Thau. Biens moins chers, réglementation moins contraignante. Clientèle familiale cherchant une alternative au Cap en haute saison. Bonne rentabilité sur les grandes surfaces.",
        roiBrut: '5 à 6 %',
      },
    ],
    regulation:
      "**Enregistrement obligatoire dès mai 2026.** La loi du 19 novembre 2024 impose l'enregistrement de tout meublé de tourisme sur un téléservice national avant le **20 mai 2026**. Airbnb et Booking désactiveront automatiquement les annonces sans numéro valide. Amendes : **10 000 €** pour non-enregistrement, **20 000 €** pour fausse déclaration.\n\n**Déclaration en mairie.** À Agde, la déclaration via le formulaire CERFA n°14004*04 reste obligatoire et attribue un numéro à afficher sur toutes les annonces (amende 450 € pour manquement). Ces deux obligations — mairie et téléservice national — sont cumulatives.\n\n**Plafond 120 nuitées/an.** La résidence principale est limitée à 120 jours de location par an. Agde/Cap d'Agde n'est pas classé en zone tendue à 90 jours, mais la loi Le Meur permet aux communes de réduire ce plafond.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** Agde applique le régime proportionnel : 5 % du coût net de la nuitée par personne pour les meublés non classés, plafonné à 4,60 €, plus 10 % de taxe additionnelle départementale (Hérault). Airbnb la collecte automatiquement. [Calculer votre taxe de séjour →](/calcul-taxe-de-sejour)\n\n**Fiscalité 2026.** L'abattement micro-BIC est ramené à **30 %** pour les meublés non classés (contre 50 % avant 2025). Faire classer son bien en meublé de tourisme (50 % d'abattement) est fortement recommandé pour préserver la rentabilité nette.\n\n**⚠️ Copropriétés — vérifiez avant d'acheter.** La loi Le Meur autorise une copropriété à voter en assemblée générale pour interdire la location courte durée, mais **c'est encore très rare en pratique**. L'essentiel : regardez votre règlement pour savoir si une clause vous interdit déjà de louer — la plupart des anciens règlements ne l'évoquent pas. [En savoir plus sur la loi Le Meur →](/blog/loi-le-meur-airbnb)",
    concreteExample: {
      bienType: 'T2',
      surface: 32,
      pricePerNight: 95,
      neighborhood: 'Centre-Port / Richelieu',
      revenuBrut: 18050,
      commissionRate: 0.20,
      menageCount: 78,
      menageUnitCost: 40,
    },
    extraFaq: [
      {
        q: "Le Cap d'Agde est-il trop saisonnier pour rentabiliser une location toute l'année ?",
        a: "Oui, la saisonnalité est le principal défi : juillet-août représentent à eux seuls 45-50 % du CA annuel, et la saison exploitable mai-septembre génère 80 % des revenus. Hors saison (novembre-mars), le taux d'occupation tombe à 30-40 %. Pour compenser, les bonnes conciergeries locales pratiquent un pricing agressif en basse saison et ciblent les week-ends prolongés et événements locaux. Sans stratégie active, le bien risque d'être vide 5 mois par an.",
      },
      {
        q: "Faut-il déclarer sa location au Cap d'Agde même si Airbnb collecte déjà la taxe de séjour ?",
        a: "Oui, absolument. La collecte automatique de la taxe de séjour par Airbnb ne vous dispense ni de déclarer votre meublé de tourisme en mairie (CERFA n°14004*04) ni de vous inscrire sur le téléservice national avant mai 2026. Ce sont deux obligations distinctes. Sans numéro d'enregistrement, vous risquez 450 € d'amende (mairie), et jusqu'à 10 000 € à partir de mai 2026 pour le registre national.",
      },
      {
        q: "Studio ou T2 : quel type de bien est le plus rentable au Cap d'Agde ?",
        a: "Le T2 (1 chambre, 28-35 m²) offre le meilleur compromis. Les studios peinent à justifier un tarif supérieur à 55-65 €/nuit même en haute saison, tandis que le T2 permet de facturer 80-130 €/nuit et d'accueillir 4 personnes. Pour un premier investissement sous 120 000 €, le T2 Centre-Port ou Roquille est le meilleur rapport prix/rentabilité.",
      },
    ],
    updatedAt: '2026-04-27',
  },
  // ==========================================================================
  // ARCACHON
  // ==========================================================================
  {
    slug: 'arcachon',
    displayName: 'Arcachon',
    region: 'Nouvelle-Aquitaine',
    regionSlug: 'nouvelle-aquitaine',
    title: 'Conciergerie Arcachon Airbnb : comparatif 2026 des 6 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Arcachon : Comparatif 2026 (tarifs & avis)',
    metaDescription:
      "Comparatif des 6 meilleures conciergeries Airbnb à Arcachon et Bassin. Tarifs (20-22 %), Pyla, Cap Ferret, zone tendue, réglementation 2026. Guide complet.",
    kwPrincipal: 'conciergerie arcachon',
    kwSecondaires: [
      'conciergerie airbnb arcachon',
      'conciergerie bassin arcachon',
      'gestion locative arcachon',
      'location courte durée arcachon',
      'conciergerie pyla arcachon',
    ],
    population: 11500,
    tourists: 4000000,
    activeListings: 700,
    priceLow: 90,
    priceHigh: 380,
    occupancyRate: 60,
    revpar: 82,
    seasonality:
      "Saisonnalité forte portée par le Bassin, la Dune du Pilat et l'Atlantique. Juillet-août représentent 50-60 % du CA annuel (occupation 90-95 %, tarifs multipliés par 2 à 3). Saison exploitable d'avril à octobre. Creux hivernal de novembre à mars (20-35 % d'occupation). Le Pyla-sur-Mer et Cap Ferret tirent les prix vers le haut avec des villas à 400-1 500 €/nuit.",
    rankNational: 14,
    introCustom:
      "Vous possédez une maison ou un appartement à **Arcachon** — Ville d'Hiver, Ville d'Été, ou ailleurs dans le **Bassin d'Arcachon** — et vous souhaitez le rentabiliser en location saisonnière.\n\nAvec 4 millions de visiteurs par an sur le Bassin, la Dune du Pilat et l'une des plus belles baies de France, le potentiel est exceptionnel. Mais la forte saisonnalité et la **réglementation zone tendue** complexifient la gestion, surtout pour les résidences secondaires.\n\nCe guide compare les **6 meilleures conciergeries Arcachon**, de YourHostHelper à La Conciergerie du Bassin, pour vous aider à choisir **laquelle** correspond à votre bien.",
    marketIntro:
      "Arcachon et son Bassin constituent l'un des marchés de location saisonnière les plus dynamiques de France, porté par la Dune du Pilat, les cabanes tchanquées et un littoral unique en Europe.\n\nLe Bassin d'Arcachon compte **plus de 2 500 annonces actives** de location courte durée, avec un taux d'occupation moyen de **60 %** et un prix moyen de **137 €/nuit**. Le RevPAR atteint 82 €, soit 25 % au-dessus de la moyenne Nouvelle-Aquitaine.\n\nLes performances varient fortement selon les secteurs : le **Pyla-sur-Mer** et Cap Ferret affichent des prix de 300-600 €/nuit pour des villas, tandis que les appartements en centre-ville d'Arcachon se négocient à 100-200 €/nuit.\n\nArcachon est classée **zone tendue**, ce qui plafonne la résidence principale à **90 jours par an** et impose des contraintes renforcées pour les résidences secondaires.",
    conciergeries: [
      {
        name: 'YourHostHelper Arcachon',
        url: 'https://yourhosthelper.com/en/agence-arcachon/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 5.0,
        reviews: 80,
        biensGeres: 100,
        specialty: 'Note Google 5/5, 4 agences sur le Bassin',
        description:
          "YourHostHelper est présent sur l'ensemble du Bassin avec 4 agences (Arcachon, La Teste-de-Buch, Gujan-Mestras, Lège-Cap-Ferret) et une note Google 5/5. Commission fixe à 20 %, ménage refacturé voyageur, photos pro incluses, pricing dynamique et dashboard propriétaire en temps réel. Excellent réseau local pour gérer des biens sur tout le Bassin.",
      },
      {
        name: 'Sejourneur Arcachon',
        url: 'https://www.sejourneur.com/conciergerie-a-arcachon/',
        commission: '20-22 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 90,
        biensGeres: 80,
        specialty: 'Spécialiste haut de gamme Bassin',
        description:
          "Sejourneur est spécialisé dans la gestion de biens haut de gamme sur le Bassin (villas, maisons de plage, propriétés premium). Commission 20-22 % avec un accompagnement personnalisé et un suivi rigoureux. Particulièrement adapté aux propriétaires de villas au Pyla ou de maisons sur pilotis à Cap Ferret.",
      },
      {
        name: 'La Conciergerie du Bassin',
        url: 'https://laconciergeriedubassin.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 65,
        biensGeres: 55,
        specialty: 'Conciergerie boutique — suivi ultra-personnalisé',
        description:
          "Gérée par Sophie, La Conciergerie du Bassin est une structure à taille humaine avec plusieurs années d'expertise dans la gestion locative haut de gamme sur le Bassin. Suivi personnalisé, accueil soigné des voyageurs, entretien impeccable. Idéale pour les propriétaires qui veulent un contact humain direct et une gestion attentive, pas un call center.",
      },
      {
        name: 'Welkeys Arcachon',
        url: 'https://www.welkeys.com/conciergerie-airbnb/arcachon',
        commission: '22-25 %',
        menage: 'refacturé voyageur',
        rating: 4.6,
        reviews: 120,
        biensGeres: 90,
        specialty: 'Premium, pricing saisonnier optimisé',
        description:
          "Welkeys maîtrise la stratégie tarifaire estivale sur les marchés saisonniers. À Arcachon, leur expertise en yield management maximise les revenus en juillet-août. Commission 22-25 % selon le niveau de service, ménage refacturé voyageur. Adapté aux villas et maisons premium sur le Bassin.",
      },
      {
        name: 'BNB Conciergerie Arcachon',
        url: 'https://bnb-conciergerie.fr/conciergerie-airbnb-arcachon.html',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 75,
        biensGeres: 60,
        specialty: '+30 % de revenus vs gestion en solo (moy. 3 mois)',
        description:
          "BNB Conciergerie affiche des résultats concrets : +30 % de revenus en moyenne par rapport à une gestion en solo après 3 mois. Commission à 20 %, sans frais d'entrée ni engagement. Gestion clé en main incluant diffusion multi-plateformes, accueil voyageurs, ménage et maintenance.",
      },
      {
        name: 'HostnFly Arcachon',
        url: 'https://hostnfly.com/conciergerie-airbnb/arcachon',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.5,
        reviews: 150,
        biensGeres: 80,
        specialty: 'Algo pricing IA, 10+ plateformes',
        description:
          "HostnFly apporte son algorithme de pricing dynamique et sa diffusion sur 10+ plateformes au marché arcachonnais. Assurance incluse, reporting mensuel. Commission à partir de 20 %, ménage refacturé voyageur. Option solide pour un appartement en centre-ville d'Arcachon qui nécessite un process industrialisé sans intervention manuelle.",
      },
    ],
    neighborhoods: [
      {
        name: 'Pyla-sur-Mer (Dune du Pilat)',
        pricePerNight: '200-600 €',
        occupancy: 68,
        description:
          "Secteur ultra-premium au pied de la Dune du Pilat. Villas et maisons de prestige avec piscine ou vue Bassin. Clientèle haut de gamme parisienne et internationale. Prix d'achat 7 000-15 000 €/m². Investissement pour gros budgets, mais ROI élevé sur une villa bien gérée.",
        roiBrut: '4,5 à 6 %',
      },
      {
        name: "Ville d'Hiver (Arcachon)",
        pricePerNight: '130-320 €',
        occupancy: 60,
        description:
          "Quartier historique chic avec villas de villégiature Belle Époque sur les hauteurs. Ambiance paisible, clientèle culturelle et familles aisées. Biens rares et très peu en vente. Prix d'achat 4 000-7 000 €/m².",
        roiBrut: '4 à 5 %',
      },
      {
        name: "Ville d'Été (centre-ville)",
        pricePerNight: '100-220 €',
        occupancy: 65,
        description:
          "Cœur commercial d'Arcachon en bord de Bassin, restaurants, casino et plages. Clientèle touristique large en été. Appartements accessibles (3 000-5 000 €/m²). Meilleur rapport occupation/prix pour un T2 ou T3.",
        roiBrut: '4,5 à 5,5 %',
      },
      {
        name: 'Lège-Cap-Ferret',
        pricePerNight: '180-500 €',
        occupancy: 58,
        description:
          "Presqu'île mythique face à la Dune du Pilat. Ambiance bohème chic, cabanes ostréicoles, clientèle bobo et célébrités. Saisonnalité extrême mais tarifs records. Prix d'achat 6 000-12 000 €/m².",
        roiBrut: '3,5 à 5 %',
      },
      {
        name: 'La Teste-de-Buch',
        pricePerNight: '80-160 €',
        occupancy: 55,
        description:
          "Commune limitrophe d'Arcachon, plus accessible à l'achat (2 000-3 500 €/m²). Accès rapide aux plages et aux services. Bon point d'entrée pour un investissement LCD dans le Bassin avec un budget limité.",
        roiBrut: '5 à 6,5 %',
      },
    ],
    regulation:
      "**Arcachon, zone tendue.** La ville figure sur la liste officielle des zones tendues, ce qui entraîne un plafond de **90 jours par an** pour la location de la résidence principale (contre 120 ailleurs) et des contraintes renforcées pour les résidences secondaires.\n\n**Enregistrement obligatoire.** Avant toute mise en location, vous devez obtenir un **numéro d'enregistrement à 13 chiffres** via le téléservice de la mairie ou le portail national. Depuis la **loi Le Meur 2024**, ce registre national doit être complété avant le **20 mai 2026** — les annonces sans numéro valide seront désactivées par les plateformes.\n\n**Changement d'usage résidence secondaire.** À Arcachon, une résidence secondaire mise en LCD nécessite une autorisation de changement d'usage. Dans certaines zones protégées du Bassin, une compensation (transformer un local commercial en logement équivalent) peut être exigée par la mairie.\n\n**Loi Le Meur 2026.** DPE minimum classe **E** obligatoire (classe D à partir de 2034), abattement micro-BIC réduit à **30 %** pour les meublés non classés (50 % pour les classés). Faire classer son meublé est fortement conseillé.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** Arcachon applique une taxe de séjour de 1,65 € à 4,40 € par nuit et par personne selon le classement, collectée automatiquement par Airbnb. [Calculer votre taxe de séjour →](/calcul-taxe-de-sejour)\n\n**⚠️ Copropriétés — vérifiez avant d'acheter.** La loi Le Meur autorise une copropriété à voter en assemblée générale pour interdire la location courte durée, mais **c'est encore très rare en pratique**. L'essentiel : regardez votre règlement pour savoir si une clause vous interdit déjà de louer — la plupart des anciens règlements ne l'évoquent pas. [En savoir plus sur la loi Le Meur →](/blog/loi-le-meur-airbnb)",
    concreteExample: {
      bienType: 'T2',
      surface: 38,
      pricePerNight: 145,
      neighborhood: "Ville d'Été (centre-ville)",
      revenuBrut: 24650,
      commissionRate: 0.20,
      menageCount: 80,
      menageUnitCost: 65,
    },
    extraFaq: [
      {
        q: "Quelle conciergerie choisir pour une villa au Pyla vs un appartement en centre-ville d'Arcachon ?",
        a: "Pour une villa au Pyla (300-600 €/nuit, clientèle premium), choisissez Sejourneur, La Conciergerie du Bassin ou YourHostHelper : ils sont habitués aux biens standing, à la coordination de prestataires haut de gamme et à une clientèle exigeante. Pour un appartement T2-T3 en centre-ville (100-200 €/nuit), HostnFly ou BNB Conciergerie offrent un process industrialisé et un pricing algorithmique plus adapté à un bien standard.",
      },
      {
        q: "Peut-on rentabiliser un bien sur le Bassin d'Arcachon toute l'année ?",
        a: "La saisonnalité est réelle : novembre à mars représentent seulement 15-20 % du CA annuel. Pour optimiser, les conciergeries ciblent les week-ends prolongés (Toussaint, Noël, Pâques), les séjours nature/VTT hors été et les retraites d'entreprise. Un T2 bien géré en centre-ville peut espérer 20 000-26 000 €/an avec une bonne conciergerie, contre 12 000-16 000 € en solo.",
      },
      {
        q: "Comment fonctionne l'autorisation de changement d'usage pour une résidence secondaire à Arcachon ?",
        a: "Pour une résidence secondaire en zone tendue comme Arcachon, vous devez déposer une demande d'autorisation de changement d'usage en mairie avant de la louer en LCD. Dans les secteurs protégés du Bassin, une compensation (transformer un local commercial de surface équivalente en logement) peut être exigée. La procédure prend 3 à 6 mois. Les conciergeries locales (YourHostHelper, Sejourneur) connaissent bien les démarches par secteur.",
      },
    ],
    updatedAt: '2026-04-27',
  },
  // ==========================================================================
  // MARRAKECH
  // ==========================================================================
  {
    slug: 'marrakech',
    displayName: 'Marrakech',
    region: 'Maroc',
    regionSlug: 'maroc',
    title: 'Conciergerie Marrakech Airbnb : comparatif 2026 des 6 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Marrakech : Comparatif 2026 (tarifs & avis)',
    metaDescription:
      'Comparatif des 6 meilleures conciergeries Airbnb à Marrakech. Tarifs (15-22 %), riads Médina, Guéliz, Palmeraie, réglementation loi 80-14, fiscalité Maroc 2026.',
    kwPrincipal: 'conciergerie marrakech',
    kwSecondaires: [
      'conciergerie airbnb marrakech',
      'gestion locative marrakech',
      'location courte durée marrakech',
      'conciergerie riad marrakech',
      'agence gestion airbnb marrakech',
    ],
    population: 980000,
    tourists: 3500000,
    activeListings: 9648,
    priceLow: 50,
    priceHigh: 350,
    occupancyRate: 52,
    revpar: 61,
    seasonality:
      "Saisonnalité distincte de la France : pic printanier mars-avril (temperatures idéales, 22-28°C) et automne septembre-novembre. L'été (juin-août) est creux en raison des fortes chaleurs (40°C+). Hiver doux (décembre-février) avec demande steady et tarifs plus modestes. Ramadan génère une période calme pour le tourisme mais animée localement.",
    rankNational: 1,
    introCustom:
      "**Marrakech** — la Ville Ocre, Jemaa el-Fna, les souks, les riads — attire 3,5 millions de touristes par an et affiche près de **10 000 annonces Airbnb actives**.\n\nInvestir dans un riad en **Médina** ou un appartement à **Guéliz** pour le mettre en location courte durée est de plus en plus courant chez les investisseurs francophones. Les rendements bruts de **6 à 8 %** dépassent souvent ce qu'on trouve dans les grandes villes françaises.\n\nMais la **loi 80-14** marocaine impose désormais une autorisation obligatoire, un registre des clients et une taxe de séjour. Ce guide compare les **6 meilleures conciergeries Marrakech** pour vous aider à choisir **laquelle** convient à votre bien.",
    marketIntro:
      "Marrakech est le premier marché LCD du Maghreb avec **9 648 annonces actives** sur Airbnb et un taux d'occupation moyen de **52 %** (top performers : 62-67 %).\n\nLe prix moyen par nuit est de **1 265 MAD (environ 118 €)**, avec des revenus mensuels moyens de **19 900 MAD (~1 860 €)** par annonce. Les riads premium de la Médina (Mouassine, Bab Doukkala) atteignent **150-350 €/nuit**, tandis que les studios de **Guéliz** se louent entre 50 et 90 €.\n\nLa saisonnalité est inversée par rapport à la France : le **printemps (mars-avril)** et **l'automne (septembre-novembre)** sont les meilleures saisons. L'été est creux à cause des chaleurs (40°C+), ce qui différencie Marrakech de toutes les destinations balnéaires françaises.\n\nDepuis la **loi 80-14 et son décret de 2023**, l'exploitation d'un logement en location courte durée sans autorisation est illégale au Maroc, avec des amendes de **20 000 à 100 000 MAD** (~1 900 à 9 300 €).",
    conciergeries: [
      {
        name: 'Morokeys',
        url: 'https://www.morokeys.com/',
        commission: '15-18 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 90,
        biensGeres: 100,
        specialty: 'Commission parmi les plus basses (15 %), tech-driven',
        description:
          "Morokeys est l'un des acteurs les plus actifs de la conciergerie LCD à Marrakech, avec une commission à partir de 15 % — parmi les plus basses du marché. Gestion complète : annonce multi-plateformes, communication voyageurs 24h/24, check-in, ménage, maintenance. Adapté aux appartements modernes de Guéliz et aux riads standard.",
      },
      {
        name: 'Dar & Keys',
        url: 'https://darandkeys.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 75,
        biensGeres: 80,
        specialty: 'Expert riads Médina, pricing premium',
        description:
          "Dar & Keys est spécialisé dans la gestion de riads et dars en Médina de Marrakech. Leur expertise de la clientèle internationale premium (tarifs 150-350 €/nuit) et de la stratégie de pricing par saison fait leur réputation. Commission à 20 %, ménage refacturé voyageur. La référence pour un riad de charme dans les quartiers Mouassine ou Riad Zitoun.",
      },
      {
        name: 'YourHostHelper Marrakech',
        url: 'https://yourhosthelper.com/en/agences-conciergerie-maroc/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 120,
        biensGeres: 150,
        specialty: 'Réseau France + Maroc, dashboard propriétaire',
        description:
          "YourHostHelper a étendu son réseau de conciergeries en France jusqu'au Maroc, avec une présence à Marrakech. Commission fixe à 20 %, photos pro incluses, dashboard propriétaire en temps réel. Bonne option pour les investisseurs français qui veulent le même interlocuteur que pour leurs biens en France.",
      },
      {
        name: 'Nippy House',
        url: 'https://nippy-house.com/',
        commission: '20 %',
        menage: 'inclus',
        rating: 4.7,
        reviews: 60,
        biensGeres: 70,
        specialty: 'Pack all-inclusive ménage compris',
        description:
          "Nippy House propose un pack tout compris à 20 % commission avec le ménage inclus — modèle simplifié apprécié des propriétaires non-résidents. Gestion complète des annonces, des séjours et de la maintenance. Bon rapport qualité/prix pour un appartement ou un riad de taille standard.",
      },
      {
        name: 'Hospitality Conciergerie Marrakech',
        url: 'https://www.hospitalityconciergemarrakech.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 55,
        biensGeres: 60,
        specialty: 'Service hôtelier haut de gamme, Hivernage & Palmeraie',
        description:
          "Hospitality Conciergerie Marrakech est positionnée sur le segment luxe : Hivernage, Palmeraie et riads premium. Commission à 20 % TTC sur chaque réservation, sans frais fixes. Standards hôteliers appliqués à la gestion des particuliers : welcome pack, service de conciergerie voyageur, linge de maison haut de gamme.",
      },
      {
        name: 'HostLux Marrakech',
        url: 'https://host-lux.com/',
        commission: '18-20 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 50,
        biensGeres: 55,
        specialty: 'Gestion locative complète, villa & riad',
        description:
          "HostLux est une conciergerie marrakchie spécialisée dans la gestion locative complète pour les propriétaires non-résidents. Commission entre 18 et 20 % selon le type de bien, ménage refacturé voyageur. Expertise reconnue sur les villas de la Palmeraie et les riads de la Médina. Interface propriétaire claire avec reporting mensuel.",
      },
    ],
    neighborhoods: [
      {
        name: 'Médina — Mouassine & Bab Doukkala',
        pricePerNight: '120-350 €',
        occupancy: 60,
        description:
          "Cœur historique classé UNESCO avec riads et dars authentiques. Clientèle internationale premium cherchant l'authenticité. Prix d'achat 800 000-3 000 000 MAD pour un riad (75 000-280 000 €). ROI élevé sur les riads bien rénovés.",
        roiBrut: '6 à 8 %',
      },
      {
        name: 'Guéliz (quartier moderne)',
        pricePerNight: '55-130 €',
        occupancy: 55,
        description:
          "Quartier moderne avec appartements contemporains, boutiques et restaurants branchés. Clientèle professionnelle et voyageurs indépendants. Prix d'achat accessibles (600 000-1 500 000 MAD). Idéal pour un premier investissement LCD.",
        roiBrut: '6 à 7,5 %',
      },
      {
        name: 'Hivernage',
        pricePerNight: '90-200 €',
        occupancy: 58,
        description:
          "Quartier résidentiel chic entre Médina et Guéliz. Hôtels de luxe, palaces, clubs branchés. Appartements et villas haut de gamme avec piscine. Clientèle aisée européenne et moyen-orientale. Prix d'achat 1 200 000-3 000 000 MAD.",
        roiBrut: '5 à 6,5 %',
      },
      {
        name: 'Palmeraie',
        pricePerNight: '200-800 €',
        occupancy: 48,
        description:
          "Secteur villa avec jardins privés, piscine et palmiers à 5 km du centre. Clientèle ultra-premium. Villas à partir de 3 000 000 MAD (280 000 €). Taux d'occupation plus faible mais tarifs records.",
        roiBrut: '4 à 5,5 %',
      },
      {
        name: 'Agdal / Quartier du golf',
        pricePerNight: '60-140 €',
        occupancy: 50,
        description:
          "Quartier résidentiel calme au sud, adjacent aux jardins de l'Agdal. Appartements modernes à prix raisonnables, bonne connexion au centre. Clientèle familles et voyageurs qui préfèrent le calme. Prix d'achat 700 000-1 400 000 MAD.",
        roiBrut: '5,5 à 7 %',
      },
    ],
    regulation:
      "**Autorisation obligatoire — loi 80-14 et décret 2.23.441 (2023).** Louer son logement en courte durée au Maroc sans autorisation préalable est illégal. L'autorisation s'obtient via la plateforme nationale **Télédéclaration des Établissements d'Hébergement Touristique** du Ministère du Tourisme. Sans autorisation, les amendes vont de **20 000 à 100 000 MAD** (~1 900 à 9 300 €) et l'établissement peut être fermé administrativement.\n\n**Registre des clients obligatoire.** Chaque propriétaire doit tenir un registre des arrivées et départs, avec conservation des bulletins d'arrivée pendant au moins un an. Les autorités marocaines ont considérablement renforcé les contrôles depuis 2024.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** La taxe varie selon la ville et le classement du bien : généralement **10 à 30 MAD** par nuitée et par personne. S'y ajoute la **Taxe de Promotion Touristique (TPT)** de 5 à 25 MAD. Chaque séjour doit donner lieu à une facture numérotée mentionnant ces taxes.\n\n**Fiscalité des revenus.** Les revenus locatifs sont soumis à l'**Impôt sur le Revenu (IR) marocain**. Les propriétaires non-résidents peuvent bénéficier d'un abattement forfaitaire de 40 % sur les revenus bruts. Des conventions fiscales franco-marocaines permettent d'éviter la double imposition.\n\n**Copropriété et règlement.** Comme en France, certaines copropriétés peuvent voter pour interdire la location touristique, mais **c'est encore rare en pratique**. Vérifiez le règlement avant d'acheter — notamment dans les résidences récentes de Guéliz ou Hivernage — pour savoir si une clause vous interdit déjà de louer.\n\n**⚠️ Attention propriétaires non-résidents.** La gestion à distance d'un bien à Marrakech sans conciergerie locale est très difficile : contrôles des autorités, gestion des arrivées tardives, maintenance. Une conciergerie locale habituée à la réglementation marocaine est quasi-indispensable.",
    concreteExample: {
      bienType: 'Riad 2 chambres',
      surface: 80,
      pricePerNight: 130,
      neighborhood: 'Médina — Mouassine',
      revenuBrut: 21000,
      commissionRate: 0.20,
      menageCount: 95,
      menageUnitCost: 35,
    },
    extraFaq: [
      {
        q: 'Faut-il absolument une autorisation pour louer son riad sur Airbnb à Marrakech ?',
        a: "Oui, depuis le décret 2.23.441 de juillet 2023 qui précise la loi 80-14, toute exploitation de location courte durée sans autorisation préalable du Ministère du Tourisme est illégale. Airbnb accepte de publier une annonce sans vérifier ce statut, mais les contrôles locaux des autorités marocaines se sont renforcés depuis 2024. Les amendes vont de 20 000 à 100 000 MAD et peuvent aboutir à une fermeture administrative. Les conciergeries locales (Dar & Keys, Morokeys) peuvent vous accompagner dans cette démarche.",
      },
      {
        q: "Quelle est la meilleure saison pour louer à Marrakech ?",
        a: "Contrairement à la France, Marrakech a une saisonnalité printanière et automnale : mars-avril (20-28°C, période idéale pour visiter, tarifs au plus haut) et septembre-novembre. L'hiver (décembre-février) est doux et steady. L'été (juin-août) est le creux absolu : 38-42°C dans la journée, le tourisme s'effondre. Planifiez vos travaux ou votre maintenance personnelle pendant cette période.",
      },
      {
        q: 'Un investisseur français peut-il vraiment gérer un Airbnb à Marrakech à distance ?',
        a: "Seul : non, c'est très difficile. La distance géographique, la barrière de langue partielle (darija), les contrôles des autorités et les spécificités locales (arrivées tardives, gestion des clés en Médina aux ruelles sinueuses) rendent la gestion à distance quasi-impossible sans partenaire local. Une conciergerie locale (YourHostHelper, Nippy House, Dar & Keys) est indispensable. Bonus : leur commission (15-20 %) est inférieure à la moyenne française, ce qui préserve la rentabilité.",
      },
    ],
    updatedAt: '2026-04-27',
  },
  // ==========================================================================
  // ANNECY
  // ==========================================================================
  {
    slug: 'annecy',
    displayName: 'Annecy',
    region: 'Auvergne-Rhône-Alpes',
    regionSlug: 'auvergne-rhone-alpes',
    title: 'Conciergerie Annecy Airbnb : comparatif 2026 des 7 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Annecy : Comparatif 2026 (tarifs & avis)',
    metaDescription:
      'Comparatif des 7 meilleures conciergeries Airbnb à Annecy. Tarifs (17-25 %), nouveau quota mairie 2 660 meublés, quartiers rentables et stratégie lac.',
    kwPrincipal: 'conciergerie airbnb annecy',
    kwSecondaires: [
      'conciergerie annecy',
      'gestion locative annecy',
      'location courte durée annecy',
      'airbnb annecy rentabilité',
      'meublé touristique annecy',
    ],
    population: 131272,
    tourists: 3000000,
    activeListings: 6200,
    priceLow: 85,
    priceHigh: 220,
    occupancyRate: 64,
    revpar: 78,
    seasonality:
      "Forte saisonnalité estivale : 90 % d'occupation entre juin et septembre, dopée par le Festival du Film d'Animation (juin) et la Fête du Lac (1er samedi d'août, plus grand spectacle pyrotechnique d'Europe). Creux marqué l'hiver hors vacances scolaires (30 %), avec un rebond Noël/Nouvel An. Les Noctibules (juillet-août) et le Marché de Noël soutiennent les ailes de saison.",
    rankNational: 6,
    introCustom:
      "Vous avez un appartement à **Annecy** que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée.\n\nEntre la **demande explosive** côté lac, la **proximité Genève** (40 min, clientèle internationale) et le tout nouveau **règlement de juin 2025** qui plafonne la ville à 2 660 meublés autorisés (contre 6 400 auparavant), vous vous demandez si confier la gestion à une conciergerie est encore rentable.\n\nEt surtout : **laquelle choisir** parmi les acteurs locaux annéciens ?",
    marketIntro:
      "Annecy fait partie du **top 6 des marchés LCD français** : 3 millions de visiteurs par an, 6 200 meublés de tourisme déclarés, et un revenu locatif moyen de **122 €/nuit** (+90 % d'occupation l'été).\n\nLa ville profite d'un **mix unique** : lac alpin classé parmi les plus purs d'Europe, vieille ville médiévale (la « Venise des Alpes ») et accès direct aux stations de ski (La Clusaz à 30 min, Le Grand-Bornand à 40 min).\n\nLa **proximité de Genève** (40 minutes par l'A41, aéroport international à 45 min) draine une clientèle internationale haut de gamme — Suisses, Allemands, Britanniques — au pouvoir d'achat supérieur à la moyenne française.\n\nMais attention : depuis **juin 2025**, Annecy applique le règlement le plus strict de France. **Quotas par zone** (460 en Vieille Ville, 1 000 sur le lac, 1 200 dans le reste de la ville), **changement d'usage obligatoire**, **autorisation valable 4 ans** et **une seule autorisation par personne**. Un investissement LCD à Annecy aujourd'hui, c'est entrer dans un marché plafonné — donc rare et valorisé.",
    conciergeries: [
      {
        name: 'La Conciergerie du Lac',
        url: 'https://laconciergeriedulac.com/',
        commission: '20-25 %',
        menage: 'refacturé voyageur',
        rating: 3.6,
        reviews: 175,
        biensGeres: 100,
        specialty: 'Pionnier annécien depuis 2016, local d\'accueil physique',
        description:
          "Première conciergerie Airbnb d'Annecy à disposer d'un local d'accueil physique pour propriétaires et voyageurs au cœur du centre-ville depuis 2022. Couvre tout le bassin annécien avec une approche hôtellerie-réception. Volume important (175+ avis) mais note Google moyenne (3,6) — à comparer attentivement avec les structures plus petites.",
      },
      {
        name: 'Save My Bed',
        url: 'https://www.savemybed.com/',
        commission: '20-25 %',
        menage: 'refacturé voyageur',
        rating: 4.5,
        reviews: 63,
        biensGeres: 40,
        specialty: 'Annecy + Megève, linge hôtelier inclus',
        description:
          "Conciergerie de confiance opérant sur Annecy et Megève, spécialisée locations meublées courte durée. Propose photos pro, linge hôtelier inclus, gestion check-in/out, optimisation prix et calendrier. Idéale si vous avez un bien dans les deux destinations.",
      },
      {
        name: 'Margaret Conciergerie',
        url: 'https://www.margaretconciergerie.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 19,
        biensGeres: 25,
        specialty: 'Carte CPI, gestion soignée',
        description:
          "Conciergerie spécialisée Airbnb basée 27 rue de Narvik à Annecy, dirigée par Alix et Aude. Carte professionnelle CPI N° 7401 2020 000 045 146, attention au détail saluée par les avis Google. Bon choix pour les propriétaires qui veulent un interlocuteur direct et une structure légalement encadrée.",
      },
      {
        name: 'Like your Bed',
        url: 'https://likeyourbed.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 50,
        biensGeres: 35,
        specialty: 'Service clé en main 7j/7, ménage + blanchisserie',
        description:
          "Service complet de A à Z : optimisation annonce, check-in/out, assistance voyageurs 7j/7, gestion des avis, ménage et blanchisserie inclus. Commission claire de 20 % sur les revenus locatifs, sans frais cachés ni paliers.",
      },
      {
        name: '16Bis Conciergerie',
        url: 'https://16bisconciergerie.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 5.0,
        reviews: 15,
        biensGeres: 20,
        specialty: 'Approche personnelle, linge hôtelier',
        description:
          "Conciergerie indépendante dirigée par Laurène, disponible avant, pendant et après les séjours. Linge et serviettes qualité hôtelière, produits éco-responsables et starter kits inclus. Idéal pour 1-2 biens avec une vraie relation humaine.",
      },
      {
        name: 'Cygne Blanc',
        url: 'https://cygne-blanc.fr/',
        commission: '20-22 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 30,
        biensGeres: 35,
        specialty: 'Annecy + Veyrier-du-Lac, multi-plateformes',
        description:
          "Couvre Annecy, Veyrier-du-Lac et alentours du lac. Diffusion multi-plateformes (Airbnb, Booking, TripAdvisor, Abritel), photos pro, assistance voyageurs 7j/7, logistique linge et ménage avec prestataires locaux. Bonne option pour les biens premium en bord de lac.",
      },
      {
        name: 'Welkeys Annecy',
        url: 'https://www.welkeys.com/conciergerie-airbnb/annecy',
        commission: '20-25 %',
        menage: 'refacturé voyageur',
        rating: 3.8,
        reviews: 100,
        biensGeres: 80,
        specialty: 'Réseau national, carte G loi Hoguet',
        description:
          "Branche annécienne d'un acteur national de la conciergerie Airbnb, titulaire de la carte G. Promet +25 % de revenus, mais avis mitigés à surveiller (frais de ménage, transparence commission). Volume important mais structure plus distante que les acteurs locaux.",
      },
    ],
    neighborhoods: [
      {
        name: 'Vieille Ville (Palais de l\'Île / Sainte-Claire)',
        pricePerNight: '130-220 €',
        occupancy: 75,
        description:
          "Cœur historique avec ses canaux, ruelles pavées et façades colorées — la « Venise des Alpes ». Quartier n°1 pour l'Airbnb avec la demande la plus forte de la ville mais zone A du nouveau règlement (quota 460 autorisations, déjà saturé). Prix m² ~6 950 €.",
        roiBrut: '5 à 6 %',
      },
      {
        name: 'Bord du Lac (Pâquier / Albigny)',
        pricePerNight: '150-250 €',
        occupancy: 80,
        description:
          "Esplanade emblématique face au lac et aux montagnes, prolongée par les plages d'Albigny. Vue lac premium qui justifie des tarifs nuit élevés (>200 €) — zone B du règlement (quota 1 000). Prix m² ~7 500 €.",
        roiBrut: '4,5 à 5,5 %',
      },
      {
        name: 'Annecy-le-Vieux',
        pricePerNight: '110-180 €',
        occupancy: 68,
        description:
          "Rive nord du lac, ambiance village + dynamisme économique. Très prisé des familles et de la clientèle étrangère, marché tendu avec biens rares. Prix m² appartement ~6 310 €, maison ~9 520 €.",
        roiBrut: '5 à 6 %',
      },
      {
        name: 'Cran-Gevrier',
        pricePerNight: '80-130 €',
        occupancy: 60,
        description:
          "Quartier résidentiel à l'ouest fusionné avec Annecy depuis 2017, accès rapide centre-ville et bord du Thiou. Bon ratio prix/rentabilité pour primo-investisseurs (m² ~4 800 €), zone C du règlement avec quotas plus larges.",
        roiBrut: '6 à 7 %',
      },
      {
        name: 'Seynod',
        pricePerNight: '75-120 €',
        occupancy: 58,
        description:
          "Sud d'Annecy, plus de maisons et d'espaces extérieurs, attire les familles. Cadre résidentiel équilibré, moins touristique mais demande pro et familiale stable. Prix m² ~4 845 €.",
        roiBrut: '6 à 7,5 %',
      },
      {
        name: 'Veyrier-du-Lac',
        pricePerNight: '180-350 €',
        occupancy: 70,
        description:
          "Adresse prestige rive est du lac, vues spectaculaires sur les Alpes. Marché patrimonial avec le m² le plus cher du bassin (~11 660 €) — investissement haut de gamme avec rentabilité brute modeste mais valorisation long terme.",
        roiBrut: '3 à 4,5 %',
      },
    ],
    regulation:
      "Annecy applique depuis **juin 2025** le règlement LCD le plus strict de France. La ville a été pionnière sur la régulation des meublés touristiques et sert désormais de modèle à Paris, Bordeaux et Saint-Malo.\n\n**Enregistrement obligatoire.** Déclaration préalable en mairie pour tout meublé de tourisme avec délivrance d'un **numéro à 13 chiffres** à mentionner sur chaque annonce Airbnb, Booking ou Abritel.\n\n**Limite 90 nuitées/an pour les résidences principales.** Annecy applique la **loi Le Meur 2024** : le plafond passe de 120 à 90 jours en zone tendue. Airbnb bloque automatiquement le calendrier au-delà.\n\n**Changement d'usage avec quotas par zone.** Depuis juin 2025, le parc total est plafonné à **2 660 meublés autorisés** (contre 6 400 avant), réparti entre **460 en Vieille Ville (zone A)**, **1 000 sur les bords du lac (zone B)** et **1 200 dans le reste de la ville (zone C)**. Toutes les nouvelles demandes sont gelées tant qu'aucune autorisation n'est libérée.\n\n**Une autorisation par personne, valable 4 ans.** L'autorisation est personnelle, incessible, et limitée à **un seul logement par propriétaire**. Elle doit être renouvelée tous les 4 ans.\n\n**DPE classe E minimum.** Depuis le 20 novembre 2024, un DPE A à E est exigé pour obtenir l'autorisation (A à D à partir de 2034).\n\n**⚠️ Compensation possible.** Pour les personnes morales (SCI, SARL), chaque m² retiré du parc résidentiel doit être compensé par la création d'une surface équivalente dans le même secteur — règle dissuasive pour les investisseurs structurés.\n\n**Sanction maximale 50 000 € par logement.** La mairie surveille activement les annonces non déclarées, notamment pendant les pics estivaux.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** Variable selon le classement de l'hébergement, collectée automatiquement par Airbnb.",
    concreteExample: {
      bienType: 'T2',
      surface: 38,
      pricePerNight: 122,
      neighborhood: 'Bord du Lac (Pâquier)',
      revenuBrut: 28500,
      commissionRate: 0.22,
      menageCount: 95,
      menageUnitCost: 70,
    },
    extraFaq: [
      {
        q: "Avec le nouveau quota de 2 660 meublés, peut-on encore se lancer en Airbnb à Annecy ?",
        a: "Oui, mais ça demande une stratégie précise. Les 6 400 meublés existants au moment du règlement ont une priorité d'antériorité, mais les autorisations sont valables 4 ans avec **une seule par personne** — donc des places se libèrent chaque année. Le secteur le plus accessible est la zone C (1 200 autorisations, reste de la ville), beaucoup moins saturé que la Vieille Ville (zone A, 460 places). Les conciergeries locales rodées au montage de dossiers (carte CPI, expertise loi Le Meur) peuvent vous aider à passer en file d'attente et à sécuriser une autorisation dès qu'elle se libère. À éviter : acheter sans avoir validé la disponibilité d'une autorisation dans la zone visée.",
      },
      {
        q: "Combien peut-on gagner avec un Airbnb pendant la Fête du Lac à Annecy ?",
        a: "Le 1er samedi d'août, la Fête du Lac (plus grand spectacle pyrotechnique d'Europe, 70 minutes de show) attire 200 000 spectateurs. Les hôtels sont saturés 6 mois à l'avance et les tarifs Airbnb sur le week-end (vendredi-dimanche) bondissent de **×2 à ×3** par rapport à la moyenne d'août. Un T2 qui se loue 122 €/nuit grimpe à 280-380 €/nuit. Sur le seul week-end de la Fête du Lac, un propriétaire peut générer 800 à 1 200 € bruts. Verrouillez les dates de la prochaine édition (1er août 2026) dès aujourd'hui.",
      },
      {
        q: "La proximité de Genève (40 minutes) est-elle un vrai atout pour mon Airbnb à Annecy ?",
        a: "C'est un atout majeur, surtout en intersaison. Annecy capte une clientèle internationale (Suisses, Allemands, Britanniques, Américains) qui transite par l'aéroport de Genève (45 min) et préfère Annecy à Genève pour le rapport qualité/prix. Cette clientèle a un budget **20 à 30 % supérieur** à la moyenne française et privilégie les biens premium (vue lac, terrasse, parking sécurisé). En octobre-novembre et avril-mai (creux annécien), elle représente jusqu'à 50 % des réservations dans les quartiers Albigny, Veyrier et Annecy-le-Vieux. Optimisez vos annonces en anglais et en allemand pour la capter.",
      },
    ],
    updatedAt: '2026-04-30',
  },
  // ==========================================================================
  // AVIGNON
  // ==========================================================================
  {
    slug: 'avignon',
    displayName: 'Avignon',
    region: 'Provence-Alpes-Côte d\'Azur',
    regionSlug: 'provence-alpes-cote-dazur',
    title: 'Conciergerie Avignon Airbnb : comparatif 2026 des 7 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Avignon : Comparatif 2026 (tarifs & avis)',
    metaDescription:
      'Comparatif des 7 meilleures conciergeries Airbnb à Avignon. Tarifs (14-23 %), zone tendue, stratégie Festival d\'Avignon, quartiers rentables intra-muros.',
    kwPrincipal: 'avignon conciergerie',
    kwSecondaires: [
      'conciergerie airbnb avignon',
      'gestion locative avignon',
      'location courte durée avignon',
      'airbnb avignon rentabilité',
      'meublé touristique avignon',
    ],
    population: 91760,
    tourists: 6500000,
    activeListings: 3500,
    priceLow: 60,
    priceHigh: 200,
    occupancyRate: 57,
    revpar: 57,
    seasonality:
      "Saisonnalité estivale dopée par le Festival d'Avignon (IN + OFF) en juillet : 1,6 million de billets OFF vendus en 22 jours, 97 % de remplissage IN, **60 à 100 millions d'euros de retombées économiques**. Les tarifs Airbnb explosent (×2 à ×3) et l'occupation dépasse 90 % sur tout le mois. Saison forte : avril-octobre. Creux : décembre-février.",
    rankNational: 11,
    introCustom:
      "Vous avez un appartement à **Avignon** que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée.\n\nEntre le **Festival d'Avignon** qui attire 1,6 million de spectateurs en juillet, le tourisme patrimonial UNESCO (Palais des Papes, Pont Saint-Bénezet) qui draine 5 millions de visiteurs par an, le **classement en zone tendue** depuis 2023 et la nouvelle loi Le Meur, vous vous demandez si confier la gestion à une conciergerie est vraiment rentable.\n\nEt surtout : **laquelle choisir** parmi les acteurs avignonnais ?",
    marketIntro:
      "Avignon est la **11e ville touristique de France** avec **22,3 millions de nuitées** dans le Vaucluse en 2024 (+3 % vs 2023), dont 29 % concentrées sur le Grand Avignon.\n\nLa ville profite de **trois leviers LCD majeurs** : le **Festival d'Avignon** en juillet (1,6 million de billets OFF, IN à 97 % de remplissage, 100 M€ de retombées éco), le **patrimoine UNESCO** (Palais des Papes 774 000 visiteurs, Pont d'Avignon 541 000 visiteurs en 2023) et la **proximité TGV Paris** (2h33, 26 trains/jour).\n\nLa connectivité est exceptionnelle : Gare TGV Avignon (Courtine), aéroport low-cost Avignon-Provence, A7 (Lyon 2h, Marseille 1h), ce qui crée une demande continue toute l'année.\n\n**Avignon est passée en zone tendue** par décret n°2023-822 du 25 août 2023, déclenchant la taxe sur les logements vacants, l'encadrement des loyers longue durée et la possibilité d'imposer le changement d'usage en LCD.",
    conciergeries: [
      {
        name: 'Merci Conciergerie Avignon',
        url: 'https://www.merci-conciergerie.fr/conciergerie-avignon',
        commission: '14-23 %',
        menage: 'refacturé voyageur',
        rating: 5.0,
        reviews: 50,
        biensGeres: 60,
        specialty: 'Barème progressif (14 % jusqu\'à 600 €)',
        description:
          "Conciergerie multi-villes (Marseille, Aix, Toulon, Avignon) avec une grille progressive unique : **14 % TTC** jusqu'à 600 € de revenus mensuels, **18 %** entre 600 et 1 300 €, **23 %** au-delà. Connaissance fine des micro-marchés avignonnais (Intra-muros, Barthelasse, Banasterie, Villeneuve-lès-Avignon).",
      },
      {
        name: 'Serena Place',
        url: 'https://serenaplace.fr/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 35,
        biensGeres: 40,
        specialty: 'Avignon + Provence + Côte Bleue',
        description:
          "Conciergerie fondée par Johanne et Chloé qui couvre Avignon, la Provence et la Côte Bleue jusqu'à Martigues. Propose une offre clé en main et une formule flexible à la carte pour les propriétaires qui veulent garder la main sur certaines tâches.",
      },
      {
        name: 'Capsule Corp Conciergerie Avignon',
        url: 'https://www.capsulecorp-conciergerie-avignon.fr/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 28,
        biensGeres: 30,
        specialty: 'Sans engagement, sans frais cachés',
        description:
          "Conciergerie Airbnb sans contrat longue durée et sans frais cachés, qui gère la communication voyageurs, les check-in/out, le ménage pro et l'optimisation tarifaire dynamique. Filiale du groupe Capsule Corp Immo, également présent à Grenoble et Nîmes.",
      },
      {
        name: 'Rachel Conciergerie',
        url: 'https://www.rachelconciergerie.com/',
        commission: '19-23 %',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 22,
        biensGeres: 25,
        specialty: 'Services premium (petits-déj, événementiel)',
        description:
          "Conciergerie locale (35 rue Saint-Michel, Avignon) qui couvre Avignon, Villeneuve-lès-Avignon et Les Angles. Offre clé en main + services premium voyageurs : petits-déjeuners, activités, décoration événementielle. Idéale pour les biens haut de gamme intra-muros.",
      },
      {
        name: 'Week Where',
        url: 'https://www.weekwhere.com/',
        commission: '22 %',
        menage: 'refacturé voyageur',
        rating: 5.0,
        reviews: 18,
        biensGeres: 35,
        specialty: 'Standing intra-muros + chef privé',
        description:
          "Conciergerie historique à Avignon depuis 2012, spécialisée dans la location saisonnière d'appartements de standing intra-muros et de biens de charme. Propose en plus aux voyageurs des visites guidées, chefs privés, baby-sitting et transferts.",
      },
      {
        name: 'MM Conciergerie',
        url: 'https://www.mmconciergerie-avignon.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 15,
        biensGeres: 20,
        specialty: 'Avignon + 30 km, gérée par 2 sœurs propriétaires',
        description:
          "Conciergerie créée par Magali et Marion, deux sœurs déjà propriétaires-loueuses depuis 5 ans à Avignon. Couvre un rayon de 30 km autour de la ville, positionnement humain et terrain. Bonne option pour propriétaires qui veulent un vrai interlocuteur.",
      },
      {
        name: 'La Fine Équipe (LFEC)',
        url: 'https://www.lafineequipe-conciergerie.fr/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 20,
        biensGeres: 25,
        specialty: '100 % Grand Avignon, fondateur ex-loueur LCD',
        description:
          "Conciergerie exclusivement Grand Avignon, positionnée sur la proximité locale. Le fondateur a lui-même plusieurs années d'expérience en LCD avant de monter LFEC pour mutualiser cette expertise. Parfait pour propriétaires recherchant une gestion ultra-locale.",
      },
    ],
    neighborhoods: [
      {
        name: 'Intra-muros (Palais des Papes)',
        pricePerNight: '110-200 €',
        occupancy: 70,
        description:
          "Cœur médiéval classé UNESCO, à 5 min à pied du Palais des Papes et du Pont Saint-Bénezet. Les voyageurs payent une prime importante pour dormir dans les ruelles intra-muros, surtout pendant le Festival (×2 à ×3).",
        roiBrut: '5,5 à 7 %',
      },
      {
        name: 'Quartier Banasterie',
        pricePerNight: '100-180 €',
        occupancy: 68,
        description:
          "Quartier bourgeois et tranquille intra-muros, prix m² médian ~3 100 € (1 900-4 100 €/m²), à 2 min du Palais des Papes. Cible familles et clientèle culture haut de gamme, bonne demande hors festival aussi.",
        roiBrut: '5 à 6,5 %',
      },
      {
        name: 'Île de la Barthelasse',
        pricePerNight: '90-150 €',
        occupancy: 60,
        description:
          "Plus grande île fluviale d'Europe, « poumon vert » d'Avignon avec 396 logements dont 326 maisons. Idéal pour familles cherchant un cadre nature à 10 min du centre, ROI tiré par le foncier moins cher.",
        roiBrut: '6 à 7,5 %',
      },
      {
        name: 'Saint-Roch (extra-muros sud-ouest)',
        pricePerNight: '70-110 €',
        occupancy: 58,
        description:
          "Quartier résidentiel à 10 min à pied de la gare centrale, 834 logements (dont 662 appartements). Prix m² inférieur à la moyenne ville, bon couple rendement/proximité gare TGV-Centre.",
        roiBrut: '7 à 8,5 %',
      },
      {
        name: 'Champfleury (extra-muros sud)',
        pricePerNight: '65-100 €',
        occupancy: 55,
        description:
          "Quartier résidentiel calme aux portes des remparts, prix m² médian ~2 125 € (apparts) — soit 30 % moins cher que la moyenne ville. ROI le plus élevé des quartiers couverts, demande tirée par les voyageurs pragmatiques avec voiture.",
        roiBrut: '7,5 à 9 %',
      },
      {
        name: 'Villeneuve-lès-Avignon (rive Gard)',
        pricePerNight: '80-130 €',
        occupancy: 65,
        description:
          "Commune voisine côté Gard, charme village + Fort Saint-André. Ticket d'entrée immobilier plus bas qu'Avignon centre, 290+ annonces actives, demande estivale très soutenue (revenu août ~2 000 €/mois, 80 % occupation).",
        roiBrut: '6 à 7,5 %',
      },
    ],
    regulation:
      "Avignon est classée **zone tendue** depuis le décret n°2023-822 du 25 août 2023, ce qui déclenche un ensemble de restrictions spécifiques pour la LCD.\n\n**Enregistrement obligatoire.** Déclaration préalable en mairie obligatoire pour tout meublé de tourisme avec délivrance d'un **numéro à 13 chiffres** à mentionner sur chaque annonce Airbnb, Booking ou Abritel. Contact mairie : meubletourisme@mairie-avignon.com.\n\n**Limite 120 nuitées/an pour les résidences principales** (réductible à 90 jours/an par délibération municipale en zone tendue depuis la **loi Le Meur 2024**). Airbnb bloque automatiquement le calendrier au-delà.\n\n**Changement d'usage activable.** En tant que zone tendue, Avignon peut imposer une autorisation de changement d'usage pour les résidences secondaires utilisées en LCD. À vérifier auprès de la mairie selon le quartier.\n\n**Loi Le Meur 2024.** DPE classe **A à E** obligatoire pour louer en LCD (DPE G **interdit depuis le 1er janvier 2025**), abattement micro-BIC réduit à **50 % pour les meublés classés** et **30 % pour les non classés** (plafond abaissé à **15 000 €**). Les règlements de copropriété peuvent désormais interdire la location touristique à la **double majorité**.\n\n**Numéro d'enregistrement national au plus tard le 20 mai 2026.** Téléservice national obligatoire pour TOUS les meublés de tourisme, y compris ceux déjà déclarés en mairie. Sanction : amende jusqu'à **10 000 €** (défaut d'enregistrement) et **20 000 €** (fausse déclaration).\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** Collectée au réel par la commune via la plateforme dédiée. Tarifs variables selon le classement (1 à 5 étoiles) ou un pourcentage du prix de la nuitée pour les non classés (5 % plafonné). **Festival d'Avignon (juillet)** : la commune surveille activement les annonces non déclarées pendant cette période de pic.",
    concreteExample: {
      bienType: 'T2',
      surface: 40,
      pricePerNight: 100,
      neighborhood: 'Intra-muros (Palais des Papes)',
      revenuBrut: 22000,
      commissionRate: 0.20,
      menageCount: 80,
      menageUnitCost: 60,
    },
    extraFaq: [
      {
        q: "Combien peut-on gagner avec un Airbnb pendant le Festival d'Avignon ?",
        a: "Pendant les 22 jours du Festival d'Avignon (IN + OFF, début juillet à fin juillet), les tarifs grimpent de **+100 à +200 %** par rapport à la moyenne annuelle. Un T2 intra-muros qui se loue 100 €/nuit hors saison peut atteindre 220 à 350 €/nuit, avec un taux d'occupation à 100 %. Sur la durée complète du festival, un propriétaire peut générer **5 000 à 8 000 € bruts** pour un bien bien placé près du Palais des Papes ou de la rue de la République. Verrouillez les dates dès le mois de janvier précédent — les festivaliers (artistes, programmateurs, journalistes) réservent 6 mois à l'avance.",
      },
      {
        q: "Quels sont les meilleurs quartiers d'Avignon pour louer en Airbnb hors festival ?",
        a: "**Intra-muros (Palais des Papes, Banasterie)** reste le meilleur choix toute l'année grâce au tourisme patrimonial UNESCO (5 millions de visiteurs annuels). Pour un meilleur ROI brut, **Champfleury** (extra-muros sud) et **Saint-Roch** (proximité gare) offrent des prix m² 30 % moins chers avec une occupation de 55-60 %. **Villeneuve-lès-Avignon** (rive Gard) cumule charme village + ticket d'entrée bas. À éviter pour la LCD : zones nord et est trop éloignées du centre où la demande tombe rapidement hors festival.",
      },
      {
        q: "La gare TGV Avignon est-elle un atout pour la rentabilité ?",
        a: "Oui, c'est un atout structurel. Avignon est à **2h33 de Paris** par le TGV le plus rapide (26 trains/jour, opérateurs SNCF, Ouigo, Lyria, TER) et 1h de Marseille. Cette connectivité génère un flux continu de week-ends parisiens (vendredi-dimanche) toute l'année et de touristes internationaux (Espagnols, Allemands, Britanniques) qui combinent Avignon avec la Provence (Lubéron, Ventoux, Châteauneuf-du-Pape). Les quartiers Saint-Roch et Champfleury (proches gare TGV-Centre) bénéficient particulièrement de cette demande business + culturelle. Une navette gare TGV-Centre en 7 minutes facilite l'accès intra-muros.",
      },
    ],
    updatedAt: '2026-04-30',
  },
  // ==========================================================================
  // NANTES
  // ==========================================================================
  {
    slug: 'nantes',
    displayName: 'Nantes',
    region: 'Pays de la Loire',
    regionSlug: 'pays-de-la-loire',
    title: 'Conciergerie Nantes Airbnb : comparatif 2026 des 7 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Nantes : Comparatif 2026 (tarifs & avis)',
    metaDescription:
      'Comparatif des 7 meilleures conciergeries Airbnb à Nantes. Tarifs (13-25 %), changement d\'usage obligatoire, quartiers rentables, stratégie Voyage à Nantes.',
    kwPrincipal: 'conciergerie nantes',
    kwSecondaires: [
      'conciergerie airbnb nantes',
      'gestion locative nantes',
      'location courte durée nantes',
      'airbnb nantes rentabilité',
      'meublé touristique nantes',
    ],
    population: 325070,
    tourists: 10500000,
    activeListings: 4500,
    priceLow: 70,
    priceHigh: 170,
    occupancyRate: 71,
    revpar: 67,
    seasonality:
      "Saisonnalité moins marquée que les villes balnéaires grâce au tourisme d'affaires et au cluster French Tech. Pic juin-septembre avec **Le Voyage à Nantes** (6 juillet au 8 septembre, 853 000 visites en 2024) qui dope l'occupation. Tourisme business régulier hors saison via TGV Paris (2h, 25 allers-retours/jour). Hellfest fin juin à Clisson (40 km) génère un débordement de festivaliers vers Nantes. Creux : décembre-février.",
    rankNational: 8,
    introCustom:
      "Vous avez un appartement à **Nantes** que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée.\n\nEntre **Le Voyage à Nantes** qui attire 853 000 visiteurs en été, le tourisme business porté par la French Tech, la **proximité TGV Paris** (2h) et un règlement local devenu l'un des plus stricts de France (changement d'usage obligatoire, compensation pour les SCI), vous vous demandez si confier la gestion à une conciergerie est vraiment rentable.\n\nEt surtout : **laquelle choisir** parmi les acteurs nantais ?",
    marketIntro:
      "Nantes est la **6e ville de France** par sa population (325 000 habitants, 672 000 sur la métropole) et la **8e ville la plus visitée**, avec **10,5 millions de nuitées** sur la métropole en 2024 (33 % des nuitées de Loire-Atlantique).\n\nLa ville profite de **quatre leviers LCD** : Le **Voyage à Nantes** (parcours d'art urbain estival, 853 000 visites en 2024), les **Machines de l'Île** (Grand Éléphant, Carrousel des Mondes Marins), le **tourisme d'affaires** (cluster French Tech, Cité des Congrès, CHU sur l'Île de Nantes) et la **proximité Atlantique** (Pornic, La Baule à 45 min).\n\nLa connectivité est excellente : **TGV Paris en 2h**, gare Atlantique connectée centre-ville, A11/A83/A84. Cette accessibilité génère un flux continu de week-ends parisiens et de voyageurs business toute l'année — le taux d'occupation moyen est de **71 %**, l'un des plus élevés des grandes villes françaises (vs 63 % moyenne France).\n\n**Nantes est en zone tendue** (décret 10 mai 2013) **et** soumise au régime de l'**autorisation de changement d'usage de plein droit** (commune > 200 000 habitants), ce qui en fait l'une des villes les plus restrictives de France pour les résidences secondaires en LCD.",
    conciergeries: [
      {
        name: 'Cocoonr Nantes',
        url: 'https://cocoonr.fr/conciergerie-bnb-nantes/',
        commission: '15-20 %',
        menage: 'refacturé voyageur',
        rating: 4.5,
        reviews: 42,
        biensGeres: 66,
        specialty: 'Plus gros gestionnaire de Loire-Atlantique',
        description:
          "Antenne nantaise du réseau Cocoonr structuré depuis 2015, qui gère une soixantaine de biens à Nantes et Loire-Atlantique. Grille tarifaire transparente entre 15 et 20 % TTC selon le périmètre (gestion partagée à full service), photos pro et diffusion multi-plateformes. 2 303 avis cumulés à 4,69/5.",
      },
      {
        name: 'Conciergerie Lulu',
        url: 'https://conciergerielulu.com/',
        commission: '20 %',
        menage: 'inclus dans commission',
        rating: 4.7,
        reviews: 29,
        biensGeres: 35,
        specialty: 'Seule conciergerie nantaise avec carte d\'agent immobilier',
        description:
          "Conciergerie portée par Benjamin Luzeau et Isabelle depuis août 2023, structurée en SAS. Modèle volontairement épuré avec une commission unique de **20 % HT tout inclus** (ménage forfait inclus dans la commission) et la carte professionnelle d'agent immobilier — rare sur le marché nantais.",
      },
      {
        name: 'Conciergerie Océane',
        url: 'https://www.conciergerie-oceane.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 80,
        biensGeres: 50,
        specialty: 'Conciergerie historique nantaise, full service A à Z',
        description:
          "Conciergerie créée par Mickaël Mary, qui gère plus de 50 logements à Nantes et sa métropole. Approche « comme si c'était chez nous » et présence physique systématique aux check-in et check-out. Bonne option pour propriétaires qui veulent une gestion humaine et proche.",
      },
      {
        name: 'Kerbnb',
        url: 'https://kerbnb.fr/',
        commission: '13-15 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 25,
        biensGeres: 30,
        specialty: 'Commission la plus basse de Nantes, éco-responsable',
        description:
          "Conciergerie nantaise éco-responsable fondée en 2020 par Didier Rayssiguier, avec une **commission disruptive de 13 à 15 % HT** contre 20-25 % en moyenne sur le marché. Approche locale et durable revendiquée. Le choix rationnel pour un propriétaire qui veut maximiser sa marge.",
      },
      {
        name: 'Hoomy Nantes',
        url: 'https://www.hoomy.fr/conciergeries/votre-conciergerie-a-nantes/',
        commission: '25-30 %',
        menage: 'variable',
        rating: 4.3,
        reviews: 60,
        biensGeres: 350,
        specialty: 'Maisons et villas, périmètre régional Pays de la Loire',
        description:
          "Réseau régional basé à Nantes qui gère plus de 350 biens à travers les Pays de la Loire — majoritairement des maisons et villas. Structure plus large mais commission parmi les plus élevées du marché. Pertinent pour des biens dispersés (Nantes + côte atlantique).",
      },
      {
        name: 'WeHost Nantes',
        url: 'https://www.wehost.fr/conciergerie-airbnb-nantes/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.3,
        reviews: 230,
        biensGeres: 80,
        specialty: 'Réseau national, technologie pricing dynamique',
        description:
          "Antenne nantaise du réseau national WeHost (commission 20 %), qui industrialise la gestion Airbnb avec optimisation tarifaire et calendrier. Linge et photos pro en suppléments — modèle plus modulaire que tout-inclus. 230+ avis Trustpilot.",
      },
      {
        name: 'Conciergerie Nantaise',
        url: 'https://www.conciergerie-nantaise.fr/',
        commission: '0-8 %',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 35,
        biensGeres: 40,
        specialty: 'Modèle disruptif « 0 % commission », facturation à l\'acte',
        description:
          "Conciergerie nantaise active depuis 2020 avec un positionnement disruptif : **0 ou 8 % de commission** selon les services choisis, et facturation à la prestation plutôt qu'au pourcentage. Reporting mensuel détaillé. À étudier de près si vous générez de gros revenus locatifs.",
      },
    ],
    neighborhoods: [
      {
        name: 'Centre-ville (Bouffay / Decré-Cathédrale)',
        pricePerNight: '110-160 €',
        occupancy: 78,
        description:
          "Cœur médiéval avec ruelles et immeubles à colombages, à 5 min à pied du château des Ducs et de la cathédrale. Prix au m² ~4 200 €, demande locative tendue toute l'année (business + tourisme).",
        roiBrut: '5 à 6 %',
      },
      {
        name: 'Île de Nantes (Machines / Hangar à Bananes)',
        pricePerNight: '100-150 €',
        occupancy: 72,
        description:
          "Quartier en mutation spectaculaire autour des Machines de l'Île, du Hangar à Bananes et du nouveau CHU. Potentiel de valorisation le plus fort de Nantes pour les investisseurs prêts à accompagner la transformation urbaine.",
        roiBrut: '5,5 à 7 %',
      },
      {
        name: 'Graslin / Talensac',
        pricePerNight: '120-170 €',
        occupancy: 75,
        description:
          "Quartier bourgeois haussmannien (parquets point de Hongrie, cheminées marbre) entre 5 000 et 6 500 €/m². Place Graslin, théâtre, marché Talensac — emplacement premium pour clientèle exigeante.",
        roiBrut: '4 à 5 %',
      },
      {
        name: 'Hauts-Pavés / Saint-Félix',
        pricePerNight: '85-120 €',
        occupancy: 70,
        description:
          "Quartier résidentiel calme et bien desservi (~4 500 €/m²), prisé pour sa qualité de vie. Bon compromis prix d'achat / locatif, ciblage tourisme familial et long séjour business.",
        roiBrut: '6 à 7 %',
      },
      {
        name: 'Erdre / Procé',
        pricePerNight: '90-130 €',
        occupancy: 67,
        description:
          "Quartiers verts au bord de l'Erdre et autour du parc de Procé. Cible voyageurs cherchant calme et nature, à 15 min du centre. Demande plus saisonnière, idéale pour familles l'été.",
        roiBrut: '5 à 6 %',
      },
      {
        name: 'Doulon-Bottière',
        pricePerNight: '70-95 €',
        occupancy: 62,
        description:
          "Quartier en mutation à l'est, prix d'acquisition les plus bas de Nantes (loyers médians ~16 €/m² vs 22 € centre). ROI brut le plus élevé de la ville mais demande LCD plus fragile (clientèle business essentiellement).",
        roiBrut: '7 à 9 %',
      },
    ],
    regulation:
      "Nantes est l'une des villes françaises où la régulation LCD est la **plus stricte**. Cumul du statut de **zone tendue** (décret 10 mai 2013) et de l'**autorisation de changement d'usage de plein droit** (commune > 200 000 habitants).\n\n**Enregistrement obligatoire.** Déclaration en mairie via cerfa n°14004, avec délivrance d'un **numéro à 13 chiffres** à mentionner sur **toutes les annonces** (Airbnb, Booking, Abritel) et contrats. Plateforme dédiée : taxedesejour.nantesmetropole.fr.\n\n**Limite 120 nuitées/an pour les résidences principales** (réductible à 90 jours/an par délibération municipale en zone tendue depuis la **loi Le Meur 2024**). Airbnb bloque automatiquement le calendrier au-delà.\n\n**Changement d'usage obligatoire pour les résidences secondaires.** Pour un investissement locatif dédié (non résidence principale), Nantes impose une autorisation de changement d'usage **délivrée par la mairie**. Le régime varie selon le statut du propriétaire :\n\n**⚠️ Personne physique vs personne morale.** **Personne physique** : changement d'usage **sans compensation**, durée 4 ans renouvelable 2 ans (8 ans max), caractère personnel et incessible. **Personne morale (SCI, SARL)** : **règle de compensation obligatoire** — création d'un logement équivalent à celui transformé en meublé de tourisme. Règle dissuasive pour les investisseurs structurés.\n\n**Loi Le Meur 2024.** DPE classe **A à E** obligatoire (DPE G **interdit depuis le 1er janvier 2025**), abattement micro-BIC réduit à **50 % pour les meublés classés** et **30 % pour les non classés** (plafond abaissé à **15 000 €**). Les règlements de copropriété peuvent désormais interdire la LCD à la **double majorité**.\n\n**Sanctions.** Amende jusqu'à **50 000 € par logement** en cas de défaut d'autorisation de changement d'usage, et **10 000 €** pour défaut d'enregistrement.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** Variable selon le classement de l'hébergement, collectée automatiquement par Airbnb.",
    concreteExample: {
      bienType: 'T2',
      surface: 42,
      pricePerNight: 95,
      neighborhood: 'Centre-ville (Bouffay)',
      revenuBrut: 24600,
      commissionRate: 0.20,
      menageCount: 95,
      menageUnitCost: 55,
    },
    extraFaq: [
      {
        q: "Avec le changement d'usage obligatoire, peut-on encore investir en Airbnb à Nantes ?",
        a: "Oui, mais avec une stratégie précise. La règle clé : **investissez en personne physique, pas en SCI**. Une personne physique obtient l'autorisation **sans compensation** (durée 4 ans renouvelable une fois 2 ans), tandis qu'une SCI ou SARL doit créer un logement équivalent (compensation). Pour un investisseur particulier, la procédure mairie reste accessible, surtout en dehors de l'hyper-centre où les autorisations sont moins demandées. Les conciergeries comme **Conciergerie Lulu** (carte d'agent immobilier) ou **Cocoonr** (15 ans d'expérience locale) peuvent vous aider à monter le dossier de A à Z.",
      },
      {
        q: "Combien peut-on gagner avec un Airbnb pendant Le Voyage à Nantes ?",
        a: "Pendant les 9 semaines du Voyage à Nantes (6 juillet au 8 septembre), l'occupation grimpe à **85-90 %** et les tarifs augmentent de **+30 à +50 %** par rapport à la moyenne annuelle. Un T2 centre-ville qui se loue 95 €/nuit hors saison atteint 130-150 €/nuit avec une réservation quasi continue. Sur la durée complète (~63 nuits), un propriétaire peut générer **7 000 à 9 000 € bruts** pour un bien bien placé près du parcours (Bouffay, Île de Nantes, Graslin). À Nantes, contrairement à Avignon, l'effet « événement » est plus diffus mais plus long — c'est un atout pour la stabilité des revenus.",
      },
      {
        q: "Nantes est-elle intéressante pour la clientèle business et la French Tech ?",
        a: "Oui, c'est même un **atout structurel**. Nantes a le 3e plus gros écosystème French Tech de France après Paris et Lyon, et la Cité des Congrès attire 700+ événements/an (200 000 congressistes). La demande business (cadres en mission, conférences, séminaires) est très forte du lundi au jeudi avec des séjours de 2-4 nuits, et lisse la saisonnalité. Les quartiers Centre-ville, Île de Nantes (proximité CHU + Machines) et Graslin captent cette clientèle qui préfère un Airbnb à l'hôtel pour les longs séjours grâce aux cuisines équipées. Le **TGV Paris en 2h** permet aussi d'accueillir des cadres parisiens en télétravail Nantes-Paris sur 2-3 jours.",
      },
    ],
    updatedAt: '2026-04-30',
  },
  // ==========================================================================
  // AIX-EN-PROVENCE
  // ==========================================================================
  {
    slug: 'aix-en-provence',
    displayName: 'Aix-en-Provence',
    region: 'Provence-Alpes-Côte d\'Azur',
    regionSlug: 'provence-alpes-cote-dazur',
    title: 'Conciergerie Aix-en-Provence Airbnb : comparatif 2026 des 7 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Aix-en-Provence : Comparatif 2026',
    metaDescription:
      'Comparatif des 7 meilleures conciergeries Airbnb à Aix-en-Provence. Tarifs (17-22 %), services, avis Google, zone tendue, quartiers rentables (Mazarin, centre).',
    kwPrincipal: 'conciergerie aix en provence',
    kwSecondaires: [
      'conciergerie airbnb aix en provence',
      'conciergerie de luxe aix en provence',
      'gestion locative aix en provence',
      'location courte durée aix en provence',
      'meublé touristique aix en provence',
    ],
    population: 145325,
    tourists: 3000000,
    activeListings: 2200,
    priceLow: 70,
    priceHigh: 220,
    occupancyRate: 65,
    revpar: 70,
    seasonality:
      "Saisonnalité forte avril-octobre, dopée par le Festival d'art lyrique en juillet (clientèle internationale haut de gamme), les universités et écoles (Sciences Po, IAE) qui amènent un flux étudiant/business toute l'année, et la proximité Marseille (30 min en TER). Pics tarifaires en juillet/août et lors des grands événements culturels. Creux décembre-février. Le tourisme d'affaires lié à Aéroport Marseille-Provence (25 km) lisse la saisonnalité.",
    rankNational: 18,
    introCustom:
      "Vous avez un appartement à **Aix-en-Provence** que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée.\n\nEntre le **Festival d'art lyrique** en juillet, la clientèle universitaire et business toute l'année, le **classement en zone tendue** et la nouvelle loi Le Meur, vous vous demandez si confier la gestion à une conciergerie est vraiment rentable.\n\nEt surtout : **laquelle choisir** parmi la dizaine d'acteurs aixois ?",
    marketIntro:
      "Aix-en-Provence est l'un des marchés LCD les plus stables de France, porté par trois moteurs distincts : le **tourisme patrimonial et culturel** (Cours Mirabeau, Atelier Cézanne, Cité du Livre), le **Festival d'art lyrique** en juillet (clientèle internationale premium) et un **vivier universitaire et économique** (Aix-Marseille Université, Sciences Po, IAE, technopôle de l'Arbois) qui crée une demande continue.\n\nAvec environ **2 200 annonces actives** et un revenu moyen par annonce autour de 25 000-30 000 €/an, le marché aixois affiche un taux d'occupation annuel proche de **65 %** sur les biens bien placés (Mazarin, centre historique).\n\nLa proximité immédiate avec **Marseille** (30 min en TER) et l'aéroport Marseille-Provence (25 km) attire une clientèle d'affaires qui lisse la saisonnalité, contrairement à des villes purement balnéaires.\n\n**Aix-en-Provence est en zone tendue** : numéro d'enregistrement obligatoire en mairie, plafond de 120 nuitées par an pour les résidences principales, et autorisation de changement d'usage exigée pour les résidences secondaires (procédure en évolution avec la loi Le Meur).",
    conciergeries: [
      {
        name: 'L\'Aixcapade',
        url: 'https://laixcapade.fr/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 5.0,
        reviews: 28,
        biensGeres: 35,
        specialty: 'Conciergerie 100 % aixoise, note Google parfaite',
        description:
          "L'Aixcapade est une conciergerie boutique exclusivement focalisée sur Aix-en-Provence et ses environs immédiats (Le Tholonet, Meyreuil, Bouc-Bel-Air). Commission de 20 % TTC sur les revenus de réservation, ménage refacturé au voyageur. Note Google parfaite de 5.0/5 sur une trentaine d'avis. Création et optimisation de l'annonce, photos pro, pricing dynamique, accueil 7j/7. Idéale pour un propriétaire qui veut un interlocuteur unique très réactif sur un T1-T3 en centre-ville ou dans le Mazarin.",
      },
      {
        name: 'Le Mazarin Conciergerie',
        url: 'https://www.lemazarin.com/conciergerie/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.4,
        reviews: 28,
        biensGeres: 45,
        specialty: 'Formule unique 20 %, sans frais cachés',
        description:
          "Le Mazarin applique une commission unique de 20 % sur les revenus collectés, sans frais fixes ni frais cachés. Couvre l'ensemble du cycle locatif : création et diffusion annonce, gestion des réservations, accueil voyageurs, ménage pro, linge hôtelier, maintenance et reporting financier mensuel. Particulièrement bien implantée dans le quartier Mazarin et le centre historique, avec une approche prestige assumée pour les biens haut de gamme.",
      },
      {
        name: 'My Home Conciergerie',
        url: 'https://www.myhome-conciergerie.fr/',
        commission: '18-20 %',
        menage: 'refacturé voyageur',
        rating: 5.0,
        reviews: 15,
        biensGeres: 25,
        specialty: '18 % avec engagement 1 an, optimisation des tarifs',
        description:
          "My Home Conciergerie propose une grille à deux niveaux : 18 % TTC avec engagement d'un an ou 20 % TTC sans engagement. Ménage refacturé au voyageur. Positionnement haut de gamme avec un travail fin sur l'optimisation tarifaire (yield management saisonnier et événementiel autour du Festival d'art lyrique). Note Google 5.0/5 sur une quinzaine d'avis. Bon choix pour les propriétaires qui veulent maximiser le revenu d'un bien dans le Mazarin ou autour du Cours Mirabeau.",
      },
      {
        name: 'Conciergerie Blanc',
        url: 'https://www.conciergerieblanc.fr/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 36,
        biensGeres: 40,
        specialty: 'Spécialiste ménage et linge écoresponsable',
        description:
          "Conciergerie Blanc se distingue par un positionnement écoresponsable : produits d'entretien biosourcés, linge en circuit court, fournitures d'accueil sourcées en Provence. Commission 20 % TTC, ménage refacturé. Note Google 4.9/5 sur 36 avis avec des retours clients qui soulignent la constance qualitative — un atout important pour la note moyenne Airbnb (impact direct sur la visibilité). Idéal pour un bien dans l'hypercentre où les voyageurs sont exigeants sur la propreté.",
      },
      {
        name: 'NG Conciergerie Pays d\'Aix',
        url: 'https://www.ngconciergerie.fr/',
        commission: '17-22 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 26,
        biensGeres: 35,
        specialty: 'Prestation à la carte, grille modulable',
        description:
          "NG Conciergerie propose une grille modulable de 17 à 22 % selon le périmètre de service choisi (formule de base sans création annonce ou formule complète avec yield). Couvre Aix intra-muros et le Pays d'Aix élargi (Venelles, Bouc-Bel-Air, Gardanne). Note Google 4.8/5. Idéal pour un propriétaire déjà autonome sur certains aspects (création d'annonce, photos) qui veut négocier précisément le périmètre de la conciergerie.",
      },
      {
        name: 'YourHostHelper Aix-en-Provence',
        url: 'https://yourhosthelper.com/conciergerie-aix-en-provence/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 95,
        biensGeres: 80,
        specialty: 'Réseau national, présence Aix consolidée',
        description:
          "YourHostHelper est un réseau national né à Cannes en 2017, présent à Aix-en-Provence depuis plusieurs années avec une équipe dédiée. Commission de 20 % sans frais fixes, ménage refacturé au voyageur. Photos pro incluses, pricing dynamique, diffusion multi-plateformes (Airbnb, Booking, Vrbo). Bon rapport process-industrialisés / réactivité locale pour les propriétaires multi-biens ou qui résident à distance.",
      },
      {
        name: 'HostnFly Aix-en-Provence',
        url: 'https://hostnfly.com/conciergerie-airbnb/aix-en-provence',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.5,
        reviews: 110,
        biensGeres: 90,
        specialty: 'Algorithme de pricing dynamique propriétaire',
        description:
          "Solution clé en main avec algorithme de tarification dynamique propriétaire et 150 000+ réservations gérées par an au niveau national. Commission à partir de 20 %, ménage refacturé voyageur, diffusion 10+ plateformes, assurance incluse. Le pricing automatisé est un vrai atout sur un marché comme Aix où les pics (Festival d'art lyrique, rentrée universitaire, week-ends prolongés) doivent être captés finement.",
      },
    ],
    neighborhoods: [
      {
        name: 'Quartier Mazarin',
        pricePerNight: '150-250 €',
        occupancy: 72,
        description:
          "Quartier patrimonial XVIIe au sud du Cours Mirabeau : hôtels particuliers, places ombragées, calme résidentiel. Le secteur le plus prisé d'Aix pour le LCD haut de gamme, avec les meilleures occupations (>85 % en haute saison). T2 à partir de 350 000 €.",
        roiBrut: '4,5 à 5,5 %',
      },
      {
        name: 'Centre historique / Cours Mirabeau',
        pricePerNight: '100-180 €',
        occupancy: 68,
        description:
          "Cœur piéton autour du Cours Mirabeau et de la place des Cardeurs : restaurants, marchés provençaux, terrasses. Clientèle 100 % touristique avec rotation rapide (séjours 2-4 nuits). Excellent compromis occupation/prix pour un T1-T2.",
        roiBrut: '5 à 6 %',
      },
      {
        name: 'Saint-Jean-de-Malte',
        pricePerNight: '120-200 €',
        occupancy: 65,
        description:
          "Quartier patrimonial autour de l'église Saint-Jean-de-Malte et du musée Granet. Charme aixois authentique, à 5 min à pied du Cours Mirabeau. Apprécié des couples et voyageurs culturels. T2 à partir de 320 000 €.",
        roiBrut: '5 à 5,5 %',
      },
      {
        name: 'Sextius-Mirabeau / Encagnane',
        pricePerNight: '70-130 €',
        occupancy: 60,
        description:
          "Quartier en mutation autour de la gare TGV et de Sciences Po : mix étudiants, business et tourisme. Tarifs accessibles, demande très lissée sur l'année (semaine = business, week-end = tourisme). Ticket d'entrée plus bas (T2 dès 220 000 €).",
        roiBrut: '6 à 7 %',
      },
      {
        name: 'Jas de Bouffan',
        pricePerNight: '70-120 €',
        occupancy: 55,
        description:
          "Quartier résidentiel à l'ouest, autour de l'Atelier Cézanne et du complexe sportif. Réservé aux familles et longs séjours, moins concurrentiel. Bon ticket d'entrée pour un premier investissement LCD à Aix.",
        roiBrut: '6,5 à 7 %',
      },
      {
        name: 'La Torse / Pont de l\'Arc',
        pricePerNight: '80-140 €',
        occupancy: 58,
        description:
          "Quartiers résidentiels au sud-est, proches de la rocade et de l'autoroute A8. Maisons individuelles avec piscine très demandées en été par les familles. Tarifs estivaux élevés mais saisonnalité plus marquée.",
        roiBrut: '5,5 à 6 %',
      },
    ],
    regulation:
      "Aix-en-Provence est classée **zone tendue** et figure parmi les villes où Airbnb bloque automatiquement les réservations au-delà des seuils autorisés. Tout loueur doit obtenir un **numéro d'enregistrement à 13 chiffres** auprès de la mairie avant toute mise en location. La résidence principale est plafonnée à **120 nuitées par an** au niveau national.\n\n**Changement d'usage pour résidence secondaire.** En tant que ville de plus de 50 000 habitants en zone tendue, Aix-en-Provence impose l'autorisation de changement d'usage pour transformer un logement en meublé de tourisme dédié. Les modalités précises (compensation, durée, périmètre) évoluent — consulter directement la direction de l'urbanisme de la mairie avant tout investissement dédié LCD.\n\n**Loi Le Meur 2024 et calendrier 2026.** L'enregistrement national sur téléservice unique est obligatoire avant le **20 mai 2026**, sous peine de désactivation automatique des annonces par les plateformes (Booking, Airbnb). Le DPE classe E minimum est obligatoire (classe D à partir de 2034), et l'abattement micro-BIC passe à 30 % pour les meublés non classés (50 % pour les classés tourisme). Amendes jusqu'à **10 000 € pour défaut d'enregistrement** et **20 000 € pour fausse déclaration**.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** Variable de 0,75 € à 4,30 € par nuit et par personne selon le classement de l'hébergement, collectée automatiquement par Airbnb depuis 2019.",
    concreteExample: {
      bienType: 'T2',
      surface: 42,
      pricePerNight: 135,
      neighborhood: 'Quartier Mazarin',
      revenuBrut: 28000,
      commissionRate: 0.20,
      menageCount: 80,
      menageUnitCost: 75,
    },
    extraFaq: [
      {
        q: 'Faut-il une autorisation pour louer en Airbnb à Aix-en-Provence ?',
        a: "Oui. Tout loueur doit déclarer son meublé de tourisme à la mairie et obtenir un numéro d'enregistrement à 13 chiffres à faire figurer sur chaque annonce. Pour une résidence principale, la location reste plafonnée à 120 nuitées par an. Pour une résidence secondaire, une autorisation de changement d'usage est exigée (procédure auprès de la direction de l'urbanisme). À partir du 20 mai 2026, l'enregistrement passera par un téléservice national unique, et toute annonce sans numéro sera automatiquement désactivée par Airbnb et Booking.",
      },
      {
        q: 'Combien peut-on gagner avec un Airbnb pendant le Festival d\'art lyrique d\'Aix ?',
        a: "Le Festival d'art lyrique (3 semaines fin juin à mi-juillet) attire une clientèle internationale haut de gamme (mélomanes, professionnels du spectacle, presse) prête à payer +50 à +100 % par rapport aux tarifs standards de juillet. Un T2 dans le Mazarin qui se loue 150 €/nuit en haute saison atteint 230-280 €/nuit pendant le Festival, avec un minimum 3-4 nuits imposé. Sur les 3 semaines, un bien bien placé peut générer 4 500 à 6 000 € bruts uniquement sur cette période, contre 3 200 € en juillet « standard ». Une conciergerie experte ouvre les dates 12 mois à l'avance et applique un yield précis.",
      },
      {
        q: 'Quels quartiers privilégier pour investir en LCD à Aix-en-Provence ?',
        a: "Pour un objectif rentabilité + sécurité, le quartier Mazarin reste la valeur sûre : occupations records (>85 % en saison), tarifs élevés, clientèle premium, mais ticket d'entrée >350 000 € pour un T2. Pour un ticket plus accessible avec demande lissée, Sextius-Mirabeau ou Encagnane (proximité gare TGV et Sciences Po) offrent une demande mixte étudiants/business/tourisme avec des prix d'achat 30 % plus bas. À éviter si vous visez le LCD pur : les hauteurs résidentielles éloignées (Puyricard, Eguilles) où la demande Airbnb reste faible hors juillet-août.",
      },
    ],
    updatedAt: '2026-05-15',
  },
  // ==========================================================================
  // HYÈRES
  // ==========================================================================
  {
    slug: 'hyeres',
    displayName: 'Hyères',
    region: 'Provence-Alpes-Côte d\'Azur',
    regionSlug: 'provence-alpes-cote-dazur',
    title: 'Conciergerie Hyères Airbnb : comparatif 2026 des 7 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Hyères : Comparatif 2026 (tarifs & avis)',
    metaDescription:
      'Comparatif des 7 meilleures conciergeries Airbnb à Hyères. Tarifs (10-25 %), spécialités Giens & La Capte, zone tendue, quartiers rentables, exemple concret.',
    kwPrincipal: 'conciergerie hyeres',
    kwSecondaires: [
      'conciergerie airbnb hyeres',
      'conciergerie hyères',
      'hyeres conciergerie',
      'gestion locative hyeres',
      'location courte durée presqu\'ile de giens',
      'meublé touristique hyeres',
    ],
    population: 56799,
    tourists: 2500000,
    activeListings: 3800,
    priceLow: 60,
    priceHigh: 220,
    occupancyRate: 55,
    revpar: 52,
    seasonality:
      "Saisonnalité très marquée : pic absolu juillet-août (occupation >90 %, tarifs ×2 à ×2,5), épaule mai-juin et septembre (60-75 % d'occupation), creux profond novembre-mars (<25 %). La Presqu'île de Giens et La Capte captent la clientèle balnéaire, tandis que le centre médiéval et le port maintiennent une activité d'arrière-saison (séniors, voyages culturels, salons nautiques). Les Îles d'Or (Porquerolles, Port-Cros) attirent un tourisme premium qui transite par Hyères.",
    rankNational: 22,
    introCustom:
      "Vous avez un appartement ou une villa à **Hyères** que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée.\n\nEntre la **Presqu'île de Giens** et ses tarifs estivaux records, la clientèle balnéaire ultra-saisonnière de **La Capte** et le **classement en zone tendue**, vous vous demandez si confier la gestion à une conciergerie est vraiment rentable.\n\nEt surtout : **laquelle choisir** parmi les acteurs hyérois et varois ?",
    marketIntro:
      "Hyères est l'un des marchés balnéaires les plus dynamiques du Var avec environ **3 800 annonces actives** et un revenu moyen par annonce qui peut dépasser **20 000 €/an** sur les biens bord de mer.\n\nLa ville bénéficie d'une **géographie exceptionnelle** : la **Presqu'île de Giens** (double tombolo unique en France), les plages de **La Capte** et de **l'Almanarre** (spot de kitesurf de niveau mondial), l'embarquement vers les **Îles d'Or** (Porquerolles, Port-Cros) et un centre médiéval perché qui maintient une attractivité culturelle hors-saison.\n\nLe marché est **très saisonnier** : 70 % du revenu annuel se concentre sur juin-septembre, avec des pics où les tarifs sont **multipliés par 2 à 2,5**. La clientèle vient majoritairement de France (PACA, Île-de-France, Rhône-Alpes) avec une part croissante d'Allemands, Suisses et Belges.\n\n**Hyères est classée zone tendue** (décret 2023-822) : numéro d'enregistrement obligatoire, plafond 120 nuitées pour les résidences principales, et procédure de changement d'usage en cours de déploiement pour les résidences secondaires (loi Le Meur).",
    conciergeries: [
      {
        name: 'Bonni',
        url: 'https://bonni.fr/conciergerie-airbnb-hyeres/',
        commission: '10-18 %',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 30,
        biensGeres: 35,
        specialty: 'Commission progressive dès 10 %',
        description:
          "Conciergerie locale fondée en 2023, Bonni couvre l'ensemble du périmètre hyérois : Giens, La Capte, Port d'Hyères, Costebelle, Les Salins, L'Almanarre et centre médiéval. Commission progressive à partir de 10 % du chiffre d'affaires net, sans frais fixes ni engagement. Note Google 4.9/5 sur une trentaine d'avis. Annonce un objectif de +35 % de revenus en moyenne sur les biens repris, grâce à un yield agressif et à une présence terrain 7j/7. Profil idéal pour un propriétaire qui veut tester un partenaire local sans engagement.",
      },
      {
        name: 'YourHostHelper Hyères',
        url: 'https://yourhosthelper.com/conciergerie-hyeres/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 65,
        biensGeres: 60,
        specialty: 'Réseau national, expertise villa avec piscine',
        description:
          "Antenne locale du réseau national YourHostHelper, pilotée par Jade Brunet à Hyères. Commission 20 % sur le revenu généré, ménage refacturé. Photos pro, création d'annonce, diffusion multi-plateformes (Airbnb, Booking, Abritel), pricing dynamique, gestion ménage et linge hôtelier. Spécialisation prononcée sur les villas avec piscine de Giens, Costebelle et La Capte qui demandent une gestion technique (entretien piscine, jardinier, prestataires bord de mer).",
      },
      {
        name: 'ILIOS Conciergerie',
        url: 'https://www.iliosconciergerie.fr/',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 100,
        biensGeres: 70,
        specialty: 'Acteur local historique, 100+ avis Google',
        description:
          "Conciergerie hyéroise installée 24 avenue Ambroise Thomas, ILIOS est l'un des acteurs locaux les plus établis avec 100+ avis Google « Excellent ». Création d'annonces performantes, gestion quotidienne (réservations, communication voyageurs, check-in/out), ménage pro, maintenance. Couverture Airbnb, Booking, Abritel. Tarification sur devis selon le bien et le niveau de service — généralement aligné sur le marché varois (18-22 %). À privilégier pour un propriétaire qui valorise la relation humaine et la stabilité d'un partenaire local de longue date.",
      },
      {
        name: 'Hyères Conciergerie',
        url: 'https://www.hyeres-conciergerie.fr/',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 45,
        biensGeres: 40,
        specialty: 'Conciergerie dédiée Hyères et alentours',
        description:
          "Conciergerie 100 % focalisée sur Hyères et sa proche périphérie (Carqueiranne, La Crau, Le Pradet). Offre clé en main couvrant l'annonce, la diffusion, la communication voyageurs, l'accueil, le ménage et la maintenance. Tarification sur devis adaptée à la typologie du bien (studio, T2, villa). Bonne réputation locale et réactivité rapide, particulièrement appréciée pour la gestion des villas avec piscine sur la Presqu'île de Giens et à Costebelle.",
      },
      {
        name: 'HostnFly Hyères',
        url: 'https://hostnfly.com/conciergerie-airbnb/hyeres',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.5,
        reviews: 75,
        biensGeres: 65,
        specialty: 'Tech + algorithme yield, diffusion 10+ plateformes',
        description:
          "Solution clé en main avec algorithme de tarification dynamique propriétaire et 150 000+ réservations gérées par an au niveau national. Commission à partir de 20 %, ménage refacturé, diffusion sur 10+ plateformes (Airbnb, Booking, Vrbo, Abritel, Expedia), assurance incluse. Le yield automatisé est un vrai atout sur un marché aussi saisonnier qu'Hyères où chaque pic estival (Tour Voile, salons nautiques) doit être capté finement.",
      },
      {
        name: 'Welkeys Hyères',
        url: 'https://www.welkeys.com/conciergerie-airbnb/hyeres',
        commission: '22-25 %',
        menage: 'refacturé voyageur',
        rating: 4.6,
        reviews: 55,
        biensGeres: 50,
        specialty: 'Premium national, biens standing bord de mer',
        description:
          "Acteur national premium, Welkeys cible les biens de standing : villas Giens, Costebelle, La Capte, avec un suivi qualitatif renforcé et un pricing agressif pendant les pics estivaux. Commission 22-25 % selon le niveau de service, ménage refacturé voyageur. Reporting financier détaillé, gestion stricte des avis (impact direct sur la visibilité Airbnb). Pertinent pour les propriétaires multi-biens ou résidant à distance qui veulent un process industrialisé.",
      },
      {
        name: 'AllForHost Hyères',
        url: 'https://allforhost.com/la-conciergerie-airbnb-a-hyeres/',
        commission: '15-18 %',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 35,
        biensGeres: 30,
        specialty: 'Commission basse, formule revenu réel',
        description:
          "AllForHost propose une grille parmi les plus accessibles du marché hyérois : 15 % sur une offre standard ou 18 % sur la formule au revenu réel (avec optimisation tarifaire poussée). Ménage refacturé au voyageur. Couvre l'annonce, la communication, l'accueil, le ménage pro et la maintenance courante. Bon choix pour un propriétaire qui veut maximiser la marge nette sur un bien moyen de gamme (T2-T3 La Capte ou centre).",
      },
    ],
    neighborhoods: [
      {
        name: 'Presqu\'île de Giens',
        pricePerNight: '120-280 €',
        occupancy: 70,
        description:
          "Joyau géographique d'Hyères : double tombolo unique en France, plages sauvages, embarquement pour Porquerolles. Clientèle haut de gamme française et internationale. Pics tarifaires juillet-août sur les villas avec piscine vue mer. Marché tendu, peu d'offre disponible. Villa T3 à partir de 650 000 €.",
        roiBrut: '4 à 5 %',
      },
      {
        name: 'La Capte',
        pricePerNight: '90-180 €',
        occupancy: 65,
        description:
          "Village balnéaire le long de la route du sel, plages familiales et campings. Très accessible, idéal pour les familles avec enfants. Saisonnalité marquée juin-septembre. T2 à partir de 280 000 €.",
        roiBrut: '5,5 à 6,5 %',
      },
      {
        name: 'Centre médiéval / Vieille ville',
        pricePerNight: '70-130 €',
        occupancy: 55,
        description:
          "Cœur historique perché avec ruelles pavées, parc Saint-Bernard et collégiale Saint-Paul. Clientèle culturelle et arrière-saison (septembre-octobre, mai-juin). Excellent rapport occupation/prix pour un T1-T2 hors juillet-août. T2 à partir de 220 000 €.",
        roiBrut: '6 à 7 %',
      },
      {
        name: 'Port d\'Hyères',
        pricePerNight: '85-160 €',
        occupancy: 62,
        description:
          "Quartier du port commercial et de plaisance, proche des commerces, restaurants et plage. Animation toute l'année, salons nautiques au printemps et à l'automne (Tour Voile, salon du nautisme). Compromis intéressant entre balnéaire et urbain.",
        roiBrut: '5,5 à 6,5 %',
      },
      {
        name: 'L\'Almanarre',
        pricePerNight: '90-170 €',
        occupancy: 60,
        description:
          "Spot de kitesurf et planche à voile de niveau mondial, vaste plage face aux salins. Clientèle sportive internationale (Allemands, Suisses, Britanniques) sur des séjours d'une semaine. Saisonnalité étendue grâce aux conditions de vent (mars à novembre).",
        roiBrut: '5,5 à 6 %',
      },
      {
        name: 'Costebelle',
        pricePerNight: '110-220 €',
        occupancy: 58,
        description:
          "Quartier résidentiel chic sur les hauteurs, vue mer panoramique sur Giens et les Îles d'Or. Villas avec piscine prisées des familles aisées et des séjours longs (10-15 nuits). Moins concurrentiel que Giens, ticket d'entrée plus accessible (T3 dès 380 000 €).",
        roiBrut: '4,5 à 5,5 %',
      },
    ],
    regulation:
      "Hyères est classée **zone tendue** depuis le décret n°2023-822 du 25 août 2023, ce qui déclenche la taxe sur les logements vacants, l'encadrement des loyers longue durée et la possibilité pour la mairie d'imposer le changement d'usage en LCD. Tout loueur doit déclarer son meublé en mairie et obtenir un **numéro d'enregistrement** à faire figurer sur chaque annonce.\n\n**Résidence principale.** La location en meublé de tourisme reste plafonnée à **120 nuitées par an** au niveau national. Au-delà, le bien bascule en résidence secondaire au sens de l'administration et doit respecter les obligations associées.\n\n**Loi Le Meur 2024 et calendrier 2026.** L'enregistrement national sur téléservice unique est obligatoire avant le **20 mai 2026**, sous peine de désactivation automatique des annonces par Booking et Airbnb. Le DPE classe E minimum est obligatoire (classe D à partir de 2034), et l'abattement micro-BIC passe à 30 % pour les meublés non classés (50 % pour les classés tourisme). Amendes : **10 000 €** pour défaut d'enregistrement, **20 000 €** pour fausse déclaration ou numéro falsifié.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** Hyères applique le tarif intercommunal de la Métropole Toulon-Provence-Méditerranée : de 0,65 € à 3,80 € par nuit et par personne selon le classement, collectée automatiquement par Airbnb.",
    concreteExample: {
      bienType: 'T2',
      surface: 40,
      pricePerNight: 110,
      neighborhood: 'La Capte',
      revenuBrut: 18700,
      commissionRate: 0.20,
      menageCount: 65,
      menageUnitCost: 70,
    },
    extraFaq: [
      {
        q: 'Vaut-il mieux louer à Giens, à La Capte ou en centre médiéval ?',
        a: "Cela dépend de votre profil de propriétaire et de votre horizon de revenu. Giens offre les meilleurs tarifs estivaux (120-280 €/nuit pour une villa) mais avec un ticket d'entrée élevé (>650 000 €) et une saisonnalité marquée. La Capte est le meilleur compromis ticket/rendement (T2 à 280 000 €, occupation 65 %, ROI 5,5-6,5 %). Le centre médiéval est plus accessible (T2 dès 220 000 €) et lisse la saisonnalité grâce au tourisme culturel d'arrière-saison — idéal pour un premier investissement LCD à Hyères.",
      },
      {
        q: 'Comment optimiser un Airbnb pendant la saison estivale à Hyères ?',
        a: "Trois leviers à activer dès mars-avril pour la saison à venir : (1) ouvrir le calendrier 12 mois à l'avance sur Airbnb + Booking + Abritel pour capter les réservations précoces des familles allemandes et suisses ; (2) appliquer un minimum 5-7 nuits en juillet-août pour limiter le turnover et maximiser le tarif nuitée ; (3) augmenter les tarifs +15 % deux semaines avant l'ouverture si le calendrier se remplit vite (signal de tension du marché). Une conciergerie locale comme Bonni, ILIOS ou YourHostHelper applique ces réflexes automatiquement.",
      },
      {
        q: 'Hyères est-elle vraiment intéressante hors saison balnéaire ?',
        a: "Oui, mais sur 3 niches précises : (1) le kitesurf à l'Almanarre qui amène une clientèle internationale de mars à novembre (Allemands, Suisses, Britanniques) sur des séjours d'une semaine ; (2) les salons nautiques au printemps et automne (Tour Voile, salon du nautisme) ; (3) le tourisme culturel vers le centre médiéval, le parc Saint-Bernard et les départs vers Porquerolles (très fréquentés en septembre-octobre par une clientèle senior). Sur un bien centre médiéval bien placé, l'occupation peut atteindre 50 % en octobre-novembre avec des tarifs autour de 70-90 €/nuit.",
      },
    ],
    updatedAt: '2026-05-15',
  },
];

export function getCityBySlug(slug: string): City | undefined {
  return cities.find((c) => c.slug === slug);
}

export function getAllCitySlugs(): string[] {
  return cities.map((c) => c.slug);
}

export function getCitiesByRegion(regionSlug: string): City[] {
  return cities.filter((c) => c.regionSlug === regionSlug);
}

export function getRegionBySlug(slug: string): Region | undefined {
  return regions.find((r) => r.slug === slug);
}
