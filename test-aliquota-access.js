const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testAccess() {
  console.log('🔍 Test accesso aliquota_iva...\n')

  // Test 1: Con SERVICE ROLE (bypassa RLS)
  console.log('1️⃣ Test con SERVICE ROLE KEY:')
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: data1, error: error1 } = await supabaseAdmin
    .from('aliquota_iva')
    .select('*')

  if (error1) {
    console.log('  ❌ Errore:', error1.message)
  } else {
    console.log(`  ✅ Lette ${data1.length} aliquote`)
    data1.forEach(a => console.log(`     - ${a.percentuale}%`))
  }

  // Test 2: Con ANON KEY (usa RLS)
  console.log('\n2️⃣ Test con ANON KEY (simula utente):')
  const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const { data: data2, error: error2 } = await supabaseAnon
    .from('aliquota_iva')
    .select('*')

  if (error2) {
    console.log('  ❌ PROBLEMA:', error2.message)
    console.log('\n  💡 La tabella aliquota_iva non è accessibile agli utenti!')
    console.log('  📝 Esegui questo SQL nella console di Supabase:\n')
    console.log('  CREATE POLICY "allow_read_aliquota_iva"')
    console.log('  ON aliquota_iva')
    console.log('  FOR SELECT')
    console.log('  TO authenticated')
    console.log('  USING (true);')
  } else {
    console.log(`  ✅ Lette ${data2.length} aliquote`)
    data2.forEach(a => console.log(`     - ${a.percentuale}%`))
  }

  // Test 3: Simula la query che fa il frontend con join
  console.log('\n3️⃣ Test JOIN come nel frontend (con ANON KEY):')
  const { data: data3, error: error3 } = await supabaseAnon
    .from('dettaglio_movimento')
    .select(`
      id,
      imponibile,
      iva,
      aliquota_iva_id,
      aliquota_iva:aliquota_iva_id (
        id,
        percentuale,
        descrizione
      )
    `)
    .limit(1)
    .single()

  if (error3) {
    console.log('  ❌ Errore:', error3.message)
  } else {
    console.log('  ✅ Dettaglio movimento letto:')
    console.log('     Imponibile:', data3.imponibile)
    console.log('     IVA:', data3.iva)
    console.log('     aliquota_iva_id:', data3.aliquota_iva_id)
    console.log('     aliquota_iva object:', data3.aliquota_iva)

    if (data3.aliquota_iva) {
      console.log('     ✅ JOIN funziona! Percentuale:', data3.aliquota_iva.percentuale + '%')
    } else {
      console.log('     ❌ JOIN NON funziona! aliquota_iva è null')
    }
  }
}

testAccess().then(() => {
  console.log('\n✅ Test completato')
  process.exit(0)
}).catch(err => {
  console.error('❌ Errore:', err)
  process.exit(1)
})
