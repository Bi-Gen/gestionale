-- =====================================================
-- SQL DI INSERIMENTO DATI TEST
-- Cliente: cl32 (Bulgar International Ltd)
-- Fornitore: fo14 (Qingdao Runjie)
-- Prodotto: TLB451X1BL
-- Movimenti: 15 (12 vendite + 3 acquisti)
-- =====================================================

-- NOTA: Questo script deve essere eseguito dopo il login come utente normale
-- Il contesto azienda_id sarà automaticamente impostato dall'utente loggato

-- =====================================================
-- 1. CLIENTE
-- =====================================================

-- Cliente: cl32 - Bulgar International Ltd
INSERT INTO soggetto (codice, ragione_sociale, tipo, nazione, valuta, agente, provvigione_agente_perc, giorni_pagamento, settore)
VALUES (
  'cl32',
  'Bulgar International Ltd',
  'cliente',
  'BG',  -- Bulgaria
  'EUR',
  'Massimo Ricciolio',
  0.02,
  0,
  'Bulgaria'
);

-- =====================================================
-- 2. FORNITORE
-- =====================================================

-- Fornitore: fo14 - Qingdao Runjie New Material Technology Co. Ltd
INSERT INTO soggetto (codice, ragione_sociale, tipo, nazione, valuta, giorni_pagamento, settore)
VALUES (
  'fo14',
  'Qingdao Runjie New Material Technology Co. Ltd',
  'fornitore',
  'CN',  -- China
  'EUR',
  90,
  'Shandong (China)'
);

-- =====================================================
-- 3. PRODOTTO
-- =====================================================

-- Brand
INSERT INTO brand (nome)
VALUES ('Lucky')
ON CONFLICT (nome) DO NOTHING;

-- Prodotto: TLB451X1BL
INSERT INTO prodotto (
  codice,
  nome,
  brand_id,
  unita_misura,
  cartoni_per_pedana,
  prezzo_magazzino
) VALUES (
  'TLB451X1BL',
  'Tovaglia in TNT Qingdao,  Lucky Basic,  45GSM,  100x100 - Blu Dark, ',
  (SELECT id FROM brand WHERE nome = 'Lucky' LIMIT 1),
  'CRT',
  54,
  8.065
);

-- =====================================================
-- 4. MAGAZZINI
-- =====================================================

INSERT INTO magazzino (codice, nome)
VALUES ('Transito M', 'Transito Magazzino La Freccia')
ON CONFLICT (codice) DO NOTHING;

INSERT INTO magazzino (codice, nome)
VALUES ('Orlando Tr', 'Orlando Trasporti')
ON CONFLICT (codice) DO NOTHING;

-- =====================================================
-- 5. MOVIMENTI
-- =====================================================

-- NOTA: Per inserire i movimenti è necessario:
-- 1. Conoscere gli ID di causale_documento per "Vendita" e "Ordine Passivo" e "Ordine Attivo"
-- 2. Conoscere gli ID di aliquota_iva per IVA esente (0%)
-- 3. Gli ID di soggetto, prodotto e magazzino appena creati

-- Query per ottenere gli ID necessari:
SELECT id, codice, descrizione FROM causale_documento WHERE codice IN ('VEN', 'OPA', 'OAT');
SELECT id, percentuale, descrizione FROM aliquota_iva WHERE percentuale = 0;
SELECT id, codice, ragione_sociale FROM soggetto WHERE codice IN ('cl32', 'fo14');
SELECT id, codice, nome FROM prodotto WHERE codice = 'TLB451X1BL';
SELECT id, codice, nome FROM magazzino;

-- =====================================================
-- 6. TEMPLATE PER INSERIMENTO MOVIMENTI
-- =====================================================

-- Dopo aver ottenuto gli ID, utilizzare questo template per ogni movimento:

/*
DO $$
DECLARE
  v_movimento_id INT;
  v_causale_id INT;
  v_soggetto_id INT;
  v_prodotto_id INT;
  v_magazzino_id INT;
  v_aliquota_iva_id INT;
BEGIN

  -- Ottieni ID necessari
  SELECT id INTO v_causale_id FROM causale_documento WHERE codice = 'VEN' LIMIT 1;
  SELECT id INTO v_soggetto_id FROM soggetto WHERE codice = 'cl32' LIMIT 1;
  SELECT id INTO v_prodotto_id FROM prodotto WHERE codice = 'TLB451X1BL' LIMIT 1;
  SELECT id INTO v_magazzino_id FROM magazzino WHERE nome = 'Transito Magazzino La Freccia' LIMIT 1;
  SELECT id INTO v_aliquota_iva_id FROM aliquota_iva WHERE percentuale = 0 LIMIT 1;

  -- Crea movimento
  INSERT INTO movimento (
    causale_id,
    soggetto_id,
    magazzino_id,
    data_movimento,
    numero_documento,
    valuta,
    agente,
    provvigione_agente_perc,
    provvigione_agente_valore,
    termini_resa,
    vettore,
    centro_costo,
    note,
    imponibile,
    iva,
    totale
  ) VALUES (
    v_causale_id,
    v_soggetto_id,
    v_magazzino_id,
    '2025-11-25',
    'FPR 66/25',
    'EUR',
    'Massimo Ricciolio',
    0.02,
    74.8432,
    'Franco Magazzino Fornitore',
    'Mittente',
    '09120-527',
    'Vendita Tovaglie',
    3742.16,
    0,
    3742.16
  ) RETURNING id INTO v_movimento_id;

  -- Crea dettaglio movimento
  INSERT INTO dettaglio_movimento (
    movimento_id,
    prodotto_id,
    descrizione,
    quantita,
    unita_misura,
    prezzo_unitario,
    imponibile,
    aliquota_iva_id,
    iva,
    totale,
    brand
  ) VALUES (
    v_movimento_id,
    v_prodotto_id,
    'Tovaglia in TNT Qingdao,  Lucky Basic,  45GSM,  100x100 - Blu Dark, ',
    464,
    'CRT',
    8.065,
    3742.16,
    v_aliquota_iva_id,
    0,
    3742.16,
    'Lucky'
  );

END $$;
*/

-- =====================================================
-- 7. RIEPILOGO DATI DA IMPORTARE
-- =====================================================

-- Vendite (12):
--   1. Doc: FPR 66/25, Data: 2025-11-25, Qty: 464 CRT, Prezzo: €8.065, Tot: €3742.16
--   2. Doc: 09041-120, Data: 2025-09-04, Qty: 444 CRT, Prezzo: €8.065, Tot: €3580.8599999999997
--   3. Doc: 09041-121, Data: 2025-09-04, Qty: 501 CRT, Prezzo: €8.065, Tot: €4040.5649999999996
--   4. Doc: 11120-901, Data: 2025-11-13, Qty: 270 CRT, Prezzo: €7.97, Tot: €2151.9
--   5. Doc: 11120-902, Data: 2025-11-13, Qty: 324 CRT, Prezzo: €7.97, Tot: €2582.2799999999997
--   6. Doc: 11120-903, Data: 2025-11-13, Qty: 324 CRT, Prezzo: €7.97, Tot: €2582.2799999999997
--   7. Doc: 11120-904, Data: 2025-11-13, Qty: 270 CRT, Prezzo: €7.97, Tot: €2151.9
--   8. Doc: 11120-905, Data: 2025-11-13, Qty: 324 CRT, Prezzo: €7.97, Tot: €2582.2799999999997
--   9. Doc: 11120-906, Data: 2025-11-13, Qty: 270 CRT, Prezzo: €7.97, Tot: €2151.9
--   10. Doc: 11120-907, Data: 2025-11-13, Qty: 270 CRT, Prezzo: €7.97, Tot: €2151.9
--   11. Doc: 11120-908, Data: 2025-11-13, Qty: 270 CRT, Prezzo: €7.97, Tot: €2151.9
--   12. Doc: 11120-909, Data: 2025-11-13, Qty: 324 CRT, Prezzo: €7.97, Tot: €2582.2799999999997

-- Acquisti (3):
--   1. Doc: 09120-527, Data: 2025-09-16, Qty: 464 CRT, Prezzo: €7.9399999999999995, Tot: €3684.16
--   2. Doc: 09120-528, Data: 2025-09-16, Qty: 444 CRT, Prezzo: €7.9399999999999995, Tot: €3525.3599999999997
--   3. Doc: 09120-529, Data: 2025-09-16, Qty: 501 CRT, Prezzo: €7.9399999999999995, Tot: €3977.9399999999996

-- Totale vendite: €32452.21
-- Totale acquisti: €11187.46
-- Margine lordo: €21264.75
-- Margine %: 65.53%
