-- =====================================================
-- MIGRATION: Costo Medio Ponderato e Costo Ultimo
-- Data: 2025-12-02
-- Descrizione: Aggiorna automaticamente costo_ultimo e costo_medio
--              quando si effettua un carico di magazzino (acquisto)
-- =====================================================

-- =====================================================
-- FUNZIONE: Calcola costo medio ponderato
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

  -- Se giacenza è 0 o negativa, il nuovo costo medio è il costo del carico
  IF v_giacenza_attuale <= 0 THEN
    v_nuovo_costo_medio := p_costo_unitario_carico;
  ELSE
    -- Formula costo medio ponderato:
    -- nuovo_costo_medio = (giacenza_attuale * costo_medio_attuale + quantita_carico * costo_carico) / (giacenza_attuale + quantita_carico)
    v_nuovo_costo_medio := (
      (v_giacenza_attuale * v_costo_medio_attuale) +
      (p_quantita_carico * p_costo_unitario_carico)
    ) / (v_giacenza_attuale + p_quantita_carico);
  END IF;

  -- Arrotonda a 2 decimali
  RETURN ROUND(v_nuovo_costo_medio, 2);
END;
$$;

COMMENT ON FUNCTION calcola_costo_medio_ponderato(INT, DECIMAL, DECIMAL) IS
'Calcola il costo medio ponderato di un prodotto dopo un carico.
Formula: (giacenza_attuale * costo_medio_attuale + quantita_carico * costo_carico) / (giacenza_attuale + quantita_carico)
Se giacenza <= 0, restituisce il costo del carico.';

-- =====================================================
-- TRIGGER: Aggiorna costo_ultimo e costo_medio dopo carico
-- =====================================================

CREATE OR REPLACE FUNCTION aggiorna_costi_prodotto()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_nuovo_costo_medio DECIMAL(12,2);
BEGIN
  -- Solo per movimenti di CARICO (segno = 1) con costo_unitario specificato
  IF NEW.segno = 1 AND NEW.costo_unitario IS NOT NULL THEN

    -- Calcola nuovo costo medio ponderato
    v_nuovo_costo_medio := calcola_costo_medio_ponderato(
      NEW.prodotto_id,
      NEW.quantita,
      NEW.costo_unitario
    );

    -- Aggiorna prodotto con costo_ultimo e costo_medio
    UPDATE prodotto
    SET
      costo_ultimo = NEW.costo_unitario,
      costo_medio = v_nuovo_costo_medio,
      updated_at = NOW()
    WHERE id = NEW.prodotto_id;

    RAISE NOTICE 'Prodotto % aggiornato: costo_ultimo=%, costo_medio=%',
      NEW.prodotto_id, NEW.costo_unitario, v_nuovo_costo_medio;
  END IF;

  RETURN NEW;
END;
$$;

-- Elimina trigger se esiste già (per re-run safe)
DROP TRIGGER IF EXISTS trg_movimento_aggiorna_costi ON movimento_magazzino;

-- Crea trigger DOPO l'aggiornamento della giacenza (AFTER INSERT)
CREATE TRIGGER trg_movimento_aggiorna_costi
  AFTER INSERT ON movimento_magazzino
  FOR EACH ROW
  EXECUTE FUNCTION aggiorna_costi_prodotto();

COMMENT ON FUNCTION aggiorna_costi_prodotto() IS
'Aggiorna automaticamente costo_ultimo e costo_medio del prodotto
quando viene inserito un movimento di CARICO (segno=1) con costo_unitario.
- costo_ultimo: viene impostato al costo_unitario del movimento
- costo_medio: viene ricalcolato con formula del costo medio ponderato';

-- =====================================================
-- FUNZIONE: Aggiorna manualmente prezzo_acquisto
-- =====================================================

CREATE OR REPLACE FUNCTION aggiorna_prezzo_acquisto(
  p_prodotto_id INT,
  p_nuovo_prezzo_acquisto DECIMAL(12,2)
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE prodotto
  SET
    prezzo_acquisto = p_nuovo_prezzo_acquisto,
    updated_at = NOW()
  WHERE id = p_prodotto_id;

  RAISE NOTICE 'Prezzo acquisto prodotto % aggiornato a %', p_prodotto_id, p_nuovo_prezzo_acquisto;
END;
$$;

COMMENT ON FUNCTION aggiorna_prezzo_acquisto(INT, DECIMAL) IS
'Aggiorna manualmente il prezzo_acquisto (listino fornitore) di un prodotto.
Usare quando il fornitore cambia ufficialmente il listino.';

-- =====================================================
-- FINE MIGRATION
-- =====================================================
