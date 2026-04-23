// API publique pour le calculateur de taxe de séjour (Astro endpoint).
// GET /api/taxe-sejour?action=search&q=par → autocomplete communes (max 10)
// GET /api/taxe-sejour?action=tarifs&insee=75056 → tarifs actifs de la commune

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalize(s: string) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function json(body: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      'access-control-allow-origin': '*',
      ...extra
    }
  });
}

export const GET: APIRoute = async ({ url }) => {
  const params = url.searchParams;
  const action = params.get('action');

  if (action === 'search') {
    const q = normalize(params.get('q') || '');
    if (q.length < 2) return json({ results: [] });

    let { data, error } = await supabase
      .from('ts_communes')
      .select('code_insee, libelle, departement')
      .eq('has_tarif', true)
      .ilike('libelle_norm', `${q}%`)
      .order('libelle')
      .limit(10);

    if (error) return json({ error: error.message }, 500);

    if ((data?.length ?? 0) < 3 && q.length >= 3) {
      const { data: fuzzy } = await supabase
        .from('ts_communes')
        .select('code_insee, libelle, departement')
        .eq('has_tarif', true)
        .ilike('libelle_norm', `%${q}%`)
        .order('libelle')
        .limit(10);
      const seen = new Set((data ?? []).map((d) => d.code_insee));
      for (const row of fuzzy || []) {
        if (!seen.has(row.code_insee)) (data ||= []).push(row);
        if ((data?.length ?? 0) >= 10) break;
      }
    }

    return json({ results: data ?? [] });
  }

  if (action === 'tarifs') {
    const insee = String(params.get('insee') || '').trim();
    if (!/^[0-9A-Z]{5}$/i.test(insee)) {
      return json({ error: 'INSEE invalide' }, 400);
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
    ]);

    if (communeRes.error) return json({ error: 'Commune inconnue' }, 404);

    const tarifs = tarifsRes.data || [];
    const latest = new Map<string, (typeof tarifs)[number]>();
    for (const t of tarifs) {
      const key = `${t.hebergement_slug}|${t.periode || ''}`;
      if (!latest.has(key)) latest.set(key, t);
    }

    return json({ commune: communeRes.data, tarifs: [...latest.values()] });
  }

  return json({ error: 'action invalide (search|tarifs)' }, 400);
};
