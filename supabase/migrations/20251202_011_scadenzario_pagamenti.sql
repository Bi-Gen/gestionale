-- =====================================================
-- MIGRATION: Scadenzario e Pagamenti
-- Data: 2025-12-02
-- Descrizione: Gestione scadenze e pagamenti per fatture
-- =====================================================

-- =====================================================
-- TABELLA: scadenza
-- =====================================================

CREATE TABLE scadenza (
  id SERIAL PRIMARY KEY,
  azienda_id UUID NOT NULL REFERENCES azienda(id) ON DELETE CASCADE,

  -- Riferimento documento
  movimento_id INT NOT NULL REFERENCES movimento(id) ON DELETE CASCADE,

  -- Tipo scadenza
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('attivo', 'passivo')), -- attivo=credito, passivo=debito

  -- Soggetto
  soggetto_id INT NOT NULL REFERENCES soggetto(id) ON DELETE RESTRICT,

  -- Rate
  numero_rata INT DEFAULT 1 CHECK (numero_rata > 0),
  totale_rate INT DEFAULT 1 CHECK (totale_rate > 0),

  -- Date
  data_emissione DATE NOT NULL,
  data_scadenza DATE NOT NULL,
  data_sollecito DATE, -- Data ultimo sollecito inviato

  -- Importi
  importo DECIMAL(12,2) NOT NULL CHECK (importo > 0),
  importo_pagato DECIMAL(12,2) DEFAULT 0 CHECK (importo_pagato >= 0),
  importo_residuo DECIMAL(12,2) GENERATED ALWAYS AS (importo - importo_pagato) STORED,

  -- Stato
  stato VARCHAR(20) DEFAULT 'da_pagare' CHECK (stato IN ('da_pagare', 'parzialmente_pagato', 'pagato', 'scaduto', 'annullato')),

  -- Note
  note TEXT,

  -- Sistema
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_scadenza_rate CHECK (numero_rata <= totale_rate),
  CONSTRAINT chk_scadenza_importo_pagato CHECK (importo_pagato <= importo)
);

COMMENT ON TABLE scadenza IS 'Scadenze generate da fatture per gestione crediti e debiti';
COMMENT ON COLUMN scadenza.tipo IS 'attivo=credito (da clienti), passivo=debito (verso fornitori)';
COMMENT ON COLUMN scadenza.stato IS 'da_pagare, parzialmente_pagato, pagato, scaduto, annullato';
COMMENT ON COLUMN scadenza.importo_residuo IS 'Calcolato automaticamente: importo - importo_pagato';

-- =====================================================
-- TABELLA: pagamento
-- =====================================================

CREATE TABLE pagamento (
  id SERIAL PRIMARY KEY,
  azienda_id UUID NOT NULL REFERENCES azienda(id) ON DELETE CASCADE,

  -- Riferimento scadenza
  scadenza_id INT NOT NULL REFERENCES scadenza(id) ON DELETE RESTRICT,

  -- Dati pagamento
  data_pagamento DATE NOT NULL,
  importo DECIMAL(12,2) NOT NULL CHECK (importo > 0),
  metodo_pagamento_id INT REFERENCES metodo_pagamento(id),

  -- Coordinate bancarie / Cash
  conto_bancario VARCHAR(100), -- IBAN o descrizione conto
  numero_transazione VARCHAR(100), -- RID, bonifico, assegno
  valuta VARCHAR(3) DEFAULT 'EUR',

  -- Contabilizzazione
  contabilizzato BOOLEAN DEFAULT false,
  data_contabilizzazione TIMESTAMPTZ,

  -- Note
  note TEXT,

  -- Sistema
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE pagamento IS 'Registrazione pagamenti effettivi su scadenze';
COMMENT ON COLUMN pagamento.numero_transazione IS 'CRO bonifico, numero assegno, codice RID, etc.';

-- =====================================================
-- INDICI
-- =====================================================

-- Scadenza
CREATE INDEX idx_scadenza_azienda_id ON scadenza(azienda_id);
CREATE INDEX idx_scadenza_movimento_id ON scadenza(movimento_id);
CREATE INDEX idx_scadenza_soggetto_id ON scadenza(soggetto_id);
CREATE INDEX idx_scadenza_data_scadenza ON scadenza(data_scadenza);
CREATE INDEX idx_scadenza_stato ON scadenza(stato);
CREATE INDEX idx_scadenza_tipo ON scadenza(tipo);
-- Indice per scadenze in sospeso (rimossa condizione CURRENT_DATE per evitare errore IMMUTABLE)
CREATE INDEX idx_scadenza_stato_data ON scadenza(stato, data_scadenza) WHERE stato IN ('da_pagare', 'parzialmente_pagato');

-- Pagamento
CREATE INDEX idx_pagamento_azienda_id ON pagamento(azienda_id);
CREATE INDEX idx_pagamento_scadenza_id ON pagamento(scadenza_id);
CREATE INDEX idx_pagamento_data_pagamento ON pagamento(data_pagamento DESC);
CREATE INDEX idx_pagamento_contabilizzato ON pagamento(contabilizzato) WHERE contabilizzato = false;

-- =====================================================
-- TRIGGER per updated_at
-- =====================================================

CREATE TRIGGER trg_scadenza_updated_at
  BEFORE UPDATE ON scadenza
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_pagamento_updated_at
  BEFORE UPDATE ON pagamento
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNZIONE: Aggiorna stato scadenza
-- =====================================================

CREATE OR REPLACE FUNCTION aggiorna_stato_scadenza()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_importo_pagato DECIMAL(12,2);
  v_importo_totale DECIMAL(12,2);
  v_nuovo_stato VARCHAR(20);
BEGIN
  -- Calcola importo pagato totale
  SELECT
    COALESCE(SUM(importo), 0),
    s.importo
  INTO v_importo_pagato, v_importo_totale
  FROM pagamento p
  JOIN scadenza s ON p.scadenza_id = s.id
  WHERE p.scadenza_id = COALESCE(NEW.scadenza_id, OLD.scadenza_id)
  GROUP BY s.importo;

  -- Determina nuovo stato
  IF v_importo_pagato = 0 THEN
    v_nuovo_stato := 'da_pagare';
  ELSIF v_importo_pagato < v_importo_totale THEN
    v_nuovo_stato := 'parzialmente_pagato';
  ELSE
    v_nuovo_stato := 'pagato';
  END IF;

  -- Aggiorna scadenza
  UPDATE scadenza
  SET
    importo_pagato = v_importo_pagato,
    stato = v_nuovo_stato,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.scadenza_id, OLD.scadenza_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION aggiorna_stato_scadenza() IS 'Aggiorna automaticamente stato e importo_pagato della scadenza';

-- =====================================================
-- TRIGGER: Aggiorna stato dopo pagamento
-- =====================================================

CREATE TRIGGER trg_pagamento_aggiorna_scadenza
  AFTER INSERT OR UPDATE OR DELETE ON pagamento
  FOR EACH ROW
  EXECUTE FUNCTION aggiorna_stato_scadenza();

-- =====================================================
-- FUNZIONE: Marca scadenze scadute
-- =====================================================

CREATE OR REPLACE FUNCTION marca_scadenze_scadute()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE scadenza
  SET stato = 'scaduto'
  WHERE
    stato IN ('da_pagare', 'parzialmente_pagato')
    AND data_scadenza < CURRENT_DATE;
END;
$$;

COMMENT ON FUNCTION marca_scadenze_scadute() IS 'Marca come scadute le scadenze con data passata - da eseguire giornalmente';

-- =====================================================
-- FUNZIONE: Genera scadenze da movimento
-- =====================================================

CREATE OR REPLACE FUNCTION genera_scadenze_da_movimento(p_movimento_id INT)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_movimento RECORD;
  v_metodo_pagamento RECORD;
  v_giorni_scadenza INT;
  v_numero_rate INT;
  v_importo_rata DECIMAL(12,2);
  v_data_scadenza DATE;
  i INT;
BEGIN
  -- Recupera movimento
  SELECT * INTO v_movimento
  FROM movimento
  WHERE id = p_movimento_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Movimento % non trovato', p_movimento_id;
  END IF;

  -- Recupera metodo pagamento
  IF v_movimento.metodo_pagamento_id IS NULL THEN
    RAISE EXCEPTION 'Movimento % non ha metodo di pagamento', p_movimento_id;
  END IF;

  SELECT * INTO v_metodo_pagamento
  FROM metodo_pagamento
  WHERE id = v_movimento.metodo_pagamento_id;

  -- Calcola numero rate e giorni
  v_giorni_scadenza := COALESCE(v_metodo_pagamento.giorni_scadenza, 30);
  v_numero_rate := CASE
    WHEN v_metodo_pagamento.nome LIKE '%30gg%' THEN 1
    WHEN v_metodo_pagamento.nome LIKE '%60gg%' THEN 2
    WHEN v_metodo_pagamento.nome LIKE '%90gg%' THEN 3
    ELSE 1
  END;

  v_importo_rata := v_movimento.totale / v_numero_rate;

  -- Genera scadenze
  FOR i IN 1..v_numero_rate LOOP
    v_data_scadenza := v_movimento.data_documento + (v_giorni_scadenza * i);

    INSERT INTO scadenza (
      azienda_id,
      movimento_id,
      tipo,
      soggetto_id,
      numero_rata,
      totale_rate,
      data_emissione,
      data_scadenza,
      importo,
      stato
    ) VALUES (
      v_movimento.azienda_id,
      p_movimento_id,
      CASE
        WHEN EXISTS (
          SELECT 1 FROM causale_documento
          WHERE id = v_movimento.causale_id AND tipo_operazione = 'vendita'
        ) THEN 'attivo'
        ELSE 'passivo'
      END,
      v_movimento.soggetto_id,
      i,
      v_numero_rate,
      v_movimento.data_documento,
      v_data_scadenza,
      v_importo_rata,
      'da_pagare'
    );
  END LOOP;
END;
$$;

COMMENT ON FUNCTION genera_scadenze_da_movimento(INT) IS 'Genera scadenze automatiche da un movimento (fattura)';

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE scadenza ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamento ENABLE ROW LEVEL SECURITY;

-- SCADENZA: Policies
CREATE POLICY scadenza_select_policy ON scadenza
  FOR SELECT
  USING (azienda_id = public.get_user_azienda_id());

CREATE POLICY scadenza_insert_policy ON scadenza
  FOR INSERT
  WITH CHECK (azienda_id = public.get_user_azienda_id());

CREATE POLICY scadenza_update_policy ON scadenza
  FOR UPDATE
  USING (azienda_id = public.get_user_azienda_id());

CREATE POLICY scadenza_delete_policy ON scadenza
  FOR DELETE
  USING (azienda_id = public.get_user_azienda_id());

-- PAGAMENTO: Policies
CREATE POLICY pagamento_select_policy ON pagamento
  FOR SELECT
  USING (azienda_id = public.get_user_azienda_id());

CREATE POLICY pagamento_insert_policy ON pagamento
  FOR INSERT
  WITH CHECK (azienda_id = public.get_user_azienda_id());

CREATE POLICY pagamento_update_policy ON pagamento
  FOR UPDATE
  USING (azienda_id = public.get_user_azienda_id());

CREATE POLICY pagamento_delete_policy ON pagamento
  FOR DELETE
  USING (azienda_id = public.get_user_azienda_id());

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON scadenza TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON pagamento TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE scadenza_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE pagamento_id_seq TO authenticated;

-- =====================================================
-- VISTA: scadenzario (denormalizzata)
-- =====================================================

CREATE OR REPLACE VIEW scadenzario AS
SELECT
  s.*,
  m.numero_documento AS movimento_numero,
  m.data_documento AS movimento_data,
  cd.tipo_documento,
  cd.descrizione AS causale_descrizione,
  sog.ragione_sociale AS soggetto_nome,
  sog.codice_fiscale AS soggetto_cf,
  sog.partita_iva AS soggetto_piva,
  CASE
    WHEN s.stato = 'pagato' THEN 'Pagato'
    WHEN s.stato = 'scaduto' THEN 'Scaduto'
    WHEN s.data_scadenza < CURRENT_DATE THEN 'In Scadenza'
    ELSE 'Da Pagare'
  END AS stato_descrittivo,
  CURRENT_DATE - s.data_scadenza AS giorni_ritardo
FROM scadenza s
JOIN movimento m ON s.movimento_id = m.id
JOIN causale_documento cd ON m.causale_id = cd.id
JOIN soggetto sog ON s.soggetto_id = sog.id;

COMMENT ON VIEW scadenzario IS 'Vista denormalizzata dello scadenzario con informazioni complete';

-- =====================================================
-- FINE MIGRATION
-- =====================================================
