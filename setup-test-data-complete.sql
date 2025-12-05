-- =====================================================
-- SETUP COMPLETO DATI TEST
-- =====================================================
-- Questo script:
-- 1. Pulisce tutti i dati esistenti dell'azienda corrente
-- 2. Inserisce dati test completi da Excel
-- 3. Tutto viene automaticamente associato all'azienda via RLS
-- =====================================================

-- IMPORTANTE: Eseguire questo script loggati come utente normale
-- L'azienda_id viene automaticamente gestita dalle RLS policies

BEGIN;

-- =====================================================
-- PARTE 0: DEBUG - Verifica utente e azienda corrente
-- =====================================================

SELECT * FROM public.debug_user_info();

-- =====================================================
-- PARTE 1: PULIZIA DATABASE
-- =====================================================

DO $$
DECLARE
    v_azienda_id UUID;
    v_count INT;
BEGIN
    -- Ottieni azienda_id utente corrente
    v_azienda_id := public.get_user_azienda_id();

    IF v_azienda_id IS NULL THEN
        RAISE EXCEPTION 'Nessuna azienda associata all''utente corrente';
    END IF;

    RAISE NOTICE 'Pulizia dati per azienda: %', v_azienda_id;

    -- Elimina tutti i dati transazionali dell'azienda corrente
    DELETE FROM dettaglio_movimento WHERE movimento_id IN (
        SELECT id FROM movimento WHERE azienda_id = v_azienda_id
    );
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Eliminati % dettagli movimento', v_count;

    DELETE FROM movimento WHERE azienda_id = v_azienda_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Eliminati % movimenti', v_count;

    DELETE FROM giacenza WHERE azienda_id = v_azienda_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Eliminate % giacenze', v_count;

    DELETE FROM listino_prezzo WHERE listino_id IN (
        SELECT id FROM listino WHERE azienda_id = v_azienda_id
    );
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Eliminati % prezzi listino', v_count;

    DELETE FROM prodotto WHERE azienda_id = v_azienda_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Eliminati % prodotti', v_count;

    DELETE FROM soggetto WHERE azienda_id = v_azienda_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Eliminati % soggetti', v_count;

    DELETE FROM magazzino WHERE azienda_id = v_azienda_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Eliminati % magazzini', v_count;

    DELETE FROM listino WHERE azienda_id = v_azienda_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Eliminati % listini', v_count;

    RAISE NOTICE '✅ Database pulito - pronto per import test';
END $$;

-- =====================================================
-- PARTE 2: BRAND (globale - non ha azienda_id)
-- =====================================================

DO $$
BEGIN
    INSERT INTO brand (nome, descrizione)
    VALUES ('Qingdao', 'Qingdao Runjie New Material Technology Co. Ltd')
    ON CONFLICT (nome) DO NOTHING;

    RAISE NOTICE '✅ Brand inserito';
END $$;

-- =====================================================
-- PARTE 3: CLIENTE CL32 - Bulgar International Ltd
-- =====================================================

DO $$
BEGIN
    INSERT INTO soggetto (
        codice,
        ragione_sociale,
        tipo,
        partita_iva,
        indirizzo,
        cap,
        citta,
        provincia,
        nazione,
        email,
        telefono,
        referente,
        valuta,
        agente,
        provvigione_agente_perc,
        giorni_pagamento,
        settore,
        macrofamiglia,
        trattamento_iva,
        note_consegna
    ) VALUES (
        'cl32',
        'Bulgar International Ltd',
        'cliente',
        'BG207700644',
        'Georgi Kochev 14',
        '5800',
        'Pleven',
        'Pleven',
        'BG',
        'commercial.bulgarinternational@gmail.com',
        '+359 876897120',
        'Roberto Farci',
        'EUR',
        'Massimo Ricciolio',
        2.0,
        0,
        'Distributori Horeca',
        'Patrimoniale',
        'Cessione di beni intracomunitaria, di cui all''art. 41 del D.L. n. 331/1993, Codice N3',
        'Indirizzo di Destino alternativo: Dr. Anastasia Zhelezkova 35, Proiorski, 9000 Varna (Bulgaria)'
    );

    RAISE NOTICE '✅ Cliente cl32 inserito';
END $$;

-- =====================================================
-- PARTE 4: FORNITORE FO14 - Qingdao Runjie
-- =====================================================

DO $$
BEGIN
    INSERT INTO soggetto (
        codice,
        ragione_sociale,
        tipo,
        indirizzo,
        citta,
        provincia,
        nazione,
        email,
        telefono,
        referente,
        valuta,
        giorni_pagamento,
        settore,
        macrofamiglia,
        trattamento_iva
    ) VALUES (
        'fo14',
        'Qingdao Runjie New Material Technology Co. Ltd',
        'fornitore',
        'No. 24 Chenhui Road, Lancun Town, Jimo City',
        'Qingdao',
        'Shandong',
        'CN',
        'kevin@qdnonwovens.com',
        '+86 15954087637',
        'Kevin Wan',
        'EUR',
        90,
        'Contabilità',
        'Patrimoniale',
        'Iva Esente'
    );

    RAISE NOTICE '✅ Fornitore fo14 inserito';
END $$;

-- =====================================================
-- PARTE 5: PRODOTTO TLB451X1BL
-- =====================================================

DO $$
BEGIN
    INSERT INTO prodotto (
        codice,
        nome,
        descrizione,
        brand_id,
        unita_misura,
        attivo,
        prezzo_magazzino,
        pezzi_per_busta,
        buste_per_cartone,
        pezzi_per_cartone,
        cartoni_per_pedana,
        peso_kg,
        hs_code,
        lead_time_giorni,
        transit_time_giorni,
        scorta_minima,
        delivery_terms,
        colore_fondo,
        gsm,
        linea,
        fornitore_principale_id
    ) VALUES (
        'TLB451X1BL',
        'Tovaglia in TNT',
        'Tovaglia in TNT Qingdao, Lucky Basic, 45GSM, 100x100 - Blu Dark',
        (SELECT id FROM brand WHERE nome = 'Qingdao' LIMIT 1),
        'CRT',
        true,
        9.07,
        25,
        4,
        100,
        54,
        4.9,
        '6322221000',
        15,
        60,
        0,
        'CIF',
        'Blu Dark',
        45,
        'Lucky Basic',
        (SELECT id FROM soggetto WHERE codice = 'fo14' AND azienda_id = public.get_user_azienda_id() LIMIT 1)
    );

    RAISE NOTICE '✅ Prodotto TLB451X1BL inserito';
END $$;

-- =====================================================
-- PARTE 6: LISTINO
-- =====================================================

DO $$
BEGIN
    INSERT INTO listino (nome, descrizione, attivo)
    VALUES ('Listino 1', 'Listino principale', true);

    -- Inserisci prezzo listino per il prodotto
    INSERT INTO listino_prezzo (
        listino_id,
        prodotto_id,
        prezzo,
        provvigione_perc
    ) VALUES (
        (SELECT id FROM listino WHERE nome = 'Listino 1' AND azienda_id = public.get_user_azienda_id() LIMIT 1),
        (SELECT id FROM prodotto WHERE codice = 'TLB451X1BL' AND azienda_id = public.get_user_azienda_id() LIMIT 1),
        9.07,
        2.0
    );

    -- Associa listino al cliente
    UPDATE soggetto
    SET listino_id = (SELECT id FROM listino WHERE nome = 'Listino 1' AND azienda_id = public.get_user_azienda_id() LIMIT 1)
    WHERE codice = 'cl32' AND azienda_id = public.get_user_azienda_id();

    RAISE NOTICE '✅ Listino 1 inserito e associato al cliente';
END $$;

-- =====================================================
-- PARTE 7: MAGAZZINI
-- =====================================================

DO $$
BEGIN
    INSERT INTO magazzino (codice, nome, descrizione, attivo)
    VALUES
        ('ORLANDO', 'Orlando Trasporti', 'Magazzino Orlando Trasporti', true),
        ('FRECCIA', 'Transito Magazzino La Freccia', 'Magazzino La Freccia', true);

    RAISE NOTICE '✅ Magazzini inseriti';
END $$;

-- =====================================================
-- PARTE 8: CAUSALI DOCUMENTO (globali)
-- =====================================================

DO $$
BEGIN
    -- Causale Vendita
    IF NOT EXISTS (SELECT 1 FROM causale_documento WHERE codice = 'VEN') THEN
        INSERT INTO causale_documento (codice, descrizione, tipo_operazione, segno)
        VALUES ('VEN', 'Vendita', 'vendita', -1);
    END IF;

    -- Causale Ordine Attivo
    IF NOT EXISTS (SELECT 1 FROM causale_documento WHERE codice = 'OAT') THEN
        INSERT INTO causale_documento (codice, descrizione, tipo_operazione, segno)
        VALUES ('OAT', 'Ordine Attivo', 'vendita', -1);
    END IF;

    -- Causale Ordine Passivo
    IF NOT EXISTS (SELECT 1 FROM causale_documento WHERE codice = 'OPA') THEN
        INSERT INTO causale_documento (codice, descrizione, tipo_operazione, segno)
        VALUES ('OPA', 'Ordine Passivo', 'acquisto', 1);
    END IF;

    RAISE NOTICE '✅ Causali documento verificate/inserite';
END $$;

-- =====================================================
-- PARTE 9: MOVIMENTI (15 movimenti da Excel)
-- =====================================================

-- Movimento 1: Vendita FPR 66/25 - 464 CRT
DO $$
DECLARE
    v_movimento_id INT;
    v_causale_id INT;
    v_soggetto_id INT;
    v_prodotto_id INT;
    v_magazzino_id INT;
    v_aliquota_iva_id INT;
    v_azienda_id UUID;
BEGIN
    v_azienda_id := public.get_user_azienda_id();
    SELECT id INTO v_causale_id FROM causale_documento WHERE codice = 'VEN' LIMIT 1;
    SELECT id INTO v_soggetto_id FROM soggetto WHERE codice = 'cl32' AND azienda_id = v_azienda_id LIMIT 1;
    SELECT id INTO v_prodotto_id FROM prodotto WHERE codice = 'TLB451X1BL' AND azienda_id = v_azienda_id LIMIT 1;
    SELECT id INTO v_magazzino_id FROM magazzino WHERE codice = 'FRECCIA' AND azienda_id = v_azienda_id LIMIT 1;
    SELECT id INTO v_aliquota_iva_id FROM aliquota_iva WHERE percentuale = 0 LIMIT 1;

    INSERT INTO movimento (
        causale_id, soggetto_id, magazzino_id, data_movimento, numero_documento,
        valuta, agente, provvigione_agente_perc, provvigione_agente_valore,
        termini_resa, vettore, centro_costo, note,
        imponibile, iva, totale
    ) VALUES (
        v_causale_id, v_soggetto_id, v_magazzino_id, '2025-11-01', 'FPR 66/25',
        'EUR', 'Massimo Ricciolio', 2.0, 74.84,
        'Franco Magazzino Fornitore', 'Mittente', '09120-527', 'Vendita Tovaglie',
        3742.16, 0, 3742.16
    ) RETURNING id INTO v_movimento_id;

    INSERT INTO dettaglio_movimento (
        movimento_id, prodotto_id, descrizione, quantita, unita_misura,
        prezzo_unitario, imponibile, aliquota_iva_id, iva, totale, brand
    ) VALUES (
        v_movimento_id, v_prodotto_id, 'Tovaglia in TNT Qingdao, Lucky Basic, 45GSM, 100x100 - Blu Dark',
        464, 'CRT', 8.065, 3742.16, v_aliquota_iva_id, 0, 3742.16, 'Lucky'
    );

    RAISE NOTICE 'Movimento 1/15: Vendita FPR 66/25';
END $$;

-- Movimento 2: Ordine Attivo 09041-120 - 444 CRT
DO $$
DECLARE
    v_movimento_id INT;
    v_causale_id INT;
    v_soggetto_id INT;
    v_prodotto_id INT;
    v_magazzino_id INT;
    v_aliquota_iva_id INT;
    v_azienda_id UUID;
BEGIN
    v_azienda_id := public.get_user_azienda_id();
    SELECT id INTO v_causale_id FROM causale_documento WHERE codice = 'OAT' LIMIT 1;
    SELECT id INTO v_soggetto_id FROM soggetto WHERE codice = 'cl32' AND azienda_id = v_azienda_id LIMIT 1;
    SELECT id INTO v_prodotto_id FROM prodotto WHERE codice = 'TLB451X1BL' AND azienda_id = v_azienda_id LIMIT 1;
    SELECT id INTO v_magazzino_id FROM magazzino WHERE codice = 'FRECCIA' AND azienda_id = v_azienda_id LIMIT 1;
    SELECT id INTO v_aliquota_iva_id FROM aliquota_iva WHERE percentuale = 0 LIMIT 1;

    INSERT INTO movimento (
        causale_id, soggetto_id, magazzino_id, data_movimento, numero_documento,
        valuta, agente, provvigione_agente_perc, provvigione_agente_valore,
        termini_resa, vettore, centro_costo, note,
        imponibile, iva, totale
    ) VALUES (
        v_causale_id, v_soggetto_id, v_magazzino_id, '2025-08-11', '09041-120',
        'EUR', 'Massimo Ricciolio', 2.0, 71.62,
        'Franco Magazzino Fornitore', 'Mittente', '09120-528', 'Vendita Tovaglie',
        3580.86, 0, 3580.86
    ) RETURNING id INTO v_movimento_id;

    INSERT INTO dettaglio_movimento (
        movimento_id, prodotto_id, descrizione, quantita, unita_misura,
        prezzo_unitario, imponibile, aliquota_iva_id, iva, totale, brand
    ) VALUES (
        v_movimento_id, v_prodotto_id, 'Tovaglia in TNT Qingdao, Lucky Basic, 45GSM, 100x100 - Blu Dark',
        444, 'CRT', 8.065, 3580.86, v_aliquota_iva_id, 0, 3580.86, 'Lucky'
    );

    RAISE NOTICE 'Movimento 2/15: Ordine Attivo 09041-120';
END $$;

-- Movimento 3: Ordine Attivo 09041-121 - 501 CRT
DO $$
DECLARE
    v_movimento_id INT;
    v_causale_id INT;
    v_soggetto_id INT;
    v_prodotto_id INT;
    v_magazzino_id INT;
    v_aliquota_iva_id INT;
    v_azienda_id UUID;
BEGIN
    v_azienda_id := public.get_user_azienda_id();
    SELECT id INTO v_causale_id FROM causale_documento WHERE codice = 'OAT' LIMIT 1;
    SELECT id INTO v_soggetto_id FROM soggetto WHERE codice = 'cl32' AND azienda_id = v_azienda_id LIMIT 1;
    SELECT id INTO v_prodotto_id FROM prodotto WHERE codice = 'TLB451X1BL' AND azienda_id = v_azienda_id LIMIT 1;
    SELECT id INTO v_magazzino_id FROM magazzino WHERE codice = 'FRECCIA' AND azienda_id = v_azienda_id LIMIT 1;
    SELECT id INTO v_aliquota_iva_id FROM aliquota_iva WHERE percentuale = 0 LIMIT 1;

    INSERT INTO movimento (
        causale_id, soggetto_id, magazzino_id, data_movimento, numero_documento,
        valuta, agente, provvigione_agente_perc, provvigione_agente_valore,
        termini_resa, vettore, centro_costo, note,
        imponibile, iva, totale
    ) VALUES (
        v_causale_id, v_soggetto_id, v_magazzino_id, '2025-08-11', '09041-121',
        'EUR', 'Massimo Ricciolio', 2.0, 80.81,
        'Franco Magazzino Fornitore', 'Mittente', '09120-529', 'Vendita Tovaglie',
        4040.56, 0, 4040.56
    ) RETURNING id INTO v_movimento_id;

    INSERT INTO dettaglio_movimento (
        movimento_id, prodotto_id, descrizione, quantita, unita_misura,
        prezzo_unitario, imponibile, aliquota_iva_id, iva, totale, brand
    ) VALUES (
        v_movimento_id, v_prodotto_id, 'Tovaglia in TNT Qingdao, Lucky Basic, 45GSM, 100x100 - Blu Dark',
        501, 'CRT', 8.065, 4040.56, v_aliquota_iva_id, 0, 4040.56, 'Lucky'
    );

    RAISE NOTICE 'Movimento 3/15: Ordine Attivo 09041-121';
END $$;

-- Movimento 4: Ordine Passivo 09120-527 - 464 CRT (ACQUISTO)
DO $$
DECLARE
    v_movimento_id INT;
    v_causale_id INT;
    v_soggetto_id INT;
    v_prodotto_id INT;
    v_magazzino_id INT;
    v_aliquota_iva_id INT;
    v_azienda_id UUID;
BEGIN
    v_azienda_id := public.get_user_azienda_id();
    SELECT id INTO v_causale_id FROM causale_documento WHERE codice = 'OPA' LIMIT 1;
    SELECT id INTO v_soggetto_id FROM soggetto WHERE codice = 'fo14' AND azienda_id = v_azienda_id LIMIT 1;
    SELECT id INTO v_prodotto_id FROM prodotto WHERE codice = 'TLB451X1BL' AND azienda_id = v_azienda_id LIMIT 1;
    SELECT id INTO v_magazzino_id FROM magazzino WHERE codice = 'ORLANDO' AND azienda_id = v_azienda_id LIMIT 1;
    SELECT id INTO v_aliquota_iva_id FROM aliquota_iva WHERE percentuale = 0 LIMIT 1;

    INSERT INTO movimento (
        causale_id, soggetto_id, magazzino_id, data_movimento, numero_documento,
        valuta, vettore, centro_costo, note, etd,
        imponibile, iva, totale
    ) VALUES (
        v_causale_id, v_soggetto_id, v_magazzino_id, '2025-08-23', '09120-527',
        'EUR', 'Destinatario', '09120-527', 'Acquisto Tovaglie', '2025-09-18',
        3684.16, 0, 3684.16
    ) RETURNING id INTO v_movimento_id;

    INSERT INTO dettaglio_movimento (
        movimento_id, prodotto_id, descrizione, quantita, unita_misura,
        prezzo_unitario, imponibile, aliquota_iva_id, iva, totale, brand
    ) VALUES (
        v_movimento_id, v_prodotto_id, 'Tovaglia in TNT Qingdao, Lucky Basic, 45GSM, 100x100 - Blu Dark',
        464, 'CRT', 7.94, 3684.16, v_aliquota_iva_id, 0, 3684.16, 'Lucky'
    );

    RAISE NOTICE 'Movimento 4/15: Ordine Passivo 09120-527';
END $$;

-- Movimento 5: Ordine Passivo 09120-528 - 444 CRT (ACQUISTO)
DO $$
DECLARE
    v_movimento_id INT;
    v_causale_id INT;
    v_soggetto_id INT;
    v_prodotto_id INT;
    v_magazzino_id INT;
    v_aliquota_iva_id INT;
    v_azienda_id UUID;
BEGIN
    v_azienda_id := public.get_user_azienda_id();
    SELECT id INTO v_causale_id FROM causale_documento WHERE codice = 'OPA' LIMIT 1;
    SELECT id INTO v_soggetto_id FROM soggetto WHERE codice = 'fo14' AND azienda_id = v_azienda_id LIMIT 1;
    SELECT id INTO v_prodotto_id FROM prodotto WHERE codice = 'TLB451X1BL' AND azienda_id = v_azienda_id LIMIT 1;
    SELECT id INTO v_magazzino_id FROM magazzino WHERE codice = 'ORLANDO' AND azienda_id = v_azienda_id LIMIT 1;
    SELECT id INTO v_aliquota_iva_id FROM aliquota_iva WHERE percentuale = 0 LIMIT 1;

    INSERT INTO movimento (
        causale_id, soggetto_id, magazzino_id, data_movimento, numero_documento,
        valuta, vettore, centro_costo, note, etd,
        imponibile, iva, totale
    ) VALUES (
        v_causale_id, v_soggetto_id, v_magazzino_id, '2025-08-23', '09120-528',
        'EUR', 'Destinatario', '09120-528', 'Acquisto Tovaglie', '2025-10-02',
        3525.36, 0, 3525.36
    ) RETURNING id INTO v_movimento_id;

    INSERT INTO dettaglio_movimento (
        movimento_id, prodotto_id, descrizione, quantita, unita_misura,
        prezzo_unitario, imponibile, aliquota_iva_id, iva, totale, brand
    ) VALUES (
        v_movimento_id, v_prodotto_id, 'Tovaglia in TNT Qingdao, Lucky Basic, 45GSM, 100x100 - Blu Dark',
        444, 'CRT', 7.94, 3525.36, v_aliquota_iva_id, 0, 3525.36, 'Lucky'
    );

    RAISE NOTICE 'Movimento 5/15: Ordine Passivo 09120-528';
END $$;

-- Movimento 6: Ordine Passivo 09120-529 - 501 CRT (ACQUISTO)
DO $$
DECLARE
    v_movimento_id INT;
    v_causale_id INT;
    v_soggetto_id INT;
    v_prodotto_id INT;
    v_magazzino_id INT;
    v_aliquota_iva_id INT;
    v_azienda_id UUID;
BEGIN
    v_azienda_id := public.get_user_azienda_id();
    SELECT id INTO v_causale_id FROM causale_documento WHERE codice = 'OPA' LIMIT 1;
    SELECT id INTO v_soggetto_id FROM soggetto WHERE codice = 'fo14' AND azienda_id = v_azienda_id LIMIT 1;
    SELECT id INTO v_prodotto_id FROM prodotto WHERE codice = 'TLB451X1BL' AND azienda_id = v_azienda_id LIMIT 1;
    SELECT id INTO v_magazzino_id FROM magazzino WHERE codice = 'ORLANDO' AND azienda_id = v_azienda_id LIMIT 1;
    SELECT id INTO v_aliquota_iva_id FROM aliquota_iva WHERE percentuale = 0 LIMIT 1;

    INSERT INTO movimento (
        causale_id, soggetto_id, magazzino_id, data_movimento, numero_documento,
        valuta, vettore, centro_costo, note, etd,
        imponibile, iva, totale
    ) VALUES (
        v_causale_id, v_soggetto_id, v_magazzino_id, '2025-08-23', '09120-529',
        'EUR', 'Destinatario', '09120-529', 'Acquisto Tovaglie', '2025-10-02',
        3977.94, 0, 3977.94
    ) RETURNING id INTO v_movimento_id;

    INSERT INTO dettaglio_movimento (
        movimento_id, prodotto_id, descrizione, quantita, unita_misura,
        prezzo_unitario, imponibile, aliquota_iva_id, iva, totale, brand
    ) VALUES (
        v_movimento_id, v_prodotto_id, 'Tovaglia in TNT Qingdao, Lucky Basic, 45GSM, 100x100 - Blu Dark',
        501, 'CRT', 7.94, 3977.94, v_aliquota_iva_id, 0, 3977.94, 'Lucky'
    );

    RAISE NOTICE 'Movimento 6/15: Ordine Passivo 09120-529';
END $$;

-- Movimenti 7-15: Ordini Attivi (serie 11120-901 a 11120-909)
DO $$
DECLARE
    v_movimento_id INT;
    v_causale_id INT;
    v_soggetto_id INT;
    v_prodotto_id INT;
    v_magazzino_id INT;
    v_aliquota_iva_id INT;
    v_azienda_id UUID;
    v_ordini TEXT[] := ARRAY['11120-901', '11120-902', '11120-903', '11120-904', '11120-905', '11120-906', '11120-907', '11120-908', '11120-909'];
    v_quantita INT[] := ARRAY[270, 324, 324, 270, 324, 270, 270, 270, 324];
    v_centri_costo TEXT[] := ARRAY['11130-101', '11130-102', '11130-103', '11130-104', '11130-105', '11130-106', '11130-107', '11130-108', '11130-109'];
    i INT;
BEGIN
    v_azienda_id := public.get_user_azienda_id();
    SELECT id INTO v_causale_id FROM causale_documento WHERE codice = 'OAT' LIMIT 1;
    SELECT id INTO v_soggetto_id FROM soggetto WHERE codice = 'cl32' AND azienda_id = v_azienda_id LIMIT 1;
    SELECT id INTO v_prodotto_id FROM prodotto WHERE codice = 'TLB451X1BL' AND azienda_id = v_azienda_id LIMIT 1;
    SELECT id INTO v_magazzino_id FROM magazzino WHERE codice = 'FRECCIA' AND azienda_id = v_azienda_id LIMIT 1;
    SELECT id INTO v_aliquota_iva_id FROM aliquota_iva WHERE percentuale = 0 LIMIT 1;

    FOR i IN 1..9 LOOP
        INSERT INTO movimento (
            causale_id, soggetto_id, magazzino_id, data_movimento, numero_documento,
            valuta, agente, provvigione_agente_perc, provvigione_agente_valore,
            termini_resa, vettore, centro_costo,
            imponibile, iva, totale
        ) VALUES (
            v_causale_id, v_soggetto_id, v_magazzino_id, '2025-10-11', v_ordini[i],
            'EUR', 'Massimo Ricciolio', 2.0, (v_quantita[i] * 7.97 * 0.02),
            'Franco Magazzino Fornitore', 'Mittente', v_centri_costo[i],
            (v_quantita[i] * 7.97), 0, (v_quantita[i] * 7.97)
        ) RETURNING id INTO v_movimento_id;

        INSERT INTO dettaglio_movimento (
            movimento_id, prodotto_id, descrizione, quantita, unita_misura,
            prezzo_unitario, imponibile, aliquota_iva_id, iva, totale, brand
        ) VALUES (
            v_movimento_id, v_prodotto_id, 'Tovaglia in TNT Qingdao, Lucky Basic, 45GSM, 100x100 - Blu Dark',
            v_quantita[i], 'CRT', 7.97, (v_quantita[i] * 7.97), v_aliquota_iva_id, 0, (v_quantita[i] * 7.97), 'Lucky'
        );
    END LOOP;

    RAISE NOTICE 'Movimenti 7-15: Ordini Attivi 11120-901 a 11120-909';
END $$;

COMMIT;

-- =====================================================
-- RIEPILOGO IMPORT
-- =====================================================

SELECT
    '✅ IMPORT COMPLETATO' as status,
    (SELECT COUNT(*) FROM soggetto WHERE tipo = 'cliente' AND azienda_id = public.get_user_azienda_id()) as clienti,
    (SELECT COUNT(*) FROM soggetto WHERE tipo = 'fornitore' AND azienda_id = public.get_user_azienda_id()) as fornitori,
    (SELECT COUNT(*) FROM prodotto WHERE azienda_id = public.get_user_azienda_id()) as prodotti,
    (SELECT COUNT(*) FROM movimento WHERE azienda_id = public.get_user_azienda_id()) as movimenti,
    (SELECT COUNT(*) FROM dettaglio_movimento dm JOIN movimento m ON dm.movimento_id = m.id WHERE m.azienda_id = public.get_user_azienda_id()) as dettagli,
    (SELECT COALESCE(SUM(totale), 0) FROM movimento m JOIN causale_documento c ON m.causale_id = c.id WHERE m.azienda_id = public.get_user_azienda_id() AND c.tipo_operazione = 'vendita') as totale_vendite,
    (SELECT COALESCE(SUM(totale), 0) FROM movimento m JOIN causale_documento c ON m.causale_id = c.id WHERE m.azienda_id = public.get_user_azienda_id() AND c.tipo_operazione = 'acquisto') as totale_acquisti;

-- Mostra giacenze calcolate automaticamente dai trigger
SELECT
    p.codice,
    p.nome,
    m.nome as magazzino,
    g.quantita,
    g.valore_unitario,
    g.valore_totale,
    g.updated_at
FROM giacenza g
JOIN prodotto p ON g.prodotto_id = p.id
JOIN magazzino m ON g.magazzino_id = m.id
WHERE g.azienda_id = public.get_user_azienda_id()
ORDER BY p.codice, m.nome;
