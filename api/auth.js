import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action, email } = req.body

  // Envoyer un magic link
  if (action === 'magic-link') {
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email invalide' })
    }

    const { error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: (process.env.APP_URL || 'https://enomia.app') + '/simulateur-rentabilite-airbnb'
      }
    })

    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ message: 'Lien envoyé' })
  }

  // Vérifier un token et retourner l'utilisateur
  if (action === 'me') {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Non authentifié' })

    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return res.status(401).json({ error: 'Token invalide' })

    return res.status(200).json({ user: { id: user.id, email: user.email } })
  }

  return res.status(400).json({ error: 'Action invalide' })
}
