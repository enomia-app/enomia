-- ============================================================
-- TEMPLATE — Création d'une nouvelle table dans public.
-- ============================================================
--
-- ⚠️ Contexte : depuis le 2026-05-27, le projet Enomia a opt-in
-- au nouveau comportement Supabase (changelog du 28/04/2026) :
-- les nouvelles tables dans `public` ne sont PLUS auto-exposées
-- à l'API (PostgREST / GraphQL / supabase-js).
--
-- → Toute nouvelle table doit avoir ses GRANTs explicites, sinon
--   le front (anon / authenticated) ne pourra pas la lire.
--
-- Source : https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically
-- ============================================================

-- 1. Création de la table
CREATE TABLE public.ma_table (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  -- ... colonnes métier ...
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- 2. Activer Row Level Security (TOUJOURS)
ALTER TABLE public.ma_table ENABLE ROW LEVEL SECURITY;

-- 3. GRANTs explicites pour exposer à l'API
--    Convention Supabase : SELECT seul pour anon (lecture publique),
--    CRUD complet pour authenticated et service_role.
--    Ajuster selon le besoin réel de la table.
GRANT SELECT                         ON public.ma_table TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ma_table TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ma_table TO service_role;

-- Si la table a une séquence (SERIAL / IDENTITY) :
-- GRANT USAGE, SELECT ON SEQUENCE public.ma_table_id_seq TO authenticated, service_role;

-- 4. Policies RLS — sans ça, les GRANTs ne servent à rien.
--    Pattern le plus courant chez Enomia : ownership par user_id.
CREATE POLICY "ma_table_select_own" ON public.ma_table
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "ma_table_insert_own" ON public.ma_table
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "ma_table_update_own" ON public.ma_table
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "ma_table_delete_own" ON public.ma_table
  FOR DELETE USING (auth.uid() = user_id);

-- Variantes utiles :
--
-- Lecture publique (ex: référentiel comme ts_communes, ts_tarifs) :
-- CREATE POLICY "ma_table_public_read" ON public.ma_table
--   FOR SELECT USING (true);
--
-- Insert anonyme borné (ex: client_logs) — ⚠️ ajouter CHECK constraints
-- pour borner la taille des champs et prévoir une purge auto via pg_cron.
