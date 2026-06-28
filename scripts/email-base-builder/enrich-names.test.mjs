import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateName, resolveName } from './enrich-names.mjs';

test('validateName : prénoms valides', () => {
  assert.equal(validateName('Jean'), 'Jean');
  assert.equal(validateName('Jean-Pierre'), 'Jean-Pierre');
  assert.equal(validateName("O'Brien"), "O'Brien");
  assert.equal(validateName('Léa'), 'Léa');
  assert.equal(validateName('Durand', { siteDomain: 'mareso.fr' }), 'Durand');
});

test('validateName : rejets', () => {
  assert.equal(validateName('contact'), null);         // mot fonction
  assert.equal(validateName('Conciergerie'), null);    // mot marque générique
  assert.equal(validateName('BONJOUR'), null);         // tout majuscule + bad word
  assert.equal(validateName('Dupont3'), null);         // chiffre
  assert.equal(validateName('M'), null);               // trop court
  assert.equal(validateName(''), null);
  assert.equal(validateName('Jean Conciergerie'), null); // composé avec mot interdit
});

test('validateName : cross-check handle de domaine', () => {
  assert.equal(validateName('Loca', { siteDomain: 'locarent.fr' }), null); // = segment du domaine
  assert.equal(validateName('Reso', { siteDomain: 'reso.com' }), null);
  assert.equal(validateName('Marie', { siteDomain: 'conciergerie-lyon.fr' }), 'Marie'); // pas un segment
});

test('resolveName : prénom prioritaire (haute confiance)', () => {
  assert.deepEqual(resolveName({ confiance: 'haute', prenom: 'Jean', nom: 'Dupont' }), { prenom: 'Jean', nom_gerant: '' });
});

test('resolveName : nom seul → M. Nom', () => {
  assert.deepEqual(resolveName({ confiance: 'haute', prenom: '', nom: 'Dupont' }), { prenom: '', nom_gerant: 'Dupont' });
});

test('resolveName : confiance non haute → rien', () => {
  assert.deepEqual(resolveName({ confiance: 'moyenne', prenom: 'Jean', nom: 'Dupont' }), { prenom: '', nom_gerant: '' });
});

test('resolveName : prénom invalide rejeté', () => {
  assert.deepEqual(resolveName({ confiance: 'haute', prenom: 'contact', nom: '' }), { prenom: '', nom_gerant: '' });
});

test('resolveName : null safe', () => {
  assert.deepEqual(resolveName(null), { prenom: '', nom_gerant: '' });
  assert.deepEqual(resolveName(undefined), { prenom: '', nom_gerant: '' });
});

test('resolveName : nom = marque (domaine) rejeté', () => {
  assert.deepEqual(resolveName({ confiance: 'haute', prenom: 'Loca', nom: 'Rent' }, { siteDomain: 'locarent.fr' }), { prenom: '', nom_gerant: '' });
});
