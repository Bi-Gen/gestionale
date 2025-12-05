-- =====================================================
-- MIGRATION: Fix RLS Policies e Auto-Seed
-- Data: 2025-11-28
-- Descrizione: Aggiungi RLS policies mancanti e trigger auto-seed
-- =====================================================

-- =====================================================
-- RLS POLICIES per utente_azienda
-- =====================================================

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

COMMENT ON POLICY "utente_azienda_select_policy" ON utente_azienda IS
'Utente vede solo i propri record utente_azienda. SuperAdmin vede tutto.';

-- =====================================================
-- TRIGGER AUTO-SEED: Magazzino Principale
-- =====================================================

CREATE OR REPLACE FUNCTION auto_seed_magazzino()
RETURNS TRIGGER AS $$
BEGIN
  -- Crea magazzino principale per nuova azienda
  INSERT INTO magazzino (azienda_id, codice, nome, principale, attivo)
  VALUES (NEW.id, 'MAG-PRINC', 'Magazzino Principale', true, true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_seed_magazzino ON azienda;

CREATE TRIGGER trigger_auto_seed_magazzino
AFTER INSERT ON azienda
FOR EACH ROW
EXECUTE FUNCTION auto_seed_magazzino();

COMMENT ON FUNCTION auto_seed_magazzino() IS
'Crea automaticamente il magazzino principale quando viene creata una nuova azienda';

-- =====================================================
-- TRIGGER AUTO-SEED: Aliquote IVA Italiane
-- =====================================================

CREATE OR REPLACE FUNCTION auto_seed_aliquote_iva()
RETURNS TRIGGER AS $$
BEGIN
  -- Crea aliquote IVA standard italiane
  INSERT INTO aliquota_iva (azienda_id, codice, descrizione, percentuale, tipo, attivo) VALUES
    (NEW.id, 'IVA22', 'IVA Ordinaria 22%', 22.00, 'ordinaria', true),
    (NEW.id, 'IVA10', 'IVA Ridotta 10%', 10.00, 'ridotta', true),
    (NEW.id, 'IVA4', 'IVA Minima 4%', 4.00, 'minima', true),
    (NEW.id, 'IVA0', 'IVA Esente 0%', 0.00, 'esente', true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_seed_aliquote_iva ON azienda;

CREATE TRIGGER trigger_auto_seed_aliquote_iva
AFTER INSERT ON azienda
FOR EACH ROW
EXECUTE FUNCTION auto_seed_aliquote_iva();

COMMENT ON FUNCTION auto_seed_aliquote_iva() IS
'Crea automaticamente le aliquote IVA italiane standard quando viene creata una nuova azienda';

-- =====================================================
-- TRIGGER AUTO-SEED: Causali Movimento
-- =====================================================

CREATE OR REPLACE FUNCTION auto_seed_causali_movimento()
RETURNS TRIGGER AS $$
BEGIN
  -- Crea causali movimento standard
  INSERT INTO causale_movimento (azienda_id, codice, descrizione, tipo, impatto_giacenza, attivo) VALUES
    (NEW.id, 'CAR', 'Carico Merce', 'carico', 1, true),
    (NEW.id, 'SCA', 'Scarico Merce', 'scarico', -1, true),
    (NEW.id, 'VEN', 'Vendita', 'scarico', -1, true),
    (NEW.id, 'ACQ', 'Acquisto', 'carico', 1, true),
    (NEW.id, 'RES', 'Reso da Cliente', 'carico', 1, true),
    (NEW.id, 'RESF', 'Reso a Fornitore', 'scarico', -1, true),
    (NEW.id, 'TRAS', 'Trasferimento', 'neutro', 0, true),
    (NEW.id, 'RETT+', 'Rettifica Positiva', 'carico', 1, true),
    (NEW.id, 'RETT-', 'Rettifica Negativa', 'scarico', -1, true);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_seed_causali_movimento ON azienda;

CREATE TRIGGER trigger_auto_seed_causali_movimento
AFTER INSERT ON azienda
FOR EACH ROW
EXECUTE FUNCTION auto_seed_causali_movimento();

COMMENT ON FUNCTION auto_seed_causali_movimento() IS
'Crea automaticamente le causali movimento standard quando viene creata una nuova azienda';

-- =====================================================
-- TRIGGER: Aggiorna features_abilitate in base al piano
-- =====================================================

CREATE OR REPLACE FUNCTION update_features_by_piano()
RETURNS TRIGGER AS $$
BEGIN
  -- Aggiorna feature flags in base al piano scelto
  IF NEW.piano = 'light' THEN
    NEW.features_abilitate := jsonb_build_object(
      'magazzini_multipli', false,
      'contabilita', false,
      'analytics_avanzati', false,
      'api_access', false,
      'multi_listini', false,
      'provvigioni', false,
      'scadenzario', false,
      'budget', false,
      'time_intelligence', false,
      'export_excel', true,
      'pdf_custom', false,
      'sso', false,
      'priority_support', false,
      'custom_reports', false,
      'white_label', false
    );
    NEW.max_utenti := 1;
    NEW.max_prodotti := 100;
    NEW.max_clienti := 50;

  ELSIF NEW.piano = 'premium' THEN
    NEW.features_abilitate := jsonb_build_object(
      'magazzini_multipli', true,
      'contabilita', true,
      'analytics_avanzati', true,
      'api_access', false,
      'multi_listini', true,
      'provvigioni', true,
      'scadenzario', true,
      'budget', true,
      'time_intelligence', true,
      'export_excel', true,
      'pdf_custom', false,
      'sso', false,
      'priority_support', false,
      'custom_reports', false,
      'white_label', false
    );
    NEW.max_utenti := 5;
    NEW.max_prodotti := 1000;
    NEW.max_clienti := 500;

  ELSIF NEW.piano = 'enterprise' THEN
    NEW.features_abilitate := jsonb_build_object(
      'magazzini_multipli', true,
      'contabilita', true,
      'analytics_avanzati', true,
      'api_access', true,
      'multi_listini', true,
      'provvigioni', true,
      'scadenzario', true,
      'budget', true,
      'time_intelligence', true,
      'export_excel', true,
      'pdf_custom', true,
      'sso', true,
      'priority_support', true,
      'custom_reports', true,
      'white_label', true
    );
    NEW.max_utenti := -1;  -- Illimitati
    NEW.max_prodotti := -1;
    NEW.max_clienti := -1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_features_by_piano ON azienda;

CREATE TRIGGER trigger_update_features_by_piano
BEFORE INSERT OR UPDATE OF piano ON azienda
FOR EACH ROW
EXECUTE FUNCTION update_features_by_piano();

COMMENT ON FUNCTION update_features_by_piano() IS
'Aggiorna automaticamente features_abilitate e limiti quando cambia il piano azienda';

-- =====================================================
-- APPLICA AUTO-SEED ALLE AZIENDE ESISTENTI (BACKFILL)
-- =====================================================

-- Nota: questo backfill serve per le aziende già create durante i test
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id FROM azienda LOOP
    -- Crea magazzino se non esiste
    INSERT INTO magazzino (azienda_id, codice, nome, principale, attivo)
    SELECT r.id, 'MAG-PRINC', 'Magazzino Principale', true, true
    WHERE NOT EXISTS (
      SELECT 1 FROM magazzino WHERE azienda_id = r.id AND principale = true
    );

    -- Crea aliquote IVA se non esistono
    INSERT INTO aliquota_iva (azienda_id, codice, descrizione, percentuale, tipo, attivo)
    SELECT r.id, 'IVA22', 'IVA Ordinaria 22%', 22.00, 'ordinaria', true
    WHERE NOT EXISTS (SELECT 1 FROM aliquota_iva WHERE azienda_id = r.id AND codice = 'IVA22')
    UNION ALL
    SELECT r.id, 'IVA10', 'IVA Ridotta 10%', 10.00, 'ridotta', true
    WHERE NOT EXISTS (SELECT 1 FROM aliquota_iva WHERE azienda_id = r.id AND codice = 'IVA10')
    UNION ALL
    SELECT r.id, 'IVA4', 'IVA Minima 4%', 4.00, 'minima', true
    WHERE NOT EXISTS (SELECT 1 FROM aliquota_iva WHERE azienda_id = r.id AND codice = 'IVA4')
    UNION ALL
    SELECT r.id, 'IVA0', 'IVA Esente 0%', 0.00, 'esente', true
    WHERE NOT EXISTS (SELECT 1 FROM aliquota_iva WHERE azienda_id = r.id AND codice = 'IVA0');

    -- Crea causali se non esistono
    INSERT INTO causale_movimento (azienda_id, codice, descrizione, tipo, impatto_giacenza, attivo)
    SELECT r.id, 'CAR', 'Carico Merce', 'carico', 1, true
    WHERE NOT EXISTS (SELECT 1 FROM causale_movimento WHERE azienda_id = r.id AND codice = 'CAR')
    UNION ALL
    SELECT r.id, 'SCA', 'Scarico Merce', 'scarico', -1, true
    WHERE NOT EXISTS (SELECT 1 FROM causale_movimento WHERE azienda_id = r.id AND codice = 'SCA')
    UNION ALL
    SELECT r.id, 'VEN', 'Vendita', 'scarico', -1, true
    WHERE NOT EXISTS (SELECT 1 FROM causale_movimento WHERE azienda_id = r.id AND codice = 'VEN')
    UNION ALL
    SELECT r.id, 'ACQ', 'Acquisto', 'carico', 1, true
    WHERE NOT EXISTS (SELECT 1 FROM causale_movimento WHERE azienda_id = r.id AND codice = 'ACQ')
    UNION ALL
    SELECT r.id, 'RES', 'Reso da Cliente', 'carico', 1, true
    WHERE NOT EXISTS (SELECT 1 FROM causale_movimento WHERE azienda_id = r.id AND codice = 'RES')
    UNION ALL
    SELECT r.id, 'RESF', 'Reso a Fornitore', 'scarico', -1, true
    WHERE NOT EXISTS (SELECT 1 FROM causale_movimento WHERE azienda_id = r.id AND codice = 'RESF')
    UNION ALL
    SELECT r.id, 'TRAS', 'Trasferimento', 'neutro', 0, true
    WHERE NOT EXISTS (SELECT 1 FROM causale_movimento WHERE azienda_id = r.id AND codice = 'TRAS')
    UNION ALL
    SELECT r.id, 'RETT+', 'Rettifica Positiva', 'carico', 1, true
    WHERE NOT EXISTS (SELECT 1 FROM causale_movimento WHERE azienda_id = r.id AND codice = 'RETT+')
    UNION ALL
    SELECT r.id, 'RETT-', 'Rettifica Negativa', 'scarico', -1, true
    WHERE NOT EXISTS (SELECT 1 FROM causale_movimento WHERE azienda_id = r.id AND codice = 'RETT-');
  END LOOP;
END $$;
