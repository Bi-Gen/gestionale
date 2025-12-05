-- Verifica e sistema RLS per tabella aliquota_iva

-- 1. Verifica se RLS è abilitata
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'aliquota_iva';

-- 2. Verifica policies esistenti
SELECT policyname, cmd, roles, qual
FROM pg_policies
WHERE tablename = 'aliquota_iva';

-- 3. DROP eventuali policy esistenti (se presenti)
DROP POLICY IF EXISTS "allow_read_aliquota_iva" ON aliquota_iva;
DROP POLICY IF EXISTS "Aliquote IVA read" ON aliquota_iva;
DROP POLICY IF EXISTS "aliquota_iva_select" ON aliquota_iva;

-- 4. CREA policy per permettere lettura a tutti gli utenti autenticati
CREATE POLICY "allow_read_aliquota_iva"
ON aliquota_iva
FOR SELECT
TO authenticated
USING (true);

-- 5. Verifica che la policy sia stata creata
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'aliquota_iva';

-- 6. Test: controlla se ora gli utenti possono leggere
-- (esegui questa query come utente normale per testare)
SELECT id, percentuale, descrizione FROM aliquota_iva LIMIT 3;
