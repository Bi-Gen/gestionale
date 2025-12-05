'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Genera il Piano dei Conti standard italiano per un'azienda
 * Include i conti necessari per la contabilizzazione automatica
 */
export async function generaPianoContiStandard(aziendaId?: string) {
  const supabase = await createClient()

  try {
    // Se aziendaId non è fornito, usa quello dell'utente corrente
    if (!aziendaId) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Utente non autenticato')

      const { data: userAzienda } = await supabase
        .from('utenti_aziende')
        .select('azienda_id')
        .eq('user_id', user.id)
        .single()

      if (!userAzienda) throw new Error('Azienda non trovata per l\'utente')
      aziendaId = userAzienda.azienda_id
    }

    // Verifica se il piano conti esiste già
    const { count } = await supabase
      .from('piano_conti')
      .select('*', { count: 'exact', head: true })
      .eq('azienda_id', aziendaId)

    if (count && count > 0) {
      return {
        success: false,
        error: 'Piano dei conti già esistente per questa azienda'
      }
    }

    // LIVELLO 1: MACRO CATEGORIE
    const macroCategorie = [
      { codice: '1', descrizione: 'ATTIVO PATRIMONIALE', livello: 1, tipo_conto: 'patrimoniale', natura: 'A', path: '1' },
      { codice: '2', descrizione: 'PASSIVO PATRIMONIALE', livello: 1, tipo_conto: 'patrimoniale', natura: 'P', path: '2' },
      { codice: '3', descrizione: 'COSTI', livello: 1, tipo_conto: 'economico', natura: 'C', path: '3' },
      { codice: '4', descrizione: 'RICAVI', livello: 1, tipo_conto: 'economico', natura: 'R', path: '4' },
      { codice: '5', descrizione: 'CONTI D\'ORDINE', livello: 1, tipo_conto: 'patrimoniale', natura: 'O', path: '5' }
    ]

    const contiInseriti = []

    // Inserisci macro categorie
    for (const macro of macroCategorie) {
      const { data, error } = await supabase
        .from('piano_conti')
        .insert({
          azienda_id: aziendaId,
          ...macro,
          modificabile: false
        })
        .select()
        .single()

      if (error) throw error
      contiInseriti.push(data)
    }

    // Ottieni ID delle macro categorie
    const idAttivo = contiInseriti.find(c => c.codice === '1')?.id
    const idPassivo = contiInseriti.find(c => c.codice === '2')?.id
    const idCosti = contiInseriti.find(c => c.codice === '3')?.id
    const idRicavi = contiInseriti.find(c => c.codice === '4')?.id

    // LIVELLO 2: CATEGORIE PRINCIPALI
    const categorie = [
      // ATTIVO
      { codice: '1.01', descrizione: 'Immobilizzazioni', livello: 2, parent_id: idAttivo, tipo_conto: 'patrimoniale', natura: 'A', path: '1.01' },
      { codice: '1.02', descrizione: 'Attivo Circolante', livello: 2, parent_id: idAttivo, tipo_conto: 'patrimoniale', natura: 'A', path: '1.02' },
      { codice: '1.03', descrizione: 'Crediti', livello: 2, parent_id: idAttivo, tipo_conto: 'patrimoniale', natura: 'A', path: '1.03' },
      { codice: '1.04', descrizione: 'Disponibilità Liquide', livello: 2, parent_id: idAttivo, tipo_conto: 'patrimoniale', natura: 'A', path: '1.04' },

      // PASSIVO
      { codice: '2.01', descrizione: 'Patrimonio Netto', livello: 2, parent_id: idPassivo, tipo_conto: 'patrimoniale', natura: 'P', path: '2.01' },
      { codice: '2.02', descrizione: 'Fondi e TFR', livello: 2, parent_id: idPassivo, tipo_conto: 'patrimoniale', natura: 'P', path: '2.02' },
      { codice: '2.03', descrizione: 'Debiti', livello: 2, parent_id: idPassivo, tipo_conto: 'patrimoniale', natura: 'P', path: '2.03' },

      // COSTI
      { codice: '3.01', descrizione: 'Costi per Acquisti', livello: 2, parent_id: idCosti, tipo_conto: 'economico', natura: 'C', path: '3.01' },
      { codice: '3.02', descrizione: 'Costi per Servizi', livello: 2, parent_id: idCosti, tipo_conto: 'economico', natura: 'C', path: '3.02' },
      { codice: '3.03', descrizione: 'Costi per il Personale', livello: 2, parent_id: idCosti, tipo_conto: 'economico', natura: 'C', path: '3.03' },
      { codice: '3.04', descrizione: 'Ammortamenti e Svalutazioni', livello: 2, parent_id: idCosti, tipo_conto: 'economico', natura: 'C', path: '3.04' },

      // RICAVI
      { codice: '4.01', descrizione: 'Ricavi da Vendite', livello: 2, parent_id: idRicavi, tipo_conto: 'economico', natura: 'R', path: '4.01' },
      { codice: '4.02', descrizione: 'Altri Ricavi', livello: 2, parent_id: idRicavi, tipo_conto: 'economico', natura: 'R', path: '4.02' }
    ]

    for (const cat of categorie) {
      const { data, error } = await supabase
        .from('piano_conti')
        .insert({
          azienda_id: aziendaId,
          ...cat,
          modificabile: false
        })
        .select()
        .single()

      if (error) throw error
      contiInseriti.push(data)
    }

    // Ottieni ID delle categorie per i conti di livello 3
    const idCrediti = contiInseriti.find(c => c.codice === '1.03')?.id
    const idDisponibilitaLiquide = contiInseriti.find(c => c.codice === '1.04')?.id
    const idDebiti = contiInseriti.find(c => c.codice === '2.03')?.id
    const idCostiAcquisti = contiInseriti.find(c => c.codice === '3.01')?.id
    const idCostiServizi = contiInseriti.find(c => c.codice === '3.02')?.id
    const idRicaviVendite = contiInseriti.find(c => c.codice === '4.01')?.id

    // LIVELLO 3: CONTI OPERATIVI (conti usati dalla contabilizzazione automatica)
    const contiOperativi = [
      // CREDITI
      {
        codice: '1.03.010',
        descrizione: 'Crediti verso Clienti',
        livello: 3,
        parent_id: idCrediti,
        tipo_conto: 'patrimoniale',
        natura: 'A',
        path: '1.03.010',
        conto_cliente: true,
        codice_cee: 'CII1',
        voce_bilancio_sp: 'Crediti verso clienti'
      },
      {
        codice: '1.03.020',
        descrizione: 'Crediti verso Altri',
        livello: 3,
        parent_id: idCrediti,
        tipo_conto: 'patrimoniale',
        natura: 'A',
        path: '1.03.020'
      },
      {
        codice: '1.03.030',
        descrizione: 'IVA a Credito',
        livello: 3,
        parent_id: idCrediti,
        tipo_conto: 'patrimoniale',
        natura: 'A',
        path: '1.03.030',
        codice_cee: 'CII5ter',
        voce_bilancio_sp: 'Crediti tributari'
      },

      // DISPONIBILITÀ LIQUIDE
      {
        codice: '1.04.010',
        descrizione: 'Banca c/c',
        livello: 3,
        parent_id: idDisponibilitaLiquide,
        tipo_conto: 'patrimoniale',
        natura: 'A',
        path: '1.04.010',
        conto_banca: true,
        codice_cee: 'CIV1',
        voce_bilancio_sp: 'Depositi bancari'
      },
      {
        codice: '1.04.020',
        descrizione: 'Cassa',
        livello: 3,
        parent_id: idDisponibilitaLiquide,
        tipo_conto: 'patrimoniale',
        natura: 'A',
        path: '1.04.020',
        conto_cassa: true,
        codice_cee: 'CIV3',
        voce_bilancio_sp: 'Denaro e valori in cassa'
      },

      // DEBITI
      {
        codice: '2.03.010',
        descrizione: 'Debiti verso Fornitori',
        livello: 3,
        parent_id: idDebiti,
        tipo_conto: 'patrimoniale',
        natura: 'P',
        path: '2.03.010',
        conto_fornitore: true,
        codice_cee: 'D7',
        voce_bilancio_sp: 'Debiti verso fornitori'
      },
      {
        codice: '2.03.020',
        descrizione: 'IVA a Debito',
        livello: 3,
        parent_id: idDebiti,
        tipo_conto: 'patrimoniale',
        natura: 'P',
        path: '2.03.020',
        codice_cee: 'D12',
        voce_bilancio_sp: 'Debiti tributari'
      },
      {
        codice: '2.03.030',
        descrizione: 'Debiti verso Banche',
        livello: 3,
        parent_id: idDebiti,
        tipo_conto: 'patrimoniale',
        natura: 'P',
        path: '2.03.030',
        codice_cee: 'D4',
        voce_bilancio_sp: 'Debiti verso banche'
      },

      // COSTI
      {
        codice: '3.01.001',
        descrizione: 'Costi per Acquisto Merci',
        livello: 3,
        parent_id: idCostiAcquisti,
        tipo_conto: 'economico',
        natura: 'C',
        path: '3.01.001',
        codice_cee: 'B6',
        voce_bilancio_ce: 'Costi per materie prime, sussidiarie e di consumo'
      },
      {
        codice: '3.02.001',
        descrizione: 'Costi per Servizi Vari',
        livello: 3,
        parent_id: idCostiServizi,
        tipo_conto: 'economico',
        natura: 'C',
        path: '3.02.001',
        codice_cee: 'B7',
        voce_bilancio_ce: 'Costi per servizi'
      },

      // RICAVI
      {
        codice: '4.01.001',
        descrizione: 'Ricavi da Vendita Merci',
        livello: 3,
        parent_id: idRicaviVendite,
        tipo_conto: 'economico',
        natura: 'R',
        path: '4.01.001',
        codice_cee: 'A1',
        voce_bilancio_ce: 'Ricavi delle vendite e delle prestazioni'
      }
    ]

    for (const conto of contiOperativi) {
      const { error } = await supabase
        .from('piano_conti')
        .insert({
          azienda_id: aziendaId,
          ...conto,
          modificabile: true // I conti operativi possono essere modificati
        })

      if (error) throw error
    }

    revalidatePath('/dashboard/contabilita')

    return {
      success: true,
      message: `Piano dei conti standard creato con successo (${macroCategorie.length + categorie.length + contiOperativi.length} conti)`
    }

  } catch (error: any) {
    console.error('Errore generazione piano conti:', error)
    return {
      success: false,
      error: error.message || 'Errore durante la generazione del piano dei conti'
    }
  }
}

/**
 * Ottiene il piano conti gerarchico per l'azienda corrente
 */
export async function getPianoConti() {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('piano_conti')
      .select('*')
      .eq('attivo', true)
      .order('path')

    if (error) throw error

    return {
      success: true,
      data: data || []
    }
  } catch (error: any) {
    console.error('Errore recupero piano conti:', error)
    return {
      success: false,
      error: error.message,
      data: []
    }
  }
}

/**
 * Ottiene la prima nota (movimenti contabili)
 */
export async function getPrimaNota(filters?: {
  dataInizio?: string
  dataFine?: string
  contoId?: number
  esercizio?: number
}) {
  const supabase = await createClient()

  try {
    let query = supabase
      .from('prima_nota')
      .select('*')
      .order('data_registrazione', { ascending: false })
      .order('numero_progressivo', { ascending: false })

    if (filters?.dataInizio) {
      query = query.gte('data_registrazione', filters.dataInizio)
    }

    if (filters?.dataFine) {
      query = query.lte('data_registrazione', filters.dataFine)
    }

    if (filters?.contoId) {
      query = query.eq('conto_id', filters.contoId)
    }

    if (filters?.esercizio) {
      query = query.eq('esercizio', filters.esercizio)
    }

    const { data, error } = await query

    if (error) throw error

    return {
      success: true,
      data: data || []
    }
  } catch (error: any) {
    console.error('Errore recupero prima nota:', error)
    return {
      success: false,
      error: error.message,
      data: []
    }
  }
}

/**
 * Ottiene lo scadenzario
 */
export async function getScadenzario(filters?: {
  tipo?: 'attivo' | 'passivo'
  stato?: string
  scaduti?: boolean
}) {
  const supabase = await createClient()

  try {
    let query = supabase
      .from('scadenzario')
      .select('*')
      .order('data_scadenza', { ascending: true })

    if (filters?.tipo) {
      query = query.eq('tipo', filters.tipo)
    }

    if (filters?.stato) {
      query = query.eq('stato', filters.stato)
    }

    if (filters?.scaduti) {
      query = query.lt('data_scadenza', new Date().toISOString().split('T')[0])
        .in('stato', ['da_pagare', 'parzialmente_pagato'])
    }

    const { data, error } = await query

    if (error) throw error

    return {
      success: true,
      data: data || []
    }
  } catch (error: any) {
    console.error('Errore recupero scadenzario:', error)
    return {
      success: false,
      error: error.message,
      data: []
    }
  }
}
