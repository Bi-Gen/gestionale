-- =====================================================
-- MIGRATION: Tabelle Configurazione
-- Data: 2025-11-27
-- Descrizione: Tabelle di supporto e configurazione
-- =====================================================

-- =====================================================
-- TABELLA: listino (price lists)
-- =====================================================

CREATE TABLE IF NOT EXISTS listino (
  id SERIAL PRIMARY KEY,
  azienda_id UUID NOT NULL REFERENCES azienda(id) ON DELETE CASCADE,

  codice VARCHAR(20) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descrizione TEXT,

  -- Tipo listino
  tipo VARCHAR(20) DEFAULT 'vendita' CHECK (tipo IN ('vendita', 'acquisto')),

  -- Valuta
  valuta VARCHAR(3) DEFAULT 'EUR',

  -- Validità
  data_inizio DATE DEFAULT CURRENT_DATE,
  data_fine DATE,

  -- Flags
  predefinito BOOLEAN DEFAULT false,
  attivo BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(azienda_id, codice)
);

CREATE INDEX idx_listino_azienda ON listino(azienda_id);
CREATE INDEX idx_listino_attivo ON listino(attivo) WHERE attivo = true;

COMMENT ON TABLE listino IS 'Listini prezzi (vendita/acquisto)';

-- =====================================================
-- TABELLA: aliquota_iva (VAT rates)
-- =====================================================

CREATE TABLE IF NOT EXISTS aliquota_iva (
  id SERIAL PRIMARY KEY,
  azienda_id UUID NOT NULL REFERENCES azienda(id) ON DELETE CASCADE,

  codice VARCHAR(20) NOT NULL,
  descrizione VARCHAR(100) NOT NULL,
  percentuale DECIMAL(5,2) NOT NULL,

  -- Flags
  predefinita BOOLEAN DEFAULT false,
  attiva BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(azienda_id, codice)
);

CREATE INDEX idx_aliquota_iva_azienda ON aliquota_iva(azienda_id);

-- Seed aliquote IVA standard italiane
INSERT INTO aliquota_iva (azienda_id, codice, descrizione, percentuale, predefinita)
SELECT
  id,
  'IVA22',
  'IVA ordinaria 22%',
  22.00,
  true
FROM azienda
ON CONFLICT (azienda_id, codice) DO NOTHING;

INSERT INTO aliquota_iva (azienda_id, codice, descrizione, percentuale)
SELECT id, 'IVA10', 'IVA ridotta 10%', 10.00 FROM azienda
ON CONFLICT (azienda_id, codice) DO NOTHING;

INSERT INTO aliquota_iva (azienda_id, codice, descrizione, percentuale)
SELECT id, 'IVA4', 'IVA ridotta 4%', 4.00 FROM azienda
ON CONFLICT (azienda_id, codice) DO NOTHING;

INSERT INTO aliquota_iva (azienda_id, codice, descrizione, percentuale)
SELECT id, 'IVA0', 'Esente IVA', 0.00 FROM azienda
ON CONFLICT (azienda_id, codice) DO NOTHING;

COMMENT ON TABLE aliquota_iva IS 'Aliquote IVA configurabili per azienda';

-- =====================================================
-- TABELLA: brand (marche/produttori)
-- =====================================================

CREATE TABLE IF NOT EXISTS brand (
  id SERIAL PRIMARY KEY,
  azienda_id UUID NOT NULL REFERENCES azienda(id) ON DELETE CASCADE,

  codice VARCHAR(50) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descrizione TEXT,

  logo_url VARCHAR(500),
  sito_web VARCHAR(255),

  attivo BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(azienda_id, codice)
);

CREATE INDEX idx_brand_azienda ON brand(azienda_id);
CREATE INDEX idx_brand_nome ON brand(nome);

COMMENT ON TABLE brand IS 'Brand/Marche prodotti';

-- =====================================================
-- TABELLA: categoria (categorie prodotti)
-- =====================================================

CREATE TABLE IF NOT EXISTS categoria (
  id SERIAL PRIMARY KEY,
  azienda_id UUID NOT NULL REFERENCES azienda(id) ON DELETE CASCADE,

  codice VARCHAR(50) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descrizione TEXT,

  -- Gerarchia
  parent_id INT REFERENCES categoria(id),
  livello INT DEFAULT 0,
  percorso VARCHAR(255),  -- es: "Elettronica > Computer > Laptop"

  -- Ordinamento
  ordinamento INT DEFAULT 0,

  -- Immagine
  immagine_url VARCHAR(500),

  attivo BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(azienda_id, codice)
);

CREATE INDEX idx_categoria_azienda ON categoria(azienda_id);
CREATE INDEX idx_categoria_parent ON categoria(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_categoria_livello ON categoria(livello);

COMMENT ON TABLE categoria IS 'Categorie prodotti gerarchiche';

-- =====================================================
-- TABELLA: metodo_pagamento (payment methods)
-- =====================================================

CREATE TABLE IF NOT EXISTS metodo_pagamento (
  id SERIAL PRIMARY KEY,
  azienda_id UUID NOT NULL REFERENCES azienda(id) ON DELETE CASCADE,

  codice VARCHAR(20) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descrizione TEXT,

  -- Configurazione
  tipo VARCHAR(20) CHECK (tipo IN ('contanti', 'bonifico', 'assegno', 'carta', 'rid', 'paypal', 'altro')),
  giorni_scadenza INT DEFAULT 0,  -- Giorni dalla data fattura

  -- Flags
  richiede_iban BOOLEAN DEFAULT false,
  predefinito BOOLEAN DEFAULT false,
  attivo BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(azienda_id, codice)
);

CREATE INDEX idx_metodo_pagamento_azienda ON metodo_pagamento(azienda_id);

-- Seed metodi pagamento comuni
INSERT INTO metodo_pagamento (azienda_id, codice, nome, tipo, giorni_scadenza, predefinito)
SELECT id, 'CONT', 'Contanti', 'contanti', 0, true FROM azienda
ON CONFLICT (azienda_id, codice) DO NOTHING;

INSERT INTO metodo_pagamento (azienda_id, codice, nome, tipo, giorni_scadenza, richiede_iban)
SELECT id, 'BON30', 'Bonifico 30 giorni', 'bonifico', 30, true FROM azienda
ON CONFLICT (azienda_id, codice) DO NOTHING;

INSERT INTO metodo_pagamento (azienda_id, codice, nome, tipo, giorni_scadenza, richiede_iban)
SELECT id, 'BON60', 'Bonifico 60 giorni', 'bonifico', 60, true FROM azienda
ON CONFLICT (azienda_id, codice) DO NOTHING;

INSERT INTO metodo_pagamento (azienda_id, codice, nome, tipo, giorni_scadenza)
SELECT id, 'CARTA', 'Carta di credito', 'carta', 0 FROM azienda
ON CONFLICT (azienda_id, codice) DO NOTHING;

COMMENT ON TABLE metodo_pagamento IS 'Metodi e termini di pagamento';

-- =====================================================
-- TABELLA: unita_misura (units of measurement)
-- =====================================================

CREATE TABLE IF NOT EXISTS unita_misura (
  id SERIAL PRIMARY KEY,
  azienda_id UUID NOT NULL REFERENCES azienda(id) ON DELETE CASCADE,

  codice VARCHAR(10) NOT NULL,
  nome VARCHAR(50) NOT NULL,
  descrizione TEXT,

  -- Tipo
  tipo VARCHAR(20) CHECK (tipo IN ('quantita', 'peso', 'volume', 'lunghezza', 'superficie', 'tempo')),

  -- Conversione (per unità dello stesso tipo)
  fattore_conversione DECIMAL(15,6) DEFAULT 1.0,
  unita_base_id INT REFERENCES unita_misura(id),

  attivo BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(azienda_id, codice)
);

CREATE INDEX idx_unita_misura_azienda ON unita_misura(azienda_id);

-- Seed unità di misura comuni
INSERT INTO unita_misura (azienda_id, codice, nome, tipo)
SELECT id, 'PZ', 'Pezzi', 'quantita' FROM azienda
ON CONFLICT (azienda_id, codice) DO NOTHING;

INSERT INTO unita_misura (azienda_id, codice, nome, tipo)
SELECT id, 'KG', 'Chilogrammi', 'peso' FROM azienda
ON CONFLICT (azienda_id, codice) DO NOTHING;

INSERT INTO unita_misura (azienda_id, codice, nome, tipo)
SELECT id, 'LT', 'Litri', 'volume' FROM azienda
ON CONFLICT (azienda_id, codice) DO NOTHING;

INSERT INTO unita_misura (azienda_id, codice, nome, tipo)
SELECT id, 'MT', 'Metri', 'lunghezza' FROM azienda
ON CONFLICT (azienda_id, codice) DO NOTHING;

INSERT INTO unita_misura (azienda_id, codice, nome, tipo)
SELECT id, 'MQ', 'Metri quadrati', 'superficie' FROM azienda
ON CONFLICT (azienda_id, codice) DO NOTHING;

COMMENT ON TABLE unita_misura IS 'Unità di misura con conversioni';

-- =====================================================
-- TABELLA: valuta (currencies)
-- =====================================================

CREATE TABLE IF NOT EXISTS valuta (
  id SERIAL PRIMARY KEY,
  azienda_id UUID NOT NULL REFERENCES azienda(id) ON DELETE CASCADE,

  codice VARCHAR(3) NOT NULL,  -- ISO 4217 (EUR, USD, GBP)
  nome VARCHAR(50) NOT NULL,
  simbolo VARCHAR(5),

  -- Cambio rispetto a EUR
  tasso_cambio DECIMAL(15,6) DEFAULT 1.0,
  data_aggiornamento DATE DEFAULT CURRENT_DATE,

  predefinita BOOLEAN DEFAULT false,
  attiva BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(azienda_id, codice)
);

CREATE INDEX idx_valuta_azienda ON valuta(azienda_id);

-- Seed valute comuni
INSERT INTO valuta (azienda_id, codice, nome, simbolo, tasso_cambio, predefinita)
SELECT id, 'EUR', 'Euro', '€', 1.0, true FROM azienda
ON CONFLICT (azienda_id, codice) DO NOTHING;

INSERT INTO valuta (azienda_id, codice, nome, simbolo, tasso_cambio)
SELECT id, 'USD', 'Dollaro USA', '$', 1.10 FROM azienda
ON CONFLICT (azienda_id, codice) DO NOTHING;

INSERT INTO valuta (azienda_id, codice, nome, simbolo, tasso_cambio)
SELECT id, 'GBP', 'Sterlina', '£', 0.85 FROM azienda
ON CONFLICT (azienda_id, codice) DO NOTHING;

COMMENT ON TABLE valuta IS 'Valute con tassi di cambio';

-- =====================================================
-- TABELLA: causale_movimento (transaction types)
-- =====================================================

CREATE TABLE IF NOT EXISTS causale_movimento (
  id SERIAL PRIMARY KEY,
  azienda_id UUID NOT NULL REFERENCES azienda(id) ON DELETE CASCADE,

  codice VARCHAR(20) NOT NULL,
  descrizione VARCHAR(100) NOT NULL,

  -- Tipo movimento
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('carico', 'scarico', 'trasferimento', 'rettifica', 'inventario')),

  -- Segno: 1 per carico, -1 per scarico, 0 per trasferimenti/rettifiche
  segno INT NOT NULL CHECK (segno IN (1, -1, 0)),

  -- Comportamento
  aggiorna_costo_medio BOOLEAN DEFAULT true,
  richiede_documento BOOLEAN DEFAULT false,
  visibile BOOLEAN DEFAULT true,

  attivo BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(azienda_id, codice)
);

CREATE INDEX idx_causale_movimento_azienda ON causale_movimento(azienda_id);
CREATE INDEX idx_causale_movimento_tipo ON causale_movimento(tipo);

-- Seed causali movimento comuni
INSERT INTO causale_movimento (azienda_id, codice, descrizione, tipo, segno)
SELECT id, 'ACQ', 'Acquisto da fornitore', 'carico', 1 FROM azienda
ON CONFLICT (azienda_id, codice) DO NOTHING;

INSERT INTO causale_movimento (azienda_id, codice, descrizione, tipo, segno)
SELECT id, 'VEN', 'Vendita a cliente', 'scarico', -1 FROM azienda
ON CONFLICT (azienda_id, codice) DO NOTHING;

INSERT INTO causale_movimento (azienda_id, codice, descrizione, tipo, segno)
SELECT id, 'RES', 'Reso da cliente', 'carico', 1 FROM azienda
ON CONFLICT (azienda_id, codice) DO NOTHING;

INSERT INTO causale_movimento (azienda_id, codice, descrizione, tipo, segno)
SELECT id, 'CAR', 'Carico manuale', 'carico', 1 FROM azienda
ON CONFLICT (azienda_id, codice) DO NOTHING;

INSERT INTO causale_movimento (azienda_id, codice, descrizione, tipo, segno)
SELECT id, 'SCA', 'Scarico manuale', 'scarico', -1 FROM azienda
ON CONFLICT (azienda_id, codice) DO NOTHING;

INSERT INTO causale_movimento (azienda_id, codice, descrizione, tipo, segno, richiede_documento)
SELECT id, 'TRA', 'Trasferimento tra magazzini', 'trasferimento', 0, false FROM azienda
ON CONFLICT (azienda_id, codice) DO NOTHING;

INSERT INTO causale_movimento (azienda_id, codice, descrizione, tipo, segno)
SELECT id, 'RET', 'Rettifica inventario', 'rettifica', 0 FROM azienda
ON CONFLICT (azienda_id, codice) DO NOTHING;

COMMENT ON TABLE causale_movimento IS 'Causali movimenti di magazzino';

-- =====================================================
-- TRIGGER per updated_at
-- =====================================================

CREATE TRIGGER trg_listino_updated_at
  BEFORE UPDATE ON listino FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_brand_updated_at
  BEFORE UPDATE ON brand FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_categoria_updated_at
  BEFORE UPDATE ON categoria FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_valuta_updated_at
  BEFORE UPDATE ON valuta FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Listino
ALTER TABLE listino ENABLE ROW LEVEL SECURITY;
CREATE POLICY listino_select_policy ON listino FOR SELECT
  USING (azienda_id = public.get_user_azienda_id());
CREATE POLICY listino_insert_policy ON listino FOR INSERT
  WITH CHECK (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('configurazioni', 'write'));
CREATE POLICY listino_update_policy ON listino FOR UPDATE
  USING (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('configurazioni', 'write'));
CREATE POLICY listino_delete_policy ON listino FOR DELETE
  USING (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('configurazioni', 'delete'));

-- Aliquota IVA
ALTER TABLE aliquota_iva ENABLE ROW LEVEL SECURITY;
CREATE POLICY aliquota_iva_select_policy ON aliquota_iva FOR SELECT
  USING (azienda_id = public.get_user_azienda_id());
CREATE POLICY aliquota_iva_insert_policy ON aliquota_iva FOR INSERT
  WITH CHECK (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('configurazioni', 'write'));
CREATE POLICY aliquota_iva_update_policy ON aliquota_iva FOR UPDATE
  USING (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('configurazioni', 'write'));

-- Brand
ALTER TABLE brand ENABLE ROW LEVEL SECURITY;
CREATE POLICY brand_select_policy ON brand FOR SELECT
  USING (azienda_id = public.get_user_azienda_id());
CREATE POLICY brand_insert_policy ON brand FOR INSERT
  WITH CHECK (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('configurazioni', 'write'));
CREATE POLICY brand_update_policy ON brand FOR UPDATE
  USING (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('configurazioni', 'write'));

-- Categoria
ALTER TABLE categoria ENABLE ROW LEVEL SECURITY;
CREATE POLICY categoria_select_policy ON categoria FOR SELECT
  USING (azienda_id = public.get_user_azienda_id());
CREATE POLICY categoria_insert_policy ON categoria FOR INSERT
  WITH CHECK (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('configurazioni', 'write'));
CREATE POLICY categoria_update_policy ON categoria FOR UPDATE
  USING (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('configurazioni', 'write'));

-- Metodo pagamento
ALTER TABLE metodo_pagamento ENABLE ROW LEVEL SECURITY;
CREATE POLICY metodo_pagamento_select_policy ON metodo_pagamento FOR SELECT
  USING (azienda_id = public.get_user_azienda_id());
CREATE POLICY metodo_pagamento_insert_policy ON metodo_pagamento FOR INSERT
  WITH CHECK (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('configurazioni', 'write'));

-- Unità misura
ALTER TABLE unita_misura ENABLE ROW LEVEL SECURITY;
CREATE POLICY unita_misura_select_policy ON unita_misura FOR SELECT
  USING (azienda_id = public.get_user_azienda_id());

-- Valuta
ALTER TABLE valuta ENABLE ROW LEVEL SECURITY;
CREATE POLICY valuta_select_policy ON valuta FOR SELECT
  USING (azienda_id = public.get_user_azienda_id());

-- Causale movimento
ALTER TABLE causale_movimento ENABLE ROW LEVEL SECURITY;
CREATE POLICY causale_movimento_select_policy ON causale_movimento FOR SELECT
  USING (azienda_id = public.get_user_azienda_id());

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON listino TO authenticated;
GRANT SELECT, INSERT, UPDATE ON aliquota_iva TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON brand TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON categoria TO authenticated;
GRANT SELECT, INSERT, UPDATE ON metodo_pagamento TO authenticated;
GRANT SELECT ON unita_misura TO authenticated;
GRANT SELECT ON valuta TO authenticated;
GRANT SELECT ON causale_movimento TO authenticated;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- FINE MIGRATION
-- =====================================================
