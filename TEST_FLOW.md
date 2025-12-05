# 🧪 FLUSSO DI TEST GESTIONALE - Multi-Tenancy

## Obiettivo
Testare tutte le funzionalità del gestionale seguendo un flusso operativo realistico di un'azienda commerciale.

---

## 📋 SCENARIO: Azienda "Mario Rossi Srl"
- **Settore**: Commercio prodotti elettronici
- **Utente**: Mario Rossi (Owner)
- **Piano**: Light (Trial 14 giorni)
- **Stato iniziale**: ✅ Azienda creata, Magazzino Principale, IVA e Causali configurate

---

## 🔄 FLUSSO OPERATIVO

### **FASE 1: Setup Anagrafica** 📇
*Obiettivo: Creare l'anagrafica base (fornitori, clienti, prodotti)*

#### 1.1 Creazione Fornitori
- [ ] **Fornitore 1**: "Tech Distribution SpA"
  - Ragione sociale: Tech Distribution SpA
  - P.IVA: 12345678901
  - Email: info@techdist.it
  - Telefono: 02-12345678
  - Indirizzo: Via Roma 100, Milano, 20100, MI
  - Categoria: Grossista Elettronica
  - Giorni consegna: 5
  - Note: Fornitore principale componenti

- [ ] **Fornitore 2**: "Global Electronics Srl"
  - Ragione sociale: Global Electronics Srl
  - P.IVA: 98765432109
  - Email: vendite@globalelec.it
  - Telefono: 06-98765432
  - Indirizzo: Via Torino 50, Roma, 00100, RM
  - Categoria: Importatore
  - Giorni consegna: 10

**Test da verificare:**
- ✅ Creazione con successo
- ✅ Fornitori visibili solo alla propria azienda (RLS)
- ✅ Ricerca e filtri funzionanti
- ✅ Modifica e eliminazione funzionanti

---

#### 1.2 Creazione Prodotti
- [ ] **Prodotto 1**: "Smartphone X1"
  - Codice: SMART-X1-BK
  - Nome: Smartphone X1 Black 128GB
  - Descrizione: Smartphone di fascia media con display 6.5"
  - Categoria: Smartphone
  - Unità misura: pz
  - Fornitore: Tech Distribution SpA
  - Prezzo acquisto: 250.00 €
  - Prezzo vendita: 399.00 €
  - Quantità iniziale: 0
  - Note: Bestseller

- [ ] **Prodotto 2**: "Cuffie Wireless Pro"
  - Codice: CUFF-WL-PRO
  - Nome: Cuffie Wireless Pro
  - Categoria: Audio
  - Unità misura: pz
  - Fornitore: Global Electronics Srl
  - Prezzo acquisto: 45.00 €
  - Prezzo vendita: 89.90 €
  - Quantità iniziale: 0

- [ ] **Prodotto 3**: "Cover Smartphone X1"
  - Codice: COV-X1-TR
  - Nome: Cover Trasparente X1
  - Categoria: Accessori
  - Unità misura: pz
  - Fornitore: Tech Distribution SpA
  - Prezzo acquisto: 3.50 €
  - Prezzo vendita: 12.90 €
  - Quantità iniziale: 0

**Test da verificare:**
- ✅ Creazione prodotti con collegamento fornitore
- ✅ Dropdown fornitori funzionante
- ✅ Calcolo margine (prezzo vendita - prezzo acquisto)
- ✅ Prodotti isolati per azienda (RLS)

---

#### 1.3 Creazione Clienti
- [ ] **Cliente 1**: "Negozio ElettroShop"
  - Ragione sociale: ElettroShop di Bianchi Mario
  - P.IVA: 11122233344
  - Codice Fiscale: BNCMRA75H10F205X
  - Email: elettroshop@example.com
  - Telefono: 333-1234567
  - Indirizzo: Corso Italia 25, Torino, 10100, TO
  - Categoria: Retail
  - Sconto %: 5%
  - Fido massimo: 5000.00 €
  - Pagamento: 30 giorni data fattura
  - Note: Cliente abituale

- [ ] **Cliente 2**: "TechStore Chain Srl"
  - Ragione sociale: TechStore Chain Srl
  - P.IVA: 55566677788
  - Email: acquisti@techstore.it
  - Telefono: 011-9876543
  - Indirizzo: Via Napoli 80, Torino, 10100, TO
  - Categoria: Catena
  - Sconto %: 10%
  - Fido massimo: 15000.00 €
  - Pagamento: 60 giorni data fattura

**Test da verificare:**
- ✅ Creazione clienti con dati completi
- ✅ Validazione Partita IVA (11 cifre)
- ✅ Validazione Codice Fiscale (formato italiano)
- ✅ Clienti isolati per azienda (RLS)

---

### **FASE 2: Acquisto Merce** 📦
*Obiettivo: Registrare un ordine di acquisto e caricare la merce in magazzino*

#### 2.1 Ordine Acquisto da Tech Distribution
- [ ] **Documento**: Ordine Acquisto #001/2025
  - Data: 28/11/2024
  - Fornitore: Tech Distribution SpA
  - Articoli:
    - 10x Smartphone X1 @ 250.00 = 2500.00 €
    - 50x Cover Smartphone X1 @ 3.50 = 175.00 €
  - Subtotale: 2675.00 €
  - IVA 22%: 588.50 €
  - **Totale: 3263.50 €**
  - Note: Primo ordine test

**Test da verificare:**
- ⚠️ **DA IMPLEMENTARE**: Modulo ordini acquisto
- ⚠️ Calcolo automatico IVA
- ⚠️ Collegamento a fornitore e prodotti

---

#### 2.2 Carico Merce in Magazzino
- [ ] **Movimento Magazzino**: Carico #1
  - Data: 30/11/2024
  - Magazzino: Magazzino Principale
  - Causale: ACQ - Acquisto
  - Riferimento: Ordine #001/2025
  - Articoli:
    - 10x Smartphone X1 (giacenza: 0 → 10)
    - 50x Cover Smartphone X1 (giacenza: 0 → 50)
  - Costo medio aggiornato

**Test da verificare:**
- ⚠️ **DA IMPLEMENTARE**: Modulo movimenti magazzino
- ⚠️ Aggiornamento automatico giacenze
- ⚠️ Calcolo costo medio ponderato
- ⚠️ Storico movimenti per prodotto

---

### **FASE 3: Vendita Merce** 💰
*Obiettivo: Registrare un ordine cliente, emettere DDT/Fattura, scaricare magazzino*

#### 3.1 Ordine Cliente da ElettroShop
- [ ] **Documento**: Ordine Cliente #001/2025
  - Data: 01/12/2024
  - Cliente: ElettroShop di Bianchi Mario
  - Articoli:
    - 3x Smartphone X1 @ 399.00 = 1197.00 €
    - 5x Cover Smartphone X1 @ 12.90 = 64.50 €
  - Subtotale: 1261.50 €
  - Sconto 5%: -63.08 €
  - Imponibile: 1198.42 €
  - IVA 22%: 263.65 €
  - **Totale: 1462.07 €**
  - Pagamento: 30gg DF
  - Scadenza: 31/12/2024

**Test da verificare:**
- ⚠️ **DA IMPLEMENTARE**: Modulo ordini clienti
- ⚠️ Applicazione sconto cliente automatico
- ⚠️ Calcolo IVA e totali
- ⚠️ Verifica disponibilità prodotti

---

#### 3.2 DDT (Documento di Trasporto)
- [ ] **DDT #001/2024**
  - Data: 02/12/2024
  - Cliente: ElettroShop
  - Causale trasporto: Vendita
  - Riferimento: Ordine #001/2025
  - Porto: Franco

**Test da verificare:**
- ⚠️ **DA IMPLEMENTARE**: Modulo DDT
- ⚠️ Stampa PDF DDT

---

#### 3.3 Scarico Magazzino
- [ ] **Movimento Magazzino**: Scarico #1
  - Data: 02/12/2024
  - Magazzino: Magazzino Principale
  - Causale: VEN - Vendita
  - Riferimento: DDT #001/2024
  - Articoli:
    - -3x Smartphone X1 (giacenza: 10 → 7)
    - -5x Cover Smartphone X1 (giacenza: 50 → 45)

**Test da verificare:**
- ⚠️ Scarico automatico da DDT/Fattura
- ⚠️ Aggiornamento giacenze
- ⚠️ Alert stock minimo

---

#### 3.4 Fattura Immediata
- [ ] **Fattura #001/2024**
  - Data: 02/12/2024
  - Cliente: ElettroShop
  - Riferimento: DDT #001/2024
  - Importi: (come ordine)
  - Scadenza pagamento: 31/12/2024
  - Metodo: Bonifico bancario

**Test da verificare:**
- ⚠️ **DA IMPLEMENTARE**: Modulo fatture
- ⚠️ Numerazione automatica fatture
- ⚠️ Generazione XML fattura elettronica
- ⚠️ Stampa PDF fattura
- ⚠️ Inserimento automatico in scadenzario

---

### **FASE 4: Gestione Magazzino** 📊

#### 4.1 Verifica Giacenze
- [ ] Lista prodotti con giacenze attuali
  - Smartphone X1: 7 pz
  - Cuffie Wireless: 0 pz
  - Cover X1: 45 pz

- [ ] Filtri e ricerca
- [ ] Export Excel giacenze

**Test da verificare:**
- ⚠️ **DA IMPLEMENTARE**: Dashboard magazzino
- ⚠️ Vista giacenze per prodotto
- ⚠️ Vista giacenze per magazzino
- ⚠️ Export Excel

---

#### 4.2 Storico Movimenti
- [ ] Visualizza tutti i movimenti
- [ ] Filtro per prodotto
- [ ] Filtro per periodo
- [ ] Filtro per causale

---

#### 4.3 Inventario
- [ ] Rettifica giacenza Smartphone X1
  - Giacenza teorica: 7
  - Giacenza reale: 6 (1 difettoso)
  - Causale: RETT- (Rettifica Negativa)
  - Note: Smartphone difettoso

**Test da verificare:**
- ⚠️ Procedura inventario
- ⚠️ Rettifiche positive/negative

---

### **FASE 5: Scadenzario e Incassi** 💳

#### 5.1 Verifica Scadenze
- [ ] Lista scadenze attive
  - Fattura #001/2024: 31/12/2024 - 1462.07 € (da incassare)

#### 5.2 Registrazione Incasso
- [ ] Incasso fattura #001/2024
  - Data: 15/12/2024
  - Importo: 1462.07 €
  - Metodo: Bonifico
  - Banca: Intesa Sanpaolo
  - Riferimento: Bonifico n. 123456

**Test da verificare:**
- ⚠️ **DA IMPLEMENTARE**: Scadenzario
- ⚠️ Partitario cliente
- ⚠️ Situazione fido cliente

---

### **FASE 6: Reportistica e Analytics** 📈

#### 6.1 Dashboard Vendite
- [ ] Totale vendite mese corrente
- [ ] Top 5 prodotti venduti
- [ ] Margine medio
- [ ] Vendite per categoria

#### 6.2 Report Magazzino
- [ ] Valore magazzino (a costo medio)
- [ ] Rotazione prodotti
- [ ] Prodotti sotto scorta
- [ ] Articoli fermi (no movimenti > 90gg)

#### 6.3 Report Clienti
- [ ] Top clienti per fatturato
- [ ] Giorni medi incasso
- [ ] Insoluti

**Test da verificare:**
- ⚠️ **DA IMPLEMENTARE**: Dashboard Analytics
- ⚠️ Report Excel/PDF

---

## 📊 RIEPILOGO STATO IMPLEMENTAZIONE

### ✅ Funzionalità Già Implementate
- [x] Multi-tenancy con RLS
- [x] Autenticazione (signup, login)
- [x] Gestione Fornitori (CRUD)
- [x] Gestione Clienti (CRUD)
- [x] Gestione Prodotti (CRUD)
- [x] Magazzini configurati
- [x] Aliquote IVA configurate
- [x] Causali movimento configurate

### ⚠️ Funzionalità da Implementare
- [ ] **Ordini Acquisto** (modulo completo)
- [ ] **Ordini Clienti** (modulo completo)
- [ ] **Movimenti Magazzino** (carico/scarico)
- [ ] **DDT** (emissione e stampa)
- [ ] **Fatture** (emissione, XML, PDF)
- [ ] **Scadenzario** (gestione incassi/pagamenti)
- [ ] **Dashboard Analytics** (KPI, grafici)
- [ ] **Report** (Excel/PDF export)
- [ ] **Inventario** (procedura guidata)

---

## 🎯 PROSSIMI STEP

1. **Iniziare FASE 1.1**: Creare i fornitori di test
2. **Test isolamento dati**: Verificare che Mario non veda dati di altre aziende
3. **Implementare moduli mancanti** man mano che servono nel flusso
4. **Validare ogni passaggio** prima di andare avanti

---

## 📝 Note
- Ogni funzionalità va testata anche per **permessi** (cosa vede un utente vs owner vs superadmin)
- Testare **performance** con molti record
- Verificare **export Excel/PDF** su tutti i report
- Testare **responsive** su mobile/tablet
