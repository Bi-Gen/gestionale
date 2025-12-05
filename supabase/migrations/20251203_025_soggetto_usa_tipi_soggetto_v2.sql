-- Add tipo_soggetto_id to soggetto table and migrate from tipo array
-- This allows using the tipi_soggetto configuration table

-- Add the foreign key column
ALTER TABLE soggetto
ADD COLUMN IF NOT EXISTS tipo_soggetto_id INTEGER REFERENCES tipi_soggetto(id) ON DELETE RESTRICT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_soggetto_tipo_soggetto_id ON soggetto(tipo_soggetto_id);

-- Clean up duplicate tipi_soggetto and keep only one per azienda+codice
-- First, identify the IDs to keep (lowest ID for each azienda+codice pair)
DO $$
DECLARE
  v_azienda_id UUID;
  v_cliente_id INT;
  v_fornitore_id INT;
  v_agente_id INT;
BEGIN
  -- Get first azienda
  SELECT id INTO v_azienda_id FROM azienda ORDER BY created_at LIMIT 1;

  IF v_azienda_id IS NOT NULL THEN
    -- For each codice, keep the first one and delete duplicates
    -- Cliente
    SELECT MIN(id) INTO v_cliente_id FROM tipi_soggetto
    WHERE azienda_id = v_azienda_id AND (codice = 'CLI' OR codice = 'cliente');

    IF v_cliente_id IS NULL THEN
      -- Insert if doesn't exist
      INSERT INTO tipi_soggetto (azienda_id, codice, nome, descrizione, colore, attivo, di_sistema)
      VALUES (v_azienda_id, 'CLI', 'Cliente', 'Soggetto di tipo cliente', '#3B82F6', true, true)
      RETURNING id INTO v_cliente_id;
      RAISE NOTICE 'Created Cliente tipo with ID: %', v_cliente_id;
    ELSE
      -- Update to ensure it has the right codice and values
      UPDATE tipi_soggetto
      SET codice = 'CLI', nome = 'Cliente', descrizione = 'Soggetto di tipo cliente',
          colore = '#3B82F6', attivo = true, di_sistema = true
      WHERE id = v_cliente_id;

      -- Delete duplicates
      DELETE FROM tipi_soggetto
      WHERE azienda_id = v_azienda_id
        AND (codice = 'CLI' OR codice = 'cliente')
        AND id != v_cliente_id;
      RAISE NOTICE 'Keeping Cliente tipo ID: %, deleted duplicates', v_cliente_id;
    END IF;

    -- Fornitore
    SELECT MIN(id) INTO v_fornitore_id FROM tipi_soggetto
    WHERE azienda_id = v_azienda_id AND (codice = 'FOR' OR codice = 'fornitore');

    IF v_fornitore_id IS NULL THEN
      INSERT INTO tipi_soggetto (azienda_id, codice, nome, descrizione, colore, attivo, di_sistema)
      VALUES (v_azienda_id, 'FOR', 'Fornitore', 'Soggetto di tipo fornitore', '#10B981', true, true)
      RETURNING id INTO v_fornitore_id;
      RAISE NOTICE 'Created Fornitore tipo with ID: %', v_fornitore_id;
    ELSE
      UPDATE tipi_soggetto
      SET codice = 'FOR', nome = 'Fornitore', descrizione = 'Soggetto di tipo fornitore',
          colore = '#10B981', attivo = true, di_sistema = true
      WHERE id = v_fornitore_id;

      DELETE FROM tipi_soggetto
      WHERE azienda_id = v_azienda_id
        AND (codice = 'FOR' OR codice = 'fornitore')
        AND id != v_fornitore_id;
      RAISE NOTICE 'Keeping Fornitore tipo ID: %, deleted duplicates', v_fornitore_id;
    END IF;

    -- Agente
    SELECT MIN(id) INTO v_agente_id FROM tipi_soggetto
    WHERE azienda_id = v_azienda_id AND (codice = 'AGE' OR codice = 'agente');

    IF v_agente_id IS NULL THEN
      INSERT INTO tipi_soggetto (azienda_id, codice, nome, descrizione, colore, attivo, di_sistema)
      VALUES (v_azienda_id, 'AGE', 'Agente', 'Soggetto di tipo agente', '#F59E0B', true, true)
      RETURNING id INTO v_agente_id;
      RAISE NOTICE 'Created Agente tipo with ID: %', v_agente_id;
    ELSE
      UPDATE tipi_soggetto
      SET codice = 'AGE', nome = 'Agente', descrizione = 'Soggetto di tipo agente',
          colore = '#F59E0B', attivo = true, di_sistema = true
      WHERE id = v_agente_id;

      DELETE FROM tipi_soggetto
      WHERE azienda_id = v_azienda_id
        AND (codice = 'AGE' OR codice = 'agente')
        AND id != v_agente_id;
      RAISE NOTICE 'Keeping Agente tipo ID: %, deleted duplicates', v_agente_id;
    END IF;

    -- Now migrate existing soggetto records
    -- If tipo contains 'cliente', set tipo_soggetto_id to cliente_id
    UPDATE soggetto
    SET tipo_soggetto_id = v_cliente_id
    WHERE tipo_soggetto_id IS NULL
      AND 'cliente' = ANY(tipo)
      AND azienda_id = v_azienda_id;

    -- If tipo contains 'fornitore', set tipo_soggetto_id to fornitore_id
    UPDATE soggetto
    SET tipo_soggetto_id = v_fornitore_id
    WHERE tipo_soggetto_id IS NULL
      AND 'fornitore' = ANY(tipo)
      AND azienda_id = v_azienda_id;

    -- If tipo contains 'agente', set tipo_soggetto_id to agente_id
    UPDATE soggetto
    SET tipo_soggetto_id = v_agente_id
    WHERE tipo_soggetto_id IS NULL
      AND 'agente' = ANY(tipo)
      AND azienda_id = v_azienda_id;

    RAISE NOTICE 'Migrated existing soggetto records to use tipi_soggetto';
    RAISE NOTICE 'Cliente ID: %, Fornitore ID: %, Agente ID: %', v_cliente_id, v_fornitore_id, v_agente_id;
  END IF;
END $$;

-- Add comment
COMMENT ON COLUMN soggetto.tipo_soggetto_id IS 'Riferimento al tipo di soggetto dalla tabella tipi_soggetto. Sostituisce il campo tipo array.';

-- Note: The old 'tipo' array field is kept for backward compatibility
-- but new code should use tipo_soggetto_id
COMMENT ON COLUMN soggetto.tipo IS 'DEPRECATED: Usare tipo_soggetto_id. Mantenuto per compatibilità.';
