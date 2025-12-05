# 🎯 PIANO IMPLEMENTAZIONE FINALE - ALL IN ONE

## 📊 SINTESI ANALISI COMPLETA

### Sorgenti Analizzate
✅ **Excel:** 19 fogli, 42K righe dati, 762K formule
✅ **Power BI:** 4 file, 34 misure DAX, 5 dashboard principali

### Insight Chiave

**1. Power BI conferma priorità:**
- Dashboard **Giacenze** → In TUTTI e 4 i file (priorità massima)
- Dashboard **Marginalità** → In TUTTI e 4 i file (priorità massima)
- Dashboard **Fabbisogni/MRP** → In 2 file (priorità alta per acquisti)
- Dashboard **Commerciale** → In 2 file (priorità media)
- Dashboard **Documentale** → In 1 file (priorità media)

**2. Misure DAX critiche da replicare:**
```
MAGAZZINO (9 misure):
- Valore Magazzino (Iva Escl/Compr)
- Qta in Giacenza / Ordinata / Impegnata
- Qta Fabbisogno (algoritmo MRP!)
- Qta Saldo Giacenza vs Impegni

MARGINALITÀ (7 misure):
- Ricavi Vendite
- Costo Merci (COGS)
- Oneri Diretti (4 provvigioni sommate)
- GM Valore / GM %
- Costi di Gestione

FINANZIARIO (3 misure):
- Circolante
- Saldo Fatture (DSO)
- Saldo Provvigioni Agenti

CONVERSIONI UdM (8 misure):
- Pezzi ↔ Buste ↔ Cartoni ↔ Pedane
- Con/senza segno (carico/scarico)
```

**3. Pattern architetturale Power BI:**
- **Fact Table:** "10 - Database All" (= foglio Excel "DataBase Movimenti")
- **Star Schema** con M:M relationships
- **3 dimensioni temporali:** Data movimento, Data Consegna, Data Pagamento
- **Time Intelligence** per analisi YoY, MoM, YTD

**4. Conferme strategiche:**
- Excel è la **sorgente dati** (Power BI legge da lì)
- 90% misure DAX **identiche** nei 4 file → ridondanza
- Pattern standard: `SWITCH(TRUE())`, `VAR`, threshold `0.01` per near-zero

---

## 🗄️ SCHEMA DATABASE DEFINITIVO (Standard Gestionali)

### Naming Conventions

**Tabelle:** `snake_case` singolare, nomi brevi e chiari
**Indici:** `idx_<tabella>_<campo>`
**FK:** `fk_<tabella>_<riferimento>`
**Check:** `chk_<tabella>_<regola>`

---

### CORE ENTITIES

#### soggetto
```sql
CREATE TABLE soggetto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codice VARCHAR(20) UNIQUE NOT NULL,        -- "Cl001", "Fo042"
  tipo VARCHAR(20) NOT NULL,                 -- cliente, fornitore, altro

  -- Anagrafica
  ragione_sociale VARCHAR(255) NOT NULL,
  partita_iva VARCHAR(11),
  codice_fiscale VARCHAR(16),
  sdi VARCHAR(7),                           -- SDI per fattura elettronica

  -- Contatti
  email VARCHAR(255),
  pec VARCHAR(255),
  telefono VARCHAR(50),
  telefono_ufficio VARCHAR(50),
  persona_riferimento VARCHAR(255),
  email_riferimento VARCHAR(255),

  -- Indirizzi
  indirizzo VARCHAR(255),
  cap VARCHAR(5),
  comune_id INT REFERENCES comune(id),
  provincia VARCHAR(2),
  regione VARCHAR(50),
  nazione VARCHAR(2) DEFAULT 'IT',

  indirizzo_destino VARCHAR(255),           -- Se diverso da sede
  cap_destino VARCHAR(5),
  comune_destino_id INT REFERENCES comune(id),

  -- Classificazione
  settore VARCHAR(100),                     -- Es: "Retail", "Wholesale"
  macrofamiglia VARCHAR(100),
  famiglia VARCHAR(100),

  -- Commerciale
  listino_id INT REFERENCES listino(id),
  valuta VARCHAR(3) DEFAULT 'EUR',
  tipo_pagamento_id INT REFERENCES tipo_pagamento(id),
  giorni_pagamento INT DEFAULT 0,
  aliquota_iva_id INT REFERENCES aliquota_iva(id),
  trattamento_iva VARCHAR(50),              -- Ordinario, Split Payment, Reverse Charge

  -- Provvigioni (4 tipologie)
  agente VARCHAR(100),
  provvigione_agente_perc DECIMAL(5,2),
  direzione_acquisti VARCHAR(100),
  provvigione_da_perc DECIMAL(5,2),
  logistica_amm VARCHAR(100),
  provvigione_las_perc DECIMAL(5,2),
  direzione_commerciale VARCHAR(100),
  provvigione_dc_perc DECIMAL(5,2),

  -- Banking
  iban VARCHAR(34),
  swift VARCHAR(11),

  -- Logistica
  note_consegna TEXT,

  -- Sistema
  note TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  attivo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT chk_soggetto_tipo CHECK (tipo IN ('cliente', 'fornitore', 'altro')),
  CONSTRAINT chk_soggetto_valuta CHECK (valuta IN ('EUR', 'USD', 'GBP', 'CNY'))
);

CREATE INDEX idx_soggetto_codice ON soggetto(codice);
CREATE INDEX idx_soggetto_tipo ON soggetto(tipo);
CREATE INDEX idx_soggetto_ragione_sociale ON soggetto(ragione_sociale);
CREATE INDEX idx_soggetto_user_id ON soggetto(user_id);
CREATE INDEX idx_soggetto_attivo ON soggetto(attivo) WHERE attivo = true;
```

---

#### prodotto
```sql
CREATE TABLE prodotto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codice VARCHAR(50) UNIQUE NOT NULL,

  -- Descrizione
  nome VARCHAR(255) NOT NULL,
  descrizione TEXT,
  descrizione_completa TEXT,

  -- Classificazione
  brand_id INT REFERENCES brand(id),
  macrofamiglia_id INT REFERENCES macrofamiglia(id),
  famiglia_id INT REFERENCES famiglia(id),
  categoria_id INT REFERENCES categoria(id),
  linea VARCHAR(100),

  -- Caratteristiche Prodotto (settore packaging TNT)
  specifiche JSONB,                         -- Flessibile per: materiale, gsm, dimensioni, colore, etc
  /*
  Esempio:
  {
    "materiale": "TNT",
    "tipo": "Medium",
    "gsm": 60,
    "dimensioni": "30x40",
    "colore_fondo": "Blu Dark",
    "stampa_personalizzabile": true,
    "layout_stampa": "Cliente specifico"
  }
  */

  -- Prezzi Base
  prezzo_acquisto DECIMAL(10,2),
  prezzo_magazzino DECIMAL(10,2) NOT NULL,  -- CRITICO per valorizzazione

  -- UdM e Packaging (CRITICAL per logistica)
  unita_misura VARCHAR(10) DEFAULT 'PZ',    -- PZ, CRT, KG, etc
  pezzi_per_busta INT,
  buste_per_cartone INT,
  pezzi_per_cartone INT GENERATED ALWAYS AS (pezzi_per_busta * buste_per_cartone) STORED,
  cartoni_per_pedana INT,
  peso_kg DECIMAL(10,3),

  -- Codici
  ean VARCHAR(13),
  hs_code VARCHAR(10),                      -- Harmonized System Code per export
  codice_fornitore VARCHAR(50),

  -- Planning
  lead_time_giorni INT,
  transit_time_giorni INT,
  scorta_minima INT,                        -- CRITICAL per calcolo fabbisogno

  -- Fornitori
  fornitore_principale_id UUID REFERENCES soggetto(id),
  delivery_terms VARCHAR(50),               -- Incoterms: EXW, FOB, CIF, etc

  -- Immagini
  immagine_url TEXT,
  ean_immagine_url TEXT,

  -- Sistema
  note TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  attivo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT chk_prodotto_prezzi CHECK (prezzo_magazzino >= 0),
  CONSTRAINT chk_prodotto_unita CHECK (unita_misura IN ('PZ', 'CRT', 'KG', 'LT', 'MT'))
);

CREATE INDEX idx_prodotto_codice ON prodotto(codice);
CREATE INDEX idx_prodotto_nome ON prodotto USING gin(to_tsvector('italian', nome));
CREATE INDEX idx_prodotto_brand ON prodotto(brand_id);
CREATE INDEX idx_prodotto_famiglia ON prodotto(famiglia_id);
CREATE INDEX idx_prodotto_fornitore ON prodotto(fornitore_principale_id);
CREATE INDEX idx_prodotto_user_id ON prodotto(user_id);
CREATE INDEX idx_prodotto_attivo ON prodotto(attivo) WHERE attivo = true;
CREATE INDEX idx_prodotto_specifiche ON prodotto USING gin(specifiche);
```

---

#### magazzino
```sql
CREATE TABLE magazzino (
  id SERIAL PRIMARY KEY,
  codice VARCHAR(20) UNIQUE NOT NULL,
  nome VARCHAR(100) NOT NULL,

  -- Ubicazione
  indirizzo VARCHAR(255),
  comune_id INT REFERENCES comune(id),

  -- Sistema
  note TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  attivo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_magazzino_codice ON magazzino(codice);
CREATE INDEX idx_magazzino_user_id ON magazzino(user_id);
```

---

#### giacenza
```sql
CREATE TABLE giacenza (
  id BIGSERIAL PRIMARY KEY,
  prodotto_id UUID NOT NULL REFERENCES prodotto(id),
  magazzino_id INT NOT NULL REFERENCES magazzino(id),

  quantita DECIMAL(15,3) NOT NULL DEFAULT 0,
  valore_medio DECIMAL(10,2),               -- Costo medio ponderato

  ultimo_aggiornamento TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id),

  UNIQUE(prodotto_id, magazzino_id, user_id)
);

CREATE INDEX idx_giacenza_prodotto ON giacenza(prodotto_id);
CREATE INDEX idx_giacenza_magazzino ON giacenza(magazzino_id);
CREATE INDEX idx_giacenza_user_id ON giacenza(user_id);
CREATE INDEX idx_giacenza_quantita_positiva ON giacenza(quantita) WHERE quantita > 0;
```

---

### PRICING

#### listino
```sql
CREATE TABLE listino (
  id SERIAL PRIMARY KEY,
  codice VARCHAR(20) UNIQUE NOT NULL,       -- "LIST1", "LIST2", etc
  nome VARCHAR(100) NOT NULL,
  descrizione TEXT,

  valuta VARCHAR(3) DEFAULT 'EUR',
  data_inizio DATE,
  data_fine DATE,

  user_id UUID NOT NULL REFERENCES auth.users(id),
  attivo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_listino_codice ON listino(codice);
CREATE INDEX idx_listino_attivo ON listino(attivo) WHERE attivo = true;
```

---

#### prezzo_listino
```sql
CREATE TABLE prezzo_listino (
  id BIGSERIAL PRIMARY KEY,
  listino_id INT NOT NULL REFERENCES listino(id) ON DELETE CASCADE,
  prodotto_id UUID NOT NULL REFERENCES prodotto(id) ON DELETE CASCADE,

  prezzo DECIMAL(10,2) NOT NULL,
  provvigione_perc DECIMAL(5,2),            -- % provvigione per questo listino

  -- Prezzi a scaglioni (opzionale)
  quantita_min INT,
  quantita_max INT,

  user_id UUID NOT NULL REFERENCES auth.users(id),
  validita_da DATE,
  validita_a DATE,

  UNIQUE(listino_id, prodotto_id, quantita_min, user_id),
  CONSTRAINT chk_prezzo_listino CHECK (prezzo >= 0)
);

CREATE INDEX idx_prezzo_listino_listino ON prezzo_listino(listino_id);
CREATE INDEX idx_prezzo_listino_prodotto ON prezzo_listino(prodotto_id);
CREATE INDEX idx_prezzo_listino_user_id ON prezzo_listino(user_id);
```

---

### TRANSAZIONI

#### movimento
```sql
CREATE TABLE movimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero VARCHAR(50) UNIQUE NOT NULL,       -- Numerazione progressiva

  -- Tipo e Causale
  tipo VARCHAR(20) NOT NULL,                -- ordine, fattura, bolla, costo_esercizio, trasferimento
  causale VARCHAR(50) NOT NULL,             -- ordine_vendita, ordine_acquisto, vendita, acquisto, etc

  -- Date (3 dimensioni per time-intelligence)
  data_movimento DATE NOT NULL,
  data_consegna DATE,
  data_pagamento DATE,
  data_scadenza DATE,
  etd VARCHAR(50),                          -- Estimated Time of Departure

  -- Controparti
  soggetto_id UUID REFERENCES soggetto(id),
  agente VARCHAR(100),

  -- Logistica
  magazzino_id INT REFERENCES magazzino(id),
  centro_costo VARCHAR(100),
  vettore VARCHAR(100),
  termini_resa VARCHAR(50),                 -- Incoterms
  costo_trasporto DECIMAL(10,2),

  -- Pricing
  listino_id INT REFERENCES listino(id),
  valuta VARCHAR(3) DEFAULT 'EUR',

  -- Totali Finanziari
  totale_imponibile DECIMAL(12,2),
  totale_iva DECIMAL(12,2),
  totale DECIMAL(12,2),

  -- IVA
  regime_iva VARCHAR(50),                   -- Ordinario, Split Payment, Reverse Charge, Esente
  imponibilita VARCHAR(50),                 -- Ordinaria, Esente, Non Imponibile

  -- Pagamenti
  tipo_pagamento_id INT REFERENCES tipo_pagamento(id),
  giorni_pagamento INT,

  -- Provvigioni (4 tipologie - valori)
  provvigione_agente DECIMAL(10,2),
  provvigione_da DECIMAL(10,2),
  provvigione_las DECIMAL(10,2),
  provvigione_dc DECIMAL(10,2),

  -- Stato e Workflow
  stato VARCHAR(20) DEFAULT 'bozza',        -- bozza, confermato, evaso, annullato
  confermato BOOLEAN DEFAULT false,
  data_conferma DATE,
  ove_confermato VARCHAR(100),

  contabilizzato BOOLEAN DEFAULT false,
  data_contabilizzazione DATE,

  -- Altri
  note TEXT,
  nota_operazione TEXT,

  -- Sistema
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT chk_movimento_tipo CHECK (tipo IN ('ordine', 'fattura', 'bolla', 'nota_credito', 'costo_esercizio', 'trasferimento', 'rettifica')),
  CONSTRAINT chk_movimento_causale CHECK (causale IN ('ordine_vendita', 'ordine_acquisto', 'vendita', 'acquisto', 'bolla_accompagnamento', 'nota_credito', 'costo_esercizio', 'trasferimento_scarico', 'trasferimento_carico', 'rettifica_positiva', 'rettifica_negativa', 'scarico_campioni')),
  CONSTRAINT chk_movimento_stato CHECK (stato IN ('bozza', 'confermato', 'evaso', 'annullato'))
);

CREATE INDEX idx_movimento_numero ON movimento(numero);
CREATE INDEX idx_movimento_tipo ON movimento(tipo);
CREATE INDEX idx_movimento_causale ON movimento(causale);
CREATE INDEX idx_movimento_data_movimento ON movimento(data_movimento);
CREATE INDEX idx_movimento_soggetto ON movimento(soggetto_id);
CREATE INDEX idx_movimento_magazzino ON movimento(magazzino_id);
CREATE INDEX idx_movimento_stato ON movimento(stato);
CREATE INDEX idx_movimento_user_id ON movimento(user_id);
CREATE INDEX idx_movimento_data_consegna ON movimento(data_consegna);
CREATE INDEX idx_movimento_data_pagamento ON movimento(data_pagamento);
```

---

#### dettaglio_movimento
```sql
CREATE TABLE dettaglio_movimento (
  id BIGSERIAL PRIMARY KEY,
  movimento_id UUID NOT NULL REFERENCES movimento(id) ON DELETE CASCADE,
  prodotto_id UUID NOT NULL REFERENCES prodotto(id),

  -- Descrizioni (possono differire da anagrafica)
  descrizione_prodotto TEXT,
  stampa VARCHAR(255),
  descrizione_oggetto TEXT,
  colore_fondo VARCHAR(50),
  brand VARCHAR(100),

  -- Quantità
  unita_vendita VARCHAR(10),                -- PZ, CRT
  quantita DECIMAL(15,3) NOT NULL,
  quantita_con_segno DECIMAL(15,3) NOT NULL, -- Positivo = Carico, Negativo = Scarico

  -- Prezzi
  prezzo_listino DECIMAL(10,2),
  sconto_perc DECIMAL(5,2),
  prezzo_unitario DECIMAL(10,2) NOT NULL,
  prezzo_imponibile DECIMAL(10,2) NOT NULL,

  -- Totali riga
  valore_imponibile DECIMAL(12,2) NOT NULL,
  aliquota_iva_id INT REFERENCES aliquota_iva(id),
  iva DECIMAL(12,2),
  totale DECIMAL(12,2) NOT NULL,

  -- Costi Accessori
  costo_stampa DECIMAL(10,2),

  -- Sistema
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_dettaglio_quantita CHECK (quantita > 0)
);

CREATE INDEX idx_dettaglio_movimento ON dettaglio_movimento(movimento_id);
CREATE INDEX idx_dettaglio_prodotto ON dettaglio_movimento(prodotto_id);
CREATE INDEX idx_dettaglio_user_id ON dettaglio_movimento(user_id);
```

---

#### movimento_magazzino
```sql
-- Storico movimentazioni per tracking granulare
CREATE TABLE movimento_magazzino (
  id BIGSERIAL PRIMARY KEY,
  tipo_movimento VARCHAR(20) NOT NULL,      -- carico, scarico, trasferimento

  prodotto_id UUID NOT NULL REFERENCES prodotto(id),
  magazzino_id INT NOT NULL REFERENCES magazzino(id),

  quantita DECIMAL(15,3) NOT NULL,
  quantita_con_segno DECIMAL(15,3) NOT NULL,

  causale VARCHAR(50) NOT NULL,
  movimento_id UUID REFERENCES movimento(id), -- Link a documento origine

  data_movimento DATE NOT NULL,

  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_movimento_magazzino_tipo CHECK (tipo_movimento IN ('carico', 'scarico', 'trasferimento'))
);

CREATE INDEX idx_movimento_magazzino_prodotto ON movimento_magazzino(prodotto_id);
CREATE INDEX idx_movimento_magazzino_magazzino ON movimento_magazzino(magazzino_id);
CREATE INDEX idx_movimento_magazzino_data ON movimento_magazzino(data_movimento);
CREATE INDEX idx_movimento_magazzino_causale ON movimento_magazzino(causale);
CREATE INDEX idx_movimento_magazzino_user_id ON movimento_magazzino(user_id);
```

---

### SCADENZARIO

#### scadenza
```sql
CREATE TABLE scadenza (
  id BIGSERIAL PRIMARY KEY,
  tipo VARCHAR(10) NOT NULL,                -- attivo (credito), passivo (debito)

  movimento_id UUID NOT NULL REFERENCES movimento(id),
  soggetto_id UUID NOT NULL REFERENCES soggetto(id),

  numero_rata INT DEFAULT 1,
  totale_rate INT DEFAULT 1,

  data_emissione DATE NOT NULL,
  data_scadenza DATE NOT NULL,

  importo DECIMAL(12,2) NOT NULL,
  importo_pagato DECIMAL(12,2) DEFAULT 0,
  importo_residuo DECIMAL(12,2) GENERATED ALWAYS AS (importo - importo_pagato) STORED,

  stato VARCHAR(20) DEFAULT 'da_pagare',    -- da_pagare, parzialmente_pagato, pagato, scaduto

  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_scadenza_tipo CHECK (tipo IN ('attivo', 'passivo')),
  CONSTRAINT chk_scadenza_stato CHECK (stato IN ('da_pagare', 'parzialmente_pagato', 'pagato', 'scaduto'))
);

CREATE INDEX idx_scadenza_tipo ON scadenza(tipo);
CREATE INDEX idx_scadenza_soggetto ON scadenza(soggetto_id);
CREATE INDEX idx_scadenza_data_scadenza ON scadenza(data_scadenza);
CREATE INDEX idx_scadenza_stato ON scadenza(stato);
CREATE INDEX idx_scadenza_user_id ON scadenza(user_id);
CREATE INDEX idx_scadenza_scadute ON scadenza(data_scadenza) WHERE stato IN ('da_pagare', 'parzialmente_pagato') AND data_scadenza < CURRENT_DATE;
```

---

#### pagamento
```sql
CREATE TABLE pagamento (
  id BIGSERIAL PRIMARY KEY,
  scadenza_id BIGINT NOT NULL REFERENCES scadenza(id),

  data_pagamento DATE NOT NULL,
  importo DECIMAL(12,2) NOT NULL,

  tipo_pagamento_id INT REFERENCES tipo_pagamento(id),
  riferimento VARCHAR(255),                 -- Es: numero bonifico, RID, etc
  note TEXT,

  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_pagamento_importo CHECK (importo > 0)
);

CREATE INDEX idx_pagamento_scadenza ON pagamento(scadenza_id);
CREATE INDEX idx_pagamento_data ON pagamento(data_pagamento);
CREATE INDEX idx_pagamento_user_id ON pagamento(user_id);
```

---

### CONTABILITÀ (Priorità Media - Fase successiva)

#### piano_conti
```sql
CREATE TABLE piano_conti (
  id SERIAL PRIMARY KEY,
  codice VARCHAR(20) UNIQUE NOT NULL,
  descrizione VARCHAR(255) NOT NULL,

  livello_1 INT,                            -- Macro categoria
  livello_2 INT,                            -- Categoria
  livello_3 INT,                            -- Sottocategoria
  livello INT NOT NULL,                     -- Profondità gerarchica

  parent_id INT REFERENCES piano_conti(id), -- Gerarchia

  tipo_conto VARCHAR(50),                   -- Patrimoniale, Economico
  apcr VARCHAR(1),                          -- A=Attivo, P=Passivo, C=Costi, R=Ricavi

  conto_chiusura VARCHAR(20),
  conto_apertura VARCHAR(20),

  user_id UUID NOT NULL REFERENCES auth.users(id),
  attivo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_piano_conti_codice ON piano_conti(codice);
CREATE INDEX idx_piano_conti_livello ON piano_conti(livello);
CREATE INDEX idx_piano_conti_parent ON piano_conti(parent_id);
```

---

#### movimento_contabile
```sql
CREATE TABLE movimento_contabile (
  id BIGSERIAL PRIMARY KEY,

  data_movimento DATE NOT NULL,
  causale VARCHAR(10) NOT NULL,             -- dare, avere
  causale_economica TEXT,
  descrizione TEXT NOT NULL,

  conto_id INT NOT NULL REFERENCES piano_conti(id),
  soggetto_id UUID REFERENCES soggetto(id),

  numero_documento VARCHAR(50),

  valuta VARCHAR(3) DEFAULT 'EUR',
  importo DECIMAL(12,2) NOT NULL,
  importo_con_segno DECIMAL(12,2) NOT NULL, -- Positivo=Dare, Negativo=Avere

  -- Polymorphic link
  documento_tipo VARCHAR(20),               -- movimento, fattura, costo_esercizio
  documento_id UUID,

  tipo_movimento VARCHAR(20) DEFAULT 'contabile', -- contabile, non_contabile

  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT chk_movimento_contabile_causale CHECK (causale IN ('dare', 'avere'))
);

CREATE INDEX idx_movimento_contabile_data ON movimento_contabile(data_movimento);
CREATE INDEX idx_movimento_contabile_conto ON movimento_contabile(conto_id);
CREATE INDEX idx_movimento_contabile_soggetto ON movimento_contabile(soggetto_id);
CREATE INDEX idx_movimento_contabile_user_id ON movimento_contabile(user_id);
```

---

### CONFIGURAZIONI (Lookup Tables)

```sql
-- Tutte le tabelle di configurazione seguono questo pattern base:

CREATE TABLE tipo_pagamento (
  id SERIAL PRIMARY KEY,
  codice VARCHAR(20) UNIQUE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  giorni_default INT DEFAULT 0,
  tipo VARCHAR(50),                         -- contanti, bonifico, riba, rimessa_diretta, assegno
  user_id UUID NOT NULL REFERENCES auth.users(id),
  attivo BOOLEAN DEFAULT true,
  ordinamento INT DEFAULT 0
);

CREATE TABLE aliquota_iva (
  id SERIAL PRIMARY KEY,
  codice VARCHAR(20) UNIQUE NOT NULL,
  percentuale DECIMAL(5,2) NOT NULL,
  descrizione VARCHAR(255),
  tipo VARCHAR(50),                         -- ordinaria, ridotta, minima, esente, non_imponibile
  user_id UUID NOT NULL REFERENCES auth.users(id),
  attivo BOOLEAN DEFAULT true,
  ordinamento INT DEFAULT 0
);

CREATE TABLE brand (
  id SERIAL PRIMARY KEY,
  codice VARCHAR(20) UNIQUE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  attivo BOOLEAN DEFAULT true
);

CREATE TABLE macrofamiglia (
  id SERIAL PRIMARY KEY,
  codice VARCHAR(20) UNIQUE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  attivo BOOLEAN DEFAULT true
);

CREATE TABLE famiglia (
  id SERIAL PRIMARY KEY,
  codice VARCHAR(20) UNIQUE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  macrofamiglia_id INT REFERENCES macrofamiglia(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  attivo BOOLEAN DEFAULT true
);

CREATE TABLE categoria (
  id SERIAL PRIMARY KEY,
  codice VARCHAR(20) UNIQUE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  famiglia_id INT REFERENCES famiglia(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  attivo BOOLEAN DEFAULT true
);

CREATE TABLE valuta (
  id SERIAL PRIMARY KEY,
  codice VARCHAR(3) UNIQUE NOT NULL,        -- EUR, USD, GBP, CNY
  nome VARCHAR(100) NOT NULL,
  simbolo VARCHAR(5),
  attivo BOOLEAN DEFAULT true
);

CREATE TABLE centro_costo (
  id SERIAL PRIMARY KEY,
  codice VARCHAR(20) UNIQUE NOT NULL,
  nome VARCHAR(100) NOT NULL,
  descrizione TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  attivo BOOLEAN DEFAULT true
);
```

---

## 📊 MATERIALIZED VIEWS (Replicano Misure DAX)

### View: giacenze_attuali
```sql
CREATE MATERIALIZED VIEW mv_giacenze_attuali AS
SELECT
  g.prodotto_id,
  p.codice AS codice_prodotto,
  p.nome AS nome_prodotto,
  g.magazzino_id,
  m.nome AS nome_magazzino,

  -- Qta in Giacenza (esclude ordini)
  g.quantita AS qta_giacenza,

  -- Qta Ordinata (ordini acquisto confermati, da ricevere)
  COALESCE(qta_ord.qta_ordinata, 0) AS qta_ordinata,

  -- Qta Impegnata (ordini vendita confermati, da evadere)
  COALESCE(qta_imp.qta_impegnata, 0) AS qta_impegnata,

  -- Saldo Giacenza vs Impegni
  g.quantita + COALESCE(qta_imp.qta_impegnata, 0) AS qta_disponibile,

  -- Scorta Minima
  p.scorta_minima,

  -- Fabbisogno (negativo = manca merce)
  CASE
    WHEN (g.quantita + COALESCE(qta_ord.qta_ordinata, 0) + COALESCE(qta_imp.qta_impegnata, 0) - p.scorta_minima) < 0
    THEN (g.quantita + COALESCE(qta_ord.qta_ordinata, 0) + COALESCE(qta_imp.qta_impegnata, 0) - p.scorta_minima)
    ELSE NULL
  END AS qta_fabbisogno,

  -- Valore Magazzino (Iva Escl)
  g.quantita * p.prezzo_magazzino AS valore_magazzino_iva_escl,

  -- Valore Magazzino (Iva 22%)
  g.quantita * p.prezzo_magazzino * 1.22 AS valore_magazzino_iva_compr,

  -- Costo Fabbisogno
  CASE
    WHEN (g.quantita + COALESCE(qta_ord.qta_ordinata, 0) + COALESCE(qta_imp.qta_impegnata, 0) - p.scorta_minima) < 0
    THEN (g.quantita + COALESCE(qta_ord.qta_ordinata, 0) + COALESCE(qta_imp.qta_impegnata, 0) - p.scorta_minima) * p.prezzo_magazzino
    ELSE NULL
  END AS costo_fabbisogno,

  p.lead_time_giorni,
  p.transit_time_giorni,

  g.user_id,
  g.ultimo_aggiornamento

FROM giacenza g
INNER JOIN prodotto p ON g.prodotto_id = p.id
INNER JOIN magazzino m ON g.magazzino_id = m.id

-- Qta Ordinata (LEFT JOIN perché può non esserci)
LEFT JOIN (
  SELECT
    dm.prodotto_id,
    mov.magazzino_id,
    mov.user_id,
    SUM(dm.quantita_con_segno) AS qta_ordinata
  FROM dettaglio_movimento dm
  INNER JOIN movimento mov ON dm.movimento_id = mov.id
  WHERE mov.causale = 'ordine_acquisto'
    AND mov.stato IN ('confermato', 'evaso')
    AND mov.deleted_at IS NULL
  GROUP BY dm.prodotto_id, mov.magazzino_id, mov.user_id
) qta_ord ON g.prodotto_id = qta_ord.prodotto_id
         AND g.magazzino_id = qta_ord.magazzino_id
         AND g.user_id = qta_ord.user_id

-- Qta Impegnata (LEFT JOIN)
LEFT JOIN (
  SELECT
    dm.prodotto_id,
    mov.magazzino_id,
    mov.user_id,
    SUM(dm.quantita_con_segno) AS qta_impegnata  -- Sarà negativa
  FROM dettaglio_movimento dm
  INNER JOIN movimento mov ON dm.movimento_id = mov.id
  WHERE mov.causale = 'ordine_vendita'
    AND mov.stato IN ('confermato')
    AND mov.deleted_at IS NULL
  GROUP BY dm.prodotto_id, mov.magazzino_id, mov.user_id
) qta_imp ON g.prodotto_id = qta_imp.prodotto_id
         AND g.magazzino_id = qta_imp.magazzino_id
         AND g.user_id = qta_imp.user_id

WHERE p.deleted_at IS NULL
  AND g.quantita != 0;  -- Filtra righe vuote

CREATE UNIQUE INDEX idx_mv_giacenze_pk ON mv_giacenze_attuali(prodotto_id, magazzino_id, user_id);
CREATE INDEX idx_mv_giacenze_magazzino ON mv_giacenze_attuali(magazzino_id);
CREATE INDEX idx_mv_giacenze_user ON mv_giacenze_attuali(user_id);
CREATE INDEX idx_mv_giacenze_fabbisogno ON mv_giacenze_attuali(qta_fabbisogno) WHERE qta_fabbisogno IS NOT NULL;

-- Refresh automatico (trigger on giacenza, movimento)
```

---

### View: analisi_marginalita
```sql
CREATE MATERIALIZED VIEW mv_analisi_marginalita AS
SELECT
  mov.id AS movimento_id,
  mov.numero,
  mov.data_movimento,
  mov.causale,

  mov.soggetto_id,
  s.ragione_sociale AS soggetto_nome,

  dm.prodotto_id,
  p.codice AS codice_prodotto,
  p.nome AS nome_prodotto,
  p.macrofamiglia_id,
  p.famiglia_id,

  mov.agente,

  -- Quantità
  dm.quantita,
  dm.quantita_con_segno,

  -- Ricavi Vendite (solo causale = 'vendita')
  CASE WHEN mov.causale = 'vendita' THEN dm.valore_imponibile ELSE 0 END AS ricavi_vendite,

  -- Costo Merci (quantità venduta * prezzo magazzino)
  dm.quantita_con_segno * p.prezzo_magazzino AS costo_merci,

  -- Oneri Diretti (provvigioni)
  (COALESCE(mov.provvigione_agente, 0) +
   COALESCE(mov.provvigione_da, 0) +
   COALESCE(mov.provvigione_las, 0) +
   COALESCE(mov.provvigione_dc, 0)) AS oneri_diretti,

  -- Gross Margin
  CASE WHEN mov.causale = 'vendita'
    THEN dm.valore_imponibile + (dm.quantita_con_segno * p.prezzo_magazzino) -
         (COALESCE(mov.provvigione_agente, 0) + COALESCE(mov.provvigione_da, 0) +
          COALESCE(mov.provvigione_las, 0) + COALESCE(mov.provvigione_dc, 0))
    ELSE NULL
  END AS gm_valore,

  -- GM %
  CASE WHEN mov.causale = 'vendita' AND dm.valore_imponibile != 0
    THEN (dm.valore_imponibile + (dm.quantita_con_segno * p.prezzo_magazzino) -
         (COALESCE(mov.provvigione_agente, 0) + COALESCE(mov.provvigione_da, 0) +
          COALESCE(mov.provvigione_las, 0) + COALESCE(mov.provvigione_dc, 0))) /
         dm.valore_imponibile * 100
    ELSE NULL
  END AS gm_percentuale,

  mov.user_id,
  mov.created_at

FROM movimento mov
INNER JOIN dettaglio_movimento dm ON mov.id = dm.movimento_id
INNER JOIN prodotto p ON dm.prodotto_id = p.id
LEFT JOIN soggetto s ON mov.soggetto_id = s.id

WHERE mov.causale IN ('vendita', 'acquisto')
  AND mov.deleted_at IS NULL
  AND mov.stato != 'annullato';

CREATE INDEX idx_mv_marginalita_data ON mv_analisi_marginalita(data_movimento);
CREATE INDEX idx_mv_marginalita_soggetto ON mv_analisi_marginalita(soggetto_id);
CREATE INDEX idx_mv_marginalita_prodotto ON mv_analisi_marginalita(prodotto_id);
CREATE INDEX idx_mv_marginalita_user ON mv_analisi_marginalita(user_id);
```

---

### View: scadenzario_attivo_passivo
```sql
CREATE MATERIALIZED VIEW mv_scadenzario AS
SELECT
  s.id,
  s.tipo,
  s.data_scadenza,
  s.importo,
  s.importo_pagato,
  s.importo_residuo,
  s.stato,

  -- Categorizza scadenze
  CASE
    WHEN s.stato = 'pagato' THEN 'pagato'
    WHEN s.data_scadenza < CURRENT_DATE THEN 'scaduto'
    WHEN s.data_scadenza BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days' THEN 'in_scadenza_7gg'
    WHEN s.data_scadenza BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days' THEN 'in_scadenza_30gg'
    ELSE 'futuro'
  END AS categoria_scadenza,

  -- Giorni alla scadenza
  s.data_scadenza - CURRENT_DATE AS giorni_a_scadenza,

  -- Giorni di ritardo (se scaduto)
  CASE
    WHEN s.data_scadenza < CURRENT_DATE AND s.stato != 'pagato'
    THEN CURRENT_DATE - s.data_scadenza
    ELSE NULL
  END AS giorni_ritardo,

  s.movimento_id,
  mov.numero AS numero_documento,
  mov.causale,

  s.soggetto_id,
  sog.ragione_sociale,
  sog.telefono,
  sog.email,

  s.user_id,
  s.created_at

FROM scadenza s
INNER JOIN movimento mov ON s.movimento_id = mov.id
INNER JOIN soggetto sog ON s.soggetto_id = sog.id

WHERE s.stato != 'pagato'
  AND mov.deleted_at IS NULL;

CREATE INDEX idx_mv_scadenzario_tipo ON mv_scadenzario(tipo);
CREATE INDEX idx_mv_scadenzario_categoria ON mv_scadenzario(categoria_scadenza);
CREATE INDEX idx_mv_scadenzario_data ON mv_scadenzario(data_scadenza);
CREATE INDEX idx_mv_scadenzario_user ON mv_scadenzario(user_id);
```

---

## 🚀 PIANO IMPLEMENTAZIONE FINALE CON PRIORITÀ

### FASE 1: FONDAMENTA (2-3 settimane) - PRIORITÀ MASSIMA

**1.1 Unificare e Completare Anagrafiche**
- [ ] Merge `clienti` + `fornitori` → `soggetto` unificato
- [ ] Migration dati esistenti con script SQL
- [ ] Estendere con 20+ campi mancanti (listino, tipo_pagamento, provvigioni, IBAN, etc)
- [ ] Estendere `prodotto` con campi logistici (packaging, lead time, scorta_min)
- [ ] Campo `specifiche JSONB` per flessibilità
- [ ] Update form React con tutti i campi nuovi
- [ ] Validazioni Zod aggiornate

**1.2 Tabelle Configurazione**
- [ ] `listino`, `prezzo_listino` (35+ listini come Excel)
- [ ] `tipo_pagamento`, `aliquota_iva`
- [ ] `brand`, `macrofamiglia`, `famiglia`, `categoria`
- [ ] `centro_costo`, `valuta`
- [ ] CRUD pages per ogni configurazione
- [ ] Seed data (almeno IVA 22%, valute EUR/USD)

**1.3 Magazzino Base**
- [ ] Tabella `magazzino`
- [ ] Tabella `giacenza` (prodotto × magazzino)
- [ ] Seed con magazzini esistenti (Sprint, Seritalia, New Generation)
- [ ] CRUD magazzini
- [ ] Page giacenze con filtri

---

### FASE 2: TRANSAZIONI UNIFICATE (3-4 settimane) - PRIORITÀ ALTA

**2.1 Modello Unificato `movimento`**
- [ ] Creare tabella `movimento` (sostituisce `ordini`)
- [ ] Creare tabella `dettaglio_movimento` (sostituisce `dettagli_ordini`)
- [ ] Migration da `ordini` → `movimento` (tipo='ordine', causale='ordine_vendita/acquisto')
- [ ] Migration da `dettagli_ordini` → `dettaglio_movimento`

**2.2 Estendere con Tutte le Causali**
- [ ] Supporto causali: `vendita`, `acquisto`, `bolla_accompagnamento`, `nota_credito`, `costo_esercizio`, `rettifica`
- [ ] Workflow stati per ogni causale
- [ ] Numerazione progressiva per tipo documento

**2.3 Gestione Movimenti Magazzino**
- [ ] Tabella `movimento_magazzino` (storico)
- [ ] Trigger automatico: movimento confermato → aggiorna giacenze
- [ ] Logica quantità_con_segno (positivo=carico, negativo=scarico)

**2.4 UI Transazioni**
- [ ] Refactor pagine ordini per usare `movimento`
- [ ] Nuove pages: Fatture, Bolle, Note Credito, Costi Esercizio
- [ ] Form unificato con campi condizionali per tipo
- [ ] Gestione IVA completa (aliquote, regime, imponibilità)
- [ ] Gestione provvigioni (4 tipologie)

---

### FASE 3: SCADENZARIO E PAGAMENTI (2 settimane) - PRIORITÀ ALTA

**3.1 Struttura Scadenzario**
- [ ] Tabella `scadenza`
- [ ] Tabella `pagamento`
- [ ] Trigger: fattura confermata → genera scadenze automatiche (in base a tipo_pagamento)
- [ ] Calcolo data scadenza (data_emissione + giorni_pagamento)
- [ ] Supporto rate multiple (es: 30-60-90 gg)

**3.2 UI Scadenzario**
- [ ] Page scadenzario con filtri (attivo/passivo, scaduto/da_scadere)
- [ ] Registrazione pagamenti (form)
- [ ] Riconciliazione automatica (importo_pagato aggiorna stato)
- [ ] Dashboard finanziario (cards: scaduto, in scadenza 7gg, in scadenza 30gg)

**3.3 Alert Automatici**
- [ ] Email notification su scadenze imminenti (cron job)
- [ ] Alert su scaduto > 30 giorni

---

### FASE 4: ANALYTICS NATIVI (3 settimane) - PRIORITÀ ALTA

**4.1 Materialized Views**
- [ ] `mv_giacenze_attuali` (replica misure DAX magazzino)
- [ ] `mv_analisi_marginalita` (replica misure DAX marginalità)
- [ ] `mv_scadenzario` (pre-aggregazione scadenze)
- [ ] Cron job per refresh views (ogni ora o su trigger)

**4.2 Dashboard Giacenze** (priorità #1 da Power BI)
- [ ] Cards KPI: Valore Magazzino, Qta Giacenza, Qta Ordinata, Qta Impegnata
- [ ] Tabella dettaglio prodotti con tutte le colonne
- [ ] Grafico: Top 10 prodotti per valore
- [ ] Grafico: Giacenze per famiglia (stacked bar)
- [ ] Filtri: Macrofamiglia, Famiglia, Magazzino, Data

**4.3 Dashboard Marginalità** (priorità #1 da Power BI)
- [ ] Cards KPI: Ricavi, GM Valore, GM %, Costo Merci
- [ ] Waterfall Chart: Ricavi → COGS → Oneri → GM
- [ ] Tabella: Marginalità per prodotto/cliente
- [ ] Scatter Plot: Volume vs Margine
- [ ] Trend line: GM% nel tempo
- [ ] Filtri: Data, Cliente, Prodotto, Agente

**4.4 Dashboard Fabbisogni** (priorità #2 da Power BI)
- [ ] Card: Totale Fabbisogno €
- [ ] Card: N° Articoli sotto scorta
- [ ] Tabella: Prodotti con fabbisogno negativo (alert rosso)
- [ ] Colonne: Giacenza, Ordinato, Impegnato, Scorta Min, Fabbisogno, Costo, Lead Time
- [ ] Heatmap: Sottoscorta per famiglia
- [ ] Filtri: Famiglia, Fornitore, Lead Time

**4.5 Dashboard Commerciale**
- [ ] Cards: Ricavi MTD, N° Ordini, Ticket Medio
- [ ] Top 10 Clienti (bar chart)
- [ ] Top 10 Prodotti (bar chart)
- [ ] Performance Agenti (tabella)
- [ ] Trend vendite (line chart mensile)

**4.6 Dashboard Finanziario**
- [ ] Cards: Scaduto, In Scadenza 7gg, In Scadenza 30gg
- [ ] Grafico: Cash Flow projection
- [ ] Tabella: Lista scadenze con priorità
- [ ] DSO (Days Sales Outstanding)

**4.7 Libreria Grafici**
- [ ] Setup Recharts o Chart.js
- [ ] Componenti riutilizzabili: LineChart, BarChart, PieChart, WaterfallChart, ScatterPlot, Heatmap
- [ ] Responsive design
- [ ] Export PNG/SVG

---

### FASE 5: TRASFERIMENTI MAGAZZINO (1 settimana) - PRIORITÀ MEDIA

**5.1 Struttura**
- [ ] Supporto `causale = 'trasferimento'` in `movimento`
- [ ] Dettagli con `magazzino_origine` e `magazzino_destino`
- [ ] Doppia movimentazione automatica (trigger):
  - Trasferimento confermato → 2 record in `movimento_magazzino` (scarico origine + carico destino)

**5.2 UI**
- [ ] Page trasferimenti (nuovo, lista, dettaglio)
- [ ] Form con selezione magazzini origine/destino
- [ ] Validazione: giacenza sufficiente in origine

---

### FASE 6: PDF GENERATOR (1 settimana) - PRIORITÀ MEDIA

**6.1 Libreria**
- [ ] Setup react-pdf o jsPDF o Puppeteer
- [ ] Template base con header/footer azienda

**6.2 Template Documenti**
- [ ] PDF Ordine Cliente
- [ ] PDF Ordine Fornitore
- [ ] PDF Fattura
- [ ] PDF Bolla Accompagnamento
- [ ] PDF DDT (Documento Trasporto)
- [ ] Logo e personalizzazione

**6.3 Funzionalità**
- [ ] Preview inline
- [ ] Download PDF
- [ ] Invio email PDF allegato

---

### FASE 7: CONTABILITÀ PARTITA DOPPIA (3 settimane) - PRIORITÀ MEDIA-BASSA

**7.1 Piano dei Conti**
- [ ] Tabella `piano_conti` (gerarchico)
- [ ] Seed con Piano dei Conti standard italiano (CEE)
- [ ] CRUD conti
- [ ] UI gerarchia (tree view)

**7.2 Movimenti Contabili**
- [ ] Tabella `movimento_contabile`
- [ ] Trigger automatici:
  - Fattura confermata → genera movimenti Dare/Avere
  - Pagamento → movimenti Cassa/Banca
- [ ] Vincolo: totale Dare = totale Avere (constraint o check)

**7.3 Report Contabili**
- [ ] Prima Nota (lista movimenti cronologica)
- [ ] Mastrini (saldi per conto)
- [ ] Bilancio di verifica
- [ ] Stato Patrimoniale (aggregato)
- [ ] Conto Economico (aggregato)
- [ ] Filtri per periodo

---

### FASE 8: SISTEMA PROVVIGIONI (1 settimana) - PRIORITÀ BASSA

**8.1 Struttura**
- [ ] Tabella `tipologia_provvigione`
- [ ] Tabella `agente` (estensione di `soggetto` oppure separata)
- [ ] Seed 4 tipologie: Agente, Dir. Acquisti, Logistica/Amm, Dir. Commerciale
- [ ] Calcolo automatico provvigioni su movimento (trigger o server action)

**8.2 UI**
- [ ] Anagrafica agenti con percentuali
- [ ] Assegnazione provvigioni a documento
- [ ] Report provvigioni maturate (per agente, per periodo)
- [ ] Registrazione pagamenti provvigioni

---

### FASE 9: TIME INTELLIGENCE E ANALYTICS AVANZATI (2 settimane) - PRIORITÀ BASSA

**9.1 Nuove Misure**
- [ ] YoY (Year over Year)
- [ ] MoM (Month over Month)
- [ ] YTD (Year to Date)
- [ ] Moving Average 3/6/12 mesi
- [ ] Forecast vendite (algoritmo ARIMA o ML semplice)

**9.2 Dashboard Executive**
- [ ] Vista sintetica 1 pagina
- [ ] KPI principali: Ricavi MTD vs Target, GM%, Valore Magazzino, DSO
- [ ] Trend ultimi 12 mesi
- [ ] Top 5 Clienti/Prodotti

---

### FASE 10: OTTIMIZZAZIONI E POLISH (continuo)

**10.1 Performance**
- [ ] Analisi query slow (pg_stat_statements)
- [ ] Aggiungere indici dove necessario
- [ ] Ottimizzare views materializzate
- [ ] Caching Redis per listini (aggiornati raramente)

**10.2 UX**
- [ ] Loading states
- [ ] Error handling
- [ ] Toast notifications
- [ ] Skeleton loaders
- [ ] Responsive mobile

**10.3 Testing**
- [ ] Unit tests server actions
- [ ] E2E tests Playwright
- [ ] Test RLS policies

---

## 🎯 RIEPILOGO PRIORITÀ ASSOLUTE

### 🔴 MUST HAVE (primi 2 mesi)

1. **Anagrafiche Complete** (soggetto, prodotto, configurazioni)
2. **Sistema Transazioni Unificato** (movimento con tutte causali)
3. **Magazzino Multi-sede** (giacenze, movimenti)
4. **Scadenzario** (generazione automatica, pagamenti)
5. **Dashboard Giacenze** (KPI + tabelle + grafici)
6. **Dashboard Marginalità** (GM%, COGS, Oneri)
7. **Dashboard Fabbisogni** (MRP-like, alert sottoscorta)

### 🟡 NICE TO HAVE (mesi 3-4)

8. PDF Generator
9. Dashboard Commerciale
10. Dashboard Finanziario
11. Trasferimenti Magazzino UI completa

### 🟢 FUTURE ENHANCEMENTS (mesi 5+)

12. Contabilità Partita Doppia completa
13. Sistema Provvigioni avanzato
14. Time Intelligence (YoY, forecast)
15. Budget vs Consuntivo

---

## 📋 CHECKLIST GO-LIVE

- [ ] Tutte le tabelle FASE 1-4 create e popolate
- [ ] RLS policies configurate
- [ ] Migration dati da Excel completata
- [ ] 3 dashboard principali funzionanti (Giacenze, Marginalità, Fabbisogni)
- [ ] PDF generator base (almeno Ordini e Fatture)
- [ ] Training utenti completato
- [ ] Backup automatici configurati
- [ ] Monitoring performance attivo
- [ ] Excel archiviato, Power BI disattivato

---

**PROSSIMO PASSO:** Iniziare con FASE 1.1 - Unificare Anagrafiche? 🚀
