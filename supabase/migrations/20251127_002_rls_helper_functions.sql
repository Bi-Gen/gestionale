-- =====================================================
-- MIGRATION: RLS Helper Functions
-- Data: 2025-11-27
-- Descrizione: Funzioni helper per Row Level Security
-- NOTA: Funzioni create in schema PUBLIC (non auth)
-- =====================================================

-- =====================================================
-- FUNZIONE 1: Ottieni azienda_id dell'utente corrente
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_azienda_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT azienda_id
  FROM utente_azienda
  WHERE user_id = auth.uid()
    AND attivo = true
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_user_azienda_id() IS
'Ritorna l''azienda_id dell''utente corrente. Usato nelle RLS policies.';

-- =====================================================
-- FUNZIONE 2: Check se utente ha permesso
-- =====================================================

CREATE OR REPLACE FUNCTION public.user_has_permission(
  p_resource TEXT,
  p_action TEXT  -- 'read', 'write', 'delete'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_permessi JSONB;
BEGIN
  -- Ottieni permessi dell'utente
  SELECT permessi INTO v_permessi
  FROM utente_azienda
  WHERE user_id = auth.uid()
    AND attivo = true
  LIMIT 1;

  -- Se non trova permessi, nega
  IF v_permessi IS NULL THEN
    RETURN false;
  END IF;

  -- Controlla permesso specifico: permessi -> resource -> action
  RETURN COALESCE(
    (v_permessi -> p_resource ->> p_action)::boolean,
    false
  );
END;
$$;

COMMENT ON FUNCTION public.user_has_permission(TEXT, TEXT) IS
'Verifica se l''utente ha un permesso specifico (es: anagrafica/read).
Parametri:
  p_resource: Nome risorsa (es: "anagrafica", "prodotti", "magazzino")
  p_action: Azione (es: "read", "write", "delete")
Ritorna: true se permesso concesso, false altrimenti';

-- =====================================================
-- FUNZIONE 3: Check se feature è abilitata per piano
-- =====================================================

CREATE OR REPLACE FUNCTION public.feature_enabled(p_feature TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (a.features_abilitate ->> p_feature)::boolean,
    false
  )
  FROM azienda a
  INNER JOIN utente_azienda ua ON a.id = ua.azienda_id
  WHERE ua.user_id = auth.uid()
    AND ua.attivo = true
    AND a.stato = 'attivo'
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.feature_enabled(TEXT) IS
'Verifica se una feature è abilitata per il piano dell''azienda dell''utente.
Parametro:
  p_feature: Nome feature (es: "magazzini_multipli", "contabilita")
Ritorna: true se abilitata, false altrimenti
Nota: Ritorna false anche se azienda non è in stato "attivo"';

-- =====================================================
-- FUNZIONE 4: Check se utente è owner dell'azienda
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM utente_azienda
    WHERE user_id = auth.uid()
      AND ruolo = 'owner'
      AND attivo = true
  );
$$;

COMMENT ON FUNCTION public.is_owner() IS
'Verifica se l''utente corrente è owner della sua azienda.
Utile per policy che richiedono owner (es: gestione utenti, billing)';

-- =====================================================
-- FUNZIONE 5: Check se utente è admin o owner
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_admin_or_owner()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM utente_azienda
    WHERE user_id = auth.uid()
      AND ruolo IN ('owner', 'admin')
      AND attivo = true
  );
$$;

COMMENT ON FUNCTION public.is_admin_or_owner() IS
'Verifica se l''utente è owner o admin.
Utile per policy che richiedono privilegi elevati';

-- =====================================================
-- FUNZIONE 6: Ottieni ruolo utente
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_user_ruolo()
RETURNS VARCHAR(20)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT ruolo
  FROM utente_azienda
  WHERE user_id = auth.uid()
    AND attivo = true
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_user_ruolo() IS
'Ritorna il ruolo dell''utente corrente (owner, admin, magazziniere, etc)';

-- =====================================================
-- FUNZIONE 7: Check limiti piano (usage tracking)
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_piano_limit(
  p_resource TEXT,  -- 'utenti', 'prodotti', 'clienti'
  p_current_count INT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_max_limit INT;
BEGIN
  -- Ottieni limite per la risorsa
  CASE p_resource
    WHEN 'utenti' THEN
      SELECT max_utenti INTO v_max_limit
      FROM azienda a
      INNER JOIN utente_azienda ua ON a.id = ua.azienda_id
      WHERE ua.user_id = auth.uid()
        AND ua.attivo = true
      LIMIT 1;

    WHEN 'prodotti' THEN
      SELECT max_prodotti INTO v_max_limit
      FROM azienda a
      INNER JOIN utente_azienda ua ON a.id = ua.azienda_id
      WHERE ua.user_id = auth.uid()
        AND ua.attivo = true
      LIMIT 1;

    WHEN 'clienti' THEN
      SELECT max_clienti INTO v_max_limit
      FROM azienda a
      INNER JOIN utente_azienda ua ON a.id = ua.azienda_id
      WHERE ua.user_id = auth.uid()
        AND ua.attivo = true
      LIMIT 1;

    ELSE
      RETURN true;  -- Risorsa sconosciuta, permetti
  END CASE;

  -- Se limite = -1 → illimitato (piano enterprise)
  IF v_max_limit = -1 THEN
    RETURN true;
  END IF;

  -- Check: current < max
  RETURN p_current_count < v_max_limit;
END;
$$;

COMMENT ON FUNCTION public.check_piano_limit(TEXT, INT) IS
'Verifica se l''utente può aggiungere una risorsa in base ai limiti del piano.
Parametri:
  p_resource: Tipo risorsa ("utenti", "prodotti", "clienti")
  p_current_count: Conteggio attuale
Ritorna: true se può aggiungere, false se limite raggiunto
Nota: Ritorna true se limite = -1 (illimitato per piano enterprise)';

-- =====================================================
-- FUNZIONE 8: Check filtri utente (per ruoli limitati)
-- =====================================================

CREATE OR REPLACE FUNCTION public.user_can_access_magazzino(p_magazzino_id INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_filtri JSONB;
  v_magazzini_consentiti JSONB;
BEGIN
  -- Ottieni filtri dell'utente
  SELECT filtri INTO v_filtri
  FROM utente_azienda
  WHERE user_id = auth.uid()
    AND attivo = true
  LIMIT 1;

  -- Se non ci sono filtri, può accedere a tutto
  IF v_filtri IS NULL OR v_filtri -> 'magazzini' IS NULL THEN
    RETURN true;
  END IF;

  -- Estrai array magazzini consentiti
  v_magazzini_consentiti := v_filtri -> 'magazzini';

  -- Check se magazzino è nell'array
  RETURN v_magazzini_consentiti ? p_magazzino_id::text;
END;
$$;

COMMENT ON FUNCTION public.user_can_access_magazzino(INT) IS
'Verifica se l''utente può accedere a un magazzino specifico.
Usato per filtrare dati in base al ruolo (es: magazziniere vede solo suo magazzino).
Se utente non ha filtri, può accedere a tutto.';

-- =====================================================
-- FUNZIONE 9: Debug - Info utente corrente
-- =====================================================

CREATE OR REPLACE FUNCTION public.debug_user_info()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  azienda_id UUID,
  azienda_nome TEXT,
  ruolo VARCHAR(20),
  piano VARCHAR(20),
  stato VARCHAR(20)
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT
    u.id AS user_id,
    u.email,
    a.id AS azienda_id,
    a.nome AS azienda_nome,
    ua.ruolo,
    a.piano,
    a.stato
  FROM auth.users u
  LEFT JOIN utente_azienda ua ON u.id = ua.user_id AND ua.attivo = true
  LEFT JOIN azienda a ON ua.azienda_id = a.id
  WHERE u.id = auth.uid();
$$;

COMMENT ON FUNCTION public.debug_user_info() IS
'Funzione di debug per vedere info complete dell''utente corrente.
Utile per troubleshooting RLS policies.';

-- =====================================================
-- GRANT EXECUTE (permetti a authenticated users)
-- =====================================================

-- Permetti a tutti gli utenti autenticati di usare queste funzioni
GRANT EXECUTE ON FUNCTION public.get_user_azienda_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_has_permission(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.feature_enabled(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_owner() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_ruolo() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_piano_limit(TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_can_access_magazzino(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.debug_user_info() TO authenticated;

-- =====================================================
-- FINE MIGRATION
-- =====================================================
