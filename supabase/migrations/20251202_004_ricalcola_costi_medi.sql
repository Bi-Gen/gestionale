-- =====================================================
-- MIGRATION: Ricalcola Costi Medi da Movimenti Storici
-- Data: 2025-12-02
-- Descrizione: Ricalcola il costo medio di tutti i prodotti
--              basandosi sui movimenti di magazzino storici
-- =====================================================

-- =====================================================
-- FUNZIONE: Ricalcola costo medio da movimenti storici
-- =====================================================

CREATE OR REPLACE FUNCTION ricalcola_costo_medio_prodotto(p_prodotto_id INT)
RETURNS TABLE(
  costo_medio_calcolato DECIMAL(12,2),
  costo_ultimo_calcolato DECIMAL(12,2),
  num_movimenti INT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_giacenza DECIMAL(12,3) := 0;
  v_costo_medio DECIMAL(12,2) := 0;
  v_costo_ultimo DECIMAL(12,2) := 0;
  v_movimento RECORD;
  v_count INT := 0;
BEGIN
  -- Processa tutti i movimenti in ordine cronologico
  FOR v_movimento IN
    SELECT
      id,
      quantita,
      segno,
      costo_unitario,
      data_movimento
    FROM movimento_magazzino
    WHERE prodotto_id = p_prodotto_id
    ORDER BY data_movimento ASC, id ASC
  LOOP
    v_count := v_count + 1;

    -- Solo i CARICHI (segno = 1) con costo_unitario aggiornano il costo medio
    IF v_movimento.segno = 1 AND v_movimento.costo_unitario IS NOT NULL THEN

      -- Se giacenza è 0 o negativa, il costo medio è il costo del carico
      IF v_giacenza <= 0 THEN
        v_costo_medio := v_movimento.costo_unitario;
      ELSE
        -- Formula costo medio ponderato
        v_costo_medio := (
          (v_giacenza * v_costo_medio) +
          (v_movimento.quantita * v_movimento.costo_unitario)
        ) / (v_giacenza + v_movimento.quantita);
      END IF;

      -- Aggiorna costo ultimo
      v_costo_ultimo := v_movimento.costo_unitario;

      RAISE NOTICE 'Movimento %: giacenza=%, qty=%, costo=%, nuovo_medio=%',
        v_movimento.id, v_giacenza, v_movimento.quantita, v_movimento.costo_unitario, v_costo_medio;
    END IF;

    -- Aggiorna giacenza
    v_giacenza := v_giacenza + (v_movimento.quantita * v_movimento.segno);
  END LOOP;

  -- Ritorna risultati
  RETURN QUERY SELECT
    ROUND(v_costo_medio, 2),
    v_costo_ultimo,
    v_count;
END;
$$;

COMMENT ON FUNCTION ricalcola_costo_medio_prodotto(INT) IS
'Ricalcola il costo medio di un prodotto basandosi su tutti i movimenti storici in ordine cronologico.
Restituisce: costo_medio_calcolato, costo_ultimo_calcolato, num_movimenti';

-- =====================================================
-- FUNZIONE: Aggiorna costo medio per tutti i prodotti
-- =====================================================

CREATE OR REPLACE FUNCTION ricalcola_tutti_i_costi_medi()
RETURNS TABLE(
  prodotto_id INT,
  codice VARCHAR(50),
  costo_medio_vecchio DECIMAL(12,2),
  costo_medio_nuovo DECIMAL(12,2),
  differenza DECIMAL(12,2),
  num_movimenti INT
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_prodotto RECORD;
  v_risultato RECORD;
BEGIN
  -- Per ogni prodotto con movimenti
  FOR v_prodotto IN
    SELECT DISTINCT p.id, p.codice, p.costo_medio
    FROM prodotto p
    INNER JOIN movimento_magazzino m ON p.id = m.prodotto_id
    WHERE m.segno = 1 AND m.costo_unitario IS NOT NULL
    ORDER BY p.id
  LOOP
    -- Ricalcola costo medio
    SELECT * INTO v_risultato
    FROM ricalcola_costo_medio_prodotto(v_prodotto.id);

    -- Aggiorna prodotto
    UPDATE prodotto
    SET
      costo_medio = v_risultato.costo_medio_calcolato,
      costo_ultimo = v_risultato.costo_ultimo_calcolato,
      updated_at = NOW()
    WHERE id = v_prodotto.id;

    -- Ritorna info
    RETURN QUERY SELECT
      v_prodotto.id,
      v_prodotto.codice,
      v_prodotto.costo_medio,
      v_risultato.costo_medio_calcolato,
      v_risultato.costo_medio_calcolato - COALESCE(v_prodotto.costo_medio, 0),
      v_risultato.num_movimenti;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION ricalcola_tutti_i_costi_medi() IS
'Ricalcola il costo medio per tutti i prodotti che hanno movimenti di carico.
Restituisce una tabella con vecchi e nuovi valori per verifica.';

-- =====================================================
-- ESECUZIONE: Ricalcola tutti i costi medi
-- =====================================================

-- Esegui il ricalcolo e mostra i risultati
DO $$
DECLARE
  v_result RECORD;
BEGIN
  RAISE NOTICE '=== INIZIO RICALCOLO COSTI MEDI ===';
  RAISE NOTICE '';

  FOR v_result IN SELECT * FROM ricalcola_tutti_i_costi_medi()
  LOOP
    RAISE NOTICE 'Prodotto % (%): % -> % (diff: %)',
      v_result.prodotto_id,
      v_result.codice,
      v_result.costo_medio_vecchio,
      v_result.costo_medio_nuovo,
      v_result.differenza;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '=== RICALCOLO COMPLETATO ===';
END $$;

-- =====================================================
-- FINE MIGRATION
-- =====================================================
