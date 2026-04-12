-- ═══════════════════════════════════════════════════════════════
-- Activer RLS sur toutes les tables publiques
--
-- IMPORTANT : les APIs utilisent service_role (bypass RLS),
-- donc ce script ne casse rien. Il protege contre un acces
-- direct a la base via la cle publique (publishable key).
--
-- A executer dans : Supabase Dashboard > SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Activer RLS sur chaque table
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrat_bailleur ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrat_biens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contrats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lcd_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lcd_biens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lcd_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_ratings ENABLE ROW LEVEL SECURITY;

-- 2. Policies pour les tables avec user_id
--    Chaque utilisateur ne voit/modifie que ses propres donnees

-- simulations
CREATE POLICY "Users can view own simulations" ON public.simulations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own simulations" ON public.simulations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own simulations" ON public.simulations
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own simulations" ON public.simulations
  FOR DELETE USING (auth.uid() = user_id);
-- Exception : simulations publiques lisibles par tous
CREATE POLICY "Public simulations are viewable" ON public.simulations
  FOR SELECT USING (is_public = true);

-- contrat_bailleur
CREATE POLICY "Users can manage own bailleur" ON public.contrat_bailleur
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- contrat_biens
CREATE POLICY "Users can manage own biens" ON public.contrat_biens
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- contrats
CREATE POLICY "Users can manage own contrats" ON public.contrats
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- lcd_settings
CREATE POLICY "Users can manage own settings" ON public.lcd_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- lcd_biens
CREATE POLICY "Users can manage own lcd biens" ON public.lcd_biens
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- lcd_invoices
CREATE POLICY "Users can manage own invoices" ON public.lcd_invoices
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. article_ratings : table publique (pas de user_id)
--    Tout le monde peut lire et noter
CREATE POLICY "Anyone can read ratings" ON public.article_ratings
  FOR SELECT USING (true);
CREATE POLICY "Anyone can submit ratings" ON public.article_ratings
  FOR INSERT WITH CHECK (true);
