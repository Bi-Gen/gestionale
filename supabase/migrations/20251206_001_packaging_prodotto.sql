-- =====================================================
-- MIGRATION: Packaging Prodotto
-- Data: 2025-12-06
-- Descrizione: Struttura flessibile per packaging multi-livello
--              PEZZO → CONFEZIONE → CARTONE → PALLET → CONTAINER
-- =====================================================

-- =====================================================
-- TABELLA: packaging_prodotto
-- =====================================================

CREATE TABLE IF NOT EXISTS packaging_prodotto (
  id SERIAL PRIMARY KEY,
  prodotto_id INT NOT NULL REFERENCES prodotto(id) ON DELETE CASCADE,

  -- === LIVELLO 1: CONFEZIONE (busta/scatola/blister) ===
  -- Nome personalizzabile per settore (default "Confezione")
  nome_confezione VARCHAR(50) DEFAULT 'Confezione',
  pezzi_per_confezione INT DEFAULT 1,

  -- Dimensioni confezione (opzionali)
  confezione_lunghezza_cm DECIMAL(10,2),
  confezione_larghezza_cm DECIMAL(10,2),
  confezione_altezza_cm DECIMAL(10,2),
  confezione_peso_kg DECIMAL(10,3),

  -- === LIVELLO 2: CARTONE (collo/imballo) ===
  confezioni_per_cartone INT DEFAULT 1,

  -- Dimensioni cartone
  cartone_lunghezza_cm DECIMAL(10,2),
  cartone_larghezza_cm DECIMAL(10,2),
  cartone_altezza_cm DECIMAL(10,2),
  cartone_peso_kg DECIMAL(10,3),  -- Peso lordo cartone completo

  -- === LIVELLO 3: PALLET ===
  cartoni_per_pallet INT,
  cartoni_per_strato INT,  -- Per calcolo altezza pallet
  strati_per_pallet INT,

  -- Dimensioni pallet (standard EUR 80x120 o altro)
  pallet_lunghezza_cm DECIMAL(10,2) DEFAULT 120,
  pallet_larghezza_cm DECIMAL(10,2) DEFAULT 80,
  pallet_altezza_cm DECIMAL(10,2),  -- Altezza totale con merce
  pallet_peso_kg DECIMAL(10,3),     -- Peso lordo pallet completo

  -- === LIVELLO 4: CONTAINER ===
  pallet_per_container_20ft INT,
  pallet_per_container_40ft INT,

  -- === CAMPI CALCOLATI (per comodità) ===
  pezzi_per_cartone INT GENERATED ALWAYS AS (pezzi_per_confezione * confezioni_per_cartone) STORED,
  pezzi_per_pallet INT GENERATED ALWAYS AS (
    CASE
      WHEN cartoni_per_pallet IS NOT NULL
      THEN pezzi_per_confezione * confezioni_per_cartone * cartoni_per_pallet
      ELSE NULL
    END
  ) STORED,

  -- Volume cartone in m³ (per calcolo container)
  volume_cartone_m3 DECIMAL(10,6) GENERATED ALWAYS AS (
    CASE
      WHEN cartone_lunghezza_cm IS NOT NULL
           AND cartone_larghezza_cm IS NOT NULL
           AND cartone_altezza_cm IS NOT NULL
      THEN (cartone_lunghezza_cm * cartone_larghezza_cm * cartone_altezza_cm) / 1000000
      ELSE NULL
    END
  ) STORED,

  -- === NOTE ===
  note TEXT,

  -- === METADATA ===
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Un solo record packaging per prodotto
  UNIQUE(prodotto_id)
);

-- =====================================================
-- COMMENTI
-- =====================================================

COMMENT ON TABLE packaging_prodotto IS
'Struttura packaging multi-livello per calcolo logistica e trasporti.
Ogni livello è opzionale: compilare solo quelli rilevanti per il prodotto.';

COMMENT ON COLUMN packaging_prodotto.nome_confezione IS
'Nome personalizzabile: Busta, Scatola, Blister, Sacchetto, etc.';

COMMENT ON COLUMN packaging_prodotto.pezzi_per_confezione IS
'Quanti pezzi singoli in una confezione. Default 1 se venduto sfuso.';

COMMENT ON COLUMN packaging_prodotto.pezzi_per_cartone IS
'Campo calcolato: pezzi_per_confezione × confezioni_per_cartone';

COMMENT ON COLUMN packaging_prodotto.pezzi_per_pallet IS
'Campo calcolato: pezzi_per_cartone × cartoni_per_pallet';

COMMENT ON COLUMN packaging_prodotto.volume_cartone_m3 IS
'Volume cartone in metri cubi, calcolato automaticamente per stima container.';

-- =====================================================
-- INDICI
-- =====================================================

CREATE INDEX idx_packaging_prodotto_prodotto_id ON packaging_prodotto(prodotto_id);

-- =====================================================
-- TRIGGER per updated_at
-- =====================================================

CREATE TRIGGER trg_packaging_prodotto_updated_at
  BEFORE UPDATE ON packaging_prodotto
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE packaging_prodotto ENABLE ROW LEVEL SECURITY;

-- Policy: accesso basato sul prodotto (che ha già RLS per azienda)
CREATE POLICY packaging_prodotto_select_policy ON packaging_prodotto
  FOR SELECT
  USING (
    prodotto_id IN (
      SELECT id FROM prodotto WHERE azienda_id = public.get_user_azienda_id()
    )
  );

CREATE POLICY packaging_prodotto_insert_policy ON packaging_prodotto
  FOR INSERT
  WITH CHECK (
    prodotto_id IN (
      SELECT id FROM prodotto
      WHERE azienda_id = public.get_user_azienda_id()
    )
    AND public.user_has_permission('prodotti', 'write')
  );

CREATE POLICY packaging_prodotto_update_policy ON packaging_prodotto
  FOR UPDATE
  USING (
    prodotto_id IN (
      SELECT id FROM prodotto
      WHERE azienda_id = public.get_user_azienda_id()
    )
    AND public.user_has_permission('prodotti', 'write')
  );

CREATE POLICY packaging_prodotto_delete_policy ON packaging_prodotto
  FOR DELETE
  USING (
    prodotto_id IN (
      SELECT id FROM prodotto
      WHERE azienda_id = public.get_user_azienda_id()
    )
    AND public.user_has_permission('prodotti', 'delete')
  );

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON packaging_prodotto TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE packaging_prodotto_id_seq TO authenticated;

-- =====================================================
-- VISTA: prodotto_con_packaging
-- =====================================================

CREATE OR REPLACE VIEW prodotto_con_packaging AS
SELECT
  p.id,
  p.azienda_id,
  p.codice,
  p.nome,
  p.descrizione,
  p.codice_ean,
  p.codice_fornitore,
  p.sku,
  p.categoria,
  p.sottocategoria,
  p.famiglia,
  p.unita_misura,
  p.peso_kg,
  p.prezzo_acquisto,
  p.prezzo_vendita,
  p.costo_ultimo,
  p.costo_medio,
  p.aliquota_iva,
  p.fornitore_principale_id,
  p.quantita_magazzino,
  p.giacenza_minima,
  p.attivo,
  -- Campi packaging
  pk.nome_confezione AS pkg_nome_confezione,
  pk.pezzi_per_confezione AS pkg_pezzi_per_confezione,
  pk.confezioni_per_cartone AS pkg_confezioni_per_cartone,
  pk.cartoni_per_pallet AS pkg_cartoni_per_pallet,
  pk.pezzi_per_cartone AS pkg_pezzi_per_cartone,
  pk.pezzi_per_pallet AS pkg_pezzi_per_pallet,
  pk.cartone_lunghezza_cm AS pkg_cartone_lunghezza_cm,
  pk.cartone_larghezza_cm AS pkg_cartone_larghezza_cm,
  pk.cartone_altezza_cm AS pkg_cartone_altezza_cm,
  pk.cartone_peso_kg AS pkg_cartone_peso_kg,
  pk.volume_cartone_m3 AS pkg_volume_cartone_m3,
  pk.pallet_per_container_20ft AS pkg_pallet_per_container_20ft,
  pk.pallet_per_container_40ft AS pkg_pallet_per_container_40ft
FROM prodotto p
LEFT JOIN packaging_prodotto pk ON p.id = pk.prodotto_id;

COMMENT ON VIEW prodotto_con_packaging IS
'Vista prodotto con dati packaging per facilitare query e calcoli logistica.
I campi packaging hanno prefisso pkg_ per evitare conflitti.';

-- =====================================================
-- FUNZIONE: Calcola quantità per livello packaging
-- =====================================================

CREATE OR REPLACE FUNCTION calcola_packaging(
  p_prodotto_id INT,
  p_quantita_pezzi INT
)
RETURNS TABLE (
  pezzi INT,
  confezioni INT,
  cartoni INT,
  pallet INT,
  resto_pezzi INT,
  resto_confezioni INT,
  resto_cartoni INT,
  peso_totale_kg DECIMAL,
  volume_totale_m3 DECIMAL
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_pezzi_conf INT;
  v_conf_cart INT;
  v_cart_pallet INT;
  v_peso_cartone DECIMAL;
  v_volume_cartone DECIMAL;
BEGIN
  -- Recupera dati packaging
  SELECT
    COALESCE(pezzi_per_confezione, 1),
    COALESCE(confezioni_per_cartone, 1),
    cartoni_per_pallet,
    cartone_peso_kg,
    volume_cartone_m3
  INTO v_pezzi_conf, v_conf_cart, v_cart_pallet, v_peso_cartone, v_volume_cartone
  FROM packaging_prodotto
  WHERE prodotto_id = p_prodotto_id;

  -- Se non esiste packaging, valori default
  IF NOT FOUND THEN
    v_pezzi_conf := 1;
    v_conf_cart := 1;
    v_cart_pallet := NULL;
    v_peso_cartone := NULL;
    v_volume_cartone := NULL;
  END IF;

  -- Calcola
  pezzi := p_quantita_pezzi;
  confezioni := p_quantita_pezzi / v_pezzi_conf;
  resto_pezzi := p_quantita_pezzi % v_pezzi_conf;

  cartoni := confezioni / v_conf_cart;
  resto_confezioni := confezioni % v_conf_cart;

  IF v_cart_pallet IS NOT NULL AND v_cart_pallet > 0 THEN
    pallet := cartoni / v_cart_pallet;
    resto_cartoni := cartoni % v_cart_pallet;
  ELSE
    pallet := NULL;
    resto_cartoni := NULL;
  END IF;

  -- Peso e volume totale (basato su cartoni)
  IF v_peso_cartone IS NOT NULL THEN
    peso_totale_kg := cartoni * v_peso_cartone;
  ELSE
    peso_totale_kg := NULL;
  END IF;

  IF v_volume_cartone IS NOT NULL THEN
    volume_totale_m3 := cartoni * v_volume_cartone;
  ELSE
    volume_totale_m3 := NULL;
  END IF;

  RETURN NEXT;
END;
$$;

COMMENT ON FUNCTION calcola_packaging(INT, INT) IS
'Dato un prodotto e una quantità in pezzi, calcola quante confezioni, cartoni e pallet servono.
Utile per preventivi e ordini.';

-- =====================================================
-- FINE MIGRATION
-- =====================================================
