-- =====================================================
-- MIGRATION: Piano dei Conti e Prima Nota
-- Data: 2025-12-02
-- Descrizione: Contabilità generale con piano dei conti
--              e registrazioni contabili (prima nota)
-- =====================================================

-- =====================================================
-- TABELLA: piano_conti
-- =====================================================

CREATE TABLE piano_conti (
  id SERIAL PRIMARY KEY,
  azienda_id UUID NOT NULL REFERENCES azienda(id) ON DELETE CASCADE,

  -- Codifica conto
  codice VARCHAR(20) NOT NULL,
  descrizione VARCHAR(255) NOT NULL,

  -- Gerarchia
  livello INT NOT NULL CHECK (livello BETWEEN 1 AND 5), -- 1=Macro, 2=Categoria, 3=Sottocategoria, 4=Conto, 5=Sottoconto
  parent_id INT REFERENCES piano_conti(id) ON DELETE RESTRICT,
  path VARCHAR(255), -- Es: "1.01.001.0001" per query gerarchiche veloci

  -- Tipo conto
  tipo_conto VARCHAR(50) NOT NULL CHECK (tipo_conto IN ('patrimoniale', 'economico')),
  natura VARCHAR(1) NOT NULL CHECK (natura IN ('A', 'P', 'C', 'R', 'O')), -- A=Attivo, P=Passivo, C=Costi, R=Ricavi, O=Ordine

  -- Caratteristiche
  conto_chiusura BOOLEAN DEFAULT false, -- Conto usato per chiusure contabili
  conto_cliente BOOLEAN DEFAULT false, -- Mastro clienti
  conto_fornitore BOOLEAN DEFAULT false, -- Mastro fornitori
  conto_banca BOOLEAN DEFAULT false, -- Conti bancari
  conto_cassa BOOLEAN DEFAULT false, -- Conti cassa

  -- CEE - Collegamenti per bilancio
  codice_cee VARCHAR(10), -- Codice schema CEE
  voce_bilancio_sp VARCHAR(100), -- Voce Stato Patrimoniale
  voce_bilancio_ce VARCHAR(100), -- Voce Conto Economico

  -- Stato
  attivo BOOLEAN DEFAULT true,
  modificabile BOOLEAN DEFAULT true, -- False per conti standard

  -- Note
  note TEXT,

  -- Sistema
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT uq_piano_conti_codice UNIQUE (azienda_id, codice),
  CONSTRAINT chk_piano_conti_parent CHECK (id != parent_id)
);

COMMENT ON TABLE piano_conti IS 'Piano dei conti gerarchico per contabilità generale';
COMMENT ON COLUMN piano_conti.natura IS 'A=Attivo, P=Passivo, C=Costi, R=Ricavi, O=Ordine (conti d''ordine)';
COMMENT ON COLUMN piano_conti.livello IS '1=Macro, 2=Categoria, 3=Sottocategoria, 4=Conto, 5=Sottoconto';
COMMENT ON COLUMN piano_conti.path IS 'Percorso gerarchico per query materializzate';

-- =====================================================
-- SEED: Piano Conti Standard Italiano (Semplificato)
-- =====================================================

-- NOTA: Il seed iniziale è stato commentato per evitare errori di foreign key
-- Il piano conti verrà generato tramite la funzione genera_piano_conti_standard(azienda_id)
-- oppure manualmente dall'interfaccia

-- La funzione per generare il piano conti standard verrà creata nell'applicazione
-- e potrà essere chiamata quando necessario per ogni azienda

/*
-- Livello 1: MACRO CATEGORIE
INSERT INTO piano_conti (azienda_id, codice, descrizione, livello, tipo_conto, natura, path, modificabile) VALUES
  ('[AZIENDA_ID]', '1', 'ATTIVO PATRIMONIALE', 1, 'patrimoniale', 'A', '1', false),
  ('[AZIENDA_ID]', '2', 'PASSIVO PATRIMONIALE', 1, 'patrimoniale', 'P', '2', false),
  ('[AZIENDA_ID]', '3', 'COSTI', 1, 'economico', 'C', '3', false),
  ('[AZIENDA_ID]', '4', 'RICAVI', 1, 'economico', 'R', '4', false),
  ('[AZIENDA_ID]', '5', 'CONTI D''ORDINE', 1, 'patrimoniale', 'O', '5', false);
*/

-- =====================================================
-- TABELLA: movimento_contabile (Prima Nota)
-- =====================================================

CREATE TABLE movimento_contabile (
  id BIGSERIAL PRIMARY KEY,
  azienda_id UUID NOT NULL REFERENCES azienda(id) ON DELETE CASCADE,

  -- Data e progressivo
  data_registrazione DATE NOT NULL,
  numero_progressivo INT NOT NULL, -- Progressivo giornaliero
  esercizio INT NOT NULL, -- Anno contabile

  -- Causale contabile
  causale VARCHAR(100) NOT NULL, -- Descrizione causale (es: "Fattura vendita", "Incasso cliente")
  descrizione TEXT, -- Descrizione movimento

  -- Conto
  conto_id INT NOT NULL REFERENCES piano_conti(id) ON DELETE RESTRICT,

  -- Importo (sempre positivo)
  importo DECIMAL(12,2) NOT NULL CHECK (importo >= 0),
  tipo_movimento VARCHAR(10) NOT NULL CHECK (tipo_movimento IN ('dare', 'avere')),

  -- Collegamenti
  documento_tipo VARCHAR(50), -- 'movimento', 'scadenza', 'pagamento', 'chiusura'
  documento_id INT, -- ID del documento collegato
  soggetto_id INT REFERENCES soggetto(id),

  -- Stato
  definitivo BOOLEAN DEFAULT false, -- Se true, non più modificabile
  note TEXT,

  -- Sistema
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT uq_movimento_contabile_progressivo UNIQUE (azienda_id, esercizio, numero_progressivo, tipo_movimento)
);

COMMENT ON TABLE movimento_contabile IS 'Prima nota - registrazioni contabili in partita doppia';
COMMENT ON COLUMN movimento_contabile.tipo_movimento IS 'dare o avere (partita doppia)';
COMMENT ON COLUMN movimento_contabile.definitivo IS 'Se true, il movimento è definitivo e non modificabile';
COMMENT ON COLUMN movimento_contabile.documento_tipo IS 'Tipo documento origine: movimento, scadenza, pagamento, chiusura';

-- =====================================================
-- INDICI
-- =====================================================

-- Piano Conti
CREATE INDEX idx_piano_conti_azienda_id ON piano_conti(azienda_id);
CREATE INDEX idx_piano_conti_codice ON piano_conti(codice);
CREATE INDEX idx_piano_conti_parent_id ON piano_conti(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_piano_conti_tipo_natura ON piano_conti(tipo_conto, natura);
CREATE INDEX idx_piano_conti_path ON piano_conti USING btree (path varchar_pattern_ops);
CREATE INDEX idx_piano_conti_attivo ON piano_conti(attivo) WHERE attivo = true;

-- Movimento Contabile
CREATE INDEX idx_movimento_contabile_azienda_id ON movimento_contabile(azienda_id);
CREATE INDEX idx_movimento_contabile_data ON movimento_contabile(data_registrazione DESC);
CREATE INDEX idx_movimento_contabile_conto_id ON movimento_contabile(conto_id);
CREATE INDEX idx_movimento_contabile_esercizio ON movimento_contabile(esercizio);
CREATE INDEX idx_movimento_contabile_soggetto_id ON movimento_contabile(soggetto_id) WHERE soggetto_id IS NOT NULL;
CREATE INDEX idx_movimento_contabile_documento ON movimento_contabile(documento_tipo, documento_id) WHERE documento_tipo IS NOT NULL;
CREATE INDEX idx_movimento_contabile_definitivo ON movimento_contabile(definitivo) WHERE definitivo = false;

-- =====================================================
-- TRIGGER per updated_at
-- =====================================================

CREATE TRIGGER trg_piano_conti_updated_at
  BEFORE UPDATE ON piano_conti
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_movimento_contabile_updated_at
  BEFORE UPDATE ON movimento_contabile
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNZIONE: Contabilizza movimento (fattura)
-- =====================================================

CREATE OR REPLACE FUNCTION contabilizza_movimento_fattura(p_movimento_id INT)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_movimento RECORD;
  v_causale RECORD;
  v_progressivo INT;
  v_conto_cliente INT;
  v_conto_fornitore INT;
  v_conto_ricavi INT;
  v_conto_costi INT;
  v_conto_iva_debito INT;
  v_conto_iva_credito INT;
BEGIN
  -- Recupera movimento
  SELECT m.*, cd.tipo_operazione
  INTO v_movimento
  FROM movimento m
  JOIN causale_documento cd ON m.causale_id = cd.id
  WHERE m.id = p_movimento_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Movimento % non trovato', p_movimento_id;
  END IF;

  -- Verifica che sia una fattura
  IF v_movimento.tipo_documento NOT IN ('fattura', 'nota_credito') THEN
    RAISE EXCEPTION 'Il movimento % non è una fattura', p_movimento_id;
  END IF;

  -- Verifica che non sia già contabilizzato
  IF v_movimento.contabilizzato THEN
    RAISE EXCEPTION 'Il movimento % è già stato contabilizzato', p_movimento_id;
  END IF;

  -- Recupera conti necessari (semplificato - usa conti standard)
  SELECT id INTO v_conto_cliente FROM piano_conti WHERE azienda_id = v_movimento.azienda_id AND codice = '1.03.010' AND attivo = true;
  SELECT id INTO v_conto_fornitore FROM piano_conti WHERE azienda_id = v_movimento.azienda_id AND codice = '2.03.010' AND attivo = true;
  SELECT id INTO v_conto_ricavi FROM piano_conti WHERE azienda_id = v_movimento.azienda_id AND codice = '4.01.001' AND attivo = true;
  SELECT id INTO v_conto_costi FROM piano_conti WHERE azienda_id = v_movimento.azienda_id AND codice = '3.01.001' AND attivo = true;
  SELECT id INTO v_conto_iva_debito FROM piano_conti WHERE azienda_id = v_movimento.azienda_id AND codice = '2.03.020' AND attivo = true;
  SELECT id INTO v_conto_iva_credito FROM piano_conti WHERE azienda_id = v_movimento.azienda_id AND codice = '1.03.030' AND attivo = true;

  -- Calcola progressivo
  SELECT COALESCE(MAX(numero_progressivo), 0) + 1 INTO v_progressivo
  FROM movimento_contabile
  WHERE azienda_id = v_movimento.azienda_id
    AND esercizio = EXTRACT(YEAR FROM v_movimento.data_documento)
    AND data_registrazione = v_movimento.data_documento;

  -- FATTURA VENDITA
  IF v_movimento.tipo_operazione = 'vendita' AND v_movimento.tipo_documento = 'fattura' THEN
    -- DARE: Crediti v/Clienti (totale)
    INSERT INTO movimento_contabile (
      azienda_id, data_registrazione, numero_progressivo, esercizio,
      causale, descrizione, conto_id, importo, tipo_movimento,
      documento_tipo, documento_id, soggetto_id, definitivo
    ) VALUES (
      v_movimento.azienda_id, v_movimento.data_documento, v_progressivo, EXTRACT(YEAR FROM v_movimento.data_documento),
      'Fattura Vendita', 'Fattura n. ' || v_movimento.numero_documento, v_conto_cliente, v_movimento.totale, 'dare',
      'movimento', p_movimento_id, v_movimento.soggetto_id, true
    );

    -- AVERE: Ricavi Vendite (imponibile)
    INSERT INTO movimento_contabile (
      azienda_id, data_registrazione, numero_progressivo, esercizio,
      causale, descrizione, conto_id, importo, tipo_movimento,
      documento_tipo, documento_id, soggetto_id, definitivo
    ) VALUES (
      v_movimento.azienda_id, v_movimento.data_documento, v_progressivo, EXTRACT(YEAR FROM v_movimento.data_documento),
      'Fattura Vendita', 'Fattura n. ' || v_movimento.numero_documento, v_conto_ricavi, v_movimento.imponibile, 'avere',
      'movimento', p_movimento_id, v_movimento.soggetto_id, true
    );

    -- AVERE: IVA a Debito (iva)
    IF v_movimento.iva > 0 THEN
      INSERT INTO movimento_contabile (
        azienda_id, data_registrazione, numero_progressivo, esercizio,
        causale, descrizione, conto_id, importo, tipo_movimento,
        documento_tipo, documento_id, soggetto_id, definitivo
      ) VALUES (
        v_movimento.azienda_id, v_movimento.data_documento, v_progressivo, EXTRACT(YEAR FROM v_movimento.data_documento),
        'Fattura Vendita', 'Fattura n. ' || v_movimento.numero_documento, v_conto_iva_debito, v_movimento.iva, 'avere',
        'movimento', p_movimento_id, v_movimento.soggetto_id, true
      );
    END IF;

  -- FATTURA ACQUISTO
  ELSIF v_movimento.tipo_operazione = 'acquisto' AND v_movimento.tipo_documento = 'fattura' THEN
    -- DARE: Costi Acquisto (imponibile)
    INSERT INTO movimento_contabile (
      azienda_id, data_registrazione, numero_progressivo, esercizio,
      causale, descrizione, conto_id, importo, tipo_movimento,
      documento_tipo, documento_id, soggetto_id, definitivo
    ) VALUES (
      v_movimento.azienda_id, v_movimento.data_documento, v_progressivo, EXTRACT(YEAR FROM v_movimento.data_documento),
      'Fattura Acquisto', 'Fattura n. ' || v_movimento.numero_documento, v_conto_costi, v_movimento.imponibile, 'dare',
      'movimento', p_movimento_id, v_movimento.soggetto_id, true
    );

    -- DARE: IVA a Credito (iva)
    IF v_movimento.iva > 0 THEN
      INSERT INTO movimento_contabile (
        azienda_id, data_registrazione, numero_progressivo, esercizio,
        causale, descrizione, conto_id, importo, tipo_movimento,
        documento_tipo, documento_id, soggetto_id, definitivo
      ) VALUES (
        v_movimento.azienda_id, v_movimento.data_documento, v_progressivo, EXTRACT(YEAR FROM v_movimento.data_documento),
        'Fattura Acquisto', 'Fattura n. ' || v_movimento.numero_documento, v_conto_iva_credito, v_movimento.iva, 'dare',
        'movimento', p_movimento_id, v_movimento.soggetto_id, true
      );
    END IF;

    -- AVERE: Debiti v/Fornitori (totale)
    INSERT INTO movimento_contabile (
      azienda_id, data_registrazione, numero_progressivo, esercizio,
      causale, descrizione, conto_id, importo, tipo_movimento,
      documento_tipo, documento_id, soggetto_id, definitivo
    ) VALUES (
      v_movimento.azienda_id, v_movimento.data_documento, v_progressivo, EXTRACT(YEAR FROM v_movimento.data_documento),
      'Fattura Acquisto', 'Fattura n. ' || v_movimento.numero_documento, v_conto_fornitore, v_movimento.totale, 'avere',
      'movimento', p_movimento_id, v_movimento.soggetto_id, true
    );
  END IF;

  -- Marca movimento come contabilizzato
  UPDATE movimento
  SET contabilizzato = true, data_contabilizzazione = NOW()
  WHERE id = p_movimento_id;
END;
$$;

COMMENT ON FUNCTION contabilizza_movimento_fattura(INT) IS 'Genera registrazioni contabili (partita doppia) da una fattura';

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE piano_conti ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimento_contabile ENABLE ROW LEVEL SECURITY;

-- PIANO_CONTI: Policies
CREATE POLICY piano_conti_select_policy ON piano_conti
  FOR SELECT
  USING (azienda_id = public.get_user_azienda_id() OR azienda_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY piano_conti_insert_policy ON piano_conti
  FOR INSERT
  WITH CHECK (azienda_id = public.get_user_azienda_id());

CREATE POLICY piano_conti_update_policy ON piano_conti
  FOR UPDATE
  USING (azienda_id = public.get_user_azienda_id() AND modificabile = true);

CREATE POLICY piano_conti_delete_policy ON piano_conti
  FOR DELETE
  USING (azienda_id = public.get_user_azienda_id() AND modificabile = true);

-- MOVIMENTO_CONTABILE: Policies
CREATE POLICY movimento_contabile_select_policy ON movimento_contabile
  FOR SELECT
  USING (azienda_id = public.get_user_azienda_id());

CREATE POLICY movimento_contabile_insert_policy ON movimento_contabile
  FOR INSERT
  WITH CHECK (azienda_id = public.get_user_azienda_id());

CREATE POLICY movimento_contabile_update_policy ON movimento_contabile
  FOR UPDATE
  USING (azienda_id = public.get_user_azienda_id() AND definitivo = false);

CREATE POLICY movimento_contabile_delete_policy ON movimento_contabile
  FOR DELETE
  USING (azienda_id = public.get_user_azienda_id() AND definitivo = false);

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON piano_conti TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON movimento_contabile TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE piano_conti_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE movimento_contabile_id_seq TO authenticated;

-- =====================================================
-- VISTA: prima_nota (denormalizzata)
-- =====================================================

CREATE OR REPLACE VIEW prima_nota AS
SELECT
  mc.*,
  pc.codice AS conto_codice,
  pc.descrizione AS conto_descrizione,
  pc.natura AS conto_natura,
  s.ragione_sociale AS soggetto_nome,
  CASE
    WHEN mc.tipo_movimento = 'dare' THEN mc.importo
    ELSE 0
  END AS dare,
  CASE
    WHEN mc.tipo_movimento = 'avere' THEN mc.importo
    ELSE 0
  END AS avere
FROM movimento_contabile mc
JOIN piano_conti pc ON mc.conto_id = pc.id
LEFT JOIN soggetto s ON mc.soggetto_id = s.id;

COMMENT ON VIEW prima_nota IS 'Prima nota con colonne dare/avere per visualizzazione classica';

-- =====================================================
-- FINE MIGRATION
-- =====================================================
