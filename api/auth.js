import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action, email, password, firstName } = req.body

  if (action === 'signup') {
    const { data: exists } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (exists) {
      return res.status(400).json({ error: 'Email already exists' })
    }

    const { data, error } = await supabase
      .from('users')
      .insert([{
        email,
        password_hash: password,
        first_name: firstName
      }])
      .select()

    if (error) {
      return res.status(400).json({ error: error.message })
    }

    return res.status(200).json({ userId: data[0].id, email })
  }

  if (action === 'login') {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('password_hash', password)
      .single()

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    return res.status(200).json({ userId: user.id, email: user.email, firstName: user.first_name })
  }

  return res.status(400).json({ error: 'Invalid action' })
}
