-- =====================================================
-- MIGRATION: Campi Aggiuntivi Prodotto
-- Data: 2025-12-06
-- Descrizione: Aggiunge campi trasversali mancanti
--              per completare anagrafica prodotto
-- =====================================================

-- =====================================================
-- NUOVI CAMPI: Classificazione estesa
-- =====================================================

-- Macrofamiglia (livello sopra famiglia)
ALTER TABLE prodotto
ADD COLUMN IF NOT EXISTS macrofamiglia VARCHAR(100);

COMMENT ON COLUMN prodotto.macrofamiglia IS
'Classificazione di primo livello. Es: Tovaglie, Accessori, Abbigliamento';

-- Linea prodotto (es: Premium, Basic, Economy)
ALTER TABLE prodotto
ADD COLUMN IF NOT EXISTS linea VARCHAR(100);

COMMENT ON COLUMN prodotto.linea IS
'Linea di prodotto. Es: Premium, Standard, Economy, Professional';

-- =====================================================
-- NUOVI CAMPI: Tempi logistica
-- =====================================================

-- Transit time (tempo trasporto, diverso da lead time produzione)
ALTER TABLE prodotto
ADD COLUMN IF NOT EXISTS transit_time_giorni INT;

COMMENT ON COLUMN prodotto.transit_time_giorni IS
'Tempo di transito/trasporto in giorni. Es: 60 giorni nave dalla Cina.
Diverso da tempo_riordino_giorni che è il lead time di produzione.';

-- Tempo totale approvvigionamento (calcolato: lead + transit)
-- Lo calcoliamo via vista, non serve campo

-- =====================================================
-- NUOVI CAMPI: Codici e riferimenti
-- =====================================================

-- Riferimento interno alternativo
ALTER TABLE prodotto
ADD COLUMN IF NOT EXISTS riferimento VARCHAR(50);

COMMENT ON COLUMN prodotto.riferimento IS
'Riferimento interno alternativo o codice legacy. Es: REF-001';

-- Proprietario codice EAN
ALTER TABLE prodotto
ADD COLUMN IF NOT EXISTS ean_proprietario VARCHAR(100);

COMMENT ON COLUMN prodotto.ean_proprietario IS
'Azienda proprietaria del codice EAN. Es: Qingdao Runjie';

-- =====================================================
-- NUOVI CAMPI: Misure prodotto (non packaging)
-- =====================================================

-- Misura prodotto come stringa descrittiva (es: "100x100", "XL", "500ml")
ALTER TABLE prodotto
ADD COLUMN IF NOT EXISTS misura VARCHAR(50);

COMMENT ON COLUMN prodotto.misura IS
'Misura/taglia del prodotto come stringa. Es: 100x100, XL, 500ml, 1kg';

-- =====================================================
-- INDICI per nuovi campi
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_prodotto_macrofamiglia
ON prodotto(macrofamiglia) WHERE macrofamiglia IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_prodotto_linea
ON prodotto(linea) WHERE linea IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_prodotto_riferimento
ON prodotto(riferimento) WHERE riferimento IS NOT NULL;

-- =====================================================
-- VISTA: tempo_totale_approvvigionamento
-- =====================================================

CREATE OR REPLACE VIEW prodotto_tempi_approvvigionamento AS
SELECT
  p.id,
  p.codice,
  p.nome,
  p.fornitore_principale_id,
  s.ragione_sociale AS fornitore_nome,
  p.tempo_riordino_giorni AS lead_time_giorni,
  p.transit_time_giorni,
  COALESCE(p.tempo_riordino_giorni, 0) + COALESCE(p.transit_time_giorni, 0) AS tempo_totale_giorni,
  p.giacenza_minima,
  p.punto_riordino,
  p.quantita_magazzino
FROM prodotto p
LEFT JOIN soggetto s ON p.fornitore_principale_id = s.id
WHERE p.attivo = true;

COMMENT ON VIEW prodotto_tempi_approvvigionamento IS
'Vista con tempi di approvvigionamento totali (lead time + transit time).
Utile per pianificazione acquisti e calcolo scorte di sicurezza.';

-- =====================================================
-- FINE MIGRATION
-- =====================================================
