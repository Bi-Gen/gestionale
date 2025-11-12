# Deploy su Vercel - Guida Completa

## Step 1: Importare il progetto su Vercel

1. Vai su https://vercel.com
2. Fai login (puoi usare il tuo account GitHub)
3. Clicca su **"Add New..."** > **"Project"**
4. Nella lista dei repository, cerca e seleziona **"gestionale"**
5. Clicca su **"Import"**

## Step 2: Configurare le Variabili d'Ambiente

Prima di fare il deploy, devi configurare le variabili d'ambiente:

Nella sezione **"Environment Variables"**, aggiungi queste 2 variabili:

### Variabile 1:
- **Name:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://artbclzfaccheonngkbe.supabase.co`

### Variabile 2:
- **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFydGJjbHpmYWNjaGVvbm5na2JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5NDUwNTIsImV4cCI6MjA3ODUyMTA1Mn0.DH3ZeoR3MpAWGrWYFB7fDTR-Yv-nQZjQdYMKSnhoPrc`

**IMPORTANTE:** Assicurati che entrambe le variabili siano aggiunte per tutti gli ambienti:
- ✅ Production
- ✅ Preview
- ✅ Development

## Step 3: Deploy

1. Dopo aver configurato le variabili, clicca su **"Deploy"**
2. Vercel farà automaticamente il build e il deploy
3. Aspetta qualche minuto (circa 1-2 minuti)
4. Quando vedi ✅ il deploy è completato

## Step 4: Configurare Supabase per il dominio Vercel

**MOLTO IMPORTANTE:** Devi aggiungere l'URL di Vercel alla whitelist di Supabase:

1. Dopo il deploy, copia l'URL del tuo sito (es. `https://gestionale-xyz.vercel.app`)
2. Vai su https://supabase.com/dashboard
3. Seleziona il tuo progetto
4. Vai su **Authentication** > **URL Configuration**
5. Nella sezione **"Redirect URLs"**, aggiungi:
   - `https://TUO-URL-VERCEL.vercel.app/**` (con asterischi alla fine)
6. Clicca su **"Save"**

## Step 5: Testare

1. Vai all'URL di Vercel del tuo progetto
2. Clicca su "Registrati"
3. Inserisci email e password
4. Dovresti essere reindirizzato alla dashboard

## Configurazione Autenticazione Email

Prima di testare la registrazione, vai su Supabase:

1. **Authentication** > **Providers** > **Email**
2. Disabilita **"Confirm email"** (per sviluppo)
3. **Save**

## Deploy Automatici

Da ora in poi:
- Ogni `git push` sulla branch `master` farà un deploy automatico in produzione
- Ogni push su altre branch farà un deploy di preview
