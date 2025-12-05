require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

;(async () => {
  try {
    console.log('=== SWAP MAGAZZINI ===\n')

    const azienda1 = 'b8b6502a-ead6-428b-ad97-6246b8129443' // Test Soggetto SRL (aveva magazzino ID 1)
    const azienda2 = 'fa724a7c-a551-46da-b30a-19b8ef710b8d' // Test Company (mario.rossi, aveva magazzino ID 6)

    console.log('Prima dello swap:')
    console.log(`  Magazzino ID 1 → Azienda ${azienda1} (Test Soggetto SRL)`)
    console.log(`  Magazzino ID 6 → Azienda ${azienda2} (Test Company - mario.rossi)\n`)

    // Swap: assegna magazzino ID 1 a Test Company (mario.rossi)
    const { error: error1 } = await supabase
      .from('magazzino')
      .update({ azienda_id: azienda2 })
      .eq('id', 1)

    if (error1) {
      console.error('Errore swap magazzino 1:', error1)
      process.exit(1)
    }

    console.log('✓ Magazzino ID 1 → assegnato a Test Company (mario.rossi)')

    // Swap: assegna magazzino ID 6 a Test Soggetto SRL
    const { error: error2 } = await supabase
      .from('magazzino')
      .update({ azienda_id: azienda1 })
      .eq('id', 6)

    if (error2) {
      console.error('Errore swap magazzino 6:', error2)
      process.exit(1)
    }

    console.log('✓ Magazzino ID 6 → assegnato a Test Soggetto SRL\n')

    console.log('Dopo lo swap:')
    console.log(`  Magazzino ID 1 → Azienda ${azienda2} (Test Company - mario.rossi)`)
    console.log(`  Magazzino ID 6 → Azienda ${azienda1} (Test Soggetto SRL)\n`)

    // Verifica
    const { data: mag1 } = await supabase
      .from('magazzino')
      .select('*, azienda(nome)')
      .eq('id', 1)
      .single()

    const { data: mag6 } = await supabase
      .from('magazzino')
      .select('*, azienda(nome)')
      .eq('id', 6)
      .single()

    console.log('=== VERIFICA ===')
    console.log(`Magazzino ID 1: ${mag1.nome} → ${mag1.azienda?.nome}`)
    console.log(`Magazzino ID 6: ${mag6.nome} → ${mag6.azienda?.nome}`)

    console.log('\n✓ SWAP COMPLETATO')

  } catch (err) {
    console.error('Errore:', err.message)
    process.exit(1)
  }
})()
