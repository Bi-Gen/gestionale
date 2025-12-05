-- Fix RLS policies for metodo_pagamento table
-- Remove complex permission checks, only verify azienda_id

-- Drop existing policies
DROP POLICY IF EXISTS metodo_pagamento_select_policy ON metodo_pagamento;
DROP POLICY IF EXISTS metodo_pagamento_insert_policy ON metodo_pagamento;
DROP POLICY IF EXISTS metodo_pagamento_update_policy ON metodo_pagamento;
DROP POLICY IF EXISTS metodo_pagamento_delete_policy ON metodo_pagamento;

-- Create simplified policies
CREATE POLICY metodo_pagamento_select_policy ON metodo_pagamento
  FOR SELECT USING (azienda_id = public.get_user_azienda_id());

CREATE POLICY metodo_pagamento_insert_policy ON metodo_pagamento
  FOR INSERT WITH CHECK (azienda_id = public.get_user_azienda_id());

CREATE POLICY metodo_pagamento_update_policy ON metodo_pagamento
  FOR UPDATE USING (azienda_id = public.get_user_azienda_id());

CREATE POLICY metodo_pagamento_delete_policy ON metodo_pagamento
  FOR DELETE USING (azienda_id = public.get_user_azienda_id());

-- Also fix aliquota_iva table while we're at it
DROP POLICY IF EXISTS aliquota_iva_select_policy ON aliquota_iva;
DROP POLICY IF EXISTS aliquota_iva_insert_policy ON aliquota_iva;
DROP POLICY IF EXISTS aliquota_iva_update_policy ON aliquota_iva;
DROP POLICY IF EXISTS aliquota_iva_delete_policy ON aliquota_iva;

CREATE POLICY aliquota_iva_select_policy ON aliquota_iva
  FOR SELECT USING (azienda_id = public.get_user_azienda_id());

CREATE POLICY aliquota_iva_insert_policy ON aliquota_iva
  FOR INSERT WITH CHECK (azienda_id = public.get_user_azienda_id());

CREATE POLICY aliquota_iva_update_policy ON aliquota_iva
  FOR UPDATE USING (azienda_id = public.get_user_azienda_id());

CREATE POLICY aliquota_iva_delete_policy ON aliquota_iva
  FOR DELETE USING (azienda_id = public.get_user_azienda_id());
