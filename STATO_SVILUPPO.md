# Stato Sviluppo Gestionale

Ultimo aggiornamento: 2025-12-04

---

## COMPLETATO

### 1. Architettura Multi-Tenancy
- Tabella `azienda` con piani abbonamento
- Tabella `utente_azienda` per associazione utenti-aziende
- RLS policies su tutte le tabelle con `get_user_azienda_id()`
- Funzione helper per context azienda

### 2. Soggetto Unificato
- Tabella `soggetto` unica per clienti, fornitori, agenti, banche
- Campo `tipo_soggetto_id` (FK a `tipi_soggetto`) - NUOVO SISTEMA
- Campo `tipo[]` array - DEPRECATO ma ancora in uso in alcune query legacy
- Supporto dati geografici con cascade regione → provincia → comune

### 3. Tipi Soggetto
- Tabella `tipi_soggetto` (CLI, FOR, AGE, BAN, etc.)
- Gestibile da UI: `/dashboard/configurazioni/tipi-soggetto`
- Campi: codice, nome, descrizione, colore, icona, attivo, di_sistema

### 4. Categoria Cliente
- Tabella `categoria_cliente` per classificare clienti
- FK `categoria_cliente_id` su soggetto
- Integrato in SoggettoForm per clienti
- UI: `/dashboard/configurazioni/categorie-cliente`

### 5. Categoria Fornitore + Contabilità
- Tabella `categoria_fornitore` per classificare fornitori
- FK `conto_costo_default_id` → `piano_conti`
- Il `tipo_costo` è sul piano_conti (non sulla categoria)
- Categorie suggerite: MERCE, VETTORI, UTILITY, BANCHE, SERVIZI
- UI: `/dashboard/configurazioni/categorie-fornitore`

### 6. Piano dei Conti
- Tabella `piano_conti` gerarchica (5 livelli)
- Campi: codice, descrizione, livello, parent_id, path
- Natura: A (Attivo), P (Passivo), C (Costi), R (Ricavi), O (Ordine)
- Campo `tipo_costo` per conti natura 'C': merce, servizi, trasporti, utility, finanziari, **commerciale**, altro
- Conti standard creati per azienda utente
- **UI completa**: `/dashboard/configurazioni/piano-conti`
  - Lista raggruppata per natura con colori
  - Creazione nuovo conto con codice automatico progressivo
  - Selezione conto padre filtrato per natura
  - Modifica/eliminazione (soft delete)
  - Flag caratteristiche speciali (mastro clienti/fornitori, banca, cassa)

### 7. Listini
- Tabella `listino` con tipo 'vendita' o 'acquisto'
- FK `listino_id` su soggetto (per clienti)
- Gestione prezzi per prodotto
- UI: `/dashboard/configurazioni/listini`

### 8. Prodotti
- Tabella `prodotto` completa
- Supporto famiglie/macrofamiglie
- Gestione giacenze per magazzino
- Costo medio ponderato

### 9. Movimenti e Ordini
- Tabella `movimento` unificata (ordini, DDT, fatture)
- Tabella `dettaglio_movimento` per righe
- Causali documento configurabili
- Evasione ordini

### 10. Dati Geografici Italia
- Tabelle: `regioni`, `province`, `comuni`
- API sync con dataset GitHub comuni italiani
- Select a cascata nei form (regione → provincia → comune)

---

## STRUTTURA CHIAVE: Categoria Fornitore → Piano Conti

```
PIANO_CONTI (tipo_costo sul conto)
├── 3.01 Costi Acquisti Merce     → tipo_costo = 'merce'
├── 3.02 Costi per Servizi        → tipo_costo = 'servizi'
├── 3.03 Costi per Trasporti      → tipo_costo = 'trasporti'
├── 3.04 Costi per Utenze         → tipo_costo = 'utility'
├── 3.05 Oneri Finanziari         → tipo_costo = 'finanziari'
└── 3.06 Altri Costi Operativi    → tipo_costo = 'altro'
         ▲
         │ conto_costo_default_id
         │
CATEGORIA_FORNITORE
├── MERCE    → conto 3.01
├── VETTORI  → conto 3.03
├── UTILITY  → conto 3.04
├── BANCHE   → conto 3.05
└── SERVIZI  → conto 3.02
         ▲
         │ categoria_fornitore_id
         │
SOGGETTO (tipo=fornitore)
├── Fornitore ABC → categoria MERCE
├── DHL Express   → categoria VETTORI
└── ENEL          → categoria UTILITY
```

**Flusso**: Quando registri una fattura acquisto, il sistema:
1. Legge il fornitore
2. Recupera la sua categoria_fornitore
3. Usa il conto_costo_default_id per la contabilizzazione
4. Il tipo_costo del conto permette analisi aggregate

---

## PROSSIMI STEP (In Cantiere)

### Priorità Alta
1. **Form Fattura Acquisto**
   - Precompilare conto costi da categoria fornitore
   - Override manuale se necessario

2. **Dashboard Costi**
   - Grafico costi per tipo_costo (merce/servizi/trasporti/utility/finanziari)
   - Trend mensile

3. **Report Marginalità**
   - Ricavi - Costi Merce (COGS) = Margine Lordo
   - Margine Lordo - Costi Operativi = EBITDA

### Priorità Media
4. **Multi-ruolo Soggetto** (valutare)
   - Tabella `soggetto_ruoli` per soggetti che sono sia clienti che fornitori
   - Impatto: 9 query con `.contains('tipo', [...])` da migrare

5. **Scadenzario Pagamenti**
   - Già presente tabella base
   - UI da implementare

### Priorità Bassa
6. **Import Excel/CSV**
   - Clienti, Fornitori, Prodotti
   - Mapping colonne

---

## ROADMAP: Gestione Tariffe Trasporto

### Obiettivo
Sistema flessibile per calcolare automaticamente i costi di trasporto negli ordini di vendita, basato su tariffe configurabili per vettore.

### Tabelle da Creare

#### 1. zona_geografica
```sql
- id, azienda_id, codice, nome, descrizione
- es. "LOMBARDIA", "NORD-ITALIA", "ISOLE", "ESTERO-EU"
```

#### 2. zona_geografica_regola
```sql
- id, zona_id
- tipo_regola: 'cap_range'|'cap_lista'|'provincia'|'regione'|'nazione'
- valore_da, valore_a (per range CAP)
- valori[] (per lista)
-- Una zona può avere più regole (OR logic)
```

#### 3. servizio_trasporto
```sql
- id, azienda_id, codice, nome, descrizione
- tempo_consegna_gg
- es. "STANDARD", "EXPRESS", "ECONOMY"
```

#### 4. listino_trasporto
```sql
- id, azienda_id, vettore_id (FK soggetto)
- codice, nome
- valido_da, valido_a
- priorita, is_default, attivo
```

#### 5. regola_tariffa
```sql
- id, listino_trasporto_id, zona_id, priorita
-- CONDIZIONI (quando applicare)
- peso_min, peso_max
- volume_min, volume_max
- colli_min, colli_max
- pallet_min, pallet_max
- valore_merce_min, valore_merce_max
-- CALCOLO PREZZO
- tipo_calcolo: 'fisso'|'per_kg'|'per_m3'|'per_collo'|'per_pallet'|'percentuale_valore'|'formula'
- valore_calcolo, minimo, massimo
- formula_custom (per calcoli complessi)
- arrotondamento
```

#### 6. supplemento_trasporto
```sql
- id, listino_trasporto_id, zona_id
- codice, nome (CONTRASSEGNO, PIANO, APPUNTAMENTO, ADR)
- tipo_calcolo, valore, minimo, massimo
- applicazione: 'automatico'|'manuale'
- condizione_auto: jsonb
```

#### 7. listino_trasporto_servizio
```sql
- listino_trasporto_id, servizio_id
- maggiorazione_percentuale, maggiorazione_fissa
```

#### 8. Modifica soggetto
```sql
ALTER TABLE soggetto ADD COLUMN is_vettore boolean DEFAULT false;
ALTER TABLE soggetto ADD COLUMN codice_vettore varchar(20);
```

### Flusso Calcolo

```
ORDINE VENDITA
     │
     ├── Dati: vettore, servizio, peso, volume, colli, valore, CAP destinazione
     │
     ▼
1. IDENTIFICA ZONA (da CAP/Provincia cliente)
     │
     ▼
2. CERCA LISTINO (vettore + data validità)
     │
     ▼
3. TROVA REGOLE APPLICABILI (zona + condizioni peso/volume/etc)
     │
     ▼
4. CALCOLA BASE (prima regola match per priorità)
     │
     ▼
5. APPLICA SERVIZIO (maggiorazione % EXPRESS/ECONOMY)
     │
     ▼
6. AGGIUNGI SUPPLEMENTI (automatici: contrassegno, ADR | manuali: piano)
     │
     ▼
7. ARROTONDA
     │
     ▼
RIGA ORDINE: "Spese trasporto" = €XX.XX
```

### Esempi Configurazione

**Tariffa a scaglioni peso:**
```
Regola 1: peso 0-30kg → €0.25/kg, min €6
Regola 2: peso 31-100kg → €0.18/kg, min €7.50
Regola 3: peso 101-500kg → €0.12/kg, min €18
```

**Tariffa per zona:**
```
Zona NORD: €0.12/kg
Zona CENTRO: €0.15/kg
Zona SUD: €0.18/kg
Zona ISOLE: €0.25/kg + supplemento €5
```

**Formula custom:**
```
"MAX(peso * 0.10, volume * 35) + 15"
→ Maggiore tra peso e volume tassato, +€15 fisso
```

**Supplementi automatici:**
```
Contrassegno: 2% valore, min €3 (auto se pagamento=COD)
ADR: +50% trasporto (auto se prodotto.adr=true)
Piano: €15 fisso (manuale)
```

### Task Implementazione

1. **DB: Migrazioni tabelle** (zona, listino, regole, supplementi)
2. **DB: Modifica soggetto** (is_vettore, codice_vettore)
3. **UI: Gestione Zone Geografiche** (/configurazioni/zone-geografiche)
4. **UI: Gestione Servizi Trasporto** (/configurazioni/servizi-trasporto)
5. **UI: Gestione Listini Trasporto** (/configurazioni/listini-trasporto)
6. **UI: Configurazione Tariffe** (regole + supplementi nel listino)
7. **UI: Flag vettore in form soggetto**
8. **Logic: Funzione calcolaCostoTrasporto(ordine, vettore)**
9. **UI: Selezione vettore in ordine vendita**
10. **UI: Calcolo automatico riga trasporto + override manuale**
11. **UI: Riepilogo dettaglio costi (base + servizio + supplementi)**

---

## ROADMAP: Quick Add Pattern (Creazione al volo)

### Obiettivo
Permettere all'utente di creare nuove entità (clienti, prodotti, etc.) direttamente dai form operativi (ordini, fatture) senza perdere il lavoro in corso.

### Flusso UX

```
FORM ORDINE VENDITA (stato in memoria)
         │
         │ Click su [+] accanto a "Cliente"
         ▼
┌─────────────────────────────────────┐
│ 1. Salva stato form in sessionStorage
│ 2. Naviga a /soggetti/nuovo?tipo=CLI&returnTo=/ordini/vendita/nuovo
└─────────────────────────────────────┘
         │
         ▼
FORM NUOVO CLIENTE (completo, non semplificato)
         │
         │ Salva cliente
         ▼
┌─────────────────────────────────────┐
│ 1. Salva ID nuovo cliente in sessionStorage
│ 2. Redirect a returnTo
└─────────────────────────────────────┘
         │
         ▼
FORM ORDINE VENDITA
  - Ripristina stato salvato
  - Auto-seleziona nuovo cliente
```

### Componenti da Creare

#### 1. QuickAddButton
```tsx
// components/QuickAddButton.tsx
- Props: href, params, formStateKey, getFormState(), title
- Salva stato form corrente in sessionStorage
- Naviga con ?returnTo=pathname_corrente
- Bottone discreto [+] accanto ai select
```

#### 2. Hook useFormDraft
```tsx
// hooks/useFormDraft.ts
- saveFormDraft(key, state) - salva in sessionStorage
- restoreFormDraft(key) - ripristina e cancella
- getLastCreatedId(entity) - recupera ID nuova entità
- clearLastCreatedId(entity) - pulisce dopo uso
```

#### 3. Modifiche ai Form Destinazione
```tsx
// Pattern per /soggetti/nuovo, /prodotti/nuovo, etc.
- Leggere searchParams.returnTo
- Se presente returnTo:
  - Bottone "Salva e Torna" invece di "Salva"
  - Dopo save: salva ID in sessionStorage + redirect a returnTo
- Se assente returnTo:
  - Comportamento normale (redirect a lista)
```

### Dove Applicare

| Form Origine | Campi con Quick Add |
|--------------|---------------------|
| Ordine Vendita | Cliente, Prodotto, Vettore, Metodo Pagamento |
| Ordine Acquisto | Fornitore, Prodotto, Metodo Pagamento |
| Fattura Vendita | Cliente, Prodotto, Aliquota IVA |
| Fattura Acquisto | Fornitore, Prodotto, Aliquota IVA |
| Movimento Magazzino | Prodotto, Magazzino, Causale Movimento |
| Soggetto | Categoria Cliente/Fornitore, Tipo Soggetto |
| Prodotto | Famiglia, Macrofamiglia, Aliquota IVA, Unità Misura |

### Task Implementazione

1. **Componente QuickAddButton** - Bottone [+] riutilizzabile
2. **Hook useFormDraft** - Gestione stato in sessionStorage
3. **Modifica SoggettoForm** - Supporto returnTo + "Salva e Torna"
4. **Modifica ProdottoForm** - Supporto returnTo
5. **Modifica form configurazioni** - Supporto returnTo (categorie, aliquote, etc.)
6. **Integrazione OrdineVenditaForm** - Quick add + restore draft
7. **Integrazione OrdineAcquistoForm** - Quick add + restore draft
8. **Integrazione FatturaForm** - Quick add + restore draft
9. **Test E2E** - Verifica flusso completo

### Note Tecniche

- Usare `sessionStorage` (non localStorage) per draft temporanei
- Pulire sempre il draft dopo il ripristino
- Il form destinazione deve funzionare anche senza returnTo (uso normale)
- Gestire caso di refresh pagina (draft persiste nella sessione)

---

## ROADMAP: Anagrafica Prodotti Avanzata + Import Massivo

### Obiettivo
Sistema completo per gestire prodotti con dati specifici per fornitore, storico prezzi, confezionamento dettagliato e import massivo da Excel.

### Problema Attuale
La tabella `prodotto` ha un solo `fornitore_principale_id` e campi singoli per confezionamento. Ma:
- Stesso prodotto può avere fornitori diversi con prezzi/confezionamenti diversi
- Serve storico prezzi per calcolo costo medio corretto
- Fornitori esteri hanno valute e termini di resa diversi
- Import massivo richiede formato standardizzato

### Nuove Tabelle

#### 1. prodotto_fornitore (relazione N:N con dati specifici)
```sql
CREATE TABLE prodotto_fornitore (
  id SERIAL PRIMARY KEY,
  azienda_id UUID NOT NULL,
  prodotto_id INT NOT NULL REFERENCES prodotto(id),
  fornitore_id INT NOT NULL REFERENCES soggetto(id),

  -- IDENTIFICAZIONE FORNITORE
  codice_fornitore VARCHAR(100),      -- Come lo chiama il fornitore
  nome_fornitore VARCHAR(255),        -- Descrizione del fornitore
  ean_fornitore VARCHAR(13),

  -- PREZZI (ultimo valido)
  prezzo_acquisto DECIMAL(12,4),      -- Prezzo unitario
  valuta_id INT REFERENCES valuta(id),
  sconto_standard DECIMAL(5,2),       -- % sconto abituale

  -- CONFEZIONAMENTO
  unita_misura_acquisto VARCHAR(10),  -- PZ, CT, PD, KG
  pezzi_per_confezione INT,           -- Pz per confezione minima
  confezioni_per_cartone INT,         -- Confezioni per cartone
  pezzi_per_cartone INT,              -- Calcolato o diretto
  cartoni_per_pedana INT,
  pezzi_per_pedana INT,               -- Calcolato

  -- PESI E VOLUMI (per unità di acquisto)
  peso_confezione_kg DECIMAL(10,3),
  peso_cartone_kg DECIMAL(10,3),
  peso_pedana_kg DECIMAL(10,3),
  volume_cartone_m3 DECIMAL(10,4),
  volume_pedana_m3 DECIMAL(10,4),

  -- LOGISTICA
  lead_time_giorni INT,               -- Tempo produzione/preparazione
  transit_time_giorni INT,            -- Tempo trasporto
  moq INT DEFAULT 1,                  -- Minimum Order Quantity
  multiplo_ordine INT DEFAULT 1,      -- Ordini multipli di X

  -- TERMINI DI RESA (Incoterms)
  incoterm VARCHAR(3),                -- EXW, FOB, CIF, DAP, DDP
  porto_partenza VARCHAR(100),        -- es. "Shanghai"
  porto_arrivo VARCHAR(100),          -- es. "Genova"

  -- PRIORITÀ
  is_preferito BOOLEAN DEFAULT false,
  priorita INT DEFAULT 1,             -- 1 = principale

  -- VALIDITÀ
  attivo BOOLEAN DEFAULT true,
  note TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(azienda_id, prodotto_id, fornitore_id)
);
```

#### 2. prodotto_fornitore_prezzo (storico prezzi)
```sql
CREATE TABLE prodotto_fornitore_prezzo (
  id SERIAL PRIMARY KEY,
  prodotto_fornitore_id INT NOT NULL REFERENCES prodotto_fornitore(id),

  prezzo_acquisto DECIMAL(12,4) NOT NULL,
  valuta_id INT REFERENCES valuta(id),
  sconto_standard DECIMAL(5,2),
  prezzo_netto DECIMAL(12,4),         -- Calcolato: prezzo - sconto

  valido_da DATE NOT NULL,
  valido_a DATE,                      -- NULL = ancora valido

  -- Per tracciabilità
  documento_riferimento VARCHAR(100), -- es. "Listino 2024", "Ordine #123"
  note TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indice per ricerca prezzo valido a una data
CREATE INDEX idx_pf_prezzo_validita
ON prodotto_fornitore_prezzo(prodotto_fornitore_id, valido_da, valido_a);
```

#### 3. import_template (formati import)
```sql
CREATE TABLE import_template (
  id SERIAL PRIMARY KEY,
  azienda_id UUID NOT NULL,

  nome VARCHAR(100) NOT NULL,         -- "Import Fornitore Cina"
  tipo VARCHAR(50) NOT NULL,          -- 'prodotti', 'prodotto_fornitore', 'clienti'

  -- Mapping colonne: nome_nostro → indice colonna Excel (0-based) o nome colonna
  mapping JSONB NOT NULL,
  /* Esempio:
  {
    "codice_fornitore": "A",          -- Colonna A
    "nome": "B",
    "pezzi_per_cartone": "E",
    "prezzo": "G",
    "peso_kg": {"col": "H", "transform": "divide_1000"}  -- Con trasformazione
  }
  */

  -- Opzioni
  has_header BOOLEAN DEFAULT true,
  skip_rows INT DEFAULT 0,            -- Righe da saltare all'inizio
  separator VARCHAR(1) DEFAULT ',',   -- Per CSV
  decimal_separator VARCHAR(1) DEFAULT '.',

  attivo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Formato Standard Import

#### Template Excel Prodotti-Fornitore
```
| Colonna | Campo                  | Obbligatorio | Note                          |
|---------|------------------------|--------------|-------------------------------|
| A       | codice_fornitore       | SI           | Codice prodotto del fornitore |
| B       | nome                   | SI           | Nome/descrizione prodotto     |
| C       | ean                    | NO           | Codice EAN13                  |
| D       | codice_interno         | NO           | Nostro codice (se esiste)     |
| E       | unita_misura           | NO           | PZ, CT, PD (default: PZ)      |
| F       | pezzi_per_confezione   | NO           | Pz per busta/blister          |
| G       | confezioni_per_cartone | NO           | Buste per cartone             |
| H       | pezzi_per_cartone      | NO           | Alternativa a F×G             |
| I       | cartoni_per_pedana     | NO           |                               |
| J       | peso_pezzo_g           | NO           | Peso in GRAMMI                |
| K       | peso_cartone_kg        | NO           | Peso cartone pieno            |
| L       | prezzo_unitario        | SI           | Prezzo per unità misura       |
| M       | valuta                 | NO           | EUR, USD, CNY (default: EUR)  |
| N       | sconto_perc            | NO           | Sconto % standard             |
| O       | moq                    | NO           | Quantità minima ordine        |
| P       | lead_time_gg           | NO           | Giorni produzione             |
| Q       | transit_time_gg        | NO           | Giorni trasporto              |
| R       | incoterm               | NO           | EXW, FOB, CIF, DAP, DDP       |
| S       | hs_code                | NO           | Codice doganale               |
| T       | famiglia               | NO           | Per classificazione           |
| U       | note                   | NO           |                               |
```

### Flusso Import Massivo

```
UTENTE CARICA EXCEL
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. SELEZIONE TEMPLATE                                          │
│     - Sceglie template salvato (es. "Import Cina Standard")     │
│     - Oppure crea nuovo mapping manuale                         │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. PREVIEW DATI                                                 │
│     - Mostra prime 10 righe mappate                             │
│     - Evidenzia errori (campi mancanti, formati invalidi)       │
│     - Permette correzioni mapping                               │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. SELEZIONE FORNITORE                                          │
│     - Quale fornitore per questi prodotti?                      │
│     - [Select] oppure [+ Nuovo Fornitore]                       │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. MATCHING PRODOTTI                                            │
│     Per ogni riga:                                              │
│     - Cerca prodotto esistente per:                             │
│       1. codice_interno (se fornito)                            │
│       2. EAN                                                    │
│       3. codice_fornitore (in prodotto_fornitore)               │
│       4. nome simile (fuzzy match)                              │
│     - Se non trovato → segna come "NUOVO"                       │
│     - Se trovato → segna come "AGGIORNA"                        │
│                                                                  │
│  RISULTATO PREVIEW:                                             │
│  ┌──────────┬────────────┬─────────────────┬──────────┐        │
│  │ Riga     │ Codice     │ Nome            │ Azione   │        │
│  ├──────────┼────────────┼─────────────────┼──────────┤        │
│  │ 1        │ ABC-001    │ Prodotto Alfa   │ NUOVO    │        │
│  │ 2        │ ABC-002    │ Prodotto Beta   │ AGGIORNA │        │
│  │ 3        │ ABC-003    │ Prodotto Gamma  │ NUOVO    │        │
│  │ 4        │ ???        │ [manca codice]  │ ERRORE   │        │
│  └──────────┴────────────┴─────────────────┴──────────┘        │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. CONFERMA E IMPORT                                            │
│     - Mostra riepilogo: X nuovi, Y aggiornati, Z errori         │
│     - [Importa Tutti] [Importa Solo Nuovi] [Annulla]            │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. ELABORAZIONE                                                 │
│     Per prodotti NUOVI:                                         │
│     - Crea record in `prodotto`                                 │
│     - Crea record in `prodotto_fornitore`                       │
│     - Crea primo prezzo in `prodotto_fornitore_prezzo`          │
│                                                                  │
│     Per prodotti ESISTENTI:                                     │
│     - Aggiorna/crea `prodotto_fornitore`                        │
│     - Se prezzo diverso → chiudi vecchio prezzo (valido_a)      │
│                          → crea nuovo prezzo (valido_da=oggi)   │
└─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. REPORT FINALE                                                │
│     - Importati: 150 prodotti                                   │
│     - Aggiornati: 45 prezzi                                     │
│     - Errori: 3 (scarica log)                                   │
│     - [Scarica Report] [Torna ai Prodotti]                      │
└─────────────────────────────────────────────────────────────────┘
```

### Calcolo Costo Medio con Storico

```sql
-- Funzione per calcolare costo medio ponderato
-- Considera tutti gli acquisti storici

CREATE OR REPLACE FUNCTION calcola_costo_medio_prodotto(p_prodotto_id INT)
RETURNS DECIMAL(12,4) AS $$
DECLARE
  v_totale_valore DECIMAL(15,4) := 0;
  v_totale_quantita DECIMAL(12,3) := 0;
BEGIN
  -- Somma tutti i movimenti di carico (acquisti)
  SELECT
    COALESCE(SUM(quantita * prezzo_unitario), 0),
    COALESCE(SUM(quantita), 0)
  INTO v_totale_valore, v_totale_quantita
  FROM dettaglio_movimento dm
  JOIN movimento m ON m.id = dm.movimento_id
  WHERE dm.prodotto_id = p_prodotto_id
    AND m.tipo IN ('acquisto', 'carico')
    AND m.stato = 'completato';

  IF v_totale_quantita > 0 THEN
    RETURN ROUND(v_totale_valore / v_totale_quantita, 4);
  END IF;

  RETURN 0;
END;
$$ LANGUAGE plpgsql;
```

### Task Implementazione

1. **DB: Tabella prodotto_fornitore**
2. **DB: Tabella prodotto_fornitore_prezzo** (storico)
3. **DB: Tabella import_template**
4. **DB: Funzione calcolo costo medio**
5. **UI: Gestione fornitori prodotto** (tab in dettaglio prodotto)
6. **UI: Storico prezzi fornitore**
7. **UI: Wizard import Excel**
   - Upload file
   - Selezione/creazione template
   - Preview e mapping
   - Matching prodotti
   - Conferma e import
8. **UI: Gestione template import**
9. **Logic: Parser Excel/CSV**
10. **Logic: Matching fuzzy prodotti**
11. **Logic: Conversione unità misura**
12. **Logic: Calcolo landing cost** (prezzo + trasporto + dazi per incoterm)

### Note su Calcolo Landing Cost

```
LANDING COST = Prezzo Merce + Costi Accessori

Per INCOTERM:
┌─────────┬────────────────────────────────────────────────────┐
│ EXW     │ + ritiro + trasporto interno origine              │
│         │ + export clearance + carico nave                  │
│         │ + nolo marittimo + assicurazione                  │
│         │ + scarico + import clearance + dazi               │
│         │ + trasporto interno destino                       │
├─────────┼────────────────────────────────────────────────────┤
│ FOB     │ + nolo marittimo + assicurazione                  │
│         │ + scarico + import clearance + dazi               │
│         │ + trasporto interno destino                       │
├─────────┼────────────────────────────────────────────────────┤
│ CIF     │ + scarico + import clearance + dazi               │
│         │ + trasporto interno destino                       │
├─────────┼────────────────────────────────────────────────────┤
│ DAP     │ + import clearance + dazi                         │
├─────────┼────────────────────────────────────────────────────┤
│ DDP     │ (tutto incluso)                                   │
└─────────┴────────────────────────────────────────────────────┘

DAZI = Valore Merce × Aliquota HS Code
     + eventuale antidumping
     + IVA su (Merce + Dazi + Trasporto)
```

---

## FILE PRINCIPALI MODIFICATI (Sessione Corrente)

### Migrazioni SQL
- `20251204_004_categoria_fornitore.sql` - Crea categoria_fornitore
- `20251204_005_categoria_fornitore_conto_costo.sql` - Aggiunge conto_costo_default_id
- `20251204_006_tipo_costo_su_piano_conti.sql` - Sposta tipo_costo su piano_conti

### Actions
- `app/actions/categorie-fornitore.ts` - CRUD + getContiCosti()
- `app/actions/soggetti.ts` - Aggiunto categoria_fornitore_id

### Components
- `components/CategoriaFornitoreForm.tsx` - Form con dropdown conto costi
- `components/SoggettoForm.tsx` - Aggiunta sezione "Dati Commerciali Fornitore"

### Pages
- `app/dashboard/configurazioni/categorie-fornitore/` - Lista, nuovo, modifica
- `app/dashboard/soggetti/nuovo/page.tsx` - Passa categorieFornitore
- `app/dashboard/soggetti/[id]/modifica/page.tsx` - Passa categorieFornitore

### Lib
- `lib/constants/tipi-costo.ts` - Costanti TIPI_COSTO (per reference, ora su DB)

---

## NOTE TECNICHE

### Pattern Query Soggetti (Legacy vs Nuovo)
```typescript
// VECCHIO (ancora in uso) - da migrare gradualmente
.contains('tipo', ['fornitore'])

// NUOVO (preferito)
.eq('tipo_soggetto_id', tipoId)
```

### RLS Piano Conti
- Permette accesso a conti propria azienda
- Permette accesso a conti template (azienda_id = '00000000-...')

### Checkbox "attivo" nei form
```tsx
// Pattern corretto per checkbox con default true
<input
  type="checkbox"
  name="attivo"
  value="true"
  defaultChecked={entity?.attivo ?? true}
/>
// Nel server action:
attivo: formData.get('attivo') !== 'false'
```
