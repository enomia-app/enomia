import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const APP_URL = process.env.APP_URL || 'https://www.enomia.app'

async function sendMagicLinkEmail({ to, prenom, magicLink }) {
  const firstName = prenom ? prenom.trim() : null
  const greeting = firstName ? `Bonjour ${firstName},` : 'Bonjour,'

  const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
        <!-- Header -->
        <tr>
          <td style="background:#1a1c1a;padding:28px 40px">
            <span style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:-0.01em">Enomia</span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px 40px 32px">
            <p style="margin:0 0 8px;font-size:16px;color:#1a1a1a;font-weight:500">${greeting}</p>
            <p style="margin:0 0 28px;font-size:15px;color:#52524e;line-height:1.7">
              Cliquez sur le bouton ci-dessous pour accéder à vos simulations de rendement.<br>
              Ce lien est valable <strong>24 heures</strong>.
            </p>
            <table cellpadding="0" cellspacing="0" style="margin-bottom:28px">
              <tr>
                <td style="background:#3fbd71;border-radius:8px">
                  <a href="${magicLink}" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600">
                    Accéder à mes simulations →
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 0;font-size:14px;color:#52524e;line-height:1.7">
              Vous serez automatiquement connecté et pourrez consulter vos simulations quand vous le souhaitez.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:24px 40px 32px;border-top:1px solid #f0ede8">
            <p style="margin:0 0 4px;font-size:14px;color:#1a1a1a">Bonne journée à vous,</p>
            <p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:600">Marc — Enomia</p>
            <p style="margin:12px 0 0;font-size:12px;color:#9a9690">Si vous n'avez pas demandé ce lien, ignorez simplement cet email.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Marc <marc@enomia.app>',
      to: [to],
      subject: 'Votre simulation de rendement Airbnb',
      html,
    }),
  })

  return res.ok
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { action, email, prenom, simPayload } = req.body

  if (action === 'magic-link') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
    if (!email || !emailRegex.test(email) || email.length > 254) {
      return res.status(400).json({ error: 'Email invalide' })
    }

    // Générer le lien via Supabase (sans envoi d'email par Supabase)
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${APP_URL}/simulateur-rentabilite-airbnb${simPayload ? '?ps=' + simPayload : ''}`,
        data: { prenom: prenom || '' },
      },
    })

    if (error) return res.status(400).json({ error: error.message })

    // Envoyer l'email via Resend
    const sent = await sendMagicLinkEmail({
      to: email,
      prenom,
      magicLink: data.properties.action_link,
    })

    if (!sent) return res.status(500).json({ error: "Erreur d'envoi email" })

    return res.status(200).json({ message: 'Lien envoyé' })
  }

  // Envoyer un email de partage de simulation
  if (action === 'share-email') {
    const { email: to, message, shareUrl } = req.body
    if (!to || !to.includes('@')) return res.status(400).json({ error: 'Email invalide' })

    const html = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
        <tr><td style="background:#1a1c1a;padding:28px 40px">
          <span style="font-size:20px;font-weight:700;color:#ffffff">Enomia</span>
        </td></tr>
        <tr><td style="padding:40px 40px 32px">
          <p style="margin:0 0 8px;font-size:16px;color:#1a1a1a;font-weight:500">Bonjour,</p>
          <p style="margin:0 0 20px;font-size:15px;color:#52524e;line-height:1.7">
            Quelqu'un a partagé avec vous une simulation de rendement Airbnb.
          </p>
          ${message ? `<p style="margin:0 0 24px;font-size:14px;color:#52524e;background:#f7f6f3;padding:16px;border-radius:8px;border-left:3px solid #3fbd71">${message}</p>` : ''}
          <table cellpadding="0" cellspacing="0" style="margin-bottom:28px">
            <tr><td style="background:#3fbd71;border-radius:8px">
              <a href="${shareUrl}" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600">
                Voir la simulation →
              </a>
            </td></tr>
          </table>
          <p style="margin:0;font-size:13px;color:#9a9690">Vous pouvez consulter et dupliquer cette simulation gratuitement.</p>
        </td></tr>
        <tr><td style="padding:24px 40px 32px;border-top:1px solid #f0ede8">
          <p style="margin:0 0 4px;font-size:14px;color:#1a1a1a">Bonne journée,</p>
          <p style="margin:0;font-size:14px;color:#1a1a1a;font-weight:600">Marc — Enomia</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'Marc <marc@enomia.app>', to: [to], subject: 'Une simulation de rendement Airbnb partagée avec vous', html }),
    })

    if (!r.ok) return res.status(500).json({ error: "Erreur d'envoi" })
    return res.status(200).json({ message: 'Email envoyé' })
  }

  if (action === 'me') {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'Non authentifié' })

    const { data: { user }, error } = await supabase.auth.getUser(token)
    if (error || !user) return res.status(401).json({ error: 'Token invalide' })

    return res.status(200).json({ user: { id: user.id, email: user.email, prenom: user.user_metadata?.prenom } })
  }

  return res.status(400).json({ error: 'Action invalide' })
}
