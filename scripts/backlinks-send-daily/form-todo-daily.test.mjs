import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickFormProspects, buildFormPitch } from './form-todo-daily.mjs';

const fr = (o = {}) => ({
  segment: 'loveroom', statut: 'formulaire', url_formulaire: 'https://b.fr/contact', site: 'https://b.fr',
  page_url: 'https://www.enomia.app/love-room/ara/lyon', page_en_ligne: 'oui', ville: 'Lyon', reviews: 10, ...o,
});

test('pick: garde formulaire+url+page_en_ligne+segment actif', () => {
  const rows = [
    fr({ site: 'https://ok.fr' }),
    fr({ site: 'https://e1.fr', statut: 'verifie' }),          // a un email → pas formulaire
    fr({ site: 'https://e2.fr', url_formulaire: '' }),         // pas de form
    fr({ site: 'https://e3.fr', page_en_ligne: 'non' }),       // page pas live
    fr({ site: 'https://e4.fr', segment: 'conciergerie' }),    // segment en pause
    fr({ site: 'https://e5.fr', segment: 'blog_lcd' }),        // blog → géré par send-daily
  ];
  const picked = pickFormProspects(rows, { max: 10 });
  assert.deepEqual(picked.map(p => p.site), ['https://ok.fr']);
});

test('pick: tri par avis desc + dedup domaine + max', () => {
  const rows = [
    fr({ site: 'https://a.fr', reviews: 5 }),
    fr({ site: 'https://b.fr', reviews: 90 }),
    fr({ site: 'https://b.fr', reviews: 80 }),
    fr({ site: 'https://c.fr', reviews: 50 }),
  ];
  const picked = pickFormProspects(rows, { max: 2 });
  assert.deepEqual(picked.map(p => p.site), ['https://b.fr', 'https://c.fr']);
});

test('pick: domaines déjà faits exclus', () => {
  const rows = [fr({ site: 'https://done.fr' }), fr({ site: 'https://new.fr' })];
  const picked = pickFormProspects(rows, { max: 10, doneDomains: new Set(['done.fr']) });
  assert.deepEqual(picked.map(p => p.site), ['https://new.fr']);
});

test('buildFormPitch : objet + message offre + lien', () => {
  const p = buildFormPitch(fr({ nom_boite: 'Test', rating: 4.8, reviews: 120 }));
  assert.ok(p.subject.length > 5);
  assert.match(p.text, /J'aimerais y ajouter la vôtre/);
  assert.match(p.text, /120 avis à 4,8\/5/);
  assert.ok(p.text.includes('https://www.enomia.app/love-room/ara/lyon'));
});
