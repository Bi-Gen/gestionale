# 🔍 ANALISI GAP - Database Attuale vs Requisiti Excel/PowerBI

**Data:** 2025-12-03
**Obiettivo:** Identificare campi e funzionalità mancanti per replicare completamente il sistema Excel + Power BI

---

## 📊 CONFRONTO TABELLA MOVIMENTO

### ✅ GIÀ IMPLEMENTATO in `movimento`

| Campo | Excel | PowerBI | DB Attuale | Note |
|-------|-------|---------|------------|------|
| Causale movimento | ✅ | ✅ | ✅ `causale_id` | OK |
| Numero documento | ✅ | ✅ | ✅ `numero_documento` | OK |
| Data movimento | ✅ | ✅ | ✅ `data_documento` | OK |
| Data scadenza | ✅ | ✅ | ✅ `data_scadenza` | OK |
| Soggetto | ✅ | ✅ | ✅ `soggetto_id` | OK |
| Magazzino | ✅ | ✅ | ✅ `magazzino_id` | OK |
| Importi (imponibile, IVA, totale) | ✅ | ✅ | ✅ | OK |
| Regime IVA | ✅ | ✅ | ✅ `regime_iva` | OK |
| Split Payment | ✅ | ❌ | ✅ `split_payment` | OK |
| Reverse Charge | ✅ | ❌ | ✅ `reverse_charge` | OK |
| Metodo pagamento | ✅ | ✅ | ✅ `metodo_pagamento_id` | OK |
| Stato | ✅ | ❌ | ✅ `stato` | OK |
| Note | ✅ | ✅ | ✅ `note` | OK |
| Contabilizzato | ✅ | ❌ | ✅ `contabilizzato` | OK |

---

### ❌ CAMPI MANCANTI CRITICI in `movimento`

| Campo Excel/PowerBI | Colonna Excel | Tipo | Priorità | Note |
|---------------------|---------------|------|----------|------|
| **Data Consegna** | ✅ | DATE | 🔴 ALTA | Dimensione temporale Power BI |
| **Data Pagamento** | ✅ | DATE | 🔴 ALTA | Dimensione temporale Power BI |
| **ETD (Carry Out)** | ✅ | VARCHAR(50) | 🟡 MEDIA | Per export/logistica |
| **Agente** | ✅ | VARCHAR(100) | 🔴 ALTA | Presente in Excel, manca nel DB |
| **Centro di Costo** | ✅ | VARCHAR(100) | 🟡 MEDIA | Per contabilità analitica |
| **Vettore** | ✅ | VARCHAR(100) | 🟡 MEDIA | Per spedizioni |
| **Termini di Resa** | ✅ | VARCHAR(50) | 🟡 MEDIA | Incoterms (EXW, FOB, CIF) |
| **Costo Trasporto** | ✅ | DECIMAL(10,2) | 🟡 MEDIA | Costi accessori |
| **Listino di Riferimento** | ✅ | INT (FK) | 🟢 BASSA | Si può derivare da soggetto |
| **Valuta** | ✅ | VARCHAR(3) | 🟡 MEDIA | Multi-currency |
| **GG. Pagamento** | ✅ | INT | 🟡 MEDIA | Giorni dilazione |
| **Valore Pagamento** | ✅ | DECIMAL(12,2) | 🔴 ALTA | Per scadenzario |
| **Ove Confermato** | ✅ | VARCHAR(100) | 🟢 BASSA | Tracking conferme |
| **Campo Regione** | ✅ | VARCHAR(50) | 🟢 BASSA | Si può derivare da soggetto |
| **Tipo movimento** | ✅ | VARCHAR(20) | 🟡 MEDIA | Carico/Scarico (o dedurre da causale) |
| **Nota su Operazione** | ✅ | TEXT | 🟢 BASSA | Campo note aggiuntivo |

---

### ❌ CAMPI PROVVIGIONI MANCANTI (CRITICO!)

**Excel ha 4 tipologie di provvigioni** con 3 campi ciascuna:

| Provvigione | % | Valore Calcolato | Provvigione Pagata | Riferimento |
|-------------|---|------------------|--------------------|-------------|
| **Agente** | ✅ | ✅ | ✅ | Rete vendita |
| **Direzione Acquisti (DA)** | ✅ | ✅ | ✅ | Acquisti |
| **Logistica, Amm & Spedizioni (LAS)** | ✅ | ✅ | ✅ | Back office |
| **Direzione Commerciale (DC)** | ✅ | ✅ | ✅ | Management |

**Totale:** 12 campi mancanti!

#### Struttura da aggiungere:
```sql
-- Provvigioni (tutte in movimento)
agente VARCHAR(100),
provvigione_agente_perc DECIMAL(5,2),
provvigione_agente_valore DECIMAL(10,2),
provvigione_agente_pagata DECIMAL(10,2) DEFAULT 0,

direzione_acquisti VARCHAR(100),
provvigione_da_perc DECIMAL(5,2),
provvigione_da_valore DECIMAL(10,2),
provvigione_da_pagata DECIMAL(10,2) DEFAULT 0,

logistica_amm VARCHAR(100),
provvigione_las_perc DECIMAL(5,2),
provvigione_las_valore DECIMAL(10,2),
provvigione_las_pagata DECIMAL(10,2) DEFAULT 0,

direzione_commerciale VARCHAR(100),
provvigione_dc_perc DECIMAL(5,2),
provvigione_dc_valore DECIMAL(10,2),
provvigione_dc_pagata DECIMAL(10,2) DEFAULT 0
```

**PowerBI:** Misura "Oneri Diretti sulle Vendite" = somma di tutte e 4 le provvigioni!

---

## 📊 CONFRONTO TABELLA DETTAGLIO_MOVIMENTO

### ✅ GIÀ IMPLEMENTATO

| Campo | Excel | DB Attuale | Note |
|-------|-------|------------|------|
| Prodotto | ✅ | ✅ `prodotto_id` | OK |
| Descrizione | ✅ | ✅ `descrizione` | OK |
| Quantità | ✅ | ✅ `quantita` | OK |
| Unità misura | ✅ | ✅ `unita_misura` | OK |
| Prezzo unitario | ✅ | ✅ `prezzo_unitario` | OK |
| Sconto % | ✅ | ✅ `sconto_percentuale` | OK |
| Sconto importo | ✅ | ✅ `sconto_importo` | OK |
| Imponibile | ✅ | ✅ `imponibile` | OK |
| IVA | ✅ | ✅ `iva` | OK |
| Totale | ✅ | ✅ `totale` | OK |
| Aliquota IVA | ✅ | ✅ `aliquota_iva_id` | OK |

### ❌ CAMPI MANCANTI in `dettaglio_movimento`

| Campo Excel | Priorità | Note |
|-------------|----------|------|
| **quantita_con_segno** | 🔴 ALTA | Critico per Power BI! +/- per carico/scarico |
| **Descrizione Prodotto** | 🟢 BASSA | Campo ridondante (già in descrizione) |
| **Stampa** | 🟡 MEDIA | Dettaglio personalizzazione |
| **Descrizione Oggetto** | 🟡 MEDIA | Dettaglio prodotto |
| **Colore Fondo** | 🟡 MEDIA | Caratteristica prodotto |
| **Brand** | 🟢 BASSA | Si può prendere dal prodotto |
| **Costo Stampa** | 🟡 MEDIA | Costo accessorio |
| **Prezzo da Listino** | 🟢 BASSA | Prezzo prima di sconto |
| **Prezzo Imponibile** | 🟢 BASSA | Ridondante con prezzo_unitario |

**CRITICO:** `quantita_con_segno` è usato in TUTTE le misure DAX di Power BI!

```sql
ALTER TABLE dettaglio_movimento
ADD COLUMN quantita_con_segno DECIMAL(12,3);

-- Trigger per calcolare automaticamente il segno
CREATE OR REPLACE FUNCTION calcola_quantita_con_segno()
RETURNS TRIGGER AS $$
DECLARE
  v_segno INT;
BEGIN
  -- Ottieni il segno dalla causale
  SELECT segno INTO v_segno
  FROM causale_documento c
  INNER JOIN movimento m ON m.causale_id = c.id
  WHERE m.id = NEW.movimento_id;

  -- Applica il segno
  NEW.quantita_con_segno := NEW.quantita * v_segno;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 📦 CONFRONTO TABELLA PRODOTTO

### ❌ CAMPI MANCANTI CRITICI

| Campo Excel | Colonna | Tipo | Priorità | Note |
|-------------|---------|------|----------|------|
| **Prezzo a Magazzino** | ✅ | DECIMAL(10,2) | 🔴 ALTA | CRITICO per valorizzazione giacenze! |
| **Pezzi per Busta** | ✅ | INT | 🔴 ALTA | Per conversioni UdM Power BI |
| **Buste per Cartone** | ✅ | INT | 🔴 ALTA | Per conversioni UdM Power BI |
| **Cartoni per Pedana** | ✅ | INT | 🔴 ALTA | Per conversioni UdM Power BI |
| **Lead Time** | ✅ | INT | 🔴 ALTA | Giorni approvvigionamento |
| **Transit Time** | ✅ | INT | 🔴 ALTA | Giorni transito |
| **Scorta minima** | ✅ | INT | 🔴 ALTA | Per calcolo fabbisogno MRP |
| **Stampa** | ✅ | VARCHAR(255) | 🟡 MEDIA | Personalizzazione |
| **Descrizione Oggetto** | ✅ | TEXT | 🟡 MEDIA | Descrizione estesa |
| **Colore Fondo** | ✅ | VARCHAR(50) | 🟡 MEDIA | Caratteristica visiva |
| **Delivery Terms** | ✅ | VARCHAR(50) | 🟡 MEDIA | Incoterms |
| **HS CODE** | ✅ | VARCHAR(10) | 🟡 MEDIA | Codice doganale |
| **Codice Fornitore** | ✅ | VARCHAR(50) | 🟡 MEDIA | Codice articolo fornitore |
| **GTIN/EAN** | ✅ | VARCHAR(13) | 🟡 MEDIA | Codice a barre |
| **Peso (kg)** | ✅ | DECIMAL(10,3) | 🟡 MEDIA | Per logistica |
| **GSM** | ✅ | INT | 🟡 MEDIA | Grammatura (tessuto) |
| **Linea** | ✅ | VARCHAR(100) | 🟡 MEDIA | Linea prodotto |
| **Dimensioni (H, W, L)** | ✅ | VARCHAR | 🟡 MEDIA | Dimensioni fisiche |

**Le conversioni UdM sono ESSENZIALI per Power BI!**

PowerBI ha 8 misure DAX solo per le conversioni:
- Pezzi in Cartone
- Quantità Buste
- Quantità Cartoni
- Quantità Buste (-/+)
- Quantità Cartoni (-/+)
- Qtà Pedane (3 varianti)

Senza questi campi, le misure non funzionano!

---

## 👥 CONFRONTO TABELLA SOGGETTO

### ❌ CAMPI PROVVIGIONI MANCANTI

| Campo Excel | Priorità | Note |
|-------------|----------|------|
| **Agente** | 🔴 ALTA | Chi segue il cliente |
| **Provvigione Agente %** | 🔴 ALTA | % default |
| **Direzione Acquisti** | 🔴 ALTA | Responsabile acquisti |
| **Provvigione DA %** | 🔴 ALTA | % default |
| **Logistica, Amm & Spedizioni** | 🔴 ALTA | Responsabile logistica |
| **Provvigione LAS %** | 🔴 ALTA | % default |
| **Direzione Commerciale** | 🔴 ALTA | Direttore commerciale |
| **Provvigione DC %** | 🔴 ALTA | % default |

**Questi campi sono in `soggetto` perché ogni cliente/fornitore ha percentuali di default!**

### ❌ ALTRI CAMPI MANCANTI

| Campo | Priorità | Note |
|-------|----------|------|
| **Trattamento IVA** | 🟡 MEDIA | Ordinario, Esente, etc. |
| **GG. Pagamento** | 🟡 MEDIA | Dilazione default |
| **Valuta** | 🟡 MEDIA | Valuta transazioni |
| **% IVA** | 🟡 MEDIA | Aliquota default |
| **Listino di Riferimento** | 🟡 MEDIA | Listino assegnato |
| **Note sulla consegna** | 🟢 BASSA | Istruzioni logistiche |
| **Macrofamiglia, Famiglia** | 🟢 BASSA | Classificazione cliente |
| **Settore Soggetto** | 🟡 MEDIA | Segmentazione |

---

## 🏭 SISTEMA MAGAZZINO

### ❌ MANCA: Trasferimenti tra magazzini

Excel ha un foglio dedicato **"Trasfer.Magazz."** con doppia registrazione:
- Scarico da magazzino A (quantità negativa)
- Carico in magazzino B (quantità positiva)

**Soluzione:**
Usare `movimento` con causale specifica:
```sql
INSERT INTO causale_documento (codice, descrizione, tipo_documento, tipo_operazione, segno) VALUES
  ('TRASF_SCARICO', 'Trasferimento Scarico', 'trasferimento', 'trasferimento', -1, true, false, false),
  ('TRASF_CARICO', 'Trasferimento Carico', 'trasferimento', 'trasferimento', 1, true, false, false);
```

Oppure aggiungere campo `magazzino_destino_id` a `movimento`.

---

## 💰 SISTEMA LISTINI

### ✅ GIÀ IMPLEMENTATO

Struttura base esiste:
- `listino` (id, codice, nome)
- `prezzo_listino` (listino_id, prodotto_id, prezzo)

### ❌ FUNZIONALITÀ MANCANTI

| Funzionalità | Excel | Implementato | Note |
|--------------|-------|--------------|------|
| **Listini multipli per cliente** | ✅ | ❌ | Campo `listino_id` in `soggetto` manca |
| **Provvigioni per listino** | ✅ | ❌ | Campo `provvigione_perc` in `prezzo_listino` manca |
| **Prezzi a scaglioni** | ✅ | ✅ | `quantita_min`, `quantita_max` presenti |
| **Listini con validità temporale** | ✅ | ✅ | `validita_da`, `validita_a` presenti |
| **Margini calcolati** | ✅ | ❌ | Foglio "Costi-Listini-Margini" |

---

## 📊 POWER BI: MISURE DAX CRITICHE

### 🔴 ALTA PRIORITÀ - Impossibili senza campi mancanti

| Misura DAX | Campi Richiesti | Presente | Impatto |
|------------|-----------------|----------|---------|
| **Valore Magazzino (Iva Escl.)** | `prezzo_magazzino` in prodotto | ❌ | Dashboard Giacenze |
| **Qta in Giacenza** | `quantita_con_segno` in dettaglio | ❌ | CRITICO |
| **Qta Ordinata** | `quantita_con_segno` + causale | ❌ | Dashboard Giacenze |
| **Qta Impegnata** | `quantita_con_segno` + causale | ❌ | Dashboard Giacenze |
| **Qta Fabbisogno** | `scorta_minima` in prodotto | ❌ | Dashboard Fabbisogni |
| **Conversioni UdM** (8 misure) | `pezzi_per_busta`, `buste_per_cartone`, `cartoni_per_pedana` | ❌ | Analisi logistica |
| **Oneri Diretti** | 4 provvigioni in movimento | ❌ | Dashboard Marginalità |
| **Costo Merci** | `prezzo_magazzino` + `quantita_con_segno` | ❌ | Dashboard Marginalità |

### 🟡 MEDIA PRIORITÀ

| Misura DAX | Campi Richiesti | Presente | Impatto |
|------------|-----------------|----------|---------|
| **Circolante** | varie | ⚠️ | Dashboard Finanziario |
| **Saldo Fatture** | `valore_pagamento` | ❌ | DSO |
| **Saldo Provv.Agenti** | provvigioni + pagato | ❌ | Tracking agenti |

---

## 📋 TABELLE COMPLETAMENTE MANCANTI

| Tabella | Fonte | Priorità | Note |
|---------|-------|----------|------|
| **Budget** | Excel | 🟡 MEDIA | 5000 righe forecast |
| **Costo-Listini-Margini** | Excel | 🟡 MEDIA | Calcoli margini |
| **Tabella Trasporti** | Excel | 🟢 BASSA | Vettori e costi |
| **Tabella Cambi-Quotazioni** | Excel | 🟢 BASSA | Tassi cambio valute |
| **Allegato Noli - PLT CAP** | Excel | 🟢 BASSA | Costi nolo |

---

## 📅 DIMENSIONI TEMPORALI POWER BI

Power BI usa **3 dimensioni temporali**:
1. ✅ `data_documento` (data_movimento)
2. ❌ `data_consegna` (MANCA!)
3. ❌ `data_pagamento` (MANCA!)

**Impatto:** Time Intelligence rotto senza queste date!

Misure DAX che usano queste date:
- Analisi consegne (planning logistico)
- Cash flow projection (data_pagamento)
- DSO calculation
- Trend temporali multipli

---

## 🎯 PRIORITÀ IMPLEMENTAZIONE

### 🔴 CRITICO (BLOCCA POWER BI)

1. **Campo `quantita_con_segno`** in `dettaglio_movimento`
   - Tutte le misure DAX magazzino dipendono da questo!

2. **Campo `prezzo_magazzino`** in `prodotto`
   - Valorizzazione giacenze impossibile senza

3. **Campi UdM** in `prodotto`
   - `pezzi_per_busta`
   - `buste_per_cartone`
   - `cartoni_per_pedana`

4. **Campi provvigioni** (12 campi) in `movimento`
   - Misura "Oneri Diretti" = core per marginalità

5. **Campi provvigioni default** in `soggetto` (8 campi)
   - Per auto-compilamento in ordini/fatture

6. **Campi temporali** in `movimento`
   - `data_consegna`
   - `data_pagamento`

7. **Campo `scorta_minima`** in `prodotto`
   - Calcolo fabbisogno MRP

8. **Campo `agente`** in `movimento` + `soggetto`
   - Analisi performance commerciali

### 🟡 IMPORTANTE

9. Campi logistici (vettore, termini resa, costo trasporto)
10. Multi-valuta (campo `valuta`)
11. Centro di costo
12. ETD
13. Lead Time, Transit Time

### 🟢 NICE TO HAVE

14. Budget table
15. Tabella trasporti
16. Cambi valute
17. Costi-Listini-Margini table

---

## ✅ AZIONI IMMEDIATE

### Migration da creare: `20251203_add_campi_critici_excel.sql`

```sql
-- PARTE 1: PRODOTTO - Campi critici
ALTER TABLE prodotto ADD COLUMN IF NOT EXISTS prezzo_magazzino DECIMAL(10,2) NOT NULL DEFAULT 0;
ALTER TABLE prodotto ADD COLUMN IF NOT EXISTS pezzi_per_busta INT;
ALTER TABLE prodotto ADD COLUMN IF NOT EXISTS buste_per_cartone INT;
ALTER TABLE prodotto ADD COLUMN IF NOT EXISTS pezzi_per_cartone INT
  GENERATED ALWAYS AS (pezzi_per_busta * buste_per_cartone) STORED;
ALTER TABLE prodotto ADD COLUMN IF NOT EXISTS cartoni_per_pedana INT;
ALTER TABLE prodotto ADD COLUMN IF NOT EXISTS lead_time_giorni INT;
ALTER TABLE prodotto ADD COLUMN IF NOT EXISTS transit_time_giorni INT;
ALTER TABLE prodotto ADD COLUMN IF NOT EXISTS scorta_minima INT;

-- PARTE 2: DETTAGLIO_MOVIMENTO - Quantità con segno
ALTER TABLE dettaglio_movimento ADD COLUMN IF NOT EXISTS quantita_con_segno DECIMAL(12,3);

-- PARTE 3: MOVIMENTO - Date e logistica
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS data_consegna DATE;
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS data_pagamento DATE;
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS agente VARCHAR(100);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS vettore VARCHAR(100);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS termini_resa VARCHAR(50);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS costo_trasporto DECIMAL(10,2);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS centro_costo VARCHAR(100);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS etd VARCHAR(50);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS valuta VARCHAR(3) DEFAULT 'EUR';

-- PARTE 4: MOVIMENTO - Provvigioni (12 campi!)
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS provvigione_agente_perc DECIMAL(5,2);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS provvigione_agente_valore DECIMAL(10,2);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS provvigione_agente_pagata DECIMAL(10,2) DEFAULT 0;

ALTER TABLE movimento ADD COLUMN IF NOT EXISTS direzione_acquisti VARCHAR(100);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS provvigione_da_perc DECIMAL(5,2);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS provvigione_da_valore DECIMAL(10,2);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS provvigione_da_pagata DECIMAL(10,2) DEFAULT 0;

ALTER TABLE movimento ADD COLUMN IF NOT EXISTS logistica_amm VARCHAR(100);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS provvigione_las_perc DECIMAL(5,2);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS provvigione_las_valore DECIMAL(10,2);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS provvigione_las_pagata DECIMAL(10,2) DEFAULT 0;

ALTER TABLE movimento ADD COLUMN IF NOT EXISTS direzione_commerciale VARCHAR(100);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS provvigione_dc_perc DECIMAL(5,2);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS provvigione_dc_valore DECIMAL(10,2);
ALTER TABLE movimento ADD COLUMN IF NOT EXISTS provvigione_dc_pagata DECIMAL(10,2) DEFAULT 0;

-- PARTE 5: SOGGETTO - Provvigioni default
ALTER TABLE soggetto ADD COLUMN IF NOT EXISTS agente VARCHAR(100);
ALTER TABLE soggetto ADD COLUMN IF NOT EXISTS provvigione_agente_perc DECIMAL(5,2);
ALTER TABLE soggetto ADD COLUMN IF NOT EXISTS direzione_acquisti VARCHAR(100);
ALTER TABLE soggetto ADD COLUMN IF NOT EXISTS provvigione_da_perc DECIMAL(5,2);
ALTER TABLE soggetto ADD COLUMN IF NOT EXISTS logistica_amm VARCHAR(100);
ALTER TABLE soggetto ADD COLUMN IF NOT EXISTS provvigione_las_perc DECIMAL(5,2);
ALTER TABLE soggetto ADD COLUMN IF NOT EXISTS direzione_commerciale VARCHAR(100);
ALTER TABLE soggetto ADD COLUMN IF NOT EXISTS provvigione_dc_perc DECIMAL(5,2);
ALTER TABLE soggetto ADD COLUMN IF NOT EXISTS listino_id INT REFERENCES listino(id);
ALTER TABLE soggetto ADD COLUMN IF NOT EXISTS trattamento_iva VARCHAR(50);
ALTER TABLE soggetto ADD COLUMN IF NOT EXISTS giorni_pagamento INT DEFAULT 0;
ALTER TABLE soggetto ADD COLUMN IF NOT EXISTS note_consegna TEXT;
```

---

## 📊 RIEPILOGO QUANTITATIVO

| Categoria | Campi Mancanti | Priorità Alta |
|-----------|----------------|---------------|
| Prodotto | 15+ | 8 |
| Movimento | 20+ | 12 |
| Dettaglio Movimento | 9 | 1 |
| Soggetto | 12 | 8 |
| **TOTALE** | **~56 campi** | **29 critici** |

**Senza questi campi, il 70% delle misure DAX Power BI non funziona!**

---

**Fine Analisi GAP**
