import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickProspects } from './send-daily.mjs';

const cand = (site, status, extra = {}) => ({ site, status, is_blog: true, ...extra });

test('dédoublonne par domaine sur le pool fusionné (même site dans 2 mois)', () => {
  const cands = [
    cand('bevouac.com', 'pending', { email: 'a@bevouac.com', serp_traffic: 10 }),
    cand('bevouac.com', 'pending', { email: 'a@bevouac.com', serp_traffic: 5 }), // 2e ligne (autre mois)
    cand('autre.fr', 'pending', { email: 'x@autre.fr' }),
  ];
  const picked = pickProspects(cands, 10);
  assert.equal(picked.filter(c => c.site === 'bevouac.com').length, 1);
  assert.equal(picked.length, 2);
});

test('skip un domaine déjà contacté (sent / manual_sent / manual_form_batched...)', () => {
  const cands = [
    cand('toploc.com', 'manual_sent', {}),                  // déjà pris en charge
    cand('toploc.com', 'pending', { email: 'c@toploc.com' }), // ligne pending du même domaine
    cand('neuf.fr', 'pending', { email: 'y@neuf.fr' }),
  ];
  const picked = pickProspects(cands, 10);
  assert.equal(picked.some(c => c.site === 'toploc.com'), false); // pas re-pitché
  assert.deepEqual(picked.map(c => c.site), ['neuf.fr']);
});

test('normalise le domaine (www / casse) pour le dédoublonnage', () => {
  const cands = [
    cand('Bevouac.com', 'sent', {}),                 // contacté
    cand('www.bevouac.com', 'pending', { email: 'a@bevouac.com' }), // même domaine, autre forme
  ];
  assert.equal(pickProspects(cands, 10).length, 0); // exclu car déjà contacté
});

test('exclut is_blog === false', () => {
  const cands = [
    cand('service.com', 'pending', { is_blog: false, email: 'z@service.com' }),
    cand('blog.fr', 'pending', { email: 'b@blog.fr' }),
  ];
  assert.deepEqual(pickProspects(cands, 10).map(c => c.site), ['blog.fr']);
});

test('ne pitche que les pending', () => {
  const cands = [
    cand('a.fr', 'sent', { email: '1@a.fr' }),
    cand('b.fr', 'pending', { email: '2@b.fr' }),
  ];
  assert.deepEqual(pickProspects(cands, 10).map(c => c.site), ['b.fr']);
});

test('priorité email > form > sans-contact', () => {
  const cands = [
    cand('low.fr', 'pending', {}),                     // bucket 2 (no contact)
    cand('mid.fr', 'pending', { url_formulaire: 'u' }), // bucket 1
    cand('hi.fr', 'pending', { email: 'e@hi.fr' }),     // bucket 0
  ];
  assert.deepEqual(pickProspects(cands, 10).map(c => c.site), ['hi.fr', 'mid.fr', 'low.fr']);
});

test('respecte max APRÈS dédoublonnage', () => {
  const cands = [
    cand('a.fr', 'pending', { email: '1@a.fr', serp_traffic: 100 }),
    cand('a.fr', 'pending', { email: '1@a.fr', serp_traffic: 90 }), // dup
    cand('b.fr', 'pending', { email: '2@b.fr', serp_traffic: 80 }),
    cand('c.fr', 'pending', { email: '3@c.fr', serp_traffic: 70 }),
  ];
  const picked = pickProspects(cands, 2);
  assert.equal(picked.length, 2);
  assert.deepEqual(picked.map(c => c.site), ['a.fr', 'b.fr']);
});
