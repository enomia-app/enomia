import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickLatestInbound, getHeader } from './track-replies.mjs';

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
