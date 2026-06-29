import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickLatestInbound, getHeader, pickBestDomainReply, rootDomain, outilLabel, relanceDecision, countDueRelances } from './track-replies.mjs';

test('outilLabel : libellé par outil, JAMAIS "undefined" (bug relance)', () => {
  assert.equal(outilLabel('simulateur'), 'notre simulateur de rentabilité gratuit');
  assert.equal(outilLabel('taxe_sejour'), 'notre calculateur de taxe de séjour gratuit');
  assert.equal(outilLabel(undefined), 'notre outil gratuit'); // le bug d'origine (c.outil_cible inexistant)
  assert.ok(!outilLabel('cle_inconnue').includes('undefined'));
});

// ─── Cap quotidien des relances (5/j) ─────────────────────────────────────
const TODAY = '2026-06-29';
test('relanceDecision : sent J+5 sous le cap → relance_1', () => {
  const c = { status: 'sent', date_envoi: '2026-06-24' }; // J+5
  assert.equal(relanceDecision(c, { today: TODAY, sentCount: 0, max: 5 }), 'relance_1');
});

test('relanceDecision : relance_1 J+5 sous le cap → relance_2', () => {
  const c = { status: 'relance_1', date_envoi: '2026-06-19', date_relance_1: '2026-06-24' };
  assert.equal(relanceDecision(c, { today: TODAY, sentCount: 4, max: 5 }), 'relance_2');
});

test('relanceDecision : cap atteint → defer (reporté, pas envoyé)', () => {
  const sent = { status: 'sent', date_envoi: '2026-06-24' };
  const r1 = { status: 'relance_1', date_relance_1: '2026-06-24' };
  assert.equal(relanceDecision(sent, { today: TODAY, sentCount: 5, max: 5 }), 'defer');
  assert.equal(relanceDecision(r1, { today: TODAY, sentCount: 5, max: 5 }), 'defer');
});

test('relanceDecision : J+15 → close même quand le cap est atteint (clôture ≠ email)', () => {
  const c = { status: 'relance_2', date_relance_2: '2026-06-14' }; // J+15
  assert.equal(relanceDecision(c, { today: TODAY, sentCount: 99, max: 5 }), 'close');
});

test('relanceDecision : pas encore dû (J+4) → none', () => {
  const c = { status: 'sent', date_envoi: '2026-06-25' }; // J+4
  assert.equal(relanceDecision(c, { today: TODAY, sentCount: 0, max: 5 }), 'none');
});

test('countDueRelances : compte les dues (J+5/J+10), ignore non-dues / sans email / J+15', () => {
  const cands = [
    { status: 'sent', date_envoi: '2026-06-24', email: 'a@x.fr' },                              // due relance_1
    { status: 'relance_1', date_relance_1: '2026-06-24', email: 'b@x.fr' },                     // due relance_2
    { status: 'sent', date_envoi: '2026-06-27', email: 'c@x.fr' },                              // J+2, pas due
    { status: 'sent', date_envoi: '2026-06-24' },                                               // due mais SANS email → ignoré
    { status: 'relance_2', date_relance_2: '2026-06-14', email: 'd@x.fr' },                     // J+15 → close, pas un email
    { status: 'repondu_positif', date_envoi: '2026-06-01', email: 'e@x.fr' },                   // déjà répondu
  ];
  assert.equal(countDueRelances(cands, TODAY), 2);
});

test('rootDomain : sous-domaine → domaine racine (cas zently)', () => {
  assert.equal(rootDomain('blog.zently.fr'), 'zently.fr');
  assert.equal(rootDomain('zently.fr'), 'zently.fr');
  assert.equal(rootDomain('a.b.example.com'), 'example.com');
});

test('rootDomain : gère les suffixes publics à 2 niveaux (.co.uk)', () => {
  assert.equal(rootDomain('blog.example.co.uk'), 'example.co.uk');
  assert.equal(rootDomain('example.co.uk'), 'example.co.uk');
});

const OURS = 'marc@enomia.app';
const msg = (from, dateIso, id) => ({
  id,
  internalDate: String(Date.parse(dateIso)),
  payload: { headers: [{ name: 'From', value: from }] },
});

test('getHeader est insensible à la casse', () => {
  const m = { payload: { headers: [{ name: 'from', value: 'X <x@y.fr>' }] } };
  assert.equal(getHeader(m, 'From'), 'X <x@y.fr>');
});

test('réponse depuis l\'adresse pitchée → détectée', () => {
  const msgs = [
    msg('Marc Chenut <marc@enomia.app>', '2026-06-01T08:00:00Z', 'a'),
    msg('contact@hosting-academy.fr', '2026-06-01T10:00:00Z', 'b'),
  ];
  assert.equal(pickLatestInbound(msgs, OURS).id, 'b');
});

test('réponse depuis une AUTRE adresse (cas Pauline) → détectée', () => {
  const msgs = [
    msg('Marc Chenut <marc@enomia.app>', '2026-06-01T08:00:00Z', 'a'),
    msg('Pauline Wasselin <pauline@hosting-academy.com>', '2026-06-01T14:36:00Z', 'b'),
  ];
  const r = pickLatestInbound(msgs, OURS);
  assert.equal(r.id, 'b');
  assert.match(getHeader(r, 'From'), /pauline@hosting-academy\.com/);
});

test('aucune réponse (que nos messages, pitch + relance) → null', () => {
  const msgs = [
    msg('Marc Chenut <marc@enomia.app>', '2026-06-01T08:00:00Z', 'a'),
    msg('marc@enomia.app', '2026-06-06T08:00:00Z', 'relance'),
  ];
  assert.equal(pickLatestInbound(msgs, OURS), null);
});

test('plusieurs réponses entrantes → renvoie la plus récente', () => {
  const msgs = [
    msg('p@x.fr', '2026-06-02T09:00:00Z', 'first'),
    msg('Marc Chenut <marc@enomia.app>', '2026-06-03T09:00:00Z', 'us'),
    msg('p@x.fr', '2026-06-04T09:00:00Z', 'last'),
  ];
  assert.equal(pickLatestInbound(msgs, OURS).id, 'last');
});

test('réponse antérieure à afterMs (vieux thread) → exclue', () => {
  const afterMs = Date.parse('2026-06-01');
  const msgs = [msg('p@x.fr', '2026-05-20T09:00:00Z', 'old')];
  assert.equal(pickLatestInbound(msgs, OURS, afterMs), null);
});

test('bounce / NDR dans le thread (MAILER-DAEMON) → ignoré, pas une réponse', () => {
  const msgs = [
    msg('Marc Chenut <marc@enomia.app>', '2026-06-01T08:18:28Z', 'us'),
    msg('Mail Delivery System <MAILER-DAEMON@mo551.mail-out.ovh.net>', '2026-06-01T08:18:33Z', 'ndr'),
  ];
  assert.equal(pickLatestInbound(msgs, OURS), null);
});

test('NDR postmaster → ignoré aussi', () => {
  const msgs = [msg('postmaster@outlook.com', '2026-06-02T09:00:00Z', 'pm')];
  assert.equal(pickLatestInbound(msgs, OURS), null);
});

test('vraie réponse + NDR dans le même thread → garde la vraie réponse', () => {
  const msgs = [
    msg('Marc Chenut <marc@enomia.app>', '2026-06-01T08:00:00Z', 'us'),
    msg('MAILER-DAEMON@ovh.net', '2026-06-01T08:01:00Z', 'ndr'),
    msg('Pauline <pauline@hosting-academy.com>', '2026-06-01T14:36:00Z', 'real'),
  ];
  assert.equal(pickLatestInbound(msgs, OURS).id, 'real');
});

// ── Recherche par domaine (helpdesk, thread séparé) ──────────────────────
const PITCH = 'Un simulateur pour les lecteurs de votre article';
const msgS = (from, dateIso, id, subject) => ({
  id,
  internalDate: String(Date.parse(dateIso)),
  payload: { headers: [{ name: 'From', value: from }, { name: 'Subject', value: subject }] },
});

test('domaine : choisit la vraie réponse (sujet = pitch) parmi les auto-acks (cas nopillo)', () => {
  const msgs = [
    msgS('Nopillo <conseil.client@nopillo.com>', '2026-06-02T08:17:56Z', 'ack', 'Votre demande est bien prise en compte!'),
    msgS('Athalia <conseil.client@nopillo.com>', '2026-06-02T12:29:13Z', 'real', 'Re :Un simulateur pour les lecteurs de votre article'),
    msgS('Nopillo <conseil.client@nopillo.com>', '2026-06-02T13:34:21Z', 'survey', "comment s'est déroulée votre expérience avec le support ?"),
  ];
  assert.equal(pickBestDomainReply(msgs, OURS, Date.parse('2026-06-02'), PITCH).id, 'real');
});

test('domaine : sans match de sujet → 1ère réponse (plus ancienne)', () => {
  const msgs = [
    msgS('x@nopillo.com', '2026-06-03T10:00:00Z', 'b', 'autre sujet'),
    msgS('y@nopillo.com', '2026-06-02T10:00:00Z', 'a', 'encore autre'),
  ];
  assert.equal(pickBestDomainReply(msgs, OURS, Date.parse('2026-06-02'), PITCH).id, 'a');
});

test('domaine : exclut NDR et nos propres messages', () => {
  const msgs = [
    msgS('marc@enomia.app', '2026-06-02T09:00:00Z', 'us', 'Re: pitch'),
    msgS('MAILER-DAEMON@x', '2026-06-02T09:01:00Z', 'ndr', 'Undeliverable'),
  ];
  assert.equal(pickBestDomainReply(msgs, OURS, Date.parse('2026-06-02'), PITCH), null);
});
