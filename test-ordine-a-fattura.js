/**
 * Script per convertire un ordine in fattura
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function convertiOrdineInFattura() {
  console.log('🔄 Conversione Ordine -> Fattura\n')

  try {
    // 1. Trova un ordine di vendita confermato (dalla tabella movimento)
    const { data: ordiniVendita, error: errorOrdini } = await supabase
      .from('movimento_completo')
      .select('*')
      .eq('causale_codice', 'ORD_VEN')
      .in('stato', ['confermato', 'evaso'])
      .limit(5)

    if (errorOrdini) throw errorOrdini
    if (!ordiniVendita || ordiniVendita.length === 0) {
      throw new Error('Nessun ordine vendita confermato trovato')
    }

    console.log(`📋 Trovati ${ordiniVendita.length} ordini disponibili:\n`)
    ordiniVendita.forEach((ord, i) => {
      console.log(`${i + 1}. ${ord.numero_documento} - ${ord.soggetto_nome || 'N/D'} - €${ord.totale} (${ord.stato})`)
    })

    // Prendiamo il primo
    const ordine = ordiniVendita[0]
    console.log(`\n✓ Selezionato ordine: ${ordine.numero_documento}`)

    // 2. Verifica che l'ordine non sia già stato fatturato
    const { count: countFatture } = await supabase
      .from('movimento')
      .select('*', { count: 'exact', head: true })
      .eq('documento_origine_id', ordine.id)

    if (countFatture && countFatture > 0) {
      console.log('⚠️  Questo ordine è già stato fatturato!')
      console.log('Provo con il prossimo ordine...\n')

      // Prova con il secondo ordine
      if (ordiniVendita.length < 2) {
        throw new Error('Nessun ordine non fatturato disponibile')
      }
      const ordine2 = ordiniVendita[1]
      console.log(`✓ Selezionato ordine alternativo: ${ordine2.numero_documento}`)
      return await creaFatturaDaOrdine(ordine2)
    }

    return await creaFatturaDaOrdine(ordine)

  } catch (error) {
    console.error('❌ Errore:', error.message)
    if (error.details) console.error('   Dettagli:', error.details)
    if (error.hint) console.error('   Suggerimento:', error.hint)
    process.exit(1)
  }
}

async function creaFatturaDaOrdine(ordine) {
  console.log('\n📊 Dettagli Ordine:')
  console.log('  ID:', ordine.id)
  console.log('  Numero:', ordine.numero_documento)
  console.log('  Cliente:', ordine.soggetto_nome || 'N/D')
  console.log('  Data:', ordine.data_documento)
  console.log('  Imponibile: €', parseFloat(ordine.imponibile || 0).toFixed(2))
  console.log('  IVA: €', parseFloat(ordine.iva || 0).toFixed(2))
  console.log('  Totale: €', parseFloat(ordine.totale).toFixed(2))
  console.log('  Stato:', ordine.stato)

  // 3. Ottieni causale fattura immediata
  const { data: causale } = await supabase
    .from('causale_documento')
    .select('id, codice')
    .eq('codice', 'FT_ATT')
    .single()

  if (!causale) throw new Error('Causale FT_ATT non trovata')
  console.log('\n✓ Causale fattura:', causale.codice)

  // 4. Genera numero fattura
  const anno = new Date().getFullYear()
  const { data: ultimaFattura } = await supabase
    .from('movimento')
    .select('numero_documento')
    .eq('causale_id', causale.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let progressivo = 1
  if (ultimaFattura) {
    const match = ultimaFattura.numero_documento.match(/(\d+)$/)
    if (match) {
      progressivo = parseInt(match[1]) + 1
    }
  }

  const numeroFattura = `FT_ATT-${anno}-${progressivo.toString().padStart(4, '0')}`
  console.log('✓ Numero fattura:', numeroFattura)

  // 5. Recupera dettagli ordine
  const { data: dettagliOrdine, error: errorDettagli } = await supabase
    .from('dettaglio_movimento')
    .select('*')
    .eq('movimento_id', ordine.id)

  if (errorDettagli) throw errorDettagli
  if (!dettagliOrdine || dettagliOrdine.length === 0) {
    throw new Error('Nessun dettaglio trovato per l\'ordine')
  }

  console.log(`✓ Trovati ${dettagliOrdine.length} righe ordine`)

  // 6. Crea fattura (testata)
  console.log('\n🔨 Creazione fattura...')

  const { data: fattura, error: errorFattura } = await supabase
    .from('movimento')
    .insert({
      azienda_id: ordine.azienda_id,
      causale_id: causale.id,
      numero_documento: numeroFattura,
      data_documento: new Date().toISOString().split('T')[0],
      soggetto_id: ordine.soggetto_id,
      imponibile: 0, // Verrà ricalcolato
      iva: 0,
      totale: 0,
      regime_iva: ordine.regime_iva || 'ordinario',
      split_payment: ordine.split_payment || false,
      reverse_charge: ordine.reverse_charge || false,
      metodo_pagamento_id: ordine.metodo_pagamento_id,
      magazzino_id: ordine.magazzino_id,
      documento_origine_id: ordine.id, // Collega all'ordine
      stato: 'confermato',
      note: `Generata da ordine ${ordine.numero_documento}`
    })
    .select()
    .single()

  if (errorFattura) throw errorFattura
  console.log('✓ Fattura creata, ID:', fattura.id)

  // 7. Copia dettagli ordine nella fattura
  const dettagliFattura = dettagliOrdine.map(det => ({
    movimento_id: fattura.id,
    prodotto_id: det.prodotto_id,
    descrizione: det.descrizione,
    quantita: det.quantita,
    unita_misura: det.unita_misura,
    prezzo_unitario: det.prezzo_unitario,
    sconto_percentuale: det.sconto_percentuale || 0,
    sconto_importo: det.sconto_importo || 0,
    imponibile: det.imponibile,
    aliquota_iva_id: det.aliquota_iva_id,
    iva: det.iva,
    totale: det.totale,
    note: det.note
  }))

  const { error: errorDettagliFattura } = await supabase
    .from('dettaglio_movimento')
    .insert(dettagliFattura)

  if (errorDettagliFattura) {
    // Rollback: elimina fattura
    await supabase.from('movimento').delete().eq('id', fattura.id)
    throw errorDettagliFattura
  }

  console.log(`✓ Copiate ${dettagliFattura.length} righe nella fattura`)

  // 8. Aggiorna stato ordine a "fatturato"
  await supabase
    .from('movimento')
    .update({ stato: 'fatturato' })
    .eq('id', ordine.id)

  console.log('✓ Ordine marcato come "fatturato"')

  // 9. Genera scadenze (se c'è metodo pagamento)
  if (ordine.metodo_pagamento_id) {
    console.log('\n📅 Generazione scadenze...')
    const { error: errorScadenze } = await supabase
      .rpc('genera_scadenze_da_movimento', { p_movimento_id: fattura.id })

    if (errorScadenze) {
      console.warn('⚠️  Errore generazione scadenze:', errorScadenze.message)
    } else {
      // Verifica scadenze create
      const { count: countScadenze } = await supabase
        .from('scadenza')
        .select('*', { count: 'exact', head: true })
        .eq('movimento_id', fattura.id)

      console.log(`✓ Generate ${countScadenze} scadenze`)
    }
  }

  // 10. Rileggi fattura aggiornata
  const { data: fatturaAggiornata } = await supabase
    .from('movimento_completo')
    .select('*')
    .eq('id', fattura.id)
    .single()

  console.log('\n✅ Fattura creata con successo!\n')
  console.log('📋 Riepilogo:')
  console.log('  Da Ordine:', ordine.numero_documento)
  console.log('  Fattura:', numeroFattura)
  console.log('  Cliente:', fatturaAggiornata.soggetto_nome || 'N/D')
  console.log('  Imponibile: €', parseFloat(fatturaAggiornata.imponibile).toFixed(2))
  console.log('  IVA: €', parseFloat(fatturaAggiornata.iva).toFixed(2))
  console.log('  Totale: €', parseFloat(fatturaAggiornata.totale).toFixed(2))
  console.log('  Contabilizzata:', fatturaAggiornata.contabilizzato ? 'Sì' : 'No')

  console.log('\n🌐 Link:')
  console.log('  Lista fatture: http://localhost:3000/dashboard/fatture/vendita')
  console.log('  Dettaglio: http://localhost:3000/dashboard/fatture/' + fattura.id)
  console.log('\n💡 Prova ora a contabilizzare la fattura dalla pagina dettaglio!')
}

convertiOrdineInFattura()
