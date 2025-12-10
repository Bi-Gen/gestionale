-- =====================================================
-- SCRIPT: Crea nuova azienda per utente esistente
-- =====================================================
--
-- ISTRUZIONI:
-- 1. Vai su Supabase Dashboard → Authentication → Users
-- 2. Clicca "Add user" e crea l'utente con email e password
-- 3. Copia l'UUID dell'utente appena creato
-- 4. Modifica le variabili sotto con i dati corretti
-- 5. Esegui questo script in SQL Editor
--
-- =====================================================

DO $$
DECLARE
  -- ⚠️ MODIFICA QUESTI VALORI ⚠️
  v_user_id UUID := 'INSERISCI-UUID-UTENTE-QUI';  -- UUID dell'utente da Authentication
  v_nome_azienda VARCHAR := 'Nome Azienda Test';
  v_email_azienda VARCHAR := 'test@esempio.com';
  v_ragione_sociale VARCHAR := NULL;  -- Opzionale
  v_partita_iva VARCHAR := NULL;      -- Opzionale
  v_piano VARCHAR := 'premium';       -- 'light', 'premium', 'enterprise'

  -- Variabili interne
  v_azienda_id UUID;
BEGIN
  -- Verifica che l'utente esista
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
    RAISE EXCEPTION 'Utente con ID % non trovato in auth.users', v_user_id;
  END IF;

  -- Crea l'azienda
  INSERT INTO azienda (
    nome,
    ragione_sociale,
    partita_iva,
    email,
    piano,
    stato,
    owner_user_id
  ) VALUES (
    v_nome_azienda,
    v_ragione_sociale,
    v_partita_iva,
    v_email_azienda,
    v_piano,
    'attivo',
    v_user_id
  )
  RETURNING id INTO v_azienda_id;

  -- Crea il collegamento utente_azienda con ruolo owner
  INSERT INTO utente_azienda (
    user_id,
    azienda_id,
    ruolo,
    attivo,
    invito_accettato
  ) VALUES (
    v_user_id,
    v_azienda_id,
    'owner',
    true,
    true
  );

  -- I trigger auto-seed creeranno automaticamente:
  -- - Magazzino principale
  -- - Aliquote IVA
  -- - Causali movimento
  -- - Metodi pagamento
  -- - Tipi soggetto
  -- - Causali documento

  RAISE NOTICE '✅ Azienda creata con successo!';
  RAISE NOTICE '   ID Azienda: %', v_azienda_id;
  RAISE NOTICE '   Nome: %', v_nome_azienda;
  RAISE NOTICE '   Piano: %', v_piano;
  RAISE NOTICE '';
  RAISE NOTICE '   L''utente può ora fare login con le sue credenziali.';
END $$;
