import { createClient } from '@supabase/supabase-js'
import { getUserFromReq } from './_lib/auth.js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Vérification locale du JWT (pas de round-trip Auth Supabase)
// ⚠️ Async : reste en await car fallback SDK si SUPABASE_JWT_SECRET absent.
async function getUser(req) {
  return await getUserFromReq(req)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action } = req.body

  // ─── SETTINGS ───────────────────────────────
  if (action === 'settings-fetch') {
    const user = await getUser(req)
    if (!user) return res.status(401).json({ error: 'Non authentifié' })
    const { data, error } = await supabase
      .from('lcd_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ settings: data || null })
  }

  if (action === 'settings-save') {
    const user = await getUser(req)
    if (!user) return res.status(401).json({ error: 'Non authentifié' })
    const { settings } = req.body
    const row = {
      user_id: user.id,
      nom: settings.nom || null,
      adresse: settings.adresse || null,
      siret: settings.siret || null,
      mention: settings.mention || null,
      prefix: settings.prefix || null,
      next_num: settings.next_num || 1,
      updated_at: new Date().toISOString()
    }
    const { data, error } = await supabase
      .from('lcd_settings')
      .upsert(row, { onConflict: 'user_id' })
      .select()
      .single()
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ settings: data })
  }

  // ─── BIENS ──────────────────────────────────
  if (action === 'biens-fetch') {
    const user = await getUser(req)
    if (!user) return res.status(401).json({ error: 'Non authentifié' })
    const { data, error } = await supabase
      .from('lcd_biens')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ biens: data })
  }

  if (action === 'biens-save') {
    const user = await getUser(req)
    if (!user) return res.status(401).json({ error: 'Non authentifié' })
    const { bien } = req.body
    if (!bien || !bien.nom) return res.status(400).json({ error: 'Nom requis' })
    const payload = {
      user_id: user.id,
      nom: bien.nom,
      adresse: bien.adresse || null,
      ville: bien.ville || null,
      categorie: bien.categorie || null,
      capacite: bien.capacite || null,
      updated_at: new Date().toISOString()
    }
    let result
    if (bien.id) {
      const { data, error } = await supabase
        .from('lcd_biens')
        .update(payload)
        .eq('id', bien.id)
        .eq('user_id', user.id)
        .select()
        .single()
      if (error) return res.status(400).json({ error: error.message })
      result = data
    } else {
      const { data, error } = await supabase
        .from('lcd_biens')
        .insert([payload])
        .select()
        .single()
      if (error) return res.status(400).json({ error: error.message })
      result = data
    }
    return res.status(200).json({ bien: result })
  }

  if (action === 'biens-delete') {
    const user = await getUser(req)
    if (!user) return res.status(401).json({ error: 'Non authentifié' })
    const { bienId } = req.body
    const { error } = await supabase
      .from('lcd_biens')
      .delete()
      .eq('id', bienId)
      .eq('user_id', user.id)
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  // ─── INVOICES ───────────────────────────────
  if (action === 'invoices-fetch') {
    const user = await getUser(req)
    if (!user) return res.status(401).json({ error: 'Non authentifié' })
    const { data, error } = await supabase
      .from('lcd_invoices')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ invoices: data })
  }

  if (action === 'invoices-save') {
    const user = await getUser(req)
    if (!user) return res.status(401).json({ error: 'Non authentifié' })
    const { invoice } = req.body
    if (!invoice) return res.status(400).json({ error: 'Facture manquante' })

    // Détermine le n° de facture si nouveau
    let invoiceNumber = invoice.invoice_number
    if (!invoiceNumber || invoiceNumber === '(BROUILLON)') {
      const { data: settings } = await supabase
        .from('lcd_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      const prefix = (settings?.prefix) || (new Date().getFullYear() + '-')
      const nextNum = (settings?.next_num) || 1
      invoiceNumber = prefix + String(nextNum).padStart(3, '0')
      // Increment next_num
      await supabase
        .from('lcd_settings')
        .upsert({ user_id: user.id, prefix, next_num: nextNum + 1, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    }

    const yearMatch = String(invoiceNumber).match(/^(\d{4})/)
    const year = yearMatch ? parseInt(yearMatch[1]) : new Date().getFullYear()

    const payload = {
      user_id: user.id,
      invoice_number: invoiceNumber,
      bien_id: invoice.bien_id || null,
      data: invoice.data || invoice,
      statut: invoice.statut || 'Payée',
      total_ttc: invoice.total_ttc || 0,
      year,
      updated_at: new Date().toISOString()
    }

    let result
    if (invoice.id) {
      const { data, error } = await supabase
        .from('lcd_invoices')
        .update(payload)
        .eq('id', invoice.id)
        .eq('user_id', user.id)
        .select()
        .single()
      if (error) return res.status(400).json({ error: error.message })
      result = data
    } else {
      const { data, error } = await supabase
        .from('lcd_invoices')
        .insert([payload])
        .select()
        .single()
      if (error) return res.status(400).json({ error: error.message })
      result = data
    }
    return res.status(200).json({ invoice: result })
  }

  if (action === 'invoices-delete') {
    const user = await getUser(req)
    if (!user) return res.status(401).json({ error: 'Non authentifié' })
    const { invoiceId } = req.body
    const { error } = await supabase
      .from('lcd_invoices')
      .delete()
      .eq('id', invoiceId)
      .eq('user_id', user.id)
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  return res.status(400).json({ error: 'Action invalide' })
}
