import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function getUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null
  const { data: { user }, error } = await supabase.auth.getUser(token)
  return error ? null : user
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action, simulationId, simulationData, simulationName } = req.body

  // Sauvegarder ou mettre à jour une simulation
  if (action === 'save') {
    const user = await getUser(req)
    if (!user) return res.status(401).json({ error: 'Non authentifié' })

    let result
    if (simulationId) {
      const { data, error } = await supabase
        .from('simulations')
        .update({ name: simulationName || 'Simulation sans titre', data: simulationData, updated_at: new Date().toISOString() })
        .eq('id', simulationId)
        .eq('user_id', user.id)
        .select()
      if (error) return res.status(400).json({ error: error.message })
      result = data[0]
    } else {
      const { data, error } = await supabase
        .from('simulations')
        .insert([{ user_id: user.id, name: simulationName || 'Simulation sans titre', data: simulationData }])
        .select()
      if (error) return res.status(400).json({ error: error.message })
      result = data[0]
    }

    return res.status(200).json({ simulationId: result.id })
  }

  // Récupérer toutes les simulations de l'utilisateur
  if (action === 'fetch') {
    const user = await getUser(req)
    if (!user) return res.status(401).json({ error: 'Non authentifié' })

    const { data, error } = await supabase
      .from('simulations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ simulations: data })
  }

  // Supprimer une simulation
  if (action === 'delete') {
    const user = await getUser(req)
    if (!user) return res.status(401).json({ error: 'Non authentifié' })

    const { error } = await supabase
      .from('simulations')
      .delete()
      .eq('id', simulationId)
      .eq('user_id', user.id)

    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ message: 'Supprimée' })
  }

  // Générer un lien de partage public
  if (action === 'share') {
    const user = await getUser(req)
    if (!user) return res.status(401).json({ error: 'Non authentifié' })

    const { error } = await supabase
      .from('simulations')
      .update({ is_public: true })
      .eq('id', simulationId)
      .eq('user_id', user.id)

    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({
      shareUrl: `${process.env.APP_URL || 'https://enomia.app'}/api/share?id=${simulationId}`
    })
  }

  // Récupérer une simulation partagée (sans auth)
  if (action === 'get-public') {
    const { data, error } = await supabase
      .from('simulations')
      .select('*')
      .eq('id', simulationId)
      .eq('is_public', true)
      .single()

    if (error || !data) return res.status(404).json({ error: 'Simulation introuvable' })
    return res.status(200).json({ simulation: data })
  }

  return res.status(400).json({ error: 'Action invalide' })
}
