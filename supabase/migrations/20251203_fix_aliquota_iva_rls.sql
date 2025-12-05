-- Fix RLS policy per aliquota_iva
-- La tabella aliquota_iva è una tabella di configurazione globale (non ha azienda_id)
-- Deve essere leggibile da tutti gli utenti autenticati

-- Drop policy errata
DROP POLICY IF EXISTS aliquota_iva_select_policy ON aliquota_iva;
DROP POLICY IF EXISTS aliquota_iva_insert_policy ON aliquota_iva;
DROP POLICY IF EXISTS aliquota_iva_update_policy ON aliquota_iva;

-- Crea policy corrette: lettura per tutti, scrittura solo per superadmin
CREATE POLICY aliquota_iva_select_policy ON aliquota_iva
  FOR SELECT
  TO authenticated
  USING (true);  -- Tutti possono leggere

CREATE POLICY aliquota_iva_insert_policy ON aliquota_iva
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_superadmin());  -- Solo superadmin può inserire

CREATE POLICY aliquota_iva_update_policy ON aliquota_iva
  FOR UPDATE
  TO authenticated
  USING (public.is_superadmin())
  WITH CHECK (public.is_superadmin());  -- Solo superadmin può modificare

-- Stesso fix per altre tabelle di configurazione globali che esistono
-- causale_documento
DROP POLICY IF EXISTS causale_documento_select_policy ON causale_documento;
CREATE POLICY causale_documento_select_policy ON causale_documento
  FOR SELECT
  TO authenticated
  USING (true);

-- valuta
DROP POLICY IF EXISTS valuta_select_policy ON valuta;
CREATE POLICY valuta_select_policy ON valuta
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON POLICY aliquota_iva_select_policy ON aliquota_iva IS
'Le aliquote IVA sono configurazioni globali leggibili da tutti gli utenti autenticati';
