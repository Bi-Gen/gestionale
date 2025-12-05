-- =====================================================
-- MIGRATION: Fix RLS per tabella listino
-- Data: 2025-12-04
-- Descrizione: Aggiunge policies RLS mancanti per listino
-- =====================================================

-- Abilita RLS sulla tabella listino (se non già abilitato)
ALTER TABLE listino ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (per evitare conflitti)
DROP POLICY IF EXISTS listino_select_policy ON listino;
DROP POLICY IF EXISTS listino_insert_policy ON listino;
DROP POLICY IF EXISTS listino_update_policy ON listino;
DROP POLICY IF EXISTS listino_delete_policy ON listino;

-- SELECT: tutti gli utenti dell'azienda possono leggere
CREATE POLICY listino_select_policy ON listino
  FOR SELECT
  USING (azienda_id = public.get_user_azienda_id());

-- INSERT: solo utenti con permesso configurazioni.write
CREATE POLICY listino_insert_policy ON listino
  FOR INSERT
  WITH CHECK (
    azienda_id = public.get_user_azienda_id()
  );

-- UPDATE: solo utenti con permesso configurazioni.write
CREATE POLICY listino_update_policy ON listino
  FOR UPDATE
  USING (azienda_id = public.get_user_azienda_id());

-- DELETE: solo utenti con permesso configurazioni.delete
CREATE POLICY listino_delete_policy ON listino
  FOR DELETE
  USING (azienda_id = public.get_user_azienda_id());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON listino TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE listino_id_seq TO authenticated;
