-- =====================================================
-- MIGRATION: Migrazione Dati Ordini -> Movimento
-- Data: 2025-12-02
-- Descrizione: Copia dati da tabella ordini a movimento
--              SENZA eliminare ordini (per compatibilità)
-- =====================================================

-- =====================================================
-- STEP 1: Migra Ordini -> Movimento
-- =====================================================

INSERT INTO movimento (
  azienda_id,
  causale_id,
  numero_documento,
  data_documento,
  soggetto_id,
  imponibile,
  iva,
  totale,
  magazzino_id,
  stato,
  note,
  created_by,
  created_at,
  updated_at
)
SELECT
  o.azienda_id,
  -- Mappa tipo ordine a causale_id
  CASE
    WHEN o.tipo = 'vendita' THEN (SELECT id FROM causale_documento WHERE codice = 'ORD_VEN' LIMIT 1)
    WHEN o.tipo = 'acquisto' THEN (SELECT id FROM causale_documento WHERE codice = 'ORD_ACQ' LIMIT 1)
  END AS causale_id,
  o.numero_ordine AS numero_documento,
  o.data_ordine AS data_documento,
  -- Soggetto: cliente_id per vendita, fornitore_id per acquisto
  COALESCE(o.cliente_id, o.fornitore_id) AS soggetto_id,
  -- Per ora impostiamo imponibile = totale (calcoleremo IVA dopo se necessario)
  o.totale AS imponibile,
  0 AS iva, -- Calcolato dopo se serve
  o.totale,
  NULL AS magazzino_id, -- Gli ordini attuali non hanno magazzino_id
  o.stato,
  o.note,
  o.created_by,
  o.created_at,
  o.updated_at
FROM ordini o
WHERE NOT EXISTS (
  -- Evita duplicati se la migration viene eseguita più volte
  SELECT 1 FROM movimento m
  WHERE m.numero_documento = o.numero_ordine
    AND m.azienda_id = o.azienda_id
);

-- =====================================================
-- STEP 2: Migra Dettagli Ordini -> Dettaglio Movimento
-- =====================================================

INSERT INTO dettaglio_movimento (
  movimento_id,
  prodotto_id,
  descrizione,
  quantita,
  prezzo_unitario,
  sconto_percentuale,
  sconto_importo,
  imponibile,
  aliquota_iva_id,
  iva,
  totale,
  created_at,
  updated_at
)
SELECT
  m.id AS movimento_id,
  d.prodotto_id,
  p.nome AS descrizione,
  d.quantita,
  d.prezzo_unitario,
  0 AS sconto_percentuale,
  0 AS sconto_importo,
  d.subtotale AS imponibile,
  NULL AS aliquota_iva_id, -- Da assegnare manualmente se necessario
  0 AS iva,
  d.subtotale AS totale,
  d.created_at,
  d.updated_at
FROM dettagli_ordini d
JOIN ordini o ON d.ordine_id = o.id
JOIN movimento m ON m.numero_documento = o.numero_ordine AND m.azienda_id = o.azienda_id
JOIN prodotto p ON d.prodotto_id = p.id
WHERE NOT EXISTS (
  -- Evita duplicati
  SELECT 1 FROM dettaglio_movimento dm
  WHERE dm.movimento_id = m.id AND dm.prodotto_id = d.prodotto_id
);

-- =====================================================
-- STEP 3: Aggiorna magazzino_id nei movimenti migrati
-- =====================================================

-- Tenta di assegnare il magazzino principale dell'azienda
UPDATE movimento m
SET magazzino_id = (
  SELECT id
  FROM magazzino mag
  WHERE mag.azienda_id = m.azienda_id
    AND mag.principale = true
  LIMIT 1
)
WHERE m.magazzino_id IS NULL
  AND m.causale_id IN (
    SELECT id FROM causale_documento WHERE codice IN ('ORD_VEN', 'ORD_ACQ')
  );

-- =====================================================
-- STEP 4: Aggiorna collegamenti movimento_magazzino
-- =====================================================

-- Aggiorna i movimenti di magazzino che erano collegati a ordini
-- per collegarli ai nuovi movimenti corrispondenti

UPDATE movimento_magazzino mm
SET
  documento_tipo = 'movimento',
  documento_id = (
    SELECT m.id
    FROM movimento m
    JOIN ordini o ON m.numero_documento = o.numero_ordine AND m.azienda_id = o.azienda_id
    WHERE mm.documento_tipo = 'ordine' AND mm.documento_id = o.id
  )
WHERE mm.documento_tipo = 'ordine'
  AND EXISTS (
    SELECT 1
    FROM movimento m
    JOIN ordini o ON m.numero_documento = o.numero_ordine AND m.azienda_id = o.azienda_id
    WHERE mm.documento_id = o.id
  );

-- =====================================================
-- STEP 5: Crea vista compatibilità per query esistenti
-- =====================================================

-- Vista che mantiene la struttura "ordini" per compatibilità con codice esistente
CREATE OR REPLACE VIEW ordini_compat AS
SELECT
  m.id,
  m.azienda_id,
  m.numero_documento AS numero_ordine,
  CASE
    WHEN cd.tipo_operazione = 'vendita' THEN 'vendita'
    WHEN cd.tipo_operazione = 'acquisto' THEN 'acquisto'
  END AS tipo,
  CASE
    WHEN cd.tipo_operazione = 'vendita' THEN m.soggetto_id
    ELSE NULL
  END AS cliente_id,
  CASE
    WHEN cd.tipo_operazione = 'acquisto' THEN m.soggetto_id
    ELSE NULL
  END AS fornitore_id,
  m.data_documento AS data_ordine,
  m.stato,
  m.totale,
  m.note,
  m.created_by,
  m.created_at,
  m.updated_at
FROM movimento m
JOIN causale_documento cd ON m.causale_id = cd.id
WHERE cd.tipo_documento = 'ordine';

COMMENT ON VIEW ordini_compat IS 'Vista di compatibilità per query esistenti su tabella ordini';

-- Vista dettagli_ordini compatibilità
CREATE OR REPLACE VIEW dettagli_ordini_compat AS
SELECT
  dm.id,
  m.id AS ordine_id,
  dm.prodotto_id,
  dm.quantita,
  dm.prezzo_unitario,
  dm.totale AS subtotale,
  dm.created_at,
  dm.updated_at
FROM dettaglio_movimento dm
JOIN movimento m ON dm.movimento_id = m.id
JOIN causale_documento cd ON m.causale_id = cd.id
WHERE cd.tipo_documento = 'ordine';

COMMENT ON VIEW dettagli_ordini_compat IS 'Vista di compatibilità per query esistenti su dettagli_ordini';

-- =====================================================
-- STEP 6: Log migrazione
-- =====================================================

DO $$
DECLARE
  v_count_ordini INT;
  v_count_movimenti INT;
  v_count_dettagli_ordini INT;
  v_count_dettagli_movimento INT;
BEGIN
  SELECT COUNT(*) INTO v_count_ordini FROM ordini;
  SELECT COUNT(*) INTO v_count_movimenti FROM movimento WHERE causale_id IN (SELECT id FROM causale_documento WHERE codice IN ('ORD_VEN', 'ORD_ACQ'));
  SELECT COUNT(*) INTO v_count_dettagli_ordini FROM dettagli_ordini;
  SELECT COUNT(*) INTO v_count_dettagli_movimento FROM dettaglio_movimento dm JOIN movimento m ON dm.movimento_id = m.id WHERE m.causale_id IN (SELECT id FROM causale_documento WHERE codice IN ('ORD_VEN', 'ORD_ACQ'));

  RAISE NOTICE '=== MIGRAZIONE ORDINI -> MOVIMENTO ===';
  RAISE NOTICE 'Ordini originali: %', v_count_ordini;
  RAISE NOTICE 'Movimenti creati: %', v_count_movimenti;
  RAISE NOTICE 'Dettagli ordini originali: %', v_count_dettagli_ordini;
  RAISE NOTICE 'Dettagli movimento creati: %', v_count_dettagli_movimento;
  RAISE NOTICE '========================================';
END $$;

-- =====================================================
-- NOTE IMPORTANTI
-- =====================================================

-- NOTA 1: Le tabelle ordini e dettagli_ordini NON vengono eliminate
--         per mantenere compatibilità con codice esistente

-- NOTA 2: Le viste ordini_compat e dettagli_ordini_compat permettono
--         alle query esistenti di continuare a funzionare

-- NOTA 3: Nuove funzionalità (fatture, note credito) useranno
--         direttamente la tabella movimento

-- NOTA 4: In futuro, dopo aver aggiornato tutto il codice,
--         si potrà eliminare ordini e dettagli_ordini e rinominare
--         le viste rimuovendo il suffisso _compat

-- =====================================================
-- FINE MIGRATION
-- =====================================================
