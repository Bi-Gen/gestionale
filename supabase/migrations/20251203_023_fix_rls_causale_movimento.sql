-- Fix RLS policies for causale_movimento table
-- Remove complex permission checks, only verify azienda_id

-- Drop existing policies
DROP POLICY IF EXISTS causale_movimento_select_policy ON causale_movimento;
DROP POLICY IF EXISTS causale_movimento_insert_policy ON causale_movimento;
DROP POLICY IF EXISTS causale_movimento_update_policy ON causale_movimento;
DROP POLICY IF EXISTS causale_movimento_delete_policy ON causale_movimento;

-- Create simplified policies
CREATE POLICY causale_movimento_select_policy ON causale_movimento
  FOR SELECT USING (azienda_id = public.get_user_azienda_id());

CREATE POLICY causale_movimento_insert_policy ON causale_movimento
  FOR INSERT WITH CHECK (azienda_id = public.get_user_azienda_id());

CREATE POLICY causale_movimento_update_policy ON causale_movimento
  FOR UPDATE USING (azienda_id = public.get_user_azienda_id());

CREATE POLICY causale_movimento_delete_policy ON causale_movimento
  FOR DELETE USING (azienda_id = public.get_user_azienda_id());
