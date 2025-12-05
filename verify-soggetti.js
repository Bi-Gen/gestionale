require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

;(async () => {
  try {
    console.log('=== VERIFICA SOGGETTI ===\n')

    const { data: soggetti, error } = await supabase
      .from('soggetto')
      .select('id, ragione_sociale, tipo, attivo')
      .eq('attivo', true)
      .order('ragione_sociale', { ascending: true })

    if (error) {
      console.error('Errore:', error)
      process.exit(1)
    }

    console.log(`Trovati ${soggetti?.length || 0} soggetti attivi:\n`)

    const tipiSoggetto = {}
    soggetti?.forEach(s => {
      console.log(`ID: ${s.id}`)
      console.log(`Ragione Sociale: ${s.ragione_sociale}`)
      console.log(`Tipo: ${s.tipo ? JSON.stringify(s.tipo) : 'NULL'}`)
      console.log('---')

      const tipo = s.tipo ? s.tipo.join(', ') : 'NULL'
      tipiSoggetto[tipo] = (tipiSoggetto[tipo] || 0) + 1
    })

    console.log('\n=== RIEPILOGO TIPI ===')
    Object.entries(tipiSoggetto).forEach(([tipo, count]) => {
      console.log(`${tipo}: ${count} soggetti`)
    })

  } catch (err) {
    console.error('Errore:', err.message)
    process.exit(1)
  }
})()
