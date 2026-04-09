import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action, slug, rating } = req.body

  // Submit a new rating
  if (action === 'rate') {
    if (!slug || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Paramètres invalides' })
    }

    const { error } = await supabase
      .from('article_ratings')
      .insert([{ slug, rating: Math.round(rating) }])

    if (error) return res.status(400).json({ error: error.message })
  }

  // Get aggregate for a slug (also called after rating)
  if (action === 'rate' || action === 'get') {
    if (!slug) return res.status(400).json({ error: 'slug manquant' })

    const { data, error } = await supabase
      .from('article_ratings')
      .select('rating')
      .eq('slug', slug)

    if (error) return res.status(400).json({ error: error.message })

    const count = data.length
    const average = count > 0
      ? Math.round((data.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10
      : null

    return res.status(200).json({ count, average })
  }

  return res.status(400).json({ error: 'Action invalide' })
}
