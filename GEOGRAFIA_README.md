# 🗺️ Gestione Dati Geografici

Sistema per gestire **Regioni, Province e Comuni** italiani con sincronizzazione da API esterna.

## 📋 Setup Database

### 1. Esegui le Migration in Supabase

Vai nella dashboard Supabase → SQL Editor e esegui il contenuto del file:
```
supabase/migrations/001_create_geografia_tables.sql
```

Questo creerà:
- ✅ Tabella `regioni` (20 regioni italiane)
- ✅ Tabella `province` (107 province)
- ✅ Tabella `comuni` (~8000 comuni)
- ✅ Indici per performance
- ✅ Row Level Security policies

### 2. Inserisci Dati Iniziali (Opzionale)

Puoi inserire manualmente i dati base oppure usare la funzione di sync.

#### Opzione A: Dati Manuali (Base)

```sql
-- Inserisci alcune regioni di esempio
INSERT INTO regioni (codice, nome) VALUES
('01', 'Piemonte'),
('03', 'Lombardia'),
('05', 'Veneto'),
('08', 'Emilia-Romagna'),
('09', 'Toscana'),
('12', 'Lazio'),
('15', 'Campania'),
('19', 'Sicilia');

-- Inserisci alcune province di esempio
INSERT INTO province (codice, nome, sigla, regione_id) VALUES
('001', 'Torino', 'TO', 1),
('015', 'Milano', 'MI', 2),
('027', 'Venezia', 'VE', 3),
('037', 'Bologna', 'BO', 4),
('048', 'Firenze', 'FI', 5),
('058', 'Roma', 'RM', 6),
('063', 'Napoli', 'NA', 7),
('087', 'Palermo', 'PA', 8);
```

#### Opzione B: Sync da API (Automatico)

1. Vai su **Dashboard → Configurazioni → Geografia**
2. Clicca sul pulsante **"Sincronizza da API"**
3. Attendi il completamento

## 🎯 Funzionalità

### Visualizzazione Dati

La pagina `/dashboard/geografia` mostra:

- **📊 Card Statistics**: Totale regioni, province, comuni
- **🔍 Ricerca Comuni**: Search in tempo reale per nome
- **📋 Tabelle**: Visualizzazione dati geografici organizzati

### API Actions Disponibili

```typescript
// Leggi regioni
const regioni = await getRegioni()

// Leggi province
const province = await getProvince()

// Leggi province di una regione
const province = await getProvinceByRegione(regioneId)

// Leggi comuni
const comuni = await getComuni() // Primi 100

// Leggi comuni di una provincia
const comuni = await getComuniByProvincia(provinciaId)

// Cerca comuni
const result = await searchComuni('Roma')

// Stats
const stats = await getGeografiaStats()

// Sync da API
const result = await syncGeografiaFromAPI()
```

## 🔄 Sincronizzazione API

La funzione `syncGeografiaFromAPI()` permette di importare/aggiornare i dati da una fonte esterna.

### Configurazione API Esterna

Attualmente configurato per usare un endpoint di esempio. Per usare dati reali:

**Opzione 1: API ISTAT**
```typescript
const response = await fetch('https://www.istat.it/storage/codici-unita-amministrative/...json')
```

**Opzione 2: Dataset GitHub**
```typescript
const response = await fetch('https://raw.githubusercontent.com/matteocontrini/comuni-json/master/comuni.json')
```

**Opzione 3: API Comuniitaliani.it**
```typescript
const response = await fetch('https://comuni-ita.herokuapp.com/api/comuni')
```

Modifica il file `app/actions/geografia.ts` → funzione `syncGeografiaFromAPI()` per cambiare la fonte dati.

## 💡 Utilizzo nei Form

### Esempio: Form Indirizzo Cliente

```tsx
'use client'

import { useState, useEffect } from 'react'
import { getRegioni, getProvinceByRegione, getComuniByProvincia } from '@/app/actions/geografia'

export default function IndirizzoForm() {
  const [regioni, setRegioni] = useState([])
  const [province, setProvince] = useState([])
  const [comuni, setComuni] = useState([])

  const [selectedRegione, setSelectedRegione] = useState('')
  const [selectedProvincia, setSelectedProvincia] = useState('')

  useEffect(() => {
    // Carica regioni
    getRegioni().then(setRegioni)
  }, [])

  useEffect(() => {
    // Carica province quando cambia regione
    if (selectedRegione) {
      getProvinceByRegione(Number(selectedRegione)).then(setProvince)
    }
  }, [selectedRegione])

  useEffect(() => {
    // Carica comuni quando cambia provincia
    if (selectedProvincia) {
      getComuniByProvincia(Number(selectedProvincia)).then(setComuni)
    }
  }, [selectedProvincia])

  return (
    <div>
      <select onChange={(e) => setSelectedRegione(e.target.value)}>
        <option value="">Seleziona Regione</option>
        {regioni.map(r => (
          <option key={r.id} value={r.id}>{r.nome}</option>
        ))}
      </select>

      <select onChange={(e) => setSelectedProvincia(e.target.value)}>
        <option value="">Seleziona Provincia</option>
        {province.map(p => (
          <option key={p.id} value={p.id}>{p.nome} ({p.sigla})</option>
        ))}
      </select>

      <select>
        <option value="">Seleziona Comune</option>
        {comuni.map(c => (
          <option key={c.id} value={c.id}>{c.nome} - {c.cap}</option>
        ))}
      </select>
    </div>
  )
}
```

## 📊 Struttura Dati

### Tabella: regioni
| Campo | Tipo | Descrizione |
|-------|------|-------------|
| id | SERIAL | Primary Key |
| codice | VARCHAR(2) | Codice ISTAT |
| nome | VARCHAR(100) | Nome regione |

### Tabella: province
| Campo | Tipo | Descrizione |
|-------|------|-------------|
| id | SERIAL | Primary Key |
| codice | VARCHAR(3) | Codice ISTAT |
| nome | VARCHAR(100) | Nome provincia |
| sigla | VARCHAR(2) | Sigla (es: MI) |
| regione_id | INTEGER | FK → regioni |

### Tabella: comuni
| Campo | Tipo | Descrizione |
|-------|------|-------------|
| id | SERIAL | Primary Key |
| codice | VARCHAR(6) | Codice ISTAT/catastale |
| nome | VARCHAR(100) | Nome comune |
| provincia_id | INTEGER | FK → province |
| cap | VARCHAR(5) | Codice postale |

## 🔐 Sicurezza

- **Row Level Security** abilitato
- **Lettura pubblica**: tutti possono leggere i dati
- **Scrittura protetta**: solo utenti autenticati possono modificare

## 🎨 Personalizzazione

Puoi estendere le tabelle aggiungendo campi come:
- Coordinate GPS (lat/lng)
- Prefisso telefonico
- Popolazione
- Superficie
- Zona geografica

```sql
ALTER TABLE comuni ADD COLUMN latitudine DECIMAL(10, 8);
ALTER TABLE comuni ADD COLUMN longitudine DECIMAL(11, 8);
ALTER TABLE comuni ADD COLUMN popolazione INTEGER;
```

## 🚀 Performance

- **Indici** su chiavi esterne e campi di ricerca
- **Limit** di default su query massive (100 comuni)
- **Search** ottimizzata con ILIKE e LIMIT 50
- Considera pagination per liste lunghe

---

**Creato con** 🤖 [Claude Code](https://claude.com/claude-code)
