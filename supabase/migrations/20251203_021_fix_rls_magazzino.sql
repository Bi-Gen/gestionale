-- Fix RLS policies for magazzino table
-- Remove complex permission checks, only verify azienda_id

-- Drop existing policies
DROP POLICY IF EXISTS magazzino_select_policy ON magazzino;
DROP POLICY IF EXISTS magazzino_insert_policy ON magazzino;
DROP POLICY IF EXISTS magazzino_update_policy ON magazzino;
DROP POLICY IF EXISTS magazzino_delete_policy ON magazzino;

-- Create simplified policies
CREATE POLICY magazzino_select_policy ON magazzino
  FOR SELECT USING (azienda_id = public.get_user_azienda_id());

CREATE POLICY magazzino_insert_policy ON magazzino
  FOR INSERT WITH CHECK (azienda_id = public.get_user_azienda_id());

CREATE POLICY magazzino_update_policy ON magazzino
  FOR UPDATE USING (azienda_id = public.get_user_azienda_id());

CREATE POLICY magazzino_delete_policy ON magazzino
  FOR DELETE USING (azienda_id = public.get_user_azienda_id());
