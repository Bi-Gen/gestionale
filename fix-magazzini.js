require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

;(async () => {
  try {
    console.log('=== CREAZIONE MAGAZZINI PER TUTTE LE AZIENDE ===\n')

    // Recupera tutte le aziende
    const { data: aziende, error: aziendeError } = await supabase
      .from('azienda')
      .select('*')

    if (aziendeError) {
      console.error('Errore recupero aziende:', aziendeError)
      process.exit(1)
    }

    console.log(`Trovate ${aziende.length} aziende\n`)

    for (const azienda of aziende) {
      console.log(`Azienda: ${azienda.nome} (ID: ${azienda.id})`)

      // Verifica se esiste già un magazzino
      const { data: magazzinoEsistente } = await supabase
        .from('magazzino')
        .select('*')
        .eq('azienda_id', azienda.id)
        .eq('codice', 'MAG01')
        .single()

      if (magazzinoEsistente) {
        console.log(`  ✓ Magazzino già esistente: ${magazzinoEsistente.nome}`)
      } else {
        // Crea magazzino principale
        const { data: nuovoMagazzino, error: creaError } = await supabase
          .from('magazzino')
          .insert([{
            azienda_id: azienda.id,
            codice: 'MAG01',
            nome: 'Magazzino Principale',
            principale: true,
            attivo: true,
            gestione_ubicazioni: false
          }])
          .select()
          .single()

        if (creaError) {
          console.error(`  ✗ Errore creazione:`, creaError.message)
        } else {
          console.log(`  ✓ Creato nuovo magazzino: ${nuovoMagazzino.nome} (ID: ${nuovoMagazzino.id})`)
        }
      }
      console.log()
    }

    console.log('=== COMPLETATO ===')

  } catch (err) {
    console.error('Errore:', err.message)
    process.exit(1)
  }
})()
