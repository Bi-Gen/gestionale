-- =====================================================
-- MIGRATION: Tabelle Ordini - V4 (Debug)
-- Data: 2025-11-30
-- Descrizione: Versione minimale per debugging
-- =====================================================

-- Step 1: Crea tabella ordini SENZA foreign keys
CREATE TABLE IF NOT EXISTS ordini (
  id SERIAL PRIMARY KEY,
  azienda_id UUID NOT NULL,
  numero_ordine VARCHAR(50) NOT NULL,
  tipo VARCHAR(20) NOT NULL,
  cliente_id INT,
  fornitore_id INT,
  data_ordine DATE NOT NULL,
  stato VARCHAR(50) DEFAULT 'bozza',
  totale DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  note TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Crea tabella dettagli_ordini SENZA foreign keys
CREATE TABLE IF NOT EXISTS dettagli_ordini (
  id SERIAL PRIMARY KEY,
  ordine_id INT NOT NULL,
  prodotto_id INT NOT NULL,
  quantita DECIMAL(12,3) NOT NULL,
  prezzo_unitario DECIMAL(12,2) NOT NULL,
  subtotale DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Indici base
CREATE INDEX idx_ordini_azienda_id ON ordini(azienda_id);
CREATE INDEX idx_ordini_tipo ON ordini(tipo);
CREATE INDEX idx_dettagli_ordini_ordine_id ON dettagli_ordini(ordine_id);

-- Step 4: Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ordini TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON dettagli_ordini TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE ordini_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE dettagli_ordini_id_seq TO authenticated;

-- =====================================================
-- FINE MIGRATION
-- =====================================================
