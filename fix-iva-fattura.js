/**
 * Script per correggere l'IVA sulla fattura esistente
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixIvaFattura() {
  console.log('🔧 Correzione IVA Fattura\n')

  try {
    const fatturaId = 11

    // 1. Ottieni soggetto della fattura
    const { data: fattura } = await supabase
      .from('movimento')
      .select('soggetto_id')
      .eq('id', fatturaId)
      .single()

    const { data: soggetto } = await supabase
      .from('soggetto')
      .select('aliquota_iva, ragione_sociale')
      .eq('id', fattura.soggetto_id)
      .single()

    console.log('✓ Soggetto:', soggetto.ragione_sociale)
    console.log('✓ Aliquota IVA soggetto:', soggetto.aliquota_iva + '%')

    // 2. Trova aliquota_iva_id corrispondente
    const { data: aliquote } = await supabase
      .from('aliquota_iva')
      .select('id, percentuale, descrizione')
      .eq('percentuale', soggetto.aliquota_iva)
      .limit(1)

    const aliquota = aliquote && aliquote[0]

    if (!aliquota) {
      throw new Error(`Aliquota IVA ${soggetto.aliquota_iva}% non trovata nel database`)
    }

    console.log('✓ Aliquota trovata:', aliquota.descrizione, `(${aliquota.percentuale}%)`)

    // 3. Aggiorna dettagli fattura con aliquota corretta e ricalcola IVA
    const { data: dettagli } = await supabase
      .from('dettaglio_movimento')
      .select('*')
      .eq('movimento_id', fatturaId)

    console.log(`\n🔨 Aggiornamento ${dettagli.length} righe...`)

    for (const det of dettagli) {
      const imponibile = parseFloat(det.imponibile)
      const iva = imponibile * (aliquota.percentuale / 100)
      const totale = imponibile + iva

      const { error } = await supabase
        .from('dettaglio_movimento')
        .update({
          aliquota_iva_id: aliquota.id,
          iva: iva.toFixed(2),
          totale: totale.toFixed(2)
        })
        .eq('id', det.id)

      if (error) throw error

      console.log(`  ✓ Riga ${det.id}: €${imponibile.toFixed(2)} + IVA €${iva.toFixed(2)} = €${totale.toFixed(2)}`)
    }

    // 4. Il trigger ricalcola_totali_movimento aggiornerà automaticamente la testata
    // Ma verifichiamo
    await new Promise(resolve => setTimeout(resolve, 500))

    const { data: fatturaAggiornata } = await supabase
      .from('movimento')
      .select('imponibile, iva, totale')
      .eq('id', fatturaId)
      .single()

    console.log('\n✅ Fattura aggiornata!')
    console.log('📊 Nuovi totali:')
    console.log('  Imponibile: €', parseFloat(fatturaAggiornata.imponibile).toFixed(2))
    console.log('  IVA: €', parseFloat(fatturaAggiornata.iva).toFixed(2))
    console.log('  Totale: €', parseFloat(fatturaAggiornata.totale).toFixed(2))

    console.log('\n🌐 Ricarica la pagina: http://localhost:3000/dashboard/fatture/11')

  } catch (error) {
    console.error('❌ Errore:', error.message)
    process.exit(1)
  }
}

fixIvaFattura()
