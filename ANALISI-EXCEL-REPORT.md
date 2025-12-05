# 📊 ANALISI COMPLETA FILE EXCEL "Gestionale G Group collegato BI"

## 🎯 OVERVIEW

**File:** Gestionale G Group collegato BI.xlsx
**Totale Fogli:** 19
**Complessità:** Enterprise-level con oltre 700.000 formule totali
**Destinazione:** Migrazione completa su **ALL IN ONE** (Next.js + Supabase)

---

## 📋 STRUTTURA FOGLI PER CATEGORIA

### 📦 TRANSAZIONI (11 fogli) - **CORE DEL BUSINESS**

| # | Nome Foglio | Righe | Colonne | Formule | Note |
|---|-------------|-------|---------|---------|------|
| 1 | **DataBase Movimenti** | 5001 | 67 | 187,058 | **MASTER** - Tutti i movimenti aziendali |
| 2 | Dare - Avere | 4100 | 13 | 25,173 | Contabilità Partita Doppia |
| 3 | Trasfer.Magazz. | 5001 | 13 | 34,012 | Trasferimenti tra magazzini |
| 4 | Listini | 1021 | 37 | 13,118 | Prezzi prodotti per cliente |
| 5 | Budget | 5000 | 18 | 50,067 | Budget previsionali |
| 6 | Budget x Art | 1021 | 15 | 3,091 | Budget per articolo |
| 7 | Costo-Listini-Provv | 1021 | 37 | 13,118 | Costi + Provvigioni |
| 8 | Articoli | 1020 | 31 | 5,696 | Catalogo prodotti |
| 9 | Anagrafica Articoli | 1031 | 53 | 21,026 | Dettagli completi articoli |
| 10 | PdC | 1830 | 15 | 1,829 | Piano dei Conti contabile |
| 11 | **Database All** | 15001 | 46 | 365,000 | **AGGREGAZIONE TOTALE** |

### 📋 ANAGRAFICHE (4 fogli)

| # | Nome Foglio | Righe | Colonne | Formule | Note |
|---|-------------|-------|---------|---------|------|
| 1 | **Debitori - Creditori** | 401 | 31 | 400 | Clienti + Fornitori + Altro |
| 2 | Costi-Listini-Margini | 986 | 20 | 40,583 | Calcolo margini |
| 3 | Allegato Noli - PLT CAP | 119 | 2 | 112 | Costi trasporto/nolo |
| 4 | Simulaz.costi a mag | 114 | 6 | 2,661 | Simulazioni costi |

### 📄 REPORT/FORM (2 fogli) - **PER STAMPA**

| # | Nome Foglio | Righe | Colonne | Note |
|---|-------------|-------|---------|------|
| 1 | Ordine-Fattura | 33 | - | Template stampa Ordini/Fatture |
| 2 | Bolla Trasf. | 32 | 2 | Template Bolle Trasferimento |

### ⚙️ CONFIGURAZIONI/UTILITY (2 fogli)

| # | Nome Foglio | Righe | Colonne | Note |
|---|-------------|-------|---------|------|
| 1 | Tabella Cambi-Quotazioni | 7 | 8 | Valute e cambi |
| 2 | Tabella Trasporti | 8 | 25 | Vettori e costi trasporto |

---

## 🔍 ANALISI DETTAGLIATA FOGLI CHIAVE

### 1. **DataBase Movimenti** (MASTER - 5001 righe × 67 colonne)

Il foglio CENTRALE del gestionale. Registra TUTTI i movimenti aziendali.

**Colonne principali (67 totali):**

**Intestazione Movimento:**
- Data movimento, Data Scadenza, ETD (Carry Out)
- Causale movimento (Acquisto, Vendita, Ordine Attivo, Ordine Passivo, Costi di Esercizio, etc.)
- Tipo movimento (Carico/Scarico)
- n° documento
- Note

**Soggetti:**
- Cod (codice soggetto)
- Soggetto (nome cliente/fornitore)
- Collegamenti → **Debitori - Creditori**

**Prodotti:**
- Codice Prodotto
- Descrizione Prodotto
- Brand
- Famiglia di prodotto (Costi Merci, Ricavi Merci, Costi)
- Collegamenti → **Anagrafica Articoli**

**Logistica:**
- Centro di Costo
- Magazzino
- Vettore
- Termini di Resa
- Quantità, Unità di misura
- Somma Pedane (manuale)
- Costo Trasporto
- Collegamenti → **Tabella Trasporti**

**Pricing:**
- Listino di Riferimento
- Valuta
- Prezzo da Listino
- Prezzo effettivo
- Sconto %
- Prezzo Imponibile
- Valore Imponibile
- Collegamenti → **Costi-Listini-Margini**

**IVA e Fiscalità:**
- Imponibilità (Ordinaria, Iva Esente)
- Flag "X se no Iva"
- Valore Iva Compresa
- Aliquota IVA

**Pagamenti:**
- Tipo Pagamento (B/B a Vista merce, etc.)
- GG. Pagamento
- Mese Scadenza
- Valore Pagamento
- Data Pagamento
- Flag "Contabilità"

**Provvigioni (4 tipologie):**
1. **Agente** (%, Valore, Provvigione pagata)
2. **Direzione Acquisti** (%, Valore, Provvigione pagata)
3. **Logistica, Amm. & Spedizioni** (%, Valore, Provvigione pagata)
4. **Direzione Commerciale** (%, Valore, Provvigione pagata)

**Altri Costi:**
- Data Altri Costi
- Altri Costi Valore
- Pagati altri Costi
- Descrizione Altri Costi

**Campi Calcolati:**
- Campo Regione
- Campo CRT x PED (cartoni per pedana)
- Campo n°Pedane
- Riga trovata, Valore trovato

**Formule:** 187,058 (la maggior parte VLOOKUP per auto-compilamento da altri fogli)

---

### 2. **Dare - Avere** (Contabilità - 4100 righe × 13 colonne)

Sistema contabile **partita doppia** (Dare/Avere).

**Colonne:**
- ID
- Cod.Movimento
- Tipo Movimento (Movimento Contabile / Movimento non Contabile)
- Data movimento
- Causale movimento (Dare / Avere)
- Causale Economica esente Iva
- Descrizione Movimento
- Cod, Soggetto (da **Debitori - Creditori**)
- n° documento
- Valuta
- Valore
- **Valore (con segno -/+)** → Positivo per Dare, Negativo per Avere

**Esempi di movimenti:**
- Dazione Capitale
- Bonifici
- Pagamenti fornitori
- Incassi clienti
- Movimenti bancari/cassa

---

### 3. **Trasfer.Magazz.** (5001 righe × 13 colonne)

Gestione trasferimenti merci **tra magazzini** multipli.

**Colonne:**
- ID
- Prodotto, Descrizione Prodotto
- Data movimento
- Causale movimento:
  - **Trasferimento Scarico** (magazzino di partenza)
  - **Trasferimento Carico** (magazzino di arrivo)
- da / a (flag "da" o "a")
- Cod, Magazzino
- Soggetto (nome magazzino)
- n° documento
- Unità, Quantità
- **Quantità (con segno -/+)** → Negativo per scarico, positivo per carico

**Logica:**
Ogni trasferimento crea **2 righe**:
1. Scarico dal magazzino A (quantità negativa)
2. Carico nel magazzino B (quantità positiva)

---

### 4. **Debitori - Creditori** (Anagrafica - 401 righe × 31 colonne)

Anagrafica **unificata** di clienti, fornitori e altri soggetti.

**Colonne principali:**
- Cod (codice univoco)
- Codice cliente/fornitore (codici specifici)
- Soggetto (nome/ragione sociale)
- Indirizzo, CAP, Città, Provincia, Nazione
- P.IVA, Codice Fiscale
- Email, PEC
- Telefono, Fax
- Persona di riferimento
- Tipo Pagamento di default
- Listino di riferimento
- Valuta
- Note
- Campi aggiuntivi (IBAN, SWIFT, etc.)

**Tipologie soggetti:**
- Clienti (Cl...)
- Fornitori (Fo...)
- Altro (Cs = Cassa/Assegni, Pt = Patrimonio, etc.)

---

### 5. **Anagrafica Articoli** (1031 righe × 53 colonne)

Catalogo completo prodotti con **53 campi** (!)

**Categorie colonne:**

**Identificazione:**
- Codice prodotto (UNIQUE)
- Nome/Descrizione estesa
- Brand
- Famiglia, Categoria
- Modello

**Specifiche Tecniche:**
- Materiale (es: TNT - Tessuto Non Tessuto)
- Tipo (Medium, Rigid, etc.)
- Grammatura (GSM)
- Dimensioni (es: 30x40)
- Colore
- Layout/Stampa

**Logistica:**
- Unità di misura (CRT = cartoni, PZ = pezzi, etc.)
- Pezzi per cartone (CRT x PED)
- Cartoni per pedana
- Peso

**Pricing:**
- Prezzo acquisto
- Prezzi vendita multipli (per diversi listini)
- Costi accessori

**Gestione:**
- Fornitore principale
- Tempo di approvvigionamento
- Giacenza minima
- Note

---

### 6. **Listini** e **Costo-Listini-Provv** (1021 righe × 37 colonne)

Matrice prezzi **prodotto × listino**.

**Colonne:**
- Codice prodotto
- Nome prodotto
- Fino a 35+ listini differenti (uno per colonna)
- Ogni cella = prezzo per quel prodotto in quel listino

**Costo-Listini-Provv** aggiunge:
- % provvigioni per listino
- Margini calcolati

---

### 7. **Budget** (5000 righe × 18 colonne)

Budget previsionali per periodo.

**Colonne:**
- Data
- Mese, Anno
- Prodotto, Categoria
- Quantità prevista
- Valore previsto
- Confronto con consuntivo
- Scostamenti

---

### 8. **PdC** - Piano dei Conti (1830 righe × 15 colonne)

Piano contabile gerarchico.

**Colonne:**
- Codice conto
- Descrizione
- Categoria (Attivo, Passivo, Ricavi, Costi, Patrimonio Netto)
- Sottocategoria
- Livello gerarchico
- Saldo iniziale
- Movimenti
- Saldo finale

---

### 9. **Database All** (15001 righe × 46 colonne)

Aggregazione/consolidamento di TUTTI i dati.
Probabilmente usato come **sorgente per Power BI**.

---

## 🔗 RELAZIONI TRA FOGLI

### Dipendenze principali:

```
DataBase Movimenti (MASTER)
├── → Debitori - Creditori (soggetti)
├── → Anagrafica Articoli (prodotti)
├── → Costi-Listini-Margini (prezzi)
└── → Tabella Trasporti (logistica)

Dare - Avere (Contabilità)
└── → Debitori - Creditori (soggetti)

Trasfer.Magazz.
└── → Anagrafica Articoli (prodotti)

Ordine-Fattura (Form)
├── → DataBase Movimenti (dati ordine)
└── → Debitori - Creditori (intestazione)

Listini, Costo-Listini-Provv
└── → Anagrafica Articoli (prodotti)

Budget, Budget x Art
└── → Anagrafica Articoli (prodotti)
```

---

## 🎯 WORKFLOW IDENTIFICATI

### 1. **Ciclo Ordini/Acquisti**
- Inserimento in **DataBase Movimenti** (causale: Ordine Attivo/Passivo)
- Auto-compilamento dati da anagrafiche
- Calcolo automatico prezzi da listini
- Gestione scadenze pagamento
- Tracking stato ordine

### 2. **Gestione Magazzino**
- Carico merci (Acquisto)
- Scarico merci (Vendita, Bolla di Accompagnamento)
- Trasferimenti tra magazzini (Trasfer.Magazz.)
- Rettifiche inventario (Rettifica positiva/negativa)
- Scarico campioni

### 3. **Contabilità Partita Doppia**
- Registrazione movimenti in **Dare - Avere**
- Collegamento a Piano dei Conti (**PdC**)
- Gestione IVA multipla
- Scadenzario pagamenti/incassi
- Riconciliazione bancaria

### 4. **Gestione Provvigioni**
- 4 tipologie di provvigioni tracked per ogni movimento
- Calcolo automatico % e valore
- Tracking pagamenti provvigioni

### 5. **Pricing Dinamico**
- Listini multipli per cliente
- Sconti personalizzati
- Gestione multi-valuta
- Calcolo margini in tempo reale

### 6. **Budgeting e Forecasting**
- Budget per prodotto/categoria
- Confronto budget vs consuntivo
- Analisi scostamenti

---

## 📊 CAUSALI MOVIMENTO RILEVATE

Da **DataBase Movimenti**:

**Ordini:**
- Ordine Attivo (vendita)
- Ordine Passivo (acquisto)

**Movimenti Magazzino:**
- Acquisto (carico)
- Vendita (scarico)
- Bolla di Accompagnamento (scarico)
- Scarico campioni
- Rettifica positiva (carico)
- Rettifica negativa (scarico)

**Documenti Fiscali:**
- Fattura (implicita da Vendita)
- Nota di Credito (storno)

**Altri:**
- Costi di Esercizio
- Trasferimento Magazzino (foglio dedicato)

---

## 🎨 CAMPI SPECIFICI AZIENDALI

### Logistica/Trasporti
- **CRT x PED**: Cartoni per pedana (unità logistica)
- **Somma Pedane**: Calcolo automatico pedane necessarie
- **Costo Trasporto**: per spedizione
- **Vettore**: corriere utilizzato
- **Termini di Resa**: Incoterms (es: EXW, FOB)
- **ETD (Estimated Time of Departure)**: per export

### Provvigioni
- **Agente commerciale**
- **Direzione Acquisti**
- **Logistica, Amministrazione & Spedizioni**
- **Direzione Commerciale**

Ogni provvigione ha: % - Valore calcolato - Flag "pagata"

### Gestione Magazzini Multipli
Magazzini rilevati:
- Sprint
- Seritalia
- New Generation
- (altri probabilmente presenti)

### Prodotti Specifici
Settore: **Packaging TNT (Tessuto Non Tessuto)**
- Sacchetti TNT vari colori/dimensioni
- Portabottiglie
- Grammature: 60GSM, 70GSM
- Dimensioni standard: 30x40, 17x40
- Possibilità stampa personalizzata (Layout Stampa Cliente)

---

## 🔢 STATISTICHE COMPLESSITÀ

- **Totale righe con dati:** ~42,000
- **Totale formule:** ~762,000
- **Fogli interconnessi:** 19
- **Relazioni VLOOKUP:** Centinaia di migliaia
- **Listini gestiti:** 35+
- **Valute:** EUR + altre
- **Aliquote IVA:** Multipla (22%, esente, etc.)

---

## 🚀 COSA SERVE IMPLEMENTARE IN "ALL IN ONE"

### ✅ GIÀ IMPLEMENTATO
- Clienti/Fornitori (→ Debitori - Creditori)
- Prodotti (→ Anagrafica Articoli parziale)
- Ordini Vendita/Acquisto (→ parte di DataBase Movimenti)
- Autenticazione multi-utente
- Dati geografici italiani

### ❌ DA IMPLEMENTARE (PRIORITÀ)

#### 1. **DataBase Movimenti → Sistema Transazioni Completo**
- Fatture (Vendita/Acquisto)
- Bolle di Accompagnamento
- Note di Credito
- Costi di Esercizio
- Movimenti vari

#### 2. **Contabilità Partita Doppia**
- Tabella **movimenti_contabili** (Dare/Avere)
- Piano dei Conti gerarchico
- Mastri, Conti, Sottoconti
- Scadenzario integrato
- Riconciliazione bancaria

#### 3. **Gestione Magazzino Avanzata**
- Multi-magazzino
- Trasferimenti tra magazzini
- Giacenze in tempo reale
- Movimentazioni (carico/scarico/rettifiche)
- Inventari fisici
- Valorizzazione magazzino

#### 4. **Sistema Listini e Pricing**
- Listini multipli per cliente
- Gestione sconti a livelli
- Prezzi a scaglioni (quantità)
- Listini con validità temporale
- Multi-valuta con cambio automatico

#### 5. **Sistema Provvigioni**
- 4 tipologie provvigioni configurabili
- Calcolo automatico su transazioni
- Tracking pagamenti provvigioni
- Report provvigioni per agente/periodo

#### 6. **Budgeting e Forecasting**
- Budget per periodo/prodotto/categoria
- Confronto budget vs consuntivo
- Dashboard scostamenti
- Alerting soglie

#### 7. **Sistema Pagamenti/Scadenze**
- Scadenzario attivo/passivo
- Gestione rate multiple
- Solleciti automatici
- Riconciliazione pagamenti

#### 8. **Gestione IVA Complessa**
- Aliquote multiple
- Regimi speciali
- Split payment
- Reverse charge
- Report liquidazione IVA

#### 9. **Logistica Avanzata**
- Gestione spedizioni
- Costi trasporto
- Tracking vettori
- Calcolo pedane/volumetria
- Incoterms

#### 10. **Analytics Nativi (sostituzione Power BI)**
- Dashboard vendite
- Dashboard acquisti
- Dashboard marginalità
- Dashboard magazzino
- Dashboard finanziario
- Dashboard provvigioni
- Report custom

#### 11. **PDF Generator**
- Ordini (cliente/fornitore)
- Fatture accompagnatorie
- Bolle trasferimento
- DDT
- Template personalizzabili

#### 12. **Configurazioni**
- Codici Pagamento
- Codici IVA
- Categorie prodotti/costi
- Causali movimento
- Centri di costo
- Unità di misura

---

## 🎯 NEXT STEPS

1. ✅ **Analisi Excel completata**
2. ⏳ **Analisi Power BI** (4 file .pbix con Claude Desktop + MCP)
3. ⏳ **Creazione lista priorità** completa
4. ⏳ **Design schema database** esteso
5. ⏳ **Implementazione incrementale** funzionalità

---

## 💡 NOTE TECNICHE

### Complessità Migrazione
- **Alta:** 700K+ formule da convertire in logica applicativa
- **Relazioni complesse:** Fogli fortemente interconnessi
- **Calcoli real-time:** Necessari per prezzi, provvigioni, margini
- **Multi-valuta:** Gestione tassi di cambio
- **Multi-magazzino:** Tracking giacenze distribuite

### Architettura Consigliata
- **Database:** PostgreSQL (Supabase) con views materializzate per performance
- **Server Actions:** Per calcoli complessi lato server
- **Caching:** Redis per listini e calcoli frequenti
- **Real-time:** Supabase Realtime per aggiornamenti giacenze
- **Background Jobs:** Per ricalcoli batch (es: budget, scostamenti)

---

**Report generato:** $(date)
**File analizzato:** Gestionale G Group collegato BI.xlsx
**Destinazione:** ALL IN ONE - Next.js 15 + Supabase + TypeScript
