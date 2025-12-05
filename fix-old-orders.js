// Script per verificare e fixare ordini vecchi senza sconto
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkOldOrders() {
  console.log('🔍 Verifica ordini esistenti...\n')

  // Recupera dettagli ordini
  const { data: dettagli, error } = await supabase
    .from('dettagli_ordini')
    .select('id, ordine_id, quantita, prezzo_unitario, sconto_percentuale, subtotale')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('❌ Errore:', error.message)
    return
  }

  console.log(`📦 Ultimi ${dettagli.length} dettagli ordini:\n`)

  dettagli.forEach(d => {
    const lordo = d.quantita * d.prezzo_unitario
    const scontoCalcolato = lordo * (d.sconto_percentuale / 100)
    const subtotaleAtteso = lordo - scontoCalcolato
    const differenza = Math.abs(d.subtotale - subtotaleAtteso)

    const icon = differenza < 0.01 ? '✅' : '⚠️'
    console.log(`${icon} Ordine ${d.ordine_id} - Dettaglio ${d.id}`)
    console.log(`   Qtà: ${d.quantita} × €${d.prezzo_unitario} = €${lordo.toFixed(2)}`)
    console.log(`   Sconto: ${d.sconto_percentuale}% (-€${scontoCalcolato.toFixed(2)})`)
    console.log(`   Subtotale DB: €${d.subtotale.toFixed(2)}`)
    console.log(`   Subtotale atteso: €${subtotaleAtteso.toFixed(2)}`)

    if (differenza >= 0.01) {
      console.log(`   ⚠️  DISCREPANZA: €${differenza.toFixed(2)}`)
      console.log(`   📝 Possibile causa: Ordine creato prima della migration sconto`)
    }
    console.log('')
  })

  // Conta quanti hanno sconto > 0
  const conSconto = dettagli.filter(d => d.sconto_percentuale > 0).length
  console.log(`\n📊 STATISTICHE:`)
  console.log(`   Totale righe: ${dettagli.length}`)
  console.log(`   Con sconto: ${conSconto}`)
  console.log(`   Senza sconto: ${dettagli.length - conSconto}`)
}

checkOldOrders()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Errore:', err)
    process.exit(1)
  })
