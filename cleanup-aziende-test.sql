-- =====================================================
-- CLEANUP COMPLETO DATI TEST PER AZIENDE SPECIFICHE
-- =====================================================
-- Elimina tutti i dati per le aziende:
-- - b8b6502a-ead6-428b-ad97-6246b8129443
-- - 30a52084-0ba5-4203-ac8b-7b3692fd92a8
-- =====================================================

DO $$
DECLARE
    v_azienda_id_1 UUID := 'b8b6502a-ead6-428b-ad97-6246b8129443';
    v_azienda_id_2 UUID := '30a52084-0ba5-4203-ac8b-7b3692fd92a8';
    v_count INT;
BEGIN
    RAISE NOTICE '======================================================';
    RAISE NOTICE 'CLEANUP DATI PER AZIENDE TEST';
    RAISE NOTICE '======================================================';

    -- =====================================================
    -- MOVIMENTI E DETTAGLI
    -- =====================================================
    RAISE NOTICE '';
    RAISE NOTICE '🧹 Pulizia movimenti...';

    -- Dettagli movimenti
    DELETE FROM dettaglio_movimento WHERE movimento_id IN (
        SELECT id FROM movimento WHERE azienda_id IN (v_azienda_id_1, v_azienda_id_2)
    );
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '  - Eliminati % dettagli movimento', v_count;

    -- Movimenti
    DELETE FROM movimento WHERE azienda_id IN (v_azienda_id_1, v_azienda_id_2);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '  - Eliminati % movimenti', v_count;

    -- =====================================================
    -- PRODOTTI
    -- =====================================================
    RAISE NOTICE '';
    RAISE NOTICE '📦 Pulizia prodotti...';

    DELETE FROM prodotto WHERE azienda_id IN (v_azienda_id_1, v_azienda_id_2);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '  - Eliminati % prodotti', v_count;

    -- =====================================================
    -- SOGGETTI
    -- =====================================================
    RAISE NOTICE '';
    RAISE NOTICE '👥 Pulizia soggetti...';

    DELETE FROM soggetto WHERE azienda_id IN (v_azienda_id_1, v_azienda_id_2);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '  - Eliminati % soggetti', v_count;

    -- =====================================================
    -- BRAND
    -- =====================================================
    RAISE NOTICE '';
    RAISE NOTICE '🏷️  Pulizia brand...';

    DELETE FROM brand WHERE azienda_id IN (v_azienda_id_1, v_azienda_id_2);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '  - Eliminati % brand', v_count;

    -- =====================================================
    -- MAGAZZINI
    -- =====================================================
    RAISE NOTICE '';
    RAISE NOTICE '🏢 Pulizia magazzini...';

    DELETE FROM magazzino WHERE azienda_id IN (v_azienda_id_1, v_azienda_id_2);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '  - Eliminati % magazzini', v_count;

    -- =====================================================
    -- CLASSIFICAZIONI
    -- =====================================================
    RAISE NOTICE '';
    RAISE NOTICE '📂 Pulizia classificazioni...';

    -- Famiglie
    DELETE FROM famiglie WHERE azienda_id IN (v_azienda_id_1, v_azienda_id_2);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '  - Eliminate % famiglie', v_count;

    -- Macrofamiglie
    DELETE FROM macrofamiglie WHERE azienda_id IN (v_azienda_id_1, v_azienda_id_2);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '  - Eliminate % macrofamiglie', v_count;

    -- Tipi soggetto
    DELETE FROM tipi_soggetto WHERE azienda_id IN (v_azienda_id_1, v_azienda_id_2);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '  - Eliminati % tipi soggetto', v_count;

    -- =====================================================
    -- LISTINI
    -- =====================================================
    RAISE NOTICE '';
    RAISE NOTICE '💰 Pulizia listini...';

    DELETE FROM listino WHERE azienda_id IN (v_azienda_id_1, v_azienda_id_2);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '  - Eliminati % listini', v_count;

    -- =====================================================
    -- ALIQUOTE IVA
    -- =====================================================
    RAISE NOTICE '';
    RAISE NOTICE '📊 Pulizia aliquote IVA...';

    DELETE FROM aliquota_iva WHERE azienda_id IN (v_azienda_id_1, v_azienda_id_2);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '  - Eliminate % aliquote IVA', v_count;

    -- =====================================================
    -- CATEGORIE
    -- =====================================================
    RAISE NOTICE '';
    RAISE NOTICE '🏷️  Pulizia categorie...';

    DELETE FROM categoria WHERE azienda_id IN (v_azienda_id_1, v_azienda_id_2);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '  - Eliminate % categorie', v_count;

    -- =====================================================
    -- CAUSALI DOCUMENTO
    -- =====================================================
    RAISE NOTICE '';
    RAISE NOTICE '📋 Pulizia causali documento...';

    DELETE FROM causale_documento WHERE azienda_id IN (v_azienda_id_1, v_azienda_id_2);
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '  - Eliminate % causali documento', v_count;

    -- =====================================================
    -- FINE
    -- =====================================================
    RAISE NOTICE '';
    RAISE NOTICE '======================================================';
    RAISE NOTICE '✅ CLEANUP COMPLETATO';
    RAISE NOTICE '======================================================';

END $$;
