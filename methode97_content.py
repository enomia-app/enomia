"""Content builder split into pieces — preserves all storytelling from source."""

from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.platypus import Paragraph, Spacer, PageBreak, Table, TableStyle, NextPageTemplate

from generate_methode97_pdf import (
    ModuleOpener, QuoteBox, StatCard, RuleBox, GreenRule, CoverPage,
    bullet, p, h3, make_styles,
    C_DARK, C_GREEN, C_GREEN_XL, C_RED_L, C_WHITE, C_BORDER, C_CREAM2, C_TEXT, C_TEXT2,
    FONT_SANS, FONT_SANS_BOLD, FONT_SERIF, FONT_SERIF_BOLD, FONT_SERIF_ITALIC,
    PW, PH, ML, MR, CW
)


def build_intro_pages(story, S):
    """Cover + TOC + Intro module."""

    # COVER
    story.append(CoverPage())
    story.append(NextPageTemplate('toc'))
    story.append(PageBreak())

    # TOC
    story.append(Paragraph("Sommaire", S['toc_h']))
    modules_toc = [
        ("Intro", "Avant de commencer"),
        ("01", "L'insight fondateur"),
        ("02", "La M\u00e9thode 97%"),
        ("03", "L'entr\u00e9e autonome"),
        ("04", "Hacker les algorithmes"),
        ("05", "Z\u00e9ro conciergerie"),
        ("06", "La fiscalit\u00e9 LMNP"),
        ("07", "Le positionnement 3 \u00e9toiles"),
        ("08", "L'am\u00e9nagement et les d\u00e9tails"),
        ("09", "La femme de m\u00e9nage"),
        ("10", "La gestion au quotidien"),
        ("11", "Les travaux"),
        ("12", "Le financement en 2024"),
        ("13", "Trouver le bon bien"),
        ("14", "Le scale"),
        ("", "Les 4 op\u00e9rations de Marc"),
        ("", "Donn\u00e9es chiffr\u00e9es de r\u00e9f\u00e9rence"),
        ("", "Id\u00e9es re\u00e7ues que Marc d\u00e9monte"),
    ]
    for num, title in modules_toc:
        row = [[
            Paragraph(f"<font color='#3fbd71'><b>{num}</b></font>" if num else "", S['toc_line']),
            Paragraph(title, S['toc_line']),
        ]]
        t = Table(row, colWidths=[14*mm, CW - 14*mm - 28*mm])
        t.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 2),
            ('TOPPADDING', (0,0), (-1,-1), 2),
            ('LINEBELOW', (0,0), (-1,-1), 0.3, C_BORDER),
        ]))
        story.append(t)
    story.append(NextPageTemplate('content'))
    story.append(PageBreak())

    # INTRODUCTION
    story.append(ModuleOpener(None, "Avant de commencer", "Pourquoi cette m\u00e9thode existe"))
    story.append(Spacer(1, 8*mm))

    h3(story, S, "Je n'\u00e9tais pas diff\u00e9rent de vous")
    p(story, S,
      "En 2019, j'\u00e9tais salari\u00e9 \u00e0 temps plein, avec des enfants en bas \u00e2ge, "
      "sans fortune particuli\u00e8re et sans exp\u00e9rience dans l'immobilier. "
      "Exactement comme la plupart des gens qui me lisent aujourd'hui.")
    p(story, S,
      "Aujourd'hui, ces 9 biens tournent quand je suis en r\u00e9union, quand je suis en vacances. "
      "Et voil\u00e0 ce que \u00e7a veut dire concr\u00e8tement : quand je pars trois semaines, "
      "la question de la gestion de mes appartements ne me traverse m\u00eame pas l'esprit. "
      "Pas une seule fois. Pas parce que je l'ai confi\u00e9e \u00e0 une conciergerie -- "
      "mais parce que le syst\u00e8me est int\u00e9gralement automatis\u00e9, sans interm\u00e9diaire.")

    h3(story, S, "Trois choses que vous n'avez probablement jamais entendues")
    story.append(RuleBox("R\u00e9v\u00e9lation 1",
        "<b>Airbnb n'a pas \u00e9t\u00e9 cr\u00e9\u00e9 pour les touristes.</b> "
        "La quasi-totalit\u00e9 des propri\u00e9taires LCD se trompent de cible depuis le d\u00e9part -- "
        "et \u00e7a leur co\u00fbte des milliers d'euros par an sans qu'ils le r\u00e9alisent."))
    story.append(Spacer(1, 3*mm))
    story.append(RuleBox("R\u00e9v\u00e9lation 2",
        "<b>Les conciergeries ne prennent pas 20% de votre chiffre d'affaires.</b> "
        "Elles prennent 80% de votre cash flow net. La diff\u00e9rence est \u00e9norme. "
        "Le calcul exact est dans ce document."))
    story.append(Spacer(1, 3*mm))
    story.append(RuleBox("R\u00e9v\u00e9lation 3",
        "<b>La ville o\u00f9 vous habitez n'a quasiment aucune importance.</b> "
        "Ce qui compte, c'est ce qu'il y a autour. S'il y a des h\u00f4tels dans votre ville, "
        "la m\u00e9thode fonctionne. Et \u00e7a, vous pouvez le v\u00e9rifier en 30 minutes sur Google Maps."))

    story.append(Spacer(1, 4*mm))
    h3(story, S, "Pourquoi c'est maintenant qu'il faut se positionner")
    p(story, S,
      "Je suis convaincu que la location courte dur\u00e9e va se professionnaliser. "
      "Pas dispara\u00eetre -- se professionnaliser. Les contraintes r\u00e9glementaires "
      "(inscription en mairie, DPE, compensation) vont \u00e9liminer les propri\u00e9taires "
      "qui font \u00e7a \u00e0 moiti\u00e9, sans m\u00e9thode, sans optimisation. "
      "Et \u00e7a va cr\u00e9er de la place pour ceux qui le font bien.")
    p(story, S,
      "Le DPE ? Ce n'est pas un sujet si vous achetez bien. Personne ne loue un appartement "
      "class\u00e9 G -- parce que personne ne veut payer 500\u20ac de facture d'\u00e9lectricit\u00e9 "
      "par mois. Vous r\u00e9novez, vous am\u00e9liorez le DPE en m\u00eame temps que vous faites "
      "les travaux. C'est align\u00e9, pas oppos\u00e9.")
    p(story, S,
      "Des amis \u00e0 moi encha\u00eenent les op\u00e9rations en plein c\u0153ur de Paris et de Lyon -- "
      "en passant par des locaux commerciaux pour contourner les contraintes r\u00e9glementaires. "
      "C'est plus technique, mais c'est faisable. La cr\u00e9ativit\u00e9 du march\u00e9 d\u00e9passe "
      "toujours la r\u00e9glementation.")

    h3(story, S, "L'h\u00f4tellerie 2 et 3 \u00e9toiles va dispara\u00eetre")
    p(story, S,
      "Je le dis sans h\u00e9siter : l'h\u00f4tellerie 2 et 3 \u00e9toiles va \u00eatre remplac\u00e9e. "
      "Pas les palaces -- ceux qui cherchent du service, un restaurant gastronomique, un sommelier, "
      "eux ils ont leur march\u00e9. Mais pour dormir propre, confortable, \u00e0 un prix raisonnable ? "
      "La LCD gagne sur tous les plans.")
    p(story, S,
      "Un h\u00f4tel, c'est une chambre de 9 \u00e0 12\u00a0m\u00b2, 80 \u00e0 180\u20ac la nuit selon la saison. "
      "Deux chambres d'h\u00f4tel pour une famille ou des coll\u00e8gues, c'est 200 \u00e0 300\u20ac par nuit. "
      "Un T2 bien \u00e9quip\u00e9 pour quatre personnes sur Airbnb, c'est 100 \u00e0 140\u20ac. "
      "Le calcul est vite fait.")
    p(story, S,
      "Et l'accueil ? On croit que les gens l'appr\u00e9cient. En r\u00e9alit\u00e9, beaucoup ont besoin "
      "d'arriver \u00e0 minuit ou apr\u00e8s. D'autres pr\u00e9f\u00e8rent ne croiser personne, poser "
      "leurs affaires, et repartir \u00e0 7h du matin sans avoir \u00e0 dire bonjour. J'ai eu un ou deux "
      "commentaires sur l'absence d'accueil en six ans. Un ou deux. Sur des milliers de s\u00e9jours.")
    p(story, S,
      "Les h\u00f4tels 2 et 3 \u00e9toiles ont en plus une structure de co\u00fbts impossible : "
      "des m\u00e8tres carr\u00e9s perdus en salle de r\u00e9ception, d'accueil et en buffet du matin "
      "(pour une banane, du pain de mie et un caf\u00e9 soluble \u00e0 12\u20ac), et une masse salariale "
      "\u00e9crasante. Pour \u00eatre ouvert de 6h \u00e0 22h, il faut minimum deux salaires, plus une "
      "\u00e9quipe week-end. Vous, votre \u00ab\u00a0masse salariale\u00a0\u00bb, c'est une femme de m\u00e9nage "
      "ind\u00e9pendante r\u00e9mun\u00e9r\u00e9e \u00e0 la t\u00e2che.")
    p(story, S,
      "La professionnalisation de la LCD est en marche. Ceux qui se positionnent maintenant, "
      "avec la bonne m\u00e9thode, vont capter un march\u00e9 que l'h\u00f4tellerie traditionnelle "
      "ne peut plus d\u00e9fendre. C'est une fen\u00eatre d'opportunit\u00e9 sans pr\u00e9c\u00e9dent.")


def build_modules_1_to_3(story, S):
    """Modules 1, 2, 3."""

    # MODULE 1
    story.append(PageBreak())
    story.append(ModuleOpener("1", "L'insight fondateur",
                              "Airbnb n'a pas \u00e9t\u00e9 cr\u00e9\u00e9 pour les touristes"))
    story.append(Spacer(1, 8*mm))

    p(story, S, "Tout le monde pense avoir compris Airbnb. Presque tout le monde se trompe.")
    p(story, S,
      "Nous sommes en 2008. New York. Brian Chesky et Joe Gebbia sont deux types compl\u00e8tement "
      "fauch\u00e9s qui essaient de lancer leur bo\u00eete. Ils ont besoin d'aller \u00e0 une "
      "conf\u00e9rence de design -- mais les h\u00f4tels de Manhattan sont complets. Hors de prix. "
      "Introuvables.")
    p(story, S,
      "Alors ils font quelque chose d'improbable : ils mettent en ligne leur appartement sur "
      "Craigslist -- l'\u00e9quivalent du Bon Coin -- avec trois matelas gonflables et un "
      "petit-d\u00e9jeuner. En une nuit, ils ont trouv\u00e9 des locataires. Des professionnels "
      "en d\u00e9placement, exactement comme eux.")
    p(story, S,
      "Air Bed and Breakfast. Pas \u00ab\u00a0location de vacances\u00a0\u00bb. Pas \u00ab\u00a0maison de "
      "plage\u00a0\u00bb. Des matelas gonflables pour des gens qui ont besoin d'un endroit o\u00f9 "
      "dormir pendant un salon professionnel.")

    story.append(QuoteBox(
        "Airbnb n'a jamais \u00e9t\u00e9 con\u00e7u pour les touristes. Il a \u00e9t\u00e9 con\u00e7u "
        "pour les professionnels en d\u00e9placement -- ceux qui remplissent les h\u00f4tels 365 jours par an."
    ))
    story.append(Spacer(1, 4*mm))

    p(story, S,
      "Pourtant, quand vous demandez \u00e0 la plupart des propri\u00e9taires LCD pourquoi ils font "
      "de la location courte dur\u00e9e, ils r\u00e9pondent : \u00ab\u00a0Pour les touristes.\u00a0\u00bb "
      "\u00ab\u00a0Pour la saison.\u00a0\u00bb \u00ab\u00a0Pour l'\u00e9t\u00e9.\u00a0\u00bb Et c'est "
      "l\u00e0 qu'ils se coupent de 8 mois de revenus par an.")

    h3(story, S, "La client\u00e8le des h\u00f4tels -- votre vraie cible")
    p(story, S,
      "Quand je cible un nouveau bien, je fais quelque chose de tr\u00e8s simple : j'ouvre Google Maps. "
      "Je tape \u00ab\u00a0h\u00f4tel\u00a0\u00bb autour de la zone. Je compte. Dans n'importe quelle ville, "
      "m\u00eame les plus petites, vous trouvez rapidement 50, 100, 200, voire 300 chambres. "
      "Certaines toutes petites villes comme Chasse-sur-Rh\u00f4ne en ont plus de 600\u00a0! "
      "Pourquoi ? J'en sais rien et je m'en moque.")
    p(story, S,
      "Et voil\u00e0 ce qu'il faut savoir sur l'h\u00f4tellerie : le taux d'occupation minimum pour "
      "qu'un h\u00f4tel reste ouvert, c'est 60%. En dessous, il ferme. \u00c7a veut dire que sur "
      "100 chambres autour de votre futur bien, il y a au minimum 60 clients chaque mois. Toute l'ann\u00e9e.")
    p(story, S,
      "Vous arrivez avec un appartement trois \u00e0 quatre fois plus grand, une literie cinq \u00e9toiles, "
      "une cuisine \u00e9quip\u00e9e et une note de 9,5 sur 10 -- au m\u00eame prix qu'une chambre d'Ibis "
      "not\u00e9e 7,2. Le choix est \u00e9vident. Vous prenez leur client\u00e8le.")

    story.append(StatCard([
        ("Taux minimum des h\u00f4tels", "60%"),
        ("Demande", "365 jours par an"),
        ("Note moyenne de Marc", "9/10"),
        ("Note des concurrents (Ibis, etc.)", "7-8/10"),
    ]))

    h3(story, S, "La question que tout le monde pose -- et la r\u00e9ponse qui surprend")
    p(story, S,
      "\u00ab\u00a0Mais Marc, t'es o\u00f9 ?\u00a0\u00bb -- C'est syst\u00e9matiquement la premi\u00e8re "
      "chose qu'on me demande quand je parle de mes rendements.")
    p(story, S,
      "Ma r\u00e9ponse : je suis dans un march\u00e9 \u00e0 5\u00a0000\u20ac le m\u00b2. Un march\u00e9 "
      "\u00e0 2\u00a0000\u20ac/m\u00b2 cartonne encore plus. Ce n'est pas le lieu. C'est la m\u00e9thode. "
      "Vous voulez savoir ? Une ville que vous avez jamais entendu parler ? Irigny.")

    # MODULE 2
    story.append(PageBreak())
    story.append(ModuleOpener("2", "La M\u00e9thode 97%",
                              "Pourquoi louer minimum 2 nuits vous co\u00fbte une fortune"))
    story.append(Spacer(1, 8*mm))

    p(story, S,
      "Si vous louez minimum 2 nuits, votre taux d'occupation maximum est d'environ 70%. "
      "Pas 97%. Voici pourquoi.")
    p(story, S,
      "Imaginez votre calendrier du mois. Une r\u00e9servation du lundi au mercredi. "
      "Une autre du vendredi au dimanche. \u00c7a para\u00eet bien, non ? Sauf que vous avez "
      "ce jeudi tout seul au milieu. Un jour orphelin.")
    p(story, S,
      "Si votre minimum est de 2 nuits, ce jeudi reste vide. Impossible \u00e0 louer. "
      "Multipliez \u00e7a sur 12 mois -- c'est 4 \u00e0 5 nuits perdues par mois. "
      "\u00c0 100\u20ac la nuit, c'est 400 \u00e0 500\u20ac par mois qui disparaissent. En silence.")
    p(story, S,
      "De plus, si vous avez 3 jours orphelins cons\u00e9cutifs, il y a beaucoup moins de chance "
      "que quelqu'un ait besoin de 2 nuits parmi ces 3 nuits. Votre taux d'occupation s'effondre. "
      "Puisque toutes vos charges fixes sont d\u00e9j\u00e0 pay\u00e9es, chaque nuit est du cash-flow perdu.")
    p(story, S,
      "En acceptant la location \u00e0 la nuit, ce jeudi se loue. Chaque jour orphelin devient une "
      "opportunit\u00e9. Votre taux d'occupation passe de 70% th\u00e9orique \u00e0 <b>97%+ r\u00e9el</b>.")

    h3(story, S, "Pourquoi 97% et pas 100% ?")
    p(story, S,
      "Au d\u00e9but, j'\u00e9tais \u00e0 110% de taux d'occupation. Quand il y avait une annulation "
      "dans les 7 jours avant l'arriv\u00e9e, le bien \u00e9tait relou\u00e9 dans les 24-48h.")
    p(story, S,
      "Mais \u00e7a m'a appris quelque chose d'important : \u00e0 100% de taux d'occupation, vous "
      "vendez trop bon march\u00e9. Il faut augmenter jusqu'\u00e0 avoir entre 93 et 97%.")
    p(story, S,
      "Entre 93 et 97%, vous maximisez \u00e0 la fois le taux d'occupation ET le prix par nuit. "
      "C'est le sweet spot.")

    story.append(QuoteBox(
        "La m\u00e9thode 97% en une phrase : viser la quasi-compl\u00e9tude, jamais la compl\u00e9tude totale. "
        "\u00c0 100%, vous laissez de l'argent sur la table. \u00c0 97%, vous \u00eates complet ET au bon prix."
    ))
    p(story, S, "Mes 6 ans de donn\u00e9es m'ont permis d'\u00e9tablir que 97% est le plus rentable.")

    # MODULE 3
    story.append(PageBreak())
    story.append(ModuleOpener("3", "L'entr\u00e9e autonome",
                              "Le pr\u00e9requis que 90% des propri\u00e9taires ratent"))
    story.append(Spacer(1, 8*mm))

    p(story, S,
      "Sans entr\u00e9e autonome, votre rendement net est plafonn\u00e9 \u00e0 8%, m\u00eame si vous "
      "\u00eates bons partout. Avec, vous pouvez atteindre 15% et plus. Une bo\u00eete \u00e0 code change tout.")
    p(story, S,
      "La question que tout le monde pose : \u00ab\u00a0Mais comment on loue \u00e0 la nuit si on doit "
      "se d\u00e9placer pour chaque arriv\u00e9e et d\u00e9part ?\u00a0\u00bb La r\u00e9ponse : on ne "
      "se d\u00e9place pas. Jamais.")
    p(story, S,
      "Mes voyageurs re\u00e7oivent un message automatique quelques heures avant leur arriv\u00e9e. "
      "Dedans : le code de la bo\u00eete \u00e0 cl\u00e9s, les instructions d'acc\u00e8s, les informations "
      "pratiques. Ils arrivent. Ils r\u00e9cup\u00e8rent les cl\u00e9s. Ils entrent. Personne n'est l\u00e0. "
      "Personne n'a besoin d'\u00eatre l\u00e0.")

    h3(story, S, "Bo\u00eete \u00e0 code m\u00e9canique vs serrure connect\u00e9e -- le verdict apr\u00e8s 6 ans")
    p(story, S,
      "J'ai essay\u00e9 les deux. La bo\u00eete \u00e0 code m\u00e9canique gagne haut la main. "
      "La serrure connect\u00e9e n\u00e9cessite une application, une connexion internet, une batterie. "
      "Elle peut bugger. La bo\u00eete \u00e0 code m\u00e9canique ? \u00c7a ne bug jamais. Point.")

    h3(story, S, "Le crit\u00e8re \u00e9liminatoire num\u00e9ro un : le vigik")
    p(story, S,
      "Vous visitez un bien. Tout semble parfait. Vous demandez si pour rentrer dans la copro, "
      "c'est un code ou un vigik. Ils vous r\u00e9pondent un vigik ? Il faudra que vous ou quelqu'un "
      "que vous payez se d\u00e9place. Vous ne pourrez pas louer \u00e0 la nuit. Vous avez perdu "
      "votre temps -- vous auriez d\u00fb poser la question avant de vous d\u00e9placer.")

    crit_data = [
        [Paragraph("<b><font color='#ffffff'>Verdict</font></b>", S['body']),
         Paragraph("<b><font color='#ffffff'>Situation</font></b>", S['body'])],
        [Paragraph("<font color='#e05252'><b>\u00c9LIMINATOIRE</b></font>", S['body']),
         Paragraph("Vigik = pas d'entr\u00e9e autonome possible", S['body'])],
        [Paragraph("<font color='#3fbd71'><b>PARFAIT</b></font>", S['body']),
         Paragraph("Petite copro simple (ferme divis\u00e9e, maison coup\u00e9e en deux)", S['body'])],
        [Paragraph("<font color='#e05252'><b>\u00c0 \u00c9VITER</b></font>", S['body']),
         Paragraph("Grosse copro avec portail \u00e9lectrique, interphone, codes multiples", S['body'])],
    ]
    t = Table(crit_data, colWidths=[35*mm, CW - 35*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_DARK),
        ('BACKGROUND', (0,1), (-1,-1), C_WHITE),
        ('BOX', (0,0), (-1,-1), 0.8, C_DARK),
        ('LINEBELOW', (0,0), (-1,-2), 0.3, C_BORDER),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t)
    story.append(Spacer(1, 4*mm))

    story.append(StatCard([
        ("Sans entr\u00e9e autonome", "8% max de rendement"),
        ("Avec entr\u00e9e autonome", "15%+ possible"),
    ]))


def build_modules_4_to_6(story, S):
    """Modules 4, 5, 6."""

    # MODULE 4
    story.append(PageBreak())
    story.append(ModuleOpener("4", "Hacker les algorithmes",
                              "Les 3 leviers que personne ne vous explique"))
    story.append(Spacer(1, 8*mm))

    p(story, S,
      "Trois leviers. La plupart des propri\u00e9taires n'en utilisent qu'un. "
      "Moi j'utilise les trois -- et \u00e7a fait toute la diff\u00e9rence.")

    h3(story, S, "Levier 1 : \u00catre sur deux plateformes")
    p(story, S,
      "Si vous donnez l'exclusif \u00e0 Airbnb, Airbnb n'a aucune raison de vous mettre en avant "
      "plut\u00f4t qu'un autre. Par contre, si vous \u00eates aussi sur Booking, Airbnb se dit : "
      "\u00ab\u00a0Si Booking vend ses nuits avant moi, je perds ma commission. Mieux vaut le pousser "
      "maintenant.\u00a0\u00bb Booking fait exactement le m\u00eame raisonnement. Bien \u00e9videmment, "
      "ceci fonctionne quand le bien est bien not\u00e9, propre et au bon prix.")
    p(story, S,
      "R\u00e9sultat : les deux plateformes vous privil\u00e9gient pour ne pas se faire doubler. "
      "Vous \u00eates visible deux fois plus que vos concurrents qui sont sur une seule plateforme.")
    p(story, S,
      "<b>Les autres plateformes -- soyons honn\u00eates :</b> Expedia, Abritel ? Anecdotique. "
      "Deux r\u00e9servations en un an sur Expedia. Airbnb + Booking = 99,9% des r\u00e9servations. "
      "Ne dispersez pas votre \u00e9nergie.")

    h3(story, S, "Levier 2 : Le lancement au prix cass\u00e9")
    p(story, S,
      "Votre prix cible est 100\u20ac la nuit. Au lancement, vous vous mettez \u00e0 40-50\u20ac. "
      "Ce n'est pas une erreur, c'est une strat\u00e9gie.")
    bullet(story, S,
      "<b>\u00c9tape 1 :</b> \u00c0 40\u20ac, vous \u00eates complet en deux jours sur trois semaines. "
      "L'algorithme note : \u00ab\u00a0\u00c0 chaque fois qu'on le montre, les gens r\u00e9servent.\u00a0\u00bb")
    bullet(story, S,
      "<b>\u00c9tape 2 :</b> Vos premiers voyageurs paient 40\u20ac pour quelque chose qui en vaut 100 -- "
      "ils mettent 10/10 partout.")
    bullet(story, S,
      "<b>\u00c9tape 3 :</b> Sur 2-3 mois, vous montez progressivement : 40, 50, 60, 70, 100\u20ac. "
      "L'algorithme continue de vous pousser parce que votre historique est parfait. "
      "Vous pouvez m\u00eame d\u00e9passer le prix du march\u00e9 (je suis \u00e0 +40% des autres biens, "
      "checkez sur Airdna pour Irigny). Et en g\u00e9n\u00e9ral +20% au-dessus de l'h\u00f4tellerie. "
      "Complet. Toute l'ann\u00e9e.")

    h3(story, S, "Levier 3 : Le pricing dynamique")
    p(story, S,
      "J'ai d\u00e9couvert \u00e7a deux ans apr\u00e8s avoir commenc\u00e9. R\u00e9sultat imm\u00e9diat : "
      "<b>+24% de chiffre d'affaires</b>. Mon cash flow a quasi doubl\u00e9 du jour au lendemain.")
    p(story, S,
      "Le principe : un algorithme analyse l'historique de votre zone. Il y a un an, \u00e0 cette date "
      "pr\u00e9cise, le taux d'occupation \u00e9tait de 75%. Aujourd'hui il est de 85%. Il y a un "
      "\u00e9v\u00e9nement quelque part. L'algorithme monte vos prix automatiquement. Inversement, "
      "quand c'est creux, il les baisse pour vendre quand m\u00eame.")

    story.append(QuoteBox(
        "J'ai touch\u00e9 trois boutons. Tout mis en agressif. Je n'y touche plus depuis. "
        "R\u00e9sultat : des nuits vendues \u00e0 180\u20ac dans ma ville, alors que je n'aurais "
        "jamais os\u00e9 demander \u00e7a."
    ))
    story.append(Spacer(1, 4*mm))

    story.append(StatCard([
        ("Impact pricing dynamique", "+24% de CA"),
        ("Co\u00fbt", "20\u20ac/mois/bien"),
        ("Prix max atteint", "180\u20ac/nuit"),
    ], title="Pricing dynamique"))

    p(story, S,
      "M\u00eame \u00e0 40\u20ac net apr\u00e8s m\u00e9nage et blanchisserie, c'est du cash flow pur : "
      "40\u20ac \u00d7 2 appartements \u00d7 5 nuits = 400\u20ac de plus, avec des charges fixes "
      "exactement identiques.")

    # MODULE 5
    story.append(PageBreak())
    story.append(ModuleOpener("5", "Z\u00e9ro conciergerie",
                              "Le vrai calcul que personne ne vous montre"))
    story.append(Spacer(1, 8*mm))

    p(story, S,
      "\u00ab\u00a0Les conciergeries prennent 20%.\u00a0\u00bb C'est ce qu'on vous dit. "
      "La r\u00e9alit\u00e9 : elles prennent 80% de votre cash flow net. Voici le calcul exact.",
      style='body_b')

    comp_data = [
        [Paragraph("<b><font color='#ffffff'>Sans conciergerie</font></b>", S['body']),
         Paragraph("<b><font color='#ffffff'>Avec conciergerie (20%)</font></b>", S['body'])],
        [Paragraph("CA brut : 5\u00a0000-6\u00a0000\u20ac", S['body']),
         Paragraph("20% \u00d7 6\u00a0000 = 1\u00a0200\u20ac pris", S['body'])],
        [Paragraph("Charges (m\u00e9nage, \u00e9lec, compta, logiciels) : -1\u00a0500\u20ac", S['body']),
         Paragraph("Charges identiques : -1\u00a0500\u20ac", S['body'])],
        [Paragraph("Avant cr\u00e9dit : 3\u00a0000\u20ac", S['body']),
         Paragraph("Avant cr\u00e9dit : 1\u00a0800\u20ac", S['body'])],
        [Paragraph("Apr\u00e8s cr\u00e9dit (610\u20ac) :", S['body']),
         Paragraph("Apr\u00e8s cr\u00e9dit (610\u20ac) :", S['body'])],
        [Paragraph("<b><font color='#3fbd71'>2\u00a0400\u20ac net  |  20%+ de rendement</font></b>", S['body']),
         Paragraph("<b><font color='#e05252'>1\u00a0200\u20ac net  |  ~9% de rendement</font></b>", S['body'])],
    ]
    t = Table(comp_data, colWidths=[CW/2, CW/2])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_DARK),
        ('BACKGROUND', (0,1), (0,-1), C_GREEN_XL),
        ('BACKGROUND', (1,1), (1,-1), C_RED_L),
        ('BOX', (0,0), (-1,-1), 0.8, C_DARK),
        ('LINEBELOW', (0,0), (-1,-2), 0.3, C_BORDER),
        ('LINEBETWEEN', (0,0), (-1,-1), 0.3, C_BORDER),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(t)
    story.append(Spacer(1, 5*mm))

    p(story, S,
      "9% de rendement, c'est encore extraordinaire dans l'immobilier. Mais si vous pouvez avoir "
      "20% avec le m\u00eame bien et le m\u00eame travail, pourquoi se contenter de 9% ?")

    h3(story, S, "Ce que fait vraiment une conciergerie -- et que vous pouvez faire vous-m\u00eame")
    bullet(story, S, "Trouver une femme de m\u00e9nage \u2192 vous pouvez faire \u00e7a")
    bullet(story, S, "G\u00e9rer le planning \u2192 le channel manager le fait")
    bullet(story, S, "R\u00e9pondre aux voyageurs \u2192 les messages automatiques le font")
    p(story, S, "C'est vraiment tout. Il n'y a rien d'autre.", style='body_b')

    h3(story, S, "Le syst\u00e8me de Marc -- ce qui tourne sans lui")
    p(story, S,
      "Je ne parle jamais \u00e0 mes voyageurs. Ma femme de m\u00e9nage non plus. Personne ne leur parle. "
      "Ils re\u00e7oivent tout automatiquement : le code d'acc\u00e8s, les instructions, les bons plans "
      "du quartier.")
    p(story, S,
      "J'ai pass\u00e9 des mois \u00e0 construire cette biblioth\u00e8que de messages. Aujourd'hui, "
      "je n'ai plus aucune question. Litt\u00e9ralement z\u00e9ro.")
    p(story, S,
      "La femme de m\u00e9nage a acc\u00e8s au planning via le channel manager. Elle voit les "
      "arriv\u00e9es et les d\u00e9parts. Elle fait le m\u00e9nage entre 11h et 14h. Elle se "
      "d\u00e9brouille. Pay\u00e9e \u00e0 l'heure.")
    p(story, S,
      "La blanchisserie (Elise) livre les draps propres directement. 12,50\u20ac par set complet : "
      "2 taies carr\u00e9es, 2 rectangles, tapis de douche, 2 petites serviettes, 2 grandes, "
      "housse de couette, drap housse. 2,50\u20ac suppl\u00e9mentaires si le canap\u00e9-lit a "
      "\u00e9t\u00e9 utilis\u00e9.")

    h3(story, S, "Pourquoi la note reste stable \u00e0 9,1/10 apr\u00e8s 6 ans")
    p(story, S,
      "Les grosses conciergeries g\u00e8rent 40 biens avec 40 femmes de m\u00e9nage diff\u00e9rentes. "
      "Un jour, une nouvelle arrive. Elle ne conna\u00eet pas le bien. M\u00e9nage moyen. Ou pire, "
      "elle ne vient pas. Vous avez une note de 0/10, un remboursement \u00e0 faire. Note qui tombe "
      "de 4,92 \u00e0 4,6. L'algorithme p\u00e9nalise. Vous perdez en visibilit\u00e9 et en r\u00e9servations.")
    p(story, S,
      "Avec une seule femme de m\u00e9nage de confiance form\u00e9e par vous, qui conna\u00eet chaque "
      "recoin, \u00e7a n'arrive pas.")

    story.append(QuoteBox(
        "Au bout de 6 ans, on a l'impression que c'est neuf. Contrairement \u00e0 la longue dur\u00e9e, "
        "o\u00f9 au bout de 3 ans vous r\u00e9cup\u00e9rez votre appartement en mauvais \u00e9tat. "
        "Pourquoi ? Car un m\u00e9nage professionnel est fait tous les deux jours en moyenne."
    ))

    # MODULE 6
    story.append(PageBreak())
    story.append(ModuleOpener("6", "La fiscalit\u00e9 LMNP",
                              "Comment encaisser 350\u00a0000\u20ac avec quasi z\u00e9ro imp\u00f4t"))
    story.append(Spacer(1, 8*mm))

    p(story, S,
      "Marc a encaiss\u00e9 350\u00a0000\u20ac avec quasi z\u00e9ro imp\u00f4t. L\u00e9galement. "
      "Et c'est accessible \u00e0 n'importe qui.")
    p(story, S,
      "Le statut LMNP -- Loueur Meubl\u00e9 Non Professionnel -- est probablement le meilleur statut "
      "fiscal qui existe pour l'investissement immobilier en France. Et presque personne ne l'exploite "
      "correctement.")

    h3(story, S, "Comment vous d\u00e9marrez en d\u00e9ficit")
    p(story, S,
      "La premi\u00e8re ann\u00e9e, vous \u00eates \u00e0 -80\u00a0000\u20ac de d\u00e9ficit fiscal. "
      "Frais de notaire, travaux, meubles, frais d'agence, comptable -- tout est d\u00e9ductible. "
      "Comptablement, vous avez perdu de l'argent.")
    p(story, S,
      "Ensuite, chaque ann\u00e9e, vous amortissez le bien. Un bien \u00e0 200\u00a0000\u20ac = "
      "6\u00a0000\u20ac de charge fictive par an (3% du bien). Cette charge r\u00e9duit votre "
      "b\u00e9n\u00e9fice imposable. Mais cette charge est fictive -- l'argent reste bien sur votre compte.")
    p(story, S,
      "R\u00e9sultat : vous g\u00e9n\u00e9rez du cash, mais comptablement vous \u00eates en d\u00e9ficit. "
      "Vous payez z\u00e9ro imp\u00f4t.")
    p(story, S,
      "Tant que vous rachetez des biens et cr\u00e9ez de nouveaux d\u00e9ficits \u2192 z\u00e9ro "
      "imp\u00f4t en continu.", style='body_b')

    story.append(StatCard([
        ("CA encaiss\u00e9 quasi sans imp\u00f4t (LMNP)", "350\u00a0000\u20ac"),
        ("Net apr\u00e8s charges et cr\u00e9dit", "234\u00a0000\u20ac"),
        ("URSSAF minimum (>23k\u20ac LCD)", "1\u00a0348\u20ac/an"),
        ("IS soci\u00e9t\u00e9", "15%"),
    ], title="Chiffres r\u00e9els de Marc"))
    story.append(Spacer(1, 4*mm))

    h3(story, S, "Le seuil des 23\u00a0000\u20ac")
    p(story, S,
      "Si vous d\u00e9passez 23\u00a0000\u20ac de revenus LCD \u2192 URSSAF minimum : 1\u00a0348\u20ac/an. "
      "Si vous \u00eates salari\u00e9 ou avez une SASU \u2192 vous payez ce minimum uniquement. "
      "Si vous avez une SARL (charges URSSAF existantes) \u2192 z\u00e9ro.")

    h3(story, S, "Quand vous passez en positif -- le mur fiscal")
    bullet(story, S, "TMI 30% + 18,2% pr\u00e9l\u00e8vements sociaux = <b>48,2%</b> d'imp\u00f4t total")
    bullet(story, S, "TMI 40% + 18,2% = <b>58,2%</b> d'imp\u00f4t total")
    bullet(story, S, "Si revenus LCD > revenus du foyer \u2192 LMP \u2192 jusqu'\u00e0 <b>80%</b> d'imp\u00f4t")

    h3(story, S, "La solution une fois le d\u00e9ficit LMNP \u00e9puis\u00e9 : la SARL")
    p(story, S,
      "Cr\u00e9ation d'une SARL qui exploite les biens commercialement. La SARL paie un loyer "
      "commercial aux LMNP (coh\u00e9rent avec le prix du march\u00e9). Les LMNP restent en "
      "d\u00e9ficit gr\u00e2ce \u00e0 l'amortissement -- z\u00e9ro imp\u00f4t. La SARL paie 15% "
      "d'IS sur ses b\u00e9n\u00e9fices.")
    bullet(story, S, "Garder dans la SARL pour r\u00e9investir \u2192 z\u00e9ro imp\u00f4t suppl\u00e9mentaire, croissance acc\u00e9l\u00e9r\u00e9e")
    bullet(story, S, "Sortir en dividendes \u2192 30% de flat tax")
    bullet(story, S, "Logique : garder dans la SARL pour grossir, sortir ce dont vous avez besoin pour vivre")

    story.append(Spacer(1, 3*mm))
    story.append(RuleBox("La r\u00e8gle d'or",
        "Pensez \u00e0 la fiscalit\u00e9 AVANT d'acheter, pas apr\u00e8s. "
        "Consultez un comptable sp\u00e9cialis\u00e9 LCD -- pas votre comptable g\u00e9n\u00e9ral."))
