'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Interfacce TypeScript per le fatture
 */
export interface DettaglioFattura {
  prodotto_id: number
  descrizione?: string
  quantita: number
  unita_misura?: string
  prezzo_unitario: number
  sconto_percentuale?: number
  sconto_importo?: number
  imponibile: number
  aliquota_iva_id: number
  iva: number
  totale: number
  note?: string
}

export interface DatiFattura {
  // Identificazione
  causale_id: number
  numero_documento: string
  data_documento: string
  data_scadenza?: string

  // Soggetto
  soggetto_id: number

  // Importi (calcolati automaticamente dai dettagli)
  imponibile: number
  iva: number
  totale: number

  // IVA e regime
  regime_iva?: string
  split_payment?: boolean
  reverse_charge?: boolean

  // Pagamento
  metodo_pagamento_id?: number

  // Collegamenti
  magazzino_id?: number
  documento_origine_id?: number // ID ordine di origine

  // Note
  note?: string
  riferimento_esterno?: string

  // Dettagli (righe fattura)
  dettagli: DettaglioFattura[]
}

/**
 * Ottiene la lista delle fatture
 */
export async function getFatture(filters?: {
  tipo?: 'vendita' | 'acquisto'
  dataInizio?: string
  dataFine?: string
  soggetto_id?: number
  stato?: string
}) {
  const supabase = await createClient()

  try {
    let query = supabase
      .from('movimento_completo')
      .select('*')
      .in('tipo_documento', ['fattura', 'nota_credito'])
      .order('data_documento', { ascending: false })
      .order('numero_documento', { ascending: false })

    if (filters?.tipo) {
      query = query.eq('tipo_operazione', filters.tipo)
    }

    if (filters?.dataInizio) {
      query = query.gte('data_documento', filters.dataInizio)
    }

    if (filters?.dataFine) {
      query = query.lte('data_documento', filters.dataFine)
    }

    if (filters?.soggetto_id) {
      query = query.eq('soggetto_id', filters.soggetto_id)
    }

    if (filters?.stato) {
      query = query.eq('stato', filters.stato)
    }

    const { data, error } = await query

    if (error) throw error

    return {
      success: true,
      data: data || []
    }
  } catch (error: any) {
    console.error('Errore recupero fatture:', error)
    return {
      success: false,
      error: error.message,
      data: []
    }
  }
}

/**
 * Ottiene una fattura per ID con tutti i dettagli
 */
export async function getFatturaById(id: number) {
  const supabase = await createClient()

  try {
    // Fattura principale
    const { data: fattura, error: errorFattura } = await supabase
      .from('movimento_completo')
      .select('*')
      .eq('id', id)
      .single()

    if (errorFattura) throw errorFattura

    // Dettagli fattura
    const { data: dettagli, error: errorDettagli } = await supabase
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
      .eq('movimento_id', id)
      .order('id')

    if (errorDettagli) throw errorDettagli

    return {
      success: true,
      data: {
        ...fattura,
        dettagli: dettagli || []
      }
    }
  } catch (error: any) {
    console.error('Errore recupero fattura:', error)
    return {
      success: false,
      error: error.message,
      data: null
    }
  }
}

/**
 * Crea una nuova fattura
 */
export async function creaFattura(dati: DatiFattura) {
  const supabase = await createClient()

  try {
    // Ottieni utente corrente
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Utente non autenticato')

    // Inserisci movimento (testata fattura)
    const { data: fattura, error: errorFattura } = await supabase
      .from('movimento')
      .insert({
        causale_id: dati.causale_id,
        numero_documento: dati.numero_documento,
        data_documento: dati.data_documento,
        data_scadenza: dati.data_scadenza,
        soggetto_id: dati.soggetto_id,
        imponibile: 0, // Verrà calcolato dai trigger
        iva: 0,
        totale: 0,
        regime_iva: dati.regime_iva || 'ordinario',
        split_payment: dati.split_payment || false,
        reverse_charge: dati.reverse_charge || false,
        metodo_pagamento_id: dati.metodo_pagamento_id,
        magazzino_id: dati.magazzino_id,
        documento_origine_id: dati.documento_origine_id,
        stato: 'confermato', // Le fatture sono sempre confermate
        note: dati.note,
        riferimento_esterno: dati.riferimento_esterno,
        created_by: user.id
      })
      .select()
      .single()

    if (errorFattura) throw errorFattura

    // Inserisci dettagli (righe fattura)
    const dettagliDaInserire = dati.dettagli.map(det => ({
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

    const { error: errorDettagli } = await supabase
      .from('dettaglio_movimento')
      .insert(dettagliDaInserire)

    if (errorDettagli) {
      // Rollback: elimina la fattura creata
      await supabase.from('movimento').delete().eq('id', fattura.id)
      throw errorDettagli
    }

    // Genera scadenze di pagamento (se metodo pagamento specificato)
    if (dati.metodo_pagamento_id) {
      const { error: errorScadenze } = await supabase
        .rpc('genera_scadenze_da_movimento', { p_movimento_id: fattura.id })

      if (errorScadenze) {
        console.warn('Errore generazione scadenze:', errorScadenze)
      }
    }

    revalidatePath('/dashboard/fatture')

    return {
      success: true,
      data: fattura,
      message: `Fattura ${fattura.numero_documento} creata con successo`
    }

  } catch (error: any) {
    console.error('Errore creazione fattura:', error)
    return {
      success: false,
      error: error.message || 'Errore durante la creazione della fattura',
      data: null
    }
  }
}

/**
 * Genera una fattura da un ordine esistente
 */
export async function generaFatturaDaOrdine(
  ordineId: number,
  datiAggiuntivi: {
    causale_id: number
    numero_documento: string
    data_documento: string
    metodo_pagamento_id?: number
    note?: string
  }
) {
  const supabase = await createClient()

  try {
    // Recupera ordine con dettagli
    const { data: ordine, error: errorOrdine } = await supabase
      .from('movimento')
      .select(`
        *,
        dettagli:dettaglio_movimento(*)
      `)
      .eq('id', ordineId)
      .single()

    if (errorOrdine) throw errorOrdine
    if (!ordine) throw new Error('Ordine non trovato')

    // Verifica che sia un ordine
    const { data: causaleOrdine } = await supabase
      .from('causale_documento')
      .select('tipo_documento')
      .eq('id', ordine.causale_id)
      .single()

    if (causaleOrdine?.tipo_documento !== 'ordine') {
      throw new Error('Il documento selezionato non è un ordine')
    }

    // Verifica che l'ordine non sia già stato fatturato
    const { count } = await supabase
      .from('movimento')
      .select('*', { count: 'exact', head: true })
      .eq('documento_origine_id', ordineId)
      .in('causale_id', await getCausaliIdFattura())

    if (count && count > 0) {
      throw new Error('L\'ordine è già stato fatturato')
    }

    // Prepara dati fattura dall'ordine
    const datiFattura: DatiFattura = {
      causale_id: datiAggiuntivi.causale_id,
      numero_documento: datiAggiuntivi.numero_documento,
      data_documento: datiAggiuntivi.data_documento,
      soggetto_id: ordine.soggetto_id,
      imponibile: ordine.imponibile,
      iva: ordine.iva,
      totale: ordine.totale,
      regime_iva: ordine.regime_iva,
      split_payment: ordine.split_payment,
      reverse_charge: ordine.reverse_charge,
      metodo_pagamento_id: datiAggiuntivi.metodo_pagamento_id || ordine.metodo_pagamento_id,
      magazzino_id: ordine.magazzino_id,
      documento_origine_id: ordineId, // Collega alla fattura
      note: datiAggiuntivi.note || ordine.note,
      dettagli: ordine.dettagli.map((det: any) => ({
        prodotto_id: det.prodotto_id,
        descrizione: det.descrizione,
        quantita: det.quantita,
        unita_misura: det.unita_misura,
        prezzo_unitario: det.prezzo_unitario,
        sconto_percentuale: det.sconto_percentuale,
        sconto_importo: det.sconto_importo,
        imponibile: det.imponibile,
        aliquota_iva_id: det.aliquota_iva_id,
        iva: det.iva,
        totale: det.totale,
        note: det.note
      }))
    }

    // Crea la fattura
    const result = await creaFattura(datiFattura)

    if (result.success) {
      // Aggiorna stato ordine a "fatturato"
      await supabase
        .from('movimento')
        .update({ stato: 'fatturato' })
        .eq('id', ordineId)
    }

    return result

  } catch (error: any) {
    console.error('Errore generazione fattura da ordine:', error)
    return {
      success: false,
      error: error.message || 'Errore durante la generazione della fattura',
      data: null
    }
  }
}

/**
 * Contabilizza una fattura (genera movimenti contabili in partita doppia)
 */
export async function contabilizzaFattura(fatturaId: number) {
  const supabase = await createClient()

  try {
    // Verifica che la fattura esista e non sia già contabilizzata
    const { data: fattura, error: errorFattura } = await supabase
      .from('movimento')
      .select('id, contabilizzato, numero_documento')
      .eq('id', fatturaId)
      .single()

    if (errorFattura) throw errorFattura
    if (!fattura) throw new Error('Fattura non trovata')

    if (fattura.contabilizzato) {
      return {
        success: false,
        error: 'La fattura è già stata contabilizzata'
      }
    }

    // Chiama la funzione SQL di contabilizzazione
    const { error: errorContabilizzazione } = await supabase
      .rpc('contabilizza_movimento_fattura', { p_movimento_id: fatturaId })

    if (errorContabilizzazione) throw errorContabilizzazione

    revalidatePath('/dashboard/fatture')
    revalidatePath('/dashboard/contabilita/prima-nota')

    return {
      success: true,
      message: `Fattura ${fattura.numero_documento} contabilizzata con successo`
    }

  } catch (error: any) {
    console.error('Errore contabilizzazione fattura:', error)
    return {
      success: false,
      error: error.message || 'Errore durante la contabilizzazione'
    }
  }
}

/**
 * Elimina una fattura (solo se non contabilizzata)
 */
export async function eliminaFattura(id: number) {
  const supabase = await createClient()

  try {
    // Verifica che non sia contabilizzata
    const { data: fattura } = await supabase
      .from('movimento')
      .select('contabilizzato, numero_documento')
      .eq('id', id)
      .single()

    if (fattura?.contabilizzato) {
      throw new Error('Impossibile eliminare una fattura già contabilizzata')
    }

    // Elimina fattura (i dettagli vengono eliminati in cascata)
    const { error } = await supabase
      .from('movimento')
      .delete()
      .eq('id', id)

    if (error) throw error

    revalidatePath('/dashboard/fatture')

    return {
      success: true,
      message: `Fattura ${fattura?.numero_documento} eliminata con successo`
    }

  } catch (error: any) {
    console.error('Errore eliminazione fattura:', error)
    return {
      success: false,
      error: error.message || 'Errore durante l\'eliminazione'
    }
  }
}

/**
 * Ottiene gli ordini disponibili per fatturazione
 */
export async function getOrdiniDaFatturare(tipo: 'vendita' | 'acquisto') {
  const supabase = await createClient()

  try {
    const codiceCausale = tipo === 'vendita' ? 'ORD_VEN' : 'ORD_ACQ'

    const { data, error } = await supabase
      .from('movimento_completo')
      .select('*')
      .eq('causale_codice', codiceCausale)
      .in('stato', ['confermato', 'evaso'])
      .order('data_documento', { ascending: false })

    if (error) throw error

    // Filtra gli ordini già fatturati
    const ordiniFiltrati = []
    for (const ordine of data || []) {
      const { count } = await supabase
        .from('movimento')
        .select('*', { count: 'exact', head: true })
        .eq('documento_origine_id', ordine.id)

      if (!count || count === 0) {
        ordiniFiltrati.push(ordine)
      }
    }

    return {
      success: true,
      data: ordiniFiltrati
    }

  } catch (error: any) {
    console.error('Errore recupero ordini da fatturare:', error)
    return {
      success: false,
      error: error.message,
      data: []
    }
  }
}

/**
 * Genera il prossimo numero di fattura
 */
export async function getNextNumeroFattura(causaleId: number, anno?: number) {
  const supabase = await createClient()

  try {
    const annoCorrente = anno || new Date().getFullYear()

    const { data, error } = await supabase
      .from('movimento')
      .select('numero_documento')
      .eq('causale_id', causaleId)
      .gte('data_documento', `${annoCorrente}-01-01`)
      .lte('data_documento', `${annoCorrente}-12-31`)
      .order('numero_documento', { ascending: false })
      .limit(1)

    if (error) throw error

    let prossimoNumero = 1

    if (data && data.length > 0) {
      // Estrai il numero dall'ultimo documento
      const ultimoNumero = data[0].numero_documento
      const match = ultimoNumero.match(/(\d+)$/)
      if (match) {
        prossimoNumero = parseInt(match[1]) + 1
      }
    }

    // Ottieni prefisso dalla causale
    const { data: causale } = await supabase
      .from('causale_documento')
      .select('codice')
      .eq('id', causaleId)
      .single()

    const prefisso = causale?.codice || 'FT'
    const numeroFormattato = `${prefisso}-${annoCorrente}-${prossimoNumero.toString().padStart(4, '0')}`

    return {
      success: true,
      numero: numeroFormattato,
      progressivo: prossimoNumero
    }

  } catch (error: any) {
    console.error('Errore generazione numero fattura:', error)
    return {
      success: false,
      error: error.message,
      numero: null
    }
  }
}

/**
 * Helper: Ottiene gli ID delle causali fattura
 */
async function getCausaliIdFattura(): Promise<number[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('causale_documento')
    .select('id')
    .eq('tipo_documento', 'fattura')

  return data?.map(c => c.id) || []
}
