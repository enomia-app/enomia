import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action, userId, simulationId, simulationData, simulationName } = req.body

  if (action === 'save') {
    const { data, error } = await supabase
      .from('simulations')
      .insert([{
        user_id: userId,
        name: simulationName || 'Simulation sans titre',
        data: simulationData
      }])
      .select()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    return res.status(200).json({ simulationId: data[0].id })
  }

  if (action === 'fetch') {
    const { data, error } = await supabase
      .from('simulations')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    return res.status(200).json({ simulations: data })
  }

  if (action === 'get') {
    const { data, error } = await supabase
      .from('simulations')
      .select('*')
      .eq('id', simulationId)
      .single()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    return res.status(200).json({ simulation: data })
  }

  if (action === 'delete') {
    const { error } = await supabase
      .from('simulations')
      .delete()
      .eq('id', simulationId)
      .eq('user_id', userId)

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    return res.status(200).json({ message: 'Deleted' })
  }

  return res.status(400).json({ error: 'Invalid action' })
}
