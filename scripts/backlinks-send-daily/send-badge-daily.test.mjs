import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickBadgeProspects } from './send-badge-daily.mjs';
import { buildBadgePitch, qaBadgePitch, buildGreeting, zonePour } from './badge-templates.mjs';
import { fallbackObservation } from './badge-observation.mjs';
import { isSuppressed } from './mailer.mjs';

const NOSUPP = { emails: new Set(), domains: new Set() };
const row = (o = {}) => ({
  segment: 'conciergerie', statut: 'verifie', email: 'a@b.fr', site: 'https://b.fr',
  page_url: 'https://www.enomia.app/x', page_en_ligne: 'oui', ville: 'Paris', reviews: 10, ...o,
});

test('pick: filtre statut / page_en_ligne / email / page_url', () => {
  const rows = [
    row({ site: 'https://ok.fr', email: 'c@ok.fr' }),
    row({ site: 'https://nope1.fr', statut: 'faux_email' }),
    row({ site: 'https://nope2.fr', page_en_ligne: 'non' }),
    row({ site: 'https://nope3.fr', email: '' }),
    row({ site: 'https://nope4.fr', page_url: '' }),
  ];
  const picked = pickBadgeProspects(rows, { max: 10, suppression: NOSUPP, excludeDomains: new Set() });
  assert.equal(picked.length, 1);
  assert.equal(picked[0].site, 'https://ok.fr');
});

test('pick: tri par avis desc + dedup domaine + max', () => {
  const rows = [
    row({ site: 'https://a.fr', email: '1@a.fr', reviews: 5 }),
    row({ site: 'https://b.fr', email: '2@b.fr', reviews: 50 }),
    row({ site: 'https://b.fr', email: '3@b.fr', reviews: 40 }),
    row({ site: 'https://c.fr', email: '4@c.fr', reviews: 20 }),
  ];
  const picked = pickBadgeProspects(rows, { max: 2, suppression: NOSUPP, excludeDomains: new Set() });
  assert.deepEqual(picked.map(p => p.site), ['https://b.fr', 'https://c.fr']);
});

test('pick: verifie avant a_tester', () => {
  const rows = [
    row({ site: 'https://a.fr', email: '1@a.fr', statut: 'a_tester', reviews: 999 }),
    row({ site: 'https://z.fr', email: '2@z.fr', statut: 'verifie', reviews: 1 }),
  ];
  const picked = pickBadgeProspects(rows, { max: 2, suppression: NOSUPP, excludeDomains: new Set() });
  assert.equal(picked[0].statut, 'verifie');
});

test('pick: suppression + excludeDomains', () => {
  const rows = [
    row({ site: 'https://supp.fr', email: 'x@supp.fr' }),
    row({ site: 'https://excl.fr', email: 'y@excl.fr' }),
    row({ site: 'https://ok.fr', email: 'z@ok.fr' }),
  ];
  const picked = pickBadgeProspects(rows, {
    max: 10, suppression: { emails: new Set(['x@supp.fr']), domains: new Set() }, excludeDomains: new Set(['excl.fr']),
  });
  assert.deepEqual(picked.map(p => p.site), ['https://ok.fr']);
});

test('pick: --segment restreint', () => {
  const rows = [
    row({ site: 'https://a.fr', email: '1@a.fr', segment: 'conciergerie' }),
    row({ site: 'https://b.fr', email: '2@b.fr', segment: 'loveroom' }),
  ];
  const picked = pickBadgeProspects(rows, { max: 10, segment: 'loveroom', suppression: NOSUPP, excludeDomains: new Set() });
  assert.deepEqual(picked.map(p => p.segment), ['loveroom']);
});

test('greeting : prénom / M. Nom / fallback', () => {
  assert.equal(buildGreeting({ prenom: 'Julie' }), 'Bonjour Julie,');
  assert.equal(buildGreeting({ nom_gerant: 'Durand' }), 'Bonjour M. Durand,');
  assert.equal(buildGreeting({}), 'Bonjour,');
});

test('zonePour : articles', () => {
  assert.equal(zonePour('bretagne', 'Bretagne'), 'pour la Bretagne');
  assert.equal(zonePour('jura', 'Jura'), 'pour le Jura');
  assert.equal(zonePour('vosges', 'Vosges'), 'pour les Vosges');
  assert.equal(zonePour('auvergne', 'Auvergne'), "pour l'Auvergne");
  assert.equal(zonePour('xxx', 'Truc'), 'pour Truc');
});

test('buildBadgePitch + qa OK', () => {
  const url = 'https://www.enomia.app/conciergerie-airbnb/ile-de-france/paris';
  const p = buildBadgePitch({ segment: 'conciergerie', greeting: 'Bonjour Julie,', observation: 'Vos 140 avis à 4,8/5 vous placent en tête.', ville: 'Paris', page_url: url });
  const qa = qaBadgePitch({ ...p }, { page_url: url });
  assert.ok(qa.ok, 'qa devait passer: ' + qa.reasons.join(', '));
  assert.match(p.text, /Bonjour Julie,/);
  assert.match(p.text, /marc@enomia\.app/);
  assert.ok(p.text.includes(url));
});

test('qa : observation vide détectée', () => {
  const p = buildBadgePitch({ segment: 'conciergerie', greeting: 'Bonjour,', observation: '', ville: 'Paris', page_url: 'https://x.fr/p' });
  const qa = qaBadgePitch({ ...p }, { page_url: 'https://x.fr/p' });
  assert.ok(!qa.ok);
  assert.ok(qa.reasons.some(r => r.includes('observation')), qa.reasons.join(','));
});

test('qa : page_url absente détectée', () => {
  const url = 'https://www.enomia.app/love-room/ara/lyon';
  const p = buildBadgePitch({ segment: 'loveroom', greeting: 'Bonjour,', observation: 'Belle adresse à Lyon.', ville: 'Lyon', page_url: url });
  const qa = qaBadgePitch({ subject: p.subject, text: p.text.replace(url, 'LIEN'), segment: 'loveroom' }, { page_url: url });
  assert.ok(!qa.ok);
});

test('cabane : article de zone dans le corps', () => {
  const p = buildBadgePitch({ segment: 'cabane', listed: true, greeting: 'Bonjour,', observation: 'Cabane perchée remarquable.', ville: 'Bretagne', page_url: 'https://www.enomia.app/cabane/bretagne' });
  assert.match(p.text, /sélection pour la Bretagne/);
});

test('hybride retenu vs offre (loveroom)', () => {
  const args = { segment: 'loveroom', greeting: 'Bonjour Julie,', observation: 'Belle adresse à Lyon.', ville: 'Lyon', page_url: 'https://www.enomia.app/love-room/ara/lyon' };
  const retenu = buildBadgePitch({ ...args, listed: true });
  assert.equal(retenu.variant, 'retenu');
  assert.match(retenu.text, /Nous avons retenu la vôtre/);
  const offre = buildBadgePitch({ ...args, listed: false });
  assert.equal(offre.variant, 'offre');
  assert.match(offre.text, /J'aimerais y ajouter la vôtre/);
});

test('cabane offre : article de zone conservé', () => {
  const p = buildBadgePitch({ segment: 'cabane', listed: false, greeting: 'Bonjour,', observation: 'Cabane remarquable.', ville: 'Bretagne', page_url: 'https://www.enomia.app/cabane/bretagne' });
  assert.equal(p.variant, 'offre');
  assert.match(p.text, /la sélection pour la Bretagne/);
});

test('fallbackObservation', () => {
  assert.match(fallbackObservation({ rating: 4.8, reviews: 127, ville: 'Paris' }), /127 avis à 4,8\/5/);
  assert.match(fallbackObservation({ reviews: 40, ville: 'Lyon' }), /40 avis/);
  assert.match(fallbackObservation({ ville: 'Nice' }), /Nice/);
});

test('isSuppressed : email + domaine', () => {
  const s = { emails: new Set(['a@b.fr']), domains: new Set(['x.com']) };
  assert.ok(isSuppressed('a@b.fr', s));
  assert.ok(isSuppressed('any@x.com', s));
  assert.ok(!isSuppressed('ok@ok.fr', s));
});
