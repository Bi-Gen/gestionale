-- =====================================================
-- MIGRATION: Sposta tipo_costo su piano_conti
-- Data: 2025-12-04
-- Descrizione: Il tipo_costo è una proprietà del conto,
--              non della categoria fornitore.
--              Quando si seleziona un conto, il tipo
--              viene ereditato automaticamente.
-- =====================================================

-- =====================================================
-- STEP 1: Aggiungere tipo_costo a piano_conti
-- =====================================================

ALTER TABLE piano_conti
ADD COLUMN IF NOT EXISTS tipo_costo VARCHAR(50)
CHECK (tipo_costo IN ('merce', 'servizi', 'trasporti', 'utility', 'finanziari', 'altro'));

COMMENT ON COLUMN piano_conti.tipo_costo IS
'Classificazione per analisi costi: merce (COGS), servizi, trasporti, utility, finanziari, altro. Solo per conti di natura C (Costi).';

-- =====================================================
-- STEP 2: Aggiornare conti costi esistenti
-- =====================================================

-- Aggiorna in base al codice/path
UPDATE piano_conti SET tipo_costo = 'merce' WHERE codice LIKE '3.01%' AND natura = 'C';
UPDATE piano_conti SET tipo_costo = 'servizi' WHERE codice LIKE '3.02%' AND natura = 'C';
UPDATE piano_conti SET tipo_costo = 'trasporti' WHERE codice LIKE '3.03%' AND natura = 'C';
UPDATE piano_conti SET tipo_costo = 'utility' WHERE codice LIKE '3.04%' AND natura = 'C';
UPDATE piano_conti SET tipo_costo = 'finanziari' WHERE codice LIKE '3.05%' AND natura = 'C';
UPDATE piano_conti SET tipo_costo = 'altro' WHERE codice LIKE '3.06%' AND natura = 'C';

-- Per il conto macro COSTI (3), lasciamo NULL (è solo contenitore)

-- =====================================================
-- STEP 3: Rimuovere tipo_costo da categoria_fornitore
-- =====================================================

ALTER TABLE categoria_fornitore
DROP COLUMN IF EXISTS tipo_costo;

-- =====================================================
-- FINE MIGRATION
-- =====================================================
