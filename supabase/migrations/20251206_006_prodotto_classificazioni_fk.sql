-- =====================================================
-- MIGRATION: FK Classificazioni Prodotto
-- Data: 2025-12-06
-- Descrizione: Aggiunge FK opzionali a macrofamiglie/famiglie
--              mantenendo anche i campi stringa per flessibilità
-- =====================================================

-- =====================================================
-- NUOVI CAMPI FK: Classificazioni normalizzate
-- =====================================================

-- FK a macrofamiglia (opzionale, alternativa al campo stringa)
ALTER TABLE prodotto
ADD COLUMN IF NOT EXISTS macrofamiglia_id INT REFERENCES macrofamiglie(id) ON DELETE SET NULL;

-- FK a famiglia (opzionale, alternativa al campo stringa)
ALTER TABLE prodotto
ADD COLUMN IF NOT EXISTS famiglia_id INT REFERENCES famiglie(id) ON DELETE SET NULL;

COMMENT ON COLUMN prodotto.macrofamiglia_id IS
'FK opzionale a tabella macrofamiglie. Alternativa al campo stringa macrofamiglia.';

COMMENT ON COLUMN prodotto.famiglia_id IS
'FK opzionale a tabella famiglie. Alternativa al campo stringa famiglia.';

-- =====================================================
-- INDICI
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_prodotto_macrofamiglia_id
ON prodotto(macrofamiglia_id) WHERE macrofamiglia_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_prodotto_famiglia_id
ON prodotto(famiglia_id) WHERE famiglia_id IS NOT NULL;

-- =====================================================
-- TABELLA: linee_prodotto (nuova)
-- =====================================================

CREATE TABLE IF NOT EXISTS linee_prodotto (
  id SERIAL PRIMARY KEY,
  azienda_id UUID NOT NULL REFERENCES azienda(id) ON DELETE CASCADE,

  codice VARCHAR(50) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descrizione TEXT,

  -- Ordinamento
  ordinamento INT DEFAULT 0,

  -- Flags
  attivo BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(azienda_id, codice)
);

CREATE INDEX idx_linee_prodotto_azienda ON linee_prodotto(azienda_id);
CREATE INDEX idx_linee_prodotto_attivo ON linee_prodotto(attivo) WHERE attivo = true;

COMMENT ON TABLE linee_prodotto IS
'Linee prodotto: Premium, Standard, Economy, Professional, etc.';

-- Trigger updated_at
CREATE TRIGGER trg_linee_prodotto_updated_at
  BEFORE UPDATE ON linee_prodotto FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE linee_prodotto ENABLE ROW LEVEL SECURITY;

CREATE POLICY linee_prodotto_select_policy ON linee_prodotto
  FOR SELECT USING (azienda_id = public.get_user_azienda_id());

CREATE POLICY linee_prodotto_insert_policy ON linee_prodotto
  FOR INSERT WITH CHECK (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('configurazione', 'write')
  );

CREATE POLICY linee_prodotto_update_policy ON linee_prodotto
  FOR UPDATE USING (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('configurazione', 'write')
  );

CREATE POLICY linee_prodotto_delete_policy ON linee_prodotto
  FOR DELETE USING (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('configurazione', 'delete')
  );

-- Grant
GRANT SELECT, INSERT, UPDATE, DELETE ON linee_prodotto TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE linee_prodotto_id_seq TO authenticated;

-- =====================================================
-- FK Linea su prodotto
-- =====================================================

ALTER TABLE prodotto
ADD COLUMN IF NOT EXISTS linea_id INT REFERENCES linee_prodotto(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_prodotto_linea_id
ON prodotto(linea_id) WHERE linea_id IS NOT NULL;

COMMENT ON COLUMN prodotto.linea_id IS
'FK opzionale a tabella linee_prodotto. Alternativa al campo stringa linea.';

-- =====================================================
-- VISTA: prodotto_classificato
-- Vista con nomi classificazioni (usa FK se presenti, altrimenti stringa)
-- =====================================================

CREATE OR REPLACE VIEW prodotto_classificato AS
SELECT
  p.id,
  p.azienda_id,
  p.codice,
  p.nome,
  p.descrizione,
  p.riferimento,
  -- Classificazioni (FK > stringa)
  COALESCE(mf.nome, p.macrofamiglia) AS macrofamiglia,
  COALESCE(f.nome, p.famiglia) AS famiglia,
  COALESCE(lp.nome, p.linea) AS linea,
  p.categoria,
  p.sottocategoria,
  -- Brand
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
  p.acquistabile
FROM prodotto p
LEFT JOIN macrofamiglie mf ON p.macrofamiglia_id = mf.id
LEFT JOIN famiglie f ON p.famiglia_id = f.id
LEFT JOIN linee_prodotto lp ON p.linea_id = lp.id
LEFT JOIN brand b ON p.brand_id = b.id
WHERE p.attivo = true;

COMMENT ON VIEW prodotto_classificato IS
'Vista prodotto con nomi classificazioni risolti.
Usa FK se presenti, altrimenti i campi stringa.';

-- =====================================================
-- FINE MIGRATION
-- =====================================================
