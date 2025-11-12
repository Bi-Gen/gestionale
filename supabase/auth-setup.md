# Configurazione Autenticazione Supabase

Per far funzionare correttamente il sistema di login/registrazione, devi configurare l'autenticazione su Supabase.

## Disabilita conferma email (per sviluppo)

Per rendere più semplice lo sviluppo, puoi disabilitare la conferma email:

1. Vai su https://supabase.com/dashboard
2. Seleziona il tuo progetto
3. Nel menu laterale, vai su **Authentication** > **Providers**
4. Clicca su **Email** nella lista dei provider
5. Disabilita l'opzione **"Confirm email"**
6. Clicca su **Save**

Ora gli utenti possono registrarsi e accedere immediatamente senza dover confermare l'email.

## Configurazione Email (per produzione)

Quando sarai pronto per la produzione, puoi configurare un servizio email:

1. Vai su **Project Settings** > **Auth**
2. Nella sezione **SMTP Settings**, configura il tuo server email
3. Oppure usa i servizi integrati come SendGrid, Mailgun, etc.

## Testare il login

Dopo la configurazione:

1. Vai su http://localhost:3000
2. Clicca su "Registrati"
3. Inserisci email e password (minimo 6 caratteri)
4. Verrai reindirizzato alla dashboard

Puoi anche verificare gli utenti registrati su Supabase:
- **Authentication** > **Users**
