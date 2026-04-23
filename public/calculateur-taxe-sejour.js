// Calculateur de taxe de séjour — logique front.
// Source : /api/taxe-sejour (Supabase, fichier DELTA/OCSITAN DGFiP).
(() => {
  const API = '/api/taxe-sejour';

  const $ = (id) => document.getElementById(id);

  const inputCommune = $('ts-commune');
  const listCommune = $('ts-commune-list');
  const hintCommune = $('ts-commune-hint');
  const selectHeb = $('ts-hebergement');
  const hintHeb = $('ts-hebergement-hint');
  const inputAdultes = $('ts-adultes');
  const inputNuits = $('ts-nuits');
  const inputPrix = $('ts-prix');
  const fieldPrix = $('ts-field-prix');
  const resultEmpty = $('ts-result-empty');
  const resultFull = $('ts-result-full');
  const elTotal = $('ts-result-total');
  const elMeta = $('ts-result-meta');
  const elBreakdown = $('ts-result-breakdown');
  const elLegal = $('ts-legal');
  const btnShare = $('ts-btn-share');
  const btnReset = $('ts-btn-reset');

  const state = {
    commune: null,       // { code_insee, libelle, departement }
    tarifs: [],          // [{ hebergement, regime, tarif, tarif_total, unite, taxe_dep_pct, annee, periode, hebergement_slug }]
    selectedHeb: null,   // tarif object choisi
    ceilingEuro: null    // plafond € (Palace ou max)
  };

  // ---------- Utils ----------
  function prettyLibelle(raw) {
    if (!raw) return '';
    const clean = raw.replace(/^VILLE DE\s+/i, '').trim();
    return clean
      .toLowerCase()
      .split(/(\s|-|')/)
      .map((p) => (p.length <= 1 ? p : p[0].toUpperCase() + p.slice(1)))
      .join('');
  }

  function formatEuro(n) {
    if (n == null || !Number.isFinite(n)) return '—';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(n);
  }

  function debounce(fn, ms = 180) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn.apply(null, args), ms);
    };
  }

  // ---------- Steppers ----------
  document.querySelectorAll('.ts-stp').forEach((btn) => {
    btn.addEventListener('click', () => {
      const el = $(btn.dataset.target);
      if (!el) return;
      const min = parseInt(el.min, 10) || 0;
      const max = parseInt(el.max, 10) || 9999;
      const delta = parseInt(btn.dataset.delta, 10);
      let v = (parseInt(el.value, 10) || 0) + delta;
      if (v < min) v = min;
      if (v > max) v = max;
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
  });

  // ---------- Autocomplete ----------
  const searchCommune = debounce(async (q) => {
    if (q.length < 2) {
      listCommune.hidden = true;
      hintCommune.textContent = 'Saisissez au moins 2 lettres.';
      return;
    }
    try {
      const res = await fetch(`${API}?action=search&q=${encodeURIComponent(q)}`);
      const json = await res.json();
      renderAutocomplete(json.results || []);
    } catch (e) {
      hintCommune.textContent = 'Erreur réseau. Réessayez.';
    }
  }, 180);

  function renderAutocomplete(items) {
    listCommune.innerHTML = '';
    if (!items.length) {
      const li = document.createElement('li');
      li.className = 'ts-autoc-empty';
      li.textContent = 'Aucune commune trouvée.';
      listCommune.appendChild(li);
    } else {
      for (const c of items) {
        const li = document.createElement('li');
        li.setAttribute('role', 'option');
        li.dataset.insee = c.code_insee;
        li.innerHTML =
          `<span>${prettyLibelle(c.libelle)}</span>` +
          `<span class="ts-dept">${c.departement}</span>`;
        li.addEventListener('mousedown', (e) => {
          e.preventDefault();
          pickCommune(c);
        });
        listCommune.appendChild(li);
      }
    }
    listCommune.hidden = false;
    hintCommune.textContent = '';
  }

  inputCommune.addEventListener('input', (e) => {
    state.commune = null;
    state.tarifs = [];
    selectHeb.disabled = true;
    selectHeb.innerHTML = '<option value="">— Choisissez d\'abord une commune —</option>';
    searchCommune(e.target.value.trim());
    compute();
  });

  inputCommune.addEventListener('blur', () => {
    setTimeout(() => { listCommune.hidden = true; }, 120);
  });

  inputCommune.addEventListener('focus', () => {
    if (listCommune.children.length) listCommune.hidden = false;
  });

  async function pickCommune(c) {
    inputCommune.value = prettyLibelle(c.libelle);
    listCommune.hidden = true;
    hintCommune.textContent = `Commune ${prettyLibelle(c.libelle)} (${c.departement}) — chargement des tarifs…`;
    state.commune = c;
    await loadTarifs(c.code_insee);
  }

  async function loadTarifs(insee) {
    try {
      const res = await fetch(`${API}?action=tarifs&insee=${encodeURIComponent(insee)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur');
      state.tarifs = json.tarifs || [];
      state.commune = json.commune;

      // Plafond = le tarif € le plus élevé de la commune (Palace en général)
      const eurosOnly = state.tarifs
        .filter((t) => t.unite === '€')
        .map((t) => parseFloat(t.tarif_total));
      state.ceilingEuro = eurosOnly.length
        ? Math.max(...eurosOnly)
        : null;

      renderHebSelect();
      hintCommune.textContent = `${state.tarifs.length} tarifs disponibles pour ${prettyLibelle(state.commune.libelle)}.`;
      hintHeb.textContent = 'Choisissez la catégorie correspondant à votre bien.';
    } catch (e) {
      hintCommune.textContent = 'Impossible de charger les tarifs.';
      state.tarifs = [];
      state.commune = null;
    }
  }

  function hebergementOrder(label) {
    // Met les meublés/non classés en haut (cas Airbnb majoritaire)
    if (/non classement|attente de classement/i.test(label)) return 0;
    if (/meubl[ée]s de tourisme/i.test(label)) return 1;
    if (/chambres? d.h[ôo]tes/i.test(label)) return 2;
    if (/h[ôo]tels de tourisme/i.test(label)) return 3;
    if (/r[ée]sidences? de tourisme/i.test(label)) return 4;
    if (/villages? de vacances/i.test(label)) return 5;
    if (/campings?|caravanage|camping-cars|air/i.test(label)) return 6;
    if (/palaces?/i.test(label)) return 7;
    if (/auberges? collectives?/i.test(label)) return 8;
    return 9;
  }

  function renderHebSelect() {
    selectHeb.innerHTML = '';
    const sorted = [...state.tarifs].sort((a, b) => {
      const ra = hebergementOrder(a.hebergement);
      const rb = hebergementOrder(b.hebergement);
      if (ra !== rb) return ra - rb;
      return a.hebergement.localeCompare(b.hebergement, 'fr');
    });
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = '— Sélectionnez un type d\'hébergement —';
    selectHeb.appendChild(placeholder);
    for (const t of sorted) {
      const opt = document.createElement('option');
      opt.value = t.hebergement_slug + '|' + (t.periode || '');
      const price = t.unite === '%' ? `${t.tarif_total} %` : formatEuro(parseFloat(t.tarif_total));
      opt.textContent = `${t.hebergement} — ${price}`;
      opt.dataset.slug = t.hebergement_slug;
      opt.dataset.periode = t.periode || '';
      selectHeb.appendChild(opt);
    }
    selectHeb.disabled = false;
  }

  selectHeb.addEventListener('change', () => {
    const val = selectHeb.value;
    if (!val) { state.selectedHeb = null; compute(); return; }
    const [slug, periode] = val.split('|');
    state.selectedHeb = state.tarifs.find(
      (t) => t.hebergement_slug === slug && (t.periode || '') === periode
    ) || null;
    const isPct = state.selectedHeb && state.selectedHeb.unite === '%';
    fieldPrix.hidden = !isPct;
    inputPrix.required = !!isPct;
    compute();
  });

  // ---------- Calcul ----------
  [inputAdultes, inputNuits, inputPrix].forEach((el) => {
    el.addEventListener('input', () => compute());
  });

  function compute() {
    const heb = state.selectedHeb;
    if (!state.commune || !heb) {
      resultEmpty.hidden = false;
      resultFull.hidden = true;
      return;
    }
    const adultes = Math.max(1, parseInt(inputAdultes.value, 10) || 0);
    const nuits = Math.max(1, parseInt(inputNuits.value, 10) || 0);
    const tarifTotal = parseFloat(heb.tarif_total) || 0;
    const tarifBase = parseFloat(heb.tarif) || tarifTotal;

    let perNightPerAdult = 0;
    let legalNote = '';
    let breakdown = [];

    if (heb.unite === '%') {
      const prixNuit = Math.max(0, parseFloat(inputPrix.value) || 0);
      const prixParPers = prixNuit / adultes;
      const tauxDecimal = tarifTotal / 100;
      const raw = tauxDecimal * prixParPers;
      const plafond = state.ceilingEuro ?? raw;
      perNightPerAdult = Math.min(raw, plafond);

      breakdown.push(
        { k: 'Taux proportionnel', v: `${tarifTotal}%` },
        { k: 'Prix HT par personne et par nuit', v: formatEuro(prixParPers) },
        { k: 'Taxe brute (taux × prix/pers)', v: formatEuro(raw) }
      );
      if (raw > plafond) {
        breakdown.push({ k: 'Plafonné au tarif palace local', v: formatEuro(plafond) });
      }
      legalNote = `Pour un hébergement non classé, la taxe vaut <strong>${tarifTotal}%</strong> du prix HT/nuit/personne, plafonnée au tarif le plus élevé voté par la commune (${formatEuro(plafond)}). Source : art. L.2333-30 CGCT.`;
    } else {
      perNightPerAdult = tarifTotal;
      breakdown.push(
        { k: 'Tarif communal', v: formatEuro(tarifBase) + ' /nuit/adulte' }
      );
      if (heb.taxe_dep_pct) {
        const add = tarifTotal - tarifBase;
        breakdown.push({
          k: `Taxe additionnelle départementale (+${heb.taxe_dep_pct}%)`,
          v: `+ ${formatEuro(add)}`
        });
      }
      breakdown.push({ k: 'Tarif total par adulte et par nuit', v: `<strong>${formatEuro(tarifTotal)}</strong>` });
      legalNote = `Tarif voté par la commune pour la catégorie « ${heb.hebergement} », barème ${Math.max(heb.annee || 0, new Date().getFullYear())}. Taxe additionnelle dép. comprise.`;
    }

    const total = perNightPerAdult * adultes * nuits;

    breakdown.push({ k: '× adultes', v: String(adultes) });
    breakdown.push({ k: '× nuits', v: String(nuits) });

    const bareme = Math.max(heb.annee || 0, new Date().getFullYear());
    elTotal.innerHTML = formatEuro(total).replace('€', '<em>€</em>');
    elMeta.innerHTML = `<div><strong>${prettyLibelle(state.commune.libelle)}</strong> (${state.commune.departement})</div>` +
                        `<div>${heb.hebergement}</div>` +
                        `<div>Barème ${bareme}</div>`;
    elBreakdown.innerHTML = breakdown
      .map((b) => `<li><span>${b.k}</span><span>${b.v}</span></li>`).join('');
    elLegal.innerHTML = legalNote;

    resultEmpty.hidden = true;
    resultFull.hidden = false;
  }

  // ---------- Partage & reset ----------
  btnShare.addEventListener('click', async () => {
    if (!state.commune || !state.selectedHeb) return;
    const params = new URLSearchParams({
      insee: state.commune.code_insee,
      heb: state.selectedHeb.hebergement_slug,
      a: inputAdultes.value,
      n: inputNuits.value
    });
    if (state.selectedHeb.unite === '%' && inputPrix.value) {
      params.set('p', inputPrix.value);
    }
    const url = `${location.origin}${location.pathname}?${params}`;
    try {
      await navigator.clipboard.writeText(url);
      btnShare.textContent = '✓ Lien copié';
      setTimeout(() => {
        btnShare.innerHTML = btnShare.dataset.label || 'Copier le lien';
      }, 2000);
    } catch (_) {
      prompt('Copier ce lien :', url);
    }
  });
  btnShare.dataset.label = btnShare.innerHTML;

  btnReset.addEventListener('click', () => {
    inputCommune.value = '';
    state.commune = null;
    state.tarifs = [];
    state.selectedHeb = null;
    selectHeb.disabled = true;
    selectHeb.innerHTML = '<option value="">— Choisissez d\'abord une commune —</option>';
    inputAdultes.value = 2;
    inputNuits.value = 3;
    inputPrix.value = 100;
    fieldPrix.hidden = true;
    hintCommune.textContent = 'Saisissez au moins 2 lettres.';
    resultEmpty.hidden = false;
    resultFull.hidden = true;
    history.replaceState(null, '', location.pathname);
    inputCommune.focus();
  });

  // ---------- Hydrate URL ----------
  (async function hydrate() {
    const params = new URLSearchParams(location.search);
    const insee = params.get('insee');
    if (!insee || !/^[0-9A-Z]{5}$/i.test(insee)) return;
    try {
      const res = await fetch(`${API}?action=tarifs&insee=${encodeURIComponent(insee)}`);
      const json = await res.json();
      if (!res.ok) return;
      state.tarifs = json.tarifs || [];
      state.commune = json.commune;
      const eurosOnly = state.tarifs.filter((t) => t.unite === '€').map((t) => +t.tarif_total);
      state.ceilingEuro = eurosOnly.length ? Math.max(...eurosOnly) : null;
      inputCommune.value = prettyLibelle(state.commune.libelle);
      renderHebSelect();
      const slug = params.get('heb');
      if (slug) {
        const opt = [...selectHeb.options].find((o) => o.dataset.slug === slug);
        if (opt) {
          selectHeb.value = opt.value;
          selectHeb.dispatchEvent(new Event('change'));
        }
      }
      if (params.get('a')) inputAdultes.value = params.get('a');
      if (params.get('n')) inputNuits.value = params.get('n');
      if (params.get('p')) inputPrix.value = params.get('p');
      compute();
    } catch (_) {}
  })();

})();
