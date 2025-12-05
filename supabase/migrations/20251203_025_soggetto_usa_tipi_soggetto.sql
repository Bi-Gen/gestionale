-- Add tipo_soggetto_id to soggetto table and migrate from tipo array
-- This allows using the tipi_soggetto configuration table

-- Add the foreign key column
ALTER TABLE soggetto
ADD COLUMN IF NOT EXISTS tipo_soggetto_id INTEGER REFERENCES tipi_soggetto(id) ON DELETE RESTRICT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_soggetto_tipo_soggetto_id ON soggetto(tipo_soggetto_id);

-- Seed default tipi_soggetto if they don't exist (using first azienda)
-- These will be marked as di_sistema = true
DO $$
DECLARE
  v_first_azienda_id UUID;
  v_cliente_id INT;
  v_fornitore_id INT;
  v_agente_id INT;
BEGIN
  -- Get first azienda
  SELECT id INTO v_first_azienda_id FROM azienda ORDER BY created_at LIMIT 1;

  IF v_first_azienda_id IS NOT NULL THEN
    -- Insert Cliente type if not exists
    INSERT INTO tipi_soggetto (azienda_id, codice, nome, descrizione, colore, attivo, di_sistema)
    VALUES (v_first_azienda_id, 'CLI', 'Cliente', 'Soggetto di tipo cliente', '#3B82F6', true, true)
    ON CONFLICT (azienda_id, codice) DO NOTHING
    RETURNING id INTO v_cliente_id;

    -- Get id if already exists
    IF v_cliente_id IS NULL THEN
      SELECT id INTO v_cliente_id FROM tipi_soggetto
      WHERE azienda_id = v_first_azienda_id AND codice = 'CLI';
    END IF;

    -- Insert Fornitore type if not exists
    INSERT INTO tipi_soggetto (azienda_id, codice, nome, descrizione, colore, attivo, di_sistema)
    VALUES (v_first_azienda_id, 'FOR', 'Fornitore', 'Soggetto di tipo fornitore', '#10B981', true, true)
    ON CONFLICT (azienda_id, codice) DO NOTHING
    RETURNING id INTO v_fornitore_id;

    IF v_fornitore_id IS NULL THEN
      SELECT id INTO v_fornitore_id FROM tipi_soggetto
      WHERE azienda_id = v_first_azienda_id AND codice = 'FOR';
    END IF;

    -- Insert Agente type if not exists
    INSERT INTO tipi_soggetto (azienda_id, codice, nome, descrizione, colore, attivo, di_sistema)
    VALUES (v_first_azienda_id, 'AGE', 'Agente', 'Soggetto di tipo agente', '#F59E0B', true, true)
    ON CONFLICT (azienda_id, codice) DO NOTHING
    RETURNING id INTO v_agente_id;

    IF v_agente_id IS NULL THEN
      SELECT id INTO v_agente_id FROM tipi_soggetto
      WHERE azienda_id = v_first_azienda_id AND codice = 'AGE';
    END IF;

    -- Migrate existing soggetto records based on their tipo array
    -- If tipo contains 'cliente', set tipo_soggetto_id to cliente_id
    UPDATE soggetto
    SET tipo_soggetto_id = v_cliente_id
    WHERE tipo_soggetto_id IS NULL
      AND 'cliente' = ANY(tipo)
      AND azienda_id = v_first_azienda_id;

    -- If tipo contains 'fornitore', set tipo_soggetto_id to fornitore_id
    UPDATE soggetto
    SET tipo_soggetto_id = v_fornitore_id
    WHERE tipo_soggetto_id IS NULL
      AND 'fornitore' = ANY(tipo)
      AND azienda_id = v_first_azienda_id;

    -- If tipo contains 'agente', set tipo_soggetto_id to agente_id
    -- (this won't match any current records but prepares for future)
    UPDATE soggetto
    SET tipo_soggetto_id = v_agente_id
    WHERE tipo_soggetto_id IS NULL
      AND 'agente' = ANY(tipo)
      AND azienda_id = v_first_azienda_id;

    RAISE NOTICE 'Migrated existing soggetto records to use tipi_soggetto';
    RAISE NOTICE 'Cliente ID: %, Fornitore ID: %, Agente ID: %', v_cliente_id, v_fornitore_id, v_agente_id;
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN soggetto.tipo_soggetto_id IS 'Riferimento al tipo di soggetto dalla tabella tipi_soggetto. Sostituisce il campo tipo array.';

-- Note: The old 'tipo' array field is kept for backward compatibility
-- but new code should use tipo_soggetto_id
COMMENT ON COLUMN soggetto.tipo IS 'DEPRECATED: Usare tipo_soggetto_id. Mantenuto per compatibilità.';
