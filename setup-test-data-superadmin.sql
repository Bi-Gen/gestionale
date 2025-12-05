-- =====================================================
-- SETUP DATI TEST - VERSIONE SUPERADMIN
-- =====================================================
-- Questo script può essere eseguito come postgres/superadmin
-- Crea/usa un'azienda di test e inserisce tutti i dati
-- =====================================================

BEGIN;

-- =====================================================
-- PARTE 0: CREA/TROVA AZIENDA DI TEST
-- =====================================================

DO $$
DECLARE
    v_azienda_id UUID;
    v_user_id UUID;
    v_count INT;
BEGIN
    -- Cerca un'azienda di test esistente
    SELECT id INTO v_azienda_id
    FROM azienda
    WHERE email = 'test@example.com'
    LIMIT 1;

    IF v_azienda_id IS NULL THEN
        RAISE NOTICE 'Creazione nuova azienda di test...';

        -- Crea azienda di test
        INSERT INTO azienda (
            nome,
            ragione_sociale,
            email,
            piano,
            stato,
            max_utenti,
            max_prodotti,
            max_clienti
        ) VALUES (
            'Azienda Test',
            'Azienda Test SRL',
            'test@example.com',
            'premium',
            'attivo',
            10,
            -1,  -- illimitati
            -1   -- illimitati
        ) RETURNING id INTO v_azienda_id;

        RAISE NOTICE 'Azienda creata con ID: %', v_azienda_id;
    ELSE
        RAISE NOTICE 'Uso azienda esistente con ID: %', v_azienda_id;
    END IF;

    -- Salva azienda_id per uso successivo
    PERFORM set_config('app.test_azienda_id', v_azienda_id::text, false);

    -- Pulizia dati esistenti per questa azienda
    RAISE NOTICE 'Pulizia dati esistenti...';

    DELETE FROM dettaglio_movimento WHERE movimento_id IN (
        SELECT id FROM movimento WHERE azienda_id = v_azienda_id
    );
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Eliminati % dettagli movimento', v_count;

    DELETE FROM movimento WHERE azienda_id = v_azienda_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE 'Eliminati % movimenti', v_count;

    -- Le giacenze sono calcolate automaticamente dai trigger, non c'è una tabella da pulire

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
-- PARTE 1: BRAND
-- =====================================================

DO $$
BEGIN
    INSERT INTO brand (nome, descrizione)
    VALUES ('Qingdao', 'Qingdao Runjie New Material Technology Co. Ltd')
    ON CONFLICT (nome) DO NOTHING;

    RAISE NOTICE '✅ Brand inserito';
END $$;

-- =====================================================
-- PARTE 2: CLIENTE CL32
-- =====================================================

DO $$
DECLARE
    v_azienda_id UUID;
BEGIN
    v_azienda_id := current_setting('app.test_azienda_id')::uuid;

    INSERT INTO soggetto (
        azienda_id,
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
        v_azienda_id,
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
-- PARTE 3: FORNITORE FO14
-- =====================================================

DO $$
DECLARE
    v_azienda_id UUID;
BEGIN
    v_azienda_id := current_setting('app.test_azienda_id')::uuid;

    INSERT INTO soggetto (
        azienda_id,
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
        v_azienda_id,
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
-- PARTE 4: PRODOTTO TLB451X1BL
-- =====================================================

DO $$
DECLARE
    v_azienda_id UUID;
BEGIN
    v_azienda_id := current_setting('app.test_azienda_id')::uuid;

    INSERT INTO prodotto (
        azienda_id,
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
        v_azienda_id,
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
        (SELECT id FROM soggetto WHERE codice = 'fo14' AND azienda_id = v_azienda_id LIMIT 1)
    );

    RAISE NOTICE '✅ Prodotto TLB451X1BL inserito';
END $$;

-- =====================================================
-- PARTE 5: LISTINO
-- =====================================================

DO $$
DECLARE
    v_azienda_id UUID;
BEGIN
    v_azienda_id := current_setting('app.test_azienda_id')::uuid;

    INSERT INTO listino (azienda_id, nome, descrizione, attivo)
    VALUES (v_azienda_id, 'Listino 1', 'Listino principale', true);

    INSERT INTO listino_prezzo (
        listino_id,
        prodotto_id,
        prezzo,
        provvigione_perc
    ) VALUES (
        (SELECT id FROM listino WHERE nome = 'Listino 1' AND azienda_id = v_azienda_id LIMIT 1),
        (SELECT id FROM prodotto WHERE codice = 'TLB451X1BL' AND azienda_id = v_azienda_id LIMIT 1),
        9.07,
        2.0
    );

    UPDATE soggetto
    SET listino_id = (SELECT id FROM listino WHERE nome = 'Listino 1' AND azienda_id = v_azienda_id LIMIT 1)
    WHERE codice = 'cl32' AND azienda_id = v_azienda_id;

    RAISE NOTICE '✅ Listino inserito';
END $$;

-- =====================================================
-- PARTE 6: MAGAZZINI
-- =====================================================

DO $$
DECLARE
    v_azienda_id UUID;
BEGIN
    v_azienda_id := current_setting('app.test_azienda_id')::uuid;

    INSERT INTO magazzino (azienda_id, codice, nome, descrizione, attivo)
    VALUES
        (v_azienda_id, 'ORLANDO', 'Orlando Trasporti', 'Magazzino Orlando Trasporti', true),
        (v_azienda_id, 'FRECCIA', 'Transito Magazzino La Freccia', 'Magazzino La Freccia', true);

    RAISE NOTICE '✅ Magazzini inseriti';
END $$;

-- =====================================================
-- PARTE 7: CAUSALI DOCUMENTO
-- =====================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM causale_documento WHERE codice = 'VEN') THEN
        INSERT INTO causale_documento (codice, descrizione, tipo_operazione, segno)
        VALUES ('VEN', 'Vendita', 'vendita', -1);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM causale_documento WHERE codice = 'OAT') THEN
        INSERT INTO causale_documento (codice, descrizione, tipo_operazione, segno)
        VALUES ('OAT', 'Ordine Attivo', 'vendita', -1);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM causale_documento WHERE codice = 'OPA') THEN
        INSERT INTO causale_documento (codice, descrizione, tipo_operazione, segno)
        VALUES ('OPA', 'Ordine Passivo', 'acquisto', 1);
    END IF;

    RAISE NOTICE '✅ Causali documento verificate';
END $$;

-- =====================================================
-- PARTE 8: MOVIMENTI (15 movimenti da Excel)
-- =====================================================

-- Funzione helper per inserire movimenti
CREATE OR REPLACE FUNCTION insert_movimento_test(
    p_azienda_id UUID,
    p_causale_codice TEXT,
    p_soggetto_codice TEXT,
    p_magazzino_codice TEXT,
    p_data_movimento DATE,
    p_numero_documento TEXT,
    p_quantita INT,
    p_prezzo_unitario DECIMAL,
    p_agente TEXT DEFAULT NULL,
    p_provvigione_perc DECIMAL DEFAULT 0,
    p_vettore TEXT DEFAULT NULL,
    p_centro_costo TEXT DEFAULT NULL,
    p_note TEXT DEFAULT NULL,
    p_etd TEXT DEFAULT NULL
) RETURNS INT AS $$
DECLARE
    v_movimento_id INT;
    v_causale_id INT;
    v_soggetto_id INT;
    v_prodotto_id INT;
    v_magazzino_id INT;
    v_aliquota_iva_id INT;
    v_imponibile DECIMAL;
    v_provvigione_valore DECIMAL;
BEGIN
    SELECT id INTO v_causale_id FROM causale_documento WHERE codice = p_causale_codice LIMIT 1;
    SELECT id INTO v_soggetto_id FROM soggetto WHERE codice = p_soggetto_codice AND azienda_id = p_azienda_id LIMIT 1;
    SELECT id INTO v_prodotto_id FROM prodotto WHERE codice = 'TLB451X1BL' AND azienda_id = p_azienda_id LIMIT 1;
    SELECT id INTO v_magazzino_id FROM magazzino WHERE codice = p_magazzino_codice AND azienda_id = p_azienda_id LIMIT 1;
    SELECT id INTO v_aliquota_iva_id FROM aliquota_iva WHERE percentuale = 0 LIMIT 1;

    v_imponibile := p_quantita * p_prezzo_unitario;
    v_provvigione_valore := v_imponibile * p_provvigione_perc / 100;

    INSERT INTO movimento (
        azienda_id, causale_id, soggetto_id, magazzino_id, data_movimento, numero_documento,
        valuta, agente, provvigione_agente_perc, provvigione_agente_valore,
        termini_resa, vettore, centro_costo, note, etd,
        imponibile, iva, totale
    ) VALUES (
        p_azienda_id, v_causale_id, v_soggetto_id, v_magazzino_id, p_data_movimento, p_numero_documento,
        'EUR', p_agente, p_provvigione_perc, v_provvigione_valore,
        'Franco Magazzino Fornitore', p_vettore, p_centro_costo, p_note, p_etd,
        v_imponibile, 0, v_imponibile
    ) RETURNING id INTO v_movimento_id;

    INSERT INTO dettaglio_movimento (
        movimento_id, prodotto_id, descrizione, quantita, unita_misura,
        prezzo_unitario, imponibile, aliquota_iva_id, iva, totale, brand
    ) VALUES (
        v_movimento_id, v_prodotto_id, 'Tovaglia in TNT Qingdao, Lucky Basic, 45GSM, 100x100 - Blu Dark',
        p_quantita, 'CRT', p_prezzo_unitario, v_imponibile, v_aliquota_iva_id, 0, v_imponibile, 'Lucky'
    );

    RETURN v_movimento_id;
END;
$$ LANGUAGE plpgsql;

-- Inserisci tutti i 15 movimenti
DO $$
DECLARE
    v_azienda_id UUID;
    v_movimento_id INT;
BEGIN
    v_azienda_id := current_setting('app.test_azienda_id')::uuid;

    -- Movimenti 1-3: Vendite
    v_movimento_id := insert_movimento_test(
        v_azienda_id, 'VEN', 'cl32', 'FRECCIA', '2025-11-01', 'FPR 66/25',
        464, 8.065, 'Massimo Ricciolio', 2.0, 'Mittente', '09120-527', 'Vendita Tovaglie'
    );
    RAISE NOTICE 'Movimento 1/15: Vendita FPR 66/25';

    v_movimento_id := insert_movimento_test(
        v_azienda_id, 'OAT', 'cl32', 'FRECCIA', '2025-08-11', '09041-120',
        444, 8.065, 'Massimo Ricciolio', 2.0, 'Mittente', '09120-528', 'Vendita Tovaglie'
    );
    RAISE NOTICE 'Movimento 2/15: Ordine Attivo 09041-120';

    v_movimento_id := insert_movimento_test(
        v_azienda_id, 'OAT', 'cl32', 'FRECCIA', '2025-08-11', '09041-121',
        501, 8.065, 'Massimo Ricciolio', 2.0, 'Mittente', '09120-529', 'Vendita Tovaglie'
    );
    RAISE NOTICE 'Movimento 3/15: Ordine Attivo 09041-121';

    -- Movimenti 4-6: Acquisti
    v_movimento_id := insert_movimento_test(
        v_azienda_id, 'OPA', 'fo14', 'ORLANDO', '2025-08-23', '09120-527',
        464, 7.94, NULL, 0, 'Destinatario', '09120-527', 'Acquisto Tovaglie', '2025-09-18'
    );
    RAISE NOTICE 'Movimento 4/15: Ordine Passivo 09120-527';

    v_movimento_id := insert_movimento_test(
        v_azienda_id, 'OPA', 'fo14', 'ORLANDO', '2025-08-23', '09120-528',
        444, 7.94, NULL, 0, 'Destinatario', '09120-528', 'Acquisto Tovaglie', '2025-10-02'
    );
    RAISE NOTICE 'Movimento 5/15: Ordine Passivo 09120-528';

    v_movimento_id := insert_movimento_test(
        v_azienda_id, 'OPA', 'fo14', 'ORLANDO', '2025-08-23', '09120-529',
        501, 7.94, NULL, 0, 'Destinatario', '09120-529', 'Acquisto Tovaglie', '2025-10-02'
    );
    RAISE NOTICE 'Movimento 6/15: Ordine Passivo 09120-529';

    -- Movimenti 7-15: Ordini Attivi (9 ordini)
    DECLARE
        v_ordini TEXT[] := ARRAY['11120-901', '11120-902', '11120-903', '11120-904', '11120-905', '11120-906', '11120-907', '11120-908', '11120-909'];
        v_quantita INT[] := ARRAY[270, 324, 324, 270, 324, 270, 270, 270, 324];
        v_centri TEXT[] := ARRAY['11130-101', '11130-102', '11130-103', '11130-104', '11130-105', '11130-106', '11130-107', '11130-108', '11130-109'];
        i INT;
    BEGIN
        FOR i IN 1..9 LOOP
            v_movimento_id := insert_movimento_test(
                v_azienda_id, 'OAT', 'cl32', 'FRECCIA', '2025-10-11', v_ordini[i],
                v_quantita[i], 7.97, 'Massimo Ricciolio', 2.0, 'Mittente', v_centri[i]
            );
        END LOOP;
        RAISE NOTICE 'Movimenti 7-15: Ordini Attivi 11120-901 a 11120-909';
    END;
END $$;

-- Cleanup function
DROP FUNCTION IF EXISTS insert_movimento_test;

COMMIT;

-- =====================================================
-- RIEPILOGO
-- =====================================================

DO $$
DECLARE
    v_azienda_id UUID;
BEGIN
    v_azienda_id := current_setting('app.test_azienda_id')::uuid;

    RAISE NOTICE '';
    RAISE NOTICE '==================================================';
    RAISE NOTICE '✅ IMPORT COMPLETATO';
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Azienda ID: %', v_azienda_id;
    RAISE NOTICE 'Clienti: %', (SELECT COUNT(*) FROM soggetto WHERE tipo = 'cliente' AND azienda_id = v_azienda_id);
    RAISE NOTICE 'Fornitori: %', (SELECT COUNT(*) FROM soggetto WHERE tipo = 'fornitore' AND azienda_id = v_azienda_id);
    RAISE NOTICE 'Prodotti: %', (SELECT COUNT(*) FROM prodotto WHERE azienda_id = v_azienda_id);
    RAISE NOTICE 'Movimenti: %', (SELECT COUNT(*) FROM movimento WHERE azienda_id = v_azienda_id);
    RAISE NOTICE 'Vendite: € %', (SELECT COALESCE(SUM(totale), 0) FROM movimento m JOIN causale_documento c ON m.causale_id = c.id WHERE m.azienda_id = v_azienda_id AND c.tipo_operazione = 'vendita');
    RAISE NOTICE 'Acquisti: € %', (SELECT COALESCE(SUM(totale), 0) FROM movimento m JOIN causale_documento c ON m.causale_id = c.id WHERE m.azienda_id = v_azienda_id AND c.tipo_operazione = 'acquisto');
    RAISE NOTICE '==================================================';
END $$;

-- Mostra giacenze
SELECT
    'GIACENZE' as tipo,
    p.codice,
    p.nome,
    m.nome as magazzino,
    g.quantita,
    g.valore_unitario,
    g.valore_totale
FROM giacenza g
JOIN prodotto p ON g.prodotto_id = p.id
JOIN magazzino m ON g.magazzino_id = m.id
WHERE g.azienda_id = current_setting('app.test_azienda_id')::uuid
ORDER BY p.codice, m.nome;
