# 🏢 ARCHITETTURA MULTI-TENANCY - ALL IN ONE

## 🎯 REQUISITI BUSINESS

### Modello SaaS Multi-Tenant
- **1 Azienda** (tenant) = N Utenti
- **Isolamento dati completo** (RLS)
- **Ruoli granulari** per utente (Owner, Admin, Magazziniere, Contabile, Commerciale, Viewer)
- **3 Piani di abbonamento** (Light, Premium, Enterprise)
- **Feature flags** per piano

---

## 🗄️ SCHEMA DATABASE MULTI-TENANCY

### azienda (Tenant principale)
```sql
CREATE TABLE azienda (
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
  comune_id INT REFERENCES comune(id),
  provincia VARCHAR(2),

  -- Branding
  logo_url TEXT,
  colore_primario VARCHAR(7),                -- #RRGGBB

  -- Subscription
  piano VARCHAR(20) NOT NULL DEFAULT 'light', -- light, premium, enterprise
  stato VARCHAR(20) NOT NULL DEFAULT 'trial', -- trial, attivo, sospeso, scaduto
  data_inizio DATE NOT NULL DEFAULT CURRENT_DATE,
  data_scadenza DATE,
  trial_fino_a DATE,

  -- Limiti Piano
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
    "export_excel": false,
    "pdf_custom": false,
    "sso": false,
    "priority_support": false,
    "custom_reports": false,
    "white_label": false
  }'::jsonb,

  -- Billing
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

  CONSTRAINT chk_azienda_piano CHECK (piano IN ('light', 'premium', 'enterprise')),
  CONSTRAINT chk_azienda_stato CHECK (stato IN ('trial', 'attivo', 'sospeso', 'scaduto', 'cancellato'))
);

CREATE INDEX idx_azienda_email ON azienda(email);
CREATE INDEX idx_azienda_piano ON azienda(piano);
CREATE INDEX idx_azienda_stato ON azienda(stato);
CREATE INDEX idx_azienda_owner ON azienda(owner_user_id);
CREATE INDEX idx_azienda_attiva ON azienda(stato) WHERE stato = 'attivo';
```

---

### utente_azienda (Many-to-Many User ↔ Azienda)
```sql
CREATE TABLE utente_azienda (
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
  /*
  Esempi:
  {
    "magazzini": [1, 2],           # Vede solo magazzini 1 e 2
    "centri_costo": ["CC001"],     # Vede solo centro costo CC001
    "clienti": ["Cl001", "Cl002"]  # Commerciale vede solo suoi clienti
  }
  */

  -- Stato
  attivo BOOLEAN DEFAULT true,
  invito_accettato BOOLEAN DEFAULT false,
  invito_token VARCHAR(255),
  invito_scadenza TIMESTAMPTZ,

  -- Audit
  invitato_da UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, azienda_id),

  CONSTRAINT chk_utente_azienda_ruolo CHECK (ruolo IN (
    'owner',          -- Proprietario (1 solo per azienda)
    'admin',          -- Amministratore
    'magazziniere',   -- Gestione magazzino
    'contabile',      -- Gestione contabilità
    'commerciale',    -- Gestione vendite
    'acquisti',       -- Gestione acquisti
    'viewer'          -- Solo lettura
  ))
);

CREATE INDEX idx_utente_azienda_user ON utente_azienda(user_id);
CREATE INDEX idx_utente_azienda_azienda ON utente_azienda(azienda_id);
CREATE INDEX idx_utente_azienda_ruolo ON utente_azienda(ruolo);
CREATE INDEX idx_utente_azienda_attivo ON utente_azienda(attivo) WHERE attivo = true;

-- Vincolo: 1 solo owner per azienda
CREATE UNIQUE INDEX idx_utente_azienda_owner ON utente_azienda(azienda_id)
WHERE ruolo = 'owner' AND attivo = true;
```

---

## 🔐 PERMESSI PER RUOLO (Preset)

### Owner (Proprietario)
```json
{
  "anagrafica": {"read": true, "write": true, "delete": true},
  "prodotti": {"read": true, "write": true, "delete": true},
  "ordini": {"read": true, "write": true, "delete": true},
  "fatture": {"read": true, "write": true, "delete": true},
  "magazzino": {"read": true, "write": true, "delete": true},
  "scadenzario": {"read": true, "write": true, "delete": true},
  "contabilita": {"read": true, "write": true, "delete": true},
  "analytics": {"read": true},
  "configurazioni": {"read": true, "write": true},
  "utenti": {"read": true, "write": true},
  "billing": {"read": true, "write": true}
}
```

### Admin
```json
{
  "anagrafica": {"read": true, "write": true, "delete": true},
  "prodotti": {"read": true, "write": true, "delete": true},
  "ordini": {"read": true, "write": true, "delete": true},
  "fatture": {"read": true, "write": true, "delete": true},
  "magazzino": {"read": true, "write": true, "delete": true},
  "scadenzario": {"read": true, "write": true, "delete": true},
  "contabilita": {"read": true, "write": true, "delete": true},
  "analytics": {"read": true},
  "configurazioni": {"read": true, "write": true},
  "utenti": {"read": true, "write": true},
  "billing": {"read": true, "write": false}  // ❌ No accesso billing
}
```

### Magazziniere
```json
{
  "anagrafica": {"read": true, "write": false, "delete": false},  // Solo lettura
  "prodotti": {"read": true, "write": true, "delete": false},     // Può aggiornare giacenze
  "ordini": {"read": true, "write": false, "delete": false},      // Può vedere ordini da evadere
  "fatture": {"read": false, "write": false, "delete": false},    // ❌ No accesso
  "magazzino": {"read": true, "write": true, "delete": false},    // ✅ Pieno accesso magazzino
  "scadenzario": {"read": false, "write": false, "delete": false},
  "contabilita": {"read": false, "write": false, "delete": false},
  "analytics": {"read": true},  // Solo dashboard magazzino
  "configurazioni": {"read": false, "write": false},
  "utenti": {"read": false, "write": false}
}
```

### Contabile
```json
{
  "anagrafica": {"read": true, "write": false, "delete": false},
  "prodotti": {"read": true, "write": false, "delete": false},
  "ordini": {"read": true, "write": false, "delete": false},
  "fatture": {"read": true, "write": true, "delete": false},      // ✅ Gestione fatture
  "magazzino": {"read": false, "write": false, "delete": false},
  "scadenzario": {"read": true, "write": true, "delete": false},  // ✅ Scadenzario
  "contabilita": {"read": true, "write": true, "delete": false},  // ✅ Partita doppia
  "analytics": {"read": true},  // Solo dashboard finanziario
  "configurazioni": {"read": true, "write": false},  // Vede codici IVA ma non modifica
  "utenti": {"read": false, "write": false}
}
```

### Commerciale
```json
{
  "anagrafica": {"read": true, "write": true, "delete": false},   // ✅ Gestione clienti
  "prodotti": {"read": true, "write": false, "delete": false},
  "ordini": {"read": true, "write": true, "delete": false},       // ✅ Crea ordini vendita
  "fatture": {"read": true, "write": false, "delete": false},     // Solo lettura
  "magazzino": {"read": true, "write": false, "delete": false},   // Vede disponibilità
  "scadenzario": {"read": true, "write": false, "delete": false}, // Vede scadenze clienti
  "contabilita": {"read": false, "write": false, "delete": false},
  "analytics": {"read": true},  // Dashboard commerciale
  "configurazioni": {"read": true, "write": false},
  "utenti": {"read": false, "write": false}
}
```

### Acquisti
```json
{
  "anagrafica": {"read": true, "write": true, "delete": false},   // ✅ Gestione fornitori
  "prodotti": {"read": true, "write": true, "delete": false},     // Può aggiungere prodotti
  "ordini": {"read": true, "write": true, "delete": false},       // ✅ Crea ordini acquisto
  "fatture": {"read": true, "write": false, "delete": false},
  "magazzino": {"read": true, "write": false, "delete": false},   // Vede fabbisogni
  "scadenzario": {"read": true, "write": false, "delete": false},
  "contabilita": {"read": false, "write": false, "delete": false},
  "analytics": {"read": true},  // Dashboard fabbisogni
  "configurazioni": {"read": true, "write": false},
  "utenti": {"read": false, "write": false}
}
```

### Viewer
```json
{
  "anagrafica": {"read": true, "write": false, "delete": false},
  "prodotti": {"read": true, "write": false, "delete": false},
  "ordini": {"read": true, "write": false, "delete": false},
  "fatture": {"read": true, "write": false, "delete": false},
  "magazzino": {"read": true, "write": false, "delete": false},
  "scadenzario": {"read": true, "write": false, "delete": false},
  "contabilita": {"read": true, "write": false, "delete": false},
  "analytics": {"read": true},  // Tutte le dashboard
  "configurazioni": {"read": false, "write": false},
  "utenti": {"read": false, "write": false}
}
```

---

## 💎 PIANI DI ABBONAMENTO

### Light (€29/mese)
```json
{
  "nome": "Light",
  "prezzo_mensile": 29,
  "prezzo_annuale": 290,  // 2 mesi gratis
  "max_utenti": 1,
  "max_prodotti": 100,
  "max_clienti": 50,
  "max_fornitori": 20,
  "max_ordini_mese": 50,
  "storage_gb": 1,

  "features": {
    "anagrafica_base": true,
    "ordini_vendita": true,
    "ordini_acquisto": true,
    "magazzini_multipli": false,        // ❌ 1 solo magazzino
    "listini_multipli": false,          // ❌ 1 solo listino
    "fatture": false,                   // ❌ No fatturazione
    "contabilita": false,               // ❌ No partita doppia
    "scadenzario": false,               // ❌ No scadenzario
    "provvigioni": false,
    "trasferimenti_magazzino": false,
    "analytics_base": true,             // ✅ Solo giacenze base
    "analytics_avanzati": false,
    "time_intelligence": false,
    "budget": false,
    "export_excel": true,
    "export_pdf": false,
    "pdf_personalizzati": false,
    "api_access": false,
    "webhook": false,
    "sso": false,
    "white_label": false,
    "support": "email"                  // Solo supporto email
  }
}
```

### Premium (€99/mese) - **CONSIGLIATO**
```json
{
  "nome": "Premium",
  "prezzo_mensile": 99,
  "prezzo_annuale": 990,
  "max_utenti": 5,
  "max_prodotti": 1000,
  "max_clienti": 500,
  "max_fornitori": 200,
  "max_ordini_mese": -1,              // Illimitati
  "storage_gb": 10,

  "features": {
    "anagrafica_base": true,
    "ordini_vendita": true,
    "ordini_acquisto": true,
    "magazzini_multipli": true,         // ✅ Multipli magazzini
    "listini_multipli": true,           // ✅ 10 listini
    "fatture": true,                    // ✅ Fatturazione completa
    "contabilita": true,                // ✅ Partita doppia
    "scadenzario": true,                // ✅ Scadenzario completo
    "provvigioni": true,                // ✅ 4 tipologie
    "trasferimenti_magazzino": true,    // ✅ Trasferimenti
    "analytics_base": true,
    "analytics_avanzati": true,         // ✅ Tutte le dashboard
    "time_intelligence": true,          // ✅ YoY, MoM, YTD
    "budget": true,                     // ✅ Budget vs Consuntivo
    "export_excel": true,
    "export_pdf": true,                 // ✅ PDF standard
    "pdf_personalizzati": false,
    "api_access": false,
    "webhook": false,
    "sso": false,
    "white_label": false,
    "support": "email_chat"             // Email + Chat
  }
}
```

### Enterprise (€299/mese o Custom)
```json
{
  "nome": "Enterprise",
  "prezzo_mensile": 299,
  "prezzo_annuale": 2990,
  "max_utenti": -1,                   // Illimitati
  "max_prodotti": -1,                 // Illimitati
  "max_clienti": -1,
  "max_fornitori": -1,
  "max_ordini_mese": -1,
  "storage_gb": 100,

  "features": {
    "anagrafica_base": true,
    "ordini_vendita": true,
    "ordini_acquisto": true,
    "magazzini_multipli": true,
    "listini_multipli": true,           // Illimitati
    "fatture": true,
    "contabilita": true,
    "scadenzario": true,
    "provvigioni": true,
    "trasferimenti_magazzino": true,
    "analytics_base": true,
    "analytics_avanzati": true,
    "time_intelligence": true,
    "budget": true,
    "forecast_ml": true,                // ✅ Forecast con ML
    "export_excel": true,
    "export_pdf": true,
    "pdf_personalizzati": true,         // ✅ Template custom
    "api_access": true,                 // ✅ API REST completa
    "webhook": true,                    // ✅ Webhook eventi
    "sso": true,                        // ✅ SSO (Google, Azure AD)
    "white_label": true,                // ✅ Logo/branding custom
    "custom_reports": true,             // ✅ Report personalizzati
    "audit_log": true,                  // ✅ Audit trail completo
    "backup_giornalieri": true,
    "sla_uptime": "99.9%",
    "support": "priority_phone_chat"    // Supporto prioritario + telefono
  }
}
```

---

## 🔒 RLS POLICIES (Row Level Security)

### Pattern Base per TUTTE le tabelle

**IMPORTANTE:** Ogni tabella dati (soggetto, prodotto, movimento, etc) deve avere:
- Campo `azienda_id UUID NOT NULL`
- Foreign key a `azienda(id)`
- RLS policy basata su `azienda_id`

### Helper Function per RLS
```sql
-- Funzione: Ottieni azienda_id dell'utente corrente
CREATE OR REPLACE FUNCTION auth.get_user_azienda_id()
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

-- Funzione: Check se utente ha permesso
CREATE OR REPLACE FUNCTION auth.user_has_permission(
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
  SELECT permessi INTO v_permessi
  FROM utente_azienda
  WHERE user_id = auth.uid()
    AND attivo = true
  LIMIT 1;

  -- Se non trova permessi, nega
  IF v_permessi IS NULL THEN
    RETURN false;
  END IF;

  -- Controlla permesso specifico
  RETURN COALESCE(
    (v_permessi -> p_resource ->> p_action)::boolean,
    false
  );
END;
$$;

-- Funzione: Check se feature è abilitata per piano
CREATE OR REPLACE FUNCTION auth.feature_enabled(p_feature TEXT)
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
```

### RLS Policy Template (Esempio: soggetto)

```sql
-- Enable RLS
ALTER TABLE soggetto ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT (lettura)
CREATE POLICY "soggetto_select_policy" ON soggetto
FOR SELECT
USING (
  azienda_id = auth.get_user_azienda_id()
  AND auth.user_has_permission('anagrafica', 'read')
);

-- Policy: INSERT (creazione)
CREATE POLICY "soggetto_insert_policy" ON soggetto
FOR INSERT
WITH CHECK (
  azienda_id = auth.get_user_azienda_id()
  AND auth.user_has_permission('anagrafica', 'write')
);

-- Policy: UPDATE (modifica)
CREATE POLICY "soggetto_update_policy" ON soggetto
FOR UPDATE
USING (
  azienda_id = auth.get_user_azienda_id()
  AND auth.user_has_permission('anagrafica', 'write')
)
WITH CHECK (
  azienda_id = auth.get_user_azienda_id()
);

-- Policy: DELETE (cancellazione)
CREATE POLICY "soggetto_delete_policy" ON soggetto
FOR DELETE
USING (
  azienda_id = auth.get_user_azienda_id()
  AND auth.user_has_permission('anagrafica', 'delete')
);
```

### RLS con Filtri Ruolo (es: Magazziniere vede solo magazzino X)

```sql
CREATE POLICY "giacenza_select_filtered" ON giacenza
FOR SELECT
USING (
  azienda_id = auth.get_user_azienda_id()
  AND auth.user_has_permission('magazzino', 'read')
  AND (
    -- Se utente ha filtri magazzini, applica
    (SELECT filtri -> 'magazzini' FROM utente_azienda WHERE user_id = auth.uid()) IS NULL
    OR
    magazzino_id = ANY(
      SELECT jsonb_array_elements_text(filtri -> 'magazzini')::int
      FROM utente_azienda
      WHERE user_id = auth.uid()
    )
  )
);
```

---

## 🚀 MODIFICA SCHEMA ESISTENTE

### Tutte le tabelle dati devono aggiungere:

```sql
-- Esempio: soggetto
ALTER TABLE soggetto ADD COLUMN azienda_id UUID NOT NULL REFERENCES azienda(id);
ALTER TABLE soggetto DROP COLUMN user_id;  -- Sostituito da azienda_id
CREATE INDEX idx_soggetto_azienda ON soggetto(azienda_id);

-- Ripeti per:
-- prodotto, magazzino, giacenza, listino, prezzo_listino,
-- movimento, dettaglio_movimento, movimento_magazzino,
-- scadenza, pagamento, piano_conti, movimento_contabile
```

### Tabelle di configurazione (condivise o per azienda?)

**Opzione A: Condivise** (1 set per tutti)
```sql
-- valuta, aliquota_iva, tipo_pagamento
-- Nessun azienda_id, sono globali
```

**Opzione B: Per Azienda** (personalizzabili)
```sql
-- brand, macrofamiglia, famiglia, categoria, centro_costo
-- Hanno azienda_id, ogni azienda può customizzare
ALTER TABLE brand ADD COLUMN azienda_id UUID NOT NULL REFERENCES azienda(id);
```

**Raccomandazione:**
- **Globali:** valuta, aliquota_iva (standard italiane)
- **Per Azienda:** brand, categorie, centri_costo (specifici business)

---

## 📱 UI/UX MULTI-TENANT

### Onboarding Nuovo Utente

**Step 1: Signup**
- Email + Password
- Nome + Cognome

**Step 2: Crea Azienda**
- Nome Azienda
- P.IVA (opzionale)
- Indirizzo
- Seleziona Piano (Light/Premium/Enterprise)
- Trial 14 giorni gratis

**Step 3: Inserisci Carta (se non trial)**
- Stripe Checkout

**Step 4: Setup Iniziale**
- Import dati da Excel (opzionale)
- Seed dati demo (opzionale)
- Wizard configurazione base

### Gestione Utenti (Solo Owner/Admin)

**Page: /dashboard/team**
- Lista utenti azienda
- Invita nuovo utente (email)
- Assegna ruolo
- Modifica permessi custom
- Disattiva/Riattiva utente

### Gestione Piano (Solo Owner)

**Page: /dashboard/billing**
- Piano attuale
- Utilizzo (utenti/prodotti/clienti vs limite)
- Upgrade/Downgrade
- Storico fatture Stripe
- Metodo pagamento

### Switch Azienda (Futuro: Multi-Account)

**Se utente appartiene a più aziende:**
- Dropdown in navbar
- Switch context
- Mantiene permessi diversi per azienda

---

## 🎯 CHECKLIST IMPLEMENTAZIONE

### Database
- [ ] Creare tabella `azienda`
- [ ] Creare tabella `utente_azienda`
- [ ] Aggiungere `azienda_id` a tutte le tabelle dati
- [ ] Creare helper functions RLS
- [ ] Creare RLS policies per ogni tabella
- [ ] Seed piani (Light/Premium/Enterprise)
- [ ] Seed ruoli preset

### Auth Flow
- [ ] Signup → Crea azienda automaticamente
- [ ] Owner = primo utente
- [ ] Server action: `inviteUser(email, ruolo)`
- [ ] Accept invite con token
- [ ] Middleware: check `azienda.stato = 'attivo'`

### Feature Flags
- [ ] Helper function: `checkFeature(feature_name)`
- [ ] Middleware per route protette (es: /contabilita richiede feature)
- [ ] UI: Nascondere/disabilitare feature non disponibili
- [ ] Upsell modal (es: "Passa a Premium per sbloccare")

### Billing (Stripe)
- [ ] Setup Stripe Products/Prices
- [ ] Webhook: `customer.subscription.updated`
- [ ] Webhook: `invoice.paid` → attiva piano
- [ ] Webhook: `invoice.payment_failed` → sospendi
- [ ] Cron: check scadenze trial

### UI
- [ ] Page gestione team
- [ ] Page billing
- [ ] Wizard onboarding
- [ ] Feature gates (modale upgrade)
- [ ] Usage tracking (progressbar limiti)

---

## 💰 PRICING STRATEGY

### Trial
- **14 giorni gratis** su qualsiasi piano
- **No carta richiesta** per iniziare trial
- Email reminder: 7 giorni, 3 giorni, 1 giorno prima scadenza

### Limiti Soft vs Hard

**Soft Limits** (warning, no block):
- `max_prodotti`: Avviso a 80%, blocco a 100%
- `max_clienti`: Avviso a 80%, blocco a 100%

**Hard Limits** (blocco immediato):
- `max_utenti`: Invito fallisce se raggiunto
- `storage_gb`: Upload bloccato

### Upsell Trigger Events
- Tentativo di invitare utente (max raggiunto) → "Passa a Premium"
- Tentativo di creare 2° magazzino → "Passa a Premium"
- Click su "Contabilità" (feature disabled) → "Passa a Premium"
- Click su "API Access" → "Passa a Enterprise"

---

**NEXT STEP:** Aggiorno schema principale con multi-tenancy e poi partiamo FASE 1! 🚀
