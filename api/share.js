import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  const simId = req.query.id

  let title       = 'Simulation de rentabilité Airbnb — Enomia'
  let description = 'Découvrez cette simulation de rentabilité Airbnb réalisée avec Enomia.'

  if (simId) {
    const { data } = await supabase
      .from('simulations')
      .select('name, data')
      .eq('id', simId)
      .eq('is_public', true)
      .single()

    if (data) {
      const d = data.data || {}
      const name = data.name || 'Simulation Airbnb'
      const r    = d.rendement != null ? d.rendement.toFixed(1) + '%' : null
      const cf   = d.cfMois   != null ? (d.cfMois >= 0 ? '+' : '') + Math.round(d.cfMois) + ' €/mois' : null

      title = r
        ? `${name} — ${r} de rendement | Enomia`
        : `${name} | Enomia`

      description = [
        cf      ? `Cash flow : ${cf}`   : null,
        d.sliders?.prix ? `Prix : ${Math.round(d.sliders.prix / 1000)}k€` : null,
        'Analysé avec le simulateur Enomia.',
      ].filter(Boolean).join(' · ')
    }
  }

  const APP_URL    = process.env.APP_URL || 'https://www.enomia.app'
  const ogImage    = `${APP_URL}/api/og?sim=${simId}`
  const redirectTo = `${APP_URL}/simulateur-lcd?sim=${simId}`
  const canonical  = `${APP_URL}/api/share?id=${simId}`

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate')

  res.send(`<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <meta name="description" content="${description}">

  <!-- Open Graph -->
  <meta property="og:type"        content="website">
  <meta property="og:url"         content="${canonical}">
  <meta property="og:title"       content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image"       content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height"content="630">
  <meta property="og:site_name"   content="Enomia">

  <!-- Twitter / X -->
  <meta name="twitter:card"       content="summary_large_image">
  <meta name="twitter:title"      content="${title}">
  <meta name="twitter:description"content="${description}">
  <meta name="twitter:image"      content="${ogImage}">

  <!-- Redirect immédiat -->
  <meta http-equiv="refresh" content="0;url=${redirectTo}">
  <script>window.location.replace('${redirectTo}')</script>
</head>
<body style="font-family:sans-serif;background:#F5F0E8;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
  <p style="color:#666">Chargement de la simulation…</p>
</body>
</html>`)
}
