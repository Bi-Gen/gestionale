-- =====================================================
-- MIGRATION: Campi aggiuntivi ordini per PDF
-- Data: 2025-12-09
-- Descrizione: Aggiunge metodo_pagamento_id, agente_id, data_consegna_prevista
-- =====================================================

-- Metodo pagamento
ALTER TABLE ordini
ADD COLUMN IF NOT EXISTS metodo_pagamento_id INT REFERENCES metodo_pagamento(id) ON DELETE SET NULL;

-- Agente assegnato all'ordine
ALTER TABLE ordini
ADD COLUMN IF NOT EXISTS agente_id INT REFERENCES soggetto(id) ON DELETE SET NULL;

-- Data consegna prevista
ALTER TABLE ordini
ADD COLUMN IF NOT EXISTS data_consegna_prevista DATE;

-- Sconto percentuale totale ordine
ALTER TABLE ordini
ADD COLUMN IF NOT EXISTS sconto_percentuale DECIMAL(5,2) DEFAULT 0;

-- Commenti
COMMENT ON COLUMN ordini.metodo_pagamento_id IS 'Metodo di pagamento associato all''ordine';
COMMENT ON COLUMN ordini.agente_id IS 'Agente commerciale assegnato all''ordine';
COMMENT ON COLUMN ordini.data_consegna_prevista IS 'Data prevista di consegna merce';
COMMENT ON COLUMN ordini.sconto_percentuale IS 'Sconto percentuale applicato al totale ordine';

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_ordini_metodo_pagamento ON ordini(metodo_pagamento_id);
CREATE INDEX IF NOT EXISTS idx_ordini_agente ON ordini(agente_id);
CREATE INDEX IF NOT EXISTS idx_ordini_data_consegna ON ordini(data_consegna_prevista);

-- Aggiunge anche sconto_percentuale a dettagli_ordini se non esiste
ALTER TABLE dettagli_ordini
ADD COLUMN IF NOT EXISTS sconto_percentuale DECIMAL(5,2) DEFAULT 0;

-- =====================================================
-- FINE MIGRATION
-- =====================================================
