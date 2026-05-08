"""Modules 7-14 + Annexes."""

from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph, Spacer, PageBreak, Table, TableStyle

from generate_methode97_pdf import (
    ModuleOpener, QuoteBox, StatCard, RuleBox, GreenRule,
    bullet, p, h3,
    C_DARK, C_GREEN, C_GREEN_XL, C_RED_L, C_WHITE, C_BORDER, C_CREAM2, C_TEXT,
    FONT_SANS, FONT_SANS_BOLD, FONT_SERIF, FONT_SERIF_BOLD,
    PW, CW
)


def build_modules_7_to_10(story, S):
    """Modules 7, 8, 9, 10."""

    # MODULE 7
    story.append(PageBreak())
    story.append(ModuleOpener("7", "Le positionnement 3 \u00e9toiles",
                              "Pourquoi viser le luxe est une erreur"))
    story.append(Spacer(1, 8*mm))

    p(story, S,
      "\u00ab\u00a0Faites du luxe, \u00e7a se loue mieux.\u00a0\u00bb C'est le conseil que tout le monde "
      "donne, avec des histoires incroyables o\u00f9 il faudrait apporter le petit-d\u00e9jeuner pour "
      "7\u20ac. C'est aussi le moyen le plus rapide de se compliquer la vie pour un retour inexistant.")
    p(story, S,
      "Les gens qui vous disent de faire du luxe n'ont probablement jamais s\u00e9journ\u00e9 dans un "
      "vrai h\u00f4tel de luxe. Ce que les clients cherchent dans un palace, c'est du service : "
      "restaurant gastronomique, sommelier, cocktail \u00e0 3h du matin livr\u00e9 dans votre chambre. "
      "Vous ne pouvez pas proposer \u00e7a -- et vous n'avez pas besoin de le faire.")

    h3(story, S, "Ce que veulent vraiment les clients 3 \u00e9toiles")
    p(story, S, "Propre. Confortable. Prix raisonnable. C'est tout. Vraiment.", style='body_b')
    p(story, S,
      "Un Ibis propose une chambre de 9 \u00e0 12\u00a0m\u00b2 pour 80 \u00e0 140\u20ac. Note : 7,2 sur "
      "Booking. Vous proposez un T2 avec cuisine, literie 5 \u00e9toiles, salle de bain impeccable. "
      "Au m\u00eame prix. Note : 9,5. Le choix est \u00e9vident. Chaque fois.")

    h3(story, S, "O\u00f9 investir -- et o\u00f9 ne surtout pas investir")

    inv_data = [
        [Paragraph("<b><font color='#ffffff'>INVESTIR sans h\u00e9siter</font></b>", S['body']),
         Paragraph("<b><font color='#ffffff'>NE PAS INVESTIR</font></b>", S['body'])],
        [Paragraph("Literie Hypnia, 1\u00a0000\u20ac minimum", S['body']),
         Paragraph("Bouteilles de vin \u00e0 10\u20ac", S['body'])],
        [Paragraph("Canap\u00e9-lit de qualit\u00e9 (2\u00a0500\u20ac)", S['body']),
         Paragraph("Gadgets inutiles", S['body'])],
        [Paragraph("Logement pour 4 personnes (100\u20ac \u2192 140\u20ac/nuit)", S['body']),
         Paragraph("Tout ce qui n\u00e9cessite de la maintenance quotidienne", S['body'])],
        [Paragraph("Lit 160 quand possible", S['body']), Paragraph("", S['body'])],
        [Paragraph("D\u00e9coration soign\u00e9e (meubles Bali, plantes)", S['body']), Paragraph("", S['body'])],
        [Paragraph("Cuisine \u00e9quip\u00e9e + Nespresso", S['body']), Paragraph("", S['body'])],
    ]
    t = Table(inv_data, colWidths=[CW/2, CW/2])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (0,0), C_GREEN),
        ('BACKGROUND', (1,0), (1,0), HexColor("#c0392b")),
        ('BACKGROUND', (0,1), (0,-1), C_GREEN_XL),
        ('BACKGROUND', (1,1), (1,-1), C_RED_L),
        ('BOX', (0,0), (-1,-1), 0.8, C_DARK),
        ('LINEBELOW', (0,0), (-1,-2), 0.3, C_BORDER),
        ('LINEBETWEEN', (0,0), (-1,-1), 0.3, C_BORDER),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t)
    story.append(Spacer(1, 4*mm))

    h3(story, S, "Le d\u00e9tail qui fait +30% de clics")
    p(story, S,
      "Une plante verte visible sur la photo principale d'une annonce = 30% de clics en plus. "
      "On a remplac\u00e9 nos vraies plantes (qui mouraient \u00e0 cause du turnover) par des plantes "
      "grasses qui ne meurent pas et deux fausses plantes bien choisies. Le r\u00e9sultat sur les "
      "photos est exactement le m\u00eame.")
    p(story, S,
      "<b>Les photos :</b> t\u00e9l\u00e9phone suffit. Attendez qu'il fasse beau. Cadrez proprement. "
      "Lumi\u00e8re naturelle. Pas de grand angle qui d\u00e9forme. Droit, net, propre. C'est tout "
      "ce qu'il faut.")

    # MODULE 8
    story.append(PageBreak())
    story.append(ModuleOpener("8", "L'am\u00e9nagement et les d\u00e9tails",
                              "Les petites choses qui font la diff\u00e9rence"))
    story.append(Spacer(1, 8*mm))

    h3(story, S, "La peinture -- l'erreur que Marc a faite")
    p(story, S,
      "Sur le premier bien, on n'avait pas d'argent. On n'a pas fait attention \u00e0 la peinture "
      "qu'on choisissait. Les artisans ont mis la moins ch\u00e8re. R\u00e9sultat : elle se marque "
      "facilement, elle n'est pas lavable, et au bout de quelques ann\u00e9es il faut repeindre.")
    p(story, S,
      "Sur les biens suivants, on a pris de la bonne peinture pro lavable. Au bout de 5 ans, "
      "un coup d'\u00e9ponge magique et les murs reviennent comme neufs. C'est un investissement "
      "de 30 \u00e0 50\u20ac de plus par pi\u00e8ce. \u00c7a \u00e9vite une semaine de travaux et "
      "des milliers d'euros de remise en \u00e9tat. Et des \u00e9valuations \u00e0 10/10 sur Booking.")

    h3(story, S, "Les \u00e9ponges magiques -- l'exemple qui illustre la philosophie")
    p(story, S,
      "Chez Leroy Merlin, deux \u00e9ponges magiques : 2\u20ac. Sur internet : 50 \u00e9ponges pour 4\u20ac.")
    p(story, S,
      "C'est un d\u00e9tail, mais c'est symptomatique de la bonne mani\u00e8re de g\u00e9rer. "
      "Achetez en gros, stockez intelligemment, optimisez chaque poste.")

    h3(story, S, "Le local de stockage -- les 2\u00a0m\u00b2 qui changent tout")
    p(story, S,
      "Il faut absolument pr\u00e9voir un espace de stockage dans vos biens : une armoire ou un "
      "placard de 2\u00a0m\u00b2 minimum.")
    p(story, S,
      "Dedans : les draps de rechange, les capsules de caf\u00e9, les torchons, les consommables "
      "(liquide vaisselle, huile, sucre, sel, poivre, papier toilette, \u00e9ponges magiques en gros).")
    p(story, S,
      "Ce que \u00e7a apporte : quand la femme de m\u00e9nage fait les courses hebdomadaires, elle "
      "range tout dans le stock. Quand il reste des provisions d'un s\u00e9jour \u00e0 l'autre, "
      "\u00e7a tourne tout seul. Et les voyageurs adorent trouver du caf\u00e9, de l'huile, du sel -- "
      "c'est un d\u00e9tail qui change la note.")

    h3(story, S, "Le gros m\u00e9nage de fond -- ce que je n'ai pas r\u00e9ussi \u00e0 d\u00e9l\u00e9guer")
    p(story, S,
      "Toutes les 6 \u00e0 12 mois, il faut faire un m\u00e9nage de fond vous-m\u00eame (ou avec votre "
      "conjoint). Marc l'a appris \u00e0 ses d\u00e9pens : quand il n'est pas all\u00e9 dans ses biens "
      "pendant presque un an, la note a baiss\u00e9. Poussi\u00e8re accumul\u00e9e, traces sur les "
      "murs que la femme de m\u00e9nage ne voyait plus.")
    p(story, S,
      "Deux heures \u00e0 deux personnes, et le bien est comme neuf. \u00c7a ne se d\u00e9l\u00e8gue "
      "pas -- parce que la femme de m\u00e9nage ne le fera pas aussi bien, m\u00eame si vous la "
      "payez (j'ai d\u00e9j\u00e0 essay\u00e9).")

    h3(story, S, "La division -- pourquoi vos biens doivent \u00eatre proches")
    p(story, S,
      "Mes biens sont group\u00e9s : deux maisons divis\u00e9es en deux, et deux appartements "
      "divis\u00e9s en deux. Deux groupes \u00e0 deux minutes l'un de l'autre. La femme de m\u00e9nage "
      "peut faire les quatre en une matin\u00e9e sans perdre 10-40 minutes de trajet entre chaque.")
    p(story, S,
      "Ce que \u00e7a change pour elle : un contrat de 1\u00a0000 \u00e0 1\u00a0200\u20ac de m\u00e9nage "
      "par mois (environ 80 heures sur quatre biens), sans d\u00e9placement inutile. C'est attractif. "
      "Elle reste. Elle s'investit.")
    p(story, S,
      "Si vos biens sont dispers\u00e9s sur 30-40 minutes l'un de l'autre, la femme de m\u00e9nage "
      "va augmenter ses tarifs ou arr\u00eater. Elle perd du temps entre les biens. C'est "
      "structurellement p\u00e9nalisant.")

    story.append(StatCard([
        ("Dur\u00e9e d'un m\u00e9nage", "30-45 minutes"),
        ("Dur\u00e9e moyenne de s\u00e9jour", "1,8 nuit"),
        ("Contrat femme de m\u00e9nage", "1\u00a0000-1\u00a0200\u20ac/mois (~80h, 4 biens)"),
    ]))

    # MODULE 9
    story.append(PageBreak())
    story.append(ModuleOpener("9", "La femme de m\u00e9nage",
                              "Le seul recrutement qui compte vraiment"))
    story.append(Spacer(1, 8*mm))

    p(story, S, "Tout repose sur elle. Vraiment.", style='body_b')

    h3(story, S, "Pourquoi c'est si critique")
    p(story, S,
      "Les conciergeries ont parfois 40 femmes de m\u00e9nage. Quand l'une se plante, votre note tombe "
      "de 4,92 \u00e0 4,6. L'algorithme p\u00e9nalise. Vous perdez en visibilit\u00e9 et en "
      "r\u00e9servations. Avec une seule femme de m\u00e9nage que vous avez form\u00e9e, que vous "
      "payez bien, qui conna\u00eet chaque recoin de vos biens -- \u00e7a n'arrive pas.")

    story.append(RuleBox("Le crit\u00e8re num\u00e9ro un",
        "<b>La fiabilit\u00e9.</b> Pas les comp\u00e9tences techniques -- le m\u00e9nage \u00e7a s'apprend. "
        "Elle doit \u00eatre l\u00e0 quand pr\u00e9vu, sans exception."))
    story.append(Spacer(1, 4*mm))

    h3(story, S, "La blanchisserie externe")
    p(story, S,
      "Ne faites pas laver le linge par la femme de m\u00e9nage. Le linge doit s\u00e9cher, \u00e7a "
      "prend du temps, elle doit revenir -- c'est p\u00e9nible. Toutes les femmes de m\u00e9nage qui "
      "g\u00e8rent le linge elles-m\u00eames finissent par arr\u00eater ou demander beaucoup plus cher.")
    p(story, S,
      "La blanchisserie externe (Elise dans le cas de Marc), c'est une logistique propre et "
      "pr\u00e9visible. Le fait d'avoir des draps et serviettes repass\u00e9s change la donne sur "
      "la qualit\u00e9 per\u00e7ue du s\u00e9jour.")

    story.append(StatCard([
        ("Set complet blanchisserie", "12,50\u20ac"),
        ("Contenu", "2 taies, 2 rectangles, tapis douche, 4 serviettes, housse, drap"),
        ("Suppl\u00e9ment canap\u00e9-lit", "+2,50\u20ac"),
    ], title="Blanchisserie -- Elise"))

    # MODULE 10
    story.append(PageBreak())
    story.append(ModuleOpener("10", "La gestion au quotidien",
                              "5-6 heures par mois pour 9 biens"))
    story.append(Spacer(1, 8*mm))

    h3(story, S, "Ce que \u00e7a ne demande pas")
    p(story, S,
      "Quand je pars trois semaines en vacances, la question de la gestion ne me traverse pas l'esprit. "
      "Le syst\u00e8me tourne. Les messages partent automatiquement. La femme de m\u00e9nage fait son "
      "travail en regardant le planning. Personne ne m'appelle, ou tr\u00e8s rarement. Marc s'en "
      "occupe tellement plus que \u00e7a arrive qu'il loupe des appels \u00e0 23h ou minuit... car "
      "je dors et \u00e7a change rien. Souvent, les gens relisent juste les instructions et finalement "
      "se d\u00e9brouillent.")

    h3(story, S, "La r\u00e9alit\u00e9 du mois 1")
    p(story, S,
      "La premi\u00e8re semaine, vous ne pouvez pas tout pr\u00e9voir. Il va y avoir des questions "
      "auxquelles vous n'avez pas encore de r\u00e9ponse automatique. Des petits probl\u00e8mes auxquels "
      "vous devez r\u00e9agir. C'est normal. C'est pour \u00e7a que le premier mois, il faut pouvoir "
      "\u00eatre r\u00e9actif.")
    p(story, S,
      "Si vous \u00eates salari\u00e9 \u00e0 temps plein et votre conjoint(e) aussi, c'est faisable -- "
      "mais ce premier mois demande de la disponibilit\u00e9. Pas des heures par jour, mais de la "
      "r\u00e9activit\u00e9 sur le t\u00e9l\u00e9phone. Si vous avez deux ou trois jours de "
      "t\u00e9l\u00e9travail par semaine ou que vous \u00eates ind\u00e9pendant, c'est \u00e9videmment "
      "plus simple.")

    h3(story, S, "La semaine type de Marc avec 9 biens")
    p(story, S,
      "5 \u00e0 6 heures par mois, essentiellement pour les \u00e9changes avec la femme de m\u00e9nage, "
      "les rares impr\u00e9vus et quelques rares appels des clients. Pas d'\u00e9changes avec les "
      "voyageurs -- tout est automatis\u00e9. Justement, je veux r\u00e9duire ces 5h \u00e0 0 en "
      "cr\u00e9ant mon propre logiciel de gestion locative, tout en augmentant le cash flow avec "
      "la r\u00e9servation en directe.")

    h3(story, S, "Le profil des voyageurs -- pourquoi Marc n'a presque jamais de probl\u00e8me")
    p(story, S,
      "Mes biens ne sont pas accessibles en transports en commun. Ce sont uniquement des gens qui "
      "viennent en voiture. En pratique : pas de f\u00eates, pas de probl\u00e8me, pas de d\u00e9gradations.")
    p(story, S,
      "Au d\u00e9but, quand j'\u00e9tais \u00e0 50-60\u20ac la nuit, il y avait parfois des s\u00e9jours "
      "un peu plus sales. Depuis qu'on a mont\u00e9 les prix, plus aucun probl\u00e8me. Sur 5\u00a0000 "
      "visiteurs en 6 ans (environ 180 personnes par appartement par an), j'ai eu un seul vrai incident.")

    h3(story, S, "L'incident -- parce qu'il faut en parler honn\u00eatement")
    p(story, S,
      "Un s\u00e9jour sur Booking. Des voyageurs ont arrach\u00e9 la colonne de douche. L'appartement "
      "s'est retrouv\u00e9 inond\u00e9 avec 30 centim\u00e8tres d'eau. Indisponible pendant cinq mois "
      "le temps que \u00e7a s\u00e8che. D\u00e9g\u00e2ts : 12\u00a0000\u20ac de travaux.")
    p(story, S,
      "<b>R\u00e9sultat final :</b> l'assurance (Pacifica du Cr\u00e9dit Agricole) a tout pay\u00e9. "
      "Les travaux. Et la perte d'exploitation -- c'est-\u00e0-dire les revenus qu'on aurait faits "
      "pendant ces cinq mois. \u00c0 2\u00a0500-2\u00a0600\u20ac bruts par mois, avec z\u00e9ro frais "
      "de m\u00e9nage, \u00e9lectricit\u00e9 ou blanchisserie pendant cette p\u00e9riode, on a "
      "finalement gagn\u00e9 de l'argent sur cet incident. Un peu stressant la premi\u00e8re fois "
      "que \u00e7a arrive, mais c'est bien pour \u00e7a que les assurances existent.")

    p(story, S,
      "<b>Ce qu'il faut retenir sur l'assurance :</b> il existe des assurances sp\u00e9cifiques LCD "
      "\u00e0 200\u20ac par an qui couvrent tous les d\u00e9g\u00e2ts. Marc ne les avait pas "
      "renouvel\u00e9es. Son assurance habitation classique (Pacifica) a quand m\u00eame tout couvert. "
      "Moral : souscrivez une assurance LCD sp\u00e9cifique. 200\u20ac par an pour dormir tranquille.")

    p(story, S,
      "<b>Les risques sont bien inf\u00e9rieurs \u00e0 ce que vous lisez en ligne :</b> quand il se "
      "passe quelque chose sur 1 des 1,3 million d'annonces Airbnb, tout le monde en parle. En "
      "r\u00e9alit\u00e9, la tr\u00e8s grande majorit\u00e9 des s\u00e9jours se passent parfaitement, "
      "sinon Airbnb avec leur assurance aurait d\u00e9j\u00e0 fait faillite ou ne serait pas "
      "valoris\u00e9 \u00e0 83 milliards. Si vous \u00eates hors des centres de grandes villes avec "
      "une client\u00e8le professionnelle, le risque est quasi nul. Sur 7\u00a0000 visiteurs en 6 ans : "
      "un seul incident.")

    story.append(StatCard([
        ("Visiteurs en 6 ans", "~7\u00a0000 (180/appart/an)"),
        ("Incidents graves", "1 seul (d\u00e9g\u00e2t des eaux)"),
        ("Indisponibilit\u00e9", "5 mois"),
        ("Co\u00fbt travaux", "12\u00a0000\u20ac (couvert)"),
        ("Perte d'exploitation", "couverte"),
        ("Assurance LCD sp\u00e9cifique", "200\u20ac/an"),
    ], title="Donn\u00e9es de risque"))


def build_modules_11_to_14(story, S):
    """Modules 11, 12, 13, 14 + 4 ops."""

    # MODULE 11
    story.append(PageBreak())
    story.append(ModuleOpener("11", "Les travaux",
                              "De z\u00e9ro \u00e0 expert en 3 devis"))
    story.append(Spacer(1, 8*mm))

    p(story, S,
      "En 2019, Marc a fait disjoncter le r\u00e9seau \u00e9lectrique de sa rue en voulant changer "
      "une ampoule. Aujourd'hui, il sait estimer un chantier en 10 minutes.")

    h3(story, S, "La m\u00e9thode des 3 artisans")
    p(story, S,
      "Pour chaque corps de m\u00e9tier (\u00e9lectricit\u00e9, plomberie, ma\u00e7onnerie), appelez "
      "trois artisans diff\u00e9rents. Pas pour avoir le moins cher -- pour apprendre.")
    bullet(story, S, "<b>Artisan 1 :</b> vous apprenez le vocabulaire. Vous \u00e9coutez, vous notez.")
    bullet(story, S, "<b>Artisan 2 :</b> vous confirmez les termes. Vous commencez \u00e0 poser des questions intelligentes.")
    bullet(story, S, "<b>Artisan 3 :</b> vous pouvez comparer les devis et n\u00e9gocier. Vous savez ce qui prend du temps, ce qui est simple, ce qui est surestim\u00e9.")

    h3(story, S, "Faire soi-m\u00eame vs d\u00e9l\u00e9guer -- le vrai calcul")
    p(story, S,
      "Mon bien \u00e0 30\u00a0000\u20ac de travaux faits en partie moi-m\u00eame : un an et demi de "
      "chantier. Le m\u00eame d\u00e9l\u00e9gu\u00e9 \u00e0 60\u00a0000\u20ac : trois \u00e0 quatre mois.")
    p(story, S,
      "J'ai cru \u00e9conomiser 30\u00a0000\u20ac. En r\u00e9alit\u00e9, j'ai perdu 18 mois de loyers -- "
      "soit bien plus que ce que j'avais \u00e9conomis\u00e9.")
    p(story, S,
      "Si vous pouvez d\u00e9l\u00e9guer, d\u00e9l\u00e9guez. Vous r\u00e9cup\u00e9rerez vos loyers "
      "beaucoup plus vite et vous r\u00e9cup\u00e9rerez votre vie aussi. Ce que j'ai gagn\u00e9 en "
      "faisant moi-m\u00eame, c'est la connaissance : je sais maintenant estimer un chantier, parler "
      "aux artisans, rep\u00e9rer les devis gonfl\u00e9s. Je n'avais pas le choix pour ma part car "
      "600\u20ac de cr\u00e9dit... on ne pouvait pas emprunter plus.")

    story.append(RuleBox("La r\u00e8gle",
        "Si vous pouvez d\u00e9l\u00e9guer, d\u00e9l\u00e9guez. Vous r\u00e9cup\u00e9rerez vos loyers "
        "beaucoup plus vite et vous r\u00e9cup\u00e9rerez votre vie aussi."))

    # MODULE 12
    story.append(PageBreak())
    story.append(ModuleOpener("12", "Le financement en 2024",
                              "Ce qui a chang\u00e9 -- et comment s'adapter"))
    story.append(Spacer(1, 8*mm))

    p(story, S,
      "Le financement \u00e0 110% sans apport que Marc a eu en 2019 n'existe plus. Voici ce qui a chang\u00e9.")

    h3(story, S, "Pourquoi le march\u00e9 immobilier s'est compliqu\u00e9")
    p(story, S,
      "De 2016 \u00e0 2022, les banques fin\u00e7aient n'importe quel CDI, sans apport ou avec tr\u00e8s "
      "peu, \u00e0 des taux historiquement bas. Tout le monde pouvait acheter. Le march\u00e9 a "
      "explos\u00e9. Marc en a profit\u00e9 -- il a financ\u00e9 \u00e0 110%, apport z\u00e9ro.")
    p(story, S,
      "Aujourd'hui, les banques demandent 10 \u00e0 20% d'apport selon votre profil. \u00c7a veut dire "
      "qu'il faut mettre 20\u00a0000, 30\u00a0000, 50\u00a0000\u20ac sur la table avant d'acheter. "
      "Beaucoup de gens ne peuvent pas -- et c'est pour \u00e7a que les prix ont baiss\u00e9 dans "
      "beaucoup de zones. Ce ne sont m\u00eame pas les taux, c'est l'accessibilit\u00e9 au pr\u00eat "
      "difficile qui fait qu'il y a beaucoup moins d'acheteurs et donc des prix qui diminuent.")

    h3(story, S, "Pourquoi c'est quand m\u00eame beaucoup mieux que tout le reste")
    p(story, S,
      "Avec des rendements LCD de 15%, vous mettez 30\u00a0000\u20ac d'apport sur un projet \u00e0 "
      "300\u00a0000\u20ac. Vous gagnez 45\u00a0000\u20ac net par an. Votre apport est rembours\u00e9 "
      "en 8 \u00e0 12 mois. Ensuite, c'est uniquement du b\u00e9n\u00e9fice.")
    p(story, S,
      "Comparez \u00e7a \u00e0 un rendement locatif classique de 3% : il vous faut 30\u00a0000\u20ac "
      "pour gagner 9\u00a0000\u20ac par an pour le m\u00eame investissement. La LCD avec cette "
      "m\u00e9thode, c'est 15 fois plus rentable. L'effet de levier immobilier, quand il est "
      "coupl\u00e9 \u00e0 un bon rendement, reste imbattable face au trading ou autre placement.")

    story.append(QuoteBox(
        "La LCD avec cette m\u00e9thode, c'est 15 fois plus rentable que la location longue dur\u00e9e classique. "
        "L'effet de levier immobilier, coupl\u00e9 \u00e0 un bon rendement, reste imbattable."
    ))
    story.append(Spacer(1, 4*mm))

    h3(story, S, "Le timing actuel")
    p(story, S,
      "Les prix ont baiss\u00e9 dans beaucoup de march\u00e9s parce qu'il y a moins d'acheteurs. "
      "Pour vous, c'est une opportunit\u00e9 : vous achetez moins cher. Et quand les conditions de "
      "financement vont se d\u00e9tendre -- et elles se d\u00e9tendront -- vous serez d\u00e9j\u00e0 "
      "positionn\u00e9. Vous renegocierez votre pr\u00eat. \u00c7a vaut le coup quand les taux ont "
      "diminu\u00e9 de 1%.")
    p(story, S,
      "J'ai un bon courtier l\u00e0-dessus. J'ai renegoci\u00e9 avec ce courtier toutes mes assurances "
      "de pr\u00eats. Sur un pr\u00eat \u00e0 2\u00a0400\u20ac, j'ai gagn\u00e9 200\u20ac par mois en "
      "changeant d'assurance. Sur un pr\u00eat \u00e0 1\u00a0650\u20ac, j'ai gagn\u00e9 150\u20ac "
      "par mois. J'ai plus qu'une mensualit\u00e9 de 1\u00a0500\u20ac.")

    # MODULE 13
    story.append(PageBreak())
    story.append(ModuleOpener("13", "Trouver le bon bien",
                              "La m\u00e9thode pour identifier une opportunit\u00e9 en 30 minutes"))
    story.append(Spacer(1, 8*mm))

    p(story, S,
      "On en parle en dernier -- et c'est voulu. Comprendre pourquoi \u00e7a marche avant de chercher "
      "quoi chercher, c'est ce qui fait la diff\u00e9rence.")

    h3(story, S, "Les trois crit\u00e8res non-n\u00e9gociables")

    crit_data = [
        [Paragraph("<b><font color='#ffffff'>Crit\u00e8re</font></b>", S['body']),
         Paragraph("<b><font color='#ffffff'>R\u00e8gle</font></b>", S['body'])],
        [Paragraph("<font color='#3fbd71'><b>1. Des h\u00f4tels autour</b></font>", S['body']),
         Paragraph("Google Maps \u2192 \u00ab\u00a0h\u00f4tel\u00a0\u00bb. Moins de 30 chambres en 2-5\u00a0km = passez votre chemin. 100+ chambres = demande prouv\u00e9e.", S['body'])],
        [Paragraph("<font color='#3fbd71'><b>2. Entr\u00e9e autonome possible</b></font>", S['body']),
         Paragraph("Vigik = \u00e9liminatoire. Copro simple = parfait. Maison individuelle ou petite copro sans syndic lourd = id\u00e9al.", S['body'])],
        [Paragraph("<font color='#3fbd71'><b>3. Possibilit\u00e9 de diviser</b></font>", S['body']),
         Paragraph("Maison de 90\u00a0m\u00b2 \u2192 deux T2. C'est ce qui fait passer de 8% \u00e0 16% de rendement.", S['body'])],
    ]
    t = Table(crit_data, colWidths=[42*mm, CW - 42*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_DARK),
        ('BACKGROUND', (0,1), (-1,-1), C_WHITE),
        ('BOX', (0,0), (-1,-1), 0.8, C_DARK),
        ('LINEBELOW', (0,0), (-1,-2), 0.3, C_BORDER),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t)
    story.append(Spacer(1, 4*mm))

    h3(story, S, "Pr\u00e8s de chez vous -- pas \u00e0 3 heures de route")
    p(story, S,
      "Achetez pr\u00e8s de chez vous. Pas parce que vous devrez y aller souvent -- vous n'irez "
      "presque jamais. Mais parce que trouver une femme de m\u00e9nage de confiance est beaucoup plus "
      "simple quand vous connaissez le territoire. Et parce que le premier mois, avoir la "
      "possibilit\u00e9 d'intervenir rapidement si besoin, c'est tranquillisant.")
    p(story, S,
      "Il y a des h\u00f4tels partout en France. Vous n'avez pas \u00e0 aller chercher loin ce qui "
      "est probablement sous votre nez.")

    h3(story, S, "La strat\u00e9gie de division -- diviser pour multiplier")
    p(story, S,
      "<b>Pourquoi les grandes surfaces sont votre meilleur ami :</b> au-dessus de 90\u00a0m\u00b2, "
      "le prix au m\u00b2 s'effondre. Une maison de 200\u00a0m\u00b2 se vend beaucoup moins cher au "
      "m\u00b2 qu'un studio de 25\u00a0m\u00b2. Vous achetez grand (donc bon march\u00e9 au m\u00b2). "
      "Vous divisez (donc vous cr\u00e9ez de la valeur). Et quand vous vendez, vous vendez des "
      "petites surfaces qui valent cher au m\u00b2. Plus-value dans les deux sens.")

    story.append(StatCard([
        ("Achat + notaire", "104\u00a0000\u20ac + 7\u00a0000\u20ac = 111\u00a0000\u20ac"),
        ("Travaux", "30\u00a0000\u20ac (soi-m\u00eame) / 60\u00a0000\u20ac d\u00e9l\u00e9gu\u00e9"),
        ("Surface", "64\u00a0m\u00b2 \u2192 2 T2"),
        ("Financement 2019", "110%, apport z\u00e9ro, 1%, 20 ans"),
        ("Cr\u00e9dit mensuel", "610\u20ac"),
        ("CA brut mensuel", "5\u00a0000-6\u00a0000\u20ac"),
        ("Cash flow net", "2\u00a0400\u20ac/mois"),
        ("\u00c9quivalent longue dur\u00e9e", "600-800\u20ac/mois"),
        ("Rendement", "20%+"),
    ], title="L'op\u00e9ration phare de Marc"))

    story.append(Spacer(1, 4*mm))
    h3(story, S, "La premi\u00e8re op\u00e9ration de Marc -- celle que tout le monde peut faire")
    p(story, S,
      "Maison plan Favier ann\u00e9es 60. 90\u00a0m\u00b2 habitable + 90\u00a0m\u00b2 de garage/d\u00e9pendance "
      "am\u00e9nageable. Cr\u00e9dit de la maison : 1\u00a0650\u20ac/mois. Cash flow de la d\u00e9pendance "
      "LCD : 1\u00a0800\u20ac/mois net en plus. \u00c0 29 ans : plus de loyer \u00e0 payer + cash flow positif.")

    story.append(QuoteBox("Je peux vous dire que \u00e7a change la vie drastiquement."))
    story.append(Spacer(1, 4*mm))

    h3(story, S, "La r\u00e8gle des 3 plans -- ne jamais acheter sans les avoir tous en t\u00eate")
    bullet(story, S, "<b>Plan A :</b> LCD optimis\u00e9e (votre objectif)")
    bullet(story, S, "<b>Plan B :</b> longue dur\u00e9e si jamais la LCD devient impossible")
    bullet(story, S, "<b>Plan C :</b> revente avec plus-value")
    p(story, S,
      "Si les trois plans fonctionnent, vous achetez. Si un seul \u00e9choue, vous cherchez encore. "
      "= 0 risque.", style='body_b')

    h3(story, S, "La revente d'un projet LCD")
    p(story, S,
      "Un bien \u00e0 15-20% de rendement net se vend comme un fonds de commerce. Des investisseurs "
      "paient premium pour \u00e7a. La valeur peut prendre +30% par rapport au prix du march\u00e9 classique.")

    # MODULE 14
    story.append(PageBreak())
    story.append(ModuleOpener("14", "Le scale",
                              "De 1 bien \u00e0 9 biens -- votre seule limite, c'est votre ambition"))
    story.append(Spacer(1, 8*mm))

    p(story, S, "Une fois que la machine tourne, votre seule limite c'est votre ambition.", style='body_b')

    h3(story, S, "La boucle vertueuse")
    p(story, S,
      "Le premier bien rapporte 2\u00a0400\u20ac net par mois. Vous mettez 2\u00a0400\u20ac de c\u00f4t\u00e9 "
      "chaque mois. En 3 ans avec un diff\u00e9r\u00e9 de capital (vous ne remboursez que les "
      "int\u00e9r\u00eats), vous avez 50\u00a0000 \u00e0 60\u00a0000\u20ac de cash. Avec \u00e7a, vous "
      "financez le deuxi\u00e8me. Votre cash flow double. Vous recommencez.")
    p(story, S,
      "Et les banques, qui vous regardaient avec m\u00e9fiance au premier bien, commencent \u00e0 vous "
      "ouvrir des portes. Quand vous avez trois ans de bilans, c'est tapis rouge.")

    story.append(QuoteBox(
        "Quand vous avez les bilans, il n'y a plus de limite. Votre limite, c'est votre ambition."
    ))
    story.append(Spacer(1, 4*mm))

    h3(story, S, "L'exemple couple SMIC -- le plus parlant")
    p(story, S,
      "Deux salaires de 1\u00a0400\u20ac = 2\u00a0800\u20ac par mois. Capacit\u00e9 d'emprunt : "
      "600\u20ac/mois. Premier bien. Cash flow net : 2\u00a0400\u20ac par mois. En une op\u00e9ration, "
      "leurs revenus ont presque doubl\u00e9. Sans changer de travail. Sans prendre de risque "
      "d\u00e9mesur\u00e9.")

    story.append(QuoteBox("Je peux vous dire que \u00e7a change la vie drastiquement."))
    story.append(Spacer(1, 4*mm))

    h3(story, S, "O\u00f9 Marc en est aujourd'hui")
    p(story, S,
      "9 biens. En train d'en racheter d'autres. Il voit des opportunit\u00e9s partout. Sa seule "
      "contrainte, c'est la bande passante pour monter les dossiers et g\u00e9rer les travaux. "
      "D'un point de vue opportunit\u00e9s, il y en a tellement -- des maisons \u00e0 diviser en deux, "
      "en trois, en quatre, \u00e0 c\u00f4t\u00e9 des h\u00f4tels, pr\u00e8s de chez vous.")
