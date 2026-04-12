// ════════════════════════════════════════════════════════════════
// FACTURATION LCD — shared logic (Supabase + localStorage fallback)
// ════════════════════════════════════════════════════════════════

// Éviter double-init si plusieurs outils sur la même page
if (!window.__factInit) {
  window.__factInit = true;

  // ─── JSPDF (chargement anticipé) ───
  if (!window.jspdf) {
    var _jspdfScript = document.createElement('script');
    _jspdfScript.src = '/jspdf.min.js';
    document.head.appendChild(_jspdfScript);
  }

  // ─── SUPABASE ───
  const _fsb = supabase.createClient(
    'https://pesoidoedtjpihjvrnnc.supabase.co',
    'sb_publishable_TTmUwZsTYt7OWBTwTruaLQ_BYzRT9Jp'
  );
  let _fuser = null, _ftoken = null;

  // ─── TAXE DE SÉJOUR DB ───
  // Base officielle DGCL/OFGL (data.gouv.fr) — ~30 000 communes françaises avec taxe de séjour.
  // Hébergée sur Supabase Storage (CDN Cloudflare global) pour ne pas alourdir le repo Git.
  //
  // Format compact : { "Nom": { "nc": [taux, "%"] ou taux€, "1": taux€, ..., "5": ..., "ch": ... } }
  //   nc = non classé (généralement % du loyer, plafonné à 4,30 €/nuit)
  //   1/2/3/4/5 = meublés de tourisme étoiles (en €/pers/nuit)
  //   ch = chambre d'hôtes (en €/pers/nuit)
  //
  // Mise à jour : upload un nouveau fichier dans le bucket `static` avec nom versionné
  // (ex: taxe-sejour-communes-v2.json) puis mettre à jour TAXE_DB_URL ci-dessous.
  const TAXE_DB_URL = 'https://pesoidoedtjpihjvrnnc.supabase.co/storage/v1/object/public/static/taxe-sejour-communes-v1.json';
  let TAXE_SEJOUR_DB = null;
  let TAXE_SEJOUR_DB_LOADING = null;

  function _loadTaxeSejourDb() {
    if (TAXE_SEJOUR_DB) return Promise.resolve(TAXE_SEJOUR_DB);
    if (TAXE_SEJOUR_DB_LOADING) return TAXE_SEJOUR_DB_LOADING;

    // Cache localStorage (valable 7 jours) pour éviter un refetch à chaque visite
    try {
      const cached = localStorage.getItem('lcd_taxe_db_v1');
      const cachedAt = parseInt(localStorage.getItem('lcd_taxe_db_at') || '0', 10);
      if (cached && (Date.now() - cachedAt) < 7 * 24 * 3600 * 1000) {
        TAXE_SEJOUR_DB = JSON.parse(cached);
        return Promise.resolve(TAXE_SEJOUR_DB);
      }
    } catch(_) {}

    TAXE_SEJOUR_DB_LOADING = fetch(TAXE_DB_URL)
      .then(r => r.ok ? r.json() : Promise.reject('load-failed'))
      .then(db => {
        TAXE_SEJOUR_DB = db;
        try {
          localStorage.setItem('lcd_taxe_db_v1', JSON.stringify(db));
          localStorage.setItem('lcd_taxe_db_at', String(Date.now()));
        } catch(_) {}
        return db;
      })
      .catch(() => { TAXE_SEJOUR_DB = {}; return {}; });
    return TAXE_SEJOUR_DB_LOADING;
  }

  // Précharge en arrière-plan dès l'init
  _loadTaxeSejourDb();

  // Mapping label UI → clé compacte de la DB
  const CAT_KEY_MAP = {
    "Meublé de tourisme non classé": "nc",
    "Meublé de tourisme 1★": "1",
    "Meublé de tourisme 2★": "2",
    "Meublé de tourisme 3★": "3",
    "Meublé de tourisme 4★": "4",
    "Meublé de tourisme 5★": "5",
    "Chambre d'hôtes": "ch",
  };

  // Normalisation d'un nom de ville (accents, casse, ponctuation) pour recherche
  function _normVille(s) {
    return (s || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // retire accents
      .toLowerCase()
      .replace(/[’']/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Retourne la catégorie matchée par recherche insensible accents/casse
  function getTaxeRate(ville, cat) {
    if (!TAXE_SEJOUR_DB) return null;
    const target = _normVille(ville);
    if (!target) return null;
    let matched = null;
    // Recherche exacte (normalisée)
    for (const k of Object.keys(TAXE_SEJOUR_DB)) {
      if (_normVille(k) === target) { matched = k; break; }
    }
    if (!matched) return null;
    const catKey = CAT_KEY_MAP[cat] || 'nc';
    const entry = TAXE_SEJOUR_DB[matched][catKey];
    if (entry === undefined) return null;
    // Array = pourcentage [taux, "%"], sinon euros
    if (Array.isArray(entry)) {
      return { taux: entry[0], unite: '%', ville: matched };
    }
    return { taux: entry, unite: '€', ville: matched };
  }

  // ─── STATE ───
  let finvoices = JSON.parse(localStorage.getItem('lcd_invoices') || '[]');
  let fbiens = JSON.parse(localStorage.getItem('lcd_biens') || '[]');
  let fsettings = JSON.parse(localStorage.getItem('lcd_settings') || '{}');
  let fcurrentYear = 2026;
  let feditingId = null;
  let feditingBienId = null;

  // ─── AUTH / API ───
  async function _fApiPost(action, body) {
    const headers = { 'Content-Type': 'application/json' };
    if (_ftoken) headers['Authorization'] = 'Bearer ' + _ftoken;
    const res = await fetch('/api/invoices', {
      method: 'POST', headers, body: JSON.stringify({ action, ...body })
    });
    return res.json();
  }

  async function _fLoadFromDb() {
    if (!_fuser) return;
    const [sRes, bRes, iRes] = await Promise.all([
      _fApiPost('settings-fetch', {}),
      _fApiPost('biens-fetch', {}),
      _fApiPost('invoices-fetch', {}),
    ]);
    if (sRes.settings) fsettings = sRes.settings;
    if (bRes.biens) fbiens = bRes.biens.map(b => ({ ...b }));
    if (iRes.invoices) finvoices = iRes.invoices.map(i => ({
      ...(i.data || {}),
      id: i.invoice_number,
      _dbId: i.id,
      statut: i.statut,
    }));
    fRenderAll();
  }

  async function _fMigrateLocalToDb() {
    // Push local data to DB after first login
    const localBiens = JSON.parse(localStorage.getItem('lcd_biens') || '[]');
    const localInvoices = JSON.parse(localStorage.getItem('lcd_invoices') || '[]');
    const localSettings = JSON.parse(localStorage.getItem('lcd_settings') || '{}');

    if (Object.keys(localSettings).length) {
      await _fApiPost('settings-save', { settings: localSettings });
    }
    for (const b of localBiens) {
      await _fApiPost('biens-save', { bien: { ...b, id: null } });
    }
    for (const inv of localInvoices) {
      await _fApiPost('invoices-save', { invoice: {
        invoice_number: inv.id,
        data: inv,
        statut: inv.statut,
        total_ttc: fCalcInvoiceTotal(inv),
        bien_id: null
      }});
    }
    // Clear local
    localStorage.removeItem('lcd_biens');
    localStorage.removeItem('lcd_invoices');
    localStorage.removeItem('lcd_settings');
  }

  _fsb.auth.onAuthStateChange(async (event, session) => {
    _fuser = session?.user || null;
    _ftoken = session?.access_token || null;
    _fUpdateAuthUI();
    if (event === 'SIGNED_IN') {
      const expecting = localStorage.getItem('fact_expecting_signin') === '1';
      localStorage.removeItem('fact_expecting_signin');
      if (expecting) {
        await _fMigrateLocalToDb();
      }
      await _fLoadFromDb();
    }
  });

  (async () => {
    const { data: { session } } = await _fsb.auth.getSession();
    _fuser = session?.user || null;
    _ftoken = session?.access_token || null;
    _fUpdateAuthUI();
    if (_fuser) await _fLoadFromDb();
  })();

  function _fUpdateAuthUI() {
    const hint = document.getElementById('fauth-hint');
    if (!hint) return;
    if (_fuser) {
      hint.innerHTML = `<span>✓ <strong>Connecté</strong> — ${_fuser.email}. Vos données sont sauvegardées.</span>
        <button class="btn-sm" onclick="fLogout()">Se déconnecter</button>`;
    } else {
      hint.innerHTML = `<span>🔒 <strong>Mode invité</strong> — vos données sont stockées localement dans ce navigateur.</span>
        <button class="btn-sm accent" onclick="fLogin()">Se connecter avec Google →</button>`;
    }
    // Bind tool-header button if present
    const headerLogin = document.getElementById('tool-header-login');
    if (headerLogin) {
      headerLogin.textContent = _fuser ? 'Mon compte' : 'Se connecter';
    }
  }

  window.toolLogin = function() { fLogin(); };

  window.fLogin = async function() {
    localStorage.setItem('fact_expecting_signin', '1');
    const redirectTo = window.location.origin + '/facturation-lcd';
    await _fsb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo, queryParams: { prompt: 'select_account' } }
    });
  };
  window.fLogout = async function() {
    await _fsb.auth.signOut();
    _fuser = null; _ftoken = null;
    // Reload local data
    finvoices = JSON.parse(localStorage.getItem('lcd_invoices') || '[]');
    fbiens = JSON.parse(localStorage.getItem('lcd_biens') || '[]');
    fsettings = JSON.parse(localStorage.getItem('lcd_settings') || '{}');
    _fUpdateAuthUI();
    fRenderAll();
  };

  // ─── HELPERS ───
  function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function fNights(a, b) { return !a||!b ? 0 : Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000)); }
  function fFormatDate(s) { if (!s) return '—'; const [y,m,d] = s.split('-'); return `${d}/${m}/${y}`; }
  function fFormatMoney(n) { return Number(n||0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'; }
  window.fCalcInvoiceTotal = function(inv) {
    const n = fNights(inv.arrivee, inv.depart);
    return (n * (inv.prixNuit||0)) + Number(inv.menage||0) + Number(inv.extraMontant||0) + Number(inv.taxeSejour||0);
  };

  // ─── SCREEN NAV ───
  window.fShowScreen = function(id) {
    document.querySelectorAll('#fact-wrap .screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(id);
    if (el) el.classList.add('active');
    if (id === 'fscreen-dashboard') fRenderTable(fcurrentYear);
    if (id === 'fscreen-biens') fRenderBiens();
    if (id === 'fscreen-new') fPopulateBienSelect();
  };

  // ─── SETTINGS ───
  window.fShowSettingsModal = function() {
    document.getElementById('fset-nom').value = fsettings.nom || '';
    document.getElementById('fset-adresse').value = fsettings.adresse || '';
    document.getElementById('fset-siret').value = fsettings.siret || '';
    document.getElementById('fset-mention').value = fsettings.mention || '';
    fOpenModal('fmodal-settings');
  };
  window.fSaveSettings = async function() {
    fsettings = {
      ...fsettings,
      nom: document.getElementById('fset-nom').value,
      adresse: document.getElementById('fset-adresse').value,
      siret: document.getElementById('fset-siret').value,
      mention: document.getElementById('fset-mention').value,
      prefix: fsettings.prefix || (new Date().getFullYear() + '-'),
      next_num: fsettings.next_num || 1
    };
    if (_fuser) {
      await _fApiPost('settings-save', { settings: fsettings });
    } else {
      localStorage.setItem('lcd_settings', JSON.stringify(fsettings));
    }
    if (document.getElementById('fl-nom')) document.getElementById('fl-nom').value = fsettings.nom || '';
    if (document.getElementById('fl-adresse')) document.getElementById('fl-adresse').value = fsettings.adresse || '';
    if (document.getElementById('fl-siret')) document.getElementById('fl-siret').value = fsettings.siret || '';
    fCloseModal('fmodal-settings');
    fToast('Paramètres sauvegardés', 'green');
  };

  // ─── BIENS ───
  function _fSaveBiensLocal() { localStorage.setItem('lcd_biens', JSON.stringify(fbiens)); }

  function fRenderBiens() {
    const c = document.getElementById('fbiens-list');
    if (!c) return;
    if (!fbiens.length) {
      c.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:52px 0;color:var(--fa-muted);font-size:12px">
        Aucun bien — <span style="color:var(--fa-accent);cursor:pointer;text-decoration:underline" onclick="fOpenBienModal(null)">Ajouter un bien</span>
      </div>`;
      return;
    }
    c.innerHTML = fbiens.map(b => {
      const t = getTaxeRate(b.ville, b.categorie);
      const taxeBadge = t
        ? (t.unite === '%' ? `${t.taux.toFixed(2)} % du loyer` : `${t.taux.toFixed(2)} €/pers/nuit`)
        : 'Non répertoriée';
      return `<div style="background:#fff;border:1px solid #e5e3de;border-radius:12px;padding:20px 24px;position:relative">
  <div style="position:absolute;top:16px;right:16px;display:flex;gap:6px">
    <button onclick="fOpenBienModal('${b.id}')" style="width:32px;height:32px;border-radius:8px;border:1px solid #e5e3de;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px" title="Modifier">✏️</button>
    <button onclick="fDeleteBien('${b.id}')" style="width:32px;height:32px;border-radius:8px;border:1px solid #e5e3de;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:14px" title="Supprimer">🗑️</button>
  </div>
  <div style="font-family:'Inter',sans-serif;font-size:16px;font-weight:700;color:#1a1a1a;margin-bottom:6px;padding-right:80px">${esc(b.nom)}</div>
  <div style="font-size:13px;color:#8a8985;margin-bottom:12px">${esc(b.adresse || '—')}, ${esc(b.ville || '—')}</div>
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px">
    <span style="font-size:11px;font-weight:600;color:#52524e;background:#f0efec;padding:4px 10px;border-radius:20px">${esc(b.categorie || 'Non classé')}</span>
    <span style="font-size:11px;font-weight:600;color:#52524e;background:#f0efec;padding:4px 10px;border-radius:20px">${b.capacite || '?'} pers.</span>
  </div>
  <div style="font-size:13px;font-weight:600;color:#1a1a1a">Taxe de séjour : <span style="color:#3fbd71">${taxeBadge}</span></div>
</div>`;
    }).join('');
  }

  window.fOpenBienModal = function(id) {
    feditingBienId = id;
    document.getElementById('fmodal-bien-title').textContent = id ? 'Modifier le bien' : 'Ajouter un bien';
    document.getElementById('fbien-edit-id').value = id || '';
    ['fbien-nom','fbien-adresse','fbien-ville','fbien-capacite'].forEach(k => document.getElementById(k).value = '');
    document.getElementById('fbien-categorie').value = 'Meublé de tourisme non classé';
    document.getElementById('fbien-taxe-preview').style.display = 'none';
    if (id) {
      const b = fbiens.find(x => x.id === id);
      if (b) {
        document.getElementById('fbien-nom').value = b.nom || '';
        document.getElementById('fbien-adresse').value = b.adresse || '';
        document.getElementById('fbien-ville').value = b.ville || '';
        document.getElementById('fbien-categorie').value = b.categorie || 'Meublé de tourisme non classé';
        document.getElementById('fbien-capacite').value = b.capacite || '';
        fUpdateBienTaxePreview();
      }
    }
    fOpenModal('fmodal-bien');
  };

  window.fSaveBien = async function() {
    const nom = document.getElementById('fbien-nom').value.trim();
    if (!nom) return fToast('Nom du bien requis', 'red');
    const b = {
      id: feditingBienId || ('bien-local-' + Date.now()),
      nom,
      adresse: document.getElementById('fbien-adresse').value.trim(),
      ville: document.getElementById('fbien-ville').value.trim(),
      categorie: document.getElementById('fbien-categorie').value,
      capacite: parseInt(document.getElementById('fbien-capacite').value) || null,
    };

    if (_fuser) {
      const payload = { ...b };
      if (!feditingBienId || String(feditingBienId).startsWith('bien-local-')) payload.id = null;
      const res = await _fApiPost('biens-save', { bien: payload });
      if (res.bien) {
        if (feditingBienId) {
          const idx = fbiens.findIndex(x => x.id === feditingBienId);
          if (idx >= 0) fbiens[idx] = res.bien; else fbiens.push(res.bien);
        } else {
          fbiens.push(res.bien);
        }
      }
    } else {
      if (feditingBienId) {
        const idx = fbiens.findIndex(x => x.id === feditingBienId);
        if (idx >= 0) fbiens[idx] = b;
      } else {
        fbiens.push(b);
      }
      _fSaveBiensLocal();
    }

    fCloseModal('fmodal-bien');
    fRenderBiens();
    fPopulateBienSelect();
    fToast('Bien enregistré', 'green');
  };

  window.fDeleteBien = async function(id) {
    if (!confirm('Supprimer ce bien ?')) return;
    if (_fuser && !String(id).startsWith('bien-local-')) {
      await _fApiPost('biens-delete', { bienId: id });
    }
    fbiens = fbiens.filter(b => b.id !== id);
    if (!_fuser) _fSaveBiensLocal();
    fRenderBiens();
    fPopulateBienSelect();
    fToast('Bien supprimé', 'red');
  };

  window.fPopulateBienSelect = function() {
    const sel = document.getElementById('fs-bien');
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = '<option value="">— Sélectionner un bien —</option>';
    fbiens.forEach(b => {
      const o = document.createElement('option');
      o.value = b.id;
      o.textContent = `${b.nom}${b.ville ? ' — ' + b.ville : ''}`;
      sel.appendChild(o);
    });
    if (cur) sel.value = cur;
  };

  // ─── VILLE AUTOCOMPLETE ───
  window.fVilleAutocomplete = async function(input) {
    const val = _normVille(input.value);
    const list = document.getElementById('fville-autocomplete-list');
    if (!val) { list.classList.remove('open'); list.innerHTML = ''; return; }
    // Assure le chargement de la base (petit délai au premier appel seulement)
    if (!TAXE_SEJOUR_DB) await _loadTaxeSejourDb();
    if (!TAXE_SEJOUR_DB) return;
    // Prefixe puis contient si peu de résultats
    const keys = Object.keys(TAXE_SEJOUR_DB);
    let m = keys.filter(k => _normVille(k).startsWith(val)).slice(0, 10);
    if (m.length < 6) {
      const extra = keys.filter(k => !m.includes(k) && _normVille(k).includes(val)).slice(0, 10 - m.length);
      m = m.concat(extra);
    }
    if (!m.length) {
      list.innerHTML = '<div class="autocomplete-item" style="color:var(--fa-muted);cursor:default">Aucune commune trouvée</div>';
      list.classList.add('open');
      return;
    }
    list.innerHTML = m.map(v => `<div class="autocomplete-item" onmousedown="fSelectVille('${v.replace(/'/g, "\\'")}')">${esc(v)}</div>`).join('');
    list.classList.add('open');
    fUpdateBienTaxePreview();
  };
  window.fSelectVille = function(v) {
    document.getElementById('fbien-ville').value = v;
    document.getElementById('fville-autocomplete-list').classList.remove('open');
    fUpdateBienTaxePreview();
  };
  window.fCloseVilleList = function() {
    document.getElementById('fville-autocomplete-list').classList.remove('open');
    fUpdateBienTaxePreview();
  };
  window.fUpdateBienTaxePreview = async function() {
    const ville = document.getElementById('fbien-ville').value.trim();
    const cat = document.getElementById('fbien-categorie').value;
    const p = document.getElementById('fbien-taxe-preview');
    const v = document.getElementById('fbien-taxe-preview-val');
    if (!TAXE_SEJOUR_DB) await _loadTaxeSejourDb();
    const info = getTaxeRate(ville, cat);
    if (ville && info) {
      const label = info.unite === '%'
        ? `${info.taux.toFixed(2)} % du loyer HT — ${cat}`
        : `${info.taux.toFixed(2)} €/pers/nuit — ${cat}`;
      v.textContent = label;
      p.style.display = 'block';
    }
    else if (ville) { v.textContent = 'Ville non répertoriée — vous pouvez saisir manuellement le tarif'; p.style.display = 'block'; }
    else { p.style.display = 'none'; }
  };

  // ─── TABLE ───
  window.fRenderTable = function(year) {
    const tbody = document.getElementById('finvoice-tbody');
    if (!tbody) return;
    const filtered = finvoices.filter(inv => inv.id && String(inv.id).startsWith(String(year)));
    if (!filtered.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:52px 0;color:var(--fa-muted);font-size:12px">
        Aucune facture pour ${year} — <span style="color:var(--fa-accent);cursor:pointer;text-decoration:underline" onclick="fShowScreen('fscreen-new');fResetForm()">Créer une facture</span>
      </td></tr>`;
    } else {
      tbody.innerHTML = filtered.map(inv => {
        const n = fNights(inv.arrivee, inv.depart);
        const total = fCalcInvoiceTotal(inv);
        const paid = inv.statut === 'Payée';
        const badgeClass = paid ? 'f-badge f-paid' : 'f-badge f-pending';
        const badgeLabel = paid ? 'Payee' : 'En attente';
        const badgeDot = paid ? '●' : '●';
        return `<tr>
          <td><span class="f-primary">${esc(inv.client || '---')}</span><span class="f-secondary">${esc(inv.email || '')}</span></td>
          <td class="td-bien"><span class="f-primary">${esc(inv.bien || '---')}</span></td>
          <td><span class="f-primary">${fFormatDate(inv.arrivee)} → ${fFormatDate(inv.depart)}</span><span class="f-secondary">${n} nuit${n>1?'s':''}</span></td>
          <td><span class="f-primary">${fFormatMoney(total)}</span></td>
          <td><span class="${badgeClass}">${badgeDot} ${badgeLabel}</span></td>
          <td><div class="f-row-actions"><button class="f-icon-btn" title="Telecharger PDF" onclick="fExportPdfById('${inv.id}')">↓</button><button class="f-icon-btn f-danger" title="Supprimer" onclick="fDeleteInvoice('${inv.id}')">✕</button></div></td>
        </tr>`;
      }).join('');
    }
    document.getElementById('fstats-year').textContent = year;
    const paid = filtered.filter(i => i.statut === 'Payée');
    const totalPaid = paid.reduce((s, i) => s + fCalcInvoiceTotal(i), 0);
    const avgAll = filtered.length ? filtered.reduce((s,i)=>s+fCalcInvoiceTotal(i), 0) / filtered.length : 0;
    document.getElementById('fstat-total').textContent = fFormatMoney(totalPaid);
    document.getElementById('fstat-count').textContent = filtered.length;
    document.getElementById('fstat-avg').textContent = filtered.length ? fFormatMoney(avgAll) : '— €';
    document.getElementById('fstat-sub-count').textContent = `dont ${paid.length} payée${paid.length>1?'s':''}`;
  };

  window.fFilterYear = function(year, btn) {
    fcurrentYear = year;
    document.querySelectorAll('#fact-wrap .mode-tab').forEach(t => t.classList.remove('on'));
    btn.classList.add('on');
    fRenderTable(year);
  };

  // ─── FORM CALC ───
  window.fCalcNights = function() {
    const a = document.getElementById('fs-arrivee').value;
    const d = document.getElementById('fs-depart').value;
    const n = fNights(a, d);
    document.getElementById('fnights-num').textContent = n > 0 ? n : '—';
    document.getElementById('fnights-label').textContent = n > 1 ? 'nuits' : 'nuit';
    fCalcTotal();
  };

  function fGetSelectedBien() {
    const sel = document.getElementById('fs-bien');
    if (!sel || !sel.value) return null;
    return fbiens.find(b => b.id === sel.value) || null;
  }

  window.fCalcTotal = function() {
    const nText = document.getElementById('fnights-num').textContent;
    const nights = nText === '—' ? 0 : parseInt(nText) || 0;
    const prix = parseFloat(document.getElementById('fs-prixnuit').value) || 0;
    const menage = parseFloat(document.getElementById('fs-menage').value) || 0;
    const extraL = document.getElementById('fs-extra-label').value;
    const extra = parseFloat(document.getElementById('fs-extra-montant').value) || 0;
    const persons = parseInt(document.getElementById('fs-personnes').value) || 0;
    const hebergement = nights * prix;

    const b = fGetSelectedBien();
    let taxe = 0;
    const autoRow = document.getElementById('frecap-taxe-row');
    const manRow = document.getElementById('frecap-taxe-manual-row');
    if (b && b.ville && nights > 0 && persons > 0) {
      const info = getTaxeRate(b.ville, b.categorie);
      if (info) {
        if (info.unite === '%') {
          // Tarif en % du loyer HT par nuit, plafonné à 4.30€/nuit (plafond 2026)
          const CAP = 4.30;
          const taxePerNight = Math.min(hebergement / nights * (info.taux / 100), CAP);
          taxe = taxePerNight * persons * nights;
          autoRow.style.display = 'flex';
          manRow.style.display = 'none';
          document.getElementById('frecap-taxe-note').textContent = `${info.ville} — ${b.categorie}: ${info.taux.toFixed(2)}% du loyer (plafond ${CAP}€/nuit)`;
          document.getElementById('frecap-taxe-val').textContent = fFormatMoney(taxe);
        } else {
          taxe = info.taux * persons * nights;
          autoRow.style.display = 'flex';
          manRow.style.display = 'none';
          document.getElementById('frecap-taxe-note').textContent = `${info.ville} — ${b.categorie}: ${info.taux.toFixed(2)}€/pers/nuit`;
          document.getElementById('frecap-taxe-val').textContent = `${info.taux.toFixed(2)} × ${persons} × ${nights} = ${fFormatMoney(taxe)}`;
        }
      } else {
        autoRow.style.display = 'none';
        manRow.style.display = 'flex';
        const mv = parseFloat(document.getElementById('fs-taxe-manuelle').value) || 0;
        taxe = mv;
        document.getElementById('frecap-taxe-manual-val').textContent = mv > 0 ? fFormatMoney(mv) : '— €';
      }
    } else {
      autoRow.style.display = 'none';
      manRow.style.display = 'none';
    }

    const total = hebergement + menage + extra + taxe;
    document.getElementById('frecap-nuits').textContent = nights > 0 ? nights : '—';
    document.getElementById('frecap-hebergement').textContent = nights > 0 ? fFormatMoney(hebergement) : '— €';
    document.getElementById('frecap-menage').textContent = menage > 0 ? fFormatMoney(menage) : '— €';
    document.getElementById('frecap-total').textContent = fFormatMoney(total);

    const exRow = document.getElementById('frecap-extra-row');
    if (extra > 0) {
      exRow.style.display = 'flex';
      document.getElementById('frecap-extra-label').textContent = extraL || 'Frais supplémentaires';
      document.getElementById('frecap-extra-val').textContent = fFormatMoney(extra);
    } else { exRow.style.display = 'none'; }
  };

  window.fResetForm = function() {
    feditingId = null;
    document.getElementById('fnew-title').textContent = 'Nouvelle facture';
    document.querySelectorAll('#fscreen-new input').forEach(i => i.value = '');
    document.getElementById('fs-paiement').value = 'Virement bancaire';
    document.getElementById('fs-statut').value = 'Payée';
    document.getElementById('fnights-num').textContent = '—';
    document.getElementById('fnights-label').textContent = 'nuit(s)';
    document.getElementById('frecap-nuits').textContent = '—';
    document.getElementById('frecap-hebergement').textContent = '— €';
    document.getElementById('frecap-menage').textContent = '— €';
    document.getElementById('frecap-total').textContent = '0,00 €';
    document.getElementById('frecap-extra-row').style.display = 'none';
    document.getElementById('frecap-taxe-row').style.display = 'none';
    document.getElementById('frecap-taxe-manual-row').style.display = 'none';
    fPopulateBienSelect();
    if (fsettings.nom) document.getElementById('fl-nom').value = fsettings.nom;
    if (fsettings.adresse) document.getElementById('fl-adresse').value = fsettings.adresse;
    if (fsettings.siret) document.getElementById('fl-siret').value = fsettings.siret;
  };

  function _fNextId() {
    const prefix = fsettings.prefix || (new Date().getFullYear() + '-');
    const n = fsettings.next_num || 1;
    return prefix + String(n).padStart(3, '0');
  }

  function _fCollect() {
    const nText = document.getElementById('fnights-num').textContent;
    const nights = nText === '—' ? 0 : parseInt(nText) || 0;
    const persons = parseInt(document.getElementById('fs-personnes').value) || 0;
    const sel = fGetSelectedBien();
    let taxe = 0, ville = '', cat = '', taux = 0;
    if (sel && nights > 0 && persons > 0) {
      const info = getTaxeRate(sel.ville, sel.categorie);
      if (info) {
        if (info.unite === '%') {
          const CAP = 4.30;
          const prix = parseFloat(document.getElementById('fs-prixnuit').value) || 0;
          const taxePerNight = Math.min(prix * (info.taux / 100), CAP);
          taxe = taxePerNight * persons * nights;
        } else {
          taxe = info.taux * persons * nights;
        }
        ville = info.ville; cat = sel.categorie; taux = info.taux;
      }
      else { taxe = parseFloat(document.getElementById('fs-taxe-manuelle').value) || 0; ville = sel.ville; cat = sel.categorie; }
    }
    const bienLabel = sel ? `${sel.nom}${sel.ville ? ' — ' + sel.ville : ''}` : '';
    return {
      id: feditingId || '(BROUILLON)',
      client: (document.getElementById('fc-prenom').value + ' ' + document.getElementById('fc-nom').value).trim(),
      email: document.getElementById('fc-email').value,
      clientAddr: document.getElementById('fc-adresse').value,
      bien: bienLabel, bienId: sel ? sel.id : '',
      arrivee: document.getElementById('fs-arrivee').value,
      depart: document.getElementById('fs-depart').value,
      prixNuit: parseFloat(document.getElementById('fs-prixnuit').value) || 0,
      menage: parseFloat(document.getElementById('fs-menage').value) || 0,
      caution: parseFloat(document.getElementById('fs-caution').value) || 0,
      extra: document.getElementById('fs-extra-label').value,
      extraMontant: parseFloat(document.getElementById('fs-extra-montant').value) || 0,
      personnes: persons, taxeSejour: taxe, taxeVille: ville, taxeCategorie: cat, taxeTaux: taux,
      paiement: document.getElementById('fs-paiement').value,
      statut: document.getElementById('fs-statut').value,
      loueur: document.getElementById('fl-nom').value,
      loueurAddr: document.getElementById('fl-adresse').value,
      siret: document.getElementById('fl-siret').value,
    };
  }

  window.fSaveInvoice = async function() {
    const loueur = document.getElementById('fl-nom').value;
    const client = (document.getElementById('fc-prenom').value + ' ' + document.getElementById('fc-nom').value).trim();
    if (!loueur) return fToast('Renseignez vos infos loueur', 'red');
    if (!client) return fToast('Renseignez le nom du client', 'red');

    const inv = _fCollect();

    if (_fuser) {
      const existing = finvoices.find(i => i.id === feditingId);
      const dbId = existing ? existing._dbId : null;
      const res = await _fApiPost('invoices-save', {
        invoice: {
          id: dbId,
          invoice_number: feditingId || null,
          data: inv,
          statut: inv.statut,
          total_ttc: fCalcInvoiceTotal(inv),
          bien_id: (inv.bienId && !String(inv.bienId).startsWith('bien-local-')) ? inv.bienId : null
        }
      });
      if (res.error) return fToast('Erreur: ' + res.error, 'red');
      const saved = res.invoice;
      inv.id = saved.invoice_number;
      inv._dbId = saved.id;
      const idx = finvoices.findIndex(i => i._dbId === saved.id);
      if (idx >= 0) finvoices[idx] = inv; else finvoices.push(inv);
    } else {
      if (!feditingId) {
        inv.id = _fNextId();
        fsettings.prefix = fsettings.prefix || (new Date().getFullYear() + '-');
        fsettings.next_num = (fsettings.next_num || 1) + 1;
        localStorage.setItem('lcd_settings', JSON.stringify(fsettings));
      } else { inv.id = feditingId; }
      const idx = finvoices.findIndex(i => i.id === inv.id);
      if (idx >= 0) finvoices[idx] = inv; else finvoices.push(inv);
      localStorage.setItem('lcd_invoices', JSON.stringify(finvoices));
    }
    fToast('Facture ' + inv.id + ' enregistrée', 'green');
    setTimeout(() => fShowScreen('fscreen-dashboard'), 700);
  };

  window.fViewInvoice = function(id) {
    const inv = finvoices.find(i => i.id === id);
    if (!inv) return;
    fBuildPreview(inv);
    fOpenModal('fmodal-pdf');
  };

  window.fDeleteInvoice = async function(id) {
    if (!confirm('Supprimer la facture ' + id + ' ?')) return;
    const target = finvoices.find(i => i.id === id);
    if (_fuser && target && target._dbId) {
      await _fApiPost('invoices-delete', { invoiceId: target._dbId });
    }
    finvoices = finvoices.filter(i => i.id !== id);
    if (!_fuser) localStorage.setItem('lcd_invoices', JSON.stringify(finvoices));
    fRenderTable(fcurrentYear);
    fToast('Facture supprimée', 'red');
  };

  window.fOpenPdfModal = function() {
    const inv = _fCollect();
    if (!inv.loueur && !inv.client) return fToast('Remplissez le formulaire avant', 'red');
    fBuildPreview(inv);
    fOpenModal('fmodal-pdf');
  };

  function fBuildPreview(inv) {
    _fLastPreviewInv = inv;
    const nights = fNights(inv.arrivee, inv.depart);
    const hebergement = nights * (inv.prixNuit || 0);
    const extra = Number(inv.extraMontant) || 0;
    const menage = Number(inv.menage) || 0;
    const taxeSejour = Number(inv.taxeSejour) || 0;
    const total = hebergement + menage + extra + taxeSejour;
    const caution = Number(inv.caution) || 0;
    const today = new Date();
    const todayFmt = today.toLocaleDateString('fr-FR');
    const dueDate = new Date(today.getTime() + 30 * 86400000).toLocaleDateString('fr-FR');
    const mention = fsettings.mention || 'TVA non applicable, art. 293 B du CGI. En qualité de loueur en meublé non professionnel (LMNP), je ne suis pas assujetti à la TVA.';
    const stampHtml = inv.statut === 'Payée' ? `<div class="inv-stamp-area"><div class="inv-stamp">PAYÉE</div></div>` : '';
    const extraRow = extra > 0 ? `<tr><td>${inv.extra || 'Frais supplémentaires'}</td><td>1</td><td>${fFormatMoney(extra)}</td><td class="amount">${fFormatMoney(extra)}</td></tr>` : '';
    const taxeRow = taxeSejour > 0 && inv.taxeTaux
      ? `<tr><td>Taxe de séjour<br><small style="color:#777">${inv.taxeVille || ''} — ${inv.taxeCategorie || ''} : ${Number(inv.taxeTaux).toFixed(2)}€/pers/nuit × ${inv.personnes||1} × ${nights}</small></td><td>${nights}</td><td>—</td><td class="amount">${fFormatMoney(taxeSejour)}</td></tr>`
      : (taxeSejour > 0 ? `<tr><td>Taxe de séjour</td><td>1</td><td>—</td><td class="amount">${fFormatMoney(taxeSejour)}</td></tr>` : '');
    const cautionNote = caution > 0 ? `<div class="inv-caution-note"><strong>Caution :</strong> ${fFormatMoney(caution)} — non incluse. Remboursable sous 7 jours après départ.</div>` : '';

    document.getElementById('finvoice-preview').innerHTML = `
      <div class="inv-header">
        <div class="inv-issuer-left">
          <div class="name">${inv.loueur || 'Nom du loueur'}</div>
          <div class="detail">${(inv.loueurAddr || '').replace(/,\s*/g, '<br>')}</div>
          ${inv.siret ? `<div class="detail" style="margin-top:4px">SIRET : ${inv.siret}</div>` : ''}
        </div>
        <div class="inv-doc-ref">
          <div style="font-size:9px;letter-spacing:0.12em;text-transform:uppercase;color:#888;margin-bottom:4px">Facture</div>
          <div style="font-size:16px;font-weight:700;color:#111;letter-spacing:-0.01em">${inv.id}</div>
        </div>
      </div>
      <div class="inv-title-block">
        <div class="inv-meta">
          <div><div class="im-label">Date d'emission</div><div class="im-val">${todayFmt}</div></div>
          <div><div class="im-label">Echeance</div><div class="im-val">${dueDate}</div></div>
          <div><div class="im-label">Mode de paiement</div><div class="im-val">${inv.paiement || '—'}</div></div>
        </div>
      </div>
      <div class="inv-client-box">
        <div class="cb-label">Facture a</div>
        <div class="cb-name">${inv.client || 'Client'}</div>
        ${inv.email ? `<div class="cb-detail">${inv.email}</div>` : ''}
        ${inv.clientAddr ? `<div class="cb-detail">${inv.clientAddr}</div>` : ''}
      </div>
      <table class="inv-table">
        <thead><tr><th>Description</th><th>Qte</th><th>Prix unitaire</th><th class="amount">Montant</th></tr></thead>
        <tbody>
          <tr>
            <td><strong>Hebergement — ${inv.bien || 'Bien loue'}</strong><br><span style="color:#777;font-size:11px">Sejour du ${fFormatDate(inv.arrivee)} au ${fFormatDate(inv.depart)} (${nights} nuit${nights>1?'s':''}${inv.personnes ? ', ' + inv.personnes + ' pers.' : ''})</span></td>
            <td>${nights}</td>
            <td>${fFormatMoney(inv.prixNuit)} / nuit</td>
            <td class="amount">${fFormatMoney(hebergement)}</td>
          </tr>
          ${menage > 0 ? `<tr><td>Frais de menage</td><td>1</td><td>${fFormatMoney(menage)}</td><td class="amount">${fFormatMoney(menage)}</td></tr>` : ''}
          ${taxeRow}
          ${extraRow}
        </tbody>
      </table>
      ${cautionNote}
      <div class="inv-total-box">
        <div class="inv-total-row"><span class="tr-label">Sous-total hebergement</span><span class="tr-val">${fFormatMoney(hebergement)}</span></div>
        ${menage > 0 ? `<div class="inv-total-row"><span class="tr-label">Frais de menage</span><span class="tr-val">${fFormatMoney(menage)}</span></div>` : ''}
        ${taxeSejour > 0 ? `<div class="inv-total-row"><span class="tr-label">Taxe de sejour</span><span class="tr-val">${fFormatMoney(taxeSejour)}</span></div>` : ''}
        ${extra > 0 ? `<div class="inv-total-row"><span class="tr-label">${inv.extra || 'Frais supplementaires'}</span><span class="tr-val">${fFormatMoney(extra)}</span></div>` : ''}
        <div class="inv-total-row"><span class="tr-label">TVA</span><span class="tr-val" style="color:#999;font-weight:400">Non applicable (art. 293 B CGI)</span></div>
        <div class="inv-total-row grand"><span class="tr-label">Total TTC</span><span class="tr-val">${fFormatMoney(total)}</span></div>
      </div>
      ${stampHtml}
      <div class="inv-footer">
        <div class="inv-payment"><strong>Coordonnees de paiement :</strong><br>Mode : ${inv.paiement || '—'}${inv.paiement === 'Virement bancaire' ? '<br>IBAN : FR76 XXXX XXXX XXXX XXXX XXXX XXX' : ''}</div>
        <div class="inv-legal" style="margin-top:14px"><strong>Mentions legales :</strong><br>${mention}</div>
        <div class="inv-legal">Document emis par ${inv.loueur || 'le loueur'}${inv.siret ? ` — SIRET : ${inv.siret}` : ''}.</div>
      </div>
    `;
  }

  // ─── PDF EXPORT (jsPDF) ───
  // Called from the modal "Télécharger PDF" button (uses current preview data)
  window.fExportPdf = function() {
    // Build inv from current preview context — try collected form data first,
    // then fall back to the last viewed invoice stored in _fLastPreviewInv.
    const inv = _fLastPreviewInv || _fCollect();
    if (!inv) return;
    _generatePdf(inv);
  };

  // Called from the table row PDF button (by invoice id, no modal needed)
  window.fExportPdfById = function(id) {
    const inv = finvoices.find(i => i.id === id);
    if (!inv) return;
    _generatePdf(inv);
  };

  // Keep track of the last invoice shown in preview so fExportPdf can use it
  let _fLastPreviewInv = null;

  // PDF money formatter — safe for jsPDF (no unicode thin space)
  function _pdfMoney(n) {
    var v = Number(n || 0).toFixed(2);
    var parts = v.split('.');
    var int = parts[0];
    var dec = parts[1];
    // Add space as thousands separator (normal space, not thin/narrow)
    var formatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return formatted + ',' + dec + ' EUR';
  }

  function _generatePdf(inv) {
    if (!window.jspdf) return fToast('Chargement PDF en cours, reessayez', 'red');
    try {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF('p', 'mm', 'a4');
    var W = 210, M = 20, RightCol = 130, CW = W - 2 * M;
    var y = 0;
    var gray = [138, 137, 133];
    var dark = [43, 45, 43];
    var green = [63, 189, 113];

    // ── HEADER BAR ──
    doc.setFillColor(247, 246, 243);
    doc.rect(0, 0, W, 42, 'F');

    // Enomia branding
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.text('Facture realisee sur Enomia', W - M, 8, { align: 'right' });

    // Loueur (left)
    var loueur = inv.loueur || ((fsettings.prenom || '') + ' ' + (fsettings.nom || '')).trim() || 'Loueur';
    var addr = inv.loueurAddr || fsettings.adresse || '';
    var siret = inv.siret || fsettings.siret || '';
    var email = inv.loueurEmail || fsettings.email || '';

    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text(loueur, M, 14);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(gray[0], gray[1], gray[2]);
    y = 19;
    if (addr) { doc.text(addr, M, y); y += 3.5; }
    if (siret) { doc.text('SIRET : ' + siret, M, y); y += 3.5; }
    if (email) { doc.text(email, M, y); }

    // FACTURE (right)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text('FACTURE', W - M, 16, { align: 'right' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.text('N. ' + (inv.id || '---'), W - M, 23, { align: 'right' });
    var emissionDate = inv.date_emission || inv.created_at || new Date().toISOString().slice(0, 10);
    doc.text('Date : ' + fFormatDate(emissionDate), W - M, 28, { align: 'right' });
    if (inv.arrivee && inv.depart) {
      doc.text('Sejour : ' + fFormatDate(inv.arrivee) + ' au ' + fFormatDate(inv.depart), W - M, 33, { align: 'right' });
    }

    y = 52;

    // ── CLIENT BOX ──
    doc.setFillColor(247, 246, 243);
    doc.roundedRect(M, y, CW, 22, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.text('FACTURE A', M + 6, y + 6);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(dark[0], dark[1], dark[2]);
    doc.text(inv.client || '---', M + 6, y + 12);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(gray[0], gray[1], gray[2]);
    var clientLine2 = [inv.email, inv.clientAddr || inv.adresse_client].filter(Boolean).join(' - ');
    if (clientLine2) doc.text(clientLine2, M + 6, y + 17);

    y += 30;

    // ── TABLE ──
    var nights = fNights(inv.arrivee, inv.depart);
    var prixNuit = parseFloat(inv.prixNuit) || 0;
    var menage = parseFloat(inv.menage) || 0;
    var extraMontant = parseFloat(inv.extraMontant) || 0;
    var taxeSejour = parseFloat(inv.taxeSejour) || 0;
    var bienLabel = inv.bien || 'Bien';
    var colD = M, colQ = M + 95, colP = M + 115, colT = W - M;

    // Table header
    doc.setFillColor(dark[0], dark[1], dark[2]);
    doc.roundedRect(M, y, CW, 8, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(255, 255, 255);
    doc.text('DESIGNATION', colD + 4, y + 5.5);
    doc.text('QTE', colQ, y + 5.5);
    doc.text('P.U.', colP, y + 5.5);
    doc.text('TOTAL', colT - 2, y + 5.5, { align: 'right' });
    y += 12;

    // Row helper
    function addRow(label, qty, pu, total, isLight) {
      if (isLight) { doc.setFillColor(250, 250, 248); doc.rect(M, y - 1, CW, 8, 'F'); }
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(dark[0], dark[1], dark[2]);
      doc.text(label, colD + 4, y + 4);
      doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.text(String(qty), colQ, y + 4);
      doc.text(pu, colP, y + 4);
      doc.setFont('helvetica', 'bold'); doc.setTextColor(dark[0], dark[1], dark[2]);
      doc.text(total, colT - 2, y + 4, { align: 'right' });
      y += 9;
    }

    addRow('Hebergement - ' + bienLabel, nights, _pdfMoney(prixNuit), _pdfMoney(prixNuit * nights), true);
    if (menage > 0) addRow('Frais de menage', 1, _pdfMoney(menage), _pdfMoney(menage), false);
    if (extraMontant > 0) addRow(inv.extra || 'Frais supplementaires', 1, _pdfMoney(extraMontant), _pdfMoney(extraMontant), true);
    if (taxeSejour > 0) {
      var taxeDesc = 'Taxe de sejour';
      if (inv.taxeVille) taxeDesc += ' (' + inv.taxeVille + ')';
      addRow(taxeDesc, '---', '---', _pdfMoney(taxeSejour), menage > 0 && extraMontant > 0);
    }

    // Separator
    doc.setDrawColor(230, 230, 225); doc.setLineWidth(0.3);
    doc.line(M, y, W - M, y);
    y += 6;

    // ── TOTAL ──
    var total = fCalcInvoiceTotal(inv);
    doc.setFillColor(dark[0], dark[1], dark[2]);
    doc.roundedRect(RightCol, y, W - M - RightCol, 12, 2, 2, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(255, 255, 255);
    doc.text('TOTAL TTC :  ' + _pdfMoney(total), W - M - 5, y + 8, { align: 'right' });
    doc.setTextColor(dark[0], dark[1], dark[2]);
    y += 20;

    // ── TVA + PAIEMENT ──
    doc.setFont('helvetica', 'italic'); doc.setFontSize(7.5); doc.setTextColor(gray[0], gray[1], gray[2]);
    doc.text('TVA non applicable, art. 293 B du CGI', M, y);
    y += 5;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(dark[0], dark[1], dark[2]);
    if (inv.paiement) { doc.text('Mode de paiement : ' + inv.paiement, M, y); y += 5; }

    var caution = parseFloat(inv.caution) || 0;
    if (caution > 0) {
      y += 2;
      doc.setFillColor(250, 250, 248);
      doc.roundedRect(M, y - 3, CW, 10, 1.5, 1.5, 'F');
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(gray[0], gray[1], gray[2]);
      doc.text('Depot de garantie (caution) : ' + _pdfMoney(caution) + ' - non incluse dans le total. Remboursable sous 7 jours.', M + 4, y + 3);
      y += 12;
    }

    // ── PAID STAMP ──
    if (inv.statut === 'Payee' || inv.statut === 'Payee') {
      doc.setDrawColor(green[0], green[1], green[2]); doc.setTextColor(green[0], green[1], green[2]);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(16); doc.setLineWidth(0.8);
      doc.roundedRect(W - M - 44, y, 44, 14, 2, 2);
      doc.text('PAYEE', W - M - 22, y + 10, { align: 'center' });
      doc.setTextColor(0); doc.setDrawColor(200); doc.setLineWidth(0.2);
    }

    // ── FOOTER ──
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(180, 180, 180);
    doc.text(loueur + (siret ? ' - SIRET : ' + siret : '') + ' - Document genere par Enomia', M, 285);
    doc.setTextColor(0);

    // ── SAVE ──
    var clientName = (inv.client || 'client').replace(/[^a-zA-Z0-9 -]/g, '').replace(/\s+/g, '-');
    var bienName = (bienLabel || 'bien').replace(/[^a-zA-Z0-9 -]/g, '').replace(/\s+/g, '-');
    var filename = clientName + ' facture sejour ' + bienName + ' - ' + (inv.arrivee || '') + ' ' + (inv.depart || '') + '.pdf';
    doc.save(filename);
    fToast('PDF telecharge', 'green');
    } catch(e) { alert('Erreur PDF: ' + e.message); console.error(e); }
  }

  // ─── MODALS ───
  window.fOpenModal = function(id) { document.getElementById(id).classList.add('open'); document.body.style.overflow = 'hidden'; };
  window.fCloseModal = function(id) { document.getElementById(id).classList.remove('open'); document.body.style.overflow = ''; };
  window.fCloseModalOnBg = function(e, id) { if (e.target === document.getElementById(id)) fCloseModal(id); };
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      document.querySelectorAll('#fact-wrap .modal-overlay.open').forEach(m => { m.classList.remove('open'); document.body.style.overflow = ''; });
    }
  });

  // ─── TOAST ───
  let _ftoastTimer = null;
  function fToast(msg, type) {
    const t = document.getElementById('ftoast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'ftoast show' + (type ? ' toast-' + type : '');
    clearTimeout(_ftoastTimer);
    _ftoastTimer = setTimeout(() => { t.className = 'ftoast'; }, 2800);
  }
  window.fToast = fToast;

  function fRenderAll() {
    fRenderTable(fcurrentYear);
    fRenderBiens();
    fPopulateBienSelect();
    if (fsettings.nom && document.getElementById('fl-nom')) document.getElementById('fl-nom').value = fsettings.nom;
    if (fsettings.adresse && document.getElementById('fl-adresse')) document.getElementById('fl-adresse').value = fsettings.adresse;
    if (fsettings.siret && document.getElementById('fl-siret')) document.getElementById('fl-siret').value = fsettings.siret;
  }

  // ─── INIT ───
  document.addEventListener('DOMContentLoaded', () => { fRenderAll(); });
  if (document.readyState === 'complete' || document.readyState === 'interactive') { fRenderAll(); }
}
