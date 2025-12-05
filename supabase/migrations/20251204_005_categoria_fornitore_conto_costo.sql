-- =====================================================
-- MIGRATION: Aggiungi conto_costo_default a categoria_fornitore
-- Data: 2025-12-04
-- Descrizione: Collega ogni categoria fornitore a un conto costi
--              del piano conti per analisi automatiche dei costi
-- =====================================================

-- =====================================================
-- STEP 1: Aggiungere colonna conto_costo_default_id
-- =====================================================

-- Aggiungi FK al piano_conti per il conto costi di default
ALTER TABLE categoria_fornitore
ADD COLUMN IF NOT EXISTS conto_costo_default_id INT REFERENCES piano_conti(id) ON DELETE SET NULL;

-- Indice per query veloci
CREATE INDEX IF NOT EXISTS idx_categoria_fornitore_conto_costo
ON categoria_fornitore(conto_costo_default_id)
WHERE conto_costo_default_id IS NOT NULL;

COMMENT ON COLUMN categoria_fornitore.conto_costo_default_id IS
'Conto costi predefinito per questa categoria fornitore (per contabilizzazione automatica fatture acquisto)';

-- =====================================================
-- STEP 2: Aggiungere colonna tipo_costo per classificazione
-- =====================================================

-- Tipo di costo per analisi (merce, servizi, trasporti, utility, finanziari)
ALTER TABLE categoria_fornitore
ADD COLUMN IF NOT EXISTS tipo_costo VARCHAR(50) DEFAULT 'servizi'
CHECK (tipo_costo IN ('merce', 'servizi', 'trasporti', 'utility', 'finanziari', 'altro'));

COMMENT ON COLUMN categoria_fornitore.tipo_costo IS
'Classificazione costo: merce (COGS), servizi, trasporti, utility, finanziari, altro';

-- =====================================================
-- FINE MIGRATION
-- =====================================================
