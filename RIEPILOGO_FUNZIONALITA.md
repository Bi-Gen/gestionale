# Gestionale - Riepilogo Funzionalità

## Panoramica

Applicazione web gestionale completa per la gestione aziendale, sviluppata con tecnologie moderne (Next.js, React, Supabase). Accessibile da browser, responsive e multi-utente.

---

## Funzionalità Implementate

### 1. Autenticazione e Multi-Tenancy
- Registrazione e login utenti
- Ogni azienda ha i propri dati completamente isolati
- Profilo utente con avatar personalizzabile
- Sistema di sicurezza RLS (Row Level Security) su tutte le tabelle

### 2. Anagrafiche

**Clienti**
- Gestione completa anagrafica clienti
- Dati fiscali (P.IVA, Codice Fiscale con validazione)
- Indirizzi con selezione geografica (Regione → Provincia → Comune)
- Indirizzo di destinazione alternativo
- Categoria cliente, listino e metodo pagamento associati

**Fornitori**
- Anagrafica fornitori completa
- Categoria fornitore con collegamento al Piano dei Conti
- Stessi campi geografici e fiscali dei clienti

**Agenti**
- Gestione rete vendita
- Provvigioni percentuali
- Associazione a zona geografica

**Prodotti**
- Anagrafica prodotti con codice, descrizione, unità di misura
- Classificazione per Famiglia e Macrofamiglia
- Prezzi di acquisto e vendita
- Aliquota IVA associata
- Gestione immagine prodotto

### 3. Magazzino

**Magazzini**
- Gestione multi-magazzino
- Magazzino principale e secondari

**Giacenze**
- Visualizzazione giacenze per magazzino
- Calcolo automatico costo medio ponderato

**Movimenti**
- Registrazione movimenti di carico/scarico
- Causali movimento configurabili
- Tracciabilità completa

### 4. Ordini

**Ordini di Vendita**
- Creazione ordini cliente
- Selezione prodotti con prezzi da listino
- Sconti per riga
- Stati ordine (bozza, confermato, evaso, annullato)
- Evasione ordine

**Ordini di Acquisto**
- Creazione ordini fornitore
- Stessa logica degli ordini vendita

### 5. Fatturazione (struttura pronta)
- Tabelle database predisposte
- Collegamento ordini → fatture

### 6. Configurazioni di Sistema

**Tabelle di Base**
- Aliquote IVA
- Metodi di Pagamento
- Valute
- Causali Documento
- Causali Movimento Magazzino

**Classificazioni**
- Tipi Soggetto (Cliente, Fornitore, Agente, Banca, Vettore, ecc.)
- Categorie Cliente
- Categorie Fornitore (con link a conto costi)
- Famiglie e Macrofamiglie prodotto

**Listini**
- Listini vendita e acquisto
- Prezzi per prodotto/listino
- Date validità

**Piano dei Conti**
- Struttura gerarchica a 5 livelli
- Natura: Attività, Passività, Costi, Ricavi
- Tipo costo: merce, servizi, trasporti, utility, finanziari, commerciale

### 7. Dati Geografici
- Database completo regioni, province e comuni italiani
- Sincronizzazione automatica da fonte ufficiale
- Selezione a cascata nei form

### 8. Dashboard
- Panoramica generale
- Accesso rapido alle sezioni principali

---

## Funzionalità da Implementare

### Priorità Alta
1. **Fatture Acquisto** - Form completo con precompilazione conto costi da categoria fornitore
2. **Dashboard Costi** - Grafici e analisi costi per tipologia (merce, servizi, trasporti, utility, finanziari)
3. **Report Marginalità** - Calcolo margine lordo e EBITDA

### Priorità Media
4. **Gestione Tariffe Trasporto** - Calcolo automatico costi spedizione negli ordini
5. **Scadenzario Pagamenti** - Gestione scadenze e incassi/pagamenti
6. **Soggetto Multi-ruolo** - Stesso soggetto può essere sia cliente che fornitore
7. **Creazione rapida** - Aggiungere clienti/prodotti "al volo" durante inserimento ordini

### Priorità Bassa
8. **Import da Excel** - Importazione massiva anagrafiche da file Excel/CSV
9. **Report avanzati** - Statistiche vendite, acquisti, magazzino
10. **Integrazione PowerBI** - Export dati per analisi avanzate

---

## Tecnologie Utilizzate

- **Frontend**: Next.js 15, React 19, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Hosting**: Vercel
- **Validazioni**: Zod, React Hook Form

---

*Ultimo aggiornamento: Dicembre 2025*
