-- =====================================================
-- MIGRATION: Aggiungi campo aggiorna_prezzo_listino
-- Data: 2025-12-02
-- Descrizione: Aggiunge flag per indicare se aggiornare
--              il prezzo_acquisto del prodotto alla evasione ordine
-- =====================================================

-- Aggiungi colonna alla tabella dettagli_ordini
ALTER TABLE dettagli_ordini
ADD COLUMN IF NOT EXISTS aggiorna_prezzo_listino BOOLEAN DEFAULT false;

COMMENT ON COLUMN dettagli_ordini.aggiorna_prezzo_listino IS
'Se TRUE, quando l''ordine viene evaso, il prezzo_unitario diventa il nuovo prezzo_acquisto del prodotto';

-- =====================================================
-- FINE MIGRATION
-- =====================================================
