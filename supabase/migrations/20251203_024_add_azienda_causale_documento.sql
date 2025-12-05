-- Add azienda_id to causale_documento for multi-tenancy
-- and create RLS policies

-- Add azienda_id column (allow NULL temporarily for existing records)
ALTER TABLE causale_documento
ADD COLUMN IF NOT EXISTS azienda_id UUID REFERENCES azienda(id) ON DELETE CASCADE;

-- Set a default azienda_id for existing records (use first azienda)
-- This is just for migration purposes
UPDATE causale_documento
SET azienda_id = (SELECT id FROM azienda LIMIT 1)
WHERE azienda_id IS NULL;

-- Now make it NOT NULL
ALTER TABLE causale_documento
ALTER COLUMN azienda_id SET NOT NULL;

-- Add unique constraint on azienda_id + codice
ALTER TABLE causale_documento
DROP CONSTRAINT IF EXISTS causale_documento_codice_key;

ALTER TABLE causale_documento
ADD CONSTRAINT causale_documento_azienda_codice_unique
UNIQUE (azienda_id, codice);

-- Enable RLS
ALTER TABLE causale_documento ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS causale_documento_select_policy ON causale_documento;
DROP POLICY IF EXISTS causale_documento_insert_policy ON causale_documento;
DROP POLICY IF EXISTS causale_documento_update_policy ON causale_documento;
DROP POLICY IF EXISTS causale_documento_delete_policy ON causale_documento;

-- Create RLS policies
CREATE POLICY causale_documento_select_policy ON causale_documento
  FOR SELECT USING (azienda_id = public.get_user_azienda_id());

CREATE POLICY causale_documento_insert_policy ON causale_documento
  FOR INSERT WITH CHECK (azienda_id = public.get_user_azienda_id());

CREATE POLICY causale_documento_update_policy ON causale_documento
  FOR UPDATE USING (azienda_id = public.get_user_azienda_id());

CREATE POLICY causale_documento_delete_policy ON causale_documento
  FOR DELETE USING (azienda_id = public.get_user_azienda_id());
