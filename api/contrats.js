// ═══════════════════════════════════════════════════════════════════
// API Contrats LCD — CRUD bailleur, biens et contrats
//
// Actions supportées :
//   bailleur-fetch   → GET infos bailleur
//   bailleur-upsert  → CREATE/UPDATE infos bailleur
//   biens-fetch      → liste tous les biens de l'user
//   bien-upsert      → CREATE/UPDATE un bien (inclut inventaire/clauses/etc)
//   bien-delete      → suppression d'un bien
//   contrats-fetch   → liste tous les contrats de l'user (avec bien joint)
//   contrat-upsert   → CREATE/UPDATE un contrat
//   contrat-delete   → suppression d'un contrat
//   contrat-pay      → marquer acompte/solde/caution payé
//   contrat-sign-url → générer une URL signée pour upload du contrat signé
// ═══════════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js'
import { getUserFromReq } from './_lib/auth.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function getUser(req) {
  return await getUserFromReq(req)
}

function err(res, code, message) {
  return res.status(code).json({ error: message })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return err(res, 405, 'Method not allowed')
  }

  const { action } = req.body || {}
  const user = await getUser(req)
  if (!user) return err(res, 401, 'Non authentifié')

  // ─── BAILLEUR ───────────────────────────────────────────────────
  if (action === 'bailleur-fetch') {
    const { data, error } = await supabase
      .from('contrat_bailleur')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    if (error) return err(res, 400, error.message)
    return res.status(200).json({ bailleur: data || null })
  }

  if (action === 'bailleur-upsert') {
    const { bailleur } = req.body
    if (!bailleur) return err(res, 400, 'bailleur manquant')
    const payload = { ...bailleur, user_id: user.id }
    // On retire les champs qu'on ne veut pas que le client puisse setter
    delete payload.created_at
    delete payload.updated_at
    const { data, error } = await supabase
      .from('contrat_bailleur')
      .upsert(payload, { onConflict: 'user_id' })
      .select()
      .maybeSingle()
    if (error) return err(res, 400, error.message)
    return res.status(200).json({ bailleur: data })
  }

  // ─── BIENS ──────────────────────────────────────────────────────
  if (action === 'biens-fetch') {
    const { data, error } = await supabase
      .from('contrat_biens')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    if (error) return err(res, 400, error.message)
    return res.status(200).json({ biens: data || [] })
  }

  if (action === 'bien-upsert') {
    const { bien } = req.body
    if (!bien) return err(res, 400, 'bien manquant')
    if (!bien.nom_interne) return err(res, 400, 'nom_interne requis')

    const payload = { ...bien, user_id: user.id }
    delete payload.created_at
    delete payload.updated_at

    // Si pas d'id → insert ; sinon → update
    let result
    if (payload.id) {
      // Vérifie que le bien appartient à l'user avant update
      const { data, error } = await supabase
        .from('contrat_biens')
        .update(payload)
        .eq('id', payload.id)
        .eq('user_id', user.id)
        .select()
        .maybeSingle()
      if (error) return err(res, 400, error.message)
      result = data
    } else {
      delete payload.id
      const { data, error } = await supabase
        .from('contrat_biens')
        .insert(payload)
        .select()
        .maybeSingle()
      if (error) return err(res, 400, error.message)
      result = data
    }
    return res.status(200).json({ bien: result })
  }

  if (action === 'bien-delete') {
    const { bienId } = req.body
    if (!bienId) return err(res, 400, 'bienId manquant')
    const { error } = await supabase
      .from('contrat_biens')
      .delete()
      .eq('id', bienId)
      .eq('user_id', user.id)
    if (error) return err(res, 400, error.message)
    return res.status(200).json({ ok: true })
  }

  // ─── CONTRATS ───────────────────────────────────────────────────
  if (action === 'contrats-fetch') {
    const { data, error } = await supabase
      .from('contrats')
      .select('*')
      .eq('user_id', user.id)
      .order('date_arrivee', { ascending: false })
    if (error) return err(res, 400, error.message)
    return res.status(200).json({ contrats: data || [] })
  }

  if (action === 'contrat-upsert') {
    const { contrat } = req.body
    if (!contrat) return err(res, 400, 'contrat manquant')
    if (!contrat.locataire_nom) return err(res, 400, 'locataire_nom requis')
    if (!contrat.date_arrivee || !contrat.date_depart) return err(res, 400, 'dates requises')

    const payload = { ...contrat, user_id: user.id }
    delete payload.created_at
    delete payload.updated_at

    let result
    if (payload.id) {
      const { data, error } = await supabase
        .from('contrats')
        .update(payload)
        .eq('id', payload.id)
        .eq('user_id', user.id)
        .select()
        .maybeSingle()
      if (error) return err(res, 400, error.message)
      result = data
    } else {
      delete payload.id
      const { data, error } = await supabase
        .from('contrats')
        .insert(payload)
        .select()
        .maybeSingle()
      if (error) return err(res, 400, error.message)
      result = data
    }
    return res.status(200).json({ contrat: result })
  }

  if (action === 'contrat-delete') {
    const { contratId } = req.body
    if (!contratId) return err(res, 400, 'contratId manquant')
    const { error } = await supabase
      .from('contrats')
      .delete()
      .eq('id', contratId)
      .eq('user_id', user.id)
    if (error) return err(res, 400, error.message)
    return res.status(200).json({ ok: true })
  }

  if (action === 'contrat-pay') {
    const { contratId, field, value } = req.body
    // field ∈ { acompte_paye, solde_paye, caution_encaissee, caution_rendue }
    const allowed = ['acompte_paye', 'solde_paye', 'caution_encaissee', 'caution_rendue']
    if (!contratId || !allowed.includes(field)) return err(res, 400, 'paramètres invalides')

    const update = { [field]: !!value }
    if (field === 'acompte_paye' && value) update.acompte_paye_at = new Date().toISOString()
    if (field === 'solde_paye' && value) update.solde_paye_at = new Date().toISOString()
    if (field === 'caution_rendue' && value) update.caution_rendue_at = new Date().toISOString()

    // Recalcule le statut en fonction des paiements
    const { data: current, error: fetchErr } = await supabase
      .from('contrats')
      .select('*')
      .eq('id', contratId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (fetchErr || !current) return err(res, 404, 'contrat introuvable')

    const merged = { ...current, ...update }
    let statut = 'en_attente'
    if (merged.acompte_paye && merged.solde_paye) statut = 'solde'
    else if (merged.acompte_paye) statut = 'acompte_recu'
    update.statut = statut

    const { data, error } = await supabase
      .from('contrats')
      .update(update)
      .eq('id', contratId)
      .eq('user_id', user.id)
      .select()
      .maybeSingle()
    if (error) return err(res, 400, error.message)
    return res.status(200).json({ contrat: data })
  }

  // ─── UPLOAD CONTRAT SIGNÉ ───────────────────────────────────────
  // Le client upload directement vers Supabase Storage avec son JWT user.
  // Cette API se contente de mémoriser le path dans la ligne contrat.
  if (action === 'contrat-sign-store-path') {
    const { contratId, path } = req.body
    if (!contratId || !path) return err(res, 400, 'paramètres manquants')
    // Sécurité : le path doit commencer par l'user_id
    if (!path.startsWith(user.id + '/')) return err(res, 403, 'path invalide')
    const { data, error } = await supabase
      .from('contrats')
      .update({
        contrat_signe_url: path,
        contrat_signe_uploaded_at: new Date().toISOString(),
      })
      .eq('id', contratId)
      .eq('user_id', user.id)
      .select()
      .maybeSingle()
    if (error) return err(res, 400, error.message)
    return res.status(200).json({ contrat: data })
  }

  // Génère une URL signée pour télécharger un contrat signé (5 min)
  if (action === 'contrat-sign-signed-url') {
    const { path } = req.body
    if (!path) return err(res, 400, 'path manquant')
    if (!path.startsWith(user.id + '/')) return err(res, 403, 'path invalide')
    const { data, error } = await supabase.storage
      .from('contrats-signes')
      .createSignedUrl(path, 300)
    if (error) return err(res, 400, error.message)
    return res.status(200).json({ url: data.signedUrl })
  }

  return err(res, 400, 'Action invalide')
}
