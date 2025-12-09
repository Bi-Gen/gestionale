-- =====================================================
-- MIGRAZIONE: Sedi/Indirizzi Cliente
-- Data: 2025-12-09
-- Descrizione: Permette ai clienti di avere più sedi/indirizzi
--              di spedizione, ognuno con trasportatore dedicato
-- =====================================================

-- 1. Tabella sedi cliente
CREATE TABLE IF NOT EXISTS sede_cliente (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES soggetto(id) ON DELETE CASCADE,

  -- Identificativo sede
  codice VARCHAR(20),
  denominazione VARCHAR(100) NOT NULL,

  -- Indirizzo
  indirizzo VARCHAR(200),
  civico VARCHAR(20),
  cap VARCHAR(10),
  citta VARCHAR(100),
  provincia VARCHAR(50),
  paese VARCHAR(100) DEFAULT 'Italia',

  -- Trasportatore specifico per questa sede
  trasportatore_id INTEGER REFERENCES soggetto(id) ON DELETE SET NULL,

  -- Note di consegna (es: "orari apertura", "citofono X")
  note_consegna TEXT,

  -- Flags
  predefinito BOOLEAN DEFAULT false,
  attivo BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Una sola sede predefinita per cliente (vincolo parziale)
CREATE UNIQUE INDEX IF NOT EXISTS idx_sede_cliente_predefinita_unica
  ON sede_cliente(cliente_id) WHERE predefinito = true;

COMMENT ON TABLE sede_cliente IS 'Sedi/indirizzi di spedizione per i clienti';

-- 2. Indici
CREATE INDEX IF NOT EXISTS idx_sede_cliente_cliente ON sede_cliente(cliente_id);
CREATE INDEX IF NOT EXISTS idx_sede_cliente_trasportatore ON sede_cliente(trasportatore_id)
  WHERE trasportatore_id IS NOT NULL;

-- 3. Trigger per updated_at
CREATE OR REPLACE FUNCTION update_sede_cliente_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sede_cliente_updated_at ON sede_cliente;
CREATE TRIGGER sede_cliente_updated_at
  BEFORE UPDATE ON sede_cliente
  FOR EACH ROW EXECUTE FUNCTION update_sede_cliente_updated_at();

-- 4. Funzione per gestire sede predefinita
-- Quando si imposta una sede come predefinita, le altre devono diventare non predefinite
CREATE OR REPLACE FUNCTION gestisci_sede_predefinita()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.predefinito = true THEN
    -- Rimuovi il flag predefinito dalle altre sedi dello stesso cliente
    UPDATE sede_cliente
    SET predefinito = false
    WHERE cliente_id = NEW.cliente_id
      AND id != NEW.id
      AND predefinito = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sede_cliente_predefinita ON sede_cliente;
CREATE TRIGGER sede_cliente_predefinita
  BEFORE INSERT OR UPDATE OF predefinito ON sede_cliente
  FOR EACH ROW
  WHEN (NEW.predefinito = true)
  EXECUTE FUNCTION gestisci_sede_predefinita();

-- 5. Aggiungi campo sede_id agli ordini
ALTER TABLE ordini
ADD COLUMN IF NOT EXISTS sede_cliente_id INTEGER REFERENCES sede_cliente(id) ON DELETE SET NULL;

COMMENT ON COLUMN ordini.sede_cliente_id IS 'Sede di spedizione per questo ordine';

-- 6. RLS
ALTER TABLE sede_cliente ENABLE ROW LEVEL SECURITY;

-- Policy: gli utenti vedono solo le sedi dei clienti della loro azienda
CREATE POLICY sede_cliente_select_policy ON sede_cliente
  FOR SELECT
  USING (
    cliente_id IN (
      SELECT s.id FROM soggetto s
      WHERE s.azienda_id = public.get_user_azienda_id()
    )
  );

CREATE POLICY sede_cliente_insert_policy ON sede_cliente
  FOR INSERT
  WITH CHECK (
    cliente_id IN (
      SELECT s.id FROM soggetto s
      WHERE s.azienda_id = public.get_user_azienda_id()
    )
  );

CREATE POLICY sede_cliente_update_policy ON sede_cliente
  FOR UPDATE
  USING (
    cliente_id IN (
      SELECT s.id FROM soggetto s
      WHERE s.azienda_id = public.get_user_azienda_id()
    )
  );

CREATE POLICY sede_cliente_delete_policy ON sede_cliente
  FOR DELETE
  USING (
    cliente_id IN (
      SELECT s.id FROM soggetto s
      WHERE s.azienda_id = public.get_user_azienda_id()
    )
  );

-- 7. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON sede_cliente TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE sede_cliente_id_seq TO authenticated;

-- =====================================================
-- FINE MIGRAZIONE
-- =====================================================
