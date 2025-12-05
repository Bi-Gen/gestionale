require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

;(async () => {
  try {
    console.log('=== VERIFICA UTENTI E AZIENDE ===\n')

    // Lista tutti gli utenti
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      console.error('Errore recupero utenti:', usersError)
      process.exit(1)
    }

    console.log(`Trovati ${users.length} utenti:\n`)

    for (const user of users) {
      console.log(`User ID: ${user.id}`)
      console.log(`Email: ${user.email}`)

      // Verifica associazione azienda
      const { data: utenteAzienda, error: uaError } = await supabase
        .from('utente_azienda')
        .select('*, azienda(*)')
        .eq('user_id', user.id)
        .single()

      if (uaError) {
        console.log('Nessuna azienda associata')
      } else {
        console.log(`Azienda: ${utenteAzienda.azienda?.nome} (ID: ${utenteAzienda.azienda_id})`)
        console.log(`Ruolo: ${utenteAzienda.ruolo}`)
      }

      console.log('---\n')
    }

    // Verifica azienda del magazzino
    const { data: magazzino } = await supabase
      .from('magazzino')
      .select('*, azienda(*)')
      .eq('id', 1)
      .single()

    if (magazzino) {
      console.log('=== MAGAZZINO ===')
      console.log(`Magazzino: ${magazzino.nome}`)
      console.log(`Azienda: ${magazzino.azienda?.nome} (ID: ${magazzino.azienda_id})`)
    }

  } catch (err) {
    console.error('Errore:', err.message)
    process.exit(1)
  }
})()
