-- =====================================================
-- MIGRAZIONE: Metodo Pagamento Default su Soggetto
-- Data: 2025-12-09
-- Descrizione: Aggiunge campo per metodo pagamento predefinito
--              sul soggetto (cliente/fornitore)
-- =====================================================

-- 1. Aggiungi campo metodo_pagamento_id al soggetto
ALTER TABLE soggetto
ADD COLUMN IF NOT EXISTS metodo_pagamento_id INTEGER REFERENCES metodo_pagamento(id) ON DELETE SET NULL;

COMMENT ON COLUMN soggetto.metodo_pagamento_id IS 'Metodo di pagamento predefinito per questo soggetto';

-- 2. Indice per ricerche veloci
CREATE INDEX IF NOT EXISTS idx_soggetto_metodo_pagamento
ON soggetto(metodo_pagamento_id)
WHERE metodo_pagamento_id IS NOT NULL;

-- =====================================================
-- FINE MIGRAZIONE
-- =====================================================
