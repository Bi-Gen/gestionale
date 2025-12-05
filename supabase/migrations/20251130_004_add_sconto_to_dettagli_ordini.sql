-- =====================================================
-- MIGRATION: Aggiunge sconto a dettagli_ordini
-- Data: 2025-11-30
-- Descrizione: Aggiunge campo sconto_percentuale per gestire sconti riga
-- =====================================================

-- Aggiungi colonna sconto_percentuale
ALTER TABLE dettagli_ordini
ADD COLUMN sconto_percentuale DECIMAL(5,2) DEFAULT 0 CHECK (sconto_percentuale >= 0 AND sconto_percentuale <= 100);

-- Commento
COMMENT ON COLUMN dettagli_ordini.sconto_percentuale IS
'Percentuale di sconto applicata alla riga (0-100)';

-- Aggiorna subtotale esistenti per tenere conto dello sconto (per ora tutti a 0)
-- Non facciamo nulla perché gli ordini esistenti non avevano sconto

-- =====================================================
-- FINE MIGRATION
-- =====================================================
