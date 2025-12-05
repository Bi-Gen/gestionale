-- Fix RLS policies per utente_azienda (versione CLEAN con DROP)

-- Drop policies esistenti
DROP POLICY IF EXISTS "utente_azienda_select_policy" ON utente_azienda;
DROP POLICY IF EXISTS "utente_azienda_insert_policy" ON utente_azienda;
DROP POLICY IF EXISTS "utente_azienda_update_policy" ON utente_azienda;
DROP POLICY IF EXISTS "utente_azienda_delete_policy" ON utente_azienda;

-- Abilita RLS
ALTER TABLE utente_azienda ENABLE ROW LEVEL SECURITY;

-- Policy SELECT: utente vede i propri record
CREATE POLICY "utente_azienda_select_policy" ON utente_azienda
FOR SELECT
USING (
  user_id = auth.uid()
  OR
  -- SuperAdmin vede tutto
  EXISTS (
    SELECT 1 FROM superadmin_users
    WHERE user_id = auth.uid() AND attivo = true
  )
);

-- Policy INSERT: solo durante signup o da superadmin/owner
CREATE POLICY "utente_azienda_insert_policy" ON utente_azienda
FOR INSERT
WITH CHECK (
  user_id = auth.uid()  -- Può creare per se stesso
  OR
  -- SuperAdmin può creare per chiunque
  EXISTS (
    SELECT 1 FROM superadmin_users
    WHERE user_id = auth.uid() AND attivo = true
  )
  OR
  -- Owner può invitare nuovi utenti nella propria azienda
  EXISTS (
    SELECT 1 FROM utente_azienda ua
    WHERE ua.user_id = auth.uid()
      AND ua.azienda_id = utente_azienda.azienda_id
      AND ua.ruolo = 'owner'
      AND ua.attivo = true
  )
);

-- Policy UPDATE: utente può modificare solo i propri dati, owner può modificare della propria azienda
CREATE POLICY "utente_azienda_update_policy" ON utente_azienda
FOR UPDATE
USING (
  user_id = auth.uid()
  OR
  -- SuperAdmin può modificare tutto
  EXISTS (
    SELECT 1 FROM superadmin_users
    WHERE user_id = auth.uid() AND attivo = true
  )
  OR
  -- Owner può modificare utenti della propria azienda
  EXISTS (
    SELECT 1 FROM utente_azienda ua
    WHERE ua.user_id = auth.uid()
      AND ua.azienda_id = utente_azienda.azienda_id
      AND ua.ruolo = 'owner'
      AND ua.attivo = true
  )
);

-- Policy DELETE: solo superadmin e owner
CREATE POLICY "utente_azienda_delete_policy" ON utente_azienda
FOR DELETE
USING (
  -- SuperAdmin può eliminare tutto
  EXISTS (
    SELECT 1 FROM superadmin_users
    WHERE user_id = auth.uid() AND attivo = true
  )
  OR
  -- Owner può eliminare utenti della propria azienda
  EXISTS (
    SELECT 1 FROM utente_azienda ua
    WHERE ua.user_id = auth.uid()
      AND ua.azienda_id = utente_azienda.azienda_id
      AND ua.ruolo = 'owner'
      AND ua.attivo = true
  )
);
