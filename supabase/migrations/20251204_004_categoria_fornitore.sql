-- =====================================================
-- MIGRATION: Categoria Fornitore (Classificazione)
-- Data: 2025-12-04
-- Descrizione: Crea tabella categoria_fornitore per classificare
--              i fornitori (Materie Prime, Servizi, Trasporti, ecc.)
--              Solo per organizzazione e report, NO listino/sconto
-- =====================================================

-- =====================================================
-- STEP 1: Creare tabella CATEGORIA_FORNITORE
-- =====================================================

CREATE TABLE IF NOT EXISTS categoria_fornitore (
  id SERIAL PRIMARY KEY,
  azienda_id UUID NOT NULL REFERENCES azienda(id) ON DELETE CASCADE,

  -- Identificazione
  codice VARCHAR(20) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descrizione TEXT,

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
CREATE INDEX idx_categoria_fornitore_azienda ON categoria_fornitore(azienda_id);

-- Commenti
COMMENT ON TABLE categoria_fornitore IS 'Categorie per classificare i fornitori (solo organizzazione/report)';

-- Trigger updated_at
CREATE TRIGGER trg_categoria_fornitore_updated_at
  BEFORE UPDATE ON categoria_fornitore FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 2: RLS Policies
-- =====================================================

ALTER TABLE categoria_fornitore ENABLE ROW LEVEL SECURITY;

CREATE POLICY categoria_fornitore_select_policy ON categoria_fornitore
  FOR SELECT
  USING (azienda_id = public.get_user_azienda_id());

CREATE POLICY categoria_fornitore_insert_policy ON categoria_fornitore
  FOR INSERT
  WITH CHECK (azienda_id = public.get_user_azienda_id());

CREATE POLICY categoria_fornitore_update_policy ON categoria_fornitore
  FOR UPDATE
  USING (azienda_id = public.get_user_azienda_id());

CREATE POLICY categoria_fornitore_delete_policy ON categoria_fornitore
  FOR DELETE
  USING (azienda_id = public.get_user_azienda_id());

-- =====================================================
-- STEP 3: Grant permissions
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON categoria_fornitore TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE categoria_fornitore_id_seq TO authenticated;

-- =====================================================
-- STEP 4: Aggiungere FK categoria_fornitore a soggetto
-- =====================================================

-- Aggiungi colonna categoria_fornitore_id a soggetto
ALTER TABLE soggetto
ADD COLUMN IF NOT EXISTS categoria_fornitore_id INT REFERENCES categoria_fornitore(id) ON DELETE SET NULL;

-- Indice per categoria
CREATE INDEX IF NOT EXISTS idx_soggetto_categoria_fornitore ON soggetto(categoria_fornitore_id)
  WHERE categoria_fornitore_id IS NOT NULL;

COMMENT ON COLUMN soggetto.categoria_fornitore_id IS 'Categoria fornitore (per classificazione e report)';

-- =====================================================
-- STEP 5: Seed categorie di esempio
-- =====================================================

-- Le categorie verranno create dall'utente tramite UI
-- Esempi tipici: Materie Prime, Componenti, Servizi, Trasporti, Consulenza, Imballaggi

-- =====================================================
-- FINE MIGRATION
-- =====================================================
