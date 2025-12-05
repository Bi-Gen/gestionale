-- =====================================================
-- MIGRATION: Categoria Cliente con Listino Default
-- Data: 2025-12-04
-- Descrizione: Crea tabella categoria_cliente per classificare
--              i clienti e associare automaticamente un listino
-- =====================================================

-- =====================================================
-- STEP 1: Creare tabella CATEGORIA_CLIENTE
-- =====================================================

CREATE TABLE IF NOT EXISTS categoria_cliente (
  id SERIAL PRIMARY KEY,
  azienda_id UUID NOT NULL REFERENCES azienda(id) ON DELETE CASCADE,

  -- Identificazione
  codice VARCHAR(20) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descrizione TEXT,

  -- Listino default per questa categoria
  listino_id INT REFERENCES listino(id) ON DELETE SET NULL,

  -- Sconto default per questa categoria (%)
  sconto_default DECIMAL(5,2) DEFAULT 0 CHECK (sconto_default >= 0 AND sconto_default <= 100),

  -- Priorità (per ordinamento)
  priorita INT DEFAULT 0,

  -- Colore per UI (hex)
  colore VARCHAR(7) DEFAULT '#6B7280',

  -- Stato
  attivo BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Vincolo unicità codice per azienda
  UNIQUE(azienda_id, codice)
);

-- Indici
CREATE INDEX idx_categoria_cliente_azienda ON categoria_cliente(azienda_id);
CREATE INDEX idx_categoria_cliente_listino ON categoria_cliente(listino_id) WHERE listino_id IS NOT NULL;

-- Commenti
COMMENT ON TABLE categoria_cliente IS 'Categorie per classificare i clienti con listino e sconto default';
COMMENT ON COLUMN categoria_cliente.listino_id IS 'Listino prezzi default per clienti di questa categoria';
COMMENT ON COLUMN categoria_cliente.sconto_default IS 'Sconto percentuale default per clienti di questa categoria';

-- Trigger updated_at
CREATE TRIGGER trg_categoria_cliente_updated_at
  BEFORE UPDATE ON categoria_cliente FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 2: RLS Policies
-- =====================================================

ALTER TABLE categoria_cliente ENABLE ROW LEVEL SECURITY;

CREATE POLICY categoria_cliente_select_policy ON categoria_cliente
  FOR SELECT
  USING (azienda_id = public.get_user_azienda_id());

CREATE POLICY categoria_cliente_insert_policy ON categoria_cliente
  FOR INSERT
  WITH CHECK (azienda_id = public.get_user_azienda_id());

CREATE POLICY categoria_cliente_update_policy ON categoria_cliente
  FOR UPDATE
  USING (azienda_id = public.get_user_azienda_id());

CREATE POLICY categoria_cliente_delete_policy ON categoria_cliente
  FOR DELETE
  USING (azienda_id = public.get_user_azienda_id());

-- =====================================================
-- STEP 3: Grant permissions
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON categoria_cliente TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE categoria_cliente_id_seq TO authenticated;

-- =====================================================
-- STEP 4: Aggiungere FK categoria_cliente a soggetto
-- =====================================================

-- Aggiungi colonna categoria_cliente_id a soggetto
ALTER TABLE soggetto
ADD COLUMN IF NOT EXISTS categoria_cliente_id INT REFERENCES categoria_cliente(id) ON DELETE SET NULL;

-- Indice per categoria
CREATE INDEX IF NOT EXISTS idx_soggetto_categoria_cliente ON soggetto(categoria_cliente_id)
  WHERE categoria_cliente_id IS NOT NULL;

COMMENT ON COLUMN soggetto.categoria_cliente_id IS 'Categoria cliente (determina listino e sconto default)';

-- =====================================================
-- STEP 5: Seed categorie di esempio (opzionale)
-- =====================================================

-- Le categorie verranno create dall'utente tramite UI

-- =====================================================
-- FINE MIGRATION
-- =====================================================
