// API publique pour le calculateur de taxe de séjour (Vercel serverless).
// GET /api/taxe-sejour?action=search&q=par → autocomplete communes (max 10)
// GET /api/taxe-sejour?action=tarifs&insee=75056 → tarifs actifs de la commune

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const action = req.query.action

  if (action === 'search') {
    const q = normalize(req.query.q)
    if (q.length < 2) return res.status(200).json({ results: [] })

    let { data, error } = await supabase
      .from('ts_communes')
      .select('code_insee, libelle, departement')
      .eq('has_tarif', true)
      .ilike('libelle_norm', `${q}%`)
      .order('libelle')
      .limit(10)

    if (error) return res.status(500).json({ error: error.message })

    if ((data?.length ?? 0) < 3 && q.length >= 3) {
      const { data: fuzzy } = await supabase
        .from('ts_communes')
        .select('code_insee, libelle, departement')
        .eq('has_tarif', true)
        .ilike('libelle_norm', `%${q}%`)
        .order('libelle')
        .limit(10)
      const seen = new Set((data ?? []).map((d) => d.code_insee))
      for (const row of fuzzy || []) {
        if (!seen.has(row.code_insee)) (data ||= []).push(row)
        if ((data?.length ?? 0) >= 10) break
      }
    }

    return res.status(200).json({ results: data ?? [] })
  }

  if (action === 'tarifs') {
    const insee = String(req.query.insee || '').trim()
    if (!/^[0-9A-Z]{5}$/i.test(insee)) {
      return res.status(400).json({ error: 'INSEE invalide' })
    }

    const [communeRes, tarifsRes] = await Promise.all([
      supabase
        .from('ts_communes')
        .select('code_insee, libelle, departement')
        .eq('code_insee', insee)
        .single(),
      supabase
        .from('ts_tarifs')
        .select('hebergement, hebergement_slug, regime, tarif, tarif_total, unite, periode, annee, taxe_dep_pct')
        .eq('code_insee', insee)
        .order('annee', { ascending: false })
    ])

    if (communeRes.error) return res.status(404).json({ error: 'Commune inconnue' })

    const tarifs = tarifsRes.data || []
    const latest = new Map()
    for (const t of tarifs) {
      const key = `${t.hebergement_slug}|${t.periode || ''}`
      if (!latest.has(key)) latest.set(key, t)
    }

    return res.status(200).json({ commune: communeRes.data, tarifs: [...latest.values()] })
  }

  return res.status(400).json({ error: 'action invalide (search|tarifs)' })
}
