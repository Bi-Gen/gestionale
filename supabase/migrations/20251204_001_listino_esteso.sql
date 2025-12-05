-- =====================================================
-- MIGRATION: Estensione Listino e Listino Prodotto
-- Data: 2025-12-04
-- Descrizione: Aggiunge campi al listino e crea tabella listino_prodotto
-- =====================================================

-- =====================================================
-- STEP 1: Estendere tabella LISTINO
-- =====================================================

-- Aggiungi provvigione_default (% provvigione per vendite con questo listino)
ALTER TABLE listino
ADD COLUMN IF NOT EXISTS provvigione_default DECIMAL(5,2) DEFAULT 0
  CHECK (provvigione_default >= 0 AND provvigione_default <= 100);

COMMENT ON COLUMN listino.provvigione_default IS 'Percentuale provvigione default per vendite con questo listino';

-- Aggiungi fornitore_id (per listini acquisto legati a fornitore specifico)
ALTER TABLE listino
ADD COLUMN IF NOT EXISTS fornitore_id INT REFERENCES soggetto(id) ON DELETE SET NULL;

COMMENT ON COLUMN listino.fornitore_id IS 'Fornitore associato (per listini acquisto)';

-- Aggiungi priorita (per ordinamento e cascata prezzi)
ALTER TABLE listino
ADD COLUMN IF NOT EXISTS priorita INT DEFAULT 0;

COMMENT ON COLUMN listino.priorita IS 'Priorità listino (numero più alto = priorità maggiore)';

-- Modifica valuta: da VARCHAR a FK verso tabella valuta
-- Prima aggiungiamo la nuova colonna
ALTER TABLE listino
ADD COLUMN IF NOT EXISTS valuta_id INT REFERENCES valuta(id) ON DELETE SET NULL;

-- Aggiorna valuta_id con riferimento a EUR esistente (se presente)
UPDATE listino l
SET valuta_id = v.id
FROM valuta v
WHERE v.azienda_id = l.azienda_id
  AND v.codice = COALESCE(l.valuta, 'EUR')
  AND l.valuta_id IS NULL;

COMMENT ON COLUMN listino.valuta_id IS 'Valuta del listino (FK a tabella valuta)';

-- Indice per fornitore
CREATE INDEX IF NOT EXISTS idx_listino_fornitore ON listino(fornitore_id) WHERE fornitore_id IS NOT NULL;

-- Indice per priorità
CREATE INDEX IF NOT EXISTS idx_listino_priorita ON listino(priorita DESC);

-- =====================================================
-- STEP 2: Creare tabella LISTINO_PRODOTTO
-- =====================================================

CREATE TABLE IF NOT EXISTS listino_prodotto (
  id SERIAL PRIMARY KEY,
  azienda_id UUID NOT NULL REFERENCES azienda(id) ON DELETE CASCADE,

  -- Riferimenti
  listino_id INT NOT NULL REFERENCES listino(id) ON DELETE CASCADE,
  prodotto_id INT NOT NULL REFERENCES prodotto(id) ON DELETE CASCADE,

  -- Prezzo
  prezzo DECIMAL(15,4) NOT NULL CHECK (prezzo >= 0),
  prezzo_minimo DECIMAL(15,4) CHECK (prezzo_minimo IS NULL OR prezzo_minimo >= 0),

  -- Sconto massimo applicabile su questo prodotto in questo listino
  sconto_max DECIMAL(5,2) CHECK (sconto_max IS NULL OR (sconto_max >= 0 AND sconto_max <= 100)),

  -- Provvigione override (sovrascrive listino.provvigione_default se valorizzato)
  provvigione_override DECIMAL(5,2) CHECK (provvigione_override IS NULL OR (provvigione_override >= 0 AND provvigione_override <= 100)),

  -- Validità temporale (opzionale, per promozioni)
  data_inizio DATE,
  data_fine DATE,

  -- Note
  note TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Un prodotto può apparire una sola volta per listino
  UNIQUE(listino_id, prodotto_id)
);

-- Indici per performance
CREATE INDEX idx_listino_prodotto_azienda ON listino_prodotto(azienda_id);
CREATE INDEX idx_listino_prodotto_listino ON listino_prodotto(listino_id);
CREATE INDEX idx_listino_prodotto_prodotto ON listino_prodotto(prodotto_id);
CREATE INDEX idx_listino_prodotto_validita ON listino_prodotto(data_inizio, data_fine)
  WHERE data_inizio IS NOT NULL OR data_fine IS NOT NULL;

COMMENT ON TABLE listino_prodotto IS 'Prezzi prodotti per listino';
COMMENT ON COLUMN listino_prodotto.prezzo IS 'Prezzo del prodotto in questo listino';
COMMENT ON COLUMN listino_prodotto.prezzo_minimo IS 'Prezzo minimo sotto il quale non si può scendere';
COMMENT ON COLUMN listino_prodotto.sconto_max IS 'Sconto massimo applicabile (%)';
COMMENT ON COLUMN listino_prodotto.provvigione_override IS 'Provvigione specifica per questo prodotto (sovrascrive default listino)';

-- =====================================================
-- STEP 3: Trigger updated_at per listino_prodotto
-- =====================================================

CREATE TRIGGER trg_listino_prodotto_updated_at
  BEFORE UPDATE ON listino_prodotto FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- STEP 4: RLS Policies per listino_prodotto
-- =====================================================

ALTER TABLE listino_prodotto ENABLE ROW LEVEL SECURITY;

-- SELECT: tutti gli utenti dell'azienda possono leggere
CREATE POLICY listino_prodotto_select_policy ON listino_prodotto
  FOR SELECT
  USING (azienda_id = public.get_user_azienda_id());

-- INSERT: solo utenti con permesso configurazioni.write
CREATE POLICY listino_prodotto_insert_policy ON listino_prodotto
  FOR INSERT
  WITH CHECK (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('configurazioni', 'write')
  );

-- UPDATE: solo utenti con permesso configurazioni.write
CREATE POLICY listino_prodotto_update_policy ON listino_prodotto
  FOR UPDATE
  USING (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('configurazioni', 'write')
  );

-- DELETE: solo utenti con permesso configurazioni.delete
CREATE POLICY listino_prodotto_delete_policy ON listino_prodotto
  FOR DELETE
  USING (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('configurazioni', 'delete')
  );

-- =====================================================
-- STEP 5: Grant permissions
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON listino_prodotto TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE listino_prodotto_id_seq TO authenticated;

-- =====================================================
-- STEP 6: Funzione helper per ottenere prezzo prodotto
-- =====================================================

-- Funzione che restituisce il prezzo di un prodotto per un cliente
-- Considera: listino cliente > listino default > prezzo base prodotto
CREATE OR REPLACE FUNCTION get_prezzo_prodotto(
  p_cliente_id INT,
  p_prodotto_id INT,
  p_quantita DECIMAL DEFAULT 1
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
  v_prezzo DECIMAL(15,4);
  v_provvigione DECIMAL(5,2);
  v_sconto_max DECIMAL(5,2);
  v_listino_codice VARCHAR(20);
  v_fonte VARCHAR(50);
BEGIN
  -- Ottieni azienda_id
  v_azienda_id := public.get_user_azienda_id();

  -- Ottieni listino del cliente
  SELECT s.listino_id INTO v_listino_cliente_id
  FROM soggetto s
  WHERE s.id = p_cliente_id AND s.azienda_id = v_azienda_id;

  -- STEP 1: Cerca nel listino del cliente
  IF v_listino_cliente_id IS NOT NULL THEN
    SELECT
      lp.prezzo,
      l.id,
      l.codice,
      COALESCE(lp.provvigione_override, l.provvigione_default),
      lp.sconto_max,
      'listino_cliente'
    INTO v_prezzo, listino_id, v_listino_codice, v_provvigione, v_sconto_max, v_fonte
    FROM listino_prodotto lp
    JOIN listino l ON l.id = lp.listino_id
    WHERE lp.listino_id = v_listino_cliente_id
      AND lp.prodotto_id = p_prodotto_id
      AND lp.azienda_id = v_azienda_id
      AND (lp.data_inizio IS NULL OR lp.data_inizio <= CURRENT_DATE)
      AND (lp.data_fine IS NULL OR lp.data_fine >= CURRENT_DATE);

    IF FOUND THEN
      RETURN QUERY SELECT v_prezzo, listino_id, v_listino_codice, v_provvigione, v_sconto_max, v_fonte;
      RETURN;
    END IF;
  END IF;

  -- STEP 2: Cerca nel listino predefinito
  SELECT
    lp.prezzo,
    l.id,
    l.codice,
    COALESCE(lp.provvigione_override, l.provvigione_default),
    lp.sconto_max,
    'listino_default'
  INTO v_prezzo, listino_id, v_listino_codice, v_provvigione, v_sconto_max, v_fonte
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
    RETURN QUERY SELECT v_prezzo, listino_id, v_listino_codice, v_provvigione, v_sconto_max, v_fonte;
    RETURN;
  END IF;

  -- STEP 3: Fallback al prezzo base del prodotto
  SELECT
    p.prezzo_vendita,
    NULL::INT,
    NULL::VARCHAR(20),
    0::DECIMAL(5,2),
    NULL::DECIMAL(5,2),
    'prezzo_base'
  INTO v_prezzo, listino_id, v_listino_codice, v_provvigione, v_sconto_max, v_fonte
  FROM prodotto p
  WHERE p.id = p_prodotto_id AND p.azienda_id = v_azienda_id;

  RETURN QUERY SELECT v_prezzo, listino_id, v_listino_codice, v_provvigione, v_sconto_max, v_fonte;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_prezzo_prodotto IS 'Restituisce il prezzo di un prodotto per un cliente, considerando listino cliente > listino default > prezzo base';

-- =====================================================
-- FINE MIGRATION
-- =====================================================
