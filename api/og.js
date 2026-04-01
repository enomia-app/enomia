import { ImageResponse } from '@vercel/og'

export const config = { runtime: 'edge' }

export default async function handler(req) {
  try {
    const url = new URL(req.url)
    const simId = url.searchParams.get('sim')

    let rendement = null, cfMois = 0, totalProjet = 0, mensalit = 0, prix = 0, simName = 'Simulation Airbnb'

    if (simId) {
      const SUPABASE_URL = process.env.SUPABASE_URL
      const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/simulations?id=eq.${simId}&is_public=eq.true&select=name,data`,
        { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
      )
      const rows = await res.json()
      const sim = rows?.[0]
      if (sim) {
        simName = sim.name || 'Simulation Airbnb'
        const d = sim.data || {}
        rendement  = d.rendement  ?? null
        cfMois     = d.cfMois     ?? 0
        totalProjet= d.totalProjet?? 0
        mensalit   = d.mensalit   ?? 0
        prix       = d.sliders?.prix ?? d.prix ?? 0
      }
    }

    const r = rendement != null ? rendement.toFixed(1) : '—'
    const color = rendement == null ? '#888888'
      : rendement >= 12 ? '#3fbd71'
      : rendement >= 8  ? '#4a9eff'
      : rendement >= 5  ? '#f59e0b'
      : '#e05252'
    const badge = rendement == null ? ''
      : rendement >= 12 ? 'Excellent rendement'
      : rendement >= 8  ? 'Bon rendement'
      : rendement >= 5  ? 'Rendement correct'
      : 'Faible rendement'
    const badgeBg = rendement == null ? '#eeeeee'
      : rendement >= 12 ? 'rgba(63,189,113,0.12)'
      : rendement >= 8  ? 'rgba(74,158,255,0.12)'
      : rendement >= 5  ? 'rgba(245,158,11,0.12)'
      : 'rgba(224,82,82,0.12)'

    const fmtK   = n => n >= 1000 ? Math.round(n / 1000) + 'k€' : Math.round(n) + '€'
    const fmtCF  = n => (n >= 0 ? '+' : '') + Math.round(n) + ' €/mois'
    const fmtMen = n => fmtK(n) + '/mois'

    const stat = (label, value, valueColor) => ({
      type: 'div',
      props: {
        style: {
          display: 'flex', flexDirection: 'column', flex: 1,
          background: 'rgba(43,45,43,0.06)', borderRadius: '14px', padding: '20px 22px',
        },
        children: [
          { type: 'div', props: { style: { fontSize: 13, fontWeight: 700, color: '#999999', letterSpacing: '0.08em', marginBottom: '10px', textTransform: 'uppercase' }, children: label } },
          { type: 'div', props: { style: { fontSize: 26, fontWeight: 700, color: valueColor || '#2b2d2b' }, children: value } },
        ]
      }
    })

    return new ImageResponse(
      {
        type: 'div',
        props: {
          style: {
            display: 'flex', flexDirection: 'column',
            width: '100%', height: '100%',
            background: '#F5F0E8',
            padding: '52px 60px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          },
          children: [
            // Header
            {
              type: 'div',
              props: {
                style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '36px' },
                children: [
                  { type: 'div', props: { style: { fontSize: 26, fontWeight: 800, color: '#2b2d2b', letterSpacing: '-0.03em' }, children: 'Enomia' } },
                  { type: 'div', props: { style: { fontSize: 15, color: '#999999' }, children: 'Simulateur de rentabilité Airbnb' } },
                ]
              }
            },
            // Sim name
            { type: 'div', props: { style: { fontSize: 20, color: '#666666', marginBottom: '8px', fontWeight: 500 }, children: simName } },
            // Big rendement
            { type: 'div', props: { style: { fontSize: 100, fontWeight: 800, color, lineHeight: '1', letterSpacing: '-0.04em' }, children: r + '%' } },
            // Badge
            {
              type: 'div',
              props: {
                style: { display: 'flex', marginTop: '14px', marginBottom: '36px' },
                children: badge ? {
                  type: 'div',
                  props: {
                    style: { background: badgeBg, color, fontSize: 17, fontWeight: 700, padding: '8px 20px', borderRadius: '100px' },
                    children: badge
                  }
                } : { type: 'div', props: { children: '' } }
              }
            },
            // Stats row
            {
              type: 'div',
              props: {
                style: { display: 'flex', gap: '14px' },
                children: [
                  stat('Cash Flow',    fmtCF(cfMois),      cfMois >= 0 ? '#2b2d2b' : '#e05252'),
                  stat('Coût Projet',  fmtK(totalProjet),  '#2b2d2b'),
                  stat('Mensualité',   fmtMen(mensalit),   '#2b2d2b'),
                  stat('Prix Achat',   fmtK(prix),         '#2b2d2b'),
                ]
              }
            }
          ]
        }
      },
      { width: 1200, height: 630 }
    )
  } catch (e) {
    return new Response('Error: ' + e.message, { status: 500 })
  }
}
