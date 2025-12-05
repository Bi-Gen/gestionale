-- =====================================================
-- MIGRATION: Fix RLS Policies per Tipi e Classificazioni
-- Data: 2025-12-03
-- Descrizione: Semplifica le policies RLS per permettere operazioni base
-- =====================================================

-- =====================================================
-- TIPI_SOGGETTO - Policies semplificate
-- =====================================================

DROP POLICY IF EXISTS tipi_soggetto_insert_policy ON tipi_soggetto;
DROP POLICY IF EXISTS tipi_soggetto_update_policy ON tipi_soggetto;
DROP POLICY IF EXISTS tipi_soggetto_delete_policy ON tipi_soggetto;

CREATE POLICY tipi_soggetto_insert_policy ON tipi_soggetto
  FOR INSERT WITH CHECK (azienda_id = public.get_user_azienda_id());

CREATE POLICY tipi_soggetto_update_policy ON tipi_soggetto
  FOR UPDATE USING (azienda_id = public.get_user_azienda_id());

CREATE POLICY tipi_soggetto_delete_policy ON tipi_soggetto
  FOR DELETE USING (
    azienda_id = public.get_user_azienda_id()
    AND di_sistema = false  -- Non si possono eliminare i tipi di sistema
  );

-- =====================================================
-- MACROFAMIGLIE - Policies semplificate
-- =====================================================

DROP POLICY IF EXISTS macrofamiglie_insert_policy ON macrofamiglie;
DROP POLICY IF EXISTS macrofamiglie_update_policy ON macrofamiglie;
DROP POLICY IF EXISTS macrofamiglie_delete_policy ON macrofamiglie;

CREATE POLICY macrofamiglie_insert_policy ON macrofamiglie
  FOR INSERT WITH CHECK (azienda_id = public.get_user_azienda_id());

CREATE POLICY macrofamiglie_update_policy ON macrofamiglie
  FOR UPDATE USING (azienda_id = public.get_user_azienda_id());

CREATE POLICY macrofamiglie_delete_policy ON macrofamiglie
  FOR DELETE USING (azienda_id = public.get_user_azienda_id());

-- =====================================================
-- FAMIGLIE - Policies semplificate
-- =====================================================

DROP POLICY IF EXISTS famiglie_insert_policy ON famiglie;
DROP POLICY IF EXISTS famiglie_update_policy ON famiglie;
DROP POLICY IF EXISTS famiglie_delete_policy ON famiglie;

CREATE POLICY famiglie_insert_policy ON famiglie
  FOR INSERT WITH CHECK (azienda_id = public.get_user_azienda_id());

CREATE POLICY famiglie_update_policy ON famiglie
  FOR UPDATE USING (azienda_id = public.get_user_azienda_id());

CREATE POLICY famiglie_delete_policy ON famiglie
  FOR DELETE USING (azienda_id = public.get_user_azienda_id());

-- =====================================================
-- FINE MIGRATION
-- =====================================================
