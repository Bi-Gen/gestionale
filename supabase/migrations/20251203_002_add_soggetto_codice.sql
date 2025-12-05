-- =====================================================
-- MIGRATION: Aggiungi campo codice a soggetto
-- Data: 2025-12-03
-- Descrizione: Aggiunge campo codice univoco per soggetti (cl32, fo14, etc.)
-- =====================================================

-- Campo codice univoco per soggetto (es: cl32, fo14)
ALTER TABLE soggetto
ADD COLUMN IF NOT EXISTS codice VARCHAR(50);

-- Indice univoco per codice + azienda
CREATE UNIQUE INDEX IF NOT EXISTS idx_soggetto_codice_azienda
ON soggetto(azienda_id, codice)
WHERE codice IS NOT NULL;

-- Indice per ricerca per codice
CREATE INDEX IF NOT EXISTS idx_soggetto_codice
ON soggetto(codice)
WHERE codice IS NOT NULL;

COMMENT ON COLUMN soggetto.codice IS 'Codice univoco soggetto (es: cl32, fo14) per identificazione rapida';

-- =====================================================
-- FINE MIGRATION
-- =====================================================
