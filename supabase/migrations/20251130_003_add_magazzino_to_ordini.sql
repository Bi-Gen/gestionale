-- =====================================================
-- MIGRATION: Aggiunge magazzino_id a ordini
-- Data: 2025-11-30
-- Descrizione: Collega ordini al magazzino per integrazione movimenti
-- =====================================================

-- Aggiunge colonna magazzino_id alla tabella ordini
ALTER TABLE ordini
ADD COLUMN magazzino_id INT REFERENCES magazzino(id) ON DELETE RESTRICT;

-- Indice per performance
CREATE INDEX idx_ordini_magazzino_id ON ordini(magazzino_id) WHERE magazzino_id IS NOT NULL;

-- Commento
COMMENT ON COLUMN ordini.magazzino_id IS
'Magazzino da cui prelevare (vendita) o a cui caricare (acquisto) i prodotti.
Se NULL, usa il magazzino principale.';

-- =====================================================
-- Imposta magazzino principale per ordini esistenti
-- =====================================================

-- Per ogni azienda, trova il magazzino principale e aggiornalo negli ordini esistenti
UPDATE ordini o
SET magazzino_id = (
  SELECT m.id
  FROM magazzino m
  WHERE m.azienda_id = o.azienda_id
    AND m.principale = true
    AND m.attivo = true
  LIMIT 1
)
WHERE o.magazzino_id IS NULL;

-- =====================================================
-- FINE MIGRATION
-- =====================================================
