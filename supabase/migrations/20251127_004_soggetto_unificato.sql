-- =====================================================
-- MIGRATION: Tabella Soggetto Unificata
-- Data: 2025-11-27
-- Descrizione: Unifica clienti + fornitori in soggetto
-- =====================================================

-- =====================================================
-- ESTENSIONI NECESSARIE
-- =====================================================

-- Abilita estensione pg_trgm per ricerca full-text
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =====================================================
-- TABELLA: soggetto (clienti + fornitori unificati)
-- =====================================================

CREATE TABLE IF NOT EXISTS soggetto (
  id SERIAL PRIMARY KEY,
  azienda_id UUID NOT NULL REFERENCES azienda(id) ON DELETE CASCADE,

  -- Tipo soggetto (può essere cliente, fornitore, o entrambi)
  tipo TEXT[] NOT NULL DEFAULT ARRAY['cliente']::TEXT[],
  -- es: ['cliente'], ['fornitore'], o ['cliente', 'fornitore']

  -- === ANAGRAFICA BASE ===
  tipo_persona VARCHAR(20) DEFAULT 'giuridica' CHECK (tipo_persona IN ('fisica', 'giuridica')),
  ragione_sociale VARCHAR(255) NOT NULL,  -- Obbligatorio per tutti
  nome VARCHAR(100),  -- Per persone fisiche
  cognome VARCHAR(100),  -- Per persone fisiche

  -- === DATI FISCALI ===
  partita_iva VARCHAR(11),
  codice_fiscale VARCHAR(16),
  codice_univoco VARCHAR(7),  -- SDI per fatturazione elettronica (7 caratteri)
  pec VARCHAR(255),  -- Email PEC certificata

  -- === INDIRIZZO PRINCIPALE ===
  indirizzo VARCHAR(255),
  civico VARCHAR(10),
  cap VARCHAR(5),
  citta VARCHAR(100),
  provincia VARCHAR(2),
  paese VARCHAR(2) DEFAULT 'IT',  -- Codice ISO paese

  -- Riferimenti geografici (se abbiamo tabelle comuni)
  -- comune_id INT REFERENCES comune(id),  -- Da aggiungere in futuro

  -- === CONTATTI ===
  telefono VARCHAR(50),
  cellulare VARCHAR(50),
  fax VARCHAR(50),
  email VARCHAR(255),
  sito_web VARCHAR(255),

  -- === RIFERIMENTI ===
  referente VARCHAR(255),  -- Nome referente principale
  referente_telefono VARCHAR(50),
  referente_email VARCHAR(255),

  -- === DATI COMMERCIALI (per clienti) ===
  categoria_cliente VARCHAR(50),  -- es: 'retail', 'wholesale', 'vip'
  listino_id INT,  -- REFERENCES listino(id) - da creare dopo
  zona_vendita VARCHAR(50),
  agente_id INT,  -- REFERENCES utente_azienda(id) - agente assegnato
  sconto_percentuale DECIMAL(5,2) DEFAULT 0.00,  -- Sconto fisso %
  fido_massimo DECIMAL(12,2) DEFAULT 0.00,  -- Fido cliente (limite credito)
  fido_utilizzato DECIMAL(12,2) DEFAULT 0.00,  -- Quanto del fido è utilizzato

  -- === DATI PAGAMENTO (per clienti) ===
  pagamento_id INT,  -- REFERENCES pagamento(id) - termini pagamento
  giorni_pagamento INT DEFAULT 30,  -- Giorni dilazione pagamento
  banca VARCHAR(255),
  iban VARCHAR(34),  -- IBAN max 34 caratteri
  swift_bic VARCHAR(11),

  -- === DATI COMMERCIALI (per fornitori) ===
  categoria_fornitore VARCHAR(50),  -- es: 'materie_prime', 'servizi', 'trasporti'
  giorni_consegna INT,  -- Tempo medio consegna
  sconto_fornitore DECIMAL(5,2) DEFAULT 0.00,  -- Sconto ottenuto da fornitore

  -- === NOTE E ALLEGATI ===
  note TEXT,
  allegati JSONB,  -- Array di file allegati (contratti, documenti, etc)

  -- === FLAGS ===
  attivo BOOLEAN DEFAULT true,
  privato BOOLEAN DEFAULT false,  -- Se visibile solo a chi lo ha creato
  da_fatturare BOOLEAN DEFAULT true,  -- Se compare in fatture
  soggetto_gruppo BOOLEAN DEFAULT false,  -- Se è un gruppo/holding

  -- === STATISTICHE (calcolate) ===
  totale_acquistato DECIMAL(12,2) DEFAULT 0.00,  -- Totale storico acquisti cliente
  totale_venduto DECIMAL(12,2) DEFAULT 0.00,  -- Totale storico vendite a cliente
  ultima_transazione DATE,
  num_transazioni INT DEFAULT 0,

  -- === METADATA ===
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDICI per performance
-- =====================================================

-- Indice multi-tenancy (CRITICAL)
CREATE INDEX idx_soggetto_azienda_id ON soggetto(azienda_id);

-- Indice tipo (per filtrare clienti/fornitori)
CREATE INDEX idx_soggetto_tipo ON soggetto USING GIN(tipo);

-- Indici per ricerca anagrafica
CREATE INDEX idx_soggetto_ragione_sociale ON soggetto(ragione_sociale);
CREATE INDEX idx_soggetto_ragione_sociale_trgm ON soggetto USING gin(ragione_sociale gin_trgm_ops);

-- Indici per dati fiscali (ricerche frequenti)
CREATE INDEX idx_soggetto_partita_iva ON soggetto(partita_iva) WHERE partita_iva IS NOT NULL;
CREATE INDEX idx_soggetto_codice_fiscale ON soggetto(codice_fiscale) WHERE codice_fiscale IS NOT NULL;

-- Indici per località
CREATE INDEX idx_soggetto_citta ON soggetto(citta);
CREATE INDEX idx_soggetto_provincia ON soggetto(provincia);

-- Indice attivo (per escludere soggetti disattivati)
CREATE INDEX idx_soggetto_attivo ON soggetto(attivo) WHERE attivo = true;

-- Indice per categoria cliente (reporting)
CREATE INDEX idx_soggetto_categoria_cliente ON soggetto(categoria_cliente) WHERE 'cliente' = ANY(tipo);

-- =====================================================
-- CONSTRAINT per dati fiscali
-- =====================================================

-- Almeno partita_iva O codice_fiscale deve essere presente
ALTER TABLE soggetto ADD CONSTRAINT chk_soggetto_fiscal_code
  CHECK (partita_iva IS NOT NULL OR codice_fiscale IS NOT NULL OR tipo_persona = 'fisica');

-- Partita IVA: esattamente 11 cifre
ALTER TABLE soggetto ADD CONSTRAINT chk_soggetto_partita_iva
  CHECK (partita_iva IS NULL OR partita_iva ~ '^\d{11}$');

-- Codice Fiscale: formato standard italiano
ALTER TABLE soggetto ADD CONSTRAINT chk_soggetto_codice_fiscale
  CHECK (codice_fiscale IS NULL OR codice_fiscale ~ '^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$');

-- CAP: 5 cifre
ALTER TABLE soggetto ADD CONSTRAINT chk_soggetto_cap
  CHECK (cap IS NULL OR cap ~ '^\d{5}$');

-- Provincia: 2 lettere
ALTER TABLE soggetto ADD CONSTRAINT chk_soggetto_provincia
  CHECK (provincia IS NULL OR provincia ~ '^[A-Z]{2}$');

-- Email formato valido
ALTER TABLE soggetto ADD CONSTRAINT chk_soggetto_email
  CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Tipo deve contenere almeno 'cliente' o 'fornitore'
ALTER TABLE soggetto ADD CONSTRAINT chk_soggetto_tipo
  CHECK ('cliente' = ANY(tipo) OR 'fornitore' = ANY(tipo));

-- =====================================================
-- TRIGGER per updated_at
-- =====================================================

CREATE TRIGGER trg_soggetto_updated_at
  BEFORE UPDATE ON soggetto
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNZIONE: Aggiorna statistiche soggetto
-- =====================================================

CREATE OR REPLACE FUNCTION aggiorna_statistiche_soggetto()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Questa funzione sarà implementata quando avremo la tabella movimenti
  -- Per ora è un placeholder
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION aggiorna_statistiche_soggetto() IS
'Aggiorna le statistiche di un soggetto quando viene creata/modificata una transazione.
Calcola: totale_acquistato, totale_venduto, ultima_transazione, num_transazioni.';

-- =====================================================
-- COMMENTI
-- =====================================================

COMMENT ON TABLE soggetto IS
'Tabella unificata per clienti e fornitori (soggetti).
Un soggetto può essere cliente, fornitore, o entrambi.
Usa tipo = ARRAY[''cliente''] o ARRAY[''fornitore''] o ARRAY[''cliente'', ''fornitore''].';

COMMENT ON COLUMN soggetto.tipo IS
'Array che indica se è cliente, fornitore, o entrambi.
Esempi: {cliente}, {fornitore}, {cliente,fornitore}';

COMMENT ON COLUMN soggetto.codice_univoco IS
'Codice Univoco per Sistema Di Interscambio (SDI) - 7 caratteri alfanumerici.
Obbligatorio per fatturazione elettronica B2B.';

COMMENT ON COLUMN soggetto.fido_massimo IS
'Limite massimo di credito concesso al cliente (in euro).
Se fido_utilizzato >= fido_massimo, bloccare nuovi ordini.';

-- =====================================================
-- MIGRAZIONE DATI: clienti → soggetto
-- =====================================================

-- Verifica se esiste la tabella clienti e se ha azienda_id
DO $$
DECLARE
  v_has_azienda_id BOOLEAN;
  v_first_azienda_id UUID;
  v_migrated_count INT;
BEGIN
  -- Controlla se esiste la tabella clienti
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clienti') THEN

    -- Controlla se clienti ha la colonna azienda_id
    SELECT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'clienti' AND column_name = 'azienda_id'
    ) INTO v_has_azienda_id;

    IF v_has_azienda_id THEN
      -- Caso 1: clienti ha già azienda_id, migrazione diretta
      INSERT INTO soggetto (
        azienda_id,
        tipo,
        ragione_sociale,
        partita_iva,
        codice_fiscale,
        email,
        telefono,
        indirizzo,
        citta,
        cap,
        provincia,
        note,
        attivo,
        created_at,
        updated_at
      )
      SELECT
        azienda_id,
        ARRAY['cliente']::TEXT[],
        ragione_sociale,
        partita_iva,
        codice_fiscale,
        email,
        telefono,
        indirizzo,
        citta,
        cap,
        provincia,
        note,
        COALESCE(attivo, true),
        COALESCE(created_at, NOW()),
        COALESCE(updated_at, NOW())
      FROM clienti
      ON CONFLICT DO NOTHING;

      GET DIAGNOSTICS v_migrated_count = ROW_COUNT;
      RAISE NOTICE 'Migrati % clienti → soggetto (con azienda_id)', v_migrated_count;
    ELSE
      -- Caso 2: clienti NON ha azienda_id, usa la prima azienda disponibile
      SELECT id INTO v_first_azienda_id FROM azienda ORDER BY created_at LIMIT 1;

      IF v_first_azienda_id IS NOT NULL THEN
        INSERT INTO soggetto (
          azienda_id,
          tipo,
          ragione_sociale,
          partita_iva,
          codice_fiscale,
          email,
          telefono,
          indirizzo,
          citta,
          cap,
          provincia,
          note,
          attivo,
          created_at,
          updated_at
        )
        SELECT
          v_first_azienda_id,  -- Usa prima azienda disponibile
          ARRAY['cliente']::TEXT[],
          ragione_sociale,
          partita_iva,
          codice_fiscale,
          email,
          telefono,
          indirizzo,
          citta,
          cap,
          provincia,
          note,
          COALESCE(attivo, true),
          COALESCE(created_at, NOW()),
          COALESCE(updated_at, NOW())
        FROM clienti
        ON CONFLICT DO NOTHING;

        GET DIAGNOSTICS v_migrated_count = ROW_COUNT;
        RAISE NOTICE 'Migrati % clienti → soggetto (usando azienda_id: %)', v_migrated_count, v_first_azienda_id;
      ELSE
        RAISE NOTICE 'Nessuna azienda trovata, impossibile migrare clienti';
      END IF;
    END IF;
  ELSE
    RAISE NOTICE 'Tabella clienti non esiste, skip migrazione';
  END IF;
END $$;

-- =====================================================
-- MIGRAZIONE DATI: fornitori → soggetto
-- =====================================================

DO $$
DECLARE
  v_has_azienda_id BOOLEAN;
  v_first_azienda_id UUID;
  v_migrated_count INT;
BEGIN
  -- Controlla se esiste la tabella fornitori
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'fornitori') THEN

    -- Controlla se fornitori ha la colonna azienda_id
    SELECT EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_name = 'fornitori' AND column_name = 'azienda_id'
    ) INTO v_has_azienda_id;

    IF v_has_azienda_id THEN
      -- Caso 1: fornitori ha già azienda_id, migrazione diretta
      INSERT INTO soggetto (
        azienda_id,
        tipo,
        ragione_sociale,
        partita_iva,
        email,
        telefono,
        indirizzo,
        citta,
        cap,
        provincia,
        note,
        attivo,
        created_at,
        updated_at
      )
      SELECT
        azienda_id,
        ARRAY['fornitore']::TEXT[],
        ragione_sociale,
        partita_iva,
        email,
        telefono,
        indirizzo,
        citta,
        cap,
        provincia,
        note,
        COALESCE(attivo, true),
        COALESCE(created_at, NOW()),
        COALESCE(updated_at, NOW())
      FROM fornitori
      ON CONFLICT DO NOTHING;

      GET DIAGNOSTICS v_migrated_count = ROW_COUNT;
      RAISE NOTICE 'Migrati % fornitori → soggetto (con azienda_id)', v_migrated_count;
    ELSE
      -- Caso 2: fornitori NON ha azienda_id, usa la prima azienda disponibile
      SELECT id INTO v_first_azienda_id FROM azienda ORDER BY created_at LIMIT 1;

      IF v_first_azienda_id IS NOT NULL THEN
        INSERT INTO soggetto (
          azienda_id,
          tipo,
          ragione_sociale,
          partita_iva,
          email,
          telefono,
          indirizzo,
          citta,
          cap,
          provincia,
          note,
          attivo,
          created_at,
          updated_at
        )
        SELECT
          v_first_azienda_id,  -- Usa prima azienda disponibile
          ARRAY['fornitore']::TEXT[],
          ragione_sociale,
          partita_iva,
          email,
          telefono,
          indirizzo,
          citta,
          cap,
          provincia,
          note,
          COALESCE(attivo, true),
          COALESCE(created_at, NOW()),
          COALESCE(updated_at, NOW())
        FROM fornitori
        ON CONFLICT DO NOTHING;

        GET DIAGNOSTICS v_migrated_count = ROW_COUNT;
        RAISE NOTICE 'Migrati % fornitori → soggetto (usando azienda_id: %)', v_migrated_count, v_first_azienda_id;
      ELSE
        RAISE NOTICE 'Nessuna azienda trovata, impossibile migrare fornitori';
      END IF;
    END IF;
  ELSE
    RAISE NOTICE 'Tabella fornitori non esiste, skip migrazione';
  END IF;
END $$;

-- =====================================================
-- BACKUP E RINOMINA TABELLE VECCHIE
-- =====================================================

-- Rinomina tabella clienti in clienti_old (backup)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clienti' AND table_type = 'BASE TABLE') THEN
    ALTER TABLE clienti RENAME TO clienti_old;
    RAISE NOTICE 'Tabella clienti rinominata in clienti_old (backup)';
  END IF;
END $$;

-- Rinomina tabella fornitori in fornitori_old (backup)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'fornitori' AND table_type = 'BASE TABLE') THEN
    ALTER TABLE fornitori RENAME TO fornitori_old;
    RAISE NOTICE 'Tabella fornitori rinominata in fornitori_old (backup)';
  END IF;
END $$;

-- =====================================================
-- VISTE: compatibilità retroattiva
-- =====================================================

-- Vista clienti (per mantenere compatibilità con codice esistente)
CREATE OR REPLACE VIEW clienti AS
SELECT
  id,
  azienda_id,
  ragione_sociale,
  nome,
  cognome,
  partita_iva,
  codice_fiscale,
  email,
  telefono,
  cellulare,
  indirizzo,
  citta,
  cap,
  provincia,
  paese,
  categoria_cliente AS categoria,
  sconto_percentuale,
  fido_massimo,
  pagamento_id,
  note,
  attivo,
  created_at,
  updated_at
FROM soggetto
WHERE 'cliente' = ANY(tipo);

COMMENT ON VIEW clienti IS
'Vista di compatibilità che mostra solo i soggetti di tipo cliente.
Usa soggetto per nuove query.';

-- Vista fornitori (per mantenere compatibilità con codice esistente)
CREATE OR REPLACE VIEW fornitori AS
SELECT
  id,
  azienda_id,
  ragione_sociale,
  partita_iva,
  email,
  telefono,
  cellulare,
  indirizzo,
  citta,
  cap,
  provincia,
  paese,
  categoria_fornitore AS categoria,
  giorni_consegna,
  sconto_fornitore,
  note,
  attivo,
  created_at,
  updated_at
FROM soggetto
WHERE 'fornitore' = ANY(tipo);

COMMENT ON VIEW fornitori IS
'Vista di compatibilità che mostra solo i soggetti di tipo fornitore.
Usa soggetto per nuove query.';

-- =====================================================
-- NOTA: Per eliminare definitivamente le tabelle old:
-- DROP TABLE IF EXISTS clienti_old CASCADE;
-- DROP TABLE IF EXISTS fornitori_old CASCADE;
-- =====================================================

-- =====================================================
-- RLS POLICIES (base - da completare dopo)
-- =====================================================

ALTER TABLE soggetto ENABLE ROW LEVEL SECURITY;

-- Policy: utenti possono vedere solo soggetti della propria azienda
CREATE POLICY soggetto_select_policy ON soggetto
  FOR SELECT
  USING (azienda_id = public.get_user_azienda_id());

-- Policy: utenti con permesso 'anagrafica/write' possono inserire
CREATE POLICY soggetto_insert_policy ON soggetto
  FOR INSERT
  WITH CHECK (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('anagrafica', 'write')
  );

-- Policy: utenti con permesso 'anagrafica/write' possono aggiornare
CREATE POLICY soggetto_update_policy ON soggetto
  FOR UPDATE
  USING (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('anagrafica', 'write')
  );

-- Policy: utenti con permesso 'anagrafica/delete' possono eliminare
CREATE POLICY soggetto_delete_policy ON soggetto
  FOR DELETE
  USING (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('anagrafica', 'delete')
  );

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON soggetto TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE soggetto_id_seq TO authenticated;
GRANT SELECT ON clienti TO authenticated;
GRANT SELECT ON fornitori TO authenticated;

-- =====================================================
-- FINE MIGRATION
-- =====================================================
