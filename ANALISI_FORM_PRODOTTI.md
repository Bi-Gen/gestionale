# 📋 Analisi Form Prodotti vs Schema Database

## ✅ Campi PRESENTI nel form attuale

### Identificazione Base
- ✅ `codice` (obbligatorio)
- ✅ `nome` (obbligatorio)
- ✅ `descrizione`
- ✅ `categoria`

### Prezzi
- ✅ `prezzo_acquisto`
- ✅ `prezzo_vendita` (obbligatorio)

### Magazzino
- ✅ `quantita_magazzino`
- ✅ `unita_misura`

### Fornitore
- ✅ `fornitore_id` (select fornitore principale)

### Altro
- ✅ `note`

---

## ❌ Campi MANCANTI (importanti per flussi operativi)

### 🚨 CRITICI - Identificazione Prodotto

- ❌ `codice_ean` (VARCHAR 13)
  - **Uso**: Barcode EAN13 per lettura scanner
  - **Quando serve**: Gestione magazzino con scanner, vendita POS
  - **Esempio**: "8001234567890"
  - **Priorità**: 🔴 ALTA

- ❌ `codice_fornitore` (VARCHAR 100)
  - **Uso**: Codice che il fornitore usa per questo prodotto
  - **Quando serve**: Ordini fornitori, corrispondenza cataloghi
  - **Esempio**: "TECH-MOUSE-001"
  - **Priorità**: 🔴 ALTA

- ❌ `sku` (VARCHAR 100)
  - **Uso**: Stock Keeping Unit - codice univoco magazzino
  - **Quando serve**: E-commerce, gestione stock multi-canale
  - **Priorità**: 🟡 MEDIA

- ❌ `descrizione_breve` (VARCHAR 500)
  - **Uso**: Descrizione corta per cataloghi/e-commerce
  - **Priorità**: 🟡 MEDIA

---

### 🔵 IMPORTANTI - Classificazione

- ❌ `sottocategoria` (VARCHAR 100)
  - **Uso**: Classificazione più dettagliata
  - **Esempio**: Categoria="Elettronica" → Sottocategoria="Mouse"
  - **Priorità**: 🟡 MEDIA

- ❌ `famiglia` (VARCHAR 100)
  - **Uso**: Raggruppamento prodotti simili
  - **Esempio**: "Periferiche PC"
  - **Priorità**: 🟢 BASSA

---

### 💰 CRITICI - Prezzi e Costi

- ❌ `costo_ultimo` (DECIMAL 12,2)
  - **Uso**: Ultimo costo di acquisto effettivo
  - **Quando serve**: Calcolo margini, statistiche
  - **Priorità**: 🔴 ALTA

- ❌ `costo_medio` (DECIMAL 12,2)
  - **Uso**: Costo medio ponderato (LIFO/FIFO)
  - **Quando serve**: Valorizzazione magazzino, bilancio
  - **Priorità**: 🔴 ALTA

- ❌ `aliquota_iva` (DECIMAL 5,2, default 22%)
  - **Uso**: Aliquota IVA applicabile
  - **Quando serve**: Fatturazione, calcolo prezzi IVA inclusa
  - **Priorità**: 🔴 ALTA

- ❌ `margine_percentuale` (DECIMAL 5,2)
  - **Uso**: Margine % calcolato automaticamente
  - **Formula**: ((prezzo_vendita - costo) / prezzo_vendita) * 100
  - **Priorità**: 🟡 MEDIA

- ❌ `sconto_massimo` (DECIMAL 5,2)
  - **Uso**: Sconto massimo applicabile dal venditore
  - **Priorità**: 🟡 MEDIA

- ❌ Listini multipli (`prezzo_listino1` ... `prezzo_listino5`)
  - **Uso**: Prezzi differenziati per tipologia clienti
  - **Esempio**: Listino1=Retail, Listino2=Wholesale, Listino3=VIP
  - **Priorità**: 🟡 MEDIA

---

### 📦 IMPORTANTI - Magazzino

- ❌ `giacenza_minima` (DECIMAL 12,3)
  - **Uso**: Scorta minima di sicurezza
  - **Quando serve**: Alert riordini automatici
  - **Priorità**: 🔴 ALTA

- ❌ `giacenza_massima` (DECIMAL 12,3)
  - **Uso**: Scorta massima consigliata
  - **Quando serve**: Ottimizzazione spazio magazzino
  - **Priorità**: 🟡 MEDIA

- ❌ `punto_riordino` (DECIMAL 12,3)
  - **Uso**: Soglia sotto cui riordinare
  - **Quando serve**: Gestione automatica ordini
  - **Priorità**: 🔴 ALTA

- ❌ `ubicazione` (VARCHAR 50)
  - **Uso**: Posizione fisica nel magazzino
  - **Esempio**: "A-12-3", "Scaffale 5 - Ripiano 2"
  - **Priorità**: 🔴 ALTA

---

### 🚚 IMPORTANTI - Gestione Fornitori

- ❌ `tempo_riordino_giorni` (INT, default 7)
  - **Uso**: Lead time - tempo necessario per ricevere merce
  - **Quando serve**: Calcolo date disponibilità, pianificazione ordini
  - **Priorità**: 🔴 ALTA

- ❌ `quantita_minima_ordine` (INT, default 1)
  - **Uso**: MOQ - Minimum Order Quantity del fornitore
  - **Quando serve**: Validazione ordini, calcolo lotti economici
  - **Priorità**: 🔴 ALTA

---

### 📏 UTILI - Misure e Dimensioni

- ❌ `peso_kg` (DECIMAL 10,3)
  - **Uso**: Peso per calcolo spedizioni
  - **Priorità**: 🟡 MEDIA

- ❌ `volume_m3` (DECIMAL 10,4)
  - **Uso**: Calcolo spazio magazzino/trasporto
  - **Priorità**: 🟢 BASSA

- ❌ Dimensioni: `lunghezza_cm`, `larghezza_cm`, `altezza_cm`
  - **Uso**: Spedizioni, imballaggi
  - **Priorità**: 🟡 MEDIA

- ❌ `colli` (INT, default 1)
  - **Uso**: Numero colli per unità prodotto
  - **Priorità**: 🟢 BASSA

---

### 🔄 AVANZATE - Gestione Lotti e Scadenze

- ❌ `gestione_lotti` (BOOLEAN)
  - **Uso**: Se tracciare i lotti di produzione
  - **Quando serve**: Alimentari, farmaceutici, tracciabilità
  - **Priorità**: 🟡 MEDIA

- ❌ `gestione_seriali` (BOOLEAN)
  - **Uso**: Se tracciare numeri seriali
  - **Quando serve**: Elettronica, garanzie, assistenza
  - **Priorità**: 🟡 MEDIA

- ❌ `gestione_scadenze` (BOOLEAN)
  - **Uso**: Se prodotto deperibile
  - **Quando serve**: Alimentari, cosmetici
  - **Priorità**: 🟡 MEDIA

- ❌ `giorni_scadenza` (INT)
  - **Uso**: Giorni validità dalla produzione
  - **Priorità**: 🟢 BASSA

---

### 🛒 UTILI - Vendita e Visibilità

- ❌ `vendibile` (BOOLEAN, default true)
  - **Uso**: Se prodotto è vendibile (vs solo per uso interno)
  - **Priorità**: 🟡 MEDIA

- ❌ `visibile_catalogo` (BOOLEAN, default true)
  - **Uso**: Se mostrare in cataloghi
  - **Priorità**: 🟡 MEDIA

- ❌ `visibile_ecommerce` (BOOLEAN, default false)
  - **Uso**: Se pubblicare su e-commerce
  - **Priorità**: 🟢 BASSA

- ❌ `acquistabile` (BOOLEAN, default true)
  - **Uso**: Se prodotto è acquistabile
  - **Priorità**: 🟡 MEDIA

---

### 📝 ALTRI

- ❌ `note_interne` (TEXT)
  - **Uso**: Note riservate, non visibili al cliente
  - **Priorità**: 🟡 MEDIA

- ❌ `immagine_url` (VARCHAR 500)
  - **Uso**: URL immagine principale prodotto
  - **Priorità**: 🟢 BASSA

---

## 🎯 PROPOSTA: Campi da Aggiungere Subito

### Fase 1 - CRITICI (per gestionale completo)
1. ✅ `codice_ean` (barcode scanner)
2. ✅ `codice_fornitore` (corrispondenza cataloghi)
3. ✅ `aliquota_iva` (fatturazione)
4. ✅ `costo_ultimo` + `costo_medio` (margini e valorizzazione)
5. ✅ `giacenza_minima` + `punto_riordino` (alert stock)
6. ✅ `ubicazione` (posizione magazzino)
7. ✅ `tempo_riordino_giorni` (lead time fornitore)
8. ✅ `quantita_minima_ordine` (MOQ)

### Fase 2 - IMPORTANTI (gestione avanzata)
9. ✅ `descrizione_breve` (cataloghi)
10. ✅ `sottocategoria` (classificazione)
11. ✅ `margine_percentuale` (controllo prezzi)
12. ✅ `sconto_massimo` (limiti venditori)
13. ✅ `prezzo_listino1`, `prezzo_listino2`, `prezzo_listino3` (multi-listino)
14. ✅ `peso_kg` + dimensioni (spedizioni)
15. ✅ `vendibile`, `acquistabile` (flags operativi)

### Fase 3 - NICE TO HAVE (opzionali)
16. ⚪ `sku` (e-commerce)
17. ⚪ `gestione_lotti`, `gestione_seriali`, `gestione_scadenze`
18. ⚪ `note_interne`
19. ⚪ `immagine_url`
20. ⚪ `visibile_ecommerce`

---

## 📐 Layout Form Proposto

### Sezione 1: Identificazione Prodotto
- Codice * | SKU
- Nome *
- Descrizione Breve
- Descrizione Completa
- Categoria | Sottocategoria | Famiglia
- Codice EAN (Barcode) | Codice Fornitore

### Sezione 2: Prezzi e Costi ⚡ NUOVO
- Costo Ultimo | Costo Medio
- Prezzo Acquisto | Prezzo Vendita *
- Margine % (calcolato auto) | Sconto Max %
- Aliquota IVA % (default 22)

### Sezione 3: Listini Vendita ⚡ NUOVO (opzionale collassabile)
- Listino 1 | Listino 2 | Listino 3
- Listino 4 | Listino 5

### Sezione 4: Fornitore
- Fornitore Principale (select)
- Codice Fornitore
- Tempo Riordino (giorni) | Quantità Minima Ordine

### Sezione 5: Magazzino
- Unità Misura
- Quantità Attuale | Ubicazione
- Giacenza Minima | Punto Riordino
- Giacenza Massima

### Sezione 6: Misure e Dimensioni ⚡ NUOVO
- Peso (kg) | Volume (m³)
- Dimensioni: L x l x h (cm)
- Numero Colli

### Sezione 7: Gestione Avanzata ⚡ NUOVO (checkboxes)
- ☐ Gestione Lotti
- ☐ Gestione Seriali
- ☐ Gestione Scadenze → Giorni Scadenza

### Sezione 8: Vendita e Visibilità ⚡ NUOVO (checkboxes)
- ☑ Vendibile
- ☑ Acquistabile
- ☑ Visibile Catalogo
- ☐ Visibile E-commerce

### Sezione 9: Note
- Note (pubbliche)
- Note Interne (riservate)

---

## ✅ Azioni Necessarie

1. **Creare `components/ProdottoForm.tsx`** con tutti i campi organizzati
2. **Aggiornare validazione** `lib/validations/prodotti.ts` con Zod
3. **Aggiornare `app/actions/prodotti.ts`** per gestire tutti i campi
4. **Aggiornare pagine**:
   - `app/dashboard/prodotti/nuovo/page.tsx`
   - `app/dashboard/prodotti/[id]/page.tsx` (visualizzazione)
   - `app/dashboard/prodotti/[id]/modifica/page.tsx` (edit)
5. **Testare form completo**

---

## 🔍 Note Tecniche

- Tutti i campi (tranne `codice`, `nome`, `prezzo_vendita`) sono **opzionali** nello schema DB
- Aliquota IVA default: **22%**
- Unità misura default: **PZ** (pezzi)
- Margine % = `((prezzo_vendita - costo) / prezzo_vendita) * 100`
- Campi numerici DECIMAL vanno gestiti come stringhe nel form per precisione
- Gestione lotti/seriali: checkbox + logica avanzata futura
