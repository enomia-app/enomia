/* ═══════════════════════════════════════════════════════════════════
   Contrat Tool — logique client (vanilla JS)
   Monté par ContratTool.astro sur toutes les pages qui l'utilisent.
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  if (window.__ctInit) return;
  window.__ctInit = true;

  // ─── JSPDF (chargement anticipé) ─────────────────────────────────
  if (!window.jspdf) {
    var _jspdfScript = document.createElement('script');
    _jspdfScript.src = '/jspdf.min.js';
    document.head.appendChild(_jspdfScript);
  }

  // ─── SUPABASE ────────────────────────────────────────────────────
  const _ctSb = supabase.createClient(
    'https://pesoidoedtjpihjvrnnc.supabase.co',
    'sb_publishable_TTmUwZsTYt7OWBTwTruaLQ_BYzRT9Jp'
  );
  let _ctUser = null, _ctToken = null;

  // ─── TAXE DE SÉJOUR DB ─────────────────────────────────────────
  let _ctTaxeDb = null;
  async function ctLoadTaxeDb() {
    if (_ctTaxeDb) return _ctTaxeDb;
    try {
      const res = await fetch('https://pesoidoedtjpihjvrnnc.supabase.co/storage/v1/object/public/static/taxe-sejour-communes-v1.json');
      _ctTaxeDb = await res.json();
      return _ctTaxeDb;
    } catch(e) { return null; }
  }
  function _ctNormVille(s) {
    return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/['']/g, "'").replace(/\s+/g, ' ').trim();
  }
  // Map classement bien → DB category key
  var CT_CAT_MAP = { 'Non classé': 'nc', '1 étoile': '1', '2 étoiles': '2', '3 étoiles': '3', '4 étoiles': '4', '5 étoiles': '5' };
  function ctGetTaxeRate(ville, classement) {
    if (!_ctTaxeDb || !ville) return null;
    var target = _ctNormVille(ville);
    if (!target) return null;
    var matched = null;
    for (var k of Object.keys(_ctTaxeDb)) {
      if (_ctNormVille(k) === target) { matched = k; break; }
    }
    if (!matched) return null;
    var catKey = CT_CAT_MAP[classement] || 'nc';
    var entry = _ctTaxeDb[matched][catKey];
    if (entry === undefined) entry = _ctTaxeDb[matched]['nc'];
    if (entry === undefined) return null;
    // Array = pourcentage [taux, "%"], sinon euros per person per night
    if (Array.isArray(entry)) {
      return { taux: entry[0], unite: '%' };
    }
    return { taux: entry, unite: '\u20ac' };
  }
  // Extract city from a French address string (last word-group after postal code)
  function _ctExtractVille(adresse) {
    if (!adresse) return '';
    // Try pattern: "... 75001 Paris" or "... 13100 Aix-en-Provence"
    var m = adresse.match(/\d{5}\s+(.+?)$/);
    if (m) return m[1].trim();
    // Fallback: last comma-segment
    var parts = adresse.split(',');
    return parts[parts.length - 1].trim();
  }
  // Auto-calculate taxe de séjour for a bien + wizard data
  function ctAutoCalcTaxe(bien, d) {
    var ville = _ctExtractVille(bien.adresse);
    var rate = ctGetTaxeRate(ville, bien.classement);
    if (!rate) return null;
    var n = nights(d.date_arrivee, d.date_depart);
    var nbPers = (+d.nb_adultes || 0) + (+d.nb_enfants || 0);
    if (n <= 0 || nbPers <= 0) return null;
    var total;
    if (rate.unite === '%') {
      // Percentage of nightly price
      var prixNuit = (+d.prix_total || 0) / n;
      total = Math.round(prixNuit * (rate.taux / 100) * n * 100) / 100;
    } else {
      // Flat rate per person per night
      total = Math.round(rate.taux * nbPers * n * 100) / 100;
    }
    return { total: total, taux: rate.taux, unite: rate.unite, ville: ville, nuits: n, personnes: nbPers };
  }

  // ─── STATE ──────────────────────────────────────────────────────
  let ctBailleur = null;
  let ctBiens = [];
  let ctContrats = [];
  let ctCurrentFilter = 'all';
  let ctSelectedBienId = null;
  let ctEditingContratId = null;
  let ctWizardStep = 1;
  let ctWizardData = { bien_id: null, locataire_nom: '', locataire_prenom: '', locataire_email: '', locataire_telephone: '', locataire_adresse: '', nb_adultes: 2, nb_enfants: 0, date_arrivee: '', date_depart: '', heure_arrivee: '15h00', heure_depart: '11h00', prix_total: 0, mode_paiement: 'virement', acompte_pourcentage: 30, acompte_montant: 0, acompte_date_limite: '', solde_date_limite: '', caution: 0, taxe_sejour_montant: 0, frais_menage: 0, langue: 'fr' };

  // ─── HELPERS GLOBAUX (pour handlers onclick="" inline) ──────────
  // Ces fonctions permettent aux handlers HTML inline de modifier l'état
  // interne sans y avoir accès directement (l'IIFE crée une closure).
  window.ctGoStep = function (n) { ctWizardStep = n; ctRenderWizard(); };
  window.ctSetLang = function (l) { ctCollectWizardStep2(); ctWizardData.langue = l; ctRenderWizard(); };
  window.ctGetWizardData = function () { return ctWizardData; };

  // ─── API HELPERS ────────────────────────────────────────────────
  async function ctApi(action, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (_ctToken) headers['Authorization'] = 'Bearer ' + _ctToken;
    const res = await fetch('/api/contrats', {
      method: 'POST', headers,
      body: JSON.stringify({ action, ...(body || {}) })
    });
    return res.json();
  }

  // ─── AUTH ───────────────────────────────────────────────────────
  _ctSb.auth.onAuthStateChange((event, session) => {
    _ctUser = session && session.user;
    _ctToken = session && session.access_token;
    if (event === 'SIGNED_IN') {
      ctCloseModal();
      ctBootstrap();
    } else if (event === 'SIGNED_OUT') {
      _ctUser = null;
      _ctToken = null;
      // Return to guest mode instead of auth landing
      ctBootstrap();
    }
  });

  async function ctInitAuth() {
    const { data: { session } } = await _ctSb.auth.getSession();
    _ctUser = session && session.user;
    _ctToken = session && session.access_token;
    // Always go to dashboard — guest mode uses localStorage
    ctBootstrap();
  }

  window.ctOpenLoginModal = function () {
    document.getElementById('ctmodal').classList.add('show');
  };
  window.ctCloseModal = function () {
    document.getElementById('ctmodal').classList.remove('show');
  };
  window.ctSignInGoogle = async function () {
    localStorage.setItem('ct_expecting_signin', '1');
    const redirectTo = window.location.origin + '/contrat-lcd-dashboard';
    await _ctSb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, queryParams: { prompt: 'select_account' } }
    });
  };
  window.ctSendMagicLink = async function () {
    const email = document.getElementById('ctmodal-email').value.trim();
    const fb = document.getElementById('ctmodal-feedback');
    if (!email || !email.includes('@')) {
      fb.textContent = 'Email invalide';
      fb.style.color = 'var(--ct-red)';
      fb.style.display = 'block';
      return;
    }
    fb.textContent = 'Envoi…';
    fb.style.color = 'var(--ct-muted)';
    fb.style.display = 'block';
    const { error } = await _ctSb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + '/contrat-lcd-dashboard' }
    });
    if (error) {
      fb.textContent = 'Erreur : ' + error.message;
      fb.style.color = 'var(--ct-red)';
    } else {
      fb.textContent = '✓ Lien envoyé à ' + email + '. Vérifiez votre boîte.';
      fb.style.color = 'var(--ct-green)';
    }
  };
  window.ctLogout = async function () {
    if (!confirm('Se déconnecter ?')) return;
    await _ctSb.auth.signOut();
  };

  // ─── SCREEN NAV ─────────────────────────────────────────────────
  window.ctShowScreen = function (id) {
    document.querySelectorAll('.ctr-wrap .screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
    document.querySelectorAll('.ctnav-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.screen === id);
    });
    if (id === 'ctscreen-dashboard') ctRenderDashboard();
    if (id === 'ctscreen-biens') ctRenderBiens();
    if (id === 'ctscreen-settings') ctRenderSettings();
  };

  function ctShowAuthLanding() {
    document.querySelectorAll('.ctr-wrap .screen').forEach(s => s.classList.remove('active'));
    document.getElementById('ctscreen-auth').classList.add('active');
    document.getElementById('ctnav').style.display = 'none';
  }

  async function ctBootstrap() {
    document.getElementById('ctnav').style.display = 'flex';
    // Avatar + label
    if (_ctUser) {
      const email = _ctUser.email || '';
      const initials = (email.match(/^(.)(?:.*?[.\-_](.))?/) || []).slice(1).join('').toUpperCase() || '?';
      document.getElementById('ctnav-avatar').textContent = initials;
      document.getElementById('ctnav-user-label').textContent = email;
    } else {
      document.getElementById('ctnav-avatar').textContent = '👤';
      document.getElementById('ctnav-user-label').textContent = 'Se connecter';
      // In guest mode, clicking user badge opens login instead of logout
      document.getElementById('ctnav-user-badge').onclick = function () { ctOpenLoginModal(); };
    }
    // Charger en parallèle
    await Promise.all([ctLoadBailleur(), ctLoadBiens(), ctLoadContrats(), ctLoadTaxeDb()]);
    ctShowScreen('ctscreen-dashboard');
  }

  // ─── LOCAL STORAGE HELPERS (guest mode) ─────────────────────────
  const CT_LS_BAILLEUR = 'ct_guest_bailleur';
  const CT_LS_BIENS = 'ct_guest_biens';
  const CT_LS_CONTRATS = 'ct_guest_contrats';

  function ctLsGet(key, fallback) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch (_) { return fallback; }
  }
  function ctLsSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (_) {}
  }

  // ─── DATA LOADERS ───────────────────────────────────────────────
  async function ctLoadBailleur() {
    if (_ctUser) {
      const r = await ctApi('bailleur-fetch');
      ctBailleur = (r && r.bailleur) || {};
    } else {
      ctBailleur = ctLsGet(CT_LS_BAILLEUR, {});
    }
  }
  async function ctLoadBiens() {
    if (_ctUser) {
      const r = await ctApi('biens-fetch');
      ctBiens = (r && r.biens) || [];
    } else {
      ctBiens = ctLsGet(CT_LS_BIENS, []);
    }
  }
  async function ctLoadContrats() {
    if (_ctUser) {
      const r = await ctApi('contrats-fetch');
      ctContrats = (r && r.contrats) || [];
    } else {
      ctContrats = ctLsGet(CT_LS_CONTRATS, []);
    }
  }

  // ─── UTILS ──────────────────────────────────────────────────────
  function fmtEur(n) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(Number(n) || 0);
  }
  function fmtEurP(n) {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(Number(n) || 0);
  }
  function fmtDate(s) {
    if (!s) return '—';
    return new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function fmtDateShort(s) {
    if (!s) return '—';
    return new Date(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function nights(start, end) {
    if (!start || !end) return 0;
    const ms = new Date(end) - new Date(start);
    return Math.max(0, Math.round(ms / 86400000));
  }
  function bienIcon(type) {
    const map = { villa: '🌴', maison: '🏡', gite: '🏡', 'gite rural': '🏡', mobil_home: '🚐', 'mobil-home': '🚐', chalet: '🏔', studio: '🏙', t1: '🏙', t2: '🏙', t3: '🏙', appartement: '🏙' };
    return map[(type || '').toLowerCase()] || '🏠';
  }
  function statutBadge(c) {
    if (c.solde_paye && c.acompte_paye) return '<span class="badge paid">● Soldé</span>';
    if (c.acompte_paye) return '<span class="badge partial">● Acompte reçu</span>';
    // En retard si date_limite acompte dépassée
    if (c.acompte_date_limite && new Date(c.acompte_date_limite) < new Date()) {
      return '<span class="badge overdue">● Impayé</span>';
    }
    return '<span class="badge pending">● En attente</span>';
  }

  // ─── DASHBOARD ──────────────────────────────────────────────────
  window.ctRenderDashboard = function () { return ctRenderDashboard(); };
  function ctRenderDashboard() {
    // KPI
    const ca = ctContrats.reduce((s, c) => s + (+c.prix_total || 0), 0);
    const encaisse = ctContrats.reduce((s, c) => s + (c.acompte_paye ? +c.acompte_montant || 0 : 0) + (c.solde_paye ? +c.solde_montant || 0 : 0), 0);
    const du = ca - encaisse;
    const cautions = ctContrats.reduce((s, c) => s + (c.caution_encaissee && !c.caution_rendue ? +c.caution || 0 : 0), 0);

    document.getElementById('ctkpi-ca').textContent = fmtEur(ca);
    document.getElementById('ctkpi-encaisse').textContent = fmtEur(encaisse);
    document.getElementById('ctkpi-du').textContent = fmtEur(du);
    document.getElementById('ctkpi-cautions').textContent = fmtEur(cautions);

    document.getElementById('ctkpi-ca-delta').textContent = ctContrats.length + ' contrat' + (ctContrats.length !== 1 ? 's' : '');
    document.getElementById('ctdash-sub').textContent = ctBiens.length + ' bien' + (ctBiens.length !== 1 ? 's' : '') + ' · ' + ctContrats.length + ' contrat' + (ctContrats.length !== 1 ? 's' : '');

    // Counts par filtre
    const now = new Date();
    const counts = { all: ctContrats.length, upcoming: 0, ongoing: 0, done: 0, late: 0 };
    ctContrats.forEach(c => {
      const start = new Date(c.date_arrivee);
      const end = new Date(c.date_depart);
      if (c.solde_paye && c.acompte_paye) counts.done++;
      if (start > now) counts.upcoming++;
      if (start <= now && end >= now) counts.ongoing++;
      if (c.acompte_date_limite && new Date(c.acompte_date_limite) < now && !c.acompte_paye) counts.late++;
    });
    Object.keys(counts).forEach(k => {
      const el = document.getElementById('ctcnt-' + k);
      if (el) el.textContent = counts[k];
    });

    // Table
    const tbody = document.getElementById('ctdash-tbody');
    let filtered = ctContrats;
    if (ctCurrentFilter === 'upcoming') filtered = ctContrats.filter(c => new Date(c.date_arrivee) > now);
    else if (ctCurrentFilter === 'ongoing') filtered = ctContrats.filter(c => new Date(c.date_arrivee) <= now && new Date(c.date_depart) >= now);
    else if (ctCurrentFilter === 'done') filtered = ctContrats.filter(c => c.solde_paye && c.acompte_paye);
    else if (ctCurrentFilter === 'late') filtered = ctContrats.filter(c => c.acompte_date_limite && new Date(c.acompte_date_limite) < now && !c.acompte_paye);

    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:60px 20px"><div class="empty-state" style="border:none;padding:20px"><div class="empty-icon">📄</div><div class="empty-title">Aucun contrat ' + (ctCurrentFilter === 'all' ? '' : 'dans ce filtre') + '</div><div class="empty-desc">' + (ctCurrentFilter === 'all' ? 'Créez votre premier contrat en 2 minutes.' : 'Essayez un autre filtre.') + '</div>' + (ctCurrentFilter === 'all' ? '<button class="btn accent" onclick="ctNewContract()">+ Nouveau contrat</button>' : '') + '</div></td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(c => {
      const b = ctBiens.find(bb => bb.id === c.bien_id) || (c.bien_snapshot || {});
      const n = nights(c.date_arrivee, c.date_depart);
      const ac = c.acompte_paye ? 'ok' : (c.acompte_date_limite && new Date(c.acompte_date_limite) < now ? 'late' : 'wait');
      const so = c.solde_paye ? 'ok' : 'wait';
      const ca = c.caution_rendue ? 'ok' : (c.caution_encaissee ? 'ok' : 'wait');
      const acSym = c.acompte_paye ? '✓' : (ac === 'late' ? '⚠' : '⏳');
      const soSym = c.solde_paye ? '✓' : '⏳';
      const caSym = c.caution_rendue ? '✓' : (c.caution_encaissee ? '✓' : '⏳');
      const signed = c.contrat_signe_url;
      return '<tr>' +
        '<td><span class="primary">' + esc(c.locataire_prenom || '') + ' ' + esc(c.locataire_nom) + '</span><span class="secondary">' + esc(c.locataire_email || '') + ' · ' + ((+c.nb_adultes || 0) + (+c.nb_enfants || 0)) + ' pers.</span></td>' +
        '<td class="col-bien"><div style="display:flex;align-items:center;gap:10px"><div class="bien-item-icon">' + bienIcon(b.type_bien) + '</div><div><span class="primary">' + esc(b.nom_interne || '—') + '</span><span class="secondary">' + esc((b.adresse || '').split(',').pop() || '') + '</span></div></div></td>' +
        '<td><span class="primary">' + fmtDateShort(c.date_arrivee) + ' → ' + fmtDateShort(c.date_depart) + '</span><span class="secondary">' + n + ' nuit' + (n > 1 ? 's' : '') + (c.langue === 'en' ? ' · 🇬🇧' : '') + '</span></td>' +
        '<td><span class="primary">' + fmtEur(c.prix_total) + '</span></td>' +
        '<td class="col-money"><span class="pay-chip ' + ac + '" onclick="ctTogglePay(\'' + c.id + '\',\'acompte_paye\',' + !c.acompte_paye + ')">' + acSym + ' ' + fmtEur(c.acompte_montant) + '</span></td>' +
        '<td class="col-money"><span class="pay-chip ' + so + '" onclick="ctTogglePay(\'' + c.id + '\',\'solde_paye\',' + !c.solde_paye + ')">' + soSym + ' ' + fmtEur(c.solde_montant) + '</span></td>' +
        '<td class="col-money"><span class="pay-chip ' + ca + '" onclick="ctToggleCaution(\'' + c.id + '\')">' + caSym + ' ' + fmtEur(c.caution) + '</span></td>' +
        '<td>' + statutBadge(c) + '</td>' +
        '<td>' + (signed ? '<button class="upload-inline uploaded" onclick="ctDownloadSigned(\'' + esc(signed) + '\')"><span>Signé</span><span>✓</span></button>' : '<label class="upload-inline"><span>↑ Upload</span><input type="file" accept="application/pdf,image/*" style="display:none" onchange="ctUploadSigned(\'' + c.id + '\', this)"></label>') + '</td>' +
        '<td><div class="row-actions"><button class="icon-btn" title="Télécharger le contrat" onclick="ctRegenerate(\'' + c.id + '\')">↓</button><button class="icon-btn danger" title="Supprimer" onclick="ctDeleteContract(\'' + c.id + '\')">✕</button></div></td>' +
        '</tr>';
    }).join('');
  }

  // Listener sur les filtres pills (une seule fois, à init)
  function ctBindPills() {
    document.querySelectorAll('#ctdash-pills .pill').forEach(p => {
      p.addEventListener('click', () => {
        document.querySelectorAll('#ctdash-pills .pill').forEach(x => x.classList.remove('active'));
        p.classList.add('active');
        ctCurrentFilter = p.dataset.filter;
        ctRenderDashboard();
      });
    });
  }

  window.ctTogglePay = async function (id, field, newVal) {
    if (_ctUser) {
      const r = await ctApi('contrat-pay', { contratId: id, field, value: newVal });
      if (r && r.contrat) {
        const idx = ctContrats.findIndex(c => c.id === id);
        if (idx >= 0) ctContrats[idx] = r.contrat;
        ctRenderDashboard();
      }
    } else {
      const idx = ctContrats.findIndex(c => c.id === id);
      if (idx >= 0) { ctContrats[idx][field] = newVal; ctLsSet(CT_LS_CONTRATS, ctContrats); ctRenderDashboard(); }
    }
  };

  window.ctToggleCaution = async function (id) {
    const c = ctContrats.find(x => x.id === id);
    if (!c) return;
    let field, value;
    if (!c.caution_encaissee) { field = 'caution_encaissee'; value = true; }
    else if (!c.caution_rendue) { field = 'caution_rendue'; value = true; }
    else { field = 'caution_encaissee'; value = false; }  // reset
    if (_ctUser) {
      const r = await ctApi('contrat-pay', { contratId: id, field, value });
      if (r && r.contrat) {
        await ctLoadContrats();
        ctRenderDashboard();
      }
    } else {
      c[field] = value;
      if (field === 'caution_encaissee' && !value) { c.caution_rendue = false; }
      ctLsSet(CT_LS_CONTRATS, ctContrats);
      ctRenderDashboard();
    }
  };

  window.ctDeleteContract = async function (id) {
    if (!confirm('Supprimer ce contrat ? Cette action est irréversible.')) return;
    if (_ctUser) {
      const r = await ctApi('contrat-delete', { contratId: id });
      if (r && r.ok) {
        ctContrats = ctContrats.filter(c => c.id !== id);
        ctRenderDashboard();
      }
    } else {
      ctContrats = ctContrats.filter(c => c.id !== id);
      ctLsSet(CT_LS_CONTRATS, ctContrats);
      ctRenderDashboard();
    }
  };

  window.ctRegenerate = function (id) {
    // Re-génère le PDF à partir d'un contrat existant
    const c = ctContrats.find(x => x.id === id);
    if (!c) return;
    // Re-ouvre le wizard en mode "édition"
    ctEditingContratId = id;
    ctWizardData = Object.assign({}, c);
    ctWizardStep = 3;  // direct à l'aperçu
    ctShowScreen('ctscreen-new-contract');
    ctRenderWizard();
  };

  // ─── BIENS ──────────────────────────────────────────────────────
  window.ctRenderBiens = function () { return ctRenderBiens(); };
  function ctRenderBiens() {
    // Sidebar
    const list = document.getElementById('ctbiens-list');
    document.getElementById('ctbiens-count-label').textContent = 'Vos biens (' + ctBiens.length + ')';
    if (!ctBiens.length) {
      list.innerHTML = '<div style="padding:20px;text-align:center;color:var(--ct-muted);font-size:12px">Aucun bien</div>';
    } else {
      list.innerHTML = ctBiens.map(b => {
        const active = ctSelectedBienId === b.id ? ' active' : '';
        return '<div class="bien-item' + active + '" onclick="ctSelectBien(\'' + b.id + '\')">' +
          '<div class="bien-item-icon">' + bienIcon(b.type_bien) + '</div>' +
          '<div class="bien-item-text"><div class="bien-item-name">' + esc(b.nom_interne) + '</div><div class="bien-item-meta">' + esc(b.type_bien || '—') + ' · ' + (b.capacite_max || '?') + ' pers.</div></div>' +
          '</div>';
      }).join('');
    }

    // Detail
    if (!ctSelectedBienId && ctBiens.length) ctSelectedBienId = ctBiens[0].id;
    if (ctSelectedBienId) ctRenderBienDetail();
    else {
      document.getElementById('ctbien-detail').innerHTML = '<div style="text-align:center;padding:60px 20px;color:var(--ct-muted);font-size:13px">Aucun bien sélectionné. Cliquez sur "+ Ajouter un bien" pour commencer.</div>';
    }
  }

  window.ctSelectBien = function (id) {
    ctSelectedBienId = id;
    ctRenderBiens();
  };
  window.ctNewBien = function () {
    // Crée un bien vide localement, sauvegarde, et sélectionne
    ctSelectedBienId = '__new__';
    ctRenderBienDetail({
      nom_interne: '',
      type_bien: 'villa',
      adresse: '',
      capacite_max: 4,
      classement: '3 étoiles',
      numero_declaration_mairie: '',
      equipements: [],
      animaux: 'non',
      fumeurs: 'non',
      fetes: 'non',
      horaire_silence: '22h00 — 08h00',
      check_in: '15h00',
      check_out: '11h00',
      caution_defaut: 500,
      frais_menage_defaut: 80,
      charges_mode: 'incluses',
      taxe_sejour_mode: 'en_sus',
      conditions_annulation: 'standard',
      inventaire: { pieces: [] },
      reglement_interieur: '',
      etat_des_lieux_template: '',
      clauses_particulieres: '',
      assurance_villegiature: 'obligatoire'
    });
  };

  const EQUIPEMENTS_LIST = [
    { k: 'wifi', l: '📶 Wifi' }, { k: 'clim', l: '❄ Climatisation' },
    { k: 'piscine', l: '🏊 Piscine' }, { k: 'parking', l: '🚗 Parking' },
    { k: 'lave_linge', l: '🧺 Lave-linge' }, { k: 'lave_vaisselle', l: '🍽 Lave-vaisselle' },
    { k: 'tv', l: '📺 TV' }, { k: 'bbq', l: '🔥 BBQ' },
    { k: 'terrasse', l: '☀ Terrasse' }, { k: 'jardin', l: '🌳 Jardin' },
    { k: 'cafetiere', l: '☕ Cafetière' }, { k: 'micro_ondes', l: '♨ Micro-ondes' },
    { k: 'linge_lit', l: '🛏 Linge de lit fourni' }, { k: 'linge_bain', l: '🧴 Linge de toilette' },
    { k: 'chaise_bebe', l: '🧒 Chaise bébé' }, { k: 'velos', l: '🚲 Vélos' },
    { k: 'cheminee', l: '🔥 Cheminée' }
  ];

  function ctRenderBienDetail(override) {
    const b = override || ctBiens.find(x => x.id === ctSelectedBienId);
    if (!b) return;
    const invTotal = computeInventaireTotal(b.inventaire);
    const equips = Array.isArray(b.equipements) ? b.equipements : [];
    const isNew = !b.id;

    const html = '' +
      '<div class="bien-detail-header">' +
      '  <div><h2 class="bien-detail-title">' + (isNew ? '<em>Nouveau bien</em>' : esc(b.nom_interne || 'Sans nom')) + '</h2><div style="font-family:var(--ct-mono);font-size:11px;color:var(--ct-muted)">' + esc(b.adresse || '—') + '</div></div>' +
      (isNew ? '' : '  <div style="display:flex;gap:8px"><button class="btn sm danger" onclick="ctDeleteBien()">✕ Supprimer</button></div>') +
      '</div>' +

      '<details class="bien-section" open><summary>📋 Infos générales</summary><div class="section-content">' +
      '<div class="field-row"><div class="field"><label class="field-label">Nom interne <span class="req">*</span></label><input type="text" class="input" id="ctb-nom" value="' + esc(b.nom_interne) + '"></div>' +
      '<div class="field"><label class="field-label">Type</label><select class="select" id="ctb-type">' +
      ['villa', 'maison', 'mobil-home', 'gite', 'appartement T1', 'appartement T2', 'appartement T3', 'studio', 'chalet', 'autre'].map(t => '<option' + (b.type_bien === t ? ' selected' : '') + '>' + t + '</option>').join('') +
      '</select></div></div>' +
      '<div class="field"><label class="field-label">Adresse complète <span class="req">*</span></label><input type="text" class="input" id="ctb-adresse" value="' + esc(b.adresse) + '"></div>' +
      '<div class="field-row-4"><div class="field"><label class="field-label">Surface</label><input type="text" class="input" id="ctb-surface" value="' + (b.surface || '') + '" placeholder="m²"></div>' +
      '<div class="field"><label class="field-label">Pièces</label><input type="number" class="input" id="ctb-pieces" value="' + (b.nb_pieces || '') + '"></div>' +
      '<div class="field"><label class="field-label">Couchages</label><input type="number" class="input" id="ctb-couchages" value="' + (b.nb_couchages || '') + '"></div>' +
      '<div class="field"><label class="field-label">Occupants max <span class="req">*</span></label><input type="number" class="input" id="ctb-capmax" value="' + (b.capacite_max || '') + '"></div></div>' +
      '<div class="field-row"><div class="field"><label class="field-label">Classement meublé tourisme</label><select class="select" id="ctb-classement">' +
      ['Non classé', '1 étoile', '2 étoiles', '3 étoiles', '4 étoiles', '5 étoiles'].map(c => '<option' + (b.classement === c ? ' selected' : '') + '>' + c + '</option>').join('') +
      '</select></div>' +
      '<div class="field"><label class="field-label">N° déclaration mairie</label><input type="text" class="input" id="ctb-decl" value="' + esc(b.numero_declaration_mairie) + '" placeholder="13 chiffres (loi Le Meur)"><div class="field-hint">Obligatoire depuis la loi Le Meur du 19/11/2024</div></div></div>' +
      '</div></details>' +

      '<details class="bien-section"><summary>🛋 Équipements & confort</summary><div class="section-content">' +
      '<div class="equip-grid" id="ctb-equip-grid">' + EQUIPEMENTS_LIST.map(e => '<label class="equip-item' + (equips.includes(e.k) ? ' checked' : '') + '"><input type="checkbox" data-eq="' + e.k + '"' + (equips.includes(e.k) ? ' checked' : '') + ' onchange="this.closest(\'label\').classList.toggle(\'checked\')">' + e.l + '</label>').join('') + '</div>' +
      '<div style="margin-top:14px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">' +
      '<input type="text" class="input" id="ctb-equip-custom" placeholder="Ex : 🎳 Table de ping-pong" style="flex:1;min-width:200px;max-width:320px;font-size:12px">' +
      '<button class="btn sm accent" onclick="ctAddCustomEquip()">+ Ajouter</button></div>' +
      '</div></details>' +

      '<details class="bien-section"><summary>🐾 Règles de la maison</summary><div class="section-content">' +
      '<div class="field"><label class="field-label">Animaux</label><div class="radio-group" data-group="animaux">' +
      ['oui', 'sur_demande', 'non'].map(v => '<button class="radio-pill' + (b.animaux === v ? ' active' : '') + '" onclick="ctToggleRadio(this)" data-val="' + v + '">' + (v === 'oui' ? 'Acceptés' : v === 'sur_demande' ? 'Sur demande' : 'Non acceptés') + '</button>').join('') + '</div></div>' +
      '<div class="field"><label class="field-label">Fumeurs</label><div class="radio-group" data-group="fumeurs">' +
      ['oui', 'exterieur', 'non'].map(v => '<button class="radio-pill' + (b.fumeurs === v ? ' active' : '') + '" onclick="ctToggleRadio(this)" data-val="' + v + '">' + (v === 'oui' ? 'Autorisé' : v === 'exterieur' ? 'Extérieur uniquement' : 'Interdit') + '</button>').join('') + '</div></div>' +
      '<div class="field"><label class="field-label">Fêtes et événements</label><div class="radio-group" data-group="fetes">' +
      ['oui', 'non'].map(v => '<button class="radio-pill' + (b.fetes === v ? ' active' : '') + '" onclick="ctToggleRadio(this)" data-val="' + v + '">' + (v === 'oui' ? 'Autorisés' : 'Interdits') + '</button>').join('') + '</div></div>' +
      '<div class="field-row"><div class="field"><label class="field-label">Horaire silence</label><input type="text" class="input" id="ctb-silence" value="' + esc(b.horaire_silence) + '"></div>' +
      '<div class="field"><label class="field-label">Check-in / Check-out</label><input type="text" class="input" id="ctb-checkio" value="' + esc(b.check_in) + ' / ' + esc(b.check_out) + '"></div></div>' +
      '</div></details>' +

      '<details class="bien-section"><summary>💰 Conditions financières par défaut</summary><div class="section-content">' +
      '<div class="field-row"><div class="field"><label class="field-label">Caution</label><input type="number" class="input" id="ctb-caution" value="' + (b.caution_defaut || 0) + '"></div>' +
      '<div class="field"><label class="field-label">Frais de ménage</label><input type="number" class="input" id="ctb-menage" value="' + (b.frais_menage_defaut || 0) + '"></div></div>' +
      '<div class="field-row"><div class="field"><label class="field-label">Charges</label><select class="select" id="ctb-charges">' +
      [['incluses', 'Incluses dans le loyer'], ['forfait', 'Forfait en sus'], ['reel', 'Au réel']].map(v => '<option value="' + v[0] + '"' + (b.charges_mode === v[0] ? ' selected' : '') + '>' + v[1] + '</option>').join('') +
      '</select></div>' +
      '<div class="field"><label class="field-label">Taxe de séjour</label><select class="select" id="ctb-taxe">' +
      [['en_sus', 'En sus (locataire)'], ['incluse', 'Incluse']].map(v => '<option value="' + v[0] + '"' + (b.taxe_sejour_mode === v[0] ? ' selected' : '') + '>' + v[1] + '</option>').join('') +
      '</select></div></div>' +
      '<div class="field"><label class="field-label">Conditions d\'annulation</label><div class="radio-group" data-group="annulation">' +
      ['souple', 'standard', 'stricte'].map(v => '<button class="radio-pill' + (b.conditions_annulation === v ? ' active' : '') + '" onclick="ctToggleRadio(this)" data-val="' + v + '">' + v.charAt(0).toUpperCase() + v.slice(1) + '</button>').join('') + '</div></div>' +
      '</div></details>' +

      '<details class="bien-section" open><summary>📦 Inventaire du mobilier <span style="margin-left:auto;font-family:var(--ct-mono);font-size:10px;padding:3px 8px;background:var(--ct-accent-dim);color:var(--ct-accent);border-radius:10px">Total : ' + fmtEur(invTotal) + '</span></summary><div class="section-content">' +
      '<p style="font-size:12px;color:var(--ct-muted);margin-bottom:16px;line-height:1.6">L\'inventaire chiffré est joint en annexe du contrat. En cas de casse, vous pouvez réclamer la <strong>valeur de remplacement</strong> au locataire.</p>' +
      '<div id="ctb-inventaire-container">' + renderInventaireUI(b.inventaire) + '</div>' +
      '<button class="btn" onclick="ctAddInventairePiece()" style="margin-bottom:12px">+ Ajouter une pièce</button>' +
      '<div class="inv-total-banner"><span class="label">Valeur totale de l\'inventaire</span><span class="value" id="ctb-inv-total">' + fmtEur(invTotal) + '</span></div>' +
      '</div></details>' +

      '<details class="bien-section"><summary>📜 Règlement intérieur</summary><div class="section-content">' +
      '<textarea class="textarea" id="ctb-reglement" rows="10" placeholder="Texte du règlement intérieur…">' + esc(b.reglement_interieur || DEFAULT_REGLEMENT) + '</textarea>' +
      '<button class="btn sm" onclick="document.getElementById(\'ctb-reglement\').value = DEFAULT_REGLEMENT_RUNTIME;">📋 Charger un modèle type</button>' +
      '</div></details>' +

      '<details class="bien-section"><summary>✍ Clauses particulières</summary><div class="section-content">' +
      '<div class="field"><label class="field-label">Clauses libres ajoutées au contrat</label><textarea class="textarea" id="ctb-clauses" rows="4">' + esc(b.clauses_particulieres) + '</textarea></div>' +
      '<div class="field"><label class="field-label">Assurance villégiature</label><div class="radio-group" data-group="assurance">' +
      ['obligatoire', 'recommandee', 'non_requise'].map(v => '<button class="radio-pill' + (b.assurance_villegiature === v ? ' active' : '') + '" onclick="ctToggleRadio(this)" data-val="' + v + '">' + (v === 'obligatoire' ? 'Obligatoire' : v === 'recommandee' ? 'Recommandée' : 'Non requise') + '</button>').join('') + '</div></div>' +
      '</div></details>' +

      '<div class="save-bar"><div><div style="font-family:var(--ct-mono);font-size:11px;color:var(--ct-muted)">' + (isNew ? 'Nouveau bien non enregistré' : 'Dernière modification : ' + fmtDate(b.updated_at)) + '</div></div>' +
      '<div style="display:flex;gap:8px"><button class="btn" onclick="ctRenderBiens()">Annuler</button><button class="btn accent" onclick="ctSaveBien()">Enregistrer</button></div></div>';

    document.getElementById('ctbien-detail').innerHTML = html;
  }

  const DEFAULT_REGLEMENT = `1. Capacité d'accueil : le nombre maximum d'occupants est strictement limité à celui déclaré au contrat.

2. Nuisances sonores : le calme est de rigueur entre 22h et 8h. Les fêtes, soirées et rassemblements sont interdits.

3. Fumeurs : il est interdit de fumer à l'intérieur.

4. Animaux : un seul animal autorisé, sous réserve d'une bonne tenue.

5. Piscine : utilisation sous l'entière responsabilité du locataire. Surveillance obligatoire des enfants.

6. Entretien : merci de laisser le logement dans l'état où vous l'avez trouvé.

7. Tri sélectif : merci de respecter le tri mis en place.`;
  window.DEFAULT_REGLEMENT_RUNTIME = DEFAULT_REGLEMENT;

  window.ctToggleRadio = function (btn) {
    const group = btn.closest('.radio-group');
    group.querySelectorAll('.radio-pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
  };

  window.ctAddCustomEquip = function () {
    const input = document.getElementById('ctb-equip-custom');
    const val = input.value.trim();
    if (!val) return;
    const grid = document.getElementById('ctb-equip-grid');
    const key = val.replace(/[^\w]/g, '_').toLowerCase();
    grid.insertAdjacentHTML('beforeend', '<label class="equip-item checked"><input type="checkbox" data-eq="' + esc(key) + '" data-label="' + esc(val) + '" checked>' + esc(val) + '</label>');
    input.value = '';
  };

  function computeInventaireTotal(inv) {
    if (!inv || !inv.pieces) return 0;
    return inv.pieces.reduce((s, p) => s + (p.items || []).reduce((ss, it) => ss + (+it.valeur || 0) * (+it.qte || 1), 0), 0);
  }

  function renderInventaireUI(inv) {
    const pieces = (inv && inv.pieces) || [];
    if (!pieces.length) {
      return '<div style="padding:20px;text-align:center;color:var(--ct-muted);font-size:12px;background:var(--ct-bg);border:1px dashed var(--ct-border);border-radius:8px;margin-bottom:12px">Aucune pièce dans l\'inventaire. Ajoutez une pièce pour commencer.</div>';
    }
    return pieces.map((p, pi) => {
      const roomTotal = (p.items || []).reduce((s, it) => s + (+it.valeur || 0) * (+it.qte || 1), 0);
      return '<div class="inv-room" data-piece-idx="' + pi + '">' +
        '<div class="inv-room-header"><span class="inv-room-title" contenteditable onblur="ctInvRoomRename(' + pi + ', this.innerText)">' + esc(p.nom || 'Pièce') + '</span><span class="inv-room-total">Total : <strong>' + fmtEur(roomTotal) + '</strong> <button class="icon-btn danger" style="width:22px;height:22px;font-size:10px;margin-left:8px" onclick="ctDeleteInvRoom(' + pi + ')">✕</button></span></div>' +
        '<table class="inv-table"><thead><tr><th>Objet</th><th class="qty-col">Qté</th><th class="state-col">État</th><th class="val-col">Valeur</th><th class="val-col">Total</th><th style="width:28px"></th></tr></thead><tbody>' +
        (p.items || []).map((it, ii) => '<tr>' +
          '<td><input class="mini" value="' + esc(it.objet) + '" onblur="ctInvUpdate(' + pi + ',' + ii + ',\'objet\',this.value)"></td>' +
          '<td><input class="mini" type="number" value="' + (it.qte || 1) + '" onblur="ctInvUpdate(' + pi + ',' + ii + ',\'qte\',this.value)"></td>' +
          '<td><select class="mini" onchange="ctInvUpdate(' + pi + ',' + ii + ',\'etat\',this.value)">' + ['Neuf', 'Bon', 'Correct', 'Usagé'].map(e => '<option' + (it.etat === e ? ' selected' : '') + '>' + e + '</option>').join('') + '</select></td>' +
          '<td class="val-col"><input class="mini" type="number" value="' + (it.valeur || 0) + '" style="text-align:right" onblur="ctInvUpdate(' + pi + ',' + ii + ',\'valeur\',this.value)"></td>' +
          '<td class="val-col"><strong>' + fmtEur((+it.valeur || 0) * (+it.qte || 1)) + '</strong></td>' +
          '<td><button class="icon-btn danger" style="width:22px;height:22px;font-size:10px" onclick="ctDeleteInvItem(' + pi + ',' + ii + ')">✕</button></td></tr>').join('') +
        '</tbody></table><button class="add-line-btn" onclick="ctAddInvItem(' + pi + ')">+ Ajouter un objet</button></div>';
    }).join('');
  }

  // ctTempBien = copie en cours d'édition (sert avant l'enregistrement)
  let ctTempBien = null;
  function getTempBien() {
    if (!ctTempBien) {
      ctTempBien = Object.assign({}, ctSelectedBienId === '__new__' ? { inventaire: { pieces: [] } } : (ctBiens.find(b => b.id === ctSelectedBienId) || { inventaire: { pieces: [] } }));
      if (!ctTempBien.inventaire) ctTempBien.inventaire = { pieces: [] };
    }
    return ctTempBien;
  }

  window.ctAddInventairePiece = function () {
    const modal = document.getElementById('ct-inv-modal');
    const input = document.getElementById('ct-inv-room-input');
    if (input) input.value = '';
    if (modal) modal.style.display = 'flex';
  };
  window.ctConfirmAddRoom = function () {
    const input = document.getElementById('ct-inv-room-input');
    const name = input ? input.value.trim() : '';
    if (!name) return;
    const b = getTempBien();
    if (!b.inventaire) b.inventaire = { pieces: [] };
    b.inventaire.pieces.push({ nom: name, items: [] });
    refreshInventaireUI(b);
    document.getElementById('ct-inv-modal').style.display = 'none';
  };

  var _ctInvItemPieceIdx = -1;
  window.ctAddInvItem = function (pi) {
    _ctInvItemPieceIdx = pi;
    var modal = document.getElementById('ct-inv-item-modal');
    var nameInput = document.getElementById('ct-inv-item-name');
    var qtyInput = document.getElementById('ct-inv-item-qty');
    var stateSelect = document.getElementById('ct-inv-item-state');
    var valInput = document.getElementById('ct-inv-item-val');
    if (nameInput) nameInput.value = '';
    if (qtyInput) qtyInput.value = '1';
    if (stateSelect) stateSelect.value = 'Bon';
    if (valInput) valInput.value = '0';
    if (modal) modal.style.display = 'flex';
    if (nameInput) setTimeout(function() { nameInput.focus(); }, 100);
  };

  window.ctConfirmAddItem = function () {
    var name = (document.getElementById('ct-inv-item-name').value || '').trim();
    if (!name) return;
    var qty = parseInt(document.getElementById('ct-inv-item-qty').value) || 1;
    var state = document.getElementById('ct-inv-item-state').value || 'Bon';
    var val = parseFloat(document.getElementById('ct-inv-item-val').value) || 0;
    var b = getTempBien();
    if (_ctInvItemPieceIdx >= 0 && b.inventaire && b.inventaire.pieces[_ctInvItemPieceIdx]) {
      b.inventaire.pieces[_ctInvItemPieceIdx].items.push({ objet: name, qte: qty, etat: state, valeur: val });
      refreshInventaireUI(b);
    }
    document.getElementById('ct-inv-item-modal').style.display = 'none';
  };

  window.ctInvUpdate = function (pi, ii, field, val) {
    const b = getTempBien();
    b.inventaire.pieces[pi].items[ii][field] = field === 'qte' || field === 'valeur' ? (+val || 0) : val;
    refreshInventaireUI(b);
  };

  window.ctInvRoomRename = function (pi, name) {
    const b = getTempBien();
    b.inventaire.pieces[pi].nom = name.trim() || 'Pièce';
  };

  window.ctDeleteInvItem = function (pi, ii) {
    const b = getTempBien();
    b.inventaire.pieces[pi].items.splice(ii, 1);
    refreshInventaireUI(b);
  };

  window.ctDeleteInvRoom = function (pi) {
    if (!confirm('Supprimer cette pièce ?')) return;
    const b = getTempBien();
    b.inventaire.pieces.splice(pi, 1);
    refreshInventaireUI(b);
  };

  function refreshInventaireUI(b) {
    const container = document.getElementById('ctb-inventaire-container');
    if (container) container.innerHTML = renderInventaireUI(b.inventaire);
    const total = computeInventaireTotal(b.inventaire);
    const totalEl = document.getElementById('ctb-inv-total');
    if (totalEl) totalEl.textContent = fmtEur(total);
  }

  window.ctSaveBien = async function () {
    const b = getTempBien();
    // Collecter les champs du DOM
    b.nom_interne = document.getElementById('ctb-nom').value.trim();
    b.type_bien = document.getElementById('ctb-type').value;
    b.adresse = document.getElementById('ctb-adresse').value.trim();
    b.surface = parseInt(document.getElementById('ctb-surface').value) || null;
    b.nb_pieces = parseInt(document.getElementById('ctb-pieces').value) || null;
    b.nb_couchages = parseInt(document.getElementById('ctb-couchages').value) || null;
    b.capacite_max = parseInt(document.getElementById('ctb-capmax').value) || null;
    b.classement = document.getElementById('ctb-classement').value;
    b.numero_declaration_mairie = document.getElementById('ctb-decl').value.trim();
    // Équipements
    b.equipements = Array.from(document.querySelectorAll('#ctb-equip-grid input[type=checkbox]:checked')).map(i => i.dataset.label || i.dataset.eq);
    // Radios
    document.querySelectorAll('[data-group]').forEach(g => {
      const field = g.dataset.group;
      const active = g.querySelector('.radio-pill.active');
      if (active) {
        const k = field === 'annulation' ? 'conditions_annulation' : field === 'assurance' ? 'assurance_villegiature' : field;
        b[k] = active.dataset.val;
      }
    });
    b.horaire_silence = document.getElementById('ctb-silence').value.trim();
    const chkio = document.getElementById('ctb-checkio').value.trim().split('/');
    b.check_in = (chkio[0] || '15h00').trim();
    b.check_out = (chkio[1] || '11h00').trim();
    b.caution_defaut = parseFloat(document.getElementById('ctb-caution').value) || 0;
    b.frais_menage_defaut = parseFloat(document.getElementById('ctb-menage').value) || 0;
    b.charges_mode = document.getElementById('ctb-charges').value;
    b.taxe_sejour_mode = document.getElementById('ctb-taxe').value;
    b.reglement_interieur = document.getElementById('ctb-reglement').value;
    b.clauses_particulieres = document.getElementById('ctb-clauses').value;

    if (!b.nom_interne) { alert('Le nom interne est obligatoire'); return; }
    if (!b.capacite_max) { alert('La capacité max est obligatoire'); return; }

    if (_ctUser) {
      const r = await ctApi('bien-upsert', { bien: b });
      if (r && r.bien) {
        ctTempBien = null;
        await ctLoadBiens();
        ctSelectedBienId = r.bien.id;
        ctRenderBiens();
      } else {
        alert('Erreur : ' + (r && r.error));
      }
    } else {
      // Guest mode — save to localStorage
      if (!b.id) b.id = 'local_' + Date.now();
      const idx = ctBiens.findIndex(x => x.id === b.id);
      if (idx >= 0) ctBiens[idx] = b; else ctBiens.push(b);
      ctLsSet(CT_LS_BIENS, ctBiens);
      ctTempBien = null;
      ctSelectedBienId = b.id;
      ctRenderBiens();
      ctShowSavePopup();
    }
  };

  window.ctDeleteBien = async function () {
    if (!confirm('Supprimer ce bien ? Les contrats existants liés à ce bien resteront dans votre dashboard.')) return;
    if (_ctUser) {
      const r = await ctApi('bien-delete', { bienId: ctSelectedBienId });
      if (r && r.ok) {
        ctTempBien = null;
        ctSelectedBienId = null;
        await ctLoadBiens();
        ctRenderBiens();
      }
    } else {
      ctBiens = ctBiens.filter(b => b.id !== ctSelectedBienId);
      ctLsSet(CT_LS_BIENS, ctBiens);
      ctTempBien = null;
      ctSelectedBienId = null;
      ctRenderBiens();
    }
  };

  // ─── SETTINGS (bailleur) ────────────────────────────────────────
  window.ctRenderSettings = function () { return ctRenderSettings(); };
  function ctRenderSettings() {
    const b = ctBailleur || {};
    const html = '<div style="background:var(--ct-card);border:1px solid var(--ct-border);border-radius:10px;padding:28px">' +
      '<div class="section-title"><span class="section-num">01</span> Type de bailleur</div>' +
      '<div style="display:flex;gap:8px;background:var(--ct-mid);padding:4px;border-radius:10px;margin-bottom:20px" id="ctset-type-switch">' +
      '<button class="radio-pill' + (b.type !== 'societe' ? ' active' : '') + '" style="flex:1;border-radius:8px" onclick="ctSetType(\'particulier\', this)">👤 Particulier</button>' +
      '<button class="radio-pill' + (b.type === 'societe' ? ' active' : '') + '" style="flex:1;border-radius:8px" onclick="ctSetType(\'societe\', this)">🏢 Société</button>' +
      '</div>' +
      '<input type="hidden" id="ctset-type" value="' + (b.type || 'particulier') + '">' +

      '<div class="section-title"><span class="section-num">02</span> Identité</div>' +
      '<div class="field-row"><div class="field"><label class="field-label">Prénom <span class="req">*</span></label><input type="text" class="input" id="ctset-prenom" value="' + esc(b.prenom) + '"></div>' +
      '<div class="field"><label class="field-label">Nom <span class="req">*</span></label><input type="text" class="input" id="ctset-nom" value="' + esc(b.nom) + '"></div></div>' +
      '<div class="field-row"><div class="field"><label class="field-label">Email <span class="req">*</span></label><input type="email" class="input" id="ctset-email" value="' + esc(b.email || (_ctUser && _ctUser.email) || '') + '"></div>' +
      '<div class="field"><label class="field-label">Téléphone</label><input type="tel" class="input" id="ctset-tel" value="' + esc(b.telephone) + '"></div></div>' +
      '<div class="field"><label class="field-label">Adresse complète <span class="req">*</span></label><input type="text" class="input" id="ctset-adresse" value="' + esc(b.adresse) + '"></div>' +

      '<div class="section-title" style="margin-top:28px"><span class="section-num">03</span> Fiscalité (optionnel)</div>' +
      '<div class="field-row"><div class="field"><label class="field-label">Raison sociale / N° SIRET</label><input type="text" class="input" id="ctset-siret" value="' + esc(b.siret || b.raison_sociale) + '"></div>' +
      '<div class="field"><label class="field-label">Régime fiscal</label><select class="select" id="ctset-regime">' +
      ['Particulier', 'LMNP Micro-BIC', 'LMNP réel simplifié', 'LMP', 'Société (SCI, SARL)'].map(r => '<option' + (b.regime_fiscal === r ? ' selected' : '') + '>' + r + '</option>').join('') +
      '</select></div></div>' +

      '<div class="section-title" style="margin-top:28px"><span class="section-num">04</span> Coordonnées bancaires (RIB)</div>' +
      '<p style="font-size:12px;color:var(--ct-muted);margin-bottom:14px">Le RIB sera affiché sur le contrat pour les virements. <strong>Jamais partagé en dehors du contrat.</strong></p>' +
      '<div class="field"><label class="field-label">Titulaire du compte</label><input type="text" class="input" id="ctset-titulaire" value="' + esc(b.titulaire_compte) + '"></div>' +
      '<div class="field-row"><div class="field"><label class="field-label">IBAN</label><input type="text" class="input" id="ctset-iban" value="' + esc(b.iban) + '" placeholder="FR76 ••••"></div>' +
      '<div class="field"><label class="field-label">BIC</label><input type="text" class="input" id="ctset-bic" value="' + esc(b.bic) + '"></div></div>' +

      '<div class="section-title" style="margin-top:28px"><span class="section-num">05</span> Langue par défaut</div>' +
      '<div class="radio-group" data-group="lang_defaut">' +
      '<button class="radio-pill' + (b.lang_defaut !== 'en' ? ' active' : '') + '" onclick="ctToggleRadio(this)" data-val="fr">🇫🇷 Français</button>' +
      '<button class="radio-pill' + (b.lang_defaut === 'en' ? ' active' : '') + '" onclick="ctToggleRadio(this)" data-val="en">🇬🇧 English</button>' +
      '</div>' +

      '<div class="save-bar" style="margin-top:28px"><div><div style="font-family:var(--ct-mono);font-size:11px;color:var(--ct-muted)">' + (b.updated_at ? 'Dernière modification : ' + fmtDate(b.updated_at) : 'Jamais enregistré') + '</div></div>' +
      '<div><button class="btn accent" onclick="ctSaveBailleur()">Enregistrer</button></div></div>' +
      '</div>';
    document.getElementById('ctsettings-body').innerHTML = html;
  }

  window.ctSetType = function (type, btn) {
    document.getElementById('ctset-type').value = type;
    document.querySelectorAll('#ctset-type-switch .radio-pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
  };

  window.ctSaveBailleur = async function () {
    const payload = {
      type: document.getElementById('ctset-type').value,
      prenom: document.getElementById('ctset-prenom').value.trim(),
      nom: document.getElementById('ctset-nom').value.trim(),
      email: document.getElementById('ctset-email').value.trim(),
      telephone: document.getElementById('ctset-tel').value.trim(),
      adresse: document.getElementById('ctset-adresse').value.trim(),
      siret: document.getElementById('ctset-siret').value.trim(),
      regime_fiscal: document.getElementById('ctset-regime').value,
      titulaire_compte: document.getElementById('ctset-titulaire').value.trim(),
      iban: document.getElementById('ctset-iban').value.trim(),
      bic: document.getElementById('ctset-bic').value.trim(),
      lang_defaut: document.querySelector('[data-group="lang_defaut"] .radio-pill.active').dataset.val
    };
    if (!payload.prenom || !payload.nom) { alert('Prénom et nom obligatoires'); return; }
    if (!payload.email) { alert('Email obligatoire'); return; }
    if (_ctUser) {
      const r = await ctApi('bailleur-upsert', { bailleur: payload });
      if (r && r.bailleur) {
        ctBailleur = r.bailleur;
        ctRenderSettings();
        const btn = document.querySelector('#ctsettings-body .btn.accent');
        if (btn) { const o = btn.textContent; btn.textContent = '✓ Enregistré'; btn.style.background = 'var(--ct-green)'; btn.style.borderColor = 'var(--ct-green)'; setTimeout(() => { btn.textContent = o; btn.style.background = ''; btn.style.borderColor = ''; }, 1500); }
      } else alert('Erreur : ' + (r && r.error));
    } else {
      // Guest mode
      ctBailleur = payload;
      ctLsSet(CT_LS_BAILLEUR, ctBailleur);
      ctRenderSettings();
      const btn = document.querySelector('#ctsettings-body .btn.accent');
      if (btn) { const o = btn.textContent; btn.textContent = '✓ Enregistré'; btn.style.background = 'var(--ct-green)'; btn.style.borderColor = 'var(--ct-green)'; setTimeout(() => { btn.textContent = o; btn.style.background = ''; btn.style.borderColor = ''; }, 1500); }
      ctShowSavePopup();
    }
  };

  // ─── WIZARD NOUVEAU CONTRAT ─────────────────────────────────────
  window.ctNewContract = function () {
    if (!ctBiens.length) {
      alert('Ajoutez d\'abord un bien dans "Mes biens".');
      ctShowScreen('ctscreen-biens');
      return;
    }
    ctEditingContratId = null;
    ctWizardStep = 1;
    ctWizardData = { bien_id: null, locataire_nom: '', locataire_prenom: '', locataire_email: '', locataire_telephone: '', locataire_adresse: '', nb_adultes: 2, nb_enfants: 0, date_arrivee: '', date_depart: '', heure_arrivee: '15h00', heure_depart: '11h00', prix_total: 0, mode_paiement: 'virement', acompte_pourcentage: 30, acompte_montant: 0, acompte_date_limite: '', solde_date_limite: '', caution: 0, taxe_sejour_montant: 0, frais_menage: 0, langue: (ctBailleur && ctBailleur.lang_defaut) || 'fr' };
    ctShowScreen('ctscreen-new-contract');
    ctRenderWizard();
  };

  window.ctRenderWizard = function () { return ctRenderWizard(); };
  function ctRenderWizard() {
    const body = document.getElementById('ctwizard-body');
    const stepsHtml = [1, 2, 3].map(i => {
      const cls = ctWizardStep === i ? 'active' : (i < ctWizardStep ? 'done' : '');
      const label = i === 1 ? 'Bien' : i === 2 ? 'Locataire & séjour' : 'Aperçu & téléchargement';
      return '<div class="wstep ' + cls + '"><div class="wstep-circle">' + (i < ctWizardStep ? '✓' : i) + '</div><div class="wstep-label">' + label + '</div></div>';
    }).join('');

    if (ctWizardStep === 1) {
      body.innerHTML = '<div class="wizard-steps">' + stepsHtml + '</div>' +
        '<div class="section-title"><span class="section-num">01</span> Choisissez un bien</div>' +
        '<div class="bien-cards">' +
        ctBiens.map(b => '<div class="bien-card' + (ctWizardData.bien_id === b.id ? ' active' : '') + '" onclick="ctWizardSelectBien(\'' + b.id + '\')"><div class="bien-card-emoji">' + bienIcon(b.type_bien) + '</div><div class="bien-card-name">' + esc(b.nom_interne) + '</div><div class="bien-card-meta">' + esc(b.type_bien || '') + ' · ' + (b.capacite_max || '?') + ' pers.</div></div>').join('') +
        '</div>' +
        '<div style="display:flex;justify-content:space-between;padding-top:20px;border-top:1px solid var(--ct-border);margin-top:20px">' +
        '<button class="btn" onclick="ctShowScreen(\'ctscreen-dashboard\')">← Annuler</button>' +
        '<button class="btn accent lg" onclick="ctWizardNext()" ' + (ctWizardData.bien_id ? '' : 'disabled') + '>Étape suivante →</button></div>';
    } else if (ctWizardStep === 2) {
      const bien = ctBiens.find(b => b.id === ctWizardData.bien_id);
      if (!bien) { ctWizardStep = 1; ctRenderWizard(); return; }
      body.innerHTML = '<div class="wizard-steps">' + stepsHtml + '</div>' +
        '<div style="background:var(--ct-mid);border:1px solid var(--ct-border);border-radius:10px;padding:14px 18px;margin-bottom:24px;display:flex;align-items:center;gap:12px">' +
        '<div style="width:38px;height:38px;border-radius:8px;background:var(--ct-accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:18px">' + bienIcon(bien.type_bien) + '</div>' +
        '<div style="flex:1"><div style="font-size:13px;font-weight:600">' + esc(bien.nom_interne) + '</div><div style="font-family:var(--ct-mono);font-size:10px;color:var(--ct-muted)">' + esc(bien.adresse || '') + '</div></div>' +
        '<button class="btn sm" onclick="ctGoStep(1)">Changer</button></div>' +

        '<div class="section-title"><span class="section-num">02</span> Locataire</div>' +
        '<div class="field-row"><div class="field"><label class="field-label">Prénom <span class="req">*</span></label><input type="text" class="input" id="ctw-prenom" value="' + esc(ctWizardData.locataire_prenom) + '"></div>' +
        '<div class="field"><label class="field-label">Nom <span class="req">*</span></label><input type="text" class="input" id="ctw-nom" value="' + esc(ctWizardData.locataire_nom) + '"></div></div>' +
        '<div class="field-row"><div class="field"><label class="field-label">Email</label><input type="email" class="input" id="ctw-email" value="' + esc(ctWizardData.locataire_email) + '"></div>' +
        '<div class="field"><label class="field-label">Téléphone</label><input type="tel" class="input" id="ctw-tel" value="' + esc(ctWizardData.locataire_telephone) + '"></div></div>' +
        '<div class="field"><label class="field-label">Adresse de résidence principale</label><input type="text" class="input" id="ctw-addr" value="' + esc(ctWizardData.locataire_adresse) + '"></div>' +
        '<div class="field-row"><div class="field"><label class="field-label">Adultes</label><input type="number" class="input" id="ctw-ad" value="' + (ctWizardData.nb_adultes || 2) + '" min="1"></div>' +
        '<div class="field"><label class="field-label">Enfants</label><input type="number" class="input" id="ctw-en" value="' + (ctWizardData.nb_enfants || 0) + '" min="0"></div></div>' +

        '<div class="section-title" style="margin-top:28px"><span class="section-num">03</span> Dates du séjour</div>' +
        '<div class="field-row-4"><div class="field"><label class="field-label">Arrivée</label><input type="date" class="input" id="ctw-arr" value="' + (ctWizardData.date_arrivee || '') + '" onchange="ctRecalcNights()"></div>' +
        '<div class="field"><label class="field-label">Heure</label><input type="text" class="input" id="ctw-arrh" value="' + (ctWizardData.heure_arrivee || '15h00') + '"></div>' +
        '<div class="field"><label class="field-label">Départ</label><input type="date" class="input" id="ctw-dep" value="' + (ctWizardData.date_depart || '') + '" onchange="ctRecalcNights()"></div>' +
        '<div class="field"><label class="field-label">Heure</label><input type="text" class="input" id="ctw-deph" value="' + (ctWizardData.heure_depart || '11h00') + '"></div></div>' +
        '<div id="ctw-nights-info" style="font-family:var(--ct-mono);font-size:11px;color:var(--ct-muted);margin-bottom:20px">→ Durée : <strong id="ctw-nights-num">—</strong></div>' +

        '<div class="section-title" style="margin-top:10px"><span class="section-num">04</span> Montants & paiements</div>' +
        '<div class="field-row"><div class="field"><label class="field-label">Loyer total <span class="req">*</span></label><input type="number" class="input" id="ctw-prix" value="' + (ctWizardData.prix_total || '') + '" onchange="ctRecalcAcompte()"></div>' +
        '<div class="field"><label class="field-label">Mode de paiement</label><select class="select" id="ctw-paie">' + ['virement', 'chèque', 'CB', 'espèces'].map(m => '<option' + (ctWizardData.mode_paiement === m ? ' selected' : '') + '>' + m + '</option>').join('') + '</select></div></div>' +

        '<div class="field"><label class="field-label">Acompte (%)</label><div class="radio-group" id="ctw-ac-pc">' +
        [20, 30, 50, 70, 100].map(p => '<button class="radio-pill' + (ctWizardData.acompte_pourcentage === p ? ' active' : '') + '" onclick="ctSetAcomptePct(' + p + ',this)">' + p + ' %' + (p === 100 ? ' <span style="font-size:9px;color:var(--ct-muted2);margin-left:4px">(intégral)</span>' : '') + '</button>').join('') +
        '</div></div>' +

        '<div class="field-row-3"><div class="field"><label class="field-label">Montant acompte</label><input type="number" class="input" id="ctw-acm" value="' + (ctWizardData.acompte_montant || 0) + '"></div>' +
        '<div class="field"><label class="field-label">Date limite acompte</label><input type="date" class="input" id="ctw-acd" value="' + (ctWizardData.acompte_date_limite || '') + '"></div>' +
        '<div class="field"><label class="field-label">Date limite solde</label><input type="date" class="input" id="ctw-sod" value="' + (ctWizardData.solde_date_limite || '') + '"></div></div>' +
        '<div class="field-row"><div class="field"><label class="field-label">Caution</label><input type="number" class="input" id="ctw-cau" value="' + (ctWizardData.caution || bien.caution_defaut || 500) + '"><div class="field-hint">Restituée 7 j après le départ</div></div>' +
        '<div class="field"><label class="field-label">Taxe de séjour</label><input type="number" class="input" id="ctw-tax" value="' + (ctWizardData.taxe_sejour_montant || 0) + '" step="0.01"><div class="field-hint" id="ctw-tax-hint"></div></div></div>' +

        '<div class="section-title" style="margin-top:28px"><span class="section-num">05</span> Langue du contrat</div>' +
        '<div class="lang-switch"><span style="font-family:var(--ct-mono);font-size:11px;color:var(--ct-muted);padding-right:8px;border-right:1px solid var(--ct-border);margin-right:4px">Langue de génération</span>' +
        '<button class="lang-btn' + (ctWizardData.langue === 'fr' ? ' active' : '') + '" onclick="ctSetLang(\'fr\')">🇫🇷 Français</button>' +
        '<button class="lang-btn' + (ctWizardData.langue === 'en' ? ' active' : '') + '" onclick="ctSetLang(\'en\')">🇬🇧 English</button>' +
        '</div>' +

        '<div style="display:flex;justify-content:space-between;padding-top:20px;border-top:1px solid var(--ct-border);margin-top:20px">' +
        '<button class="btn" onclick="ctGoStep(1)">← Étape précédente</button>' +
        '<button class="btn accent lg" onclick="ctWizardFinalize()">Générer le contrat →</button></div>';

      // Recalculer les nuits
      setTimeout(ctRecalcNights, 0);
      // Auto-calculate taxe de séjour if DB loaded and dates set
      setTimeout(function () {
        var taxInput = document.getElementById('ctw-tax');
        var taxHint = document.getElementById('ctw-tax-hint');
        if (!taxInput || !bien) return;
        var calc = ctAutoCalcTaxe(bien, ctWizardData);
        if (calc && taxHint) {
          taxHint.textContent = calc.unite === '%' ?
            calc.taux + ' % du prix/nuit \u00d7 ' + calc.nuits + ' nuits = ' + fmtEurP(calc.total) + ' (' + calc.ville + ')' :
            calc.taux + ' \u20ac/pers/nuit \u00d7 ' + calc.personnes + ' pers \u00d7 ' + calc.nuits + ' nuits = ' + fmtEurP(calc.total) + ' (' + calc.ville + ')';
          taxHint.style.color = 'var(--ct-green)';
          // Pre-fill only if current value is 0 (don't override user edits)
          if (!ctWizardData.taxe_sejour_montant || ctWizardData.taxe_sejour_montant === 0) {
            taxInput.value = calc.total;
          }
        } else if (taxHint) {
          var ville = bien.adresse ? _ctExtractVille(bien.adresse) : '';
          if (ville && _ctTaxeDb) {
            taxHint.textContent = 'Commune « ' + ville + ' » non trouvée dans la base de taxe de séjour';
            taxHint.style.color = 'var(--ct-muted2)';
          }
        }
      }, 50);
    } else {
      // Étape 3 = aperçu + téléchargement
      const bien = ctBiens.find(b => b.id === ctWizardData.bien_id);
      const n = nights(ctWizardData.date_arrivee, ctWizardData.date_depart);
      body.innerHTML = '<div class="wizard-steps">' + stepsHtml + '</div>' +
        '<div class="resume-block">' +
        '<div class="resume-section"><div class="resume-label">Prix total</div><div class="resume-value">' + fmtEur(ctWizardData.prix_total) + '</div>' +
        '<div style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--ct-border);font-size:12px"><div style="display:flex;justify-content:space-between;padding:4px 0"><span>Séjour ' + n + ' nuit' + (n > 1 ? 's' : '') + '</span><span>' + fmtEur(ctWizardData.prix_total) + '</span></div>' +
        (ctWizardData.taxe_sejour_montant ? '<div style="display:flex;justify-content:space-between;padding:4px 0"><span>+ Taxe de séjour</span><span>' + fmtEur(ctWizardData.taxe_sejour_montant) + '</span></div>' : '') +
        '<div style="display:flex;justify-content:space-between;padding:8px 0 0;margin-top:6px;border-top:1px solid var(--ct-border);font-weight:600"><span>Total dû par le locataire</span><span style="color:var(--ct-accent)">' + fmtEur((+ctWizardData.prix_total || 0) + (+ctWizardData.taxe_sejour_montant || 0)) + '</span></div></div></div>' +

        '<div class="resume-section"><div class="resume-label">Caution (restituée)</div><div class="resume-value" style="color:var(--ct-accent)">' + fmtEur(ctWizardData.caution) + '</div></div>' +

        '<div class="resume-section"><div class="resume-label">Échéancier</div>' +
        '<div class="timeline">' +
        '<div class="tl-step done"><div class="tl-dot">✓</div><div><div class="tl-date">Aujourd\'hui</div><div class="tl-title">Signature du contrat</div></div></div>' +
        '<div class="tl-step upcoming"><div class="tl-dot">1</div><div><div class="tl-date">' + (ctWizardData.acompte_date_limite ? fmtDate(ctWizardData.acompte_date_limite) : '—') + '</div><div class="tl-title">Acompte (' + ctWizardData.acompte_pourcentage + ' %)</div><div class="tl-amount">+' + fmtEur(ctWizardData.acompte_montant) + '</div></div></div>' +
        '<div class="tl-step upcoming"><div class="tl-dot">2</div><div><div class="tl-date">' + (ctWizardData.solde_date_limite ? fmtDate(ctWizardData.solde_date_limite) : '—') + '</div><div class="tl-title">Solde + Caution</div><div class="tl-amount">+' + fmtEur((+ctWizardData.prix_total || 0) - (+ctWizardData.acompte_montant || 0)) + ' + ' + fmtEur(ctWizardData.caution) + '</div></div></div>' +
        '<div class="tl-step upcoming"><div class="tl-dot">↺</div><div><div class="tl-date">Départ + 7 jours</div><div class="tl-title">Restitution caution</div><div class="tl-amount">-' + fmtEur(ctWizardData.caution) + '</div></div></div>' +
        '</div></div>' +
        '</div>' +

        '<div style="display:flex;justify-content:space-between;padding-top:20px;border-top:1px solid var(--ct-border);margin-top:20px">' +
        '<button class="btn" onclick="ctGoStep(2)">← Modifier</button>' +
        '<button class="btn accent lg" onclick="ctSaveContract()">💾 Enregistrer ce contrat</button></div>';

      document.getElementById('ctbtn-pdf').disabled = false;
      document.getElementById('ctbtn-word').disabled = false;
    }

    ctUpdatePreview();
  }

  window.ctWizardSelectBien = function (id) {
    ctWizardData.bien_id = id;
    const b = ctBiens.find(x => x.id === id);
    if (b) {
      ctWizardData.caution = b.caution_defaut || 500;
      ctWizardData.frais_menage = b.frais_menage_defaut || 0;
    }
    ctRenderWizard();
  };

  window.ctWizardNext = function () {
    if (ctWizardStep === 1 && !ctWizardData.bien_id) return;
    if (ctWizardStep === 2) {
      ctCollectWizardStep2();
      if (!ctValidateStep2()) return;
    }
    ctWizardStep++;
    ctRenderWizard();
  };

  function ctCollectWizardStep2() {
    ctWizardData.locataire_prenom = document.getElementById('ctw-prenom').value.trim();
    ctWizardData.locataire_nom = document.getElementById('ctw-nom').value.trim();
    ctWizardData.locataire_email = document.getElementById('ctw-email').value.trim();
    ctWizardData.locataire_telephone = document.getElementById('ctw-tel').value.trim();
    ctWizardData.locataire_adresse = document.getElementById('ctw-addr').value.trim();
    ctWizardData.nb_adultes = parseInt(document.getElementById('ctw-ad').value) || 1;
    ctWizardData.nb_enfants = parseInt(document.getElementById('ctw-en').value) || 0;
    ctWizardData.date_arrivee = document.getElementById('ctw-arr').value;
    ctWizardData.heure_arrivee = document.getElementById('ctw-arrh').value || '15h00';
    ctWizardData.date_depart = document.getElementById('ctw-dep').value;
    ctWizardData.heure_depart = document.getElementById('ctw-deph').value || '11h00';
    ctWizardData.prix_total = parseFloat(document.getElementById('ctw-prix').value) || 0;
    ctWizardData.mode_paiement = document.getElementById('ctw-paie').value;
    ctWizardData.acompte_montant = parseFloat(document.getElementById('ctw-acm').value) || 0;
    ctWizardData.acompte_date_limite = document.getElementById('ctw-acd').value;
    ctWizardData.solde_date_limite = document.getElementById('ctw-sod').value;
    ctWizardData.caution = parseFloat(document.getElementById('ctw-cau').value) || 0;
    ctWizardData.taxe_sejour_montant = parseFloat(document.getElementById('ctw-tax').value) || 0;
    ctWizardData.solde_montant = ctWizardData.prix_total - ctWizardData.acompte_montant;
  }

  function ctValidateStep2() {
    const d = ctWizardData;
    if (!d.locataire_nom) { alert('Nom du locataire requis'); return false; }
    if (!d.date_arrivee || !d.date_depart) { alert('Dates d\'arrivée et de départ requises'); return false; }
    if (new Date(d.date_depart) <= new Date(d.date_arrivee)) { alert('La date de départ doit être après l\'arrivée'); return false; }
    if (!d.prix_total || d.prix_total <= 0) { alert('Prix total requis'); return false; }
    const bien = ctBiens.find(b => b.id === d.bien_id);
    const totalPers = d.nb_adultes + d.nb_enfants;
    if (bien && bien.capacite_max && totalPers > bien.capacite_max) {
      if (!confirm('Le nombre de personnes (' + totalPers + ') dépasse la capacité max du bien (' + bien.capacite_max + '). Continuer quand même ?')) return false;
    }
    return true;
  }

  window.ctRecalcNights = function () {
    const d1 = document.getElementById('ctw-arr').value;
    const d2 = document.getElementById('ctw-dep').value;
    const n = nights(d1, d2);
    const el = document.getElementById('ctw-nights-num');
    if (el) el.textContent = n + ' nuit' + (n > 1 ? 's' : '');
  };

  window.ctSetAcomptePct = function (pct, btn) {
    ctWizardData.acompte_pourcentage = pct;
    document.querySelectorAll('#ctw-ac-pc .radio-pill').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    const prix = parseFloat(document.getElementById('ctw-prix').value) || 0;
    const acm = Math.round(prix * pct / 100 * 100) / 100;
    document.getElementById('ctw-acm').value = acm;
    ctWizardData.acompte_montant = acm;
  };

  window.ctRecalcAcompte = function () {
    const prix = parseFloat(document.getElementById('ctw-prix').value) || 0;
    const acm = Math.round(prix * ctWizardData.acompte_pourcentage / 100 * 100) / 100;
    document.getElementById('ctw-acm').value = acm;
    ctWizardData.acompte_montant = acm;
  };

  window.ctWizardFinalize = function () {
    ctCollectWizardStep2();
    if (!ctValidateStep2()) return;
    ctWizardStep = 3;
    ctRenderWizard();
  };

  // ─── PREVIEW (mise à jour live) ─────────────────────────────────
  function ctUpdatePreview() {
    const preview = document.getElementById('ctpreview-body');
    if (!preview) return;
    const d = ctWizardData;
    if (!d.bien_id) {
      preview.innerHTML = '<div class="pdf-page"><div class="pdf-h1">CONTRAT DE LOCATION SAISONNIÈRE</div><div class="pdf-p" style="color:#888;font-style:italic">Sélectionnez un bien pour voir l\'aperçu.</div></div>';
      document.getElementById('ctbtn-pdf').disabled = true;
      document.getElementById('ctbtn-word').disabled = true;
      return;
    }
    const bien = ctBiens.find(b => b.id === d.bien_id);
    const html = buildContratHtml(d, bien, ctBailleur || {}, 'preview');
    preview.innerHTML = '<div class="pdf-page" style="max-width:360px">' + html + '</div>';
    document.getElementById('ctbtn-pdf').disabled = false;
    document.getElementById('ctbtn-word').disabled = false;
  }

  // ─── CONTRAT TEMPLATES (FR / EN) ────────────────────────────────
  function buildContratHtml(d, bien, bailleur, mode) {
    const lang = d.langue || 'fr';
    const L = T[lang];
    const n = nights(d.date_arrivee, d.date_depart);

    const bailleurLine = bailleur.type === 'societe'
      ? `${esc(bailleur.raison_sociale || '')} — SIRET ${esc(bailleur.siret || '')}`
      : `${esc(bailleur.prenom || '')} ${esc(bailleur.nom || '')}`;
    const bailleurAddr = `${esc(bailleur.adresse || '')}${bailleur.email ? ', ' + esc(bailleur.email) : ''}${bailleur.telephone ? ', ' + esc(bailleur.telephone) : ''}`;

    const locataireLine = `${esc(d.locataire_prenom || '')} ${esc(d.locataire_nom)}`;
    const locataireAddr = `${esc(d.locataire_adresse || '')}${d.locataire_email ? ', ' + esc(d.locataire_email) : ''}${d.locataire_telephone ? ', ' + esc(d.locataire_telephone) : ''}`;

    const equips = (Array.isArray(bien.equipements) ? bien.equipements : []).join(', ') || '—';
    const invTotal = computeInventaireTotal(bien.inventaire);
    const totalPers = (+d.nb_adultes || 0) + (+d.nb_enfants || 0);

    const parts = [
      `<h1>${L.title}</h1>`,
      `<h2>${L.h_parties}</h2>`,
      `<p><strong>${L.bailleur}:</strong> ${bailleurLine}. ${bailleurAddr}.</p>`,
      `<p><strong>${L.preneur}:</strong> ${locataireLine}. ${locataireAddr}.</p>`,

      `<h2>${L.h_objet}</h2>`,
      `<p>${L.objet_text}</p>`,

      `<h2>${L.h_logement}</h2>`,
      `<p><strong>${esc(bien.nom_interne || '')}</strong> — ${esc(bien.adresse || '')}. ${L.surface}: ${bien.surface || '—'} m². ${L.pieces}: ${bien.nb_pieces || '—'}. ${L.classement}: ${esc(bien.classement || '—')}. ${L.capacite}: ${bien.capacite_max || '—'} ${L.pers}.${bien.numero_declaration_mairie ? ' ' + L.num_mairie + ': ' + esc(bien.numero_declaration_mairie) + '.' : ''}</p>`,
      `<p><strong>${L.equipements}:</strong> ${equips}.</p>`,

      `<h2>${L.h_duree}</h2>`,
      `<p>${L.du} <strong>${fmtDate(d.date_arrivee)} ${L.a} ${d.heure_arrivee}</strong> ${L.au} <strong>${fmtDate(d.date_depart)} ${L.a} ${d.heure_depart}</strong>, ${L.soit} ${n} ${n > 1 ? L.nuits : L.nuit}. ${L.duree_text}</p>`,

      `<h2>${L.h_prix}</h2>`,
      `<p>${L.loyer}: <strong>${fmtEurP(d.prix_total)}</strong> ${L.pour_total}.</p>`,
      `<p>${L.acompte_text(d.acompte_pourcentage, fmtEurP(d.acompte_montant), d.acompte_date_limite ? fmtDate(d.acompte_date_limite) : '—')}</p>`,
      `<p>${L.solde_text(fmtEurP((d.prix_total || 0) - (d.acompte_montant || 0)), d.solde_date_limite ? fmtDate(d.solde_date_limite) : '—')}</p>`,
      d.taxe_sejour_montant > 0 ? `<p>${L.taxe_sejour}: ${fmtEurP(d.taxe_sejour_montant)} ${L.en_sus}.</p>` : '',

      `<h2>${L.h_caution}</h2>`,
      `<p>${L.caution_text(fmtEurP(d.caution))}</p>`,

      `<h2>${L.h_edl}</h2>`,
      `<p>${L.edl_text(fmtEurP(invTotal))}</p>`,

      `<h2>${L.h_obligations}</h2>`,
      `<p>${L.obligations_text(totalPers)}</p>`,
      bien.animaux === 'non' ? `<p>${L.animaux_non}</p>` : bien.animaux === 'oui' ? `<p>${L.animaux_oui}</p>` : `<p>${L.animaux_demande}</p>`,
      bien.fumeurs === 'non' ? `<p>${L.fumeurs_non}</p>` : '',
      bien.fetes === 'non' ? `<p>${L.fetes_non}</p>` : '',

      `<h2>${L.h_annulation}</h2>`,
      `<p>${L.annulation_text[bien.conditions_annulation || 'standard']}</p>`,

      `<h2>${L.h_assurance}</h2>`,
      `<p>${L.assurance_text[bien.assurance_villegiature || 'obligatoire']}</p>`,

      bien.clauses_particulieres ? `<h2>${L.h_clauses}</h2><p>${esc(bien.clauses_particulieres)}</p>` : '',

      `<h2>${L.h_domicile}</h2>`,
      `<p>${L.domicile_text}</p>`,

      `<p style="margin-top:16pt">${L.lu_approuve}</p>`,
      `<div class="sig"><div><strong>${L.bailleur}</strong><br>${L.date_lieu}</div><div><strong>${L.preneur}</strong><br>${L.date_lieu}</div></div>`,

      // Annexes : inventaire
      bien.inventaire && bien.inventaire.pieces && bien.inventaire.pieces.length ? `<h2 style="margin-top:24pt">${L.h_annexe_inventaire}</h2>${bien.inventaire.pieces.map(p => `<h3 style="font-size:10pt;font-weight:600;margin-top:8pt">${esc(p.nom)}</h3><table><tr><th>${L.objet}</th><th>${L.qte}</th><th>${L.etat}</th><th>${L.valeur}</th></tr>${(p.items || []).map(it => `<tr><td>${esc(it.objet)}</td><td>${it.qte || 1}</td><td>${esc(it.etat || '')}</td><td>${fmtEur((+it.valeur || 0) * (+it.qte || 1))}</td></tr>`).join('')}</table>`).join('')}<p style="margin-top:8pt"><strong>${L.inventaire_total}: ${fmtEur(invTotal)}</strong></p>` : '',

      // Annexe règlement
      bien.reglement_interieur ? `<h2 style="margin-top:20pt">${L.h_annexe_reglement}</h2><p style="white-space:pre-wrap">${esc(bien.reglement_interieur)}</p>` : ''
    ];

    return parts.join('');
  }

  // Templates bilingues
  const T = {
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
      h_annexe_reglement: 'Annexe 2 — Règlement intérieur'
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
      h_annexe_reglement: 'Appendix 2 — House rules'
    }
  };

  // ─── EXPORT PDF (jsPDF) ──────────────────────────────────────────
  window.ctExportPdf = function () {
    try {
    if (!window.jspdf) {
      // Load jsPDF dynamically if not available
      var s = document.createElement('script');
      s.src = '/jspdf.min.js';
      s.onload = function() { window.ctExportPdf(); };
      s.onerror = function() { alert('Erreur : impossible de charger la librairie PDF. Vérifiez votre connexion internet.'); };
      document.head.appendChild(s);
      return;
    }
    const bien = ctBiens.find(b => b.id === ctWizardData.bien_id);
    if (!bien) { alert('Aucun bien sélectionné'); return; }
    const d = ctWizardData;
    const bailleur = ctBailleur || {};
    const lang = d.langue || 'fr';
    const L = T[lang];
    const n = nights(d.date_arrivee, d.date_depart);
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pw = 170; // printable width (A4 = 210 - 20*2)
    let y = 20;

    function checkPage(need) {
      if (y + need > 270) { doc.addPage(); y = 20; }
    }

    function addTitle(text) {
      checkPage(16);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      var lines = doc.splitTextToSize(text, pw);
      doc.text(lines, 105, y, { align: 'center' });
      y += lines.length * 8;
      doc.setLineWidth(0.4);
      doc.line(20, y, 190, y);
      y += 10;
    }

    function addH2(text) {
      checkPage(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(text.toUpperCase(), 20, y);
      y += 6;
    }

    function addPara(text) {
      if (!text) return;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      var lines = doc.splitTextToSize(text, pw);
      for (var i = 0; i < lines.length; i++) {
        checkPage(5);
        doc.text(lines[i], 20, y);
        y += 4.5;
      }
      y += 3;
    }

    function addBoldPara(label, text) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      var full = label + ' ' + text;
      var lines = doc.splitTextToSize(full, pw);
      for (var i = 0; i < lines.length; i++) {
        checkPage(5);
        doc.text(lines[i], 20, y);
        y += 4.5;
      }
      y += 3;
      doc.setFont('helvetica', 'normal');
    }

    // Build data
    var bailleurLine = bailleur.type === 'societe'
      ? (bailleur.raison_sociale || '') + ' — SIRET ' + (bailleur.siret || '')
      : (bailleur.prenom || '') + ' ' + (bailleur.nom || '');
    var bailleurAddr = (bailleur.adresse || '') + (bailleur.email ? ', ' + bailleur.email : '') + (bailleur.telephone ? ', ' + bailleur.telephone : '');
    var locataireLine = (d.locataire_prenom || '') + ' ' + (d.locataire_nom || '');
    var locataireAddr = (d.locataire_adresse || '') + (d.locataire_email ? ', ' + d.locataire_email : '') + (d.locataire_telephone ? ', ' + d.locataire_telephone : '');
    var equips = (Array.isArray(bien.equipements) ? bien.equipements : []).join(', ') || '—';
    var invTotal = computeInventaireTotal(bien.inventaire);
    var totalPers = (+d.nb_adultes || 0) + (+d.nb_enfants || 0);

    // Title
    addTitle(L.title);

    // I. Parties
    addH2(L.h_parties);
    addBoldPara(L.bailleur + ':', bailleurLine + '. ' + bailleurAddr);
    addBoldPara(L.preneur + ':', locataireLine + '. ' + locataireAddr);

    // II. Objet
    addH2(L.h_objet);
    addPara(L.objet_text);

    // III. Logement
    addH2(L.h_logement);
    addPara((bien.nom_interne || '') + ' — ' + (bien.adresse || '') + '. ' + L.surface + ': ' + (bien.surface || '—') + ' m\u00B2. ' + L.pieces + ': ' + (bien.nb_pieces || '—') + '. ' + L.classement + ': ' + (bien.classement || '—') + '. ' + L.capacite + ': ' + (bien.capacite_max || '—') + ' ' + L.pers + '.' + (bien.numero_declaration_mairie ? ' ' + L.num_mairie + ': ' + bien.numero_declaration_mairie + '.' : ''));
    addBoldPara(L.equipements + ':', equips + '.');

    // IV. Durée
    addH2(L.h_duree);
    addPara(L.du + ' ' + fmtDate(d.date_arrivee) + ' ' + L.a + ' ' + d.heure_arrivee + ' ' + L.au + ' ' + fmtDate(d.date_depart) + ' ' + L.a + ' ' + d.heure_depart + ', ' + L.soit + ' ' + n + ' ' + (n > 1 ? L.nuits : L.nuit) + '. ' + L.duree_text);

    // V. Prix
    addH2(L.h_prix);
    addPara(L.loyer + ': ' + fmtEurP(d.prix_total) + ' ' + L.pour_total + '.');
    addPara(L.acompte_text(d.acompte_pourcentage, fmtEurP(d.acompte_montant), d.acompte_date_limite ? fmtDate(d.acompte_date_limite) : '—'));
    addPara(L.solde_text(fmtEurP((d.prix_total || 0) - (d.acompte_montant || 0)), d.solde_date_limite ? fmtDate(d.solde_date_limite) : '—'));
    if (d.taxe_sejour_montant > 0) {
      addPara(L.taxe_sejour + ': ' + fmtEurP(d.taxe_sejour_montant) + ' ' + L.en_sus + '.');
    }

    // VI. Caution
    addH2(L.h_caution);
    addPara(L.caution_text(fmtEurP(d.caution)));

    // VII. EDL
    addH2(L.h_edl);
    addPara(L.edl_text(fmtEurP(invTotal)));

    // VIII. Obligations
    addH2(L.h_obligations);
    addPara(L.obligations_text(totalPers));
    if (bien.animaux === 'non') addPara(L.animaux_non);
    else if (bien.animaux === 'oui') addPara(L.animaux_oui);
    else addPara(L.animaux_demande);
    if (bien.fumeurs === 'non') addPara(L.fumeurs_non);
    if (bien.fetes === 'non') addPara(L.fetes_non);

    // IX. Annulation
    addH2(L.h_annulation);
    addPara(L.annulation_text[bien.conditions_annulation || 'standard']);

    // X. Assurance
    addH2(L.h_assurance);
    addPara(L.assurance_text[bien.assurance_villegiature || 'obligatoire']);

    // XI. Clauses
    if (bien.clauses_particulieres) {
      addH2(L.h_clauses);
      addPara(bien.clauses_particulieres);
    }

    // XII. Domicile
    addH2(L.h_domicile);
    addPara(L.domicile_text);

    // Signatures
    checkPage(30);
    y += 6;
    addPara(L.lu_approuve);
    y += 4;
    doc.setLineWidth(0.3);
    doc.line(20, y, 95, y);
    doc.line(115, y, 190, y);
    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(L.bailleur, 57, y, { align: 'center' });
    doc.text(L.preneur, 152, y, { align: 'center' });
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.text(L.date_lieu, 57, y, { align: 'center' });
    doc.text(L.date_lieu, 152, y, { align: 'center' });

    // Annexe inventaire
    if (bien.inventaire && bien.inventaire.pieces && bien.inventaire.pieces.length) {
      doc.addPage();
      y = 20;
      addH2(L.h_annexe_inventaire);
      bien.inventaire.pieces.forEach(function (p) {
        checkPage(14);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(p.nom, 20, y);
        y += 6;
        if (p.items && p.items.length) {
          // Table header
          checkPage(8);
          doc.setFontSize(8);
          doc.setFont('helvetica', 'bold');
          doc.setFillColor(240, 240, 240);
          doc.rect(20, y - 3.5, pw, 5, 'F');
          doc.text(L.objet, 22, y);
          doc.text(L.qte, 110, y);
          doc.text(L.etat, 130, y);
          doc.text(L.valeur, 160, y);
          y += 5;
          doc.setFont('helvetica', 'normal');
          p.items.forEach(function (it) {
            checkPage(6);
            doc.text(String(it.objet || ''), 22, y);
            doc.text(String(it.qte || 1), 110, y);
            doc.text(String(it.etat || ''), 130, y);
            doc.text(fmtEur((+it.valeur || 0) * (+it.qte || 1)), 160, y);
            y += 4.5;
          });
          y += 3;
        }
      });
      checkPage(8);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(L.inventaire_total + ': ' + fmtEur(invTotal), 20, y);
      y += 8;
    }

    // Annexe règlement
    if (bien.reglement_interieur) {
      checkPage(20);
      if (y > 40) { doc.addPage(); y = 20; }
      addH2(L.h_annexe_reglement);
      addPara(bien.reglement_interieur);
    }

    // Save
    var fname = 'contrat-' + (d.locataire_nom || 'locataire').toLowerCase().replace(/\W+/g, '-') + '-' + (d.date_arrivee || '') + '.pdf';
    doc.save(fname);
    } catch(e) {
      alert('Erreur PDF : ' + e.message);
      console.error('PDF export error:', e);
    }
  };

  // ─── EXPORT WORD (.docx via MHTML Blob) ─────────────────────────
  window.ctExportWord = function () {
    try {
    const bien = ctBiens.find(b => b.id === ctWizardData.bien_id);
    if (!bien) { alert('Aucun bien sélectionné'); return; }
    const html = buildContratHtml(ctWizardData, bien, ctBailleur || {}, 'word');
    const boundary = '----=_NextPart_' + Date.now();
    var wordHtml = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">\r\n' +
      '<head><meta charset="utf-8">\r\n' +
      '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->\r\n' +
      '<style>\r\n' +
      '@page { size: A4; margin: 2cm; }\r\n' +
      'body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; line-height: 1.6; }\r\n' +
      'h1 { font-size: 16pt; text-align: center; border-bottom: 2pt solid #000; padding-bottom: 8pt; }\r\n' +
      'h2 { font-size: 12pt; font-weight: bold; text-transform: uppercase; margin-top: 14pt; }\r\n' +
      'p { margin: 4pt 0; text-align: justify; }\r\n' +
      'table { border-collapse: collapse; width: 100%; font-size: 10pt; }\r\n' +
      'th, td { border: 1pt solid #999; padding: 4pt 6pt; }\r\n' +
      'th { background-color: #f0f0f0; }\r\n' +
      '</style>\r\n' +
      '</head><body>' + html + '</body></html>';
    var mhtml = 'MIME-Version: 1.0\r\n' +
      'Content-Type: multipart/related; boundary="' + boundary + '"\r\n\r\n' +
      '--' + boundary + '\r\n' +
      'Content-Type: text/html; charset="utf-8"\r\n' +
      'Content-Transfer-Encoding: quoted-printable\r\n\r\n' +
      wordHtml + '\r\n' +
      '--' + boundary + '--\r\n';
    const blob = new Blob(['\ufeff' + mhtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const name = (ctWizardData.locataire_nom || 'locataire').toLowerCase().replace(/\W+/g, '-');
    a.download = 'contrat-' + name + '-' + (ctWizardData.date_arrivee || '') + '.docx';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 2000);
    } catch(e) {
      alert('Erreur Word : ' + e.message);
      console.error('Word export error:', e);
    }
  };

  window.ctSaveContract = async function () {
    const d = Object.assign({}, ctWizardData);
    d.solde_montant = (d.prix_total || 0) - (d.acompte_montant || 0);
    const bien = ctBiens.find(b => b.id === d.bien_id);
    d.bien_snapshot = bien ? {
      nom_interne: bien.nom_interne, type_bien: bien.type_bien,
      adresse: bien.adresse, capacite_max: bien.capacite_max,
      numero_declaration_mairie: bien.numero_declaration_mairie
    } : null;
    if (ctEditingContratId) d.id = ctEditingContratId;
    if (_ctUser) {
      const r = await ctApi('contrat-upsert', { contrat: d });
      if (r && r.contrat) {
        await ctLoadContrats();
        ctShowScreen('ctscreen-dashboard');
      } else {
        alert('Erreur : ' + (r && r.error));
      }
    } else {
      // Guest mode
      if (!d.id) d.id = 'local_' + Date.now();
      d.created_at = d.created_at || new Date().toISOString();
      const idx = ctContrats.findIndex(c => c.id === d.id);
      if (idx >= 0) ctContrats[idx] = d; else ctContrats.push(d);
      ctLsSet(CT_LS_CONTRATS, ctContrats);
      ctShowScreen('ctscreen-dashboard');
      ctShowSavePopup();
    }
  };

  // ─── UPLOAD CONTRAT SIGNÉ ───────────────────────────────────────
  window.ctUploadSigned = async function (contratId, input) {
    const file = input.files && input.files[0];
    if (!file) return;
    if (!_ctUser) { ctOpenLoginModal(); return; }
    const path = `${_ctUser.id}/${contratId}/contrat-signe-${Date.now()}.${file.name.split('.').pop()}`;
    const { error } = await _ctSb.storage
      .from('contrats-signes')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) { alert('Upload échoué : ' + error.message); return; }
    const r = await ctApi('contrat-sign-store-path', { contratId, path });
    if (r && r.contrat) {
      const idx = ctContrats.findIndex(c => c.id === contratId);
      if (idx >= 0) ctContrats[idx] = r.contrat;
      ctRenderDashboard();
    }
  };

  window.ctDownloadSigned = async function (path) {
    const r = await ctApi('contrat-sign-signed-url', { path });
    if (r && r.url) window.open(r.url, '_blank');
  };

  // ─── SAVE POPUP (guest mode — prompt to create account) ─────────
  let _ctSavePopupShown = false;
  function ctShowSavePopup() {
    if (_ctUser || _ctSavePopupShown) return;
    _ctSavePopupShown = true;
    const el = document.getElementById('ct-save-popup');
    if (el) el.style.display = 'flex';
    // Auto-hide after 8s
    setTimeout(() => { if (el) el.style.display = 'none'; _ctSavePopupShown = false; }, 8000);
  }
  window.ctDismissSavePopup = function () {
    const el = document.getElementById('ct-save-popup');
    if (el) el.style.display = 'none';
    _ctSavePopupShown = false;
  };
  window.ctSavePopupLogin = function () {
    ctDismissSavePopup();
    ctOpenLoginModal();
  };

  // Show save popup on tab switch / page leave if guest has local data
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && !_ctUser) {
      const hasData = ctBiens.length > 0 || ctContrats.length > 0 || (ctBailleur && ctBailleur.nom);
      if (hasData) ctShowSavePopup();
    }
  });
  window.addEventListener('beforeunload', function (e) {
    if (!_ctUser) {
      const hasData = ctBiens.length > 0 || ctContrats.length > 0 || (ctBailleur && ctBailleur.nom);
      if (hasData && !localStorage.getItem('ct_guest_dismiss_warn')) {
        e.preventDefault();
        e.returnValue = '';
      }
    }
  });

  // ─── INIT ───────────────────────────────────────────────────────
  function ctReady() {
    ctBindPills();
    ctInitAuth();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ctReady);
  } else {
    ctReady();
  }
})();
