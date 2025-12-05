-- =====================================================
-- MIGRATION: Aggiunge valuta e IVA a prodotto e soggetto
-- Data: 2025-11-29
-- Descrizione: Aggiunge campi valuta (ISO 4217) e aliquota_iva
-- =====================================================

-- =====================================================
-- TABELLA: prodotto - Aggiungi valuta
-- =====================================================

ALTER TABLE prodotto
ADD COLUMN IF NOT EXISTS valuta VARCHAR(3) DEFAULT 'EUR'
CHECK (valuta ~ '^[A-Z]{3}$');

COMMENT ON COLUMN prodotto.valuta IS
'Codice valuta ISO 4217 (es: EUR, USD, GBP).
Indica la valuta di vendita del prodotto.';

-- =====================================================
-- TABELLA: soggetto - Aggiungi valuta e IVA
-- =====================================================

ALTER TABLE soggetto
ADD COLUMN IF NOT EXISTS valuta VARCHAR(3) DEFAULT 'EUR'
CHECK (valuta ~ '^[A-Z]{3}$');

ALTER TABLE soggetto
ADD COLUMN IF NOT EXISTS aliquota_iva DECIMAL(5,2) DEFAULT 22.00
CHECK (aliquota_iva >= 0 AND aliquota_iva <= 100);

COMMENT ON COLUMN soggetto.valuta IS
'Codice valuta ISO 4217 (es: EUR, USD, GBP).
Indica la valuta preferita per transazioni con questo soggetto.';

COMMENT ON COLUMN soggetto.aliquota_iva IS
'Aliquota IVA predefinita per questo soggetto (%).
Può variare in base alla natura del soggetto (es: regime forfettario, fuori campo IVA, ecc).';

-- =====================================================
-- INDICI
-- =====================================================

-- Indice per filtrare per valuta (utile per report multi-valuta)
CREATE INDEX IF NOT EXISTS idx_prodotto_valuta ON prodotto(valuta);
CREATE INDEX IF NOT EXISTS idx_soggetto_valuta ON soggetto(valuta);

-- =====================================================
-- FINE MIGRATION
-- =====================================================
