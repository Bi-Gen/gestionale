-- =====================================================
-- MIGRAZIONE: Trasportatore e Incoterm su Ordini
-- Data: 2025-12-09
-- Descrizione: Aggiunge campi per gestire trasportatore e
--              termini di resa (incoterm) sugli ordini
-- =====================================================

-- 1. Aggiungi campo trasportatore_id agli ordini
-- Permette di specificare il trasportatore per l'ordine
ALTER TABLE ordini
ADD COLUMN IF NOT EXISTS trasportatore_id INTEGER REFERENCES soggetto(id) ON DELETE SET NULL;

COMMENT ON COLUMN ordini.trasportatore_id IS 'Trasportatore assegnato a questo ordine';

-- 2. Aggiungi campo incoterm_id agli ordini
-- Permette di specificare i termini di resa (chi paga il trasporto)
ALTER TABLE ordini
ADD COLUMN IF NOT EXISTS incoterm_id INTEGER REFERENCES incoterm(id) ON DELETE SET NULL;

COMMENT ON COLUMN ordini.incoterm_id IS 'Termini di resa (Incoterm) per questo ordine';

-- 3. Aggiungi campo per costo trasporto stimato
ALTER TABLE ordini
ADD COLUMN IF NOT EXISTS costo_trasporto DECIMAL(12,2) DEFAULT 0;

COMMENT ON COLUMN ordini.costo_trasporto IS 'Costo trasporto stimato o effettivo';

-- 4. Aggiungi campo per peso totale ordine
ALTER TABLE ordini
ADD COLUMN IF NOT EXISTS peso_totale_kg DECIMAL(12,3) DEFAULT 0;

COMMENT ON COLUMN ordini.peso_totale_kg IS 'Peso totale ordine in kg (per calcolo costo trasporto)';

-- 5. Indici per ricerche veloci
CREATE INDEX IF NOT EXISTS idx_ordini_trasportatore
ON ordini(trasportatore_id)
WHERE trasportatore_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ordini_incoterm
ON ordini(incoterm_id)
WHERE incoterm_id IS NOT NULL;

-- 6. Aggiorna anche la tabella movimento per coerenza
-- (movimento ha già incoterm_id dalla migrazione 20251206_003)
ALTER TABLE movimento
ADD COLUMN IF NOT EXISTS trasportatore_id INTEGER REFERENCES soggetto(id) ON DELETE SET NULL;

COMMENT ON COLUMN movimento.trasportatore_id IS 'Trasportatore assegnato a questo documento';

-- =====================================================
-- FINE MIGRAZIONE
-- =====================================================
