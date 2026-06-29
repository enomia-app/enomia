#!/usr/bin/env node
/**
 * Calcule le budget d'envois NEUFS du jour, en réservant la place des relances.
 *
 *   budget_neufs = max(0, DAILY_TOTAL − relances_dues_aujourd'hui)
 *
 * Imprime UN SEUL entier sur stdout (0..DAILY_TOTAL) — consommé par run.sh pour
 * fixer les --max de send-daily (blog) + send-badge-daily (badge).
 *
 * Pourquoi ici : send-daily tourne AVANT track-replies (10h17 vs 10h31). En
 * réservant `relances_dues` (un majorant déterministe basé sur les dates), on
 * garantit neufs + relances ≤ DAILY_TOTAL sans compteur partagé entre les deux
 * crons. Cf. l'en-tête de track-replies.mjs.
 *
 * Stdout = l'entier SEULEMENT (les diagnostics partent sur stderr).
 */

import { loadBacklog, countDueRelances, DAILY_TOTAL } from '../backlinks-track-replies-v2/track-replies.mjs';

const TODAY = new Date().toISOString().slice(0, 10);

try {
  const backlog = loadBacklog();
  const due = countDueRelances(backlog.candidates, TODAY);
  const budget = Math.max(0, DAILY_TOTAL - due);
  console.error(`[compute-new-budget] ${TODAY} : ${due} relances dues, budget total ${DAILY_TOTAL} → ${budget} neufs`);
  process.stdout.write(String(budget));
} catch (e) {
  // En cas d'erreur, on retombe sur un budget prudent (la moitié du total) plutôt
  // que de bloquer l'envoi ou de tout dépenser. stderr pour le log.
  const fallback = Math.floor(DAILY_TOTAL / 2);
  console.error(`[compute-new-budget] ⚠️ erreur (${e.message}) → fallback ${fallback} neufs`);
  process.stdout.write(String(fallback));
}
