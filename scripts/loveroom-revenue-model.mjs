#!/usr/bin/env node
/**
 * Modèle de revenu "hub love room" — slots payants par ville, pricing dégressif par position.
 * Hypothèses explicites et ajustables. Lit /tmp/loveroom-villes-final.json pour le nb réel de villes par tier.
 *
 * Tiers de villes (par volume "love room pur" SEMrush) :
 *   A (mega)   : vol >= 1000/mois  -> 36 villes  (Paris, Lyon, Toulouse, Marseille, Bordeaux, ...)
 *   B (moyen)  : 300-999/mois      -> 63 villes
 *   C (longue) : 100-299/mois      -> 142 villes
 */

import { readFileSync } from 'fs';

const cities = JSON.parse(readFileSync('/tmp/loveroom-villes-final.json', 'utf-8'));
const A = cities.filter((c) => c.loveVol >= 1000).length;          // mega
const B = cities.filter((c) => c.loveVol >= 300 && c.loveVol < 1000).length;
const C = cities.filter((c) => c.loveVol >= 100 && c.loveVol < 300).length;

// ─── Grilles de prix par position (€/mois) ─────────────────────────
// Tier A : ton idée — dégressif 100 -> 20 sur 8 slots
const PRICE_A = [100, 70, 55, 45, 38, 30, 25, 20];      // somme = 383 €/mo/ville (8 slots pleins)
// Tier B : 6 slots, dégressif plus doux
const PRICE_B = [45, 38, 32, 28, 24, 20];               // somme = 187 €/mo/ville
// Tier C : 3 slots, prix plancher
const PRICE_C = [25, 20, 18];                            // somme = 63 €/mo/ville

const sum = (a) => a.reduce((s, x) => s + x, 0);
// Revenu d'une ville en fonction du taux de remplissage (on remplit les slots du + cher au - cher)
function cityRev(prices, fillRate) {
  const slotsFilled = Math.round(prices.length * fillRate);
  return sum(prices.slice(0, slotsFilled));
}

// ─── Scénarios ──────────────────────────────────────────────────────
// couverture = % de villes du tier réellement rankées + travaillées
// fill        = % de slots vendus dans les villes travaillées
const SCEN = {
  Pessimiste: { A: { cov: 0.4, fill: 0.5 }, B: { cov: 0, fill: 0 }, C: { cov: 0, fill: 0 } },
  Realiste:   { A: { cov: 0.8, fill: 0.6 }, B: { cov: 0.5, fill: 0.4 }, C: { cov: 0, fill: 0 } },
  Optimiste:  { A: { cov: 1.0, fill: 0.8 }, B: { cov: 0.8, fill: 0.6 }, C: { cov: 0.5, fill: 0.35 } },
};

function scenarioMRR(s) {
  const a = A * s.A.cov * cityRev(PRICE_A, s.A.fill);
  const b = B * s.B.cov * cityRev(PRICE_B, s.B.fill);
  const c = C * s.C.cov * cityRev(PRICE_C, s.C.fill);
  return { a, b, c, total: a + b + c };
}

console.log('═══════════════════════════════════════════════════════════════');
console.log(' MODÈLE REVENU — HUB LOVE ROOM (slots payants, pricing dégressif)');
console.log('═══════════════════════════════════════════════════════════════');
console.log(`\nVilles par tier (volume love room pur) :`);
console.log(`  A (≥1000/mo) : ${A} villes — grille ${PRICE_A.join('/')}  = ${sum(PRICE_A)}€/mo plein (8 slots)`);
console.log(`  B (300-999)  : ${B} villes — grille ${PRICE_B.join('/')}        = ${sum(PRICE_B)}€/mo plein (6 slots)`);
console.log(`  C (100-299)  : ${C} villes — grille ${PRICE_C.join('/')}              = ${sum(PRICE_C)}€/mo plein (3 slots)`);

const ceiling = A * sum(PRICE_A) + B * sum(PRICE_B) + C * sum(PRICE_C);
console.log(`\n🏁 Plafond théorique (100% villes, 100% slots) : ${ceiling.toLocaleString('fr')} €/mois = ${(ceiling * 12).toLocaleString('fr')} €/an`);
console.log(`   (irréaliste — sert juste de borne haute)`);

console.log(`\n┌─ Scénarios (MRR = revenu mensuel récurrent à régime établi) ─`);
console.log('Scénario     | Tier A | Tier B | Tier C |   MRR  |   ARR');
console.log('-------------|--------|--------|--------|--------|--------');
for (const [name, s] of Object.entries(SCEN)) {
  const r = scenarioMRR(s);
  console.log(
    `${name.padEnd(12)} | ${String(Math.round(r.a)).padStart(6)} | ${String(Math.round(r.b)).padStart(6)} | ` +
    `${String(Math.round(r.c)).padStart(6)} | ${String(Math.round(r.total)).padStart(6)} | ${Math.round(r.total * 12).toLocaleString('fr').padStart(7)}`
  );
}

// ─── Clients & effort commercial ────────────────────────────────────
console.log(`\n┌─ Clients payants & effort (scénario Réaliste) ─`);
const s = SCEN.Realiste;
const clientsA = Math.round(A * s.A.cov * Math.round(PRICE_A.length * s.A.fill));
const clientsB = Math.round(B * s.B.cov * Math.round(PRICE_B.length * s.B.fill));
const clients = clientsA + clientsB;
const mrr = scenarioMRR(s).total;
console.log(`  Slots vendus (clients-slots) : ${clients}  (${clientsA} en A, ${clientsB} en B)`);
console.log(`  ARPU moyen / slot            : ${Math.round(mrr / clients)} €/mo`);
console.log(`  Avec "pack rayon" (1 proprio = ~3 pages) → proprios uniques ≈ ${Math.round(clients / 3)}`);
console.log(`  CAC commission (30€ chargé/deal) one-shot : ${(clients * 30).toLocaleString('fr')} € pour tout signer`);
console.log(`  Payback : 1 mois (le 1er mois du client couvre la com)`);

// ─── Valeur livrée au proprio (justifie le prix) ───────────────────
console.log(`\n┌─ Valeur livrée au proprio (pourquoi il paie) — exemples top villes ─`);
console.log(`  Hypothèse : page rankée #1, CTR ~30%, 60% des clics vont aux 8 slots.`);
for (const c of cities.filter((c) => c.loveVol >= 2000).slice(0, 5)) {
  const clicksPage = Math.round(c.loveVol * 0.3);
  const clicksPerSlot = Math.round((clicksPage * 0.6) / 8);
  console.log(`  ${c.loc.padEnd(12)} vol ${String(c.loveVol).padStart(5)} → ~${clicksPage} clics/mo sur la page, ~${clicksPerSlot} clics/mo/slot (≈ ${(30 / clicksPerSlot).toFixed(2)}€/clic à 30€)`);
}

console.log(`\n⚠️  Tout dépend de 3 leviers : (1) couverture rank, (2) fill rate, (3) rétention.`);
console.log(`   La rétention dépend des clics livrés → donc du ranking. Ranker d'abord, vendre ensuite.`);
