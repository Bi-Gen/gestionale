const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testFatturaIVA() {
  console.log('🔍 Verifica dati fattura con IVA...\n')

  // Prendi l'ultima fattura
  const { data: fatture } = await supabase
    .from('movimento')
    .select('id, numero_documento')
    .not('numero_documento', 'is', null)
    .order('id', { ascending: false })
    .limit(1)

  if (!fatture || fatture.length === 0) {
    console.log('❌ Nessuna fattura trovata')
    return
  }

  const fatturaId = fatture[0].id
  console.log(`📄 Fattura ID: ${fatturaId} - ${fatture[0].numero_documento}\n`)

  // Query dettagli CON join aliquota_iva
  const { data: dettagli, error } = await supabase
    .from('dettaglio_movimento')
    .select(`
      *,
      prodotto:prodotto_id (
        id,
        codice,
        nome,
        unita_misura
      ),
      aliquota_iva:aliquota_iva_id (
        id,
        percentuale,
        descrizione
      )
    `)
    .eq('movimento_id', fatturaId)

  if (error) {
    console.error('❌ Errore query:', error)
    return
  }

  console.log('📋 Dettagli trovati:', dettagli.length)
  console.log('\n')

  dettagli.forEach((det, i) => {
    console.log(`\n--- Riga ${i + 1} ---`)
    console.log('Prodotto:', det.prodotto?.nome || 'N/A')
    console.log('Quantità:', det.quantita)
    console.log('Prezzo unitario:', det.prezzo_unitario)
    console.log('Imponibile:', det.imponibile)
    console.log('IVA (importo):', det.iva)
    console.log('Totale:', det.totale)
    console.log('\n🔢 Campo aliquota_iva_id:', det.aliquota_iva_id)
    console.log('📊 Oggetto aliquota_iva:', det.aliquota_iva)

    if (det.aliquota_iva) {
      console.log('   ✅ ID:', det.aliquota_iva.id)
      console.log('   ✅ Percentuale:', det.aliquota_iva.percentuale)
      console.log('   ✅ Descrizione:', det.aliquota_iva.descrizione)
    } else {
      console.log('   ❌ aliquota_iva è NULL!')
    }
  })

  // Verifica anche le aliquote IVA disponibili
  console.log('\n\n📊 Aliquote IVA disponibili nel sistema:')
  const { data: aliquote } = await supabase
    .from('aliquota_iva')
    .select('*')
    .order('percentuale')

  if (aliquote) {
    aliquote.forEach(a => {
      console.log(`   - ID: ${a.id} | ${a.percentuale}% | ${a.descrizione || a.nome}`)
    })
  }
}

testFatturaIVA().then(() => {
  console.log('\n✅ Test completato')
  process.exit(0)
}).catch(err => {
  console.error('❌ Errore:', err)
  process.exit(1)
})
