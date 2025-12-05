-- =====================================================
-- MIGRATION: Tipi Soggetto e Classificazioni
-- Data: 2025-12-03
-- Descrizione: Tabelle per gestire dinamicamente tipi soggetto, macrofamiglie e famiglie
-- =====================================================

-- =====================================================
-- TABELLA: tipi_soggetto
-- =====================================================

CREATE TABLE IF NOT EXISTS tipi_soggetto (
  id SERIAL PRIMARY KEY,
  azienda_id UUID NOT NULL REFERENCES azienda(id) ON DELETE CASCADE,

  codice VARCHAR(50) NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descrizione TEXT,

  -- Configurazione
  colore VARCHAR(7), -- Hex color per UI
  icona VARCHAR(50), -- Nome icona per UI

  -- Flags
  attivo BOOLEAN DEFAULT true,
  di_sistema BOOLEAN DEFAULT false, -- Se è un tipo predefinito non eliminabile

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(azienda_id, codice)
);

CREATE INDEX idx_tipi_soggetto_azienda ON tipi_soggetto(azienda_id);
CREATE INDEX idx_tipi_soggetto_attivo ON tipi_soggetto(attivo) WHERE attivo = true;

COMMENT ON TABLE tipi_soggetto IS 'Tipi di soggetto configurabili (cliente, fornitore, agente, etc.)';

-- Seed tipi standard
INSERT INTO tipi_soggetto (azienda_id, codice, nome, descrizione, colore, di_sistema)
SELECT
  id,
  'cliente',
  'Cliente',
  'Cliente finale o rivenditore',
  '#3B82F6',
  true
FROM azienda
ON CONFLICT (azienda_id, codice) DO NOTHING;

INSERT INTO tipi_soggetto (azienda_id, codice, nome, descrizione, colore, di_sistema)
SELECT
  id,
  'fornitore',
  'Fornitore',
  'Fornitore di prodotti o servizi',
  '#F59E0B',
  true
FROM azienda
ON CONFLICT (azienda_id, codice) DO NOTHING;

INSERT INTO tipi_soggetto (azienda_id, codice, nome, descrizione, colore, di_sistema)
SELECT
  id,
  'agente',
  'Agente',
  'Agente di vendita',
  '#10B981',
  true
FROM azienda
ON CONFLICT (azienda_id, codice) DO NOTHING;

-- =====================================================
-- TABELLA: macrofamiglie
-- =====================================================

CREATE TABLE IF NOT EXISTS macrofamiglie (
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

CREATE INDEX idx_macrofamiglie_azienda ON macrofamiglie(azienda_id);
CREATE INDEX idx_macrofamiglie_attivo ON macrofamiglie(attivo) WHERE attivo = true;
CREATE INDEX idx_macrofamiglie_ordinamento ON macrofamiglie(ordinamento);

COMMENT ON TABLE macrofamiglie IS 'Macrofamiglie per classificazione prodotti/soggetti';

-- =====================================================
-- TABELLA: famiglie
-- =====================================================

CREATE TABLE IF NOT EXISTS famiglie (
  id SERIAL PRIMARY KEY,
  azienda_id UUID NOT NULL REFERENCES azienda(id) ON DELETE CASCADE,

  macrofamiglia_id INT REFERENCES macrofamiglie(id) ON DELETE CASCADE,

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

CREATE INDEX idx_famiglie_azienda ON famiglie(azienda_id);
CREATE INDEX idx_famiglie_macrofamiglia ON famiglie(macrofamiglia_id);
CREATE INDEX idx_famiglie_attivo ON famiglie(attivo) WHERE attivo = true;
CREATE INDEX idx_famiglie_ordinamento ON famiglie(ordinamento);

COMMENT ON TABLE famiglie IS 'Famiglie (sottocategorie) collegate a macrofamiglie';

-- =====================================================
-- AGGIORNA TABELLA SOGGETTO
-- =====================================================

-- Aggiungi campo codice se non esiste
ALTER TABLE soggetto ADD COLUMN IF NOT EXISTS codice VARCHAR(50);

-- Aggiungi riferimento a famiglia
ALTER TABLE soggetto ADD COLUMN IF NOT EXISTS famiglia_id INT REFERENCES famiglie(id);

-- Indici
CREATE UNIQUE INDEX IF NOT EXISTS idx_soggetto_codice_azienda
ON soggetto(azienda_id, codice) WHERE codice IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_soggetto_codice ON soggetto(codice) WHERE codice IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_soggetto_famiglia ON soggetto(famiglia_id) WHERE famiglia_id IS NOT NULL;

-- =====================================================
-- TRIGGER per updated_at
-- =====================================================

CREATE TRIGGER trg_tipi_soggetto_updated_at
  BEFORE UPDATE ON tipi_soggetto FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_macrofamiglie_updated_at
  BEFORE UPDATE ON macrofamiglie FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_famiglie_updated_at
  BEFORE UPDATE ON famiglie FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- tipi_soggetto
ALTER TABLE tipi_soggetto ENABLE ROW LEVEL SECURITY;

CREATE POLICY tipi_soggetto_select_policy ON tipi_soggetto
  FOR SELECT USING (azienda_id = public.get_user_azienda_id());

CREATE POLICY tipi_soggetto_insert_policy ON tipi_soggetto
  FOR INSERT WITH CHECK (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('configurazione', 'write')
  );

CREATE POLICY tipi_soggetto_update_policy ON tipi_soggetto
  FOR UPDATE USING (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('configurazione', 'write')
  );

CREATE POLICY tipi_soggetto_delete_policy ON tipi_soggetto
  FOR DELETE USING (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('configurazione', 'delete')
    AND di_sistema = false  -- Non si possono eliminare i tipi di sistema
  );

-- macrofamiglie
ALTER TABLE macrofamiglie ENABLE ROW LEVEL SECURITY;

CREATE POLICY macrofamiglie_select_policy ON macrofamiglie
  FOR SELECT USING (azienda_id = public.get_user_azienda_id());

CREATE POLICY macrofamiglie_insert_policy ON macrofamiglie
  FOR INSERT WITH CHECK (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('configurazione', 'write')
  );

CREATE POLICY macrofamiglie_update_policy ON macrofamiglie
  FOR UPDATE USING (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('configurazione', 'write')
  );

CREATE POLICY macrofamiglie_delete_policy ON macrofamiglie
  FOR DELETE USING (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('configurazione', 'delete')
  );

-- famiglie
ALTER TABLE famiglie ENABLE ROW LEVEL SECURITY;

CREATE POLICY famiglie_select_policy ON famiglie
  FOR SELECT USING (azienda_id = public.get_user_azienda_id());

CREATE POLICY famiglie_insert_policy ON famiglie
  FOR INSERT WITH CHECK (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('configurazione', 'write')
  );

CREATE POLICY famiglie_update_policy ON famiglie
  FOR UPDATE USING (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('configurazione', 'write')
  );

CREATE POLICY famiglie_delete_policy ON famiglie
  FOR DELETE USING (
    azienda_id = public.get_user_azienda_id()
    AND public.user_has_permission('configurazione', 'delete')
  );

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON tipi_soggetto TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON macrofamiglie TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON famiglie TO authenticated;

GRANT USAGE, SELECT ON SEQUENCE tipi_soggetto_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE macrofamiglie_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE famiglie_id_seq TO authenticated;

-- =====================================================
-- FINE MIGRATION
-- =====================================================
