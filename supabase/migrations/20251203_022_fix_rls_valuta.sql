-- Fix RLS policies for valuta table
-- Remove complex permission checks, only verify azienda_id

-- Drop existing policies
DROP POLICY IF EXISTS valuta_select_policy ON valuta;
DROP POLICY IF EXISTS valuta_insert_policy ON valuta;
DROP POLICY IF EXISTS valuta_update_policy ON valuta;
DROP POLICY IF EXISTS valuta_delete_policy ON valuta;

-- Create simplified policies
CREATE POLICY valuta_select_policy ON valuta
  FOR SELECT USING (azienda_id = public.get_user_azienda_id());

CREATE POLICY valuta_insert_policy ON valuta
  FOR INSERT WITH CHECK (azienda_id = public.get_user_azienda_id());

CREATE POLICY valuta_update_policy ON valuta
  FOR UPDATE USING (azienda_id = public.get_user_azienda_id());

CREATE POLICY valuta_delete_policy ON valuta
  FOR DELETE USING (azienda_id = public.get_user_azienda_id());
