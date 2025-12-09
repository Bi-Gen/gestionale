# Logiche Prezzi e Listini

Documento di riferimento per le logiche di pricing del gestionale.

---

## 1. VENDITA - Recupero Prezzo Cliente

### Funzione DB: `get_prezzo_cliente(p_prodotto_id, p_cliente_id)`

**Server Action:** `getPrezzoCliente(prodottoId, clienteId)` in `app/actions/ordini.ts`

**Logica di priorità (cascade):**

```
1. Listino diretto del cliente
   └── soggetto.listino_id → listino_prodotto.prezzo

2. Listino della categoria cliente
   └── soggetto.categoria_cliente_id → categoria_cliente.listino_id → listino_prodotto.prezzo

3. Listino predefinito (tipo vendita)
   └── listino.predefinito = true AND listino.tipo = 'vendita' → listino_prodotto.prezzo

4. Prezzo base prodotto (fallback)
   └── prodotto.prezzo_vendita
```

**Campi restituiti:**
- `prezzo` - Prezzo unitario
- `listino_id` - ID del listino utilizzato
- `listino_codice` - Codice del listino
- `provvigione` - % provvigione agente
- `sconto_max` - % sconto massimo applicabile
- `fonte` - Origine del prezzo ('listino_cliente', 'listino_categoria', 'listino_default', 'prezzo_base')

### Razionale
Il cliente può avere un listino personalizzato (es. cliente VIP, grande distribuzione). Se non ce l'ha, eredita quello della sua categoria (es. "Rivenditori", "Dettaglio"). Come ultima risorsa usa il listino predefinito aziendale.

---

## 2. ACQUISTO - Recupero Prezzo Fornitore

### Logica

```
1. Listino specifico del fornitore
   └── listino.fornitore_id = fornitore_id AND listino.tipo = 'acquisto' → listino_prodotto.prezzo

2. Listino diretto sul fornitore (soggetto)
   └── soggetto.listino_id → listino_prodotto.prezzo

3. Prezzo base acquisto (fallback)
   └── prodotto.prezzo_acquisto
```

### Razionale
I listini di acquisto sono specifici per fornitore perché:
- Ogni fornitore ha i propri prezzi
- Non ha senso raggruppare fornitori per categoria ai fini del prezzo
- Il campo `listino.fornitore_id` lega direttamente un listino al suo fornitore

La categoria fornitore (`categoria_fornitore`) serve solo per:
- Classificazione/organizzazione (es. "Materie Prime", "Servizi", "Trasporti")
- Report e statistiche
- Associazione conto costo default per contabilità

---

## 3. STRUTTURA DATI

### Tabelle coinvolte

```
soggetto (cliente/fornitore)
├── listino_id              → Listino diretto assegnato
├── categoria_cliente_id    → FK a categoria_cliente (solo clienti)
└── categoria_fornitore_id  → FK a categoria_fornitore (solo fornitori)

categoria_cliente
└── listino_id              → Listino default per questa categoria

categoria_fornitore
└── conto_costo_default_id  → Per contabilità (NO listino_id)

listino
├── tipo                    → 'vendita' | 'acquisto'
├── fornitore_id            → Se acquisto, fornitore proprietario del listino
└── predefinito             → true = listino default aziendale

listino_prodotto
├── listino_id              → FK a listino
├── prodotto_id             → FK a prodotto
├── prezzo                  → Prezzo unitario
├── prezzo_minimo           → Floor price (vendita)
└── sconto_max              → % sconto massimo (vendita)
```

---

## 4. FLUSSO ORDINI

### Ordine di Vendita
1. Utente seleziona cliente
2. Sistema recupera `categoria_cliente` e `listino_id` del cliente
3. Per ogni prodotto aggiunto, chiama `get_prezzo_cliente(prodotto_id, cliente_id)`
4. Precompila il prezzo nel dettaglio ordine
5. Utente può modificare (entro limiti sconto_max se configurato)

### Ordine di Acquisto
1. Utente seleziona fornitore
2. Sistema recupera listini associati al fornitore
3. Per ogni prodotto, cerca prezzo nel listino del fornitore
4. Se non trova, usa `prodotto.prezzo_acquisto` come default
5. Utente può modificare liberamente

---

## 5. NOTE IMPLEMENTATIVE

### Validazioni
- In vendita: verificare che prezzo finale >= prezzo_minimo (se configurato)
- In vendita: verificare che sconto applicato <= sconto_max (se configurato)
- In acquisto: nessun vincolo di prezzo

### Performance
- Gli indici su `listino_prodotto(listino_id, prodotto_id)` sono fondamentali
- La funzione `get_prezzo_cliente` è ottimizzata per query singola

### Aggiornamenti prezzi
- Modificare `listino_prodotto` aggiorna automaticamente i prezzi futuri
- Gli ordini già creati mantengono il prezzo storico (snapshot)
- La tabella `storico_prezzi_prodotto` traccia le variazioni

---

## 6. NOTE UI - ORDINE VENDITA

Nel form vendita (`VenditaForm.tsx`):

1. **Selezione Cliente**: Quando si seleziona un cliente, il sistema aggiorna automaticamente i prezzi di tutti i prodotti già inseriti
2. **Selezione Prodotto**: Quando si aggiunge un prodotto, il prezzo viene recuperato automaticamente dal listino appropriato
3. **Prezzo Override**: L'utente può sempre modificare manualmente il prezzo
   - Il campo si evidenzia in arancione quando il prezzo è stato modificato
   - Un bottone "↺" permette di ripristinare il prezzo originale dal listino
4. **Info Listino**: Per ogni prodotto viene mostrata l'origine del prezzo con colori diversi:
   - Verde: Listino Cliente
   - Blu: Listino Categoria
   - Giallo: Listino Predefinito
   - Grigio: Prezzo Base Prodotto
5. **Sconto Massimo**: Il limite di sconto viene preso dal listino (se presente) altrimenti dal prodotto

---

## 7. PANEL SUPPORTO DECISIONALE

### Funzione DB: `get_statistiche_vendita_prodotto(p_prodotto_id, p_cliente_id, p_mesi_storico)`

**Server Action:** `getStatisticheVenditaProdotto(prodottoId, clienteId)` in `app/actions/ordini.ts`

**Campi restituiti:**

```
Statistiche Vendite (ultimi 12 mesi):
├── prezzo_medio_vendita      → Media ponderata prezzi vendita
├── prezzo_min_vendita        → Prezzo minimo applicato
├── prezzo_max_vendita        → Prezzo massimo applicato
├── quantita_totale_venduta   → Quantità totale venduta
└── numero_vendite            → Numero ordini evasi

Ultima Vendita:
├── ultima_vendita_prezzo     → Prezzo ultima vendita (generale)
├── ultima_vendita_data       → Data ultima vendita
├── ultima_vendita_cliente_*  → Stessi dati per lo specifico cliente

Costi:
├── costo_ultimo              → Ultimo costo di acquisto
└── costo_medio               → Costo medio nel periodo

Margini Calcolati:
├── margine_medio_euro        → (prezzo_medio - costo_medio) in €
├── margine_medio_percentuale → ((prezzo_medio - costo_medio) / costo_medio) * 100
├── margine_ultimo_vendita_*  → Stessi calcoli per ultima vendita
```

### Visualizzazione nel Form Vendita

Il panel "Analisi Storica" mostra:

1. **Costi** - Costo ultimo e medio
2. **Vendite** - Prezzo medio, min/max, numero vendite
3. **Margine Medio** - In percentuale e € per pezzo (colore: verde >20%, giallo >10%, rosso <10%)
4. **Ultima Vendita** - Prezzo e data
5. **Storico Cliente** - Ultima vendita allo stesso cliente (se esiste)
6. **Margine Attuale** - Confronto margine corrente vs media storica
7. **Prezzo Suggerito** - Calcolato come: `costo_ultimo * (1 + margine_medio_percentuale%)`
8. **Provvigione Agente** - Se il listino ha provvigione configurata:
   - Calcolo costo provvigione sulla riga
   - Margine netto dopo provvigione

### Logica Prezzo Suggerito

```
prezzo_suggerito = costo_ultimo * (1 + margine_medio_percentuale / 100)
```

Esempio: Se costo_ultimo = €10.00 e margine_medio = 25%
→ prezzo_suggerito = 10 * 1.25 = €12.50

### Logica Provvigione Agente

```
costo_provvigione = subtotale_riga * (provvigione_percentuale / 100)
margine_netto = subtotale - (costo_ultimo * quantita) - costo_provvigione
```

---

*Ultimo aggiornamento: Dicembre 2024*
