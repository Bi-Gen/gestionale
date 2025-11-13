'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { validateOrdineFormData } from '@/lib/validations/ordini'

export type Ordine = {
  id: string
  numero_ordine: string
  tipo: 'vendita' | 'acquisto'
  data_ordine: string
  cliente_id?: string
  fornitore_id?: string
  stato: string
  totale: number
  note?: string
  created_at: string
  updated_at: string
  clienti?: {
    ragione_sociale: string
  }
  fornitori?: {
    ragione_sociale: string
  }
}

export type DettaglioOrdine = {
  id: string
  ordine_id: string
  prodotto_id: string
  quantita: number
  prezzo_unitario: number
  subtotale: number
  prodotti?: {
    codice: string
    nome: string
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
      clienti(ragione_sociale),
      fornitori(ragione_sociale)
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
      clienti(ragione_sociale),
      fornitori(ragione_sociale)
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
      prodotti(codice, nome, unita_misura)
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
    subtotale: number
  }> = []

  let index = 0
  while (formData.get(`dettagli[${index}][prodotto_id]`)) {
    const prodotto_id = formData.get(`dettagli[${index}][prodotto_id]`) as string
    const quantita = parseFloat(formData.get(`dettagli[${index}][quantita]`) as string)
    const prezzo_unitario = parseFloat(formData.get(`dettagli[${index}][prezzo_unitario]`) as string)

    if (prodotto_id && quantita > 0 && prezzo_unitario >= 0) {
      const subtotale = quantita * prezzo_unitario
      dettagli.push({
        prodotto_id,
        quantita,
        prezzo_unitario,
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

  const ordine = {
    numero_ordine: validation.data.numero_ordine,
    tipo: validation.data.tipo,
    data_ordine: validation.data.data_ordine,
    cliente_id: validation.data.cliente_id || null,
    fornitore_id: validation.data.fornitore_id || null,
    stato: validation.data.stato || 'bozza',
    totale,
    note: validation.data.note || null,
    user_id: user.id,
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
    redirect(`/dashboard/ordini/${id}?error=${encodeURIComponent(errors)}`)
  }

  const updates = {
    numero_ordine: validation.data.numero_ordine,
    data_ordine: validation.data.data_ordine,
    stato: validation.data.stato || 'bozza',
    note: validation.data.note || null,
  }

  const { error } = await supabase
    .from('ordini')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating ordine:', error)
    redirect(`/dashboard/ordini/${id}?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/ordini')
  redirect(`/dashboard/ordini/${id}?success=Ordine aggiornato con successo`)
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
    .eq('user_id', user.id)
    .single()

  const { error } = await supabase
    .from('ordini')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

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
