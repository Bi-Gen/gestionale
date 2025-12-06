-- =====================================================
-- MIGRATION: Tabella Brand
-- Data: 2025-12-06
-- Descrizione: Anagrafica marchi/brand prodotti
-- =====================================================

-- =====================================================
-- TABELLA: brand
-- =====================================================

-- Crea tabella base se non esiste
CREATE TABLE IF NOT EXISTS brand (
  id SERIAL PRIMARY KEY,
  azienda_id UUID NOT NULL REFERENCES azienda(id) ON DELETE CASCADE,
  codice VARCHAR(20) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  attivo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aggiungi colonne se non esistono (per tabelle già create)
ALTER TABLE brand ADD COLUMN IF NOT EXISTS descrizione TEXT;
ALTER TABLE brand ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);
ALTER TABLE brand ADD COLUMN IF NOT EXISTS sito_web VARCHAR(255);
ALTER TABLE brand ADD COLUMN IF NOT EXISTS paese_origine VARCHAR(50);
ALTER TABLE brand ADD COLUMN IF NOT EXISTS soggetto_id INT REFERENCES soggetto(id);

-- Unique constraint (ignora errore se esiste)
DO $$
BEGIN
  ALTER TABLE brand ADD CONSTRAINT brand_azienda_codice_key UNIQUE(azienda_id, codice);
EXCEPTION
  WHEN duplicate_table THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON TABLE brand IS
'Anagrafica marchi/brand. Può essere collegato a un fornitore (soggetto).';

COMMENT ON COLUMN brand.soggetto_id IS
'Se il brand corrisponde a un fornitore, riferimento al soggetto.';

-- =====================================================
-- INDICI
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_brand_azienda_id ON brand(azienda_id);
CREATE INDEX IF NOT EXISTS idx_brand_nome ON brand(nome);
CREATE INDEX IF NOT EXISTS idx_brand_attivo ON brand(attivo) WHERE attivo = true;

-- =====================================================
-- TRIGGER per updated_at
-- =====================================================

DROP TRIGGER IF EXISTS trg_brand_updated_at ON brand;
CREATE TRIGGER trg_brand_updated_at
  BEFORE UPDATE ON brand
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE brand ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS brand_select_policy ON brand;
CREATE POLICY brand_select_policy ON brand
  FOR SELECT
  USING (azienda_id = public.get_user_azienda_id());

DROP POLICY IF EXISTS brand_insert_policy ON brand;
CREATE POLICY brand_insert_policy ON brand
  FOR INSERT
  WITH CHECK (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('prodotti', 'write')
  );

DROP POLICY IF EXISTS brand_update_policy ON brand;
CREATE POLICY brand_update_policy ON brand
  FOR UPDATE
  USING (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('prodotti', 'write')
  );

DROP POLICY IF EXISTS brand_delete_policy ON brand;
CREATE POLICY brand_delete_policy ON brand
  FOR DELETE
  USING (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('prodotti', 'delete')
  );

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON brand TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE brand_id_seq TO authenticated;

-- =====================================================
-- AGGIUNGE FOREIGN KEY a prodotto
-- =====================================================

-- Aggiunge il constraint FK che mancava
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'prodotto_brand_id_fkey'
    AND table_name = 'prodotto'
  ) THEN
    ALTER TABLE prodotto
    ADD CONSTRAINT prodotto_brand_id_fkey
    FOREIGN KEY (brand_id) REFERENCES brand(id) ON DELETE SET NULL;
  END IF;
END $$;

-- =====================================================
-- FINE MIGRATION
-- =====================================================
