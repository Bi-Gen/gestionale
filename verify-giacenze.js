// Script per verificare giacenze prodotti
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function verificaGiacenze() {
  console.log('🔍 Verifica giacenze prodotti...\n')

  // 1. Verifica struttura tabella prodotto
  const { data: prodotti, error: prodError } = await supabase
    .from('prodotto')
    .select('id, codice, nome, quantita_magazzino, costo_medio, prezzo_vendita')
    .limit(10)

  if (prodError) {
    console.error('❌ Errore lettura prodotti:', prodError.message)
    return
  }

  console.log('✅ Prodotti trovati:', prodotti.length)
  console.log('\n📦 GIACENZE:')
  prodotti.forEach(p => {
    const giacenza = p.quantita_magazzino ?? 'NULL'
    const icon = (p.quantita_magazzino > 0) ? '✅' : '⚠️'
    console.log(`${icon} ${p.codice} - ${p.nome}: ${giacenza} pz`)
  })

  // 2. Verifica movimenti magazzino
  const { data: movimenti, error: movError } = await supabase
    .from('movimento_magazzino')
    .select('id, prodotto_id, quantita, segno, causale_id, data_movimento')
    .order('created_at', { ascending: false })
    .limit(10)

  if (movError) {
    console.error('\n❌ Errore lettura movimenti:', movError.message)
  } else {
    console.log(`\n📊 Movimenti magazzino recenti: ${movimenti.length}`)
    movimenti.forEach(m => {
      const segnoStr = m.segno > 0 ? '+' : '-'
      console.log(`  ${segnoStr} Prodotto ID ${m.prodotto_id}: ${m.quantita} pz`)
    })
  }

  // 3. Check se esiste campo sconto_percentuale in dettagli_ordini
  const { data: dettagli, error: detError } = await supabase
    .from('dettagli_ordini')
    .select('*')
    .limit(1)

  if (detError) {
    console.error('\n❌ Errore lettura dettagli_ordini:', detError.message)
  } else {
    console.log('\n📋 Struttura dettagli_ordini:')
    if (dettagli.length > 0) {
      const campi = Object.keys(dettagli[0])
      console.log('  Campi:', campi.join(', '))
      console.log(`  ✅ sconto_percentuale presente: ${campi.includes('sconto_percentuale') ? 'SÌ' : 'NO'}`)
    } else {
      console.log('  ⚠️ Nessun dettaglio ordine presente')
    }
  }
}

verificaGiacenze()
  .then(() => {
    console.log('\n✅ Verifica completata')
    process.exit(0)
  })
  .catch(err => {
    console.error('\n❌ Errore:', err)
    process.exit(1)
  })
