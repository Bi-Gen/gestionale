'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { validateOrdineFormData } from '@/lib/validations/ordini'

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
      magazzino(id, nome, codice)
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
      magazzino(id, nome, codice)
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

  const ordine = {
    azienda_id: utenteAzienda.azienda_id,
    numero_ordine: validation.data.numero_ordine,
    tipo: validation.data.tipo,
    data_ordine: validation.data.data_ordine,
    cliente_id: validation.data.cliente_id || null,
    fornitore_id: validation.data.fornitore_id || null,
    magazzino_id: magazzinoId,
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

  const updates = {
    numero_ordine: validation.data.numero_ordine,
    data_ordine: validation.data.data_ordine,
    cliente_id: validation.data.cliente_id || null,
    fornitore_id: validation.data.fornitore_id || null,
    magazzino_id: magazzinoId,
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
