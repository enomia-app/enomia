#!/usr/bin/env python3
"""Note marché PDF Pierre-Bénite — focus Saint-Genis-Laval appartements (Plan 1 / 5 lots)."""

from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, HRFlowable
)

OUT = Path(__file__).parent / "Note-Marche-Pierre-Benite.pdf"

NAVY = colors.HexColor("#1E2761")
ICE = colors.HexColor("#CADCFC")
DARK = colors.HexColor("#333333")
LIGHT = colors.HexColor("#F2F2F2")
GREEN = colors.HexColor("#007033")

styles = getSampleStyleSheet()

title_style = ParagraphStyle('TitleC', parent=styles['Title'],
    fontName='Helvetica-Bold', fontSize=22, textColor=NAVY,
    alignment=TA_LEFT, spaceAfter=8)
subtitle_style = ParagraphStyle('SubC', parent=styles['Normal'],
    fontName='Helvetica', fontSize=11, textColor=DARK, spaceAfter=14)
h1_style = ParagraphStyle('H1C', parent=styles['Heading1'],
    fontName='Helvetica-Bold', fontSize=16, textColor=NAVY,
    spaceBefore=14, spaceAfter=8)
h2_style = ParagraphStyle('H2C', parent=styles['Heading2'],
    fontName='Helvetica-Bold', fontSize=12, textColor=NAVY,
    spaceBefore=10, spaceAfter=6)
body_style = ParagraphStyle('BodyC', parent=styles['BodyText'],
    fontName='Helvetica', fontSize=10, textColor=DARK,
    alignment=TA_JUSTIFY, spaceAfter=6, leading=14)
kpi_label = ParagraphStyle('KpiL', parent=styles['Normal'],
    fontName='Helvetica', fontSize=9, textColor=NAVY, alignment=TA_CENTER)
kpi_value = ParagraphStyle('KpiV', parent=styles['Normal'],
    fontName='Helvetica-Bold', fontSize=14, textColor=NAVY, alignment=TA_CENTER)
note_style = ParagraphStyle('NoteC', parent=styles['Normal'],
    fontName='Helvetica-Oblique', fontSize=8, textColor=colors.grey, alignment=TA_LEFT)

doc = SimpleDocTemplate(str(OUT), pagesize=A4,
    leftMargin=2*cm, rightMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm,
    title="Note marché Pierre-Bénite", author="Marc Chenut & Antoine Bocquet")

story = []

# ============ PAGE 1 : SYNTHÈSE ============
story.append(Paragraph("Note marché", title_style))
story.append(Paragraph("Pierre-Bénite — 19 Chemin Charmet — limite Saint-Genis-Laval", subtitle_style))
story.append(HRFlowable(width="100%", thickness=2, color=NAVY, spaceBefore=2, spaceAfter=8))
story.append(Paragraph("Annexe au dossier banque — mai 2026", note_style))
story.append(Spacer(1, 0.5*cm))

story.append(Paragraph("Synthèse exécutive", h1_style))
story.append(Paragraph("""
L'opération porte sur l'acquisition d'une maison de ~300 m² au 19 Chemin Charmet, sur la commune
de Pierre-Bénite (69310) mais à la <b>limite de Saint-Genis-Laval (69230)</b> — secteur structurellement
plus valorisé que le reste de Pierre-Bénite (côté Est, moins demandé). Le bien sera divisé en 5 lots
(3 T3 + 2 T2) puis rénové en haut de gamme et exploité en location courte durée (LCD).<br/><br/>
Le marché de référence pour l'évaluation de revente est celui des <b>appartements de Saint-Genis-Laval</b>
(structurellement plus cher au m² que les maisons globales) plutôt que celui de Pierre-Bénite global :
<b>3 480-3 950 €/m² en moyenne, jusqu'à 4 991 €/m² sur les meilleurs quartiers</b>. Notre cible de
revente post-rénovation HG s'établit à 4 200 €/m² (entre la moyenne et le haut de marché), soit
<b>1,26 M€ pour un coût total opération de 738 K€ → plus-value latente ~522 K€</b>.
""", body_style))
story.append(Spacer(1, 0.4*cm))

kpis = [
    [Paragraph("PRIX m² ACHAT", kpi_label),
     Paragraph("APPART MOY SAINT-GENIS", kpi_label),
     Paragraph("VALEUR REVENTE HG", kpi_label),
     Paragraph("DÉCOTE INITIALE", kpi_label)],
    [Paragraph("1 167 €/m²", kpi_value),
     Paragraph("3 950 €/m²", kpi_value),
     Paragraph("4 200 €/m²", kpi_value),
     Paragraph("-72 %", kpi_value)],
]
kpi_table = Table(kpis, colWidths=[4*cm]*4, rowHeights=[0.6*cm, 0.9*cm])
kpi_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, -1), ICE),
    ('BOX', (0, 0), (-1, -1), 0.5, NAVY),
    ('INNERGRID', (0, 0), (-1, -1), 0.5, NAVY),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 2),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
]))
story.append(kpi_table)
story.append(Spacer(1, 0.4*cm))

story.append(Paragraph("Trois piliers d'un dossier sécurisé", h2_style))
story.append(Paragraph("""
<b>Pilier 1 — Valeur patrimoniale immédiate :</b> achat exceptionnellement bas (1 167 €/m²),
soit 70 % sous la médiane des appartements Saint-Genis. Marge structurelle préservée avant travaux.<br/>
<b>Pilier 2 — Plus-value latente forte :</b> valeur post-rénovation HG estimée à 1,26 M€ pour un
coût total de 738 K€ → plus-value brute de ~522 K€ (+71 % sur le coût d'opération). Ratio LTV à
la sortie ~47 %, très en deçà de la norme bancaire de 80 %.<br/>
<b>Pilier 3 — Plan B robuste :</b> en cas de non-décollage de la LCD, la location nue meublée
standard (valeurs marché Saint-Genis : T2 = 850 €/mois, T3 = 1 250 €/mois) génère <b>65,4 K€/an</b>,
suffisant pour couvrir intégralement le crédit (42 K€/an de mensualités) + charges SCI (3 K€/an).
""", body_style))

story.append(PageBreak())


# ============ PAGE 2 : MARCHÉ IMMOBILIER SAINT-GENIS-LAVAL ============
story.append(Paragraph("1. Marché immobilier — Saint-Genis-Laval (appartements)", h1_style))
story.append(Paragraph("Sources : DVF (etalab.gouv.fr), MeilleursAgents, efficity, RealAdvisor, PAP — mai 2026", note_style))
story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("""
Saint-Genis-Laval (69230, ~21 000 habitants) est une commune valorisée de la métropole de Lyon,
adjacente à Pierre-Bénite, qui accueille notamment le campus universitaire Lyon 1 sciences, l'Hôpital
Lyon Sud, des sociétés sciences/biotech, et un tissu résidentiel pavillonnaire/petit collectif HG.<br/><br/>
<b>Pourquoi prendre Saint-Genis-Laval comme référence et non Pierre-Bénite global ?</b> Le bien est
situé à la limite ouest de Pierre-Bénite, mitoyenne de Saint-Genis-Laval. Le marché immobilier de
référence pour cette parcelle est donc celui de Saint-Genis-Laval (structurellement plus cher) plutôt
que celui de Pierre-Bénite global qui inclut des secteurs Est (vers Vénissieux) significativement moins
valorisés. De plus, après division en T2/T3, la valorisation se fait au prix m² <b>appartement</b>
(plus élevé que le prix m² maison globale).
""", body_style))

story.append(Paragraph("Prix m² par segment — Saint-Genis-Laval", h2_style))
prix_data = [
    ['Segment', 'Prix m²', 'Source / Commentaire'],
    ['Appartement médian Saint-Genis-Laval', '3 480 €/m²', 'MeilleursAgents avril 2026'],
    ['Appartement moyen Saint-Genis-Laval', '3 950 €/m²', 'RealAdvisor mai 2026'],
    ['Appartement Saint-Genis-Laval Ouest (top)', "jusqu'à 4 991 €/m²", 'Quartier valorisé'],
    ['Maison Saint-Genis-Laval (moyenne)', '4 752 €/m²', 'Référence haute mais hors cible'],
    ['Notre acquisition (maison brute)', '1 167 €/m²', '-70 % vs médiane appart Saint-Genis'],
    ['Notre coût total / m² (738 K / 300 m²)', '2 460 €/m²', '-30 % sous médiane même rénovation'],
    ['Cible revente T2/T3 rénovés HG', '~4 200 €/m²', 'Valeur sortie estimée 1,26 M€'],
]
prix_table = Table(prix_data, colWidths=[6*cm, 3*cm, 8*cm])
prix_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), NAVY),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 10),
    ('FONTSIZE', (0, 1), (-1, -1), 9),
    ('TEXTCOLOR', (0, 5), (-1, 6), GREEN),
    ('FONTNAME', (0, 5), (-1, 6), 'Helvetica-Bold'),
    ('TEXTCOLOR', (0, 7), (-1, 7), NAVY),
    ('FONTNAME', (0, 7), (-1, 7), 'Helvetica-Bold'),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT]),
    ('GRID', (0, 0), (-1, -1), 0.25, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
]))
story.append(prix_table)
story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("Interprétation", h2_style))
story.append(Paragraph("""
La décote de 70 % à l'achat s'explique par la nature de la vente : le vendeur est un lotisseur ayant
acquis un terrain plus large dont la maison est issue. Cette structure de vente (vente séparée d'un lot
existant dans un programme de division) est connue pour permettre des décotes significatives.<br/><br/>
Le coût total opération ramené au m² (2 460 €/m²) reste 30 % sous la médiane des appartements
Saint-Genis-Laval. <b>Même sans plus-value due à la rénovation, l'opération est déjà profitable</b> —
la rénovation HG vient amplifier la plus-value en repositionnant le bien sur le segment qualité
supérieure (4 000-4 500 €/m² pour des appartements rénovés HG à Saint-Genis-Laval).<br/><br/>
À <b>4 200 €/m² post-rénovation × 300 m² = 1,26 M€</b>, la plus-value brute s'élève à ~522 K€.
Le ratio LTV à la sortie tombe à <b>47 %</b> (emprunt 588 K€ / 1,26 M€), très en dessous de la norme
bancaire de 80 % (et même de 70 % considérée comme confortable).
""", body_style))

story.append(PageBreak())


# ============ PAGE 3 : CONCURRENCE LCD/HÔTELIÈRE + LOCATION NUE ============
story.append(Paragraph("2. Positionnement LCD et marché de la location longue", h1_style))
story.append(Paragraph("Périmètre : 7 minutes en voiture de l'adresse — bassin Lyon Sud", note_style))
story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("Concurrence hôtelière", h2_style))
story.append(Paragraph("""
L'analyse de la concurrence dans le rayon de 7 minutes en voiture autour du 19 Chemin Charmet révèle
un sous-marché premium peu couvert. L'établissement de référence dans cette zone est l'<b>Hôtel Lyon Sud</b>
(40 chambres, 3*, ~81 €/nuit en moyenne), un hôtel d'affaires destiné à une clientèle business mobile
et tourisme standard. Notre offre LCD se positionne sur un segment <b>structurellement différent</b> :
logements entiers haut de gamme avec cuisine, extérieur et équipements premium.
""", body_style))

concur_data = [
    ['Offre', 'Prix net /nuit', 'Prix brut client', 'Spécificité'],
    ['Hôtel Lyon Sud (3*)', '—', '~81 €', 'Chambre standard, 40 unités'],
    ['Notre T2 (×2)', '75 €', '~90 €', 'Logement entier + cuisine + parking'],
    ['Notre T3 (×3)', '115 €', '~140 €', '1 ch + cuisine + extérieur + parking'],
]
concur_table = Table(concur_data, colWidths=[4*cm, 2.5*cm, 2.5*cm, 8*cm])
concur_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), NAVY),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 9),
    ('FONTSIZE', (0, 1), (-1, -1), 8),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT]),
    ('GRID', (0, 0), (-1, -1), 0.25, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('TOPPADDING', (0, 0), (-1, -1), 4),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
]))
story.append(concur_table)
story.append(Spacer(1, 0.2*cm))

story.append(Paragraph("Tarification — référence historique Marc", h2_style))
story.append(Paragraph("""
Les tarifs nets par nuit retenus dans le BP (75 €/T2, 115 €/T3) s'appuient sur l'historique d'exploitation
de Marc Chenut sur 4 opérations LCD actuellement en activité dans le bassin lyonnais (maison T5 d'Irigny,
dépendance LCD, deux T2 d'Irigny), avec un taux d'occupation moyen de <b>97 % mesuré sur 6 ans</b>.
Cet historique est largement supérieur à la moyenne du marché LCD français (60-75 % selon les
opérateurs Airbnb/Booking en zone urbaine).
""", body_style))

story.append(Paragraph("Plan B — Location nue meublée (valeurs marché Saint-Genis)", h2_style))
plan_b_data = [
    ['Type', 'Loyer mensuel', 'Loyers/an'],
    ['T2 (×2)', '850 €', '20 400 €'],
    ['T3 (×3)', '1 250 €', '45 000 €'],
    ['TOTAL', '5 450 €/mois', '65 400 €/an'],
]
plan_b_table = Table(plan_b_data, colWidths=[5*cm, 5*cm, 5*cm])
plan_b_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), NAVY),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 10),
    ('FONTSIZE', (0, 1), (-1, -1), 10),
    ('BACKGROUND', (0, 3), (-1, 3), GREEN),
    ('TEXTCOLOR', (0, 3), (-1, 3), colors.white),
    ('FONTNAME', (0, 3), (-1, 3), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 3), (-1, 3), 11),
    ('ROWBACKGROUNDS', (0, 1), (-1, 2), [colors.white, LIGHT]),
    ('GRID', (0, 0), (-1, -1), 0.25, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('LEFTPADDING', (0, 0), (-1, -1), 8),
]))
story.append(plan_b_table)
story.append(Spacer(1, 0.2*cm))

story.append(Paragraph("""
<b>Loyers de référence retenus : T2 = 850 €/mois, T3 = 1 250 €/mois</b> — valeurs marché meublé
Saint-Genis-Laval mai 2026 (proches médiane locative locale pour des biens rénovés).
À <b>5 450 €/mois en location nue meublée</b>, le projet couvre la mensualité de prêt (3 502 €/mois)
+ charges SCI (~250 €/mois) avec une marge de sécurité de <b>+1 700 €/mois</b>. Le risque de défaut
sur le prêt est ainsi écarté même en cas de non-décollage du LCD.
""", body_style))

story.append(PageBreak())


# ============ PAGE 4 : TENSION + ARGUMENTAIRE FINAL ============
story.append(Paragraph("3. Tension marché Lyon Sud et facteurs de succès", h1_style))
story.append(Spacer(1, 0.2*cm))

story.append(Paragraph("Demande LCD sur le secteur", h2_style))
story.append(Paragraph("""
Le bassin Lyon Sud présente une demande LCD <b>structurellement forte et diversifiée</b>, alimentée
par quatre flux distincts qui se complètent sur l'année :<br/><br/>
<b>(1) Tourisme Lyon :</b> Lyon, 3ᵉ ville française, attire ~6 millions de visiteurs/an. Notre
positionnement à 10 min du centre par métro permet de capter cette demande tout en offrant un produit
moins cher que les hébergements presqu'île (où le prix m² LCD dépasse 200 €/nuit sur T2).<br/>
<b>(2) Tourisme d'affaires &amp; santé :</b> bassin économique Lyon Sud (Vénissieux, Saint-Fons,
Pierre-Bénite) + pôle de santé (Hôpital Lyon Sud, Saint-Joseph-Saint-Luc) → demande hebdomadaire stable.<br/>
<b>(3) Universités &amp; enseignement supérieur :</b> Université Lyon 1 sciences (campus de la Doua et
Saint-Genis-Laval), ESCP Lyon, Université Lyon 2 → familles en visite, professeurs invités, mobilité.<br/>
<b>(4) Évènementiel saisonnier :</b> Fête des Lumières (décembre, hyper-tension), Nuits Sonores (mai),
Biennale, salons professionnels (Eurexpo) → pics qui compensent la basse saison de février.
""", body_style))

story.append(Paragraph("Risques identifiés et facteurs mitigeants", h2_style))
risk_data = [
    ['Risque', 'Mitigation'],
    ['Réglementation LCD Lyon (loi Le Meur, 90-120 nuitées max RP)',
     "Bien exploité en location NON résidence principale → pas de plafond 90/120 nuitées. Risque limité aux évolutions futures."],
    ['Concurrence locale future',
     "Standing premium (rénovation HG, parking + prise VE, jardin) = barrière à l'entrée. Pas de programme neuf comparable identifié dans le 7 min."],
    ['Saisonnalité',
     '4 flux complémentaires lissent la saisonnalité. Historique Marc : 97 % occupation 6 ans.'],
    ['Coût énergétique',
     'Performances énergétiques améliorées par la rénovation HG. Production photovoltaïque possible (étude à conduire).'],
    ['Non-décollage du LCD',
     "Plan B location nue meublée : 65 K€/an (5 450 €/mois) → couvre crédit + charges + marge 1 700 €/mois. Pas de risque de défaut sur le prêt."],
]
risk_table = Table(risk_data, colWidths=[6*cm, 11*cm])
risk_table.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), NAVY),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 10),
    ('FONTSIZE', (0, 1), (-1, -1), 9),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT]),
    ('GRID', (0, 0), (-1, -1), 0.25, colors.grey),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ('LEFTPADDING', (0, 0), (-1, -1), 6),
    ('RIGHTPADDING', (0, 0), (-1, -1), 6),
]))
story.append(risk_table)
story.append(Spacer(1, 0.3*cm))

story.append(Paragraph("Conclusion marché", h1_style))
story.append(Paragraph("""
L'analyse marché confirme la solidité du dossier sur trois dimensions : <b>(1) valeur immobilière</b>
avec une décote d'achat exceptionnelle de 70 % vs médiane des appartements Saint-Genis-Laval et une
plus-value latente forte post-rénovation (LTV sortie 47 %), <b>(2) positionnement LCD</b> sur un
segment premium peu couvert dans le bassin Lyon Sud, adossé à un historique d'exploitation prouvé à
97 % d'occupation sur 6 ans, et <b>(3) plan B robuste</b> via la location nue meublée standard
(5 450 €/mois) qui couvre intégralement les charges du financement.<br/><br/>
Le risque résiduel principal est règlementaire (évolution de la loi LCD), mais il est mitigé par
le statut non-résidence principale du bien et par la diversification possible vers la location moyenne
durée (3-6 mois) en cas de durcissement du cadre LCD.
""", body_style))
story.append(Spacer(1, 0.3*cm))

story.append(HRFlowable(width="100%", thickness=0.5, color=colors.grey, spaceBefore=4, spaceAfter=2))
story.append(Paragraph("Marc Chenut &amp; Antoine Bocquet — mai 2026 — Annexe au dossier banque",
                       note_style))
story.append(Paragraph("Sources : DVF (etalab.gouv.fr), MeilleursAgents, efficity, RealAdvisor, SeLoger, PAP. Données mai 2026.",
                       note_style))

doc.build(story)
print(f"OK: {OUT}")
