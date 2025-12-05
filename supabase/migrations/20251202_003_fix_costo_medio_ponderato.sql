-- =====================================================
-- MIGRATION: Fix Calcolo Costo Medio Ponderato
-- Data: 2025-12-02
-- Descrizione: Corregge il bug nel calcolo del costo medio
--              La giacenza letta è già stata aggiornata dal trigger,
--              quindi dobbiamo sottrarla prima del calcolo
-- =====================================================

-- =====================================================
-- FUNZIONE CORRETTA: Calcola costo medio ponderato
-- =====================================================

CREATE OR REPLACE FUNCTION calcola_costo_medio_ponderato(
  p_prodotto_id INT,
  p_quantita_carico DECIMAL(12,3),
  p_costo_unitario_carico DECIMAL(12,2)
)
RETURNS DECIMAL(12,2)
LANGUAGE plpgsql
AS $$
DECLARE
  v_giacenza_attuale DECIMAL(12,3);
  v_giacenza_prima_carico DECIMAL(12,3);
  v_costo_medio_attuale DECIMAL(12,2);
  v_nuovo_costo_medio DECIMAL(12,2);
BEGIN
  -- Recupera giacenza e costo medio attuali
  SELECT
    COALESCE(quantita_magazzino, 0),
    COALESCE(costo_medio, 0)
  INTO v_giacenza_attuale, v_costo_medio_attuale
  FROM prodotto
  WHERE id = p_prodotto_id;

  -- IMPORTANTE: La giacenza è già stata aggiornata dal trigger trg_movimento_aggiorna_giacenza
  -- che viene eseguito prima di questo trigger (ordine alfabetico dei trigger).
  -- Dobbiamo quindi sottrarre la quantità appena caricata per ottenere la giacenza PRIMA del carico.
  v_giacenza_prima_carico := v_giacenza_attuale - p_quantita_carico;

  -- Se giacenza prima del carico era 0 o negativa, il nuovo costo medio è il costo del carico
  IF v_giacenza_prima_carico <= 0 THEN
    v_nuovo_costo_medio := p_costo_unitario_carico;
  ELSE
    -- Formula costo medio ponderato (usando giacenza PRIMA del carico):
    -- nuovo_costo_medio = (giacenza_prima * costo_medio_attuale + quantita_carico * costo_carico) / (giacenza_prima + quantita_carico)
    v_nuovo_costo_medio := (
      (v_giacenza_prima_carico * v_costo_medio_attuale) +
      (p_quantita_carico * p_costo_unitario_carico)
    ) / (v_giacenza_prima_carico + p_quantita_carico);
  END IF;

  -- Arrotonda a 2 decimali
  RETURN ROUND(v_nuovo_costo_medio, 2);
END;
$$;

COMMENT ON FUNCTION calcola_costo_medio_ponderato(INT, DECIMAL, DECIMAL) IS
'Calcola il costo medio ponderato di un prodotto dopo un carico.
IMPORTANTE: Assume che la giacenza nel prodotto sia già stata aggiornata.
Formula: (giacenza_prima_carico * costo_medio_attuale + quantita_carico * costo_carico) / (giacenza_prima_carico + quantita_carico)
Se giacenza_prima_carico <= 0, restituisce il costo del carico.';

-- =====================================================
-- FINE MIGRATION
-- =====================================================
