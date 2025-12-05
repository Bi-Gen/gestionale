const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkRLS() {
  console.log('🔍 Verifica RLS su tabella aliquota_iva...\n')

  // Query per vedere le policies
  const { data, error } = await supabase
    .from('pg_policies')
    .select('*')
    .eq('tablename', 'aliquota_iva')

  if (error) {
    console.error('❌ Errore:', error)
    return
  }

  if (!data || data.length === 0) {
    console.log('❌ PROBLEMA: Nessuna policy RLS trovata per aliquota_iva!')
    console.log('   La tabella non è accessibile agli utenti normali.\n')

    console.log('💡 SOLUZIONE: Aggiungiamo una policy per permettere la lettura:\n')
    console.log('CREATE POLICY "allow_read_aliquota_iva" ON aliquota_iva')
    console.log('  FOR SELECT')
    console.log('  TO authenticated')
    console.log('  USING (true);')
  } else {
    console.log('✅ Policies trovate:')
    data.forEach(p => {
      console.log(`\n  - ${p.policyname}`)
      console.log(`    Command: ${p.cmd}`)
      console.log(`    Roles: ${p.roles}`)
    })
  }

  // Verifica anche se RLS è abilitata
  const { data: tableInfo } = await supabase
    .from('pg_tables')
    .select('*')
    .eq('tablename', 'aliquota_iva')
    .single()

  console.log('\n📊 Info tabella:', tableInfo)

  // Test lettura con service role
  console.log('\n🔧 Test lettura con SERVICE ROLE:')
  const { data: aliquote1 } = await supabase
    .from('aliquota_iva')
    .select('*')
    .limit(1)

  console.log('   Risultato:', aliquote1 ? `✅ ${aliquote1.length} record` : '❌ Nessun record')

  // Test lettura con chiave pubblica (simulando utente)
  console.log('\n🔧 Test lettura con CHIAVE PUBBLICA:')
  const supabasePublic = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const { data: aliquote2, error: error2 } = await supabasePublic
    .from('aliquota_iva')
    .select('*')
    .limit(1)

  if (error2) {
    console.log('   ❌ Errore:', error2.message)
  } else {
    console.log('   Risultato:', aliquote2 ? `✅ ${aliquote2.length} record` : '❌ Nessun record')
  }
}

checkRLS().then(() => {
  console.log('\n✅ Verifica completata')
  process.exit(0)
}).catch(err => {
  console.error('❌ Errore:', err)
  process.exit(1)
})
