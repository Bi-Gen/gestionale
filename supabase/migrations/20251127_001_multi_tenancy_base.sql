-- =====================================================
-- MIGRATION: Multi-Tenancy Base Tables
-- Data: 2025-11-27
-- Descrizione: Crea tabelle azienda e utente_azienda per multi-tenancy
-- =====================================================

-- =====================================================
-- TABELLA: azienda (Tenant principale)
-- =====================================================

CREATE TABLE IF NOT EXISTS azienda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Dati Azienda
  nome VARCHAR(255) NOT NULL,
  ragione_sociale VARCHAR(255),
  partita_iva VARCHAR(11),
  codice_fiscale VARCHAR(16),

  -- Contatti
  email VARCHAR(255) NOT NULL UNIQUE,
  telefono VARCHAR(50),

  -- Indirizzo
  indirizzo VARCHAR(255),
  cap VARCHAR(5),
  citta VARCHAR(100),
  provincia VARCHAR(2),

  -- Branding
  logo_url TEXT,
  colore_primario VARCHAR(7) DEFAULT '#3B82F6',  -- Tailwind blue-500

  -- Subscription
  piano VARCHAR(20) NOT NULL DEFAULT 'light',
  stato VARCHAR(20) NOT NULL DEFAULT 'trial',
  data_inizio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_scadenza DATE,
  trial_fino_a DATE DEFAULT (CURRENT_DATE + INTERVAL '14 days'),

  -- Limiti Piano (popolati da trigger in base al piano)
  max_utenti INT DEFAULT 1,
  max_prodotti INT DEFAULT 100,
  max_clienti INT DEFAULT 50,

  -- Feature Flags (JSONB per flessibilità)
  features_abilitate JSONB DEFAULT '{
    "magazzini_multipli": false,
    "contabilita": false,
    "analytics_avanzati": false,
    "api_access": false,
    "multi_listini": false,
    "provvigioni": false,
    "scadenzario": false,
    "budget": false,
    "time_intelligence": false,
    "export_excel": true,
    "pdf_custom": false,
    "sso": false,
    "priority_support": false,
    "custom_reports": false,
    "white_label": false
  }'::jsonb,

  -- Billing (Stripe integration - opzionale per ora)
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  metodo_pagamento VARCHAR(50),

  -- Owner (primo utente creato)
  owner_user_id UUID REFERENCES auth.users(id),

  -- Sistema
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT chk_azienda_piano CHECK (piano IN ('light', 'premium', 'enterprise')),
  CONSTRAINT chk_azienda_stato CHECK (stato IN ('trial', 'attivo', 'sospeso', 'scaduto', 'cancellato'))
);

COMMENT ON TABLE azienda IS 'Tenant principale - ogni azienda è isolata con RLS';
COMMENT ON COLUMN azienda.piano IS 'Piano abbonamento: light, premium, enterprise';
COMMENT ON COLUMN azienda.stato IS 'Stato abbonamento: trial, attivo, sospeso, scaduto, cancellato';
COMMENT ON COLUMN azienda.features_abilitate IS 'Feature flags JSONB per abilitare/disabilitare funzionalità in base al piano';

-- Indici
CREATE INDEX idx_azienda_email ON azienda(email);
CREATE INDEX idx_azienda_piano ON azienda(piano);
CREATE INDEX idx_azienda_stato ON azienda(stato);
CREATE INDEX idx_azienda_owner ON azienda(owner_user_id);
CREATE INDEX idx_azienda_attiva ON azienda(stato) WHERE stato = 'attivo';
CREATE INDEX idx_azienda_deleted ON azienda(deleted_at) WHERE deleted_at IS NULL;

-- =====================================================
-- TABELLA: utente_azienda (Many-to-Many)
-- =====================================================

CREATE TABLE IF NOT EXISTS utente_azienda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  azienda_id UUID NOT NULL REFERENCES azienda(id) ON DELETE CASCADE,

  -- Ruolo
  ruolo VARCHAR(20) NOT NULL DEFAULT 'viewer',

  -- Permessi Granulari (JSONB per flessibilità)
  permessi JSONB DEFAULT '{
    "anagrafica": {"read": true, "write": false, "delete": false},
    "prodotti": {"read": true, "write": false, "delete": false},
    "ordini": {"read": true, "write": false, "delete": false},
    "fatture": {"read": true, "write": false, "delete": false},
    "magazzino": {"read": true, "write": false, "delete": false},
    "scadenzario": {"read": true, "write": false, "delete": false},
    "contabilita": {"read": true, "write": false, "delete": false},
    "analytics": {"read": true},
    "configurazioni": {"read": false, "write": false},
    "utenti": {"read": false, "write": false}
  }'::jsonb,

  -- Filtri per Ruolo (es: magazziniere vede solo magazzino X)
  filtri JSONB,

  -- Stato
  attivo BOOLEAN DEFAULT true,
  invito_accettato BOOLEAN DEFAULT false,
  invito_token VARCHAR(255),
  invito_scadenza TIMESTAMPTZ,

  -- Audit
  invitato_da UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE(user_id, azienda_id),
  CONSTRAINT chk_utente_azienda_ruolo CHECK (ruolo IN (
    'owner',
    'admin',
    'magazziniere',
    'contabile',
    'commerciale',
    'acquisti',
    'viewer'
  ))
);

COMMENT ON TABLE utente_azienda IS 'Relazione Many-to-Many tra utenti e aziende con ruoli e permessi';
COMMENT ON COLUMN utente_azienda.ruolo IS 'Ruolo utente: owner, admin, magazziniere, contabile, commerciale, acquisti, viewer';
COMMENT ON COLUMN utente_azienda.permessi IS 'Permessi granulari JSONB per risorsa (read, write, delete)';
COMMENT ON COLUMN utente_azienda.filtri IS 'Filtri opzionali JSONB (es: magazzini visibili, centri_costo)';

-- Indici
CREATE INDEX idx_utente_azienda_user ON utente_azienda(user_id);
CREATE INDEX idx_utente_azienda_azienda ON utente_azienda(azienda_id);
CREATE INDEX idx_utente_azienda_ruolo ON utente_azienda(ruolo);
CREATE INDEX idx_utente_azienda_attivo ON utente_azienda(attivo) WHERE attivo = true;

-- Vincolo: 1 solo owner per azienda
CREATE UNIQUE INDEX idx_utente_azienda_owner_unique ON utente_azienda(azienda_id)
WHERE ruolo = 'owner' AND attivo = true;

COMMENT ON INDEX idx_utente_azienda_owner_unique IS 'Garantisce che ci sia un solo owner attivo per azienda';

-- =====================================================
-- TRIGGER: Auto-popolamento limiti piano
-- =====================================================

CREATE OR REPLACE FUNCTION set_piano_limits()
RETURNS TRIGGER AS $$
BEGIN
  -- Imposta limiti e features in base al piano
  CASE NEW.piano
    WHEN 'light' THEN
      NEW.max_utenti := 1;
      NEW.max_prodotti := 100;
      NEW.max_clienti := 50;
      NEW.features_abilitate := jsonb_build_object(
        'magazzini_multipli', false,
        'contabilita', false,
        'analytics_avanzati', false,
        'api_access', false,
        'multi_listini', false,
        'provvigioni', false,
        'scadenzario', false,
        'budget', false,
        'time_intelligence', false,
        'export_excel', true,
        'pdf_custom', false,
        'sso', false,
        'priority_support', false,
        'custom_reports', false,
        'white_label', false
      );

    WHEN 'premium' THEN
      NEW.max_utenti := 5;
      NEW.max_prodotti := 1000;
      NEW.max_clienti := 500;
      NEW.features_abilitate := jsonb_build_object(
        'magazzini_multipli', true,
        'contabilita', true,
        'analytics_avanzati', true,
        'api_access', false,
        'multi_listini', true,
        'provvigioni', true,
        'scadenzario', true,
        'budget', true,
        'time_intelligence', true,
        'export_excel', true,
        'pdf_custom', false,
        'sso', false,
        'priority_support', false,
        'custom_reports', false,
        'white_label', false
      );

    WHEN 'enterprise' THEN
      NEW.max_utenti := -1;  -- Illimitato
      NEW.max_prodotti := -1;
      NEW.max_clienti := -1;
      NEW.features_abilitate := jsonb_build_object(
        'magazzini_multipli', true,
        'contabilita', true,
        'analytics_avanzati', true,
        'api_access', true,
        'multi_listini', true,
        'provvigioni', true,
        'scadenzario', true,
        'budget', true,
        'time_intelligence', true,
        'export_excel', true,
        'pdf_custom', true,
        'sso', true,
        'priority_support', true,
        'custom_reports', true,
        'white_label', true
      );
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_piano_limits
BEFORE INSERT OR UPDATE OF piano ON azienda
FOR EACH ROW
EXECUTE FUNCTION set_piano_limits();

COMMENT ON FUNCTION set_piano_limits() IS 'Auto-popola limiti e feature flags quando cambia il piano';

-- =====================================================
-- TRIGGER: Auto-popolamento permessi ruolo
-- =====================================================

CREATE OR REPLACE FUNCTION set_ruolo_permessi()
RETURNS TRIGGER AS $$
BEGIN
  -- Imposta permessi di default in base al ruolo
  CASE NEW.ruolo
    WHEN 'owner' THEN
      NEW.permessi := jsonb_build_object(
        'anagrafica', jsonb_build_object('read', true, 'write', true, 'delete', true),
        'prodotti', jsonb_build_object('read', true, 'write', true, 'delete', true),
        'ordini', jsonb_build_object('read', true, 'write', true, 'delete', true),
        'fatture', jsonb_build_object('read', true, 'write', true, 'delete', true),
        'magazzino', jsonb_build_object('read', true, 'write', true, 'delete', true),
        'scadenzario', jsonb_build_object('read', true, 'write', true, 'delete', true),
        'contabilita', jsonb_build_object('read', true, 'write', true, 'delete', true),
        'analytics', jsonb_build_object('read', true),
        'configurazioni', jsonb_build_object('read', true, 'write', true),
        'utenti', jsonb_build_object('read', true, 'write', true),
        'billing', jsonb_build_object('read', true, 'write', true)
      );

    WHEN 'admin' THEN
      NEW.permessi := jsonb_build_object(
        'anagrafica', jsonb_build_object('read', true, 'write', true, 'delete', true),
        'prodotti', jsonb_build_object('read', true, 'write', true, 'delete', true),
        'ordini', jsonb_build_object('read', true, 'write', true, 'delete', true),
        'fatture', jsonb_build_object('read', true, 'write', true, 'delete', true),
        'magazzino', jsonb_build_object('read', true, 'write', true, 'delete', true),
        'scadenzario', jsonb_build_object('read', true, 'write', true, 'delete', true),
        'contabilita', jsonb_build_object('read', true, 'write', true, 'delete', true),
        'analytics', jsonb_build_object('read', true),
        'configurazioni', jsonb_build_object('read', true, 'write', true),
        'utenti', jsonb_build_object('read', true, 'write', true),
        'billing', jsonb_build_object('read', true, 'write', false)
      );

    WHEN 'magazziniere' THEN
      NEW.permessi := jsonb_build_object(
        'anagrafica', jsonb_build_object('read', true, 'write', false, 'delete', false),
        'prodotti', jsonb_build_object('read', true, 'write', true, 'delete', false),
        'ordini', jsonb_build_object('read', true, 'write', false, 'delete', false),
        'fatture', jsonb_build_object('read', false, 'write', false, 'delete', false),
        'magazzino', jsonb_build_object('read', true, 'write', true, 'delete', false),
        'scadenzario', jsonb_build_object('read', false, 'write', false, 'delete', false),
        'contabilita', jsonb_build_object('read', false, 'write', false, 'delete', false),
        'analytics', jsonb_build_object('read', true),
        'configurazioni', jsonb_build_object('read', false, 'write', false),
        'utenti', jsonb_build_object('read', false, 'write', false)
      );

    WHEN 'contabile' THEN
      NEW.permessi := jsonb_build_object(
        'anagrafica', jsonb_build_object('read', true, 'write', false, 'delete', false),
        'prodotti', jsonb_build_object('read', true, 'write', false, 'delete', false),
        'ordini', jsonb_build_object('read', true, 'write', false, 'delete', false),
        'fatture', jsonb_build_object('read', true, 'write', true, 'delete', false),
        'magazzino', jsonb_build_object('read', false, 'write', false, 'delete', false),
        'scadenzario', jsonb_build_object('read', true, 'write', true, 'delete', false),
        'contabilita', jsonb_build_object('read', true, 'write', true, 'delete', false),
        'analytics', jsonb_build_object('read', true),
        'configurazioni', jsonb_build_object('read', true, 'write', false),
        'utenti', jsonb_build_object('read', false, 'write', false)
      );

    WHEN 'commerciale' THEN
      NEW.permessi := jsonb_build_object(
        'anagrafica', jsonb_build_object('read', true, 'write', true, 'delete', false),
        'prodotti', jsonb_build_object('read', true, 'write', false, 'delete', false),
        'ordini', jsonb_build_object('read', true, 'write', true, 'delete', false),
        'fatture', jsonb_build_object('read', true, 'write', false, 'delete', false),
        'magazzino', jsonb_build_object('read', true, 'write', false, 'delete', false),
        'scadenzario', jsonb_build_object('read', true, 'write', false, 'delete', false),
        'contabilita', jsonb_build_object('read', false, 'write', false, 'delete', false),
        'analytics', jsonb_build_object('read', true),
        'configurazioni', jsonb_build_object('read', true, 'write', false),
        'utenti', jsonb_build_object('read', false, 'write', false)
      );

    WHEN 'acquisti' THEN
      NEW.permessi := jsonb_build_object(
        'anagrafica', jsonb_build_object('read', true, 'write', true, 'delete', false),
        'prodotti', jsonb_build_object('read', true, 'write', true, 'delete', false),
        'ordini', jsonb_build_object('read', true, 'write', true, 'delete', false),
        'fatture', jsonb_build_object('read', true, 'write', false, 'delete', false),
        'magazzino', jsonb_build_object('read', true, 'write', false, 'delete', false),
        'scadenzario', jsonb_build_object('read', true, 'write', false, 'delete', false),
        'contabilita', jsonb_build_object('read', false, 'write', false, 'delete', false),
        'analytics', jsonb_build_object('read', true),
        'configurazioni', jsonb_build_object('read', true, 'write', false),
        'utenti', jsonb_build_object('read', false, 'write', false)
      );

    WHEN 'viewer' THEN
      NEW.permessi := jsonb_build_object(
        'anagrafica', jsonb_build_object('read', true, 'write', false, 'delete', false),
        'prodotti', jsonb_build_object('read', true, 'write', false, 'delete', false),
        'ordini', jsonb_build_object('read', true, 'write', false, 'delete', false),
        'fatture', jsonb_build_object('read', true, 'write', false, 'delete', false),
        'magazzino', jsonb_build_object('read', true, 'write', false, 'delete', false),
        'scadenzario', jsonb_build_object('read', true, 'write', false, 'delete', false),
        'contabilita', jsonb_build_object('read', true, 'write', false, 'delete', false),
        'analytics', jsonb_build_object('read', true),
        'configurazioni', jsonb_build_object('read', false, 'write', false),
        'utenti', jsonb_build_object('read', false, 'write', false)
      );
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_ruolo_permessi
BEFORE INSERT OR UPDATE OF ruolo ON utente_azienda
FOR EACH ROW
EXECUTE FUNCTION set_ruolo_permessi();

COMMENT ON FUNCTION set_ruolo_permessi() IS 'Auto-popola permessi quando cambia il ruolo';

-- =====================================================
-- TRIGGER: Updated_at automatico
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_azienda_updated_at
BEFORE UPDATE ON azienda
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_utente_azienda_updated_at
BEFORE UPDATE ON utente_azienda
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FINE MIGRATION
-- =====================================================
