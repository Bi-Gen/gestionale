-- =====================================================
-- MIGRATION: Aggiunta Anagrafica Agenti
-- Data: 2025-11-29
-- Descrizione: Aggiunge campi specifici per gestione agenti
--              usando la tabella soggetto unificata
-- =====================================================

-- =====================================================
-- 1. AGGIUNGI CAMPI SPECIFICI AGENTI
-- =====================================================

-- Codice agente univoco
ALTER TABLE soggetto
ADD COLUMN IF NOT EXISTS codice_agente VARCHAR(20);

-- Provvigione percentuale (0-100%)
ALTER TABLE soggetto
ADD COLUMN IF NOT EXISTS provvigione_percentuale DECIMAL(5,2)
CHECK (provvigione_percentuale IS NULL OR (provvigione_percentuale >= 0 AND provvigione_percentuale <= 100));

-- Area geografica di competenza
ALTER TABLE soggetto
ADD COLUMN IF NOT EXISTS area_geografica VARCHAR(100);

-- Flag attivo come agente
ALTER TABLE soggetto
ADD COLUMN IF NOT EXISTS attivo_come_agente BOOLEAN DEFAULT true;

-- Relazione agente assegnato (self-join)
ALTER TABLE soggetto
ADD COLUMN IF NOT EXISTS agente_id UUID REFERENCES soggetto(id) ON DELETE SET NULL;

COMMENT ON COLUMN soggetto.codice_agente IS 'Codice identificativo agente (es: AG001)';
COMMENT ON COLUMN soggetto.provvigione_percentuale IS 'Percentuale provvigione agente (0-100)';
COMMENT ON COLUMN soggetto.area_geografica IS 'Zona geografica di competenza agente';
COMMENT ON COLUMN soggetto.attivo_come_agente IS 'Indica se agente è attualmente attivo';
COMMENT ON COLUMN soggetto.agente_id IS 'ID agente assegnato a questo soggetto (per clienti)';

-- =====================================================
-- 2. INDICI PER PERFORMANCE
-- =====================================================

-- Indice GIN per ricerca agenti nel tipo array
CREATE INDEX IF NOT EXISTS idx_soggetto_tipo_agente
ON soggetto USING GIN(tipo)
WHERE 'agente' = ANY(tipo);

-- Indice per codice agente (ricerche rapide)
CREATE INDEX IF NOT EXISTS idx_soggetto_codice_agente
ON soggetto(codice_agente)
WHERE codice_agente IS NOT NULL;

-- Indice per relazione agente_id (JOIN frequenti)
CREATE INDEX IF NOT EXISTS idx_soggetto_agente_id
ON soggetto(agente_id)
WHERE agente_id IS NOT NULL;

-- Indice per agenti attivi
CREATE INDEX IF NOT EXISTS idx_soggetto_agenti_attivi
ON soggetto(attivo_come_agente, ragione_sociale)
WHERE 'agente' = ANY(tipo) AND attivo_come_agente = true;

-- =====================================================
-- 3. CONSTRAINT UNIVOCITÀ CODICE AGENTE
-- =====================================================

-- Codice agente univoco per azienda
CREATE UNIQUE INDEX IF NOT EXISTS idx_soggetto_codice_agente_unique
ON soggetto(azienda_id, codice_agente)
WHERE codice_agente IS NOT NULL;

-- =====================================================
-- 4. TRIGGER PER GENERAZIONE AUTOMATICA CODICE AGENTE
-- =====================================================

CREATE OR REPLACE FUNCTION generate_codice_agente()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  new_code VARCHAR(20);
BEGIN
  -- Solo se tipo contiene 'agente' e codice non è già impostato
  IF 'agente' = ANY(NEW.tipo) AND (NEW.codice_agente IS NULL OR NEW.codice_agente = '') THEN
    -- Trova il prossimo numero disponibile per questa azienda
    SELECT COALESCE(MAX(CAST(SUBSTRING(codice_agente FROM 3) AS INTEGER)), 0) + 1
    INTO next_number
    FROM soggetto
    WHERE azienda_id = NEW.azienda_id
      AND codice_agente ~ '^AG[0-9]+$';

    -- Genera codice formato AG001, AG002, etc.
    new_code := 'AG' || LPAD(next_number::TEXT, 3, '0');
    NEW.codice_agente := new_code;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applica trigger su INSERT e UPDATE
DROP TRIGGER IF EXISTS trigger_generate_codice_agente ON soggetto;
CREATE TRIGGER trigger_generate_codice_agente
  BEFORE INSERT OR UPDATE ON soggetto
  FOR EACH ROW
  EXECUTE FUNCTION generate_codice_agente();

-- =====================================================
-- 5. FUNZIONE HELPER PER STATISTICHE AGENTI
-- =====================================================

CREATE OR REPLACE FUNCTION get_agente_stats(agente_uuid UUID)
RETURNS TABLE (
  numero_clienti BIGINT,
  fido_totale DECIMAL,
  area TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT s.id)::BIGINT as numero_clienti,
    COALESCE(SUM(s.fido_massimo), 0)::DECIMAL as fido_totale,
    a.area_geografica as area
  FROM soggetto a
  LEFT JOIN soggetto s ON s.agente_id = a.id AND 'cliente' = ANY(s.tipo)
  WHERE a.id = agente_uuid AND 'agente' = ANY(a.tipo)
  GROUP BY a.area_geografica;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_agente_stats IS 'Restituisce statistiche base per un agente';

-- =====================================================
-- 6. VISTA PER LISTA AGENTI CON STATISTICHE
-- =====================================================

CREATE OR REPLACE VIEW vista_agenti AS
SELECT
  s.id,
  s.azienda_id,
  s.codice_agente,
  s.ragione_sociale,
  s.nome,
  s.cognome,
  s.email,
  s.telefono,
  s.cellulare,
  s.area_geografica,
  s.provvigione_percentuale,
  s.attivo_come_agente,
  COUNT(DISTINCT c.id) as numero_clienti,
  COALESCE(SUM(c.fido_massimo), 0) as fido_totale_clienti,
  s.created_at,
  s.updated_at
FROM soggetto s
LEFT JOIN soggetto c ON c.agente_id = s.id AND 'cliente' = ANY(c.tipo)
WHERE 'agente' = ANY(s.tipo)
GROUP BY
  s.id, s.azienda_id, s.codice_agente, s.ragione_sociale,
  s.nome, s.cognome, s.email, s.telefono, s.cellulare,
  s.area_geografica, s.provvigione_percentuale, s.attivo_come_agente,
  s.created_at, s.updated_at;

COMMENT ON VIEW vista_agenti IS 'Vista agenti con statistiche clienti associati';

-- =====================================================
-- 7. GRANT PERMESSI
-- =====================================================

-- Permessi sulla vista (RLS eredita da soggetto)
GRANT SELECT ON vista_agenti TO authenticated;
