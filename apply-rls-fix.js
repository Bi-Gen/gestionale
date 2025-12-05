const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function applyFix() {
  console.log('🔧 Applico fix RLS per aliquota_iva...\n')

  // Drop eventuali policy esistenti
  console.log('1️⃣ Rimuovo policy esistenti...')
  try {
    await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "allow_read_aliquota_iva" ON aliquota_iva;
        DROP POLICY IF EXISTS "Aliquote IVA read" ON aliquota_iva;
        DROP POLICY IF EXISTS "aliquota_iva_select" ON aliquota_iva;
      `
    })
  } catch (e) {
    console.log('  (policy non esistenti, ok)')
  }

  // Crea nuova policy
  console.log('\n2️⃣ Creo nuova policy per lettura...')
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE POLICY "allow_read_aliquota_iva"
      ON aliquota_iva
      FOR SELECT
      TO authenticated
      USING (true);
    `
  })

  if (error) {
    console.error('❌ Errore:', error)
    return
  }

  console.log('✅ Policy creata con successo!')

  // Test con chiave pubblica
  console.log('\n3️⃣ Test lettura con chiave pubblica...')
  const supabasePublic = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const { data, error: testError } = await supabasePublic
    .from('aliquota_iva')
    .select('id, percentuale, descrizione')
    .limit(3)

  if (testError) {
    console.error('❌ Test fallito:', testError.message)
  } else {
    console.log('✅ Test superato! Aliquote lette:')
    data.forEach(a => {
      console.log(`   - ${a.percentuale}% - ${a.descrizione}`)
    })
  }

  console.log('\n🎯 Ora prova a ricaricare la pagina della fattura!')
}

applyFix().then(() => {
  console.log('\n✅ Fix completato')
  process.exit(0)
}).catch(err => {
  console.error('❌ Errore:', err)
  process.exit(1)
})
