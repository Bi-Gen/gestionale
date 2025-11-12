-- Migrazione per supportare ordini di vendita e acquisto

-- Aggiungi colonna tipo_ordine alla tabella ordini
ALTER TABLE ordini
ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'vendita' CHECK (tipo IN ('vendita', 'acquisto'));

-- Aggiungi colonna fornitore_id per ordini di acquisto
ALTER TABLE ordini
ADD COLUMN IF NOT EXISTS fornitore_id UUID REFERENCES fornitori(id) ON DELETE SET NULL;

-- Aggiorna constraint per cliente_id e fornitore_id
-- Un ordine deve avere o un cliente_id (vendita) o un fornitore_id (acquisto)
ALTER TABLE ordini
DROP CONSTRAINT IF EXISTS ordini_cliente_or_fornitore_check;

ALTER TABLE ordini
ADD CONSTRAINT ordini_cliente_or_fornitore_check
CHECK (
  (tipo = 'vendita' AND cliente_id IS NOT NULL AND fornitore_id IS NULL) OR
  (tipo = 'acquisto' AND fornitore_id IS NOT NULL AND cliente_id IS NULL)
);

-- Indici per migliorare performance
CREATE INDEX IF NOT EXISTS idx_ordini_tipo ON ordini(tipo);
CREATE INDEX IF NOT EXISTS idx_ordini_fornitore_id ON ordini(fornitore_id);

-- Commento
COMMENT ON COLUMN ordini.tipo IS 'Tipo di ordine: vendita (a cliente) o acquisto (da fornitore)';
COMMENT ON COLUMN ordini.fornitore_id IS 'ID fornitore per ordini di acquisto';
