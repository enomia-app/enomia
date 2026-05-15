#!/usr/bin/env node
// Génère .claude/backlinks.html avec data JSON inlinée + mail pré-écrit copy-paste.
// Usage : node scripts/generate-backlinks-html.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectCompetingTopics, ENOMIA_RESOURCES } from './lib/competing-topics.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const data = JSON.parse(fs.readFileSync(path.join(ROOT, '.claude/backlinks-data.json'), 'utf8'));

const REJECTED_STATUSES = ['rejete_trop_gros', 'rejete_non_pertinent', 'exclu_trop_gros'];

function inferEnomiaUrl(kwsMatch, articleCible, ressourceEnomia, prospect) {
  if (ressourceEnomia && ressourceEnomia.startsWith('http')) return ressourceEnomia;
  const topics = prospect ? detectCompetingTopics(prospect) : new Set();
  const kw = kwsMatch?.[0]?.kw?.toLowerCase() || '';

  // Ordre de priorité des ressources non-compétitives :
  // 1. Loi Le Meur (récent, unique) — pertinent si ils n'ont pas déjà
  // 2. Taux occupation par ville (data) — pertinent si ils n'ont pas
  // 3. Fiscalité Airbnb — si pas déjà couvert
  // 4. Tarif conciergerie comparateur
  // 5. Pricing dynamique
  // 6. Simulateur (DEFAULT, sauf si compete)

  // Mapper KW → ressource idéale, en filtrant les sujets que le prospect a déjà
  const candidates = [];
  if (/fiscal|lmnp|impot/.test(kw) && !topics.has('fiscalite')) candidates.push('fiscalite');
  if (/loi|le meur/.test(kw) && !topics.has('loi')) candidates.push('loi');
  if (/taux occupation/.test(kw) && !topics.has('occupation')) candidates.push('occupation');
  if (/pricing|tarif dynamique/.test(kw) && !topics.has('pricing')) candidates.push('pricing');
  if (/facture/.test(kw) && !topics.has('facture')) candidates.push('facture');
  if (/contrat/.test(kw) && !topics.has('contrat')) candidates.push('contrat');
  if (/conciergerie/.test(kw)) candidates.push('tarif_conciergerie');
  if (/commission/.test(kw) && !topics.has('commission')) candidates.push('tarif_conciergerie');

  // Si le KW rank sur simulateur/rentabilité et qu'ils ont déjà un simulateur → pivot vers complémentaire
  if (/rentab|simulat|combien rapporte|investir/.test(kw)) {
    if (topics.has('simulateur')) {
      // Pivot : ils ont déjà un simulateur, proposer angle éditorial complémentaire
      if (!topics.has('loi')) candidates.push('loi');
      else if (!topics.has('occupation')) candidates.push('occupation');
      else if (!topics.has('fiscalite')) candidates.push('fiscalite');
      else candidates.push('louer_rentable');
    } else {
      candidates.push('simulateur');
    }
  }

  const chosen = candidates[0] || 'simulateur';
  return ENOMIA_RESOURCES[chosen];
}

// Enrichir prospects avec champs calculés
data.prospects.forEach(p => {
  if (!p.url_externe_cible && p.kws_match?.length) {
    p.url_externe_cible = p.kws_match[0].url;
    p.kw_principal = p.kws_match[0].kw;
  }
  // Forcer recalcul pour bénéficier de la détection compétitive
  if (!p.url_cible_enomia_locked) {
    p.url_cible_enomia = inferEnomiaUrl(p.kws_match, p.article_cible, p.ressource_enomia_proposee, p);
  }
  p.competing_topics = [...detectCompetingTopics(p)];
});

// Filtrer rejetés
const activeProspects = data.prospects.filter(p => !REJECTED_STATUSES.includes(p.status));
const rejectedCount = data.prospects.length - activeProspects.length;

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Backlinks Prospection — Enomia</title>
<style>
  :root {
    --bg: #0d1117; --bg-card: #161b22; --bg-card-hover: #1c2330;
    --border: #30363d; --text: #e6edf3; --text-dim: #8b949e; --text-faint: #6e7681;
    --green: #3fb950; --yellow: #d29922; --red: #f85149; --blue: #58a6ff;
    --purple: #bc8cff; --orange: #ff9500; --cyan: #76e3ea;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: var(--bg); color: var(--text); font-family: -apple-system, sans-serif; }
  .container { max-width: 1800px; margin: 0 auto; padding: 32px; }
  h1 { font-size: 28px; margin: 0 0 8px; }
  h2 { font-size: 18px; margin: 24px 0 12px; padding-top: 16px; border-top: 1px solid var(--border); }
  .subtitle { color: var(--text-dim); margin: 0 0 24px; font-size: 14px; }
  .meta { color: var(--text-faint); font-size: 12px; font-family: ui-monospace, monospace; margin-bottom: 16px; }
  .stats-row { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
  .stat-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; padding: 12px 16px; min-width: 110px; }
  .stat-card .v { font-size: 22px; font-weight: 700; color: var(--cyan); }
  .stat-card .l { font-size: 10px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
  .filters { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
  .filter-btn { background: var(--bg-card); border: 1px solid var(--border); color: var(--text-dim); padding: 6px 14px; border-radius: 20px; font-size: 12px; cursor: pointer; transition: all 0.15s ease; }
  .filter-btn:hover { color: var(--text); border-color: var(--text-faint); }
  .filter-btn.active { background: var(--cyan); color: var(--bg); border-color: var(--cyan); font-weight: 600; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
  thead th { padding: 10px 12px; text-align: left; background: var(--bg-card); border-bottom: 2px solid var(--border); font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-dim); white-space: nowrap; }
  tbody td { padding: 10px 12px; border-bottom: 1px solid var(--border); vertical-align: top; }
  tbody tr:hover { background: var(--bg-card-hover); }
  .badge { font-size: 9px; padding: 3px 7px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; white-space: nowrap; }
  .badge.tag-conciergerie { background: rgba(63, 185, 80, 0.15); color: var(--green); }
  .badge.tag-blog { background: rgba(88, 166, 255, 0.15); color: var(--blue); }
  .badge.tag-outil { background: rgba(188, 140, 255, 0.15); color: var(--purple); }
  .badge.tag-annuaire { background: rgba(255, 149, 0, 0.15); color: var(--orange); }
  .badge.tag-media { background: rgba(255, 126, 182, 0.15); color: #ff7eb6; }
  .badge.tag-autre { background: rgba(110, 118, 129, 0.15); color: var(--text-faint); }
  .badge.s-pitch_pret_a_envoyer { background: rgba(255, 149, 0, 0.2); color: var(--orange); }
  .badge.s-a_enrichir { background: rgba(188, 140, 255, 0.15); color: var(--purple); }
  .badge.s-envoye { background: rgba(88, 166, 255, 0.15); color: var(--blue); }
  .badge.s-accepte { background: rgba(63, 185, 80, 0.2); color: var(--green); }
  .badge.s-refuse { background: rgba(248, 81, 73, 0.15); color: var(--red); }
  .badge.s-a_qualifier { background: rgba(118, 227, 234, 0.12); color: var(--cyan); }
  a { color: var(--blue); text-decoration: none; }
  a:hover { text-decoration: underline; }
  .small { font-size: 10px; color: var(--text-faint); font-family: ui-monospace, monospace; }
  .traffic { font-size: 11px; color: var(--text); font-family: ui-monospace, monospace; }
  .url-cell { max-width: 280px; word-break: break-word; font-size: 11px; }
  .copy-btn { background: var(--bg-card-hover); border: 1px solid var(--border); color: var(--cyan); padding: 3px 8px; border-radius: 4px; cursor: pointer; font-size: 10px; font-family: inherit; }
  .copy-btn:hover { background: var(--cyan); color: var(--bg); }
  .copy-btn.copied { background: var(--green); color: var(--bg); border-color: var(--green); }
  .copy-mail-btn { background: var(--orange); color: var(--bg); border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 11px; font-weight: 600; font-family: inherit; white-space: nowrap; }
  .copy-mail-btn:hover { background: #ffaa33; }
  .copy-mail-btn.copied { background: var(--green); }
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid var(--border); color: var(--text-faint); font-size: 11px; text-align: center; }
  .footer code { background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px; font-family: ui-monospace, monospace; }
  .mail-preview { font-size: 10px; color: var(--text-dim); max-width: 320px; max-height: 60px; overflow: hidden; white-space: pre-wrap; line-height: 1.4; opacity: 0.7; }
  details.mail-details { font-size: 10px; }
  details.mail-details summary { cursor: pointer; color: var(--text-dim); font-size: 10px; padding: 4px 0; }
  details.mail-details summary:hover { color: var(--text); }
  details.mail-details pre { background: var(--bg); padding: 10px; border-radius: 6px; font-family: ui-monospace, monospace; font-size: 11px; white-space: pre-wrap; max-width: 500px; color: var(--text); margin: 6px 0; border: 1px solid var(--border); }
</style>
</head>
<body>
<div class="container">
<h1>🔗 Backlinks — Pipeline prospection</h1>
<p class="subtitle">Régénère via <code>node scripts/generate-backlinks-html.mjs</code></p>
<p class="meta">Dernière màj : ${data.lastUpdate} · ${activeProspects.length} prospects actifs (${rejectedCount} rejetés masqués)</p>

<div class="stats-row" id="stats"></div>

<h2>🎯 Prêts à envoyer — Mail copy/paste</h2>
<table id="table-prio">
  <thead><tr>
    <th>Entreprise</th><th>Contact</th><th>Email</th>
    <th>Page précise (où insérer le lien)</th><th>Concurrence détectée</th><th>Lien Enomia choisi</th><th>Mail prêt</th>
  </tr></thead>
  <tbody id="tbody-prio"></tbody>
</table>

<h2>🔍 À enrichir / qualifier</h2>
<div class="filters" id="filters"></div>
<table id="table-all">
  <thead><tr>
    <th>Entreprise</th><th>Tag</th><th>Status</th><th>Traffic/mo</th>
    <th>KW principal</th><th>Page précise externe</th><th>Lien Enomia</th><th>Email</th>
  </tr></thead>
  <tbody id="tbody-all"></tbody>
</table>

<div class="footer">
  <p>Édite <code>.claude/backlinks-data.json</code> puis re-run le script pour régénérer</p>
  <p>${rejectedCount} prospects rejetés masqués (traffic ≥ 5000/mo ou non pertinent)</p>
</div>
</div>

<script>
const PROSPECTS = ${JSON.stringify(activeProspects)};

function tagOf(p) {
  return p.tag || ((p.type_cible || '').includes('conciergerie') ? 'conciergerie' : 'autre');
}

function copyToClipboard(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    btn.classList.add('copied');
    const orig = btn.textContent;
    btn.textContent = '✓ Copié';
    setTimeout(() => { btn.classList.remove('copied'); btn.textContent = orig; }, 1500);
  });
}
window.copyToClipboard = copyToClipboard;

function shortenUrl(u, max = 40) {
  if (!u) return '—';
  const noProto = u.replace(/^https?:\\/\\//, '').replace(/^www\\./, '');
  return noProto.length > max ? noProto.slice(0, max - 1) + '…' : noProto;
}

// Construit le mail complet pré-écrit pour un prospect
function buildEmail(p) {
  const tag = tagOf(p);
  const urlExterne = p.url_externe_cible || (p.kws_match?.[0]?.url) || '';
  const urlEnomia = p.url_cible_enomia || 'https://www.enomia.app/simulateur-rentabilite-airbnb';
  const kw = p.kw_principal || p.kws_match?.[0]?.kw || '';
  const prenom = p.prenom_contact || '';
  const domain = (p.site || '').replace(/^https?:\\/\\//, '').replace(/^www\\./, '').replace(/\\/.*$/, '');

  const salut = prenom ? ('Bonjour ' + prenom + ',') : 'Bonjour,';

  // ─── Templates par angle (ton "Resource" sans réciproque, sauf #5) ──
  if (p.angle === 'loi-le-meur' && urlExterne) {
    return salut + '\\n\\n' +
      "Marc, fondateur d'Enomia (enomia.app).\\n\\n" +
      'Je suis tombé sur votre article :\\n' + urlExterne + '\\n\\n' +
      "J'ai compilé les décrets d'application de la loi Le Meur et les analyses publiées par les cabinets spécialisés. Tout est sourcé.\\n\\n" +
      "L'article :\\n" + urlEnomia + '\\n\\n' +
      "Si ça vous semble utile pour vos lecteurs, j'apprécierais qu'il figure en lien complémentaire dans votre article.\\n\\n" +
      'Marc Chenut\\nenomia.app';
  }

  if (p.angle === 'facture-airbnb' && urlExterne) {
    return salut + '\\n\\n' +
      "Marc, fondateur d'Enomia (enomia.app).\\n\\n" +
      'Je suis tombé sur votre article :\\n' + urlExterne + '\\n\\n' +
      "On a publié un générateur de factures Airbnb/Booking gratuit (TVA, taxe de séjour, frais ménage, mentions légales, PDF prêt en 2 minutes) :\\n" + urlEnomia + '\\n\\n' +
      "Si ça vous semble utile pour vos lecteurs, j'apprécierais qu'il figure en lien complémentaire dans votre article.\\n\\n" +
      'Marc Chenut\\nenomia.app';
  }

  if (p.angle === 'contrat-lcd' && urlExterne) {
    return salut + '\\n\\n' +
      "Marc, fondateur d'Enomia (enomia.app).\\n\\n" +
      'Je suis tombé sur votre article :\\n' + urlExterne + '\\n\\n' +
      "On a publié un générateur de contrats de location saisonnière gratuit (dépôt garantie, clause résolutoire, état des lieux, RGPD, à jour 2025) :\\n" + urlEnomia + '\\n\\n' +
      "Si ça vous semble utile pour vos lecteurs, j'apprécierais qu'il figure en lien complémentaire dans votre article.\\n\\n" +
      'Marc Chenut\\nenomia.app';
  }

  if (p.angle === 'taux-occupation' && urlExterne) {
    return salut + '\\n\\n' +
      "Marc, fondateur d'Enomia (enomia.app).\\n\\n" +
      'Je suis tombé sur votre article :\\n' + urlExterne + '\\n\\n' +
      "On a compilé les taux d'occupation Airbnb sur 30+ villes françaises (par ville, par type de bien, sur 12 mois glissants, mise à jour trimestrielle) :\\n" + urlEnomia + '\\n\\n' +
      "Si ça vous semble utile pour vos lecteurs, j'apprécierais qu'il figure en lien complémentaire dans votre article.\\n\\n" +
      'Marc Chenut\\nenomia.app';
  }

  if (p.angle === 'conciergerie-ville') {
    const ficheUrl = p.fiche_enomia || 'https://www.enomia.app/conciergerie-airbnb';
    const isDejaListee = p.est_listee_sur_enomia === true;
    if (isDejaListee) {
      return salut + '\\n\\n' +
        "Marc, fondateur d'Enomia (enomia.app).\\n\\n" +
        'Vous êtes référencée sur notre page conciergeries de votre ville :\\n' + ficheUrl + '\\n\\n' +
        "À noter : aujourd'hui votre fiche ne contient pas de lien clickable vers votre site. Nos visiteurs vous lisent mais ne peuvent pas vous joindre directement.\\n\\n" +
        "Échange concret :\\n" +
        '→ Côté Enomia : on ajoute un lien direct depuis votre fiche vers votre site (trafic qualifié de propriétaires qui cherchent une conciergerie dans votre ville)\\n' +
        '→ Côté vous : vous ajoutez un lien depuis un article de votre blog vers une ressource Enomia (simulateur, guide fiscalité ou guide loi Le Meur, au choix)\\n\\n' +
        'Ça vous parle ?\\n\\nMarc Chenut\\nenomia.app';
    }
    // Non listée : pitcher l'ajout dans la fiche ville (à condition qu'on opère sur cette ville)
    return salut + '\\n\\n' +
      "Marc, fondateur d'Enomia (enomia.app).\\n\\n" +
      "On opère une page conciergeries Airbnb par ville française (~22 villes pour l'instant : Paris, Lyon, Marseille, Bordeaux, Nantes, Strasbourg, etc.), avec un comparatif détaillé des conciergeries locales.\\n\\n" +
      "Page d'accueil : " + ficheUrl + '\\n\\n' +
      "Si vous opérez sur une de nos villes, on peut vous y ajouter avec une description + lien clickable vers votre site (trafic qualifié de propriétaires cherchant une conciergerie locale).\\n\\n" +
      "Échange concret :\\n" +
      '→ Côté Enomia : on vous référence sur la page de votre ville d\\'opération principale\\n' +
      '→ Côté vous : vous ajoutez un lien depuis un article de votre blog vers une ressource Enomia (simulateur, guide fiscalité ou guide loi Le Meur, au choix)\\n\\n' +
      "Sur quelle ville opérez-vous principalement ?\\n\\nMarc Chenut\\nenomia.app";
  }
  // ─────────────────────────────────────────────────────────────────────

  if (tag === 'blog' && urlExterne) {
    const competing = p.competing_topics || [];
    const topicLabels = { simulateur: 'un simulateur de rentabilité', fiscalite: 'du contenu sur la fiscalité', loi: 'la loi Le Meur', pricing: 'le pricing dynamique', contrat: 'des modèles de contrats', facture: 'des modèles de factures', occupation: 'le taux d\\'occupation', commission: 'les commissions Airbnb', channel_manager: 'les channel managers' };
    const enomiaTopicMap = {
      'loi-le-meur-airbnb': 'la loi Le Meur (changements 2025 pour les meublés touristiques)',
      'fiscalite-airbnb': 'la fiscalité LMNP / Airbnb',
      'taux-occupation-par-ville': 'les statistiques de taux d\\'occupation par ville',
      'pricing-airbnb-tarif-dynamique': 'la tarification dynamique',
      'tarif-conciergerie-airbnb': 'le comparateur de tarifs conciergerie',
      'simulateur-rentabilite-airbnb': 'notre simulateur de rentabilité',
      'louer-airbnb-rentable': 'la rentabilité Airbnb',
      'facture-airbnb': 'notre générateur de factures',
      'contrat-airbnb': 'notre générateur de contrats',
    };
    const slug = urlEnomia.split('/').pop();
    const enomiaTopic = enomiaTopicMap[slug] || slug.replace(/-/g, ' ');
    const isPivot = competing.length && !urlEnomia.includes('simulateur-rentabilite');
    const context = isPivot
      ? 'Je vois que vous proposez déjà ' + (competing.map(t => topicLabels[t]).filter(Boolean).join(' et ')) + '. Du coup je ne vais pas vous parler de notre simulateur — j\\'ai plutôt pensé à un angle complémentaire : ' + enomiaTopic + '.\\n\\nÉchange croisé concret :\\n\\n'
      : 'Pertinent pour notre audience (propriétaires Airbnb). Échange croisé concret :\\n\\n';
    return salut + '\\n\\n' +
      "Marc, fondateur d'Enomia (enomia.app, simulateur de rentabilité Airbnb pour propriétaires de meublés touristiques).\\n\\n" +
      'Je suis tombé sur votre article :\\n' + urlExterne + '\\n\\n' +
      context +
      '→ Côté Enomia : on ajoute un lien naturel vers votre article depuis cette page :\\n  ' + urlEnomia + '\\n' +
      '→ Côté vous : vous ajoutez un lien naturel vers cette même page Enomia depuis votre article ci-dessus.\\n\\n' +
      'Ça vous parle ?\\n\\nMarc Chenut\\nenomia.app';
  }

  if (tag === 'conciergerie') {
    const ficheVille = p.notes?.match(/enomia\\.app\\/conciergerie-airbnb\\/[^\\s.]+/)?.[0];
    const ficheUrl = p.fiche_enomia || (ficheVille ? ('https://www.' + ficheVille) : urlEnomia);
    return salut + '\\n\\n' +
      "Marc, fondateur d'Enomia (enomia.app, simulateur de rentabilité Airbnb).\\n\\n" +
      'Vous êtes référencée sur notre page conciergeries de votre ville :\\n' + ficheUrl + '\\n\\n' +
      "Je propose un échange concret :\\n\\n" +
      '→ Côté Enomia : depuis votre fiche conciergerie (page ci-dessus), on ajoute un lien naturel vers un article précis de votre blog. Lequel performerait le mieux selon vous ?\\n' +
      '→ Côté vous : vous ajoutez un lien depuis cet article vers cette ressource Enomia :\\n  ' + urlEnomia + '\\n\\n' +
      "Les deux audiences se complètent (propriétaires cherchant gestion vs propriétaires cherchant à louer rentablement).\\n\\n" +
      'Ça vous parle ?\\n\\nMarc Chenut\\nenomia.app';
  }

  // Default (annuaire, outil, autre)
  if (urlExterne) {
    return salut + '\\n\\n' +
      "Marc, fondateur d'Enomia (enomia.app, simulateur de rentabilité Airbnb gratuit).\\n\\n" +
      'Je suis tombé sur cette page de votre site :\\n' + urlExterne + '\\n\\n' +
      "Audience compatible avec la nôtre (propriétaires Airbnb). Échange croisé envisageable :\\n\\n" +
      '→ Côté Enomia : on linke votre page depuis ' + urlEnomia + '\\n' +
      "→ Côté vous : vous linkez la même page Enomia depuis votre page ci-dessus.\\n\\n" +
      'Ça vous parle ?\\n\\nMarc Chenut\\nenomia.app';
  }

  return salut + '\\n\\n' +
    "Marc, fondateur d'Enomia (enomia.app).\\n\\n" +
    '[Échange croisé à personnaliser selon le site]\\n\\n' +
    'Marc Chenut\\nenomia.app';
}

window.buildEmail = buildEmail;

const stats = {
  total: PROSPECTS.length,
  pret: PROSPECTS.filter(p => p.status === 'pitch_pret_a_envoyer').length,
  enrichir: PROSPECTS.filter(p => p.status === 'a_enrichir').length,
  envoye: PROSPECTS.filter(p => p.status === 'envoye').length,
  accepte: PROSPECTS.filter(p => p.status === 'accepte').length,
  qualif: PROSPECTS.filter(p => p.status === 'a_qualifier').length,
  conciergerie: PROSPECTS.filter(p => tagOf(p) === 'conciergerie').length,
  blog: PROSPECTS.filter(p => tagOf(p) === 'blog').length,
};
document.getElementById('stats').innerHTML = [
  ['Total actifs', stats.total, 'var(--cyan)'],
  ['🎯 Prêts à envoyer', stats.pret, 'var(--orange)'],
  ['🔍 À enrichir', stats.enrichir, 'var(--purple)'],
  ['Envoyés', stats.envoye, 'var(--blue)'],
  ['Acceptés', stats.accepte, 'var(--green)'],
  ['À qualifier', stats.qualif, 'var(--cyan)'],
  ['Conciergeries', stats.conciergerie, 'var(--green)'],
  ['Blogs', stats.blog, 'var(--blue)'],
].map(([l, v, c]) => '<div class="stat-card"><div class="v" style="color:' + c + '">' + v + '</div><div class="l">' + l + '</div></div>').join('');

// Encode for HTML attribute (single quotes safe)
function attrEnc(s) {
  return (s || '').replace(/&/g, '&amp;').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
}

// Table prêts à envoyer (pitch_pret_a_envoyer + a_enrichir si déjà enrichis)
const prios = PROSPECTS.filter(p => p.status === 'pitch_pret_a_envoyer' || (p.status === 'a_enrichir' && p.kws_match?.[0]?.url))
  .sort((a, b) => (b.organic_traffic || 0) - (a.organic_traffic || 0));

document.getElementById('tbody-prio').innerHTML = prios.map(p => {
  const tag = tagOf(p);
  const urlExt = p.url_externe_cible || (p.kws_match?.[0]?.url) || '';
  const urlEnomia = p.url_cible_enomia || '';
  const mail = buildEmail(p);
  const mailEnc = attrEnc(mail);
  const emailCell = p.email
    ? '<div>' + p.email + '<br><button class="copy-btn" onclick="copyToClipboard(\\'' + p.email + '\\', this)">📋 mail</button></div>'
    : '<span class="small">via<br>formulaire</span>';
  const externeCell = urlExt
    ? '<a href="' + urlExt + '" target="_blank">' + shortenUrl(urlExt) + '</a><br><button class="copy-btn" onclick="copyToClipboard(\\'' + urlExt + '\\', this)">📋</button>'
    : '<span class="small">' + (p.article_cible || 'à identifier') + '</span>';
  const competing = (p.competing_topics || []);
  const competingCell = competing.length
    ? competing.map(t => '<span class="badge tag-autre" style="font-size:9px">' + t.replace(/_/g, ' ') + '</span>').join(' ')
    : '<span class="small">—</span>';
  const enomiaCell = '<a href="' + urlEnomia + '" target="_blank">' + shortenUrl(urlEnomia) + '</a><br><button class="copy-btn" onclick="copyToClipboard(\\'' + urlEnomia + '\\', this)">📋</button>';
  return '<tr>' +
    '<td><strong>' + (p.nom_entreprise || '') + '</strong><br><a href="' + p.site + '" target="_blank" class="small">' + shortenUrl(p.site) + '</a><br><span class="badge tag-' + tag + '">' + tag + '</span></td>' +
    '<td>' + (p.prenom_contact ? '<strong>' + p.prenom_contact + '</strong>' : '<span class="small">—</span>') + '</td>' +
    '<td>' + emailCell + '</td>' +
    '<td class="url-cell">' + externeCell + '</td>' +
    '<td>' + competingCell + '</td>' +
    '<td class="url-cell">' + enomiaCell + '</td>' +
    '<td><button class="copy-mail-btn" data-mail="' + mailEnc + '" onclick="copyToClipboard(this.dataset.mail, this)">📧 Copier mail</button>' +
    '<details class="mail-details"><summary>Aperçu</summary><pre>' + (mail || '').replace(/</g, '&lt;') + '</pre></details></td>' +
    '</tr>';
}).join('');

// Filtres + table all
const allTags = [...new Set(PROSPECTS.map(tagOf))];
const allStatuses = [...new Set(PROSPECTS.map(p => p.status || 'a_qualifier'))];
document.getElementById('filters').innerHTML = ['all', ...allTags, '|', ...allStatuses].map(f => {
  if (f === '|') return '<span style="color:var(--border)">·</span>';
  const isStatus = allStatuses.includes(f);
  const count = f === 'all' ? PROSPECTS.length :
    isStatus ? PROSPECTS.filter(p => p.status === f).length :
    PROSPECTS.filter(p => tagOf(p) === f).length;
  return '<button class="filter-btn" data-filter="' + f + '" data-type="' + (isStatus ? 'status' : 'tag') + '">' +
    (f === 'all' ? 'Tous (' + count + ')' : f.replace(/_/g, ' ') + ' (' + count + ')') + '</button>';
}).join('');
document.querySelector('.filter-btn[data-filter="all"]').classList.add('active');

function renderAll(filter, type) {
  let list = PROSPECTS;
  if (filter !== 'all') {
    if (type === 'status') list = PROSPECTS.filter(p => p.status === filter);
    else list = PROSPECTS.filter(p => tagOf(p) === filter);
  }
  list.sort((a, b) => (b.organic_traffic || 0) - (a.organic_traffic || 0));
  document.getElementById('tbody-all').innerHTML = list.slice(0, 500).map(p => {
    const tag = tagOf(p);
    const status = p.status || 'a_qualifier';
    const urlExt = p.url_externe_cible || (p.kws_match?.[0]?.url) || p.site;
    const urlEnomia = p.url_cible_enomia || '';
    const traffic = p.organic_traffic !== undefined ? (p.organic_traffic + '/mo') : '<span class="small">?</span>';
    return '<tr>' +
      '<td><strong>' + (p.nom_entreprise || '') + '</strong><br><a href="' + p.site + '" target="_blank" class="small">' + shortenUrl(p.site) + '</a></td>' +
      '<td><span class="badge tag-' + tag + '">' + tag + '</span></td>' +
      '<td><span class="badge s-' + status + '">' + status.replace(/_/g, ' ') + '</span></td>' +
      '<td class="traffic">' + traffic + '</td>' +
      '<td class="small">' + (p.kw_principal || '—') + '</td>' +
      '<td class="url-cell"><a href="' + urlExt + '" target="_blank">' + shortenUrl(urlExt, 30) + '</a></td>' +
      '<td class="url-cell"><a href="' + urlEnomia + '" target="_blank">' + shortenUrl(urlEnomia, 30) + '</a></td>' +
      '<td>' + (p.email ? '<a href="mailto:' + p.email + '">' + shortenUrl(p.email, 25) + '</a>' : '<span class="small">—</span>') + '</td>' +
      '</tr>';
  }).join('');
}
renderAll('all', null);
document.querySelectorAll('.filter-btn').forEach(btn => btn.addEventListener('click', e => {
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  e.target.classList.add('active');
  renderAll(e.target.dataset.filter, e.target.dataset.type);
}));
</script>
</body>
</html>`;

fs.writeFileSync(path.join(ROOT, '.claude/backlinks.html'), html);
console.log(`✅ .claude/backlinks.html régénéré`);
console.log(`   ${activeProspects.length} prospects actifs affichés`);
console.log(`   ${rejectedCount} rejetés masqués (rejete_trop_gros / rejete_non_pertinent / exclu_trop_gros)`);
