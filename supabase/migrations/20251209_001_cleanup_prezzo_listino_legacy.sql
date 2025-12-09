-- =====================================================
-- MIGRATION: Rimozione campi legacy prezzo_listino1-5
-- Data: 2025-12-09
-- Descrizione: Rimuove campi ridondanti dalla tabella prodotto.
--              I prezzi per listino sono ora gestiti in listino_prodotto.
-- =====================================================

-- STEP 1: Droppa vista dipendente
DROP VIEW IF EXISTS prodotto_con_packaging;

-- STEP 2: Rimuovi campi legacy (sostituiti da tabella listino_prodotto)
ALTER TABLE prodotto DROP COLUMN IF EXISTS prezzo_listino1;
ALTER TABLE prodotto DROP COLUMN IF EXISTS prezzo_listino2;
ALTER TABLE prodotto DROP COLUMN IF EXISTS prezzo_listino3;
ALTER TABLE prodotto DROP COLUMN IF EXISTS prezzo_listino4;
ALTER TABLE prodotto DROP COLUMN IF EXISTS prezzo_listino5;

-- STEP 3: Ricrea vista prodotto_con_packaging
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
  -- Volume calcolato
  pkg.volume_cartone_m3 AS pkg_volume_cartone_m3
FROM prodotto p
LEFT JOIN packaging_prodotto pkg ON p.id = pkg.prodotto_id;

COMMENT ON VIEW prodotto_con_packaging IS
'Vista prodotto con dati packaging e calcoli automatici.';

-- =====================================================
-- FINE MIGRATION
-- =====================================================
