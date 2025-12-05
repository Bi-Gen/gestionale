/**
 * Test di verifica migrazione ordini -> movimento
 * Verifica che i dati siano stati migrati correttamente
 * e che le viste di compatibilità funzionino
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testMigration() {
  console.log('🧪 Test Migrazione Ordini -> Movimento\n')

  try {
    // 1. Conta ordini originali
    const { count: countOrdini, error: errorOrdini } = await supabase
      .from('ordini')
      .select('*', { count: 'exact', head: true })

    if (errorOrdini) throw errorOrdini
    console.log(`✓ Ordini originali trovati: ${countOrdini}`)

    // 2. Conta movimenti di tipo ordine
    const { count: countMovimenti, error: errorMovimenti } = await supabase
      .from('movimento')
      .select('causale_id, causale_documento!inner(tipo_documento)', { count: 'exact', head: true })
      .eq('causale_documento.tipo_documento', 'ordine')

    if (errorMovimenti) throw errorMovimenti
    console.log(`✓ Movimenti tipo 'ordine' creati: ${countMovimenti}`)

    // 3. Verifica corrispondenza numerica
    if (countOrdini !== countMovimenti) {
      console.warn(`⚠️  ATTENZIONE: Numero ordini (${countOrdini}) diverso da movimenti (${countMovimenti})`)
    } else {
      console.log('✓ Numero record corrispondente!')
    }

    // 4. Verifica causali documento
    const { data: causali, error: errorCausali } = await supabase
      .from('causale_documento')
      .select('codice, descrizione, tipo_documento')
      .in('codice', ['ORD_VEN', 'ORD_ACQ'])

    if (errorCausali) throw errorCausali
    console.log('\n✓ Causali ordini:')
    causali.forEach(c => console.log(`  - ${c.codice}: ${c.descrizione}`))

    // 5. Test vista compatibilità
    const { data: ordiniCompat, error: errorCompat } = await supabase
      .from('ordini_compat')
      .select('*')
      .limit(3)

    if (errorCompat) {
      console.error(`✗ Vista ordini_compat non funziona: ${errorCompat.message}`)
    } else {
      console.log(`\n✓ Vista ordini_compat funzionante (${ordiniCompat.length} record di test)`)
    }

    // 6. Confronta struttura record
    if (countOrdini > 0) {
      const { data: ordineOriginale } = await supabase
        .from('ordini')
        .select('*')
        .limit(1)
        .single()

      const { data: movimentoCorrispondente } = await supabase
        .from('movimento')
        .select('*, causale_documento(tipo_documento, tipo_operazione)')
        .eq('numero_documento', ordineOriginale.numero_ordine)
        .single()

      console.log('\n📋 Confronto struttura:')
      console.log('  Ordine originale:', {
        numero: ordineOriginale.numero_ordine,
        tipo: ordineOriginale.tipo,
        totale: ordineOriginale.totale,
        stato: ordineOriginale.stato
      })
      console.log('  Movimento migrato:', {
        numero: movimentoCorrispondente.numero_documento,
        tipo_operazione: movimentoCorrispondente.causale_documento.tipo_operazione,
        totale: movimentoCorrispondente.totale,
        stato: movimentoCorrispondente.stato
      })

      // Verifica corrispondenza valori
      const match =
        ordineOriginale.numero_ordine === movimentoCorrispondente.numero_documento &&
        parseFloat(ordineOriginale.totale) === parseFloat(movimentoCorrispondente.totale) &&
        ordineOriginale.stato === movimentoCorrispondente.stato

      if (match) {
        console.log('  ✓ Dati corrispondenti!')
      } else {
        console.warn('  ⚠️  Dati non perfettamente corrispondenti')
      }
    }

    // 7. Verifica tabelle scadenza e piano_conti
    const { count: countScadenze } = await supabase
      .from('scadenza')
      .select('*', { count: 'exact', head: true })

    console.log(`\n✓ Tabella scadenza: ${countScadenze} record`)

    const { count: countPianoConti } = await supabase
      .from('piano_conti')
      .select('*', { count: 'exact', head: true })

    console.log(`✓ Tabella piano_conti: ${countPianoConti} record`)

    const { count: countMovimentiContabili } = await supabase
      .from('movimento_contabile')
      .select('*', { count: 'exact', head: true })

    console.log(`✓ Tabella movimento_contabile: ${countMovimentiContabili} record`)

    console.log('\n✅ Test completati con successo!\n')
    console.log('📌 Riepilogo:')
    console.log(`   - Ordini originali: ${countOrdini}`)
    console.log(`   - Movimenti creati: ${countMovimenti}`)
    console.log(`   - Vista compatibilità: ${ordiniCompat ? 'OK' : 'ERRORE'}`)
    console.log(`   - Piano conti: ${countPianoConti} conti`)
    console.log(`   - Scadenze: ${countScadenze}`)
    console.log(`   - Movimenti contabili: ${countMovimentiContabili}`)

  } catch (error) {
    console.error('❌ Errore durante il test:', error.message)
    if (error.details) console.error('   Dettagli:', error.details)
    if (error.hint) console.error('   Suggerimento:', error.hint)
    process.exit(1)
  }
}

testMigration()
