-- =====================================================
-- MIGRATION: Tabelle Ordini (Vendita e Acquisto)
-- Data: 2025-11-30
-- Descrizione: Crea tabelle ordini e dettagli_ordini
-- =====================================================

-- =====================================================
-- TABELLA: ordini (testata ordine)
-- =====================================================

CREATE TABLE IF NOT EXISTS ordini (
  id SERIAL PRIMARY KEY,
  azienda_id UUID NOT NULL REFERENCES azienda(id) ON DELETE CASCADE,

  -- === IDENTIFICAZIONE ORDINE ===
  numero_ordine VARCHAR(50) NOT NULL,  -- Numero ordine (es: "ORD-2025-001")
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('vendita', 'acquisto')),

  -- === RIFERIMENTI ===
  -- Un ordine di vendita ha cliente_id, un ordine di acquisto ha fornitore_id
  cliente_id INT REFERENCES soggetto(id) ON DELETE RESTRICT,
  fornitore_id INT REFERENCES soggetto(id) ON DELETE RESTRICT,

  -- === DATI ORDINE ===
  data_ordine DATE NOT NULL,
  stato VARCHAR(50) DEFAULT 'bozza',  -- bozza, confermato, evaso, annullato, etc.

  -- === IMPORTI ===
  totale DECIMAL(12,2) NOT NULL DEFAULT 0.00,  -- Totale ordine (calcolato dai dettagli)

  -- === NOTE ===
  note TEXT,

  -- === AUDIT ===
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- === CONSTRAINT ===
  -- Un ordine deve avere ALMENO cliente_id O fornitore_id
  CONSTRAINT chk_ordini_soggetto CHECK (
    (tipo = 'vendita' AND cliente_id IS NOT NULL AND fornitore_id IS NULL) OR
    (tipo = 'acquisto' AND fornitore_id IS NOT NULL AND cliente_id IS NULL)
  ),

  -- Numero ordine univoco per azienda e tipo
  CONSTRAINT uq_ordini_numero_ordine UNIQUE (azienda_id, numero_ordine, tipo)
);

-- =====================================================
-- TABELLA: dettagli_ordini (righe ordine con prodotti)
-- =====================================================

CREATE TABLE IF NOT EXISTS dettagli_ordini (
  id SERIAL PRIMARY KEY,

  -- === RIFERIMENTI ===
  ordine_id INT NOT NULL REFERENCES ordini(id) ON DELETE CASCADE,
  prodotto_id INT NOT NULL REFERENCES prodotto(id) ON DELETE RESTRICT,

  -- === QUANTITÀ E PREZZI ===
  quantita DECIMAL(12,3) NOT NULL CHECK (quantita > 0),
  prezzo_unitario DECIMAL(12,2) NOT NULL CHECK (prezzo_unitario >= 0),
  subtotale DECIMAL(12,2) NOT NULL CHECK (subtotale >= 0),

  -- === AUDIT ===
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDICI per performance
-- =====================================================

-- Indice multi-tenancy (CRITICAL)
CREATE INDEX idx_ordini_azienda_id ON ordini(azienda_id);

-- Indici per tipo ordine (per filtrare vendita/acquisto)
CREATE INDEX idx_ordini_tipo ON ordini(tipo);

-- Indici per data (query frequenti per periodo)
CREATE INDEX idx_ordini_data_ordine ON ordini(data_ordine DESC);

-- Indici per stato (filtri su ordini aperti/chiusi)
CREATE INDEX idx_ordini_stato ON ordini(stato);

-- Indici per clienti e fornitori (JOIN frequenti)
CREATE INDEX idx_ordini_cliente_id ON ordini(cliente_id) WHERE cliente_id IS NOT NULL;
CREATE INDEX idx_ordini_fornitore_id ON ordini(fornitore_id) WHERE fornitore_id IS NOT NULL;

-- Indice per numero ordine (ricerca diretta)
CREATE INDEX idx_ordini_numero_ordine ON ordini(numero_ordine);

-- Indici per dettagli_ordini
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
-- FUNZIONE: Ricalcola totale ordine dopo modifica dettagli
-- =====================================================

CREATE OR REPLACE FUNCTION ricalcola_totale_ordine()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Ricalcola il totale dell'ordine sommando tutti i subtotali dei dettagli
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

COMMENT ON FUNCTION ricalcola_totale_ordine() IS
'Ricalcola automaticamente il totale dell''ordine quando vengono inseriti, modificati o eliminati dettagli.';

-- =====================================================
-- TRIGGER: Ricalcola totale dopo INSERT/UPDATE/DELETE dettagli
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
-- COMMENTI
-- =====================================================

COMMENT ON TABLE ordini IS
'Tabella unificata per ordini di vendita e ordini di acquisto.
tipo = ''vendita'' richiede cliente_id, tipo = ''acquisto'' richiede fornitore_id.';

COMMENT ON COLUMN ordini.numero_ordine IS
'Numero univoco ordine per azienda e tipo (es: ORD-V-2025-001, ORD-A-2025-001).';

COMMENT ON COLUMN ordini.stato IS
'Stati possibili: bozza, confermato, in_lavorazione, evaso, parzialmente_evaso, annullato, etc.';

COMMENT ON TABLE dettagli_ordini IS
'Righe dell''ordine contenenti i prodotti ordinati con quantità e prezzi.';

COMMENT ON COLUMN dettagli_ordini.subtotale IS
'Subtotale della riga = quantita * prezzo_unitario. Calcolato dall''applicazione.';

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE ordini ENABLE ROW LEVEL SECURITY;
ALTER TABLE dettagli_ordini ENABLE ROW LEVEL SECURITY;

-- Policy: utenti possono vedere solo ordini della propria azienda
CREATE POLICY ordini_select_policy ON ordini
  FOR SELECT
  USING (azienda_id = public.get_user_azienda_id());

-- Policy: utenti con permesso 'ordini/write' possono inserire
CREATE POLICY ordini_insert_policy ON ordini
  FOR INSERT
  WITH CHECK (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('ordini', 'write')
  );

-- Policy: utenti con permesso 'ordini/write' possono aggiornare
CREATE POLICY ordini_update_policy ON ordini
  FOR UPDATE
  USING (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('ordini', 'write')
  );

-- Policy: utenti con permesso 'ordini/delete' possono eliminare
CREATE POLICY ordini_delete_policy ON ordini
  FOR DELETE
  USING (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('ordini', 'delete')
  );

-- Policy: dettagli_ordini - SELECT (tramite join con ordini)
CREATE POLICY dettagli_ordini_select_policy ON dettagli_ordini
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ordini
      WHERE ordini.id = dettagli_ordini.ordine_id
      AND ordini.azienda_id = public.get_user_azienda_id()
    )
  );

-- Policy: dettagli_ordini - INSERT (tramite join con ordini)
CREATE POLICY dettagli_ordini_insert_policy ON dettagli_ordini
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ordini
      WHERE ordini.id = dettagli_ordini.ordine_id
      AND ordini.azienda_id = public.get_user_azienda_id()
      AND public.user_has_permission('ordini', 'write')
    )
  );

-- Policy: dettagli_ordini - UPDATE
CREATE POLICY dettagli_ordini_update_policy ON dettagli_ordini
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM ordini
      WHERE ordini.id = dettagli_ordini.ordine_id
      AND ordini.azienda_id = public.get_user_azienda_id()
      AND public.user_has_permission('ordini', 'write')
    )
  );

-- Policy: dettagli_ordini - DELETE
CREATE POLICY dettagli_ordini_delete_policy ON dettagli_ordini
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM ordini
      WHERE ordini.id = dettagli_ordini.ordine_id
      AND ordini.azienda_id = public.get_user_azienda_id()
      AND public.user_has_permission('ordini', 'delete')
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
