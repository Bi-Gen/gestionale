/**
 * Script per creare una fattura di test
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function creaFatturaTest() {
  console.log('📄 Creazione Fattura di Test\n')

  try {
    // Ottieni azienda
    const { data: azienda } = await supabase
      .from('azienda')
      .select('id')
      .limit(1)
      .single()

    if (!azienda) throw new Error('Nessuna azienda trovata')
    console.log('✓ Azienda:', azienda.id)

    // Ottieni primo soggetto (cliente o fornitore)
    const { data: cliente } = await supabase
      .from('soggetto')
      .select('id, ragione_sociale')
      .eq('azienda_id', azienda.id)
      .limit(1)
      .single()

    if (!cliente) throw new Error('Nessun soggetto trovato')
    console.log('✓ Soggetto:', cliente.ragione_sociale)

    // Ottieni causale fattura vendita
    const { data: causale } = await supabase
      .from('causale_documento')
      .select('id, codice')
      .eq('codice', 'FT_ATT')
      .single()

    if (!causale) throw new Error('Causale FT_ATT non trovata')
    console.log('✓ Causale:', causale.codice)

    // Ottieni un prodotto
    const { data: prodotto } = await supabase
      .from('prodotto')
      .select('id, codice, nome, prezzo_vendita')
      .eq('azienda_id', azienda.id)
      .limit(1)
      .single()

    if (!prodotto) throw new Error('Nessun prodotto trovato')
    console.log('✓ Prodotto:', prodotto.nome)

    // Ottieni aliquota IVA 22%
    const { data: iva } = await supabase
      .from('aliquota_iva')
      .select('id, percentuale')
      .eq('percentuale', 22)
      .limit(1)
      .single()

    if (!iva) throw new Error('Aliquota IVA 22% non trovata')
    console.log('✓ IVA:', iva.percentuale + '%')

    // Ottieni metodo pagamento
    const { data: metodoPagamento } = await supabase
      .from('metodo_pagamento')
      .select('id, nome')
      .limit(1)
      .single()

    console.log('✓ Metodo pagamento:', metodoPagamento?.nome || 'Nessuno')

    // Calcola importi
    const quantita = 10
    const prezzoUnitario = parseFloat(prodotto.prezzo_vendita) || 100
    const imponibile = quantita * prezzoUnitario
    const importoIva = imponibile * (iva.percentuale / 100)
    const totale = imponibile + importoIva

    console.log('\n📊 Importi:')
    console.log('  Quantità:', quantita)
    console.log('  Prezzo unitario: €', prezzoUnitario.toFixed(2))
    console.log('  Imponibile: €', imponibile.toFixed(2))
    console.log('  IVA:', importoIva.toFixed(2))
    console.log('  Totale: €', totale.toFixed(2))

    // Genera numero fattura
    const anno = new Date().getFullYear()
    const numeroFattura = `FT_ATT-${anno}-0001`

    console.log('\n🔨 Creazione fattura:', numeroFattura)

    // Crea movimento (testata fattura)
    const { data: fattura, error: errorFattura } = await supabase
      .from('movimento')
      .insert({
        azienda_id: azienda.id,
        causale_id: causale.id,
        numero_documento: numeroFattura,
        data_documento: new Date().toISOString().split('T')[0],
        soggetto_id: cliente.id,
        imponibile: 0, // Verrà ricalcolato dal trigger
        iva: 0,
        totale: 0,
        regime_iva: 'ordinario',
        metodo_pagamento_id: metodoPagamento?.id,
        stato: 'confermato'
      })
      .select()
      .single()

    if (errorFattura) throw errorFattura
    console.log('✓ Fattura creata, ID:', fattura.id)

    // Crea dettaglio (riga fattura)
    const { error: errorDettaglio } = await supabase
      .from('dettaglio_movimento')
      .insert({
        movimento_id: fattura.id,
        prodotto_id: prodotto.id,
        descrizione: prodotto.nome,
        quantita: quantita,
        unita_misura: 'pz',
        prezzo_unitario: prezzoUnitario,
        sconto_percentuale: 0,
        sconto_importo: 0,
        imponibile: imponibile,
        aliquota_iva_id: iva.id,
        iva: importoIva,
        totale: totale
      })

    if (errorDettaglio) throw errorDettaglio
    console.log('✓ Dettaglio fattura creato')

    // Rileggi fattura aggiornata (i trigger dovrebbero aver ricalcolato i totali)
    const { data: fatturaAggiornata } = await supabase
      .from('movimento')
      .select('imponibile, iva, totale')
      .eq('id', fattura.id)
      .single()

    console.log('\n✅ Fattura di test creata con successo!')
    console.log('\n📋 Riepilogo:')
    console.log('  Numero:', numeroFattura)
    console.log('  Cliente:', cliente.ragione_sociale)
    console.log('  Imponibile: €', parseFloat(fatturaAggiornata.imponibile).toFixed(2))
    console.log('  IVA: €', parseFloat(fatturaAggiornata.iva).toFixed(2))
    console.log('  Totale: €', parseFloat(fatturaAggiornata.totale).toFixed(2))
    console.log('\n🌐 Visualizza su: http://localhost:3000/dashboard/fatture/vendita')
    console.log('   Dettaglio: http://localhost:3000/dashboard/fatture/' + fattura.id)

  } catch (error) {
    console.error('❌ Errore:', error.message)
    if (error.details) console.error('   Dettagli:', error.details)
    if (error.hint) console.error('   Suggerimento:', error.hint)
    process.exit(1)
  }
}

creaFatturaTest()
