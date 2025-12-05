# SPECIFICHE TECNICHE SISTEMA POWER BI
## Documentazione Completa per Claude Code

---

## 📋 INDICE

1. [Overview Sistema](#overview-sistema)
2. [Architettura File Power BI](#architettura-file-power-bi)
3. [Modello Dati Dettagliato](#modello-dati-dettagliato)
4. [Misure DAX Complete](#misure-dax-complete)
5. [Relazioni tra Tabelle](#relazioni-tra-tabelle)
6. [Pattern e Best Practices](#pattern-e-best-practices)
7. [Requisiti Funzionali](#requisiti-funzionali)
8. [Task di Sviluppo](#task-di-sviluppo)

---

## OVERVIEW SISTEMA

### Descrizione Generale
Sistema BI aziendale composto da 4 report Power BI che coprono:
- **Amministrazione** (contabilità e finance)
- **Commerciale** (vendite e acquisti)
- **Documentale** (gestione documenti e tracking)
- **Operations** (logistica e pianificazione)

### Statistiche Sistema
```yaml
Numero File: 4
Dimensione Totale: ~12 MB
Tabelle Totali: 15-17 per file
Misure DAX: 34-37 per file
Relazioni: 20-25 per file
Duplicazione Codice: ~90% misure identiche
```

### File Power BI

| File | Dimensione | Tabelle | Misure | Relazioni | Focus |
|------|------------|---------|---------|-----------|-------|
| BI Amministrazione.pbix | 2.95 MB | 15 | 34 | 25 | Contabilità e Finance |
| BI Dati Acquisti e Vendite.pbix | 2.94 MB | 15 | 34 | 23 | Analisi Commerciale |
| BI Invio Documenti.pbix | 3.14 MB | 16 | 34 | 21 | Gestione Documentale |
| BI Operations.pbix | 3.26 MB | 17 | 37 | 20 | Operations e Logistica |

---

## ARCHITETTURA FILE POWER BI

### Percorsi File
```
C:\Users\loren\Downloads\POSTA CERTIFICATA_ R_ LETTERA DI INTENTI\
├── BI Amministrazione.pbix
├── BI Dati Acquisti e Vendite.pbix
├── BI Invio Documenti.pbix
└── BI Operations.pbix
```

### Pattern Architetturale
- **Modello**: Star Schema con "10 - Database All" come FACT centrale
- **Approccio**: Long format (tutti i movimenti in una tabella)
- **Relazioni**: Prevalentemente Many-to-Many bidirezionali
- **Date**: LocalDateTable auto-generate per time-intelligence

---

## MODELLO DATI DETTAGLIATO

### TABELLA FACT PRINCIPALE

#### 10 - Database All
**Tipo**: FACT TABLE (transazionale)  
**Descrizione**: Contiene tutti i movimenti di magazzino, vendite, acquisti, ordini  
**Granularità**: Riga di documento/movimento  
**Righe stimate**: Migliaia di record

**Colonne Chiave** (48 totali):

```yaml
# Identificativi
- ID: string (chiave univoca)
- n° documento: string
- Magazzino: string

# Date (3 campi per time-intelligence)
- Data movimento: datetime64[ns]
- Data Consegna: datetime64[ns]
- Data Pagamento: datetime64[ns]

# Prodotto
- Prodotto: string (FK verso Anagrafica Articoli)
- Descrizione Prodotto: string
- Stampa: string
- Descrizione oggetto: string
- Colore Fondo: string
- Brand: string
- Unità di Vendita: string

# Controparti
- Cod. Soggetto: string (FK verso Clienti/Fornitori)
- Descrizione Soggetto: string
- Agente: string

# Operazioni
- Causale movimento: string (Vendita/Acquisto/Ordine Attivo/Ordine Passivo/...)
- Tipo movimento: string
- Centro di Costo: string
- Contabilità: string

# Quantità
- Quantità Unità (Pz): Int64
- Quantità (con segno -/+): Int64  # IMPORTANTE: gestisce carico/scarico

# Valori Finanziari
- Valuta: string
- Prezzo Imponibile: Float64
- Valore Imponibile: decimal.Decimal
- Valore (Iva Compresa): Float64
- Iva: decimal.Decimal
- Valore Pagamento: Float64

# Provvigioni
- Listino di Riferim.: string
- Provvigione Agente (%): Float64
- Provvigione Agente (Valore): Float64
- Provvigione pagata Agente: Int64
- Provvigione D.A. (Valore): Int64
- Provvigione L.A.S. (Valore): Int64
- Provvigione D.C. (Valore): Int64

# Logistica
- Ove Confermato: string
- GG. Pagamento: Int64
- GG Standing: object
- Costo Trasporto: Float64
- Costo di Stampa: Float64
- ETD (Carry Out): string
- Vettore: string
- Termini di Resa: string

# Altri
- Note: string
- Nota su Operazione: string
- Tipo Pagamento: string
- Imponibilità: string
- n° doc.: string
```

---

### TABELLE DIMENSION

#### 01 - Anagrafica Articoli (versione 1)
**Tipo**: DIMENSION  
**Descrizione**: Master prodotti con prezzi e caratteristiche tecniche  
**Chiave**: Codice Articolo (string)

**Colonne Principali** (31 totali):

```yaml
# Identificativi
- Codice Articolo: string (PK)
- Descrizione Articolo: string

# Classificazione
- Macrofamiglia: string
- Famiglia: string

# Prezzi e Costi
- Prezzo a Magazzino: Float64  # CRITICO per calcoli marginalità
- % Iva: string

# Unità di Misura e Packaging
- Unità: string  # PZ/CRT
- Pezzi in Busta: string
- Buste in Cartone: string
- Pezzi per Cartone: string
- Cartoni per Pedana: string

# Planning
- Lead Time: Int64
- Transit Time: Int64
- Scorta minima: Int64  # CRITICO per calcolo fabbisogno

# Caratteristiche Prodotto
- Stampa: string
- Descrizione Oggetto: string
- Colore Fondo: string

# Prezzi con Oneri (colonne calcolate)
- Prezzo con Oneri Diretti di Vendita (da 1 a 5 pedane): string
- Prezzo con Oneri Diretti di Vendita (da 7 a 15 pedane): string

# Date Budget (12 colonne mensili)
- 01/01/2025: string
- 01/02/2025: string
# ... fino a 08/12/2025
```

---

#### Anagrafica Articoli (versione 2 - estesa)
**Tipo**: DIMENSION  
**Descrizione**: Anagrafica più dettagliata con info fornitori e EAN  
**Chiave**: COD / Codice Articolo Intero

**Colonne Aggiuntive** (55 totali):

```yaml
# Identificativi Estesi
- COD: string
- Ref.: Int64
- Codice Articolo Intero: string
- Codice Articolo (senza Colore): string
- GTIN (Numero EAN Code): Int64
- Proprietario del EAN Code: string

# Specifiche Tecniche
- Misura Prodotto: string
- Linea: string
- GSM: Int64
- PP%: Int64
- Codice Stampa: Int64
- H: Float64
- W: Int64
- L: Int64

# Packaging Dettagliato
- Pezzi in Busta: Int64
- Buste in Cartone: Int64
- CRT in Pallet: Int64
- Pcs in carton: Int64
- Weigth (kg): Float64

# Prezzi e Storico
- Prezzo Corrente Cartone (EUR): Float64
- Data Prezzo: datetime64[ns]
- Prezzo OLD Cartone (EUR): Float64
- OLD Data Prezzo: datetime64[ns]

# Fornitori
- Delivery Terms: string
- HS CODE: string
- %: Float64

# Descrizioni Multiple
- Totale Descrizione (Italiano): string
- Totale Descrizione per Fornitore: string
- Description for Supplier: string
- Line for Supplier: string
- Down Color for Supplier: string
- altre Istruzioni per Fornitore: string

# Immagini
- Picture: string
- Immagine EANhttps://...: string
```

---

#### 03 - Anagrafica Clienti e Fornitori
**Tipo**: DIMENSION  
**Descrizione**: Master controparti commerciali  
**Chiave**: Cod. Soggetto (string)

**Colonne** (29 totali):

```yaml
# Identificativi
- Cod. Soggetto: string (PK)
- Settore Soggetto: string
- Descrizione Soggetto: string

# Anagrafici
- Indirizzo 1: string
- Indirizzo 2: string
- Indirizzo di Destino se Diverso 1: string
- Indirizzo di Destino se Diverso 2: string
- Partita Iva: string
- SDI: string

# Contatti
- Riferimento: string
- mail Riferimento: string
- Recapito Telefonico: string
- Recapito Telefonico Ufficio: string

# Geolocalizzazione
- Provincia: string
- Regione: string

# Classificazione
- Macrofamiglia: string
- Famiglia: string

# Provvigioni (4 ruoli)
- Direzione Acquisti: string
- Provvigione D.A. (%): Float64
- Logistica, Amm. & Spedizioni: string
- Provvigione L.A.S. (%): Float64
- Direzione Commerciale: string
- Provvigione D.C. (%): Float64
- Agente: string
- Provvigione Agente (%): Float64

# Pagamenti
- Valuta: string
- Trattamento Iva: string
- Tipo Pagamento: string
- GG. Pagamento: string
- % Iva: string

# Logistica
- Note sulla consegna: string
```

---

#### 04 - Listini
**Tipo**: DIMENSION  
**Descrizione**: Gestione listini prezzi multipli  
**Chiave**: Cod. Prodotto (string)

**Colonne** (35+ totali):

```yaml
# Identificativi
- Cod. Prodotto: string (FK verso Articoli)
- Descrizione Articolo: string
- Prezzo a Magazzino: Float64

# Listini (9 livelli)
- Listino 1: Float64
- Listino 2: Float64
- Listino 3: Float64
- Listino 4: Float64
- Listino 5: Float64
- Listino 6: Float64
- Listino 7: Float64
- Listino 8: Float64
- Listino 9: Float64

# Provvigioni per Listino
- Provv. Listino 1: Float64
- Provv. Listino 2: Float64
# ... fino a Provv. Listino 9

# Margini per Listino (colonne calcolate)
- GM su List.1: string
- GM su List.2: string
# ... fino a GM su List.9

# Configurazione (future features)
- Tipo Listino (da utilizzare): Int64
- Cliente (da utilizzare): string
- Quantità (da utilizzare): Int64
- Valore Listino per Cliente (da utilizzare): Float64
- Valore Listino per Quantità (da utilizzare): Float64

# Prezzi con Oneri
- Prezzo con Oneri Diretti di Vendita (da 1 a 5 pedane): string
- Prezzo con Oneri Diretti di Vendita (da 7 a 15 pedane): string
```

---

#### 00 - Piano dei Conti
**Tipo**: DIMENSION  
**Descrizione**: Struttura contabile a 3 livelli  
**Chiave**: n° Conto (string)

**Colonne** (15 totali):

```yaml
# Livelli Gerarchici
- I Livello: Int64
- II Livello: Int64
- III Livello: Int64
- L.: Int64

# Identificativi
- n° Conto: string (PK)
- Descrizione Conto: string

# Classificazioni
- Tipo conto: string
- APCR: string
- C/Riclassif.1: string
- C/Riclassif.2: string
- C/Riclassif.3: string
- C/Riclassif.4: string

# Gestione
- Conto chiusura: string
- Conto apertura: string
- Attivo/disattivo: string
```

---

#### 02 - Set-up Articoli
**Tipo**: DIMENSION  
**Descrizione**: Configurazione tecnica prodotti  
**Chiave**: Cod. Prodotto (string)

**Colonne** (18 totali):

```yaml
# Identificativi
- EAN Code: string
- Cod. Prodotto: string (FK)
- Cod. Art. Primario: string
- Rif.Riga: Int64

# Descrizioni
- Descrizione Prodotto Intero: string
- Descrizione Prodotto: string
- Nome Disegno: string
- Descrizione Oggetto: string

# Codici Disegno
- Cod. Fondo: string
- Cod. Disegno: Int64
- Colore Fondo: string
- Colore Disegno: string

# Packaging
- Buste per Cartone: Int64
- Pz per Busta: Int64

# Altri
- Immagine: string
- Foto: string
- Note: string
- Target: string
- (da utilizzare): Int64
```

---

#### Budget
**Tipo**: FACT (planning)  
**Descrizione**: Dati di budget/forecast  
**Chiave**: ID (Int64)

**Colonne** (20 totali):

```yaml
# Identificativi
- ID: Int64 (PK)
- Prodotto: string (FK)
- Descrizione Prodotto: string
- Causale movimento: string

# Controparti
- Cod: string
- Soggetto: string
- Agente: string

# Date
- Data Scadenza: datetime64[ns]

# Quantità e Prezzi
- Unità: string
- Quantità: Int64
- Listino di Riferi.: string
- Prezzo da Listino: Float64
- Valuta: string
- Prezzo: string
- Sconto %: string
- Prezzo Imponibile: Float64
- Valore Imponibile: Float64

# Altri
- Note: string
- Column19: string
- Column20: string
```

---

#### Tabella Cambi-Quotazioni
**Tipo**: DIMENSION  
**Descrizione**: Tassi di cambio valute (presente in file 3 e 4)  
**Chiave**: Data + Valuta

```yaml
# Struttura (da definire in base al file)
- Data: datetime
- Valuta: string
- Tasso: Float64
- Valuta Base: string
```

---

#### Costi-Listini-Margini
**Tipo**: FACT/DIMENSION ibrida  
**Descrizione**: Analisi marginalità dettagliata (solo in BI Operations)

```yaml
# Struttura da analizzare nel file specifico
# Probabilmente contiene:
- Cod. Prodotto: string
- Listino: Int64
- Costo: Float64
- Prezzo Vendita: Float64
- Margine: Float64
- Margine %: Float64
```

---

#### OLD - Anagrafica Articoli
**Tipo**: DIMENSION (storicizzata)  
**Descrizione**: Versione precedente anagrafica per tracking variazioni  
**Presente in**: File 3 (BI Invio Documenti)

```yaml
# Stessa struttura di "01 - Anagrafica Articoli"
# Usata per:
- Tracking variazioni prezzi
- Confronti storici
- Audit trail
```

---

### TABELLE TEMPORALI (LocalDateTable)

Ogni file ha 6-7 LocalDateTable auto-generate da Power BI:

```yaml
# Struttura Standard LocalDateTable
- Anno: Int64
- NumMese: Int64
- Mese: string
- NumTrimestre: Int64
- Trimestre: string
- Giorno: Int64
```

**Mapping Date-Table**:
- LocalDateTable_12846431-e9ac-4a5b-9a01-b01b67f60c34 → Data movimento
- LocalDateTable_aba34a4b-e51e-4cac-bd47-b2d5861a9ed9 → Data Consegna
- LocalDateTable_b96f92e2-968b-49dc-83e6-32c92c3d4bb4 → Data Pagamento
- LocalDateTable_fdcc384c-4449-479f-b32c-a11863d486cf → Budget Data Scadenza
- (altre per date specifiche di ogni file)

---

## MISURE DAX COMPLETE

### CATEGORIA: MAGAZZINO E GIACENZE

#### 1. Valore Magazzino (Iva Escl.)
```dax
Valore Magazzino. (Iva Escl.) = 
SUMX(
    '10 - Database All',
    '10 - Database All'[Quantità (con segno -/+)] *
    LOOKUPVALUE(
        '01 - Anagrafica Articoli'[Prezzo a Magazzino],
        '01 - Anagrafica Articoli'[Codice Articolo],
        '10 - Database All'[Prodotto]
    )
)
```
**Uso**: Valorizzazione magazzino al costo  
**Tabella**: 10 - Database All  
**Dipendenze**: Anagrafica Articoli[Prezzo a Magazzino]

---

#### 2. Valore Magazzino (Iva Compr.)
```dax
Valore Magazzino (Iva Compr.) = 
[Valore Magazzino. (Iva Escl.)] * 1.22
```
**Uso**: Valorizzazione magazzino IVA inclusa  
**Tabella**: 10 - Database All  
**Dipendenze**: [Valore Magazzino. (Iva Escl.)]  
**Note**: Aliquota IVA fissa 22%

---

#### 3. Qta in Giacenza
```dax
Qta in Giacenza = 
VAR Giacenza = 
    CALCULATE(
        SUMX(
            '10 - Database All',
            '10 - Database All'[Quantità (con segno -/+)]
        ),
        '10 - Database All'[Causale movimento] <> "Ordine Attivo",
        '10 - Database All'[Causale movimento] <> "Ordine Passivo"
    )
RETURN 
    IF(ABS(Giacenza) < 0.01, BLANK(), Giacenza)
```
**Uso**: Quantità effettivamente in magazzino  
**Tabella**: 10 - Database All  
**Logica**: Esclude ordini da evadere (Attivi) e da ricevere (Passivi)  
**Note**: Threshold 0.01 per gestire errori di arrotondamento

---

#### 4. Qta Ordinata
```dax
Qta Ordinata = 
CALCULATE(
    SUMX('10 - Database All', [Quantità (con segno -/+)]),
    '10 - Database All'[Causale movimento] = "Ordine Passivo"
)
```
**Uso**: Quantità in ordine dai fornitori (in arrivo)  
**Tabella**: 10 - Database All  
**Causale**: Ordine Passivo

---

#### 5. Qta Impegnata
```dax
Qta Impegnata = 
CALCULATE(
    SUMX('10 - Database All', [Quantità (con segno -/+)]),
    '10 - Database All'[Causale movimento] = "Ordine Attivo"
)
```
**Uso**: Quantità impegnata per ordini clienti (da evadere)  
**Tabella**: 10 - Database All  
**Causale**: Ordine Attivo

---

#### 6. Qta Fabbisogno
```dax
Qta Fabbisogno = 
IF(
    ([Qta in Giacenza] + [Qta Ordinata] + [Qta Impegnata] - SUM('01 - Anagrafica Articoli'[Scorta minima])) < 0,
    ([Qta in Giacenza] + [Qta Ordinata] + [Qta Impegnata] - SUM('01 - Anagrafica Articoli'[Scorta minima])),
    BLANK()
)
```
**Uso**: Calcolo fabbisogno di riordino (MRP-like)  
**Tabella**: 10 - Database All  
**Logica**: Mostra solo valori negativi (= manca merce)  
**Formula**: Giacenza + In Arrivo - In Uscita - Scorta Min

---

#### 7. Qta Fabbisogno (no Sc.Min.)
```dax
Qta Fabbisogno (no Sc.Min.) = 
IF(
    ([Qta in Giacenza] + [Qta Ordinata] + [Qta Impegnata]) < 0,
    ([Qta in Giacenza] + [Qta Ordinata] + [Qta Impegnata]),
    BLANK()
)
```
**Uso**: Fabbisogno senza considerare scorta di sicurezza  
**Tabella**: 10 - Database All

---

#### 8. Costo Fabbisogno
```dax
Costo Fabbisogno = 
[Qta Fabbisogno] * AVERAGE('01 - Anagrafica Articoli'[Prezzo a Magazzino])
```
**Uso**: Valorizzazione del fabbisogno  
**Tabella**: 10 - Database All

---

#### 9. Costo Fabbisogno (no Sc.Min.)
```dax
Costo Fabbisogno (no Sc.Min.) = 
[Qta Fabbisogno (no Sc.Min.)] * AVERAGE('01 - Anagrafica Articoli'[Prezzo a Magazzino])
```

---

#### 10. Qta Saldo Giacenza Vs Impegni
```dax
Qta Saldo Giacenza Vs Impegni = 
[Qta in Giacenza] + [Qta Impegnata]
```
**Uso**: Disponibilità effettiva (giacenza - impegni)  
**Note**: Impegnata è negativa, quindi somma = sottrazione

---

### CATEGORIA: CONVERSIONI UNITÀ DI MISURA

#### 11. Pezzi in Cartone
```dax
Pezzi in Cartone = 
MIN('01 - Anagrafica Articoli'[Pezzi in Busta]) * MIN('01 - Anagrafica Articoli'[Buste in Cartone])
```
**Uso**: Calcolo pezzi per cartone  
**Tabella**: 01 - Anagrafica Articoli

---

#### 12. Quantità Buste
```dax
Quantità Buste = 
IF(
    SELECTEDVALUE('01 - Anagrafica Articoli'[Unità]) = "PZ",
    DIVIDE(
        SUM('10 - Database All'[Quantità Unità (Pz)]),
        MIN('01 - Anagrafica Articoli'[Pezzi in Busta])
    ),
    IF(
        SELECTEDVALUE('01 - Anagrafica Articoli'[Unità]) = "CRT",
        SUM('10 - Database All'[Quantità Unità (Pz)]) * MIN('01 - Anagrafica Articoli'[Buste in Cartone]),
        BLANK()
    )
)
```
**Uso**: Conversione da PZ o CRT a BUSTE  
**Logica**: 
- Se unità = PZ: divide per pezzi in busta
- Se unità = CRT: moltiplica per buste in cartone

---

#### 13. Quantità Cartoni
```dax
Quantità Cartoni = 
IF(
    SELECTEDVALUE('01 - Anagrafica Articoli'[Unità]) = "PZ",
    DIVIDE(
        SUM('10 - Database All'[Quantità Unità (Pz)]),
        [Pezzi in Cartone]
    ),
    IF(
        SELECTEDVALUE('01 - Anagrafica Articoli'[Unità]) = "CRT",
        SUM('10 - Database All'[Quantità Unità (Pz)]),
        BLANK()
    )
)
```
**Uso**: Conversione a CARTONI

---

#### 14. Quantità Buste (-/+)
```dax
Quantità Buste (-/+) = 
VAR Unita = SELECTEDVALUE('01 - Anagrafica Articoli'[Unità])
VAR Qta = SUM('10 - Database All'[Quantità (con segno -/+)])
VAR PezziInBusta = MIN('01 - Anagrafica Articoli'[Pezzi in Busta])
VAR BusteInCartone = MIN('01 - Anagrafica Articoli'[Buste in Cartone])
VAR Risultato = 
    SWITCH(
        TRUE(),
        Unita = "PZ", DIVIDE(Qta, PezziInBusta),
        Unita = "CRT", Qta * BusteInCartone,
        BLANK()
    )
RETURN 
    IF(ABS(Risultato) < 0.01, BLANK(), Risultato)
```
**Uso**: Conversione con gestione segno (carico/scarico)  
**Pattern**: SWITCH(TRUE()) invece di IF nidificati  
**Note**: Gestisce near-zero come BLANK

---

#### 15. Quantità Cartoni (-/+)
```dax
Quantità Cartoni (-/+) = 
VAR Unita = SELECTEDVALUE('01 - Anagrafica Articoli'[Unità])
VAR Qta = SUM('10 - Database All'[Quantità (con segno -/+)])
VAR PezziInCartone = [Pezzi in Cartone]
VAR Risultato = 
    SWITCH(
        TRUE(),
        Unita = "PZ", DIVIDE(Qta, PezziInCartone),
        Unita = "CRT", Qta,
        BLANK()
    )
RETURN 
    IF(ABS(Risultato) < 0.01, BLANK(), Risultato)
```

---

#### 16. Qtà Pedane (sulle Quantità normali)
```dax
Qtà Pedane (sulle Quantità normali) = 
VAR CartoniPerPedana = MIN('01 - Anagrafica Articoli'[Cartoni per Pedana])
VAR Risultato = 
    SUMX(
        '10 - Database All',
        DIVIDE(
            '10 - Database All'[Quantità (con segno -/+)],
            CartoniPerPedana
        )
    )
RETURN 
    IF(ABS(Risultato) < 0.01, BLANK(), Risultato)
```
**Uso**: Conversione a PEDANE/PALLET

---

#### 17. Qtà Pedane (sulle Quantità al netto di Impegni)
```dax
Qtà Pedane (sulle Quantità al netto di Impegni) = 
VAR CartoniPerPedana = MIN('01 - Anagrafica Articoli'[Cartoni per Pedana])
VAR Risultato = 
    SUMX(
        '10 - Database All',
        DIVIDE(
            '10 - Database All'[Qta Saldo Giacenza Vs Impegni],
            CartoniPerPedana
        )
    )
RETURN 
    IF(ABS(Risultato) < 0.01, BLANK(), Risultato)
```

---

#### 18. Qtà Pedane (sulle Quantità Giacenza)
```dax
Qtà Pedane (sulle Quantità Giacenza) = 
VAR CartoniPerPedana = MIN('01 - Anagrafica Articoli'[Cartoni per Pedana])
VAR Risultato = 
    SUMX(
        '10 - Database All',
        DIVIDE(
            '10 - Database All'[Qta in Giacenza]
        )
    )
RETURN 
    IF(ABS(Risultato) < 0.01, BLANK(), Risultato)
```
**Note**: Solo in BI Operations (file 4)

---

### CATEGORIA: MARGINALITÀ E COSTI

#### 19. Ricavi Vendite
```dax
Ricavi Vendite = 
CALCULATE(
    SUM('10 - Database All'[Valore Imponibile]),
    '10 - Database All'[Causale movimento] = "Vendita"
)
```
**Uso**: Totale ricavi da vendite  
**Causale**: Vendita

---

#### 20. Costo Merci
```dax
Costo Merci = 
SUM('10 - Database All'[Quantità (con segno -/+)]) * AVERAGE('01 - Anagrafica Articoli'[Prezzo a Magazzino])
```
**Uso**: Costo del venduto (COGS)  
**Note**: Usa prezzo medio a magazzino

---

#### 21. Costi di Gestione
```dax
Costi di Gestione = 
CALCULATE(
    SUM('10 - Database All'[Valore Imponibile]),
    NOT '10 - Database All'[Causale movimento] = "Vendita"
)
```
**Uso**: Tutti i costi operativi (tutto tranne vendite)

---

#### 22. Oneri Diretti sulle Vendite
```dax
Oneri Diretti sulle Vendite = 
SUMX(
    '10 - Database All',
    '10 - Database All'[Provvigione D.A. (Valore)] +
    '10 - Database All'[Provvigione L.A.S. (Valore)] +
    '10 - Database All'[Provvigione D.C. (Valore)] +
    '10 - Database All'[Provvigione Agente (Valore)]
)
```
**Uso**: Somma di tutte le provvigioni dirette  
**Componenti**:
- D.A. = Direzione Acquisti
- L.A.S. = Logistica, Amministrazione, Spedizioni
- D.C. = Direzione Commerciale
- Agente = Rete vendita

---

#### 23. Merci e On.Dir
```dax
Merci e On.Dir = 
[Costo Merci] + [Oneri Diretti sulle Vendite]
```
**Uso**: Costo variabile totale

---

#### 24. GM Valore
```dax
GM Valore = 
SUMX('10 - Database All', [Ricavi Vendite] + [Costo Merci] + [Costi di Gestione])
```
**Uso**: Gross Margin in valore assoluto  
**Formula**: Ricavi - Costo Merci - Costi Gestione  
**Note**: Costi sono negativi, quindi somma = sottrazione

---

#### 25. GM %
```dax
GM % = 
IF(
    [GM Valore] = SUM('10 - Database All'[Valore Imponibile]),
    BLANK(),
    [GM Valore] / SUM('10 - Database All'[Valore Imponibile])
)
```
**Uso**: Gross Margin percentuale  
**Logica**: Se GM = Ricavi → BLANK (nessun costo, caso anomalo)  
**Protezione**: Evita di mostrare sempre 100%

---

### CATEGORIA: FINANZIARIO

#### 26. Circolante
```dax
Circolante = 
SUMX(
    '10 - Database All',
    '10 - Database All'[Valore Magazzino (Iva Compr.)] +
    '10 - Database All'[Valore (Iva Compresa)]
) + SUM('10 - Database All'[Iva])
```
**Uso**: Capitale circolante totale  
**Componenti**: Magazzino + Crediti + IVA

---

#### 27. Saldo Fatture
```dax
Saldo Fatture = 
SUMX(
    '10 - Database All',
    '10 - Database All'[Valore (Iva Compresa)] + '10 - Database All'[Valore Pagamento]
)
```
**Uso**: Crediti/debiti aperti  
**Logica**: Valore Fattura + Pagamenti (negativi) = Saldo

---

#### 28. Saldo Provv.Agenti
```dax
Saldo Provv.Agenti = 
SUMX(
    '10 - Database All',
    '10 - Database All'[Provvigione Agente (Valore)] - '10 - Database All'[Provvigione pagata Agente]
)
```
**Uso**: Provvigioni maturate ma non ancora pagate

---

#### 29. ValoreTroncato
```dax
ValoreTroncato = 
VAR x = SUM('10 - Database All'[Valore (Iva Compresa)])
RETURN 
    IF(ABS(x) < 0.01, BLANK(), x)
```
**Uso**: Helper per gestire arrotondamenti  
**Threshold**: 0.01 €

---

### CATEGORIA: DATE E SCADENZE

#### 30. GG Differenza date
```dax
GG Differenza date = 
IF(
    [Valore (Iva Compresa) 2] = BLANK(), 
    BLANK(),
    DATEDIFF(TODAY(), MAX('10 - Database All'[GG Standing]), DAY)
)
```
**Uso**: Giorni di ritardo/anticipo scadenze  
**Note**: Dipende da misura non documentata [Valore (Iva Compresa) 2]

---

### CATEGORIA: FILTRI E HELPER

#### 31. Righe a Zero (Fabbisogno)
```dax
Righe a Zero (Fabbisogno) = 
IF(
    [Qta in Giacenza] + [Qta Impegnata] + [Qta Ordinata] + SUM('01 - Anagrafica Articoli'[Scorta minima]) = 0,
    0,
    1
)
```
**Uso**: Filtro visual-level per nascondere righe vuote  
**Pattern**: Ritorna 0 (nasconde) o 1 (mostra)

---

#### 32. Righe Zero (Val.Iva Compr.)
```dax
Righe Zero (Val.Iva Compr.) = 
VAR SommaValori = SUMX('10 - Database All', '10 - Database All'[ValoreTroncato])
RETURN 
    IF(ABS(SommaValori) < 0.01, BLANK(), 1)
```

---

#### 33. Righe a Zero (se nessun Listino)
```dax
Righe a Zero (se nessun Listino) = 
IF(
    SUMX(
        '04 - Listini',
        '04 - Listini'[Listino 1] + '04 - Listini'[Listino 2] + '04 - Listini'[Listino 3] + 
        '04 - Listini'[Listino 4] + '04 - Listini'[Listino 5] + '04 - Listini'[Listino 6] + 
        '04 - Listini'[Listino 7] + '04 - Listini'[Listino 8] + '04 - Listini'[Listino 9]
    ) = 0,
    0,
    1
)
```

---

#### 34. Righe a Zero (Iva)
```dax
Righe a Zero (Iva) = 
IF(
    SUMX('10 - Database All', '10 - Database All'[Iva]) = 0,
    0,
    1
)
```

---

#### 35. Righe a Zero (Saldo Qtà)
```dax
Righe a Zero (Saldo Qtà) = 
VAR TotaleGiacenza = 
    CALCULATE(
        SUMX(
            '10 - Database All',
            '10 - Database All'[Quantità (con segno -/+)]
        ),
        '10 - Database All'[Causale movimento] <> "Ordine Attivo",
        '10 - Database All'[Causale movimento] <> "Ordine Passivo"
    )
RETURN 
    IF(ABS(TotaleGiacenza) < 0.01, 0, 1)
```

---

#### 36. Righe a Zero (Giacenza Vs impegni)
```dax
Righe a Zero (Giacenza Vs impegni) = 
IF(
    [Qta in Giacenza] + [Qta Impegnata] = 0,
    0,
    1
)
```
**Note**: Solo in BI Operations

---

#### 37. Righe a Zero (Qta in Giacenza)
```dax
Righe a Zero (Qta in Giacenza) = 
IF(
    [Qta in Giacenza] = 0,
    0,
    1
)
```
**Note**: Solo in BI Operations

---

## RELAZIONI TRA TABELLE

### Schema Relazionale

#### Relazioni ATTIVE (IsActive = 1)

```yaml
# PRODOTTI
01 - Anagrafica Articoli[Codice Articolo] ←→ (M:M) 10 - Database All[Prodotto]
  - Cardinality: Many-to-Many
  - CrossFilteringBehavior: Both
  - CHIAVE PRINCIPALE per analisi prodotto

01 - Anagrafica Articoli[Codice Articolo] ←→ (M:M) 04 - Listini[Cod. Prodotto]
  - Cardinality: Many-to-Many
  - CrossFilteringBehavior: Both

01 - Anagrafica Articoli[Descrizione Articolo] ←→ (M:M) 02 - Set-up Articoli[Descrizione Prodotto]
  - Cardinality: Many-to-Many
  - CrossFilteringBehavior: Both

# CLIENTI/FORNITORI
03 - Anagrafica Clienti e Fornitori[Cod. Soggetto] ←→ (M:M) 10 - Database All[Cod. Soggetto]
  - Cardinality: Many-to-Many
  - CrossFilteringBehavior: Both
  - CHIAVE PRINCIPALE per analisi controparti

# DATE (Many-to-One verso LocalDateTable)
10 - Database All[Data movimento] → (M:1) LocalDateTable_xxx
  - FromKeyCount: 161 date distinte
  
10 - Database All[Data Consegna] → (M:1) LocalDateTable_xxx
  - FromKeyCount: 130 date distinte
  
10 - Database All[Data Pagamento] → (M:1) LocalDateTable_xxx
  - FromKeyCount: 190 date distinte

Budget[Data Scadenza] → (M:1) LocalDateTable_xxx
  - FromKeyCount: 15 date distinte

Anagrafica Articoli[Data Prezzo] → (M:1) LocalDateTable_xxx
  - FromKeyCount: 6 date distinte

Anagrafica Articoli[OLD Data Prezzo] → (M:1) LocalDateTable_xxx
  - FromKeyCount: 5 date distinte

# BUDGET
Budget[Prodotto] ←→ (M:M) 10 - Database All[Prodotto]
  - Cardinality: Many-to-Many
  - CrossFilteringBehavior: Both

# ALTRE (file specifici)
Anagrafica Articoli[Unità di Vendita] ←→ (M:M) 10 - Database All[Unità di Vendita]
  - Presente in: BI Invio Documenti, BI Operations
```

#### Relazioni INATTIVE (IsActive = 0)

```yaml
# Alternative per articoli
01 - Anagrafica Articoli[Codice Articolo] ←→ 02 - Set-up Articoli[Cod. Prodotto]
01 - Anagrafica Articoli[Descrizione Articolo] ←→ 10 - Database All[Descrizione Prodotto]

# Alternative per controparti
03 - Anagrafica Clienti e Fornitori[Descrizione Soggetto] ←→ 10 - Database All[Descrizione Soggetto]

# Alternative listini
04 - Listini[Cod. Prodotto] ←→ 10 - Database All[Prodotto]
04 - Listini[Descrizione Articolo] ←→ 10 - Database All[Descrizione Prodotto]

# Alternative set-up
02 - Set-up Articoli[Cod. Prodotto] ←→ 10 - Database All[Prodotto]
02 - Set-up Articoli[Descrizione Prodotto] ←→ 10 - Database All[Descrizione Prodotto]

# Alternative Budget
Budget[Prodotto] ←→ 04 - Listini[Cod. Prodotto]
Budget[Prodotto] ←→ 02 - Set-up Articoli[Cod. Prodotto]
Budget[Prodotto] ←→ 01 - Anagrafica Articoli[Codice Articolo]

# Altre
10 - Database All[Tipo movimento] ←→ 01 - Anagrafica Articoli[Macrofamiglia]
Anagrafica Articoli[Codice Articolo Intero] ←→ 10 - Database All[Prodotto]
Anagrafica Articoli[Descrizione] ←→ 10 - Database All[Descrizione Prodotto]
```

### Diagramma Relazionale Semplificato

```
        ┌─────────────────────────┐
        │  00 - Piano dei Conti  │
        └─────────────────────────┘
                    
        ┌─────────────────────────┐
        │ 01 - Anagrafica Articoli│
        └───────────┬─────────────┘
                    │ M:M (Both)
                    │
        ┌───────────▼─────────────┐
        │   04 - Listini         │
        └───────────┬─────────────┘
                    │ M:M
                    │
╔═══════════════════▼══════════════════╗
║     10 - Database All (FACT)         ║
║  ┌────────────────────────────┐     ║
║  │  Data movimento  →  📅     │     ║
║  │  Data Consegna   →  📅     │     ║
║  │  Data Pagamento  →  📅     │     ║
║  └────────────────────────────┘     ║
╚═══════════════════════════════════════╝
                    ▲
                    │ M:M (Both)
        ┌───────────┴─────────────┐
        │ 03 - Anagrafica Clienti │
        │     e Fornitori         │
        └─────────────────────────┘
                    
        ┌─────────────────────────┐
        │  02 - Set-up Articoli  │
        └─────────────────────────┘
                    
        ┌─────────────────────────┐
        │       Budget           │
        └─────────────────────────┘
```

---

## PATTERN E BEST PRACTICES

### Pattern DAX Identificati

#### 1. SWITCH(TRUE()) invece di IF nidificati
```dax
-- ❌ EVITARE (difficile da leggere)
IF(
    condizione1, risultato1,
    IF(
        condizione2, risultato2,
        IF(condizione3, risultato3, default)
    )
)

-- ✅ PREFERIRE (più leggibile)
SWITCH(
    TRUE(),
    condizione1, risultato1,
    condizione2, risultato2,
    condizione3, risultato3,
    default
)
```

#### 2. Gestione Near-Zero con Threshold
```dax
-- Pattern usato ovunque per gestire arrotondamenti
VAR Risultato = [Calcolo complesso]
RETURN 
    IF(ABS(Risultato) < 0.01, BLANK(), Risultato)
```
**Perché**: Evita di mostrare 0.0001 o -0.0002 dovuti ad arrotondamenti

#### 3. Righe a Zero per Filtri Visual-Level
```dax
-- Pattern per nascondere righe vuote senza filtrare dati
IF([Misura] = 0, 0, 1)
```
**Uso**: Aggiungere come filtro visual con condizione = 1

#### 4. LOOKUPVALUE vs Relazioni
```dax
-- Usato quando relazioni M:M non bastano
LOOKUPVALUE(
    'Tabella'[Colonna Ritorno],
    'Tabella'[Colonna Chiave],
    [Valore Chiave]
)
```
**Pro**: Flessibilità  
**Contro**: Performance peggiori  
**Raccomandazione**: Sostituire con relazioni dove possibile

#### 5. Variabili VAR per Leggibilità
```dax
-- ✅ BUONA PRATICA
VAR Giacenza = [Calcolo Giacenza]
VAR Ordinato = [Calcolo Ordinato]
VAR Impegnato = [Calcolo Impegnato]
RETURN 
    Giacenza + Ordinato + Impegnato
```

#### 6. CALCULATE con Filtri Multipli
```dax
-- Esclusione multipla
CALCULATE(
    [Misura],
    'Tabella'[Campo] <> "Valore1",
    'Tabella'[Campo] <> "Valore2"
)
```

---

### Naming Conventions

#### Tabelle
```
[Numero] - [Nome Tabella]
Esempi:
- 00 - Piano dei Conti
- 01 - Anagrafica Articoli
- 10 - Database All
```

#### Colonne
```
[Nome Descrittivo]
Esempi:
- Codice Articolo
- Data movimento
- Quantità (con segno -/+)
```

#### Misure
```
[Nome Descrittivo] oppure [Nome Descrittivo (specifica)]
Esempi:
- Qta in Giacenza
- Valore Magazzino (Iva Compr.)
- GM %
```

---

### Dimensioni di Filtraggio Standard

#### Sempre Presenti (4/4 file)
1. **Data Movimento** - Analisi temporale principale
2. **Data Consegna** - Planning logistico
3. **Data Pagamento** - Cash flow
4. **Prodotto** → Macrofamiglia → Famiglia → Codice
5. **Cliente/Fornitore** → Settore → Regione
6. **Causale Movimento** - Tipo operazione
7. **Agente** - Performance commerciale
8. **Listino** - Analisi pricing

#### Spesso Presenti (3/4 file)
9. **Valuta** - Multi-currency
10. **Magazzino** - Multi-warehouse

---

## REQUISITI FUNZIONALI

### Dashboard Richieste

#### 1. Dashboard Giacenze (PRIORITÀ ALTA)
**Presente in**: Tutti e 4 i file  
**Utenti**: Operations, Acquisti, Logistica, Amministrazione

**Visualizzazioni**:
- Card KPI: Valore Magazzino Totale
- Card KPI: Quantità in Giacenza
- Card KPI: Quantità Ordinata
- Card KPI: Quantità Impegnata
- Tabella: Dettaglio per prodotto con colonne:
  - Codice Articolo
  - Descrizione
  - Qta Giacenza
  - Qta Ordinata
  - Qta Impegnata
  - Qta Fabbisogno
  - Valore Magazzino
- Grafico Barre: Top 10 prodotti per valore magazzino
- Grafico Stacked: Giacenza + Ordinato + Impegnato per famiglia

**Filtri**:
- Macrofamiglia
- Famiglia
- Magazzino
- Data movimento (slicer)

---

#### 2. Dashboard Marginalità (PRIORITÀ ALTA)
**Presente in**: Tutti e 4 i file  
**Utenti**: Direzione, Commerciale, CFO

**Visualizzazioni**:
- Card KPI: Ricavi Vendite
- Card KPI: GM Valore
- Card KPI: GM %
- Card KPI: Costo Merci
- Waterfall Chart: Ricavi → Costo Merci → Oneri Diretti → GM
- Tabella: Per prodotto/cliente con:
  - Ricavi
  - Costo Merci
  - Oneri Diretti
  - GM Valore
  - GM %
- Scatter Plot: Volume vs Margine
- Grafico Linee: Trend GM% nel tempo

**Filtri**:
- Data movimento
- Cliente
- Prodotto
- Agente
- Listino

---

#### 3. Dashboard Commerciale (PRIORITÀ MEDIA)
**Presente in**: BI Dati Acquisti e Vendite, BI Amministrazione  
**Utenti**: Sales Manager, Agenti

**Visualizzazioni**:
- Card: Ricavi Totali
- Card: N° Ordini
- Card: Ticket Medio
- Grafico Barre: Top 10 Clienti
- Grafico Barre: Top 10 Prodotti
- Tabella: Performance Agenti
- Grafico Linee: Trend vendite mensile

**Filtri**:
- Periodo
- Agente
- Regione
- Famiglia prodotto

---

#### 4. Dashboard Fabbisogni (PRIORITÀ ALTA)
**Presente in**: BI Operations, BI Amministrazione  
**Utenti**: Acquisti, Operations

**Visualizzazioni**:
- Card: Totale Fabbisogno (€)
- Card: N° Articoli sotto scorta
- Tabella: Lista articoli con fabbisogno negativo
  - Codice
  - Descrizione
  - Giacenza
  - Ordinato
  - Impegnato
  - Scorta Min
  - Fabbisogno
  - Costo Fabbisogno
  - Lead Time
  - Fornitore suggerito
- Heatmap: Articoli sotto scorta per famiglia
- Grafico Gantt: Planning arrivi merce

**Filtri**:
- Famiglia
- Fornitore
- Lead Time range

---

#### 5. Dashboard Documentale (PRIORITÀ MEDIA)
**Presente in**: BI Invio Documenti  
**Utenti**: Back office, Logistica

**Visualizzazioni**:
- Card: Documenti da emettere
- Card: Documenti in attesa conferma
- Card: Documenti confermati
- Tabella: Lista documenti con stato
- Timeline: Documenti per data prevista
- Grafico Barre: Volumi per paese

**Filtri**:
- Stato documento
- Tipo documento
- Cliente
- Data

---

### Funzionalità di Export

**Richieste**:
- Export Excel di tutte le tabelle
- Export PDF dei report
- Invio email automatico report schedulati
- Download dati grezzi per analisi esterne

---

## TASK DI SVILUPPO

### FASE 1: CONSOLIDAMENTO (PRIORITÀ ALTA)

#### Task 1.1: Creare Dataset Condiviso
**Obiettivo**: Centralizzare le 34 misure comuni  
**Stima**: 2-3 giorni

**Attività**:
1. Creare nuovo file Power BI "BI - Dataset Condiviso.pbix"
2. Importare modello dati da un file esistente (preferibilmente BI Amministrazione)
3. Rimuovere report pages (solo dataset)
4. Pubblicare su Power BI Service
5. Modificare i 4 file esistenti per usare "Connessione Live" al dataset

**Benefici**:
- Riduzione 75% effort manutenzione
- Consistenza garantita tra report
- Aggiornamenti centralizzati

**File Deliverable**:
```
BI - Dataset Condiviso.pbix
├── Modello Dati completo
├── 34 Misure DAX
└── 0 Report Pages

I 4 file diventano:
BI Amministrazione.pbix (live connection)
├── Connessione a Dataset Condiviso
└── Report Pages solo visualizzazioni

BI Dati Acquisti e Vendite.pbix (live connection)
BI Invio Documenti.pbix (live connection)
BI Operations.pbix (live connection)
```

---

#### Task 1.2: Documentare Misure DAX
**Obiettivo**: Aggiungere descrizioni alle misure  
**Stima**: 1 giorno

**Attività**:
1. Per ogni misura, aggiungere Description property con:
   - Scopo della misura
   - Logica di calcolo
   - Dipendenze
   - Esempi di uso
2. Creare documento esterno con catalogo misure

**Template Descrizione**:
```
[Nome Misura]
Scopo: Calcola...
Logica: Utilizza CALCULATE per filtrare...
Dipendenze: [Misura A], [Misura B]
Esempio: Usare in tabella con drill-down per famiglia prodotto
```

---

#### Task 1.3: Ottimizzare Performance
**Obiettivo**: Sostituire LOOKUPVALUE con relazioni  
**Stima**: 2 giorni

**Misure da Ottimizzare**:
1. Valore Magazzino (Iva Escl.)
   - Attualmente: LOOKUPVALUE per prezzo
   - Proposta: Relazione diretta Articoli-DatabaseAll

**Test Performance**:
- Benchmark query times prima/dopo
- Test con dataset reale
- Validare risultati identici

---

### FASE 2: MIGLIORAMENTI ANALITICI (PRIORITÀ MEDIA)

#### Task 2.1: Aggiungere Time Intelligence
**Obiettivo**: Analisi temporali avanzate  
**Stima**: 2 giorni

**Nuove Misure da Creare**:
```dax
-- Year-over-Year
Ricavi Vendite YoY = 
CALCULATE(
    [Ricavi Vendite],
    SAMEPERIODLASTYEAR('Date'[Date])
)

Ricavi Vendite YoY % = 
DIVIDE(
    [Ricavi Vendite] - [Ricavi Vendite YoY],
    [Ricavi Vendite YoY]
)

-- Month-over-Month
Ricavi Vendite MoM = 
CALCULATE(
    [Ricavi Vendite],
    DATEADD('Date'[Date], -1, MONTH)
)

-- Year-to-Date
Ricavi Vendite YTD = 
TOTALYTD(
    [Ricavi Vendite],
    'Date'[Date]
)

-- Moving Average
Ricavi Vendite MA3 = 
AVERAGEX(
    DATESINPERIOD('Date'[Date], LASTDATE('Date'[Date]), -3, MONTH),
    [Ricavi Vendite]
)
```

**Dashboard da Creare**:
- "Analisi Trend" con grafici YoY, MoM, YTD

---

#### Task 2.2: Implementare Forecast Giacenze
**Obiettivo**: Previsione fabbisogni  
**Stima**: 3 giorni

**Algoritmo**:
1. Calcolare consumo medio giornaliero (ultimi 90 giorni)
2. Calcolare days of supply: Giacenza / Consumo Medio
3. Forecast data esaurimento
4. Alert se < Lead Time + Transit Time

**Nuove Misure**:
```dax
Consumo Medio Giornaliero = 
VAR GiorniAnalisi = 90
VAR ConsumoTotale = 
    CALCULATE(
        ABS(SUM('10 - Database All'[Quantità (con segno -/+)])),
        '10 - Database All'[Causale movimento] = "Vendita",
        DATESINPERIOD('Date'[Date], TODAY(), -GiorniAnalisi, DAY)
    )
RETURN 
    DIVIDE(ConsumoTotale, GiorniAnalisi)

Days of Supply = 
DIVIDE(
    [Qta in Giacenza],
    [Consumo Medio Giornaliero]
)

Data Esaurimento Prevista = 
TODAY() + [Days of Supply]

Alert Sottoscorta = 
IF(
    [Days of Supply] < (SUM('01 - Anagrafica Articoli'[Lead Time]) + SUM('01 - Anagrafica Articoli'[Transit Time])),
    "🔴 URGENTE",
    IF([Days of Supply] < 30, "🟡 ATTENZIONE", "🟢 OK")
)
```

---

#### Task 2.3: Dashboard Executive
**Obiettivo**: Vista sintetica per top management  
**Stima**: 2 giorni

**KPI da Includere**:
- Ricavi MTD vs Target
- GM % attuale vs target
- Valore Magazzino
- Days of Supply medio
- Saldo Fatture (DSO)
- Top 5 Clienti
- Top 5 Prodotti
- Trend ultimi 12 mesi

**Formato**: 1 pagina, visualizzazioni compatte

---

### FASE 3: GOVERNANCE (PRIORITÀ BASSA)

#### Task 3.1: Implementare Row-Level Security
**Obiettivo**: Limitare accesso dati per ruolo  
**Stima**: 2 giorni

**Ruoli da Creare**:
```dax
-- Ruolo: Agente
[Agente] = USERNAME()

-- Ruolo: Responsabile Regione
[Regione] IN {"Lazio", "Campania"}

-- Ruolo: Admin
1 = 1  -- Vede tutto
```

---

#### Task 3.2: Versioning e Change Log
**Obiettivo**: Tracciare modifiche al modello  
**Stima**: 1 giorno

**Struttura**:
```
CHANGELOG.md
v1.0.0 - 2025-11-27
- Creazione dataset iniziale
- 34 misure DAX base

v1.1.0 - 2025-12-15
- Aggiunta Time Intelligence
- Ottimizzazione performance LOOKUPVALUE
- Nuova dashboard Executive
```

---

#### Task 3.3: Alert Automatici
**Obiettivo**: Notifiche su eventi critici  
**Stima**: 3 giorni

**Alert da Implementare**:
1. **Sottoscorta**: Email quando Days of Supply < Lead Time
2. **Margine Negativo**: Alert su vendite in perdita
3. **Fatture Scadute**: Notifica daily su scaduti > 30 giorni
4. **Anomalie**: Alert su valori anomali (outlier detection)

**Tecnologia**: Power Automate + Data-Driven Subscriptions

---

### FASE 4: EXTENDED ANALYTICS (FUTURO)

#### Task 4.1: Machine Learning per Forecast
**Strumento**: Azure Machine Learning + Power BI  
**Stima**: 5 giorni

**Modelli**:
- Forecast vendite (ARIMA)
- Anomaly detection su margini
- Clustering clienti (RFM)

---

#### Task 4.2: Integrazione Real-Time
**Obiettivo**: Dati in streaming invece di batch  
**Stima**: 10 giorni

**Tecnologie**:
- Azure Stream Analytics
- Power BI Streaming Datasets
- Real-time dashboard

---

## CHECKLIST IMPLEMENTAZIONE

### Pre-Sviluppo
- [ ] Backup di tutti i 4 file .pbix
- [ ] Documentare struttura attuale
- [ ] Validare accessi Power BI Service
- [ ] Setup ambiente di test

### Dataset Condiviso
- [ ] Creare nuovo file dataset
- [ ] Importare modello dati
- [ ] Testare misure DAX
- [ ] Pubblicare su workspace
- [ ] Convertire file 1 a live connection
- [ ] Validare risultati identici
- [ ] Convertire file 2, 3, 4
- [ ] Rimuovere duplicati

### Documentazione
- [ ] Aggiungere descrizioni misure
- [ ] Creare catalogo misure
- [ ] Documentare relazioni
- [ ] Creare user guide

### Testing
- [ ] Test performance queries
- [ ] Validazione calcoli
- [ ] Test RLS (se implementato)
- [ ] UAT con utenti finali

### Deployment
- [ ] Pubblicare dataset produzione
- [ ] Pubblicare report produzione
- [ ] Configurare refresh schedule
- [ ] Configurare alert
- [ ] Training utenti

---

## CONTATTI E RIFERIMENTI

### Documentazione Power BI
- DAX Reference: https://dax.guide/
- Power BI Best Practices: https://docs.microsoft.com/power-bi/guidance/
- Performance Tuning: https://docs.microsoft.com/power-bi/guidance/power-bi-optimization

### Pattern DAX Avanzati
- SQLBI DAX Patterns: https://www.daxpatterns.com/
- Time Intelligence: https://www.daxpatterns.com/time-patterns/

---

## NOTE FINALI

### Limitazioni Identificate
1. **Performance**: LOOKUPVALUE può essere lento su grandi dataset
2. **Scalabilità**: 4 file separati = manutenzione 4x
3. **Governance**: Nessun audit trail su modifiche dati
4. **Real-time**: Refresh manuale/schedulato, no streaming

### Quick Wins
1. ✅ Dataset condiviso → Riduzione 75% manutenzione
2. ✅ Descrizioni misure → Maggiore trasparenza
3. ✅ Time intelligence → Analisi trend immediate
4. ✅ Dashboard executive → Visibilità management

### Investimenti Futuri
1. 📊 ML per forecast vendite
2. 🔄 Real-time streaming
3. 📱 Mobile app dedicata
4. 🤖 Chatbot per query NL

---

**Fine Documento**

---

*Ultima modifica: 2025-11-27*  
*Versione: 1.0*  
*Autore: Analisi Sistema BI*
