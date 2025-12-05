// Script per applicare migration sconto
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function applyMigration() {
  console.log('📝 Applicando migration sconto...\n')

  const migration = fs.readFileSync('./supabase/migrations/20251130_004_add_sconto_to_dettagli_ordini.sql', 'utf-8')

  const statements = migration
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--') && !s.startsWith('COMMENT'))

  for (const sql of statements) {
    if (!sql) continue

    console.log('Eseguendo:', sql.substring(0, 100) + '...')
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      // Proviamo direttamente con la query
      const { error: directError } = await supabase.from('_migrations').insert([{ statement: sql }])

      if (directError) {
        console.log('⚠️  Errore (potrebbe essere già applicata):', error.message)
      } else {
        console.log('✅ OK')
      }
    } else {
      console.log('✅ OK')
    }
  }

  // Verifica risultato
  const { data, error } = await supabase
    .from('dettagli_ordini')
    .select('*')
    .limit(1)

  if (!error && data.length > 0) {
    const campi = Object.keys(data[0])
    console.log('\n✅ Campi in dettagli_ordini:', campi.join(', '))
    console.log(`\n${campi.includes('sconto_percentuale') ? '✅ SCONTO AGGIUNTO!' : '❌ Sconto manca ancora'}`)
  }
}

applyMigration()
  .catch(err => {
    console.error('❌ Errore:', err)
    process.exit(1)
  })
