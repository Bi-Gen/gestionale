-- =====================================================
-- MIGRATION: Rimozione campi legacy prezzo_listino1-5
-- Data: 2025-12-09
-- Descrizione: Rimuove campi ridondanti dalla tabella prodotto.
--              I prezzi per listino sono ora gestiti in listino_prodotto.
-- =====================================================

-- Rimuovi campi legacy (sostituiti da tabella listino_prodotto)
ALTER TABLE prodotto DROP COLUMN IF EXISTS prezzo_listino1;
ALTER TABLE prodotto DROP COLUMN IF EXISTS prezzo_listino2;
ALTER TABLE prodotto DROP COLUMN IF EXISTS prezzo_listino3;
ALTER TABLE prodotto DROP COLUMN IF EXISTS prezzo_listino4;
ALTER TABLE prodotto DROP COLUMN IF EXISTS prezzo_listino5;

-- =====================================================
-- FINE MIGRATION
-- =====================================================
