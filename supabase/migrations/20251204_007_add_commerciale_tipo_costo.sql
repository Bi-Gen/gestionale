-- MIGRATION: Aggiunge 'commerciale' ai valori ammessi per tipo_costo
-- Data: 2024-12-04
-- Descrizione: Aggiunge il tipo costo 'commerciale' per classificare
-- costi commerciali come provvigioni agenti, spese di vendita, marketing, ecc.

-- Rimuove il vecchio constraint
ALTER TABLE piano_conti
DROP CONSTRAINT IF EXISTS piano_conti_tipo_costo_check;

-- Aggiunge il nuovo constraint con 'commerciale'
ALTER TABLE piano_conti
ADD CONSTRAINT piano_conti_tipo_costo_check
CHECK (tipo_costo IN ('merce', 'servizi', 'trasporti', 'utility', 'finanziari', 'commerciale', 'altro'));

COMMENT ON COLUMN piano_conti.tipo_costo IS
'Classificazione del tipo di costo per analisi: merce (COGS), servizi, trasporti, utility, finanziari, commerciale (provvigioni, marketing), altro';
