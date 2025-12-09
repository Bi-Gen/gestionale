'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { validateOrdineFormData } from '@/lib/validations/ordini'
import {
  getUltimoCostoAcquisto,
  getStatistichePrezziProdotto,
  getGiacenzaCompleta,
  type GiacenzaCompleta
} from '@/app/actions/magazzino'

// =====================================================
// TIPI PER PREZZI CLIENTE
// =====================================================

export type PrezzoCliente = {
  prezzo: number | null
  listino_id: number | null
  listino_codice: string | null
  provvigione: number | null
  sconto_max: number | null
  fonte: 'listino_cliente' | 'listino_categoria' | 'listino_default' | 'prezzo_base'
}

// =====================================================
// TIPI PER STATISTICHE VENDITA
// =====================================================

export type StatisticheVenditaProdotto = {
  // Statistiche vendite generali
  prezzo_medio_vendita: number | null
  prezzo_min_vendita: number | null
  prezzo_max_vendita: number | null
  quantita_totale_venduta: number | null
  numero_vendite: number

  // Ultima vendita generale
  ultima_vendita_prezzo: number | null
  ultima_vendita_data: string | null
  ultima_vendita_quantita: number | null

  // Ultima vendita allo stesso cliente
  ultima_vendita_cliente_prezzo: number | null
  ultima_vendita_cliente_data: string | null
  ultima_vendita_cliente_quantita: number | null

  // Costi
  costo_ultimo: number | null
  costo_medio: number | null

  // Margini
  margine_medio_euro: number | null
  margine_medio_percentuale: number | null
  margine_ultimo_vendita_euro: number | null
  margine_ultimo_vendita_perc: number | null
}

// Tipo combinato per info complete prodotto in vendita
export type InfoProdottoVendita = {
  prezzo: PrezzoCliente | null
  statistiche: StatisticheVenditaProdotto | null
  giacenza: GiacenzaCompleta | null
}

// Re-export del tipo per uso nei componenti
export type { GiacenzaCompleta }

// =====================================================
// FUNZIONE RECUPERO PREZZO CLIENTE
// =====================================================

/**
 * Recupera il prezzo di vendita per un prodotto/cliente
 * seguendo la logica cascade:
 * 1. Listino diretto del cliente
 * 2. Listino della categoria cliente
 * 3. Listino predefinito aziendale
 * 4. Prezzo base prodotto
 */
export async function getPrezzoCliente(
  prodottoId: number,
  clienteId: number
): Promise<PrezzoCliente | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .rpc('get_prezzo_cliente', {
      p_prodotto_id: prodottoId,
      p_cliente_id: clienteId
    })

  if (error) {
    console.error('Error fetching prezzo cliente:', error)
    return null
  }

  // La funzione RPC ritorna un array (RETURNS TABLE)
  if (data && data.length > 0) {
    const row = data[0]
    return {
      prezzo: row.prezzo,
      listino_id: row.listino_id,
      listino_codice: row.listino_codice,
      provvigione: row.provvigione,
      sconto_max: row.sconto_max,
      fonte: row.fonte
    }
  }

  return null
}

/**
 * Recupera i prezzi per più prodotti in una sola chiamata
 * Utile per caricare prezzi di tutti i prodotti in un ordine
 */
export async function getPrezziClienteBulk(
  prodottiIds: number[],
  clienteId: number
): Promise<Map<number, PrezzoCliente>> {
  const results = new Map<number, PrezzoCliente>()

  // Esegui le chiamate in parallelo
  const promises = prodottiIds.map(async (prodottoId) => {
    const prezzo = await getPrezzoCliente(prodottoId, clienteId)
    if (prezzo) {
      results.set(prodottoId, prezzo)
    }
  })

  await Promise.all(promises)
  return results
}

// =====================================================
// FUNZIONE RECUPERO STATISTICHE VENDITA
// =====================================================

/**
 * Recupera statistiche storiche di vendita per un prodotto
 * Usa le stesse funzioni usate in dettaglio prodotto (magazzino.ts)
 * Include: prezzi medi, margini, ultima vendita, costi
 */
export async function getStatisticheVenditaProdotto(
  prodottoId: number,
  clienteId?: number
): Promise<StatisticheVenditaProdotto | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Usa le stesse funzioni già testate per i prodotti
  const [ultimoCosto, statistichePrezzi] = await Promise.all([
    getUltimoCostoAcquisto(prodottoId),
    getStatistichePrezziProdotto(prodottoId)
  ])

  // Query per ultima vendita a questo cliente specifico (se fornito)
  let ultimaVenditaCliente = null
  if (clienteId) {
    const { data: venditaCliente } = await supabase
      .from('movimento_magazzino')
      .select('costo_unitario, data_movimento, quantita')
      .eq('prodotto_id', prodottoId)
      .eq('soggetto_id', clienteId)
      .eq('segno', -1) // Scarico = vendita
      .like('documento_numero', 'ORD-V%')
      .not('costo_unitario', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (venditaCliente) {
      ultimaVenditaCliente = venditaCliente
    }
  }

  // Query per ultima vendita generale
  const { data: ultimaVenditaGenerale } = await supabase
    .from('movimento_magazzino')
    .select('costo_unitario, data_movimento, quantita')
    .eq('prodotto_id', prodottoId)
    .eq('segno', -1) // Scarico = vendita
    .like('documento_numero', 'ORD-V%')
    .not('costo_unitario', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  // Calcola costi
  const costoUltimo = ultimoCosto?.costo_unitario ?? null
  const costoMedio = statistichePrezzi.costo_medio_acquisti

  // Calcola prezzi vendita
  const prezzoMedioVendita = statistichePrezzi.prezzo_medio_vendite
  const totaleVendite = statistichePrezzi.totale_vendite

  // Calcola margini
  let margineMedioEuro: number | null = null
  let margineMedioPerc: number | null = null
  if (prezzoMedioVendita && costoMedio && costoMedio > 0) {
    margineMedioEuro = prezzoMedioVendita - costoMedio
    margineMedioPerc = ((prezzoMedioVendita - costoMedio) / costoMedio) * 100
  }

  let margineUltimoEuro: number | null = null
  let margineUltimoPerc: number | null = null
  if (ultimaVenditaGenerale?.costo_unitario && costoUltimo && costoUltimo > 0) {
    margineUltimoEuro = ultimaVenditaGenerale.costo_unitario - costoUltimo
    margineUltimoPerc = ((ultimaVenditaGenerale.costo_unitario - costoUltimo) / costoUltimo) * 100
  }

  return {
    // Vendite
    prezzo_medio_vendita: prezzoMedioVendita,
    prezzo_min_vendita: null, // Non disponibile dalle funzioni esistenti
    prezzo_max_vendita: null, // Non disponibile dalle funzioni esistenti
    quantita_totale_venduta: null, // Non disponibile dalle funzioni esistenti
    numero_vendite: totaleVendite,

    // Ultima vendita generale
    ultima_vendita_prezzo: ultimaVenditaGenerale?.costo_unitario ?? null,
    ultima_vendita_data: ultimaVenditaGenerale?.data_movimento ?? null,
    ultima_vendita_quantita: ultimaVenditaGenerale?.quantita ?? null,

    // Ultima vendita cliente
    ultima_vendita_cliente_prezzo: ultimaVenditaCliente?.costo_unitario ?? null,
    ultima_vendita_cliente_data: ultimaVenditaCliente?.data_movimento ?? null,
    ultima_vendita_cliente_quantita: ultimaVenditaCliente?.quantita ?? null,

    // Costi (da movimenti ORD-A%)
    costo_ultimo: costoUltimo,
    costo_medio: costoMedio,

    // Margini
    margine_medio_euro: margineMedioEuro,
    margine_medio_percentuale: margineMedioPerc ? Math.round(margineMedioPerc * 100) / 100 : null,
    margine_ultimo_vendita_euro: margineUltimoEuro,
    margine_ultimo_vendita_perc: margineUltimoPerc ? Math.round(margineUltimoPerc * 100) / 100 : null
  }
}

/**
 * Recupera tutte le info necessarie per il panel decisionale
 * in un'unica chiamata: prezzo listino + statistiche storiche + giacenza
 */
export async function getInfoProdottoVendita(
  prodottoId: number,
  clienteId: number
): Promise<InfoProdottoVendita> {
  // Esegui le chiamate in parallelo per performance
  const [prezzo, statistiche, giacenza] = await Promise.all([
    getPrezzoCliente(prodottoId, clienteId),
    getStatisticheVenditaProdotto(prodottoId, clienteId),
    getGiacenzaCompleta(prodottoId)
  ])

  return {
    prezzo,
    statistiche,
    giacenza
  }
}

// =====================================================
// TIPI ORDINE
// =====================================================

export type Ordine = {
  id: string
  numero_ordine: string
  tipo: 'vendita' | 'acquisto'
  data_ordine: string
  cliente_id?: string
  fornitore_id?: string
  magazzino_id?: number
  trasportatore_id?: number
  incoterm_id?: number
  sede_cliente_id?: number
  metodo_pagamento_id?: number
  agente_id?: number
  costo_trasporto?: number
  peso_totale_kg?: number
  data_consegna_prevista?: string
  stato: string
  totale: number
  note?: string
  created_at: string
  updated_at: string
  cliente?: {
    ragione_sociale: string
  }
  fornitore?: {
    ragione_sociale: string
  }
  magazzino?: {
    id: number
    nome: string
    codice: string
  }
  trasportatore?: {
    id: number
    ragione_sociale: string
    costo_trasporto_kg?: number
  }
  incoterm?: {
    id: number
    codice: string
    nome: string
    trasporto_a_carico: 'venditore' | 'compratore' | 'condiviso'
  }
  sede_cliente?: {
    id: number
    denominazione: string
    indirizzo?: string
    citta?: string
  }
}

export type DettaglioOrdine = {
  id: string
  ordine_id: string
  prodotto_id: string
  quantita: number
  prezzo_unitario: number
  subtotale: number
  prodotto?: {
    codice: string
    nome: string
    unita_misura?: string
  }
}

export async function getOrdini(tipo?: 'vendita' | 'acquisto'): Promise<Ordine[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let query = supabase
    .from('ordini')
    .select(`
      *,
      cliente:soggetto!cliente_id(ragione_sociale),
      fornitore:soggetto!fornitore_id(ragione_sociale),
      magazzino(id, nome, codice),
      trasportatore:soggetto!trasportatore_id(id, ragione_sociale, costo_trasporto_kg),
      incoterm(id, codice, nome, trasporto_a_carico)
    `)
    .order('data_ordine', { ascending: false })

  if (tipo) {
    query = query.eq('tipo', tipo)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching ordini:', error)
    return []
  }

  return data || []
}

export async function getOrdine(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: ordine, error: ordineError } = await supabase
    .from('ordini')
    .select(`
      *,
      cliente:soggetto!cliente_id(ragione_sociale),
      fornitore:soggetto!fornitore_id(ragione_sociale),
      magazzino(id, nome, codice),
      trasportatore:soggetto!trasportatore_id(id, ragione_sociale, costo_trasporto_kg),
      incoterm(id, codice, nome, trasporto_a_carico)
    `)
    .eq('id', id)
    .single()

  if (ordineError) {
    console.error('Error fetching ordine:', ordineError)
    return null
  }

  const { data: dettagli, error: dettagliError } = await supabase
    .from('dettagli_ordini')
    .select(`
      *,
      prodotto(codice, nome, unita_misura)
    `)
    .eq('ordine_id', id)

  if (dettagliError) {
    console.error('Error fetching dettagli:', dettagliError)
  }

  return {
    ...ordine,
    dettagli: dettagli || []
  }
}

export async function createOrdine(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const validation = validateOrdineFormData(formData)

  if (!validation.success) {
    const errors = validation.error.issues.map(err => err.message).join(', ')
    const tipoParam = formData.get('tipo') as string
    const redirectPath = tipoParam === 'acquisto'
      ? '/dashboard/ordini/acquisto/nuovo'
      : '/dashboard/ordini/vendita/nuovo'
    redirect(`${redirectPath}?error=${encodeURIComponent(errors)}`)
  }

  // Estrai i dettagli dei prodotti dalla FormData
  const dettagli: Array<{
    prodotto_id: string
    quantita: number
    prezzo_unitario: number
    sconto_percentuale: number
    aggiorna_prezzo_listino: boolean
    subtotale: number
  }> = []

  let index = 0
  while (formData.get(`dettagli[${index}][prodotto_id]`)) {
    const prodotto_id = formData.get(`dettagli[${index}][prodotto_id]`) as string
    const quantita = parseFloat(formData.get(`dettagli[${index}][quantita]`) as string)
    const prezzo_unitario = parseFloat(formData.get(`dettagli[${index}][prezzo_unitario]`) as string)
    const sconto_percentuale = parseFloat(formData.get(`dettagli[${index}][sconto_percentuale]`) as string) || 0
    const aggiorna_prezzo_listino = formData.get(`dettagli[${index}][aggiorna_prezzo_listino]`) === 'on'

    if (prodotto_id && quantita > 0 && prezzo_unitario >= 0) {
      const lordo = quantita * prezzo_unitario
      const sconto_importo = lordo * (sconto_percentuale / 100)
      const subtotale = lordo - sconto_importo

      dettagli.push({
        prodotto_id,
        quantita,
        prezzo_unitario,
        sconto_percentuale,
        aggiorna_prezzo_listino,
        subtotale
      })
    }
    index++
  }

  // Verifica che ci sia almeno un prodotto
  if (dettagli.length === 0) {
    const redirectPath = validation.data.tipo === 'acquisto'
      ? '/dashboard/ordini/acquisto/nuovo'
      : '/dashboard/ordini/vendita/nuovo'
    redirect(`${redirectPath}?error=${encodeURIComponent('Devi aggiungere almeno un prodotto')}`)
  }

  // Calcola il totale
  const totale = dettagli.reduce((sum, d) => sum + d.subtotale, 0)

  // Get azienda_id from utente_azienda
  const { data: utenteAzienda } = await supabase
    .from('utente_azienda')
    .select('azienda_id')
    .eq('user_id', user.id)
    .single()

  if (!utenteAzienda) {
    const redirectPath = validation.data.tipo === 'acquisto'
      ? '/dashboard/ordini/acquisto/nuovo'
      : '/dashboard/ordini/vendita/nuovo'
    redirect(`${redirectPath}?error=${encodeURIComponent('Nessuna azienda associata')}`)
  }

  // Get magazzino_id from form or use principale
  let magazzinoId = formData.get('magazzino_id')
    ? parseInt(formData.get('magazzino_id') as string)
    : null

  // Se non specificato, usa magazzino principale
  if (!magazzinoId) {
    const { data: magazzinoPrincipale } = await supabase
      .from('magazzino')
      .select('id')
      .eq('azienda_id', utenteAzienda.azienda_id)
      .eq('principale', true)
      .eq('attivo', true)
      .single()

    if (magazzinoPrincipale) {
      magazzinoId = magazzinoPrincipale.id
    }
  }

  // Trasportatore, incoterm e sede cliente
  const trasportatoreId = formData.get('trasportatore_id')
    ? parseInt(formData.get('trasportatore_id') as string)
    : null
  const incotermId = formData.get('incoterm_id')
    ? parseInt(formData.get('incoterm_id') as string)
    : null
  const sedeClienteId = formData.get('sede_cliente_id')
    ? parseInt(formData.get('sede_cliente_id') as string)
    : null
  const costoTrasporto = formData.get('costo_trasporto')
    ? parseFloat(formData.get('costo_trasporto') as string)
    : 0
  const pesoTotaleKg = formData.get('peso_totale_kg')
    ? parseFloat(formData.get('peso_totale_kg') as string)
    : 0

  // Nuovi campi: metodo pagamento, agente, data consegna
  const metodoPagamentoId = formData.get('metodo_pagamento_id')
    ? parseInt(formData.get('metodo_pagamento_id') as string)
    : null
  const agenteId = formData.get('agente_id')
    ? parseInt(formData.get('agente_id') as string)
    : null
  const dataConsegnaPrevista = formData.get('data_consegna_prevista') as string || null

  const ordine = {
    azienda_id: utenteAzienda.azienda_id,
    numero_ordine: validation.data.numero_ordine,
    tipo: validation.data.tipo,
    data_ordine: validation.data.data_ordine,
    cliente_id: validation.data.cliente_id || null,
    fornitore_id: validation.data.fornitore_id || null,
    magazzino_id: magazzinoId,
    trasportatore_id: trasportatoreId,
    incoterm_id: incotermId,
    sede_cliente_id: sedeClienteId,
    costo_trasporto: costoTrasporto,
    peso_totale_kg: pesoTotaleKg,
    metodo_pagamento_id: metodoPagamentoId,
    agente_id: agenteId,
    data_consegna_prevista: dataConsegnaPrevista || null,
    stato: validation.data.stato || 'bozza',
    totale,
    note: validation.data.note || null,
    created_by: user.id,
  }

  // Crea l'ordine
  const { data, error } = await supabase
    .from('ordini')
    .insert([ordine])
    .select()
    .single()

  if (error) {
    console.error('Error creating ordine:', error)
    const redirectPath = validation.data.tipo === 'acquisto'
      ? '/dashboard/ordini/acquisto/nuovo'
      : '/dashboard/ordini/vendita/nuovo'
    redirect(`${redirectPath}?error=${encodeURIComponent(error.message)}`)
  }

  // Aggiungi i dettagli all'ordine
  const dettagliConOrdineId = dettagli.map(d => ({
    ...d,
    ordine_id: data.id
  }))

  const { error: dettagliError } = await supabase
    .from('dettagli_ordini')
    .insert(dettagliConOrdineId)

  if (dettagliError) {
    console.error('Error creating dettagli:', dettagliError)
    // Elimina l'ordine se i dettagli falliscono
    await supabase.from('ordini').delete().eq('id', data.id)
    const redirectPath = validation.data.tipo === 'acquisto'
      ? '/dashboard/ordini/acquisto/nuovo'
      : '/dashboard/ordini/vendita/nuovo'
    redirect(`${redirectPath}?error=${encodeURIComponent('Errore nella creazione dei dettagli: ' + dettagliError.message)}`)
  }

  revalidatePath('/dashboard/ordini')
  revalidatePath('/dashboard/ordini/vendita')
  revalidatePath('/dashboard/ordini/acquisto')
  redirect(`/dashboard/ordini/${data.id}?success=Ordine creato con successo`)
}

export async function updateOrdine(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const validation = validateOrdineFormData(formData)

  if (!validation.success) {
    const errors = validation.error.issues.map(err => err.message).join(', ')
    redirect(`/dashboard/ordini/${id}/modifica?error=${encodeURIComponent(errors)}`)
  }

  // Estrai i dettagli dei prodotti dalla FormData
  const dettagli: Array<{
    prodotto_id: string
    quantita: number
    prezzo_unitario: number
    sconto_percentuale: number
    aggiorna_prezzo_listino: boolean
    subtotale: number
  }> = []

  let index = 0
  while (formData.get(`dettagli[${index}][prodotto_id]`)) {
    const prodotto_id = formData.get(`dettagli[${index}][prodotto_id]`) as string
    const quantita = parseFloat(formData.get(`dettagli[${index}][quantita]`) as string)
    const prezzo_unitario = parseFloat(formData.get(`dettagli[${index}][prezzo_unitario]`) as string)
    const sconto_percentuale = parseFloat(formData.get(`dettagli[${index}][sconto_percentuale]`) as string) || 0
    const aggiorna_prezzo_listino = formData.get(`dettagli[${index}][aggiorna_prezzo_listino]`) === 'on'

    if (prodotto_id && quantita > 0 && prezzo_unitario >= 0) {
      const lordo = quantita * prezzo_unitario
      const sconto_importo = lordo * (sconto_percentuale / 100)
      const subtotale = lordo - sconto_importo

      dettagli.push({
        prodotto_id,
        quantita,
        prezzo_unitario,
        sconto_percentuale,
        aggiorna_prezzo_listino,
        subtotale
      })
    }
    index++
  }

  // Verifica che ci sia almeno un prodotto
  if (dettagli.length === 0) {
    redirect(`/dashboard/ordini/${id}/modifica?error=${encodeURIComponent('Devi aggiungere almeno un prodotto')}`)
  }

  // Calcola il totale
  const totale = dettagli.reduce((sum, d) => sum + d.subtotale, 0)

  // Get magazzino_id from form if provided
  const magazzinoId = formData.get('magazzino_id')
    ? parseInt(formData.get('magazzino_id') as string)
    : undefined

  // Trasportatore, incoterm e sede cliente
  const trasportatoreId = formData.get('trasportatore_id')
    ? parseInt(formData.get('trasportatore_id') as string)
    : null
  const incotermId = formData.get('incoterm_id')
    ? parseInt(formData.get('incoterm_id') as string)
    : null
  const sedeClienteId = formData.get('sede_cliente_id')
    ? parseInt(formData.get('sede_cliente_id') as string)
    : null
  const costoTrasporto = formData.get('costo_trasporto')
    ? parseFloat(formData.get('costo_trasporto') as string)
    : 0
  const pesoTotaleKg = formData.get('peso_totale_kg')
    ? parseFloat(formData.get('peso_totale_kg') as string)
    : 0

  // Nuovi campi: metodo pagamento, agente, data consegna
  const metodoPagamentoId = formData.get('metodo_pagamento_id')
    ? parseInt(formData.get('metodo_pagamento_id') as string)
    : null
  const agenteId = formData.get('agente_id')
    ? parseInt(formData.get('agente_id') as string)
    : null
  const dataConsegnaPrevista = formData.get('data_consegna_prevista') as string || null

  const updates = {
    numero_ordine: validation.data.numero_ordine,
    data_ordine: validation.data.data_ordine,
    cliente_id: validation.data.cliente_id || null,
    fornitore_id: validation.data.fornitore_id || null,
    magazzino_id: magazzinoId,
    trasportatore_id: trasportatoreId,
    incoterm_id: incotermId,
    sede_cliente_id: sedeClienteId,
    costo_trasporto: costoTrasporto,
    peso_totale_kg: pesoTotaleKg,
    metodo_pagamento_id: metodoPagamentoId,
    agente_id: agenteId,
    data_consegna_prevista: dataConsegnaPrevista || null,
    stato: validation.data.stato || 'bozza',
    totale,
    note: validation.data.note || null,
  }

  // Aggiorna l'ordine
  const { error } = await supabase
    .from('ordini')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('Error updating ordine:', error)
    redirect(`/dashboard/ordini/${id}/modifica?error=${encodeURIComponent(error.message)}`)
  }

  // Elimina i vecchi dettagli
  await supabase
    .from('dettagli_ordini')
    .delete()
    .eq('ordine_id', id)

  // Inserisci i nuovi dettagli
  const dettagliConOrdineId = dettagli.map(d => ({
    ...d,
    ordine_id: id
  }))

  const { error: dettagliError } = await supabase
    .from('dettagli_ordini')
    .insert(dettagliConOrdineId)

  if (dettagliError) {
    console.error('Error updating dettagli:', dettagliError)
    redirect(`/dashboard/ordini/${id}/modifica?error=${encodeURIComponent('Errore nell\'aggiornamento dei dettagli')}`)
  }

  const redirectPath = validation.data.tipo === 'acquisto'
    ? '/dashboard/ordini/acquisto'
    : '/dashboard/ordini/vendita'

  revalidatePath('/dashboard/ordini')
  revalidatePath('/dashboard/ordini/vendita')
  revalidatePath('/dashboard/ordini/acquisto')
  revalidatePath(`/dashboard/ordini/${id}`)
  redirect(`${redirectPath}?success=Ordine aggiornato con successo`)
}

export async function deleteOrdine(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Prima recupera il tipo dell'ordine per il redirect corretto
  const { data: ordine } = await supabase
    .from('ordini')
    .select('tipo')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('ordini')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting ordine:', error)
    redirect(`/dashboard/ordini?error=${encodeURIComponent(error.message)}`)
  }

  const redirectPath = ordine?.tipo === 'acquisto'
    ? '/dashboard/ordini/acquisto'
    : '/dashboard/ordini/vendita'

  revalidatePath('/dashboard/ordini')
  revalidatePath('/dashboard/ordini/vendita')
  revalidatePath('/dashboard/ordini/acquisto')
  redirect(`${redirectPath}?success=Ordine eliminato con successo`)
}

export async function addDettaglioOrdine(ordineId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const prodotto_id = formData.get('prodotto_id') as string
  const quantita = parseInt(formData.get('quantita') as string)
  const prezzo_unitario = parseFloat(formData.get('prezzo_unitario') as string)

  if (!prodotto_id || !quantita || !prezzo_unitario) {
    redirect(`/dashboard/ordini/${ordineId}?error=Tutti i campi sono obbligatori`)
  }

  const subtotale = quantita * prezzo_unitario

  const { error } = await supabase
    .from('dettagli_ordini')
    .insert([{
      ordine_id: ordineId,
      prodotto_id,
      quantita,
      prezzo_unitario,
      subtotale,
    }])

  if (error) {
    console.error('Error adding dettaglio:', error)
    redirect(`/dashboard/ordini/${ordineId}?error=${encodeURIComponent(error.message)}`)
  }

  // Ricalcola totale ordine
  await ricalcolaTotaleOrdine(ordineId)

  revalidatePath(`/dashboard/ordini/${ordineId}`)
  redirect(`/dashboard/ordini/${ordineId}?success=Prodotto aggiunto`)
}

export async function removeDettaglioOrdine(ordineId: string, dettaglioId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { error } = await supabase
    .from('dettagli_ordini')
    .delete()
    .eq('id', dettaglioId)

  if (error) {
    console.error('Error removing dettaglio:', error)
    redirect(`/dashboard/ordini/${ordineId}?error=${encodeURIComponent(error.message)}`)
  }

  // Ricalcola totale ordine
  await ricalcolaTotaleOrdine(ordineId)

  revalidatePath(`/dashboard/ordini/${ordineId}`)
  redirect(`/dashboard/ordini/${ordineId}?success=Prodotto rimosso`)
}

async function ricalcolaTotaleOrdine(ordineId: string) {
  const supabase = await createClient()

  const { data: dettagli } = await supabase
    .from('dettagli_ordini')
    .select('subtotale')
    .eq('ordine_id', ordineId)

  const totale = dettagli?.reduce((sum, d) => sum + d.subtotale, 0) || 0

  await supabase
    .from('ordini')
    .update({ totale })
    .eq('id', ordineId)
}

// =====================================================
// DATI COMPLETI PER PDF
// =====================================================

export type OrdineCompletoPDF = {
  ordine: {
    numero_ordine: string
    data_ordine: string
    tipo: string
    stato: string
    totale: number
    note?: string
    costo_trasporto?: number
    peso_totale_kg?: number
    data_consegna_prevista?: string
  }
  azienda: {
    nome: string
    ragione_sociale?: string
    partita_iva?: string
    codice_fiscale?: string
    email: string
    telefono?: string
    indirizzo?: string
    cap?: string
    citta?: string
    provincia?: string
  }
  cliente?: {
    ragione_sociale: string
    partita_iva?: string
    codice_fiscale?: string
    codice_univoco?: string // SDI
    pec?: string
    email?: string
    telefono?: string
    indirizzo?: string
    cap?: string
    citta?: string
    provincia?: string
  }
  indirizzoSpedizione?: {
    denominazione: string
    indirizzo?: string
    cap?: string
    citta?: string
    provincia?: string
  }
  trasportatore?: {
    ragione_sociale: string
    partita_iva?: string
    telefono?: string
    email?: string
  }
  incoterm?: {
    codice: string
    nome: string
    trasporto_a_carico?: string
  }
  metodoPagamento?: {
    codice: string
    nome: string
    giorni_scadenza: number
  }
  agente?: {
    ragione_sociale: string
    codice_agente?: string
    telefono?: string
    email?: string
  }
  dettagli: Array<{
    codice: string
    descrizione: string
    quantita: number
    unita: string
    prezzo_unitario: number
    sconto_percentuale: number
    totale: number
  }>
  totali: {
    imponibile: number
    iva: number
    totale: number
  }
}

/**
 * Recupera tutti i dati necessari per generare PDF ordine
 */
export async function getOrdinePDF(id: string): Promise<OrdineCompletoPDF | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Ottieni azienda
  const { data: utenteAzienda } = await supabase
    .from('utente_azienda')
    .select('azienda_id')
    .eq('user_id', user.id)
    .single()

  if (!utenteAzienda) return null

  const { data: azienda } = await supabase
    .from('azienda')
    .select('nome, ragione_sociale, partita_iva, codice_fiscale, email, telefono, indirizzo, cap, citta, provincia')
    .eq('id', utenteAzienda.azienda_id)
    .single()

  if (!azienda) return null

  // Ottieni ordine con relazioni
  const { data: ordine } = await supabase
    .from('ordini')
    .select(`
      numero_ordine, data_ordine, tipo, stato, totale, note, costo_trasporto, peso_totale_kg,
      cliente_id, sede_cliente_id, trasportatore_id, incoterm_id, metodo_pagamento_id, agente_id,
      data_consegna_prevista
    `)
    .eq('id', id)
    .single()

  if (!ordine) return null

  // Cliente completo (con SDI e PEC)
  let cliente = null
  if (ordine.cliente_id) {
    const { data } = await supabase
      .from('soggetto')
      .select('ragione_sociale, partita_iva, codice_fiscale, codice_univoco, pec, email, telefono, indirizzo, cap, citta, provincia')
      .eq('id', ordine.cliente_id)
      .single()
    cliente = data
  }

  // Sede spedizione
  let indirizzoSpedizione = null
  if (ordine.sede_cliente_id) {
    const { data } = await supabase
      .from('sede_cliente')
      .select('denominazione, indirizzo, cap, citta, provincia')
      .eq('id', ordine.sede_cliente_id)
      .single()
    indirizzoSpedizione = data
  }

  // Trasportatore
  let trasportatore = null
  if (ordine.trasportatore_id) {
    const { data } = await supabase
      .from('soggetto')
      .select('ragione_sociale, partita_iva, telefono, email')
      .eq('id', ordine.trasportatore_id)
      .single()
    trasportatore = data
  }

  // Incoterm
  let incoterm = null
  if (ordine.incoterm_id) {
    const { data } = await supabase
      .from('incoterm')
      .select('codice, nome, trasporto_a_carico')
      .eq('id', ordine.incoterm_id)
      .single()
    incoterm = data
  }

  // Metodo pagamento
  let metodoPagamento = null
  if (ordine.metodo_pagamento_id) {
    const { data } = await supabase
      .from('metodo_pagamento')
      .select('codice, nome, giorni_scadenza')
      .eq('id', ordine.metodo_pagamento_id)
      .single()
    metodoPagamento = data
  }

  // Agente
  let agente = null
  if (ordine.agente_id) {
    const { data } = await supabase
      .from('soggetto')
      .select('ragione_sociale, codice_agente, telefono, email')
      .eq('id', ordine.agente_id)
      .single()
    agente = data
  }

  // Dettagli prodotti
  const { data: dettagliDb } = await supabase
    .from('dettagli_ordini')
    .select(`
      quantita, prezzo_unitario, sconto_percentuale, subtotale,
      prodotto:prodotto_id(codice, nome, unita_misura)
    `)
    .eq('ordine_id', id)

  const dettagli = (dettagliDb || []).map(d => {
    // Il prodotto può essere un oggetto o un array (dipende dalla query Supabase)
    const prodottoRaw = d.prodotto as unknown
    const prodotto = Array.isArray(prodottoRaw)
      ? prodottoRaw[0] as { codice: string; nome: string; unita_misura?: string } | undefined
      : prodottoRaw as { codice: string; nome: string; unita_misura?: string } | null
    return {
      codice: prodotto?.codice || '',
      descrizione: prodotto?.nome || '',
      quantita: d.quantita,
      unita: prodotto?.unita_misura || 'PZ',
      prezzo_unitario: parseFloat(String(d.prezzo_unitario)),
      sconto_percentuale: parseFloat(String(d.sconto_percentuale || 0)),
      totale: parseFloat(String(d.subtotale))
    }
  })

  // Calcola totali
  const imponibile = dettagli.reduce((sum, d) => sum + d.totale, 0)
  const iva = imponibile * 0.22 // IVA 22%
  const totaleConIva = imponibile + iva + (ordine.costo_trasporto || 0)

  return {
    ordine: {
      numero_ordine: ordine.numero_ordine,
      data_ordine: ordine.data_ordine,
      tipo: ordine.tipo,
      stato: ordine.stato,
      totale: parseFloat(String(ordine.totale)),
      note: ordine.note,
      costo_trasporto: ordine.costo_trasporto ? parseFloat(String(ordine.costo_trasporto)) : undefined,
      peso_totale_kg: ordine.peso_totale_kg ? parseFloat(String(ordine.peso_totale_kg)) : undefined,
      data_consegna_prevista: ordine.data_consegna_prevista || undefined
    },
    azienda,
    cliente: cliente || undefined,
    indirizzoSpedizione: indirizzoSpedizione || undefined,
    trasportatore: trasportatore || undefined,
    incoterm: incoterm || undefined,
    metodoPagamento: metodoPagamento || undefined,
    agente: agente || undefined,
    dettagli,
    totali: {
      imponibile: Math.round(imponibile * 100) / 100,
      iva: Math.round(iva * 100) / 100,
      totale: Math.round(totaleConIva * 100) / 100
    }
  }
}
