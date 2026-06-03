import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickLatestInbound, getHeader, pickBestDomainReply } from './track-replies.mjs';

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
