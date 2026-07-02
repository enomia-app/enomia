import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pendingConversations, reactivationDue, buildBody } from './reports.mjs';

const TODAY = '2026-06-29';

// stats minimal mais complet pour buildBody
const baseStats = () => ({
  period_label: 'semaine test', envois: { total: 5, simulateur: 2, contrat: 2, facture: 1 },
  relances: { total: 3, r1: 2, r2: 1 }, reponses: { positive: 1, negative: 0, neutre: 0, spam: 0 },
  taux_reponse_positive: '20%', taux_reponse_total: '20%', backlinks_obtenus: 1,
  par_outil_positive: { simulateur: 1, contrat: 0, facture: 0 },
  pipeline: { total_candidates: 50, pending: 10, sent: 5, en_relance: 3, repondu: 1, no_reply: 2, no_contact: 0, manual_form: 0 },
  formulaires_a_traiter: [],
});

test('buildBody : section "À RELANCER" présente quand pending, absente sinon', () => {
  const withPending = { ...baseStats(), pending_conversations: [{ site: 'popacademy.fr', backlink: 'en_attente', jours: 11 }] };
  const body1 = buildBody(withPending);
  assert.match(body1, /À RELANCER — sans réponse \/ en attente \(>7j\) \(1\)/);
  assert.match(body1, /popacademy\.fr \[en conversation\] — 11j/);

  const withoutPending = { ...baseStats(), pending_conversations: [] };
  assert.doesNotMatch(buildBody(withoutPending), /À RELANCER/);
});

test('buildBody : noanswer affiché "jamais répondu" + section réactivation', () => {
  const stats = {
    ...baseStats(),
    pending_conversations: [{ site: 'x.fr', backlink: 'noanswer', jours: 20 }],
    reactivation_due: [{ site: 'mes-allocs.fr', recontact_apres: '2027-06', dernier_statut: 'refus soft' }],
  };
  const body = buildBody(stats);
  assert.match(body, /x\.fr \[jamais répondu\] — 20j/);
  assert.match(body, /À RECONTACTER/);
  assert.match(body, /mes-allocs\.fr \(prévu 2027-06\)/);
});

test('pendingConversations : garde en_attente + noanswer >= 7j, exclut obtenu/refuse, <7j et parqués', () => {
  const list = [
    { site: 'a.fr', date_dernier_echange: '2026-06-22', backlink: 'en_attente' },  // 7j → garde
    { site: 'b.fr', date_dernier_echange: '2026-06-18', backlink: 'noanswer' },    // 11j → garde (noanswer)
    { site: 'c.fr', date_dernier_echange: '2026-06-25', backlink: 'en_attente' },  // 4j → exclu
    { site: 'd.fr', date_dernier_echange: '2026-06-01', backlink: 'obtenu' },      // statut final → exclu
    { site: 'e.fr', date_dernier_echange: '2026-06-01', backlink: 'refuse' },      // statut final → exclu
    { site: 'f.fr', date_dernier_echange: '2026-06-01', backlink: 'noanswer', recontact_apres: '2027-06' }, // parqué futur → exclu
  ];
  const out = pendingConversations(list, TODAY);
  assert.deepEqual(out.map(c => c.site), ['b.fr', 'a.fr']); // plus anciennes d'abord
  assert.equal(out[0].jours, 11);
  assert.equal(out[1].jours, 7);
});

test('reactivationDue : ressort les leads dont recontact_apres <= mois courant, hors obtenu', () => {
  const list = [
    { site: 'due.fr', recontact_apres: '2026-06', backlink: 'refuse' },    // <= 2026-06 → ressort
    { site: 'future.fr', recontact_apres: '2027-01', backlink: 'refuse' }, // futur → non
    { site: 'got.fr', recontact_apres: '2026-01', backlink: 'obtenu' },    // obtenu → non
    { site: 'none.fr', backlink: 'en_attente' },                           // pas de date → non
  ];
  assert.deepEqual(reactivationDue(list, TODAY).map(c => c.site), ['due.fr']);
});

test('pendingConversations : fallback sur date_premier_echange si pas de dernier', () => {
  const list = [{ site: 'x.fr', date_premier_echange: '2026-06-10', backlink: 'en_attente' }];
  assert.equal(pendingConversations(list, TODAY)[0].jours, 19);
});

test('pendingConversations : liste vide / absente → []', () => {
  assert.deepEqual(pendingConversations([], TODAY), []);
  assert.deepEqual(pendingConversations(undefined, TODAY), []);
});

test('pendingConversations : seuil minDays réglable', () => {
  const list = [{ site: 'a.fr', date_dernier_echange: '2026-06-25', backlink: 'en_attente' }]; // 4j
  assert.equal(pendingConversations(list, TODAY, 3).length, 1);
  assert.equal(pendingConversations(list, TODAY, 7).length, 0);
});
