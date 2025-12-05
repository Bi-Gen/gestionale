-- =====================================================
-- MIGRATION: Drop e Ricrea Tabelle Ordini
-- Data: 2025-11-30
-- Descrizione: Elimina tabelle vecchie e ricrea con struttura corretta
-- =====================================================

-- =====================================================
-- DROP TABELLE VECCHIE
-- =====================================================

DROP TABLE IF EXISTS dettagli_ordini CASCADE;
DROP TABLE IF EXISTS ordini CASCADE;

-- =====================================================
-- TABELLA: ordini (struttura corretta)
-- =====================================================

CREATE TABLE ordini (
  id SERIAL PRIMARY KEY,
  azienda_id UUID NOT NULL REFERENCES azienda(id) ON DELETE CASCADE,
  numero_ordine VARCHAR(50) NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('vendita', 'acquisto')),
  cliente_id INT REFERENCES soggetto(id) ON DELETE RESTRICT,
  fornitore_id INT REFERENCES soggetto(id) ON DELETE RESTRICT,
  data_ordine DATE NOT NULL,
  stato VARCHAR(50) DEFAULT 'bozza',
  totale DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  note TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT chk_ordini_soggetto CHECK (
    (tipo = 'vendita' AND cliente_id IS NOT NULL AND fornitore_id IS NULL) OR
    (tipo = 'acquisto' AND fornitore_id IS NOT NULL AND cliente_id IS NULL)
  ),
  CONSTRAINT uq_ordini_numero_ordine UNIQUE (azienda_id, numero_ordine, tipo)
);

COMMENT ON TABLE ordini IS 'Ordini di vendita e acquisto';
COMMENT ON COLUMN ordini.tipo IS 'vendita o acquisto';
COMMENT ON COLUMN ordini.stato IS 'bozza, confermato, evaso, annullato';

-- =====================================================
-- TABELLA: dettagli_ordini
-- =====================================================

CREATE TABLE dettagli_ordini (
  id SERIAL PRIMARY KEY,
  ordine_id INT NOT NULL REFERENCES ordini(id) ON DELETE CASCADE,
  prodotto_id INT NOT NULL REFERENCES prodotto(id) ON DELETE RESTRICT,
  quantita DECIMAL(12,3) NOT NULL CHECK (quantita > 0),
  prezzo_unitario DECIMAL(12,2) NOT NULL CHECK (prezzo_unitario >= 0),
  subtotale DECIMAL(12,2) NOT NULL CHECK (subtotale >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE dettagli_ordini IS 'Righe ordine con prodotti';

-- =====================================================
-- INDICI
-- =====================================================

CREATE INDEX idx_ordini_azienda_id ON ordini(azienda_id);
CREATE INDEX idx_ordini_tipo ON ordini(tipo);
CREATE INDEX idx_ordini_data_ordine ON ordini(data_ordine DESC);
CREATE INDEX idx_ordini_stato ON ordini(stato);
CREATE INDEX idx_ordini_cliente_id ON ordini(cliente_id) WHERE cliente_id IS NOT NULL;
CREATE INDEX idx_ordini_fornitore_id ON ordini(fornitore_id) WHERE fornitore_id IS NOT NULL;
CREATE INDEX idx_ordini_numero_ordine ON ordini(numero_ordine);
CREATE INDEX idx_dettagli_ordini_ordine_id ON dettagli_ordini(ordine_id);
CREATE INDEX idx_dettagli_ordini_prodotto_id ON dettagli_ordini(prodotto_id);

-- =====================================================
-- TRIGGER per updated_at
-- =====================================================

CREATE TRIGGER trg_ordini_updated_at
  BEFORE UPDATE ON ordini
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_dettagli_ordini_updated_at
  BEFORE UPDATE ON dettagli_ordini
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FUNZIONE: Ricalcola totale ordine
-- =====================================================

CREATE OR REPLACE FUNCTION ricalcola_totale_ordine()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE ordini
  SET totale = (
    SELECT COALESCE(SUM(subtotale), 0)
    FROM dettagli_ordini
    WHERE ordine_id = COALESCE(NEW.ordine_id, OLD.ordine_id)
  )
  WHERE id = COALESCE(NEW.ordine_id, OLD.ordine_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

COMMENT ON FUNCTION ricalcola_totale_ordine() IS 'Ricalcola il totale ordine sommando i subtotali dei dettagli';

-- =====================================================
-- TRIGGER: Ricalcola totale automaticamente
-- =====================================================

CREATE TRIGGER trg_dettagli_ordini_insert_update_totale
  AFTER INSERT OR UPDATE ON dettagli_ordini
  FOR EACH ROW
  EXECUTE FUNCTION ricalcola_totale_ordine();

CREATE TRIGGER trg_dettagli_ordini_delete_totale
  AFTER DELETE ON dettagli_ordini
  FOR EACH ROW
  EXECUTE FUNCTION ricalcola_totale_ordine();

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE ordini ENABLE ROW LEVEL SECURITY;
ALTER TABLE dettagli_ordini ENABLE ROW LEVEL SECURITY;

-- ORDINI: Policy SELECT
CREATE POLICY ordini_select_policy ON ordini
  FOR SELECT
  USING (azienda_id = public.get_user_azienda_id());

-- ORDINI: Policy INSERT
CREATE POLICY ordini_insert_policy ON ordini
  FOR INSERT
  WITH CHECK (azienda_id = public.get_user_azienda_id());

-- ORDINI: Policy UPDATE
CREATE POLICY ordini_update_policy ON ordini
  FOR UPDATE
  USING (azienda_id = public.get_user_azienda_id());

-- ORDINI: Policy DELETE
CREATE POLICY ordini_delete_policy ON ordini
  FOR DELETE
  USING (azienda_id = public.get_user_azienda_id());

-- DETTAGLI: Policy unificata
CREATE POLICY dettagli_ordini_all_policy ON dettagli_ordini
  FOR ALL
  USING (
    ordine_id IN (
      SELECT id FROM ordini WHERE azienda_id = public.get_user_azienda_id()
    )
  );

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON ordini TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON dettagli_ordini TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE ordini_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE dettagli_ordini_id_seq TO authenticated;

-- =====================================================
-- FINE MIGRATION
-- =====================================================
