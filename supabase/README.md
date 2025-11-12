# Setup Database Supabase

## Come creare le tabelle

1. Vai su [Supabase Dashboard](https://supabase.com/dashboard)
2. Seleziona il tuo progetto "gestionale"
3. Nel menu laterale, clicca su **SQL Editor**
4. Clicca su **New query**
5. Copia e incolla tutto il contenuto del file `schema.sql`
6. Clicca su **Run** (o premi Ctrl/Cmd + Enter)

## Cosa viene creato

Lo script crea le seguenti tabelle:

- **clienti** - Anagrafica clienti
- **fornitori** - Anagrafica fornitori
- **prodotti** - Catalogo prodotti
- **ordini** - Ordini dei clienti
- **dettagli_ordini** - Righe degli ordini (prodotti ordinati)

## Sicurezza (Row Level Security)

Tutte le tabelle hanno la sicurezza RLS attivata. Questo significa che:
- Ogni utente vede solo i suoi dati
- Non è possibile accedere ai dati di altri utenti
- Le policy sono configurate automaticamente

## Verifica

Dopo aver eseguito lo script, puoi verificare che le tabelle siano state create:
1. Vai su **Table Editor** nel menu laterale
2. Dovresti vedere tutte le tabelle elencate
