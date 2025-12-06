-- =====================================================
-- MIGRATION: Storico Prezzi Prodotto
-- Data: 2025-12-06
-- Descrizione: Traccia variazioni prezzi acquisto per
--              calcolo costo medio ponderato su range temporale
-- =====================================================

-- =====================================================
-- TABELLA: storico_prezzi_prodotto
-- =====================================================

CREATE TABLE IF NOT EXISTS storico_prezzi_prodotto (
  id SERIAL PRIMARY KEY,
  prodotto_id INT NOT NULL REFERENCES prodotto(id) ON DELETE CASCADE,

  -- Fornitore (opzionale, per tracciare da chi arriva il prezzo)
  fornitore_id INT REFERENCES soggetto(id) ON DELETE SET NULL,

  -- Prezzo e data
  prezzo DECIMAL(12,4) NOT NULL,  -- 4 decimali per precisione
  valuta VARCHAR(3) DEFAULT 'EUR',
  data_prezzo DATE NOT NULL,

  -- Tipo variazione
  tipo VARCHAR(20) DEFAULT 'acquisto',  -- 'acquisto', 'listino', 'promozione'

  -- Quantità di riferimento (opzionale)
  quantita_minima INT,  -- Prezzo valido da questa quantità

  -- Origine del prezzo
  origine VARCHAR(50),  -- 'ordine', 'listino_fornitore', 'manuale', 'importazione'
  documento_riferimento VARCHAR(100),  -- Es: numero ordine/fattura

  -- Note
  note TEXT,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- COMMENTI
-- =====================================================

COMMENT ON TABLE storico_prezzi_prodotto IS
'Storico variazioni prezzi di acquisto per calcolo costo medio ponderato.
Ogni variazione di prezzo viene registrata per tracciabilità.';

COMMENT ON COLUMN storico_prezzi_prodotto.prezzo IS
'Prezzo unitario con 4 decimali per precisione nei calcoli.';

COMMENT ON COLUMN storico_prezzi_prodotto.tipo IS
'acquisto = prezzo reale di acquisto, listino = prezzo da listino fornitore, promozione = prezzo promozionale';

COMMENT ON COLUMN storico_prezzi_prodotto.quantita_minima IS
'Se il prezzo è valido solo sopra una certa quantità (scaglioni).';

COMMENT ON COLUMN storico_prezzi_prodotto.origine IS
'Come è stato registrato: ordine (automatico), listino_fornitore, manuale, importazione';

-- =====================================================
-- INDICI
-- =====================================================

-- Ricerca per prodotto (più frequente)
CREATE INDEX idx_storico_prezzi_prodotto_id ON storico_prezzi_prodotto(prodotto_id);

-- Ricerca per prodotto e data (per range temporali)
CREATE INDEX idx_storico_prezzi_prodotto_data ON storico_prezzi_prodotto(prodotto_id, data_prezzo DESC);

-- Ricerca per fornitore
CREATE INDEX idx_storico_prezzi_fornitore_id ON storico_prezzi_prodotto(fornitore_id)
  WHERE fornitore_id IS NOT NULL;

-- Ricerca per tipo
CREATE INDEX idx_storico_prezzi_tipo ON storico_prezzi_prodotto(tipo);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE storico_prezzi_prodotto ENABLE ROW LEVEL SECURITY;

-- Policy: accesso basato sul prodotto
CREATE POLICY storico_prezzi_select_policy ON storico_prezzi_prodotto
  FOR SELECT
  USING (
    prodotto_id IN (
      SELECT id FROM prodotto WHERE azienda_id = public.get_user_azienda_id()
    )
  );

CREATE POLICY storico_prezzi_insert_policy ON storico_prezzi_prodotto
  FOR INSERT
  WITH CHECK (
    prodotto_id IN (
      SELECT id FROM prodotto
      WHERE azienda_id = public.get_user_azienda_id()
    )
  );

CREATE POLICY storico_prezzi_update_policy ON storico_prezzi_prodotto
  FOR UPDATE
  USING (
    prodotto_id IN (
      SELECT id FROM prodotto
      WHERE azienda_id = public.get_user_azienda_id()
    )
  );

CREATE POLICY storico_prezzi_delete_policy ON storico_prezzi_prodotto
  FOR DELETE
  USING (
    prodotto_id IN (
      SELECT id FROM prodotto
      WHERE azienda_id = public.get_user_azienda_id()
    )
  );

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON storico_prezzi_prodotto TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE storico_prezzi_prodotto_id_seq TO authenticated;

-- =====================================================
-- FUNZIONE: Calcola costo medio su range temporale
-- =====================================================

CREATE OR REPLACE FUNCTION calcola_costo_medio_periodo(
  p_prodotto_id INT,
  p_data_inizio DATE DEFAULT NULL,
  p_data_fine DATE DEFAULT CURRENT_DATE,
  p_fornitore_id INT DEFAULT NULL
)
RETURNS TABLE (
  costo_medio DECIMAL(12,4),
  costo_minimo DECIMAL(12,4),
  costo_massimo DECIMAL(12,4),
  ultimo_costo DECIMAL(12,4),
  numero_variazioni INT,
  data_primo_prezzo DATE,
  data_ultimo_prezzo DATE
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Se data_inizio non specificata, ultimi 12 mesi
  IF p_data_inizio IS NULL THEN
    p_data_inizio := p_data_fine - INTERVAL '12 months';
  END IF;

  RETURN QUERY
  SELECT
    AVG(sp.prezzo)::DECIMAL(12,4) AS costo_medio,
    MIN(sp.prezzo)::DECIMAL(12,4) AS costo_minimo,
    MAX(sp.prezzo)::DECIMAL(12,4) AS costo_massimo,
    (
      SELECT sp2.prezzo
      FROM storico_prezzi_prodotto sp2
      WHERE sp2.prodotto_id = p_prodotto_id
        AND sp2.tipo = 'acquisto'
        AND (p_fornitore_id IS NULL OR sp2.fornitore_id = p_fornitore_id)
      ORDER BY sp2.data_prezzo DESC
      LIMIT 1
    )::DECIMAL(12,4) AS ultimo_costo,
    COUNT(*)::INT AS numero_variazioni,
    MIN(sp.data_prezzo) AS data_primo_prezzo,
    MAX(sp.data_prezzo) AS data_ultimo_prezzo
  FROM storico_prezzi_prodotto sp
  WHERE sp.prodotto_id = p_prodotto_id
    AND sp.tipo = 'acquisto'
    AND sp.data_prezzo BETWEEN p_data_inizio AND p_data_fine
    AND (p_fornitore_id IS NULL OR sp.fornitore_id = p_fornitore_id);
END;
$$;

COMMENT ON FUNCTION calcola_costo_medio_periodo(INT, DATE, DATE, INT) IS
'Calcola costo medio, min, max e ultimo per un prodotto in un periodo.
Default: ultimi 12 mesi. Può filtrare per fornitore.';

-- =====================================================
-- FUNZIONE: Registra variazione prezzo (da usare negli ordini)
-- =====================================================

CREATE OR REPLACE FUNCTION registra_prezzo_acquisto(
  p_prodotto_id INT,
  p_prezzo DECIMAL(12,4),
  p_fornitore_id INT DEFAULT NULL,
  p_data_prezzo DATE DEFAULT CURRENT_DATE,
  p_origine VARCHAR DEFAULT 'manuale',
  p_documento_rif VARCHAR DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
AS $$
DECLARE
  v_ultimo_prezzo DECIMAL(12,4);
  v_new_id INT;
BEGIN
  -- Recupera ultimo prezzo per questo prodotto/fornitore
  SELECT prezzo INTO v_ultimo_prezzo
  FROM storico_prezzi_prodotto
  WHERE prodotto_id = p_prodotto_id
    AND (p_fornitore_id IS NULL OR fornitore_id = p_fornitore_id)
    AND tipo = 'acquisto'
  ORDER BY data_prezzo DESC
  LIMIT 1;

  -- Registra solo se prezzo diverso dall'ultimo (evita duplicati)
  IF v_ultimo_prezzo IS NULL OR v_ultimo_prezzo != p_prezzo THEN
    INSERT INTO storico_prezzi_prodotto (
      prodotto_id,
      fornitore_id,
      prezzo,
      data_prezzo,
      tipo,
      origine,
      documento_riferimento
    ) VALUES (
      p_prodotto_id,
      p_fornitore_id,
      p_prezzo,
      p_data_prezzo,
      'acquisto',
      p_origine,
      p_documento_rif
    )
    RETURNING id INTO v_new_id;

    -- Aggiorna anche costo_ultimo nella tabella prodotto
    UPDATE prodotto
    SET costo_ultimo = p_prezzo
    WHERE id = p_prodotto_id;

    RETURN v_new_id;
  END IF;

  RETURN NULL;  -- Nessuna variazione registrata
END;
$$;

COMMENT ON FUNCTION registra_prezzo_acquisto(INT, DECIMAL, INT, DATE, VARCHAR, VARCHAR) IS
'Registra una variazione di prezzo acquisto.
Evita duplicati: registra solo se il prezzo è diverso dall''ultimo.
Aggiorna automaticamente costo_ultimo nel prodotto.';

-- =====================================================
-- VISTA: ultimo_prezzo_per_prodotto
-- =====================================================

CREATE OR REPLACE VIEW ultimo_prezzo_prodotto AS
SELECT DISTINCT ON (prodotto_id)
  prodotto_id,
  fornitore_id,
  prezzo AS ultimo_prezzo,
  data_prezzo AS data_ultimo_prezzo,
  origine
FROM storico_prezzi_prodotto
WHERE tipo = 'acquisto'
ORDER BY prodotto_id, data_prezzo DESC;

COMMENT ON VIEW ultimo_prezzo_prodotto IS
'Ultimo prezzo di acquisto per ogni prodotto.';

-- =====================================================
-- VISTA: confronto_prezzi (ultimo vs precedente)
-- =====================================================

CREATE OR REPLACE VIEW confronto_prezzi_prodotto AS
WITH prezzi_ranked AS (
  SELECT
    prodotto_id,
    fornitore_id,
    prezzo,
    data_prezzo,
    ROW_NUMBER() OVER (PARTITION BY prodotto_id ORDER BY data_prezzo DESC) AS rn
  FROM storico_prezzi_prodotto
  WHERE tipo = 'acquisto'
)
SELECT
  p.id AS prodotto_id,
  p.codice,
  p.nome,
  curr.prezzo AS prezzo_corrente,
  curr.data_prezzo AS data_prezzo_corrente,
  prev.prezzo AS prezzo_precedente,
  prev.data_prezzo AS data_prezzo_precedente,
  CASE
    WHEN prev.prezzo IS NOT NULL AND prev.prezzo > 0
    THEN ROUND(((curr.prezzo - prev.prezzo) / prev.prezzo * 100)::numeric, 2)
    ELSE NULL
  END AS variazione_percentuale
FROM prodotto p
LEFT JOIN prezzi_ranked curr ON p.id = curr.prodotto_id AND curr.rn = 1
LEFT JOIN prezzi_ranked prev ON p.id = prev.prodotto_id AND prev.rn = 2;

COMMENT ON VIEW confronto_prezzi_prodotto IS
'Confronto tra ultimo prezzo e prezzo precedente con % variazione.
Utile per dashboard e alert variazioni prezzi.';

-- =====================================================
-- FINE MIGRATION
-- =====================================================
