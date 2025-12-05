# 📋 Analisi Form Fornitori vs Schema Database

## ✅ Campi PRESENTI nel form attuale

### Dati Base
- ✅ `ragione_sociale` (obbligatorio)
- ✅ `partita_iva` (11 cifre, validato)
- ✅ `codice_fiscale` (16 caratteri, validato)

### Contatti Base
- ✅ `email`
- ✅ `telefono`

### Indirizzo Completo
- ✅ `indirizzo`
- ✅ `comune_id` (select a cascata: Regione → Provincia → Comune)
- ✅ `cap` (auto-compilato dalla selezione comune)
- ✅ `citta` (auto-compilato dal comune selezionato)
- ✅ `provincia` (sigla auto-compilata, es: MI, TO)

### Altro
- ✅ `note` (campo testo libero)

---

## ❌ Campi MANCANTI (importanti per flussi operativi)

### 🚨 CRITICI - Fatturazione Elettronica
**Problema**: Senza questi campi, non possiamo gestire correttamente la fatturazione elettronica

- ❌ `codice_univoco` (7 caratteri alfanumerici)
  - **Uso**: Codice SDI (Sistema Di Interscambio) per fatturazione elettronica B2B
  - **Quando serve**: Quando emettiamo fattura a fornitore (note credito) o riceviamo fatture XML
  - **Esempio**: "ABCDEFG", "M5UXCR1"
  - **Priorità**: 🔴 ALTA

- ❌ `pec` (email PEC certificata)
  - **Uso**: Email certificata per invio fatture elettroniche se no codice univoco
  - **Quando serve**: Alternativa al codice univoco per fatturazione PA e B2B
  - **Esempio**: "fornitori@pec.techdist.it"
  - **Priorità**: 🔴 ALTA

---

### 🔵 IMPORTANTI - Gestione Acquisti
**Problema**: Senza questi campi, non possiamo pianificare bene gli ordini

- ❌ `categoria_fornitore`
  - **Uso**: Classificare fornitori per tipo (es: elettronica, trasporti, servizi)
  - **Quando serve**: Report, filtri, statistiche acquisti per categoria
  - **Valori suggeriti**: 'materie_prime', 'componenti', 'servizi', 'trasporti', 'consulenza'
  - **Priorità**: 🟡 MEDIA

- ❌ `giorni_consegna` (numero intero)
  - **Uso**: Tempo medio di consegna del fornitore
  - **Quando serve**: Pianificazione ordini, calcolo date arrivo merce
  - **Esempio**: 5 (giorni), 10, 30
  - **Priorità**: 🔴 ALTA

- ❌ `sconto_fornitore` (percentuale)
  - **Uso**: Sconto abituale ottenuto da questo fornitore
  - **Quando serve**: Calcolo automatico prezzi acquisto, margini
  - **Esempio**: 5.00 (%), 10.00, 15.00
  - **Priorità**: 🟡 MEDIA

---

### 💰 IMPORTANTI - Gestione Pagamenti
**Problema**: Senza questi campi, non possiamo gestire bene il ciclo passivo

- ❌ `giorni_pagamento` (numero intero, default 30)
  - **Uso**: Termini di pagamento concordati (30gg, 60gg, 90gg)
  - **Quando serve**: Scadenzario fornitori, calcolo date scadenza pagamenti
  - **Esempio**: 30, 60, 90
  - **Priorità**: 🔴 ALTA

- ❌ `banca` (testo)
  - **Uso**: Nome banca del fornitore
  - **Esempio**: "Intesa Sanpaolo", "UniCredit"
  - **Priorità**: 🟢 BASSA

- ❌ `iban` (27 caratteri per IT)
  - **Uso**: Coordinate bancarie per bonifici automatici
  - **Quando serve**: Pagamento fornitori, export SEPA
  - **Esempio**: "IT60X0542811101000000123456"
  - **Priorità**: 🔴 ALTA

- ❌ `swift_bic` (8-11 caratteri)
  - **Uso**: Codice BIC/SWIFT per bonifici internazionali
  - **Quando serve**: Pagamenti a fornitori esteri
  - **Esempio**: "BCITITMM", "UNCRITM1A00"
  - **Priorità**: 🟡 MEDIA (solo per fornitori esteri)

---

### 📞 UTILI - Contatti Aggiuntivi

- ❌ `cellulare`
  - **Uso**: Numero cellulare referente/ufficio acquisti
  - **Priorità**: 🟡 MEDIA

- ❌ `sito_web`
  - **Uso**: Link al sito web del fornitore
  - **Esempio**: "https://www.techdist.it"
  - **Priorità**: 🟢 BASSA

- ❌ `fax` (ormai obsoleto)
  - **Priorità**: ⚪ MOLTO BASSA

---

### 👤 UTILI - Dati Referente

- ❌ `referente` (nome persona)
  - **Uso**: Nome del referente principale presso il fornitore
  - **Esempio**: "Mario Bianchi - Ufficio Vendite"
  - **Priorità**: 🟡 MEDIA

- ❌ `referente_telefono`
  - **Uso**: Telefono diretto del referente
  - **Priorità**: 🟡 MEDIA

- ❌ `referente_email`
  - **Uso**: Email diretta del referente
  - **Priorità**: 🟡 MEDIA

---

### 🌍 ALTRI Campi Schema

- ❌ `paese` (default: 'IT')
  - **Uso**: Codice ISO paese (IT, FR, DE, etc.)
  - **Quando serve**: Fornitori esteri, gestione IVA intracomunitaria
  - **Priorità**: 🟡 MEDIA

- ❌ `tipo_persona` ('fisica' | 'giuridica')
  - **Uso**: Distinguere tra persona fisica e azienda
  - **Default**: 'giuridica' (quasi tutti i fornitori)
  - **Priorità**: 🟢 BASSA

- ❌ `civico` (separato da indirizzo)
  - **Uso**: Numero civico separato dall'indirizzo
  - **Attualmente**: È incluso nel campo "indirizzo"
  - **Priorità**: 🟢 BASSA

---

## 🎯 PROPOSTA: Campi da Aggiungere Subito

### Fase 1 - CRITICI (per flusso completo)
1. ✅ `codice_univoco` (SDI - fatturazione elettronica)
2. ✅ `pec` (email PEC - fatturazione elettronica)
3. ✅ `giorni_consegna` (pianificazione ordini)
4. ✅ `giorni_pagamento` (scadenzario fornitori)
5. ✅ `iban` (bonifici fornitori)

### Fase 2 - IMPORTANTI (gestione avanzata)
6. ✅ `categoria_fornitore` (classificazione)
7. ✅ `sconto_fornitore` (calcolo prezzi)
8. ✅ `referente` + `referente_telefono` + `referente_email` (contatti)
9. ✅ `cellulare` (contatti aggiuntivi)
10. ✅ `paese` (fornitori esteri)

### Fase 3 - NICE TO HAVE (opzionali)
11. ⚪ `sito_web`
12. ⚪ `banca`
13. ⚪ `swift_bic` (solo esteri)
14. ⚪ `tipo_persona`

---

## 📐 Layout Form Proposto

### Sezione 1: Dati Anagrafici
- Ragione Sociale *
- Tipo Persona (radio: Giuridica / Fisica)
- P.IVA | Codice Fiscale

### Sezione 2: Fatturazione Elettronica ⚡ NUOVO
- Codice Univoco SDI
- Email PEC

### Sezione 3: Contatti
- Email | Telefono
- Cellulare | Sito Web

### Sezione 4: Indirizzo
- Indirizzo
- Regione → Provincia → Comune (cascata)
- CAP (auto)

### Sezione 5: Dati Commerciali ⚡ NUOVO
- Categoria Fornitore (select)
- Giorni Consegna | Sconto % Abituale

### Sezione 6: Pagamenti ⚡ NUOVO
- Giorni Pagamento (default 30)
- IBAN
- Banca | SWIFT/BIC

### Sezione 7: Referente ⚡ NUOVO
- Nome Referente
- Telefono Referente | Email Referente

### Sezione 8: Note
- Note (textarea)

---

## ✅ Azioni Necessarie

1. **Aggiornare `FornitoreForm.tsx`** con nuovi campi
2. **Aggiornare `lib/validations/fornitori.ts`** con validazione Zod
3. **Aggiornare `app/actions/fornitori.ts`** per gestire nuovi campi
4. **Testare form completo** con tutti i campi

---

## 🔍 Note Tecniche

- Tutti i campi (tranne `ragione_sociale`) sono **opzionali** nello schema DB
- Il DB ha constraint: **almeno P.IVA O Codice Fiscale** deve essere presente
- IBAN validazione: pattern IT + 27 caratteri
- Codice Univoco: 7 caratteri alfanumerici (es: ABCDEFG)
- Giorni consegna/pagamento: numeri interi positivi
