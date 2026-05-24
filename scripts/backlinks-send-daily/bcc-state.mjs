// scripts/backlinks-send-daily/bcc-state.mjs
// Gère l'état du BCC (5 premiers jours d'envoi + 1 jour aléatoire tous les 5 jours).

import fs from 'node:fs';
import path from 'node:path';

/**
 * Détermine si aujourd'hui on doit faire du BCC à Marc sur les envois auto.
 * Maintient l'état dans data/backlinks-send-state.json.
 *
 * Logique :
 *   - 5 premiers jours après le 1er envoi : BCC quotidien
 *   - Après J+5 : BCC sur un jour aléatoire dans la fenêtre des 5 jours suivants
 */
export function shouldBccToday(statePath) {
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  let state = {};
  if (fs.existsSync(statePath)) {
    state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
  }

  // Initialisation au tout premier run
  if (!state.first_send_date) {
    state.first_send_date = todayIso;
    state.bcc_dates = [todayIso];
    saveState(statePath, state);
    return { bcc: true, reason: 'first_5_days', state };
  }

  // Phase 1 : 5 premiers jours
  const firstDate = new Date(state.first_send_date);
  const daysSince = Math.floor((today - firstDate) / (24 * 60 * 60 * 1000));
  if (daysSince <= 5) {
    if (!state.bcc_dates.includes(todayIso)) {
      state.bcc_dates.push(todayIso);
      saveState(statePath, state);
    }
    return { bcc: true, reason: `first_5_days (day ${daysSince + 1}/5)`, state };
  }

  // Phase 2 : audit aléatoire
  // Si pas de next_audit ou si on est passé après → tire un nouveau
  if (!state.next_audit_date || todayIso > state.next_audit_date) {
    state.next_audit_date = pickRandomDayInNext5();
    saveState(statePath, state);
  }

  if (todayIso === state.next_audit_date) {
    if (!state.bcc_dates.includes(todayIso)) {
      state.bcc_dates.push(todayIso);
      saveState(statePath, state);
    }
    // Re-tire pour la prochaine fenêtre
    state.next_audit_date = pickRandomDayInNext5();
    saveState(statePath, state);
    return { bcc: true, reason: 'random_audit_day', state };
  }

  return { bcc: false, reason: `next_audit=${state.next_audit_date}`, state };
}

function pickRandomDayInNext5() {
  // Tire un jour entre J+1 et J+5
  const offset = 1 + Math.floor(Math.random() * 5);
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function saveState(statePath, state) {
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
}
