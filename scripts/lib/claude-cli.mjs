// Wrapper Node pour appeler `claude -p` (Claude Code CLI) au lieu du SDK Anthropic.
// Force l'usage du forfait Claude Max (OAuth) en supprimant ANTHROPIC_API_KEY de l'env.
// Inclut retry/backoff sur erreurs transientes (529 Overloaded, rate limit, timeout).
//
// Usage :
//   import { callClaudeMax, callClaudeMaxJson } from '../lib/claude-cli.mjs';
//   const text = await callClaudeMax(prompt, { model: 'claude-opus-4-7' });
//   const obj  = await callClaudeMaxJson(prompt, { model: 'claude-opus-4-7' });
//
// Pourquoi : éviter de payer le crédit API quand le forfait Max est déjà payé.
// Cf. memory/incident_api_spike_2026-05 + statut FB-agent 25/05.

import { spawn } from 'child_process';

const DEFAULT_MODEL = 'claude-opus-4-7';
const DEFAULT_MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = 2000; // 2s, 4s, 8s entre tentatives

function isTransientError(text) {
  if (!text) return false;
  const s = text.toLowerCase();
  return (
    s.includes('overloaded') ||
    s.includes('529') ||
    s.includes('rate_limit') ||
    s.includes('rate limit') ||
    s.includes('timeout') ||
    s.includes('econnreset') ||
    s.includes('etimedout') ||
    s.includes('socket hang up')
  );
}

function runClaudeOnce(prompt, model) {
  return new Promise((resolve, reject) => {
    // Clone env sans ANTHROPIC_API_KEY (force OAuth Max)
    const env = { ...process.env };
    delete env.ANTHROPIC_API_KEY;

    const proc = spawn('claude', ['-p', '--model', model], { env });
    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (d) => { stdout += d.toString(); });
    proc.stderr.on('data', (d) => { stderr += d.toString(); });
    proc.on('error', (err) => reject(Object.assign(err, { stdout, stderr })));
    proc.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        const err = new Error(`claude -p exit code ${code}`);
        err.stdout = stdout;
        err.stderr = stderr;
        err.code = code;
        reject(err);
      }
    });

    proc.stdin.write(prompt);
    proc.stdin.end();
  });
}

export async function callClaudeMax(prompt, opts = {}) {
  const model = opts.model || DEFAULT_MODEL;
  const maxRetries = opts.maxRetries ?? DEFAULT_MAX_RETRIES;

  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const { stdout, stderr } = await runClaudeOnce(prompt, model);
      // Parfois `claude -p` renvoie 200 mais avec un message d'erreur dans stdout
      // (cas observé : "API Error: 529 …"). On vérifie aussi le stdout.
      if (isTransientError(stdout) && attempt < maxRetries) {
        const backoff = RETRY_BACKOFF_MS * Math.pow(2, attempt);
        console.error(`[claude-cli] sortie transient (tentative ${attempt + 1}) : ${stdout.slice(0, 200)}\n  retry dans ${backoff}ms`);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
      return stdout.trim();
    } catch (e) {
      lastError = e;
      const text = `${e.stderr || ''}\n${e.stdout || ''}\n${e.message || ''}`;
      const retriable = isTransientError(text);

      if (attempt < maxRetries && retriable) {
        const backoff = RETRY_BACKOFF_MS * Math.pow(2, attempt);
        console.error(`[claude-cli] tentative ${attempt + 1} échouée (transient), retry dans ${backoff}ms`);
        await new Promise((r) => setTimeout(r, backoff));
        continue;
      }
      // Non-retriable ou max retries atteint : log détaillé et throw
      const msg = `[claude-cli] échec après ${attempt + 1} tentative(s) : ${e.message}\n--- stderr ---\n${e.stderr || ''}\n--- stdout ---\n${e.stdout || ''}`;
      throw new Error(msg);
    }
  }
  throw lastError || new Error('[claude-cli] échec inconnu');
}

// Wrapper JSON : strip éventuels code fences markdown et parse.
export async function callClaudeMaxJson(prompt, opts = {}) {
  const text = await callClaudeMax(prompt, opts);
  // Strip ```json … ``` ou ``` … ``` si présent
  const cleaned = text
    .replace(/^```(?:json)?\s*/m, '')
    .replace(/\s*```\s*$/m, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`[claude-cli] sortie non-JSON valide :\n--- sortie ---\n${cleaned}\n--- erreur parse ---\n${e.message}`);
  }
}
