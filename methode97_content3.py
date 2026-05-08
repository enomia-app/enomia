"""4 Operations, Donnees, Idees recues + main entry."""

from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, PageBreak,
    Table, TableStyle, NextPageTemplate
)
from reportlab.lib.pagesizes import A4

from generate_methode97_pdf import (
    ModuleOpener, QuoteBox, StatCard, RuleBox, GreenRule,
    bullet, p, h3, make_styles,
    draw_cover_bg, draw_content_bg, draw_toc_bg,
    C_DARK, C_GREEN, C_GREEN_XL, C_RED_L, C_WHITE, C_BORDER, C_CREAM2, C_TEXT,
    FONT_SANS, FONT_SANS_BOLD, FONT_SERIF, FONT_SERIF_BOLD,
    PW, PH, ML, MR, CW
)

from methode97_content import (
    build_intro_pages, build_modules_1_to_3, build_modules_4_to_6
)
from methode97_content2 import (
    build_modules_7_to_10, build_modules_11_to_14
)


def build_4_operations(story, S):
    """The 4 operations of Marc — full storytelling."""

    story.append(PageBreak())
    story.append(ModuleOpener(None, "Les 4 op\u00e9rations de Marc",
                              "L'histoire r\u00e9elle, chiffr\u00e9e, sans filtre"))
    story.append(Spacer(1, 8*mm))

    # OP 1
    h3(story, S, "Op\u00e9ration 1 -- La maison d'Irigny (RP + d\u00e9pendance LCD)")
    p(story, S,
      "Maison plan Favier, Irigny. 90\u00a0m\u00b2 en R+1 (leur RP), 90\u00a0m\u00b2 de garage am\u00e9nag\u00e9 "
      "en bas, + 50\u00a0m\u00b2 de combles. Cr\u00e9dit : 1\u00a0650\u20ac/mois (puis 1\u00a0500\u20ac "
      "apr\u00e8s renegociation de l'assurance du pr\u00eat).")
    p(story, S,
      "Marc am\u00e9nage le garage en d\u00e9pendance LCD. Cash flow net de la d\u00e9pendance : "
      "1\u00a0800\u20ac/mois. La d\u00e9pendance couvre la totalit\u00e9 du cr\u00e9dit.")
    p(story, S,
      "\u00c0 29 ans, ils vivent dans une maison dont la totalit\u00e9 du cr\u00e9dit est pay\u00e9e "
      "par les locations.", style='body_b')

    story.append(Spacer(1, 4*mm))

    # OP 2
    h3(story, S, "Op\u00e9ration 2 -- L'appartement d'Irigny")
    p(story, S,
      "64\u00a0m\u00b2 \u00e0 Irigny, divis\u00e9 en 2 T2 de 32\u00a0m\u00b2. 104\u00a0000\u20ac + "
      "7\u00a0000\u20ac notaire + 30\u00a0000\u20ac travaux et ameublement = 141\u00a0000\u20ac total. "
      "Cr\u00e9dit 610\u20ac/mois. <b>2\u00a0400\u20ac net/mois.</b>")

    story.append(Spacer(1, 4*mm))

    # OP 3
    h3(story, S, "Op\u00e9ration 3 -- La maison de Montagny + la maison d'Irigny en LCD compl\u00e8te")
    p(story, S,
      "Un jour, Marc et sa femme voient passer une annonce. Une grande maison \u00e0 Montagny, en "
      "premi\u00e8re couronne lyonnaise. Compl\u00e8tement d\u00e9cot\u00e9e. Premier r\u00e9flexe : "
      "\u00ab\u00a0On va faire 10 appartements dedans.\u00a0\u00bb Ils visitent. Ils \u00e9changent "
      "un regard. Tellement belle qu'ils l'ach\u00e8tent comme r\u00e9sidence principale et "
      "d\u00e9m\u00e9nagent.")
    p(story, S,
      "Du coup, la maison d'Irigny se lib\u00e8re enti\u00e8rement. Ils mettent en LCD la maison "
      "enti\u00e8re -- en plus de la d\u00e9pendance qui tournait d\u00e9j\u00e0 depuis 3 ans.")

    p(story, S,
      "<b>Avant optimisation :</b> la maison rapporte. Mais Marc n'optimise rien. Les enfants, le job, "
      "les 3 autres biens qui tournent d\u00e9j\u00e0 bien -- il n'a pas la bande passante. Airbnb "
      "uniquement. Pas de Booking. Pas de pricing dynamique.")

    p(story, S, "<b>Quand il optimise :</b>")
    bullet(story, S, "Ajout sur Booking")
    bullet(story, S, "Pricing dynamique activ\u00e9")
    bullet(story, S, "Ouverture \u00e0 la nuit \u2192 taux d'occupation 25-26 nuits/mois")
    p(story, S, "<b>R\u00e9sultat : cash flow doubl\u00e9.</b>")

    p(story, S,
      "<b>La client\u00e8le de la grande maison :</b> des artisans en d\u00e9placement (3-4 personnes, "
      "chacun sa chambre), des familles qui se r\u00e9unissent, des gens qui dorment l\u00e0 pour un "
      "mariage dans le coin. Exemple 2026 : 3 artisans sur un chantier de 6 mois, lundi au vendredi, "
      "1\u00a0050\u20ac net par semaine en direct. Le week-end : 1 \u00e0 3 nuits pour d'autres profils. "
      "Prix moyen : 350\u20ac/nuit.")

    story.append(StatCard([
        ("Maison enti\u00e8re (apr\u00e8s charges, avant cr\u00e9dit)", "4\u00a0500\u20ac net"),
        ("D\u00e9pendance (apr\u00e8s charges, avant cr\u00e9dit)", "1\u00a0800\u20ac net"),
        ("Total avant cr\u00e9dit", "6\u00a0300\u20ac"),
        ("Cr\u00e9dit", "1\u00a0500\u20ac/mois"),
        ("Cash flow net", "~4\u00a0800\u20ac/mois"),
    ], title="Op\u00e9ration 3 -- chiffres apr\u00e8s optimisation"))
    story.append(Spacer(1, 3*mm))

    p(story, S,
      "<b>La nuance \u00e0 bien comprendre :</b> le cr\u00e9dit est de 1\u00a0500\u20ac seulement parce "
      "que les revenus LCD ont financ\u00e9 tous les travaux au fur et \u00e0 mesure, sans emprunt "
      "suppl\u00e9mentaire. Si les travaux avaient \u00e9t\u00e9 emprunt\u00e9s, la mensualit\u00e9 "
      "aurait \u00e9t\u00e9 autour de 2\u00a0500\u20ac/mois. La m\u00e9thode s'est financ\u00e9e elle-m\u00eame.")

    story.append(Spacer(1, 4*mm))

    # OP 4
    h3(story, S, "Op\u00e9ration 4 -- Pierre-B\u00e9nite (la m\u00e9thode \u00e0 l'\u00e9chelle)")
    p(story, S,
      "Maison 300\u00a0m\u00b2, Pierre-B\u00e9nite. Divis\u00e9e en 3 T2 + 2 T3. <b>7\u00a0800\u20ac "
      "net/mois</b> apr\u00e8s toutes charges et cr\u00e9dit inclus.")
    p(story, S,
      "La m\u00e9thode dupliqu\u00e9e, \u00e0 plus grande \u00e9chelle. M\u00eame logique, m\u00eame "
      "ex\u00e9cution. Marc a des amis qui ont reproduit exactement la m\u00eame chose.")

    story.append(Spacer(1, 6*mm))
    story.append(GreenRule())
    story.append(Spacer(1, 4*mm))

    # Summary table
    h3(story, S, "R\u00e9sum\u00e9 des 4 op\u00e9rations")
    ops_data = [
        [Paragraph("<b><font color='#ffffff'>Op.</font></b>", S['body']),
         Paragraph("<b><font color='#ffffff'>Bien</font></b>", S['body']),
         Paragraph("<b><font color='#ffffff'>Cash flow net</font></b>", S['body'])],
        [Paragraph("<b>1</b>", S['body']),
         Paragraph("D\u00e9pendance Irigny en LCD", S['body']),
         Paragraph("<b><font color='#3fbd71'>1\u00a0800\u20ac/mois</font></b> -- cr\u00e9dit 1\u00a0650\u20ac couvert", S['body'])],
        [Paragraph("<b>2</b>", S['body']),
         Paragraph("Appart Irigny -- 2 T2", S['body']),
         Paragraph("<b><font color='#3fbd71'>2\u00a0400\u20ac/mois</font></b> -- cr\u00e9dit 610\u20ac inclus", S['body'])],
        [Paragraph("<b>3</b>", S['body']),
         Paragraph("Maison Irigny enti\u00e8re + d\u00e9pendance", S['body']),
         Paragraph("<b><font color='#3fbd71'>~4\u00a0800\u20ac/mois</font></b> -- cr\u00e9dit 1\u00a0500\u20ac inclus", S['body'])],
        [Paragraph("<b>4</b>", S['body']),
         Paragraph("Pierre-B\u00e9nite -- 3 T2 + 2 T3", S['body']),
         Paragraph("<b><font color='#3fbd71'>7\u00a0800\u20ac/mois</font></b> -- tout inclus", S['body'])],
    ]
    t = Table(ops_data, colWidths=[12*mm, 55*mm, CW - 67*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), C_DARK),
        ('BACKGROUND', (0,1), (-1,1), C_WHITE),
        ('BACKGROUND', (0,2), (-1,2), C_CREAM2),
        ('BACKGROUND', (0,3), (-1,3), C_WHITE),
        ('BACKGROUND', (0,4), (-1,4), C_CREAM2),
        ('BOX', (0,0), (-1,-1), 1, C_DARK),
        ('LINEBELOW', (0,0), (-1,-2), 0.5, C_BORDER),
        ('LINEBETWEEN', (0,0), (-1,-1), 0.3, C_BORDER),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 7),
        ('BOTTOMPADDING', (0,0), (-1,-1), 7),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('ALIGN', (0,0), (0,-1), 'CENTER'),
    ]))
    story.append(t)


def build_donnees(story, S):
    """Donnees chiffrees de reference."""

    story.append(PageBreak())
    story.append(ModuleOpener(None, "Donn\u00e9es chiffr\u00e9es de r\u00e9f\u00e9rence",
                              "\u00c0 utiliser dans tous les contenus Enomia"))
    story.append(Spacer(1, 8*mm))

    blocks = [
        ("Marc -- situation actuelle", [
            ("Biens", "9 (en cours d'en racheter d'autres)"),
            ("Gestion", "5-6h/mois pour les 9 biens"),
            ("Rendement net", "12-18%"),
            ("Depuis", "2019"),
        ]),
        ("Op\u00e9ration phare (chiffres r\u00e9els)", [
            ("Achat + notaire", "111\u00a0000\u20ac"),
            ("Travaux", "30\u00a0000\u20ac (soi-m\u00eame) / 60\u00a0000\u20ac d\u00e9l\u00e9gu\u00e9"),
            ("Surface", "64\u00a0m\u00b2 \u2192 2 T2"),
            ("Financement 2019", "110%, apport z\u00e9ro, 1%, 20 ans"),
            ("Cr\u00e9dit mensuel", "610\u20ac"),
            ("CA brut mensuel", "5\u00a0000-6\u00a0000\u20ac"),
            ("Cash flow net", "2\u00a0400\u20ac/mois"),
            ("\u00c9quivalent longue dur\u00e9e", "600-800\u20ac/mois"),
            ("Rendement", "20%+"),
        ]),
        ("Premi\u00e8re op\u00e9ration (maison plan Favier)", [
            ("Surface", "90\u00a0m\u00b2 + 50\u00a0m\u00b2 d\u00e9pendance"),
            ("Cr\u00e9dit maison", "1\u00a0600\u20ac/mois"),
            ("Cash flow d\u00e9pendance LCD", "1\u00a0008\u20ac/mois net"),
            ("R\u00e9sultat", "Plus de loyer \u00e0 payer \u00e0 29 ans"),
        ]),
        ("Fiscalit\u00e9", [
            ("CA encaiss\u00e9 quasi sans imp\u00f4t (LMNP)", "350\u00a0000\u20ac"),
            ("Seuil URSSAF", "23\u00a0000\u20ac de revenus LCD"),
            ("Minimum URSSAF", "1\u00a0348\u20ac/an"),
            ("IS soci\u00e9t\u00e9", "15%"),
        ]),
        ("Pricing dynamique", [
            ("D\u00e9couvert", "2 ans apr\u00e8s le d\u00e9but"),
            ("Impact imm\u00e9diat", "+24% de CA"),
            ("Co\u00fbt", "20\u20ac/mois/bien"),
            ("Prix max atteint", "180\u20ac/nuit"),
        ]),
        ("Blanchisserie (Elise)", [
            ("Set complet", "12,50\u20ac"),
            ("Contenu", "2 taies, 2 rectangles, tapis, 4 serviettes, housse, drap"),
            ("Canap\u00e9 utilis\u00e9", "+15\u20ac"),
        ]),
        ("M\u00e9nage", [
            ("Dur\u00e9e moyenne", "30-45 min"),
            ("S\u00e9jour moyen", "1,8 nuit"),
            ("Frais m\u00e9nage factur\u00e9s", "+40\u20ac (sans impact sur taux d'occupation)"),
        ]),
        ("Voyageurs", [
            ("Visiteurs par appart par an", "~180"),
            ("Incidents graves en 6 ans", "1 (d\u00e9g\u00e2t des eaux, couvert)"),
            ("Remboursement assurance", "Travaux 12\u00a0000\u20ac + perte d'exploitation"),
        ]),
        ("Lancement", [
            ("Prix cible", "100-120\u20ac/nuit en moyenne"),
            ("Prix de lancement", "40-50\u20ac/nuit"),
            ("Mont\u00e9e progressive", "2-3 mois"),
        ]),
    ]

    for title, lines in blocks:
        story.append(StatCard(lines, title=title))
        story.append(Spacer(1, 3.5*mm))


def build_idees_recues(story, S):
    """Idees recues que Marc demonte."""

    story.append(PageBreak())
    story.append(ModuleOpener(None, "Id\u00e9es re\u00e7ues que Marc d\u00e9monte",
                              "Angles \u00e9ditoriaux pour LinkedIn, YouTube, articles"))
    story.append(Spacer(1, 8*mm))

    myths = [
        ("Airbnb c'est pour les touristes", "Cr\u00e9\u00e9 pour les pros en d\u00e9placement"),
        ("Il faut \u00eatre dans une grande ville", "N'importe o\u00f9 il y a des h\u00f4tels, \u00e7a marche"),
        ("La LCD c'est saisonnier", "Complet 365 jours/an (m\u00eame pendant le Covid)"),
        ("Il faut viser le luxe pour gagner plus", "Le luxe c'est le service, pas le logement"),
        ("Les conciergeries prennent 20%", "Elles prennent 80% du cash flow net"),
        ("Il faut un apport pour investir", "Marc a financ\u00e9 \u00e0 110% sans apport (2019)"),
        ("Plus c'est cher le m\u00b2, plus c'est rentable", "\u00c0 2\u00a0000\u20ac/m\u00b2 \u00e7a cartonne plus qu'\u00e0 5\u00a0000\u20ac/m\u00b2"),
        ("Il faut beaucoup de temps pour g\u00e9rer", "9 biens = 5-6h/mois avec la bonne m\u00e9thode"),
        ("Il faut une conciergerie pour avoir du temps", "C'est ce qui vous vole le temps ET l'argent"),
        ("La LCD c'est risqu\u00e9 (d\u00e9gradations)", "7\u00a0000 visiteurs, 1 seul incident en 6 ans"),
        ("Les gens aiment \u00eatre accueillis", "1-2 commentaires l\u00e0-dessus en 6 ans"),
        ("L'h\u00f4tellerie c'est concurrentiel", "Les h\u00f4tels 2-3 \u00e9toiles vont dispara\u00eetre"),
    ]

    myth_data = [[
        Paragraph("<b><font color='#ffffff'>Id\u00e9e re\u00e7ue</font></b>", S['body']),
        Paragraph("<b><font color='#ffffff'>R\u00e9alit\u00e9 de Marc</font></b>", S['body']),
    ]]
    for myth, reality in myths:
        myth_data.append([
            Paragraph(f"<font color='#e05252'><b>\u00d7</b></font>  {myth}", S['body']),
            Paragraph(f"<font color='#3fbd71'><b>\u2713</b></font>  {reality}", S['body']),
        ])

    t = Table(myth_data, colWidths=[CW * 0.48, CW * 0.52])
    style_cmds = [
        ('BACKGROUND', (0,0), (-1,0), C_DARK),
        ('BOX', (0,0), (-1,-1), 1, C_DARK),
        ('LINEBELOW', (0,0), (-1,-2), 0.3, C_BORDER),
        ('LINEBETWEEN', (0,0), (-1,-1), 0.3, C_BORDER),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
    ]
    for i in range(1, len(myths) + 1):
        bg = C_WHITE if i % 2 == 1 else C_CREAM2
        style_cmds.append(('BACKGROUND', (0, i), (-1, i), bg))
    t.setStyle(TableStyle(style_cmds))
    story.append(t)

    # Footer
    story.append(Spacer(1, 15*mm))
    story.append(GreenRule())
    story.append(Spacer(1, 4*mm))
    story.append(Paragraph(
        "Fichier cr\u00e9\u00e9 le 15 avril 2026  |  Version 0.2 -- Premier jet  |  "
        "Usage : RAG agents Enomia + base de contenu acquisition",
        S['small']
    ))
    story.append(Paragraph(
        "<b>enomia.app</b> -- Un flux parfait. Pour tous.",
        ParagraphStyle('Final', fontName=FONT_SANS_BOLD, fontSize=11,
                       textColor=C_GREEN, alignment=TA_CENTER, spaceBefore=4),
    ))


def build_pdf():
    output = "/Users/marc/Desktop/methode-97-enomia.pdf"
    S = make_styles()

    doc = BaseDocTemplate(
        output, pagesize=A4,
        title="La M\u00e9thode 97%",
        author="Marc Chenut - Enomia",
        subject="Guide LCD",
    )

    cover_frame = Frame(0, 0, PW, PH, leftPadding=0, rightPadding=0,
                        topPadding=0, bottomPadding=0, id='cover')
    toc_frame = Frame(28*mm, 18*mm, PW - 28*mm - MR, PH - 36*mm,
                      leftPadding=0, rightPadding=0, topPadding=10*mm, bottomPadding=0, id='toc')
    content_frame = Frame(ML, 18*mm, CW, PH - 40*mm,
                          leftPadding=0, rightPadding=0, topPadding=4*mm, bottomPadding=0, id='content')

    doc.addPageTemplates([
        PageTemplate(id='cover', frames=[cover_frame], onPage=draw_cover_bg),
        PageTemplate(id='toc', frames=[toc_frame], onPage=draw_toc_bg),
        PageTemplate(id='content', frames=[content_frame], onPage=draw_content_bg),
    ])

    story = []

    build_intro_pages(story, S)
    build_modules_1_to_3(story, S)
    build_modules_4_to_6(story, S)
    build_modules_7_to_10(story, S)
    build_modules_11_to_14(story, S)
    build_4_operations(story, S)
    build_donnees(story, S)
    build_idees_recues(story, S)

    doc.build(story)

    import os
    size = os.path.getsize(output) / 1024
    print(f"PDF: {output}")
    print(f"Size: {size:.0f} KB")


if __name__ == "__main__":
    build_pdf()
