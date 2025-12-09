-- =====================================================
-- MIGRATION: Statistiche Vendita Prodotto
-- Data: 2025-12-09
-- Descrizione: Funzione per recuperare statistiche storiche
--              di vendita per supporto decisionale ordini
-- =====================================================

-- =====================================================
-- FUNZIONE: get_statistiche_vendita_prodotto
-- Calcola statistiche storiche di vendita per un prodotto
-- =====================================================

CREATE OR REPLACE FUNCTION get_statistiche_vendita_prodotto(
  p_prodotto_id INT,
  p_cliente_id INT DEFAULT NULL,
  p_mesi_storico INT DEFAULT 12
)
RETURNS TABLE (
  -- Statistiche vendite generali
  prezzo_medio_vendita DECIMAL(12,4),
  prezzo_min_vendita DECIMAL(12,4),
  prezzo_max_vendita DECIMAL(12,4),
  quantita_totale_venduta DECIMAL(12,3),
  numero_vendite INT,

  -- Ultima vendita (generale)
  ultima_vendita_prezzo DECIMAL(12,2),
  ultima_vendita_data DATE,
  ultima_vendita_quantita DECIMAL(12,3),

  -- Ultima vendita allo stesso cliente (se specificato)
  ultima_vendita_cliente_prezzo DECIMAL(12,2),
  ultima_vendita_cliente_data DATE,
  ultima_vendita_cliente_quantita DECIMAL(12,3),

  -- Costi
  costo_ultimo DECIMAL(12,4),
  costo_medio DECIMAL(12,4),

  -- Margini calcolati
  margine_medio_euro DECIMAL(12,4),
  margine_medio_percentuale DECIMAL(5,2),
  margine_ultimo_vendita_euro DECIMAL(12,4),
  margine_ultimo_vendita_perc DECIMAL(5,2)
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_data_inizio DATE;
  v_costo_ultimo DECIMAL(12,4);
  v_costo_medio DECIMAL(12,4);
  v_prezzo_medio DECIMAL(12,4);
  v_prezzo_min DECIMAL(12,4);
  v_prezzo_max DECIMAL(12,4);
  v_qtot DECIMAL(12,3);
  v_num_vendite INT;
  v_ult_prezzo DECIMAL(12,2);
  v_ult_data DATE;
  v_ult_qta DECIMAL(12,3);
  v_ult_cli_prezzo DECIMAL(12,2);
  v_ult_cli_data DATE;
  v_ult_cli_qta DECIMAL(12,3);
BEGIN
  -- Calcola data inizio periodo
  v_data_inizio := CURRENT_DATE - (p_mesi_storico || ' months')::INTERVAL;

  -- =====================================================
  -- 1. Recupera costo ultimo dal prodotto
  -- =====================================================
  SELECT p.costo_ultimo INTO v_costo_ultimo
  FROM prodotto p
  WHERE p.id = p_prodotto_id;

  -- =====================================================
  -- 2. Calcola costo medio da storico (se disponibile)
  -- =====================================================
  SELECT AVG(sp.prezzo)::DECIMAL(12,4) INTO v_costo_medio
  FROM storico_prezzi_prodotto sp
  WHERE sp.prodotto_id = p_prodotto_id
    AND sp.tipo = 'acquisto'
    AND sp.data_prezzo >= v_data_inizio;

  -- Se non c'è storico, usa costo_ultimo
  IF v_costo_medio IS NULL THEN
    v_costo_medio := v_costo_ultimo;
  END IF;

  -- =====================================================
  -- 3. Statistiche vendite generali (da ordini evasi/confermati)
  -- =====================================================
  SELECT
    AVG(d.prezzo_unitario)::DECIMAL(12,4),
    MIN(d.prezzo_unitario)::DECIMAL(12,4),
    MAX(d.prezzo_unitario)::DECIMAL(12,4),
    SUM(d.quantita)::DECIMAL(12,3),
    COUNT(*)::INT
  INTO v_prezzo_medio, v_prezzo_min, v_prezzo_max, v_qtot, v_num_vendite
  FROM dettagli_ordini d
  INNER JOIN ordini o ON d.ordine_id = o.id
  WHERE d.prodotto_id = p_prodotto_id
    AND o.tipo = 'vendita'
    AND o.stato IN ('confermato', 'evaso')
    AND o.data_ordine >= v_data_inizio;

  -- =====================================================
  -- 4. Ultima vendita generale
  -- =====================================================
  SELECT
    d.prezzo_unitario,
    o.data_ordine,
    d.quantita
  INTO v_ult_prezzo, v_ult_data, v_ult_qta
  FROM dettagli_ordini d
  INNER JOIN ordini o ON d.ordine_id = o.id
  WHERE d.prodotto_id = p_prodotto_id
    AND o.tipo = 'vendita'
    AND o.stato IN ('confermato', 'evaso')
  ORDER BY o.data_ordine DESC, o.id DESC
  LIMIT 1;

  -- =====================================================
  -- 5. Ultima vendita allo stesso cliente (se specificato)
  -- =====================================================
  IF p_cliente_id IS NOT NULL THEN
    SELECT
      d.prezzo_unitario,
      o.data_ordine,
      d.quantita
    INTO v_ult_cli_prezzo, v_ult_cli_data, v_ult_cli_qta
    FROM dettagli_ordini d
    INNER JOIN ordini o ON d.ordine_id = o.id
    WHERE d.prodotto_id = p_prodotto_id
      AND o.cliente_id = p_cliente_id
      AND o.tipo = 'vendita'
      AND o.stato IN ('confermato', 'evaso')
    ORDER BY o.data_ordine DESC, o.id DESC
    LIMIT 1;
  END IF;

  -- =====================================================
  -- 6. Ritorna risultati con margini calcolati
  -- =====================================================
  RETURN QUERY SELECT
    v_prezzo_medio AS prezzo_medio_vendita,
    v_prezzo_min AS prezzo_min_vendita,
    v_prezzo_max AS prezzo_max_vendita,
    v_qtot AS quantita_totale_venduta,
    COALESCE(v_num_vendite, 0) AS numero_vendite,

    v_ult_prezzo AS ultima_vendita_prezzo,
    v_ult_data AS ultima_vendita_data,
    v_ult_qta AS ultima_vendita_quantita,

    v_ult_cli_prezzo AS ultima_vendita_cliente_prezzo,
    v_ult_cli_data AS ultima_vendita_cliente_data,
    v_ult_cli_qta AS ultima_vendita_cliente_quantita,

    v_costo_ultimo AS costo_ultimo,
    v_costo_medio AS costo_medio,

    -- Margine medio in euro
    CASE
      WHEN v_prezzo_medio IS NOT NULL AND v_costo_medio IS NOT NULL
      THEN (v_prezzo_medio - v_costo_medio)::DECIMAL(12,4)
      ELSE NULL
    END AS margine_medio_euro,

    -- Margine medio percentuale
    CASE
      WHEN v_prezzo_medio IS NOT NULL AND v_costo_medio IS NOT NULL AND v_costo_medio > 0
      THEN ROUND(((v_prezzo_medio - v_costo_medio) / v_costo_medio * 100)::numeric, 2)::DECIMAL(5,2)
      ELSE NULL
    END AS margine_medio_percentuale,

    -- Margine ultima vendita in euro
    CASE
      WHEN v_ult_prezzo IS NOT NULL AND v_costo_ultimo IS NOT NULL
      THEN (v_ult_prezzo - v_costo_ultimo)::DECIMAL(12,4)
      ELSE NULL
    END AS margine_ultimo_vendita_euro,

    -- Margine ultima vendita percentuale
    CASE
      WHEN v_ult_prezzo IS NOT NULL AND v_costo_ultimo IS NOT NULL AND v_costo_ultimo > 0
      THEN ROUND(((v_ult_prezzo - v_costo_ultimo) / v_costo_ultimo * 100)::numeric, 2)::DECIMAL(5,2)
      ELSE NULL
    END AS margine_ultimo_vendita_perc;
END;
$$;

COMMENT ON FUNCTION get_statistiche_vendita_prodotto(INT, INT, INT) IS
'Calcola statistiche storiche di vendita per un prodotto.
Parametri:
- p_prodotto_id: ID prodotto (obbligatorio)
- p_cliente_id: ID cliente per statistiche specifiche (opzionale)
- p_mesi_storico: mesi da considerare (default 12)

Restituisce:
- Prezzi medi/min/max di vendita
- Quantità totale venduta e numero vendite
- Ultima vendita (generale e per cliente specifico)
- Costi (ultimo e medio)
- Margini calcolati (in euro e percentuale)';

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION get_statistiche_vendita_prodotto(INT, INT, INT) TO authenticated;

-- =====================================================
-- FINE MIGRATION
-- =====================================================
