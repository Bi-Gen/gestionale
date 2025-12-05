-- =====================================================
-- MIGRATION: Sistema SuperAdmin
-- Data: 2025-11-27
-- Descrizione: Aggiunge supporto per SuperAdmin che gestisce tutte le aziende
-- =====================================================

-- =====================================================
-- TABELLA: superadmin_users
-- =====================================================

CREATE TABLE IF NOT EXISTS superadmin_users (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Metadata
  nome VARCHAR(100),
  cognome VARCHAR(100),
  email VARCHAR(255) NOT NULL,

  -- Flags
  attivo BOOLEAN DEFAULT true,

  -- Note
  note TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_superadmin_users_attivo ON superadmin_users(attivo) WHERE attivo = true;

COMMENT ON TABLE superadmin_users IS
'Utenti SuperAdmin che possono gestire tutte le aziende del sistema.
SuperAdmin bypassano le RLS policies e hanno accesso globale.';

-- =====================================================
-- FUNZIONE: is_superadmin() - Verifica se utente è SuperAdmin
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM superadmin_users
    WHERE user_id = auth.uid()
    AND attivo = true
  );
$$;

COMMENT ON FUNCTION public.is_superadmin() IS
'Verifica se l''utente corrente è un SuperAdmin attivo.
Usato nelle RLS policies per bypassare restrizioni azienda_id.';

-- =====================================================
-- AGGIORNA RLS POLICIES per supportare SuperAdmin
-- =====================================================

-- Azienda: SuperAdmin può vedere tutte
DROP POLICY IF EXISTS azienda_select_policy ON azienda;
CREATE POLICY azienda_select_policy ON azienda
  FOR SELECT
  USING (
    public.is_superadmin()
    OR id = public.get_user_azienda_id()
  );

DROP POLICY IF EXISTS azienda_insert_policy ON azienda;
CREATE POLICY azienda_insert_policy ON azienda
  FOR INSERT
  WITH CHECK (
    public.is_superadmin()
    OR (id = public.get_user_azienda_id() AND public.user_has_permission('azienda', 'write'))
  );

DROP POLICY IF EXISTS azienda_update_policy ON azienda;
CREATE POLICY azienda_update_policy ON azienda
  FOR UPDATE
  USING (
    public.is_superadmin()
    OR (id = public.get_user_azienda_id() AND public.user_has_permission('azienda', 'write'))
  );

DROP POLICY IF EXISTS azienda_delete_policy ON azienda;
CREATE POLICY azienda_delete_policy ON azienda
  FOR DELETE
  USING (public.is_superadmin());

-- Utente_Azienda: SuperAdmin può gestire tutti gli utenti
DROP POLICY IF EXISTS utente_azienda_select_policy ON utente_azienda;
CREATE POLICY utente_azienda_select_policy ON utente_azienda
  FOR SELECT
  USING (
    public.is_superadmin()
    OR azienda_id = public.get_user_azienda_id()
  );

DROP POLICY IF EXISTS utente_azienda_insert_policy ON utente_azienda;
CREATE POLICY utente_azienda_insert_policy ON utente_azienda
  FOR INSERT
  WITH CHECK (
    public.is_superadmin()
    OR (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('utenti', 'write'))
  );

DROP POLICY IF EXISTS utente_azienda_update_policy ON utente_azienda;
CREATE POLICY utente_azienda_update_policy ON utente_azienda
  FOR UPDATE
  USING (
    public.is_superadmin()
    OR (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('utenti', 'write'))
  );

DROP POLICY IF EXISTS utente_azienda_delete_policy ON utente_azienda;
CREATE POLICY utente_azienda_delete_policy ON utente_azienda
  FOR DELETE
  USING (
    public.is_superadmin()
    OR (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('utenti', 'delete'))
  );

-- Soggetto: SuperAdmin vede tutti
DROP POLICY IF EXISTS soggetto_select_policy ON soggetto;
CREATE POLICY soggetto_select_policy ON soggetto
  FOR SELECT
  USING (
    public.is_superadmin()
    OR azienda_id = public.get_user_azienda_id()
  );

DROP POLICY IF EXISTS soggetto_insert_policy ON soggetto;
CREATE POLICY soggetto_insert_policy ON soggetto
  FOR INSERT
  WITH CHECK (
    public.is_superadmin()
    OR (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('soggetti', 'write'))
  );

DROP POLICY IF EXISTS soggetto_update_policy ON soggetto;
CREATE POLICY soggetto_update_policy ON soggetto
  FOR UPDATE
  USING (
    public.is_superadmin()
    OR (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('soggetti', 'write'))
  );

DROP POLICY IF EXISTS soggetto_delete_policy ON soggetto;
CREATE POLICY soggetto_delete_policy ON soggetto
  FOR DELETE
  USING (
    public.is_superadmin()
    OR (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('soggetti', 'delete'))
  );

-- Prodotto: SuperAdmin vede tutti
DROP POLICY IF EXISTS prodotto_select_policy ON prodotto;
CREATE POLICY prodotto_select_policy ON prodotto
  FOR SELECT
  USING (
    public.is_superadmin()
    OR azienda_id = public.get_user_azienda_id()
  );

DROP POLICY IF EXISTS prodotto_insert_policy ON prodotto;
CREATE POLICY prodotto_insert_policy ON prodotto
  FOR INSERT
  WITH CHECK (
    public.is_superadmin()
    OR (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('prodotti', 'write'))
  );

DROP POLICY IF EXISTS prodotto_update_policy ON prodotto;
CREATE POLICY prodotto_update_policy ON prodotto
  FOR UPDATE
  USING (
    public.is_superadmin()
    OR (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('prodotti', 'write'))
  );

DROP POLICY IF EXISTS prodotto_delete_policy ON prodotto;
CREATE POLICY prodotto_delete_policy ON prodotto
  FOR DELETE
  USING (
    public.is_superadmin()
    OR (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('prodotti', 'delete'))
  );

-- Magazzino: SuperAdmin vede tutti
DROP POLICY IF EXISTS magazzino_select_policy ON magazzino;
CREATE POLICY magazzino_select_policy ON magazzino
  FOR SELECT
  USING (
    public.is_superadmin()
    OR azienda_id = public.get_user_azienda_id()
  );

DROP POLICY IF EXISTS magazzino_insert_policy ON magazzino;
CREATE POLICY magazzino_insert_policy ON magazzino
  FOR INSERT
  WITH CHECK (
    public.is_superadmin()
    OR (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('magazzino', 'write'))
  );

DROP POLICY IF EXISTS magazzino_update_policy ON magazzino;
CREATE POLICY magazzino_update_policy ON magazzino
  FOR UPDATE
  USING (
    public.is_superadmin()
    OR (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('magazzino', 'write'))
  );

-- Lotto: SuperAdmin vede tutti
DROP POLICY IF EXISTS lotto_select_policy ON lotto;
CREATE POLICY lotto_select_policy ON lotto
  FOR SELECT
  USING (
    public.is_superadmin()
    OR azienda_id = public.get_user_azienda_id()
  );

DROP POLICY IF EXISTS lotto_insert_policy ON lotto;
CREATE POLICY lotto_insert_policy ON lotto
  FOR INSERT
  WITH CHECK (
    public.is_superadmin()
    OR (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('magazzino', 'write'))
  );

DROP POLICY IF EXISTS lotto_update_policy ON lotto;
CREATE POLICY lotto_update_policy ON lotto
  FOR UPDATE
  USING (
    public.is_superadmin()
    OR (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('magazzino', 'write'))
  );

-- Movimento Magazzino: SuperAdmin vede tutti
DROP POLICY IF EXISTS movimento_select_policy ON movimento_magazzino;
CREATE POLICY movimento_select_policy ON movimento_magazzino
  FOR SELECT
  USING (
    public.is_superadmin()
    OR azienda_id = public.get_user_azienda_id()
  );

DROP POLICY IF EXISTS movimento_insert_policy ON movimento_magazzino;
CREATE POLICY movimento_insert_policy ON movimento_magazzino
  FOR INSERT
  WITH CHECK (
    public.is_superadmin()
    OR (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('magazzino', 'write'))
  );

-- =====================================================
-- RLS per tabelle configurazione
-- =====================================================

-- Listino
DROP POLICY IF EXISTS listino_select_policy ON listino;
CREATE POLICY listino_select_policy ON listino
  FOR SELECT
  USING (
    public.is_superadmin()
    OR azienda_id = public.get_user_azienda_id()
  );

DROP POLICY IF EXISTS listino_insert_policy ON listino;
CREATE POLICY listino_insert_policy ON listino
  FOR INSERT
  WITH CHECK (
    public.is_superadmin()
    OR (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('configurazione', 'write'))
  );

DROP POLICY IF EXISTS listino_update_policy ON listino;
CREATE POLICY listino_update_policy ON listino
  FOR UPDATE
  USING (
    public.is_superadmin()
    OR (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('configurazione', 'write'))
  );

-- Aliquota IVA
DROP POLICY IF EXISTS aliquota_iva_select_policy ON aliquota_iva;
CREATE POLICY aliquota_iva_select_policy ON aliquota_iva
  FOR SELECT
  USING (
    public.is_superadmin()
    OR azienda_id = public.get_user_azienda_id()
  );

DROP POLICY IF EXISTS aliquota_iva_insert_policy ON aliquota_iva;
CREATE POLICY aliquota_iva_insert_policy ON aliquota_iva
  FOR INSERT
  WITH CHECK (
    public.is_superadmin()
    OR (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('configurazione', 'write'))
  );

DROP POLICY IF EXISTS aliquota_iva_update_policy ON aliquota_iva;
CREATE POLICY aliquota_iva_update_policy ON aliquota_iva
  FOR UPDATE
  USING (
    public.is_superadmin()
    OR (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('configurazione', 'write'))
  );

-- Brand
DROP POLICY IF EXISTS brand_select_policy ON brand;
CREATE POLICY brand_select_policy ON brand
  FOR SELECT
  USING (
    public.is_superadmin()
    OR azienda_id = public.get_user_azienda_id()
  );

DROP POLICY IF EXISTS brand_insert_policy ON brand;
CREATE POLICY brand_insert_policy ON brand
  FOR INSERT
  WITH CHECK (
    public.is_superadmin()
    OR (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('configurazione', 'write'))
  );

DROP POLICY IF EXISTS brand_update_policy ON brand;
CREATE POLICY brand_update_policy ON brand
  FOR UPDATE
  USING (
    public.is_superadmin()
    OR (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('configurazione', 'write'))
  );

-- Categoria
DROP POLICY IF EXISTS categoria_select_policy ON categoria;
CREATE POLICY categoria_select_policy ON categoria
  FOR SELECT
  USING (
    public.is_superadmin()
    OR azienda_id = public.get_user_azienda_id()
  );

DROP POLICY IF EXISTS categoria_insert_policy ON categoria;
CREATE POLICY categoria_insert_policy ON categoria
  FOR INSERT
  WITH CHECK (
    public.is_superadmin()
    OR (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('configurazione', 'write'))
  );

DROP POLICY IF EXISTS categoria_update_policy ON categoria;
CREATE POLICY categoria_update_policy ON categoria
  FOR UPDATE
  USING (
    public.is_superadmin()
    OR (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('configurazione', 'write'))
  );

-- Metodo Pagamento
DROP POLICY IF EXISTS metodo_pagamento_select_policy ON metodo_pagamento;
CREATE POLICY metodo_pagamento_select_policy ON metodo_pagamento
  FOR SELECT
  USING (
    public.is_superadmin()
    OR azienda_id = public.get_user_azienda_id()
  );

DROP POLICY IF EXISTS metodo_pagamento_insert_policy ON metodo_pagamento;
CREATE POLICY metodo_pagamento_insert_policy ON metodo_pagamento
  FOR INSERT
  WITH CHECK (
    public.is_superadmin()
    OR (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('configurazione', 'write'))
  );

DROP POLICY IF EXISTS metodo_pagamento_update_policy ON metodo_pagamento;
CREATE POLICY metodo_pagamento_update_policy ON metodo_pagamento
  FOR UPDATE
  USING (
    public.is_superadmin()
    OR (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('configurazione', 'write'))
  );

-- Unita Misura
DROP POLICY IF EXISTS unita_misura_select_policy ON unita_misura;
CREATE POLICY unita_misura_select_policy ON unita_misura
  FOR SELECT
  USING (
    public.is_superadmin()
    OR azienda_id = public.get_user_azienda_id()
  );

DROP POLICY IF EXISTS unita_misura_insert_policy ON unita_misura;
CREATE POLICY unita_misura_insert_policy ON unita_misura
  FOR INSERT
  WITH CHECK (
    public.is_superadmin()
    OR (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('configurazione', 'write'))
  );

DROP POLICY IF EXISTS unita_misura_update_policy ON unita_misura;
CREATE POLICY unita_misura_update_policy ON unita_misura
  FOR UPDATE
  USING (
    public.is_superadmin()
    OR (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('configurazione', 'write'))
  );

-- Valuta
DROP POLICY IF EXISTS valuta_select_policy ON valuta;
CREATE POLICY valuta_select_policy ON valuta
  FOR SELECT
  USING (
    public.is_superadmin()
    OR azienda_id = public.get_user_azienda_id()
  );

DROP POLICY IF EXISTS valuta_insert_policy ON valuta;
CREATE POLICY valuta_insert_policy ON valuta
  FOR INSERT
  WITH CHECK (
    public.is_superadmin()
    OR (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('configurazione', 'write'))
  );

DROP POLICY IF EXISTS valuta_update_policy ON valuta;
CREATE POLICY valuta_update_policy ON valuta
  FOR UPDATE
  USING (
    public.is_superadmin()
    OR (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('configurazione', 'write'))
  );

-- Causale Movimento
DROP POLICY IF EXISTS causale_movimento_select_policy ON causale_movimento;
CREATE POLICY causale_movimento_select_policy ON causale_movimento
  FOR SELECT
  USING (
    public.is_superadmin()
    OR azienda_id = public.get_user_azienda_id()
  );

DROP POLICY IF EXISTS causale_movimento_insert_policy ON causale_movimento;
CREATE POLICY causale_movimento_insert_policy ON causale_movimento
  FOR INSERT
  WITH CHECK (
    public.is_superadmin()
    OR (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('configurazione', 'write'))
  );

DROP POLICY IF EXISTS causale_movimento_update_policy ON causale_movimento;
CREATE POLICY causale_movimento_update_policy ON causale_movimento
  FOR UPDATE
  USING (
    public.is_superadmin()
    OR (azienda_id = public.get_user_azienda_id() AND public.user_has_permission('configurazione', 'write'))
  );

-- =====================================================
-- RLS per superadmin_users (solo SuperAdmin gestisce)
-- =====================================================

ALTER TABLE superadmin_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY superadmin_users_select_policy ON superadmin_users
  FOR SELECT
  USING (public.is_superadmin());

CREATE POLICY superadmin_users_insert_policy ON superadmin_users
  FOR INSERT
  WITH CHECK (public.is_superadmin());

CREATE POLICY superadmin_users_update_policy ON superadmin_users
  FOR UPDATE
  USING (public.is_superadmin());

CREATE POLICY superadmin_users_delete_policy ON superadmin_users
  FOR DELETE
  USING (public.is_superadmin());

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON superadmin_users TO authenticated;

-- =====================================================
-- TRIGGER per updated_at
-- =====================================================

CREATE TRIGGER trg_superadmin_users_updated_at
  BEFORE UPDATE ON superadmin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- NOTA: Creazione primo SuperAdmin
-- =====================================================

-- Per creare il primo SuperAdmin, esegui manualmente dopo aver creato
-- un utente in Supabase Auth:
--
-- INSERT INTO superadmin_users (user_id, nome, cognome, email, attivo)
-- VALUES (
--   'UUID_UTENTE_DA_SUPABASE_AUTH',
--   'Mario',
--   'Rossi',
--   'admin@example.com',
--   true
-- );

COMMENT ON TABLE superadmin_users IS
'SuperAdmin users. Per creare il primo SuperAdmin dopo la migrazione:
1. Crea utente in Supabase Auth Dashboard
2. INSERT INTO superadmin_users (user_id, email) VALUES (''uuid'', ''email@example.com'')';

-- =====================================================
-- FINE MIGRATION
-- =====================================================
