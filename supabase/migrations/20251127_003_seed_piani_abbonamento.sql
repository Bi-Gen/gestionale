-- =====================================================
-- MIGRATION: Seed Piani Abbonamento
-- Data: 2025-11-27
-- Descrizione: Tabella e dati di riferimento per i piani
-- =====================================================

-- =====================================================
-- TABELLA: piano_abbonamento
-- =====================================================

CREATE TABLE IF NOT EXISTS piano_abbonamento (
  codice VARCHAR(20) PRIMARY KEY,  -- 'light', 'premium', 'enterprise'
  nome VARCHAR(50) NOT NULL,
  descrizione TEXT,
  prezzo_mensile DECIMAL(10,2) NOT NULL,
  prezzo_annuale DECIMAL(10,2),  -- Sconto per pagamento annuale

  -- Limiti risorse
  max_utenti INT NOT NULL,
  max_prodotti INT NOT NULL,
  max_clienti INT NOT NULL,
  max_fornitori INT NOT NULL,
  max_magazzini INT NOT NULL,
  max_listini INT NOT NULL,

  -- Features abilitate (JSONB per flessibilità)
  features JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Metadata
  ordinamento INT NOT NULL DEFAULT 0,  -- Ordine visualizzazione
  visibile BOOLEAN DEFAULT true,  -- Se mostrare nel frontend
  consigliato BOOLEAN DEFAULT false,  -- Badge "Consigliato"

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger per updated_at
CREATE TRIGGER trg_piano_abbonamento_updated_at
  BEFORE UPDATE ON piano_abbonamento
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE piano_abbonamento IS
'Tabella di riferimento per i piani di abbonamento disponibili.
Usata per visualizzare prezzi e limiti nel frontend, e come fonte dati per i trigger.';

-- =====================================================
-- SEED DATA: 3 piani principali
-- =====================================================

INSERT INTO piano_abbonamento (
  codice,
  nome,
  descrizione,
  prezzo_mensile,
  prezzo_annuale,
  max_utenti,
  max_prodotti,
  max_clienti,
  max_fornitori,
  max_magazzini,
  max_listini,
  features,
  ordinamento,
  visibile,
  consigliato
) VALUES
  -- PIANO LIGHT (€29/mese)
  (
    'light',
    'Light',
    'Perfetto per iniziare: gestione base per piccole attività',
    29.00,
    290.00,  -- 10 mesi invece di 12 (sconto 2 mesi)
    1,       -- Solo 1 utente
    100,     -- 100 prodotti
    50,      -- 50 clienti
    20,      -- 20 fornitori
    1,       -- 1 magazzino
    1,       -- 1 listino
    jsonb_build_object(
      'magazzini_multipli', false,
      'contabilita', false,
      'scadenzario', false,
      'multi_listini', false,
      'provvigioni', false,
      'budget', false,
      'time_intelligence', false,
      'analytics_avanzati', false,
      'export_excel', true,
      'pdf_custom', false,
      'api_access', false,
      'custom_reports', false,
      'priority_support', false,
      'white_label', false,
      'sso', false
    ),
    1,
    true,
    false
  ),

  -- PIANO PREMIUM (€99/mese) - CONSIGLIATO
  (
    'premium',
    'Premium',
    'Ideale per aziende in crescita: tutte le funzionalità principali',
    99.00,
    990.00,  -- 10 mesi invece di 12
    5,       -- Fino a 5 utenti
    1000,    -- 1000 prodotti
    500,     -- 500 clienti
    200,     -- 200 fornitori
    5,       -- 5 magazzini
    5,       -- 5 listini
    jsonb_build_object(
      'magazzini_multipli', true,
      'contabilita', true,
      'scadenzario', true,
      'multi_listini', true,
      'provvigioni', true,
      'budget', true,
      'time_intelligence', true,
      'analytics_avanzati', true,
      'export_excel', true,
      'pdf_custom', false,
      'api_access', false,
      'custom_reports', false,
      'priority_support', false,
      'white_label', false,
      'sso', false
    ),
    2,
    true,
    true  -- Piano consigliato
  ),

  -- PIANO ENTERPRISE (€299/mese)
  (
    'enterprise',
    'Enterprise',
    'Soluzione completa per grandi aziende: tutto illimitato + supporto prioritario',
    299.00,
    2990.00,  -- 10 mesi invece di 12
    -1,      -- Illimitato (-1 indica nessun limite)
    -1,      -- Illimitato
    -1,      -- Illimitato
    -1,      -- Illimitato
    -1,      -- Illimitato
    -1,      -- Illimitato
    jsonb_build_object(
      'magazzini_multipli', true,
      'contabilita', true,
      'scadenzario', true,
      'multi_listini', true,
      'provvigioni', true,
      'budget', true,
      'time_intelligence', true,
      'analytics_avanzati', true,
      'export_excel', true,
      'pdf_custom', true,
      'api_access', true,
      'custom_reports', true,
      'priority_support', true,
      'white_label', true,
      'sso', true
    ),
    3,
    true,
    false
  )
ON CONFLICT (codice) DO UPDATE SET
  nome = EXCLUDED.nome,
  descrizione = EXCLUDED.descrizione,
  prezzo_mensile = EXCLUDED.prezzo_mensile,
  prezzo_annuale = EXCLUDED.prezzo_annuale,
  max_utenti = EXCLUDED.max_utenti,
  max_prodotti = EXCLUDED.max_prodotti,
  max_clienti = EXCLUDED.max_clienti,
  max_fornitori = EXCLUDED.max_fornitori,
  max_magazzini = EXCLUDED.max_magazzini,
  max_listini = EXCLUDED.max_listini,
  features = EXCLUDED.features,
  ordinamento = EXCLUDED.ordinamento,
  visibile = EXCLUDED.visibile,
  consigliato = EXCLUDED.consigliato,
  updated_at = NOW();

-- =====================================================
-- VISTA: piano_abbonamento_dettaglio
-- =====================================================

CREATE OR REPLACE VIEW piano_abbonamento_dettaglio AS
SELECT
  codice,
  nome,
  descrizione,
  prezzo_mensile,
  prezzo_annuale,

  -- Calcola risparmio annuale
  (prezzo_mensile * 12 - prezzo_annuale) AS risparmio_annuale,
  ROUND((prezzo_mensile * 12 - prezzo_annuale) / (prezzo_mensile * 12) * 100) AS sconto_percentuale,

  -- Limiti
  CASE WHEN max_utenti = -1 THEN 'Illimitato' ELSE max_utenti::text END AS limite_utenti,
  CASE WHEN max_prodotti = -1 THEN 'Illimitato' ELSE max_prodotti::text END AS limite_prodotti,
  CASE WHEN max_clienti = -1 THEN 'Illimitato' ELSE max_clienti::text END AS limite_clienti,
  CASE WHEN max_fornitori = -1 THEN 'Illimitato' ELSE max_fornitori::text END AS limite_fornitori,
  CASE WHEN max_magazzini = -1 THEN 'Illimitato' ELSE max_magazzini::text END AS limite_magazzini,
  CASE WHEN max_listini = -1 THEN 'Illimitato' ELSE max_listini::text END AS limite_listini,

  -- Features
  features,

  -- Features principali (per UI)
  (features->>'magazzini_multipli')::boolean AS ha_magazzini_multipli,
  (features->>'contabilita')::boolean AS ha_contabilita,
  (features->>'analytics_avanzati')::boolean AS ha_analytics_avanzati,
  (features->>'priority_support')::boolean AS ha_priority_support,
  (features->>'api_access')::boolean AS ha_api_access,

  -- Metadata
  ordinamento,
  visibile,
  consigliato
FROM piano_abbonamento
WHERE visibile = true
ORDER BY ordinamento;

COMMENT ON VIEW piano_abbonamento_dettaglio IS
'Vista con dettagli completi dei piani, formattati per il frontend.
Include calcolo risparmi e formattazione limiti.';

-- =====================================================
-- FUNZIONE: Confronto tra piani
-- =====================================================

CREATE OR REPLACE FUNCTION confronta_piani()
RETURNS TABLE (
  feature_name TEXT,
  feature_label TEXT,
  light_value TEXT,
  premium_value TEXT,
  enterprise_value TEXT
)
LANGUAGE sql
STABLE
AS $$
  WITH features_list AS (
    SELECT unnest(ARRAY[
      'magazzini_multipli',
      'contabilita',
      'scadenzario',
      'multi_listini',
      'provvigioni',
      'budget',
      'time_intelligence',
      'analytics_avanzati',
      'export_excel',
      'pdf_custom',
      'api_access',
      'custom_reports',
      'priority_support',
      'white_label',
      'sso'
    ]) AS feature_key,
    unnest(ARRAY[
      'Magazzini Multipli',
      'Contabilità',
      'Scadenzario',
      'Listini Multipli',
      'Provvigioni',
      'Budget',
      'Time Intelligence',
      'Analytics Avanzati',
      'Export Excel',
      'PDF Personalizzati',
      'API Access',
      'Report Personalizzati',
      'Supporto Prioritario',
      'White Label',
      'Single Sign-On'
    ]) AS feature_label
  )
  SELECT
    f.feature_key AS feature_name,
    f.feature_label,
    CASE WHEN (light.features->>f.feature_key)::boolean THEN '✓' ELSE '✗' END AS light_value,
    CASE WHEN (premium.features->>f.feature_key)::boolean THEN '✓' ELSE '✗' END AS premium_value,
    CASE WHEN (enterprise.features->>f.feature_key)::boolean THEN '✓' ELSE '✗' END AS enterprise_value
  FROM features_list f
  CROSS JOIN (SELECT features FROM piano_abbonamento WHERE codice = 'light') light
  CROSS JOIN (SELECT features FROM piano_abbonamento WHERE codice = 'premium') premium
  CROSS JOIN (SELECT features FROM piano_abbonamento WHERE codice = 'enterprise') enterprise;
$$;

COMMENT ON FUNCTION confronta_piani() IS
'Ritorna una tabella di confronto tra i 3 piani con tutte le features.
Utile per visualizzare la pricing page con tabella di confronto.';

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

-- Tabella piano_abbonamento: solo lettura per authenticated
GRANT SELECT ON piano_abbonamento TO authenticated;
GRANT SELECT ON piano_abbonamento_dettaglio TO authenticated;
GRANT EXECUTE ON FUNCTION confronta_piani() TO authenticated;

-- =====================================================
-- FINE MIGRATION
-- =====================================================
