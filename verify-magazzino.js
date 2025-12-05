require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Service role bypassa RLS
)

;(async () => {
  try {
    console.log('=== VERIFICA MAGAZZINI ===\n')

    // Query con service role (bypassa RLS)
    const { data: magazzini, error } = await supabase
      .from('magazzino')
      .select('*')

    if (error) {
      console.error('Errore:', error)
      process.exit(1)
    }

    console.log(`Trovati ${magazzini?.length || 0} magazzini totali:\n`)
    magazzini?.forEach(m => {
      console.log(`ID: ${m.id}`)
      console.log(`Codice: ${m.codice}`)
      console.log(`Nome: ${m.nome}`)
      console.log(`Azienda ID: ${m.azienda_id}`)
      console.log(`Attivo: ${m.attivo}`)
      console.log(`Principale: ${m.principale}`)
      console.log('---')
    })

    // Verifica RLS policies
    console.log('\n=== VERIFICA POLICIES ===')
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'magazzino')

    if (policies) {
      console.log(`Trovate ${policies.length} policy per tabella magazzino`)
      policies.forEach(p => {
        console.log(`\nPolicy: ${p.policyname}`)
        console.log(`Comando: ${p.cmd}`)
      })
    }

  } catch (err) {
    console.error('Errore:', err.message)
    process.exit(1)
  }
})()
