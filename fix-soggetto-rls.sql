-- Fix RLS policies su soggetto per funzionare correttamente
-- Problema: le funzioni helper potrebbero avere problemi di contesto
-- Soluzione: usare logica inline invece delle funzioni helper

-- Drop policies esistenti
DROP POLICY IF EXISTS "soggetto_select_policy" ON soggetto;
DROP POLICY IF EXISTS "soggetto_insert_policy" ON soggetto;
DROP POLICY IF EXISTS "soggetto_update_policy" ON soggetto;
DROP POLICY IF EXISTS "soggetto_delete_policy" ON soggetto;

-- Policy SELECT: utente vede soggetti della propria azienda
CREATE POLICY "soggetto_select_policy" ON soggetto
FOR SELECT
USING (
  -- Controlla che l'azienda del soggetto corrisponda all'azienda dell'utente
  azienda_id IN (
    SELECT ua.azienda_id
    FROM utente_azienda ua
    WHERE ua.user_id = auth.uid()
      AND ua.attivo = true
  )
  OR
  -- SuperAdmin vede tutto
  EXISTS (
    SELECT 1 FROM superadmin_users
    WHERE user_id = auth.uid() AND attivo = true
  )
);

-- Policy INSERT: utente con permesso anagrafica/write
CREATE POLICY "soggetto_insert_policy" ON soggetto
FOR INSERT
WITH CHECK (
  -- L'azienda_id deve essere quella dell'utente
  azienda_id IN (
    SELECT ua.azienda_id
    FROM utente_azienda ua
    WHERE ua.user_id = auth.uid()
      AND ua.attivo = true
      -- E deve avere il permesso write su anagrafica
      AND (
        ua.ruolo = 'owner'  -- Owner ha tutti i permessi
        OR (ua.permessi -> 'anagrafica' ->> 'write')::boolean = true
      )
  )
  OR
  -- SuperAdmin può inserire per qualsiasi azienda
  EXISTS (
    SELECT 1 FROM superadmin_users
    WHERE user_id = auth.uid() AND attivo = true
  )
);

-- Policy UPDATE: utente con permesso anagrafica/write sulla propria azienda
CREATE POLICY "soggetto_update_policy" ON soggetto
FOR UPDATE
USING (
  azienda_id IN (
    SELECT ua.azienda_id
    FROM utente_azienda ua
    WHERE ua.user_id = auth.uid()
      AND ua.attivo = true
      AND (
        ua.ruolo = 'owner'
        OR (ua.permessi -> 'anagrafica' ->> 'write')::boolean = true
      )
  )
  OR
  EXISTS (
    SELECT 1 FROM superadmin_users
    WHERE user_id = auth.uid() AND attivo = true
  )
);

-- Policy DELETE: utente con permesso anagrafica/delete
CREATE POLICY "soggetto_delete_policy" ON soggetto
FOR DELETE
USING (
  azienda_id IN (
    SELECT ua.azienda_id
    FROM utente_azienda ua
    WHERE ua.user_id = auth.uid()
      AND ua.attivo = true
      AND (
        ua.ruolo = 'owner'
        OR (ua.permessi -> 'anagrafica' ->> 'delete')::boolean = true
      )
  )
  OR
  EXISTS (
    SELECT 1 FROM superadmin_users
    WHERE user_id = auth.uid() AND attivo = true
  )
);

-- Verifica che RLS sia abilitato
ALTER TABLE soggetto ENABLE ROW LEVEL SECURITY;

COMMENT ON POLICY "soggetto_select_policy" ON soggetto IS
'Utenti vedono solo soggetti della propria azienda. SuperAdmin vede tutto.';

COMMENT ON POLICY "soggetto_insert_policy" ON soggetto IS
'Utenti possono inserire soggetti solo per la propria azienda e solo se hanno permesso anagrafica/write o sono owner.';

COMMENT ON POLICY "soggetto_update_policy" ON soggetto IS
'Utenti possono modificare soggetti solo della propria azienda e solo se hanno permesso anagrafica/write o sono owner.';

COMMENT ON POLICY "soggetto_delete_policy" ON soggetto IS
'Utenti possono eliminare soggetti solo della propria azienda e solo se hanno permesso anagrafica/delete o sono owner.';
