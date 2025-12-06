-- =====================================================
-- MIGRATION: Pulizia campi ridondanti classificazioni prodotto
-- Data: 2025-12-06
-- Descrizione: Rimuove campi stringa ridondanti, mantiene solo FK
--              categoria/sottocategoria -> macrofamiglia_id/famiglia_id
-- =====================================================

-- =====================================================
-- STEP 1: Aggiorna vista prima di rimuovere colonne
-- =====================================================

DROP VIEW IF EXISTS prodotto_classificato;
DROP VIEW IF EXISTS prodotto_con_packaging;

-- =====================================================
-- STEP 2: Rimuovi campi stringa ridondanti
-- =====================================================

-- Campi stringa classificazioni (ora usiamo solo FK)
ALTER TABLE prodotto DROP COLUMN IF EXISTS macrofamiglia;
ALTER TABLE prodotto DROP COLUMN IF EXISTS famiglia;
ALTER TABLE prodotto DROP COLUMN IF EXISTS linea;

-- Campi categoria/sottocategoria (ridondanti con macrofamiglia/famiglia)
ALTER TABLE prodotto DROP COLUMN IF EXISTS categoria;
ALTER TABLE prodotto DROP COLUMN IF EXISTS sottocategoria;

-- =====================================================
-- STEP 3: Ricrea vista prodotto_classificato
-- =====================================================

CREATE OR REPLACE VIEW prodotto_classificato AS
SELECT
  p.id,
  p.azienda_id,
  p.codice,
  p.nome,
  p.descrizione,
  p.riferimento,
  -- Classificazioni (da FK)
  p.macrofamiglia_id,
  mf.codice AS macrofamiglia_codice,
  mf.nome AS macrofamiglia,
  p.famiglia_id,
  f.codice AS famiglia_codice,
  f.nome AS famiglia,
  p.linea_id,
  lp.codice AS linea_codice,
  lp.nome AS linea,
  -- Brand
  p.brand_id,
  b.nome AS brand,
  -- Codici
  p.codice_ean,
  p.ean_proprietario,
  p.codice_fornitore,
  p.codice_doganale,
  p.sku,
  p.misura,
  -- Prezzi
  p.prezzo_acquisto,
  p.prezzo_vendita,
  p.costo_ultimo,
  p.costo_medio,
  p.aliquota_iva,
  -- Tempi
  p.tempo_riordino_giorni AS lead_time,
  p.transit_time_giorni AS transit_time,
  COALESCE(p.tempo_riordino_giorni, 0) + COALESCE(p.transit_time_giorni, 0) AS tempo_totale,
  -- Magazzino
  p.quantita_magazzino,
  p.giacenza_minima,
  p.punto_riordino,
  -- Stato
  p.attivo,
  p.vendibile,
  p.acquistabile,
  -- Timestamps
  p.created_at,
  p.updated_at
FROM prodotto p
LEFT JOIN macrofamiglie mf ON p.macrofamiglia_id = mf.id
LEFT JOIN famiglie f ON p.famiglia_id = f.id
LEFT JOIN linee_prodotto lp ON p.linea_id = lp.id
LEFT JOIN brand b ON p.brand_id = b.id;

COMMENT ON VIEW prodotto_classificato IS
'Vista prodotto con nomi classificazioni risolti da FK.';

-- =====================================================
-- STEP 4: Ricrea vista prodotto_con_packaging
-- =====================================================

CREATE OR REPLACE VIEW prodotto_con_packaging AS
SELECT
  p.*,
  -- Packaging
  pkg.pezzi_per_confezione AS pkg_pezzi_per_confezione,
  pkg.confezioni_per_cartone AS pkg_confezioni_per_cartone,
  pkg.cartoni_per_pallet AS pkg_cartoni_per_pallet,
  pkg.pallet_per_container_20ft AS pkg_pallet_per_container_20ft,
  pkg.pallet_per_container_40ft AS pkg_pallet_per_container_40ft,
  -- Calcolati
  COALESCE(pkg.pezzi_per_confezione, 1) * COALESCE(pkg.confezioni_per_cartone, 1) AS pkg_pezzi_per_cartone,
  COALESCE(pkg.pezzi_per_confezione, 1) * COALESCE(pkg.confezioni_per_cartone, 1) * COALESCE(pkg.cartoni_per_pallet, 1) AS pkg_pezzi_per_pallet,
  -- Dimensioni cartone
  pkg.cartone_lunghezza_cm AS pkg_cartone_lunghezza_cm,
  pkg.cartone_larghezza_cm AS pkg_cartone_larghezza_cm,
  pkg.cartone_altezza_cm AS pkg_cartone_altezza_cm,
  pkg.cartone_peso_kg AS pkg_cartone_peso_kg,
  -- Volume calcolato (usa la colonna generata dalla tabella)
  pkg.volume_cartone_m3 AS pkg_volume_cartone_m3
FROM prodotto p
LEFT JOIN packaging_prodotto pkg ON p.id = pkg.prodotto_id;

COMMENT ON VIEW prodotto_con_packaging IS
'Vista prodotto con dati packaging e calcoli automatici.';

-- =====================================================
-- FINE MIGRATION
-- =====================================================
