// ═══════════════════════════════════════════════════════════════
// Contrat LCD — Traductions FR/EN
// Extracted from contrat-tool.js
// ═══════════════════════════════════════════════════════════════

window.CT_TRANSLATIONS = {
    fr: {
      title: 'CONTRAT DE LOCATION SAISONNIÈRE',
      h_parties: 'I. Désignation des parties',
      bailleur: 'Le Bailleur',
      preneur: 'Le Preneur',
      h_objet: 'II. Objet du contrat',
      objet_text: 'Les parties déclarent que la présente location n\'a pas pour objet des locaux loués à usage d\'habitation principale. Les locaux sont loués meublés à titre saisonnier, régis par l\'arrêté du 28 décembre 1976 modifié et à défaut par les dispositions du Code civil (art. 1713 et suivants) et du Code du tourisme (art. L324-1-1 et L324-2).',
      h_logement: 'III. Consistance du logement',
      surface: 'Surface habitable', pieces: 'Nombre de pièces principales', classement: 'Classement', capacite: 'Nombre maximal d\'occupants', pers: 'personnes', num_mairie: 'N° de déclaration en mairie',
      equipements: 'Équipements et charges inclus',
      h_duree: 'IV. Durée de la location',
      du: 'Du', a: 'à', au: 'au', soit: 'soit', nuit: 'nuit', nuits: 'nuits',
      duree_text: 'Le contrat est non renouvelable.',
      h_prix: 'V. Prix et modalités de paiement',
      loyer: 'Loyer', pour_total: 'pour la totalité du séjour',
      acompte_text: (p, m, d) => `Un acompte de ${p} % (${m}) sera versé au plus tard le ${d}.`,
      solde_text: (m, d) => `Le solde de ${m} sera versé au plus tard le ${d}, lors de l'entrée dans les lieux.`,
      taxe_sejour: 'Taxe de séjour', en_sus: 'en sus',
      h_caution: 'VI. Dépôt de garantie',
      caution_text: m => `Un dépôt de garantie d'un montant de ${m} sera remis au Bailleur à l'entrée dans les lieux. Il sera restitué dans un délai maximum d'un mois après le départ, déduction faite des éventuels dommages et dégradations constatés.`,
      h_edl: 'VII. État des lieux et inventaire',
      edl_text: v => `Un état des lieux et un inventaire du mobilier (valeur totale ${v}) sont remis au Preneur lors de son entrée dans le logement. Le Preneur dispose de 48 heures après son entrée pour contester ces documents. À défaut, ils seront réputés acceptés sans réserve.`,
      h_obligations: 'VIII. Obligations du preneur',
      obligations_text: p => `Le Preneur usera paisiblement du logement, du mobilier et des équipements. Il s'engage à respecter strictement le nombre maximum de ${p} occupants, à éviter toute nuisance sonore, et à restituer le logement en bon état de propreté.`,
      animaux_oui: 'Les animaux de compagnie sont acceptés sous réserve d\'une bonne tenue.',
      animaux_non: 'Les animaux de compagnie ne sont pas acceptés dans ce logement.',
      animaux_demande: 'La présence d\'animaux de compagnie est soumise à l\'accord préalable du Bailleur.',
      fumeurs_non: 'Il est strictement interdit de fumer à l\'intérieur du logement.',
      fetes_non: 'Les fêtes, soirées et rassemblements sont interdits dans le logement.',
      h_annulation: 'IX. Conditions d\'annulation',
      annulation_text: {
        souple: 'Remboursement intégral jusqu\'à 14 jours avant l\'arrivée. 50 % jusqu\'à 7 jours avant. Aucun remboursement ensuite.',
        standard: 'Remboursement intégral jusqu\'à 30 jours avant l\'arrivée. 50 % jusqu\'à 14 jours avant. Aucun remboursement ensuite.',
        stricte: 'Remboursement de 50 % jusqu\'à 30 jours avant l\'arrivée. Aucun remboursement ensuite.'
      },
      h_assurance: 'X. Assurances',
      assurance_text: {
        obligatoire: 'Le Preneur s\'engage à souscrire une assurance villégiature (responsabilité civile et multirisque temporaire) couvrant toute la durée du séjour, et à en fournir une attestation au Bailleur à la demande.',
        recommandee: 'Il est fortement recommandé au Preneur de souscrire une assurance villégiature couvrant sa responsabilité civile pendant la durée du séjour.',
        non_requise: 'Aucune assurance spécifique n\'est exigée par le Bailleur.'
      },
      h_clauses: 'XI. Clauses particulières',
      h_domicile: 'XII. Élection de domicile',
      domicile_text: 'Pour l\'exécution des présentes, les parties font élection de domicile à leurs adresses respectives. En cas de litige, le tribunal du lieu de situation du logement sera seul compétent. Le présent contrat est soumis à la loi française.',
      lu_approuve: 'Signature précédée de la mention « Lu et approuvé ».',
      date_lieu: 'Date et lieu :',
      h_annexe_inventaire: 'Annexe 1 — Inventaire du mobilier',
      objet: 'Objet', qte: 'Qté', etat: 'État', valeur: 'Valeur',
      inventaire_total: 'Valeur totale de l\'inventaire',
      h_annexe_reglement: 'Annexe 2 — Règlement intérieur',
      // PDF-specific labels
      branding: 'Contrat réalisé sur Eunomia',
      branding_footer: 'Document généré par Eunomia',
      arrivee_label: 'ARRIVÉE',
      depart_label: 'DÉPART',
      loyer_label: 'LOYER TOTAL',
      personne: 'personne',
      personnes: 'personnes',
      bailleur_label: 'BAILLEUR',
      preneur_label: 'LOCATAIRE',
      taxe_plus: '+ Taxe de séjour :',
      m2: 'm²'
    },
    en: {
      title: 'SEASONAL RENTAL AGREEMENT',
      h_parties: 'I. Identification of the parties',
      bailleur: 'The Landlord',
      preneur: 'The Tenant',
      h_objet: 'II. Purpose of the agreement',
      objet_text: 'The parties acknowledge that this rental does not concern premises used as the tenant\'s main residence. The premises are leased furnished on a seasonal basis, governed by the French decree of 28 December 1976 and, failing that, by the provisions of the French Civil Code (art. 1713 et seq.) and the French Tourism Code (art. L324-1-1 and L324-2).',
      h_logement: 'III. Description of the property',
      surface: 'Living area', pieces: 'Number of main rooms', classement: 'Rating', capacite: 'Maximum number of occupants', pers: 'persons', num_mairie: 'Municipal registration number',
      equipements: 'Included equipment and services',
      h_duree: 'IV. Duration of the rental',
      du: 'From', a: 'at', au: 'to', soit: 'i.e.', nuit: 'night', nuits: 'nights',
      duree_text: 'This agreement is non-renewable.',
      h_prix: 'V. Price and payment terms',
      loyer: 'Rent', pour_total: 'for the entire stay',
      acompte_text: (p, m, d) => `A deposit of ${p}% (${m}) shall be paid no later than ${d}.`,
      solde_text: (m, d) => `The balance of ${m} shall be paid no later than ${d}, upon entry into the premises.`,
      taxe_sejour: 'Tourist tax', en_sus: 'in addition',
      h_caution: 'VI. Security deposit',
      caution_text: m => `A security deposit of ${m} will be given to the Landlord upon entry into the premises. It will be returned within one month after departure, minus any damage.`,
      h_edl: 'VII. Inventory of fixtures',
      edl_text: v => `An inventory of fixtures and furniture (total value ${v}) is provided to the Tenant upon entry. The Tenant has 48 hours to contest these documents; otherwise, they shall be deemed accepted without reservation.`,
      h_obligations: 'VIII. Tenant\'s obligations',
      obligations_text: p => `The Tenant shall use the premises, furniture and equipment peacefully. They agree to strictly respect the maximum number of ${p} occupants, to avoid noise pollution, and to return the premises in a clean condition.`,
      animaux_oui: 'Pets are accepted, provided they are well-behaved.',
      animaux_non: 'No pets are allowed on the premises.',
      animaux_demande: 'Pets are subject to the Landlord\'s prior approval.',
      fumeurs_non: 'Smoking inside the premises is strictly prohibited.',
      fetes_non: 'Parties and large gatherings are prohibited on the premises.',
      h_annulation: 'IX. Cancellation policy',
      annulation_text: {
        souple: 'Full refund up to 14 days before arrival. 50% up to 7 days before. No refund thereafter.',
        standard: 'Full refund up to 30 days before arrival. 50% up to 14 days before. No refund thereafter.',
        stricte: '50% refund up to 30 days before arrival. No refund thereafter.'
      },
      h_assurance: 'X. Insurance',
      assurance_text: {
        obligatoire: 'The Tenant agrees to take out travel insurance (civil liability and temporary multi-risk) covering the entire stay, and to provide a certificate to the Landlord upon request.',
        recommandee: 'The Tenant is strongly advised to take out travel insurance covering their civil liability during the stay.',
        non_requise: 'No specific insurance is required by the Landlord.'
      },
      h_clauses: 'XI. Special clauses',
      h_domicile: 'XII. Elected domicile',
      domicile_text: 'For the purposes of this agreement, the parties elect their respective addresses as their legal domicile. In the event of a dispute, the court of the place where the property is located shall have sole jurisdiction. This agreement is governed by French law.',
      lu_approuve: 'Signature preceded by the handwritten words "Read and approved".',
      date_lieu: 'Date and place:',
      h_annexe_inventaire: 'Appendix 1 — Furniture inventory',
      objet: 'Item', qte: 'Qty', etat: 'Condition', valeur: 'Value',
      inventaire_total: 'Total inventory value',
      h_annexe_reglement: 'Appendix 2 — House rules',
      // PDF-specific labels
      branding: 'Contract made on Eunomia',
      branding_footer: 'Document generated by Eunomia',
      arrivee_label: 'CHECK-IN',
      depart_label: 'CHECK-OUT',
      loyer_label: 'TOTAL RENT',
      personne: 'person',
      personnes: 'persons',
      bailleur_label: 'LANDLORD',
      preneur_label: 'TENANT',
      taxe_plus: '+ Tourist tax:',
      m2: 'sq m'
    }
  };

  // ─── Room name translations (FR → EN) ────────────────────────────
  window.CT_ROOM_NAMES = {
    'Salon': 'Living room', 'Séjour': 'Living room',
    'Chambre': 'Bedroom', 'Chambre 1': 'Bedroom 1', 'Chambre 2': 'Bedroom 2',
    'Chambre 3': 'Bedroom 3', 'Chambre 4': 'Bedroom 4',
    'Cuisine': 'Kitchen', 'Salle de bain': 'Bathroom',
    'Salle d\'eau': 'Shower room', 'Terrasse': 'Terrace',
    'Balcon': 'Balcony', 'Jardin': 'Garden', 'Piscine': 'Pool',
    'Garage': 'Garage', 'Entrée': 'Entrance', 'Couloir': 'Hallway',
    'Bureau': 'Office', 'Buanderie': 'Laundry room',
    'WC': 'WC', 'Toilettes': 'Toilet', 'Mezzanine': 'Mezzanine',
    'Grenier': 'Attic', 'Cave': 'Cellar', 'Extérieur': 'Outdoors'
  };

  // ─── Common inventory item translations (FR → EN) ────────────────
  window.CT_ITEM_NAMES = {
    'Canapé': 'Sofa', 'Table': 'Table', 'Chaise': 'Chair',
    'Lit': 'Bed', 'Lit double': 'Double bed', 'Lit simple': 'Single bed',
    'Lit superposé': 'Bunk bed', 'Lit bébé': 'Cot',
    'Armoire': 'Wardrobe', 'Commode': 'Dresser', 'Bureau': 'Desk',
    'TV': 'TV', 'Télévision': 'Television', 'Micro-ondes': 'Microwave',
    'Réfrigérateur': 'Fridge', 'Congélateur': 'Freezer',
    'Lave-linge': 'Washing machine', 'Sèche-linge': 'Dryer',
    'Lave-vaisselle': 'Dishwasher', 'Four': 'Oven',
    'Plaque de cuisson': 'Hob', 'Cafetière': 'Coffee maker',
    'Grille-pain': 'Toaster', 'Bouilloire': 'Kettle',
    'Aspirateur': 'Vacuum cleaner', 'Fer à repasser': 'Iron',
    'Sèche-cheveux': 'Hair dryer', 'Lampe': 'Lamp', 'Miroir': 'Mirror',
    'Rideau': 'Curtain', 'Tapis': 'Rug', 'Coussin': 'Cushion',
    'Couette': 'Duvet', 'Oreiller': 'Pillow', 'Drap': 'Sheet',
    'Serviette': 'Towel', 'Couverture': 'Blanket',
    'Table basse': 'Coffee table', 'Table de nuit': 'Nightstand',
    'Étagère': 'Shelf', 'Poubelle': 'Bin', 'Fauteuil': 'Armchair',
    'Tabouret': 'Stool', 'Barbecue': 'Barbecue', 'Transat': 'Sun lounger',
    'Parasol': 'Parasol', 'Ventilateur': 'Fan', 'Climatisation': 'Air conditioning'
  };

  // ─── Default house rules (English version) ───────────────────────
  window.CT_DEFAULT_REGLEMENT_EN = `1. Capacity: the maximum number of occupants is strictly limited to the number stated in the agreement.

2. Noise: quiet hours between 10 PM and 8 AM. Parties and gatherings are prohibited.

3. Smoking: smoking is not permitted indoors.

4. Pets: one pet allowed, subject to good behaviour.

5. Pool: use at the tenant's full responsibility. Children must be supervised at all times.

6. Housekeeping: please leave the property in the condition you found it.

7. Recycling: please follow the recycling system in place.`;

