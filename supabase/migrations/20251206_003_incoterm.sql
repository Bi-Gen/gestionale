-- =====================================================
-- MIGRATION: Incoterm
-- Data: 2025-12-06
-- Descrizione: Aggiunge gestione Incoterm per commercio internazionale
--              - Tabella lookup incoterm
--              - Default su soggetto (fornitore)
--              - Override su movimento (ordine)
-- =====================================================

-- =====================================================
-- TABELLA: incoterm (lookup)
-- =====================================================

CREATE TABLE IF NOT EXISTS incoterm (
  id SERIAL PRIMARY KEY,
  codice VARCHAR(3) NOT NULL UNIQUE,
  nome VARCHAR(100) NOT NULL,
  descrizione TEXT,

  -- Chi paga cosa
  trasporto_a_carico VARCHAR(20) NOT NULL,  -- 'venditore', 'compratore', 'condiviso'
  assicurazione_a_carico VARCHAR(20) NOT NULL,
  dogana_export_a_carico VARCHAR(20) NOT NULL,
  dogana_import_a_carico VARCHAR(20) NOT NULL,

  -- Per ordinamento logico
  ordine INT DEFAULT 0,

  -- Attivo
  attivo BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE incoterm IS
'Incoterms 2020 - Termini commerciali internazionali per import/export.
Definiscono chi paga trasporto, assicurazione e dogana.';

-- =====================================================
-- SEED: Incoterms 2020
-- =====================================================

INSERT INTO incoterm (codice, nome, descrizione, trasporto_a_carico, assicurazione_a_carico, dogana_export_a_carico, dogana_import_a_carico, ordine) VALUES
  -- Gruppo E: Partenza
  ('EXW', 'Ex Works',
   'Franco fabbrica. Il venditore mette la merce a disposizione presso i propri locali. Il compratore si assume tutti i costi e rischi.',
   'compratore', 'compratore', 'compratore', 'compratore', 10),

  -- Gruppo F: Trasporto principale non pagato
  ('FCA', 'Free Carrier',
   'Franco vettore. Il venditore consegna la merce al vettore nominato dal compratore.',
   'compratore', 'compratore', 'venditore', 'compratore', 20),

  ('FAS', 'Free Alongside Ship',
   'Franco sottobordo. Il venditore consegna la merce sottobordo della nave nel porto di imbarco.',
   'compratore', 'compratore', 'venditore', 'compratore', 21),

  ('FOB', 'Free On Board',
   'Franco a bordo. Il venditore consegna la merce a bordo della nave. Rischio passa quando merce supera murata nave.',
   'compratore', 'compratore', 'venditore', 'compratore', 22),

  -- Gruppo C: Trasporto principale pagato
  ('CFR', 'Cost and Freight',
   'Costo e nolo. Il venditore paga il trasporto fino al porto di destinazione, ma il rischio passa all''imbarco.',
   'venditore', 'compratore', 'venditore', 'compratore', 30),

  ('CIF', 'Cost, Insurance and Freight',
   'Costo, assicurazione e nolo. Come CFR ma il venditore paga anche l''assicurazione marittima.',
   'venditore', 'venditore', 'venditore', 'compratore', 31),

  ('CPT', 'Carriage Paid To',
   'Trasporto pagato fino a. Il venditore paga il trasporto fino a destinazione (qualsiasi modo di trasporto).',
   'venditore', 'compratore', 'venditore', 'compratore', 32),

  ('CIP', 'Carriage and Insurance Paid To',
   'Trasporto e assicurazione pagati fino a. Come CPT ma con assicurazione inclusa.',
   'venditore', 'venditore', 'venditore', 'compratore', 33),

  -- Gruppo D: Arrivo
  ('DAP', 'Delivered at Place',
   'Reso al luogo di destinazione. Il venditore consegna la merce pronta per lo scarico nel luogo convenuto.',
   'venditore', 'venditore', 'venditore', 'compratore', 40),

  ('DPU', 'Delivered at Place Unloaded',
   'Reso al luogo di destinazione scaricato. Il venditore scarica la merce nel luogo convenuto.',
   'venditore', 'venditore', 'venditore', 'compratore', 41),

  ('DDP', 'Delivered Duty Paid',
   'Reso sdoganato. Il venditore consegna la merce sdoganata. Massima obbligazione per il venditore.',
   'venditore', 'venditore', 'venditore', 'venditore', 50)

ON CONFLICT (codice) DO NOTHING;

-- =====================================================
-- AGGIUNTA CAMPO: soggetto.incoterm_default_id
-- =====================================================

ALTER TABLE soggetto
ADD COLUMN IF NOT EXISTS incoterm_default_id INT REFERENCES incoterm(id);

COMMENT ON COLUMN soggetto.incoterm_default_id IS
'Incoterm di default per questo fornitore. Può essere sovrascritto sul singolo ordine.';

-- =====================================================
-- AGGIUNTA CAMPI: movimento (per ordini/fatture)
-- =====================================================

ALTER TABLE movimento
ADD COLUMN IF NOT EXISTS incoterm_id INT REFERENCES incoterm(id);

ALTER TABLE movimento
ADD COLUMN IF NOT EXISTS porto_partenza VARCHAR(100);

ALTER TABLE movimento
ADD COLUMN IF NOT EXISTS porto_arrivo VARCHAR(100);

ALTER TABLE movimento
ADD COLUMN IF NOT EXISTS costo_trasporto DECIMAL(12,2) DEFAULT 0;

ALTER TABLE movimento
ADD COLUMN IF NOT EXISTS costo_assicurazione DECIMAL(12,2) DEFAULT 0;

ALTER TABLE movimento
ADD COLUMN IF NOT EXISTS costo_dogana DECIMAL(12,2) DEFAULT 0;

COMMENT ON COLUMN movimento.incoterm_id IS
'Incoterm applicato a questo documento. Se NULL, usa default del fornitore.';

COMMENT ON COLUMN movimento.porto_partenza IS
'Porto/luogo di partenza merce (es: Qingdao, Shanghai)';

COMMENT ON COLUMN movimento.porto_arrivo IS
'Porto/luogo di arrivo merce (es: Genova, Trieste)';

COMMENT ON COLUMN movimento.costo_trasporto IS
'Costo trasporto se a carico nostro (dipende da incoterm)';

COMMENT ON COLUMN movimento.costo_assicurazione IS
'Costo assicurazione se a carico nostro';

COMMENT ON COLUMN movimento.costo_dogana IS
'Costi doganali (dazi, sdoganamento)';

-- =====================================================
-- INDICI
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_soggetto_incoterm ON soggetto(incoterm_default_id)
  WHERE incoterm_default_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_movimento_incoterm ON movimento(incoterm_id)
  WHERE incoterm_id IS NOT NULL;

-- =====================================================
-- RLS per incoterm (lookup pubblico, solo lettura)
-- =====================================================

ALTER TABLE incoterm ENABLE ROW LEVEL SECURITY;

CREATE POLICY incoterm_select_policy ON incoterm
  FOR SELECT
  USING (true);  -- Tutti possono leggere

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT ON incoterm TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE incoterm_id_seq TO authenticated;

-- =====================================================
-- VISTA: movimento con incoterm completo
-- =====================================================

-- Aggiorno la vista movimento_completo per includere incoterm
DROP VIEW IF EXISTS movimento_completo;

CREATE OR REPLACE VIEW movimento_completo AS
SELECT
  m.*,
  c.codice AS causale_codice,
  c.descrizione AS causale_descrizione,
  c.tipo_documento,
  c.tipo_operazione,
  s.ragione_sociale AS soggetto_nome,
  s.codice_fiscale AS soggetto_cf,
  s.partita_iva AS soggetto_piva,
  mag.nome AS magazzino_nome,
  mp.nome AS metodo_pagamento_nome,
  -- Incoterm (usa quello del movimento, altrimenti default fornitore)
  COALESCE(inc.codice, inc_default.codice) AS incoterm_codice,
  COALESCE(inc.nome, inc_default.nome) AS incoterm_nome,
  COALESCE(inc.trasporto_a_carico, inc_default.trasporto_a_carico) AS trasporto_a_carico,
  -- Totale costi accessori
  COALESCE(m.costo_trasporto, 0) + COALESCE(m.costo_assicurazione, 0) + COALESCE(m.costo_dogana, 0) AS totale_costi_accessori
FROM movimento m
LEFT JOIN causale_documento c ON m.causale_id = c.id
LEFT JOIN soggetto s ON m.soggetto_id = s.id
LEFT JOIN magazzino mag ON m.magazzino_id = mag.id
LEFT JOIN metodo_pagamento mp ON m.metodo_pagamento_id = mp.id
LEFT JOIN incoterm inc ON m.incoterm_id = inc.id
LEFT JOIN incoterm inc_default ON s.incoterm_default_id = inc_default.id;

COMMENT ON VIEW movimento_completo IS
'Vista denormalizzata con tutti i dati del movimento, incluso incoterm.';

-- =====================================================
-- FUNZIONE: Calcola costi in base a incoterm
-- =====================================================

CREATE OR REPLACE FUNCTION get_costi_a_carico(
  p_incoterm_codice VARCHAR(3)
)
RETURNS TABLE (
  trasporto_nostro BOOLEAN,
  assicurazione_nostra BOOLEAN,
  dogana_export_nostra BOOLEAN,
  dogana_import_nostra BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    trasporto_a_carico = 'compratore' AS trasporto_nostro,
    assicurazione_a_carico = 'compratore' AS assicurazione_nostra,
    dogana_export_a_carico = 'compratore' AS dogana_export_nostra,
    dogana_import_a_carico = 'compratore' AS dogana_import_nostra
  FROM incoterm
  WHERE codice = p_incoterm_codice;
END;
$$;

COMMENT ON FUNCTION get_costi_a_carico(VARCHAR) IS
'Dato un incoterm, restituisce quali costi sono a nostro carico (come compratori).
Utile per calcolare il costo totale effettivo di un acquisto.';

-- =====================================================
-- FINE MIGRATION
-- =====================================================
