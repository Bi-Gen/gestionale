-- =====================================================
-- MIGRATION: Righe di sistema condivise
-- Data: 2025-12-10
-- Descrizione: Implementa righe di configurazione di sistema
--              visibili a tutti ma non modificabili
-- =====================================================

-- =====================================================
-- STEP 1: Aggiungere colonna di_sistema dove manca
-- =====================================================

-- aliquota_iva
ALTER TABLE aliquota_iva
  ADD COLUMN IF NOT EXISTS di_sistema BOOLEAN DEFAULT false;

-- causale_movimento
ALTER TABLE causale_movimento
  ADD COLUMN IF NOT EXISTS di_sistema BOOLEAN DEFAULT false;

-- metodo_pagamento
ALTER TABLE metodo_pagamento
  ADD COLUMN IF NOT EXISTS di_sistema BOOLEAN DEFAULT false;

-- unita_misura
ALTER TABLE unita_misura
  ADD COLUMN IF NOT EXISTS di_sistema BOOLEAN DEFAULT false;

-- valuta
ALTER TABLE valuta
  ADD COLUMN IF NOT EXISTS di_sistema BOOLEAN DEFAULT false;

-- causale_documento
ALTER TABLE causale_documento
  ADD COLUMN IF NOT EXISTS di_sistema BOOLEAN DEFAULT false;

-- =====================================================
-- STEP 2: Rendere azienda_id nullable
-- =====================================================

-- Prima rimuoviamo i constraint NOT NULL
ALTER TABLE aliquota_iva ALTER COLUMN azienda_id DROP NOT NULL;
ALTER TABLE causale_movimento ALTER COLUMN azienda_id DROP NOT NULL;
ALTER TABLE metodo_pagamento ALTER COLUMN azienda_id DROP NOT NULL;
ALTER TABLE unita_misura ALTER COLUMN azienda_id DROP NOT NULL;
ALTER TABLE valuta ALTER COLUMN azienda_id DROP NOT NULL;
ALTER TABLE causale_documento ALTER COLUMN azienda_id DROP NOT NULL;
ALTER TABLE tipi_soggetto ALTER COLUMN azienda_id DROP NOT NULL;

-- =====================================================
-- STEP 3: Aggiornare i UNIQUE constraint per gestire NULL
-- Usiamo COALESCE con UUID zero per le righe di sistema
-- =====================================================

-- aliquota_iva
ALTER TABLE aliquota_iva DROP CONSTRAINT IF EXISTS aliquota_iva_azienda_id_codice_key;
CREATE UNIQUE INDEX IF NOT EXISTS aliquota_iva_unique_codice
  ON aliquota_iva (COALESCE(azienda_id, '00000000-0000-0000-0000-000000000000'::uuid), codice);

-- causale_movimento
ALTER TABLE causale_movimento DROP CONSTRAINT IF EXISTS causale_movimento_azienda_id_codice_key;
CREATE UNIQUE INDEX IF NOT EXISTS causale_movimento_unique_codice
  ON causale_movimento (COALESCE(azienda_id, '00000000-0000-0000-0000-000000000000'::uuid), codice);

-- metodo_pagamento
ALTER TABLE metodo_pagamento DROP CONSTRAINT IF EXISTS metodo_pagamento_azienda_id_codice_key;
CREATE UNIQUE INDEX IF NOT EXISTS metodo_pagamento_unique_codice
  ON metodo_pagamento (COALESCE(azienda_id, '00000000-0000-0000-0000-000000000000'::uuid), codice);

-- unita_misura
ALTER TABLE unita_misura DROP CONSTRAINT IF EXISTS unita_misura_azienda_id_codice_key;
CREATE UNIQUE INDEX IF NOT EXISTS unita_misura_unique_codice
  ON unita_misura (COALESCE(azienda_id, '00000000-0000-0000-0000-000000000000'::uuid), codice);

-- valuta
ALTER TABLE valuta DROP CONSTRAINT IF EXISTS valuta_azienda_id_codice_key;
CREATE UNIQUE INDEX IF NOT EXISTS valuta_unique_codice
  ON valuta (COALESCE(azienda_id, '00000000-0000-0000-0000-000000000000'::uuid), codice);

-- causale_documento
ALTER TABLE causale_documento DROP CONSTRAINT IF EXISTS causale_documento_azienda_id_codice_key;
CREATE UNIQUE INDEX IF NOT EXISTS causale_documento_unique_codice
  ON causale_documento (COALESCE(azienda_id, '00000000-0000-0000-0000-000000000000'::uuid), codice);

-- tipi_soggetto
ALTER TABLE tipi_soggetto DROP CONSTRAINT IF EXISTS tipi_soggetto_azienda_id_codice_key;
CREATE UNIQUE INDEX IF NOT EXISTS tipi_soggetto_unique_codice
  ON tipi_soggetto (COALESCE(azienda_id, '00000000-0000-0000-0000-000000000000'::uuid), codice);

-- =====================================================
-- STEP 4: Inserire righe di sistema (azienda_id = NULL)
-- =====================================================

-- ALIQUOTE IVA di sistema
INSERT INTO aliquota_iva (azienda_id, codice, descrizione, percentuale, predefinita, attiva, di_sistema) VALUES
  (NULL, 'IVA22', 'IVA ordinaria 22%', 22.00, true, true, true),
  (NULL, 'IVA10', 'IVA ridotta 10%', 10.00, false, true, true),
  (NULL, 'IVA4', 'IVA ridotta 4%', 4.00, false, true, true),
  (NULL, 'IVA5', 'IVA ridotta 5%', 5.00, false, true, true),
  (NULL, 'IVA0', 'Esente IVA art. 10', 0.00, false, true, true),
  (NULL, 'NI', 'Non imponibile', 0.00, false, true, true),
  (NULL, 'ES', 'Escluso IVA art. 15', 0.00, false, true, true),
  (NULL, 'FC', 'Fuori campo IVA', 0.00, false, true, true)
ON CONFLICT DO NOTHING;

-- CAUSALI MOVIMENTO di sistema
INSERT INTO causale_movimento (azienda_id, codice, descrizione, tipo, segno, di_sistema) VALUES
  (NULL, 'ACQ', 'Acquisto da fornitore', 'carico', 1, true),
  (NULL, 'VEN', 'Vendita a cliente', 'scarico', -1, true),
  (NULL, 'RES_CLI', 'Reso da cliente', 'carico', 1, true),
  (NULL, 'RES_FOR', 'Reso a fornitore', 'scarico', -1, true),
  (NULL, 'CAR', 'Carico manuale', 'carico', 1, true),
  (NULL, 'SCA', 'Scarico manuale', 'scarico', -1, true),
  (NULL, 'TRA', 'Trasferimento tra magazzini', 'trasferimento', 0, true),
  (NULL, 'RET_POS', 'Rettifica inventario positiva', 'rettifica', 1, true),
  (NULL, 'RET_NEG', 'Rettifica inventario negativa', 'rettifica', -1, true),
  (NULL, 'INV', 'Inventario', 'inventario', 0, true)
ON CONFLICT DO NOTHING;

-- METODI PAGAMENTO di sistema
INSERT INTO metodo_pagamento (azienda_id, codice, nome, tipo, giorni_scadenza, predefinito, attivo, di_sistema) VALUES
  (NULL, 'CONT', 'Contanti', 'contanti', 0, true, true, true),
  (NULL, 'BON', 'Bonifico bancario', 'bonifico', 0, false, true, true),
  (NULL, 'BON30', 'Bonifico 30 giorni', 'bonifico', 30, false, true, true),
  (NULL, 'BON60', 'Bonifico 60 giorni', 'bonifico', 60, false, true, true),
  (NULL, 'BON90', 'Bonifico 90 giorni', 'bonifico', 90, false, true, true),
  (NULL, 'RIBA30', 'Ri.Ba. 30 giorni', 'rid', 30, false, true, true),
  (NULL, 'RIBA60', 'Ri.Ba. 60 giorni', 'rid', 60, false, true, true),
  (NULL, 'RIBA90', 'Ri.Ba. 90 giorni', 'rid', 90, false, true, true),
  (NULL, 'CARTA', 'Carta di credito', 'carta', 0, false, true, true),
  (NULL, 'ASSEGNO', 'Assegno', 'assegno', 0, false, true, true),
  (NULL, 'PAYPAL', 'PayPal', 'paypal', 0, false, true, true)
ON CONFLICT DO NOTHING;

-- UNITA MISURA di sistema
INSERT INTO unita_misura (azienda_id, codice, nome, tipo, attivo, di_sistema) VALUES
  (NULL, 'PZ', 'Pezzi', 'quantita', true, true),
  (NULL, 'NR', 'Numero', 'quantita', true, true),
  (NULL, 'CF', 'Confezione', 'quantita', true, true),
  (NULL, 'KG', 'Chilogrammi', 'peso', true, true),
  (NULL, 'GR', 'Grammi', 'peso', true, true),
  (NULL, 'QT', 'Quintali', 'peso', true, true),
  (NULL, 'LT', 'Litri', 'volume', true, true),
  (NULL, 'ML', 'Millilitri', 'volume', true, true),
  (NULL, 'MT', 'Metri', 'lunghezza', true, true),
  (NULL, 'CM', 'Centimetri', 'lunghezza', true, true),
  (NULL, 'MQ', 'Metri quadrati', 'superficie', true, true),
  (NULL, 'MC', 'Metri cubi', 'volume', true, true),
  (NULL, 'H', 'Ore', 'tempo', true, true),
  (NULL, 'GG', 'Giorni', 'tempo', true, true)
ON CONFLICT DO NOTHING;

-- VALUTE di sistema
INSERT INTO valuta (azienda_id, codice, nome, simbolo, tasso_cambio, predefinita, attiva, di_sistema) VALUES
  (NULL, 'EUR', 'Euro', '€', 1.0, true, true, true),
  (NULL, 'USD', 'Dollaro USA', '$', 1.05, false, true, true),
  (NULL, 'GBP', 'Sterlina britannica', '£', 0.86, false, true, true),
  (NULL, 'CHF', 'Franco svizzero', 'CHF', 0.94, false, true, true)
ON CONFLICT DO NOTHING;

-- TIPI SOGGETTO di sistema
INSERT INTO tipi_soggetto (azienda_id, codice, nome, descrizione, colore, di_sistema, attivo) VALUES
  (NULL, 'CLI', 'Cliente', 'Clienti e committenti', '#3B82F6', true, true),
  (NULL, 'FOR', 'Fornitore', 'Fornitori di beni e servizi', '#F59E0B', true, true),
  (NULL, 'AGE', 'Agente', 'Agenti e rappresentanti', '#8B5CF6', true, true),
  (NULL, 'TRA', 'Trasportatore', 'Vettori e corrieri', '#10B981', true, true),
  (NULL, 'LEAD', 'Lead', 'Potenziali clienti', '#6B7280', true, true)
ON CONFLICT DO NOTHING;

-- CAUSALI DOCUMENTO di sistema
INSERT INTO causale_documento (azienda_id, codice, descrizione, tipo_documento, tipo_operazione, segno, genera_movimento_magazzino, genera_movimento_contabile, numerazione_separata, attivo, di_sistema) VALUES
  -- Ordini
  (NULL, 'ORD_CLI', 'Ordine cliente', 'ordine', 'vendita', 1, false, false, true, true, true),
  (NULL, 'ORD_FOR', 'Ordine a fornitore', 'ordine', 'acquisto', -1, false, false, true, true, true),
  -- DDT
  (NULL, 'DDT_VEN', 'DDT di vendita', 'bolla', 'vendita', -1, true, false, true, true, true),
  (NULL, 'DDT_ACQ', 'DDT di acquisto', 'bolla', 'acquisto', 1, true, false, true, true, true),
  (NULL, 'DDT_RES_CLI', 'DDT reso da cliente', 'bolla', 'vendita', 1, true, false, true, true, true),
  (NULL, 'DDT_RES_FOR', 'DDT reso a fornitore', 'bolla', 'acquisto', -1, true, false, true, true, true),
  -- Fatture
  (NULL, 'FT_IMM', 'Fattura immediata', 'fattura', 'vendita', -1, true, true, true, true, true),
  (NULL, 'FT_DIFF', 'Fattura differita', 'fattura', 'vendita', -1, false, true, true, true, true),
  (NULL, 'FT_ACC', 'Fattura di acconto', 'fattura', 'vendita', 0, false, true, true, true, true),
  (NULL, 'FT_ACQ', 'Fattura di acquisto', 'fattura', 'acquisto', 1, true, true, true, true, true),
  -- Note di credito
  (NULL, 'NC_VEN', 'Nota di credito a cliente', 'nota_credito', 'vendita', 1, true, true, true, true, true),
  (NULL, 'NC_ACQ', 'Nota di credito da fornitore', 'nota_credito', 'acquisto', -1, true, true, true, true, true),
  -- Preventivi
  (NULL, 'PREV', 'Preventivo', 'preventivo', 'vendita', 0, false, false, true, true, true),
  -- Proforma
  (NULL, 'PROFORMA', 'Fattura proforma', 'proforma', 'vendita', 0, false, false, true, true, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 5: Aggiornare le RLS policies
-- Le righe di sistema (azienda_id IS NULL) sono visibili a tutti
-- ma non modificabili/eliminabili
-- =====================================================

-- ALIQUOTA IVA
DROP POLICY IF EXISTS aliquota_iva_select_policy ON aliquota_iva;
DROP POLICY IF EXISTS aliquota_iva_insert_policy ON aliquota_iva;
DROP POLICY IF EXISTS aliquota_iva_update_policy ON aliquota_iva;
DROP POLICY IF EXISTS aliquota_iva_delete_policy ON aliquota_iva;

CREATE POLICY aliquota_iva_select_policy ON aliquota_iva FOR SELECT
  USING (azienda_id IS NULL OR azienda_id = public.get_user_azienda_id());

CREATE POLICY aliquota_iva_insert_policy ON aliquota_iva FOR INSERT
  WITH CHECK (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('configurazioni', 'write')
  );

CREATE POLICY aliquota_iva_update_policy ON aliquota_iva FOR UPDATE
  USING (
    azienda_id = public.get_user_azienda_id()
    AND di_sistema = false
    AND public.user_has_permission('configurazioni', 'write')
  );

CREATE POLICY aliquota_iva_delete_policy ON aliquota_iva FOR DELETE
  USING (
    azienda_id = public.get_user_azienda_id()
    AND di_sistema = false
    AND public.user_has_permission('configurazioni', 'delete')
  );

-- CAUSALE MOVIMENTO
DROP POLICY IF EXISTS causale_movimento_select_policy ON causale_movimento;
DROP POLICY IF EXISTS causale_movimento_insert_policy ON causale_movimento;
DROP POLICY IF EXISTS causale_movimento_update_policy ON causale_movimento;
DROP POLICY IF EXISTS causale_movimento_delete_policy ON causale_movimento;

CREATE POLICY causale_movimento_select_policy ON causale_movimento FOR SELECT
  USING (azienda_id IS NULL OR azienda_id = public.get_user_azienda_id());

CREATE POLICY causale_movimento_insert_policy ON causale_movimento FOR INSERT
  WITH CHECK (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('configurazioni', 'write')
  );

CREATE POLICY causale_movimento_update_policy ON causale_movimento FOR UPDATE
  USING (
    azienda_id = public.get_user_azienda_id()
    AND di_sistema = false
    AND public.user_has_permission('configurazioni', 'write')
  );

CREATE POLICY causale_movimento_delete_policy ON causale_movimento FOR DELETE
  USING (
    azienda_id = public.get_user_azienda_id()
    AND di_sistema = false
    AND public.user_has_permission('configurazioni', 'delete')
  );

-- METODO PAGAMENTO
DROP POLICY IF EXISTS metodo_pagamento_select_policy ON metodo_pagamento;
DROP POLICY IF EXISTS metodo_pagamento_insert_policy ON metodo_pagamento;
DROP POLICY IF EXISTS metodo_pagamento_update_policy ON metodo_pagamento;
DROP POLICY IF EXISTS metodo_pagamento_delete_policy ON metodo_pagamento;

CREATE POLICY metodo_pagamento_select_policy ON metodo_pagamento FOR SELECT
  USING (azienda_id IS NULL OR azienda_id = public.get_user_azienda_id());

CREATE POLICY metodo_pagamento_insert_policy ON metodo_pagamento FOR INSERT
  WITH CHECK (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('configurazioni', 'write')
  );

CREATE POLICY metodo_pagamento_update_policy ON metodo_pagamento FOR UPDATE
  USING (
    azienda_id = public.get_user_azienda_id()
    AND di_sistema = false
    AND public.user_has_permission('configurazioni', 'write')
  );

CREATE POLICY metodo_pagamento_delete_policy ON metodo_pagamento FOR DELETE
  USING (
    azienda_id = public.get_user_azienda_id()
    AND di_sistema = false
    AND public.user_has_permission('configurazioni', 'delete')
  );

-- UNITA MISURA
DROP POLICY IF EXISTS unita_misura_select_policy ON unita_misura;
DROP POLICY IF EXISTS unita_misura_insert_policy ON unita_misura;
DROP POLICY IF EXISTS unita_misura_update_policy ON unita_misura;
DROP POLICY IF EXISTS unita_misura_delete_policy ON unita_misura;

CREATE POLICY unita_misura_select_policy ON unita_misura FOR SELECT
  USING (azienda_id IS NULL OR azienda_id = public.get_user_azienda_id());

CREATE POLICY unita_misura_insert_policy ON unita_misura FOR INSERT
  WITH CHECK (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('configurazioni', 'write')
  );

CREATE POLICY unita_misura_update_policy ON unita_misura FOR UPDATE
  USING (
    azienda_id = public.get_user_azienda_id()
    AND di_sistema = false
    AND public.user_has_permission('configurazioni', 'write')
  );

CREATE POLICY unita_misura_delete_policy ON unita_misura FOR DELETE
  USING (
    azienda_id = public.get_user_azienda_id()
    AND di_sistema = false
    AND public.user_has_permission('configurazioni', 'delete')
  );

-- VALUTA
DROP POLICY IF EXISTS valuta_select_policy ON valuta;
DROP POLICY IF EXISTS valuta_insert_policy ON valuta;
DROP POLICY IF EXISTS valuta_update_policy ON valuta;
DROP POLICY IF EXISTS valuta_delete_policy ON valuta;

CREATE POLICY valuta_select_policy ON valuta FOR SELECT
  USING (azienda_id IS NULL OR azienda_id = public.get_user_azienda_id());

CREATE POLICY valuta_insert_policy ON valuta FOR INSERT
  WITH CHECK (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('configurazioni', 'write')
  );

CREATE POLICY valuta_update_policy ON valuta FOR UPDATE
  USING (
    azienda_id = public.get_user_azienda_id()
    AND di_sistema = false
    AND public.user_has_permission('configurazioni', 'write')
  );

CREATE POLICY valuta_delete_policy ON valuta FOR DELETE
  USING (
    azienda_id = public.get_user_azienda_id()
    AND di_sistema = false
    AND public.user_has_permission('configurazioni', 'delete')
  );

-- TIPI SOGGETTO
DROP POLICY IF EXISTS tipi_soggetto_select_policy ON tipi_soggetto;
DROP POLICY IF EXISTS tipi_soggetto_insert_policy ON tipi_soggetto;
DROP POLICY IF EXISTS tipi_soggetto_update_policy ON tipi_soggetto;
DROP POLICY IF EXISTS tipi_soggetto_delete_policy ON tipi_soggetto;

CREATE POLICY tipi_soggetto_select_policy ON tipi_soggetto FOR SELECT
  USING (azienda_id IS NULL OR azienda_id = public.get_user_azienda_id());

CREATE POLICY tipi_soggetto_insert_policy ON tipi_soggetto FOR INSERT
  WITH CHECK (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('configurazioni', 'write')
  );

CREATE POLICY tipi_soggetto_update_policy ON tipi_soggetto FOR UPDATE
  USING (
    azienda_id = public.get_user_azienda_id()
    AND di_sistema = false
    AND public.user_has_permission('configurazioni', 'write')
  );

CREATE POLICY tipi_soggetto_delete_policy ON tipi_soggetto FOR DELETE
  USING (
    azienda_id = public.get_user_azienda_id()
    AND di_sistema = false
    AND public.user_has_permission('configurazioni', 'delete')
  );

-- CAUSALE DOCUMENTO
DROP POLICY IF EXISTS causale_documento_select_policy ON causale_documento;
DROP POLICY IF EXISTS causale_documento_insert_policy ON causale_documento;
DROP POLICY IF EXISTS causale_documento_update_policy ON causale_documento;
DROP POLICY IF EXISTS causale_documento_delete_policy ON causale_documento;

CREATE POLICY causale_documento_select_policy ON causale_documento FOR SELECT
  USING (azienda_id IS NULL OR azienda_id = public.get_user_azienda_id());

CREATE POLICY causale_documento_insert_policy ON causale_documento FOR INSERT
  WITH CHECK (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('configurazioni', 'write')
  );

CREATE POLICY causale_documento_update_policy ON causale_documento FOR UPDATE
  USING (
    azienda_id = public.get_user_azienda_id()
    AND di_sistema = false
    AND public.user_has_permission('configurazioni', 'write')
  );

CREATE POLICY causale_documento_delete_policy ON causale_documento FOR DELETE
  USING (
    azienda_id = public.get_user_azienda_id()
    AND di_sistema = false
    AND public.user_has_permission('configurazioni', 'delete')
  );

-- =====================================================
-- STEP 6: Grant permissions per INSERT/UPDATE/DELETE
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON aliquota_iva TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON causale_movimento TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON metodo_pagamento TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON unita_misura TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON valuta TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON causale_documento TO authenticated;

-- =====================================================
-- STEP 7: Rimuovere i trigger auto-seed (non più necessari)
-- =====================================================

DROP TRIGGER IF EXISTS trigger_auto_seed_aliquote_iva ON azienda;
DROP TRIGGER IF EXISTS trigger_auto_seed_causali_movimento ON azienda;
DROP TRIGGER IF EXISTS trigger_auto_seed_metodi_pagamento ON azienda;
DROP TRIGGER IF EXISTS trigger_auto_seed_tipi_soggetto ON azienda;
DROP TRIGGER IF EXISTS trigger_auto_seed_causali_documento ON azienda;

DROP FUNCTION IF EXISTS auto_seed_aliquote_iva();
DROP FUNCTION IF EXISTS auto_seed_causali_movimento();
DROP FUNCTION IF EXISTS auto_seed_metodi_pagamento();
DROP FUNCTION IF EXISTS auto_seed_tipi_soggetto();
DROP FUNCTION IF EXISTS auto_seed_causali_documento();

-- =====================================================
-- STEP 8: Pulizia dati duplicati per azienda
-- Rimuove le righe specifiche per azienda che sono duplicate
-- delle righe di sistema (opzionale - esegui solo se vuoi pulire)
-- =====================================================

-- Commentato per sicurezza - decommenta se vuoi pulire i duplicati
/*
DELETE FROM aliquota_iva WHERE azienda_id IS NOT NULL AND codice IN (
  SELECT codice FROM aliquota_iva WHERE azienda_id IS NULL
);

DELETE FROM causale_movimento WHERE azienda_id IS NOT NULL AND codice IN (
  SELECT codice FROM causale_movimento WHERE azienda_id IS NULL
);

DELETE FROM metodo_pagamento WHERE azienda_id IS NOT NULL AND codice IN (
  SELECT codice FROM metodo_pagamento WHERE azienda_id IS NULL
);

DELETE FROM unita_misura WHERE azienda_id IS NOT NULL AND codice IN (
  SELECT codice FROM unita_misura WHERE azienda_id IS NULL
);

DELETE FROM valuta WHERE azienda_id IS NOT NULL AND codice IN (
  SELECT codice FROM valuta WHERE azienda_id IS NULL
);

DELETE FROM tipi_soggetto WHERE azienda_id IS NOT NULL AND codice IN (
  SELECT codice FROM tipi_soggetto WHERE azienda_id IS NULL
);

DELETE FROM causale_documento WHERE azienda_id IS NOT NULL AND codice IN (
  SELECT codice FROM causale_documento WHERE azienda_id IS NULL
);
*/

-- =====================================================
-- FINE MIGRATION
-- =====================================================
