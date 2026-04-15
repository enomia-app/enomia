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
      "Bordeaux fait partie des villes en zone tendue, ce qui déclenche plusieurs obligations. Depuis 2018, toute location meublée touristique doit être déclarée à la mairie, qui attribue un numéro à 13 chiffres obligatoire sur l'annonce Airbnb (amende jusqu'à 10 000 € en cas d'absence). La résidence principale est limitée à 120 nuitées par an — au-delà, le bien bascule en résidence secondaire avec un régime différent. Pour une résidence secondaire dédiée à la location courte durée, un changement d'usage à la mairie est obligatoire, avec compensation (convertir un bureau en logement ailleurs) de plus en plus difficile à obtenir depuis la loi Le Meur de 2024. Bordeaux applique aussi une taxe de séjour de 0,65 € à 5 € par nuit et par voyageur adulte selon le classement du bien, collectée automatiquement par Airbnb.",
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
      "Lyon est l'une des villes françaises avec la réglementation la plus stricte sur la location courte durée. Enregistrement en mairie obligatoire depuis 2019 avec numéro à 13 chiffres affiché sur l'annonce Airbnb. Limite de 120 nuitées par an pour les résidences principales, contrôlée activement par la mairie (courriers d'avertissement en cas de dépassement). Depuis 2024, le changement d'usage pour les résidences secondaires exige une compensation dans le centre (1er, 2e, 3e, 6e, 7e arrondissements) : il faut convertir une surface équivalente de bureau en logement dans le même arrondissement, ou verser une compensation financière. Cette règle rend quasi impossible l'achat d'un bien dédié à la LCD dans l'hypercentre pour un nouvel investisseur. La taxe de séjour lyonnaise va de 0,85 € à 5 € par nuit et par adulte.",
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
      "Nice applique une réglementation parmi les plus strictes de la Côte d'Azur. Enregistrement mairie obligatoire avec numéro sur l'annonce. Limite 120 nuitées pour les résidences principales, renforcée par des contrôles réguliers. Depuis 2024, le changement d'usage pour les résidences secondaires est soumis à compensation obligatoire dans les quartiers centraux, ce qui a fait chuter le nombre de nouveaux meublés touristiques. La taxe de séjour varie de 1 € à 5 € par nuit et par voyageur adulte selon le classement, collectée automatiquement par Airbnb.",
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
      "Marseille a mis en place l'enregistrement obligatoire pour les meublés touristiques en 2023 avec le numéro à 13 chiffres. La limite 120 nuitées pour résidence principale s'applique. La ville n'a pas encore instauré de compensation obligatoire pour le changement d'usage (contrairement à Paris, Lyon, Nice), ce qui laisse plus de liberté aux investisseurs. Attention : certaines copropriétés du centre-ville ont voté l'interdiction de la location courte durée dans leur règlement — toujours vérifier avant d'acheter. Taxe de séjour de 0,50 € à 3 € par nuit.",
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
      "Toulouse a mis en place l'enregistrement en mairie depuis 2020 avec numéro obligatoire sur l'annonce. La limite 120 nuitées résidence principale s'applique normalement. Pas de compensation obligatoire pour le changement d'usage en résidence secondaire, ce qui rend la ville beaucoup plus accessible aux investisseurs LCD que Paris, Lyon ou Nice. La taxe de séjour varie de 0,60 € à 3 € par nuit, collectée par Airbnb.",
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
        url: 'https://laconciergeriedesrosiers.fr/',
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
      "Strasbourg a mis en place l'enregistrement obligatoire pour les meublés touristiques avec numéro à 13 chiffres affiché sur l'annonce Airbnb. La limite 120 nuitées par an pour les résidences principales s'applique strictement. Depuis 2023, la ville demande une autorisation de changement d'usage pour les résidences secondaires dédiées à la location courte durée dans les quartiers centraux, sans compensation obligatoire à date mais des restrictions sont à l'étude. La taxe de séjour va de 0,75 € à 5 € par nuit et par voyageur adulte, collectée automatiquement par Airbnb. Attention : certaines copropriétés anciennes du centre historique ont inscrit l'interdiction de la location courte durée dans leur règlement — à vérifier avant achat.",
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
      "Lille a mis en place l'enregistrement obligatoire pour les meublés touristiques avec numéro à 13 chiffres affiché sur l'annonce Airbnb, amende jusqu'à 10 000 € en cas d'absence. La limite 120 nuitées par an pour les résidences principales s'applique. À ce jour Lille n'impose pas de compensation obligatoire pour le changement d'usage en résidence secondaire (contrairement à Paris, Lyon, Nice), ce qui laisse plus de marge aux investisseurs. La taxe de séjour varie de 0,60 € à 3 € par nuit, collectée automatiquement par Airbnb. Certaines copropriétés du Vieux-Lille ont voté l'interdiction de la LCD — toujours vérifier avant d'acheter.",
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
    regulation: "Depuis le 1er janvier 2025, Paris applique une limite de 90 nuitées par an (contre 120 auparavant) pour la location de votre résidence principale en meublé touristique. Chaque propriété doit être enregistrée auprès de la mairie de Paris, qui délivre un numéro d'enregistrement à 13 chiffres obligatoirement affiché sur toute annonce en ligne. À partir du 20 mai 2026, un nouveau système national d'enregistrement remplacera les dispositifs locaux.\n\nPour louer une résidence secondaire en meublé touristique à Paris, vous devez obtenir une autorisation de changement d'usage auprès de la mairie. Dans les arrondissements centraux (1er au 11e), cette autorisation est soumise à une obligation de compensation : vous devez convertir une surface commerciale équivalente en logement résidentiel, via l'achat de « titres de commercialité » dont le coût oscille entre 300 et 500 €/m².\n\nLes sanctions en 2026 sont dissuasives : 10 000 € d'amende pour défaut d'enregistrement, 50 000 € pour location d'une résidence secondaire sans autorisation de changement d'usage, et 10 000 € pour dépassement du seuil de 90 nuitées. Paris déploie des agents de contrôle et utilise des outils de détection automatique pour croiser les annonces en ligne avec les déclarations en mairie.",
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
    regulation: "Au Cap d'Agde, toute location meublée touristique doit être déclarée en mairie via le formulaire CERFA n°14004*04, qui attribue un numéro d'enregistrement obligatoire sur toutes les annonces en ligne (amende de 450 € en cas de manquement). Le Cap d'Agde n'est pas encore soumis au système de quotas avec compensation applicable dans certaines villes (Paris, Lyon, Sète), mais une demande de changement d'usage peut être requise pour les résidences secondaires.\n\nDepuis la loi du 19 novembre 2024, tous les meublés de tourisme devront être enregistrés sur un téléservice national d'ici le 20 mai 2026 (amende de 10 000 € pour défaut d'enregistrement, 20 000 € pour fausse déclaration). Les communes peuvent désormais limiter à 90 jours par an la durée de location des résidences principales.\n\nAgde applique la taxe de séjour au régime proportionnel : pour les meublés non classés, 5 % du coût net de la nuitée par personne, plafonné à 4,60 €, majoré de 10 % de taxe additionnelle départementale (Hérault) et 34 % de taxe additionnelle régionale.",
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
      "Les Sables-d'Olonne est l'une des communes françaises les plus strictes en matière de location courte durée. 8e ville de France pour la proportion de résidences secondaires (jusqu'à 70 % dans certains quartiers), la municipalité a mis en place un dispositif pionnier.\n\n**Quota et enregistrement.** Un plafond de 2 500 enregistrements saisonniers a été instauré sur l'agglomération. Tout meublé de tourisme doit obtenir un numéro d'enregistrement (article L.324-2-1 du Code du Tourisme), obligatoire sur toutes les annonces, sous peine d'une amende civile pouvant atteindre 5 000 €. La résidence principale est limitée à 120 nuits/an ; au-delà, une autorisation de changement d'usage est obligatoire.\n\n**Compensation financière.** Depuis 2022, la ville offre une prime de 5 000 à 10 000 € (sur 3 ans) aux propriétaires qui convertissent un meublé saisonnier en location à l'année. Coût pour la commune : 450 000 €/an, compensé par ~2 M€ de taxe de séjour collectée. Résultat : 450 logements convertis en 3 ans. Le dispositif a été renouvelé pour 3 ans en 2025.\n\n**DPE et loi Le Meur.** Depuis le 21 novembre 2024, tout nouveau meublé touristique soumis à changement d'usage doit présenter un DPE classé entre A et E (A-D à partir de 2034). Le maire peut à tout moment demander le DPE au propriétaire, sous peine de 5 000 € d'amende.\n\n**Taxe de séjour.** Taxe intercommunale du 1er janvier au 31 décembre. Meublé non classé : jusqu'à 4,40 €/nuit/personne. Meublé classé : à partir de 0,80 €. Les plateformes (Airbnb, Booking) collectent automatiquement. En 2022, Airbnb seul a reversé 440 000 € à la commune, devançant Arcachon, Deauville et Saint-Tropez.",
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
