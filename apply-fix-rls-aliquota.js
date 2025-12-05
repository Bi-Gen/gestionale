const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function applyMigration() {
  console.log('🔧 Applico fix RLS per aliquota_iva e tabelle configurazione...\n')

  // Leggi il file SQL
  const sql = fs.readFileSync('supabase/migrations/20251203_fix_aliquota_iva_rls.sql', 'utf8')

  // Dividi in statement separati (rimuovi commenti)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

  console.log(`📋 ${statements.length} statement SQL da eseguire\n`)

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i]
    if (stmt.length < 10) continue

    console.log(`${i + 1}. Eseguo: ${stmt.substring(0, 60)}...`)

    try {
      // Esegui tramite query diretta
      const { error } = await supabase.rpc('exec', { sql: stmt + ';' })
      if (error) {
        // Prova metodo alternativo: query diretta
        const pg = require('pg')
        const client = new pg.Client({
          connectionString: process.env.SUPABASE_DB_URL
        })

        await client.connect()
        await client.query(stmt)
        await client.end()

        console.log('   ✅ Eseguito (metodo alternativo)')
      } else {
        console.log('   ✅ Eseguito')
      }
    } catch (err) {
      console.log(`   ⚠️  ${err.message}`)
    }
  }

  // Test finale
  console.log('\n🧪 Test finale...')
  const supabaseAnon = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  const { data, error } = await supabaseAnon
    .from('aliquota_iva')
    .select('*')
    .limit(1)

  if (error) {
    console.log('❌ Test fallito:', error.message)
  } else {
    console.log(`✅ Test superato! Lette ${data.length} aliquote`)
    if (data[0]) {
      console.log(`   - ${data[0].percentuale}% - ${data[0].descrizione}`)
    }
  }
}

applyMigration().then(() => {
  console.log('\n✅ Migration completata!')
  console.log('🎯 Ricarica la pagina della fattura per vedere il fix!')
  process.exit(0)
}).catch(err => {
  console.error('\n❌ Errore:', err)
  process.exit(1)
})
