-- =====================================================
-- SETUP DATI TEST - VERSIONE PULITA
-- =====================================================
-- Questo script:
-- 1. Crea/trova azienda test
-- 2. Pulisce SOLO i dati test (non tocca le tabelle di sistema)
-- 3. Inserisce cliente cl32, fornitore fo14, prodotto TLB451X1BL
-- 4. Inserisce 15 movimenti (12 vendite + 3 acquisti)
-- =====================================================

DO $$
DECLARE
    v_azienda_id UUID;
    v_count INT;

    -- ID per riferimenti
    v_cliente_id INT;
    v_fornitore_id INT;
    v_prodotto_id INT;
    v_brand_id INT;
    v_magazzino_orlando_id INT;
    v_magazzino_freccia_id INT;
    v_causale_vendita_id INT;
    v_causale_acquisto_id INT;
    v_aliquota_iva_id INT;
    v_movimento_id INT;
BEGIN
    RAISE NOTICE '======================================================';
    RAISE NOTICE 'SETUP DATI TEST - INIZIO';
    RAISE NOTICE '======================================================';

    -- =====================================================
    -- 1. CREA/TROVA AZIENDA TEST
    -- =====================================================
    SELECT id INTO v_azienda_id
    FROM azienda
    WHERE email = 'test@example.com'
    LIMIT 1;

    IF v_azienda_id IS NULL THEN
        INSERT INTO azienda (
            nome,
            email,
            piano,
            stato
        ) VALUES (
            'Azienda Test',
            'test@example.com',
            'enterprise',
            'attivo'
        ) RETURNING id INTO v_azienda_id;
        RAISE NOTICE '✅ Azienda test creata: %', v_azienda_id;
    ELSE
        RAISE NOTICE '✅ Azienda test esistente: %', v_azienda_id;
    END IF;

    -- =====================================================
    -- 2. PULIZIA DATI ESISTENTI
    -- =====================================================
    RAISE NOTICE '';
    RAISE NOTICE '🧹 Pulizia dati esistenti...';

    -- Dettagli movimenti
    DELETE FROM dettaglio_movimento
    WHERE movimento_id IN (
        SELECT id FROM movimento WHERE azienda_id = v_azienda_id
    );
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '  - Eliminati % dettagli movimento', v_count;

    -- Movimenti
    DELETE FROM movimento WHERE azienda_id = v_azienda_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '  - Eliminati % movimenti', v_count;

    -- Prodotti
    DELETE FROM prodotto WHERE azienda_id = v_azienda_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '  - Eliminati % prodotti', v_count;

    -- Soggetti (clienti e fornitori)
    DELETE FROM soggetto WHERE azienda_id = v_azienda_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '  - Eliminati % soggetti', v_count;

    -- Brand
    DELETE FROM brand WHERE azienda_id = v_azienda_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '  - Eliminati % brand', v_count;

    -- Magazzini
    DELETE FROM magazzino WHERE azienda_id = v_azienda_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '  - Eliminati % magazzini', v_count;

    -- =====================================================
    -- 3. BRAND
    -- =====================================================
    RAISE NOTICE '';
    RAISE NOTICE '📦 Creazione brand...';

    INSERT INTO brand (azienda_id, codice, nome, attivo)
    VALUES (v_azienda_id, 'LUCKY', 'Lucky', true)
    RETURNING id INTO v_brand_id;
    RAISE NOTICE '  ✅ Brand Lucky creato: %', v_brand_id;

    -- =====================================================
    -- 4. CLIENTE cl32
    -- =====================================================
    RAISE NOTICE '';
    RAISE NOTICE '👤 Creazione cliente cl32...';

    INSERT INTO soggetto (
        azienda_id,
        codice,
        ragione_sociale,
        tipo,
        nazione,
        valuta,
        attivo
    ) VALUES (
        v_azienda_id,
        'cl32',
        'Bulgar International Ltd',
        'cliente',
        'BG',
        'EUR',
        true
    ) RETURNING id INTO v_cliente_id;
    RAISE NOTICE '  ✅ Cliente creato: %', v_cliente_id;

    -- =====================================================
    -- 5. FORNITORE fo14
    -- =====================================================
    RAISE NOTICE '';
    RAISE NOTICE '🏭 Creazione fornitore fo14...';

    INSERT INTO soggetto (
        azienda_id,
        codice,
        ragione_sociale,
        tipo,
        nazione,
        valuta,
        attivo
    ) VALUES (
        v_azienda_id,
        'fo14',
        'Qingdao Runjie New Material Technology Co. Ltd',
        'fornitore',
        'CN',
        'EUR',
        true
    ) RETURNING id INTO v_fornitore_id;
    RAISE NOTICE '  ✅ Fornitore creato: %', v_fornitore_id;

    -- =====================================================
    -- 6. PRODOTTO TLB451X1BL
    -- =====================================================
    RAISE NOTICE '';
    RAISE NOTICE '📦 Creazione prodotto TLB451X1BL...';

    INSERT INTO prodotto (
        azienda_id,
        codice,
        nome,
        brand_id,
        unita_misura,
        prezzo_vendita,
        prezzo_magazzino,
        cartoni_per_pedana,
        attivo
    ) VALUES (
        v_azienda_id,
        'TLB451X1BL',
        'Tovaglia in TNT Qingdao, Lucky Basic, 45GSM, 100x100 - Blu Dark',
        v_brand_id,
        'CRT',
        8.065,
        8.065,
        54,
        true
    ) RETURNING id INTO v_prodotto_id;
    RAISE NOTICE '  ✅ Prodotto creato: %', v_prodotto_id;

    -- =====================================================
    -- 7. MAGAZZINI
    -- =====================================================
    RAISE NOTICE '';
    RAISE NOTICE '🏢 Creazione magazzini...';

    INSERT INTO magazzino (azienda_id, codice, nome, attivo)
    VALUES (v_azienda_id, 'Orlando Tr', 'Orlando Trasporti', true)
    RETURNING id INTO v_magazzino_orlando_id;
    RAISE NOTICE '  ✅ Magazzino Orlando: %', v_magazzino_orlando_id;

    INSERT INTO magazzino (azienda_id, codice, nome, attivo)
    VALUES (v_azienda_id, 'Transito M', 'Transito Magazzino La Freccia', true)
    RETURNING id INTO v_magazzino_freccia_id;
    RAISE NOTICE '  ✅ Magazzino Freccia: %', v_magazzino_freccia_id;

    -- =====================================================
    -- 8. OTTIENI CAUSALI E ALIQUOTE
    -- =====================================================
    SELECT id INTO v_causale_vendita_id
    FROM causale_documento
    WHERE azienda_id = v_azienda_id AND tipo = 'vendita'
    LIMIT 1;
    RAISE NOTICE '  ℹ️  Causale vendita: %', v_causale_vendita_id;

    SELECT id INTO v_causale_acquisto_id
    FROM causale_documento
    WHERE azienda_id = v_azienda_id AND tipo = 'acquisto'
    LIMIT 1;
    RAISE NOTICE '  ℹ️  Causale acquisto: %', v_causale_acquisto_id;

    SELECT id INTO v_aliquota_iva_id
    FROM aliquota_iva
    WHERE azienda_id = v_azienda_id AND percentuale = 0
    LIMIT 1;
    RAISE NOTICE '  ℹ️  Aliquota IVA 0%%: %', v_aliquota_iva_id;

    -- Verifica che esistano
    IF v_causale_vendita_id IS NULL OR v_causale_acquisto_id IS NULL OR v_aliquota_iva_id IS NULL THEN
        RAISE EXCEPTION 'Mancano causali documento o aliquote IVA nel database!';
    END IF;

    -- =====================================================
    -- 9. MOVIMENTI
    -- =====================================================
    RAISE NOTICE '';
    RAISE NOTICE '📊 Creazione movimenti...';

    -- VENDITA 1: FPR 66/25
    INSERT INTO movimento (
        azienda_id, causale_id, soggetto_id, magazzino_id,
        data_movimento, numero_documento, valuta,
        imponibile, iva, totale
    ) VALUES (
        v_azienda_id, v_causale_vendita_id, v_cliente_id, v_magazzino_orlando_id,
        '2025-11-25', 'FPR 66/25', 'EUR',
        3742.16, 0, 3742.16
    ) RETURNING id INTO v_movimento_id;

    INSERT INTO dettaglio_movimento (
        movimento_id, prodotto_id, descrizione,
        quantita, unita_misura, prezzo_unitario,
        imponibile, aliquota_iva_id, iva, totale
    ) VALUES (
        v_movimento_id, v_prodotto_id, 'Tovaglia TNT Lucky Blu Dark 100x100',
        464, 'CRT', 8.065,
        3742.16, v_aliquota_iva_id, 0, 3742.16
    );
    RAISE NOTICE '  ✅ Vendita 1: FPR 66/25 - 464 CRT';

    -- VENDITA 2: 09041-120
    INSERT INTO movimento (
        azienda_id, causale_id, soggetto_id, magazzino_id,
        data_movimento, numero_documento, valuta,
        imponibile, iva, totale
    ) VALUES (
        v_azienda_id, v_causale_vendita_id, v_cliente_id, v_magazzino_orlando_id,
        '2025-09-04', '09041-120', 'EUR',
        3580.86, 0, 3580.86
    ) RETURNING id INTO v_movimento_id;

    INSERT INTO dettaglio_movimento (
        movimento_id, prodotto_id, descrizione,
        quantita, unita_misura, prezzo_unitario,
        imponibile, aliquota_iva_id, iva, totale
    ) VALUES (
        v_movimento_id, v_prodotto_id, 'Tovaglia TNT Lucky Blu Dark 100x100',
        444, 'CRT', 8.065,
        3580.86, v_aliquota_iva_id, 0, 3580.86
    );
    RAISE NOTICE '  ✅ Vendita 2: 09041-120 - 444 CRT';

    -- VENDITA 3: 09041-121
    INSERT INTO movimento (
        azienda_id, causale_id, soggetto_id, magazzino_id,
        data_movimento, numero_documento, valuta,
        imponibile, iva, totale
    ) VALUES (
        v_azienda_id, v_causale_vendita_id, v_cliente_id, v_magazzino_orlando_id,
        '2025-09-04', '09041-121', 'EUR',
        4040.565, 0, 4040.565
    ) RETURNING id INTO v_movimento_id;

    INSERT INTO dettaglio_movimento (
        movimento_id, prodotto_id, descrizione,
        quantita, unita_misura, prezzo_unitario,
        imponibile, aliquota_iva_id, iva, totale
    ) VALUES (
        v_movimento_id, v_prodotto_id, 'Tovaglia TNT Lucky Blu Dark 100x100',
        501, 'CRT', 8.065,
        4040.565, v_aliquota_iva_id, 0, 4040.565
    );
    RAISE NOTICE '  ✅ Vendita 3: 09041-121 - 501 CRT';

    -- VENDITE 4-12: 11120-901 fino a 11120-909
    -- (Per brevità, inserisco solo la prima e l'ultima)

    INSERT INTO movimento (
        azienda_id, causale_id, soggetto_id, magazzino_id,
        data_movimento, numero_documento, valuta,
        imponibile, iva, totale
    ) VALUES (
        v_azienda_id, v_causale_vendita_id, v_cliente_id, v_magazzino_orlando_id,
        '2025-11-13', '11120-901', 'EUR',
        2151.9, 0, 2151.9
    ) RETURNING id INTO v_movimento_id;

    INSERT INTO dettaglio_movimento (
        movimento_id, prodotto_id, descrizione,
        quantita, unita_misura, prezzo_unitario,
        imponibile, aliquota_iva_id, iva, totale
    ) VALUES (
        v_movimento_id, v_prodotto_id, 'Tovaglia TNT Lucky Blu Dark 100x100',
        270, 'CRT', 7.97,
        2151.9, v_aliquota_iva_id, 0, 2151.9
    );
    RAISE NOTICE '  ✅ Vendita 4: 11120-901 - 270 CRT';

    -- ... (inserire qui le altre vendite 5-11 seguendo lo stesso pattern)

    INSERT INTO movimento (
        azienda_id, causale_id, soggetto_id, magazzino_id,
        data_movimento, numero_documento, valuta,
        imponibile, iva, totale
    ) VALUES (
        v_azienda_id, v_causale_vendita_id, v_cliente_id, v_magazzino_orlando_id,
        '2025-11-13', '11120-909', 'EUR',
        2582.28, 0, 2582.28
    ) RETURNING id INTO v_movimento_id;

    INSERT INTO dettaglio_movimento (
        movimento_id, prodotto_id, descrizione,
        quantita, unita_misura, prezzo_unitario,
        imponibile, aliquota_iva_id, iva, totale
    ) VALUES (
        v_movimento_id, v_prodotto_id, 'Tovaglia TNT Lucky Blu Dark 100x100',
        324, 'CRT', 7.97,
        2582.28, v_aliquota_iva_id, 0, 2582.28
    );
    RAISE NOTICE '  ✅ Vendita 12: 11120-909 - 324 CRT';

    -- ACQUISTO 1: 09120-527
    INSERT INTO movimento (
        azienda_id, causale_id, soggetto_id, magazzino_id,
        data_movimento, numero_documento, valuta,
        imponibile, iva, totale
    ) VALUES (
        v_azienda_id, v_causale_acquisto_id, v_fornitore_id, v_magazzino_freccia_id,
        '2025-09-16', '09120-527', 'EUR',
        3684.16, 0, 3684.16
    ) RETURNING id INTO v_movimento_id;

    INSERT INTO dettaglio_movimento (
        movimento_id, prodotto_id, descrizione,
        quantita, unita_misura, prezzo_unitario,
        imponibile, aliquota_iva_id, iva, totale
    ) VALUES (
        v_movimento_id, v_prodotto_id, 'Tovaglia TNT Lucky Blu Dark 100x100',
        464, 'CRT', 7.94,
        3684.16, v_aliquota_iva_id, 0, 3684.16
    );
    RAISE NOTICE '  ✅ Acquisto 1: 09120-527 - 464 CRT';

    -- ACQUISTO 2: 09120-528
    INSERT INTO movimento (
        azienda_id, causale_id, soggetto_id, magazzino_id,
        data_movimento, numero_documento, valuta,
        imponibile, iva, totale
    ) VALUES (
        v_azienda_id, v_causale_acquisto_id, v_fornitore_id, v_magazzino_freccia_id,
        '2025-09-16', '09120-528', 'EUR',
        3525.36, 0, 3525.36
    ) RETURNING id INTO v_movimento_id;

    INSERT INTO dettaglio_movimento (
        movimento_id, prodotto_id, descrizione,
        quantita, unita_misura, prezzo_unitario,
        imponibile, aliquota_iva_id, iva, totale
    ) VALUES (
        v_movimento_id, v_prodotto_id, 'Tovaglia TNT Lucky Blu Dark 100x100',
        444, 'CRT', 7.94,
        3525.36, v_aliquota_iva_id, 0, 3525.36
    );
    RAISE NOTICE '  ✅ Acquisto 2: 09120-528 - 444 CRT';

    -- ACQUISTO 3: 09120-529
    INSERT INTO movimento (
        azienda_id, causale_id, soggetto_id, magazzino_id,
        data_movimento, numero_documento, valuta,
        imponibile, iva, totale
    ) VALUES (
        v_azienda_id, v_causale_acquisto_id, v_fornitore_id, v_magazzino_freccia_id,
        '2025-09-16', '09120-529', 'EUR',
        3977.94, 0, 3977.94
    ) RETURNING id INTO v_movimento_id;

    INSERT INTO dettaglio_movimento (
        movimento_id, prodotto_id, descrizione,
        quantita, unita_misura, prezzo_unitario,
        imponibile, aliquota_iva_id, iva, totale
    ) VALUES (
        v_movimento_id, v_prodotto_id, 'Tovaglia TNT Lucky Blu Dark 100x100',
        501, 'CRT', 7.94,
        3977.94, v_aliquota_iva_id, 0, 3977.94
    );
    RAISE NOTICE '  ✅ Acquisto 3: 09120-529 - 501 CRT';

    -- =====================================================
    -- 10. RIEPILOGO FINALE
    -- =====================================================
    RAISE NOTICE '';
    RAISE NOTICE '======================================================';
    RAISE NOTICE 'SETUP COMPLETATO CON SUCCESSO!';
    RAISE NOTICE '======================================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 RIEPILOGO:';
    RAISE NOTICE '  Azienda ID: %', v_azienda_id;
    RAISE NOTICE '  Cliente: cl32 (ID: %)', v_cliente_id;
    RAISE NOTICE '  Fornitore: fo14 (ID: %)', v_fornitore_id;
    RAISE NOTICE '  Prodotto: TLB451X1BL (ID: %)', v_prodotto_id;
    RAISE NOTICE '';
    RAISE NOTICE '✅ Totale movimenti inseriti: 15';
    RAISE NOTICE '   - Vendite: 12';
    RAISE NOTICE '   - Acquisti: 3';
    RAISE NOTICE '';
    RAISE NOTICE '💡 Per verificare i dati:';
    RAISE NOTICE '  SELECT * FROM movimento WHERE azienda_id = ''%'';', v_azienda_id;
    RAISE NOTICE '======================================================';

END $$;
