# 🎯 STRATEGIA OTTIMIZZAZIONE - ALL IN ONE

## 📊 CONFRONTO: Gestionale Attuale vs Excel

### ✅ COSA È GIÀ IMPLEMENTATO (Analisi Gap)

#### 1. **Clienti** (Gestionale) vs **Debitori - Creditori** (Excel)

**Gestionale Attuale:**
```sql
clienti (
  id, ragione_sociale, partita_iva, codice_fiscale,
  email, telefono, indirizzo, citta, cap, provincia,
  note, user_id, created_at, updated_at
)
```

**Excel "Debitori - Creditori" (401 righe × 31 colonne):**
- Cod (codice univoco) ❌ MANCA
- Codice cliente/fornitore separati ❌ MANCA
- Tipo soggetto (Cliente/Fornitore/Altro) ❌ MANCA
- Persona di riferimento ❌ MANCA
- **Tipo Pagamento di default** ❌ MANCA
- **Listino di riferimento** ❌ MANCA
- **Valuta** ❌ MANCA
- PEC ❌ MANCA
- Fax ❌ MANCA
- IBAN, SWIFT ❌ MANCA
- Nazione (per export) ❌ MANCA
- **Termini di pagamento (GG)** ❌ MANCA
- Coordinate bancarie complete ❌ MANCA

**VERDETTO:**
- ✅ Struttura base OK
- ❌ Mancano ~20 campi importanti per workflow aziendale
- ❌ Non unificato Clienti/Fornitori (due tabelle separate)

---

#### 2. **Fornitori** (Gestionale) vs **Debitori - Creditori** (Excel)

**Gestionale Attuale:**
```sql
fornitori (
  -- stessa struttura di clienti
)
```

**VERDETTO:**
- ✅ Struttura base OK
- ❌ Stessi campi mancanti dei clienti
- ⚠️ **SPRECO:** Duplicazione struttura invece di tabella unificata

**OTTIMIZZAZIONE PROPOSTA:**
```sql
-- Unificare in:
soggetti (
  id, codice, tipo (cliente|fornitore|altro),
  ragione_sociale, ...,
  tipo_pagamento_id, listino_id, valuta,
  iban, swift, pec, persona_riferimento,
  termini_pagamento_gg,
  ...
)
```

---

#### 3. **Prodotti** (Gestionale) vs **Anagrafica Articoli** (Excel)

**Gestionale Attuale:**
```sql
prodotti (
  id, codice, nome, descrizione,
  prezzo_acquisto, prezzo_vendita,
  quantita_magazzino, unita_misura,
  fornitore_id, categoria, note
)
```

**Excel "Anagrafica Articoli" (1031 righe × 53 colonne!):**

**Campi MANCANTI (critici):**
- Brand ❌
- Famiglia di prodotto ❌
- Modello ❌
- **Specifiche tecniche (Materiale, Tipo, Grammatura, Dimensioni, Colore)** ❌
- **Logistica (CRT x PED, Pedane, Peso)** ❌
- **Multi-listino (35+ prezzi per listino)** ❌
- Costi accessori ❌
- Tempo approvvigionamento ❌
- Giacenza minima ❌
- Flag "stampa personalizzabile" ❌
- **Magazzino di default** ❌

**VERDETTO:**
- ✅ Struttura base OK
- ❌ Mancano ~40 campi per gestione completa
- ❌ **NO multi-magazzino** (quantita_magazzino singola)
- ❌ **NO multi-listino** (prezzo_vendita singolo)

---

#### 4. **Ordini** (Gestionale) vs **DataBase Movimenti** (Excel)

**Gestionale Attuale:**
```sql
ordini (
  id, numero_ordine, tipo (vendita|acquisto),
  data_ordine, cliente_id, fornitore_id,
  stato (bozza|confermato|evaso|annullato),
  totale, note
)

dettagli_ordini (
  id, ordine_id, prodotto_id,
  quantita, prezzo_unitario, subtotale
)
```

**Excel "DataBase Movimenti" (5001 righe × 67 colonne!):**

**Campi MANCANTI (workflow completi):**

**Logistica:**
- Centro di Costo ❌
- **Magazzino** ❌
- Vettore ❌
- Termini di Resa (Incoterms) ❌
- ETD (data partenza) ❌
- Somma Pedane ❌
- Costo Trasporto ❌

**Pricing avanzato:**
- Listino di riferimento ❌
- Valuta ❌
- Prezzo da Listino vs Prezzo effettivo ❌
- **Sconto %** ❌
- Prezzo Imponibile ❌

**IVA e Fiscalità:**
- Imponibilità (Ordinaria/Esente/etc) ❌
- Aliquota IVA ❌
- Valore IVA ❌
- Flag "escluso IVA" ❌

**Pagamenti:**
- Tipo Pagamento ❌
- **GG Pagamento** ❌
- **Data Scadenza** ❌
- **Mese Scadenza** ❌
- Valore Pagamento ❌
- Data Pagamento ❌
- Flag "Contabilizzato" ❌

**Provvigioni (4 tipologie!):**
- Agente (codice, %, valore, pagata) ❌
- Direzione Acquisti ❌
- Logistica/Amm. ❌
- Direzione Commerciale ❌

**Altri:**
- Data Altri Costi ❌
- Altri Costi Valore ❌
- Descrizione Altri Costi ❌
- Brand prodotto ❌
- Famiglia prodotto ❌
- **Conferma ordine (flag Ove Confermato)** ❌

**VERDETTO:**
- ✅ Struttura base ordini OK (tipo vendita/acquisto separato)
- ✅ Stati ordine OK
- ❌ Mancano ~45 campi per workflow completo
- ❌ **NO causali multiple** (solo Ordine, mancano: Fattura, Bolla, Nota Credito, Costi Esercizio)
- ❌ **NO gestione IVA**
- ❌ **NO provvigioni**
- ❌ **NO scadenzario**

---

### ❌ COSA NON È IMPLEMENTATO (DA ZERO)

#### 1. **Contabilità Partita Doppia** → "Dare - Avere" (Excel)
**Priorità: ALTA**

```sql
-- DA CREARE
movimenti_contabili (
  id, data_movimento, causale (dare|avere),
  causale_economica, descrizione,
  soggetto_id, conto_id,
  numero_documento, valuta,
  importo, importo_con_segno,
  tipo_movimento (contabile|non_contabile)
)

piano_conti (
  id, codice, descrizione,
  categoria (attivo|passivo|ricavi|costi|patrimonio),
  livello, parent_id
)
```

**Workflow:**
- Ogni movimento genera automaticamente Dare + Avere
- Collegamenti al Piano dei Conti
- Bilancio automatico (Attivo = Passivo)

---

#### 2. **Magazzino Multi-sede + Trasferimenti** → "Trasfer.Magazz." (Excel)
**Priorità: ALTA**

```sql
-- DA CREARE
magazzini (
  id, codice, nome, indirizzo, note
)

giacenze (
  id, prodotto_id, magazzino_id,
  quantita, valore_medio,
  ultima_modifica
)

trasferimenti_magazzino (
  id, numero_trasferimento, data,
  magazzino_origine_id, magazzino_destino_id,
  stato (in_preparazione|in_transito|completato)
)

dettagli_trasferimenti (
  id, trasferimento_id, prodotto_id,
  quantita, note
)

movimenti_magazzino (
  id, tipo (carico|scarico|rettifica|trasferimento),
  prodotto_id, magazzino_id,
  quantita, causale, documento_id,
  data_movimento
)
```

**Workflow:**
- Giacenze separate per magazzino
- Trasferimenti creano 2 movimenti (scarico + carico)
- Storico completo movimentazioni
- Valorizzazione FIFO/LIFO/Costo Medio

---

#### 3. **Sistema Listini e Pricing Dinamico** → "Listini" + "Costo-Listini-Provv" (Excel)
**Priorità: ALTA**

```sql
-- DA CREARE
listini (
  id, codice, nome, descrizione,
  valuta, data_inizio, data_fine,
  attivo
)

prezzi_listino (
  id, listino_id, prodotto_id,
  prezzo, sconto_percentuale,
  quantita_minima, quantita_massima
)

-- Collega soggetto a listino
soggetti.listino_id → listini.id

-- Ogni prodotto ha N prezzi (uno per listino)
```

**Workflow:**
- Cliente selezionato → listino associato
- Prodotto aggiunto → prezzo dal listino
- Sconto applicabile su prezzo listino
- Multi-valuta con conversione automatica

---

#### 4. **Sistema Provvigioni** → Colonne in "DataBase Movimenti" (Excel)
**Priorità: MEDIA**

```sql
-- DA CREARE
tipologie_provvigione (
  id, codice, nome
  -- Es: "AG" → "Agente", "DA" → "Direzione Acquisti"
)

agenti (
  id, codice, nome, tipo_provvigione_id,
  percentuale_default
)

provvigioni (
  id, ordine_id, agente_id,
  percentuale, importo_base,
  importo_provvigione,
  data_maturazione, data_pagamento,
  pagata
)
```

**Workflow:**
- Ad ogni ordine si collegano N agenti
- Calcolo automatico provvigioni (% su importo)
- Tracking pagamenti
- Report provvigioni maturate/pagate

---

#### 5. **Scadenzario e Pagamenti** → Campi in "DataBase Movimenti" (Excel)
**Priorità: ALTA**

```sql
-- DA CREARE
tipi_pagamento (
  id, codice, nome,
  giorni_pagamento,
  tipo (contanti|bonifico|riba|rimessa_diretta)
)

scadenze (
  id, tipo (attivo|passivo),
  documento_id, soggetto_id,
  data_emissione, data_scadenza,
  importo, importo_pagato, importo_residuo,
  stato (da_pagare|parzialmente_pagato|pagato|scaduto)
)

pagamenti (
  id, scadenza_id, data_pagamento,
  importo, tipo_pagamento_id,
  note, riferimento
)
```

**Workflow:**
- Documento emesso → scadenze generate automaticamente
- Termini pagamento del cliente (es: 30gg FM)
- Solleciti automatici per scaduto
- Riconciliazione bancaria

---

#### 6. **Budget e Forecasting** → "Budget" + "Budget x Art" (Excel)
**Priorità: BASSA**

```sql
-- DA CREARE
budget (
  id, anno, mese,
  categoria, prodotto_id,
  quantita_prevista, valore_previsto,
  note
)

analisi_scostamenti (
  -- Vista calcolata
  budget vs consuntivo
)
```

**Workflow:**
- Inserimento budget annuale
- Confronto automatico con vendite reali
- Alert su scostamenti > soglia

---

#### 7. **Causali Movimento Multiple** → "DataBase Movimenti" (Excel)
**Priorità: ALTA**

L'Excel gestisce TUTTE le transazioni in un unico foglio con causali:
- Ordine Attivo / Ordine Passivo ✅ (già fatto)
- **Acquisto** (carico magazzino) ❌
- **Vendita** (scarico magazzino) ❌
- **Fattura Accompagnatoria** ❌
- **Bolla di Accompagnamento** ❌
- **Nota di Credito** ❌
- **Costi di Esercizio** ❌
- **Rettifica positiva/negativa** ❌
- **Scarico campioni** ❌

**OTTIMIZZAZIONE:**
Invece di 1 tabella con 67 colonne, **specializzare le tabelle**:

```sql
-- GIÀ ESISTENTE
ordini (tipo: vendita|acquisto, stato: bozza|confermato|evaso)

-- DA AGGIUNGERE
fatture (
  id, numero, data, tipo (vendita|acquisto),
  ordine_id (nullable), soggetto_id,
  totale_imponibile, totale_iva, totale,
  scadenza, stato, note
)

dettagli_fatture (
  id, fattura_id, prodotto_id,
  quantita, prezzo, sconto_percentuale,
  imponibile, aliquota_iva, iva, totale
)

bolle_accompagnamento (
  id, numero, data,
  cliente_id, destinazione,
  causale_trasporto, vettore,
  aspetto_esteriore, numero_colli,
  peso, note
)

dettagli_bolle (...)

note_credito (
  id, numero, data,
  fattura_riferimento_id,
  soggetto_id, causale,
  totale, note
)

costi_esercizio (
  id, data, categoria,
  fornitore_id, descrizione,
  importo, centro_costo_id,
  contabilizzato
)
```

---

#### 8. **Gestione IVA Complessa**
**Priorità: ALTA**

```sql
-- DA CREARE
aliquote_iva (
  id, codice, percentuale,
  descrizione,
  tipo (ordinaria|ridotta|minima|esente|non_imponibile)
)

regimi_iva (
  id, codice, nome
  -- Es: "ORD" → Ordinaria, "SPL" → Split Payment, "REV" → Reverse Charge
)

-- Aggiungi a fatture/ordini
documento.regime_iva_id
dettaglio.aliquota_iva_id
```

---

## 🎯 PIANO OTTIMIZZAZIONE DATABASE

### ❌ PROBLEMI EXCEL (da NON replicare)

1. **Ridondanza massiva:** Stesso dato in N fogli
2. **Denormalizzazione:** "Database All" con 15K righe duplicate
3. **Formule VLOOKUP:** 700K+ formule per join → In SQL sono JOIN nativi
4. **Fogli template:** "Ordine-Fattura", "Bolla Trasf." → In Next.js sono componenti React
5. **Calcoli manuali:** "Somma Pedane (manuale)" → In app diventa automatico
6. **Dati in colonne:** 35+ listini in colonne → In SQL tabella pivot normalizzata

### ✅ SCHEMA OTTIMIZZATO (Design Relazionale)

```
┌──────────────────────────────────────────────────────────────┐
│                    CORE ENTITIES                              │
└──────────────────────────────────────────────────────────────┘

soggetti (unifica clienti + fornitori)
├── tipo (cliente|fornitore|altro)
├── listino_id → listini
├── tipo_pagamento_id → tipi_pagamento
└── valuta

prodotti
├── categoria_id → categorie_prodotto
├── brand_id → brands
├── famiglia_id → famiglie_prodotto
├── fornitore_principale_id → soggetti
└── specifiche_tecniche (JSONB per flessibilità)

magazzini
└── giacenze (pivot prodotti × magazzini)

listini
└── prezzi_listino (pivot prodotti × listini)

┌──────────────────────────────────────────────────────────────┐
│                    TRANSAZIONI                                │
└──────────────────────────────────────────────────────────────┘

ordini (tipo: vendita|acquisto)
├── soggetto_id
├── listino_id
├── magazzino_id
├── dettagli_ordini
│   ├── prodotto_id
│   ├── prezzo_listino, sconto_%, prezzo_finale
│   └── aliquota_iva_id
└── provvigioni

fatture (tipo: vendita|acquisto)
├── ordine_id (nullable)
├── soggetto_id
├── regime_iva_id
├── dettagli_fatture
│   └── aliquota_iva_id
└── scadenze

bolle_accompagnamento
├── fattura_id (nullable)
└── dettagli_bolle

note_credito
└── fattura_riferimento_id

costi_esercizio
├── fornitore_id
└── centro_costo_id

trasferimenti_magazzino
├── magazzino_origine_id
├── magazzino_destino_id
└── dettagli_trasferimenti

┌──────────────────────────────────────────────────────────────┐
│                    CONTABILITÀ                                │
└──────────────────────────────────────────────────────────────┘

piano_conti (gerarchico)
└── movimenti_contabili
    ├── causale (dare|avere)
    ├── conto_id
    ├── soggetto_id
    └── documento_id (polymorphic: fattura|ordine|costo)

scadenzario
├── tipo (attivo|passivo)
├── documento_id (polymorphic)
└── pagamenti

┌──────────────────────────────────────────────────────────────┐
│                    CONFIGURAZIONI                             │
└──────────────────────────────────────────────────────────────┘

tipi_pagamento
aliquote_iva
regimi_iva
categorie_prodotto
famiglie_prodotto
brands
centri_costo
causali_movimento
valute
vettori
unita_misura
```

---

## 🚀 PIANO IMPLEMENTAZIONE A FASI

### FASE 1: COMPLETAMENTO ANAGRAFICHE (Priorità ALTA)
**Tempo stimato: 1-2 settimane**

**1.1 Unificare Clienti/Fornitori → Soggetti**
- [ ] Creare tabella `soggetti` unificata
- [ ] Aggiungere campi mancanti (20+ campi)
- [ ] Migrare dati esistenti
- [ ] Update form con campi nuovi
- [ ] Aggiungere campo `tipo` (cliente|fornitore|altro)

**1.2 Estendere Prodotti**
- [ ] Aggiungere campi tecnici (brand, famiglia, specifiche)
- [ ] Aggiungere campi logistici (CRT x PED, peso, pedane)
- [ ] Campo `specifiche_tecniche` (JSONB flessibile)
- [ ] Campi magazzino (giacenza_minima, tempo_approvvigionamento)

**1.3 Tabelle di Configurazione**
- [ ] `brands` (marchi)
- [ ] `categorie_prodotto`
- [ ] `famiglie_prodotto`
- [ ] `tipi_pagamento`
- [ ] `aliquote_iva`
- [ ] `valute`
- [ ] `unita_misura`
- [ ] `centri_costo`
- [ ] `vettori`

---

### FASE 2: MAGAZZINO MULTI-SEDE (Priorità ALTA)
**Tempo stimato: 2 settimane**

**2.1 Struttura Base**
- [ ] Tabella `magazzini`
- [ ] Tabella `giacenze` (prodotto × magazzino)
- [ ] Tabella `movimenti_magazzino` (storico)
- [ ] Trigger per aggiornamento giacenze automatico

**2.2 Trasferimenti**
- [ ] Tabella `trasferimenti_magazzino`
- [ ] Tabella `dettagli_trasferimenti`
- [ ] CRUD trasferimenti
- [ ] Doppia movimentazione (scarico + carico)

**2.3 UI**
- [ ] Pagina lista magazzini
- [ ] Pagina giacenze per magazzino
- [ ] Pagina trasferimenti (nuovo, lista, dettaglio)
- [ ] Dashboard magazzino (stock, movimenti)

---

### FASE 3: SISTEMA LISTINI (Priorità ALTA)
**Tempo stimato: 1-2 settimane**

**3.1 Struttura**
- [ ] Tabella `listini`
- [ ] Tabella `prezzi_listino` (prodotto × listino)
- [ ] Campo `soggetti.listino_id`
- [ ] Multi-valuta

**3.2 Logica Pricing**
- [ ] Funzione calcolo prezzo (listino + sconti)
- [ ] Validità temporale listini
- [ ] Prezzi a scaglioni quantità

**3.3 UI**
- [ ] Pagina gestione listini
- [ ] Matrice prezzi (prodotto × listino)
- [ ] Import/Export CSV listini

---

### FASE 4: ESTENSIONE ORDINI → TRANSAZIONI COMPLETE (Priorità ALTA)
**Tempo stimato: 3 settimane**

**4.1 Estendere Ordini Esistenti**
- [ ] Aggiungere campi logistici (magazzino, vettore, termini resa)
- [ ] Aggiungere campi pricing (listino, valuta, sconto%)
- [ ] Aggiungere campi IVA (aliquota, regime, imponibilità)
- [ ] Aggiungere campi pagamento (tipo, GG, scadenza)
- [ ] Campo `conferma_ordine` (flag + data)

**4.2 Fatture**
- [ ] Tabella `fatture` (vendita|acquisto)
- [ ] Tabella `dettagli_fatture`
- [ ] CRUD fatture
- [ ] Generazione da ordine
- [ ] Numerazione automatica progressiva
- [ ] Calcolo IVA automatico
- [ ] PDF Generator

**4.3 Bolle di Accompagnamento**
- [ ] Tabella `bolle_accompagnamento`
- [ ] Tabella `dettagli_bolle`
- [ ] CRUD bolle
- [ ] Generazione da ordine/fattura
- [ ] PDF Generator

**4.4 Note di Credito**
- [ ] Tabella `note_credito`
- [ ] Collegamento a fattura originale
- [ ] Storno automatico contabilità
- [ ] PDF Generator

**4.5 Costi di Esercizio**
- [ ] Tabella `costi_esercizio`
- [ ] CRUD costi
- [ ] Collegamenti centri di costo

---

### FASE 5: SCADENZARIO E PAGAMENTI (Priorità ALTA)
**Tempo stimato: 2 settimane**

**5.1 Struttura**
- [ ] Tabella `scadenze` (attivo/passivo)
- [ ] Tabella `pagamenti`
- [ ] Generazione automatica da fatture
- [ ] Calcolo data scadenza (termini pagamento)

**5.2 UI**
- [ ] Pagina scadenzario (filtri: attivo/passivo, scaduti/da scadere)
- [ ] Registrazione pagamenti
- [ ] Dashboard finanziario (cash flow, scaduto)
- [ ] Alert scadenze

**5.3 Riconciliazione**
- [ ] Import estratti conto bancari
- [ ] Match automatico pagamenti

---

### FASE 6: CONTABILITÀ PARTITA DOPPIA (Priorità MEDIA)
**Tempo stimato: 3 settimane**

**6.1 Piano dei Conti**
- [ ] Tabella `piano_conti` (gerarchico)
- [ ] Struttura standard italiana (CEE)
- [ ] CRUD conti

**6.2 Movimenti Contabili**
- [ ] Tabella `movimenti_contabili`
- [ ] Trigger automatici da fatture/ordini/costi
- [ ] Vincolo Dare = Avere (check)

**6.3 UI**
- [ ] Prima Nota (lista movimenti)
- [ ] Mastrini (saldi per conto)
- [ ] Bilancio di verifica
- [ ] Stato Patrimoniale
- [ ] Conto Economico

---

### FASE 7: SISTEMA PROVVIGIONI (Priorità MEDIA)
**Tempo stimato: 1 settimana**

**7.1 Struttura**
- [ ] Tabella `tipologie_provvigione`
- [ ] Tabella `agenti`
- [ ] Tabella `provvigioni`
- [ ] Calcolo automatico da ordini/fatture

**7.2 UI**
- [ ] Anagrafica agenti
- [ ] Assegnazione provvigioni a documento
- [ ] Report provvigioni maturate
- [ ] Registrazione pagamenti provvigioni

---

### FASE 8: BUDGET E FORECASTING (Priorità BASSA)
**Tempo stimato: 1 settimana**

- [ ] Tabella `budget`
- [ ] UI inserimento budget
- [ ] Dashboard confronto budget/consuntivo
- [ ] Analisi scostamenti

---

### FASE 9: ANALYTICS NATIVI (sostituzione Power BI) (Priorità MEDIA-ALTA)
**Tempo stimato: 2-3 settimane**

**9.1 Dashboard Principali**
- [ ] Dashboard Vendite (fatturato, trend, top clienti, top prodotti)
- [ ] Dashboard Acquisti (costi, trend, top fornitori)
- [ ] Dashboard Magazzino (giacenze, rotazione, stock alerts)
- [ ] Dashboard Finanziario (cash flow, scadenzario, incassi/pagamenti)
- [ ] Dashboard Marginalità (margini per prodotto/cliente/categoria)
- [ ] Dashboard Provvigioni (maturate/pagate per agente)

**9.2 Report**
- [ ] Report personalizzabili con filtri
- [ ] Export CSV/Excel
- [ ] Grafici interattivi (Chart.js / Recharts)
- [ ] Drill-down

**9.3 KPI Cards**
- [ ] Fatturato periodo
- [ ] Ordini evasi vs totali
- [ ] Stock value
- [ ] Scaduto
- [ ] Margine %

---

### FASE 10: PDF GENERATOR E STAMPE (Priorità MEDIA)
**Tempo stimato: 1 settimana**

- [ ] Template Ordine Cliente
- [ ] Template Ordine Fornitore
- [ ] Template Fattura
- [ ] Template Bolla Accompagnamento
- [ ] Template DDT
- [ ] Template Nota di Credito
- [ ] Personalizzazione template (logo, intestazione)

---

## 📊 RIEPILOGO PRIORITÀ

### 🔴 PRIORITÀ ALTA (CORE BUSINESS)
1. Completamento Anagrafiche (Soggetti unificati + Prodotti estesi)
2. Magazzino Multi-sede + Trasferimenti
3. Sistema Listini
4. Transazioni complete (Fatture, Bolle, Note Credito, Costi)
5. Scadenzario e Pagamenti
6. Analytics Nativi (Dashboard base)

### 🟡 PRIORITÀ MEDIA
1. Contabilità Partita Doppia
2. Sistema Provvigioni
3. PDF Generator
4. Analytics Avanzati

### 🟢 PRIORITÀ BASSA
1. Budget e Forecasting
2. Funzionalità avanzate (import/export, API esterne)

---

## 💡 OTTIMIZZAZIONI TECNICHE

### 1. **Caching Intelligente**
- Redis per listini (aggiornati raramente, letti spesso)
- Cache giacenze (invalidazione su movimenti)
- Cache KPI dashboard (refresh ogni 5 min)

### 2. **Indexed Views (PostgreSQL)**
```sql
CREATE MATERIALIZED VIEW giacenze_totali AS
SELECT prodotto_id, magazzino_id, SUM(quantita)
FROM movimenti_magazzino
GROUP BY prodotto_id, magazzino_id;

CREATE INDEX idx_giacenze_prodotto ON giacenze_totali(prodotto_id);
```

### 3. **Trigger Automatici**
- Ordine confermato → Genera scadenze
- Fattura salvata → Genera movimenti contabili (Dare/Avere)
- Movimento magazzino → Aggiorna giacenza
- Trasferimento → 2 movimenti (scarico + carico)

### 4. **Soft Delete**
```sql
ALTER TABLE soggetti ADD deleted_at TIMESTAMP;
ALTER TABLE prodotti ADD deleted_at TIMESTAMP;
-- etc
```

### 5. **Audit Log**
```sql
CREATE TABLE audit_log (
  id, table_name, record_id,
  action (insert|update|delete),
  old_values JSONB, new_values JSONB,
  user_id, timestamp
);
```

### 6. **Validazioni Complesse (PostgreSQL Constraints)**
```sql
-- Ordine vendita deve avere cliente
ALTER TABLE ordini ADD CONSTRAINT check_ordine_vendita
CHECK (
  (tipo = 'vendita' AND cliente_id IS NOT NULL) OR
  (tipo = 'acquisto' AND fornitore_id IS NOT NULL)
);

-- Dare = Avere in contabilità
CREATE FUNCTION check_dare_avere() ...
```

---

## 🎯 METRICHE SUCCESSO MIGRAZIONE

### Eliminazione Ridondanza
- **Excel:** 42,000 righe dati + 762,000 formule
- **Target:** ~10 tabelle normalizzate + logica applicativa

### Performance
- **Excel:** Ricalcolo formule lento (secondi/minuti)
- **Target:** Query < 100ms, Dashboard < 2s

### Usabilità
- **Excel:** Utente deve sapere dove cercare (19 fogli)
- **Target:** UI guidata, workflow intuitivi

### Scalabilità
- **Excel:** Limite ~1M righe, performance degrada
- **Target:** PostgreSQL scala a milioni record

### Multi-utente
- **Excel:** File condiviso, conflitti, versioni
- **Target:** Concorrenza nativa, RLS, audit log

### Analytics
- **Power BI:** 4 file .pbix esterni, refresh manuale
- **Target:** Dashboard nativi real-time

---

**Prossimo Step:** Revisione insieme del piano e decisione priorità! 🚀
