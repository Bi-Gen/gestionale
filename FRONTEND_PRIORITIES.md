# 📋 PRIORITÀ FRONTEND - All in One Gestionale

## 🎯 OBIETTIVO
Implementare dashboard SuperAdmin + sistema autenticazione + CRUD base per testare il backend multi-tenancy.

---

## 🚀 FASE 1: SISTEMA SUPERADMIN (PRIORITÀ MASSIMA)

### 1.1 - Setup Base & Autenticazione
**Priority: CRITICAL**
**Tempo stimato: 1-2 giorni**

**Task:**
- [ ] Setup Supabase client nel frontend
- [ ] Context Provider per autenticazione (useAuth)
- [ ] Pagina Login (/login)
- [ ] Pagina Logout
- [ ] Route protection (middleware Next.js o ProtectedRoute component)
- [ ] Hook `useUser()` che ritorna utente corrente + ruolo (superadmin/owner/admin/user)

**Componenti da creare:**
```
/app/login/page.tsx
/app/logout/page.tsx
/components/auth/LoginForm.tsx
/components/auth/ProtectedRoute.tsx
/contexts/AuthContext.tsx
/hooks/useAuth.ts
/hooks/useUser.ts
/lib/supabase-client.ts
```

**Note:**
- Usare Supabase Auth
- Verificare `is_superadmin()` dopo login
- Redirect automatico: superadmin → /superadmin, altri → /dashboard

---

### 1.2 - Dashboard SuperAdmin: Vista Aziende
**Priority: CRITICAL**
**Tempo stimato: 2-3 giorni**

**Task:**
- [ ] Layout SuperAdmin (/superadmin/layout.tsx)
- [ ] Sidebar con navigazione:
  - Dashboard Overview
  - Aziende
  - Utenti Globale
  - Piani Abbonamento
  - Statistiche
- [ ] Pagina lista aziende (/superadmin/aziende)
  - Tabella con tutte le aziende
  - Colonne: Nome, P.IVA, Piano, Stato, Utenti, Scadenza, Azioni
  - Filtri: Piano, Stato (trial/attivo/scaduto/sospeso)
  - Search bar (cerca per ragione sociale, P.IVA)
  - Ordinamento colonne
  - Paginazione

**Componenti:**
```
/app/superadmin/layout.tsx
/app/superadmin/page.tsx (dashboard overview)
/app/superadmin/aziende/page.tsx
/components/superadmin/AziendaTable.tsx
/components/superadmin/AziendaRow.tsx
/components/superadmin/Sidebar.tsx
/components/ui/DataTable.tsx (riutilizzabile)
```

**API/Queries necessarie:**
```typescript
// /lib/api/superadmin-aziende.ts
export async function getAllAziende(filters?: {
  piano?: string;
  stato?: string;
  search?: string;
}) {
  const { data, error } = await supabase
    .from('azienda')
    .select(`
      *,
      piano_abbonamento:piano(*),
      utenti:utente_azienda(count)
    `)
    .order('created_at', { ascending: false });

  return { data, error };
}
```

---

### 1.3 - CRUD Aziende (SuperAdmin)
**Priority: CRITICAL**
**Tempo stimato: 2-3 giorni**

**Task:**
- [ ] Modale/Pagina Crea Azienda (/superadmin/aziende/nuovo)
  - Form con campi:
    - Nome (short name)
    - Ragione Sociale
    - Partita IVA (validazione 11 cifre)
    - Codice Fiscale (16 caratteri)
    - Email
    - Telefono
    - Indirizzo completo (via, CAP, città, provincia)
    - **Piano abbonamento** (select: Light/Premium/Enterprise)
    - **Stato** (select: trial/attivo/sospeso)
    - Data inizio, Data scadenza
    - Logo (upload opzionale)
  - Validazione form (react-hook-form + zod)
  - Submit → crea azienda + auto-seed (magazzino, IVA, causali)

- [ ] Pagina Modifica Azienda (/superadmin/aziende/[id]/edit)
  - Form precompilato con dati esistenti
  - Possibilità cambiare piano
  - Possibilità cambiare stato (sospendi/riattiva)

- [ ] Modale Elimina Azienda (con conferma)
  - Warning: "Eliminerai tutti i dati (prodotti, clienti, ecc.)"
  - Checkbox "Sono sicuro"
  - Bottone rosso "ELIMINA DEFINITIVAMENTE"

- [ ] Pagina Dettaglio Azienda (/superadmin/aziende/[id])
  - Tab: Informazioni, Utenti, Statistiche, Log
  - Visualizza: dati azienda, numero prodotti, clienti, fatture, etc.

**Componenti:**
```
/app/superadmin/aziende/nuovo/page.tsx
/app/superadmin/aziende/[id]/page.tsx
/app/superadmin/aziende/[id]/edit/page.tsx
/components/superadmin/AziendaForm.tsx
/components/superadmin/AziendaDettaglio.tsx
/components/superadmin/DeleteAziendaModal.tsx
/lib/validations/azienda-schema.ts
```

**API necessarie:**
```typescript
// /lib/api/superadmin-aziende.ts
export async function createAzienda(data: AziendaInput) {
  // 1. Insert into azienda
  // 2. Trigger auto-seed (magazzino, IVA, causali) - TODO: creare function SQL
  // 3. Return azienda_id
}

export async function updateAzienda(id: string, data: AziendaUpdate) {}
export async function deleteAzienda(id: string) {}
export async function getAziendaById(id: string) {}
```

---

### 1.4 - Gestione Utenti Globale (SuperAdmin)
**Priority: HIGH**
**Tempo stimato: 3-4 giorni**

**Task:**
- [ ] Pagina lista utenti (/superadmin/utenti)
  - Tabella con TUTTI gli utenti di TUTTE le aziende
  - Colonne: Nome, Email, Azienda, Ruolo, Permessi, Stato, Azioni
  - Filtri: Azienda, Ruolo
  - Search bar (cerca per nome/email)

- [ ] Modale Crea Utente (/superadmin/utenti/nuovo)
  - Select: Azienda (dropdown con tutte le aziende)
  - Email (crea account Supabase Auth)
  - Nome, Cognome
  - **Ruolo**: owner / admin / user
  - **Permessi granulari** (checkboxes per area):
    - prodotti: read/write/delete
    - soggetti: read/write/delete
    - magazzino: read/write
    - fatture: read/write/delete
    - configurazione: read/write
    - utenti: read/write/delete
    - analytics: read
  - Password temporanea (generata o manuale)
  - Invia email invito

- [ ] Pagina Modifica Utente (/superadmin/utenti/[id]/edit)
  - Modifica ruolo
  - Modifica permessi
  - Cambio azienda (possibile?)
  - Sospendi/Riattiva utente

- [ ] Modale Elimina Utente (con conferma)

**Componenti:**
```
/app/superadmin/utenti/page.tsx
/app/superadmin/utenti/nuovo/page.tsx
/app/superadmin/utenti/[id]/edit/page.tsx
/components/superadmin/UtenteTable.tsx
/components/superadmin/UtenteForm.tsx
/components/superadmin/PermessiCheckboxes.tsx
/lib/validations/utente-schema.ts
```

**API necessarie:**
```typescript
// /lib/api/superadmin-utenti.ts
export async function getAllUtenti(filters?: {
  azienda_id?: string;
  ruolo?: string;
}) {
  const { data } = await supabase
    .from('utente_azienda')
    .select(`
      *,
      azienda:azienda_id(nome, ragione_sociale)
    `)
    .order('created_at', { ascending: false });

  return data;
}

export async function createUtente(data: {
  email: string;
  nome: string;
  cognome: string;
  azienda_id: string;
  ruolo: 'owner' | 'admin' | 'user';
  permessi: Record<string, any>;
}) {
  // 1. Create auth.users via Supabase Admin API
  // 2. Insert into utente_azienda
  // 3. Send invite email
}

export async function updateUtente(user_id: string, data: UtentUpdate) {}
export async function deleteUtente(user_id: string) {}
```

---

### 1.5 - Dashboard SuperAdmin: Statistiche Globali
**Priority: MEDIUM**
**Tempo stimato: 1-2 giorni**

**Task:**
- [ ] Pagina dashboard overview (/superadmin)
  - Card statistiche:
    - Totale aziende attive
    - Totale utenti
    - MRR (Monthly Recurring Revenue)
    - Aziende in trial
    - Aziende in scadenza (prossimi 7 giorni)
  - Grafico: Nuove aziende per mese (ultimi 12 mesi)
  - Grafico: Revenue per piano (Light/Premium/Enterprise)
  - Tabella: Ultime 10 aziende registrate
  - Tabella: Aziende in scadenza

**Componenti:**
```
/app/superadmin/page.tsx
/components/superadmin/StatCard.tsx
/components/superadmin/AziendeChart.tsx (Recharts o Chart.js)
/components/superadmin/RevenueChart.tsx
```

**Note:**
- Usare libreria charting (Recharts consigliato per Next.js)

---

## 📊 FASE 2: DASHBOARD AZIENDA (Owner/Admin/User)

### 2.1 - Setup Dashboard Azienda
**Priority: HIGH**
**Tempo stimato: 2 giorni**

**Task:**
- [ ] Layout Dashboard (/dashboard/layout.tsx)
- [ ] Sidebar con navigazione:
  - Dashboard
  - Prodotti
  - Clienti
  - Fornitori
  - Magazzino
  - Fatture (future)
  - Statistiche
  - Impostazioni
- [ ] Header con:
  - Nome azienda
  - User menu (profilo, logout)
  - Notifiche (future)

- [ ] Pagina dashboard overview (/dashboard)
  - Card: Totale prodotti, clienti, fornitori
  - Card: Valore magazzino
  - Card: Prodotti sotto scorta (alert)
  - Grafico: Vendite ultimi 30 giorni (future)

**Componenti:**
```
/app/dashboard/layout.tsx
/app/dashboard/page.tsx
/components/dashboard/Sidebar.tsx
/components/dashboard/Header.tsx
/components/dashboard/StatCard.tsx
```

---

### 2.2 - Gestione Profilo Azienda
**Priority: MEDIUM**
**Tempo stimato: 1 giorno**

**Task:**
- [ ] Pagina Impostazioni (/dashboard/impostazioni)
  - Tab: Azienda, Utenti, Piano, Fatturazione
  - **Tab Azienda:**
    - Form modifica dati azienda (solo owner/admin)
    - Upload logo
    - Colore primario (color picker)
  - **Tab Utenti:**
    - Lista utenti della propria azienda
    - Invita nuovo utente (solo owner/admin con permesso 'utenti/write')
    - Modifica permessi utenti
  - **Tab Piano:**
    - Visualizza piano corrente
    - Limiti: X/100 prodotti, X/50 clienti, etc.
    - Progress bar per limiti
    - Bottone "Upgrade Piano" (future)

**Componenti:**
```
/app/dashboard/impostazioni/page.tsx
/components/dashboard/AziendaSettingsForm.tsx
/components/dashboard/UtentiList.tsx
/components/dashboard/PianoInfo.tsx
```

---

## 🛒 FASE 3: CRUD BASE (Prodotti, Clienti, Fornitori)

### 3.1 - CRUD Prodotti
**Priority: HIGH**
**Tempo stimato: 3-4 giorni**

**Task:**
- [ ] Pagina lista prodotti (/dashboard/prodotti)
  - Tabella con prodotti dell'azienda
  - Colonne: Codice, Nome, Categoria, Prezzo, Giacenza, Stato
  - Filtri: Categoria, Attivo/Inattivo, Sotto scorta
  - Search bar (cerca per codice/nome/EAN)
  - Ordinamento colonne
  - Paginazione
  - Azioni: Modifica, Elimina, Duplica

- [ ] Pagina Nuovo Prodotto (/dashboard/prodotti/nuovo)
  - **Tab 1: Anagrafica**
    - Codice (auto-generato o manuale)
    - Nome
    - Descrizione
    - Descrizione breve
    - Categoria (select con categorie azienda)
    - Unità di misura
    - Codice EAN (barcode scanner future)
  - **Tab 2: Prezzi e Costi**
    - Prezzo vendita
    - Costo ultimo
    - Costo medio (readonly, calcolato)
    - Margine % (readonly, calcolato)
    - Sconto massimo %
    - Aliquota IVA (select)
    - Listini multipli (se piano Premium+)
  - **Tab 3: Magazzino**
    - Quantità magazzino (readonly se gestione movimenti attiva)
    - Giacenza minima
    - Giacenza massima
    - Punto riordino
    - Ubicazione
    - Gestione lotti (checkbox)
  - **Tab 4: Fornitori**
    - Fornitore principale (select da soggetti tipo fornitore)
    - Fornitori alternativi (multiple select)
    - Tempo riordino (giorni)
    - Quantità minima ordine
  - **Tab 5: Immagini** (future)
  - Validazione form
  - Submit → crea prodotto

- [ ] Pagina Modifica Prodotto (/dashboard/prodotti/[id]/edit)
  - Form precompilato
  - Salva modifiche

- [ ] Modale Elimina Prodotto (con conferma)

- [ ] Pagina Dettaglio Prodotto (/dashboard/prodotti/[id])
  - Tab: Info, Movimenti magazzino, Storia prezzi (future)

**Componenti:**
```
/app/dashboard/prodotti/page.tsx
/app/dashboard/prodotti/nuovo/page.tsx
/app/dashboard/prodotti/[id]/page.tsx
/app/dashboard/prodotti/[id]/edit/page.tsx
/components/prodotti/ProdottoTable.tsx
/components/prodotti/ProdottoForm.tsx (con tabs)
/components/prodotti/ProdottoDettaglio.tsx
/lib/validations/prodotto-schema.ts
```

**API necessarie:**
```typescript
// /lib/api/prodotti.ts
export async function getProdotti(azienda_id: string, filters?: {
  categoria?: string;
  attivo?: boolean;
  sotto_scorta?: boolean;
  search?: string;
}) {
  const { data } = await supabase
    .from('prodotto')
    .select('*')
    .eq('azienda_id', azienda_id)  // RLS fa già il filtro
    .order('nome');

  return data;
}

export async function createProdotto(data: ProdottoInput) {}
export async function updateProdotto(id: number, data: ProdottoUpdate) {}
export async function deleteProdotto(id: number) {}
```

---

### 3.2 - CRUD Soggetti (Clienti e Fornitori)
**Priority: HIGH**
**Tempo stimato: 2-3 giorni**

**Task:**
- [ ] Pagina lista soggetti (/dashboard/soggetti)
  - Tabs: Tutti, Clienti, Fornitori, Entrambi
  - Tabella con soggetti dell'azienda
  - Colonne: Ragione Sociale, P.IVA, Città, Tipo, Telefono, Email, Azioni
  - Filtri: Tipo (cliente/fornitore)
  - Search bar

- [ ] Pagina Nuovo Soggetto (/dashboard/soggetti/nuovo)
  - Select: Tipo (cliente / fornitore / entrambi) → array ['cliente', 'fornitore']
  - Radio: Tipo persona (fisica / giuridica)
  - **Se giuridica:**
    - Ragione Sociale
    - Partita IVA
    - Codice Fiscale (opzionale)
  - **Se fisica:**
    - Nome
    - Cognome
    - Codice Fiscale
  - **Dati fiscali:**
    - Codice Univoco SDI
    - PEC
  - **Indirizzo:**
    - Via e Civico
    - CAP
    - Città (select con comuni)
    - Provincia (auto da città)
    - Paese (default IT)
  - **Contatti:**
    - Telefono
    - Email
    - Sito web
  - **Commerciale (se cliente):**
    - Listino prezzi (select)
    - Sconto % default
    - Fido massimo €
    - Giorni pagamento
  - **Acquisti (se fornitore):**
    - Giorni pagamento
    - IBAN
  - Submit → crea soggetto

- [ ] Pagina Modifica Soggetto (/dashboard/soggetti/[id]/edit)
- [ ] Modale Elimina Soggetto (con conferma)
- [ ] Pagina Dettaglio Soggetto (/dashboard/soggetti/[id])
  - Tab: Info, Fatture (future), Ordini (future)

**Componenti:**
```
/app/dashboard/soggetti/page.tsx
/app/dashboard/soggetti/nuovo/page.tsx
/app/dashboard/soggetti/[id]/page.tsx
/app/dashboard/soggetti/[id]/edit/page.tsx
/components/soggetti/SoggettoTable.tsx
/components/soggetti/SoggettoForm.tsx
/lib/validations/soggetto-schema.ts
```

---

### 3.3 - Gestione Magazzino
**Priority: MEDIUM**
**Tempo stimato: 3-4 giorni**

**Task:**
- [ ] Pagina giacenze (/dashboard/magazzino/giacenze)
  - Tabella con giacenze per magazzino (vista giacenza_per_magazzino)
  - Colonne: Prodotto, Codice, Magazzino, Giacenza, Valore €
  - Filtri: Magazzino, Sotto scorta
  - Export Excel

- [ ] Pagina movimenti magazzino (/dashboard/magazzino/movimenti)
  - Tabella con movimenti (ultimi 100)
  - Colonne: Data, Prodotto, Causale, Quantità, Magazzino, Documento
  - Filtri: Data, Magazzino, Causale, Prodotto
  - Azioni: Visualizza dettaglio

- [ ] Pagina Nuovo Movimento (/dashboard/magazzino/movimenti/nuovo)
  - Select: Causale movimento (carico/scarico/trasferimento/rettifica)
  - Select: Magazzino origine
  - **Se trasferimento:** Select magazzino destinazione
  - Select: Prodotto
  - Input: Quantità
  - Input: Costo unitario (solo se carico)
  - Input: Note
  - Data movimento
  - Submit → crea movimento → trigger aggiorna giacenza

- [ ] Pagina prodotti sotto scorta (/dashboard/magazzino/sotto-scorta)
  - Vista: prodotti_sotto_scorta
  - Tabella con prodotti ESAURITO / CRITICO / DA_RIORDINARE
  - Alert badge (rosso/giallo/arancio)
  - Bottone: "Crea Ordine Fornitore" (future)

**Componenti:**
```
/app/dashboard/magazzino/giacenze/page.tsx
/app/dashboard/magazzino/movimenti/page.tsx
/app/dashboard/magazzino/movimenti/nuovo/page.tsx
/app/dashboard/magazzino/sotto-scorta/page.tsx
/components/magazzino/GiacenzeTable.tsx
/components/magazzino/MovimentiTable.tsx
/components/magazzino/MovimentoForm.tsx
/components/magazzino/SottoScortaAlert.tsx
```

---

## 🧪 FASE 4: TESTING E VALIDAZIONE

### 4.1 - Test Funzionali
**Priority: HIGH**
**Tempo stimato: 2 giorni**

**Task:**
- [ ] **Test SuperAdmin:**
  - Login come superadmin
  - Visualizzare tutte le aziende
  - Creare nuova azienda (verificare auto-seed magazzino/IVA/causali)
  - Creare utente per azienda
  - Modificare piano azienda
  - Eliminare azienda (verificare CASCADE DELETE)

- [ ] **Test Owner:**
  - Login come owner azienda 1
  - Verificare isolamento dati (NON vedere dati azienda 2)
  - Creare prodotto
  - Creare cliente/fornitore
  - Creare movimento magazzino
  - Verificare aggiornamento giacenza automatico
  - Invitare nuovo utente
  - Modificare permessi utente

- [ ] **Test Admin:**
  - Login come admin
  - Verificare permessi granulari (può modificare prodotti se ha 'prodotti/write')
  - Verificare non può gestire utenti se non ha 'utenti/write'

- [ ] **Test User:**
  - Login come user
  - Verificare permessi read-only su aree senza permessi write
  - Verificare NON può accedere a impostazioni azienda

- [ ] **Test Feature Flags:**
  - Login azienda con piano Light
  - Verificare limite 1 utente
  - Verificare limite 100 prodotti
  - Verificare NOT accessibile "Multi-magazzini"
  - Login azienda con piano Premium
  - Verificare accessibile "Multi-magazzini"
  - Verificare accessibile "Multi-listini"

**Checklist validazione:**
- [ ] RLS funziona: utente vede solo dati propria azienda
- [ ] SuperAdmin vede tutti i dati
- [ ] Permessi granulari funzionano
- [ ] Feature flags rispettati
- [ ] Trigger auto-calcoli funzionano (margine, giacenze)
- [ ] CASCADE DELETE funziona
- [ ] Nessun errore console browser
- [ ] Performance accettabile (< 2s caricamento pagine)

---

## 📦 COMPONENTI RIUTILIZZABILI DA CREARE

**Priorità per sviluppo veloce:**

```
/components/ui/
  - Button.tsx (varianti: primary, secondary, danger, ghost)
  - Input.tsx
  - Select.tsx
  - Textarea.tsx
  - Checkbox.tsx
  - Radio.tsx
  - Modal.tsx
  - Card.tsx
  - Badge.tsx (per stati: attivo, scaduto, trial, etc.)
  - Table.tsx (con sorting, pagination)
  - Tabs.tsx
  - Alert.tsx
  - Loading.tsx (spinner)
  - EmptyState.tsx (quando tabella vuota)

/components/forms/
  - FormField.tsx (wrapper per label + input + error)
  - FormSection.tsx (per raggruppare campi)
  - AddressForm.tsx (indirizzo completo riutilizzabile)

/components/layouts/
  - DashboardLayout.tsx
  - SuperAdminLayout.tsx
  - AuthLayout.tsx (per login/register)
```

**UI Library consigliata:**
- **shadcn/ui** (componenti Tailwind + Radix UI) → CONSIGLIATO
- Oppure: Headless UI + Tailwind custom
- Oppure: Mantine (più completo ma più opinionated)

---

## 🛠️ STACK TECNOLOGICO CONSIGLIATO

**Frontend:**
- ✅ Next.js 14+ (App Router)
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ shadcn/ui (componenti UI)
- ✅ react-hook-form + zod (form validation)
- ✅ TanStack Query (React Query) per data fetching
- ✅ Zustand o Context API (state management)
- ✅ Recharts (grafici)

**Database/Backend:**
- ✅ Supabase (già configurato)
- ✅ Supabase Auth
- ✅ RLS Policies (già implementate)

**Dev Tools:**
- ✅ ESLint + Prettier
- ✅ TypeScript strict mode
- ✅ Git hooks (Husky) per pre-commit

---

## 📅 TIMELINE STIMATA

**Settimana 1-2: SuperAdmin + Auth**
- Setup base + autenticazione
- Dashboard SuperAdmin
- CRUD Aziende
- Gestione utenti globale

**Settimana 3: Dashboard Azienda**
- Layout dashboard
- Overview statistiche
- Impostazioni azienda

**Settimana 4-5: CRUD Base**
- CRUD Prodotti (il più complesso)
- CRUD Soggetti
- Gestione magazzino

**Settimana 6: Testing & Refinement**
- Test completi
- Fix bug
- UI/UX polish
- Performance optimization

**TOTALE: ~6 settimane per MVP completo**

---

## 🎯 MILESTONE 1 (DA COMPLETARE PRIMA DI PROSEGUIRE)

**Obiettivo:** SuperAdmin funzionante + test multi-tenancy

**Deliverables:**
1. ✅ Login/Logout funzionante
2. ✅ SuperAdmin può vedere tutte le aziende
3. ✅ SuperAdmin può creare nuova azienda
4. ✅ SuperAdmin può creare utente per qualsiasi azienda
5. ✅ Utente normale NON vede dati altre aziende
6. ✅ RLS verificato funzionante

**Quando completato Milestone 1 → proseguire con CRUD base**

---

## 📝 NOTE IMPLEMENTATIVE

### Gestione Permessi nel Frontend

```typescript
// /hooks/usePermissions.ts
export function usePermissions() {
  const { user } = useAuth();

  const hasPermission = (area: string, level: 'read' | 'write' | 'delete') => {
    if (user.is_superadmin) return true;
    if (user.ruolo === 'owner') return true;

    return user.permessi?.[area]?.[level] === true;
  };

  const canCreate = (area: string) => hasPermission(area, 'write');
  const canEdit = (area: string) => hasPermission(area, 'write');
  const canDelete = (area: string) => hasPermission(area, 'delete');
  const canView = (area: string) => hasPermission(area, 'read');

  return { hasPermission, canCreate, canEdit, canDelete, canView };
}

// Uso nei componenti:
const { canCreate } = usePermissions();

{canCreate('prodotti') && (
  <Button onClick={onCreateProdotto}>Nuovo Prodotto</Button>
)}
```

### Gestione Feature Flags

```typescript
// /hooks/useFeatureFlags.ts
export function useFeatureFlags() {
  const { user } = useAuth();
  const azienda = user.azienda;

  const hasFeature = (feature: string) => {
    if (user.is_superadmin) return true;
    return azienda?.features_abilitate?.[feature] === true;
  };

  return { hasFeature };
}

// Uso:
const { hasFeature } = useFeatureFlags();

{hasFeature('magazzini_multipli') && (
  <Link href="/dashboard/magazzino/multi">Multi Magazzini</Link>
)}
```

### Query Supabase con RLS

```typescript
// Le RLS policies filtrano automaticamente per azienda_id
// NON serve fare .eq('azienda_id', user.azienda_id) manualmente!

// ✅ CORRETTO:
const { data: prodotti } = await supabase
  .from('prodotto')
  .select('*')
  .order('nome');

// ❌ SBAGLIATO (ridondante, RLS fa già il filtro):
const { data: prodotti } = await supabase
  .from('prodotto')
  .select('*')
  .eq('azienda_id', user.azienda_id)  // Non serve!
  .order('nome');

// SuperAdmin: usa service role per bypassare RLS
const supabaseAdmin = createClient(url, serviceRoleKey);
const { data: allProdotti } = await supabaseAdmin
  .from('prodotto')
  .select('*');  // Vede TUTTI i prodotti di TUTTE le aziende
```

---

## ✅ CHECKLIST PRE-SVILUPPO

Prima di iniziare lo sviluppo frontend:

- [x] Backend database completo
- [x] RLS policies testate
- [x] Sistema SuperAdmin nel database
- [ ] Applicare migration SuperAdmin: `20251127_009_superadmin.sql`
- [ ] Creare primo utente SuperAdmin manualmente
- [ ] Setup progetto Next.js (se non già fatto)
- [ ] Configurare Supabase client nel frontend
- [ ] Installare dipendenze: shadcn/ui, react-hook-form, zod, TanStack Query

**Comando setup suggerito:**
```bash
# Crea progetto Next.js (se non esiste)
npx create-next-app@latest gestionale-frontend --typescript --tailwind --app

# Installa dipendenze
npm install @supabase/supabase-js
npm install @tanstack/react-query
npm install react-hook-form zod @hookform/resolvers
npm install recharts
npm install lucide-react  # icone

# Setup shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button input select table card tabs dialog
```

---

## 🚨 PRIORITÀ ASSOLUTA: APPLICARE MIGRATION SUPERADMIN

**PRIMA DI INIZIARE IL FRONTEND, ESEGUI:**

```bash
# Applica migration SuperAdmin
# (via Supabase Dashboard o CLI)
```

**POI crea primo SuperAdmin:**

```sql
-- 1. Crea utente in Supabase Auth Dashboard
-- 2. Copia il UUID dell'utente
-- 3. Esegui:

INSERT INTO superadmin_users (user_id, nome, cognome, email, attivo)
VALUES (
  'UUID_COPIATO_DA_AUTH',
  'Mario',
  'Rossi',
  'admin@example.com',
  true
);
```

**Verifica SuperAdmin funziona:**
```sql
-- Test function (sostituisci con UUID reale)
SELECT public.is_superadmin(); -- Deve ritornare true se loggato come superadmin
```

---

## 📞 QUANDO PRONTO

Quando hai applicato la migration SuperAdmin e sei pronto per iniziare il frontend, fammi sapere e procediamo con:

1. Setup progetto Next.js
2. Configurazione Supabase client
3. Implementazione login + route protection
4. Prima pagina: Dashboard SuperAdmin

**BUON LAVORO! 🚀**
