/**
 * Script per generare il piano conti standard per un'azienda
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function generaPianoConti() {
  console.log('📊 Generazione Piano dei Conti Standard\n')

  try {
    // Ottieni la prima azienda disponibile
    const { data: aziende, error: errorAziende } = await supabase
      .from('azienda')
      .select('id, nome')
      .limit(1)

    if (errorAziende) throw errorAziende
    if (!aziende || aziende.length === 0) {
      throw new Error('Nessuna azienda trovata nel database')
    }

    const azienda = aziende[0]
    console.log(`✓ Azienda selezionata: ${azienda.nome} (ID: ${azienda.id})`)

    // Verifica se esiste già un piano conti
    const { count: existingCount } = await supabase
      .from('piano_conti')
      .select('*', { count: 'exact', head: true })
      .eq('azienda_id', azienda.id)

    if (existingCount && existingCount > 0) {
      console.log(`\n⚠️  Piano conti già esistente (${existingCount} conti)`)
      console.log('Per rigenerare, elimina prima i conti esistenti.')
      return
    }

    console.log('\n🔨 Creazione conti...\n')

    // LIVELLO 1: MACRO CATEGORIE
    const macroCategorie = [
      { codice: '1', descrizione: 'ATTIVO PATRIMONIALE', livello: 1, tipo_conto: 'patrimoniale', natura: 'A', path: '1' },
      { codice: '2', descrizione: 'PASSIVO PATRIMONIALE', livello: 1, tipo_conto: 'patrimoniale', natura: 'P', path: '2' },
      { codice: '3', descrizione: 'COSTI', livello: 1, tipo_conto: 'economico', natura: 'C', path: '3' },
      { codice: '4', descrizione: 'RICAVI', livello: 1, tipo_conto: 'economico', natura: 'R', path: '4' },
      { codice: '5', descrizione: 'CONTI D\'ORDINE', livello: 1, tipo_conto: 'patrimoniale', natura: 'O', path: '5' }
    ]

    const contiInseriti = []

    console.log('📁 Livello 1 - Macro Categorie:')
    for (const macro of macroCategorie) {
      const { data, error } = await supabase
        .from('piano_conti')
        .insert({
          azienda_id: azienda.id,
          ...macro,
          modificabile: false
        })
        .select()
        .single()

      if (error) throw error
      contiInseriti.push(data)
      console.log(`  ✓ ${data.codice} - ${data.descrizione}`)
    }

    // Ottieni ID delle macro categorie
    const idAttivo = contiInseriti.find(c => c.codice === '1')?.id
    const idPassivo = contiInseriti.find(c => c.codice === '2')?.id
    const idCosti = contiInseriti.find(c => c.codice === '3')?.id
    const idRicavi = contiInseriti.find(c => c.codice === '4')?.id

    // LIVELLO 2: CATEGORIE PRINCIPALI
    const categorie = [
      { codice: '1.01', descrizione: 'Immobilizzazioni', livello: 2, parent_id: idAttivo, tipo_conto: 'patrimoniale', natura: 'A', path: '1.01' },
      { codice: '1.02', descrizione: 'Attivo Circolante', livello: 2, parent_id: idAttivo, tipo_conto: 'patrimoniale', natura: 'A', path: '1.02' },
      { codice: '1.03', descrizione: 'Crediti', livello: 2, parent_id: idAttivo, tipo_conto: 'patrimoniale', natura: 'A', path: '1.03' },
      { codice: '1.04', descrizione: 'Disponibilità Liquide', livello: 2, parent_id: idAttivo, tipo_conto: 'patrimoniale', natura: 'A', path: '1.04' },
      { codice: '2.01', descrizione: 'Patrimonio Netto', livello: 2, parent_id: idPassivo, tipo_conto: 'patrimoniale', natura: 'P', path: '2.01' },
      { codice: '2.02', descrizione: 'Fondi e TFR', livello: 2, parent_id: idPassivo, tipo_conto: 'patrimoniale', natura: 'P', path: '2.02' },
      { codice: '2.03', descrizione: 'Debiti', livello: 2, parent_id: idPassivo, tipo_conto: 'patrimoniale', natura: 'P', path: '2.03' },
      { codice: '3.01', descrizione: 'Costi per Acquisti', livello: 2, parent_id: idCosti, tipo_conto: 'economico', natura: 'C', path: '3.01' },
      { codice: '3.02', descrizione: 'Costi per Servizi', livello: 2, parent_id: idCosti, tipo_conto: 'economico', natura: 'C', path: '3.02' },
      { codice: '3.03', descrizione: 'Costi per il Personale', livello: 2, parent_id: idCosti, tipo_conto: 'economico', natura: 'C', path: '3.03' },
      { codice: '3.04', descrizione: 'Ammortamenti e Svalutazioni', livello: 2, parent_id: idCosti, tipo_conto: 'economico', natura: 'C', path: '3.04' },
      { codice: '4.01', descrizione: 'Ricavi da Vendite', livello: 2, parent_id: idRicavi, tipo_conto: 'economico', natura: 'R', path: '4.01' },
      { codice: '4.02', descrizione: 'Altri Ricavi', livello: 2, parent_id: idRicavi, tipo_conto: 'economico', natura: 'R', path: '4.02' }
    ]

    console.log('\n📂 Livello 2 - Categorie:')
    for (const cat of categorie) {
      const { data, error } = await supabase
        .from('piano_conti')
        .insert({
          azienda_id: azienda.id,
          ...cat,
          modificabile: false
        })
        .select()
        .single()

      if (error) throw error
      contiInseriti.push(data)
      console.log(`  ✓ ${data.codice} - ${data.descrizione}`)
    }

    // Ottieni ID delle categorie
    const idCrediti = contiInseriti.find(c => c.codice === '1.03')?.id
    const idDisponibilitaLiquide = contiInseriti.find(c => c.codice === '1.04')?.id
    const idDebiti = contiInseriti.find(c => c.codice === '2.03')?.id
    const idCostiAcquisti = contiInseriti.find(c => c.codice === '3.01')?.id
    const idCostiServizi = contiInseriti.find(c => c.codice === '3.02')?.id
    const idRicaviVendite = contiInseriti.find(c => c.codice === '4.01')?.id

    // LIVELLO 3: CONTI OPERATIVI
    const contiOperativi = [
      { codice: '1.03.010', descrizione: 'Crediti verso Clienti', livello: 3, parent_id: idCrediti, tipo_conto: 'patrimoniale', natura: 'A', path: '1.03.010', conto_cliente: true },
      { codice: '1.03.020', descrizione: 'Crediti verso Altri', livello: 3, parent_id: idCrediti, tipo_conto: 'patrimoniale', natura: 'A', path: '1.03.020' },
      { codice: '1.03.030', descrizione: 'IVA a Credito', livello: 3, parent_id: idCrediti, tipo_conto: 'patrimoniale', natura: 'A', path: '1.03.030' },
      { codice: '1.04.010', descrizione: 'Banca c/c', livello: 3, parent_id: idDisponibilitaLiquide, tipo_conto: 'patrimoniale', natura: 'A', path: '1.04.010', conto_banca: true },
      { codice: '1.04.020', descrizione: 'Cassa', livello: 3, parent_id: idDisponibilitaLiquide, tipo_conto: 'patrimoniale', natura: 'A', path: '1.04.020', conto_cassa: true },
      { codice: '2.03.010', descrizione: 'Debiti verso Fornitori', livello: 3, parent_id: idDebiti, tipo_conto: 'patrimoniale', natura: 'P', path: '2.03.010', conto_fornitore: true },
      { codice: '2.03.020', descrizione: 'IVA a Debito', livello: 3, parent_id: idDebiti, tipo_conto: 'patrimoniale', natura: 'P', path: '2.03.020' },
      { codice: '2.03.030', descrizione: 'Debiti verso Banche', livello: 3, parent_id: idDebiti, tipo_conto: 'patrimoniale', natura: 'P', path: '2.03.030' },
      { codice: '3.01.001', descrizione: 'Costi per Acquisto Merci', livello: 3, parent_id: idCostiAcquisti, tipo_conto: 'economico', natura: 'C', path: '3.01.001' },
      { codice: '3.02.001', descrizione: 'Costi per Servizi Vari', livello: 3, parent_id: idCostiServizi, tipo_conto: 'economico', natura: 'C', path: '3.02.001' },
      { codice: '4.01.001', descrizione: 'Ricavi da Vendita Merci', livello: 3, parent_id: idRicaviVendite, tipo_conto: 'economico', natura: 'R', path: '4.01.001' }
    ]

    console.log('\n📄 Livello 3 - Conti Operativi:')
    for (const conto of contiOperativi) {
      const { data, error } = await supabase
        .from('piano_conti')
        .insert({
          azienda_id: azienda.id,
          ...conto,
          modificabile: true
        })
        .select()
        .single()

      if (error) throw error
      const flags = []
      if (conto.conto_cliente) flags.push('👤 Cliente')
      if (conto.conto_fornitore) flags.push('🏭 Fornitore')
      if (conto.conto_banca) flags.push('🏦 Banca')
      if (conto.conto_cassa) flags.push('💰 Cassa')
      console.log(`  ✓ ${data.codice} - ${data.descrizione}${flags.length ? ' [' + flags.join(', ') + ']' : ''}`)
    }

    // Riepilogo finale
    const { count: totalConti } = await supabase
      .from('piano_conti')
      .select('*', { count: 'exact', head: true })
      .eq('azienda_id', azienda.id)

    console.log('\n✅ Piano dei conti creato con successo!')
    console.log(`\n📊 Riepilogo:`)
    console.log(`   - Totale conti: ${totalConti}`)
    console.log(`   - Macro categorie: ${macroCategorie.length}`)
    console.log(`   - Categorie: ${categorie.length}`)
    console.log(`   - Conti operativi: ${contiOperativi.length}`)
    console.log(`\n💡 Il piano conti è ora pronto per la contabilizzazione automatica`)

  } catch (error) {
    console.error('❌ Errore:', error.message)
    if (error.details) console.error('   Dettagli:', error.details)
    if (error.hint) console.error('   Suggerimento:', error.hint)
    process.exit(1)
  }
}

generaPianoConti()
