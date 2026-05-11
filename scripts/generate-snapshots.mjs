#!/usr/bin/env node
// Génère .claude/acquisition.html depuis les sources du code.
// Sources : scripts/city-backlog.json + src/data/cities-rentabilite.ts
//           + src/content/blog/*.mdoc + src/content/blog-backlog/*.mdoc
//           + scripts/publication-order.md (volumes SEMrush par article)
// Usage : node scripts/generate-snapshots.mjs

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ============================================================
// 1. CONCIERGERIES — fusion city-backlog.json + city-backlog-extra.json (villes prod)
// ============================================================
const concDataMain = JSON.parse(fs.readFileSync(path.join(ROOT, 'scripts/city-backlog.json'), 'utf8'));
const concExtraPath = path.join(ROOT, 'scripts/city-backlog-extra.json');
const concDataExtra = fs.existsSync(concExtraPath)
  ? JSON.parse(fs.readFileSync(concExtraPath, 'utf8'))
  : [];

// Fusion : extra ajoute des villes (publiées prod, absentes du backlog SEMrush initial)
const concData = [...concDataMain, ...concDataExtra];

const concList = concData
  .map(c => {
    // Règle vol=0 → vol=10, kd=0
    const vol = c.vol === 0 ? 10 : c.vol;
    const kd = c.vol === 0 ? 0 : (c.kd ?? null);
    return { n: c.num, v: c.ville, vol, kd, s: c.status, url: c.newUrl, volEstimated: c.vol === 0 };
  })
  .sort((a, b) => b.vol - a.vol);

const concStats = {
  total: concList.length,
  published: concList.filter(c => c.s === 'Publié').length,
  review: concList.filter(c => c.s === 'En attente review').length,
  todo: concList.filter(c => c.s === 'À faire').length,
  volTotal: concList.reduce((a, c) => a + c.vol, 0),
  volCovered: concList.filter(c => c.s === 'Publié').reduce((a, c) => a + c.vol, 0),
};
concStats.volRemaining = concStats.volTotal - concStats.volCovered;
concStats.percentCovered = Math.round((concStats.volCovered / concStats.volTotal) * 100);

// ============================================================
// 2. RENTABILITÉ — parse src/data/cities-rentabilite.ts
//    + lecture du CSV SEMrush (data/semrush-villes/) pour les volumes par ville
// ============================================================

// 2a. Charger le CSV SEMrush le plus récent (volume cumulé + KD max par ville sur 7 templates)
function loadSemrushVolumes() {
  const dir = path.join(ROOT, 'data/semrush-villes');
  if (!fs.existsSync(dir)) return {};

  let csvFile = null;
  const subdirs = fs.readdirSync(dir).filter(f => fs.statSync(path.join(dir, f)).isDirectory());
  for (const sub of subdirs.sort().reverse()) {
    const files = fs.readdirSync(path.join(dir, sub)).filter(f => f.endsWith('.csv'));
    if (files.length) { csvFile = path.join(dir, sub, files[0]); break; }
  }
  if (!csvFile) return {};

  const csv = fs.readFileSync(csvFile, 'utf8');
  const lines = csv.split('\n').slice(1).filter(Boolean);
  const dataByVille = {};
  for (const line of lines) {
    const cols = line.split(';');
    if (cols.length < 5) continue;
    const ville = cols[1].trim();
    const vol = parseInt(cols[3], 10) || 0;
    const kd = parseInt(cols[4], 10) || 0;
    if (!dataByVille[ville]) dataByVille[ville] = { vol: 0, kd: 0 };
    dataByVille[ville].vol += vol;
    if (kd > dataByVille[ville].kd) dataByVille[ville].kd = kd;  // KD max
  }
  return { dataByVille, csvFile };
}

const { dataByVille: rentDataByVille = {}, csvFile: rentCsvFile } = loadSemrushVolumes();

const rentContent = fs.readFileSync(path.join(ROOT, 'src/data/cities-rentabilite.ts'), 'utf8');

// Extraction par bloc ville (entre 2 accolades de premier niveau dans le tableau)
const cityBlockRegex = /\{\s*slug:\s*'([^']+)',[\s\S]*?(?=^\s{2}\},)/gm;
const rentList = [];

for (const block of rentContent.matchAll(cityBlockRegex)) {
  const text = block[0];
  // Ancrage sur début de ligne avec indent pour éviter de matcher status dans regulation: { status: 'tendu', ... }
  const get = (key, isNum = false) => {
    const r = new RegExp(`^\\s+${key}:\\s*'?([^,\\n'}]+)'?`, 'm');
    const m = text.match(r);
    return m ? (isNum ? parseFloat(m[1]) : m[1].trim()) : null;
  };
  const slug = block[1];
  const name = get('name');
  const status = get('status');
  const publishAt = get('publishAt');

  // Rendements net (dans t2: { ... rendementNetMin: X, rendementNetMax: Y })
  const t2Match = text.match(/t2:\s*\{([^}]+)\}/);
  let rendMin = null, rendMax = null, occMin = null, occMax = null, caMin = null, caMax = null;
  if (t2Match) {
    const t2 = t2Match[1];
    const rmin = t2.match(/rendementNetMin:\s*([\d.]+)/);
    const rmax = t2.match(/rendementNetMax:\s*([\d.]+)/);
    const omin = t2.match(/occupancyMin:\s*(\d+)/);
    const omax = t2.match(/occupancyMax:\s*(\d+)/);
    const camin = t2.match(/caAnnualMin:\s*(\d+)/);
    const camax = t2.match(/caAnnualMax:\s*(\d+)/);
    if (rmin) rendMin = parseFloat(rmin[1]);
    if (rmax) rendMax = parseFloat(rmax[1]);
    if (omin) occMin = parseInt(omin[1]);
    if (omax) occMax = parseInt(omax[1]);
    if (camin) caMin = parseInt(camin[1]);
    if (camax) caMax = parseInt(camax[1]);
  }

  // Regulation status
  const regMatch = text.match(/regulation:\s*\{\s*status:\s*'([^']+)'/);
  const regStatus = regMatch ? regMatch[1] : null;

  // Volume SEMrush cumulé + KD max (somme/max des 7 templates testés pour cette ville)
  const slugNormalized = name ? name.toLowerCase().replace(/[éèê]/g, 'e').replace(/[àâ]/g, 'a').replace(/['']/g, ' ').replace(/\s+/g, ' ').trim() : slug;
  const semData = rentDataByVille[slugNormalized] || rentDataByVille[slug] || { vol: 0, kd: 0 };
  // Règle décidée 2026-05-11 : si vol=0 → vol=10, KD=0 (estimation conservatrice)
  const vol = semData.vol === 0 ? 10 : semData.vol;
  const kd = semData.vol === 0 ? 0 : semData.kd;
  const volEstimated = semData.vol === 0;

  rentList.push({ slug, v: name, s: status, d: publishAt, rendMin, rendMax, occMin, occMax, caMin, caMax, regStatus, vol, kd, volEstimated });
}

const rentStats = {
  total: rentList.length,
  online: rentList.filter(r => r.s === 'en-ligne').length,
  draft: rentList.filter(r => r.s === 'brouillon').length,
  rendNetMoy: rentList.length
    ? (rentList.reduce((a, r) => a + ((r.rendMin || 0) + (r.rendMax || 0)) / 2, 0) / rentList.length).toFixed(1)
    : 0,
  volTotal: rentList.reduce((a, r) => a + r.vol, 0),
  volCovered: rentList.filter(r => r.s === 'en-ligne').reduce((a, r) => a + r.vol, 0),
};
rentStats.volRemaining = rentStats.volTotal - rentStats.volCovered;
rentStats.percentCovered = rentStats.volTotal ? Math.round((rentStats.volCovered / rentStats.volTotal) * 100) : 0;

// ============================================================
// 3. BLOG — src/content/blog/*.mdoc + blog-backlog/*.mdoc + volumes
// ============================================================
const blogDir = path.join(ROOT, 'src/content/blog');
const backlogDir = path.join(ROOT, 'src/content/blog-backlog');

function readFrontmatter(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const fm = m[1];
  const get = (key) => {
    const r = new RegExp(`^${key}:\\s*['"]?(.+?)['"]?\\s*$`, 'm');
    const mm = fm.match(r);
    return mm ? mm[1].trim().replace(/^['"]|['"]$/g, '') : null;
  };
  return {
    title: get('title'),
    status: get('status'),
    category: get('category'),
    articleType: get('articleType'),
    publishedAt: get('publishedAt'),
    updatedAt: get('updatedAt'),
  };
}

// Parse sitemap pour lastmod par URL
async function loadSitemapLastmods() {
  try {
    const res = await fetch('https://www.enomia.app/sitemap.xml');
    const xml = await res.text();
    const map = {};
    const blocks = xml.matchAll(/<url>([\s\S]*?)<\/url>/g);
    for (const b of blocks) {
      const loc = b[1].match(/<loc>([^<]+)<\/loc>/)?.[1];
      const lastmod = b[1].match(/<lastmod>([^<]+)<\/lastmod>/)?.[1];
      if (loc) map[loc] = lastmod || null;
    }
    return map;
  } catch (e) {
    return {};
  }
}
const sitemapLastmods = await loadSitemapLastmods();

// Parse cities.ts pour récupérer updatedAt par slug (conciergerie)
function parseCitiesUpdatedAt() {
  const filePath = path.join(ROOT, 'src/data/cities.ts');
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const cityRegex = /\{\s*slug:\s*'([^']+)',[\s\S]*?updatedAt:\s*'([^']+)'/g;
  const map = {};
  for (const m of content.matchAll(cityRegex)) {
    map[m[1]] = m[2];
  }
  return map;
}
const citiesUpdatedAt = parseCitiesUpdatedAt();

const blogFiles = fs.readdirSync(blogDir).filter(f => f.endsWith('.mdoc'));
const backlogFiles = fs.readdirSync(backlogDir).filter(f => f.endsWith('.mdoc'));

const blogArticles = blogFiles.map(f => {
  const slug = path.basename(f, '.mdoc');
  return { slug, ...readFrontmatter(path.join(blogDir, f)), location: 'blog' };
});
const backlogArticles = backlogFiles.map(f => {
  const slug = path.basename(f, '.mdoc');
  return { slug, ...readFrontmatter(path.join(backlogDir, f)), location: 'backlog', status: 'à publier' };
});
const allArticles = [...blogArticles, ...backlogArticles];

// Parse publication-order.md pour les volumes SEMrush
const pubOrder = fs.readFileSync(path.join(ROOT, 'scripts/publication-order.md'), 'utf8');
const volRegex = /\| (?:\*\*)?`([a-z0-9-]+)`(?:\*\*)?[^|]*\| [^|]+ \| ([\d+]+) \|/g;
const volumes = {};
let vmatch;
while ((vmatch = volRegex.exec(pubOrder)) !== null) {
  const slug = vmatch[1];
  const volStr = vmatch[2];
  const vol = volStr.includes('+')
    ? volStr.split('+').reduce((a, n) => a + parseInt(n), 0)
    : parseInt(volStr);
  if (!isNaN(vol)) volumes[slug] = vol;
}

// Charger les volumes des piliers déjà en ligne (depuis blog-volumes-en-ligne.json)
const blogVolEnLignePath = path.join(ROOT, 'scripts/blog-volumes-en-ligne.json');
const blogVolEnLigne = fs.existsSync(blogVolEnLignePath)
  ? JSON.parse(fs.readFileSync(blogVolEnLignePath, 'utf8'))
  : {};

// Charger l'analyse SERP (KD + top 3 concurrents)
const serpAnalysisPath = path.join(ROOT, 'scripts/semrush-serp-analysis.json');
const serpAnalysisArr = fs.existsSync(serpAnalysisPath)
  ? JSON.parse(fs.readFileSync(serpAnalysisPath, 'utf8'))
  : [];
const serpBySlug = {};
for (const s of serpAnalysisArr) {
  if (s.source === 'blog' && s.slug) serpBySlug[s.slug] = s;
}

// Charger les analytics GSC (impressions, clics, position, CTR)
const gscAnalyticsPath = path.join(ROOT, '.claude/gsc-tracking/analytics.json');
const gscAnalytics = fs.existsSync(gscAnalyticsPath)
  ? JSON.parse(fs.readFileSync(gscAnalyticsPath, 'utf8'))
  : { byUrl: {} };

// Charger les statuts d'indexation GSC
const gscIndexPath = path.join(ROOT, '.claude/gsc-tracking/index-status.json');
const gscIndex = fs.existsSync(gscIndexPath)
  ? JSON.parse(fs.readFileSync(gscIndexPath, 'utf8'))
  : { byUrl: {} };

// Helpers pour matcher URL prod (avec et sans trailing slash)
function gscDataFor(prodUrl) {
  const urls = [prodUrl, prodUrl.replace(/\/$/, ''), prodUrl + '/'];
  for (const u of urls) {
    if (gscAnalytics.byUrl[u]) return { analytics: gscAnalytics.byUrl[u], indexed: gscIndex.byUrl[u] };
  }
  return { analytics: null, indexed: gscIndex.byUrl[prodUrl] || null };
}

// Heuristique difficulté SEO depuis KD (fallback car API backlinks indisponible)
// Pour un site de DR moyen comme Enomia :
//   KD < 20  : Faible       — contenu de qualité suffit
//   KD 20-35 : Modérée      — contenu solide OK, backlinks bonus
//   KD 35-50 : Élevée       — contenu + backlinks ciblés nécessaires
//   KD 50+   : Très élevée  — gros investissement backlinks + DR
function difficultyFromKd(kd) {
  if (!kd && kd !== 0) return null;
  if (kd < 20) return 'Faible';
  if (kd < 35) return 'Modérée';
  if (kd < 50) return 'Élevée';
  return 'Très élevée';
}

// Annoter chaque article avec son volume + KD + difficulté SEO + GSC data
allArticles.forEach(a => {
  a.vol = volumes[a.slug] || (blogVolEnLigne[a.slug]?.vol) || (serpBySlug[a.slug]?.vol) || 0;
  a.kd = (blogVolEnLigne[a.slug]?.kd) || (serpBySlug[a.slug]?.kd) || null;
  a.difficulty = difficultyFromKd(a.kd);
  a.top3 = serpBySlug[a.slug]?.top3?.slice(0, 3).map(s => s.domain) || [];
  // GSC data (matching par URL prod)
  const prodUrl = `https://www.enomia.app/blog/${a.slug}`;
  const gsc = gscDataFor(prodUrl);
  a.gscAnalytics = gsc.analytics;
  a.gscIndex = gsc.indexed;
});

// Charger tools-volumes.json (vol + kd par URL outil)
const toolsVolPath = path.join(ROOT, 'scripts/tools-volumes.json');
const toolsVolumes = fs.existsSync(toolsVolPath)
  ? JSON.parse(fs.readFileSync(toolsVolPath, 'utf8'))
  : {};

// Construire toolsList depuis index-status.json (pages outils + hubs + régions)
const toolsList = [];
for (const [url, data] of Object.entries(gscIndex.byUrl || {})) {
  if (['tool', 'hub', 'home', 'conc-region'].includes(data.source)) {
    const tvol = toolsVolumes[url] || {};
    const vol = tvol.vol === 0 ? 10 : (tvol.vol || 0);
    const kd = tvol.vol === 0 ? 0 : (tvol.kd ?? null);
    toolsList.push({
      url,
      source: data.source,
      slug: data.slug,
      verdict: data.verdict,
      coverageState: data.coverageState,
      lastmod: sitemapLastmods[url] || null,
      vol,
      kd,
      kw: tvol.kw,
      volEstimated: (tvol.vol === 0 || tvol.vol === undefined),
      gscAnalytics: gscAnalytics.byUrl[url] || gscAnalytics.byUrl[url.replace(/\/$/, '')] || gscAnalytics.byUrl[url + '/'] || null,
    });
  }
}

// GSC data pour villes conciergeries et rentabilité + dates MAJ
concList.forEach(c => {
  const prodUrl = `https://www.enomia.app${c.url}`;
  const gsc = gscDataFor(prodUrl);
  c.gscAnalytics = gsc.analytics;
  c.gscIndex = gsc.indexed;
  // updatedAt depuis cities.ts (slug = c.url segment final)
  const slug = c.url.split('/').pop();
  c.updatedAt = citiesUpdatedAt[slug] || sitemapLastmods[prodUrl] || null;
});

rentList.forEach(r => {
  const prodUrl = `https://www.enomia.app/rentabilite-airbnb/${r.slug}`;
  const gsc = gscDataFor(prodUrl);
  r.gscAnalytics = gsc.analytics;
  r.gscIndex = gsc.indexed;
  r.updatedAt = sitemapLastmods[prodUrl] || null;
});

// Grouper par cluster (= category)
const blogCategories = {};
allArticles.forEach(a => {
  const cat = a.category || 'autre';
  if (!blogCategories[cat]) blogCategories[cat] = [];
  blogCategories[cat].push(a);
});

// Trier articles par volume desc dans chaque cluster
Object.keys(blogCategories).forEach(cat => {
  blogCategories[cat].sort((a, b) => b.vol - a.vol);
});

const blogStats = {
  total: allArticles.length,
  online: allArticles.filter(a => a.status === 'en-ligne').length,
  draft: allArticles.filter(a => a.status === 'brouillon').length,
  todo: allArticles.filter(a => a.status === 'à publier').length,
  volTotal: allArticles.reduce((a, b) => a + b.vol, 0),
  volCovered: allArticles.filter(a => a.status === 'en-ligne').reduce((acc, b) => acc + b.vol, 0),
};
blogStats.volRemaining = blogStats.volTotal - blogStats.volCovered;
blogStats.percentCovered = blogStats.volTotal ? Math.round((blogStats.volCovered / blogStats.volTotal) * 100) : 0;

// Stats par cluster (vol total + vol couvert)
const blogClusterStats = {};
Object.entries(blogCategories).forEach(([cat, arts]) => {
  const volTotal = arts.reduce((a, b) => a + b.vol, 0);
  const volCovered = arts.filter(a => a.status === 'en-ligne').reduce((a, b) => a + b.vol, 0);
  blogClusterStats[cat] = {
    total: arts.length,
    online: arts.filter(a => a.status === 'en-ligne').length,
    draft: arts.filter(a => a.status === 'brouillon').length,
    todo: arts.filter(a => a.status === 'à publier').length,
    volTotal,
    volCovered,
    volRemaining: volTotal - volCovered,
    percentCovered: volTotal ? Math.round((volCovered / volTotal) * 100) : 0,
  };
});

// ============================================================
// 4. GENERATE HTML
// ============================================================
const dateGen = new Date().toISOString().slice(0, 16).replace('T', ' ');

const fmt = (n) => n.toLocaleString('fr-FR');

// Labels lisibles pour catégories
const catLabel = {
  'chiffres-rentabilite': '💰 Rentabilité & Chiffres',
  'fiscal-juridique': '⚖️ Fiscalité & Juridique',
  'outils-automatisation': '🔧 Outils & Automatisation',
  'gestion': '🤝 Gestion & Conciergerie',
  'formations': '🎓 Formations',
  'autre': '📦 Autre',
};

const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Acquisition Enomia — Vue unifiée</title>
<style>
  :root {
    --bg: #0d1117; --bg-card: #161b22; --bg-card-hover: #1c2330;
    --border: #30363d; --text: #e6edf3; --text-dim: #8b949e; --text-faint: #6e7681;
    --green: #3fb950; --yellow: #d29922; --red: #f85149; --blue: #58a6ff;
    --purple: #bc8cff; --pink: #ff7eb6; --orange: #ff9500; --cyan: #76e3ea;
  }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: var(--bg); color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif;
    line-height: 1.5; scroll-behavior: smooth; }
  .container { max-width: 1400px; margin: 0 auto; padding: 48px 32px 80px; }
  header { text-align: center; margin-bottom: 48px; padding-bottom: 28px; border-bottom: 1px solid var(--border); }
  header h1 { font-size: 38px; margin: 0 0 10px; font-weight: 700; letter-spacing: -0.5px; }
  header .subtitle { color: var(--text-dim); font-size: 16px; margin: 0 0 12px; }
  header .meta { color: var(--text-faint); font-size: 13px; font-family: ui-monospace, 'SF Mono', monospace; }

  .hero-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 56px; }
  @media (max-width: 1100px) { .hero-cards { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 700px) { .hero-cards { grid-template-columns: 1fr; } }
  .hero-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px;
    padding: 28px; text-decoration: none; color: var(--text); display: block; cursor: pointer;
    transition: all 0.2s ease; position: relative; overflow: hidden; }
  .hero-card:hover { background: var(--bg-card-hover); transform: translateY(-3px); border-color: var(--accent); }
  .hero-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: var(--accent); }
  .hero-card[data-color="green"] { --accent: var(--green); }
  .hero-card[data-color="purple"] { --accent: var(--purple); }
  .hero-card[data-color="orange"] { --accent: var(--orange); }
  .hero-card[data-color="cyan"] { --accent: var(--cyan); }
  .hero-card h2 { margin: 0 0 4px; font-size: 20px; font-weight: 600; display: flex; align-items: center; gap: 10px; }
  .hero-card .tagline { color: var(--text-dim); font-size: 13px; margin: 0 0 16px; }
  .progress-bar { background: rgba(255,255,255,0.05); border-radius: 6px; height: 8px; overflow: hidden; margin: 8px 0 12px; }
  .progress-bar-fill { height: 100%; background: var(--accent); transition: width 0.3s ease; }
  .hero-card .kpis { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 14px; font-size: 12px; }
  .hero-card .kpi { color: var(--text-dim); }
  .hero-card .kpi strong { color: var(--text); font-size: 14px; }
  .hero-card .stats { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 16px; }
  .hero-card .stat { flex: 1; min-width: 70px; }
  .hero-card .stat .num { font-size: 24px; font-weight: 700; color: var(--accent); display: block; line-height: 1; }
  .hero-card .stat .label { font-size: 10px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 3px; }
  .hero-card .cta { color: var(--accent); font-size: 13px; font-weight: 600; }

  section.detail { margin-bottom: 56px; scroll-margin-top: 24px; }
  section.detail h2 { font-size: 26px; margin: 0 0 8px; font-weight: 700; display: flex; align-items: center; gap: 12px;
    padding-bottom: 14px; border-bottom: 2px solid var(--accent); }
  section.detail[data-color="green"] { --accent: var(--green); }
  section.detail[data-color="purple"] { --accent: var(--purple); }
  section.detail[data-color="orange"] { --accent: var(--orange); }
  section.detail[data-color="cyan"] { --accent: var(--cyan); }
  section.detail .section-meta { color: var(--text-dim); font-size: 14px; margin: 0 0 20px; }

  .kpi-banner { display: flex; gap: 24px; flex-wrap: wrap; background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 10px; padding: 16px 22px; margin-bottom: 20px; }
  .kpi-item { display: flex; flex-direction: column; }
  .kpi-item .v { font-size: 22px; font-weight: 700; color: var(--accent); line-height: 1; }
  .kpi-item .l { font-size: 11px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 4px; }

  .filters { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
  .filter-btn { background: var(--bg-card); border: 1px solid var(--border); color: var(--text-dim);
    padding: 6px 14px; border-radius: 20px; font-size: 12px; cursor: pointer; font-family: inherit; transition: all 0.15s ease; }
  .filter-btn:hover { color: var(--text); border-color: var(--text-faint); }
  .filter-btn.active { background: var(--accent); color: var(--bg); border-color: var(--accent); font-weight: 600; }

  /* Tableau full-width */
  .data-table { width: 100%; border-collapse: collapse; font-size: 13px; background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
  .data-table thead th { position: sticky; top: 0; background: var(--bg-card); padding: 12px; text-align: left;
    border-bottom: 2px solid var(--border); font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-dim); white-space: nowrap; }
  .data-table tbody td { padding: 9px 12px; border-bottom: 1px solid var(--border); }
  .data-table tbody tr:last-child td { border-bottom: none; }
  .data-table tbody tr:hover { background: var(--bg-card-hover); }
  .data-table .num { font-family: ui-monospace, monospace; text-align: right; color: var(--text); }
  .data-table .num-dim { font-family: ui-monospace, monospace; text-align: right; color: var(--text-faint); }
  .data-table .name-cell { font-weight: 500; }
  .data-table .slug-cell { font-family: ui-monospace, monospace; font-size: 12px; }
  .data-table th[data-col="vol"], .data-table td[data-col="vol"],
  .data-table th[data-col="kd"], .data-table td[data-col="kd"],
  .data-table th[data-col="impr"], .data-table td[data-col="impr"],
  .data-table th[data-col="clic"], .data-table td[data-col="clic"],
  .data-table th[data-col="pos"], .data-table td[data-col="pos"],
  .data-table th[data-col="date"], .data-table td[data-col="date"] { text-align: right; }
  .data-table .date-cell { font-family: ui-monospace, monospace; font-size: 11px; color: var(--text-faint); text-align: right; white-space: nowrap; }

  .badge { font-size: 10px; padding: 3px 8px; border-radius: 8px; text-transform: uppercase;
    letter-spacing: 0.5px; font-weight: 600; white-space: nowrap; }
  .badge.online, .badge.published { background: rgba(63, 185, 80, 0.15); color: var(--green); }
  .badge.draft { background: rgba(210, 153, 34, 0.15); color: var(--yellow); }
  .badge.review { background: rgba(188, 140, 255, 0.15); color: var(--purple); }
  .badge.todo { background: rgba(248, 81, 73, 0.12); color: var(--red); }
  .badge.pilier { background: rgba(255, 149, 0, 0.15); color: var(--orange); }
  .badge.satellite { background: rgba(118, 227, 234, 0.12); color: var(--cyan); }

  .cluster { margin-bottom: 28px; background: var(--bg-card); border: 1px solid var(--border);
    border-radius: 10px; padding: 18px 20px; }
  .cluster-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; flex-wrap: wrap; gap: 10px; }
  .cluster-title { font-size: 16px; font-weight: 600; margin: 0; }
  .cluster-stats { display: flex; gap: 12px; font-size: 12px; color: var(--text-dim); }
  .cluster-stat strong { color: var(--text); font-weight: 600; }
  .cluster-progress { margin: 6px 0 14px; }
  .articles-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 8px; }
  .article-card { background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 6px;
    padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; gap: 10px; }
  .article-info { flex: 1; min-width: 0; }
  .article-slug { font-family: ui-monospace, monospace; font-size: 12px; color: var(--text); margin: 0; word-break: break-word; }
  .article-vol { font-size: 10px; color: var(--text-faint); font-family: ui-monospace, monospace; margin: 2px 0 0; }
  .article-tags { display: flex; gap: 5px; flex-shrink: 0; flex-wrap: wrap; }

  nav.sticky { position: sticky; top: 0; background: rgba(13, 17, 23, 0.95); backdrop-filter: blur(10px);
    padding: 12px 0; margin: 0 -32px 32px; padding-left: 32px; padding-right: 32px;
    border-bottom: 1px solid var(--border); z-index: 10; display: flex; gap: 20px; align-items: center; flex-wrap: wrap; }
  nav.sticky a { color: var(--text-dim); text-decoration: none; font-size: 13px; font-weight: 500;
    padding: 6px 12px; border-radius: 6px; transition: all 0.15s ease; }
  nav.sticky a:hover { color: var(--text); background: var(--bg-card); }

  .footer { text-align: center; margin-top: 56px; padding-top: 20px; border-top: 1px solid var(--border);
    color: var(--text-faint); font-size: 12px; }
  .footer code { background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 4px; font-family: ui-monospace, monospace; }
</style>
</head>
<body>
<div class="container">

<header>
  <h1>📈 Acquisition Enomia</h1>
  <p class="subtitle">Vue unifiée des 3 chantiers · KPIs en ligne / volume couvert / volume restant</p>
  <p class="meta">Généré : ${dateGen} · <code>node scripts/generate-snapshots.mjs</code></p>
</header>

<nav class="sticky">
  <strong style="font-size:13px;color:var(--text);">Sections :</strong>
  <a href="#conciergeries">🏠 Conciergeries (${concStats.total})</a>
  <a href="#rentabilite">📊 Rentabilité (${rentStats.total})</a>
  <a href="#blog">📝 Blog (${blogStats.total})</a>
</nav>

<div class="hero-cards">
  <a href="#conciergeries" class="hero-card" data-color="green">
    <h2>🏠 Conciergeries</h2>
    <p class="tagline">Pages /conciergerie-airbnb/[région]/[ville]</p>
    <div class="progress-bar"><div class="progress-bar-fill" style="width: ${concStats.percentCovered}%"></div></div>
    <div class="kpis">
      <span class="kpi"><strong>${fmt(concStats.volCovered)}</strong> vol/mois couvert</span>
      <span class="kpi"><strong>${fmt(concStats.volRemaining)}</strong> à couvrir</span>
      <span class="kpi"><strong>${concStats.percentCovered}%</strong> du potentiel</span>
    </div>
    <div class="stats">
      <div class="stat"><span class="num">${concStats.published}</span><div class="label">Publiées</div></div>
      <div class="stat"><span class="num">${concStats.review}</span><div class="label">Review</div></div>
      <div class="stat"><span class="num">${concStats.todo}</span><div class="label">À faire</div></div>
    </div>
    <p class="cta">Voir les ${concStats.total} villes ↓</p>
  </a>

  <a href="#rentabilite" class="hero-card" data-color="purple">
    <h2>📊 Rentabilité</h2>
    <p class="tagline">Pages /rentabilite-airbnb/[ville]</p>
    <div class="progress-bar"><div class="progress-bar-fill" style="width: ${rentStats.percentCovered}%"></div></div>
    <div class="kpis">
      <span class="kpi"><strong>${fmt(rentStats.volCovered)}</strong> vol/mois couvert</span>
      <span class="kpi"><strong>${fmt(rentStats.volRemaining)}</strong> à couvrir</span>
      <span class="kpi"><strong>${rentStats.percentCovered}%</strong> du potentiel</span>
    </div>
    <div class="stats">
      <div class="stat"><span class="num">${rentStats.online}</span><div class="label">En ligne</div></div>
      <div class="stat"><span class="num">${rentStats.draft}</span><div class="label">Brouillons</div></div>
      <div class="stat"><span class="num">2j</span><div class="label">Cron</div></div>
    </div>
    <p class="cta">Voir les ${rentStats.total} villes ↓</p>
  </a>

  <a href="#blog" class="hero-card" data-color="orange">
    <h2>📝 Blog</h2>
    <p class="tagline">Articles éditoriaux /blog/[slug]</p>
    <div class="progress-bar"><div class="progress-bar-fill" style="width: ${blogStats.percentCovered}%"></div></div>
    <div class="kpis">
      <span class="kpi"><strong>${fmt(blogStats.volCovered)}</strong> vol/mois couvert</span>
      <span class="kpi"><strong>${fmt(blogStats.volRemaining)}</strong> à couvrir</span>
      <span class="kpi"><strong>${blogStats.percentCovered}%</strong> du potentiel</span>
    </div>
    <div class="stats">
      <div class="stat"><span class="num">${blogStats.online}</span><div class="label">Publiés</div></div>
      <div class="stat"><span class="num">${blogStats.draft}</span><div class="label">Brouillons</div></div>
      <div class="stat"><span class="num">${blogStats.todo}</span><div class="label">À publier</div></div>
    </div>
    <p class="cta">Voir les ${blogStats.total} articles ↓</p>
  </a>

  <a href="#tools" class="hero-card" data-color="cyan">
    <h2>🔧 Outils & Hubs</h2>
    <p class="tagline">Pages outils, hubs, régions</p>
    <div class="stats">
      <div class="stat"><span class="num" id="tools-count-num">—</span><div class="label">Pages</div></div>
    </div>
    <p class="cta">Voir les pages outils ↓</p>
  </a>
</div>

<!-- SECTION CONCIERGERIES -->
<section class="detail" id="conciergeries" data-color="green">
  <h2>🏠 Conciergeries villes</h2>
  <p class="section-meta">${concStats.total} villes identifiées via SEMrush · ${fmt(concStats.volTotal)} vol/mois cumulé · Trié par volume desc</p>

  <div class="kpi-banner">
    <div class="kpi-item"><span class="v">${fmt(concStats.volCovered)}</span><span class="l">Vol couvert (publiées)</span></div>
    <div class="kpi-item"><span class="v">${fmt(concStats.volRemaining)}</span><span class="l">Vol à couvrir</span></div>
    <div class="kpi-item"><span class="v">${concStats.percentCovered}%</span><span class="l">% du potentiel</span></div>
    <div class="kpi-item"><span class="v">${concStats.published}/${concStats.total}</span><span class="l">Villes publiées</span></div>
  </div>

  <div class="filters">
    <button class="filter-btn active" data-filter="all" data-target="conc">Toutes (${concStats.total})</button>
    <button class="filter-btn" data-filter="Publié" data-target="conc">Publiées (${concStats.published})</button>
    <button class="filter-btn" data-filter="En attente review" data-target="conc">Review (${concStats.review})</button>
    <button class="filter-btn" data-filter="À faire" data-target="conc">À faire (${concStats.todo})</button>
  </div>

  <div id="grid-conc"></div>
</section>

<!-- SECTION RENTABILITÉ -->
<section class="detail" id="rentabilite" data-color="purple">
  <h2>📊 Rentabilité villes</h2>
  <p class="section-meta">${rentStats.total} villes · ${fmt(rentStats.volTotal)} vol/mois cumulé (cluster « rentabilité airbnb [ville] » + 6 templates SEMrush) · Cron auto 1/2 jours</p>

  <div class="kpi-banner">
    <div class="kpi-item"><span class="v">${fmt(rentStats.volCovered)}</span><span class="l">Vol couvert (en ligne)</span></div>
    <div class="kpi-item"><span class="v">${fmt(rentStats.volRemaining)}</span><span class="l">Vol à couvrir</span></div>
    <div class="kpi-item"><span class="v">${rentStats.percentCovered}%</span><span class="l">% du potentiel</span></div>
    <div class="kpi-item"><span class="v">${rentStats.online}/${rentStats.total}</span><span class="l">Villes en ligne</span></div>
  </div>

  <div class="filters">
    <button class="filter-btn active" data-filter="all" data-target="rent">Toutes (${rentStats.total})</button>
    <button class="filter-btn" data-filter="en-ligne" data-target="rent">En ligne (${rentStats.online})</button>
    <button class="filter-btn" data-filter="brouillon" data-target="rent">Brouillons (${rentStats.draft})</button>
  </div>

  <div id="grid-rent"></div>
</section>

<!-- SECTION PAGES OUTILS & HUBS -->
<section class="detail" id="tools" data-color="cyan">
  <h2>🔧 Pages outils, hubs & régions</h2>
  <p class="section-meta">Toutes les pages du sitemap hors articles blog et villes (conciergerie + rentabilité)</p>
  <div id="grid-tools"></div>
</section>

<!-- SECTION BLOG -->
<section class="detail" id="blog" data-color="orange">
  <h2>📝 Blog articles</h2>
  <p class="section-meta">${blogStats.total} articles · ${fmt(blogStats.volTotal)} vol/mois cumulé · Regroupés par cluster</p>

  <div class="kpi-banner">
    <div class="kpi-item"><span class="v">${fmt(blogStats.volCovered)}</span><span class="l">Vol couvert (en ligne)</span></div>
    <div class="kpi-item"><span class="v">${fmt(blogStats.volRemaining)}</span><span class="l">Vol à couvrir</span></div>
    <div class="kpi-item"><span class="v">${blogStats.percentCovered}%</span><span class="l">% du potentiel</span></div>
    <div class="kpi-item"><span class="v">${blogStats.online}/${blogStats.total}</span><span class="l">Articles en ligne</span></div>
  </div>

  <div id="blog-clusters"></div>
</section>

<div class="footer">
  <p>Régénéré via <code>node scripts/generate-snapshots.mjs</code> · Auto-sync GitHub via hook memory</p>
  <p><code>.claude/acquisition.html</code></p>
</div>

</div>

<script>
const CONC = ${JSON.stringify(concList)};
const RENT = ${JSON.stringify(rentList)};
const BLOG_CATS = ${JSON.stringify(blogCategories)};
const BLOG_STATS = ${JSON.stringify(blogClusterStats)};
const CAT_LABEL = ${JSON.stringify(catLabel)};
const TOOLS = ${JSON.stringify(toolsList || [])};

const fmt = n => (n === null || n === undefined) ? '—' : n.toLocaleString('fr-FR');

function indexIcon(idx) {
  if (!idx) return '<span style="opacity:0.3">—</span>';
  if (idx.verdict === 'PASS') return '✅';
  if (idx.verdict === 'FAIL') return '❌';
  if (idx.coverageState?.includes('unknown')) return '<span title="URL unknown to Google">🟡</span>';
  return '<span title="' + (idx.coverageState || idx.verdict || '?') + '">❓</span>';
}

function badgeHtml(status) {
  const map = {
    'Publié': ['published', 'Publié'],
    'En attente review': ['review', 'Review'],
    'À faire': ['todo', 'À faire'],
    'en-ligne': ['online', 'En ligne'],
    'brouillon': ['draft', 'Brouillon'],
    'à publier': ['todo', 'À publier'],
  };
  const [cls, label] = map[status] || ['', status];
  return \`<span class="badge \${cls}">\${label}</span>\`;
}

// ─── Conciergeries (table) ───────────────────────────────────────────
function renderConc(filter = 'all') {
  const grid = document.getElementById('grid-conc');
  const list = filter === 'all' ? [...CONC] : CONC.filter(c => c.s === filter);
  const order = { 'Publié': 0, 'En attente review': 1, 'À faire': 2 };
  list.sort((a, b) => (order[a.s] - order[b.s]) || (b.vol - a.vol));
  grid.innerHTML = \`<table class="data-table"><thead><tr>
    <th>Ville</th><th data-col="vol">Vol</th><th data-col="kd">KD</th><th>Status</th><th>Index</th>
    <th data-col="date">MAJ</th>
    <th data-col="impr">Impr</th><th data-col="clic">Clics</th><th data-col="pos">Pos</th>
  </tr></thead><tbody>\${list.map(c => {
    const a = c.gscAnalytics || {};
    const volStr = c.volEstimated ? \`<span title="vol mesuré 0, estimé à 10">\${fmt(c.vol)}*</span>\` : fmt(c.vol);
    return \`<tr>
      <td class="name-cell">\${c.v}</td>
      <td class="num">\${volStr}</td>
      <td class="num-dim">\${c.kd ?? '—'}</td>
      <td>\${badgeHtml(c.s)}</td>
      <td>\${indexIcon(c.gscIndex)}</td>
      <td class="date-cell">\${c.updatedAt || '—'}</td>
      <td class="num-dim">\${fmt(a.impressions)}</td>
      <td class="num-dim">\${fmt(a.clicks)}</td>
      <td class="num-dim">\${a.position ? a.position.toFixed(1) : '—'}</td>
    </tr>\`;
  }).join('')}</tbody></table>\`;
}

// ─── Rentabilité (table, en-ligne uniquement) ────────────────────────
function renderRent(filter = 'all') {
  const grid = document.getElementById('grid-rent');
  const onlineOnly = RENT.filter(c => c.s === 'en-ligne');
  onlineOnly.sort((a, b) => (b.vol || 0) - (a.vol || 0) || a.d.localeCompare(b.d));
  grid.innerHTML = \`<table class="data-table"><thead><tr>
    <th>Ville</th><th data-col="vol">Vol</th><th data-col="kd">KD</th>
    <th data-col="date">Publi</th><th data-col="date">MAJ</th>
    <th>Index</th>
    <th data-col="impr">Impr</th><th data-col="clic">Clics</th><th data-col="pos">Pos</th>
  </tr></thead><tbody>\${onlineOnly.map(c => {
    const a = c.gscAnalytics || {};
    const volStr = c.volEstimated ? \`<span title="vol mesuré 0, estimé à 10">\${fmt(c.vol)}*</span>\` : fmt(c.vol);
    return \`<tr>
      <td class="name-cell">\${c.v}</td>
      <td class="num">\${volStr}</td>
      <td class="num-dim">\${c.kd ?? '—'}</td>
      <td class="date-cell">\${c.d || '—'}</td>
      <td class="date-cell">\${c.updatedAt || '—'}</td>
      <td>\${indexIcon(c.gscIndex)}</td>
      <td class="num-dim">\${fmt(a.impressions)}</td>
      <td class="num-dim">\${fmt(a.clicks)}</td>
      <td class="num-dim">\${a.position ? a.position.toFixed(1) : '—'}</td>
    </tr>\`;
  }).join('')}</tbody></table>\`;
}

// ─── Blog (tables groupées par cluster) ──────────────────────────────
function renderBlog() {
  const container = document.getElementById('blog-clusters');
  const statusOrder = { 'en-ligne': 0, 'brouillon': 1, 'à publier': 2 };
  container.innerHTML = Object.entries(BLOG_CATS).map(([cat, articles]) => {
    articles.sort((a, b) => (statusOrder[a.status] - statusOrder[b.status]) || ((b.vol || 0) - (a.vol || 0)));
    const stats = BLOG_STATS[cat];
    const label = CAT_LABEL[cat] || cat;
    return \`<div class="cluster">
      <div class="cluster-head">
        <h3 class="cluster-title">\${label}</h3>
        <div class="cluster-stats">
          <span class="cluster-stat"><strong>\${articles.length}</strong> articles</span>
          <span class="cluster-stat"><strong>\${fmt(stats.volTotal)}</strong> vol/mois</span>
          <span class="cluster-stat"><strong>\${stats.percentCovered}%</strong> couvert</span>
        </div>
      </div>
      <div class="progress-bar cluster-progress"><div class="progress-bar-fill" style="width:\${stats.percentCovered}%; background: var(--orange);"></div></div>
      <table class="data-table"><thead><tr>
        <th>Slug</th><th data-col="vol">Vol</th><th data-col="kd">KD</th>
        <th>Type</th><th>Status</th><th>Index</th>
        <th data-col="date">Publié</th><th data-col="date">MAJ</th>
        <th data-col="impr">Impr</th><th data-col="clic">Clics</th><th data-col="pos">Pos moy</th>
        <th>Top KW réel (pos)</th>
      </tr></thead><tbody>\${articles.map(a => {
        const an = a.gscAnalytics || {};
        const top = an.topQueries?.[0];
        const topStr = top ? \`<span class="slug-cell">\${top.query}</span> <span class="num-dim">(pos \${top.position})</span>\` : '<span class="num-dim">—</span>';
        return \`<tr>
          <td class="slug-cell">\${a.slug}</td>
          <td class="num">\${fmt(a.vol)}</td>
          <td class="num-dim">\${a.kd ?? '—'}</td>
          <td>\${badgeHtml(a.articleType || 'satellite')}</td>
          <td>\${badgeHtml(a.status)}</td>
          <td>\${indexIcon(a.gscIndex)}</td>
          <td class="date-cell">\${a.publishedAt || '—'}</td>
          <td class="date-cell">\${a.updatedAt || '—'}</td>
          <td class="num-dim">\${fmt(an.impressions)}</td>
          <td class="num-dim">\${fmt(an.clicks)}</td>
          <td class="num-dim">\${an.position ? an.position.toFixed(1) : '—'}</td>
          <td>\${topStr}</td>
        </tr>\`;
      }).join('')}</tbody></table>
    </div>\`;
  }).join('');
}

// ─── Pages outils & hubs (table) ─────────────────────────────────────
function renderTools() {
  const grid = document.getElementById('grid-tools');
  if (!TOOLS.length) {
    grid.innerHTML = '<p style="color:var(--text-dim)">Pas de data — relance <code>npm run gsc:refresh</code> pour récupérer le statut indexation des pages outils.</p>';
    document.getElementById('tools-count-num').textContent = '—';
    return;
  }
  TOOLS.sort((a, b) => (b.gscAnalytics?.impressions || 0) - (a.gscAnalytics?.impressions || 0));
  document.getElementById('tools-count-num').textContent = TOOLS.length;
  grid.innerHTML = \`<table class="data-table"><thead><tr>
    <th>URL</th><th>Type</th>
    <th data-col="vol">Vol</th><th data-col="kd">KD</th>
    <th>Index</th>
    <th data-col="date">MAJ</th>
    <th data-col="impr">Impr</th><th data-col="clic">Clics</th><th data-col="pos">Pos moy</th>
    <th>Top KW réel (pos)</th>
  </tr></thead><tbody>\${TOOLS.map(t => {
    const a = t.gscAnalytics || {};
    const typeLabel = { 'home': 'Homepage', 'hub': 'Hub', 'tool': 'Outil', 'conc-region': 'Région conc.' }[t.source] || t.source;
    const top = a.topQueries?.[0];
    const topStr = top ? \`<span class="slug-cell">\${top.query}</span> <span class="num-dim">(pos \${top.position})</span>\` : '<span class="num-dim">—</span>';
    const volStr = t.volEstimated ? \`<span title="vol mesuré 0, estimé à 10">\${fmt(t.vol)}*</span>\` : fmt(t.vol);
    return \`<tr>
      <td class="slug-cell">\${t.url.replace('https://www.enomia.app', '')}</td>
      <td><span class="badge satellite">\${typeLabel}</span></td>
      <td class="num">\${volStr}</td>
      <td class="num-dim">\${t.kd ?? '—'}</td>
      <td>\${indexIcon(t)}</td>
      <td class="date-cell">\${t.lastmod || '—'}</td>
      <td class="num-dim">\${fmt(a.impressions)}</td>
      <td class="num-dim">\${fmt(a.clicks)}</td>
      <td class="num-dim">\${a.position ? a.position.toFixed(1) : '—'}</td>
      <td>\${topStr}</td>
    </tr>\`;
  }).join('')}</tbody></table>\`;
}

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', e => {
    const target = e.target.dataset.target;
    const filter = e.target.dataset.filter;
    document.querySelectorAll(\`.filter-btn[data-target="\${target}"]\`).forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    if (target === 'conc') renderConc(filter);
    if (target === 'rent') renderRent(filter);
  });
});

renderConc();
renderRent();
renderBlog();
renderTools();
</script>

</body>
</html>`;

const outPath = path.join(ROOT, '.claude/acquisition.html');
fs.writeFileSync(outPath, html);

// ============================================================
// 5. LOG RECAP
// ============================================================
console.log(`✅ Generated ${path.relative(ROOT, outPath)}`);
console.log('');
console.log(`📊 Conciergeries : ${concStats.total} villes · ${fmt(concStats.volCovered)}/${fmt(concStats.volTotal)} vol couvert (${concStats.percentCovered}%)`);
console.log(`📊 Rentabilité   : ${rentStats.total} villes · ${fmt(rentStats.volCovered)}/${fmt(rentStats.volTotal)} vol couvert (${rentStats.percentCovered}%) · ${rentStats.online} en ligne`);
console.log(`   ↳ source SEMrush : ${rentCsvFile ? path.relative(ROOT, rentCsvFile) : '(aucun CSV trouvé)'}`);
console.log(`📊 Blog          : ${blogStats.total} articles · ${fmt(blogStats.volCovered)}/${fmt(blogStats.volTotal)} vol couvert (${blogStats.percentCovered}%)`);
console.log('');
console.log('Clusters blog :');
Object.entries(blogClusterStats).forEach(([cat, s]) => {
  console.log(`  - ${cat.padEnd(25)} ${s.total} articles · ${fmt(s.volTotal)} vol · ${s.percentCovered}% couvert`);
});
