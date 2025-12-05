// Script per applicare migration sconto direttamente
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function applyMigration() {
  console.log('🔧 Applicando migration sconto...\n')

  // SQL da eseguire
  const sql = `
    ALTER TABLE dettagli_ordini
    ADD COLUMN IF NOT EXISTS sconto_percentuale DECIMAL(5,2) DEFAULT 0
    CHECK (sconto_percentuale >= 0 AND sconto_percentuale <= 100);
  `

  console.log('SQL da eseguire:', sql)
  console.log('\n⚠️  IMPORTANTE: Questo script usa il client Supabase che potrebbe non avere i permessi.')
  console.log('Se fallisce, devi applicare la migration manualmente.\n')

  try {
    // Prova 1: Usa RPC se disponibile
    const { data, error } = await supabase.rpc('exec_sql', { query: sql })

    if (error) {
      console.log('❌ RPC non disponibile:', error.message)
      console.log('\n📋 DEVI APPLICARE LA MIGRATION MANUALMENTE:\n')
      console.log('1. Vai su https://supabase.com/dashboard/project/YOUR_PROJECT/sql')
      console.log('2. Incolla questo SQL:\n')
      console.log('   ALTER TABLE dettagli_ordini')
      console.log('   ADD COLUMN sconto_percentuale DECIMAL(5,2) DEFAULT 0')
      console.log('   CHECK (sconto_percentuale >= 0 AND sconto_percentuale <= 100);')
      console.log('\n3. Clicca RUN\n')
    } else {
      console.log('✅ Migration applicata con successo!')
    }
  } catch (err) {
    console.log('❌ Errore:', err.message)
    console.log('\n📋 APPLICA MANUALMENTE SU SUPABASE DASHBOARD:\n')
    console.log('ALTER TABLE dettagli_ordini')
    console.log('ADD COLUMN sconto_percentuale DECIMAL(5,2) DEFAULT 0')
    console.log('CHECK (sconto_percentuale >= 0 AND sconto_percentuale <= 100);')
  }

  // Verifica se il campo esiste
  console.log('\n🔍 Verifica struttura tabella...')
  const { data: test, error: testError } = await supabase
    .from('dettagli_ordini')
    .select('*')
    .limit(1)

  if (!testError && test && test.length > 0) {
    const fields = Object.keys(test[0])
    console.log('Campi presenti:', fields.join(', '))

    if (fields.includes('sconto_percentuale')) {
      console.log('\n✅ ✅ ✅ CAMPO SCONTO PRESENTE! ✅ ✅ ✅')
    } else {
      console.log('\n❌ CAMPO SCONTO MANCANTE - Devi applicare la migration manualmente!')
    }
  }
}

applyMigration()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Errore:', err)
    process.exit(1)
  })
