-- =====================================================
-- MIGRATION: Aggiornamento get_prezzo_prodotto con categoria cliente
-- Data: 2025-12-09
-- Descrizione: Aggiunge lo step categoria_cliente nella cascade
--              per recuperare il prezzo corretto in vendita.
--
-- Nuova logica:
-- 1. Listino diretto del cliente (soggetto.listino_id)
-- 2. Listino della categoria cliente (categoria_cliente.listino_id)
-- 3. Listino predefinito aziendale (listino.predefinito = true)
-- 4. Prezzo base prodotto (prodotto.prezzo_vendita)
-- =====================================================

-- Rinomina la funzione per chiarezza (get_prezzo_cliente per vendita)
DROP FUNCTION IF EXISTS get_prezzo_prodotto(INT, INT, DECIMAL);

CREATE OR REPLACE FUNCTION get_prezzo_cliente(
  p_prodotto_id INT,
  p_cliente_id INT
)
RETURNS TABLE (
  prezzo DECIMAL(15,4),
  listino_id INT,
  listino_codice VARCHAR(20),
  provvigione DECIMAL(5,2),
  sconto_max DECIMAL(5,2),
  fonte VARCHAR(50)
) AS $$
DECLARE
  v_azienda_id UUID;
  v_listino_cliente_id INT;
  v_categoria_cliente_id INT;
  v_listino_categoria_id INT;
  v_prezzo DECIMAL(15,4);
  v_listino_id INT;
  v_provvigione DECIMAL(5,2);
  v_sconto_max DECIMAL(5,2);
  v_listino_codice VARCHAR(20);
  v_fonte VARCHAR(50);
BEGIN
  -- Ottieni azienda_id
  v_azienda_id := public.get_user_azienda_id();

  -- Ottieni listino diretto e categoria del cliente
  SELECT s.listino_id, s.categoria_cliente_id
  INTO v_listino_cliente_id, v_categoria_cliente_id
  FROM soggetto s
  WHERE s.id = p_cliente_id AND s.azienda_id = v_azienda_id;

  -- =========================================================
  -- STEP 1: Cerca nel listino diretto del cliente
  -- =========================================================
  IF v_listino_cliente_id IS NOT NULL THEN
    SELECT
      lp.prezzo,
      l.id,
      l.codice,
      COALESCE(lp.provvigione_override, l.provvigione_default),
      lp.sconto_max,
      'listino_cliente'
    INTO v_prezzo, v_listino_id, v_listino_codice, v_provvigione, v_sconto_max, v_fonte
    FROM listino_prodotto lp
    JOIN listino l ON l.id = lp.listino_id
    WHERE lp.listino_id = v_listino_cliente_id
      AND lp.prodotto_id = p_prodotto_id
      AND lp.azienda_id = v_azienda_id
      AND l.attivo = true
      AND (lp.data_inizio IS NULL OR lp.data_inizio <= CURRENT_DATE)
      AND (lp.data_fine IS NULL OR lp.data_fine >= CURRENT_DATE);

    IF FOUND THEN
      RETURN QUERY SELECT v_prezzo, v_listino_id, v_listino_codice, v_provvigione, v_sconto_max, v_fonte;
      RETURN;
    END IF;
  END IF;

  -- =========================================================
  -- STEP 2: Cerca nel listino della categoria cliente
  -- =========================================================
  IF v_categoria_cliente_id IS NOT NULL THEN
    -- Ottieni listino della categoria
    SELECT cc.listino_id INTO v_listino_categoria_id
    FROM categoria_cliente cc
    WHERE cc.id = v_categoria_cliente_id;

    IF v_listino_categoria_id IS NOT NULL THEN
      SELECT
        lp.prezzo,
        l.id,
        l.codice,
        COALESCE(lp.provvigione_override, l.provvigione_default),
        lp.sconto_max,
        'listino_categoria'
      INTO v_prezzo, v_listino_id, v_listino_codice, v_provvigione, v_sconto_max, v_fonte
      FROM listino_prodotto lp
      JOIN listino l ON l.id = lp.listino_id
      WHERE lp.listino_id = v_listino_categoria_id
        AND lp.prodotto_id = p_prodotto_id
        AND lp.azienda_id = v_azienda_id
        AND l.attivo = true
        AND (lp.data_inizio IS NULL OR lp.data_inizio <= CURRENT_DATE)
        AND (lp.data_fine IS NULL OR lp.data_fine >= CURRENT_DATE);

      IF FOUND THEN
        RETURN QUERY SELECT v_prezzo, v_listino_id, v_listino_codice, v_provvigione, v_sconto_max, v_fonte;
        RETURN;
      END IF;
    END IF;
  END IF;

  -- =========================================================
  -- STEP 3: Cerca nel listino predefinito aziendale
  -- =========================================================
  SELECT
    lp.prezzo,
    l.id,
    l.codice,
    COALESCE(lp.provvigione_override, l.provvigione_default),
    lp.sconto_max,
    'listino_default'
  INTO v_prezzo, v_listino_id, v_listino_codice, v_provvigione, v_sconto_max, v_fonte
  FROM listino_prodotto lp
  JOIN listino l ON l.id = lp.listino_id
  WHERE l.predefinito = true
    AND l.tipo = 'vendita'
    AND l.attivo = true
    AND lp.prodotto_id = p_prodotto_id
    AND lp.azienda_id = v_azienda_id
    AND (lp.data_inizio IS NULL OR lp.data_inizio <= CURRENT_DATE)
    AND (lp.data_fine IS NULL OR lp.data_fine >= CURRENT_DATE);

  IF FOUND THEN
    RETURN QUERY SELECT v_prezzo, v_listino_id, v_listino_codice, v_provvigione, v_sconto_max, v_fonte;
    RETURN;
  END IF;

  -- =========================================================
  -- STEP 4: Fallback al prezzo base del prodotto
  -- =========================================================
  SELECT
    p.prezzo_vendita,
    NULL::INT,
    NULL::VARCHAR(20),
    0::DECIMAL(5,2),
    NULL::DECIMAL(5,2),
    'prezzo_base'
  INTO v_prezzo, v_listino_id, v_listino_codice, v_provvigione, v_sconto_max, v_fonte
  FROM prodotto p
  WHERE p.id = p_prodotto_id AND p.azienda_id = v_azienda_id;

  RETURN QUERY SELECT v_prezzo, v_listino_id, v_listino_codice, v_provvigione, v_sconto_max, v_fonte;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_prezzo_cliente IS
'Restituisce il prezzo di vendita per un prodotto/cliente.
Cascade: listino_cliente > listino_categoria > listino_default > prezzo_base';

-- =====================================================
-- FINE MIGRATION
-- =====================================================
