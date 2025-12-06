-- =====================================================
-- MIGRATION: Fix RLS Policies per Linee Prodotto
-- Data: 2025-12-06
-- Descrizione: Semplifica le policies RLS per permettere operazioni base
-- =====================================================

-- =====================================================
-- LINEE_PRODOTTO - Policies semplificate
-- =====================================================

DROP POLICY IF EXISTS linee_prodotto_insert_policy ON linee_prodotto;
DROP POLICY IF EXISTS linee_prodotto_update_policy ON linee_prodotto;
DROP POLICY IF EXISTS linee_prodotto_delete_policy ON linee_prodotto;

CREATE POLICY linee_prodotto_insert_policy ON linee_prodotto
  FOR INSERT WITH CHECK (azienda_id = public.get_user_azienda_id());

CREATE POLICY linee_prodotto_update_policy ON linee_prodotto
  FOR UPDATE USING (azienda_id = public.get_user_azienda_id());

CREATE POLICY linee_prodotto_delete_policy ON linee_prodotto
  FOR DELETE USING (azienda_id = public.get_user_azienda_id());

-- =====================================================
-- FINE MIGRATION
-- =====================================================
