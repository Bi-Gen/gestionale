require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

;(async () => {
  try {
    console.log('=== SWAP MAGAZZINI (FIX) ===\n')

    const aziendasrl = 'b8b6502a-ead6-428b-ad97-6246b8129443' // Test Soggetto SRL
    const aziendamario = 'fa724a7c-a551-46da-b30a-19b8ef710b8d' // Test Company (mario.rossi)

    console.log('Step 1: Elimino magazzino ID 6 (temp di Test Company)')
    const { error: deleteError } = await supabase
      .from('magazzino')
      .delete()
      .eq('id', 6)

    if (deleteError) {
      console.error('Errore eliminazione:', deleteError)
      process.exit(1)
    }
    console.log('✓ Magazzino ID 6 eliminato\n')

    console.log('Step 2: Assegno magazzino ID 1 a mario.rossi (Test Company)')
    const { error: updateError } = await supabase
      .from('magazzino')
      .update({ azienda_id: aziendamario })
      .eq('id', 1)

    if (updateError) {
      console.error('Errore update:', updateError)
      process.exit(1)
    }
    console.log('✓ Magazzino ID 1 → assegnato a Test Company (mario.rossi)\n')

    console.log('Step 3: Creo nuovo magazzino per Test Soggetto SRL')
    const { data: nuovoMag, error: insertError } = await supabase
      .from('magazzino')
      .insert([{
        azienda_id: aziendasrl,
        codice: 'MAG01',
        nome: 'Magazzino Principale',
        principale: true,
        attivo: true,
        gestione_ubicazioni: false
      }])
      .select()
      .single()

    if (insertError) {
      console.error('Errore creazione:', insertError)
      process.exit(1)
    }
    console.log(`✓ Nuovo magazzino creato per Test Soggetto SRL (ID: ${nuovoMag.id})\n`)

    // Verifica
    const { data: magazzini } = await supabase
      .from('magazzino')
      .select('id, nome, codice, azienda(nome)')
      .in('id', [1, nuovoMag.id])

    console.log('=== VERIFICA ===')
    magazzini?.forEach(m => {
      console.log(`Magazzino ID ${m.id}: ${m.nome} (${m.codice}) → ${m.azienda?.nome}`)
    })

    console.log('\n✓ SWAP COMPLETATO')
    console.log('\nRisultato:')
    console.log('  • Magazzino ID 1 → mario.rossi (Test Company) - CON TUTTI I DATI STORICI')
    console.log(`  • Magazzino ID ${nuovoMag.id} → Test Soggetto SRL (nuovo, vuoto)`)

  } catch (err) {
    console.error('Errore:', err.message)
    process.exit(1)
  }
})()
