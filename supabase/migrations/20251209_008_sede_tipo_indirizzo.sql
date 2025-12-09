-- =====================================================
-- MIGRAZIONE: Tipo indirizzo sede (spedizione/fatturazione)
-- Data: 2025-12-09
-- Descrizione: Aggiunge flag per distinguere se la sede
--              è usata per spedizione, fatturazione o entrambi
-- =====================================================

-- 1. Aggiungi campi per tipo indirizzo alla sede_cliente
ALTER TABLE sede_cliente
ADD COLUMN IF NOT EXISTS per_spedizione BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS per_fatturazione BOOLEAN DEFAULT false;

COMMENT ON COLUMN sede_cliente.per_spedizione IS 'Indica se la sede può essere usata come indirizzo di spedizione';
COMMENT ON COLUMN sede_cliente.per_fatturazione IS 'Indica se la sede può essere usata come indirizzo di fatturazione';

-- 2. Aggiungi campo sede fatturazione agli ordini
ALTER TABLE ordini
ADD COLUMN IF NOT EXISTS sede_fatturazione_id INTEGER REFERENCES sede_cliente(id) ON DELETE SET NULL;

COMMENT ON COLUMN ordini.sede_fatturazione_id IS 'Sede di fatturazione per questo ordine (se diversa dalla sede cliente)';

-- 3. Indice per ricerche rapide
CREATE INDEX IF NOT EXISTS idx_sede_cliente_per_spedizione ON sede_cliente(cliente_id, per_spedizione)
  WHERE per_spedizione = true AND attivo = true;
CREATE INDEX IF NOT EXISTS idx_sede_cliente_per_fatturazione ON sede_cliente(cliente_id, per_fatturazione)
  WHERE per_fatturazione = true AND attivo = true;

-- =====================================================
-- FINE MIGRAZIONE
-- =====================================================
