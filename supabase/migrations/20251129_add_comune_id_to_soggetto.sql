-- Migrazione: Aggiungi campo comune_id alla tabella soggetto
-- Data: 2025-11-29
-- Descrizione: Permette il collegamento diretto ai comuni per gestire meglio i dati geografici

-- Aggiungi colonna comune_id
ALTER TABLE soggetto
ADD COLUMN IF NOT EXISTS comune_id INTEGER REFERENCES comuni(id) ON DELETE SET NULL;

-- Crea indice per performance
CREATE INDEX IF NOT EXISTS idx_soggetto_comune_id ON soggetto(comune_id);

-- Commento sulla colonna
COMMENT ON COLUMN soggetto.comune_id IS 'Riferimento al comune dalla tabella geografica. Se valorizzato, citta/cap/provincia vengono derivati automaticamente';

-- Opzionale: aggiorna i record esistenti cercando di associare il comune_id
-- basandosi sui campi citta e provincia esistenti (solo se c'è corrispondenza esatta)
UPDATE soggetto s
SET comune_id = c.id
FROM comuni c
JOIN province p ON c.provincia_id = p.id
WHERE s.comune_id IS NULL
  AND LOWER(TRIM(s.citta)) = LOWER(TRIM(c.nome))
  AND UPPER(TRIM(s.provincia)) = UPPER(TRIM(p.sigla));
