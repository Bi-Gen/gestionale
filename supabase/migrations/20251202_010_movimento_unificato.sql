-- =====================================================
-- MIGRATION: Modello Movimento Unificato
-- Data: 2025-12-02
-- Descrizione: Sostituisce 'ordini' con 'movimento' unificato
--              per gestire ordini, fatture, note credito, bolle
-- =====================================================

-- =====================================================
-- CAUSALE DOCUMENTO (Estensione causali)
-- =====================================================

CREATE TABLE IF NOT EXISTS causale_documento (
  id SERIAL PRIMARY KEY,
  codice VARCHAR(20) UNIQUE NOT NULL,
  descrizione VARCHAR(255) NOT NULL,
  tipo_documento VARCHAR(50) NOT NULL, -- 'ordine', 'fattura', 'nota_credito', 'bolla', 'preventivo'
  tipo_operazione VARCHAR(20) NOT NULL, -- 'vendita', 'acquisto'
  segno INT NOT NULL CHECK (segno IN (-1, 0, 1)), -- 1=entrata, -1=uscita, 0=neutro
  genera_movimento_magazzino BOOLEAN DEFAULT false,
  genera_movimento_contabile BOOLEAN DEFAULT false,
  numerazione_separata BOOLEAN DEFAULT true,
  attivo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE causale_documento IS 'Causali per tutti i tipi di documento: ordini, fatture, note credito, bolle';
COMMENT ON COLUMN causale_documento.segno IS '1=entrata (vendita), -1=uscita (acquisto), 0=neutro (preventivo, promemoria)';
COMMENT ON COLUMN causale_documento.genera_movimento_magazzino IS 'Se true, genera movimento magazzino all''evasione';
COMMENT ON COLUMN causale_documento.genera_movimento_contabile IS 'Se true, genera registrazioni contabili';

-- =====================================================
-- SEED: Causali Documento Base
-- =====================================================

INSERT INTO causale_documento (codice, descrizione, tipo_documento, tipo_operazione, segno, genera_movimento_magazzino, genera_movimento_contabile, numerazione_separata) VALUES
  -- ORDINI
  ('ORD_VEN', 'Ordine Cliente', 'ordine', 'vendita', 1, true, false, true),
  ('ORD_ACQ', 'Ordine Fornitore', 'ordine', 'acquisto', -1, true, false, true),

  -- FATTURE
  ('FT_ATT', 'Fattura Immediata', 'fattura', 'vendita', 1, false, true, true),
  ('FT_DIFF', 'Fattura Differita', 'fattura', 'vendita', 1, false, true, true),
  ('FT_ACC', 'Fattura Acconto', 'fattura', 'vendita', 1, false, true, true),
  ('FT_PAS', 'Fattura Acquisto', 'fattura', 'acquisto', -1, false, true, true),

  -- NOTE CREDITO
  ('NC_VEN', 'Nota Credito Cliente', 'nota_credito', 'vendita', -1, true, true, true),
  ('NC_ACQ', 'Nota Credito Fornitore', 'nota_credito', 'acquisto', 1, true, true, true),

  -- BOLLE
  ('DDT_VEN', 'Bolla Accompagnatoria Vendita', 'bolla', 'vendita', 1, true, false, true),
  ('DDT_ACQ', 'Bolla Entrata Merce', 'bolla', 'acquisto', -1, true, false, true),

  -- PREVENTIVI
  ('PREV', 'Preventivo', 'preventivo', 'vendita', 0, false, false, true)
ON CONFLICT (codice) DO NOTHING;

-- =====================================================
-- TABELLA: movimento (sostituisce ordini)
-- =====================================================

CREATE TABLE movimento (
  id SERIAL PRIMARY KEY,
  azienda_id UUID NOT NULL REFERENCES azienda(id) ON DELETE CASCADE,

  -- Identificazione documento
  causale_id INT NOT NULL REFERENCES causale_documento(id),
  numero_documento VARCHAR(50) NOT NULL,
  data_documento DATE NOT NULL,
  data_scadenza DATE,

  -- Soggetto (cliente o fornitore)
  soggetto_id INT REFERENCES soggetto(id) ON DELETE RESTRICT,

  -- Importi
  imponibile DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  iva DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  totale DECIMAL(12,2) NOT NULL DEFAULT 0.00,

  -- IVA e regime fiscale
  regime_iva VARCHAR(50) DEFAULT 'ordinario', -- 'ordinario', 'split_payment', 'reverse_charge', 'fuori_campo'
  split_payment BOOLEAN DEFAULT false,
  reverse_charge BOOLEAN DEFAULT false,

  -- Pagamento
  metodo_pagamento_id INT REFERENCES metodo_pagamento(id),

  -- Stato
  stato VARCHAR(50) DEFAULT 'bozza', -- 'bozza', 'confermato', 'evaso', 'fatturato', 'pagato', 'annullato'

  -- Collegamenti
  magazzino_id INT REFERENCES magazzino(id), -- Magazzino di riferimento
  documento_origine_id INT REFERENCES movimento(id), -- Es: fattura collega a ordine

  -- Contabilizzazione
  contabilizzato BOOLEAN DEFAULT false,
  data_contabilizzazione TIMESTAMPTZ,

  -- Note e riferimenti
  note TEXT,
  riferimento_esterno VARCHAR(100), -- Es: numero ordine cliente

  -- Sistema
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT uq_movimento_numero UNIQUE (azienda_id, causale_id, numero_documento)
);

COMMENT ON TABLE movimento IS 'Tabella unificata per ordini, fatture, note credito, bolle, preventivi';
COMMENT ON COLUMN movimento.causale_id IS 'Tipo documento (ordine, fattura, nota credito, etc.)';
COMMENT ON COLUMN movimento.regime_iva IS 'Regime IVA: ordinario, split payment, reverse charge, fuori campo';
COMMENT ON COLUMN movimento.stato IS 'bozza, confermato, evaso, fatturato, pagato, annullato';
COMMENT ON COLUMN movimento.documento_origine_id IS 'Riferimento al documento originale (es: fattura -> ordine)';

-- =====================================================
-- TABELLA: dettaglio_movimento
-- =====================================================

CREATE TABLE dettaglio_movimento (
  id SERIAL PRIMARY KEY,
  movimento_id INT NOT NULL REFERENCES movimento(id) ON DELETE CASCADE,

  -- Prodotto
  prodotto_id INT NOT NULL REFERENCES prodotto(id) ON DELETE RESTRICT,
  descrizione TEXT, -- Descrizione libera (può differire dal prodotto)

  -- Quantità e unità
  quantita DECIMAL(12,3) NOT NULL CHECK (quantita != 0),
  unita_misura VARCHAR(10),

  -- Prezzi
  prezzo_unitario DECIMAL(12,2) NOT NULL CHECK (prezzo_unitario >= 0),
  sconto_percentuale DECIMAL(5,2) DEFAULT 0 CHECK (sconto_percentuale >= 0 AND sconto_percentuale <= 100),
  sconto_importo DECIMAL(12,2) DEFAULT 0,

  -- Importi riga
  imponibile DECIMAL(12,2) NOT NULL CHECK (imponibile >= 0),
  aliquota_iva_id INT REFERENCES aliquota_iva(id),
  iva DECIMAL(12,2) NOT NULL DEFAULT 0,
  totale DECIMAL(12,2) NOT NULL CHECK (totale >= 0),

  -- Note riga
  note TEXT,

  -- Sistema
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE dettaglio_movimento IS 'Righe dettaglio di ordini, fatture, note credito, bolle';
COMMENT ON COLUMN dettaglio_movimento.quantita IS 'Può essere negativa per note credito';
COMMENT ON COLUMN dettaglio_movimento.descrizione IS 'Descrizione libera, può sostituire quella del prodotto';

-- =====================================================
-- INDICI
-- =====================================================

-- Movimento
CREATE INDEX idx_movimento_azienda_id ON movimento(azienda_id);
CREATE INDEX idx_movimento_causale_id ON movimento(causale_id);
CREATE INDEX idx_movimento_data_documento ON movimento(data_documento DESC);
CREATE INDEX idx_movimento_data_scadenza ON movimento(data_scadenza) WHERE data_scadenza IS NOT NULL;
CREATE INDEX idx_movimento_stato ON movimento(stato);
CREATE INDEX idx_movimento_soggetto_id ON movimento(soggetto_id) WHERE soggetto_id IS NOT NULL;
CREATE INDEX idx_movimento_numero_documento ON movimento(numero_documento);
CREATE INDEX idx_movimento_contabilizzato ON movimento(contabilizzato) WHERE contabilizzato = false;
CREATE INDEX idx_movimento_documento_origine ON movimento(documento_origine_id) WHERE documento_origine_id IS NOT NULL;

-- Dettaglio
CREATE INDEX idx_dettaglio_movimento_movimento_id ON dettaglio_movimento(movimento_id);
CREATE INDEX idx_dettaglio_movimento_prodotto_id ON dettaglio_movimento(prodotto_id);

-- =====================================================
-- TRIGGER per updated_at
-- =====================================================

CREATE TRIGGER trg_movimento_updated_at
  BEFORE UPDATE ON movimento
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_dettaglio_movimento_updated_at
  BEFORE UPDATE ON dettaglio_movimento
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNZIONE: Ricalcola totali movimento
-- =====================================================

CREATE OR REPLACE FUNCTION ricalcola_totali_movimento()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE movimento
  SET
    imponibile = (
      SELECT COALESCE(SUM(imponibile), 0)
      FROM dettaglio_movimento
      WHERE movimento_id = COALESCE(NEW.movimento_id, OLD.movimento_id)
    ),
    iva = (
      SELECT COALESCE(SUM(iva), 0)
      FROM dettaglio_movimento
      WHERE movimento_id = COALESCE(NEW.movimento_id, OLD.movimento_id)
    ),
    totale = (
      SELECT COALESCE(SUM(totale), 0)
      FROM dettaglio_movimento
      WHERE movimento_id = COALESCE(NEW.movimento_id, OLD.movimento_id)
    )
  WHERE id = COALESCE(NEW.movimento_id, OLD.movimento_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION ricalcola_totali_movimento() IS 'Ricalcola imponibile, IVA e totale del movimento';

-- =====================================================
-- TRIGGER: Ricalcola totali automaticamente
-- =====================================================

CREATE TRIGGER trg_dettaglio_movimento_insert_update_totali
  AFTER INSERT OR UPDATE ON dettaglio_movimento
  FOR EACH ROW
  EXECUTE FUNCTION ricalcola_totali_movimento();

CREATE TRIGGER trg_dettaglio_movimento_delete_totali
  AFTER DELETE ON dettaglio_movimento
  FOR EACH ROW
  EXECUTE FUNCTION ricalcola_totali_movimento();

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE causale_documento ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimento ENABLE ROW LEVEL SECURITY;
ALTER TABLE dettaglio_movimento ENABLE ROW LEVEL SECURITY;

-- CAUSALE_DOCUMENTO: Tutti possono leggere
CREATE POLICY causale_documento_select_policy ON causale_documento
  FOR SELECT
  USING (true);

-- MOVIMENTO: Policy SELECT
CREATE POLICY movimento_select_policy ON movimento
  FOR SELECT
  USING (azienda_id = public.get_user_azienda_id());

-- MOVIMENTO: Policy INSERT
CREATE POLICY movimento_insert_policy ON movimento
  FOR INSERT
  WITH CHECK (azienda_id = public.get_user_azienda_id());

-- MOVIMENTO: Policy UPDATE
CREATE POLICY movimento_update_policy ON movimento
  FOR UPDATE
  USING (azienda_id = public.get_user_azienda_id());

-- MOVIMENTO: Policy DELETE
CREATE POLICY movimento_delete_policy ON movimento
  FOR DELETE
  USING (azienda_id = public.get_user_azienda_id());

-- DETTAGLIO: Policy unificata
CREATE POLICY dettaglio_movimento_all_policy ON dettaglio_movimento
  FOR ALL
  USING (
    movimento_id IN (
      SELECT id FROM movimento WHERE azienda_id = public.get_user_azienda_id()
    )
  );

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT ON causale_documento TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON movimento TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON dettaglio_movimento TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE causale_documento_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE movimento_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE dettaglio_movimento_id_seq TO authenticated;

-- =====================================================
-- VISTA: movimento_completo (per facilitare query)
-- =====================================================

CREATE OR REPLACE VIEW movimento_completo AS
SELECT
  m.*,
  c.codice AS causale_codice,
  c.descrizione AS causale_descrizione,
  c.tipo_documento,
  c.tipo_operazione,
  s.ragione_sociale AS soggetto_nome,
  s.codice_fiscale AS soggetto_cf,
  s.partita_iva AS soggetto_piva,
  mag.nome AS magazzino_nome,
  mp.nome AS metodo_pagamento_nome
FROM movimento m
LEFT JOIN causale_documento c ON m.causale_id = c.id
LEFT JOIN soggetto s ON m.soggetto_id = s.id
LEFT JOIN magazzino mag ON m.magazzino_id = mag.id
LEFT JOIN metodo_pagamento mp ON m.metodo_pagamento_id = mp.id;

COMMENT ON VIEW movimento_completo IS 'Vista denormalizzata con tutti i dati del movimento';

-- =====================================================
-- FINE MIGRATION
-- =====================================================
