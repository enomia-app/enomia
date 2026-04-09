// Helper partagé pour vérifier un JWT Supabase SANS round-trip vers le serveur Auth.
//
// Avant : `supabase.auth.getUser(token)` = 100-300 ms par appel (round-trip HTTP)
// Après : vérification locale HMAC-SHA256 = < 1 ms
//
// Sécurité : les JWT Supabase sont signés en HS256 avec SUPABASE_JWT_SECRET.
// Vérifier localement la signature + l'exp est équivalent à ce que fait getUser()
// côté serveur, sauf le cas (rare) d'un token révoqué par l'admin entre le login
// et la requête. Pour les opérations non-critiques (fetch, save), c'est un trade-off
// parfaitement acceptable.
//
// ⚠️ NÉCESSITE la variable d'env SUPABASE_JWT_SECRET dans Vercel.
// Si elle n'est pas configurée, on fallback vers l'ancien comportement (SDK).
// Trouver la valeur : dashboard Supabase → Project Settings → API → JWT Secret.

import crypto from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET
const HAS_JWT_SECRET = !!JWT_SECRET && JWT_SECRET.length > 10

// Client Supabase pour le fallback (créé une seule fois, lazy)
let _fallbackClient = null
function _getFallbackClient() {
  if (_fallbackClient) return _fallbackClient
  _fallbackClient = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  return _fallbackClient
}

function b64urlDecode(str) {
  const pad = str.length % 4 === 2 ? '==' : str.length % 4 === 3 ? '=' : ''
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64')
}

// Vérifie un JWT HS256 et retourne le payload (ou null si invalide)
function verifyJwtLocal(token) {
  if (!token || !JWT_SECRET) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null

  const [headerB64, payloadB64, signatureB64] = parts
  const data = `${headerB64}.${payloadB64}`

  try {
    // Recompute HMAC-SHA256 signature
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(data)
      .digest()

    const actualSig = b64urlDecode(signatureB64)

    // Comparaison constante pour éviter les timing attacks
    if (expectedSig.length !== actualSig.length) return null
    if (!crypto.timingSafeEqual(expectedSig, actualSig)) return null

    // Parse et valide le payload
    const payload = JSON.parse(b64urlDecode(payloadB64).toString('utf8'))

    // Vérifier exp
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) return null

    // Vérifier sub (user id)
    if (!payload.sub) return null

    return payload
  } catch (_) {
    return null
  }
}

/**
 * Extrait et vérifie l'utilisateur depuis les headers d'une requête.
 * Retourne un objet `{ id, email, ... }` compatible avec l'ancien `getUser()`,
 * ou null si le token est invalide / absent.
 *
 * - Si SUPABASE_JWT_SECRET est défini → vérification locale instantanée.
 * - Sinon → fallback sur `supabase.auth.getUser()` (plus lent mais safe).
 *
 * IMPORTANT : cette fonction est asynchrone pour supporter le fallback.
 */
export async function getUserFromReq(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null

  // Chemin rapide : vérification locale
  if (HAS_JWT_SECRET) {
    const payload = verifyJwtLocal(token)
    if (payload) {
      return {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        app_metadata: payload.app_metadata || {},
        user_metadata: payload.user_metadata || {},
      }
    }
    // Signature invalide OU clé erronée → fallback safety net
  }

  // Chemin fallback : appel Supabase (comportement original)
  try {
    const sb = _getFallbackClient()
    const { data: { user }, error } = await sb.auth.getUser(token)
    return error ? null : user
  } catch (_) {
    return null
  }
}
