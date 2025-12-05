require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

;(async () => {
  try {
    console.log('=== CAUSALI MOVIMENTO DISPONIBILI ===\n')

    const { data: causali, error } = await supabase
      .from('causale_movimento')
      .select('*')
      .order('codice', { ascending: true })

    if (error) {
      console.error('Errore:', error)
      process.exit(1)
    }

    console.log(`Trovate ${causali?.length || 0} causali:\n`)

    causali?.forEach(c => {
      console.log(`Codice: ${c.codice}`)
      console.log(`Descrizione: ${c.descrizione}`)
      console.log(`Tipo: ${c.tipo}`)
      console.log(`Segno: ${c.segno === 1 ? '+1 (CARICO)' : '-1 (SCARICO)'}`)
      console.log(`Aggiorna costo medio: ${c.aggiorna_costo_medio}`)
      console.log(`Richiede documento: ${c.richiede_documento}`)
      console.log(`Visibile: ${c.visibile}`)
      console.log(`Attivo: ${c.attivo}`)
      console.log('---')
    })

  } catch (err) {
    console.error('Errore:', err.message)
    process.exit(1)
  }
})()
