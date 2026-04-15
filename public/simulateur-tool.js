// ═══ Simulateur Rentabilité LCD — JS ═══

// ─── SUPABASE AUTH ───
const _sb = supabase.createClient(
  'https://pesoidoedtjpihjvrnnc.supabase.co',
  'sb_publishable_TTmUwZsTYt7OWBTwTruaLQ_BYzRT9Jp'
);
let _user = null, _token = null, _dbSims = [], _pendingSimData = null, _isViewingSharedSim = false;

// ─── Lightweight client-side error logging ───
// Logs go to Supabase table `client_logs` (fire-and-forget, never blocks UI)
function _elog(event, meta) {
  try {
    console.log('[Enomia]', event, meta);
    _sb.from('client_logs').insert([{
      event: event,
      meta: meta || {},
      page: window.location.pathname,
      ua: navigator.userAgent.slice(0, 200),
      ts: new Date().toISOString()
    }]).then(function(){}).catch(function(){});
  } catch(_) {}
}

// Lire les données de simulation depuis l'URL (cross-browser)
(function(){
  try {
    const ps = new URLSearchParams(window.location.search).get('ps');
    if (ps) {
      _pendingSimData = JSON.parse(decodeURIComponent(ps));
      // Nettoyer l'URL
      const u = new URL(window.location); u.searchParams.delete('ps');
      history.replaceState({}, '', u);
    }
  } catch(e) {}
})();

// Pré-fetch silencieux des simulations : peuple le cache en arrière-plan
// pour que le prochain clic sur "Mes simulations" soit instantané.
async function _prefetchSims() {
  if (!_user || !_token) return;
  try {
    const data = await _apiPost('/api/simulations', { action: 'fetch' }, true);
    if (data.simulations) {
      _dbSims = data.simulations;
      _saveSimsCache(_dbSims);
    }
  } catch (_) {}
}

_sb.auth.onAuthStateChange(async (event, session) => {
  _user = session?.user || null;
  _token = session?.access_token || null;
  _updateNavAuth();
  _updateAuthHint();
  if (event === 'SIGNED_IN') {
    // Vérifier qu'on attend bien un sign-in (magic link envoyé explicitement)
    const expectingSignIn = localStorage.getItem('enomia_expecting_signin') === '1';
    localStorage.removeItem('enomia_expecting_signin');
    closeMagicModal();
    await _migrateLocalStorage();
    const hasPending = _pendingSimData || localStorage.getItem('enomia_pending_save') === '1';
    if (_pendingSimData) {
      const simToSave = _pendingSimData;
      _pendingSimData = null;
      localStorage.removeItem('enomia_pending_save');
      localStorage.removeItem('enomia_pending_sim');
      await _doSaveToDb(simToSave);
    } else if (localStorage.getItem('enomia_pending_save') === '1') {
      localStorage.removeItem('enomia_pending_save');
      await _doSaveToDb();
    }
    // Pré-charger les sims en arrière-plan (non bloquant)
    _prefetchSims();
    // Rediriger vers dashboard uniquement si c'est un vrai login (pas session existante)
    if (expectingSignIn || hasPending) {
      _doShowDashboard();
    }
  } else if (event === 'SIGNED_OUT') {
    // Nettoyer le cache pour éviter la fuite entre comptes
    try { Object.keys(localStorage).filter(k => k.startsWith('enomia_sims_cache_')).forEach(k => localStorage.removeItem(k)); } catch(_) {}
  }
});

async function _initAuth() {
  // Shared sim loading FIRST — independent of auth (works in private browsing)
  const params = new URLSearchParams(window.location.search);
  const sharedSim = params.get('sim');
  if (sharedSim) _loadSharedSim(sharedSim);

  // Auth session — wrapped in try/catch for private browsing resilience
  try {
    const { data: { session } } = await _sb.auth.getSession();
    _user = session?.user || null;
    _token = session?.access_token || null;
  } catch (e) {
    console.warn('[Enomia] Session recovery failed (private browsing?):', e.message);
    _user = null; _token = null;
  }
  _updateNavAuth();
  _updateAuthHint();
  // Pré-fetch silencieux si l'utilisateur est déjà connecté (session restaurée)
  if (_user && _token && !sharedSim) {
    _prefetchSims();
  }
}

function _updateNavAuth() {
  var loginBtn = document.querySelector('.snav-login');
  var userBadge = document.querySelector('.snav-user');
  var avatar = document.querySelector('.snav-avatar');
  if (_user) {
    if (loginBtn) loginBtn.style.display = 'none';
    if (userBadge) userBadge.style.display = 'flex';
    if (avatar) {
      var initials = ((_user.email || '?').match(/^(.)(?:.*?[.\-_](.))?/) || []).slice(1).join('').toUpperCase() || '?';
      avatar.textContent = initials;
    }
  } else {
    if (loginBtn) loginBtn.style.display = '';
    if (userBadge) userBadge.style.display = 'none';
  }
}

function _updateAuthHint() {
  var hint = document.getElementById('sim-auth-hint');
  if (!hint) return;
  hint.style.display = _user ? 'none' : '';
}

async function _apiPost(path, body, withAuth) {
  const headers = { 'Content-Type': 'application/json' };
  if (withAuth && _token) headers['Authorization'] = 'Bearer ' + _token;
  const res = await fetch(path, { method: 'POST', headers, body: JSON.stringify(body) });
  return res.json();
}

// Google OAuth
async function signInWithGoogle() {
  localStorage.setItem('enomia_expecting_signin', '1');
  const simPayload = _pendingSimData ? encodeURIComponent(JSON.stringify(_pendingSimData)) : null;
  const redirectTo = window.location.origin + '/simulateur-lcd' + (simPayload ? '?ps=' + simPayload : '');
  await _sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, queryParams: { prompt: 'select_account' } }
  });
}

// Magic link modal
function showLoginModal() { _openMagicModal('Se connecter'); }
function _openMagicModal(label) {
  document.getElementById('magic-modal-label').textContent = label || 'Se connecter';
  document.getElementById('magic-step-email').style.display = '';
  document.getElementById('magic-step-confirm').style.display = 'none';
  document.getElementById('magic-error').style.display = 'none';
  document.getElementById('magic-email-input').value = '';
  document.getElementById('magic-modal').style.display = 'flex';
  setTimeout(() => document.getElementById('magic-prenom-input').focus(), 100);
}
function closeMagicModal() { document.getElementById('magic-modal').style.display = 'none'; }
function resetMagicModal() {
  document.getElementById('magic-step-email').style.display = '';
  document.getElementById('magic-step-confirm').style.display = 'none';
  document.getElementById('magic-prenom-input').value = '';
  document.getElementById('magic-email-input').value = '';
}
async function sendMagicLink() {
  const prenom = document.getElementById('magic-prenom-input').value.trim();
  const email = document.getElementById('magic-email-input').value.trim();
  const errEl = document.getElementById('magic-error');
  if (!email || !email.includes('@')) { errEl.textContent = 'Email invalide'; errEl.style.display = ''; return; }
  const btn = document.getElementById('magic-send-btn');
  btn.textContent = 'Envoi...'; btn.disabled = true;
  localStorage.setItem('enomia_expecting_signin', '1');
  const simPayload = _pendingSimData ? encodeURIComponent(JSON.stringify(_pendingSimData)) : null;
  const res = await _apiPost('/api/auth', { action: 'magic-link', email, prenom, simPayload }, false);
  btn.textContent = 'Recevoir mon lien \u2192'; btn.disabled = false;
  if (res.error) { errEl.textContent = res.error; errEl.style.display = ''; return; }
  document.getElementById('magic-email-sent').textContent = email;
  document.getElementById('magic-step-email').style.display = 'none';
  document.getElementById('magic-step-confirm').style.display = '';
}

// Migration localStorage → DB après connexion
async function _migrateLocalStorage() {
  const local = JSON.parse(localStorage.getItem('enomia_sims') || '[]');
  for (const sim of local) {
    await _apiPost('/api/simulations', { action: 'save', simulationName: sim.name, simulationData: sim }, true);
  }
  if (local.length) localStorage.removeItem('enomia_sims');
}

// Charger une simulation partagée
async function _loadSharedSim(id) {
  try {
    const data = await _apiPost('/api/simulations', { action: 'get-public', simulationId: id }, false);
    _elog('share_load', { id, hasData: !!data?.simulation, mode: data?.simulation?.data?.mode, lotsCount: data?.simulation?.data?.lots?.length });
    if (data.simulation) {
      const s = data.simulation.data;
      // Use setTimeout to ensure DOM is fully settled before restoring
      setTimeout(function() {
        _restoreSimData(s);
        _isViewingSharedSim = true;
        showScreen('screen-calc');
      }, 50);
    } else {
      console.warn('[Enomia] Shared simulation not found:', id);
    }
  } catch (e) {
    console.error('[Enomia] Failed to load shared sim:', e);
    _elog('share_load_error', { id, error: e.message });
  }
}

// Enomia Simulateur — no auth required
// ─── CORE FUNCTIONS ───
function goHome(){ window.location.href = '/simulateur-rentabilite-airbnb'; }
function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  var isCalc = id === 'screen-calc';
  var saveArea = document.querySelector('.calc-save-status');
  if (saveArea) saveArea.style.display = isCalc ? '' : 'none';
  var tabDash = document.getElementById('snav-tab-dash');
  var tabNew = document.getElementById('snav-tab-new');
  if (tabDash) tabDash.classList.toggle('active', id === 'screen-dashboard');
  if (tabNew) tabNew.classList.toggle('active', isCalc);
  window.scrollTo(0,0);
}
function _doShowDashboard(){showScreen('screen-dashboard');renderDash();}
function showDashboard(){checkUnsavedAndNavigate(_doShowDashboard);}

// ─── CACHE LOCAL DES SIMULATIONS (SWR pattern) ───
// Objectif : afficher le dashboard INSTANTANÉMENT depuis le cache,
// puis revalider en arrière-plan et mettre à jour le DOM si différent.
// Cache clé = user_id (pour éviter fuite entre comptes sur même navigateur).
function _simsCacheKey() {
  return _user ? 'enomia_sims_cache_' + _user.id : null;
}
function _loadSimsCache() {
  try {
    const k = _simsCacheKey();
    if (!k) return null;
    const raw = localStorage.getItem(k);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    // Cache valide 24h (re-fetch automatique après)
    if (Date.now() - (obj.at || 0) > 24 * 3600 * 1000) return null;
    return obj.sims || null;
  } catch(_) { return null; }
}
function _saveSimsCache(sims) {
  try {
    const k = _simsCacheKey();
    if (!k) return;
    localStorage.setItem(k, JSON.stringify({ at: Date.now(), sims: sims }));
  } catch(_) {}
}
function _clearSimsCache() {
  try {
    const k = _simsCacheKey();
    if (k) localStorage.removeItem(k);
  } catch(_) {}
}

// Rendu du dashboard (utilise directement _dbSims)
function _renderSimsInto(container) {
  document.getElementById('dash-sub').textContent = _dbSims.length + ' simulation' + (_dbSims.length !== 1 ? 's' : '') + ' sauvegardée' + (_dbSims.length !== 1 ? 's' : '');
  if (!_dbSims.length) {
    container.innerHTML = '<div class="sims-empty"><div class="sims-empty-icon">\ud83d\udcca</div><div class="sims-empty-t">Aucune simulation</div><p class="sims-empty-d">Cliquez sur "+ Nouvelle simulation" pour analyser votre premier bien.</p></div>';
    return;
  }
  container.innerHTML = '<div class="sims-grid">' + _dbSims.map((s, i) => renderCard(s.data || s, i, s.id)).join('') + '</div>';
}

async function renderDash() {
  const c = document.getElementById('sims-container');
  const cached = _loadSimsCache();

  // 1. Affichage INSTANTANÉ depuis le cache si dispo
  if (cached && cached.length) {
    _dbSims = cached;
    _renderSimsInto(c);
  } else {
    c.innerHTML = '<div style="padding:40px;text-align:center;color:var(--muted);font-size:14px">Chargement...</div>';
  }

  // 2. Revalidation en arrière-plan (SWR)
  try {
    const data = await _apiPost('/api/simulations', { action: 'fetch' }, true);
    const fresh = data.simulations || [];
    // Compare avec le cache : si différent, re-render
    const cachedJson = JSON.stringify(cached || []);
    const freshJson = JSON.stringify(fresh);
    if (cachedJson !== freshJson) {
      _dbSims = fresh;
      _saveSimsCache(fresh);
      _renderSimsInto(c);
    } else if (!cached) {
      // Premier load : pas de cache, on affiche maintenant
      _dbSims = fresh;
      _saveSimsCache(fresh);
      _renderSimsInto(c);
    }
  } catch (e) {
    // Si fetch échoue et qu'on n'avait pas de cache, message d'erreur
    if (!cached) {
      c.innerHTML = '<div style="padding:40px;text-align:center;color:var(--red);font-size:14px">Erreur de chargement. <a onclick="renderDash()" style="color:var(--accent);cursor:pointer;text-decoration:underline">Réessayer</a></div>';
    }
  }
}
function renderCard(s,i,dbId){
  const cls=s.rendement>=12?'good':s.rendement>=5?'ok':'bad';
  const verd=s.rendement>=12?'Excellent':s.rendement>=8?'Bon':s.rendement>=5?'Correct':'Faible';
  const dt=new Date(s.savedAt||s.created_at).toLocaleDateString('fr-FR',{day:'numeric',month:'short',year:'numeric'});
  return '<div class="sim-card" onclick="openSim('+i+')"><div class="sim-card-top"><div class="sim-badge '+(s.mode==='multi'?'multi':'')+'">'+( s.mode==='multi'?'Division lots':'Bien unique')+'</div><div class="sim-card-menu"><button class="sim-card-btn del" onclick="event.stopPropagation();deleteSim(\''+dbId+'\')">Suppr.</button><button class="sim-card-btn" onclick="event.stopPropagation();shareSimulation(\''+dbId+'\')">Partager</button></div></div><div class="sim-name">'+(s.name||'Sans nom')+'</div><div class="sim-date">'+dt+'</div><div class="sim-rend '+cls+'">'+(s.rendement?.toFixed(1)||'\u2014')+'%</div><div class="sim-verdict '+cls+'">'+verd+' rendement</div><div class="sim-stats"><div class="sim-stat"><div class="sim-stat-l">Cash flow</div><div class="sim-stat-v '+(s.cfMois>=0?'pos':'neg')+'">'+fmtM(s.cfMois)+'/mois</div></div><div class="sim-stat"><div class="sim-stat-l">Co\u00fbt projet</div><div class="sim-stat-v">'+fmtK(s.totalProjet)+'</div></div><div class="sim-stat"><div class="sim-stat-l">Mensualit\u00e9</div><div class="sim-stat-v">'+fmtM(s.mensalit)+'/mois</div></div><div class="sim-stat"><div class="sim-stat-l">'+(s.mode==='multi'?'Nb lots':'Prix achat')+'</div><div class="sim-stat-v">'+(s.mode==='multi'?(s.nbLots||'\u2014')+' lots':fmtK(s.prix||0))+'</div></div></div></div>';
}
async function deleteSim(dbId){
  if(!confirm('Supprimer cette simulation ?'))return;
  // Optimistic : retirer du cache immédiatement
  _dbSims = _dbSims.filter(s => s.id !== dbId);
  _saveSimsCache(_dbSims);
  _renderSimsInto(document.getElementById('sims-container'));
  await _apiPost('/api/simulations', { action: 'delete', simulationId: dbId }, true);
  // Revalidation en arrière-plan
  renderDash();
}
async function shareSimulation(dbId){
  const data = await _apiPost('/api/simulations', { action: 'share', simulationId: dbId }, true);
  if(data.shareUrl){
    document.getElementById('share-link').value = data.shareUrl;
    showSharePopup();
  }
}

// ─── CALC ───
let currentSimIdx=null,calcMode='single',bienType='studio',travauxMode='rafraichissement';
let lots=[{nuit:90,surface:35,occu:20,nuitMoy:2},{nuit:90,surface:35,occu:20,nuitMoy:2}];
let currentResult={};
const PRESETS={
  studio:{prix:120000,surface:25,nuit:70,occu:23,eau:20,elec:50,fonciere:42,copro:65,ameu:6000},
  t2:{prix:160000,surface:40,nuit:90,occu:22,eau:25,elec:80,fonciere:58,copro:90,ameu:8000},
  t3:{prix:220000,surface:65,nuit:120,occu:21,eau:30,elec:120,fonciere:75,copro:130,ameu:10000},
  t4:{prix:280000,surface:85,nuit:150,occu:20,eau:40,elec:160,fonciere:95,copro:160,ameu:15000},
  t5:{prix:360000,surface:110,nuit:200,occu:19,eau:50,elec:200,fonciere:120,copro:200,ameu:20000},
};
const fmt=n=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n||0);
const fmtM=fmt;
const fmtK=n=>n>=1000?Math.round(n/1000)+'k\u20ac':fmt(n);
const numS=id=>parseFloat(document.getElementById('s-'+id)?.value)||0;

function setMode(mode,btn){
  calcMode=mode;
  document.querySelectorAll('.mode-tab').forEach(t=>{t.classList.remove('on');t.classList.remove('multi-on');});
  mode==='single'?btn.classList.add('on'):btn.classList.add('multi-on');
  document.getElementById('section-single').style.display=mode==='single'?'block':'none';
  document.getElementById('section-multi').style.display=mode==='multi'?'block':'none';
  document.getElementById('revenus-single').style.display=mode==='single'?'block':'none';
  document.getElementById('fin-num').textContent=mode==='single'?'02':'03';
  document.getElementById('sec-revenus').style.display=mode==='single'?'':'none';
  document.getElementById('ch-num').textContent=mode==='single'?'04':'04';
  mode==='multi'?renderLots()&&computeMulti():compute();
  if(mode==='multi'){renderLots();computeMulti();}else{compute();}
}
function renderLots(){
  document.getElementById('lots-container').innerHTML=lots.map((l,i)=>`
    <div class="lot-row">
      ${lots.length>1?`<button class="lot-remove" onclick="removeLot(${i})">\u00d7</button>`:''}
      <span class="lot-num">Lot ${i+1}</span>
      <div class="lot-inputs">
        <div class="lot-field"><input class="lot-input" type="number" value="${l.nuit}" min="20" max="1000" step="5" onchange="lots[${i}].nuit=parseFloat(this.value)||0;computeMulti()"><span class="lot-unit">\u20ac/nuit</span></div>
        <div class="lot-field"><input class="lot-input" type="number" value="${l.surface}" min="10" max="500" step="5" onchange="lots[${i}].surface=parseFloat(this.value)||0;computeMulti()"><span class="lot-unit">m\u00b2</span></div>
        <div class="lot-break"></div>
        <div class="lot-field"><input class="lot-input" type="number" value="${l.occu||20}" min="1" max="30" step="1" onchange="lots[${i}].occu=parseFloat(this.value)||0;computeMulti()"><span class="lot-unit">nuits/mois</span></div>
        <div class="lot-field"><input class="lot-input" style="width:52px" type="number" value="${l.nuitMoy||2}" min="1" max="30" step="0.1" onchange="lots[${i}].nuitMoy=parseFloat(this.value)||0;computeMulti()"><span class="lot-unit">dur. s\u00e9jour</span><span class="lot-tip"><span class="lot-tip-icon">i</span><span class="lot-tip-text">La dur\u00e9e moyenne d\u2019un s\u00e9jour, permettant de calculer les charges exactes en fonction du nombre de m\u00e9nages \u00e0 faire</span></span></div>
      </div>
    </div>`).join('');
}
function addLot(){lots.push({nuit:90,surface:35,occu:20,nuitMoy:2});renderLots();computeMulti();}
function removeLot(i){lots.splice(i,1);renderLots();computeMulti();}

const SLIDER_LABELS={prix:v=>v>=1000?Math.round(v/1000)+'k':v,apport:v=>v>=1000?Math.round(v/1000)+'k':v,duree:v=>v,taux:v=>parseFloat(v).toFixed(1),nuit:v=>v,occu:v=>v+' nuits ('+Math.round(v/30.4*100)+'%)',sejour:v=>parseFloat(v).toFixed(1),commission:v=>v,surface:v=>v,travaux:v=>v>=1000?Math.round(v/1000)+'k':v,ameu:v=>v>=1000?Math.round(v/1000)+'k':v,menage:v=>v,blanc:v=>v,eau:v=>v,elec:v=>v,internet:v=>v,consommables:v=>v,logiciel:v=>v,comptable:v=>v,fonciere:v=>v,copro:v=>v,assurance:v=>v};
const SLIDER_UNITS={prix:'\u20ac',apport:'\u20ac',duree:'ans',taux:'%',nuit:'\u20ac/nuit',occu:'',sejour:'nuits',commission:'%',surface:'m\u00b2',travaux:'\u20ac',ameu:'\u20ac',menage:'\u20ac/rot.',blanc:'\u20ac/rot.',eau:'\u20ac/mois',elec:'\u20ac/mois',internet:'\u20ac/mois',consommables:'\u20ac/mois',logiciel:'\u20ac/mois',comptable:'\u20ac/mois',fonciere:'\u20ac/mois',copro:'\u20ac/mois',assurance:'\u20ac/mois'};
const SV2_LABELS={'prix-m':v=>v>=1000?Math.round(v/1000)+'k':v,'travaux-m':v=>v>=1000?Math.round(v/1000)+'k':v,'ameu-m':v=>v>=1000?Math.round(v/1000)+'k':v};
const SV2_UNITS={'prix-m':'\u20ac','travaux-m':'\u20ac','ameu-m':'\u20ac'};

function sv(id,val){
  const v=parseFloat(val);
  const el=document.getElementById('v-'+id);
  if(el)el.innerHTML=((SLIDER_LABELS[id]?.(v))??v)+' <em>'+(SLIDER_UNITS[id]||'')+'</em>';
  const s=document.getElementById('s-'+id);
  if(s){const p=(s.value-s.min)/(s.max-s.min)*100;s.style.background=`linear-gradient(to right,var(--accent) ${p}%,var(--border) ${p}%)`;}
}
function sv2(id,val){
  const v=parseFloat(val);
  const el=document.getElementById('v-'+id);
  if(el)el.innerHTML=((SV2_LABELS[id]?.(v))??v)+' <em>'+(SV2_UNITS[id]||'')+'</em>';
  const s=document.getElementById('s-'+id);
  if(s){const p=(s.value-s.min)/(s.max-s.min)*100;s.style.background=`linear-gradient(to right,var(--accent) ${p}%,var(--border) ${p}%)`;}
}

function setType(type,btn){
  bienType=type;
  document.querySelectorAll('.tabs .tab').forEach(t=>t.classList.remove('on'));
  if(btn)btn.classList.add('on');
  const p=PRESETS[type];
  Object.entries(p).forEach(([k,v])=>{const el=document.getElementById('s-'+k);if(el){el.value=v;sv(k,v);}});
  setAmeuValue(p.ameu);updateTH();compute();
}
function setTravaux(mode,el){
  travauxMode=mode;
  document.querySelectorAll('.th').forEach(t=>t.classList.remove('on'));el.classList.add('on');
  const rates={aucun:0,rafraichissement:400,renovation:1000};
  const s=numS('surface');const v=Math.round(rates[mode]*s/1000)*1000;
  const sr=document.getElementById('s-travaux');sr.value=v;sv('travaux',v);
  updateTH();compute();
}
function updateTH(){
  const s=numS('surface');
  const hints={aucun:'Aucun travaux',rafraichissement:`400\u20ac/m\u00b2 \u00d7 ${s}m\u00b2`,renovation:`1 000\u20ac/m\u00b2 \u00d7 ${s}m\u00b2`};
  const el=document.getElementById('travaux-hint');if(el)el.textContent=hints[travauxMode];
}
function setAmeu(val,btn){document.querySelectorAll('.ap').forEach(b=>b.classList.remove('on'));if(btn)btn.classList.add('on');setAmeuValue(val);compute();}
function setAmeuValue(val){const s=document.getElementById('s-ameu');s.value=val;sv('ameu',val);}
function clearAmeuPre(){document.querySelectorAll('.ap').forEach(b=>b.classList.remove('on'));}
function calcMens(m,r,d){if(r<=0)return m/(d*12);const mr=r/100/12,n=d*12;return m*(mr*Math.pow(1+mr,n))/(Math.pow(1+mr,n)-1);}
function computeActive(){calcMode==='multi'?computeMulti():compute();}

function getInputs(){
  return {
    apport:numS('apport'),duree:numS('duree'),taux:numS('taux'),commission:numS('commission'),
    menage:numS('menage'),blanc:numS('blanc'),eau:numS('eau'),elec:numS('elec'),
    internet:numS('internet'),consommables:numS('consommables'),logiciel:numS('logiciel'),
    comptable:numS('comptable'),fonciere:numS('fonciere'),copro:numS('copro'),assurance:numS('assurance'),
  };
}

function compute(){
  const prix=numS('prix'),surface=numS('surface'),travaux=numS('travaux'),ameu=numS('ameu');
  const {apport,duree,taux,commission,menage,blanc,eau,elec,internet,consommables,logiciel,comptable,fonciere,copro,assurance}=getInputs();
  const nuit=numS('nuit'),nuits=numS('occu'),sejour=Math.max(0.5,numS('sejour'));
  const notaire=Math.round(prix*0.075);
  const emprAC=Math.max(0,prix+notaire+travaux+ameu-apport);
  const caution=Math.round(emprAC*0.01);
  const total=prix+notaire+travaux+ameu+caution;
  const empr=Math.max(0,total-apport);
  const mens=empr>0?calcMens(empr,taux,duree):0;
  const inter=Math.max(0,mens*duree*12-empr);
  const caM=nuit*nuits;
  const rotM=nuits/sejour;
  const otaM=caM*(commission/100);
  const menM=rotM*(menage+blanc);
  const fixM=eau+elec+internet+consommables+logiciel+comptable+fonciere+copro+assurance;
  const chM=otaM+menM+fixM;
  const cfM=caM-chM-mens;
  const netA=(caM-chM)*12;
  const rend=total>0?((netA-inter/duree)/total)*100:0;
  const seuil=nuit>0?Math.min(100,((fixM+mens)*12)/(nuit*365)*100):0;
  const mA=cfM>0&&apport>0?Math.ceil(apport/cfM):null;
  document.getElementById('v-notaire').textContent=fmt(notaire);
  document.getElementById('notaire-hint').textContent='Calcul\u00e9s \u00e0 7.5% (bien ancien)';
  document.getElementById('tc-prix').textContent=fmt(prix);
  document.getElementById('tc-notaire').textContent=fmt(notaire);
  document.getElementById('tc-travaux').textContent=fmt(travaux);
  document.getElementById('tc-ameu').textContent=fmt(ameu);
  document.getElementById('tc-bancaires').textContent=fmt(caution);
  document.getElementById('tc-total').textContent=fmt(total);
  currentResult={rendement:rend,cfMois:cfM,netAn:netA,totalProjet:total,emprunt:empr,mensalit:mens,interets:inter,moisApport:mA,prix,mode:'single'};
  updateResults(rend,cfM,caM,otaM,menM,fixM,mens,(caM-chM)*12,chM*12,seuil,total,empr,inter,apport,mA);
}

function computeMulti(){
  const {apport,duree,taux,commission,menage,blanc,eau,elec,internet,consommables,logiciel,comptable,fonciere,copro,assurance}=getInputs();
  const prix=parseFloat(document.getElementById('s-prix-m')?.value)||0;
  const travaux=parseFloat(document.getElementById('s-travaux-m')?.value)||0;
  const ameu=parseFloat(document.getElementById('s-ameu-m')?.value)||0;
  const notaire=Math.round(prix*0.075);
  document.getElementById('v-notaire-m').textContent=fmt(notaire);
  const emprAC=Math.max(0,prix+notaire+travaux+ameu-apport);
  const caution=Math.round(emprAC*0.01);
  const total=prix+notaire+travaux+ameu+caution;
  const empr=Math.max(0,total-apport);
  const mens=empr>0?calcMens(empr,taux,duree):0;
  const inter=Math.max(0,mens*duree*12-empr);
  const lotsCaRaw=lots.reduce((s,l)=>s+l.nuit*(l.occu||20),0);
  document.getElementById('lots-ca-total').textContent=fmt(lotsCaRaw)+'/mois';
  const rotMTot=lots.reduce((s,l)=>s+(l.occu||20)/Math.max(0.5,l.nuitMoy||2.5),0);
  const otaMTot=lotsCaRaw*(commission/100);
  const menMTot=rotMTot*(menage+blanc);
  const fixM=eau+elec+internet+consommables+logiciel+comptable+fonciere+copro+assurance;
  const chM=otaMTot+menMTot+fixM;
  const caM=lotsCaRaw;
  const cfM=caM-chM-mens;
  const netA=(caM-chM)*12;
  const rend=total>0?((netA-inter/duree)/total)*100:0;
  const seuil=caM>0?Math.min(100,((fixM+mens)*12)/(caM*12)*100):0;
  const mA=cfM>0&&apport>0?Math.ceil(apport/cfM):null;
  document.getElementById('tc-prix-m').textContent=fmt(prix);
  document.getElementById('tc-notaire-m').textContent=fmt(notaire);
  document.getElementById('tc-travaux-m').textContent=fmt(travaux);
  document.getElementById('tc-ameu-m').textContent=fmt(ameu);
  document.getElementById('tc-bancaires-m').textContent=fmt(caution);
  document.getElementById('tc-total-m').textContent=fmt(total);
  document.getElementById('total-multi').style.display='block';
  currentResult={rendement:rend,cfMois:cfM,netAn:netA,totalProjet:total,emprunt:empr,mensalit:mens,interets:inter,moisApport:mA,mode:'multi',nbLots:lots.length,prix};
  updateResults(rend,cfM,caM,otaMTot,menMTot,fixM,mens,(caM-chM)*12,chM*12,seuil,total,empr,inter,apport,mA);
}

function updateResults(rend,cfM,caM,otaM,menM,fixM,mens,netA,chA,seuil,total,empr,inter,apport,mA){
  const rDisp=rend.toFixed(1);
  const rEl=document.getElementById('r-rend');rEl.textContent=rDisp+'%';
  let cls,txt;
  if(rend>=12){cls='good';txt='Excellent rendement';}
  else if(rend>=8){cls='';txt='Bon rendement';}
  else if(rend>=5){cls='';txt='Rendement correct';}
  else if(rend>=0){cls='bad';txt='Rendement faible';}
  else{cls='bad';txt='Cash flow n\u00e9gatif';}
  rEl.className='res-big '+cls;
  const vEl=document.getElementById('r-verdict');vEl.className='res-verdict '+cls;vEl.textContent=txt;
  document.getElementById('fc-total').textContent=fmt(total);
  document.getElementById('fc-apport').textContent='\u2212 '+fmt(apport);
  document.getElementById('fc-emprunt').textContent=fmt(empr);
  document.getElementById('fc-mens').textContent=fmt(mens)+'/mois';
  document.getElementById('r-ca').textContent=fmt(caM)+'/mois';
  document.getElementById('r-ota').textContent='\u2212'+fmt(otaM)+'/mois';
  document.getElementById('r-men').textContent='\u2212'+fmt(menM)+'/mois';
  document.getElementById('r-ch').textContent='\u2212'+fmt(fixM)+'/mois';
  document.getElementById('r-cred').textContent='\u2212'+fmt(mens)+'/mois';
  const cfEl=document.getElementById('r-cf');cfEl.textContent=fmt(cfM)+'/mois';cfEl.className='rrv big '+(cfM>=0?'pos':'neg');
  document.getElementById('r-ca-a').textContent=fmt(caM*12);
  document.getElementById('r-ch-a').textContent='\u2212'+fmt(chA);
  document.getElementById('r-net-a').textContent=fmt(netA);
  document.getElementById('r-seuil').textContent=Math.max(0,seuil).toFixed(0)+"% d'occupation";
  document.getElementById('r-projet').textContent=fmt(total);
  document.getElementById('r-empr').textContent=fmt(empr);
  document.getElementById('r-interets').textContent=fmt(inter);
  if(apport<=0){document.getElementById('r-apport-n').textContent='\u2014';document.getElementById('r-apport-sub').textContent="Pas d'apport renseign\u00e9";document.getElementById('apport-fill').style.width='0%';}
  else if(!mA){document.getElementById('r-apport-n').textContent='\u221e';document.getElementById('r-apport-sub').textContent='Cash flow n\u00e9gatif';document.getElementById('apport-fill').style.width='0%';}
  else{const an=(mA/12).toFixed(1);document.getElementById('r-apport-n').textContent=mA;document.getElementById('r-apport-sub').textContent=`Soit ${an} ans \u00b7 ${fmt(cfM)}/mois de cash flow`;const maxM=Math.max(240,mA*1.3);document.getElementById('apport-fill').style.width=Math.min(100,mA/maxM*100)+'%';}
  const gP=Math.min(100,Math.max(0,rend/20*100));
  const gF=document.getElementById('g-fill');gF.style.width=gP+'%';gF.className='gauge-fill '+(rend>=10?'good':rend>=5?'':'bad');
  const scale=28,offset=2;
  const lcdPct=Math.min(100,Math.max(0,(rend-offset)/scale*100));
  const lcdEl=document.getElementById('comp-lcd');
  lcdEl.style.width=lcdPct+'%';
  lcdEl.className='comp-fill lcd '+(rend>=10?'good':rend>=5?'':'bad');
  document.getElementById('comp-lcd-v').textContent=rDisp+'%';
  document.getElementById('save-status').textContent='Non sauvegard\u00e9';
}

function _doNewSimulation(){
  currentSimIdx=null;currentSimDbId=null;_isViewingSharedSim=false;
  document.getElementById('sim-name-input').value='';
  document.getElementById('save-status').textContent='';
  calcMode='single';
  document.getElementById('mode-single').classList.add('on');
  document.getElementById('mode-multi').classList.remove('on');
  document.getElementById('mode-multi').classList.remove('multi-on');
  document.getElementById('section-single').style.display='block';
  document.getElementById('section-multi').style.display='none';
  document.getElementById('revenus-single').style.display='block';
  showScreen('screen-calc');initSliders();compute();
}
function newSimulation(){
  var isCalc=document.getElementById('screen-calc').classList.contains('active');
  if(isCalc){checkUnsavedAndNavigate(_doNewSimulation);}else{_doNewSimulation();}
}
function openSim(i){_isViewingSharedSim=false;
  const entry=_dbSims[i];const s=entry?.data||entry;if(!s)return;
  currentSimIdx=i;
  document.getElementById('sim-name-input').value=s.name||'';
  if(s.mode==='multi'){
    if(s.lots && s.lots.length) lots=[...s.lots];
    setMode('multi',document.getElementById('mode-multi'));
    renderLots();
    ['prix-m','travaux-m','ameu-m'].forEach(id=>{const el=document.getElementById('s-'+id);if(el&&s.sliders?.[id]!==undefined){el.value=s.sliders[id];sv2(id,s.sliders[id]);}});
    computeMulti();
  } else {
    setMode('single',document.getElementById('mode-single'));
    Object.keys(SLIDER_LABELS).forEach(id=>{const el=document.getElementById('s-'+id);if(el&&s.sliders?.[id]!==undefined){el.value=s.sliders[id];sv(id,s.sliders[id]);}});
    compute();
  }
  showScreen('screen-calc');
}
let currentSimDbId = null;
async function _doSaveToDb(overrideData){
  let simData = overrideData || null;
  if(!simData){
  const pending = localStorage.getItem('enomia_pending_sim');
  if(pending){ simData = JSON.parse(pending); localStorage.removeItem('enomia_pending_sim'); }
  }
  if(!simData){
    const name=document.getElementById('sim-name-input').value.trim()||'Simulation sans nom';
    const sliders={};
    Object.keys(SLIDER_LABELS).forEach(id=>{const s=document.getElementById('s-'+id);if(s)sliders[id]=parseFloat(s.value);});
    ['prix-m','travaux-m','ameu-m'].forEach(id=>{const s=document.getElementById('s-'+id);if(s)sliders[id]=parseFloat(s.value);});
    simData={name,sliders,mode:calcMode,type:bienType,...currentResult,lots:calcMode==='multi'?[...lots]:undefined,savedAt:new Date().toISOString()};
  }
  const res=await _apiPost('/api/simulations',{action:'save',simulationName:simData.name,simulationData:simData,simulationId:currentSimDbId},true);
  if(res.simulationId)currentSimDbId=res.simulationId;
  // Invalider le cache pour qu'au prochain dashboard, on refetch
  _clearSimsCache();
  document.getElementById('save-status').textContent='';
}
async function saveSimulation(){
  if(!_user){
    // Sauvegarder l'état du simulateur avant la redirection magic link
    const name=document.getElementById('sim-name-input').value.trim()||'Simulation sans nom';
    const sliders={};
    Object.keys(SLIDER_LABELS).forEach(id=>{const s=document.getElementById('s-'+id);if(s)sliders[id]=parseFloat(s.value);});
    ['prix-m','travaux-m','ameu-m'].forEach(id=>{const s=document.getElementById('s-'+id);if(s)sliders[id]=parseFloat(s.value);});
    const simData={name,sliders,mode:calcMode,type:bienType,...currentResult,lots:calcMode==='multi'?[...lots]:undefined,savedAt:new Date().toISOString()};
    _pendingSimData = simData; // accessible dans sendMagicLink pour l'URL
    localStorage.setItem('enomia_pending_save', '1');
    localStorage.setItem('enomia_pending_sim', JSON.stringify(simData));
    _openMagicModal('Sauvegarder');
    return;
  }
  await _doSaveToDb();
}
function initSliders(){
  Object.keys(SLIDER_LABELS).forEach(id=>{const s=document.getElementById('s-'+id);if(s)sv(id,s.value);});
  Object.keys(SV2_LABELS).forEach(id=>{const s=document.getElementById('s-'+id);if(s)sv2(id,s.value);});
}
async function subscribeNL(){
  const email=document.getElementById('nl-email').value.trim();
  const prenom=document.getElementById('nl-prenom')?.value.trim()||'';
  if(!email||!email.includes('@'))return;
  const btn=document.querySelector('.nl-capture-form button');
  const orig=btn.textContent;
  btn.disabled=true;btn.textContent='Envoi\u2026';
  try{
    const r=await fetch('/api/subscribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:email,firstName:prenom||'Visiteur',source:'Simulateur_NL'})});
    if(r.ok){btn.textContent='\u2713 Inscrit !';btn.style.background='var(--green)';document.getElementById('nl-email').value='';if(document.getElementById('nl-prenom'))document.getElementById('nl-prenom').value='';}
    else{btn.textContent='Erreur';btn.disabled=false;setTimeout(function(){btn.textContent=orig;},2000);}
  }catch(_){btn.textContent='Erreur';btn.disabled=false;setTimeout(function(){btn.textContent=orig;},2000);}
}
initSliders();

// Save popup
function showSavePopup(){document.getElementById('save-popup').style.display='flex';}
function closeSavePopup(){document.getElementById('save-popup').style.display='none';}
function doSaveAccount(){
  var p=document.getElementById('save-prenom').value.trim();
  var e=document.getElementById('save-email').value.trim();
  var pw=document.getElementById('save-pwd').value;
  if(!p||!e||!e.includes('@')||pw.length<6){alert('Remplissez tous les champs (mot de passe 6 car. min)');return;}
  // TODO: Supabase auth
  closeSavePopup();
  saveSimulation();
  showSharePopup();
}

// Share popup
async function initSharePopup(){
  // Si on est sur une sim partagée (?sim=...), utiliser le lien /api/share pour les OG
  const simParam = new URLSearchParams(window.location.search).get('sim');
  if(simParam){
    document.getElementById('share-link').value = 'https://enomia.app/api/share?id=' + simParam;
    showSharePopup();
    return;
  }
  if(!_user){
    // Pas connecté : sauvegarder d'abord (magic link)
    saveSimulation();
    return;
  }
  // Connecté : sauvegarder si pas encore en DB, puis générer le lien
  if(!currentSimDbId) await _doSaveToDb();
  const data = await _apiPost('/api/simulations', { action: 'share', simulationId: currentSimDbId }, true);
  if(data.shareUrl) document.getElementById('share-link').value = data.shareUrl;
  showSharePopup();
}
function showSharePopup(){document.getElementById('share-popup').style.display='flex';}
function closeSharePopup(){document.getElementById('share-popup').style.display='none';document.getElementById('share-success').style.display='none';}
async function doShare(){
  var e=document.getElementById('share-email').value.trim();
  var msg=document.getElementById('share-message').value.trim();
  var link=document.getElementById('share-link').value;
  if(!e||!e.includes('@')){alert('Email invalide');return;}
  const res = await _apiPost('/api/auth', { action: 'share-email', email: e, message: msg, shareUrl: link }, false);
  if(res.error){alert('Erreur envoi : '+res.error);return;}
  document.getElementById('share-success').style.display='block';
  document.getElementById('share-email').value='';
  document.getElementById('share-message').value='';
}
function copyShareLink(){
  navigator.clipboard.writeText(document.getElementById('share-link').value);
  var btn=document.getElementById('copy-link-btn');btn.textContent='\u2713 Copi\u00e9';
  setTimeout(function(){btn.textContent='Copier'},2000);
}

// ─── UNSAVED NAVIGATION GUARD ───
window.addEventListener('beforeunload', function(e){
  var isCalc=document.getElementById('screen-calc').classList.contains('active');
  var isUnsaved=document.getElementById('save-status').textContent==='Non sauvegard\u00e9';
  if(isCalc&&isUnsaved&&currentResult){
    e.preventDefault();
    e.returnValue='';
  }
});
var _leaveCallback = null;
function isSubscribed(){return !!_user;}
function checkUnsavedAndNavigate(cb){
  if(_isViewingSharedSim){cb();return;}
  var isCalc=document.getElementById('screen-calc').classList.contains('active');
  var isUnsaved=document.getElementById('save-status').textContent==='Non sauvegard\u00e9';
  if(isCalc&&isUnsaved&&currentResult){
    _leaveCallback=cb;
    if(isSubscribed()){
      saveSimulation().then(cb);
    } else {
      document.getElementById('leave-popup').style.display='flex';
    }
  } else { cb(); }
}
function saveAndLeave(){
  var prenom=document.getElementById('leave-prenom').value.trim();
  var email=document.getElementById('leave-email').value.trim();
  var biens=document.getElementById('leave-biens').value;
  if(!prenom){alert('Entrez votre pr\u00e9nom');return;}
  if(!email||!email.includes('@')){alert('Email invalide');return;}
  if(!biens){alert('S\u00e9lectionnez votre nombre de biens');return;}
  localStorage.setItem('enomia_email', email);
  localStorage.setItem('enomia_prenom', prenom);
  // TODO: envoyer email avec lien simulation
  saveSimulation();
  document.getElementById('leave-success').style.display='block';
  setTimeout(function(){
    document.getElementById('leave-popup').style.display='none';
    document.getElementById('leave-success').style.display='none';
    if(_leaveCallback){_leaveCallback();_leaveCallback=null;}
  },1500);
}
function leaveWithoutSaving(){
  document.getElementById('leave-popup').style.display='none';
  if(_leaveCallback){_leaveCallback();_leaveCallback=null;}
}

// Helper pour restaurer les données d'une simulation dans les sliders
function _restoreSimData(s){
  if(!s)return;
  if(s.name){const el=document.getElementById('sim-name-input');if(el)el.value=s.name;}
  // Restore lots before switching mode
  if(s.lots && s.lots.length) lots=[...s.lots];
  // Restore mode + update UI sections
  if(s.mode){
    calcMode=s.mode;
    document.querySelectorAll('.mode-tab').forEach(t=>{t.classList.remove('on');t.classList.remove('multi-on');});
    const modeBtn=document.getElementById('mode-'+(s.mode==='multi'?'multi':'single'));
    if(modeBtn) s.mode==='single'?modeBtn.classList.add('on'):modeBtn.classList.add('multi-on');
    document.getElementById('section-single').style.display=s.mode==='single'?'block':'none';
    document.getElementById('section-multi').style.display=s.mode==='multi'?'block':'none';
    document.getElementById('revenus-single').style.display=s.mode==='single'?'block':'none';
    document.getElementById('fin-num').textContent=s.mode==='single'?'02':'03';
    document.getElementById('sec-revenus').style.display=s.mode==='single'?'':'none';
  }
  // Restore type + highlight tab
  if(s.type){
    bienType=s.type;
    document.querySelectorAll('.tabs .tab').forEach(t=>t.classList.remove('on'));
    const typeBtn=document.querySelector(`.tab[onclick*="'${s.type}'"]`);
    if(typeBtn)typeBtn.classList.add('on');
  }
  if(s.sliders)Object.keys(s.sliders).forEach(id=>{
    const el=document.getElementById('s-'+id);
    if(el){
      el.value=s.sliders[id];
      // Multi-lot sliders use sv2(), single-mode sliders use sv()
      if(SV2_LABELS[id]){sv2(id,s.sliders[id]);}else{sv(id,s.sliders[id]);}
    }
  });
  if(s.mode==='multi'){renderLots();computeMulti();}else{compute();}
}

// Init auth au chargement
_initAuth();

// Prevent accidental slider changes while scrolling on mobile
(function(){
  document.querySelectorAll('input[type="range"]').forEach(function(slider){
    var startX, startY, startVal, decided, isScrolling;
    slider.addEventListener('touchstart', function(e){
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      startVal = slider.value;
      decided = false;
      isScrolling = false;
    }, {passive:true});
    slider.addEventListener('touchmove', function(e){
      if(!decided){
        var dx=Math.abs(e.touches[0].clientX-startX);
        var dy=Math.abs(e.touches[0].clientY-startY);
        if(dx>6||dy>6){ decided=true; isScrolling=dy>dx; }
      }
      if(isScrolling && slider.value!==startVal){
        slider.value=startVal;
        slider.dispatchEvent(new Event('input',{bubbles:true}));
      }
    }, {passive:true});
  });
})();

// Global tooltip system — fixed positioning, works inside overflow:auto containers
(function(){
  var gTip = document.getElementById('g-tip');
  var activeIcon = null;

  function showTip(icon, html) {
    gTip.innerHTML = html;
    gTip.style.display = 'block';
    var rect = icon.getBoundingClientRect();
    var tipH = gTip.offsetHeight;
    var tipW = gTip.offsetWidth;
    var vw = window.innerWidth;
    // Center horizontally on icon, clamped to viewport
    var left = rect.left + rect.width / 2 - tipW / 2;
    left = Math.max(10, Math.min(left, vw - tipW - 10));
    // Above the icon by default, below if not enough space
    var top = rect.top - tipH - 8;
    if (top < 10) top = rect.bottom + 8;
    gTip.style.left = left + 'px';
    gTip.style.top = top + 'px';
  }

  function hideTip() {
    gTip.style.display = 'none';
    activeIcon = null;
  }

  // Desktop: hover on .tip-icon and .lot-tip-icon
  document.addEventListener('mouseover', function(e) {
    var icon = e.target.closest('.tip-icon, .lot-tip-icon');
    if (!icon) return;
    var src = icon.closest('.tip-wrap, .lot-tip');
    var box = src && src.querySelector('.tip-box, .lot-tip-text');
    if (!box) return;
    showTip(icon, box.innerHTML);
  });
  document.addEventListener('mouseout', function(e) {
    var icon = e.target.closest('.tip-icon, .lot-tip-icon');
    if (!icon) return;
    if (!e.relatedTarget || !e.relatedTarget.closest('#g-tip')) hideTip();
  });
  gTip.addEventListener('mouseleave', hideTip);

  // Mobile: tap to toggle
  document.addEventListener('click', function(e) {
    var icon = e.target.closest('.tip-icon, .lot-tip-icon');
    if (icon) {
      if (activeIcon === icon) { hideTip(); return; }
      var src = icon.closest('.tip-wrap, .lot-tip');
      var box = src && src.querySelector('.tip-box, .lot-tip-text');
      if (!box) return;
      activeIcon = icon;
      showTip(icon, box.innerHTML);
      e.stopPropagation();
      return;
    }
    hideTip();
  });
})();
