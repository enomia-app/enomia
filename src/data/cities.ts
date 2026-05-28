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
  { slug: 'centre-val-de-loire', displayName: 'Centre-Val de Loire', description: 'Tours, Amboise, Chinon et la Vallée de la Loire (UNESCO) : châteaux royaux, vins de Loire et 1h05 de TGV depuis Paris. Un marché LCD porté par 5 millions de visiteurs annuels sur les châteaux.' },
  { slug: 'bourgogne-franche-comte', displayName: 'Bourgogne-Franche-Comté', description: 'Dijon, Beaune et la Côte d\'Or — Climats de Bourgogne classés UNESCO et Cité Internationale de la Gastronomie. Un marché LCD porté par l\'œnotourisme et la gastronomie, à 1h35 de TGV depuis Paris.' },
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
        rating: 4.9,
        reviews: 36,
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
        rating: 4.3,
        reviews: 54,
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
        rating: 0,
        reviews: 0,
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
        rating: 4.8,
        reviews: 51,
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
        rating: 4.6,
        reviews: 47,
        biensGeres: 90,
        specialty: "Service à l'ancienne, relationnel fort",
        description:
          "Petite structure (3 personnes), Mary Poppins compense sa taille par une relation directe avec chaque propriétaire. Commission 20-22 % selon le type de bien, ménage refacturé voyageur. Points forts : réactivité (délai de réponse moyen < 15 min), connaissance intime du centre historique, réseau d'artisans locaux. Point faible : capacité limitée, liste d'attente fréquente.",
      },
      {
        name: 'Conciergerie Sejourneur Bordeaux',
        url: 'https://www.sejourneur.com/',
        commission: 'sur devis',
        menage: 'variable',
        rating: 4.8,
        reviews: 264,
        biensGeres: 250,
        specialty: 'Couverture Côte Atlantique',
        description:
          "Conciergerie basée dans le centre de Bordeaux (Rue Lafaurie de Monbadon) avec une couverture large sur la côte atlantique : Bordeaux, Bassin d'Arcachon, Cap-Ferret, Pays Basque, La Rochelle et Les Sables d'Olonne. Services complets de gestion locative saisonnière, home staging et accompagnement à la transaction immobilière. Positionnement axé sur l'immersion locale des voyageurs. Commission communiquée sur devis.",
      },
      {
        name: 'Conciergerie Easylodge Bordeaux',
        url: 'https://easylodge.fr/',
        commission: '18 %',
        menage: 'refacturé voyageur',
        rating: 5.0,
        reviews: 19,
        biensGeres: 0,
        specialty: 'Commission basse, sans engagement',
        description:
          "Conciergerie locale du centre de Bordeaux (Rue Sainte-Catherine), positionnée sur une commission basse à 18 % par réservation, sans engagement (frais de démarrage de 150 € TTC). Service clé en main : mise en ligne de l'annonce, check-in/check-out par boîtier à clés, ménage et linge, welcome kits, communication voyageurs et tableau de bord de suivi. Ménage refacturé au voyageur.",
      },
      {
        name: 'Il Était Une Nuit',
        url: 'https://www.il-etait-une-nuit.fr/',
        commission: 'sur devis',
        menage: 'variable',
        rating: 3.9,
        reviews: 35,
        biensGeres: 0,
        specialty: 'Tout-en-un haut de gamme',
        description:
          "Conciergerie tout-en-un basée à Bègles (agglomération bordelaise), couvrant Bègles, Villenave-d'Ornon, Mérignac, Pessac et Bordeaux. Gestion de A à Z : réservations, accueil voyageurs, linge de qualité hôtelière, service client 24/7, et rénovation complète d'appartements avec aménagement haut de gamme. Positionnement sur-mesure. Commission communiquée sur devis.",
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
    updatedAt: '2026-05-27',
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
        name: "Conciergerie Tête d'Or",
        url: 'https://conciergerietetedor.fr/',
        commission: '23 %',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 56,
        biensGeres: 0,
        specialty: 'Méthodologie hôtelière',
        description:
          "Conciergerie indépendante basée Lyon 6 (Rue Vauban), avec une approche inspirée de l'hôtellerie : standards de qualité, accueil, propreté homogènes sur tous les biens. Commission 23 % stable, frais de ménage refacturés au voyageur. Zone d'intervention : Lyon, Villeurbanne, Écully, Caluire, Tassin, Champagne-au-Mont-d'Or, et également Saint-Étienne + Paris. Bon choix pour un propriétaire qui cherche une approche structurée avec un vrai ancrage local.",
      },
      {
        name: 'Lulu Conciergerie',
        url: 'https://www.luluconciergerie.com/',
        commission: 'sur devis',
        menage: 'variable',
        rating: 4.8,
        reviews: 53,
        biensGeres: 0,
        specialty: 'Disponibilité 24/7 & gestion premium',
        description:
          "Conciergerie locale basée Lyon 6 (Rue Duquesne). Disponibilité annoncée 24h/24, 7j/7. Services complets : création annonce, photos pro, ménage avant/pendant/après séjour, revenue management, support voyageurs. Zone d'intervention : Lyon, Villeurbanne, Beaujolais. Commission non publiée — à demander en direct (07 83 74 78 20).",
      },
      {
        name: 'Welkeys Lyon',
        url: 'https://www.welkeys.com/conciergerie-airbnb/lyon',
        commission: '20-22 %',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 180,
        specialty: 'Technologie & reporting',
        description:
          "Welkeys est un acteur national présent dans plusieurs grandes villes françaises. Stack technologique moderne : channel manager propriétaire, serrures connectées, dashboard temps réel. Commission 20-22 %. Adapté aux propriétaires qui veulent du process industriel — lisez les avis négatifs Trustpilot pour anticiper.",
      },
      {
        name: 'GuestReady Lyon',
        url: 'https://www.guestready.com/airbnb-management/lyon/',
        commission: '25 %',
        menage: 'inclus dans commission',
        rating: 4.6,
        reviews: 359,
        biensGeres: 200,
        specialty: 'Réseau international',
        description:
          "GuestReady gère plus de 2 000 biens à travers l'Europe. Commission élevée (25 %) justifiée par une offre très complète : photos pro, pricing dynamique, conciergerie 24/7 multilingue, gestion des litiges. Le ménage est inclus dans la commission — attention à la rentabilité sur les séjours courts. Adapté aux propriétaires expatriés qui veulent zéro gestion.",
      },
      {
        name: 'Hostnfly Lyon',
        url: 'https://hostnfly.com/conciergerie-airbnb/lyon',
        commission: '25 %',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 220,
        specialty: '#1 France en volume',
        description:
          "Commission spécifique Lyon : 25 % TTC (vs 20 % dans d'autres villes). Process industriels mais efficaces, délai de réponse voyageurs < 10 min en moyenne. Excellent pour un propriétaire qui veut de la prévisibilité et peu d'interactions.",
      },
      {
        name: 'Conciergerie Shaouch Lyonnais',
        url: 'https://conciergerie-shaouch-lyonnais.webflow.io/',
        commission: '15 %',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 0,
        specialty: 'Commission la plus basse',
        description:
          "Structure indépendante qui casse les prix à 15 % de commission — la plus basse du marché lyonnais. Entreprise immatriculée à Lyon (Sirene). Le modèle tient par l'automatisation (messagerie semi-auto, planning ménage algorithmique) et une équipe réduite. Parfait pour un propriétaire sensible au prix. Limite : capacité d'absorption réduite, peu adapté aux biens atypiques. À contacter directement pour avoir références clients avant signature.",
      },
      {
        name: 'All in Lyon',
        url: 'https://www.allinlyon.com/',
        commission: '20 % (avec ménage refacturé) / 25 % (complet)',
        menage: 'variable',
        rating: 4.4,
        reviews: 103,
        biensGeres: 120,
        specialty: 'Formules à la carte',
        description:
          "Un des plus anciens acteurs lyonnais (depuis 2016). Deux formules : 20 % avec ménage refacturé voyageur, ou 25 % tout inclus (photos, ménage, linge). L'entreprise propose aussi une offre à la carte pour les propriétaires qui veulent garder la main sur certains aspects.",
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
      {
        q: "Comment vérifier les avis Google d'une conciergerie à Lyon ?",
        a: "Tapez le nom exact de la conciergerie + 'Lyon' sur Google et regardez le panel knowledge à droite. Surprise : la plupart des acteurs nationaux (Hostnfly, GuestReady) ont en fait une fiche Google Lyon spécifique avec leurs propres avis (61 avis pour Hostnfly Lyon, 359 pour GuestReady Lyon) — distinct de la note nationale. Welkeys Lyon a aussi une fiche locale mais avec très peu d'avis (3) — peu fiable. Pour les indépendants (Conciergerie Tête d'Or, Lulu Conciergerie, All in Lyon), la fiche Google Lyon reflète directement l'activité locale.",
      },
    ],
    updatedAt: '2026-05-27',
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
        rating: 0,
        reviews: 0,
        biensGeres: 280,
        specialty: 'Leader national sur la Côte',
        description:
          "BnbLord est l'un des plus gros acteurs de la Côte d'Azur avec 280 biens gérés à Nice. Commission 22-25 % selon formule, ménage refacturé voyageur. Points forts : équipes 24/7 multilingues, gestion complète des arrivées internationales tardives, photos pro incluses.",
      },
      {
        name: 'Hostnfly Nice',
        commission: '22 %',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 240,
        specialty: 'Process industriels rodés',
        description:
          "Acteur national majeur, Hostnfly gère 240 biens à Nice. Commission 22 %. Process très industriels, délai de réponse voyageurs < 10 min. Excellent pour propriétaires expatriés.",
      },
      {
        name: 'SmartBNB',
        url: 'http://www.smartbnb.immo/',
        commission: 'sur devis',
        menage: 'variable',
        rating: 4.6,
        reviews: 249,
        biensGeres: 113,
        specialty: 'Design & agence immobilière',
        description:
          "Conciergerie doublée d'une agence immobilière, basée à Nice (Rue Defly), positionnée sur des logements au design soigné. Zone d'intervention : Nice, Villefranche-sur-Mer, Saint-Paul-de-Vence, Èze, Mandelieu-la-Napoule et autres communes de la Côte d'Azur. Réservation directe en ligne possible. Commission communiquée sur devis.",
      },
      {
        name: 'Manasteos',
        url: 'https://manasteos.com/',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 5.0,
        reviews: 58,
        biensGeres: 0,
        specialty: 'Multi-plateforme & loyer garanti',
        description:
          "Conciergerie Airbnb couvrant la Côte d'Azur (Nice, Cannes, Antibes et environs) ainsi que Carcassonne. Distribution multi-plateformes (Airbnb, Abritel, Booking, Expedia), réponse voyageurs annoncée sous 10 minutes, ménage professionnel et support 24/7. Deux formules au choix : loyer garanti ou conciergerie classique. Ménage refacturé au voyageur.",
      },
      {
        name: 'Bnb Groom Services',
        url: 'http://bnbgroomservices.com/',
        commission: 'sur devis',
        menage: 'variable',
        rating: 4.4,
        reviews: 82,
        biensGeres: 0,
        specialty: 'Expertise immobilière depuis 2014',
        description:
          "Conciergerie spécialiste de la location Airbnb doublée d'une expertise d'agence immobilière, active depuis 2014 sur Nice, Cannes et Villefranche-sur-Mer. Gestion complète : check-in/check-out, ménage et linge, gestion des clés, optimisation des réservations et conseil en investissement locatif.",
      },
      {
        name: 'My Guest Relation',
        url: 'http://www.myguestrelation.com/',
        commission: 'sur devis',
        menage: 'variable',
        rating: 4.9,
        reviews: 50,
        biensGeres: 0,
        specialty: 'Expertise hôtelière, Superhost',
        description:
          "Conciergerie appliquant une expertise hôtelière à la location saisonnière, partenaire Airbnb Superhost. Zone : Nice, Cannes, Mougins, Antibes, Villefranche-sur-Mer, Saint-Jean-Cap-Ferrat, Beausoleil, Cap-d'Ail. Ménage qualité hôtelière, linge professionnel, pricing dynamique et assistance voyageurs 24/7.",
      },
      {
        name: 'Ze Perfect Place',
        url: 'http://www.zeperfectplace.com/',
        commission: 'sur devis',
        menage: 'variable',
        rating: 5.0,
        reviews: 35,
        biensGeres: 0,
        specialty: 'Réservation directe',
        description:
          "Conciergerie de Nice et de la Côte d'Azur au modèle particulier : réservation directe entre voyageurs et propriétaires présélectionnés, avec paiement sécurisé. Suivi qualité, maintenance des logements et assistance sur place. Commission communiquée sur devis.",
      },
      {
        name: 'AirB&M Conciergerie',
        url: 'https://www.airbmconciergerie.com/',
        commission: 'sur devis',
        menage: 'variable',
        rating: 5.0,
        reviews: 34,
        biensGeres: 0,
        specialty: 'Littoral Menton–Saint-Tropez',
        description:
          "Conciergerie de location courte durée créée en 2023, couvrant le littoral de Menton à Cannes jusqu'à Saint-Tropez. Création d'annonces avec photos professionnelles, ménage et maintenance, communication voyageurs, gestion partielle ou complète, et option de sous-location.",
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
    updatedAt: '2026-05-27',
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
        rating: 4.3,
        reviews: 2159,
        biensGeres: 140,
        specialty: 'Plateforme nationale',
        description:
          "Welkeys gère 140 biens à Marseille avec leur stack technologique habituelle. Commission 20 %. Bon compromis couverture/prix pour les propriétaires qui veulent un service standardisé.",
      },
      {
        name: 'Marseille Conciergerie',
        commission: '18-22 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 44,
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
        reviews: 11,
        biensGeres: 110,
        specialty: 'Couverture multi-quartiers',
        description:
          "BnbLord couvre l'ensemble des arrondissements marseillais avec 110 biens. Commission 22 % tout inclus. Bon pour propriétaires qui veulent un seul interlocuteur.",
      },
      {
        name: 'YourHostHelper Marseille',
        url: 'https://yourhosthelper.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 5.0,
        reviews: 24,
        biensGeres: 0,
        specialty: 'Franchise nationale, outils tech',
        description:
          "Antenne marseillaise de la franchise nationale YourHostHelper (lancée à Cannes en 2017, présente dans plusieurs dizaines de villes). Commission unique de 20 %, frais de ménage et de linge refacturés au voyageur. Service complet : création d'annonce, photos pro, optimisation tarifaire, check-in/check-out 24/7, conciergerie, maintenance et suivi du bien.",
      },
      {
        name: "Les Frères de la Loc'",
        url: 'https://conciergerie-marseille.fr/',
        commission: 'sur devis',
        menage: 'variable',
        rating: 4.9,
        reviews: 123,
        biensGeres: 0,
        specialty: 'Conciergerie à taille humaine',
        description:
          "Conciergerie à taille humaine fondée en 2022 par les frères Joseph et Louis Posch, qui gèrent les biens comme les leurs. Basée à Marseille, également présente à Paris et en Corse. Trois formules (Premium, Standard, En ligne), gestion locative longue durée, transaction immobilière et aménagement intérieur. Accent sur la réactivité et la transparence.",
      },
      {
        name: 'Croceo Immobilier',
        url: 'http://www.croceo.fr/',
        commission: 'sur devis',
        menage: 'variable',
        rating: 4.7,
        reviews: 130,
        biensGeres: 130,
        specialty: "Réseau Provence–Côte d'Azur",
        description:
          "Acteur structuré (plus de 35 collaborateurs) avec des bureaux à Marseille, Antibes, Cannes, Nice, Eygalières et Saint-Rémy-de-Provence, couvrant Provence, Côte d'Azur, Alpilles, Luberon, Corse et Maroc. Conciergerie Airbnb clé en main (accueil, ménage, photos pro, diffusion sur 10+ plateformes, pricing dynamique) et gestion locative longue durée.",
      },
      {
        name: 'Boostaroom',
        url: 'https://www.boostaroom.com/',
        commission: 'sur devis',
        menage: 'variable',
        rating: 4.7,
        reviews: 86,
        biensGeres: 0,
        specialty: 'Couverture Marseille–Toulon',
        description:
          "Conciergerie tout inclus couvrant Marseille, Toulon, La Ciotat, Aix-en-Provence, Vitrolles, Martigues et Marignane. Services : photos pro et création d'annonce, gestion du calendrier et sélection des voyageurs 24/7, communication et gestion des avis, ménage de qualité hôtelière, accueil/départ, linge et maintenance.",
      },
      {
        name: 'La Conciergerie du Soleil',
        url: 'https://laconciergeriedusoleil.fr/',
        commission: 'sur devis',
        menage: 'variable',
        rating: 4.8,
        reviews: 44,
        biensGeres: 0,
        specialty: 'Biens de standing & urbains',
        description:
          "Équipe locale habituée à gérer aussi bien des biens de standing que des appartements urbains. Zone : Marseille et Côte Bleue (Corniche, Roucas, Cassis, La Ciotat), Aix-en-Provence et Côte Varoise (Rayol-Canadel, Ramatuelle, Saint-Tropez, Le Lavandou). Trois types de location : courte durée urbaine, villas saisonnières et bail mobilité.",
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
    updatedAt: '2026-05-27',
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
        rating: 0,
        reviews: 0,
        biensGeres: 180,
        specialty: 'Leader local',
        description:
          "Hostnfly est le plus gros acteur national présent à Toulouse avec 180 biens. Commission 20 %, process industriels, reporting régulier. Bon choix pour propriétaires multi-biens ou expatriés.",
      },
      {
        name: 'Welkeys Toulouse',
        commission: '20-22 %',
        menage: 'refacturé voyageur',
        rating: 4.3,
        reviews: 2159,
        biensGeres: 120,
        specialty: 'Technologie & reporting',
        description:
          "Welkeys couvre Toulouse avec 120 biens gérés. Commission 20-22 %. Points forts : channel manager propriétaire, photos pro, reporting clair.",
      },
      {
        name: 'Toulouse Conciergerie',
        commission: '18 %',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 41,
        biensGeres: 75,
        specialty: 'Meilleur prix local',
        description:
          "Structure indépendante toulousaine, commission 18 %. Bon rapport qualité/prix pour les propriétaires sensibles au tarif. Ancrage local fort sur Capitole, Carmes, Saint-Étienne.",
      },
      {
        name: 'Cocoonr Toulouse',
        url: 'https://cocoonr.fr/location-court-sejour/toulouse-31/',
        commission: '20 %',
        menage: 'inclus dans commission',
        rating: 4.1,
        reviews: 132,
        biensGeres: 0,
        specialty: 'Réseau national',
        description:
          "Antenne toulousaine de Cocoonr, réseau national présent dans une quinzaine de villes. Commission de 20 %, ménage inclus dans la commission. Gestion complète : création d'annonce, photos, communication voyageurs, ménage, maintenance et reporting. Couverture large sur Toulouse et sa métropole.",
      },
      {
        name: 'Yumē Conciergerie',
        url: 'https://yume-conciergerie.com/',
        commission: 'sur devis',
        menage: 'variable',
        rating: 4.9,
        reviews: 53,
        biensGeres: 0,
        specialty: 'Appartements meublés premium',
        description:
          "Conciergerie toulousaine positionnée sur des appartements meublés premium avec un service de qualité hôtelière. Gestion locative courte durée (Airbnb, Booking), préparation et entretien des logements, communication voyageurs, assistance locale 24/7. Conseil en location longue durée pour les professionnels. Zone : Toulouse et sa métropole.",
      },
      {
        name: 'Malodge Conciergerie',
        url: 'https://malodgeconciergerie.fr/',
        commission: 'sur devis',
        menage: 'variable',
        rating: 4.9,
        reviews: 34,
        biensGeres: 0,
        specialty: 'Gestion clé en main multi-villes',
        description:
          "Conciergerie clé en main couvrant Toulouse, Bordeaux, Albi, Cap d'Agde, Béziers et le Maroc (Marrakech, Essaouira, Tanger). Gestion locative complète (annonces, pricing dynamique, check-in 24/7, ménage professionnel, maintenance), sous-location avec loyer fixe garanti, et services de rénovation/ameublement pour optimiser l'investissement. Reporting mensuel.",
      },
      {
        name: 'uneeka',
        url: 'https://www.uneeka.fr/',
        commission: '17-19 %',
        menage: 'variable',
        rating: 4.9,
        reviews: 32,
        biensGeres: 0,
        specialty: 'Expérience voyageur locale',
        description:
          "Conciergerie toulousaine spécialisée en location courte durée, avec une commission de 17 % (offre de lancement) à 19 % en standard. Sécurisation renforcée des logements, expérience voyageur personnalisée avec attentions locales, optimisation premium des annonces (photos, diffusion multi-plateformes), guide d'accueil digital et pricing dynamique. Zone : Toulouse et environs.",
      },
      {
        name: 'MyHote Conciergerie',
        url: 'https://www.myhote.fr/',
        commission: 'sur devis',
        menage: 'variable',
        rating: 4.9,
        reviews: 15,
        biensGeres: 0,
        specialty: 'Serrures numériques & ouverture à distance',
        description:
          "Conciergerie toulousaine misant sur la technologie : serrures numériques, ouverture à distance, location de linge et réseau de prestataires de ménage. Accompagnement à l'investissement locatif et automatisation de la gestion de colocation. Zone : Toulouse.",
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
    updatedAt: '2026-05-27',
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
        rating: 4.5,
        reviews: 46,
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
        rating: 0,
        reviews: 0,
        biensGeres: 140,
        specialty: 'Service complet A à Z',
        description:
          "Acteur national présent à Strasbourg avec environ 140 biens gérés. Commission 22-25 % tout inclus (photos, pricing, ménage, assistance 24/7 multilingue). Adapté aux propriétaires expatriés ou voulant zéro gestion. Stack technologique mature : channel manager, dashboard propriétaire.",
      },
      {
        name: 'Cocoonr Strasbourg',
        url: 'https://cocoonr.fr/location-court-sejour/agence/strasbourg/',
        commission: '20 %',
        menage: 'inclus dans commission',
        rating: 4.5,
        reviews: 23,
        biensGeres: 0,
        specialty: 'Réseau national',
        description:
          "Antenne strasbourgeoise de Cocoonr, réseau national présent dans une quinzaine de villes. Commission de 20 %, ménage inclus dans la commission. Gestion complète : création d'annonce, photos, communication voyageurs, ménage, maintenance et reporting mensuel.",
      },
      {
        name: 'Relax Conciergerie',
        url: 'https://www.relax-conciergerie.fr/',
        commission: 'dès 18 % TTC',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 27,
        biensGeres: 0,
        specialty: 'Tout-en-un, couverture Alsace',
        description:
          "Conciergerie tout-en-un (statut Superhôte Airbnb) couvrant une grande partie de l'Alsace (Strasbourg, Mulhouse, Colmar et 18 villes au total). Commission à partir de 18 % TTC hors ménage, frais de ménage selon la taille du bien refacturés au voyageur. Photos pro, pricing dynamique, sélection des voyageurs, support 24/7, diffusion multi-plateformes, assurance et gestion des cautions.",
      },
      {
        name: 'Enaïa Conciergerie',
        url: 'https://enaia.fr/',
        commission: '23 % (Sérénité) / 30 % (Détente)',
        menage: 'refacturé voyageur',
        rating: 5.0,
        reviews: 13,
        biensGeres: 0,
        specialty: 'Conciergerie boutique alsacienne',
        description:
          "Conciergerie boutique fondée en 2022 à Strasbourg, « pensée par une propriétaire, pour les propriétaires ». Deux formules : Sérénité (23 % TTC) et Détente (30 % TTC). Accueil voyageurs et remise des clés, gestion des annonces et réservations, ménage professionnel avec contrôle qualité, linge et consommables, contrats de maintenance, produits d'accueil alsaciens. Forfait ménage à la charge des voyageurs.",
      },
      {
        name: 'Welcome Brigade',
        url: 'https://www.welcomebrigade.fr/',
        commission: 'sur devis',
        menage: 'variable',
        rating: 5.0,
        reviews: 13,
        biensGeres: 0,
        specialty: 'Optimisation revenus & home staging',
        description:
          "Conciergerie locale fondée en 2023, basée à Strasbourg et couvrant Haguenau, Molsheim, Obernai et les vallées de Villé et de la Bruche. Stratégie marketing et ajustement tarifaire pour optimiser les revenus, home staging, ménage et linge aux standards hôteliers, communication voyageurs, présence locale et pricing dynamique.",
      },
      {
        name: 'La Conciergerie des Rosiers',
        commission: '22-28 %',
        menage: 'inclus dans commission',
        rating: 5,
        reviews: 7,
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
    updatedAt: '2026-05-27',
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
        rating: 4.9,
        reviews: 131,
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
        rating: 0,
        reviews: 0,
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
        rating: 4.3,
        reviews: 2159,
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
        rating: 5,
        reviews: 6,
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
        reviews: 21,
        biensGeres: 65,
        specialty: 'Service clé en main',
        description:
          "Structure lilloise avec un positionnement 'clé en main' : le propriétaire n'a strictement rien à faire. Commission 20-23 %. Gestion complète des voyageurs, maintenance, optimisation. Bon choix pour un propriétaire qui veut se décharger totalement.",
      },
      {
        name: 'Hôtes en Nord',
        url: 'https://hotesennord.com/',
        commission: 'sur devis',
        menage: 'variable',
        rating: 4.8,
        reviews: 20,
        biensGeres: 0,
        specialty: 'Gestion complète A-Z, partenaire Luckey',
        description:
          "Conciergerie locale active à Lille et dans la métropole (Marcq-en-Barœul), partenaire officiel Luckey by Airbnb depuis 2019. Gestion complète de A à Z : optimisation d'annonce, photos, communication voyageurs, accueil, ménage, linge et maintenance. Commission communiquée sur devis.",
      },
      {
        name: 'Conciergerie Lille',
        url: 'https://conciergerie-lille.com/',
        commission: '18-22 %',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 14,
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
    updatedAt: '2026-05-27',
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
        reviews: 66,
        biensGeres: 400,
        specialty: 'Excellence opérationnelle & ménage internalisé',
        description: "Guester s'est imposé comme la référence qualité de la conciergerie Airbnb à Paris en 2026. Son point fort : des équipes de ménage internalisées (pas de sous-traitance), un linge de qualité hôtelière et un outil de reporting transparent pour les propriétaires. Commission à partir de 18 % HT, ménage refacturé au voyageur. Présent dans une trentaine de villes en France, Guester combine l'échelle d'un acteur national et la qualité de service d'un indépendant.",
      },
      {
        name: 'HostnFly',
        url: 'https://hostnfly.com/',
        commission: '25 %',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 3000,
        specialty: 'Volume & automatisation à grande échelle',
        description: "HostnFly est l'un des plus gros acteurs français de la conciergerie Airbnb, avec environ 150 000 réservations gérées par an. À Paris, la commission s'élève à 25 % TTC, plus élevée qu'en province, mais le service est complet : pricing dynamique, channel manager multi-plateformes, assurance incluse. Idéal pour les propriétaires qui veulent un service 100 % délégué sans compromis.",
      },
      {
        name: 'GuestReady',
        url: 'https://www.guestready.com/',
        commission: '20 %',
        menage: 'inclus dans commission',
        rating: 4.5,
        reviews: 1517,
        biensGeres: 1200,
        specialty: 'Couverture internationale & portfolio large',
        description: "GuestReady est un acteur international présent à Paris, Londres, Dubaï et Porto, avec un portfolio de plus de 4 000 biens dans le monde. Commission de 20 %, ménage inclus dans la commission. Le modèle all-inclusive simplifie la gestion mais réduit la marge nette du propriétaire sur les séjours courts. Service fiable mais relation plus distante qu'avec les indépendants.",
      },
      {
        name: 'Welkeys',
        url: 'https://www.welkeys.com/',
        commission: '22 %',
        menage: 'refacturé voyageur',
        rating: 4.3,
        reviews: 2159,
        biensGeres: 1200,
        specialty: 'Technologie & reporting propriétaire',
        description: "Welkeys gère environ 1 200 biens en France et se distingue par sa stack technologique : channel manager propriétaire, serrures connectées, dashboard temps réel pour les propriétaires. À Paris, la commission démarre à 22 %. Le ménage est refacturé au voyageur. Bon choix pour les propriétaires data-driven qui veulent suivre leurs performances de près.",
      },
      {
        name: 'The Konciergerie',
        url: 'https://www.thekonciergerie.com/',
        commission: 'sur devis',
        menage: 'variable',
        rating: 4.7,
        reviews: 334,
        biensGeres: 0,
        specialty: 'Gestion + design & rénovation',
        description: "Conciergerie parisienne (siège dans le Marais, 3e) couvrant notamment les 4e, 6e et 11e arrondissements. Au-delà de la gestion courte et moyenne durée (préparation pro, staging, photos, diffusion multi-canal Airbnb/Booking/SeLoger, check-in, ménage, maintenance), elle propose des services de design et de rénovation. Reporting mensuel détaillé et dashboard temps réel. Transparence affichée, sans frais cachés.",
      },
      {
        name: 'ClickYourFlat',
        url: 'https://clickyourflat.com/fr/conciergerie-airbnb/paris/',
        commission: 'dès 15 % HT',
        menage: 'variable',
        rating: 4.5,
        reviews: 352,
        biensGeres: 500,
        specialty: 'Couverture Paris + petite couronne',
        description: "Conciergerie couvrant les 20 arrondissements de Paris et la petite couronne (92, 93, 94). Commission à partir de 15 % HT des revenus locatifs. Création et optimisation d'annonces multi-plateformes, photos pro, communication voyageurs 24/7, check-in/check-out, ménage aux standards hôteliers, maintenance et consommables, dashboard propriétaire et account manager dédié.",
      },
      {
        name: 'Aurora Conciergerie',
        url: 'https://www.auroraconciergerie.com/',
        commission: 'sur devis',
        menage: 'variable',
        rating: 4.6,
        reviews: 49,
        biensGeres: 0,
        specialty: 'Conciergerie Airbnb de luxe',
        description: "Conciergerie positionnée sur le segment du luxe, active à Paris (1er, autour de la rue de la Ferronnerie) et sur la Côte d'Azur (Nice). Gestion locative haut de gamme pour appartements de standing. Commission communiquée sur devis.",
      },
      {
        name: 'Made For You',
        url: 'https://madeforyouconciergerie.fr/',
        commission: '15 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 40,
        biensGeres: 0,
        specialty: 'Commission basse, bail mobilité',
        description: "Conciergerie Airbnb et bail mobilité couvrant Paris (tous arrondissements), les Hauts-de-Seine et le secteur de Disneyland Paris. Commission de 15 % (calculée après déduction des frais de plateforme et de ménage), frais de ménage à la charge des voyageurs. Photos professionnelles, communication voyageurs 24/7, création et optimisation d'annonce, ménage et maintenance.",
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
    updatedAt: '2026-05-27',
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
        name: 'Histoire de clés',
        url: 'https://histoiredecles-conciergerie.fr/',
        commission: 'sur devis',
        menage: 'variable',
        rating: 5.0,
        reviews: 16,
        biensGeres: 0,
        specialty: 'Conciergerie haut de gamme Occitanie',
        description: "Conciergerie indépendante positionnée haut de gamme, basée au Cap d'Agde et couvrant Agde, Marseillan, Vias et Béziers. Au-delà de la gestion classique (ménage entre séjours, check-in/check-out, linge, diffusion Airbnb/Booking/Abritel, gestion d'urgence 24/7), elle propose des services premium à la demande : chauffeur privé, massages à domicile, garde d'animaux, brunch livré. Commission communiquée sur devis.",
      },
      {
        name: 'POM Conciergerie',
        url: 'https://pomconciergerie.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.4,
        reviews: 19,
        biensGeres: 60,
        specialty: 'Ancrage local Rochelongue, expertise réglementaire',
        description: "Installée dans le quartier de Rochelongue au Cap d'Agde, POM Conciergerie est spécialisée dans la gestion des locations saisonnières avec optimisation calendrier et pricing. Elle publie des guides complets sur la réglementation locale et accompagne les propriétaires dans leurs démarches administratives. Bonne option pour un propriétaire qui débute.",
      },
      {
        name: 'FLT Conciergerie',
        url: 'https://www.fltconciergerie.fr/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 15,
        biensGeres: 50,
        specialty: 'Couverture littorale large (Vias, Portiragnes, Sérignan)',
        description: "Fondée par une équipe passionnée d'immobilier, FLT Conciergerie gère plus de 50 propriétés sur le littoral héraultais, du Cap d'Agde jusqu'à Sérignan. Disponible 24h/24, elle mise sur la proximité et l'excellence de service. Bonne option si votre bien est à Vias-Plage ou Portiragnes.",
      },
      {
        name: 'YourHostHelper Agde',
        url: 'https://yourhosthelper.com/conciergerie-agde/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 6,
        biensGeres: 80,
        specialty: 'Pricing dynamique, photos pro incluses, dashboard propriétaire',
        description: "Franchise nationale présente dans plus de 20 villes, YourHostHelper Agde propose une commission fixe de 20 % sans frais d'entrée ni d'engagement. Photos professionnelles gratuites au lancement, pricing dynamique quotidien et dashboard de suivi des revenus. Le modèle franchise offre des outils tech avancés.",
      },
      {
        name: "Conciergerie du Cap d'Agde (CnC Property)",
        url: 'https://www.conciergerie-capdagde.com',
        commission: '20 %',
        menage: 'variable',
        rating: 4.9,
        reviews: 201,
        biensGeres: 40,
        specialty: 'Consigne à clés 24h/24 sous vidéo-surveillance',
        description: "CnC Property se distingue par son système de consigne à clés disponible 24h/24 et 7j/7 sous vidéo-surveillance, avec deux points de retrait au Cap d'Agde. Elle propose un réseau de prestataires locaux (ménage, linge, maintenance) et un service immobilier avec visites virtuelles 360°. Bonne option pour les propriétaires non-résidents.",
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
    updatedAt: '2026-05-27',
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
        rating: 5,
        reviews: 94,
        biensGeres: 50,
        specialty: 'Ancrage local + consigne bagages',
        description:
          "Conciergerie 100 % vendéenne fondée par Soliane, La Clé Chaumoise dispose de 2 pôles aux Sables-d'Olonne pour une réactivité maximale. Ouverte 7j/7 de 9h à 17h avec astreinte en dehors, elle couvre toute l'agglomération jusqu'à Noirmoutier et La Tranche-sur-Mer. Service différenciant : consigne à bagages pour les voyageurs en attente de check-in.",
      },
      {
        name: 'Simeo Conciergerie',
        url: 'https://simeo-conciergerie.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 44,
        biensGeres: 40,
        specialty: 'Équipe locale structurée (~10 personnes)',
        description:
          "Fondée par Simon et Léo, Simeo s'est imposée en 2 ans comme la conciergerie n°1 autoproclamée des Sables. Équipe locale d'une dizaine de personnes gérant ménage, linge, intendance et suivi des logements. Plus de 40 propriétaires lui font confiance et 2 300+ voyageurs Airbnb accueillis. Revendique +30 % de revenus locatifs pour ses propriétaires.",
      },
      {
        name: 'On est là pour Toit',
        url: 'https://onestlapourtoit.fr/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 16,
        biensGeres: 35,
        specialty: 'Installé sur le Remblai, carte professionnelle G',
        description:
          "Installé physiquement le long de la Grande Plage sur le Remblai, On est là pour Toit est une SARL immatriculée CCI Vendée avec carte professionnelle G (gestion immobilière) et garantie financière de 120 000 €. Jérémy, le fondateur, est salué pour son professionnalisme et sa réactivité. Spécialisé dans la gestion multi-plateforme (Airbnb, Abritel, Booking.com) et les résidences secondaires. Le nom, facile à retenir, témoigne d'une approche relationnelle forte.",
      },
      {
        name: 'HostnFly',
        url: 'https://www.hostnfly.com/conciergerie-airbnb/les-sables-d-olonne',
        commission: 'à partir de 20 %',
        menage: 'inclus dans commission',
        rating: 0,
        reviews: 0,
        biensGeres: 100,
        specialty: 'Réseau national, diffusion 10+ plateformes',
        description:
          "Acteur national présent dans 100+ villes, HostnFly revendique plus de 100 logements gérés aux Sables-d'Olonne et environs (entre La Roche-sur-Yon et La Tranche-sur-Mer). Commission à partir de 20 %, ménage inclus dans la commission (attention : cela impacte la marge sur séjours courts). Diffusion sur 10+ plateformes, pricing dynamique, assurance casse. Idéal pour les propriétaires qui veulent un acteur solide et structuré.",
      },
      {
        name: 'Conciergerie Rose Vacances',
        url: 'https://www.rose-conciergerie.fr/',
        commission: 'sur devis',
        menage: 'variable',
        rating: 4.4,
        reviews: 162,
        biensGeres: 0,
        specialty: 'Gestion complète, agent immobilier',
        description:
          "Conciergerie active aux Sables-d'Olonne et à Angers, enregistrée comme agent immobilier (carte CPI, garantie financière 120 000 €). Gestion complète : accueil voyageurs, entretien, sécurité, assistance et suivi des séjours, ainsi qu'une sélection de locations pour les voyageurs.",
      },
      {
        name: 'Escale en Côte de Lumière',
        url: 'https://www.escale-encotedelumiere.fr/',
        commission: 'sur devis',
        menage: 'variable',
        rating: 4.9,
        reviews: 27,
        biensGeres: 0,
        specialty: 'À taille humaine',
        description:
          "Conciergerie de confiance à taille humaine aux Sables-d'Olonne et en Vendée. Gestion locative complète (de la création d'annonce à l'accueil voyageurs), ménage professionnel après chaque départ, optimisation du calendrier et des revenus, sélection des voyageurs et présence sur place réactive.",
      },
      {
        name: 'La conciergerie du centre',
        url: 'https://conciergerieducentre.wixsite.com/lcdc',
        commission: 'sur devis',
        menage: 'variable',
        rating: 4.6,
        reviews: 21,
        biensGeres: 0,
        specialty: 'Centre-ville des Sables',
        description:
          "Conciergerie Airbnb centrée sur le cœur des Sables-d'Olonne. Gestion des locations saisonnières, optimisation de l'expérience voyageur et gestion des réservations multi-plateformes. Commission communiquée sur devis.",
      },
      {
        name: 'Hôte de Gamme',
        url: 'https://hote-de-gamme.fr/conciergerie-vendee/conciergerie-les-sables-d-olonne/',
        commission: '25-30 %',
        menage: 'inclus dans commission',
        rating: 4.8,
        reviews: 148,
        biensGeres: 30,
        specialty: 'Segment premium (>120 €/nuit)',
        description:
          "Positionnée sur le segment haut de gamme, Hôte de Gamme facture 25 à 30 % mais inclut photos professionnelles, staging, pricing dynamique, accueil personnalisé et plateaux de bienvenue. City Manager dédié : Benjamin pour Les Sables. Présente aussi en Gironde. Idéale pour les villas avec piscine ou les appartements vue mer sur le Remblai. Si votre bien est un studio standard, le rapport qualité/prix ne sera pas au rendez-vous.",
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
    updatedAt: '2026-05-27',
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
        rating: 4.5,
        reviews: 203,
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
        rating: 4.4,
        reviews: 19,
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
        rating: 4.9,
        reviews: 80,
        biensGeres: 60,
        specialty: 'Note Google 5,0/5, outil propriétaire',
        description:
          "Commission 20 % HT all-inclusive, ménage refacturé au voyageur. Plébiscitée par les investisseurs cannois qui cherchent un reporting transparent et une qualité opérationnelle sans accroc.",
      },
      {
        name: 'Concierge à Votre Service',
        url: 'http://www.conciergeavotreservice.com/',
        commission: '20 % (gestion complète) / 10 % (optimisation seule)',
        menage: 'variable',
        rating: 4.8,
        reviews: 98,
        biensGeres: 0,
        specialty: 'Conciergerie de luxe Cannes',
        description:
          "Conciergerie de luxe créée en 2016 (agence physique ouverte en 2022) à Cannes. Deux niveaux : optimisation seule (10 % HT) ou gestion complète (20 % HT). Communication voyageurs multilingue, pricing dynamique, photos pro, ménage et linge, conciergerie 5 étoiles, et accès à des prestataires travaux (architecture, plomberie, électricité). Couverture : Cannes et sa région.",
      },
      {
        name: 'Azurenting',
        url: 'https://azurenting.com/',
        commission: '20 %',
        menage: 'inclus dans commission',
        rating: 4.7,
        reviews: 97,
        biensGeres: 0,
        specialty: "Gestion locative Côte d'Azur",
        description:
          "Conciergerie Airbnb de Cannes (Alpes-Maritimes). Commission de 20 % des revenus générés, ménage quotidien ou hebdomadaire inclus. Accueil et check-in, linge et welcome kit, communication voyageurs, maintenance, photos pro, optimisation tarifaire et création d'annonce. Forte d'environ sept ans d'expérience locale.",
      },
      {
        name: 'BNB Sweet Dreams',
        url: 'https://bnbsweetdreams.fr/',
        commission: 'sur devis',
        menage: 'variable',
        rating: 4.9,
        reviews: 39,
        biensGeres: 0,
        specialty: 'Gestion locative personnalisée',
        description:
          "Conciergerie Airbnb et gestion locative personnalisée basée à Cannes (Rue des Frères Pradignac), couvrant les Alpes-Maritimes et la Côte d'Azur (Cannes, Nice, Monaco, Antibes). Optimisation des revenus et des annonces, marketing et promotion, gestion des réservations, accueil des voyageurs, maintenance et nettoyage. Commission communiquée sur devis.",
      },
      {
        name: 'HostnFly Cannes',
        url: 'https://hostnfly.com/conciergerie-airbnb/cannes',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
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
        rating: 5,
        reviews: 10,
        biensGeres: 55,
        specialty: 'Conciergerie boutique Côte d\'Azur',
        description:
          "Croceo se positionne comme une conciergerie boutique sur la Côte d'Azur, avec une commission parmi les plus basses du marché cannois (18 %). Prend en charge l'ensemble des étapes : accueil, ménage, maintenance, optimisation revenus. Suivi personnalisé idéal pour un propriétaire qui veut rester très proche de la gestion de son bien.",
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
    updatedAt: '2026-05-27',
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
        rating: 3.8,
        reviews: 172,
        biensGeres: 400,
        specialty: 'Leader local, siège social à Rennes',
        description:
          "Cocoonr est la conciergerie historique rennaise, fondée localement et devenue un des plus gros acteurs français avec 2 000+ biens dans 15 villes. L'agence mère est à Rennes. Commission standard de 20 %, ménage refacturé voyageur. Large couverture géographique sur Rennes Métropole (Cesson-Sévigné, Chantepie, Pacé), équipe ménage internalisée. Le choix par défaut pour un bien standard.",
      },
      {
        name: 'Nomad Conciergerie',
        url: 'https://www.nomadconciergerie.com/',
        commission: 'sur devis',
        menage: 'variable',
        rating: 5.0,
        reviews: 48,
        biensGeres: 0,
        specialty: 'Conciergerie + accompagnement déco',
        description:
          "Conciergerie rennaise proposant la gestion locative courte durée ainsi qu'un accompagnement décoration. Gestion pour propriétaires et locataires. Zone : Rennes. Commission communiquée sur devis.",
      },
      {
        name: 'La Conciergerie de Rennes',
        url: 'http://www.conciergerie-rennes.fr/',
        commission: 'sur devis',
        menage: 'variable',
        rating: 4.8,
        reviews: 33,
        biensGeres: 0,
        specialty: 'Acteur historique (2008)',
        description:
          "Conciergerie rennaise active depuis 2008, avec un réseau s'étendant à La Baule et l'Île de Ré. Gestion du calendrier et de la tarification à la nuitée, équipe de ménage professionnelle, accueil et disponibilité pendant le séjour, fourniture du linge et surveillance du bien en l'absence du propriétaire. Séjours de 3 nuits à 3 mois, partenaire Airbnb.",
      },
      {
        name: 'La Conciergerie MM',
        url: 'https://laconciergerie-mm.com/',
        commission: '20 % TTC',
        menage: 'refacturé voyageur',
        rating: 4.5,
        reviews: 35,
        biensGeres: 0,
        specialty: 'Gestion clé en main',
        description:
          "Conciergerie rennaise proposant une gestion saisonnière clé en main (Airbnb, Booking, Abritel). Commission de 20 % TTC du total des nuitées, frais de ménage et d'entretien du linge à la charge du voyageur. Décoration et photographie, gestion des annonces et réservations, assistance voyageurs 24/7, check-in/check-out et création du livret d'accueil.",
      },
      {
        name: 'JustUnToit Rennes',
        url: 'https://www.justuntoit.fr/la-conciergerie-a-rennes/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 34,
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
        rating: 0,
        reviews: 0,
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
        rating: 0,
        reviews: 0,
        biensGeres: 40,
        specialty: 'Tech + pricing algorithmique',
        description:
          "HostnFly propose une gestion via algorithme de pricing dynamique et automatisation des réservations. Présence nationale, couverture Rennes via agents mobiles et sous-traitance ménage locale. Commission 20 %, ménage refacturé voyageur. Pertinent pour un propriétaire qui préfère un acteur technologique à un indépendant local.",
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
    updatedAt: '2026-05-27',
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
        rating: 5,
        reviews: 35,
        biensGeres: 50,
        specialty: 'Commission la plus basse de Rouen',
        description:
          "Conciergerie indépendante dirigée par Valérie et Frédéric, deux Rouennais avec une connaissance fine du marché local. Commission de 17 %, parmi les plus basses de la métropole, ménage refacturé voyageur. Assistance voyageur réelle 7j/7 24h/24. Le choix rationnel pour un propriétaire qui veut maximiser sa marge.",
      },
      {
        name: 'GMS Conciergerie',
        url: 'https://gmsconciergerie.com/rouen/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
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
        rating: 0,
        reviews: 0,
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
        rating: 4.6,
        reviews: 74,
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
        reviews: 19,
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
        rating: 4.6,
        reviews: 74,
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
        rating: 5,
        reviews: 9,
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
    updatedAt: '2026-05-27',
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
        rating: 5,
        reviews: 29,
        biensGeres: 70,
        specialty: 'Référence angevine, 900+ séjours/an',
        description:
          "Référence locale angevine pour la gestion Airbnb, 2KEYS gère plus de 900 séjours par an avec une approche sur mesure. Commission compétitive à partir de 15 %, ménage refacturé voyageur. Équipe angevine qui connaît parfaitement les spécificités du marché local (événements, quartiers étudiants, dynamique festivalière).",
      },
      {
        name: 'La Casa Immobilier',
        url: 'http://la-casa-immobilier.fr/',
        commission: 'sur devis',
        menage: 'variable',
        rating: 5.0,
        reviews: 162,
        biensGeres: 0,
        specialty: 'Agence immobilière + conciergerie',
        description:
          "Agence immobilière angevine proposant location, gestion locative et conciergerie Airbnb. Zone : Angers et communes voisines (Avrillé, Trélazé). Commission communiquée sur devis.",
      },
      {
        name: 'LOKA Conciergerie',
        url: 'https://www.loka-conciergerie.fr/',
        commission: 'sur devis',
        menage: 'variable',
        rating: 5.0,
        reviews: 22,
        biensGeres: 0,
        specialty: 'Spécialiste courte durée',
        description:
          "Conciergerie immobilière angevine spécialisée en location courte durée. Accompagnement complet des propriétaires de A à Z, sous-location, accueil voyageurs et service client. Zone : Angers (49000, 49100). Commission communiquée sur devis.",
      },
      {
        name: 'YourHostHelper Angers',
        url: 'https://yourhosthelper.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.5,
        reviews: 203,
        biensGeres: 90,
        specialty: 'Réseau national, formule clé en main',
        description:
          "Franchise nationale de conciergerie Airbnb avec une agence dédiée à Angers. Commission 20 % sans frais fixes, ménage refacturé voyageur. Inclut photos pro, optimisation tarifaire et accueil voyageurs 7j/7. Réseau de 20+ villes, bon choix pour un propriétaire qui veut la solidité d'un grand groupe avec une présence locale.",
      },
      {
        name: 'Nestify Angers',
        url: 'https://www.nestify.fr/',
        commission: '22 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 31,
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
        rating: 4.3,
        reviews: 2159,
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
    updatedAt: '2026-05-27',
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
        rating: 4.2,
        reviews: 84,
        biensGeres: 60,
        specialty: 'Conciergerie familiale Montpellier + Alpes',
        description:
          "Conciergerie familiale spécialisée dans la gestion locative courte et moyenne durée à Montpellier. Commission 20 %, ménage refacturé voyageur. Groomi se distingue par une approche humaine et un suivi personnalisé de chaque bien — idéal pour un propriétaire qui veut un vrai partenaire, pas un algorithme.",
      },
      {
        name: 'Hostnfly Montpellier',
        url: 'https://hostnfly.com/conciergerie-airbnb/montpellier',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 5.0,
        reviews: 18,
        biensGeres: 0,
        specialty: 'Réseau national, yield management',
        description:
          "Antenne montpelliéraine du leader national Hostnfly. Commission à partir de 20 %, ménage refacturé au voyageur. Tarification dynamique algorithmique, diffusion multi-plateformes, communication voyageurs rapide et process industrialisés. Adapté aux propriétaires qui veulent déléguer entièrement.",
      },
      {
        name: 'Haussmann Conciergerie',
        url: 'https://haussmannconciergerie.fr/',
        commission: 'dès 20 %',
        menage: 'inclus dans commission',
        rating: 5.0,
        reviews: 120,
        biensGeres: 0,
        specialty: 'Biens atypiques & historiques',
        description:
          "Conciergerie montpelliéraine spécialisée dans les biens atypiques (appartements historiques, villas, demeures), basée dans le quartier de l'Écusson. Commission à partir de 20 %, ménage inclus après chaque réservation. Gestion d'annonces multi-plateformes, photos pro, vérification des voyageurs, communication 24/7, linge de qualité hôtelière et inspections trimestrielles.",
      },
      {
        name: 'Conciergerie Simply Chic',
        url: 'https://conciergerie-simply-chic.fr/',
        commission: 'sur devis',
        menage: 'variable',
        rating: 5.0,
        reviews: 105,
        biensGeres: 0,
        specialty: 'Services haut de gamme',
        description:
          "Conciergerie montpelliéraine positionnée sur des services haut de gamme. Accueil voyageurs et remise des clés, entretien et maintenance du bien, ménage, stratégie de pricing dynamique, optimisation des annonces et accompagnement sur la durée. Commission communiquée sur devis.",
      },
      {
        name: 'BNB Boost',
        url: 'https://www.bnb-boost.fr/',
        commission: 'sur devis',
        menage: 'variable',
        rating: 4.3,
        reviews: 164,
        biensGeres: 0,
        specialty: 'Orientation rentabilité / cash-flow',
        description:
          "Conciergerie axée sur la rentabilité de l'investissement locatif courte durée, avec plus de huit ans d'expérience. Zone : Montpellier et son littoral (La Grande Motte, Carnon) ainsi que Nîmes. Gestion locative et services de conciergerie pour maximiser le cash-flow. Commission communiquée sur devis.",
      },
      {
        name: 'Eximia Conciergerie Premium',
        url: 'https://www.eximiaconciergerie.fr/',
        commission: 'sur devis',
        menage: 'variable',
        rating: 4.9,
        reviews: 49,
        biensGeres: 0,
        specialty: 'Gestion premium sur-mesure',
        description:
          "Conciergerie premium et sur-mesure (Partner Host Airbnb depuis 2023), couvrant Montpellier, Béziers, Palavas-les-Flots et le Pic-Saint-Loup. Gestion du bien et coordination des voyageurs, optimisation tarifaire dynamique, guides d'accueil digitaux personnalisés, inspections après séjour et recommandations locales. Commission communiquée sur devis.",
      },
      {
        name: 'CBC Home Conciergerie',
        url: 'http://www.cbchome.fr/',
        commission: 'sur devis',
        menage: 'variable',
        rating: 4.6,
        reviews: 52,
        biensGeres: 0,
        specialty: 'Conciergerie + services voyageurs',
        description:
          "Conciergerie de Montpellier et Palavas-les-Flots proposant la gestion locative courte et moyenne durée, les démarches administratives, l'entretien du logement, ainsi que des services voyageurs (chauffeur privé, livraison de repas, organisation d'activités). Commission communiquée sur devis.",
      },
      {
        name: 'YourHostHelper Montpellier',
        url: 'https://yourhosthelper.com/conciergerie-montpellier/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 5,
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
    updatedAt: '2026-05-27',
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
        rating: 4.8,
        reviews: 149,
        biensGeres: 70,
        specialty: 'Référence locale depuis 2018',
        description:
          "Conciergerie rochelaise fondée en 2018, ZeRochelle est la référence locale pour l'efficacité quotidienne et la transparence. Commission 20 %, ménage refacturé voyageur. Reconnue pour sa maîtrise des pics événementiels (Francofolies, Grand Pavois) et sa connaissance du nouveau règlement Agglo 2025.",
      },
      {
        name: 'La Conciergerie de Lucas',
        url: 'https://www.laconciergeriedelucas.fr/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
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
        rating: 4.6,
        reviews: 33,
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
        rating: 0,
        reviews: 0,
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
        rating: 0,
        reviews: 0,
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
        rating: 4.8,
        reviews: 149,
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
    updatedAt: '2026-05-27',
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
        rating: 0,
        reviews: 0,
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
        rating: 0,
        reviews: 0,
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
        rating: 0,
        reviews: 0,
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
        rating: 0,
        reviews: 0,
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
        rating: 5,
        reviews: 15,
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
        rating: 4.7,
        reviews: 59,
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
    updatedAt: '2026-05-27',
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
        rating: 0,
        reviews: 0,
        biensGeres: 100,
        specialty: 'Note Google 5/5, 4 agences sur le Bassin',
        description:
          "Commission fixe à 20 %, ménage refacturé voyageur, photos pro incluses, pricing dynamique et dashboard propriétaire en temps réel. Excellent réseau local pour gérer des biens sur tout le Bassin.",
      },
      {
        name: 'Sejourneur Arcachon',
        url: 'https://www.sejourneur.com/conciergerie-a-arcachon/',
        commission: '20-22 %',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
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
        rating: 0,
        reviews: 0,
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
        rating: 0,
        reviews: 0,
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
        rating: 0,
        reviews: 0,
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
        rating: 0,
        reviews: 0,
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
    updatedAt: '2026-05-27',
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
        rating: 0,
        reviews: 0,
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
        rating: 0,
        reviews: 0,
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
        rating: 4.4,
        reviews: 59,
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
        rating: 0,
        reviews: 0,
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
        rating: 4.4,
        reviews: 59,
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
        rating: 0,
        reviews: 0,
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
    updatedAt: '2026-05-27',
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
        rating: 4.1,
        reviews: 400,
        biensGeres: 100,
        specialty: 'Pionnier annécien depuis 2016, local d\'accueil physique',
        description:
          "Première conciergerie Airbnb d'Annecy à disposer d'un local d'accueil physique pour propriétaires et voyageurs au cœur du centre-ville depuis 2022. Couvre tout le bassin annécien avec une approche hôtellerie-réception.",
      },
      {
        name: 'Save My Bed',
        url: 'https://www.savemybed.com/',
        commission: '20-25 %',
        menage: 'refacturé voyageur',
        rating: 4.5,
        reviews: 181,
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
        rating: 0,
        reviews: 0,
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
        rating: 5,
        reviews: 106,
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
        rating: 5,
        reviews: 44,
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
        reviews: 19,
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
        rating: 4.3,
        reviews: 43,
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
    updatedAt: '2026-05-27',
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
        rating: 4.9,
        reviews: 33,
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
        rating: 5,
        reviews: 20,
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
        rating: 0,
        reviews: 0,
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
        rating: 4.6,
        reviews: 14,
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
        rating: 4.8,
        reviews: 16,
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
        rating: 4.9,
        reviews: 33,
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
        rating: 4.6,
        reviews: 21,
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
    updatedAt: '2026-05-27',
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
        rating: 4.6,
        reviews: 91,
        biensGeres: 66,
        specialty: 'Plus gros gestionnaire de Loire-Atlantique',
        description:
          "Antenne nantaise du réseau Cocoonr structuré depuis 2015, qui gère une soixantaine de biens à Nantes et Loire-Atlantique. Grille tarifaire transparente entre 15 et 20 % TTC selon le périmètre (gestion partagée à full service), photos pro et diffusion multi-plateformes.",
      },
      {
        name: 'Conciergerie Lulu',
        url: 'https://conciergerielulu.com/',
        commission: '20 %',
        menage: 'inclus dans commission',
        rating: 3.7,
        reviews: 32,
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
        rating: 0,
        reviews: 0,
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
        rating: 5,
        reviews: 10,
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
        rating: 4,
        reviews: 622,
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
        rating: 0,
        reviews: 0,
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
        rating: 0,
        reviews: 0,
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
    updatedAt: '2026-05-27',
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
        rating: 4.7,
        reviews: 51,
        biensGeres: 35,
        specialty: 'Conciergerie 100 % aixoise, note Google parfaite',
        description:
          "L'Aixcapade est une conciergerie boutique exclusivement focalisée sur Aix-en-Provence et ses environs immédiats (Le Tholonet, Meyreuil, Bouc-Bel-Air). Commission de 20 % TTC sur les revenus de réservation, ménage refacturé au voyageur. Création et optimisation de l'annonce, photos pro, pricing dynamique, accueil 7j/7. Idéale pour un propriétaire qui veut un interlocuteur unique très réactif sur un T1-T3 en centre-ville ou dans le Mazarin.",
      },
      {
        name: 'Le Mazarin Conciergerie',
        url: 'https://www.lemazarin.com/conciergerie/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
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
        rating: 4.8,
        reviews: 18,
        biensGeres: 25,
        specialty: '18 % avec engagement 1 an, optimisation des tarifs',
        description:
          "My Home Conciergerie propose une grille à deux niveaux : 18 % TTC avec engagement d'un an ou 20 % TTC sans engagement. Ménage refacturé au voyageur. Positionnement haut de gamme avec un travail fin sur l'optimisation tarifaire (yield management saisonnier et événementiel autour du Festival d'art lyrique). Bon choix pour les propriétaires qui veulent maximiser le revenu d'un bien dans le Mazarin ou autour du Cours Mirabeau.",
      },
      {
        name: 'Conciergerie Blanc',
        url: 'https://www.conciergerieblanc.fr/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 35,
        biensGeres: 40,
        specialty: 'Spécialiste ménage et linge écoresponsable',
        description:
          "Conciergerie Blanc se distingue par un positionnement écoresponsable : produits d'entretien biosourcés, linge en circuit court, fournitures d'accueil sourcées en Provence. Commission 20 % TTC, ménage refacturé. Idéal pour un bien dans l'hypercentre où les voyageurs sont exigeants sur la propreté.",
      },
      {
        name: 'NG Conciergerie Pays d\'Aix',
        url: 'https://www.ngconciergerie.fr/',
        commission: '17-22 %',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 35,
        specialty: 'Prestation à la carte, grille modulable',
        description:
          "NG Conciergerie propose une grille modulable de 17 à 22 % selon le périmètre de service choisi (formule de base sans création annonce ou formule complète avec yield). Couvre Aix intra-muros et le Pays d'Aix élargi (Venelles, Bouc-Bel-Air, Gardanne). Idéal pour un propriétaire déjà autonome sur certains aspects (création d'annonce, photos) qui veut négocier précisément le périmètre de la conciergerie.",
      },
      {
        name: 'YourHostHelper Aix-en-Provence',
        url: 'https://yourhosthelper.com/conciergerie-aix-en-provence/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 17,
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
        rating: 0,
        reviews: 0,
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
    updatedAt: '2026-05-27',
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
        rating: 0,
        reviews: 0,
        biensGeres: 35,
        specialty: 'Commission progressive dès 10 %',
        description:
          "Conciergerie locale fondée en 2023, Bonni couvre l'ensemble du périmètre hyérois : Giens, La Capte, Port d'Hyères, Costebelle, Les Salins, L'Almanarre et centre médiéval. Commission progressive à partir de 10 % du chiffre d'affaires net, sans frais fixes ni engagement. Annonce un objectif de +35 % de revenus en moyenne sur les biens repris, grâce à un yield agressif et à une présence terrain 7j/7. Profil idéal pour un propriétaire qui veut tester un partenaire local sans engagement.",
      },
      {
        name: 'YourHostHelper Hyères',
        url: 'https://yourhosthelper.com/conciergerie-hyeres/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
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
        rating: 0,
        reviews: 0,
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
        rating: 4.7,
        reviews: 80,
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
        rating: 5,
        reviews: 27,
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
        rating: 5,
        reviews: 12,
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
        reviews: 80,
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
    updatedAt: '2026-05-27',
  },
  // ==========================================================================
  // REIMS
  // ==========================================================================
  {
    slug: 'reims',
    displayName: 'Reims',
    region: 'Grand Est',
    regionSlug: 'alsace',
    title: 'Conciergerie Reims Airbnb : comparatif 2026 des 7 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Reims : Comparatif 2026',
    metaDescription:
      'Comparatif des 7 meilleures conciergeries Airbnb à Reims. Tarifs (15-25 %), services, avis Google, réglementation 2026, quartiers rentables (Cathédrale, Boulingrin).',
    kwPrincipal: 'conciergerie reims',
    kwSecondaires: [
      'conciergerie airbnb reims',
      'home conciergerie reims',
      'la conciergerie reims',
      'gestion locative reims',
      'location courte durée reims',
      'meublé touristique reims',
    ],
    population: 180000,
    tourists: 4500000,
    activeListings: 1400,
    priceLow: 55,
    priceHigh: 130,
    occupancyRate: 58,
    revpar: 45,
    seasonality:
      "Saisonnalité lissée par la **route du Champagne** et le tourisme œnologique toute l'année. Pic absolu **mai à septembre** (occupation 70-80 %, clientèle internationale premium pour les visites de caves Veuve Clicquot, Pommery, Taittinger, Ruinart). Les **Fêtes Johanniques** en juin et les **Sacre de Reims** (animations cathédrale) ajoutent des pics ponctuels. Reims bénéficie aussi d'un **tourisme d'affaires** régulier (45 min de Paris en TGV) qui lisse la semaine. Creux relatif janvier-février.",
    rankNational: 22,
    introCustom:
      "Vous avez un appartement à **Reims** que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée.\n\nEntre les **caves de Champagne** qui attirent une clientèle internationale toute l'année, la proximité de **Paris à 45 min en TGV**, et la nouvelle obligation d'**enregistrement en mairie** instaurée fin 2026, vous vous demandez si confier la gestion à une conciergerie est vraiment rentable.\n\nEt surtout : **laquelle choisir** parmi la dizaine d'acteurs rémois ?",
    marketIntro:
      "Reims est le **premier marché LCD du Grand Est** avec environ **1 400 annonces actives** et un revenu moyen par annonce autour de 15 000-20 000 €/an. La ville bénéficie d'un mix unique : **tourisme œnologique premium** (caves Veuve Clicquot, Pommery, Taittinger, Ruinart, Mumm), **patrimoine UNESCO** (cathédrale Notre-Dame de Reims, basilique Saint-Rémi, palais du Tau) et **proximité immédiate de Paris** (45 min en TGV, gare Champagne-Ardenne TGV).\n\nLa **route du Champagne** attire **4,5 millions de nuitées par an** dont 1,8 million de touristes internationaux (Japonais, Américains, Britanniques, Chinois) — un volume comparable à des destinations balnéaires majeures, mais avec une saisonnalité bien plus lissée.\n\nLe tourisme d'affaires (Reims Champagne Congrès, NEOMA Business School) ajoute une demande régulière en semaine, particulièrement appréciée des conciergeries qui peuvent ainsi maintenir une occupation 55-65 % toute l'année.\n\n**Reims n'est pas encore en zone tendue** au sens strict, mais la mairie a délibéré en faveur de l'**instauration du numéro d'enregistrement obligatoire au 4e trimestre 2026** pour mieux encadrer le marché LCD.",
    conciergeries: [
      {
        name: 'Nalis',
        url: 'https://nalis-immo.com/',
        commission: '15-25 %',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 70,
        biensGeres: 50,
        specialty: 'Grille dégressive 25 % puis 15 %, service structuré',
        description:
          "Grille de commission **dégressive** : 25 % TTC sur la première tranche de revenus, puis 15 % au-delà — un modèle qui aligne les intérêts conciergerie et propriétaire dès que les performances décollent. Ménage refacturé au voyageur. Service structuré couvrant création annonce, photos pro, diffusion Airbnb/Booking/Abritel, accueil, ménage et reporting. Idéale pour un propriétaire qui veut **maximiser la marge nette** sur un bien à fort potentiel (centre, Boulingrin).",
      },
      {
        name: 'DameRose Conciergerie',
        url: 'https://dameroseconciergerie.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 33,
        biensGeres: 35,
        specialty: 'Nettoyage haut de gamme, services complémentaires',
        description:
          "DameRose Conciergerie applique une commission unique de **20 % TTC** sur les revenus collectés, avec un focus marqué sur la **qualité du ménage** et des services complémentaires (linge hôtelier, fournitures d'accueil champenoises). Ménage refacturé au voyageur. Bon choix pour un T2-T3 dans l'hypercentre où la clientèle œnologique internationale est exigeante sur la propreté et le sourcing local.",
      },
      {
        name: 'Soloca',
        url: 'https://soloca.fr/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 25,
        specialty: 'Maintenance 7j/7, couverture Reims + Épernay',
        description:
          "Soloca, dirigée par Aurore, gère les logements LCD à **Reims et Épernay** (capitale du Champagne à 25 min). Commission 20 % TTC, ménage refacturé voyageur. Particularité : **maintenance 7j/7** et gestion transparente avec reporting mensuel détaillé. Pertinente pour un propriétaire multi-biens entre Reims et Épernay qui veut un interlocuteur unique sur l'ensemble de la route du Champagne.",
      },
      {
        name: 'Aux Clefs des Sacres',
        url: 'https://auxclefsdessacres.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.3,
        reviews: 55,
        biensGeres: 30,
        specialty: 'Gestion complète courte durée, ancrage rémois',
        description:
          "Aux Clefs des Sacres applique une **commission unique de 20 % TTC** sur les revenus collectés, sans frais fixes ni frais cachés. Couverture complète du cycle locatif : création et diffusion annonce, gestion des réservations, accueil voyageurs 7j/7, ménage pro, linge hôtelier, maintenance et reporting financier mensuel. Ancrage 100 % rémois, équipe terrain réactive — idéal pour un T1-T3 en hypercentre ou autour de la Cathédrale.",
      },
      {
        name: 'La Conciergerie des Sacres',
        url: 'https://www.conciergerie-des-sacres.fr/',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 4.3,
        reviews: 55,
        biensGeres: 60,
        specialty: 'Accompagnement propriétaires, acteur local volumique',
        description:
          "Tarification sur devis adaptée à chaque bien et niveau de service — généralement aligné sur le marché rémois (18-22 %). Offre clé en main : annonce, diffusion multi-plateformes, accueil, ménage, maintenance. Bon profil pour un propriétaire qui valorise l'expérience d'un acteur volumique avec un track record long.",
      },
      {
        name: 'Iviloc',
        url: 'https://ivilocconciergerie.fr/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 15,
        specialty: 'Conseils agencement et home staging',
        description:
          "Iviloc applique une commission de **20 % TTC** avec une spécificité : un **accompagnement amont sur l'agencement et le home staging** du bien avant mise en location, pour maximiser l'attractivité de l'annonce et le tarif moyen. Approche sur mesure adaptée à un propriétaire qui rénove un bien avant LCD ou qui souhaite repositionner un bien sous-performant.",
      },
      {
        name: 'Loca Ren\'t',
        url: 'https://reimsconciergerie.fr/',
        commission: '25-30 %',
        menage: 'refacturé voyageur',
        rating: 4.2,
        reviews: 10,
        biensGeres: 20,
        specialty: 'Automatisation poussée, accompagnement voyageurs',
        description:
          "Loca Ren't (reimsconciergerie.fr) applique une grille **25-30 % TTC** plus haute que la moyenne rémoise, justifiée par une **automatisation poussée** (smart lock, pricing dynamique, automatisation des messages) et un accompagnement renforcé des voyageurs sur la découverte de Reims et de la route du Champagne. Pertinent pour un propriétaire qui résiste à distance et veut un process techno-driven.",
      },
    ],
    neighborhoods: [
      {
        name: 'Cathédrale / Carré d\'Or',
        pricePerNight: '90-160 €',
        occupancy: 70,
        description:
          "Cœur historique autour de la cathédrale Notre-Dame (UNESCO), parvis du palais du Tau, hôtels particuliers du Carré d'Or. Tarifs au m² à l'achat parmi les plus élevés de Reims (>4 500 €/m²). Clientèle 100 % touristique premium (œnologie, mariages, congrès). T2 à partir de 280 000 €.",
        roiBrut: '4,5 à 5,5 %',
      },
      {
        name: 'Boulingrin / Halles',
        pricePerNight: '80-140 €',
        occupancy: 65,
        description:
          "Quartier le plus dynamique de Reims avec les Halles Art Déco rénovées, restaurants, bars à champagne. Mix tourisme + locaux urbains. Très demandé sur séjours courts (2-3 nuits) typiques du tourisme œnologique. T2 à partir de 240 000 €.",
        roiBrut: '5 à 6 %',
      },
      {
        name: 'Saint-Rémi',
        pricePerNight: '70-120 €',
        occupancy: 60,
        description:
          "Quartier-village autour de la basilique Saint-Rémi (UNESCO), à 15 min à pied de la cathédrale. Charme authentique, demande lissée sur l'année grâce aux voyageurs culturels. Ticket d'entrée plus accessible (T2 dès 200 000 €).",
        roiBrut: '5,5 à 6,5 %',
      },
      {
        name: 'Gare Centre / Reims Champagne TGV',
        pricePerNight: '70-110 €',
        occupancy: 62,
        description:
          "Périmètre autour de la gare centre (45 min Paris) et de NEOMA Business School. Forte demande **tourisme d'affaires** en semaine, tourisme œnologique le week-end. Excellente occupation lissée. Tarifs accessibles. T2 dès 180 000 €.",
        roiBrut: '6 à 7 %',
      },
      {
        name: 'Cernay / Maison Blanche',
        pricePerNight: '60-100 €',
        occupancy: 55,
        description:
          "Quartiers résidentiels au sud du centre, mix maisons et immeubles modestes. Demande tourisme + relocation professionnelle. Tarifs d'achat les plus bas du centre élargi. Réservé aux investisseurs en quête de cashflow brut.",
        roiBrut: '7 à 8 %',
      },
      {
        name: 'Périphérie Champagne (Épernay 25 min)',
        pricePerNight: '80-140 €',
        occupancy: 60,
        description:
          "Pour les villages de la route du Champagne (Hautvillers, Aÿ, Verzenay) à 15-25 min de Reims : gîtes ruraux et maisons de vigneron. Clientèle œnologique haut de gamme, séjours de 3-5 nuits. Saisonnalité plus marquée mai-septembre. Maison T3 dès 230 000 €.",
        roiBrut: '5,5 à 6,5 %',
      },
    ],
    regulation:
      "Reims a **délibéré en faveur de l'instauration du numéro d'enregistrement obligatoire** pour les meublés de tourisme, dont l'entrée en vigueur effective est annoncée pour le **4e trimestre 2026**. À cette date, tout loueur devra obtenir un numéro à 13 chiffres auprès de la mairie et le faire figurer sur chaque annonce, sous peine d'amende jusqu'à **10 000 €**.\n\n**Résidence principale.** La location en meublé de tourisme reste plafonnée à **120 nuitées par an** au niveau national (résidence principale du loueur). Au-delà, le bien bascule en résidence secondaire au sens de l'administration.\n\n**Loi Le Meur 2024 et calendrier national.** L'enregistrement national via téléservice unique (apimeubles.finances.gouv.fr) est obligatoire pour tous les meublés de tourisme. Le DPE classe E minimum est obligatoire (classe D à partir de 2034), et l'abattement micro-BIC est passé à 30 % pour les meublés non classés (50 % pour les classés tourisme). Amendes : **10 000 € pour défaut d'enregistrement**, **20 000 € pour fausse déclaration ou numéro falsifié**.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** Reims applique le tarif de la Communauté Urbaine du Grand Reims (télédéclaration sur reims.taxesejour.fr) : de 0,65 € à 4,30 € par nuit et par personne selon le classement de l'hébergement, collectée automatiquement par Airbnb.",
    concreteExample: {
      bienType: 'T2',
      surface: 42,
      pricePerNight: 95,
      neighborhood: 'Boulingrin',
      revenuBrut: 20100,
      commissionRate: 0.20,
      menageCount: 75,
      menageUnitCost: 65,
    },
    extraFaq: [
      {
        q: 'Faut-il un numéro d\'enregistrement pour louer en Airbnb à Reims en 2026 ?',
        a: "Reims a délibéré en faveur de l'instauration du numéro d'enregistrement, avec une entrée en vigueur annoncée pour le **4e trimestre 2026** (la mairie de Reims a reporté la date initiale du 20 mai 2026). À partir de cette date, tout loueur — résidence principale comme secondaire — devra obtenir un numéro à 13 chiffres auprès de la mairie et le faire figurer sur chaque annonce Airbnb, Booking ou Abritel. Sans numéro après l'entrée en vigueur, l'annonce sera automatiquement désactivée par les plateformes et le loueur s'expose à une amende jusqu'à **10 000 €**.",
      },
      {
        q: 'Combien rapporte un Airbnb à Reims pendant la haute saison œnologique ?',
        a: "La haute saison rémoise s'étale de **mai à septembre** avec un pic absolu juin-août (Fêtes Johanniques, vendanges, salons). Un T2 dans le Carré d'Or se loue **120-160 €/nuit en haute saison** contre 80-95 € en basse saison, avec une occupation 75-85 % en juin-août. Sur l'année complète, un T2 bien placé en hypercentre génère **18 000 à 24 000 € bruts** (avant commission). Les **vendanges en septembre** et les **fêtes de fin d'année autour des maisons de Champagne** créent des pics tarifaires supplémentaires (+30-40 %).",
      },
      {
        q: 'Quels quartiers privilégier pour investir en LCD à Reims ?',
        a: "Pour un objectif **rentabilité + sécurité**, le quartier **Boulingrin** est le meilleur compromis : Halles Art Déco, restaurants, demande mixte tourisme/locaux, T2 à partir de 240 000 € et ROI brut 5-6 %. Le **Carré d'Or** autour de la Cathédrale offre les meilleurs tarifs nuitée (90-160 €) mais avec un ticket d'entrée plus élevé (>280 000 €). Pour un **profil cashflow agressif**, viser la **zone gare** (45 min Paris en TGV, NEOMA Business School) : demande lissée tourisme + business, tickets dès 180 000 €. À éviter pour le LCD pur : Croix-Rouge / Murigny (forte concentration HLM, demande Airbnb très faible).",
      },
    ],
    updatedAt: '2026-05-27',
  },
  // ==========================================================================
  // CAEN
  // ==========================================================================
  {
    slug: 'caen',
    displayName: 'Caen',
    region: 'Normandie',
    regionSlug: 'normandie',
    title: 'Conciergerie Caen Airbnb : comparatif 2026 des 7 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Caen : Comparatif 2026',
    metaDescription:
      'Comparatif des 7 meilleures conciergeries Airbnb à Caen. Tarifs (15-25 %), services, avis Google, réglementation 2026, quartiers rentables (Vaugueux, Saint-Pierre).',
    kwPrincipal: 'conciergerie caen',
    kwSecondaires: [
      'conciergerie airbnb caen',
      'ma conciergerie en normandie caen',
      'location saisonnière caen',
      'gestion locative caen',
      'meublé touristique caen',
      'conciergerie privée normandie',
    ],
    population: 106000,
    tourists: 1200000,
    activeListings: 950,
    priceLow: 55,
    priceHigh: 120,
    occupancyRate: 55,
    revpar: 38,
    seasonality:
      "Saisonnalité tirée par les **plages du Débarquement** (commémorations du 6 juin, mémoriaux d'Omaha Beach, Arromanches) et le **Festival international du film de Cabourg** voisin. Pic absolu **mai-septembre** (occupation 65-75 %). Le **Mémorial de Caen** (1er site touristique de Normandie hors Mont-Saint-Michel) lisse la saison avec une demande culturelle continue. Pics ponctuels lors du **Tour de France** (passage à Caen en 2025), du **D-Day Festival** (juin) et du **millénaire de la ville** (2025). Creux marqué novembre-février.",
    rankNational: 28,
    introCustom:
      "Vous avez un appartement à **Caen** que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée.\n\nEntre les **plages du Débarquement** à 30 min, le **Mémorial de Caen** (1er site de Normandie hors Mont-Saint-Michel), une demande étudiante stable (Campus 1) et la nouvelle obligation d'enregistrement, vous vous demandez si confier la gestion à une conciergerie est vraiment rentable.\n\nEt surtout : **laquelle choisir** parmi la dizaine d'acteurs caennais ?",
    marketIntro:
      "Caen est l'un des marchés LCD les plus stables de Normandie avec environ **950 annonces actives** et un revenu moyen par annonce autour de 12 000-16 000 €/an. La ville bénéficie d'un mix unique : **tourisme mémoriel** (Mémorial de Caen, plages du Débarquement à 30 min, Pointe du Hoc, Omaha Beach), **patrimoine médiéval** (château de Guillaume le Conquérant, Abbaye aux Hommes, Abbaye aux Dames) et **proximité immédiate de la mer** (Ouistreham et la Côte de Nacre à 15 min).\n\nLa **Normandie a enregistré 13 millions de nuitées en 2025** (+7,2 % sur 2024, 2e meilleure progression de France métropolitaine). Caen-la-Mer a profité du **passage du Tour de France** et du **millénaire de la ville** pour booster la fréquentation estivale de 5,4 %.\n\nLe **tourisme étudiant** (Université de Caen Normandie, ~30 000 étudiants) ajoute une demande relocation/visite famille toute l'année, particulièrement pratique pour maintenir une occupation 50-60 % hors-saison balnéaire.\n\n**Caen figure dans les communes en zone tendue** où la mairie peut imposer un permis de louer et le numéro d'enregistrement obligatoire — démarches à valider avant tout investissement LCD.",
    conciergeries: [
      {
        name: 'Mana Conciergerie',
        url: 'https://mana-conciergerie.fr/',
        commission: '15 %',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 80,
        specialty: 'Commission la plus basse du marché caennais',
        description:
          "Commission **15 % HT** — l'une des plus basses du marché normand. Approche moderne et qualitative : optimisation des annonces, accueil voyageurs, ménage professionnel, suivi quotidien des réservations. Idéale pour un propriétaire qui veut **maximiser sa marge nette** sur un bien T2-T3 en centre ou autour du château.",
      },
      {
        name: 'Ma Conciergerie en Normandie (MCEN)',
        url: 'https://www.maconciergerieennormandie.fr/',
        commission: '25 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 18,
        biensGeres: 120,
        specialty: 'Gestion standing multi-villes (Deauville, Rouen, Le Havre)',
        description:
          "MCEN est l'**acteur normand multi-villes** par excellence : antennes à Caen, Deauville, Trouville, Rouen et Le Havre. Commission 25 % TTC sur le revenu généré, sans engagement de durée. Spécialisation sur les **biens de standing** : photos pro, pricing dynamique, gestion technique des villas et appartements haut de gamme, reporting financier mensuel. Pertinente pour un propriétaire multi-biens entre Caen et la Côte Fleurie.",
      },
      {
        name: 'Beauséjour Conciergerie',
        url: 'https://beausejour-conciergerie.com/',
        commission: '25 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 36,
        biensGeres: 40,
        specialty: 'Ameublement et décoration inclus',
        description:
          "Beauséjour Conciergerie applique une commission de **25 % HT** avec une spécificité : un **accompagnement amont sur l'ameublement et la décoration** du bien avant mise en location, pour positionner l'annonce sur un segment qualitatif. Pertinent pour un propriétaire qui rénove un bien avant LCD ou qui souhaite repositionner un bien sous-performant en haut de gamme.",
      },
      {
        name: 'Ammaj',
        url: 'https://ammaj.fr/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.3,
        reviews: 19,
        biensGeres: 25,
        specialty: 'Multi-plateformes (Airbnb, Booking, Abritel)',
        description:
          "Ammaj, basée à Caen, propose des services de gestion locative complets pour les propriétaires normands. Commission 20 % TTC, ménage refacturé voyageur. Diffusion sur **Airbnb, Booking et Abritel** simultanément pour maximiser le taux de remplissage. Couverture complète : optimisation annonces, accueil, ménage, maintenance. Bon choix pour un propriétaire qui veut industrialiser la diffusion multi-plateformes sans gérer lui-même les calendriers.",
      },
      {
        name: 'CALM Conciergerie',
        url: 'https://calm-conciergerie.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.5,
        reviews: 22,
        biensGeres: 30,
        specialty: 'Approche personnalisée et rassurante',
        description:
          "CALM Conciergerie applique une commission de **20 % TTC** avec une approche relationnelle assumée : un interlocuteur unique, une transparence forte sur le reporting, et un accompagnement personnalisé sur chaque bien. Pertinente pour un **primo-investisseur LCD** qui veut se faire la main avec un partenaire pédagogue et accessible.",
      },
      {
        name: 'Conciergerie Caennaise',
        url: 'https://www.la-conciergerie-caennaise.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 5.0,
        reviews: 8,
        biensGeres: 15,
        specialty: 'Expertise 100 % locale Caen intra-muros',
        description:
          "Conciergerie Caennaise est **100 % focalisée sur Caen intra-muros** (Vaugueux, Saint-Pierre, Saint-Jean, Vaucelles). Acteur boutique, équipe terrain réactive, idéal pour un propriétaire d'un T1-T2 en centre piéton qui valorise la connaissance fine du tissu local.",
      },
      {
        name: 'Fovéa Conciergerie',
        url: 'https://fovea-conciergerie.fr/',
        commission: '15 %',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 20,
        specialty: 'Stratégie personnalisée, commission basse',
        description:
          "Fovéa Conciergerie applique l'une des **commissions les plus basses du marché caennais** (15 % TTC) avec un positionnement sur la **stratégie personnalisée** : yield management adapté au bien, accompagnement éditorial sur l'annonce, photos pro. Couverture Caen et premières communes de la Côte de Nacre. Pertinent pour un propriétaire qui veut un acteur local avec une marge nette élevée.",
      },
    ],
    neighborhoods: [
      {
        name: 'Vaugueux / Château',
        pricePerNight: '85-130 €',
        occupancy: 68,
        description:
          "Quartier médiéval emblématique au pied du château de Guillaume le Conquérant : ruelles pavées, maisons à colombages, restaurants gastronomiques. Le plus prisé pour le LCD touristique. Clientèle 100 % touristique avec rotation rapide (2-3 nuits). T2 à partir de 230 000 €.",
        roiBrut: '5 à 6 %',
      },
      {
        name: 'Saint-Pierre / Centre piéton',
        pricePerNight: '75-115 €',
        occupancy: 65,
        description:
          "Cœur piéton autour de l'église Saint-Pierre : commerces, marchés, Abbaye aux Hommes à 10 min à pied. Demande touristique forte et lissée sur l'année (mémoriel + culturel). T2 à partir de 200 000 €.",
        roiBrut: '5,5 à 6,5 %',
      },
      {
        name: 'Saint-Jean / Port',
        pricePerNight: '70-100 €',
        occupancy: 60,
        description:
          "Quartier autour de l'église Saint-Jean et du port de Caen, à proximité du bassin Saint-Pierre. Mix tourisme et locaux urbains. Tarifs d'achat plus accessibles que Vaugueux. Bon compromis ticket/rendement. T2 dès 180 000 €.",
        roiBrut: '6 à 7 %',
      },
      {
        name: 'Vaucelles / Gare',
        pricePerNight: '60-95 €',
        occupancy: 58,
        description:
          "Quartier résidentiel rive gauche, à 7 min à pied de la gare et 15 min du centre. Forte demande **tourisme d'affaires** en semaine (UFR Caen, hôpitaux) et tourisme mémoriel le week-end. Tickets d'achat les plus bas du centre élargi. T2 dès 160 000 €.",
        roiBrut: '6,5 à 7,5 %',
      },
      {
        name: 'Université / Campus 1',
        pricePerNight: '55-85 €',
        occupancy: 50,
        description:
          "Périmètre autour de l'Université de Caen Normandie (~30 000 étudiants) : demande visite famille, relocation, séminaires. Demande lissée mais tarifs nuitée plus bas. Pertinent pour du LCD mixte avec bail mobilité 1-9 mois.",
        roiBrut: '7 à 8 %',
      },
      {
        name: 'Côte de Nacre (Ouistreham 15 min)',
        pricePerNight: '85-150 €',
        occupancy: 55,
        description:
          "Pour les communes balnéaires de la Côte de Nacre (Ouistreham, Lion-sur-Mer, Riva-Bella) à 15 min de Caen. Saisonnalité très marquée mai-septembre (familles, plages du Débarquement). Maison T3 dès 250 000 €.",
        roiBrut: '5,5 à 6,5 %',
      },
    ],
    regulation:
      "Caen est classée en **zone tendue** au sens du décret n°2023-822, ce qui déclenche l'encadrement des loyers longue durée, la taxe sur les logements vacants et la possibilité pour la mairie d'imposer le numéro d'enregistrement obligatoire pour les meublés de tourisme. La mairie de Caen propose un **téléservice d'enregistrement** : tout loueur doit déclarer son meublé et obtenir un numéro à 13 chiffres à faire figurer sur chaque annonce.\n\n**Résidence principale.** La location en meublé de tourisme reste plafonnée à **120 nuitées par an** au niveau national (résidence principale du loueur).\n\n**Permis de louer.** En zone tendue, la mairie peut imposer une **autorisation préalable de mise en location** (permis de louer) délivrée après contrôle de la salubrité et de la décence du logement. À vérifier directement auprès de la direction de l'urbanisme de Caen avant tout investissement dédié LCD.\n\n**Loi Le Meur 2024.** L'enregistrement national sur téléservice unique (apimeubles.finances.gouv.fr) est obligatoire. Le DPE classe E minimum est obligatoire (classe D à partir de 2034), et l'abattement micro-BIC est passé à 30 % pour les meublés non classés (50 % pour les classés tourisme). Amendes : **10 000 € pour défaut d'enregistrement**, **20 000 € pour fausse déclaration ou numéro falsifié**.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** Caen applique le tarif intercommunal de Caen-la-Mer : de 0,65 € à 4,30 € par nuit et par personne selon le classement, collectée automatiquement par Airbnb.",
    concreteExample: {
      bienType: 'T2',
      surface: 40,
      pricePerNight: 85,
      neighborhood: 'Saint-Pierre',
      revenuBrut: 17000,
      commissionRate: 0.20,
      menageCount: 70,
      menageUnitCost: 60,
    },
    extraFaq: [
      {
        q: 'Faut-il un permis de louer ou un numéro d\'enregistrement pour louer en Airbnb à Caen ?',
        a: "Oui, sur les deux plans. Caen étant en **zone tendue**, la mairie impose un **permis de louer** (autorisation préalable de mise en location) délivré après contrôle de la salubrité du logement. Par ailleurs, tout loueur de meublé de tourisme doit obtenir un **numéro d'enregistrement à 13 chiffres** auprès de la mairie via le téléservice d'enregistrement, et le faire figurer sur chaque annonce Airbnb, Booking ou Abritel. Sans numéro, l'annonce est automatiquement désactivée par les plateformes et le loueur s'expose à une amende jusqu'à **10 000 €**.",
      },
      {
        q: 'Combien rapporte un Airbnb à Caen pendant les commémorations du Débarquement ?',
        a: "Les commémorations du **6 juin** et le **D-Day Festival** (1er au 10 juin) attirent une clientèle internationale haut de gamme — anciens combattants, descendants, presse, historiens — prête à payer **+50 à +80 %** par rapport aux tarifs standards de juin. Un T2 dans le Vaugueux qui se loue 95 €/nuit en haute saison atteint 140-170 €/nuit pendant la première semaine de juin, avec un minimum 3-4 nuits imposé. Sur ces 10 jours, un bien bien placé peut générer **1 800 à 2 500 € bruts** uniquement sur cette période, soit l'équivalent d'un mois entier hors-saison.",
      },
      {
        q: 'Quels quartiers privilégier pour investir en LCD à Caen ?',
        a: "Pour un objectif **rentabilité + sécurité**, le quartier **Saint-Pierre** est le meilleur compromis : centre piéton, demande lissée tourisme + culturel, T2 à partir de 200 000 € et ROI brut 5,5-6,5 %. Le **Vaugueux** (médiéval, château) offre les meilleurs tarifs nuitée (85-130 €) mais avec un ticket d'entrée plus élevé (>230 000 €). Pour un **profil cashflow agressif**, viser **Vaucelles** (proximité gare + tourisme d'affaires en semaine) : tickets dès 160 000 €, ROI brut 6,5-7,5 %. Pour un profil **balnéaire saisonnier**, regarder la Côte de Nacre (Ouistreham, Lion-sur-Mer) à 15 min de Caen.",
      },
    ],
    updatedAt: '2026-05-27',
  },
  // ==========================================================================
  // ANTIBES
  // ==========================================================================
  {
    slug: 'antibes',
    displayName: 'Antibes',
    region: "Provence-Alpes-Côte d'Azur",
    regionSlug: 'provence-alpes-cote-dazur',
    title: 'Conciergerie Antibes Airbnb : comparatif 2026 des 7 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Antibes : Comparatif 2026',
    metaDescription:
      'Comparatif des 7 meilleures conciergeries Airbnb à Antibes & Juan-les-Pins. Tarifs (15-25 %), services, avis Google, réglementation 90 nuits 2026, quartiers rentables.',
    kwPrincipal: 'conciergerie antibes',
    kwSecondaires: [
      'conciergerie airbnb antibes',
      'conciergerie juan les pins',
      'airbnb antibes',
      'gestion locative antibes',
      'location saisonnière antibes',
      'meublé touristique antibes',
    ],
    population: 76600,
    tourists: 5000000,
    activeListings: 3262,
    priceLow: 95,
    priceHigh: 200,
    occupancyRate: 63,
    revpar: 100,
    seasonality:
      "Saisonnalité Côte d'Azur très marquée. Pic absolu juin à septembre (occupation 80-90 %, clientèle internationale : Britanniques, Italiens, Allemands, Américains). Événements majeurs qui tendent les tarifs : Festival de Cannes en mai (Antibes/Juan en zone retombée), Grand Prix de Monaco fin mai, Jazz à Juan en juillet, Yachting Festival en septembre. Vacances de la Toussaint et fêtes de fin d'année ajoutent un pic court. Creux marqué novembre-mars (occupation 35-45 %) à l'exception des week-ends prolongés et du tourisme d'affaires Sophia Antipolis voisin.",
    rankNational: 11,
    introCustom:
      "Vous avez un appartement à **Antibes**, à Juan-les-Pins ou au Cap d'Antibes, que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée.\n\nEntre la **limite de 90 nuits par an** entrée en vigueur en janvier 2026 (zone tendue), l'obligation d'enregistrement Declaloc au 20 mai 2026, la **clientèle internationale premium** des grands événements (Festival de Cannes, Grand Prix de Monaco, Jazz à Juan, Yachting Festival) et la concurrence d'une dizaine d'acteurs locaux, vous vous demandez si confier la gestion à une conciergerie est vraiment rentable.\n\nEt surtout : **laquelle choisir** entre Vieil Antibes, Juan-les-Pins et Cap d'Antibes ?",
    marketIntro:
      "Antibes est l'un des **marchés LCD les plus tendus de France** avec environ **3 200 annonces actives** (mars 2026) sur une commune de 76 000 habitants, soit l'un des plus forts ratios annonces/habitants de la Côte d'Azur. Le **tarif moyen nuitée atteint 163 €** (source AirDNA) — un niveau premium qui place Antibes au-dessus de Nice et au niveau de Cannes.\n\nLa **Côte d'Azur génère plus de 12 millions de nuitées par an** dont une part significative captée par Antibes-Juan, particulièrement grâce au triangle Vieil Antibes / Juan-les-Pins / Cap d'Antibes : plages, marché provençal, marina de Port Vauban (l'une des plus grandes d'Europe), Picasso, festivals.\n\nLe **tourisme d'affaires Sophia Antipolis** (la plus grande technopole d'Europe, à 10 min en voiture) ajoute une demande régulière en semaine hors-saison balnéaire : ingénieurs, consultants, formations longues.\n\n**Antibes est en zone tendue** au sens du décret n°2023-822 et applique depuis janvier 2026 la **limite stricte de 90 nuits par an** pour la location en résidence principale, avec **enregistrement Declaloc obligatoire au plus tard le 20 mai 2026** et sanctions jusqu'à 20 000 € par logement.",
    conciergeries: [
      {
        name: 'Azurenting',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 88,
        biensGeres: 70,
        specialty: "Ménage + linge, accueil voyageurs, Airbnb + Booking",
        description:
          "Commission 20 % TTC, ménage refacturé au voyageur. Service couvrant création annonce, photos pro, diffusion Airbnb et Booking, accueil voyageurs, ménage et fourniture du linge hôtelier. Approche multi-plateformes pour maximiser le taux de remplissage face à la concurrence des 3 200 annonces actives de la commune. Pertinente pour un T2-T3 dans le Vieil Antibes ou à Juan-les-Pins où la demande internationale exige une réactivité 7j/7.",
      },
      {
        name: 'Manasteos',
        url: 'https://manasteos.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 40,
        biensGeres: 35,
        specialty: 'Gestion complète + photos pro, équipe locale',
        description:
          "Gestion complète : création annonce, shooting photo professionnel, diffusion multi-plateformes, accueil voyageurs, ménage pro, linge hôtelier, maintenance et reporting financier. Équipe 100 % locale Antibes / Juan-les-Pins. Pertinente pour un propriétaire qui privilégie la qualité de service à la volume, sur un bien premium en Vieil Antibes ou Cap d'Antibes.",
      },
      {
        name: 'Bird Renting',
        commission: '20-25 %',
        menage: 'refacturé voyageur',
        rating: 4.6,
        reviews: 48,
        biensGeres: 50,
        specialty: 'Équipe locale Côte d\'Azur 7j/7',
        description:
          "Bird Renting opère sur l'ensemble de la Côte d'Azur (Antibes, Cannes, Nice, Mougins) avec une équipe locale 24/7 réactive sur la gestion technique des biens. Commission alignée sur le marché azuréen (20-25 % selon le bien et les services). Bon profil pour un propriétaire multi-biens entre Antibes et Cannes qui veut un interlocuteur unique sur le triangle azuréen.",
      },
      {
        name: 'Conciergerie Enjoy and Stay',
        commission: '22-25 %',
        menage: 'refacturé voyageur',
        rating: 4.5,
        reviews: 66,
        biensGeres: 60,
        specialty: 'Volume Côte d\'Azur, gestion premium internationale',
        description:
          "Tarification 22-25 % TTC selon le bien et la formule choisie. Approche premium adaptée à la clientèle internationale dominante d'Antibes : accueil multilingue, fournitures d'accueil haut de gamme, coordination avec les concierges privés et chauffeurs des grands événements (Festival de Cannes, Grand Prix). Pertinente pour un bien à fort potentiel international au Cap d'Antibes ou à Juan-les-Pins.",
      },
      {
        name: 'Bonnaud Estates',
        commission: '24 %',
        menage: 'refacturé voyageur',
        rating: 4.2,
        reviews: 74,
        biensGeres: 45,
        specialty: 'Acteur immobilier local, gestion sur mesure',
        description:
          "Bonnaud Estates est un acteur immobilier local d'Antibes qui propose la gestion LCD en complément de son activité de transaction et location longue durée. Pertinent pour un propriétaire qui souhaite une approche immobilière 360 : gestion LCD le temps d'optimiser la rentabilité, puis bascule éventuelle en location annuelle ou cession via le même interlocuteur.",
      },
      {
        name: 'Riviera Collection',
        url: 'https://collectionriviera.com/conciergerie-airbnb-antibes/',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 40,
        specialty: 'Équipe 100 % locale Antibes / Juan / Cap d\'Antibes',
        description:
          "Riviera Collection met en avant une équipe 100 % locale basée à Antibes, Juan-les-Pins et Cap d'Antibes : connaissance fine des rues, saisonnalité et opportunités des grands événements (Jazz à Juan, Yachting Festival, Festival de Cannes, Grand Prix de Monaco). Tarification sur devis adaptée au bien et au niveau de service. Pertinente pour un propriétaire qui valorise l'ancrage hyper-local et la capacité à capitaliser sur les pics tarifaires événementiels.",
      },
      {
        name: 'Host by A',
        url: 'https://www.hostbya.com/conciergerie-antibes',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 25,
        specialty: 'Réactivité 24/7, accompagnement personnalisé',
        description:
          "Host by A se positionne sur la réactivité voyageurs avec une disponibilité 24/7 affichée et un accompagnement personnalisé par bien. Présence terrain constante. Pertinente pour un primo-investisseur LCD sur Antibes qui veut un interlocuteur unique et accessible plutôt qu'un grand acteur volumique.",
      },
    ],
    neighborhoods: [
      {
        name: 'Vieil Antibes / Marché provençal',
        pricePerNight: '110-200 €',
        occupancy: 72,
        description:
          "Cœur historique d'Antibes, ruelles pavées, marché provençal couvert, remparts Vauban, musée Picasso. Le plus prisé pour le LCD touristique premium. Clientèle 100 % touristique avec rotation rapide (2-4 nuits). T2 à partir de 360 000 €.",
        roiBrut: '4 à 5 %',
      },
      {
        name: 'Juan-les-Pins',
        pricePerNight: '130-230 €',
        occupancy: 75,
        description:
          "Station balnéaire mythique, plage de la Pinède, casino, Jazz à Juan (juillet). Saisonnalité très marquée (90 % d'occupation juin-août). Clientèle internationale festive. Tarifs nuitée parmi les plus élevés d'Antibes. T2 à partir de 380 000 €.",
        roiBrut: '4 à 5 %',
      },
      {
        name: 'Cap d\'Antibes',
        pricePerNight: '180-400 €',
        occupancy: 65,
        description:
          "Presqu'île luxueuse : villas, hôtels du Cap, plages confidentielles (Garoupe, Joli Bois). Ticket d'entrée très élevé (T2 > 500 000 €, villas multi-millions). LCD réservé aux investisseurs haut de gamme, clientèle yachting et stars du cinéma en mai.",
        roiBrut: '3 à 4 %',
      },
      {
        name: 'Salis / Hauts d\'Antibes',
        pricePerNight: '95-160 €',
        occupancy: 65,
        description:
          "Quartiers résidentiels entre Vieil Antibes et Cap d'Antibes, accès plages de la Salis, calme et balades en bord de mer. Mix tourisme + résidentiel. Bon compromis ticket/rendement. T2 à partir de 290 000 €.",
        roiBrut: '4,5 à 5,5 %',
      },
      {
        name: 'La Fontonne / Antibes-les-Pins',
        pricePerNight: '85-140 €',
        occupancy: 58,
        description:
          "Quartiers résidentiels au nord-est de la commune, accès rapide à Sophia Antipolis (10 min). Demande mixte tourisme d'été + tourisme d'affaires (ingénieurs, consultants). Tickets d'achat accessibles. T2 dès 250 000 €.",
        roiBrut: '5 à 6 %',
      },
      {
        name: 'La Brague / Marenda',
        pricePerNight: '75-130 €',
        occupancy: 55,
        description:
          "Périphérie nord d'Antibes, proche Marineland et Sophia Antipolis. Profil familial (parcs d'attractions, plages de la Brague). Saisonnalité estivale marquée. Tickets d'achat les plus accessibles de la commune. Maison T3 dès 320 000 €.",
        roiBrut: '5 à 6 %',
      },
    ],
    regulation:
      "Antibes est classée en **zone tendue** au sens du décret n°2023-822 et applique depuis **janvier 2026 la limite stricte de 90 nuitées par an** pour la location en résidence principale (la résidence principale étant celle que vous occupez au moins 8 mois par an). Au-delà des 90 nuits, le bien bascule en résidence secondaire et est soumis à une **autorisation de changement d'usage** délivrée par la mairie.\n\n**Enregistrement Declaloc.** Tout loueur doit obtenir un numéro d'enregistrement à 13 chiffres via le téléservice national (apimeubles.finances.gouv.fr ou via la mairie d'Antibes) et le faire figurer sur chaque annonce Airbnb, Booking ou Abritel. Date limite d'entrée en vigueur : **20 mai 2026**.\n\n**Sanctions.** Le quota de 90 nuits dépassé entraîne une amende jusqu'à **15 000 €**. Le défaut d'enregistrement coûte jusqu'à **10 000 €**. La fausse déclaration ou l'utilisation d'un numéro falsifié est sanctionnée jusqu'à **20 000 € par logement**.\n\n**Loi Le Meur 2024 et calendrier national.** Le DPE classe E minimum est obligatoire (classe D à partir de 2034), et l'abattement micro-BIC est passé à 30 % pour les meublés non classés (50 % pour les classés tourisme). Les biens classés F ou G au DPE sont désormais interdits à la location courte durée.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** Antibes applique le tarif communal voté chaque année. De 0,80 € à 4,30 € par nuit et par personne selon le classement de l'hébergement, collectée automatiquement par Airbnb depuis 2019.",
    concreteExample: {
      bienType: 'T2',
      surface: 45,
      pricePerNight: 130,
      neighborhood: 'Vieil Antibes',
      revenuBrut: 28000,
      commissionRate: 0.20,
      menageCount: 95,
      menageUnitCost: 70,
    },
    extraFaq: [
      {
        q: 'Quelle est la limite de location Airbnb à Antibes en 2026 ?',
        a: "Antibes applique depuis janvier 2026 la limite stricte de 90 nuitées par an pour la location en résidence principale (celle que vous occupez au moins 8 mois par an). Au-delà, le bien doit basculer en résidence secondaire avec autorisation de changement d'usage délivrée par la mairie. L'enregistrement Declaloc est obligatoire au plus tard le 20 mai 2026 : un numéro à 13 chiffres à faire figurer sur chaque annonce. Sanctions : 15 000 € pour dépassement des 90 nuits, 10 000 € pour défaut d'enregistrement, 20 000 € pour fausse déclaration.",
      },
      {
        q: 'Combien rapporte un Airbnb à Antibes pendant le Festival de Cannes et le Grand Prix de Monaco ?',
        a: "Antibes capte la retombée hôtelière de deux événements majeurs en mai : le Festival de Cannes (10 jours mi-mai) et le Grand Prix de Monaco (4 jours fin mai). Sur ces deux fenêtres, les tarifs nuitée à Juan-les-Pins et au Cap d'Antibes peuvent doubler : un T2 qui se loue 130 €/nuit en mai standard atteint 260-350 €/nuit pendant ces 2 semaines, avec minimum 3-7 nuits imposé. Sur 14 jours, un bien bien placé peut générer 4 000 à 6 500 € bruts, soit l'équivalent de 2 mois standards.",
      },
      {
        q: 'Quels quartiers privilégier pour investir en LCD à Antibes ?',
        a: "Pour un objectif rentabilité + sécurité, le quartier La Fontonne / Antibes-les-Pins est le meilleur compromis : ticket d'achat accessible (T2 dès 250 000 €), demande mixte tourisme + Sophia Antipolis en semaine, ROI brut 5-6 %. Le Vieil Antibes et Juan-les-Pins offrent les meilleurs tarifs nuitée (110-230 €) mais avec un ticket d'entrée plus élevé (>360 000 €) et un ROI brut plus faible (4-5 %). Le Cap d'Antibes est réservé aux profils patrimoniaux haut de gamme. À éviter pour le LCD pur : Les Semboules / Saint-Maymes (résidentiel pur, demande Airbnb très faible).",
      },
    ],
    updatedAt: '2026-05-27',
  },
  // ==========================================================================
  // TOULON
  // ==========================================================================
  {
    slug: 'toulon',
    displayName: 'Toulon',
    region: "Provence-Alpes-Côte d'Azur",
    regionSlug: 'provence-alpes-cote-dazur',
    title: 'Conciergerie Toulon Airbnb : comparatif 2026 des 7 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Toulon : Comparatif 2026',
    metaDescription:
      'Comparatif des 7 meilleures conciergeries Airbnb à Toulon (Var). Tarifs (15-25 %), services, avis Google, réglementation 2026, quartiers rentables (Mourillon, Vieille Ville).',
    kwPrincipal: 'conciergerie toulon',
    kwSecondaires: [
      'conciergerie airbnb toulon',
      'conciergerie var',
      'airbnb toulon pas cher',
      'conciergerie clé en main toulon',
      'conciergerie gestion locative toulon',
      'location saisonnière toulon',
    ],
    population: 170000,
    tourists: 4500000,
    activeListings: 1440,
    priceLow: 60,
    priceHigh: 140,
    occupancyRate: 59,
    revpar: 50,
    seasonality:
      "Saisonnalité méditerranéenne marquée. Pic absolu juillet à août (occupation 85-90 %, familles, clientèle internationale, plages du Mourillon). Pic secondaire mai-juin et septembre (météo encore favorable, prix plus accessibles, retraités et seniors). Événements qui tendent les tarifs : Jazz à Toulon en juillet, Voiles Latines, Fêtes de la Mer, escales militaires. Tourisme de croisière régulier (port militaire et commercial). Creux marqué novembre-mars (occupation 35-45 %) compensé par le tourisme d'affaires (TPM, ports, Marine nationale, ferries Corse).",
    rankNational: 18,
    introCustom:
      "Vous avez un appartement à **Toulon**, au Mourillon ou en Vieille Ville, que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée.\n\nEntre les **1 440 annonces actives** de la commune (croissance forte ces dernières années), la nouvelle obligation d'**enregistrement Declaloc au 20 mai 2026** et la dizaine d'acteurs locaux qui se partagent le marché, vous vous demandez si confier la gestion à une conciergerie est vraiment rentable.\n\nEt surtout : **laquelle choisir** entre Mourillon, Vieille Ville et Cap Brun ?",
    marketIntro:
      "Toulon est l'un des **marchés LCD les plus dynamiques du Var** avec environ **1 440 annonces actives** (avril 2026) et un revenu moyen par annonce autour de 18 400 €/an. La ville bénéficie d'un mix unique : **plages du Mourillon** (les plus prisées de la métropole TPM), **vieille ville rénovée** (place Puget, Cours Lafayette, marché provençal), **port militaire** (le plus grand port militaire d'Europe, escales internationales) et **proximité immédiate des îles d'Or** (Porquerolles, Port-Cros via ferries).\n\nLa **Côte Varoise génère plus de 4,5 millions de nuitées par an** dont Toulon-Provence-Méditerranée capte environ 1,3 million. Le tarif moyen nuitée est de **86 €** (source AirDNA) — un niveau plus accessible que Cannes ou Nice, ce qui ouvre le marché à une clientèle familiale et seniors.\n\nLe **tourisme d'affaires** (Marine nationale, ports commerciaux, université Toulon-Var, ferries Corse) ajoute une demande lissée en semaine hors-saison balnéaire.\n\n**Toulon est en zone tendue** au sens du décret n°2023-822 (métropole TPM), avec **enregistrement Declaloc obligatoire au plus tard le 20 mai 2026** et un plafond de **120 nuitées par an** pour la location en résidence principale.",
    conciergeries: [
      {
        name: 'Happy Home',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 5.0,
        reviews: 80,
        biensGeres: 70,
        specialty: 'Services complets : annonce, accueil, ménage, déco',
        description:
          "Tarification sur devis adaptée au bien et au niveau de service. Offre complète : mise en ligne de l'annonce, accueil voyageurs, ménage, conseils décoration et home staging amont. Pertinente pour un propriétaire qui veut un service tout-en-un avec une approche conseil sur la valorisation du bien avant mise en location.",
      },
      {
        name: 'La Conciergerie Intendance de Marjory',
        commission: '20-24 %',
        menage: 'refacturé voyageur',
        rating: 4.6,
        reviews: 102,
        biensGeres: 80,
        specialty: 'Volume Toulon-Var, relation personnalisée',
        description:
          "Commission 20-24 % HT selon le bien. Approche relationnelle assumée avec un interlocuteur unique sur la durée. Bon profil pour un propriétaire qui valorise le track record long et le suivi humain plutôt que la techno-driven.",
      },
      {
        name: 'Loca\'Zen',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 44,
        biensGeres: 45,
        specialty: 'Home staging et coordination artisans',
        description:
          "Spécificité : un accompagnement amont sur le home staging et la coordination des artisans avant mise en location (peinture, électricité, plomberie, mobilier). Pertinente pour un propriétaire qui rénove un bien avant LCD et veut un partenaire unique du chantier à la première arrivée voyageur.",
      },
      {
        name: 'Azuréa Conciergerie',
        url: 'https://www.info83.fr/conciergerie-airbnb-toulon/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 13,
        biensGeres: 25,
        specialty: 'Optimisation propriété, expertise ménage',
        description:
          "Azuréa Conciergerie, dirigée par Gioia et Jonathan, applique une commission unique de 20 % HT sur les revenus collectés. L'équipe vient d'un background ménage professionnel : les retours clients soulignent la constance qualitative — un atout direct pour la note Airbnb (impact sur la visibilité). Pertinente pour un T2-T3 au Mourillon ou en Vieille Ville où la rotation rapide exige une exécution ménage irréprochable.",
      },
      {
        name: 'Confidences de Conciergerie',
        commission: '20-30 %',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 20,
        specialty: 'Formules flexibles, gardiennage et location',
        description:
          "Confidences de Conciergerie propose des formules flexibles entre 20 et 30 % TTC selon le périmètre choisi (gardiennage simple, gestion partielle, gestion complète clé en main). Pertinente pour un propriétaire qui ne souhaite pas tout déléguer (par exemple, garder la gestion des annonces et déléguer uniquement accueil + ménage) ou qui combine résidence secondaire occupée 4-6 mois par an et LCD le reste de l'année.",
      },
      {
        name: 'SK Solutions',
        commission: '15-20 %',
        menage: 'refacturé voyageur',
        rating: 5.0,
        reviews: 9,
        biensGeres: 18,
        specialty: 'Commission basse, gestion complète',
        description:
          "SK Solutions applique l'une des commissions les plus basses du marché toulonnais : 15-20 % HT selon le niveau de service. Offre clé en main couvrant annonce, diffusion multi-plateformes, accueil voyageurs, ménage et maintenance. Pertinente pour un propriétaire qui veut maximiser la marge nette sur un T2-T3 standard, sans services premium superflus.",
      },
      {
        name: 'Maya Conciergerie',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 10,
        biensGeres: 15,
        specialty: 'Yield management et maintenance continue',
        description:
          "Maya Conciergerie applique une commission de 20 % HT avec une approche orientée yield management : ajustement tarifaire continu en fonction des événements, de l'occupation et de la concurrence locale. Maintenance continue incluse (petites interventions, dépannage). Pertinente pour un propriétaire qui valorise la performance tarifaire plutôt que le volume.",
      },
    ],
    neighborhoods: [
      {
        name: 'Le Mourillon',
        pricePerNight: '85-140 €',
        occupancy: 70,
        description:
          "Quartier balnéaire emblématique de Toulon : plages des Sablettes, port de plaisance, restaurants, ambiance familiale et mer. Le plus prisé pour le LCD touristique. Saisonnalité estivale très marquée. T2 à partir de 280 000 €.",
        roiBrut: '4,5 à 5,5 %',
      },
      {
        name: 'Vieille Ville / Place Puget',
        pricePerNight: '70-115 €',
        occupancy: 62,
        description:
          "Cœur historique rénové autour de la place Puget, Cours Lafayette (marché provençal) et l'opéra. Mix tourisme + locaux urbains. Demande lissée sur l'année. T2 à partir de 200 000 €.",
        roiBrut: '5,5 à 6,5 %',
      },
      {
        name: 'Port / Darse Vieille',
        pricePerNight: '75-125 €',
        occupancy: 60,
        description:
          "Quartier autour du port militaire et de la darse vieille, ferries pour la Corse et les îles d'Or. Demande mixte tourisme + Marine nationale + ferries. Tickets d'achat accessibles. T2 dès 220 000 €.",
        roiBrut: '5 à 6 %',
      },
      {
        name: 'Cap Brun / Pomets',
        pricePerNight: '95-160 €',
        occupancy: 60,
        description:
          "Quartiers résidentiels prisés sur les hauteurs entre Mourillon et le Pradet, vues mer, calme. Profil familial et seniors. Tickets d'achat plus élevés. Maison T4 dès 500 000 €.",
        roiBrut: '4 à 5 %',
      },
      {
        name: 'Saint-Roch / La Serinette',
        pricePerNight: '60-95 €',
        occupancy: 55,
        description:
          "Quartiers résidentiels à l'ouest du centre, accès rapide gare TGV et hôpitaux. Demande tourisme + relocation professionnelle et médicale. Tickets d'achat parmi les plus bas. T2 dès 160 000 €.",
        roiBrut: '6,5 à 7,5 %',
      },
      {
        name: 'Le Pradet / Côtes Varoises (15 min)',
        pricePerNight: '85-150 €',
        occupancy: 58,
        description:
          "Communes balnéaires à 15 min de Toulon : Le Pradet, Carqueiranne, Six-Fours-les-Plages. Saisonnalité estivale très marquée (familles, plages). Maison T3 dès 320 000 €.",
        roiBrut: '5 à 6 %',
      },
    ],
    regulation:
      "Toulon est classée en **zone tendue** au sens du décret n°2023-822 (métropole Toulon-Provence-Méditerranée), ce qui déclenche l'encadrement des loyers longue durée, la taxe sur les logements vacants et la possibilité pour la mairie d'imposer le numéro d'enregistrement obligatoire pour les meublés de tourisme.\n\n**Résidence principale.** La location en meublé de tourisme reste plafonnée à **120 nuitées par an** pour la résidence principale (celle que vous occupez au moins 8 mois par an). Au-delà, le bien bascule en résidence secondaire au sens de l'administration.\n\n**Résidence secondaire.** À Toulon, vous n'avez pas besoin d'autorisation de changement d'usage (contrairement à Paris ou Nice). Vous devez en revanche impérativement déclarer votre meublé de tourisme auprès de la mairie.\n\n**Enregistrement Declaloc.** L'enregistrement national via téléservice unique (apimeubles.finances.gouv.fr) est obligatoire au plus tard le **20 mai 2026** avec un numéro à 13 chiffres à faire figurer sur chaque annonce Airbnb, Booking ou Abritel. Sans numéro après l'entrée en vigueur, l'annonce est désactivée automatiquement par les plateformes.\n\n**Loi Le Meur 2024.** Le DPE classe E minimum est obligatoire (classe D à partir de 2034), et l'abattement micro-BIC est passé à 30 % pour les meublés non classés (50 % pour les classés tourisme). Amendes : **10 000 € pour défaut d'enregistrement**, **20 000 € pour fausse déclaration ou numéro falsifié**. Les biens classés F ou G au DPE sont interdits à la location courte durée.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** Toulon applique le tarif intercommunal TPM : de 0,75 € à 4,30 € par nuit et par personne selon le classement de l'hébergement, collectée automatiquement par Airbnb.",
    concreteExample: {
      bienType: 'T2',
      surface: 42,
      pricePerNight: 90,
      neighborhood: 'Le Mourillon',
      revenuBrut: 19400,
      commissionRate: 0.20,
      menageCount: 80,
      menageUnitCost: 60,
    },
    extraFaq: [
      {
        q: 'Faut-il un numéro d\'enregistrement pour louer en Airbnb à Toulon en 2026 ?',
        a: "Oui. Toulon étant en zone tendue (métropole TPM), tout loueur doit obtenir un numéro d'enregistrement à 13 chiffres via le téléservice national Declaloc (apimeubles.finances.gouv.fr) au plus tard le 20 mai 2026 et le faire figurer sur chaque annonce Airbnb, Booking ou Abritel. Sans numéro, l'annonce est automatiquement désactivée par les plateformes et le loueur s'expose à une amende jusqu'à 10 000 €. Pour une résidence secondaire, il n'y a pas d'autorisation de changement d'usage requise à Toulon, mais la déclaration mairie reste obligatoire.",
      },
      {
        q: 'Combien rapporte un Airbnb au Mourillon pendant l\'été ?',
        a: "La haute saison toulonnaise s'étale de juillet à août. Un T2 au Mourillon qui se loue 85-95 €/nuit en moyenne annuelle atteint 130-180 €/nuit pendant ces deux mois, avec une occupation 85-90 % et un minimum 3-5 nuits imposé. Sur 60 jours de pleine saison, un bien bien placé peut générer 7 500 à 10 000 € bruts, soit l'équivalent de 5-6 mois d'occupation standard. Les événements comme Jazz à Toulon (juillet) ou les escales internationales du port militaire ajoutent des pics ponctuels de +20 à +30 %.",
      },
      {
        q: 'Quels quartiers privilégier pour investir en LCD à Toulon ?',
        a: "Pour un objectif rentabilité + sécurité, le quartier Vieille Ville / Place Puget est le meilleur compromis : centre piéton, demande lissée tourisme + locaux, T2 à partir de 200 000 € et ROI brut 5,5-6,5 %. Le Mourillon offre les meilleurs tarifs nuitée (85-140 €) mais avec un ticket d'entrée plus élevé (>280 000 €). Pour un profil cashflow agressif, viser Saint-Roch / La Serinette (proximité gare + hôpitaux) : tickets dès 160 000 €, ROI brut 6,5-7,5 %. Pour un profil balnéaire saisonnier, regarder Le Pradet ou Carqueiranne à 15 min de Toulon.",
      },
    ],
    updatedAt: '2026-05-27',
  },
  // ==========================================================================
  // CHAMONIX
  // ==========================================================================
  {
    slug: 'chamonix',
    displayName: 'Chamonix-Mont-Blanc',
    region: 'Auvergne-Rhône-Alpes',
    regionSlug: 'auvergne-rhone-alpes',
    title: 'Conciergerie Chamonix Airbnb : comparatif 2026 des 7 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Chamonix : Comparatif 2026',
    metaDescription:
      'Comparatif des 7 meilleures conciergeries Airbnb à Chamonix-Mont-Blanc. Tarifs (20-25 %), services, avis Google, réglementation 2025 changement d\'usage, chalets et appartements.',
    kwPrincipal: 'conciergerie chamonix',
    kwSecondaires: [
      'chamonix conciergerie',
      'conciergerie airbnb chamonix',
      'agence de gestion locative chamonix',
      'agence immobiliere chamonix location',
      'conciergerie saint gervais les bains',
      'location saisonnière chamonix',
    ],
    population: 10000,
    tourists: 3000000,
    activeListings: 2500,
    priceLow: 90,
    priceHigh: 280,
    occupancyRate: 65,
    revpar: 100,
    seasonality:
      "Double saisonnalité montagne très marquée. Pic absolu hiver de mi-décembre à mi-avril (occupation 85-90 %, semaines complètes obligatoires en haute saison, ski Mont-Blanc Unlimited, freeride Vallée Blanche, clientèle internationale). Pic secondaire été juillet à août (occupation 80-85 %, randonnée, alpinisme, Ultra-Trail du Mont-Blanc en août, Mer de Glace, Aiguille du Midi). Inter-saisons octobre-novembre et mai-juin très creux (occupation 25-35 %), souvent fermeture de remontées et météo capricieuse. Tarifs nuitée hiver vacances scolaires 2-3 fois plus élevés qu'en basse saison.",
    rankNational: 8,
    introCustom:
      "Vous avez un appartement ou un chalet à **Chamonix-Mont-Blanc**, aux Houches, à Argentière ou ailleurs dans la vallée, que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée.\n\nEntre la **nouvelle réglementation entrée en vigueur le 1er mai 2025** (1 seule autorisation de changement d'usage par personne physique à Chamonix et Les Houches), la **double saisonnalité hiver/été** qui dicte des semaines complètes en haute saison, l'**Ultra-Trail du Mont-Blanc** qui tend les tarifs en août, et la dizaine d'acteurs locaux qui se partagent un marché de **4 000 biens** dans la vallée, vous vous demandez si confier la gestion à une conciergerie est vraiment rentable.\n\nEt surtout : **laquelle choisir** entre Chamonix centre, Les Praz, Argentière et la vallée ?",
    marketIntro:
      "Chamonix-Mont-Blanc est le **premier marché LCD de montagne de France** par tarif et l'un des plus tendus en autorisation de mise en location. La **vallée de Chamonix a presque doublé son parc Airbnb en quatre ans** : 2 700 biens en 2020 → environ **4 000 biens en 2024**, dont la majorité concentrée sur Chamonix commune (estimé à 2 500 annonces actives). Le tarif moyen nuitée atteint **160 €** (avec un envol jusqu'à 280-400 € en haute saison hiver sur les chalets), un niveau qui place Chamonix au sommet du marché alpin français.\n\nLa **vallée de Chamonix-Mont-Blanc reçoit plus de 3 millions de nuitées par an** dont 60 % concentrées sur 6 mois (déc-avril + juil-août). Le mix unique : **domaine skiable Mont-Blanc Unlimited** (Chamonix, Les Houches, Argentière), **mythes alpins** (Aiguille du Midi, Mer de Glace, Vallée Blanche), **Ultra-Trail du Mont-Blanc** fin août (170 000 spectateurs, 10 000 coureurs, tarifs 2-4× la normale), **clientèle internationale** (Britanniques, Scandinaves, Américains, Coréens).\n\nLes **prix au m² à Chamonix atteignent 10 000 à 18 000 €** (pic 22 000 € sur les chalets de prestige) — un niveau qui place la commune au top 5 des prix immobiliers de France hors Paris.\n\n**Réglementation pionnière en station de montagne.** Depuis le **1er mai 2025**, Chamonix-Mont-Blanc et Les Houches limitent à **1 seule autorisation de changement d'usage par personne physique** pour les meublés de tourisme. Servoz autorise 2 autorisations, Vallorcine reste libre. Personnes morales (sociétés) concernées à partir du 1er mai 2026.",
    conciergeries: [
      {
        name: 'Care Concierge',
        url: 'https://careconcierge.fr/en/property-management/chamonix/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 214,
        biensGeres: 130,
        specialty: 'Volume vallée Mont-Blanc (130+ biens)',
        description:
          "Care Concierge est l'acteur volumique de référence dans la vallée Mont-Blanc avec plus de 130 biens gérés à Chamonix, Saint-Gervais et Megève. Commission 20 % TTC, ménage refacturé au voyageur. Couverture complète : annonce, diffusion multi-plateformes, accueil voyageurs, ménage pro, linge hôtelier, maintenance, reporting. Pertinente pour un propriétaire multi-biens sur la vallée Mont-Blanc qui veut un interlocuteur unique sur les 3 stations principales.",
      },
      {
        name: 'Chamonix Immobilier',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 8,
        biensGeres: 80,
        specialty: '26 ans d\'ancrage Chamonix, transaction + LCD',
        description:
          "Chamonix Immobilier est un acteur immobilier local avec 26 ans d'ancrage dans la vallée. Tarification sur devis adaptée à chaque bien et niveau de service. L'offre LCD complète l'activité de transaction et location annuelle. Pertinent pour un propriétaire qui souhaite une approche immobilière 360 : gestion LCD le temps d'optimiser la rentabilité, puis bascule éventuelle en location annuelle ou cession via le même interlocuteur historique.",
      },
      {
        name: 'Mont Blanc Conciergerie',
        commission: '20-25 %',
        menage: 'refacturé voyageur',
        rating: 4.6,
        reviews: 56,
        biensGeres: 60,
        specialty: 'Qualité et réactivité, focus vallée',
        description:
          "Mont Blanc Conciergerie applique une grille 20-25 % TTC selon le bien et le niveau de service. Positionnement sur la qualité du service voyageur et la réactivité terrain — un atout direct face à la concurrence des grands acteurs nationaux (HostnFly, Welkeys) qui opèrent à distance. Pertinente pour un propriétaire qui valorise un interlocuteur local accessible plutôt qu'une plateforme.",
      },
      {
        name: 'Pangea',
        commission: '60 €/mois ou 600 €/an',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 29,
        biensGeres: 30,
        specialty: 'Forfait fixe (pas de commission), services premium',
        description:
          "Pangea casse le modèle de la commission au pourcentage avec un forfait fixe : 60 €/mois ou 600 €/an, indépendamment du chiffre d'affaires généré. Services premium inclus : conciergerie 24/7, chef à domicile, location d'équipement (skis, randonnée), transferts aéroport. Pertinente pour un propriétaire dont le bien performe au-dessus de la moyenne (chalet > 50 000 € de revenus annuels) — au-delà d'un certain volume, le forfait Pangea bat largement les 20-25 % du marché.",
      },
      {
        name: 'Poulard & Co',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 16,
        biensGeres: 25,
        specialty: 'Gestion complète, assistance 24/7',
        description:
          "Poulard & Co applique une commission de 20 % TTC sur les revenus collectés. Offre clé en main : annonce, diffusion, accueil voyageurs, ménage, maintenance, assistance 24/7. Pertinente pour un propriétaire qui veut une exécution standard du marché sans services premium, avec un acteur local à taille humaine.",
      },
      {
        name: 'Chamkeys Prestige',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 18,
        biensGeres: 18,
        specialty: 'Premium : chef, transferts aéroport, gardiennage',
        description:
          "Tarification sur devis (généralement 25-30 % TTC selon le bien). Services premium inclus : chef à domicile sur demande, transferts aéroport Genève, gardiennage hors-saison, coordination travaux. Pertinente pour un chalet > 1,5 M€ au Lavancher, aux Praz ou à Argentière où la clientèle internationale (Émirats, Russie, États-Unis) exige du service hôtelier 5*.",
      },
      {
        name: 'Cham\'Concierge',
        url: 'https://www.chamconcierge.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 8,
        biensGeres: 15,
        specialty: 'Diffusion multi-plateformes (Airbnb, Booking, Expedia)',
        description:
          "Cham'Concierge crée et diffuse les annonces sur Airbnb, Booking, Hotels.com, Expedia et Google Hotel Ads — couverture multi-plateformes parmi les plus larges du marché chamoniard. Approche slogan « Clients à l'arrivée, amis au départ ». Pertinente pour un propriétaire qui veut maximiser le taux de remplissage via la multi-diffusion plutôt que la mono-plateforme Airbnb.",
      },
    ],
    neighborhoods: [
      {
        name: 'Chamonix Centre / Sud',
        pricePerNight: '120-280 €',
        occupancy: 75,
        description:
          "Cœur de Chamonix autour de l'église, rue du Docteur Paccard, place du Triangle de l'Amitié, départ téléphérique Aiguille du Midi. Le plus prisé pour le LCD touristique. Prix au m² 12 000-18 000 €. Studio dès 250 000 €, T2 dès 450 000 €.",
        roiBrut: '4 à 5,5 %',
      },
      {
        name: 'Les Praz de Chamonix',
        pricePerNight: '150-380 €',
        occupancy: 70,
        description:
          "Village authentique à 5 min de Chamonix centre, pied des pistes de la Flégère, calme et chalets traditionnels. Très prisé clientèle premium. Prix au m² 14 000-20 000 €. Chalet T4 dès 1,2 M€.",
        roiBrut: '3,5 à 4,5 %',
      },
      {
        name: 'Argentière / Le Tour',
        pricePerNight: '110-240 €',
        occupancy: 68,
        description:
          "Village à 15 min de Chamonix, départ Grands Montets (le freeride mythique) et Le Tour-Vallorcine. Clientèle freeride et ski-touring. Prix au m² légèrement plus accessibles (8 000-12 000 €). T2 dès 350 000 €.",
        roiBrut: '4,5 à 5,5 %',
      },
      {
        name: 'Les Houches',
        pricePerNight: '95-200 €',
        occupancy: 65,
        description:
          "Commune voisine de Chamonix (10 min), domaine ski-débutants/intermédiaires Les Houches-Saint-Gervais. Famille et budgets plus accessibles. Prix au m² 6 000-9 000 €. T2 dès 280 000 €. Réglementation : 1 seule autorisation par personne physique (comme Chamonix).",
        roiBrut: '5 à 6 %',
      },
      {
        name: 'Vallorcine / Servoz (vallée)',
        pricePerNight: '85-160 €',
        occupancy: 55,
        description:
          "Communes voisines à 20-30 min de Chamonix. Servoz autorise 2 autorisations par personne physique. Vallorcine reste sans limitation (mais autorisation annuelle). Bonne option pour échapper aux restrictions chamoniardes. Maison T3 dès 350 000 €.",
        roiBrut: '5 à 6,5 %',
      },
      {
        name: 'Saint-Gervais-les-Bains (20 min)',
        pricePerNight: '90-180 €',
        occupancy: 60,
        description:
          "Station thermale et ski Mont-Blanc Unlimited à 20 min de Chamonix. Mix tourisme thermal (été) + ski (hiver). Tickets d'achat plus accessibles. T2 dès 230 000 €.",
        roiBrut: '5,5 à 6,5 %',
      },
    ],
    regulation:
      "Chamonix-Mont-Blanc applique depuis le **1er mai 2025** la réglementation la plus stricte des stations de montagne françaises pour les meublés de tourisme — un dispositif pionnier mobilisé par la mairie face à la pression locative qui a presque doublé en 4 ans (2 700 → 4 000 biens dans la vallée).\n\n**Autorisation de changement d'usage limitée.** À Chamonix-Mont-Blanc et aux Houches, **1 seule autorisation de changement d'usage par personne physique** est délivrée pour les meublés de tourisme. À Servoz, 2 autorisations par personne physique. À Vallorcine, pas de limitation du nombre de biens, mais l'autorisation reste annuelle. À partir du **1er mai 2026**, les personnes morales (sociétés) sont également soumises à ces limitations.\n\n**Enregistrement Declaloc.** Tout meublé de tourisme doit être enregistré via le téléservice national (apimeubles.finances.gouv.fr ou via le portail mutualisé valleedechamonix.declaloc.fr). Un numéro d'enregistrement à 13 chiffres doit figurer sur chaque annonce Airbnb, Booking ou Abritel.\n\n**Résidence principale.** Limite nationale de **120 nuitées par an** pour la location en résidence principale (celle que vous occupez au moins 8 mois par an).\n\n**Loi Le Meur 2024.** Le DPE classe E minimum est obligatoire (classe D à partir de 2034), et l'abattement micro-BIC est passé à 30 % pour les meublés non classés (50 % pour les classés tourisme). Les biens classés F ou G au DPE sont interdits à la location courte durée. Amendes : **10 000 € pour défaut d'enregistrement**, **20 000 € pour fausse déclaration ou numéro falsifié**.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** La Communauté de Communes de la Vallée de Chamonix-Mont-Blanc applique une taxe additionnelle classement-dépendante : de 1,10 € à 5,30 € par nuit et par personne (taux les plus élevés du marché alpin), collectée automatiquement par Airbnb.",
    concreteExample: {
      bienType: 'T2',
      surface: 45,
      pricePerNight: 180,
      neighborhood: 'Chamonix centre',
      revenuBrut: 42000,
      commissionRate: 0.20,
      menageCount: 65,
      menageUnitCost: 95,
    },
    extraFaq: [
      {
        q: 'Peut-on encore acheter un appartement à Chamonix pour le mettre en Airbnb en 2026 ?',
        a: "Oui, mais avec de fortes restrictions. Depuis le 1er mai 2025, Chamonix-Mont-Blanc et Les Houches limitent à 1 seule autorisation de changement d'usage par personne physique pour les meublés de tourisme : vous ne pouvez détenir qu'un seul bien dédié au LCD sur ces deux communes. Au 1er mai 2026, les sociétés (personnes morales) sont également soumises à cette limitation. Si vous visez plusieurs biens LCD dans la vallée, regardez Servoz (2 autorisations) ou Vallorcine (sans limitation, autorisation annuelle). Pour un seul bien LCD à Chamonix, le marché reste viable : les rendements bruts oscillent entre 4 et 6 % selon le quartier, avec un revenu annuel moyen de 35 000 à 60 000 € pour un T2 bien placé en centre ou aux Praz.",
      },
      {
        q: 'Combien rapporte un Airbnb à Chamonix pendant la haute saison hiver ?',
        a: "La haute saison hiver chamoniarde s'étale de mi-décembre à mi-avril avec un pic absolu pendant les vacances scolaires (Noël/Nouvel An, février européen et britannique, vacances de Pâques). Un T2 en centre qui se loue 180 €/nuit en moyenne annuelle atteint 280-380 €/nuit pendant les vacances de Noël/Nouvel An et Pâques, avec une semaine complète obligatoire (samedi-samedi). Sur 4 mois de haute saison hiver, un T2 bien placé peut générer 18 000 à 28 000 € bruts, soit 60-70 % du chiffre d'affaires annuel. L'Ultra-Trail du Mont-Blanc fin août ajoute un pic ponctuel exceptionnel (+150 à +300 % sur 10 jours).",
      },
      {
        q: 'Quels quartiers privilégier pour investir en LCD à Chamonix ?',
        a: "Pour un objectif rentabilité maximale, le quartier Argentière / Le Tour est le meilleur compromis : prix au m² plus accessibles (8 000-12 000 €), clientèle freeride et ski-touring, ROI brut 4,5-5,5 %. Chamonix Centre offre les meilleurs tarifs nuitée (120-280 €) mais avec un ticket d'entrée plus élevé (>450 000 € pour un T2). Les Praz et Le Lavancher sont réservés aux profils patrimoniaux haut de gamme (chalet > 1 M€, clientèle internationale premium). Pour échapper à la restriction d'1 autorisation par personne, regarder Servoz (2 autorisations), Vallorcine (sans limitation), ou Saint-Gervais à 20 min.",
      },
    ],
    updatedAt: '2026-05-27',
  },
  // ==========================================================================
  // TOURS
  // ==========================================================================
  {
    slug: 'tours',
    displayName: 'Tours',
    region: 'Centre-Val de Loire',
    regionSlug: 'centre-val-de-loire',
    title: 'Conciergerie Tours Airbnb : comparatif 2026 des 7 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Tours : Comparatif 2026',
    metaDescription:
      'Comparatif des 7 meilleures conciergeries Airbnb à Tours et Amboise. Tarifs (18-25 %), services, avis Google, réglementation 2026, quartiers rentables (Vieux-Tours, Plumereau).',
    kwPrincipal: 'conciergerie tours',
    kwSecondaires: [
      'conciergerie airbnb tours',
      'conciergerie amboise',
      'location courte durée tours',
      'gestion locative tours',
      'meublé touristique tours',
      'conciergerie indre-et-loire',
    ],
    population: 137000,
    tourists: 5000000,
    activeListings: 1300,
    priceLow: 50,
    priceHigh: 110,
    occupancyRate: 65,
    revpar: 45,
    seasonality:
      "Saisonnalité tirée par les châteaux de la Loire (1er site touristique régional). Pic absolu avril à septembre (occupation 75-85 %, vacances scolaires françaises et européennes, mariages au château). Pics ponctuels : Festival international des Jardins de Chaumont-sur-Loire (avril-novembre), Vitiloire en mai, Festival de l'Histoire à Chinon. Tourisme d'affaires régulier en semaine (Tours Métropole, université, hôpital Trousseau, Stade rennais en déplacement) qui lisse l'occupation hors saison. Creux marqué décembre-février (occupation 40-50 %) à l'exception des marchés de Noël.",
    rankNational: 25,
    introCustom:
      "Vous avez un appartement à **Tours**, en plein Vieux-Tours autour de la place Plumereau, ou à proximité d'Amboise, que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée.\n\nEntre les **5 millions de visiteurs annuels** des châteaux de la Loire (Chenonceau, Chambord, Amboise, Villandry, Azay-le-Rideau), la **nouvelle obligation d'enregistrement Declaloc au 20 mai 2026**, et la dizaine d'acteurs locaux qui se partagent un marché de **1 300 annonces actives**, vous vous demandez si confier la gestion à une conciergerie est vraiment rentable.\n\nEt surtout : **laquelle choisir** entre Vieux-Tours, Cathédrale et la couronne touristique Amboise/Loches ?",
    marketIntro:
      "Tours est le **premier marché LCD du Centre-Val de Loire** avec environ **1 300 annonces actives** et un revenu moyen par annonce autour de 14 000-18 000 €/an. La ville bénéficie d'un mix unique : **châteaux de la Loire** (Chenonceau, Chambord à 1h, Amboise à 25 min, Villandry, Azay-le-Rideau, Loches), **patrimoine UNESCO** (Val de Loire entre Sully-sur-Loire et Chalonnes), **vins de Loire** (Vouvray, Chinon, Bourgueil, Saint-Nicolas-de-Bourgueil) et **TGV 1h05 de Paris-Montparnasse** (un atout majeur pour le week-end).\n\nLa **région Centre-Val de Loire accueille plus de 5 millions de visiteurs annuels** sur les châteaux et le val classé UNESCO. Tours capte une part significative de ce flux comme **base d'hébergement régionale** : le tarif moyen nuitée est de **56-83 €** (source AirDNA) — un niveau accessible qui ouvre le marché à une clientèle familiale et seniors.\n\nLe **tourisme d'affaires Tours Métropole** (université, hôpital Trousseau, Tours Évènements, Polytech) ajoute une demande régulière en semaine. La **place Plumereau** dans le Vieux-Tours est l'une des plus animées de France (bars, restaurants, vie nocturne) — un atout pour la clientèle 25-40 ans en week-end.\n\n**Tours n'est pas en zone tendue dure** au sens du décret n°2023-822 (moins de 200 000 habitants stricts), mais l'enregistrement Declaloc est obligatoire au plus tard le **20 mai 2026** et la résidence secondaire dédiée LCD nécessite une autorisation de changement d'usage à vérifier directement auprès de la mairie.",
    conciergeries: [
      {
        name: 'Louloue Tours',
        url: 'https://louloue.com/louloue-tours/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 1.6,
        reviews: 5,
        biensGeres: 130,
        specialty: 'Volume Touraine, full A-Z management',
        description:
          "Louloue est le leader volumique de la Touraine avec plus de 130 biens gérés à Tours, Amboise et Poitiers. Commission 20 % TTC, ménage refacturé au voyageur. Gestion full A-Z : création annonce, photos pro, diffusion multi-plateformes, pricing dynamique, accueil voyageurs, ménage pro, linge hôtelier, maintenance et reporting financier mensuel. Pertinente pour un propriétaire multi-biens entre Tours, Amboise et Île-de-France qui veut un interlocuteur unique sur la chaîne Loire / Paris.",
      },
      {
        name: 'PrestiPlace',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 129,
        biensGeres: 75,
        specialty: 'Haut de gamme spécialisé LCD',
        description:
          "Tarification sur devis adaptée au niveau de service premium : photos pro, fournitures d'accueil signées, accueil multilingue, gestion fine de la communication voyageurs. Pertinente pour un T2-T3 dans le Vieux-Tours, Cathédrale ou Plumereau, ou pour un bien de charme à proximité d'Amboise.",
      },
      {
        name: 'GTH Conciergerie',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.4,
        reviews: 85,
        biensGeres: 65,
        specialty: 'Solutions personnalisées propriétaire/locataire',
        description:
          "GTH Conciergerie propose des services de conciergerie et gestion locative personnalisés à Tours et alentours. Approche assumée de l'accompagnement client : interlocuteur dédié, transparence du reporting, ajustements personnalisés selon le bien. Pertinente pour un propriétaire qui valorise une relation suivie plutôt qu'un service standardisé.",
      },
      {
        name: 'Pillow and Paw',
        url: 'https://pillowandpaw.com/',
        commission: '22 %',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 12,
        biensGeres: 20,
        specialty: 'Pet-friendly Tours et Amboise',
        description:
          "Pillow and Paw se positionne sur le segment de niche pet-friendly à Tours et Amboise : biens acceptant les animaux, fournitures d'accueil animaux (gamelles, panier, sachets), partenariats avec vétérinaires et pet-sitters locaux. Le segment pet-friendly capte 20-25 % de la demande Airbnb sans concurrencer la majorité des biens classiques — une niche très rentable pour un propriétaire de chalet ou maison avec jardin.",
      },
      {
        name: 'Les Clés de Touraine',
        url: 'https://www.lesclesdetouraine.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 30,
        specialty: '3 piliers : sécurité, qualité, rentabilité',
        description:
          "Les Clés de Touraine, fondée en 2019, structure son offre autour de 3 piliers explicites : sécurité du bien, qualité de service voyageur, rentabilité pour le propriétaire. Particularité : sélection volontairement limitée des biens gérés (qualité plutôt que volume) selon leur emplacement, leur charme et leur attractivité touristique/professionnelle. Commission 20 % TTC. Pertinente pour un bien de caractère en Vieux-Tours, autour de la Cathédrale ou sur les bords de Loire.",
      },
      {
        name: 'Éloge Touraine',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 18,
        specialty: 'Luxe et patrimoine, approche châteaux',
        description:
          "Approche dédiée aux biens de caractère : ancien rénové, hôtels particuliers, gîtes près des châteaux. Coordination avec les acteurs touristiques régionaux (visites privées de château, dégustations vins de Loire, gastronomie). Pertinente pour un propriétaire d'un bien atypique haut de gamme à Tours, Amboise ou en couronne château.",
      },
      {
        name: 'Coderi',
        commission: '25 %',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 22,
        specialty: 'Focus culture locale, expérience voyageur',
        description:
          "Coderi applique une commission de 25 % HT — légèrement au-dessus de la moyenne tourangeau — justifiée par une approche centrée sur la culture locale : guides personnalisés, partenariats avec restaurants et caves de Vouvray/Chinon, expériences exclusives. Pertinente pour un propriétaire qui valorise une expérience voyageur premium (note Airbnb plus haute → meilleur classement → meilleur taux d'occupation) plutôt qu'une commission basse.",
      },
    ],
    neighborhoods: [
      {
        name: 'Vieux-Tours / Place Plumereau',
        pricePerNight: '75-130 €',
        occupancy: 75,
        description:
          "Cœur historique autour de la place Plumereau (maisons à colombages, terrasses, vie nocturne), rue Colbert, basilique Saint-Martin. Le plus prisé pour le LCD touristique. Clientèle 100 % touristique avec rotation rapide (2-3 nuits). T2 à partir de 200 000 €.",
        roiBrut: '5 à 6 %',
      },
      {
        name: 'Cathédrale Saint-Gatien',
        pricePerNight: '70-115 €',
        occupancy: 70,
        description:
          "Quartier autour de la cathédrale Saint-Gatien (gothique), musée des Beaux-Arts, château de Tours. Calme, charme historique, demande lissée tourisme + culturel. T2 à partir de 180 000 €.",
        roiBrut: '5,5 à 6,5 %',
      },
      {
        name: 'Prébendes / Verdun',
        pricePerNight: '60-95 €',
        occupancy: 60,
        description:
          "Quartiers résidentiels au sud du centre, autour du jardin des Prébendes (Art Nouveau). Mix tourisme + résidentiel cadres. Tickets d'achat accessibles. T2 dès 160 000 €.",
        roiBrut: '6 à 7 %',
      },
      {
        name: 'Rive gauche / Saint-Cyr-sur-Loire',
        pricePerNight: '60-100 €',
        occupancy: 58,
        description:
          "Rive nord de la Loire, Saint-Cyr-sur-Loire et Tours-Nord. Demande mixte tourisme + tourisme d'affaires (Polytech, ZA Nord). Tickets d'achat les plus bas du périmètre central. T2 dès 140 000 €.",
        roiBrut: '6,5 à 7,5 %',
      },
      {
        name: 'Berthelot / Halles',
        pricePerNight: '65-110 €',
        occupancy: 65,
        description:
          "Quartier autour des Halles centrales et de la rue Berthelot, à 5 min à pied de Plumereau. Excellent compromis charme historique + tickets accessibles. T2 dès 175 000 €.",
        roiBrut: '5,5 à 6,5 %',
      },
      {
        name: 'Amboise / Couronne Loire (25 min)',
        pricePerNight: '90-180 €',
        occupancy: 65,
        description:
          "Communes touristiques à 20-30 min de Tours : Amboise (château royal, Clos Lucé Léonard de Vinci), Vouvray, Montlouis-sur-Loire. Demande touristique forte et saisonnalité avril-octobre marquée. Maison T3 dès 240 000 €. Gîte rural haut de gamme jusqu'à 300 €/nuit en haute saison.",
        roiBrut: '5,5 à 6,5 %',
      },
    ],
    regulation:
      "Tours **n'est pas classée en zone tendue dure** au sens du décret n°2023-822 (moins de 200 000 habitants stricts), ce qui laisse aujourd'hui une marge de manœuvre plus large pour les loueurs que les grandes métropoles. Néanmoins, l'enregistrement Declaloc et la déclaration mairie restent obligatoires, et la mairie peut à tout moment instaurer le numéro d'enregistrement obligatoire et l'autorisation de changement d'usage si la pression locative s'accentue.\n\n**Enregistrement Declaloc.** L'enregistrement national via téléservice unique (apimeubles.finances.gouv.fr) est obligatoire au plus tard le **20 mai 2026** avec un numéro à 13 chiffres à faire figurer sur chaque annonce Airbnb, Booking ou Abritel. Sans numéro après l'entrée en vigueur, l'annonce est automatiquement désactivée par les plateformes.\n\n**Résidence principale.** La location en meublé de tourisme reste plafonnée à **120 nuitées par an** au niveau national pour la résidence principale (celle que vous occupez au moins 8 mois par an).\n\n**Résidence secondaire dédiée LCD.** Selon la délibération en vigueur à la date de votre projet, un changement d'usage peut être exigé. À vérifier directement auprès de la direction de l'urbanisme de Tours avant tout investissement.\n\n**Loi Le Meur 2024.** Le DPE classe E minimum est obligatoire (classe D à partir de 2034), et l'abattement micro-BIC est passé à 30 % pour les meublés non classés (50 % pour les classés tourisme). Les biens classés F ou G au DPE sont interdits à la location courte durée. Amendes : **10 000 € pour défaut d'enregistrement**, **20 000 € pour fausse déclaration ou numéro falsifié**.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** Tours Métropole Val de Loire applique une taxe de séjour intercommunale : de 0,65 € à 4,30 € par nuit et par personne selon le classement de l'hébergement, collectée automatiquement par Airbnb.",
    concreteExample: {
      bienType: 'T2',
      surface: 40,
      pricePerNight: 80,
      neighborhood: 'Vieux-Tours',
      revenuBrut: 17600,
      commissionRate: 0.20,
      menageCount: 80,
      menageUnitCost: 55,
    },
    extraFaq: [
      {
        q: 'Faut-il un numéro d\'enregistrement pour louer en Airbnb à Tours en 2026 ?',
        a: "Oui. À partir du 20 mai 2026, tout loueur (résidence principale ou secondaire) doit obtenir un numéro d'enregistrement à 13 chiffres via le téléservice national Declaloc (apimeubles.finances.gouv.fr) ou auprès de la mairie, et le faire figurer sur chaque annonce Airbnb, Booking ou Abritel. Tours n'est pas en zone tendue dure (moins de 200 000 habitants stricts), donc pas d'obligation actuelle d'autorisation de changement d'usage pour la résidence secondaire — mais cette situation peut évoluer si la mairie délibère, à vérifier directement auprès de la direction de l'urbanisme.",
      },
      {
        q: 'Combien rapporte un Airbnb à Tours pendant la haute saison châteaux ?',
        a: "La haute saison tourangelle s'étale d'avril à septembre, avec un pic absolu juillet-août (vacances scolaires, châteaux de la Loire ouverts, festivals). Un T2 dans le Vieux-Tours qui se loue 80 €/nuit en moyenne annuelle atteint 110-150 €/nuit pendant ces deux mois, avec une occupation 80-90 % et un minimum 2-3 nuits imposé. Les événements comme Vitiloire en mai, le Festival des Jardins de Chaumont (avril-nov) ou les mariages au château ajoutent des pics tarifaires (+30 à +50 %). Sur l'année complète, un T2 bien placé en Vieux-Tours génère 14 000 à 22 000 € bruts (avant commission).",
      },
      {
        q: 'Quels quartiers privilégier pour investir en LCD à Tours ?',
        a: "Pour un objectif rentabilité + sécurité, le quartier Cathédrale Saint-Gatien est le meilleur compromis : centre historique calme, demande lissée tourisme + culturel, T2 à partir de 180 000 € et ROI brut 5,5-6,5 %. Le Vieux-Tours / Plumereau offre les meilleurs tarifs nuitée (75-130 €) mais avec un ticket d'entrée plus élevé (>200 000 €). Pour un profil cashflow agressif, viser Rive gauche / Saint-Cyr (tickets dès 140 000 €, ROI brut 6,5-7,5 %). Pour un profil tourisme château, regarder Amboise à 25 min : gîtes ruraux et maisons de caractère, saisonnalité avril-octobre très marquée.",
      },
    ],
    updatedAt: '2026-05-27',
  },
  // ==========================================================================
  // METZ
  // ==========================================================================
  {
    slug: 'metz',
    displayName: 'Metz',
    region: 'Grand Est',
    regionSlug: 'alsace',
    title: 'Conciergerie Metz Airbnb : comparatif 2026 des 5 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Metz : Comparatif 2026 (tarifs & avis)',
    metaDescription:
      'Comparatif des 5 meilleures conciergeries Airbnb à Metz. Tarifs (15-22 %), services, avis Google, réglementation 2026, quartiers rentables (Sablon, Outre-Seille, Centre).',
    kwPrincipal: 'conciergerie metz',
    kwSecondaires: [
      'conciergerie airbnb metz',
      'conciergerie moselle',
      'location courte durée metz',
      'meublé courte durée metz',
      'airbnb metz',
    ],
    population: 120000,
    tourists: 1300000,
    activeListings: 900,
    priceLow: 50,
    priceHigh: 95,
    occupancyRate: 62,
    revpar: 45,
    seasonality:
      "Saisonnalité tirée par les événements et le tourisme culturel. Pic absolu décembre avec le Marché de Noël de Metz (l'un des plus visités de France, 2,5 millions de visiteurs en moyenne), occupation 80-90 % et tarifs 1,5-2× la normale. Pic secondaire mai à septembre porté par le Centre Pompidou-Metz, le Festival Constellations (mappings vidéo gratuits juin-septembre), Mirabelle Festival fin août. Tourisme d'affaires régulier en semaine (UE Luxembourg à 1h, Saarbrücken à 50 min) qui lisse l'occupation toute l'année. Creux marqué janvier-février (occupation 40-45 %).",
    rankNational: 27,
    introCustom:
      "Vous avez un appartement à **Metz**, en plein centre près de la cathédrale Saint-Étienne, dans le quartier dynamique du Sablon, ou à proximité de la gare TGV, que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée.\n\nEntre le **Marché de Noël qui draine 2,5 millions de visiteurs en décembre**, le **Centre Pompidou-Metz** qui attire un tourisme culturel toute l'année, la **proximité du Luxembourg** (siège européen à 1h, attractif pour la clientèle business multilingue), et la dizaine d'acteurs locaux qui se partagent un marché d'environ **900 annonces actives**, vous vous demandez si confier la gestion à une conciergerie est vraiment rentable.\n\nEt surtout : **laquelle choisir** entre Metz Centre, Sablon, Outre-Seille et la couronne Thionville/Nancy ?",
    marketIntro:
      "Metz est le **deuxième marché LCD du Grand Est** derrière Strasbourg, avec environ **900 annonces actives** et un revenu moyen par annonce de l'ordre de **15 500 €/an** (source EstimOpti). La ville bénéficie d'un mix unique : **cathédrale Saint-Étienne** (3e plus grande de France, 6 500 m² de vitraux), **Centre Pompidou-Metz** (350 000-400 000 visiteurs annuels), **Marché de Noël** classé parmi les plus visités d'Europe, et **position stratégique** au cœur de la Grande Région (Luxembourg, Sarre, Belgique à moins d'une heure).\n\nLa **clientèle est mixte** : tourisme culturel européen (Allemands, Belges, Luxembourgeois, Néerlandais), tourisme d'affaires (Eurométropole de Metz, université de Lorraine, BLIIIDA campus innovation), tourisme événementiel (Marché de Noël, Mirabelle Festival, festival Constellations). Le **tarif moyen nuitée est de 50-75 €** (source AirDNA) avec des pics à 130-160 € en décembre (Marché de Noël) et juillet-août (clientèle européenne).\n\n**Metz n'est pas en zone tendue dure** au sens du décret n°2023-822, ce qui laisse aux loueurs une marge de manœuvre plus large que les grandes métropoles : **pas d'autorisation de changement d'usage obligatoire**, **pas de plafond de 90 nuitées**, **pas de quota communal**. La déclaration en mairie via formulaire 14004 reste obligatoire et délivre le numéro à 13 chiffres requis sur chaque annonce.",
    conciergeries: [
      {
        name: 'Rock in Share',
        url: 'https://www.rock-in-share.com/fr/',
        commission: 'sur devis (~20 %)',
        menage: 'refacturé voyageur',
        rating: 4.5,
        reviews: 125,
        biensGeres: 120,
        specialty: 'Volume Grand Est, multi-villes',
        description:
          "Rock in Share est l'acteur volumique de référence sur l'axe Metz/Nancy/Thionville/Strasbourg avec expansion vers Luxembourg, Paris et Gérardmer. Couverture complète : photos pro, diffusion multi-plateformes (Airbnb, Booking, Abritel, Expedia, VRBO, Leboncoin), accueil voyageurs, ménage hôtelier, linge, pricing dynamique. Pertinente pour un propriétaire multi-biens sur la Grande Région qui veut un interlocuteur unique sur l'axe Metz/Nancy/Thionville/Luxembourg.",
      },
      {
        name: "Un Séjour à Metz",
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 4.6,
        reviews: 212,
        biensGeres: 25,
        specialty: 'Appartements meublés tout équipés, événementiel',
        description:
          "Un Séjour à Metz cible le segment appartements meublés tout équipés à Metz centre. Spécialité : privatisation d'immeubles pour événements (jusqu'à 15 personnes), conciergerie pour gîtes urbains de plus de 100 m². Approche personnalisée et présence de proximité, particulièrement adaptée aux propriétaires d'un seul bien atypique à Metz centre (grand T3-T4, plateau loft, appartement de standing).",
      },
      {
        name: 'Vigelio',
        url: 'https://www.vigelio.fr/',
        commission: '20 % TTC',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 30,
        specialty: 'Multi-départements 57/54/55, axe Luxembourg',
        description:
          "Vigelio applique une commission fixe de 20 % TTC sur les revenus collectés, calculée après déduction des frais plateforme et ménage. Couverture : Moselle (57), Meurthe-et-Moselle (54), Meuse (55) sur l'axe Nancy/Metz/Luxembourg. Services complets : création annonce, accueil voyageurs, maintenance, petites réparations, optimisation taux d'occupation sur Airbnb/Booking/Abritel. Pertinente pour un propriétaire qui valorise la transparence tarifaire (20 % fixe, pas de surprise) et une couverture transfrontalière.",
      },
      {
        name: 'Vahine Conciergerie',
        url: 'https://vahine-conciergerie.fr/conciergerie-airbnb-metz/',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 13,
        biensGeres: 15,
        specialty: 'Hôtellerie de luxe, standards 5 étoiles',
        description:
          "Vahine Conciergerie est fondée par Mélissa, professionnelle issue de l'hôtellerie de luxe. Particularité : suivi personnalisé, contrôle qualité strict avec standards hôteliers, communication voyageurs 7/7, check-in/check-out professionnels, optimisation taux d'occupation. Pertinente pour un propriétaire d'un bien de standing (T3+ centre, Sablon premium) qui veut une exécution hôtelière plutôt qu'un service industriel.",
      },
      {
        name: 'Cledici',
        url: 'https://cledici.fr/conciergerie-metz/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.6,
        reviews: 24,
        biensGeres: 18,
        specialty: 'Biens de prestige, présence internationale',
        description:
          "Cledici se positionne sur le segment LCD de prestige avec plus de 5 ans d'expérience à Metz et à Villeurbanne. Commission 20 % TTC sur les revenus. Services premium : gestion complète, stratégie pricing optimisée, visibilité plateformes, partenaires locaux sélectionnés. Pertinente pour un propriétaire d'un bien haut de gamme (T3-T4 centre, appartement de standing Sablon-Amphithéâtre) qui valorise un service patrimonial plutôt qu'un volume de transactions.",
      },
    ],
    neighborhoods: [
      {
        name: 'Metz Centre / Cathédrale',
        pricePerNight: '70-130 €',
        occupancy: 70,
        description:
          "Cœur historique autour de la cathédrale Saint-Étienne, place Saint-Louis (arcades médiévales), rue Serpenoise (commerces), Centre Pompidou-Metz à proximité. Le plus prisé pour le LCD touristique. Clientèle 70 % touristique avec rotation rapide (2-3 nuits). T2 à partir de 200 000 €.",
        roiBrut: '5 à 6 %',
      },
      {
        name: 'Sablon / Amphithéâtre',
        pricePerNight: '55-90 €',
        occupancy: 65,
        description:
          "Quartier moderne autour du Centre Pompidou-Metz, gare TGV et amphithéâtre. Prix au m² 2 320-2 500 €. Mix tourisme culturel + tourisme d'affaires (TGV 1h22 Paris). Le meilleur compromis prix d'achat / rendement à Metz. T2 dès 130 000 €.",
        roiBrut: '6,5 à 7,5 %',
      },
      {
        name: 'Outre-Seille',
        pricePerNight: '60-100 €',
        occupancy: 65,
        description:
          "Quartier patrimonial à l'est de la Moselle : musées Cour d'Or, conservatoire, théâtre, archives municipales. Demande culturelle lissée. Charme historique préservé. T2 à partir de 170 000 €.",
        roiBrut: '5,5 à 6,5 %',
      },
      {
        name: 'Île du Saulcy / Pontiffroy',
        pricePerNight: '55-85 €',
        occupancy: 60,
        description:
          "Quartiers résidentiels au nord, autour de l'université du Saulcy et du port. Mix tourisme + étudiants Erasmus (bail mobilité). Tickets d'achat parmi les plus accessibles. T2 dès 140 000 €.",
        roiBrut: '6 à 7 %',
      },
      {
        name: 'Queuleu / Plantières',
        pricePerNight: '50-85 €',
        occupancy: 55,
        description:
          "Quartiers résidentiels au sud-est, proche du parc de la Seille. Demande mixte cadres + tourisme léger. Tickets d'achat bas. T2 dès 130 000 €. Préférer un emplacement proche du bus mettis pour assurer l'accessibilité centre.",
        roiBrut: '6,5 à 7,5 %',
      },
      {
        name: 'Devant-les-Ponts / Lothaire',
        pricePerNight: '55-90 €',
        occupancy: 60,
        description:
          "Quartier au nord du centre, rénové récemment autour de la place de la République. Proximité immédiate du centre historique (10 min à pied). Tickets d'achat accessibles. T2 dès 150 000 €.",
        roiBrut: '6 à 7 %',
      },
    ],
    regulation:
      "Metz **n'est pas classée en zone tendue dure** au sens du décret n°2023-822, ce qui laisse aujourd'hui une marge de manœuvre plus large pour les loueurs que les grandes métropoles. Aucune autorisation de changement d'usage n'est exigée pour la résidence secondaire dédiée au LCD, et aucun quota communal n'est en vigueur.\n\n**Déclaration en mairie obligatoire.** Pour se conformer à l'article L324-1-1 du code du tourisme et permettre la collecte automatique de la taxe de séjour par les plateformes, vous devez déclarer votre logement en mairie via le formulaire **Cerfa 14004**, qui délivre un numéro d'enregistrement spécifique à porter sur chaque annonce Airbnb, Booking ou Abritel.\n\n**Enregistrement Declaloc national au 20 mai 2026.** À cette date, le téléservice national unique (apimeubles.finances.gouv.fr) deviendra obligatoire. Sans numéro à 13 chiffres, les plateformes désactiveront automatiquement les annonces.\n\n**Résidence principale.** La location en meublé de tourisme reste plafonnée à **120 nuitées par an** au niveau national pour la résidence principale (celle que vous occupez au moins 8 mois par an).\n\n**Loi Le Meur 2024.** Le DPE classe E minimum est obligatoire (classe D à partir de 2034), et l'abattement micro-BIC est passé à 30 % pour les meublés non classés (50 % pour les classés tourisme). Les biens classés F ou G au DPE sont interdits à la location courte durée. Amendes : **10 000 € pour défaut d'enregistrement**, **20 000 € pour fausse déclaration ou numéro falsifié**.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** L'Eurométropole de Metz applique une taxe de séjour intercommunale, de 0,75 € à 4,30 € par nuit et par personne selon le classement de l'hébergement, collectée automatiquement par Airbnb depuis le 1er janvier 2026.",
    concreteExample: {
      bienType: 'T2',
      surface: 42,
      pricePerNight: 70,
      neighborhood: 'Sablon-Amphithéâtre',
      revenuBrut: 15800,
      commissionRate: 0.20,
      menageCount: 75,
      menageUnitCost: 45,
    },
    extraFaq: [
      {
        q: 'Faut-il un numéro d\'enregistrement pour louer en Airbnb à Metz en 2026 ?',
        a: "Oui. Toute mise en location meublée courte durée à Metz nécessite une déclaration préalable en mairie via le formulaire Cerfa 14004, qui délivre un numéro d'enregistrement à porter sur chaque annonce. À partir du 20 mai 2026, ce numéro deviendra à 13 chiffres via le téléservice national Declaloc (apimeubles.finances.gouv.fr). Sans ce numéro, les plateformes (Airbnb, Booking, Abritel) désactiveront automatiquement votre annonce. Metz n'est pas en zone tendue dure, donc pas d'obligation d'autorisation de changement d'usage pour la résidence secondaire dédiée au LCD — un avantage compétitif majeur par rapport à Strasbourg, Paris ou Bordeaux.",
      },
      {
        q: 'Combien rapporte un Airbnb à Metz pendant le Marché de Noël ?',
        a: "Le Marché de Noël de Metz (fin novembre à fin décembre, l'un des plus visités de France avec 2,5 millions de visiteurs) déclenche le pic absolu de la saisonnalité messine. Un T2 en centre qui se loue 70 €/nuit en moyenne annuelle atteint 130-180 €/nuit pendant les 5 semaines du marché, avec une occupation 90-95 % et un minimum 2-3 nuits imposé. Sur les 5 semaines, un T2 bien placé génère 4 000 à 6 500 € bruts — soit 30-40 % du chiffre d'affaires annuel. La clientèle est majoritairement allemande, belge, luxembourgeoise et néerlandaise, sensible à la qualité photos et au niveau d'équipement (clim, machine à laver, fibre).",
      },
      {
        q: 'Quels quartiers privilégier pour investir en LCD à Metz ?',
        a: "Pour un objectif rentabilité maximale, le Sablon-Amphithéâtre est le meilleur compromis : prix au m² 2 320-2 500 € (les plus accessibles du centre), proximité immédiate du Centre Pompidou-Metz et de la gare TGV, ROI brut 6,5-7,5 %. Metz Centre / Cathédrale offre les meilleurs tarifs nuitée (70-130 €) mais avec un ticket d'entrée plus élevé (>200 000 € pour un T2). Pour un profil cashflow agressif, viser Queuleu, Plantières ou Île du Saulcy (T2 dès 130-140 000 €, ROI brut 6,5-7,5 %). Pour échapper aux pics saisonniers (Marché de Noël surchargé), regarder Devant-les-Ponts ou Outre-Seille à 10 min du centre.",
      },
    ],
    updatedAt: '2026-05-27',
  },
  // ==========================================================================
  // NÎMES
  // ==========================================================================
  {
    slug: 'nimes',
    displayName: 'Nîmes',
    region: 'Occitanie',
    regionSlug: 'occitanie',
    title: 'Conciergerie Nîmes Airbnb : comparatif 2026 des 7 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Nîmes : Comparatif 2026 (tarifs & avis)',
    metaDescription:
      'Comparatif des 7 meilleures conciergeries Airbnb à Nîmes. Tarifs (17-24 %), services, avis Google, réglementation 2026, quartiers rentables (Écusson, Gambetta, Maison Carrée).',
    kwPrincipal: 'conciergerie nimes',
    kwSecondaires: [
      'conciergerie airbnb nimes',
      'conciergerie gard',
      'conciergerie nîmes',
      'meilleure conciergerie nimes',
      'tarif conciergerie nimes',
    ],
    population: 149000,
    tourists: 2000000,
    activeListings: 1500,
    priceLow: 55,
    priceHigh: 105,
    occupancyRate: 66,
    revpar: 50,
    seasonality:
      "Saisonnalité tirée par les arènes romaines et les événements taurins. Pic absolu en septembre lors de la Feria des Vendanges (occupation 95-100 %, tarifs 2-3× la normale, séjour minimum 3 nuits imposé). Autre pic majeur en mai-juin : Feria de Pentecôte (le rendez-vous taurin le plus suivi d'Europe avec 1 million de visiteurs sur 6 jours), suivi des Arènes Festival (concerts juillet-août) et du Festival de Nîmes. Tourisme culturel régulier d'avril à octobre (Maison Carrée UNESCO 2023, Arènes, Pont du Gard à 25 min). Creux marqué décembre-février (occupation 45-50 %).",
    rankNational: 22,
    introCustom:
      "Vous avez un appartement à **Nîmes**, en plein Écusson autour des Arènes ou de la Maison Carrée (inscrite UNESCO en 2023), ou à proximité du Pont du Gard, que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée.\n\nEntre la **Feria de Pentecôte qui draine 1 million de visiteurs en 6 jours**, la **Feria des Vendanges en septembre** (pic tarifaire 2-3× la normale), l'**enregistrement Declaloc obligatoire à partir du 20 mai 2026**, et la dizaine d'acteurs locaux qui se partagent un marché d'environ **1 500 annonces actives**, vous vous demandez si confier la gestion à une conciergerie est vraiment rentable.\n\nEt surtout : **laquelle choisir** entre Écusson, Gambetta et la couronne Pont du Gard ?",
    marketIntro:
      "Nîmes est le **deuxième marché LCD du Gard** après les communes balnéaires (Grau-du-Roi) et un des plus actifs d'Occitanie. La ville bénéficie d'un mix unique : **monuments romains exceptionnels** (Arènes, Maison Carrée inscrite UNESCO en 2023, Tour Magne), **Pont du Gard à 25 min** (1,5 million de visiteurs par an), **culture taurine** (Ferias de Pentecôte et des Vendanges parmi les plus suivies d'Europe), **TGV 3h de Paris** et **proximité Avignon, Montpellier, Arles** (axes de fréquentation croisés).\n\n**Tourisme** : Nîmes a enregistré près de **400 000 nuitées de janvier à avril 2026** (source Office de Tourisme), avec une clientèle à 50/50 française et étrangère (Allemands, Britanniques, Néerlandais, Italiens). Le **tarif moyen nuitée est de 65-95 €** (source AirDNA) avec des pics à 180-260 € lors des Ferias.\n\nLes **prix au m² à Nîmes restent accessibles** : 1 800-2 200 €/m² en Gambetta, 2 500-3 200 €/m² en Écusson, jusqu'à 3 800 €/m² sur les ilots les mieux placés (place de l'Horloge, rue de l'Aspic). Le **rendement brut LCD** se situe entre 5,5 et 7 % selon le quartier — supérieur à Montpellier (4,5-5 %) et Marseille (4,2-4,5 %).\n\n**Nîmes a instauré l'enregistrement Airbnb** depuis plusieurs années et figure dans la liste officielle des communes avec déclaration obligatoire. À partir du 20 mai 2026, le téléservice national Declaloc devient incontournable.",
    conciergeries: [
      {
        name: 'La Conciergerie du Croco',
        url: 'https://laconciergerieducroco.fr/',
        commission: '24 % TTC',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 110,
        biensGeres: 80,
        specialty: 'Volume Nîmes (30+ ans), full A-Z management',
        description:
          "La Conciergerie du Croco est l'acteur volumique de référence à Nîmes avec plus de 30 ans d'ancrage local. Commission 24 % TTC affichée publiquement (rare dans le métier). Couverture : Nîmes, Redessan, Langlade, Poulx, Remoulins, Gallargues, Le Grau du Roi. Services complets : création/optimisation annonces, communication voyageurs 7/7, ménage rigoureux, accueil personnalisé, pricing dynamique propriétaire. Pertinente pour un propriétaire qui valorise la transparence tarifaire et une couverture géographique large autour de Nîmes.",
      },
      {
        name: 'CB Conciergerie de Nîmes',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 45,
        specialty: 'Volume avis local + tarification flexible',
        description:
          "Tarification sur devis adaptée à la taille et à la typologie du bien. Services complets : annonces, accueil, ménage, communication voyageurs. Pertinente pour un propriétaire d'un T1-T3 standard qui cherche un acteur établi sans premium price.",
      },
      {
        name: 'Homa Conciergerie',
        url: 'https://www.homa-france.com/',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 36,
        biensGeres: 35,
        specialty: 'Premium turnkey, assistance 9h-21h 7/7',
        description:
          "Homa Conciergerie propose un service premium clé en main pour locations saisonnières. Services : création et optimisation annonces, communication voyageurs, check-in/check-out, ménage, linge, maintenance. Assistance disponible 9h-21h, 7 jours sur 7. Pertinente pour un propriétaire qui priorise l'expérience voyageur (note Airbnb plus haute → meilleur classement → meilleur taux d'occupation) plutôt qu'une commission basse.",
      },
      {
        name: 'Excellence En Provence',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 28,
        specialty: 'Provence + Nîmes, biens de caractère',
        description:
          "Excellence En Provence couvre l'axe Provence + Nîmes avec une approche dédiée aux biens de caractère (mas, demeures rénovées, appartements de standing en Écusson). Tarification sur devis adaptée au niveau de service premium. Pertinente pour un propriétaire d'un bien atypique haut de gamme à Nîmes Écusson ou en couronne provençale.",
      },
      {
        name: 'YourHostHelper Nîmes',
        url: 'https://yourhosthelper.com/en/conciergerie-nimes/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 5.0,
        reviews: 20,
        biensGeres: 40,
        specialty: 'Réseau national 20+ villes, photos & pricing dynamique',
        description:
          "Filiale de YourHostHelper (présent dans 20+ villes françaises), cette conciergerie mise sur l'optimisation du revenu via un pricing dynamique quotidien et des photos professionnelles incluses gratuitement au lancement. Commission 20 %, ménage refacturé voyageur. Le propriétaire bénéficie d'un dashboard avec prévisions de revenus. Moins adaptée aux biens atypiques ou de luxe, mais excellent sur les T1-T2 standards en centre-ville.",
      },
      {
        name: 'Concierge BB',
        url: 'https://www.conciergebb.fr/',
        commission: 'à partir de 17 %',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 12,
        specialty: 'Commission la plus basse du marché nîmois',
        description:
          "Concierge BB se positionne sur la commission la plus basse du marché nîmois (à partir de 17 %, vs 20-24 % chez la concurrence). Le modèle tient grâce à l'automatisation (messagerie voyageurs semi-auto, planning ménage algorithmique). Pertinente pour un propriétaire sensible au prix qui a déjà l'expérience LCD et n'a pas besoin de premium service.",
      },
      {
        name: 'LYS Conciergerie',
        url: 'https://www.lys-conciergerie.fr',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 4.6,
        reviews: 11,
        biensGeres: 18,
        specialty: 'Expertise locale Gard, tarifs compétitifs',
        description:
          "LYS Conciergerie se distingue par son expertise locale dans le Gard, sa rigueur et ses tarifs compétitifs. Services complets : préparation du bien, gestion des réservations, ménage, blanchisserie. Disponibilité réactive de l'équipe. Pertinente pour un propriétaire qui valorise un acteur 100 % local (vs réseaux nationaux) et une relation directe avec le gérant.",
      },
    ],
    neighborhoods: [
      {
        name: "Écusson / Maison Carrée / Arènes",
        pricePerNight: '85-150 €',
        occupancy: 75,
        description:
          "Cœur historique de Nîmes autour des Arènes romaines, de la Maison Carrée (UNESCO 2023) et de la place de l'Horloge. Le plus prisé pour le LCD touristique. Clientèle 80 % touristique avec rotation rapide (2-3 nuits). Prix au m² 2 500-3 800 €. T2 à partir de 220 000 €.",
        roiBrut: '5,5 à 6,5 %',
      },
      {
        name: 'Gambetta',
        pricePerNight: '60-100 €',
        occupancy: 65,
        description:
          "Quartier mixte familles + étudiants au nord-ouest de l'Écusson. Prix au m² 1 847 €/m² (l'un des plus accessibles de Nîmes). Mix tourisme + résidentiel cadres. T2 dès 140 000 €. Excellent compromis ticket d'achat / rendement.",
        roiBrut: '6,5 à 7,5 %',
      },
      {
        name: "Jean Jaurès / Hôtel de Ville",
        pricePerNight: '70-115 €',
        occupancy: 68,
        description:
          "Quartier autour du boulevard Jean Jaurès et de l'Hôtel de Ville. Demande lissée tourisme + culturel + business. T2 à partir de 180 000 €. Charme historique préservé.",
        roiBrut: '6 à 7 %',
      },
      {
        name: 'Richelieu / Carmes',
        pricePerNight: '65-105 €',
        occupancy: 62,
        description:
          "Quartiers résidentiels au sud-est, autour du quartier Richelieu et du jardin de la Fontaine. Mix tourisme + résidentiel cadres. Tickets d'achat accessibles. T2 dès 160 000 €.",
        roiBrut: '6 à 7 %',
      },
      {
        name: 'Mas de Mingue / Capouchiné',
        pricePerNight: '55-85 €',
        occupancy: 55,
        description:
          "Quartiers périphériques au sud, plus accessibles en tickets d'achat. Demande mixte tourisme + tourisme d'affaires. T2 dès 110 000 €. Préférer une localisation proche du tramway ou du bus pour assurer l'accessibilité au centre.",
        roiBrut: '7 à 8 %',
      },
      {
        name: 'Couronne Pont du Gard / Uzès (25 min)',
        pricePerNight: '95-180 €',
        occupancy: 65,
        description:
          "Communes touristiques à 20-30 min de Nîmes : Pont du Gard (1,5M visiteurs/an), Uzès (Duché médiéval), Vers-Pont-du-Gard, Castillon. Demande touristique forte et saisonnalité avril-octobre marquée. Mas et maisons de caractère à partir de 280 000 €.",
        roiBrut: '6 à 7 %',
      },
    ],
    regulation:
      "Nîmes figure dans la liste officielle des communes ayant instauré l'**enregistrement obligatoire** pour les meublés de tourisme depuis plusieurs années — un dispositif anticipé par rapport au cadre national. La mairie de Nîmes a annoncé en 2026 préparer un encadrement renforcé des logements Airbnb pour répondre à la pression sur le marché locatif intra-Écusson.\n\n**Enregistrement obligatoire.** Toute location meublée touristique doit être déclarée à la mairie, qui attribue un **numéro d'enregistrement à 13 caractères** à porter sur chaque annonce Airbnb, Booking ou Abritel.\n\n**Enregistrement Declaloc national au 20 mai 2026.** À cette date, le téléservice national unique (apimeubles.finances.gouv.fr) deviendra incontournable et l'absence de numéro déclenche la désactivation automatique des annonces par les plateformes.\n\n**Résidence principale.** Limite nationale de **120 nuitées par an** pour la location en résidence principale (celle que vous occupez au moins 8 mois par an).\n\n**Résidence secondaire dédiée LCD.** Selon la délibération à la date de votre projet, un changement d'usage peut être exigé (mairie préparant un encadrement renforcé en 2026). À vérifier directement auprès de la direction de l'urbanisme avant tout investissement.\n\n**Loi Le Meur 2024.** Le DPE classe E minimum est obligatoire (classe D à partir de 2034), et l'abattement micro-BIC est passé à 30 % pour les meublés non classés (50 % pour les classés tourisme). Les biens classés F ou G au DPE sont interdits à la location courte durée. Amendes : **10 000 € pour défaut d'enregistrement**, **20 000 € pour fausse déclaration ou numéro falsifié**.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** La ville de Nîmes applique une taxe de séjour de 0,75 € à 5 € par nuit et par personne adulte selon le classement de l'hébergement, **plus une taxe additionnelle de 10 % au profit du Conseil départemental du Gard** — un dispositif spécifique à surveiller.",
    concreteExample: {
      bienType: 'T2',
      surface: 42,
      pricePerNight: 80,
      neighborhood: 'Gambetta',
      revenuBrut: 19200,
      commissionRate: 0.20,
      menageCount: 80,
      menageUnitCost: 50,
    },
    extraFaq: [
      {
        q: 'Quel impact des Ferias de Nîmes sur la rentabilité Airbnb ?',
        a: "Les Ferias de Pentecôte (mai-juin) et des Vendanges (septembre) sont les deux pics absolus de la saisonnalité nîmoise. Sur les 6 jours de la Feria de Pentecôte (1 million de visiteurs), un T2 en Écusson qui se loue 90 €/nuit en moyenne annuelle atteint 220-320 €/nuit avec un séjour minimum 3-4 nuits imposé. La Feria des Vendanges (septembre) génère un pic similaire sur 4-5 jours. À elles deux, les Ferias peuvent représenter 15-20 % du chiffre d'affaires annuel d'un T2 bien placé en Écusson. Veillez aux conditions de copropriété : certaines copropriétés limitent ou interdisent la sous-location pendant les Ferias en raison du niveau sonore.",
      },
      {
        q: 'Faut-il une autorisation de changement d\'usage à Nîmes en 2026 ?',
        a: "À ce jour, Nîmes n'impose pas systématiquement d'autorisation de changement d'usage pour la résidence secondaire dédiée au LCD — la ville n'est pas classée en zone tendue dure au sens du décret n°2023-822. Toutefois, la mairie a annoncé en 2026 préparer un encadrement renforcé pour répondre à la pression sur le marché locatif intra-Écusson. La situation peut donc évoluer rapidement. Avant tout investissement, vérifiez directement auprès de la direction de l'urbanisme de la mairie si votre projet est réalisable dans le quartier visé.",
      },
      {
        q: 'Quels quartiers privilégier pour investir en LCD à Nîmes ?',
        a: "Pour un objectif rentabilité maximale, Gambetta est le meilleur compromis : prix au m² 1 847 € (le plus accessible du périmètre central), demande mixte tourisme + cadres, ROI brut 6,5-7,5 %. L'Écusson / Maison Carrée offre les meilleurs tarifs nuitée (85-150 €) mais avec un ticket d'entrée plus élevé (>220 000 € pour un T2). Pour un profil cashflow agressif, viser Mas de Mingue ou Capouchiné (T2 dès 110 000 €, ROI brut 7-8 %), à condition d'être bien desservi en transports. Pour un profil tourisme premium, regarder Uzès ou la couronne Pont du Gard : mas et demeures de caractère, saisonnalité avril-octobre très marquée, tarifs nuitée 95-180 €.",
      },
    ],
    updatedAt: '2026-05-27',
  },
  // ==========================================================================
  // SÈTE
  // ==========================================================================
  {
    slug: 'sete',
    displayName: 'Sète',
    region: 'Occitanie',
    regionSlug: 'occitanie',
    title: 'Conciergerie Sète Airbnb : comparatif 2026 des 7 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Sète : Comparatif 2026 (tarifs & avis)',
    metaDescription:
      'Comparatif des 7 meilleures conciergeries Airbnb à Sète. Tarifs (18-25 %), services, avis Google, réglementation 2026, quartiers rentables (Mont-Saint-Clair, Pointe Courte, Centre).',
    kwPrincipal: 'conciergerie sete',
    kwSecondaires: [
      'conciergerie airbnb sete',
      'thau conciergerie',
      'conciergerie sète',
      'conciergerie frontignan',
      'cette conciergerie',
    ],
    population: 45000,
    tourists: 2500000,
    activeListings: 1800,
    priceLow: 70,
    priceHigh: 180,
    occupancyRate: 68,
    revpar: 65,
    seasonality:
      "Saisonnalité balnéaire ultra-marquée. Pic absolu juillet-août (occupation 92-95 %, tarifs 2,5-3× la normale, semaines complètes obligatoires en haute saison). Pic culturel fin août lors de la Fête de la Saint-Louis (joutes nautiques sur le canal Royal, classées au patrimoine immatériel de l'UNESCO, 100 000 spectateurs en une semaine), suivie d'Escale à Sète (grand rassemblement maritime tous les 2 ans, 600 000 visiteurs). Tourisme culturel régulier avril-juin (festival Worldwide Music, Théâtre de la Mer Jean Vilar). Creux marqué novembre-février (occupation 35-45 %), à l'exception des séjours thermaux à Balaruc-les-Bains à proximité.",
    rankNational: 18,
    introCustom:
      "Vous avez un appartement à **Sète**, sur les quais du canal Royal, sur la corniche dominant la Méditerranée, ou un cabanon à la Pointe Courte que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée.\n\nEntre les **8,4 millions de nuitées du Bassin de Thau en 2024**, les **joutes nautiques de la Saint-Louis** (classées UNESCO), l'**enregistrement Declaloc obligatoire à partir du 20 mai 2026**, et la quinzaine d'acteurs locaux qui se partagent un marché d'environ **1 800 annonces actives**, vous vous demandez si confier la gestion à une conciergerie est vraiment rentable.\n\nEt surtout : **laquelle choisir** entre Mont-Saint-Clair, Pointe Courte, centre-ville et la couronne Balaruc / Frontignan ?",
    marketIntro:
      "Sète est le **premier marché LCD de l'Hérault hors Montpellier** avec environ **1 800 annonces actives** et un revenu moyen par annonce de l'ordre de 18 000-25 000 €/an sur les biens bien placés. La ville bénéficie d'un mix unique : **Venise du Languedoc** (canaux, ponts mobiles, joutes nautiques classées UNESCO), **Mont-Saint-Clair** (panoramas sur la Méditerranée et l'étang de Thau), **patrimoine maritime vivant** (port de pêche actif, conserveries, ostréiculture sur l'étang de Thau), et **proximité Montpellier 30 min**.\n\nLa **destination Sète-Archipel de Thau a accueilli près de 10 millions de touristes en 2025** dont 8,4 millions de nuitées en 2024 (70 % clientèle française, 30 % étrangère : Belges, Allemands, Néerlandais, Suisses). L'étang de Thau (7 500 hectares, le plus grand du Languedoc) produit 11 000 tonnes d'huîtres et 3 000 tonnes de moules par an, ce qui ancre un **tourisme gastronomique** très dynamique (Bouzigues, Mèze, Marseillan).\n\nLe **tarif moyen nuitée est de 90-130 €** (source AirDNA) avec des pics à 220-320 € en haute saison juillet-août sur le Mont-Saint-Clair et la corniche. Les **prix au m² à Sète atteignent 3 000 €/m² en moyenne**, jusqu'à **5 200 €/m² sur le Mont-Saint-Clair** (le quartier le plus cher de la ville).\n\n**Sète a instauré l'enregistrement Airbnb** depuis avril 2022 et figure dans la liste officielle des communes avec déclaration obligatoire. La résidence secondaire dédiée LCD peut nécessiter une autorisation de changement d'usage — à vérifier auprès de l'urbanisme avant achat.",
    conciergeries: [
      {
        name: '7 OU NET',
        url: 'https://7ounet.fr/',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 23,
        biensGeres: 75,
        specialty: 'Volume Sète, objectif Superhost Airbnb',
        description:
          "Services complets : gestion locative, check-in/check-out, ménage professionnel, consigne bagages voyageurs. Approche centrée sur l'expérience voyageur : objectif Superhost Airbnb, note moyenne 5/5 sur les biens gérés. Pertinente pour un propriétaire qui valorise la performance Airbnb (notes voyageurs → classement → taux d'occupation) plutôt qu'une commission basse.",
      },
      {
        name: 'ConciLogis',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 4.3,
        reviews: 56,
        biensGeres: 50,
        specialty: 'Volume bassin de Thau, gestion généraliste',
        description:
          "Couverture : Sète, Frontignan, Balaruc, Mèze, Marseillan. Services complets : annonces, accueil, ménage, communication voyageurs. Tarification sur devis adaptée à la taille et à la typologie du bien. Pertinente pour un propriétaire d'un T1-T3 standard qui cherche un acteur volumique sans premium service.",
      },
      {
        name: 'Thau Conciergerie',
        url: 'https://thauconciergerie.fr/',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 4.6,
        reviews: 44,
        biensGeres: 40,
        specialty: 'Archipel de Thau (Sète-Balaruc-Frontignan-Mèze)',
        description:
          "Thau Conciergerie opère sur l'Archipel de Thau depuis 2020 avec une approche dédiée aux séjours haut de gamme dans des hébergements classés 3 à 5 étoiles. Services premium : linge hôtelier, livraison petit-déjeuner, produits locaux, réservations excursions, navette aéroport/gare. Couverture : Balaruc-les-Bains, Sète, Frontignan, Mèze, Bouzigues. Pertinente pour un propriétaire d'un bien classé 3-5* qui veut maximiser la satisfaction d'une clientèle thermale (Balaruc) ou gastronomique.",
      },
      {
        name: 'Monconcierge-a-sete',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 31,
        biensGeres: 25,
        specialty: 'Note Google parfaite, approche personnalisée',
        description:
          "Approche personnalisée : un seul interlocuteur par propriétaire, communication directe. Services complets : préparation, communication voyageurs, ménage, maintenance. Pertinente pour un propriétaire d'un seul bien (résidence principale en bail mobilité, résidence secondaire) qui valorise une relation humaine plutôt qu'un volume industriel.",
      },
      {
        name: 'Patrimonia Concept',
        url: 'https://www.patrimonia-concept.com/nos-services-immobiliers/conciergerie-sete/',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 24,
        biensGeres: 30,
        specialty: 'Approche patrimoniale (transaction + LCD + gestion annuelle)',
        description:
          "Patrimonia Concept est un acteur immobilier local qui complète son activité de transaction et de location annuelle par une offre LCD. Approche patrimoniale 360 : gestion LCD le temps d'optimiser la rentabilité, puis bascule éventuelle en location annuelle ou cession via le même interlocuteur historique. Pertinente pour un propriétaire qui souhaite garder l'option d'une revente ou d'un bail meublé classique sans changer d'interlocuteur.",
      },
      {
        name: 'Cette Conciergerie',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 23,
        biensGeres: 20,
        specialty: 'Acteur local, identité sétoise forte',
        description:
          "Acteur 100 % local, identité sétoise revendiquée. Services complets : gestion annonces, accueil, ménage, blanchisserie. Pertinente pour un propriétaire qui valorise l'ancrage local (vs réseaux nationaux) et une connaissance fine du tissu sétois (artisans, fournisseurs, événementiel).",
      },
      {
        name: 'La Conciergerie du Littoral',
        url: 'https://laconciergeriedulittoral.fr/',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 4.2,
        reviews: 49,
        biensGeres: 28,
        specialty: 'Couverture littoral large (Sète + Languedoc)',
        description:
          "La Conciergerie du Littoral couvre Sète et le littoral languedocien avec une approche sérieuse, efficace et réactive (verbatim avis). Couverture géographique élargie (Sète, Frontignan, Marseillan, Cap d'Agde). Pertinente pour un propriétaire multi-biens sur le littoral languedocien qui veut un interlocuteur unique.",
      },
    ],
    neighborhoods: [
      {
        name: 'Mont-Saint-Clair',
        pricePerNight: '130-280 €',
        occupancy: 75,
        description:
          "Quartier haut de gamme perché sur le Mont-Saint-Clair, panoramas exceptionnels sur Méditerranée et étang de Thau. Le plus prisé pour le LCD touristique premium. Prix au m² 5 200 €/m² en moyenne (le plus cher de Sète). T3 dès 350 000 €, villas avec vue de 600 000 € à 1,5 M€.",
        roiBrut: '4 à 5,5 %',
      },
      {
        name: 'Centre-ville / Canal Royal',
        pricePerNight: '95-180 €',
        occupancy: 72,
        description:
          "Cœur historique le long du canal Royal (joutes nautiques de la Saint-Louis), Vieux-Port, quai du Mistral, halles centrales. Clientèle 80 % touristique avec rotation rapide. Prix au m² 3 200-4 000 €. T2 à partir de 220 000 €.",
        roiBrut: '5,5 à 6,5 %',
      },
      {
        name: 'Corniche / Plages',
        pricePerNight: '110-220 €',
        occupancy: 70,
        description:
          "Corniche en bord de Méditerranée (8 km de plages, du Lido au Lazaret). Clientèle 90 % balnéaire avec saisonnalité juillet-août très marquée. Prix au m² 3 500-4 500 €. T2 dès 240 000 €. Studio cabine de plage dès 130 000 €.",
        roiBrut: '5 à 6 %',
      },
      {
        name: 'La Pointe Courte',
        pricePerNight: '80-160 €',
        occupancy: 65,
        description:
          "Quartier de pêcheurs typique à l'embouchure de l'étang de Thau, cabanons colorés, ambiance Petite Camargue. Charme atypique très demandé sur Airbnb (clientèle 100 % loisirs). Prix au m² 2 800-3 800 €. Cabanon dès 180 000 €, T2 dès 200 000 €.",
        roiBrut: '5,5 à 6,5 %',
      },
      {
        name: 'Quartier Haut / Île de Thau',
        pricePerNight: '70-120 €',
        occupancy: 58,
        description:
          "Quartier populaire qui gentrifie au-dessus du centre, vues sur les canaux et le Mont-Saint-Clair. Mix résidentiel + saisonnier. Tickets d'achat les plus accessibles de Sète intra-muros. T2 dès 150 000 €.",
        roiBrut: '6 à 7 %',
      },
      {
        name: 'Couronne Balaruc / Frontignan / Mèze (10-20 min)',
        pricePerNight: '75-160 €',
        occupancy: 65,
        description:
          "Communes du bassin de Thau autour de Sète : Balaruc-les-Bains (1ère station thermale française, 350 000 curistes/an), Frontignan (vins muscat AOC), Mèze (port et conchyliculture), Bouzigues (huîtres). Saisonnalité avril-octobre marquée + clientèle thermale toute l'année à Balaruc. T2 dès 160 000 €.",
        roiBrut: '5,5 à 6,5 %',
      },
    ],
    regulation:
      "Sète a instauré l'**enregistrement obligatoire** des meublés de tourisme en avril 2022 — un dispositif anticipé par rapport au cadre national. La pression locative sur le centre-ville et les quartiers prisés (Mont-Saint-Clair, Corniche) reste forte, avec des contrôles renforcés depuis 2024.\n\n**Enregistrement obligatoire.** Toute location meublée touristique doit être déclarée à la mairie de Sète depuis avril 2022, qui attribue un **numéro d'enregistrement à 13 caractères** à porter sur chaque annonce Airbnb, Booking ou Abritel.\n\n**Enregistrement Declaloc national au 20 mai 2026.** À cette date, le téléservice national unique (apimeubles.finances.gouv.fr) devient incontournable et l'absence de numéro déclenche la désactivation automatique des annonces par les plateformes.\n\n**Résidence principale.** Limite nationale de **120 nuitées par an** pour la location en résidence principale (celle que vous occupez au moins 8 mois par an).\n\n**Résidence secondaire dédiée LCD.** Pour proposer une résidence secondaire en LCD, une **autorisation de changement d'usage** avec compensation doit être obtenue avant tout achat — à vérifier directement auprès de l'urbanisme de Sète. Dans le département de l'Hérault, le tribunal judiciaire de Montpellier a condamné en avril 2026 deux propriétaires pour location en meublé courte durée sans autorisation préalable de changement d'usage (11 000 € d'amendes cumulées) — un signal fort sur le durcissement des contrôles.\n\n**Loi Le Meur 2024.** Le DPE classe E minimum est obligatoire (classe D à partir de 2034), et l'abattement micro-BIC est passé à 30 % pour les meublés non classés (50 % pour les classés tourisme). Les biens classés F ou G au DPE sont interdits à la location courte durée. Amendes : **10 000 € pour défaut d'enregistrement**, **20 000 € pour fausse déclaration ou numéro falsifié**.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** Sète Agglopôle Méditerranée applique une taxe de séjour intercommunale de 0,75 € à 4,30 € par nuit et par personne selon le classement de l'hébergement, collectée automatiquement par Airbnb.",
    concreteExample: {
      bienType: 'T2',
      surface: 45,
      pricePerNight: 110,
      neighborhood: 'Centre-ville Canal Royal',
      revenuBrut: 27000,
      commissionRate: 0.20,
      menageCount: 75,
      menageUnitCost: 65,
    },
    extraFaq: [
      {
        q: 'Combien rapporte un Airbnb à Sète pendant la Saint-Louis et l\'été ?',
        a: "La haute saison sétoise s'étale de mi-juin à mi-septembre avec un pic absolu en juillet-août (occupation 92-95 %, séjours d'1 semaine minimum) et un pic culturel fin août lors de la Fête de la Saint-Louis (joutes nautiques classées UNESCO, 100 000 spectateurs). Un T2 sur les quais du canal Royal qui se loue 110 €/nuit en moyenne annuelle atteint 220-300 €/nuit pendant les 8 semaines de juillet-août. Sur les 3 mois de haute saison, un T2 bien placé peut générer 16 000 à 24 000 € bruts, soit 55-70 % du chiffre d'affaires annuel. Tous les 2 ans, Escale à Sète (grand rassemblement maritime, 600 000 visiteurs) ajoute un pic ponctuel exceptionnel sur 6 jours.",
      },
      {
        q: 'Faut-il une autorisation de changement d\'usage à Sète pour une résidence secondaire LCD ?',
        a: "Oui, dès lors que vous dédiez votre bien (résidence secondaire) à la location meublée touristique, une autorisation de changement d'usage avec compensation peut être exigée par la mairie de Sète. Cela peut nécessiter de convertir un autre logement ailleurs sur la commune en logement à usage d'habitation pour compenser la perte. Dans l'Hérault, le tribunal judiciaire de Montpellier a condamné en avril 2026 deux propriétaires pour défaut d'autorisation (11 000 € d'amendes cumulées). Avant tout achat dédié au LCD à Sète, vérifiez directement auprès du service urbanisme de la mairie si votre projet est réalisable dans le quartier visé.",
      },
      {
        q: 'Quels quartiers privilégier pour investir en LCD à Sète ?',
        a: "Pour un objectif rentabilité maximale, le Quartier Haut / Île de Thau est le meilleur compromis : prix au m² 2 800-3 200 € (les plus accessibles intra-muros), gentrification en cours, ROI brut 6-7 %. Le Centre-ville / Canal Royal offre les meilleurs tarifs nuitée (95-180 €) avec un ticket d'entrée intermédiaire (>220 000 € pour un T2) et une demande lissée tourisme + culturel. Pour un profil prestige, viser le Mont-Saint-Clair (panoramas, T3 à partir de 350 000 €) ou la Corniche (plages, T2 dès 240 000 €). Pour un profil cashflow, regarder la couronne Frontignan / Mèze / Marseillan : tickets dès 160 000 €, demande balnéaire forte avril-octobre, accès à la clientèle thermale Balaruc toute l'année.",
      },
    ],
    updatedAt: '2026-05-27',
  },
  // ==========================================================================
  // DEAUVILLE
  // ==========================================================================
  {
    slug: 'deauville',
    displayName: 'Deauville',
    region: 'Normandie',
    regionSlug: 'normandie',
    title: 'Conciergerie Deauville Airbnb : comparatif 2026 des 6 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Deauville : Comparatif 2026',
    metaDescription:
      'Comparatif des 6 meilleures conciergeries Airbnb à Deauville et Trouville. Tarifs (18-25 %), services, avis Google, réglementation 2026, quartiers rentables (Planches, Villas, Centre).',
    kwPrincipal: 'conciergerie deauville',
    kwSecondaires: [
      'conciergerie airbnb deauville',
      'conciergerie trouville',
      'conciergerie normandie',
      'conciergerie privée normandie',
      'air bnb deauville',
    ],
    population: 3500,
    tourists: 4000000,
    activeListings: 1100,
    priceLow: 90,
    priceHigh: 220,
    occupancyRate: 60,
    revpar: 75,
    seasonality:
      "Saisonnalité événementielle ultra-marquée. Pic absolu en septembre lors du Festival du Cinéma Américain de Deauville (occupation 95-100 %, tarifs 2,5-3,5× la normale, séjours minimum 3-4 nuits imposés, clientèle internationale). Autres pics majeurs : course hippique Prix de Diane et meeting de Deauville (été), Polo Master Deauville, Yearling Sale (vente de chevaux fin août, 5 000 acheteurs internationaux), Marché de Noël. Week-ends parisiens toute l'année (clientèle 50 % francilienne, surnom « 21e arrondissement de Paris »). Creux marqué janvier-février et novembre (occupation 30-40 %).",
    rankNational: 16,
    introCustom:
      "Vous avez un appartement à **Deauville**, sur les Planches ou à proximité du Casino, ou un cottage normand à Trouville-sur-Mer, que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée.\n\nEntre le **Festival du Cinéma Américain** qui draine une clientèle internationale en septembre, les **week-ends parisiens** qui rythment toute l'année (50 % des nuitées touristiques), l'**enregistrement Airbnb obligatoire** déjà en vigueur (Deauville fait partie des 3 communes du Calvados pionnières sur l'enregistrement Airbnb), et la dizaine d'acteurs locaux qui se partagent un marché d'environ **1 100 annonces actives**, vous vous demandez si confier la gestion à une conciergerie est vraiment rentable.\n\nEt surtout : **laquelle choisir** entre les Planches, le quartier des Villas et la couronne Trouville/Honfleur ?",
    marketIntro:
      "Deauville est la **première destination LCD de la Côte Fleurie** et l'une des plus prestigieuses de France. La ville et sa voisine Trouville-sur-Mer forment **la région la plus touristique de Normandie** avec 1/5e des nuitées touristiques régionales (loin devant la Vallée de la Seine à 1/7e). La clientèle est **essentiellement nationale** (50 % parisienne, surnommée localement « le 21e arrondissement de Paris ») avec 20 % de clientèle étrangère (Britanniques, Belges, Néerlandais, Américains).\n\nLa **Côte Fleurie cumule environ 4 millions de visiteurs par an** sur l'axe Deauville-Trouville-Cabourg-Honfleur. La ville bénéficie d'un mix unique : **Planches** (promenade emblématique, 643 mètres de bois exotique avec parasols multicolores), **Casino de Deauville** (l'un des plus prestigieux d'Europe), **hippodromes** (Clairefontaine et La Touques), **Festival du Cinéma Américain** (50e édition en 2024, plus de 60 000 spectateurs), **proximité Paris** (2h en TGV ou voiture).\n\nLes **prix au m² à Deauville atteignent 6 200 à 7 000 €/m²** en moyenne — un niveau qui place la commune dans le top 10 français hors métropoles. Sur le **quartier des Villas** (Belle Époque), les prix peuvent dépasser **10 000 €/m²**.\n\nLe **tarif moyen nuitée est de 130-180 €** (source AirDNA) avec des pics à 280-450 € lors du Festival du Cinéma Américain, des week-ends d'été et des Yearling Sale. La **clientèle premium internationale** (Polo Master, Yearling Sale) tire les tarifs vers le haut sur les biens haut de gamme.\n\n**Deauville fait partie des 3 communes du Calvados** où Airbnb a déployé l'enregistrement obligatoire dès 2022 — un dispositif anticipé par rapport au cadre national. La déclaration en mairie est exigée dès la première nuit de location.",
    conciergeries: [
      {
        name: 'MYPacôme Conciergerie',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 68,
        biensGeres: 45,
        specialty: 'Volume Deauville-Trouville, exécution premium',
        description:
          "Couverture : Deauville, Trouville-sur-Mer, Côte Fleurie. Services complets : annonces multi-plateformes, accueil voyageurs (clientèle parisienne et internationale), ménage hôtelier, linge premium, maintenance. Pertinente pour un propriétaire d'un T2-T4 sur les Planches, à proximité du Casino ou dans le quartier des Villas qui valorise l'excellence d'exécution face à une clientèle exigeante.",
      },
      {
        name: 'Ma Conciergerie en Normandie',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 25,
        biensGeres: 30,
        specialty: 'Ancrage Normandie, approche personnalisée',
        description:
          "Acteur 100 % local avec ancrage Côte Fleurie. Approche personnalisée : un seul interlocuteur par propriétaire, communication directe, partenaires locaux sélectionnés (femmes de ménage, artisans, fleuristes). Pertinente pour un propriétaire qui valorise l'ancrage local (vs réseaux nationaux) et une relation humaine plutôt qu'un service standardisé.",
      },
      {
        name: 'YourHostHelper Deauville',
        url: 'https://yourhosthelper.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.6,
        reviews: 40,
        biensGeres: 40,
        specialty: 'Réseau national 20+ villes, dashboard propriétaire',
        description:
          "Filiale de YourHostHelper (présent dans 20+ villes françaises), cette conciergerie mise sur l'optimisation du revenu via un pricing dynamique quotidien et des photos professionnelles incluses gratuitement au lancement. Commission 20 %, ménage refacturé voyageur. Dashboard propriétaire avec prévisions de revenus et recommandations d'optimisation. Bien adaptée aux T1-T2 standards et aux propriétaires multi-villes (intégration dashboard unique).",
      },
      {
        name: 'Interhome Deauville',
        commission: '20-25 %',
        menage: 'refacturé voyageur',
        rating: 4.2,
        reviews: 85,
        biensGeres: 70,
        specialty: 'Réseau international (50+ pays), volume avis le plus élevé',
        description:
          "Interhome est un acteur international (réseau dans plus de 50 pays). Couverture : Deauville, Trouville, Côte Fleurie. Services complets avec diffusion sur le réseau international Interhome (forte clientèle européenne : Allemands, Suisses, Britanniques, Belges, Néerlandais). Pertinente pour un propriétaire qui veut maximiser l'accès à la clientèle étrangère (20 % du marché deauvillais) via une marque internationale reconnue.",
      },
      {
        name: 'Conciergerie Privée Deauville',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 4.2,
        reviews: 10,
        biensGeres: 15,
        specialty: 'Service à la carte, biens de standing',
        description:
          "Conciergerie Privée Deauville cible le segment biens de standing et résidences secondaires haut de gamme. Services à la carte : selon le propriétaire, gestion partielle (uniquement check-in/check-out) ou totale. Pertinente pour un propriétaire qui veut garder la main sur certains aspects (annonce, pricing) tout en déléguant l'exécution opérationnelle.",
      },
      {
        name: 'Conciergerie Deauvillaise',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 12,
        specialty: 'Petit acteur local, tarification souple',
        description:
          "Services standards conciergerie : accueil, ménage, communication voyageurs. Pertinente pour un propriétaire qui privilégie une tarification souple sans engagement long terme — à mettre en balance avec la note inférieure aux concurrents.",
      },
    ],
    neighborhoods: [
      {
        name: 'Les Planches / Casino',
        pricePerNight: '170-380 €',
        occupancy: 70,
        description:
          "Quartier emblématique en bord de mer autour des Planches (promenade 643 m), Casino Barrière, Hôtel Normandy, Hôtel Royal. Le plus prisé pour le LCD premium. Clientèle internationale et parisienne week-end. Prix au m² 7 500-10 500 €. T2 à partir de 380 000 €, appartement Belle Époque dès 700 000 €.",
        roiBrut: '3,5 à 4,5 %',
      },
      {
        name: 'Quartier des Villas (Belle Époque)',
        pricePerNight: '180-420 €',
        occupancy: 65,
        description:
          "Quartier résidentiel haut de gamme à l'est du Casino, somptueuses villas Belle Époque inscrites au PLU. Clientèle premium familiale et événementielle. Prix au m² 8 000-12 000 €. Villa T5 dès 1,5 M€. ROI brut bas mais valeur patrimoniale exceptionnelle.",
        roiBrut: '3 à 4 %',
      },
      {
        name: 'Centre-ville / Marché',
        pricePerNight: '120-220 €',
        occupancy: 68,
        description:
          "Cœur de Deauville autour du marché couvert, place du Casino et rues commerçantes (rue Mirabeau, rue Désiré Le Hoc). Mix tourisme + commerce. Prix au m² 6 200-7 200 €. T2 dès 320 000 €. Excellent compromis pour un premier investissement à Deauville.",
        roiBrut: '4 à 5,5 %',
      },
      {
        name: 'Hippodromes / Touques',
        pricePerNight: '100-180 €',
        occupancy: 62,
        description:
          "Quartiers à proximité des hippodromes de la Touques et de Clairefontaine. Clientèle équestre (meeting d'été, Yearling Sale, Prix de Diane) très forte juillet-août. Prix au m² 5 200-6 200 €. T2 dès 240 000 €.",
        roiBrut: '4,5 à 5,5 %',
      },
      {
        name: 'Trouville-sur-Mer (Pont des Belges, 5 min)',
        pricePerNight: '95-180 €',
        occupancy: 70,
        description:
          "Commune voisine de Deauville (5 min par le Pont des Belges) avec un caractère plus authentique (port de pêche, halles Boudin, plages). Prix au m² 5 000-5 700 € (10-15 % moins cher que Deauville). T2 dès 200 000 €. Excellent compromis Côte Fleurie pour un investisseur cherchant un meilleur ROI.",
        roiBrut: '5 à 6 %',
      },
      {
        name: 'Couronne Honfleur / Cabourg / Houlgate (15-25 min)',
        pricePerNight: '110-220 €',
        occupancy: 65,
        description:
          "Communes touristiques de la Côte Fleurie : Honfleur (port pittoresque, 1,5M visiteurs/an), Cabourg (Grand Hôtel Proust, casino), Houlgate (architecture balnéaire 19e). Saisonnalité avril-octobre marquée. T2 dès 180 000 €. Maison de caractère normande dès 350 000 €.",
        roiBrut: '5 à 6 %',
      },
    ],
    regulation:
      "Deauville fait partie des **3 communes pionnières du Calvados** où Airbnb a déployé l'enregistrement obligatoire dès 2022 — un dispositif anticipé par rapport au cadre national. La ville assume une politique d'encadrement actif des meublés de tourisme pour préserver l'équilibre entre tourisme premium et marché locatif résidentiel.\n\n**Déclaration en mairie obligatoire.** Toute location meublée touristique, y compris pour la résidence principale, doit être déclarée à la mairie de Deauville dès la première nuit de location. La mairie délivre un **numéro d'enregistrement** à porter sur chaque annonce Airbnb, Booking ou Abritel.\n\n**Enregistrement Declaloc national au 20 mai 2026.** À cette date, le téléservice national unique (apimeubles.finances.gouv.fr) deviendra obligatoire pour toutes les communes françaises et harmonisera les numéros à 13 chiffres. Sans ce numéro, les plateformes désactiveront automatiquement les annonces.\n\n**Résidence principale.** Limite nationale de **120 nuitées par an** pour la location en résidence principale (celle que vous occupez au moins 8 mois par an, sauf obligation professionnelle, raison de santé ou force majeure).\n\n**Changement d'usage en copropriété.** Si votre logement fait partie d'une copropriété, vérifiez que le règlement de copropriété ne contient pas de clause d'usage exclusivement résidentiel. À Deauville, plusieurs copropriétés Belle Époque ont voté de telles clauses pour préserver le calme — un facteur à vérifier avant tout achat dans le quartier des Villas ou sur les Planches.\n\n**Loi Le Meur 2024.** Le DPE classe E minimum est obligatoire (classe D à partir de 2034), et l'abattement micro-BIC est passé à 30 % pour les meublés non classés (50 % pour les classés tourisme). Les biens classés F ou G au DPE sont interdits à la location courte durée. Amendes : **10 000 € pour défaut d'enregistrement**, **20 000 € pour fausse déclaration ou numéro falsifié**.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** La communauté de communes Cœur Côte Fleurie applique une taxe de séjour de 1,10 € à 5,30 € par nuit et par personne adulte selon le classement de l'hébergement — l'une des plus élevées du littoral français hors Côte d'Azur, collectée automatiquement par Airbnb.",
    concreteExample: {
      bienType: 'T2',
      surface: 45,
      pricePerNight: 165,
      neighborhood: 'Centre-ville Deauville',
      revenuBrut: 36000,
      commissionRate: 0.20,
      menageCount: 70,
      menageUnitCost: 90,
    },
    extraFaq: [
      {
        q: 'Combien rapporte un Airbnb à Deauville pendant le Festival du Cinéma Américain ?',
        a: "Le Festival du Cinéma Américain de Deauville (1ère quinzaine de septembre, plus de 60 000 spectateurs sur 10 jours, clientèle internationale et professionnelle du cinéma) déclenche le pic absolu de la saisonnalité deauvillaise. Un T2 en centre qui se loue 165 €/nuit en moyenne annuelle atteint 320-450 €/nuit pendant les 10 jours du festival, avec un séjour minimum 3-4 nuits imposé. Sur les 10 jours, un T2 bien placé peut générer 3 500 à 5 500 € bruts. Les autres pics annuels (Yearling Sale fin août, Polo Master, week-ends d'été, marché de Noël) ajoutent 30-40 % de chiffre d'affaires concentré sur 6-8 semaines hors festival.",
      },
      {
        q: 'Faut-il déclarer un Airbnb à Deauville dès la première location ?',
        a: "Oui, depuis 2022, Deauville fait partie des 3 communes pionnières du Calvados où Airbnb a déployé l'enregistrement obligatoire — un dispositif anticipé par rapport au cadre national. La déclaration en mairie est exigée dès la première nuit de location, y compris pour la résidence principale. La mairie délivre un numéro d'enregistrement à porter sur chaque annonce. À partir du 20 mai 2026, ce numéro passera à 13 chiffres via le téléservice national Declaloc (apimeubles.finances.gouv.fr). Sans ce numéro, les plateformes (Airbnb, Booking, Abritel) désactiveront automatiquement votre annonce. Pour la résidence principale, la limite nationale de 120 nuitées par an reste en vigueur.",
      },
      {
        q: 'Quels quartiers privilégier pour investir en LCD à Deauville ?',
        a: "Pour un objectif rentabilité, le centre-ville / marché est le meilleur compromis : prix au m² 6 200-7 200 € (les plus accessibles intra-muros), demande lissée tourisme + commerce, ROI brut 4-5,5 %. Les Planches / Casino offrent les meilleurs tarifs nuitée (170-380 €) mais avec un ticket d'entrée >380 000 € et un ROI brut limité (3,5-4,5 %). Pour un profil cashflow, regarder Trouville-sur-Mer (10-15 % moins cher que Deauville, ROI brut 5-6 %) ou la couronne Honfleur/Cabourg/Houlgate (T2 dès 180 000 €). Pour un profil patrimonial pur, viser le quartier des Villas Belle Époque (valeur refuge, valorisation long terme, ROI brut 3-4 % accepté en contrepartie).",
      },
    ],
    updatedAt: '2026-05-27',
  },
  // ==========================================================================
  // PERPIGNAN
  // ==========================================================================
  {
    slug: 'perpignan',
    displayName: 'Perpignan',
    region: 'Occitanie',
    regionSlug: 'occitanie',
    title: 'Conciergerie Perpignan Airbnb : comparatif 2026 des 6 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Perpignan : Comparatif 2026',
    metaDescription:
      "Comparatif des 6 meilleures conciergeries Airbnb à Perpignan. Tarifs (18-25 %), services, avis Google, permis de louer Saint-Jacques, La Réal, Saint-Matthieu, quartiers rentables.",
    kwPrincipal: 'conciergerie perpignan',
    kwSecondaires: [
      'conciergerie airbnb perpignan',
      'conciergerie 66',
      'conciergerie canet en roussillon',
      'conciergerie collioure',
      'conciergerie barcares',
    ],
    population: 121616,
    tourists: 1200000,
    activeListings: 850,
    priceLow: 55,
    priceHigh: 95,
    occupancyRate: 62,
    revpar: 38,
    seasonality:
      "Saisonnalité méditerranéenne marquée. Pic juillet-août (occupation 85-92 %, tarifs ×1,8 vs basse saison, clientèle française et espagnole, séjours 7 nuits dominants sur la Côte Vermeille). Visa pour l'Image en septembre (festival international de photojournalisme, 50e édition en 2024, 200 000 visiteurs sur 15 jours, occupation 85-95 % en centre, tarifs ×1,4-1,6). Bonne tenue d'avril à octobre grâce au climat (2 488 heures de soleil/an, l'un des taux les plus élevés de France). Creux marqué décembre-janvier (occupation 30-40 %), atténué en centre par les marchés de Noël catalans et les week-ends courts pour les amateurs de Pyrénées (Canigou, Pyrénées-Orientales).",
    rankNational: 24,
    introCustom:
      "Vous avez un appartement à **Perpignan**, en centre historique près du Castillet ou dans la couronne (Vernet, Moulin-à-Vent), ou un cabanon sur la **Côte Vermeille** (Canet-en-Roussillon, Le Barcarès, Saint-Cyprien), que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée.\n\nEntre le **Visa pour l'Image** qui draine 200 000 visiteurs en septembre, la **clientèle espagnole** week-end (Barcelone à 1h45), le **permis de louer** désormais exigé dans les quartiers historiques (Saint-Jacques, La Réal, Saint-Matthieu, Action Cœur de Ville), et la dizaine d'acteurs locaux qui se partagent un marché d'environ **850 annonces actives**, vous vous demandez si confier la gestion à une conciergerie est vraiment rentable.\n\nEt surtout : **laquelle choisir** entre Perpignan intra-muros, la couronne et la Côte Vermeille à 13 km ?",
    marketIntro:
      "Perpignan est la **capitale catalane française** et le hub LCD du département **66 (Pyrénées-Orientales)**. La ville compte **121 616 habitants** (INSEE 2023, +1,2 % depuis 2017) et une aire urbaine de 209 325 résidents. Position stratégique : **13 km de la Méditerranée**, **25 km de la frontière espagnole**, **190 km de Barcelone**, **2 488 heures de soleil par an** (l'un des records de France métropolitaine).\n\nLa **clientèle est mixte** : touristes français (familles cherchant la Côte Vermeille à prix accessible vs Côte d'Azur), Espagnols week-end (Barcelone-Perpignan en TGV), Britanniques et Néerlandais saison estivale, professionnels du tourisme et de l'agroalimentaire (premier port de marchandises français pour les fruits/légumes d'Espagne). Le **Visa pour l'Image** (festival international du photojournalisme, septembre) attire 200 000 visiteurs sur 15 jours et déclenche le 2e pic annuel.\n\nLes **prix au m² à Perpignan restent accessibles** : 1 800-2 600 €/m² en centre, 2 800-3 500 €/m² dans les quartiers prisés (Saint-Assiscle, La Lunette), bien en dessous des moyennes méditerranéennes — un avantage clair pour les nouveaux investisseurs LCD vs Montpellier ou Aix-en-Provence.\n\nLe **tarif moyen nuitée est de 65-85 €** en centre (T1-T2 standards), 90-130 € pour un bien rénové vue Castillet ou cathédrale, 110-180 € sur Canet-en-Roussillon en pleine saison estivale.\n\nLa ville a **instauré un permis de louer** dans ses quartiers historiques dégradés (Saint-Jacques, La Réal, Saint-Matthieu) et un dispositif Action Cœur de Ville sur l'hyper-centre — un cadre à anticiper avant tout achat dans le périmètre intra-muros.",
    conciergeries: [
      {
        name: 'CoolKeys Conciergerie',
        url: 'https://www.cool-keys.com/',
        commission: '25 % TTC',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 35,
        specialty: 'Volume Perpignan + Côte Vermeille, gestion clé en main',
        description:
          "Commission 25 % TTC, ménage refacturé voyageur. Couverture : Perpignan intra-muros, couronne, Canet-en-Roussillon, Saint-Cyprien, Le Barcarès. Services complets : annonces multi-plateformes, accueil voyageurs, ménage hôtelier, linge, maintenance, gestion 7j/7. Pertinente pour un propriétaire qui veut déléguer la totalité (annonce + opérationnel) sur un T1-T3 standard et tirer parti du double marché ville + littoral.",
      },
      {
        name: 'Sud Séjour Conciergerie',
        url: 'https://www.sudsejourconciergerie.com/',
        commission: '24 % HT',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 21,
        biensGeres: 22,
        specialty: 'Expertise locale, optimisation attractivité',
        description:
          "Commission 24 % HT, ménage refacturé voyageur. Acteur 100 % local avec une approche centrée sur l'optimisation de l'attractivité des biens (photos, annonces, pricing dynamique). Pertinente pour un propriétaire qui débute en LCD et cherche un accompagnement complet avec un interlocuteur unique — vs les réseaux nationaux plus standardisés.",
      },
      {
        name: 'Rent and Breathe',
        url: 'https://www.rentandbreathe.fr/',
        commission: '25 % TTC',
        menage: 'refacturé voyageur',
        rating: 5.0,
        reviews: 10,
        biensGeres: 14,
        specialty: 'Service premium, clientèle haut de gamme',
        description:
          "Commission 25 % TTC. Approche premium : welcome pack, conciergerie voyageur (réservation restaurants, activités, transferts), linge hôtelier, photos professionnelles. Pertinente pour un propriétaire d'un T3-T4 en centre rénové ou d'une maison de standing qui valorise une expérience voyageur différenciante face à la concurrence Airbnb sur le 66.",
      },
      {
        name: 'Conciergerie du Roussillon',
        url: 'https://www.conciergerieduroussillon.com/',
        commission: '20 % TTC',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 10,
        specialty: 'Gestion complète, commission contenue',
        description:
          "Commission 20 % TTC — la plus basse du panel à note maximale. Gestion complète de la création de l'annonce jusqu'au départ des locataires, avec ménage refacturé voyageur. Pertinente pour un propriétaire qui veut une commission contenue (20 %) tout en bénéficiant d'un service intégral, sans monter en gamme premium.",
      },
      {
        name: 'Viva Conciergerie',
        url: 'https://vivaconciergerie.com/',
        commission: '18-22 % TTC (dégressif)',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 6,
        specialty: 'Tarification dégressive, stratégie tarifaire dynamique',
        description:
          "Viva Conciergerie applique une commission dégressive 18 à 22 % TTC selon le volume de biens confiés et la durée d'engagement — la commission la plus basse du marché perpignanais pour les multi-propriétaires. Stratégie tarifaire dynamique mise en avant (pricing quotidien). Pertinente pour un investisseur multi-biens à Perpignan qui veut minimiser la commission via volume.",
      },
      {
        name: 'SPS66 La Conciergerie Catalane',
        url: 'https://www.conciergerie66.fr/',
        commission: 'à partir de 60 € TTC ou sur devis',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 8,
        specialty: 'Tarif à la prestation (vs % commission), souplesse',
        description:
          "SPS66 La Conciergerie Catalane propose un modèle tarifaire à la prestation (à partir de 60 € TTC par intervention ou sur devis personnalisé) plutôt qu'une commission en pourcentage. Approche logistique : arrivées/départs, ménage, maintenance, gestion sur mesure. Pertinente pour un propriétaire occasionnel (résidence secondaire louée 4-8 semaines/an) qui veut éviter le modèle commission % et payer uniquement les prestations consommées.",
      },
    ],
    neighborhoods: [
      {
        name: 'Centre historique / Castillet',
        pricePerNight: '70-130 €',
        occupancy: 68,
        description:
          "Cœur médiéval autour du Castillet (porte de la ville, 1368), Loge de Mer, Cathédrale Saint-Jean-Baptiste, Palais des Rois de Majorque. Mix tourisme + commerce, le secteur le plus prisé en LCD. Attention : périmètre Action Cœur de Ville → autorisation de louer requise au plus tard 15 jours après signature du bail. Prix au m² 1 900-2 600 €. T2 dès 110 000 €.",
        roiBrut: '7 à 9,5 %',
      },
      {
        name: 'Saint-Jacques / La Réal / Saint-Matthieu',
        pricePerNight: '55-85 €',
        occupancy: 60,
        description:
          "Quartiers historiques classés en quartiers dégradés. Tickets d'entrée parmi les plus bas de France métropolitaine (T2 dès 60 000 €). MAIS permis de louer obligatoire (demande au moins 1 mois avant mise en location) — refus possible si le bien ne respecte pas les normes de décence ou si la copropriété présente des risques. Prix au m² 1 200-1 800 €. À considérer après audit énergétique + visite mairie.",
        roiBrut: '8 à 11 %',
      },
      {
        name: 'Saint-Assiscle / La Lunette / Le Vernet',
        pricePerNight: '60-95 €',
        occupancy: 64,
        description:
          "Couronne résidentielle moderne (Saint-Assiscle au sud, La Lunette à l'est, Le Vernet à l'ouest), proche gare TGV (10 min à pied) et autoroute A9. Clientèle mixte : touristes en transit Espagne/Pyrénées, professionnels du tourisme, week-end Barcelone. Prix au m² 2 200-3 200 €. T2 dès 140 000 €. Hors périmètre permis de louer — démarches simplifiées.",
        roiBrut: '6 à 8 %',
      },
      {
        name: 'Canet-en-Roussillon (13 km)',
        pricePerNight: '90-180 €',
        occupancy: 58,
        description:
          "Station balnéaire la plus proche, 13 km à l'est. 2e ville du 66 par les nuitées touristiques. Plage 8,5 km, port de plaisance 1 100 anneaux. Clientèle 100 % saisonnière (mai-octobre), pic juillet-août très marqué. Prix au m² 3 200-4 500 €. T2 dès 165 000 €. Occupation lissée annuelle plus faible (58 %) mais tarifs nuit estivaux ×2,5.",
        roiBrut: '5,5 à 7 %',
      },
      {
        name: 'Le Barcarès / Saint-Cyprien (15-20 km)',
        pricePerNight: '80-160 €',
        occupancy: 55,
        description:
          "Stations balnéaires de la Côte Vermeille au nord (Le Barcarès, 15 km) et au sud (Saint-Cyprien, 20 km). Forte concurrence camping/résidence de tourisme. Prix au m² 2 800-4 000 €. T2 dès 130 000 €. Saisonnalité encore plus marquée qu'à Canet (4 mois actifs). À privilégier en investissement secondaire vs résidence principale louée.",
        roiBrut: '5 à 6,5 %',
      },
      {
        name: 'Collioure / Côte Vermeille rocheuse (35 km)',
        pricePerNight: '120-220 €',
        occupancy: 62,
        description:
          "Collioure, port catalan classé, 1,5 million de visiteurs/an. Argelès-sur-Mer, Port-Vendres, Banyuls-sur-Mer en couronne. Marché LCD premium (clientèle internationale, demande forte hors saison aussi : peinture, randonnée, dégustation vin). Prix au m² 4 500-6 500 €. Tickets d'entrée plus élevés (T2 dès 220 000 €) mais ROI brut résilient grâce à la saisonnalité étalée.",
        roiBrut: '5 à 6,5 %',
      },
    ],
    regulation:
      "Perpignan applique un **dispositif de [permis de louer](https://permis-de-louer.perpignan.fr/demande-autorisation)** dans plusieurs quartiers historiques classés en habitat dégradé. Un cadre à anticiper impérativement avant tout achat dans le périmètre intra-muros.\n\n**Permis de louer Saint-Jacques, La Réal, Saint-Matthieu.** Demande d'autorisation à déposer **au moins 1 mois avant la mise en location**. La mairie peut refuser si le logement ne respecte pas les normes de décence (surface minimale, ventilation, électricité, plomberie) ou si la copropriété présente des risques (péril, insalubrité). Le périmètre couvre l'essentiel du centre médiéval — beaucoup d'immeubles anciens nécessitant des travaux.\n\n**Action Cœur de Ville.** Sur l'hyper-centre (Castillet, Loge, Cathédrale), la déclaration en mairie est exigée **au plus tard 15 jours après la signature du contrat de location**. Cadre moins restrictif que le permis de louer (pas d'autorisation préalable) mais déclaration obligatoire.\n\n**Enregistrement Declaloc national au 20 mai 2026.** À cette date, le téléservice national unique (apimeubles.finances.gouv.fr) deviendra obligatoire pour toutes les communes françaises et harmonisera les numéros à 13 chiffres. Sans ce numéro, les plateformes (Airbnb, Booking, Abritel) désactiveront automatiquement les annonces.\n\n**Résidence principale.** Limite nationale de **120 nuitées par an** pour la location en résidence principale (celle que vous occupez au moins 8 mois par an, sauf obligation professionnelle, raison de santé ou force majeure). Perpignan n'a pas (encore) abaissé ce plafond à 90 jours, contrairement à certaines communes touristiques.\n\n**Loi Le Meur 2024.** DPE classe E minimum obligatoire (classe D à partir de 2034), abattement micro-BIC à 30 % pour les meublés non classés (50 % pour les classés tourisme). Biens classés F ou G au DPE interdits à la location courte durée à partir du 1er janvier 2028. Amendes : **10 000 € pour défaut d'enregistrement**, **20 000 € pour fausse déclaration ou numéro falsifié**.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** Perpignan Méditerranée Métropole applique une taxe de séjour de 0,80 € à 4,30 € par nuit et par personne adulte selon le classement de l'hébergement, collectée automatiquement par Airbnb. La taxe est plus élevée à Canet-en-Roussillon et sur la Côte Vermeille (jusqu'à 5 € pour un palace 5*).",
    concreteExample: {
      bienType: 'T2',
      surface: 42,
      pricePerNight: 78,
      neighborhood: 'Centre historique Perpignan',
      revenuBrut: 17600,
      commissionRate: 0.22,
      menageCount: 70,
      menageUnitCost: 55,
    },
    extraFaq: [
      {
        q: "Faut-il une autorisation pour louer un Airbnb à Perpignan en 2026 ?",
        a: "Cela dépend du quartier. Dans les quartiers historiques classés en habitat dégradé (Saint-Jacques, La Réal, Saint-Matthieu), un permis de louer est exigé : demande à déposer au moins 1 mois avant la mise en location, avec contrôle des normes de décence (surface, ventilation, électricité, plomberie). Refus possible si le bien ou la copropriété présente des risques. Sur le périmètre Action Cœur de Ville (Castillet, Loge, Cathédrale), la déclaration en mairie est obligatoire au plus tard 15 jours après la signature du bail. Hors de ces périmètres (Vernet, Saint-Assiscle, La Lunette), seule la déclaration générale de meublé de tourisme s'applique. À partir du 20 mai 2026, le numéro Declaloc national à 13 chiffres deviendra obligatoire pour toutes les annonces, partout en France.",
      },
      {
        q: "Combien rapporte un Airbnb à Perpignan pendant le Visa pour l'Image ?",
        a: "Le Visa pour l'Image (festival international du photojournalisme, 2e quinzaine de septembre, 200 000 visiteurs sur 15 jours, presse internationale et professionnels du photoreportage) déclenche le 2e pic annuel après l'été. Un T2 en centre qui se loue 78 €/nuit en moyenne annuelle atteint 110-160 €/nuit pendant les 15 jours du festival, avec une occupation 85-95 %. Sur les 15 jours, un T2 bien placé peut générer 1 800 à 2 400 € bruts. Le festival apporte une clientèle haut de gamme (rédacteurs en chef, photographes, attachés de presse) plus exigeante sur l'hébergement (équipement bureau, wifi haut débit, calme) — un investissement décoration utile pour capter ce segment.",
      },
      {
        q: 'Vaut-il mieux investir en LCD à Perpignan centre ou sur Canet-en-Roussillon ?',
        a: "Pour un objectif rentabilité annuelle lissée, le centre de Perpignan est le meilleur compromis : prix au m² 1 900-2 600 € (T2 dès 110 000 €), occupation 68 % grâce à la demande mixte tourisme + Visa pour l'Image + clientèle pro, ROI brut 7-9,5 %. Canet-en-Roussillon offre des tarifs nuit estivaux supérieurs (90-180 € contre 70-130 € en centre) mais une occupation 58 % seulement à cause de la saisonnalité 100 % balnéaire (mai-octobre actif, novembre-avril 30-40 %). Ticket d'entrée plus élevé à Canet (T2 dès 165 000 €) → ROI brut 5,5-7 %. Pour un profil cashflow, Saint-Jacques / La Réal offre les tickets d'entrée les plus bas (T2 dès 60 000 €) MAIS conditionnés à l'obtention du permis de louer — audit obligatoire avant toute décision.",
      },
    ],
    updatedAt: '2026-05-27',
  },
  // ==========================================================================
  // ROYAN
  // ==========================================================================
  {
    slug: 'royan',
    displayName: 'Royan',
    region: 'Nouvelle-Aquitaine',
    regionSlug: 'nouvelle-aquitaine',
    title: 'Conciergerie Royan Airbnb : comparatif 2026 des 6 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Royan : Comparatif 2026',
    metaDescription:
      "Comparatif des 6 meilleures conciergeries Airbnb à Royan. Tarifs (15-25 %), services, avis Google, autorisation changement d'usage 2025, quartiers rentables (Pontaillac, Foncillon).",
    kwPrincipal: 'conciergerie royan',
    kwSecondaires: [
      'conciergerie airbnb royan',
      'conciergerie charente maritime',
      'conciergerie saint palais sur mer',
      'conciergerie royan atlantique',
      'meublé tourisme royan',
    ],
    population: 19425,
    tourists: 1000000,
    activeListings: 800,
    priceLow: 80,
    priceHigh: 160,
    occupancyRate: 56,
    revpar: 50,
    seasonality:
      "Saisonnalité balnéaire ultra-marquée. Pic juillet-août absolu (occupation 92-98 %, tarifs ×2,2 vs basse saison, séjours 7-14 nuits dominants, clientèle familles nationales). Bonne tenue mai-juin et septembre (occupation 65-75 %, week-ends courts). Creux marqué novembre-mars (occupation 25-35 %), atténué uniquement par les week-ends gourmets (huîtres Marennes-Oléron) et les courts séjours seniors. La Côte de Beauté absorbe environ 90 000 visiteurs estivaux en pointe — la population de la commune double en haute saison.",
    rankNational: 28,
    introCustom:
      "Vous avez un appartement à **Royan**, sur la Grande-Conche, à Pontaillac ou à Foncillon, ou une villa Belle Époque à proximité, que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée.\n\nEntre la **clientèle 100 % saisonnière** qui concentre 60-65 % du chiffre d'affaires annuel sur juillet-août, le **numéro d'enregistrement obligatoire depuis le 1er juillet 2025** (Royan fait partie des communes pionnières avec autorisation de changement d'usage 3 ans), et la dizaine d'acteurs locaux qui se partagent un marché d'environ **800 annonces actives** sur la Côte de Beauté, vous vous demandez si confier la gestion à une conciergerie est vraiment rentable.\n\nEt surtout : **laquelle choisir** entre Royan intra-muros, Saint-Palais-sur-Mer et la couronne Vaux-sur-Mer / Saint-Georges-de-Didonne ?",
    marketIntro:
      "Royan est la **première destination LCD de la Côte de Beauté** et l'une des stations balnéaires majeures du littoral atlantique français. La commune compte **19 425 habitants** (INSEE 2023) avec une aire d'attraction de 74 917 personnes, mais sa **population double en juillet-août** (environ 90 000 visiteurs estivaux en pointe). La ville a l'une des plus fortes attractions touristiques de France parmi les communes de moins de 20 000 habitants.\n\nLa **clientèle est très majoritairement française** : familles parisiennes et bordelaises (Bordeaux à 1h45 en voiture), retraités locataires longue saison sur la Grande-Conche et Pontaillac, week-ends courts gourmets autour des **huîtres Marennes-Oléron** (1er bassin ostréicole européen, à 30 minutes). Clientèle étrangère minoritaire : Britanniques, Belges, Allemands sur juillet-août.\n\nLes **prix au m² à Royan oscillent entre 3 500 et 5 500 €** en moyenne, avec des pics à 7 500 €/m² sur Pontaillac front de mer et le quartier du Parc (vue Grande-Conche). Le **tarif moyen nuitée est de 95-150 €** hors saison, 180-280 € en haute saison juillet-août, avec des pics à 320-450 € sur les villas Belle Époque ou les biens vue mer Pontaillac.\n\nRoyan présente une **architecture moderniste de la Reconstruction** (1947-1965) unique en France : église Notre-Dame en béton, marché central couvert classé, Palais des Congrès de Foncillon — un patrimoine de plus en plus valorisé par une clientèle touristique sensible à l'architecture du XXe siècle.\n\n**Royan a anticipé la réglementation nationale dès le 1er juillet 2025** : numéro d'enregistrement obligatoire ET autorisation de changement d'usage (durée 3 ans renouvelable) pour les résidences secondaires en LCD. Un dispositif renforcé à intégrer dans tout business plan avant achat.",
    conciergeries: [
      {
        name: 'A la Hauteur',
        url: 'https://www.conciergerie-alahauteur.com/',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 222,
        biensGeres: 90,
        specialty: 'Volume avis le plus élevé Royan, rentabilisation résidences secondaires',
        description:
          "Positionnement explicite sur la rentabilisation des résidences secondaires : préparation du bien pour la location, entretien continu, accueil voyageurs. Pertinente pour un propriétaire d'un T2-T4 sur la Grande-Conche, Foncillon ou Pontaillac qui valorise un track record sur le marché plutôt qu'une nouvelle entrée.",
      },
      {
        name: 'Odyssey',
        url: 'https://odysseyroyan.com/',
        commission: 'sur devis (à la prestation)',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 143,
        biensGeres: 55,
        specialty: '2e volume avis, modèle à la prestation, partenaires artisans',
        description:
          "Modèle tarifaire à la prestation (sur devis personnalisé) plutôt que commission % : services facturés à l'unité (ménage, accueil, blanchisserie, gestion artisans). Réseau de femmes de ménage et artisans locaux sélectionnés. Pertinente pour un propriétaire qui veut piloter finement chaque ligne de coût et éviter le modèle commission % — typiquement un investisseur déjà familier avec le LCD.",
      },
      {
        name: 'ZE-Royan',
        url: 'https://www.ze-royan.fr/',
        commission: '15 % TTC',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 18,
        specialty: 'Commission la plus basse Royan, gestion complète + disponibilité 24/7',
        description:
          "ZE-Royan applique une commission 15 % TTC — la plus basse du marché royannais (vs 20-25 % chez les concurrents). Gestion complète : optimisation annonces, check-in/check-out, ménage, disponibilité 24/7. Pertinente pour un propriétaire qui veut maximiser le cashflow net via une commission contenue, en acceptant un volume d'avis plus modeste et un acteur récent en plein développement.",
      },
      {
        name: 'Conciergerie de Fanny',
        url: 'https://conciergeriedefanny.fr/',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 18,
        biensGeres: 15,
        specialty: 'Approche humaine, relation personnalisée 7j/7',
        description:
          "Approche explicitement personnalisée : un interlocuteur unique par propriétaire, relations directes avec les locataires, support 7j/7. Acteur à taille humaine. Pertinente pour un propriétaire qui valorise la proximité relationnelle (vs réseaux standardisés) et un échange direct sur chaque dossier — typiquement résidence secondaire familiale à laquelle on tient.",
      },
      {
        name: 'La Clé Conciergerie',
        url: 'https://www.lacleconciergerie.com/',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 8,
        specialty: 'Accueil voyageurs et préparation logement LCD',
        description:
          "Services centrés sur l'accueil voyageurs et la préparation des logements pour la location courte durée. Pertinente pour un propriétaire qui cherche une conciergerie en phase de croissance avec une approche personnalisée — à privilégier sur les biens à faible turn (locations longue durée 2 semaines+) plutôt que sur du week-end intensif.",
      },
      {
        name: 'Alpo Conciergerie',
        url: 'https://alpo-conciergerie.fr/',
        commission: '20 % HT',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 7,
        specialty: 'Tarification claire, optimisation rentabilité',
        description:
          "Alpo Conciergerie applique une commission claire 20 % HT. Positionnement sur l'optimisation de rentabilité et l'expérience client. Pertinente pour un propriétaire qui privilégie une grille tarifaire transparente sans devis sur mesure — à mettre en balance avec la note inférieure aux principaux concurrents royannais et le faible volume d'avis.",
      },
    ],
    neighborhoods: [
      {
        name: 'Pontaillac',
        pricePerNight: '140-280 €',
        occupancy: 70,
        description:
          "Quartier résidentiel haut de gamme à l'ouest, plage en demi-lune classée parmi les plus belles de la côte atlantique, villas Belle Époque (Villa Frégate, Villa Saraza). Clientèle premium familiale, séjours 7-14 nuits. Prix au m² 5 500-7 500 €. T2 dès 240 000 €, villa Belle Époque dès 750 000 €. Le secteur le plus prisé en LCD royannais.",
        roiBrut: '4 à 5,5 %',
      },
      {
        name: 'Foncillon / Centre',
        pricePerNight: '110-200 €',
        occupancy: 65,
        description:
          "Quartier emblématique de la Reconstruction (1947-1965) autour du Palais des Congrès, port de plaisance (1 100 anneaux), marché central couvert classé. Architecture moderniste valorisée par une clientèle culturelle. Prix au m² 3 800-4 800 €. T2 dès 165 000 €. Excellent compromis entre tarif d'achat et tarif location.",
        roiBrut: '5,5 à 7 %',
      },
      {
        name: 'Le Parc / Grande-Conche',
        pricePerNight: '160-320 €',
        occupancy: 68,
        description:
          "Quartier résidentiel haut de gamme surplombant la Grande-Conche (plage 2 km), avenue de Pontaillac. Architecture mixte Belle Époque + reconstruction. Clientèle premium internationale en haute saison. Prix au m² 5 200-7 200 €. T2 dès 220 000 €. ROI brut bas mais valeur patrimoniale forte.",
        roiBrut: '4 à 5,5 %',
      },
      {
        name: 'Saint-Pierre / Vieille Ville',
        pricePerNight: '90-160 €',
        occupancy: 62,
        description:
          "Quartier historique antérieur à la Reconstruction (l'un des rares secteurs épargnés par les bombardements 1945), autour de l'église Saint-Pierre et du Château de Mons. Charme XIXe et architecture pré-Belle Époque. Prix au m² 3 200-4 200 €. T2 dès 140 000 €. Hors front de mer mais à 5-10 min des plages.",
        roiBrut: '6 à 7,5 %',
      },
      {
        name: 'Saint-Palais-sur-Mer (3 km)',
        pricePerNight: '110-220 €',
        occupancy: 60,
        description:
          "Commune voisine à l'ouest, plage du Bureau, falaises de la Côte Sauvage. Architecture villégiature plus authentique, ambiance familiale moins urbaine que Royan. Clientèle nationale 100 % saisonnière. Prix au m² 4 200-5 800 €. T2 dès 180 000 €. Bon compromis pour un investisseur cherchant un cadre plus calme.",
        roiBrut: '5 à 6,5 %',
      },
      {
        name: 'Vaux-sur-Mer / Saint-Georges-de-Didonne (5-7 km)',
        pricePerNight: '90-180 €',
        occupancy: 58,
        description:
          "Communes de la couronne royannaise. Vaux-sur-Mer (5 km, golf, immobilier familial), Saint-Georges-de-Didonne (7 km, plage de la Grande Conche prolongée, pinède classée). Architecture plus rurale, plages familiales. Prix au m² 3 000-4 200 €. T2 dès 140 000 €. Excellent profil cashflow pour un investisseur cherchant un meilleur ROI brut.",
        roiBrut: '5,5 à 7 %',
      },
    ],
    regulation:
      "Royan fait partie des **communes pionnières de Charente-Maritime** ayant anticipé le cadre national : depuis le **1er juillet 2025**, tous les hébergeurs en meublé de tourisme doivent obligatoirement s'enregistrer ET demander une autorisation de changement d'usage. Un dispositif renforcé à intégrer dans tout business plan d'investissement avant achat.\n\n**Numéro d'enregistrement obligatoire depuis le 1er juillet 2025.** Tout meublé de tourisme (résidence principale ou secondaire) doit être enregistré auprès de la mairie de Royan. La déclaration génère un numéro à porter obligatoirement sur chaque annonce Airbnb, Booking, Abritel. Sans ce numéro, les plateformes désactivent automatiquement les annonces.\n\n**Autorisation de changement d'usage (résidences secondaires).** Pour les biens loués hors résidence principale, une autorisation de changement d'usage de 3 ans (renouvelable) est exigée par la mairie. Le dispositif vise à limiter la transformation du parc résidentiel en meublés touristiques. À privilégier : déposer la demande avant l'achat pour valider l'éligibilité du bien, plutôt qu'après acquisition.\n\n**Enregistrement Declaloc national au 20 mai 2026.** À cette date, le téléservice national unique (apimeubles.finances.gouv.fr) deviendra obligatoire pour toutes les communes françaises et harmonisera les numéros à 13 chiffres. Royan est déjà conforme — la transition sera transparente pour les hébergeurs déjà enregistrés.\n\n**Résidence principale.** Limite nationale de **120 nuitées par an** pour la location en résidence principale (celle que vous occupez au moins 8 mois par an, sauf obligation professionnelle, raison de santé ou force majeure). Royan n'a pas (encore) abaissé ce plafond à 90 jours.\n\n**Loi Le Meur 2024.** DPE classe E minimum obligatoire (classe D à partir de 2034), abattement micro-BIC à 30 % pour les meublés non classés (50 % pour les classés tourisme). Biens classés F ou G au DPE interdits à la location courte durée à partir du 1er janvier 2028. Amendes : **10 000 € pour défaut d'enregistrement**, **20 000 € pour fausse déclaration**, **jusqu'à 50 000 € pour changement d'usage illégal**.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** La Communauté d'Agglomération Royan Atlantique (CARA) applique une taxe de séjour de 0,75 € à 4,30 € par nuit et par personne adulte selon le classement de l'hébergement, collectée automatiquement par Airbnb. Recettes affectées au tourisme et à la protection du littoral.",
    concreteExample: {
      bienType: 'T2',
      surface: 45,
      pricePerNight: 130,
      neighborhood: 'Foncillon / centre Royan',
      revenuBrut: 24000,
      commissionRate: 0.20,
      menageCount: 75,
      menageUnitCost: 70,
    },
    extraFaq: [
      {
        q: 'Faut-il obtenir une autorisation pour louer un Airbnb à Royan en 2026 ?',
        a: "Oui — Royan a anticipé la réglementation dès le 1er juillet 2025. Tout meublé de tourisme (résidence principale ou secondaire) doit obtenir un numéro d'enregistrement auprès de la mairie. Pour les résidences secondaires louées en LCD, une autorisation de changement d'usage de 3 ans renouvelable est en plus obligatoire. La demande est à déposer avant la mise en location (idéalement avant l'achat du bien pour sécuriser l'investissement). Sans numéro d'enregistrement, les plateformes (Airbnb, Booking, Abritel) désactivent automatiquement les annonces. À partir du 20 mai 2026, le numéro Declaloc national à 13 chiffres remplacera le système actuel — la transition est transparente pour les hébergeurs déjà enregistrés à Royan.",
      },
      {
        q: "Combien rapporte un Airbnb à Royan en juillet-août ?",
        a: "La haute saison juillet-août concentre 60 à 65 % du chiffre d'affaires annuel d'un Airbnb royannais. Un T2 sur Foncillon qui se loue 130 €/nuit en moyenne annuelle atteint 220-280 €/nuit en juillet-août, avec une occupation 92-98 % et des séjours 7-14 nuits dominants (familles en vacances). Sur les 9 semaines de haute saison, un T2 bien placé peut générer 14 000 à 18 000 € bruts — soit environ 60 % du revenu brut annuel. Pour maximiser : viser un bien équipé pour 4-6 personnes (T2 cabine, T3) avec extérieur (terrasse, balcon), à proximité piétonne d'une plage. La clientèle saisonnière est exigeante sur le linge, l'équipement bébé et la climatisation.",
      },
      {
        q: 'Vaut-il mieux investir à Pontaillac, Foncillon ou Saint-Palais-sur-Mer ?',
        a: "Pour un objectif rentabilité, Foncillon est le meilleur compromis : prix au m² 3 800-4 800 € (les plus accessibles intra-muros), occupation 65 % grâce à la demande mixte Palais des Congrès + plage + marché central, ROI brut 5,5-7 %. Pontaillac offre les meilleurs tarifs nuitée (140-280 €) mais avec un ticket d'entrée >240 000 € et un ROI brut limité (4-5,5 %) — à privilégier pour un profil patrimonial pur (valeur Belle Époque). Saint-Palais-sur-Mer (3 km) propose des tickets d'entrée intermédiaires (T2 dès 180 000 €) et une ambiance plus familiale, ROI brut 5-6,5 %. Pour un profil cashflow, regarder Vaux-sur-Mer ou Saint-Georges-de-Didonne (T2 dès 140 000 €, ROI brut 5,5-7 %).",
      },
    ],
    updatedAt: '2026-05-27',
  },
  // ==========================================================================
  // FRÉJUS
  // ==========================================================================
  {
    slug: 'frejus',
    displayName: 'Fréjus',
    region: 'Provence-Alpes-Côte d\'Azur',
    regionSlug: 'provence-alpes-cote-dazur',
    title: 'Conciergerie Fréjus Airbnb : comparatif 2026 des 6 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Fréjus : Comparatif 2026',
    metaDescription:
      "Comparatif des 6 meilleures conciergeries Airbnb à Fréjus et Saint-Raphaël. Tarifs (20-25 %), services, avis Google, réglementation 2026, quartiers rentables (Fréjus-Plage, Valescure, Saint-Aygulf).",
    kwPrincipal: 'conciergerie frejus',
    kwSecondaires: [
      'conciergerie airbnb frejus',
      'conciergerie saint raphael',
      'conciergerie fréjus',
      'conciergerie saint aygulf',
      'gestion locative frejus',
    ],
    population: 59719,
    tourists: 2200000,
    activeListings: 1100,
    priceLow: 80,
    priceHigh: 170,
    occupancyRate: 64,
    revpar: 60,
    seasonality:
      "Saisonnalité méditerranéenne intense. Pic juillet-août (occupation 90-96 %, tarifs ×2 vs basse saison, clientèle familles françaises et nord-européennes, séjours 7-14 nuits dominants sur Fréjus-Plage et Saint-Aygulf). Bonne tenue avril-juin et septembre-octobre (occupation 65-78 %, week-ends courts, tourisme culturel autour des vestiges romains). Festival Sons et Cinéma de Fréjus (août) et événements nautiques au Port-Fréjus. Creux décembre-février (occupation 35-45 %), atténué par la clientèle senior nord-européenne (Belges, Allemands, Britanniques) en location longue saison hivernale.",
    rankNational: 19,
    introCustom:
      "Vous avez un appartement à **Fréjus**, en centre ancien près de l'amphithéâtre romain, sur Fréjus-Plage le long des 6 km de sable, ou à **Saint-Aygulf** côté ouest, que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée.\n\nEntre la **plage continue de 6 km** qui draine 2,2 millions de visiteurs annuels (avec Saint-Raphaël jumelée), les **vestiges romains** (Forum Julii, 2e concentration française après Arles) qui étalent la saison sur les ailes de saison, et la quinzaine d'acteurs qui se partagent un marché d'environ **1 100 annonces actives** sur Fréjus-Saint-Raphaël, vous vous demandez si confier la gestion à une conciergerie est vraiment rentable.\n\nEt surtout : **laquelle choisir** entre Fréjus intra-muros, Fréjus-Plage et la couronne Saint-Aygulf / Saint-Raphaël ?",
    marketIntro:
      "Fréjus est le **pôle économique, culturel et touristique de l'Est du Var**, avec sa voisine immédiate **Saint-Raphaël** (les deux villes forment de fait un même marché LCD). La commune compte **59 719 habitants** (INSEE 2023, +13,4 % depuis 2017, l'une des croissances démographiques les plus fortes de la Côte d'Azur).\n\nLa ville cumule deux atouts uniques : **6 km de plage de sable blond presque continue** (de Saint-Aygulf à Saint-Raphaël) — une rareté sur la Côte d'Azur dominée par les criques rocheuses — et **la plus grande concentration française de vestiges antiques après Arles** (amphithéâtre romain, aqueduc, Porte des Gaules, ancien port romain Forum Julii). Cette combinaison plage + patrimoine étale la saison touristique sur les ailes de saison (avril-juin, septembre-octobre).\n\nLa **clientèle est mixte** : familles françaises sur juillet-août (60 % du CA annuel), nord-Européens en location longue saison (Belges, Allemands, Britanniques, Néerlandais — résidents fréjusiens hivernaux), couples seniors hors saison sur le tourisme culturel romain, plaisanciers via le **Port-Fréjus** (ferry vers Saint-Tropez et Cannes en saison).\n\nLes **prix au m² à Fréjus oscillent entre 4 000 et 6 500 €** en moyenne, avec des pics à 8 500 €/m² sur Valescure (résidentiel haut de gamme) et 7 500 €/m² front de mer Saint-Aygulf. Le **tarif moyen nuitée est de 100-160 €** hors saison, 200-320 € en haute saison juillet-août, avec des pics à 380-550 € sur les villas Valescure ou les biens vue mer Port-Fréjus.\n\nFréjus suit le **cadre national de l'enregistrement** sans dispositif local renforcé spécifique au-delà du Declaloc obligatoire au 20 mai 2026 — un avantage pour les investisseurs vs Royan ou les communes côtières en tension (Cannes, Antibes, Saint-Tropez).",
    conciergeries: [
      {
        name: 'Agence La Clé d\'Hermès',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 43,
        biensGeres: 65,
        specialty: 'Volume avis le plus élevé Fréjus, services immobiliers complets',
        description:
          "Approche immobilière globale : vente, location longue durée, gestion locative LCD, estimations, programmes neufs. Pertinente pour un propriétaire qui veut un interlocuteur unique sur l'ensemble du parcours (achat + mise en location + revente éventuelle) plutôt qu'une conciergerie pure LCD.",
      },
      {
        name: 'Estérel Conciergerie Fréjus-Saint-Raphaël',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 39,
        biensGeres: 40,
        specialty: 'Issue de l\'hôtellerie professionnelle, locations 2-8 personnes',
        description:
          "Équipe issue de l'hôtellerie professionnelle — un différenciateur fort sur l'accueil voyageurs (standards de service hôteliers : linge premium, welcome pack, communication fluide). Disponibilité annuelle (vs acteurs saisonniers). Couverture : Fréjus, Saint-Raphaël, Saint-Aygulf, Boulouris. Pertinente pour un propriétaire qui valorise une exécution premium face à une clientèle exigeante (familles haut de gamme, plaisanciers Port-Fréjus).",
      },
      {
        name: 'Clés d\'Azur',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 43,
        biensGeres: 30,
        specialty: 'Locations vacances haut de gamme Côte d\'Azur',
        description:
          "Positionnement sur le segment haut de gamme Côte d'Azur (locations vacances premium, biens 80m²+, vue mer, prestations différenciantes). Gestion réservations, assistance clientèle, partenaires locaux. Pertinente pour un propriétaire d'un T3-T4 sur Fréjus-Plage rénové ou d'une villa Valescure / Saint-Aygulf qui cible une clientèle premium internationale plutôt que le segment famille standard.",
      },
      {
        name: 'Bibo Conciergerie',
        url: 'https://bibo-conciergerie.com/',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 44,
        biensGeres: 32,
        specialty: 'Couverture Fréjus + Saint-Raphaël + Saint-Aygulf, gestion saisonnière',
        description:
          "Couverture explicite Fréjus, Saint-Raphaël et Saint-Aygulf — le périmètre marché complet. Gestion locative saisonnière intégrale : accueil, ménage, entretien linge, maintenance, travaux. Pertinente pour un propriétaire dont le bien se situe entre Fréjus centre et la couronne ouest (Saint-Aygulf) et qui veut une équipe locale couvrant les deux secteurs sans intermédiaire.",
      },
      {
        name: 'CapitalChic Conciergerie',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 47,
        biensGeres: 18,
        specialty: 'Luxe, gastronomie, bien-être, services premium personnalisés',
        description:
          "Positionnement explicite sur la conciergerie de luxe : gastronomie (réservations Michelin, chef à domicile), bien-être (massages, yoga, coaching), services premium personnalisés (transferts, location voiture/yacht). Pertinente pour un propriétaire d'une villa de standing à Valescure, Caïs ou front de mer Port-Fréjus qui cherche à différencier son offre sur Airbnb Luxe / Plum Guide / Welcome Beyond.",
      },
      {
        name: 'Interhome Fréjus',
        commission: '20-25 %',
        menage: 'refacturé voyageur',
        rating: 4.1,
        reviews: 65,
        biensGeres: 50,
        specialty: 'Réseau international 50+ pays, optimisation revenus, service 24/7',
        description:
          "Interhome est un acteur international (réseau dans plus de 50 pays). Commission 20-25 %, ménage refacturé voyageur. Forte diffusion sur la clientèle européenne (Allemands, Suisses, Britanniques, Belges, Néerlandais — segments majeurs à Fréjus en location longue saison hivernale). Service 24/7. Pertinente pour un propriétaire qui veut maximiser l'accès à la clientèle étrangère et pré-saison hivernale via une marque internationale reconnue — à mettre en balance avec la note inférieure aux acteurs locaux.",
      },
    ],
    neighborhoods: [
      {
        name: 'Fréjus-Plage',
        pricePerNight: '120-280 €',
        occupancy: 72,
        description:
          "Le secteur balnéaire emblématique de Fréjus, 2,5 km de plage de sable continue, restaurants, bars de plage, animations estivales. Clientèle famille française très dominante juillet-août. Prix au m² 4 800-6 800 €. T2 dès 195 000 €. Le plus liquide à la revente — demande LCD constante.",
        roiBrut: '5,5 à 7 %',
      },
      {
        name: 'Centre ancien / Vestiges romains',
        pricePerNight: '90-180 €',
        occupancy: 66,
        description:
          "Cœur historique autour de l'amphithéâtre romain, Porte des Gaules, Place Formigé, Cathédrale Saint-Léonce. Mix tourisme culturel + commerce. Étalement saisonnier grâce au patrimoine (vestiges romains visités d'avril à octobre). Prix au m² 3 500-4 800 €. T2 dès 145 000 €. Excellent compromis cashflow + valeur patrimoniale.",
        roiBrut: '6 à 8 %',
      },
      {
        name: 'Saint-Aygulf',
        pricePerNight: '110-220 €',
        occupancy: 68,
        description:
          "Station balnéaire à l'ouest de Fréjus (côté Sainte-Maxime), plage du Pébrier, calanques de Saint-Aygulf, ambiance plus familiale et résidentielle que Fréjus-Plage. Clientèle 100 % saisonnière. Prix au m² 4 500-6 200 €. T2 dès 175 000 €. Bon compromis pour un investisseur cherchant un cadre plus calme tout en restant en ALPC.",
        roiBrut: '5,5 à 7 %',
      },
      {
        name: 'Valescure',
        pricePerNight: '160-380 €',
        occupancy: 60,
        description:
          "Quartier résidentiel haut de gamme à l'est, golf 18 trous de Valescure, villas Belle Époque dans la pinède, calme absolu. Clientèle premium familiale et événementielle. Prix au m² 5 500-8 500 €. Villa T5 dès 950 000 €. ROI brut plus faible mais valeur patrimoniale forte et clientèle fidélisée long terme.",
        roiBrut: '3,5 à 5 %',
      },
      {
        name: 'Port-Fréjus',
        pricePerNight: '130-260 €',
        occupancy: 65,
        description:
          "Port de plaisance moderne (750 anneaux), ferry vers Saint-Tropez et Cannes en saison estivale, restaurants front de port, immobilier neuf années 1990-2010. Clientèle plaisanciers + couples week-end. Prix au m² 5 200-7 000 €. T2 dès 210 000 €. Très liquide à la revente.",
        roiBrut: '5 à 6,5 %',
      },
      {
        name: 'Saint-Raphaël (jumelle, 3 km)',
        pricePerNight: '120-260 €',
        occupancy: 68,
        description:
          "Commune immédiatement à l'est de Fréjus, plage du Veillat, basilique Notre-Dame-de-la-Victoire, gare TGV directe Paris (5h30) — un atout LCD majeur. Marché jumeau avec Fréjus, prix au m² 5 000-6 800 €. T2 dès 200 000 €. Gare TGV = clientèle parisienne week-end forte d'avril à octobre.",
        roiBrut: '5,5 à 7 %',
      },
    ],
    regulation:
      "Fréjus suit le **cadre national de l'enregistrement des meublés de tourisme** sans dispositif local renforcé spécifique — un avantage pour les investisseurs vs Royan ou les communes côtières en tension (Cannes, Antibes, Saint-Tropez).\n\n**Enregistrement Declaloc national au 20 mai 2026.** À cette date, le téléservice national unique (apimeubles.finances.gouv.fr) deviendra obligatoire pour toutes les communes françaises et harmonisera les numéros à 13 chiffres. La déclaration en mairie reste exigée pour tout meublé de tourisme (résidence principale ou secondaire). Sans ce numéro, les plateformes (Airbnb, Booking, Abritel) désactiveront automatiquement les annonces.\n\n**Résidence principale.** Limite nationale de **120 nuitées par an** pour la location en résidence principale (celle que vous occupez au moins 8 mois par an, sauf obligation professionnelle, raison de santé ou force majeure). Les maires peuvent désormais décider d'abaisser ce seuil à 90 jours — Fréjus n'a pas (à ce jour) actionné cette option.\n\n**Changement d'usage en copropriété.** Si votre logement fait partie d'une copropriété, vérifiez que le règlement de copropriété ne contient pas de clause d'usage exclusivement résidentiel. À Fréjus, plusieurs copropriétés Valescure et Port-Fréjus ont voté de telles clauses ces dernières années pour préserver le calme — un facteur à vérifier avant tout achat dans ces secteurs.\n\n**Loi Le Meur 2024.** DPE classe E minimum obligatoire (classe D à partir de 2034), abattement micro-BIC à 30 % pour les meublés non classés (50 % pour les classés tourisme). Biens classés F ou G au DPE interdits à la location courte durée à partir du 1er janvier 2028. Amendes : **10 000 € pour défaut d'enregistrement**, **20 000 € pour fausse déclaration ou numéro falsifié**.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** La Communauté d'Agglomération Var Estérel Méditerranée (CAVEM) applique une taxe de séjour de 0,85 € à 4,30 € par nuit et par personne adulte selon le classement de l'hébergement, collectée automatiquement par Airbnb. Recettes affectées au tourisme, aux plages et à la préservation des espaces naturels (massif de l'Estérel).",
    concreteExample: {
      bienType: 'T2',
      surface: 45,
      pricePerNight: 145,
      neighborhood: 'Fréjus-Plage',
      revenuBrut: 30000,
      commissionRate: 0.22,
      menageCount: 78,
      menageUnitCost: 75,
    },
    extraFaq: [
      {
        q: "Quels quartiers privilégier pour investir en LCD à Fréjus ?",
        a: "Pour un objectif rentabilité, Fréjus-Plage est le meilleur compromis : prix au m² 4 800-6 800 € (T2 dès 195 000 €), occupation 72 % la plus élevée de la commune, ROI brut 5,5-7 %. Le centre ancien autour des vestiges romains offre des tickets d'entrée plus bas (T2 dès 145 000 €), occupation 66 % grâce à la demande lissée tourisme culturel + commerce, ROI brut 6-8 % — souvent le meilleur cashflow. Saint-Aygulf (3 km à l'ouest) propose une ambiance plus familiale (T2 dès 175 000 €, ROI brut 5,5-7 %). Pour un profil patrimonial pur, viser Valescure (villas Belle Époque, ROI brut 3,5-5 % mais valeur refuge). Port-Fréjus est très liquide à la revente mais ROI brut intermédiaire (5-6,5 %).",
      },
      {
        q: "Combien rapporte un Airbnb à Fréjus en juillet-août ?",
        a: "La haute saison juillet-août concentre 50 à 55 % du chiffre d'affaires annuel d'un Airbnb fréjusien — moins concentrée qu'à Royan grâce aux ailes de saison étalées (vestiges romains, clientèle senior nord-européenne hivernale). Un T2 sur Fréjus-Plage qui se loue 145 €/nuit en moyenne annuelle atteint 240-320 €/nuit en juillet-août, avec une occupation 90-96 % et des séjours 7-14 nuits dominants. Sur les 9 semaines de haute saison, un T2 bien placé peut générer 16 000 à 21 000 € bruts. La climatisation est devenue indispensable (été 32-38°C la journée) et conditionne fortement les avis voyageurs sur Airbnb.",
      },
      {
        q: "Faut-il une autorisation pour louer un Airbnb à Fréjus en 2026 ?",
        a: "Fréjus suit le cadre national sans dispositif renforcé spécifique. La déclaration en mairie est obligatoire pour tout meublé de tourisme (résidence principale ou secondaire), avec génération d'un numéro d'enregistrement à porter sur chaque annonce. À partir du 20 mai 2026, le numéro Declaloc national à 13 chiffres remplacera les systèmes locaux. Pour la résidence principale, la limite nationale de 120 nuitées par an reste en vigueur (Fréjus n'a pas activé l'abaissement à 90 jours autorisé par la loi Le Meur 2024). Attention au règlement de copropriété : plusieurs immeubles à Valescure et Port-Fréjus ont voté des clauses d'usage exclusivement résidentiel — à vérifier avant tout achat dans ces secteurs.",
      },
    ],
    updatedAt: '2026-05-27',
  },
  // ==========================================================================
  // GRENOBLE
  // ==========================================================================
  {
    slug: 'grenoble',
    displayName: 'Grenoble',
    region: 'Auvergne-Rhône-Alpes',
    regionSlug: 'auvergne-rhone-alpes',
    title: 'Conciergerie Grenoble Airbnb : comparatif 2026 des 6 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Grenoble : Comparatif 2026',
    metaDescription:
      "Comparatif des 6 meilleures conciergeries Airbnb à Grenoble. Tarifs (15-25 %), services, avis Google, autorisation changement d'usage zone tendue, quartiers rentables (Vieille Ville, Bonne).",
    kwPrincipal: 'conciergerie grenoble',
    kwSecondaires: [
      'conciergerie airbnb grenoble',
      'gestion locative grenoble',
      'conciergerie chamrousse',
      'conciergerie airbnb alpes',
      'meublé tourisme grenoble',
    ],
    population: 156140,
    tourists: 2500000,
    activeListings: 1300,
    priceLow: 55,
    priceHigh: 110,
    occupancyRate: 68,
    revpar: 50,
    seasonality:
      "Saisonnalité bimodale ville + montagne. Pic hiver décembre-mars (occupation 80-90 %, clientèle skieurs Chamrousse à 14 km, séjours week-end et semaine, tarifs ×1,5-1,8). Pic été juillet-août (occupation 75-85 %, randonneurs Chartreuse-Belledonne-Vercors, festivals, clientèle internationale culturelle). Mi-saison printemps + automne soutenue par la clientèle universitaire (université Grenoble Alpes, 60 000 étudiants, marché étudiant moyen-long terme via Airbnb), événements (Festival Cabaret Frappé, Foire des Rameaux, salons CES type technologies). Creux limité à novembre (entre saison ski et toussaint).",
    rankNational: 22,
    introCustom:
      "Vous avez un appartement à **Grenoble**, en centre piéton autour de la place Grenette ou de Notre-Dame, dans l'éco-quartier de Bonne, à proximité de l'**université Grenoble Alpes** (60 000 étudiants), que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée.\n\nEntre la **clientèle ski en hiver** (Chamrousse à 14 km, Les 7 Laux, Alpe d'Huez à 1h, séjours week-ends + semaines), la **clientèle universitaire et professionnelle** lissée toute l'année (CEA, Schneider Electric, Atos, ST Microelectronics), l'**autorisation de changement d'usage** désormais exigée par la mairie avec **compensation à partir du 2e meublé** (zone tendue), et la quinzaine d'acteurs qui se partagent un marché d'environ **1 300 annonces actives**, vous vous demandez si confier la gestion à une conciergerie est vraiment rentable.\n\nEt surtout : **laquelle choisir** entre Grenoble intra-muros, la couronne universitaire (Saint-Martin-d'Hères, Gières) et l'axe stations de ski (Uriage, Chamrousse) ?",
    marketIntro:
      "Grenoble est la **capitale des Alpes françaises** et la 2e agglomération d'Auvergne-Rhône-Alpes derrière Lyon. La commune compte **156 140 habitants** (INSEE 2023), une aire urbaine de **457 409 résidents** — un marché LCD urbain dense doublé d'un hub touristique alpin majeur. Position stratégique : **encerclée par 3 massifs** (Chartreuse, Belledonne, Vercors), **14 km de Chamrousse**, **1h des Deux-Alpes / Alpe d'Huez**, **45 min de Lyon Saint-Exupéry** en train.\n\nLa **clientèle est mixte et lissée** sur l'année : skieurs hivernaux (décembre-mars, séjours week-end depuis Paris/Genève/Marseille via TGV ou avion via Lyon-Saint-Exupéry), randonneurs et amateurs de montagne estivaux (juillet-août, Tour du Mont-Blanc à 2h, Vercors via Villard-de-Lans à 35 min), professionnels du high-tech (Grenoble est l'un des principaux pôles européens en nanotechnologies, photonique, énergie — CEA, Schneider Electric, ST Microelectronics, Atos, Inria), étudiants internationaux (60 000 étudiants à l'université Grenoble Alpes, séjours 1-6 mois).\n\nLes **prix au m² à Grenoble restent accessibles** : 2 800-4 200 €/m² en centre, 4 200-5 800 €/m² sur les quartiers prisés (Notre-Dame, hyper-centre piéton, Île Verte) — un niveau bien inférieur à Lyon (5 500-8 000 €) ou Annecy (6 500-9 500 €), un avantage clair pour les nouveaux investisseurs LCD en Auvergne-Rhône-Alpes.\n\nLe **tarif moyen nuitée est de 65-95 €** en moyenne annuelle, 110-160 € en haute saison hiver (week-end ski), 80-130 € en saison estivale randonnée et événements.\n\nGrenoble est classée en **zone tendue** : la mairie exige une **autorisation de changement d'usage** pour transformer un logement résidentiel en meublé de tourisme, avec **compensation obligatoire à partir du 2e meublé** transformé. Un dispositif renforcé à intégrer dans tout business plan avant achat. Amendes pouvant atteindre **50 000 €** pour changement d'usage illégal.",
    conciergeries: [
      {
        name: 'Capsule Corp Conciergerie Airbnb',
        url: 'https://www.capsulecorp-conciergerie-grenoble.fr/',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 71,
        biensGeres: 35,
        specialty: 'Note maximale, gestion complète + adossée agence immobilière',
        description:
          "Gestion complète : annonces, réservations, check-in/check-out, ménage professionnel, gestion du linge, pricing dynamique. Pertinente pour un propriétaire qui veut un service intégré et un interlocuteur unique sur tout le cycle LCD grenoblois.",
      },
      {
        name: 'Premier Hôte',
        url: 'https://premierhote.com/conciergerie-grenoble/',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 24,
        biensGeres: 28,
        specialty: 'Optimisation revenus, gestion 360°',
        description:
          "Positionnement explicite sur la maximisation des revenus locatifs sans effort propriétaire : optimisation pricing, photos professionnelles, communication voyageurs, gestion opérationnelle. Pertinente pour un propriétaire actif (job temps plein) qui veut un service totalement déléguant et un suivi régulier des KPIs (taux d'occupation, tarif moyen nuitée).",
      },
      {
        name: 'YourHostHelper Grenoble',
        url: 'https://yourhosthelper.com/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.2,
        reviews: 5,
        biensGeres: 30,
        specialty: 'Réseau national 20+ villes, dashboard propriétaire, pricing dynamique',
        description:
          "Filiale de YourHostHelper (présent dans 20+ villes françaises), cette conciergerie mise sur l'optimisation du revenu via un pricing dynamique quotidien et des photos professionnelles incluses gratuitement au lancement. Commission 20 %, ménage refacturé voyageur. Dashboard propriétaire avec prévisions de revenus et recommandations d'optimisation. Bien adaptée aux T1-T2 standards et aux propriétaires multi-villes (intégration dashboard unique).",
      },
      {
        name: 'Home Partner — LA CONCIERGERIE',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 5.0,
        reviews: 6,
        biensGeres: 10,
        specialty: 'Réseau national, services personnalisés voyageur',
        description:
          "Réseau national avec services personnalisés voyageur : welcome kit, location d'équipement (lit bébé, ski, raquettes), réservation d'activités (cours de ski Chamrousse, restaurants). Pertinente pour un propriétaire d'un T3-T4 qui cherche à différencier l'expérience voyageur via des services additionnels (clientèle skieurs week-end et randonneurs).",
      },
      {
        name: 'Nomade Conciergerie',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 6,
        specialty: 'Optimisation LCD, photos pro, calendrier multi-plateformes',
        description:
          "Services orientés optimisation LCD : annonce, photos professionnelles, gestion calendrier multi-plateformes (Airbnb + Booking + Abritel synchronisés), maintenance. Pertinente pour un propriétaire qui veut un acteur en croissance avec une approche personnalisée — à privilégier sur les biens à fort potentiel d'optimisation initial (annonce existante sous-performante).",
      },
      {
        name: 'HelloFrancis',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 5,
        specialty: 'Grenoble + Aix-les-Bains, +20-30 % revenu annoncé',
        description:
          "Couverture Grenoble + Aix-les-Bains (axe Alpes). Positionnement explicite sur l'augmentation de revenu locatif (+20-30 % annoncé vs gestion propriétaire). Pertinente pour un propriétaire multi-biens sur l'axe Grenoble-Aix-les-Bains qui veut un acteur unique, en acceptant un faible volume d'avis à ce stade.",
      },
    ],
    neighborhoods: [
      {
        name: 'Hyper-centre piéton / Notre-Dame',
        pricePerNight: '75-130 €',
        occupancy: 75,
        description:
          "Cœur historique piéton autour de la place Grenette, place Notre-Dame, place Saint-André et place Grenette. Restaurants, terrasses, marché de Noël en décembre. Demande LCD lissée toute l'année (week-ends, professionnels, étudiants). Prix au m² 3 800-5 200 €. T2 dès 165 000 €. Le secteur le plus liquide en LCD à Grenoble.",
        roiBrut: '6 à 8 %',
      },
      {
        name: 'Vieille Ville / Saint-Hugues',
        pricePerNight: '70-120 €',
        occupancy: 72,
        description:
          "Quartier médiéval autour de l'ancien évêché (Saint-Hugues), Maison Stendhal, jardin de Ville. Mix charme historique + résidentiel calme à 5 min du tram. Demande touristique + week-end pro. Prix au m² 3 500-4 800 €. T2 dès 150 000 €. Excellent compromis charme + accessibilité.",
        roiBrut: '6 à 8,5 %',
      },
      {
        name: 'Bonne (éco-quartier)',
        pricePerNight: '70-115 €',
        occupancy: 70,
        description:
          "Éco-quartier moderne primé (Grand Prix national EcoQuartier), bâtiments énergie positive, parc Hoche, commerces neufs. Clientèle CSP+ professionnels high-tech + week-ends courts. Prix au m² 4 200-5 500 €. T2 dès 180 000 €. DPE A-B garanti — anticipation parfaite des normes Le Meur 2028.",
        roiBrut: '5,5 à 7 %',
      },
      {
        name: 'Île Verte / Berges de l\'Isère',
        pricePerNight: '70-110 €',
        occupancy: 68,
        description:
          "Quartier résidentiel familial entre l'Isère et la voie ferrée, vue Bastille (téléphérique des Bulles), école centrale de Grenoble à proximité. Clientèle famille + universitaire. Prix au m² 3 200-4 200 €. T2 dès 135 000 €. Bon compromis prix d'achat + occupation.",
        roiBrut: '6,5 à 8,5 %',
      },
      {
        name: 'Chorier-Berriat / Saint-Bruno',
        pricePerNight: '65-100 €',
        occupancy: 65,
        description:
          "Quartier en gentrification rapide à l'ouest du centre, ancien quartier ouvrier devenu hipster (cafés, ateliers d'artistes, marché Saint-Bruno). Clientèle jeunes pros + courts séjours. Prix au m² 2 800-3 800 €. T2 dès 115 000 €. Ticket d'entrée le plus accessible intra-muros, potentiel de valorisation.",
        roiBrut: '7 à 9 %',
      },
      {
        name: 'Axe Chamrousse / Uriage (14-20 km)',
        pricePerNight: '85-160 €',
        occupancy: 62,
        description:
          "Axe stations de ski au sud-est : Uriage-les-Bains (20 min, station thermale + golf), Chamrousse (40 min, station olympique 1968, 2 000-2 250m). Clientèle ski hiver + bien-être été. Prix au m² 3 000-4 500 € à Uriage, 3 500-5 500 € à Chamrousse. T2 dès 120 000 € à Uriage. Saisonnalité plus marquée (60-70 % du CA sur 5 mois ski).",
        roiBrut: '5,5 à 7 %',
      },
    ],
    regulation:
      "Grenoble est classée en **zone tendue** : la commune applique un cadre renforcé pour la location en meublé de tourisme, avec des sanctions financières parmi les plus lourdes de France.\n\n**Autorisation de changement d'usage obligatoire.** Pour transformer un logement résidentiel en meublé de tourisme à Grenoble, une autorisation de changement d'usage est exigée par la mairie. La **compensation est obligatoire à partir du 2e logement** transformé en meublé : le propriétaire doit, en parallèle, transformer une surface équivalente de local commercial en résidentiel — un dispositif visant à protéger le parc locatif résidentiel grenoblois.\n\n**Numéro d'enregistrement 13 chiffres.** Toute location de meublé de tourisme (résidence principale ou secondaire) requiert un numéro d'enregistrement délivré par la mairie de Grenoble (formulaire CERFA, Service Relations aux Usagers - Réglementation, 11 boulevard Jean Pain). À porter sur chaque annonce Airbnb, Booking, Abritel. À partir du 20 mai 2026, le téléservice national unique (apimeubles.finances.gouv.fr) prendra le relais avec harmonisation à 13 chiffres.\n\n**Résidence principale.** Limite nationale de **120 nuitées par an** pour la location en résidence principale (celle que vous occupez au moins 8 mois par an, sauf obligation professionnelle, raison de santé ou force majeure). Grenoble n'a pas (à ce jour) activé l'abaissement à 90 jours autorisé par la loi Le Meur 2024.\n\n**Loi Le Meur 2024.** DPE classe E minimum obligatoire (classe D à partir de 2034), abattement micro-BIC à 30 % pour les meublés non classés (50 % pour les classés tourisme). **Biens classés F ou G au DPE interdits à la location courte durée à partir du 1er janvier 2028** — un point critique à Grenoble où le parc ancien des quartiers Saint-Bruno, Saint-Laurent et Chorier-Berriat compte de nombreux F et G à rénover. Amendes : **10 000 € pour défaut d'enregistrement**, **20 000 € pour fausse déclaration**, **jusqu'à 50 000 € pour changement d'usage illégal**.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** Grenoble-Alpes Métropole applique une taxe de séjour de 0,75 € à 4,30 € par nuit et par personne adulte selon le classement de l'hébergement, collectée automatiquement par Airbnb. Recettes affectées au tourisme métropolitain et à la promotion de la destination Alpes.",
    concreteExample: {
      bienType: 'T2',
      surface: 42,
      pricePerNight: 85,
      neighborhood: 'Hyper-centre piéton Grenoble',
      revenuBrut: 20800,
      commissionRate: 0.20,
      menageCount: 80,
      menageUnitCost: 50,
    },
    extraFaq: [
      {
        q: "Faut-il une autorisation pour louer un Airbnb à Grenoble en 2026 ?",
        a: "Oui — Grenoble est classée en zone tendue et applique un cadre renforcé. Pour les résidences principales, la déclaration en mairie suffit (numéro d'enregistrement obligatoire, limite 120 nuitées/an). Pour les résidences secondaires en LCD, une autorisation de changement d'usage est exigée par la mairie. Point critique : la compensation est obligatoire à partir du 2e logement transformé — il faut alors transformer une surface équivalente de local commercial en résidentiel. À partir du 20 mai 2026, le téléservice national Declaloc remplacera le système local avec harmonisation à 13 chiffres. Sanctions : amendes jusqu'à 10 000 € pour défaut d'enregistrement et jusqu'à 50 000 € pour changement d'usage illégal. Avant tout achat, déposer la demande de changement d'usage à la mairie pour valider l'éligibilité.",
      },
      {
        q: "Combien rapporte un Airbnb à Grenoble en saison ski ?",
        a: "La saison ski décembre-mars est l'un des deux pics de la saisonnalité grenobloise (l'autre étant juillet-août). Un T2 hyper-centre qui se loue 85 €/nuit en moyenne annuelle atteint 110-160 €/nuit en saison ski, avec une occupation 80-90 % et des séjours week-end ski + semaines de vacances scolaires (Noël, février). Sur les 4 mois de saison ski, un T2 bien placé peut générer 8 000 à 11 000 € bruts — soit environ 45-50 % du CA annuel. La clientèle skieuse cherche un bien à proximité du tram pour rejoindre la gare routière (cars vers Chamrousse, Les 7 Laux) ou pour bénéficier du parking facile. Équipement utile : casier à skis sécurisé, sèche-chaussures.",
      },
      {
        q: 'Vaut-il mieux investir en LCD intra-muros ou à Chamrousse / Uriage ?',
        a: "Pour un objectif rentabilité lissée annuelle, l'intra-muros Grenoble est le meilleur compromis : prix au m² 2 800-5 200 €, occupation 65-75 % grâce à la demande lissée (touristes + pros + étudiants), ROI brut 6-9 %. L'hyper-centre piéton et la Vieille Ville sont les secteurs les plus liquides. Chorier-Berriat offre le ticket d'entrée le plus bas (T2 dès 115 000 €, ROI brut 7-9 %) avec potentiel de valorisation. Chamrousse / Uriage offre des tarifs nuit ski supérieurs (110-160 €) mais une occupation 62 % seulement à cause de la saisonnalité bimodale (5 mois ski + été modéré), avec des charges de copropriété plus élevées en station. À privilégier en investissement secondaire bi-actif (autoconsommation ski hiver + location aux ailes de saison) plutôt que pure rentabilité.",
      },
    ],
    updatedAt: '2026-05-27',
  },
  // ==========================================================================
  // BIARRITZ
  // ==========================================================================
  {
    slug: 'biarritz',
    displayName: 'Biarritz',
    region: 'Nouvelle-Aquitaine',
    regionSlug: 'nouvelle-aquitaine',
    title: 'Conciergerie Biarritz Airbnb : comparatif 2026 des 7 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Biarritz : Comparatif 2026',
    metaDescription:
      "Comparatif des 7 meilleures conciergeries Airbnb à Biarritz. Tarifs (20-26 %), services, avis Google, réglementation Côte basque 2026, quartiers rentables (Grande Plage, Côte des Basques).",
    kwPrincipal: 'conciergerie biarritz',
    kwSecondaires: [
      'conciergerie airbnb biarritz',
      'conciergerie pays basque',
      'gestion locative biarritz',
      'location saisonniere biarritz',
      'conciergerie anglet',
    ],
    population: 25404,
    tourists: 5000000,
    activeListings: 3500,
    priceLow: 80,
    priceHigh: 280,
    occupancyRate: 64,
    revpar: 95,
    seasonality:
      "Saisonnalité estivale ultra-marquée : pic juillet-août (occupation 90-95 %, clientèle balnéaire + surf + familles espagnoles à 30 min de la frontière, tarifs ×2 à ×3 vs hors saison). Saison forte avril-octobre dopée par les festivals (Biarritz Amérique latine en octobre, Big Festival en juin), le circuit WSL surf et le golf. Creux limité à novembre-février, soutenu par la clientèle thalasso et bien-être (Sofitel Le Miramar, Thalassa Sea & Spa) et le tourisme d'affaires (Casino Barrière, Halle d'Iraty).",
    rankNational: 5,
    introCustom:
      "Vous avez un appartement à **Biarritz** — face à la Grande Plage, sur la Côte des Basques, au Phare ou dans le quartier des Halles — que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée.\n\nEntre la **clientèle estivale qui paye 250 €/nuit en juillet-août**, la concurrence des thalassos et hôtels haut de gamme, la **réglementation Côte basque** durcie depuis 2024 sur les meublés touristiques (compensation activée à Bayonne et Saint-Jean-de-Luz mais **pas à Biarritz commune**), et la quinzaine de conciergeries qui se disputent un marché d'environ **3 500 annonces actives** sur Biarritz + Anglet, vous vous demandez si confier la gestion à une conciergerie est vraiment rentable.\n\nEt surtout : **laquelle choisir** entre les acteurs locaux haut de gamme (Cocoonr, Caborne, Sweet Home), les réseaux nationaux (HostnFly, WeHost) et les conciergeries de proximité ?",
    marketIntro:
      "Biarritz est la **station balnéaire emblématique de la Côte basque**, classée parmi les **5 destinations LCD les plus rentables de France** par Welkeys (2025) avec un revenu Airbnb moyen de **2 374 €/mois** et un taux d'occupation annuel de **64 %**. La commune de 25 000 habitants accueille **environ 5 millions de visiteurs par an** — un ratio touriste/habitant parmi les plus élevés de France.\n\nLa **clientèle est mixte et haut de gamme** : touristes balnéaires juillet-août (familles françaises, Espagnols à 30 min de la frontière de Hendaye), surfeurs internationaux toute l'année (la Côte des Basques est l'un des spots de surf majeurs d'Europe), clientèle thalasso et bien-être, événementiel haut de gamme (Festival Biarritz Amérique latine, Big Festival), tourisme d'affaires (Casino, Halle d'Iraty), Britanniques et Américains attirés par le golf (Golf de Biarritz Le Phare, Aguiléra).\n\nLes **prix immobiliers à Biarritz sont parmi les plus élevés du littoral atlantique** : 7 500-12 000 €/m² en centre, 12 000-18 000 €/m² avec vue mer (Côte des Basques, Phare-Miramar, Beaurivage). Un T2 vue mer 40 m² démarre à 480 000 €, un appartement standard centre à 300 000 €.\n\nLe **tarif moyen nuitée est de 130-180 €** en moyenne annuelle, **220-350 €** en haute saison juillet-août vue mer, 80-110 € en saison creuse (occupation 35-45 % de novembre à février).\n\n**Particularité Côte basque** : Biarritz commune **n'impose pas de compensation pour les résidences secondaires en LCD**, contrairement à Bayonne et Saint-Jean-de-Luz qui ont activé ce dispositif. Un atout stratégique pour les investisseurs LCD à valider avant tout achat.",
    conciergeries: [
      {
        name: 'Cocoonr Pays Basque (ex Easy Clés)',
        url: 'https://cocoonr.fr/conciergerie-bnb-pays-basque/',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 132,
        biensGeres: 90,
        specialty: 'Acteur historique Côte basque, réseau Cocoonr 6 villes',
        description:
          "Adresse : Quartier des Docks, 44 Rue Luis Mariano, Biarritz. Gestion complète : annonces, réservations, paiements, ménage, blanchisserie, accueil voyageurs. Filiale du réseau Cocoonr (présent aussi à Rennes, Bordeaux, Nantes, Vannes, Morbihan) — un atout pour les propriétaires multi-villes qui veulent un interlocuteur unique. Pertinente pour un propriétaire qui veut un acteur local éprouvé avec la force d'un réseau national derrière.",
      },
      {
        name: 'Caborne Housing',
        url: 'https://www.caborneconciergerie.com/',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 12,
        biensGeres: 25,
        specialty: 'Bidart / Biarritz / Guéthary, gestion clé en main',
        description:
          "Adresse : Rue du Jaizkibel, 64210 Bidart. Couverture : Bidart, Biarritz sud, Guéthary et alentours. Service clé en main : rédaction et gestion des annonces, check-in/check-out, ménage, blanchisserie, entretien des espaces verts, supervision travaux, sécurité, communication locataires. Pertinente pour un propriétaire à Bidart ou sud-Biarritz qui cherche un acteur ultra-local avec un service intégré sur tout le cycle locatif.",
      },
      {
        name: 'Sweet Home Holidays',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 5.0,
        reviews: 27,
        biensGeres: 20,
        specialty: 'Conciergerie haut de gamme, services voyageurs premium',
        description:
          "Services premium voyageurs : welcome kit personnalisé, réservation activités (surf lessons Côte des Basques, dégustation vins Irouléguy, chef privé), conciergerie 24/7. Pertinente pour propriétaires de villas vue mer ou T3-T4 standing intra-muros qui ciblent une clientèle internationale exigeante (Américains, Britanniques, Espagnols haut de gamme) prête à payer 250-400 €/nuit pour un standing hôtelier.",
      },
      {
        name: "La Conciergerie d'Emy",
        commission: '20 % TTC',
        menage: 'refacturé voyageur',
        rating: 4.3,
        reviews: 35,
        biensGeres: 12,
        specialty: 'Conciergerie locale humaine, gestion complète',
        description:
          "Acteur récent à dimension humaine (volume d'avis encore limité à surveiller dans la durée), gestion complète : annonce, communication voyageurs, check-in/check-out, ménage pro, optimisation tarifaire dynamique. Adapté pour un premier passage en LCD ou un propriétaire qui cherche un interlocuteur direct plutôt qu'une grande structure, en acceptant un volume d'avis encore faible.",
      },
      {
        name: 'Les Clés Biarrotes',
        commission: '26 % TTC',
        menage: 'refacturé voyageur',
        rating: 4.6,
        reviews: 22,
        biensGeres: 22,
        specialty: 'Gestion complète propriétaires absents, commission haut de fourchette',
        description:
          "Inclus : annonce, check-in/out, ménage, maintenance, gestion technique, gestion administrative déclaration meublé. Pertinente pour propriétaires éloignés qui veulent zéro charge mentale en contrepartie d'une commission élevée.",
      },
      {
        name: 'HostnFly Biarritz',
        url: 'https://www.hostnfly.com/conciergerie-airbnb/biarritz-bayonne-saint-jean-de-luz',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 40,
        specialty: 'Réseau national 130+ villes, dashboard propriétaire, +30 % revenu',
        description:
          "À Biarritz, l'agence couvre Biarritz + Bayonne + Saint-Jean-de-Luz avec une commission 20 % + ménage refacturé voyageur, et annonce un revenu locatif +30 % par rapport à une gestion propriétaire en direct. Dashboard propriétaire avec KPIs temps réel et prévisions de revenus. Pertinente pour propriétaires multi-villes (intégration dashboard unique) ou pour un premier passage en LCD via une structure éprouvée avec un volume d'avis très important.",
      },
      {
        name: 'WeHost Pays Basque',
        url: 'https://www.wehost.fr/conciergerie-airbnb-biarritz/',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 35,
        specialty: 'Côte basque + zones balnéaires, 7 ans expérience',
        description:
          "Sept ans d'expérience hospitality. Sur Biarritz : services personnalisés, gestion clé en main, optimisation des annonces multi-plateformes. À noter : certains avis pointent une variabilité du service sur les zones saisonnières (disponibilité ménage en juillet-août, délais de réponse). Adapté pour propriétaires qui acceptent un acteur national avec un coût de service raisonnable et un service plus standardisé que les acteurs locaux haut de gamme.",
      },
    ],
    neighborhoods: [
      {
        name: 'Grande Plage / Centre-ville',
        pricePerNight: '150-280 €',
        occupancy: 75,
        description:
          "Cœur emblématique de Biarritz : Hôtel du Palais, Casino Barrière, Grande Plage et place Bellevue. Restaurants, boutiques de luxe, vie nocturne. Demande LCD ultra-soutenue toute la saison (avril-octobre). Prix au m² 9 500-14 000 €. T2 dès 400 000 €. Le quartier le plus liquide en LCD à Biarritz, idéal pour clientèle balnéaire + événementiel.",
        roiBrut: '4,5 à 6 %',
      },
      {
        name: 'Côte des Basques / Phare-Miramar',
        pricePerNight: '160-300 €',
        occupancy: 72,
        description:
          "Quartier surf emblématique (Côte des Basques) et résidentiel haut de gamme (Phare-Miramar, Beaurivage). Vue océan, demande surfeurs internationaux toute l'année. Prix au m² 11 000-18 000 € vue mer. T2 vue mer dès 480 000 €. Tarifs nuitées les plus élevés de Biarritz, clientèle internationale exigeante.",
        roiBrut: '4 à 5,5 %',
      },
      {
        name: 'Bibi-Beaurivage',
        pricePerNight: '130-220 €',
        occupancy: 70,
        description:
          "Quartier résidentiel avec villas Belle Époque et immeubles bourgeois, proche Plage Marbella et golf de Biarritz Le Phare. Clientèle famille + golf + thalasso. Prix au m² 8 500-12 000 €. T2 dès 350 000 €. Bon compromis prestige + accessibilité, marché LCD plus calme que le centre.",
        roiBrut: '5 à 6,5 %',
      },
      {
        name: 'Saint-Charles / Halles',
        pricePerNight: '110-180 €',
        occupancy: 68,
        description:
          "Quartier des Halles authentique avec marché couvert, restaurants de quartier et ambiance basque. À 10 min à pied de la Grande Plage. Prix au m² 6 500-9 500 €. T2 dès 280 000 €. Ticket d'entrée plus accessible avec une demande LCD soutenue toute l'année (touristes culture, mid-range).",
        roiBrut: '5,5 à 7 %',
      },
      {
        name: 'Lac de Marion / Aguiléra (Anglet limitrophe)',
        pricePerNight: '90-150 €',
        occupancy: 62,
        description:
          "Limite Biarritz-Anglet, quartier résidentiel calme avec golf d'Aguiléra et stade Anoeta (Biarritz Olympique rugby). Clientèle famille + sport. Prix au m² 5 500-8 000 €. T2 dès 230 000 €. ROI brut le plus élevé des quartiers Biarritz, demande estivale forte mais creux hivernal plus marqué (50 % d'occupation décembre-février).",
        roiBrut: '6 à 7,5 %',
      },
      {
        name: 'Bidart (sud, 5 km)',
        pricePerNight: '110-200 €',
        occupancy: 65,
        description:
          "Commune voisine sud de Biarritz, village basque authentique avec plages sauvages (Erretegia, Pavillon Royal, Uhabia). Cible familles + surfeurs cherchant un cadre plus tranquille que Biarritz centre. Prix au m² 6 000-10 000 €. T2 dès 260 000 €. Saisonnalité plus marquée (mai-septembre = 75 % du CA annuel).",
        roiBrut: '5,5 à 7 %',
      },
    ],
    regulation:
      "Biarritz est située en **zone tendue** (Pays basque, décret n°2023-822 du 25 août 2023) mais **n'impose pas de compensation pour les résidences secondaires en LCD**, contrairement à ses voisines Bayonne et Saint-Jean-de-Luz qui ont activé ce dispositif depuis 2024. Cette nuance change tout pour un investisseur LCD sur la Côte basque.\n\n**Numéro d'enregistrement obligatoire.** Toute location de meublé de tourisme (résidence principale ou secondaire) requiert une déclaration en mairie de Biarritz avec délivrance d'un numéro d'enregistrement à mentionner sur chaque annonce Airbnb, Booking, Abritel. À partir du 20 mai 2026, le téléservice national unique prend le relais avec harmonisation à 13 chiffres pour tous les meublés.\n\n**Résidence principale.** Limite nationale de **120 nuitées par an** pour la location en résidence principale (logement occupé au moins 8 mois par an, sauf raison professionnelle, santé ou force majeure). Biarritz n'a pas (à ce jour) activé l'abaissement à 90 jours autorisé par la loi Le Meur 2024 en zone tendue.\n\n**Compensation : pas activée à Biarritz commune.** Bayonne et Saint-Jean-de-Luz exigent une compensation (transformation d'un local commercial équivalent en logement résidentiel) pour transformer un logement en meublé de tourisme. À Biarritz, ce mécanisme n'est **pas en vigueur** — un atout stratégique majeur pour les investisseurs LCD résidence secondaire sur la commune.\n\n**Loi Le Meur 2024.** DPE classe E minimum obligatoire (D à partir de 2034), abattement micro-BIC à 30 % pour les meublés non classés (50 % pour les classés tourisme), plafond chiffre d'affaires à 15 000 € en non classé. Biens classés F ou G au DPE **interdits à la location courte durée à partir du 1er janvier 2028**.\n\n**Sanctions Côte basque.** **5 000 €** pour défaut d'enregistrement, **10 000 €** pour dépassement des 120 jours, **20 000 €** pour fausse déclaration de résidence principale. Pour les communes qui appliquent la compensation (Bayonne, Saint-Jean-de-Luz — pas Biarritz à date), amende jusqu'à **50 000 €** pour changement d'usage illégal.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** La Communauté d'Agglomération Pays Basque applique une taxe de séjour de 0,75 € à 4,30 € par nuit et par personne adulte selon le classement de l'hébergement, collectée automatiquement par Airbnb. Recettes affectées à la promotion touristique du Pays basque et à la gestion des flux estivaux.",
    concreteExample: {
      bienType: 'T2 vue mer',
      surface: 38,
      pricePerNight: 145,
      neighborhood: 'Côte des Basques',
      revenuBrut: 33500,
      commissionRate: 0.20,
      menageCount: 85,
      menageUnitCost: 70,
    },
    extraFaq: [
      {
        q: "Faut-il une autorisation de changement d'usage à Biarritz en 2026 ?",
        a: "Non. À ce jour, Biarritz commune n'exige pas d'autorisation de changement d'usage pour transformer une résidence secondaire en meublé de tourisme. C'est une particularité stratégique à connaître : Bayonne et Saint-Jean-de-Luz, communes voisines du Pays basque, ont activé ce dispositif et imposent la compensation (transformer un local commercial équivalent en résidentiel). À Biarritz, seul le numéro d'enregistrement en mairie + le respect des 120 nuitées résidence principale s'appliquent. Pour les résidences secondaires en LCD, la location est libre tant que le règlement de copropriété ne l'interdit pas (vérification critique avant achat). À surveiller : la loi Le Meur 2024 permet aux communes en zone tendue d'activer ce dispositif à tout moment par délibération municipale — un risque réglementaire à intégrer dans tout business plan d'achat.",
      },
      {
        q: "Combien rapporte un Airbnb à Biarritz en juillet-août ?",
        a: "Pendant les 2 mois de haute saison (juillet-août), les tarifs Airbnb à Biarritz grimpent à 220-350 €/nuit pour un T2 vue mer (×2 à ×3 vs hors saison), avec une occupation à 90-95 %. Sur 60 jours, un T2 vue mer Côte des Basques peut générer 13 000 à 18 000 € bruts — soit environ 45-55 % du CA annuel. Pour un T2 centre-ville Grande Plage hors vue mer, compter 180-250 €/nuit avec une occupation 85-90 %, soit 10 000 à 14 000 € bruts sur les 2 mois. Ajoutez les ailes de saison (juin et septembre, surf + golf) qui maintiennent 70-75 % d'occupation à 130-180 €/nuit. Verrouillez les réservations dès janvier — les familles parisiennes et les surfeurs internationaux réservent 5-6 mois à l'avance, et le pic du Festival Biarritz Amérique latine (octobre) génère un troisième pic ponctuel.",
      },
      {
        q: "Vaut-il mieux investir LCD à Biarritz centre, Bidart ou Anglet ?",
        a: "Biarritz centre (Grande Plage, Saint-Charles) offre la meilleure liquidité LCD : occupation 68-75 % toute la saison, demande lissée par tourisme balnéaire + thalasso + événementiel. Ticket d'entrée élevé (T2 dès 280 000 € hors vue mer, 480 000 € vue mer). Anglet (Aguiléra, Chambre d'Amour) offre un meilleur ROI brut (6-7,5 %) avec un ticket d'entrée 30 % moins cher, mais une occupation hivernale plus faible (50 %). Bidart combine charme village basque + plages sauvages + proximité Biarritz : ticket d'entrée intermédiaire (T2 dès 260 000 €), occupation 65 % avec une saison de mai à septembre dominante. Pour pure rentabilité, Anglet ou Bidart. Pour valorisation patrimoniale + occupation lissée, Biarritz Grande Plage. Pour clientèle internationale haut de gamme prête à payer 250-400 €/nuit, Côte des Basques ou Phare-Miramar.",
      },
      {
        q: "Quelle conciergerie choisir si je n'habite pas sur la Côte basque ?",
        a: "Pour un propriétaire non-résident (Paris, Bordeaux, Toulouse, international), 3 options selon le profil de bien. Bien standard T2 centre : HostnFly Biarritz (20 % commission, dashboard propriétaire, +30 % revenu annoncé, réseau éprouvé 130+ villes) ou Cocoonr Pays Basque (acteur local historique avec 127 avis Google, réseau national présent dans 6 villes pour les multi-investisseurs). Bien haut de gamme vue mer ou villa : Sweet Home Holidays (segment luxe, clientèle internationale, services premium voyageurs). Bien éloigné du centre ou propriétaire totalement absent : Les Clés Biarrotes (26 % TTC justifié par gestion complète zéro charge mentale et administration déclaration meublé). À éviter pour un non-résident : les conciergeries solo récentes (< 20 avis Google) qui peuvent ne pas tenir le pic de demande en juillet-août sans renforts staff.",
      },
    ],
    updatedAt: '2026-05-27',
  },
  // ==========================================================================
  // VANNES
  // ==========================================================================
  {
    slug: 'vannes',
    displayName: 'Vannes',
    region: 'Bretagne',
    regionSlug: 'bretagne',
    title: 'Conciergerie Vannes Airbnb : comparatif 2026 des 6 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Vannes : Comparatif 2026',
    metaDescription:
      "Comparatif des 6 meilleures conciergeries Airbnb à Vannes. Tarifs (17-25 %), services, avis Google, réglementation Morbihan 2026, quartiers rentables (intra-muros, Port, Conleau).",
    kwPrincipal: 'conciergerie vannes',
    kwSecondaires: [
      'conciergerie airbnb vannes',
      'conciergerie morbihan',
      'cocoonr vannes',
      'conciergerie golfe du morbihan',
      'gestion locative vannes',
    ],
    population: 55976,
    tourists: 2200000,
    activeListings: 1400,
    priceLow: 65,
    priceHigh: 160,
    occupancyRate: 68,
    revpar: 65,
    seasonality:
      "Saisonnalité estivale marquée portée par le Golfe du Morbihan : pic juillet-août (occupation 85-92 %, clientèle balnéaire + îles Aix/Arz/Houat, tarifs ×1,5-2 vs hors saison). Saison forte avril-octobre dopée par le tourisme golfique (Golfe Morbihan), les festivals (Festival de Cornouaille à 1h30, Vannes Jazz Festival), la Semaine du Golfe tous les 2 ans. Mi-saison soutenue par la clientèle universitaire (Université Bretagne Sud, IUT) et les week-ends Rennes-Vannes (1h25 en TER). Creux limité à décembre-février.",
    rankNational: 28,
    introCustom:
      "Vous avez un appartement à **Vannes** — intra-muros autour de la place Henri IV et de la cathédrale Saint-Pierre, près du port de plaisance, à Conleau ou dans le quartier Saint-Patern — que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée.\n\nEntre la **clientèle estivale Golfe du Morbihan** (touristes français, week-ends rennais et nantais, embarquements îles d'Arz et Houat), la **clientèle universitaire** lissée toute l'année (Université Bretagne Sud, 8 000 étudiants), la **réglementation nationale 2026** (numéro d'enregistrement 13 chiffres obligatoire à partir du 20 mai 2026, loi Le Meur), et la quinzaine de conciergeries qui se partagent un marché d'environ **1 400 annonces actives**, vous vous demandez si confier la gestion à une conciergerie est vraiment rentable.\n\nEt surtout : **laquelle choisir** entre les acteurs locaux (Les Clefs de Faustine, La Conciergerie Étoilée, Conciergerie Bienvenue) et le réseau national Cocoonr Vannes-Morbihan ?",
    marketIntro:
      "Vannes est la **préfecture du Morbihan** et la 3e ville de Bretagne par sa population, avec **55 976 habitants** (INSEE 2026) et une agglomération Golfe du Morbihan-Vannes Agglomération de 180 000 résidents. La commune combine **patrimoine médiéval intact** (remparts XVe siècle, ville d'art et d'histoire, cathédrale Saint-Pierre), **port de plaisance** (au cœur du Golfe du Morbihan, l'une des plus belles baies du monde labellisée), et **tissu universitaire dynamique** (Université Bretagne Sud, 8 000 étudiants).\n\nLa **clientèle LCD est mixte et lissée** : touristes balnéaires juillet-août (familles, embarquements quotidiens vers les îles d'Arz, Houat, Hoëdic depuis Port-Navalo et Conleau), week-ends rennais/nantais toute l'année (1h25 TER depuis Rennes, 1h30 voiture depuis Nantes), professionnels de la santé (CHU de Vannes-Auray) et de l'agroalimentaire, clientèle universitaire (séjours 1-6 mois via Airbnb), événementiel (Semaine du Golfe biannuelle, festivals).\n\nLes **prix immobiliers à Vannes sont accessibles** : 3 800-5 500 €/m² intra-muros, 4 500-6 500 €/m² en bord de port / Conleau, 3 000-4 200 €/m² dans les quartiers résidentiels. Un T2 intra-muros démarre à 175 000 €, un T2 vue port à 230 000 €.\n\nLe **tarif moyen nuitée est de 80-110 €** en moyenne annuelle, **120-180 €** en haute saison juillet-août intra-muros, 60-90 € en saison creuse (mais l'occupation reste à 50-60 % grâce à la clientèle universitaire et week-end pro).\n\nVannes **n'est pas classée en zone tendue par décret national** à ce jour. La déclaration en mairie reste obligatoire et le numéro d'enregistrement national sera obligatoire pour tous les meublés de tourisme à partir du 20 mai 2026 (loi Le Meur 2024).",
    conciergeries: [
      {
        name: 'La Conciergerie Étoilée',
        url: 'https://laconciergerie-etoilee.fr/',
        commission: '17-25 %',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 85,
        biensGeres: 60,
        specialty: 'Golfe du Morbihan, équipe 10 personnes, Superhost depuis 2022',
        description:
          "Fondée en 2022 par Maïwenn et Geoffrey (passionnés voyage et LCD, Superhost Airbnb depuis 2022), équipe locale d'une dizaine de personnes. Couverture : Vannes, Baden, Arradon, Larmor Baden, Golfe du Morbihan. Grille progressive 17-25 % selon volume et services. Gestion complète : annonces, ménage, blanchisserie, optimisation tarifaire, accueil voyageurs. Pertinente pour un propriétaire qui veut le meilleur acteur local sur le Golfe du Morbihan avec une équipe étoffée capable de tenir le pic juillet-août.",
      },
      {
        name: 'Les Clefs de Faustine',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 74,
        biensGeres: 45,
        specialty: 'Gestion sur-mesure, support 24/7, gestion immobilière',
        description:
          "Positionnement sur la gestion locative et immobilière sur mesure : accueil personnalisé, services à la carte selon la typologie du bien (T2 standard vs villa de prestige). Support 24/7 pour voyageurs et propriétaires. Adapté pour propriétaires qui veulent un service flexible (commission ajustable selon le périmètre confié) et un interlocuteur unique côté gestion locative + immobilier.",
      },
      {
        name: 'Conciergerie Bienvenue',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 53,
        biensGeres: 35,
        specialty: 'Service voyageur personnalisé, commission claire 20 %',
        description:
          "Positionnement explicite sur l'expérience voyageur personnalisée : welcome kit local, recommandations restaurants/activités Golfe du Morbihan, contact direct hôte-voyageur. Inclus : annonce, ménage, linge, accueil. Adapté pour propriétaires d'un T2 ou T3 centre-ville qui privilégient la qualité de l'expérience voyageur pour fidéliser et générer du bouche-à-oreille (clientèle famille + couples week-end).",
      },
      {
        name: 'Location Concept',
        url: 'https://www.location-concept.fr/',
        commission: '20-25 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 105,
        biensGeres: 50,
        specialty: 'Vannes + Arradon + Baden, équipe dirigée par Axel Marie',
        description:
          "Adresse : 78 Bis Avenue du 4 Août 1944, 56000 Vannes. Couverture Vannes, Arradon, Baden et alentours. Société de sous-location et conciergerie dirigée par Axel Marie. Gestion complète : annonces, communication voyageurs, accueil, ménage, linge, gestion technique. Réputation forte sur la réactivité et le professionnalisme. Adapté pour propriétaires Vannes ouest (Arradon, Baden) qui veulent un acteur ancré dans le Golfe avec une équipe réactive.",
      },
      {
        name: 'Cocoonr Vannes-Morbihan',
        url: 'https://cocoonr.fr/conciergerie-bnb-morbihan/',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 52,
        biensGeres: 70,
        specialty: 'Réseau national Cocoonr, Vannes + Presqu\'île de Rhuys',
        description:
          "Adresse : 10 Place de la Madeleine, 56000 Vannes. Filiale du réseau Cocoonr (Rennes, Bordeaux, Nantes, Pays basque, Morbihan) — un atout majeur pour propriétaires multi-villes qui veulent un interlocuteur national unique. Gestion complète : réservations, paiements, préparation/maintenance, blanchisserie, accueil. Adapté pour propriétaires Vannes + Rhuys ou multi-villes.",
      },
      {
        name: 'HostnFly Vannes',
        url: 'https://hostnfly.com/conciergerie-airbnb/vannes',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 85,
        biensGeres: 25,
        specialty: 'Réseau national 130+ villes, dashboard propriétaire',
        description:
          "Commission 20 % + ménage refacturé voyageur. Revenu locatif annoncé +30 % vs gestion propriétaire. Dashboard propriétaire avec KPIs temps réel, photos professionnelles, pricing dynamique. Pertinent pour propriétaires multi-villes ou pour un premier passage en LCD via une structure éprouvée avec un volume d'avis très important. À noter : présence locale plus récente à Vannes que les acteurs historiques (Cocoonr, Conciergerie Étoilée).",
      },
    ],
    neighborhoods: [
      {
        name: 'Intra-muros / Cathédrale Saint-Pierre',
        pricePerNight: '95-180 €',
        occupancy: 75,
        description:
          "Cœur médiéval intra-muros, remparts XVe siècle, place Henri IV, cathédrale Saint-Pierre, maisons à colombages. Restaurants, boutiques, marché des Lices. Demande LCD ultra-soutenue toute la saison touristique. Prix au m² 4 500-5 500 €. T2 dès 175 000 €. Le quartier le plus liquide en LCD à Vannes.",
        roiBrut: '6 à 8 %',
      },
      {
        name: 'Port de plaisance / La Rabine',
        pricePerNight: '90-160 €',
        occupancy: 72,
        description:
          "Port de plaisance au cœur du Golfe du Morbihan, embarcadère vers les îles (Arz, Houat, Hoëdic). Tourisme nautique fort. Promenade Pargo + Conleau accessibles. Prix au m² 4 800-6 500 €. T2 dès 200 000 €. Excellente liquidité été, bonne demande week-end toute l'année.",
        roiBrut: '5,5 à 7,5 %',
      },
      {
        name: 'Saint-Patern',
        pricePerNight: '75-130 €',
        occupancy: 70,
        description:
          "Quartier authentique adossé à l'intra-muros, dans le périmètre médiéval avec rues commerçantes piétonnes (rue Saint-Patern). Cible touristes culture + clientèle pro week-end. Prix au m² 3 800-4 800 €. T2 dès 165 000 €. Bon compromis charme + ticket d'entrée accessible.",
        roiBrut: '6,5 à 8,5 %',
      },
      {
        name: 'Conleau',
        pricePerNight: '85-150 €',
        occupancy: 65,
        description:
          "Presqu'île résidentielle bord de mer au sud de Vannes, vue Golfe, plage de Conleau, embarcadère vers l'Île d'Arz (15 min de bateau). Cible familles + retraités + clientèle nautique. Prix au m² 4 500-6 000 €. T2 dès 195 000 €. Saisonnalité plus marquée (avril-octobre = 70 % du CA).",
        roiBrut: '5,5 à 7 %',
      },
      {
        name: 'Beaupré-Lalande / Tohannic (Université)',
        pricePerNight: '60-100 €',
        occupancy: 62,
        description:
          "Quartier résidentiel sud-est, à proximité du campus Université Bretagne Sud (Tohannic) et du CHU de Vannes-Auray. Clientèle universitaire (séjours 1-6 mois) + clientèle médicale + pro. Prix au m² 3 000-4 000 €. T2 dès 130 000 €. ROI brut le plus élevé des quartiers vannetais, demande lissée toute l'année grâce au mix étudiant + pro.",
        roiBrut: '7 à 9 %',
      },
      {
        name: 'Presqu\'île de Rhuys (Arzon, Sarzeau, 25-35 km)',
        pricePerNight: '110-200 €',
        occupancy: 60,
        description:
          "Sud du Golfe du Morbihan : Arzon (Port-Navalo, Port du Crouesty), Sarzeau, Saint-Gildas-de-Rhuys. Plages, embarcadère vers Houat-Hoëdic, golf de Saint-Laurent. Cible familles + retraités + golfeurs. Prix au m² 4 200-6 500 €. T2 dès 220 000 €. Saisonnalité très marquée (70 % du CA mai-septembre).",
        roiBrut: '5,5 à 7,5 %',
      },
    ],
    regulation:
      "Vannes **n'est pas classée en zone tendue par décret national** à ce jour (la commune n'apparaît pas dans le décret n°2023-822 du 25 août 2023 listant les communes en zone tendue de la Loi Élan). Le cadre réglementaire reste donc le régime de droit commun, durci par la loi Le Meur 2024.\n\n**Numéro d'enregistrement obligatoire.** Toute location de meublé de tourisme (résidence principale ou secondaire) requiert une déclaration en mairie de Vannes avec délivrance d'un numéro d'enregistrement à mentionner sur chaque annonce Airbnb, Booking, Abritel. À partir du 20 mai 2026, le téléservice national unique (apimeubles.finances.gouv.fr) prendra le relais avec harmonisation à 13 chiffres pour tous les meublés.\n\n**Résidence principale.** Limite nationale de **120 nuitées par an** pour la location en résidence principale (logement occupé au moins 8 mois par an, sauf raison professionnelle, santé ou force majeure). Vannes n'étant pas en zone tendue par décret, l'abaissement à 90 jours autorisé par la loi Le Meur ne s'applique pas.\n\n**Pas d'autorisation de changement d'usage à ce jour.** Vannes (moins de 200 000 habitants et hors zone tendue par décret) n'a pas activé l'autorisation de changement d'usage pour les résidences secondaires en LCD. La location de meublé de tourisme reste libre tant que le règlement de copropriété ne l'interdit pas (vérification critique avant achat).\n\n**Loi Le Meur 2024.** DPE classe E minimum obligatoire (D à partir de 2034), abattement micro-BIC à 30 % pour les meublés non classés (50 % pour les classés tourisme), plafond chiffre d'affaires à 15 000 € en non classé. Biens classés F ou G au DPE **interdits à la location courte durée à partir du 1er janvier 2028** — un point à anticiper sur le parc ancien intra-muros vannetais (maisons à colombages, immeubles anciens).\n\n**Sanctions nationales.** **5 000 €** pour défaut d'enregistrement, **10 000 €** pour dépassement des 120 jours, **20 000 €** pour fausse déclaration de résidence principale.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** Golfe du Morbihan-Vannes Agglomération applique une taxe de séjour de 0,75 € à 4,30 € par nuit et par personne adulte selon le classement de l'hébergement, collectée automatiquement par Airbnb. Recettes affectées à la promotion touristique du Golfe du Morbihan (labellisé Baie la plus belle du monde) et à la gestion des flux estivaux îles + ports.",
    concreteExample: {
      bienType: 'T2',
      surface: 42,
      pricePerNight: 95,
      neighborhood: 'Intra-muros Vannes',
      revenuBrut: 24300,
      commissionRate: 0.20,
      menageCount: 75,
      menageUnitCost: 55,
    },
    extraFaq: [
      {
        q: "Vannes est-elle classée en zone tendue pour Airbnb en 2026 ?",
        a: "Non. À la date de mai 2026, Vannes n'apparaît pas dans la liste des communes classées en zone tendue par le décret n°2023-822 du 25 août 2023 (qui liste les communes éligibles aux mesures renforcées de la loi Élan). Conséquence directe : la limite de 120 nuitées/an pour les résidences principales s'applique (pas d'abaissement à 90 jours possible sans classement zone tendue), il n'y a pas d'autorisation de changement d'usage obligatoire pour les résidences secondaires, et la commune ne peut pas activer la compensation (transformer un local commercial en résidentiel pour transformer un logement en meublé de tourisme). Le régime reste donc le droit commun : déclaration en mairie, numéro d'enregistrement national obligatoire à partir du 20 mai 2026, respect du règlement de copropriété, respect du DPE (classe E minimum). C'est un atout pour les investisseurs LCD à Vannes par rapport à Rennes (zone tendue, abaissement à 90 jours possible).",
      },
      {
        q: "Combien rapporte un Airbnb à Vannes en été ?",
        a: "Pendant les 2 mois de haute saison (juillet-août), un T2 intra-muros Vannes (place Henri IV, cathédrale) se loue 130-180 €/nuit avec une occupation 85-92 %, soit 7 000 à 10 000 € bruts sur les 2 mois. Un T2 vue port (Rabine) atteint 140-200 €/nuit avec la même occupation, soit 7 500 à 11 000 €. Sur la presqu'île de Rhuys (Arzon, Sarzeau), les tarifs grimpent à 150-250 €/nuit pour un T2 vue Golfe avec une occupation 90 % — mais la saison est concentrée mai-septembre (70 % du CA annuel sur 5 mois). Ajoutez les ailes de saison (mai-juin et septembre, embarquements îles + golfeurs Saint-Laurent) qui maintiennent 65-75 % d'occupation à 90-130 €/nuit. La Semaine du Golfe (biannuelle, mi-mai) génère un pic de réservations dès janvier-février.",
      },
      {
        q: "Vaut-il mieux louer en LCD à Vannes intra-muros ou sur la presqu'île de Rhuys ?",
        a: "Vannes intra-muros offre la meilleure liquidité LCD : occupation 75 % sur 10 mois grâce au mix touristes (juillet-août), week-ends pro Rennes/Nantes, étudiants Université Bretagne Sud (séjours 1-6 mois via Airbnb), et clientèle CHU. Ticket d'entrée : T2 dès 175 000 €. ROI brut 6-8 %. La presqu'île de Rhuys (Arzon, Sarzeau, Port-Navalo) offre des tarifs nuitées 30-50 % plus élevés en été (150-250 €/nuit pour un T2 vue Golfe) mais une saison concentrée mai-septembre, avec un creux hivernal sévère (30-40 % d'occupation novembre-mars). Ticket d'entrée plus élevé (T2 dès 220 000 €). Pour pure rentabilité lissée annuelle, Vannes intra-muros ou Saint-Patern. Pour pur revenu estival + investissement plaisir + autoconsommation été, Rhuys. Pour ROI brut maximal, Beaupré-Lalande (proche Université + CHU) à 7-9 % grâce à la demande étudiante long séjour.",
      },
    ],
    updatedAt: '2026-05-27',
  },
  // ==========================================================================
  // AMIENS
  // ==========================================================================
  {
    slug: 'amiens',
    displayName: 'Amiens',
    region: 'Hauts-de-France',
    regionSlug: 'hauts-de-france',
    title: 'Conciergerie Amiens Airbnb : comparatif 2026 des 5 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Amiens : Comparatif 2026',
    metaDescription:
      "Comparatif des 5 meilleures conciergeries Airbnb à Amiens. Tarifs (15-25 %), services, avis Google, réglementation 2026, quartiers rentables (Saint-Leu, Hyper-centre, Henriville).",
    kwPrincipal: 'conciergerie amiens',
    kwSecondaires: [
      'conciergerie airbnb amiens',
      'gestion locative amiens',
      'location courte duree amiens',
      'meuble tourisme amiens',
      'airbnb saint-leu amiens',
    ],
    population: 136331,
    tourists: 1500000,
    activeListings: 850,
    priceLow: 50,
    priceHigh: 110,
    occupancyRate: 62,
    revpar: 42,
    seasonality:
      "Saisonnalité plus lissée que les villes balnéaires, avec un pic estival modéré (occupation 75-82 % juin-août, tourisme cathédrale UNESCO + Maison Jules Verne + hortillonnages). Pic ponctuel décembre lors du Marché de Noël (l'un des plus grands du Nord, 130 chalets, 2 millions de visiteurs). Demande pro et événementielle toute l'année (CHU d'Amiens, Université de Picardie Jules Verne, salons), week-ends parisiens via TGV (1h10). Festival International du Film en novembre (4e plus important festival film français). Creux limité à janvier-février.",
    rankNational: 38,
    introCustom:
      "Vous avez un appartement à **Amiens** — dans le quartier pittoresque de Saint-Leu avec ses canaux, en hyper-centre près du Beffroi et de la cathédrale Notre-Dame UNESCO, à Henriville ou près de la gare TGV — que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée.\n\nEntre la **clientèle culture toute l'année** (cathédrale Notre-Dame d'Amiens, plus grande cathédrale gothique de France, classée UNESCO, 800 000 visiteurs annuels), la **clientèle pro** (CHU d'Amiens, université Jules Verne, salons), les **week-ends parisiens** (TGV 1h10 depuis Paris-Nord, 6 trains/jour), le **Marché de Noël** qui draine 2 millions de visiteurs en décembre, et la dizaine de conciergeries qui se partagent un marché d'environ **850 annonces actives**, vous vous demandez si confier la gestion à une conciergerie est vraiment rentable.\n\nEt surtout : **laquelle choisir** entre les acteurs locaux (GET IMMO, AmBiens, Athéna) et les réseaux (Primo, YourHostHelper) ?",
    marketIntro:
      "Amiens est la **préfecture de la Somme** et la capitale régionale historique de la Picardie avec **136 331 habitants** (INSEE 2026) et une métropole d'**184 392 résidents**. La ville combine **patrimoine UNESCO majeur** (cathédrale Notre-Dame d'Amiens, plus grande cathédrale gothique de France, 1220, 800 000 visiteurs/an), **héritage Jules Verne** (Maison de l'écrivain où il a vécu 18 ans), **hortillonnages** (300 hectares de jardins flottants accessibles en barque, emblème de la ville), et **quartier Saint-Leu** (Venise du Nord, canaux pittoresques, restaurants, vie nocturne).\n\nLa **clientèle LCD est très lissée** : tourisme culture toute l'année (cathédrale UNESCO + Maison Jules Verne + Cirque d'hiver Jules Verne), Marché de Noël décembre (l'un des plus grands de France, 2 millions de visiteurs, 130 chalets), Festival International du Film d'Amiens en novembre (4e festival français), professionnels CHU (1 850 lits, recrutement national) + Université Picardie Jules Verne (30 000 étudiants), week-ends parisiens via TGV (1h10 depuis Paris-Nord, 6 trains directs/jour).\n\nLes **prix immobiliers à Amiens sont parmi les plus accessibles de France** : 2 200-3 000 €/m² en centre, 2 800-3 800 €/m² à Saint-Leu (le quartier le plus prisé), 1 800-2 500 €/m² dans les quartiers résidentiels. Un T2 hyper-centre démarre à **95 000 €**, un T2 Saint-Leu vue canal à 135 000 €.\n\nLe **tarif moyen nuitée est de 65-90 €** en moyenne annuelle, **90-130 €** en haute saison (juin-août + Marché de Noël), 50-70 € en saison creuse (mais l'occupation reste à 55-65 % grâce au mix pro + universitaire + cathédrale).\n\nAmiens **n'est pas classée en zone tendue par décret national** à ce jour et applique le régime de droit commun (déclaration en mairie obligatoire, 120 nuitées résidence principale, numéro d'enregistrement national à partir du 20 mai 2026).",
    conciergeries: [
      {
        name: 'Primo Conciergerie Amiens',
        url: 'https://www.primoconciergerie.fr/conciergerie-amiens/',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 30,
        specialty: 'Réseau national 90 agences, équipe locale dédiée Amiens',
        description:
          "Gestion complète : annonces, ménage, blanchisserie, accueil voyageurs, maintenance, optimisation tarifaire dynamique. Disponibilité 24/7. Adapté pour propriétaires qui veulent à la fois la rigueur d'un réseau national et la proximité d'une équipe locale dédiée Amiens + alentours.",
      },
      {
        name: 'GET IMMO',
        url: 'https://get-immo-lille.fr/index.php/conciergerie-airbnb-amiens-douai/',
        commission: 'sur revenu',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 27,
        biensGeres: 50,
        specialty: 'Amiens + Douai, gestion 50+ biens depuis 2020, note Airbnb 4,81',
        description:
          "Gestion clé en main : annonces optimisées, ménage professionnel, accueil voyageurs, support 24/7. Gaetan (fondateur) accompagne propriétaires et investisseurs pour valoriser et maximiser les rendements via Airbnb et Booking. Pertinente pour propriétaires multi-biens ou investisseurs débutants qui veulent un acteur éprouvé avec un volume d'avis voyageurs très important.",
      },
      {
        name: 'Conciergerie AmBiens',
        url: 'https://conciergerie-ambiens.fr/a-propos/',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 5.0,
        reviews: 13,
        biensGeres: 15,
        specialty: 'Conciergerie de proximité, dimension familiale',
        description:
          "Structure à taille humaine et dimension familiale (volume d'avis encore limité à surveiller dans la durée). Service complet ou à la carte selon les besoins du propriétaire. Pertinente pour un propriétaire d'un T2-T3 amienois qui privilégie la proximité et un interlocuteur unique plutôt qu'une grande structure, en acceptant un volume d'avis encore réduit.",
      },
      {
        name: 'Athéna Conciergerie',
        url: 'https://athenaconciergerie.fr/',
        commission: 'sur devis ou forfait',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 12,
        specialty: 'Haut de gamme, gestion biens de prestige Amiens',
        description:
          "Excellence + discrétion + attention aux détails, service 24/7. Annonces optimisées, gestion réservations, communication voyageurs. Choix commission sur revenu OU forfait fixe selon le profil du bien. Rapports détaillés performance. Pertinente pour propriétaires de biens haut de gamme intra-muros ou maisons de caractère qui ciblent une clientèle CSP+.",
      },
      {
        name: 'YourHostHelper Amiens',
        url: 'https://yourhosthelper.com/conciergerie-amiens/',
        commission: '20 %',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 27,
        biensGeres: 18,
        specialty: 'Réseau national 20+ villes, dashboard propriétaire, pricing dynamique',
        description:
          "YourHostHelper Amiens fait partie du réseau national YourHostHelper (présent dans 20+ villes françaises). Commission fixe à 20 % sur le revenu brut + ménage refacturé voyageur. Pas de frais si le logement n'est pas loué. Service inclus : annonces optimisées, photos professionnelles, pricing dynamique quotidien, synchronisation multi-plateformes (Airbnb + Booking + Abritel), accueil 24/7, ménage professionnel. Adapté pour propriétaires multi-villes (intégration dashboard unique) ou pour un premier passage en LCD via une structure éprouvée.",
      },
    ],
    neighborhoods: [
      {
        name: 'Saint-Leu (Venise du Nord)',
        pricePerNight: '85-150 €',
        occupancy: 70,
        description:
          "Quartier emblématique d'Amiens, surnommé la Venise du Nord pour ses canaux pittoresques traversant les maisons colorées. Restaurants, bars, vie nocturne. À 5 min à pied de la cathédrale. Demande LCD ultra-soutenue : tourisme culture + Marché de Noël + nuits étudiantes. Prix au m² 2 800-3 800 €. T2 dès 135 000 €. Le quartier le plus liquide en LCD à Amiens.",
        roiBrut: '6,5 à 8 %',
      },
      {
        name: 'Hyper-centre (Beffroi / Cathédrale)',
        pricePerNight: '75-130 €',
        occupancy: 68,
        description:
          "Cœur historique autour du Beffroi (UNESCO), cathédrale Notre-Dame d'Amiens (UNESCO), place Gambetta. Boutiques, restaurants, marché des Halles. À 5 min à pied de la gare TGV. Demande LCD lissée (touristes culture + pro + Marché de Noël). Prix au m² 2 400-3 200 €. T2 dès 110 000 €. Excellente liquidité, ticket d'entrée accessible.",
        roiBrut: '7 à 9 %',
      },
      {
        name: 'Henriville',
        pricePerNight: '70-110 €',
        occupancy: 65,
        description:
          "Quartier résidentiel haut de gamme au sud-est, immeubles bourgeois Belle Époque, hôtels particuliers, proximité Parc Saint-Pierre. Cible familles + clientèle CSP+ + week-ends pro. Prix au m² 2 600-3 400 €. T2 dès 120 000 €. Bon compromis standing + accessibilité, demande lissée toute l'année.",
        roiBrut: '6,5 à 8,5 %',
      },
      {
        name: 'Saint-Acheul / Faubourg de Hem (Université)',
        pricePerNight: '55-90 €',
        occupancy: 62,
        description:
          "Quartiers résidentiels sud, à proximité de l'Université Picardie Jules Verne (30 000 étudiants) et du CHU. Clientèle étudiante (séjours 1-6 mois) + médicale + pro. Prix au m² 1 800-2 400 €. T2 dès 85 000 €. Ticket d'entrée le plus accessible d'Amiens, ROI brut maximal, demande lissée grâce au mix étudiant + médical + pro.",
        roiBrut: '8 à 10 %',
      },
      {
        name: 'Saint-Pierre / Hortillonnages',
        pricePerNight: '70-120 €',
        occupancy: 64,
        description:
          "Quartier nord-est aux portes des Hortillonnages (300 hectares de jardins flottants emblématiques), Maison Jules Verne à 10 min. Cible familles + touristes culture + week-end nature. Prix au m² 2 100-2 800 €. T2 dès 100 000 €. Demande touristique forte avril-octobre (visites guidées hortillonnages en barque), creux hivernal.",
        roiBrut: '7 à 8,5 %',
      },
      {
        name: 'Quartier Gare / Saint-Honoré',
        pricePerNight: '65-105 €',
        occupancy: 66,
        description:
          "Quartier autour de la gare TGV Amiens, proche centre commercial Amiens-Glisy et de l'A16. Cible voyageurs TGV Paris-Amiens (1h10), clientèle pro courte durée, événementiel CHU. Prix au m² 2 000-2 700 €. T2 dès 90 000 €. Bon ROI brut grâce à un mix demande pro + touristes en transit.",
        roiBrut: '7,5 à 9 %',
      },
    ],
    regulation:
      "Amiens **n'est pas classée en zone tendue par décret national** à ce jour (la commune n'apparaît pas dans le décret n°2023-822 du 25 août 2023 listant les communes en zone tendue). La taille de la commune (136 331 habitants, sous le seuil des 200 000) et l'absence de classement zone tendue maintiennent un cadre réglementaire de droit commun, durci par la loi Le Meur 2024.\n\n**Numéro d'enregistrement obligatoire.** Toute location de meublé de tourisme (résidence principale ou secondaire) requiert une déclaration en mairie d'Amiens (formulaire CERFA 14004, service urbanisme tel. 03.21.87.80.62 — vérifier le contact à jour). À partir du 20 mai 2026, le téléservice national unique (apimeubles.finances.gouv.fr) prendra le relais avec harmonisation à 13 chiffres pour tous les meublés.\n\n**Résidence principale.** Limite nationale de **120 nuitées par an** pour la location en résidence principale (logement occupé au moins 8 mois par an, sauf raison professionnelle, santé ou force majeure). Amiens n'étant pas en zone tendue, l'abaissement à 90 jours autorisé par la loi Le Meur ne s'applique pas.\n\n**Pas d'autorisation de changement d'usage à ce jour.** Amiens (moins de 200 000 habitants et hors zone tendue par décret) n'a pas activé l'autorisation de changement d'usage pour les résidences secondaires en LCD. La location de meublé de tourisme reste libre tant que le règlement de copropriété ne l'interdit pas — point à vérifier avant tout achat, notamment sur les copropriétés Belle Époque d'Henriville et Saint-Leu où certains règlements anciens peuvent interdire la location courte durée.\n\n**Loi Le Meur 2024.** DPE classe E minimum obligatoire (D à partir de 2034), abattement micro-BIC à 30 % pour les meublés non classés (50 % pour les classés tourisme), plafond chiffre d'affaires à 15 000 € en non classé. Biens classés F ou G au DPE **interdits à la location courte durée à partir du 1er janvier 2028** — un point critique sur le parc ancien amienois (immeubles XIXe Saint-Leu, hôtels particuliers Henriville).\n\n**Sanctions nationales.** **5 000 €** pour défaut d'enregistrement, **10 000 €** pour dépassement des 120 jours, **20 000 €** pour fausse déclaration de résidence principale.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** Amiens Métropole applique une taxe de séjour de 0,55 € à 4,30 € par nuit et par personne adulte selon le classement de l'hébergement, collectée automatiquement par Airbnb. Recettes affectées à la promotion touristique de la métropole et au financement d'événements (Marché de Noël, Festival International du Film, hortillonnages).",
    concreteExample: {
      bienType: 'T2',
      surface: 38,
      pricePerNight: 75,
      neighborhood: 'Saint-Leu (Venise du Nord)',
      revenuBrut: 17600,
      commissionRate: 0.20,
      menageCount: 70,
      menageUnitCost: 45,
    },
    extraFaq: [
      {
        q: "Pourquoi le ticket d'entrée immobilier à Amiens est-il aussi bas ?",
        a: "Amiens combine un parc immobilier ancien important (immeubles XIXe + Belle Époque) hérité de son passé industriel textile, un foncier abondant en périphérie (commune étendue de 49 km², 5e plus vaste commune française), et un marché locatif principalement résidentiel longue durée (CHU + Université + emploi tertiaire) qui n'a pas connu la pression LCD des villes touristiques majeures. Conséquence : un T2 hyper-centre démarre à 95 000 €, un T2 Saint-Leu vue canal à 135 000 €. À comparer avec Lille (4 500 €/m² centre) ou Reims (3 800 €/m² centre). Pour les investisseurs LCD débutants ou multi-biens, Amiens offre un excellent ratio ticket d'entrée / revenu locatif : un T2 hyper-centre à 110 000 € peut générer 9 000 à 12 000 € bruts annuels en LCD, soit un ROI brut de 8-10 %.",
      },
      {
        q: "Le Marché de Noël d'Amiens vaut-il la peine pour un Airbnb ?",
        a: "Oui — c'est l'un des deux pics annuels de la saisonnalité amienoise (l'autre étant juillet-août). Le Marché de Noël d'Amiens (l'un des plus grands de France, 130 chalets, 2 millions de visiteurs sur 5 semaines fin novembre à fin décembre) génère un afflux massif de visiteurs du Nord, d'Île-de-France, de Belgique et des Pays-Bas. Pour un T2 Saint-Leu ou hyper-centre, les tarifs grimpent à 110-160 €/nuit (vs 70-90 € hors saison) avec une occupation 85-95 % sur les week-ends et 70-80 % en semaine. Sur les 5 semaines, un T2 bien placé peut générer 3 500 à 5 500 € bruts — soit environ 25-30 % du CA annuel. Verrouillez les dates dès septembre — les familles flamandes et néerlandaises réservent 3-4 mois à l'avance pour les week-ends marché de Noël.",
      },
      {
        q: "Quel quartier offre le meilleur ROI brut à Amiens ?",
        a: "Saint-Acheul / Faubourg de Hem (sud, proche Université Picardie Jules Verne et CHU) offre le ROI brut maximal à Amiens (8-10 %). Combinaison : ticket d'entrée le plus bas (T2 dès 85 000 €), demande lissée toute l'année grâce au mix étudiant (30 000 étudiants à l'université, séjours Airbnb 1-6 mois pour échanges Erasmus + visiteurs familles + stagiaires CHU) + médical (CHU 1 850 lits, recrutement national, séjours 1-3 mois pour internat) + pro. Pour pure rentabilité, c'est le meilleur choix. Saint-Leu offre une meilleure liquidité touristique (ROI 6,5-8 %) mais ticket d'entrée plus élevé (T2 dès 135 000 €). Hyper-centre offre un excellent compromis (ROI 7-9 %, T2 dès 110 000 €) avec une demande lissée touristes + pro grâce à la proximité gare TGV (1h10 Paris-Nord).",
      },
    ],
    updatedAt: '2026-05-27',
  },
  // ==========================================================================
  // DIJON
  // ==========================================================================
  {
    slug: 'dijon',
    displayName: 'Dijon',
    region: 'Bourgogne-Franche-Comté',
    regionSlug: 'bourgogne-franche-comte',
    title: 'Conciergerie Dijon Airbnb : comparatif 2026 des 6 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Dijon : Comparatif 2026',
    metaDescription:
      "Comparatif des 6 meilleures conciergeries Airbnb à Dijon. Tarifs (15-25 %), services, avis Google, réglementation 2026, quartiers rentables (Palais des Ducs, Darcy, Université).",
    kwPrincipal: 'conciergerie dijon',
    kwSecondaires: [
      'conciergerie airbnb dijon',
      'gestion locative dijon',
      'location courte duree dijon',
      'airbnb climats bourgogne',
      'meuble tourisme dijon',
    ],
    population: 163780,
    tourists: 6000000,
    activeListings: 1100,
    priceLow: 55,
    priceHigh: 130,
    occupancyRate: 66,
    revpar: 50,
    seasonality:
      "Saisonnalité lissée toute l'année grâce au tourisme gastronomique et œnotouristique : pic juin-octobre (occupation 75-85 %, vendanges Côte d'Or septembre-octobre, Foire Internationale Gastronomique d'Automne en novembre — l'une des plus importantes de France), mi-saison printemps (Climats UNESCO, Cité Internationale Gastronomie et Vin), creux limité à janvier-février. Pic ponctuel décembre avec le Marché de Noël. Demande pro lissée (CHU de Dijon, Université de Bourgogne, INRAE, Vitagora pôle de compétitivité gastronomie).",
    rankNational: 25,
    introCustom:
      "Vous avez un appartement à **Dijon** — autour du Palais des Ducs et des États de Bourgogne (place de la Libération, place François Rude), dans le quartier Darcy près de la gare, à Wilson ou au cœur du quartier universitaire — que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée.\n\nEntre la **clientèle œnotouristique** (Climats du vignoble de Bourgogne classés UNESCO, Route des Grands Crus jusqu'à Beaune, Cité Internationale de la Gastronomie et du Vin ouverte en 2022), le **tourisme patrimonial** (Palais des Ducs, secteur sauvegardé, hôtels particuliers Renaissance), la **demande pro** (CHU, Université de Bourgogne, Vitagora, salons), les **6 millions de visiteurs annuels** estimés sur Dijon Métropole, et la quinzaine de conciergeries qui se partagent un marché d'environ **1 100 annonces actives**, vous vous demandez si confier la gestion à une conciergerie est vraiment rentable.\n\nEt surtout : **laquelle choisir** entre les acteurs locaux haut de gamme (Lux'Apart, La Conciergerie d'Émile) et les réseaux nationaux (Primo, YourHostHelper) ?",
    marketIntro:
      "Dijon est la **préfecture de la Côte d'Or** et la capitale historique du duché de Bourgogne avec **163 780 habitants** (INSEE 2026) et une métropole de **252 000 résidents**. La ville est devenue ces dernières années un **pôle touristique de premier plan** porté par trois leviers : les **Climats du vignoble de Bourgogne classés UNESCO** depuis 2015 (1 247 climats viticoles s'étendant de Dijon à Santenay), la **Cité Internationale de la Gastronomie et du Vin** (CIGV, ouverte en mai 2022, projet de 250 millions d'euros), et le **secteur sauvegardé Palais des Ducs et anciens hôtels particuliers Renaissance** (5e secteur sauvegardé de France par sa superficie).\n\nLa **clientèle LCD est très lissée** : tourisme œnotouristique d'avril à octobre (vendanges Côte d'Or en septembre-octobre, dégustations sur la Route des Grands Crus de Dijon à Beaune), gastronomique toute l'année (Foire Internationale Gastronomique d'Automne en novembre — l'une des 10 plus importantes de France, 1 600 exposants, 150 000 visiteurs), week-ends parisiens (TGV 1h35 depuis Paris Gare de Lyon, 22 trains/jour), pro lissés (CHU de Dijon, Université de Bourgogne 27 000 étudiants, INRAE, Vitagora pôle de compétitivité gastronomie).\n\nLes **prix immobiliers à Dijon restent accessibles** : 2 800-4 000 €/m² en centre, 3 800-5 500 €/m² dans le secteur sauvegardé (Palais des Ducs, rue de la Liberté), 2 200-3 200 €/m² dans les quartiers résidentiels. Un T2 hyper-centre démarre à 130 000 €, un T2 secteur sauvegardé Palais des Ducs à 175 000 €.\n\nLe **tarif moyen nuitée est de 75-100 €** en moyenne annuelle, **110-160 €** en haute saison (vendanges + Foire Gastronomique + Marché de Noël), 55-80 € en saison creuse (mais l'occupation reste à 55-65 % grâce au mix pro + universitaire + œnotouristique).\n\nDijon **n'est pas classée en zone tendue par décret national** à ce jour (la métropole n'apparaît pas dans le décret n°2023-822 du 25 août 2023). Le régime reste celui du droit commun, durci par la loi Le Meur 2024.",
    conciergeries: [
      {
        name: "Lux'Apart",
        url: 'https://luxapart.fr/conciergerie-dijon/',
        commission: '25 %',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 26,
        biensGeres: 25,
        specialty: 'Dijon centre, 9 Bd Carnot, gestion 7j/7',
        description:
          "Adresse : 9 Boulevard Carnot, Dijon. Ouvert 7j/7 à partir de 9h. Commission claire à 25 % par réservation. Gestion complète : check-in/check-out, ménage professionnel, blanchisserie, gestion consommables, communication voyageurs, annonces optimisées, gestion réservations, optimisation calendrier et tarifs. Société dynamique spécialisée dans la LCD sur Dijon et alentours. Adapté pour propriétaires hyper-centre qui veulent une équipe locale réactive avec un acteur établi disposant d'un véritable bureau de proximité.",
      },
      {
        name: "La Conciergerie d'Émile",
        url: 'https://laconciergeriedemile.com/',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 4.9,
        reviews: 69,
        biensGeres: 40,
        specialty: 'Plusieurs packages, gestion personnalisée locale',
        description:
          "Plusieurs formules disponibles selon le niveau de délégation : pack basique (annonce + ménage), pack premium (gestion complète + optimisation tarifaire), pack sur-mesure (services voyageurs additionnels). Acteur ancré dans le centre de Dijon avec une expertise locale solide. Adapté pour propriétaires qui veulent une gestion personnalisée plutôt qu'une commission standardisée et qui apprécient un acteur avec un historique d'avis vérifiés.",
      },
      {
        name: 'Zenica Conciergerie',
        url: 'https://zenica-conciergerie.fr/',
        commission: '20,5-21,5 %',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 31,
        biensGeres: 30,
        specialty: 'Saint-Apollinaire (Dijon est), gestion complète',
        description:
          "Adresse : 21850 Saint-Apollinaire (banlieue est de Dijon, proche A38). Disponible 7j/7 de 9h à 19h. Commission moyenne 20,5-21,5 % du revenu locatif total. Gestion complète : annonces, réservations, ménage hôtelier, linge professionnel, consommables, accueil voyageurs, optimisation tarifaire. Approche rigoureuse et personnalisée. Pertinente pour propriétaires Dijon est + Saint-Apollinaire + Quetigny + Chevigny qui veulent un acteur proche géographiquement.",
      },
      {
        name: 'At\'Home B&B',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 22,
        biensGeres: 20,
        specialty: 'Annonces multi-plateformes, support 24/7',
        description:
          "Gestion multi-plateformes (Airbnb + Booking + Abritel synchronisés en temps réel via channel manager), support 24/7 pour voyageurs et propriétaires. Service inclus : annonces optimisées, photos professionnelles, pricing dynamique quotidien, accueil voyageurs, ménage professionnel. Adapté pour propriétaires qui veulent maximiser le taux d'occupation via la diffusion multi-plateformes plutôt que la seule visibilité Airbnb.",
      },
      {
        name: 'Les Suites Indivio',
        url: 'https://www.les-suites-indivio.com/',
        commission: 'sur devis',
        menage: 'inclus dans commission',
        rating: 0,
        reviews: 0,
        biensGeres: 10,
        specialty: 'Dijon + Beaune + Côte des Vins, standing hôtelier',
        description:
          "Positionnement explicite sur la combinaison location saisonnière + excellence hôtelière. Couverture Dijon + Beaune + Côte des Vins (axe Route des Grands Crus). Service exclusif et personnalisé. Ménage inclus dans la commission (rare sur le marché). Pertinente pour propriétaires de biens haut de gamme intra-muros Dijon ou Beaune visant une clientèle œnotouristique internationale (Américains, Britanniques, Asiatiques).",
      },
      {
        name: 'La Conciergerie de Cindy',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 17,
        biensGeres: 12,
        specialty: 'Conciergerie locale, attention aux détails',
        description:
          "Structure à dimension humaine portée sur l'attention personnalisée à chaque bien et chaque voyageur (volume d'avis encore réduit à surveiller dans la durée). Adaptée pour propriétaires d'un T2-T3 dijonnais qui privilégient un service ultra-personnalisé plutôt qu'une grande structure de réseau. Bonne option pour un premier passage en LCD avec un interlocuteur unique disponible.",
      },
    ],
    neighborhoods: [
      {
        name: 'Secteur sauvegardé / Palais des Ducs',
        pricePerNight: '100-160 €',
        occupancy: 75,
        description:
          "Cœur historique et secteur sauvegardé (5e plus vaste de France) : Palais des Ducs et des États de Bourgogne, place de la Libération, place François Rude (\"Bareuzai\"), rue des Forges, hôtels particuliers Renaissance. Restaurants étoilés, boutiques, vie culturelle. Demande LCD ultra-soutenue toute l'année. Prix au m² 3 800-5 500 €. T2 dès 175 000 €. Le quartier le plus liquide en LCD à Dijon.",
        roiBrut: '5,5 à 7 %',
      },
      {
        name: 'Darcy / Gare TGV',
        pricePerNight: '85-130 €',
        occupancy: 72,
        description:
          "Quartier Darcy autour du Jardin Darcy et de la gare TGV (1h35 Paris Gare de Lyon, 22 trains/jour). Bourgeois XIXe + immeubles haussmanniens. Demande LCD lissée (touristes culture + pro + week-ends parisiens). Prix au m² 2 800-3 800 €. T2 dès 130 000 €. Excellente liquidité grâce à la proximité gare + centre.",
        roiBrut: '6 à 8 %',
      },
      {
        name: 'Wilson / République',
        pricePerNight: '75-115 €',
        occupancy: 68,
        description:
          "Quartier résidentiel cossu autour de la place Wilson et de la rue de la République, immeubles bourgeois Belle Époque, hôtels particuliers, ambiance plus calme que le centre. Cible familles + clientèle CSP+ + week-ends pro. Prix au m² 2 600-3 600 €. T2 dès 125 000 €. Bon compromis standing + accessibilité.",
        roiBrut: '6 à 7,5 %',
      },
      {
        name: 'Université (Mansart / Montmuzard)',
        pricePerNight: '60-95 €',
        occupancy: 64,
        description:
          "Quartier universitaire est, à proximité du campus de l'Université de Bourgogne (27 000 étudiants, INRAE, Vitagora). Clientèle étudiante (Erasmus, séjours 1-6 mois) + médicale (CHU à 10 min) + pro. Prix au m² 2 200-3 000 €. T2 dès 110 000 €. ROI brut élevé grâce à la demande lissée étudiant + médical + pro toute l'année.",
        roiBrut: '7 à 8,5 %',
      },
      {
        name: 'Faubourg Raines / Maladière',
        pricePerNight: '65-100 €',
        occupancy: 62,
        description:
          "Quartier résidentiel sud-est, ambiance village avec petits commerces et marché. À 10 min en tram du centre. Clientèle pro + touristes en transit + universitaires. Prix au m² 2 100-2 800 €. T2 dès 100 000 €. Ticket d'entrée accessible avec une demande lissée pro + week-end.",
        roiBrut: '7 à 8,5 %',
      },
      {
        name: 'Axe Côte des Vins (Beaune 45 km / Gevrey 10 km)',
        pricePerNight: '120-220 €',
        occupancy: 68,
        description:
          "Côte de Nuits + Côte de Beaune sud de Dijon : Gevrey-Chambertin, Vougeot, Nuits-Saint-Georges, Beaune (45 km). Cible œnotourisme international (Américains, Britanniques, Asiatiques) et vendanges septembre-octobre. Prix au m² 3 000-5 500 € à Beaune, 2 500-4 200 € à Nuits-Saint-Georges. T2 dès 160 000 € à Nuits-Saint-Georges. Saisonnalité marquée (60-70 % du CA sur 5 mois mai-octobre + Marché de Noël Beaune).",
        roiBrut: '5 à 7 %',
      },
    ],
    regulation:
      "Dijon **n'apparaît pas à ce jour dans la liste des communes classées en zone tendue par décret national** (le décret n°2023-822 du 25 août 2023 ne mentionne pas Dijon métropole). Le cadre réglementaire reste donc le régime de droit commun, durci par la loi Le Meur 2024.\n\n**Numéro d'enregistrement obligatoire.** Toute location de meublé de tourisme (résidence principale ou secondaire) requiert une déclaration en mairie de Dijon avec délivrance d'un numéro d'enregistrement à mentionner sur chaque annonce Airbnb, Booking, Abritel. À partir du 20 mai 2026, le téléservice national unique (apimeubles.finances.gouv.fr) prendra le relais avec harmonisation à 13 chiffres pour tous les meublés. Service Réglementation à contacter directement en mairie pour validation des documents.\n\n**Résidence principale.** Limite nationale de **120 nuitées par an** pour la location en résidence principale (logement occupé au moins 8 mois par an, sauf raison professionnelle, santé ou force majeure). Dijon n'étant pas en zone tendue par décret, l'abaissement à 90 jours autorisé par la loi Le Meur ne s'applique pas (à surveiller : la métropole pourrait demander son inscription en zone tendue en cas de tension croissante sur le marché locatif).\n\n**Pas d'autorisation de changement d'usage à ce jour.** Dijon (moins de 200 000 habitants et hors zone tendue par décret) n'a pas activé l'autorisation de changement d'usage pour les résidences secondaires en LCD. La location de meublé de tourisme reste libre tant que le règlement de copropriété ne l'interdit pas — point critique à vérifier sur le secteur sauvegardé (5e plus vaste de France) où certaines copropriétés Renaissance peuvent imposer des restrictions strictes.\n\n**Loi Le Meur 2024.** DPE classe E minimum obligatoire (D à partir de 2034), abattement micro-BIC à 30 % pour les meublés non classés (50 % pour les classés tourisme), plafond chiffre d'affaires à 15 000 € en non classé. Biens classés F ou G au DPE **interdits à la location courte durée à partir du 1er janvier 2028** — un point critique sur le parc ancien dijonnais (hôtels particuliers Renaissance secteur sauvegardé, immeubles XIXe Wilson + Darcy).\n\n**Sanctions nationales.** **5 000 €** pour défaut d'enregistrement, **10 000 €** pour dépassement des 120 jours, **20 000 €** pour fausse déclaration de résidence principale.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** Dijon Métropole applique une taxe de séjour de 0,55 € à 4,30 € par nuit et par personne adulte selon le classement de l'hébergement, collectée automatiquement par Airbnb. Recettes affectées à la promotion de la destination Dijon + Climats UNESCO et au financement d'événements (Foire Internationale Gastronomique d'Automne, Marché de Noël, Cité Internationale Gastronomie et Vin).",
    concreteExample: {
      bienType: 'T2',
      surface: 40,
      pricePerNight: 85,
      neighborhood: 'Secteur sauvegardé (Palais des Ducs)',
      revenuBrut: 20500,
      commissionRate: 0.21,
      menageCount: 75,
      menageUnitCost: 55,
    },
    extraFaq: [
      {
        q: "Le tourisme œnotouristique génère-t-il une vraie demande LCD à Dijon ?",
        a: "Oui — c'est même devenu l'un des moteurs majeurs de la demande LCD dijonnaise depuis le classement UNESCO des Climats du vignoble de Bourgogne en 2015 et l'ouverture en 2022 de la Cité Internationale de la Gastronomie et du Vin (projet 250 millions d'euros, 32 000 m² sur l'ancien hôpital général). La clientèle œnotouristique vient principalement de l'international (Américains, Britanniques, Australiens, Japonais, Suisses, Belges) pour des séjours de 3 à 7 nuits combinant Dijon + Route des Grands Crus + Beaune. Tarifs nuitées : 110-160 €/nuit pour un T2 secteur sauvegardé en saison œnotouristique (mai-octobre), avec un pic vendanges septembre-octobre à 140-200 €/nuit. Sur 6 mois (mai-octobre), un T2 bien placé peut générer 11 000 à 15 000 € bruts. Hors saison, la clientèle pro + universitaire + Marché de Noël maintient l'occupation à 55-65 %.",
      },
      {
        q: "Faut-il acheter à Dijon ou à Beaune pour un Airbnb œnotouristique ?",
        a: "Les deux options sont valables avec des profils différents. Dijon offre une **demande lissée toute l'année** grâce au mix touristes (Palais des Ducs, secteur sauvegardé, Cité Gastronomie) + pro (CHU, université Bourgogne) + œnotouristique (départ Route des Grands Crus). Occupation 66 % annuelle, T2 dès 130 000 €, ROI brut 6-8 %. Beaune offre **les tarifs nuitées les plus élevés de la Côte d'Or** (140-220 €/nuit pour un T2 centre Beaune) mais une saison concentrée mai-octobre + Marché de Noël Beaune en décembre (l'un des plus prisés de Bourgogne). Ticket d'entrée plus élevé (T2 dès 160 000 € à Beaune intra-muros). Occupation 60-65 % avec creux hivernal marqué. Stratégie : Dijon pour pure rentabilité lissée annuelle, Beaune pour CA estival maximisé + autoconsommation hors saison + plus-value patrimoniale liée à la marque Beaune.",
      },
      {
        q: "Quelle conciergerie choisir pour un Airbnb haut de gamme Dijon / Beaune ?",
        a: "Pour un bien haut de gamme ciblant la clientèle œnotouristique internationale, 3 options solides selon le profil. **Les Suites Indivio** (couverture Dijon + Beaune + Côte des Vins, standing hôtelier, 5,0/5 sur 8 avis Google encore réduit mais positionnement clairement luxe, ménage inclus dans la commission). **Lux'Apart** (5,0/5 sur 17 avis Google, équipe Dijon centre, bureau réel 9 Bd Carnot, commission 25 % claire) pour les biens hyper-centre Dijon. **La Conciergerie d'Émile** (4,9/5 sur 37 avis Google, plus gros volume d'avis vérifiés, plusieurs packages selon le niveau de délégation) pour les propriétaires qui veulent un acteur ancré avec historique. À éviter pour haut de gamme : les conciergeries généralistes nationales sans positionnement clair œnotourisme, qui peuvent ne pas tenir l'expérience clientèle internationale haut de gamme.",
      },
    ],
    updatedAt: '2026-05-27',
  },
  // ==========================================================================
  // LA BAULE
  // ==========================================================================
  {
    slug: 'la-baule',
    displayName: 'La Baule',
    region: 'Pays de la Loire',
    regionSlug: 'pays-de-la-loire',
    title: 'Conciergerie La Baule Airbnb : comparatif 2026 des 4 meilleures agences',
    metaTitle: 'Conciergerie Airbnb La Baule : comparatif & avis 2026',
    metaDescription:
      "Comparatif des meilleures conciergeries Airbnb de La Baule : tarifs, services, avis Google, réglementation 2026 et quartiers rentables de la presqu'île guérandaise.",
    kwPrincipal: 'conciergerie la baule',
    kwSecondaires: [
      'conciergerie airbnb la baule',
      'les concierges la baule',
      'conciergerie pornichet',
      'gestion locative la baule',
      'meublé tourisme la baule',
    ],
    population: 16900,
    tourists: 2000000,
    activeListings: 2400,
    priceLow: 80,
    priceHigh: 170,
    occupancyRate: 58,
    revpar: 58,
    seasonality:
      "Saisonnalité très marquée de station balnéaire atlantique. Pic estival massif juillet-août (occupation 85-95 %, tarifs 1,5 à 2,5× la moyenne annuelle, réservations bouclées plusieurs mois à l'avance) porté par les 8 km de plage de la baie et une clientèle famille et haut de gamme. Ailes de saison soutenues d'avril à juin et en septembre (week-ends prolongés, ponts, golf, thalasso). Creux hivernal net (occupation 30-40 %) hors vacances de la Toussaint et de Noël. Le parc composé à près de 80 % de résidences secondaires alimente une offre LCD abondante mais souvent gérée à distance.",
    rankNational: 30,
    introCustom:
      "Vous possédez un appartement sur le **Remblai**, une villa à **La Baule-les-Pins** ou un studio proche du marché central, que vous louez sur Airbnb ou que vous comptez mettre en location saisonnière.\n\nEntre les **8 km de plage** qui remplissent la baie de juin à septembre, une clientèle famille et haut de gamme exigeante, des rotations hebdomadaires en plein été, et un parc composé à près de **80 % de résidences secondaires**, la question n'est pas de savoir s'il y a de la demande — mais comment la capter sans y passer vos week-ends.\n\nUne conciergerie peut s'en charger. Reste à choisir la bonne, et à vérifier qu'elle vous laisse une marge nette qui en vaut la peine.",
    marketIntro:
      "La Baule est l'une des stations balnéaires les plus cotées de la façade atlantique et l'un des marchés saisonniers les plus actifs des Pays de la Loire. Le marché y est dominé par la résidence secondaire (près de 80 % du parc), ce qui crée une offre LCD abondante mais souvent mal optimisée : beaucoup de propriétaires gèrent depuis Paris, Nantes ou Rennes et ne sont pas sur place pour les arrivées.\n\nLa clientèle est majoritairement française, familiale et plutôt aisée, avec un pic estival très concentré (juillet-août) et des tarifs nuitée qui peuvent doubler en haute saison. Les biens **vue mer ou à moins de 300 m de la plage** se louent à prime, tandis qu'un secteur comme Escoublac offre un ticket d'entrée plus accessible.\n\nDans ce contexte, une conciergerie locale sérieuse se rentabilise vite sur la fenêtre estivale — à condition de cadrer précisément le traitement du ménage et des frais annexes. Notre [simulateur de rentabilité](/estimation-airbnb) permet de comparer gestion autonome et conciergerie sur votre cas.",
    conciergeries: [
      {
        name: 'Les Concierges',
        url: 'https://www.les-concierges.com/',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 47,
        specialty: 'Haut de gamme face mer, presqu’île',
        description:
          "L'agence affiche un catalogue d'une quarantaine de biens sélectionnés entre La Baule, Pornichet, Le Pouliguen et Batz-sur-Mer, positionnés sur le segment locations de vacances haut de gamme « face mer ». Service sur-mesure (sélection rigoureuse des biens, accueil personnalisé, attentions d'arrivée). Pertinente pour un propriétaire d'un bien de standing vue mer ou hyper-centre qui cherche un partenaire ancré localement avec une vraie réputation.",
      },
      {
        name: 'Conciergerie La Baule',
        url: 'https://conciergerielabaule.fr/',
        commission: '20 % TTC',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 10,
        biensGeres: 15,
        specialty: 'Premium front de mer, volume limité',
        description:
          "Conciergerie La Baule se présente comme partenaire Airbnb et revendique un nombre de biens volontairement limité, exclusivement premium (front de mer, vue mer, hyper-centre). Commission annoncée de 20 % TTC sur les revenus locatifs. Gestion clé en main et présence également à Rennes et sur l'île de Ré. Pertinente pour un propriétaire d'un bien premium qui privilégie un suivi resserré plutôt qu'un acteur volumique.",
      },
      {
        name: 'Zen Weekey',
        commission: '20 % HT',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 20,
        specialty: 'Approche humaine, reporting de performance',
        description:
          "Commission annoncée de 20 % HT sur les revenus locatifs. Particularités mises en avant : rapports de performance réguliers et conseils déco pour valoriser le bien. Pertinente pour un propriétaire qui veut un interlocuteur disponible et des retours chiffrés sur l'occupation et le revenu, sans basculer chez un acteur national standardisé.",
      },
      {
        name: 'La Baule Sweet Home',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 18,
        specialty: 'Home staging & intendance de maison',
        description:
          "La Baule Sweet Home combine conciergerie locative et services d'intendance de résidence : home staging, organisation d'événements, aide à l'acquisition et gestion de maison. Positionnement plus large que la seule gestion Airbnb, utile pour un propriétaire de résidence secondaire qui veut un interlocuteur unique pour la location saisonnière et l'entretien du bien hors période louée.",
      },
    ],
    neighborhoods: [
      {
        name: 'Le Remblai / front de mer',
        pricePerNight: '110-260 €',
        occupancy: 65,
        description:
          "La promenade qui longe la baie sur plusieurs kilomètres, bordée d'immeubles avec vue mer. Le secteur le plus prisé et le plus rentable en LCD : la vue mer se loue à prime et l'occupation estivale frôle la saturation. Ticket d'entrée élevé (T2 souvent au-delà de 280 000 €).",
        roiBrut: '3,5 à 5 %',
      },
      {
        name: 'La Baule-les-Pins',
        pricePerNight: '95-200 €',
        occupancy: 60,
        description:
          "Quartier résidentiel chic autour de la place des Palmiers, villas sous les pins, ambiance familiale et haut de gamme. Recherché pour les séjours en famille et les locations de maisons. Prix d'achat élevés mais demande estivale très solide.",
        roiBrut: '4 à 5,5 %',
      },
      {
        name: 'Centre / hyper-centre',
        pricePerNight: '85-160 €',
        occupancy: 60,
        description:
          "Autour du marché central, des commerces et de la gare. Apprécié pour les séjours « tout à pied » sans voiture, à quelques minutes de la plage. Bon compromis entre prix d'achat et taux d'occupation, avec une saison un peu plus étalée que le front de mer.",
        roiBrut: '4,5 à 6 %',
      },
      {
        name: 'Plage Benoît',
        pricePerNight: '85-170 €',
        occupancy: 58,
        description:
          "À l'ouest de la baie, plage plus familiale et calme, large estran à marée basse. Clientèle famille recherchant la tranquillité. Tickets d'achat un peu plus accessibles que le cœur du Remblai pour une proximité plage comparable.",
        roiBrut: '4,5 à 6 %',
      },
      {
        name: 'Escoublac',
        pricePerNight: '70-120 €',
        occupancy: 52,
        description:
          "Bourg historique au cœur de la commune, près de la forêt d'Escoublac, en retrait du front de mer. Le secteur le plus abordable de La Baule : tickets d'achat plus bas, clientèle qui accepte d'être à quelques minutes en voiture de la plage. Meilleur rendement brut de la commune.",
        roiBrut: '5,5 à 7 %',
      },
      {
        name: 'Pornichet / Le Pouliguen',
        pricePerNight: '80-180 €',
        occupancy: 58,
        description:
          "Communes limitrophes de la même baie, sur lesquelles opèrent la plupart des conciergeries bauloises. Pornichet (côté est, port) et Le Pouliguen (côté ouest, port de plaisance) offrent une demande estivale comparable avec des tickets d'achat parfois plus accessibles qu'à La Baule intra-muros.",
        roiBrut: '4,5 à 6 %',
      },
    ],
    regulation:
      "La Baule-Escoublac fait partie des stations balnéaires qui ont **encadré la location de meublés de tourisme**. La commune a instauré une **autorisation préalable de changement d'usage** pour les meublés de tourisme qui ne constituent pas la résidence principale du loueur, motivée par un parc composé à près de 80 % de résidences secondaires. Avant de louer un bien en courte durée toute l'année, il faut donc vérifier le régime applicable auprès du service urbanisme de la mairie.\n\n**Déclaration et numéro d'enregistrement.** Toute mise en location d'un meublé de tourisme doit être déclarée en mairie, ce qui délivre un numéro d'enregistrement à porter sur chaque annonce Airbnb, Booking ou Abritel. À partir du 20 mai 2026, ce numéro bascule vers le téléservice national unique (apimeubles.finances.gouv.fr), à 13 chiffres pour tous les meublés.\n\n**Résidence principale.** La location de la résidence principale (logement occupé au moins 8 mois par an) reste plafonnée à **120 nuitées par an** au niveau national.\n\n**Loi Le Meur 2024.** DPE classe E minimum, abattement micro-BIC ramené à 30 % pour les meublés non classés (50 % pour les classés tourisme), et interdiction progressive des passoires thermiques (F puis G) à la location. Sanctions : jusqu'à 10 000 € pour défaut d'enregistrement et 20 000 € pour fausse déclaration.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** La commune applique une taxe de séjour de l'ordre de 0,75 € à 4,30 € par nuit et par personne selon le classement de l'hébergement, collectée automatiquement par les plateformes.",
    concreteExample: {
      bienType: 'T2',
      surface: 45,
      pricePerNight: 100,
      neighborhood: 'Le Remblai (front de mer)',
      revenuBrut: 21000,
      commissionRate: 0.20,
      menageCount: 50,
      menageUnitCost: 75,
    },
    extraFaq: [
      {
        q: 'Faut-il une autorisation pour louer en Airbnb à La Baule en 2026 ?',
        a: "Cela dépend du statut du bien. Pour une résidence secondaire louée en meublé de tourisme toute l'année, La Baule applique une autorisation préalable de changement d'usage, justifiée par un parc composé à près de 80 % de résidences secondaires : il faut vérifier le régime auprès du service urbanisme de la mairie avant de se lancer. Dans tous les cas, une déclaration en mairie est obligatoire et délivre un numéro d'enregistrement à porter sur chaque annonce (numéro qui bascule vers le téléservice national à 13 chiffres à partir du 20 mai 2026). Pour une résidence principale, la location reste possible dans la limite de 120 nuitées par an.",
      },
      {
        q: 'Combien rapporte un Airbnb à La Baule pendant l\'été ?',
        a: "L'été concentre l'essentiel du chiffre d'affaires baulois. Un T2 proche de la plage qui se loue 90-110 €/nuit en moyenne annuelle peut grimper à 150-260 €/nuit en juillet-août, avec une occupation de 85-95 % et un minimum de plusieurs nuits imposé. Sur les deux mois d'été, un bien bien placé génère couramment 30 à 45 % de son revenu annuel. La contrepartie : des rotations hebdomadaires intenses (check-out le samedi, ménage, check-in dans la foulée) qui rendent une conciergerie locale précieuse quand on n'habite pas sur place.",
      },
      {
        q: 'Quel quartier choisir pour investir en LCD à La Baule ?',
        a: "Pour la prime à la nuitée et l'occupation estivale maximale, le Remblai et le front de mer restent imbattables, mais avec le ticket d'entrée le plus élevé (rendement brut souvent sous 5 %). La Baule-les-Pins offre le standing familial haut de gamme. Pour un meilleur rendement brut, le centre et la plage Benoît sont de bons compromis prix/occupation, et Escoublac, en retrait du front de mer, offre les tickets d'achat les plus accessibles de la commune (rendement brut jusqu'à 6-7 %). Les communes voisines Pornichet et Le Pouliguen partagent la même baie avec des prix parfois plus doux.",
      },
    ],
    updatedAt: '2026-05-27',
  },
  // ==========================================================================
  // BREST
  // ==========================================================================
  {
    slug: 'brest',
    displayName: 'Brest',
    region: 'Bretagne',
    regionSlug: 'bretagne',
    title: 'Conciergerie Brest Airbnb : comparatif 2026 des 6 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Brest : comparatif 2026 (tarifs)',
    metaDescription:
      "Comparatif des 6 meilleures conciergeries Airbnb de Brest : tarifs (18-33 %), services, avis Google, réglementation zone tendue 2026 et quartiers rentables.",
    kwPrincipal: 'conciergerie brest',
    kwSecondaires: [
      'conciergerie airbnb brest',
      'gestion locative courte durée brest',
      'conciergerie finistère',
      'meublé tourisme brest',
      'airbnb brest',
    ],
    population: 142000,
    tourists: 1500000,
    activeListings: 1200,
    priceLow: 55,
    priceHigh: 105,
    occupancyRate: 63,
    revpar: 45,
    seasonality:
      "Saisonnalité plus étalée que les stations balnéaires pures. Demande de fond toute l'année portée par le tourisme d'affaires (base navale, port, technopôle Brest-Iroise), le pôle universitaire (UBO, environ 20 000 étudiants) et les visites de familles. Pic estival juin-septembre tiré par Océanopolis, le littoral, la rade et le rôle de Brest comme porte d'entrée vers la pointe du Finistère, Crozon et les îles. Pic exceptionnel tous les quatre ans avec les Fêtes Maritimes Internationales (environ 500 000 visiteurs en six jours en 2024), qui saturent l'hébergement et tendent fortement le marché LCD.",
    rankNational: 34,
    introCustom:
      "Vous avez un appartement à **Brest**, dans le quartier de Siam, à Recouvrance ou près d'Océanopolis, que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée.\n\nBrest n'est pas une station balnéaire : ici la demande tient autant au **tourisme d'affaires**, à l'**université** et au port qu'aux vacanciers. C'est une bonne nouvelle — l'occupation est plus régulière sur l'année — mais cela suppose une gestion réactive en semaine comme le week-end.\n\nEntre les arrivées tardives, les messages voyageurs et le ménage entre deux séjours, déléguer à une conciergerie peut avoir du sens. Encore faut-il choisir un acteur réellement ancré à Brest, et pas une marque nationale de passage.",
    marketIntro:
      "Brest est la deuxième ville de Bretagne (environ 142 000 habitants, près de 210 000 sur la métropole) et un marché LCD porté par un mix singulier : tourisme d'affaires lié à la base navale et au port, pôle universitaire de l'UBO, équipements phares comme Océanopolis (environ 300 000 visiteurs par an) et rôle de tête de pont vers la pointe du Finistère.\n\nLa demande y est **plus régulière qu'en station balnéaire**, avec une occupation qui tient en semaine grâce aux déplacements professionnels et aux visites familiales d'étudiants, puis un pic estival sur le littoral et la rade. Les Fêtes Maritimes Internationales, tous les quatre ans, créent un appel d'air spectaculaire sur l'hébergement.\n\nCôté réglementation, Brest est classée en **zone tendue** depuis 2023, ce qui impose une vigilance accrue (déclaration, numéro d'enregistrement) et autorise la collectivité à durcir les règles. Notre [simulateur de rentabilité](/estimation-airbnb) aide à comparer gestion autonome et conciergerie sur votre bien.",
    conciergeries: [
      {
        name: "Conciergerie Finist'Armor",
        url: 'https://www.conciergerie-finistarmor.fr/',
        commission: '18 à 33 % TTC',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 40,
        specialty: 'Couverture Finistère, agence établie',
        description:
          "Finist'Armor est une structure finistérienne établie qui propose un service de conciergerie courte durée et saisonnière clé en main sur un large secteur (de Brest à Quimper, d'Audierne à Roscoff). Grille de commission affichée entre 18 et 33 % TTC selon le niveau de délégation et les services inclus. Pertinente pour un propriétaire qui veut un acteur régional solide capable de gérer des biens hors du seul centre brestois.",
      },
      {
        name: 'NM Conciergerie',
        url: 'https://www.nmconciergerie.fr/',
        commission: '24 % TTC',
        menage: 'refacturé voyageur',
        rating: 5.0,
        reviews: 6,
        biensGeres: 15,
        specialty: 'Centre-ville Brest, sur-mesure',
        description:
          "NM Conciergerie est basée en plein centre de Brest et accompagne les propriétaires sur leur activité de location courte et moyenne durée. Commission annoncée de 24 % TTC. Services : ménage, gestion du linge, consommables, et mise en relation avec décorateurs, architectes d'intérieur et artisans pour valoriser le bien. Pertinente pour un propriétaire d'un bien en centre-ville qui veut un interlocuteur de proximité et un service personnalisé.",
      },
      {
        name: 'Concierge BB',
        url: 'https://www.conciergebb.fr/',
        commission: '20 à 25 %',
        menage: 'refacturé voyageur',
        rating: 4.3,
        reviews: 114,
        biensGeres: 30,
        specialty: 'Partenaire local multi-quartiers',
        description:
          "Concierge BB est une marque multi-villes disposant d'une présence locale à Brest, avec gestion complète : optimisation des annonces, accueil voyageurs 7j/7, ménage hôtelier, photos professionnelles, suivi technique. Commission généralement annoncée entre 20 et 25 %. Couvre les quartiers Centre, Recouvrance, Saint-Marc et Lambézellec. À comparer attentivement avec les acteurs purement locaux.",
      },
      {
        name: 'Concigreen',
        url: 'https://www.concigreen.fr/',
        commission: '20 à 25 %',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 15,
        specialty: 'Conciergerie éco-responsable',
        description:
          "Concigreen est une conciergerie locale brestoise positionnée sur le créneau éco-responsable (ménage écologique, démarche durable), fondée par Rebecca Trémintin et présente à Brest et au Relecq-Kerhuon. Commission annoncée entre 20 et 25 % des revenus, avec un forfait de lancement. Petite structure de proximité, pertinente pour un propriétaire sensible à une gestion responsable et à un contact direct avec la fondatrice.",
      },
      {
        name: 'Hestia Conciergerie',
        url: 'https://www.hestiaconciergerie.bzh/',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 4.8,
        reviews: 46,
        biensGeres: 20,
        specialty: 'Pays d’Iroise & nord Finistère',
        description:
          "Hestia Conciergerie (SAS dirigée par Sébastien Bellec) est ancrée à l'ouest de Brest, vers Saint-Renan et Lampaul-Ploudalmézeau, sur le Pays d'Iroise et les Abers. Gestion de locations saisonnières (appartements, maisons et villas, dont des biens vue mer) avec accueil personnalisé. Pertinente pour un propriétaire d'un bien situé sur la côte au nord-ouest de Brest, hors de l'hyper-centre, où les acteurs du centre-ville sont moins présents.",
      },
      {
        name: "Need'Air Conciergerie",
        commission: '20 % dégressif',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 8,
        biensGeres: 12,
        specialty: 'Tarif dégressif, gestion complète',
        description:
          "Need'Air est une conciergerie brestoise proposant une gestion complète de la location courte durée avec une commission annoncée à partir de 20 %, dégressive selon le volume. Positionnement service complet (annonces, accueil, ménage, suivi). Pertinente pour un propriétaire multi-biens à Brest sensible à un barème de commission dégressif.",
      },
    ],
    neighborhoods: [
      {
        name: 'Siam / Brest-centre',
        pricePerNight: '60-110 €',
        occupancy: 68,
        description:
          "Cœur de ville autour de la rue de Siam, de la place de la Liberté au pont de Recouvrance : commerces, restaurants, transports, château et port à proximité. Le secteur le plus demandé pour le city-break et le tourisme d'affaires, avec une occupation lissée toute l'année.",
        roiBrut: '5,5 à 7 %',
      },
      {
        name: 'Recouvrance / Les Capucins',
        pricePerNight: '55-100 €',
        occupancy: 62,
        description:
          "Quartier historique rive droite de la Penfeld (Tour Tanguy, pont levant) et plateau des Ateliers des Capucins, desservi par le téléphérique. Forte identité patrimoniale et vues sur le port, attractif pour la clientèle touristique. Tickets d'achat plus accessibles que l'hyper-centre.",
        roiBrut: '6 à 7,5 %',
      },
      {
        name: 'Le Port de commerce',
        pricePerNight: '55-100 €',
        occupancy: 60,
        description:
          "Zone animée le soir (bars, restaurants, sorties) proche des départs maritimes. Clientèle festive, événementielle et de passage. Bon compromis pour un bien destiné aux courts séjours et aux week-ends.",
        roiBrut: '5,5 à 7 %',
      },
      {
        name: 'Saint-Marc',
        pricePerNight: '55-95 €',
        occupancy: 60,
        description:
          "Quartier résidentiel calme à l'est, vue sur la rade, à proximité d'Océanopolis et de la plage du Moulin Blanc. Idéal pour les séjours familiaux et la clientèle estivale. Tickets d'achat raisonnables pour un cadre verdoyant.",
        roiBrut: '6 à 7,5 %',
      },
      {
        name: 'Lambézellec',
        pricePerNight: '50-90 €',
        occupancy: 58,
        description:
          "Au nord de Brest, ambiance village, marchés de quartier et commerces de proximité. Plutôt adapté aux séjours moyenne durée et aux voyageurs cherchant le calme. Parmi les tickets d'achat les plus accessibles de la commune.",
        roiBrut: '6,5 à 8 %',
      },
      {
        name: 'Saint-Pierre / Quatre-Moulins',
        pricePerNight: '50-90 €',
        occupancy: 57,
        description:
          "Quartiers de l'ouest brestois, résidentiels, proches de l'arsenal et des plages de la presqu'île. Demande mixte (déplacements professionnels, familles). Bon rendement brut grâce à des prix d'achat contenus, à condition de soigner l'accès au centre.",
        roiBrut: '6,5 à 8 %',
      },
    ],
    regulation:
      "Brest est classée en **zone tendue** depuis l'arrêté ministériel du 3 octobre 2023 (révision du zonage), confirmé en 2024. Ce classement traduit une pression sur le logement et **autorise la collectivité à renforcer la régulation** des meublés de tourisme (autorisation de changement d'usage, abaissement possible du plafond à 90 nuitées pour la résidence principale). À ce jour, l'activation effective de ces leviers par Brest Métropole n'est pas confirmée publiquement : à vérifier auprès de la métropole avant de lancer une location secondaire à l'année.\n\n**Déclaration et numéro d'enregistrement.** Brest Métropole impose la déclaration des meublés de tourisme via le téléservice DéclaLoc, qui attribue un **numéro d'enregistrement à 13 caractères** obligatoire sur chaque annonce. Le registre national unique prévu par la loi Le Meur est en cours de déploiement et devrait prendre le relais courant 2026.\n\n**Résidence principale.** Location plafonnée à **120 nuitées par an** au niveau national (abaissable à 90 en zone tendue sur délibération).\n\n**Loi Le Meur 2024.** DPE classe E minimum, abattement micro-BIC à 30 % pour les meublés non classés (50 % pour les classés), interdiction progressive des passoires thermiques. Sanctions : jusqu'à 10 000 € pour défaut d'enregistrement, 20 000 € pour fausse déclaration.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** Brest Métropole applique une taxe de séjour, de l'ordre de 0,75 € à 4,30 € par nuit et par personne selon le classement de l'hébergement, collectée automatiquement par les plateformes.",
    concreteExample: {
      bienType: 'T2',
      surface: 42,
      pricePerNight: 70,
      neighborhood: 'Siam / Brest-centre',
      revenuBrut: 16000,
      commissionRate: 0.20,
      menageCount: 75,
      menageUnitCost: 50,
    },
    extraFaq: [
      {
        q: 'Faut-il un numéro d\'enregistrement pour louer en Airbnb à Brest en 2026 ?',
        a: "Oui. Brest Métropole impose la déclaration de tout meublé de tourisme via le téléservice DéclaLoc, qui délivre un numéro d'enregistrement à 13 caractères à reporter sur chaque annonce Airbnb, Booking ou Abritel. Sans ce numéro, les plateformes désactivent l'annonce. Brest étant classée en zone tendue depuis 2023, la collectivité peut par ailleurs durcir les règles (autorisation de changement d'usage, plafond abaissé à 90 nuitées pour la résidence principale) : il est prudent de vérifier l'état exact du dispositif auprès de la métropole avant de lancer une location de résidence secondaire à l'année.",
      },
      {
        q: 'Le marché Airbnb de Brest est-il très saisonnier ?',
        a: "Moins que les stations balnéaires. La demande brestoise repose largement sur le tourisme d'affaires (base navale, port, technopôle), l'université (UBO, environ 20 000 étudiants) et les visites familiales, ce qui maintient une occupation correcte en semaine et hors été. Le pic touristique reste estival (Océanopolis, rade, départ vers la pointe du Finistère et Crozon), et les Fêtes Maritimes Internationales, tous les quatre ans, génèrent un pic exceptionnel (environ 500 000 visiteurs en six jours en 2024) qui sature l'hébergement. Cette régularité relative est un atout pour amortir une conciergerie sur l'année.",
      },
      {
        q: 'Quels quartiers privilégier pour un Airbnb à Brest ?',
        a: "Pour une occupation lissée toute l'année, le secteur Siam / Brest-centre est le plus sûr (commerces, transports, clientèle affaires et city-break). Recouvrance et le plateau des Capucins offrent identité patrimoniale et vues sur le port avec des prix d'achat plus accessibles. Saint-Marc, calme et proche d'Océanopolis et de la plage du Moulin Blanc, est idéal pour la clientèle familiale estivale. Pour viser le meilleur rendement brut, Lambézellec et l'ouest brestois (Saint-Pierre, Quatre-Moulins) affichent des tickets d'achat contenus, à condition de soigner l'accès au centre.",
      },
    ],
    updatedAt: '2026-05-27',
  },
  // ==========================================================================
  // NANCY
  // ==========================================================================
  {
    slug: 'nancy',
    displayName: 'Nancy',
    region: 'Grand Est',
    regionSlug: 'alsace',
    title: 'Conciergerie Nancy Airbnb : comparatif 2026 des 6 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Nancy : comparatif 2026 (avis)',
    metaDescription:
      "Comparatif des 6 meilleures conciergeries Airbnb de Nancy : tarifs, services, avis Google, réglementation 2026 et quartiers rentables (Stanislas, Charles III).",
    kwPrincipal: 'conciergerie nancy',
    kwSecondaires: [
      'conciergerie airbnb nancy',
      'cocoonr nancy',
      'location courte durée nancy',
      'meublé tourisme nancy',
      'airbnb nancy',
    ],
    population: 104000,
    tourists: 2000000,
    activeListings: 950,
    priceLow: 55,
    priceHigh: 95,
    occupancyRate: 62,
    revpar: 44,
    seasonality:
      "Saisonnalité tirée par un calendrier culturel et événementiel dense, complétée par les déplacements professionnels et le tourisme étudiant. Pic majeur en décembre avec les Fêtes de Saint-Nicolas, tradition lorraine emblématique (marché, défilé), qui tendent fortement l'hébergement. Double pic de rentrée en septembre avec Le Livre sur la Place (premier grand salon littéraire de la rentrée) et le Jardin éphémère installé sur la place Stanislas. Tourisme d'affaires régulier en semaine (centre de congrès, quartier Saint-Sébastien/Charles III) et clientèle UNESCO loisirs au printemps-été. Creux estival partiel lié au départ des étudiants.",
    rankNational: 32,
    introCustom:
      "Vous avez un appartement à **Nancy**, à deux pas de la **place Stanislas**, dans la Ville-Vieille ou près de la gare, que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée.\n\nNancy combine plusieurs demandes : le **tourisme culturel** porté par l'ensemble classé à l'UNESCO et l'Art nouveau de l'École de Nancy, les **déplacements professionnels** autour du centre de congrès, et une forte population **étudiante**. Le calendrier événementiel — Saint-Nicolas, Livre sur la Place, Jardin éphémère — crée des pics réguliers.\n\nDéléguer la gestion à une conciergerie peut faire sens, surtout si vous n'êtes pas sur place. Reste à choisir un acteur fiable parmi une offre locale qui s'est densifiée ces dernières années.",
    marketIntro:
      "Nancy (environ 104 000 habitants, près de 260 000 sur la métropole du Grand Nancy) est un marché LCD porté par un trio d'atouts : un **patrimoine d'exception** avec l'ensemble place Stanislas - place de la Carrière - place d'Alliance classé à l'UNESCO depuis 1983 et l'Art nouveau de l'École de Nancy, une **vie étudiante** dense (université de Lorraine) et un **tourisme d'affaires** structuré autour du centre de congrès et du quartier Saint-Sébastien/Charles III.\n\nLa demande est **lissée par les courts séjours** (Paris à environ 1h30 en TGV) et rythmée par des temps forts : les Fêtes de Saint-Nicolas en décembre, Le Livre sur la Place et le Jardin éphémère en septembre. Les tarifs nuitée restent accessibles par rapport aux grandes métropoles, ce qui maintient des tickets d'entrée raisonnables pour l'investissement.\n\nL'offre de conciergeries s'est étoffée, avec un mix d'acteurs locaux récents et de marques nationales. Notre [simulateur de rentabilité](/estimation-airbnb) permet de comparer gestion autonome et conciergerie sur votre bien.",
    conciergeries: [
      {
        name: 'CÔME Conciergerie',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 4.7,
        reviews: 13,
        biensGeres: 15,
        specialty: 'Gestion complète clé en main',
        description:
          "CÔME Conciergerie propose une gestion complète de la location courte durée à Nancy : optimisation des annonces, accueil voyageurs 7j/7, ménage et maintenance. Positionnement service intégré, pertinent pour un propriétaire qui veut déléguer l'ensemble du cycle locatif à un interlocuteur local et disponible.",
      },
      {
        name: 'MasterKey',
        url: 'https://masterkeyservices.fr/',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 21,
        biensGeres: 20,
        specialty: 'Annonces dynamiques, support 24/7',
        description:
          "MasterKey met l'accent sur la gestion dynamique des annonces (pricing, visibilité multi-plateformes) et un support voyageurs 24/7. Commission sur devis. Pertinente pour un propriétaire qui veut optimiser le taux d'occupation et la réactivité voyageurs sans gérer lui-même les messages.",
      },
      {
        name: 'MAHÉ',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 12,
        specialty: 'Gestion locative & valorisation',
        description:
          "MAHÉ propose une gestion locative clé en main avec un accent sur la valorisation et l'entretien des logements. Commission sur devis. Profil de conciergerie de proximité, adaptée à un propriétaire qui cherche un suivi soigné de son bien sur le long terme plutôt qu'un volume de transactions.",
      },
      {
        name: 'Clés & Anne',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 0,
        reviews: 0,
        biensGeres: 8,
        specialty: 'Proximité, du studio au thématisé',
        description:
          "Clés & Anne est une petite structure axée sur la proximité et la réactivité, gérant aussi bien des studios que des appartements thématisés. Commission sur devis. Pertinente pour un propriétaire d'un ou deux biens qui privilégie un contact direct et un service très personnalisé.",
      },
      {
        name: 'Rock in Share',
        url: 'https://www.rock-in-share.com/fr/',
        commission: 'sur devis (~20 %)',
        menage: 'refacturé voyageur',
        rating: 4.4,
        reviews: 21,
        biensGeres: 120,
        specialty: 'Volume axe lorrain Metz / Nancy',
        description:
          "Rock in Share est l'acteur volumique de l'axe lorrain (Nancy, Metz, Thionville, Strasbourg), avec un bureau à Nancy. Couverture complète (photos, diffusion multi-plateformes, accueil, ménage hôtelier, pricing) et orientation marquée vers la clientèle d'affaires. Pertinente pour un propriétaire multi-biens cherchant un interlocuteur unique sur la Lorraine.",
      },
      {
        name: 'GuestReady',
        url: 'https://www.guestready.com/',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 3.8,
        reviews: 34,
        biensGeres: 50,
        specialty: 'Acteur national, gestion tech',
        description:
          "GuestReady est un acteur national présent à Nancy, appuyé sur une plateforme technologique pour la gestion courte et moyenne durée. Commission sur devis. Pertinente pour un propriétaire qui privilégie un process industrialisé et un reporting standardisé, à comparer avec les conciergeries locales sur la qualité du suivi.",
      },
    ],
    neighborhoods: [
      {
        name: 'Place Stanislas / Centre',
        pricePerNight: '65-110 €',
        occupancy: 68,
        description:
          "Cœur touristique autour de l'ensemble UNESCO (places Stanislas, Carrière, Alliance), commerces, musées et restaurants. Le secteur le plus prisé pour la clientèle loisirs, avec une rotation rapide et une demande premium. Ticket d'entrée le plus élevé de la ville.",
        roiBrut: '5 à 6,5 %',
      },
      {
        name: 'Ville-Vieille',
        pricePerNight: '60-100 €',
        occupancy: 64,
        description:
          "Quartier historique médiéval (Grande-Rue, Palais des Ducs de Lorraine, Porte de la Craffe) au fort cachet. Idéal pour les séjours culturels. Charme préservé et proximité immédiate du centre, pour des tickets d'achat un peu plus accessibles que la place Stanislas.",
        roiBrut: '5,5 à 7 %',
      },
      {
        name: 'Saint-Sébastien / Charles III',
        pricePerNight: '55-95 €',
        occupancy: 65,
        description:
          "Quartier commerçant et d'affaires autour du marché central et du centre de congrès. Clientèle business et courts séjours en semaine. Bon compromis prix/occupation, avec une demande lissée par le tourisme professionnel.",
        roiBrut: '5,5 à 7 %',
      },
      {
        name: 'Quartier Gare',
        pricePerNight: '55-90 €',
        occupancy: 64,
        description:
          "Autour de la gare TGV (Paris à environ 1h30), hyper-pratique pour les voyageurs d'affaires et de transit. Check-in faciles, demande régulière en semaine. Tickets d'achat raisonnables pour une localisation très fonctionnelle.",
        roiBrut: '6 à 7,5 %',
      },
      {
        name: 'Saurupt / École de Nancy',
        pricePerNight: '60-100 €',
        occupancy: 58,
        description:
          "Secteur résidentiel chic marqué par les façades Art nouveau de l'École de Nancy et le musée éponyme. Cadre recherché pour des séjours plus longs et une clientèle sensible au patrimoine. Demande un peu moins touristique mais des biens de caractère.",
        roiBrut: '5,5 à 7 %',
      },
      {
        name: 'Rives de Meurthe',
        pricePerNight: '55-90 €',
        occupancy: 60,
        description:
          "Quartiers en renouvellement le long de la Meurthe, mix résidentiel et nouveaux programmes. Tickets d'achat parmi les plus accessibles du centre élargi, pour un rendement brut intéressant, à condition de soigner la liaison avec le cœur touristique.",
        roiBrut: '6 à 7,5 %',
      },
    ],
    regulation:
      "Nancy s'inscrit dans une agglomération classée en **zone tendue** (plusieurs communes du Grand Nancy ont été reclassées en zone tendue au 1er janvier 2024). Ce statut traduit une pression sur le marché locatif et **autorise la collectivité à encadrer** les meublés de tourisme. Plusieurs sources professionnelles évoquent une autorisation de changement d'usage pour les meublés hors résidence principale : ce point n'étant pas confirmé par une délibération publique consultable, il est prudent de le vérifier auprès de la mairie de Nancy ou de la Métropole du Grand Nancy avant de lancer une location secondaire à l'année.\n\n**Déclaration et numéro d'enregistrement.** La location d'un meublé de tourisme nécessite une déclaration et un numéro d'enregistrement à porter sur chaque annonce. La loi Le Meur généralise un téléservice national unique d'enregistrement, dont l'entrée en vigueur est prévue au plus tard le 20 mai 2026, avec un numéro à 13 chiffres pour tous les meublés (y compris les résidences principales).\n\n**Résidence principale.** Location plafonnée à **120 nuitées par an** au niveau national (abaissable à 90 en zone tendue sur délibération).\n\n**Loi Le Meur 2024.** DPE classe E minimum, abattement micro-BIC ramené à 30 % pour les meublés non classés (50 % pour les classés tourisme), plafond de chiffre d'affaires à 15 000 € en non classé, interdiction progressive des passoires thermiques. Sanctions pouvant atteindre 10 000 € à 20 000 € selon l'infraction.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** La Métropole du Grand Nancy applique une taxe de séjour, de l'ordre de 0,75 € à 4,30 € par nuit et par personne selon le classement de l'hébergement, collectée automatiquement par les plateformes.",
    concreteExample: {
      bienType: 'T2',
      surface: 42,
      pricePerNight: 68,
      neighborhood: 'Place Stanislas / Centre',
      revenuBrut: 15300,
      commissionRate: 0.20,
      menageCount: 75,
      menageUnitCost: 45,
    },
    extraFaq: [
      {
        q: 'Quelle réglementation Airbnb s\'applique à Nancy en 2026 ?',
        a: "Nancy fait partie d'une agglomération classée en zone tendue, ce qui impose une vigilance sur la déclaration et le numéro d'enregistrement et autorise la collectivité à encadrer les meublés de tourisme. La loi Le Meur généralise un numéro d'enregistrement national à 13 chiffres, obligatoire au plus tard le 20 mai 2026 pour tous les meublés, y compris les résidences principales (plafonnées à 120 nuitées par an). Certaines sources évoquent une autorisation de changement d'usage pour les résidences secondaires : ce point doit être vérifié directement auprès de la mairie de Nancy ou de la Métropole du Grand Nancy, faute de délibération publique clairement consultable.",
      },
      {
        q: 'La Saint-Nicolas dope-t-elle vraiment les Airbnb à Nancy ?',
        a: "Oui. Les Fêtes de Saint-Nicolas (de fin novembre à début décembre) sont un temps fort emblématique de la Lorraine, avec marché, illuminations et grand défilé, qui attirent un large public régional et au-delà. Sur cette période, la demande d'hébergement se tend nettement et les tarifs nuitée montent. C'est, avec la rentrée culturelle de septembre (Le Livre sur la Place et le Jardin éphémère sur la place Stanislas), l'un des deux pics annuels où un bien bien positionné en centre se loue au prix fort. Le reste de l'année, l'occupation tient grâce au tourisme d'affaires et aux courts séjours culturels.",
      },
      {
        q: 'Quels quartiers privilégier pour un Airbnb rentable à Nancy ?',
        a: "Pour la clientèle loisirs et la prime à la nuitée, le secteur place Stanislas / Centre et la Ville-Vieille sont les plus demandés, avec les tickets d'entrée les plus élevés. Pour une occupation lissée par le tourisme d'affaires, Saint-Sébastien/Charles III (centre de congrès, marché central) et le quartier Gare (TGV Paris à environ 1h30) sont d'excellents compromis prix/occupation. Pour viser un meilleur rendement brut, les Rives de Meurthe offrent des tickets d'achat plus accessibles, à condition de soigner la liaison avec le cœur touristique. Saurupt séduit une clientèle sensible à l'Art nouveau pour des séjours plus longs.",
      },
    ],
    updatedAt: '2026-05-27',
  },
  // ==========================================================================
  // VICHY
  // ==========================================================================
  {
    slug: 'vichy',
    displayName: 'Vichy',
    region: 'Auvergne-Rhône-Alpes',
    regionSlug: 'auvergne-rhone-alpes',
    title: 'Conciergerie Vichy Airbnb : comparatif 2026 des 3 meilleures agences',
    metaTitle: 'Conciergerie Airbnb Vichy : comparatif 2026 (avis)',
    metaDescription:
      "Comparatif des meilleures conciergeries Airbnb de Vichy : tarifs, services, avis Google, réglementation 2026 et quartiers rentables de la ville thermale UNESCO.",
    kwPrincipal: 'conciergerie vichy',
    kwSecondaires: [
      'conciergerie airbnb vichy',
      'gestion locative vichy',
      'meublé tourisme vichy',
      'conciergerie thermale vichy',
      'airbnb vichy',
    ],
    population: 26000,
    tourists: 600000,
    activeListings: 650,
    priceLow: 55,
    priceHigh: 105,
    occupancyRate: 60,
    revpar: 45,
    seasonality:
      "Saisonnalité particulière, structurée par le thermalisme. Saison thermale d'avril à octobre : les cures conventionnées de trois semaines génèrent une demande de séjours longs, récurrente et étalée, qui lisse l'occupation bien au-delà du seul été. Pic touristique estival juin-septembre porté par le patrimoine UNESCO, les parcs, le lac d'Allier et l'Opéra. Demande complémentaire toute l'année liée à l'événementiel et au pôle sport (CREPS, hippodrome, stages et compétitions). Creux hivernal plus marqué hors vacances. La clientèle curiste est l'atout LCD distinctif de Vichy : elle réduit la dépendance au pic estival.",
    rankNational: 47,
    introCustom:
      "Vous avez un appartement à **Vichy**, dans le quartier thermal, près des Sources ou en bord d'Allier, que vous louez sur Airbnb ou que vous envisagez de mettre en location courte durée.\n\nVichy a une particularité qui change tout : le **thermalisme**. Les curistes viennent pour des séjours de **trois semaines**, d'avril à octobre, ce qui lisse l'occupation et réduit la dépendance au seul pic estival — mais demande une gestion adaptée (séjours longs, clientèle souvent senior, peu de rotations mais des attentes de confort élevées).\n\nClassée à l'UNESCO comme grande ville d'eaux d'Europe, Vichy attire aussi un tourisme patrimonial. Déléguer à une conciergerie peut faire sens, à condition de choisir un acteur qui connaît cette clientèle curiste.",
    marketIntro:
      "Vichy (environ 26 000 habitants, près de 84 000 sur Vichy Communauté) est la plus prestigieuse station thermale française, inscrite à l'UNESCO depuis 2021 au titre des **Grandes villes d'eaux d'Europe**. Le marché LCD y est porté par un moteur singulier : le **thermalisme**, avec des cures conventionnées de trois semaines qui créent une demande de séjours longs, récurrente d'avril à octobre.\n\nCette clientèle curiste est l'atout distinctif de Vichy : elle **lisse l'occupation** et réduit les rotations (donc les coûts de ménage) par rapport à une station purement estivale. S'y ajoute un tourisme patrimonial (Opéra, Hall des Sources, parcs Belle Époque, lac d'Allier) et un pôle sport reconnu (CREPS, hippodrome) qui génère une demande d'événementiel et de stages.\n\nL'offre de conciergeries reste resserrée et locale, avec des acteurs souvent spécialisés sur la clientèle thermale. Notre [simulateur de rentabilité](/estimation-airbnb) permet de comparer gestion autonome et conciergerie sur votre bien.",
    conciergeries: [
      {
        name: 'Conciergerie Thermale de Vichy',
        url: 'https://conciergerie-auvergne.fr/',
        commission: 'sur devis',
        menage: 'refacturé voyageur',
        rating: 5,
        reviews: 7,
        biensGeres: 10,
        specialty: 'Spécialiste curistes & thermal',
        description:
          "La Conciergerie Thermale de Vichy est positionnée sur la clientèle curiste et le tourisme thermal, avec un service personnalisé (échange de clés, linge, ménage, voire livraison de repas). Catalogue d'une dizaine de logements sur Vichy et l'agglomération. Pertinente pour un propriétaire d'un bien proche des thermes ciblant les cures de trois semaines, qui veut un interlocuteur rodé aux attentes des curistes.",
      },
      {
        name: 'Conciergerie Les Grandes Maisons',
        url: 'https://www.les-grandes-maisons.com/',
        commission: '20 % des revenus',
        menage: 'refacturé voyageur',
        rating: 4.3,
        reviews: 9,
        biensGeres: 12,
        specialty: 'Conciergerie + rénovation',
        description:
          "Les Grandes Maisons combine conciergerie locative et expertise en rénovation/aménagement (plus de vingt ans d'activité dans la rénovation immobilière), sur Vichy, Clermont et Gannat. Commission affichée de 20 % des revenus pour la formule « revenu réel », avec des options chiffrées (ménage/maintenance, création d'annonce, site web). Pertinente pour un propriétaire qui veut à la fois faire gérer son bien et le valoriser par des travaux.",
      },
      {
        name: 'Vichy Conciergerie',
        url: 'https://www.vichyconciergerie.com/',
        commission: 'forfaits (dès 50 €/mois)',
        menage: 'refacturé voyageur',
        rating: 4.1,
        reviews: 18,
        biensGeres: 15,
        specialty: 'Packs modulables à la carte',
        description:
          "Vichy Conciergerie propose un modèle par forfaits plutôt qu'une commission au pourcentage : un pack de lancement (analyse tarifaire, création d'annonce, photos) et un pack de gestion mensuel à partir de 50 € HT par mois pour le suivi des calendriers et des réservations. Pertinente pour un propriétaire autonome qui veut déléguer seulement une partie des tâches et garder la main sur le reste.",
      },
    ],
    neighborhoods: [
      {
        name: 'Quartier thermal / Vieux Vichy',
        pricePerNight: '70-130 €',
        occupancy: 66,
        description:
          "Cœur Belle Époque autour du Hall des Sources et du parc Napoléon III, villas et immeubles de caractère. Le secteur le plus demandé par les curistes premium, à quelques minutes des thermes. Occupation lissée par les cures de trois semaines, prime aux biens de standing.",
        roiBrut: '5,5 à 7 %',
      },
      {
        name: 'Centre-ville / Les Sources',
        pricePerNight: '60-105 €',
        occupancy: 62,
        description:
          "Hyper-centre commerçant autour de l'Opéra et des sources, idéal pour les séjours « tout à pied » sans voiture. Bon compromis entre demande curiste, tourisme patrimonial et courts séjours. Tickets d'achat raisonnables pour une localisation très centrale.",
        roiBrut: '6 à 7,5 %',
      },
      {
        name: 'Les Bains / République',
        pricePerNight: '60-100 €',
        occupancy: 60,
        description:
          "Secteur proche du centre thermal et des berges de l'Allier, cadre verdoyant (club nautique, espaces sportifs). Apprécié pour le calme et la proximité de l'eau. Demande mixte curistes et tourisme détente.",
        roiBrut: '6 à 7,5 %',
      },
      {
        name: "Les Parcs / lac d'Allier",
        pricePerNight: '60-100 €',
        occupancy: 58,
        description:
          "Le long des parcs Belle Époque et du plan d'eau de l'Allier, cadre vert prisé pour les balades et les activités nautiques. Cible familles et séjours détente. Biens avec vue sur le lac particulièrement recherchés en été.",
        roiBrut: '5,5 à 7 %',
      },
      {
        name: 'Bellerive-sur-Allier',
        pricePerNight: '55-90 €',
        occupancy: 58,
        description:
          "Rive gauche de l'Allier, plus résidentielle et calme, avec espaces verts. Tickets d'achat plus accessibles que le centre de Vichy pour une proximité immédiate (passerelles et ponts). Bon rendement brut pour un budget contenu.",
        roiBrut: '6,5 à 8 %',
      },
      {
        name: 'Cusset',
        pricePerNight: '50-85 €',
        occupancy: 55,
        description:
          "Petite ville dynamique de l'agglomération, commerces et patrimoine, à quelques minutes de Vichy. Alternative résidentielle abordable au centre thermal, adaptée aux séjours moyenne durée et à une clientèle qui dispose d'un véhicule.",
        roiBrut: '6,5 à 8 %',
      },
    ],
    regulation:
      "Vichy relève à ce jour du **régime national de droit commun** : aucun dispositif local restrictif spécifique (autorisation de changement d'usage, quota, compensation) n'a été identifié pour la commune ni pour Vichy Communauté, et Vichy ne figure pas dans les listes de zones tendues des grandes métropoles. La location de meublé de tourisme y reste donc relativement libre, sous réserve du règlement de copropriété et d'une vérification en mairie, les règles locales pouvant évoluer.\n\n**Déclaration et numéro d'enregistrement.** La loi Le Meur généralise un téléservice national unique d'enregistrement des meublés de tourisme, dont l'entrée en vigueur est prévue au plus tard le 20 mai 2026, avec un numéro à 13 chiffres à porter sur chaque annonce, y compris pour les résidences principales.\n\n**Résidence principale.** Location plafonnée à **120 nuitées par an** au niveau national pour le logement occupé au moins 8 mois par an.\n\n**Loi Le Meur 2024.** DPE classe E minimum, abattement micro-BIC ramené à 30 % pour les meublés non classés (50 % pour les classés tourisme), plafond de chiffre d'affaires à 15 000 € en non classé, interdiction progressive des passoires thermiques (F puis G) à la location.\n\n**[Taxe de séjour](/calcul-taxe-de-sejour).** Vichy Communauté applique une taxe de séjour, de l'ordre de 0,75 € à 4,30 € par nuit et par personne selon le classement de l'hébergement, collectée automatiquement par les plateformes.",
    concreteExample: {
      bienType: 'T2',
      surface: 40,
      pricePerNight: 70,
      neighborhood: 'Quartier thermal',
      revenuBrut: 15300,
      commissionRate: 0.20,
      menageCount: 35,
      menageUnitCost: 50,
    },
    extraFaq: [
      {
        q: 'Quelle réglementation Airbnb s\'applique à Vichy en 2026 ?',
        a: "À ce jour, Vichy relève du régime national de droit commun : aucun dispositif local restrictif spécifique (autorisation de changement d'usage, quota) n'a été identifié, et la ville ne figure pas parmi les zones tendues des grandes métropoles. La location de meublé de tourisme y reste donc relativement libre, sous réserve du règlement de copropriété. Le cadre national s'applique néanmoins : la loi Le Meur généralise un numéro d'enregistrement national à 13 chiffres, obligatoire au plus tard le 20 mai 2026, et la résidence principale reste plafonnée à 120 nuitées par an. Il est prudent de confirmer l'absence de dispositif local en mairie, les règles pouvant évoluer.",
      },
      {
        q: 'La clientèle curiste change-t-elle la gestion d\'un Airbnb à Vichy ?',
        a: "Oui, et c'est l'atout de Vichy. Les cures thermales conventionnées durent trois semaines et s'étalent d'avril à octobre : un bien loué à des curistes enchaîne des séjours longs plutôt que des week-ends, ce qui lisse l'occupation et réduit fortement le nombre de ménages (donc les coûts) par rapport à une station purement estivale. En contrepartie, la clientèle, souvent senior, attend un confort élevé et des équipements adaptés (literie de qualité, ascenseur, proximité des thermes). Une conciergerie qui connaît cette clientèle sait calibrer les annonces et les tarifs sur la saison thermale, ce qui fait une vraie différence sur le revenu annuel.",
      },
      {
        q: 'Quels quartiers privilégier pour un Airbnb à Vichy ?',
        a: "Pour cibler les curistes premium, le quartier thermal / Vieux Vichy, à quelques minutes du Hall des Sources, offre la meilleure prime à la nuitée et une occupation lissée par les cures. Le centre-ville autour de l'Opéra et des sources est idéal pour les séjours « tout à pied » et combine clientèle curiste, patrimoniale et courts séjours. Pour un meilleur rendement brut avec un budget plus contenu, Bellerive-sur-Allier (rive gauche) et Cusset, dans l'agglomération, offrent des tickets d'achat plus accessibles à quelques minutes du centre thermal.",
      },
    ],
    updatedAt: '2026-05-27',
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
