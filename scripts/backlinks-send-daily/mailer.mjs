// scripts/backlinks-send-daily/mailer.mjs
// Envoi d'emails HTML (multipart text+html) via Gmail API, avec opt-out conforme :
//   - ligne de désinscription discrète sous la signature (texte ET html)
//   - header List-Unsubscribe (bouton natif Gmail, mailto)
//   - liste de suppression honorée (data/email-base/suppression.json)
//
// Mutualisé : à terme send-daily.mjs (camp 1/2) doit aussi passer par ici pour
// bénéficier de l'opt-out. Décision conformité du 27/06 (plainte Isabelle 19/06).

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
export const SUPPRESSION_PATH = path.join(ROOT, 'data', 'email-base', 'suppression.json');

const OPTOUT_TEXT = 'Si cela ne vous semble pas pertinent, dites-le moi et je ne vous recontacterai pas.';
const LIST_UNSUBSCRIBE = '<mailto:marc@enomia.app?subject=unsubscribe>';

/**
 * Charge la liste de suppression : { emails:Set, domains:Set } (minuscules).
 * Format fichier : { "emails": ["x@y.fr"], "domains": ["z.com"] }.
 */
export function loadSuppression(p = SUPPRESSION_PATH) {
  try {
    const d = JSON.parse(fs.readFileSync(p, 'utf-8'));
    return {
      emails: new Set((d.emails || []).map(e => String(e).toLowerCase().trim())),
      domains: new Set((d.domains || []).map(e => String(e).toLowerCase().trim())),
    };
  } catch {
    return { emails: new Set(), domains: new Set() };
  }
}

export function isSuppressed(email, suppression) {
  if (!email) return false;
  const e = String(email).toLowerCase().trim();
  if (suppression.emails.has(e)) return true;
  const dom = e.split('@')[1] || '';
  return dom ? suppression.domains.has(dom) : false;
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * HTML depuis le texte brut : un <p> par bloc (séparé par ligne vide), URLs
 * cliquables, sauts de ligne simples en <br>, puis la ligne opt-out en petit gris.
 */
export function textToHtml(text) {
  const urlRe = /(https?:\/\/[^\s<]+)/g;
  const blocks = text.trim().split(/\n\s*\n/);
  const htmlBlocks = blocks.map(b => {
    const safe = escapeHtml(b)
      .replace(urlRe, u => `<a href="${u}" style="color:#1a73e8">${u}</a>`)
      .replace(/\n/g, '<br>');
    return `<p style="margin:0 0 14px">${safe}</p>`;
  }).join('\n');
  const optout = `<p style="margin:18px 0 0;font-size:11px;color:#9aa0a6">${escapeHtml(OPTOUT_TEXT)}</p>`;
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:14px;line-height:1.5;color:#202124">\n${htmlBlocks}\n${optout}\n</div>`;
}

/** Ajoute la ligne opt-out à la version texte. */
export function appendOptoutText(text) {
  return text.replace(/\s+$/, '') + `\n\n${OPTOUT_TEXT}\n`;
}

/** MIME multipart/alternative (texte + html) + Subject UTF-8 + List-Unsubscribe. */
export function buildRawEmail({ from, to, bcc, subject, text, html }) {
  const boundary = 'enomia_alt_' + Buffer.from(subject + to).toString('hex').slice(0, 20);
  const subjectEncoded = '=?UTF-8?B?' + Buffer.from(subject, 'utf8').toString('base64') + '?=';
  const headers = [`From: ${from}`, `To: ${to}`];
  if (bcc) headers.push(`Bcc: ${bcc}`);
  headers.push('Subject: ' + subjectEncoded);
  headers.push(`List-Unsubscribe: ${LIST_UNSUBSCRIBE}`);
  headers.push('MIME-Version: 1.0');
  headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
  const body = [
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    text,
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    html,
    `--${boundary}--`,
    '',
  ].join('\r\n');
  return headers.join('\r\n') + '\r\n\r\n' + body;
}

export function encodeRaw(raw) {
  return Buffer.from(raw, 'utf8').toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Envoi via client gmail (googleapis). Ajoute opt-out (texte + html) et
 * List-Unsubscribe. Renvoie { id, threadId } (threadId pour track-replies).
 */
export async function sendHtmlEmail(gm, { from = 'Marc Chenut <marc@enomia.app>', to, bcc, subject, text }) {
  const fullText = appendOptoutText(text);
  const html = textToHtml(text);
  const raw = buildRawEmail({ from, to, bcc, subject, text: fullText, html });
  const res = await gm.users.messages.send({ userId: 'me', requestBody: { raw: encodeRaw(raw) } });
  return { id: res.data.id, threadId: res.data.threadId };
}
