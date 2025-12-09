'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type Listino = {
  id: number
  azienda_id: string
  codice: string
  nome: string
  descrizione?: string
  tipo: 'vendita' | 'acquisto'
  valuta?: string // vecchio campo (mantenuto per compatibilità)
  valuta_id?: number
  provvigione_default: number
  fornitore_id?: number
  priorita: number
  data_inizio?: string
  data_fine?: string
  predefinito: boolean
  attivo: boolean
  created_at: string
  updated_at: string
  // Relazioni
  valuta_rel?: {
    id: number
    codice: string
    nome: string
    simbolo: string
  }
  fornitore?: {
    id: number
    ragione_sociale: string
  }
  // Conteggio prodotti nel listino
  prodotti_count?: number
}

// GET: Lista listini
export async function getListini(tipo?: 'vendita' | 'acquisto') {
  const supabase = await createClient()

  let query = supabase
    .from('listino')
    .select(`
      *,
      valuta_rel:valuta_id(id, codice, nome, simbolo),
      fornitore:fornitore_id(id, ragione_sociale)
    `)
    .order('priorita', { ascending: false })
    .order('nome', { ascending: true })

  if (tipo) {
    query = query.eq('tipo', tipo)
  }

  const { data, error } = await query

  if (error) {
    console.error('Errore caricamento listini:', error)
    return []
  }

  return data as Listino[]
}

// GET: Listini attivi (per dropdown)
export async function getListiniAttivi(tipo?: 'vendita' | 'acquisto') {
  const supabase = await createClient()

  let query = supabase
    .from('listino')
    .select('id, codice, nome, tipo, provvigione_default, priorita')
    .eq('attivo', true)
    .order('priorita', { ascending: false })
    .order('nome', { ascending: true })

  if (tipo) {
    query = query.eq('tipo', tipo)
  }

  const { data, error } = await query

  if (error) {
    console.error('Errore caricamento listini attivi:', error)
    return []
  }

  return data
}

// GET: Singolo listino
export async function getListino(id: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('listino')
    .select(`
      *,
      valuta_rel:valuta_id(id, codice, nome, simbolo),
      fornitore:fornitore_id(id, ragione_sociale)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Errore caricamento listino:', error)
    return null
  }

  return data as Listino
}

// GET: Conteggio prodotti per listino
export async function getListinoProdottiCount(listino_id: number) {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('listino_prodotto')
    .select('*', { count: 'exact', head: true })
    .eq('listino_id', listino_id)

  if (error) {
    console.error('Errore conteggio prodotti listino:', error)
    return 0
  }

  return count || 0
}

// CREATE
export async function createListino(formData: FormData) {
  const supabase = await createClient()

  // Ottieni azienda_id dell'utente corrente
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return redirect('/dashboard/configurazioni/listini?error=Utente non autenticato')
  }

  const { data: utenteAzienda } = await supabase
    .from('utente_azienda')
    .select('azienda_id')
    .eq('user_id', userData.user.id)
    .eq('attivo', true)
    .single()

  if (!utenteAzienda) {
    return redirect('/dashboard/configurazioni/listini?error=Nessuna azienda associata')
  }

  const listinoData = {
    azienda_id: utenteAzienda.azienda_id,
    codice: (formData.get('codice') as string)?.toUpperCase().trim(),
    nome: (formData.get('nome') as string)?.trim(),
    descrizione: (formData.get('descrizione') as string)?.trim() || null,
    tipo: (formData.get('tipo') as string) || 'vendita',
    valuta_id: formData.get('valuta_id') ? parseInt(formData.get('valuta_id') as string) : null,
    provvigione_default: parseFloat(formData.get('provvigione_default') as string) || 0,
    fornitore_id: formData.get('fornitore_id') ? parseInt(formData.get('fornitore_id') as string) : null,
    priorita: parseInt(formData.get('priorita') as string) || 0,
    data_inizio: (formData.get('data_inizio') as string) || null,
    data_fine: (formData.get('data_fine') as string) || null,
    predefinito: formData.get('predefinito') === 'true',
    attivo: formData.get('attivo') !== 'false', // default true
  }

  // Validazione base
  if (!listinoData.codice || !listinoData.nome) {
    return redirect('/dashboard/configurazioni/listini/nuovo?error=Codice e nome sono obbligatori')
  }

  // Se è predefinito, rimuovi predefinito dagli altri dello stesso tipo
  if (listinoData.predefinito) {
    await supabase
      .from('listino')
      .update({ predefinito: false })
      .eq('azienda_id', utenteAzienda.azienda_id)
      .eq('tipo', listinoData.tipo)
  }

  const { error } = await supabase
    .from('listino')
    .insert([listinoData])

  if (error) {
    console.error('Errore creazione listino:', error)
    return redirect(`/dashboard/configurazioni/listini/nuovo?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/listini')
  redirect('/dashboard/configurazioni/listini?success=Listino creato con successo')
}

// UPDATE
export async function updateListino(id: number, formData: FormData) {
  const supabase = await createClient()

  // Ottieni azienda_id per gestire predefinito
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return redirect('/dashboard/configurazioni/listini?error=Utente non autenticato')
  }

  const { data: utenteAzienda } = await supabase
    .from('utente_azienda')
    .select('azienda_id')
    .eq('user_id', userData.user.id)
    .eq('attivo', true)
    .single()

  const listinoData = {
    codice: (formData.get('codice') as string)?.toUpperCase().trim(),
    nome: (formData.get('nome') as string)?.trim(),
    descrizione: (formData.get('descrizione') as string)?.trim() || null,
    tipo: (formData.get('tipo') as string) || 'vendita',
    valuta_id: formData.get('valuta_id') ? parseInt(formData.get('valuta_id') as string) : null,
    provvigione_default: parseFloat(formData.get('provvigione_default') as string) || 0,
    fornitore_id: formData.get('fornitore_id') ? parseInt(formData.get('fornitore_id') as string) : null,
    priorita: parseInt(formData.get('priorita') as string) || 0,
    data_inizio: (formData.get('data_inizio') as string) || null,
    data_fine: (formData.get('data_fine') as string) || null,
    predefinito: formData.get('predefinito') === 'true',
    attivo: formData.get('attivo') !== 'false',
    updated_at: new Date().toISOString(),
  }

  // Validazione base
  if (!listinoData.codice || !listinoData.nome) {
    return redirect(`/dashboard/configurazioni/listini/${id}/modifica?error=Codice e nome sono obbligatori`)
  }

  // Se è predefinito, rimuovi predefinito dagli altri dello stesso tipo
  if (listinoData.predefinito && utenteAzienda) {
    await supabase
      .from('listino')
      .update({ predefinito: false })
      .eq('azienda_id', utenteAzienda.azienda_id)
      .eq('tipo', listinoData.tipo)
      .neq('id', id)
  }

  const { error } = await supabase
    .from('listino')
    .update(listinoData)
    .eq('id', id)

  if (error) {
    console.error('Errore aggiornamento listino:', error)
    return redirect(`/dashboard/configurazioni/listini/${id}/modifica?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/listini')
  revalidatePath(`/dashboard/configurazioni/listini/${id}`)
  redirect('/dashboard/configurazioni/listini?success=Listino aggiornato con successo')
}

// DELETE
export async function deleteListino(id: number) {
  const supabase = await createClient()

  // Verifica se ci sono prodotti associati
  const { count } = await supabase
    .from('listino_prodotto')
    .select('*', { count: 'exact', head: true })
    .eq('listino_id', id)

  if (count && count > 0) {
    return redirect(`/dashboard/configurazioni/listini?error=Impossibile eliminare: ci sono ${count} prodotti associati a questo listino`)
  }

  // Verifica se ci sono clienti/soggetti con questo listino
  const { count: soggettiCount } = await supabase
    .from('soggetto')
    .select('*', { count: 'exact', head: true })
    .eq('listino_id', id)

  if (soggettiCount && soggettiCount > 0) {
    return redirect(`/dashboard/configurazioni/listini?error=Impossibile eliminare: ci sono ${soggettiCount} clienti associati a questo listino`)
  }

  const { error } = await supabase
    .from('listino')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Errore eliminazione listino:', error)
    return redirect(`/dashboard/configurazioni/listini?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/listini')
  redirect('/dashboard/configurazioni/listini?success=Listino eliminato con successo')
}

// DUPLICA LISTINO (copia struttura con nuovo codice)
export async function duplicaListino(id: number, nuovoCodice: string, nuovoNome: string) {
  const supabase = await createClient()

  // Ottieni azienda_id
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return { error: 'Utente non autenticato' }
  }

  const { data: utenteAzienda } = await supabase
    .from('utente_azienda')
    .select('azienda_id')
    .eq('user_id', userData.user.id)
    .eq('attivo', true)
    .single()

  if (!utenteAzienda) {
    return { error: 'Nessuna azienda associata' }
  }

  // Ottieni listino originale
  const { data: originale, error: errOriginal } = await supabase
    .from('listino')
    .select('*')
    .eq('id', id)
    .single()

  if (errOriginal || !originale) {
    return { error: 'Listino originale non trovato' }
  }

  // Crea nuovo listino
  const { data: nuovoListino, error: errNuovo } = await supabase
    .from('listino')
    .insert([{
      azienda_id: utenteAzienda.azienda_id,
      codice: nuovoCodice.toUpperCase().trim(),
      nome: nuovoNome.trim(),
      descrizione: `Copia di ${originale.nome}`,
      tipo: originale.tipo,
      valuta_id: originale.valuta_id,
      provvigione_default: originale.provvigione_default,
      priorita: originale.priorita,
      predefinito: false,
      attivo: true,
    }])
    .select()
    .single()

  if (errNuovo || !nuovoListino) {
    return { error: errNuovo?.message || 'Errore creazione listino' }
  }

  // Copia tutti i prezzi prodotto
  const { data: prezziOriginali } = await supabase
    .from('listino_prodotto')
    .select('*')
    .eq('listino_id', id)

  if (prezziOriginali && prezziOriginali.length > 0) {
    const nuoviPrezzi = prezziOriginali.map(p => ({
      azienda_id: utenteAzienda.azienda_id,
      listino_id: nuovoListino.id,
      prodotto_id: p.prodotto_id,
      prezzo: p.prezzo,
      prezzo_minimo: p.prezzo_minimo,
      sconto_max: p.sconto_max,
      provvigione_override: p.provvigione_override,
      note: p.note,
    }))

    await supabase
      .from('listino_prodotto')
      .insert(nuoviPrezzi)
  }

  revalidatePath('/dashboard/configurazioni/listini')
  return { success: true, id: nuovoListino.id }
}

// =====================================================
// LISTINO PRODOTTO - Gestione prezzi per listino
// =====================================================

export type ListinoProdotto = {
  id: number
  azienda_id: string
  listino_id: number
  prodotto_id: number
  prezzo: number
  prezzo_minimo?: number
  sconto_max?: number
  provvigione_override?: number
  data_inizio?: string
  data_fine?: string
  note?: string
  created_at: string
  updated_at: string
  // Relazione prodotto
  prodotto?: {
    id: number
    codice: string
    descrizione: string
    unita_misura?: string
    prezzo_vendita?: number
    prezzo_acquisto?: number
  }
}

// GET: Lista prodotti in un listino
export async function getListinoProdotti(listino_id: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('listino_prodotto')
    .select(`
      *,
      prodotto:prodotto_id(id, codice, descrizione, unita_misura, prezzo_vendita, prezzo_acquisto)
    `)
    .eq('listino_id', listino_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Errore caricamento prodotti listino:', error)
    return []
  }

  return data as ListinoProdotto[]
}

// GET: Singolo prezzo prodotto in listino
export async function getListinoProdotto(id: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('listino_prodotto')
    .select(`
      *,
      prodotto:prodotto_id(id, codice, descrizione, unita_misura, prezzo_vendita, prezzo_acquisto)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Errore caricamento prezzo listino:', error)
    return null
  }

  return data as ListinoProdotto
}

// CREATE: Aggiungi prodotto al listino
export async function addProdottoToListino(listino_id: number, formData: FormData) {
  const supabase = await createClient()

  // Ottieni azienda_id
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return redirect(`/dashboard/configurazioni/listini/${listino_id}?error=Utente non autenticato`)
  }

  const { data: utenteAzienda } = await supabase
    .from('utente_azienda')
    .select('azienda_id')
    .eq('user_id', userData.user.id)
    .eq('attivo', true)
    .single()

  if (!utenteAzienda) {
    return redirect(`/dashboard/configurazioni/listini/${listino_id}?error=Nessuna azienda associata`)
  }

  const prodotto_id = parseInt(formData.get('prodotto_id') as string)
  const prezzo = parseFloat(formData.get('prezzo') as string)

  if (!prodotto_id || isNaN(prezzo)) {
    return redirect(`/dashboard/configurazioni/listini/${listino_id}?error=Prodotto e prezzo sono obbligatori`)
  }

  const listinoProdottoData = {
    azienda_id: utenteAzienda.azienda_id,
    listino_id,
    prodotto_id,
    prezzo,
    prezzo_minimo: formData.get('prezzo_minimo') ? parseFloat(formData.get('prezzo_minimo') as string) : null,
    sconto_max: formData.get('sconto_max') ? parseFloat(formData.get('sconto_max') as string) : null,
    provvigione_override: formData.get('provvigione_override') ? parseFloat(formData.get('provvigione_override') as string) : null,
    data_inizio: (formData.get('data_inizio') as string) || null,
    data_fine: (formData.get('data_fine') as string) || null,
    note: (formData.get('note') as string)?.trim() || null,
  }

  const { error } = await supabase
    .from('listino_prodotto')
    .insert([listinoProdottoData])

  if (error) {
    console.error('Errore aggiunta prodotto al listino:', error)
    if (error.code === '23505') {
      return redirect(`/dashboard/configurazioni/listini/${listino_id}?error=Prodotto gia presente nel listino`)
    }
    return redirect(`/dashboard/configurazioni/listini/${listino_id}?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath(`/dashboard/configurazioni/listini/${listino_id}`)
  redirect(`/dashboard/configurazioni/listini/${listino_id}?success=Prodotto aggiunto al listino`)
}

// UPDATE: Modifica prezzo prodotto nel listino
export async function updateListinoProdotto(id: number, listino_id: number, formData: FormData) {
  const supabase = await createClient()

  const prezzo = parseFloat(formData.get('prezzo') as string)

  if (isNaN(prezzo)) {
    return redirect(`/dashboard/configurazioni/listini/${listino_id}?error=Prezzo non valido`)
  }

  const updateData = {
    prezzo,
    prezzo_minimo: formData.get('prezzo_minimo') ? parseFloat(formData.get('prezzo_minimo') as string) : null,
    sconto_max: formData.get('sconto_max') ? parseFloat(formData.get('sconto_max') as string) : null,
    provvigione_override: formData.get('provvigione_override') ? parseFloat(formData.get('provvigione_override') as string) : null,
    data_inizio: (formData.get('data_inizio') as string) || null,
    data_fine: (formData.get('data_fine') as string) || null,
    note: (formData.get('note') as string)?.trim() || null,
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase
    .from('listino_prodotto')
    .update(updateData)
    .eq('id', id)

  if (error) {
    console.error('Errore aggiornamento prezzo listino:', error)
    return redirect(`/dashboard/configurazioni/listini/${listino_id}?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath(`/dashboard/configurazioni/listini/${listino_id}`)
  redirect(`/dashboard/configurazioni/listini/${listino_id}?success=Prezzo aggiornato`)
}

// DELETE: Rimuovi prodotto dal listino
export async function removeProdottoFromListino(id: number, listino_id: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('listino_prodotto')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Errore rimozione prodotto dal listino:', error)
    return redirect(`/dashboard/configurazioni/listini/${listino_id}?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath(`/dashboard/configurazioni/listini/${listino_id}`)
  redirect(`/dashboard/configurazioni/listini/${listino_id}?success=Prodotto rimosso dal listino`)
}

// =====================================================
// PREZZI LISTINO PER PRODOTTO - Vista dal prodotto
// =====================================================

export type PrezzoListinoProdotto = {
  id: number
  azienda_id: string
  listino_id: number
  prodotto_id: number
  prezzo: number
  prezzo_minimo?: number
  sconto_max?: number
  provvigione_override?: number
  data_inizio?: string
  data_fine?: string
  note?: string
  created_at: string
  updated_at: string
  // Relazione listino
  listino?: {
    id: number
    codice: string
    nome: string
    tipo: 'vendita' | 'acquisto'
    provvigione_default: number
    priorita: number
    attivo: boolean
  }
}

// GET: Tutti i prezzi listino per un prodotto
export async function getPrezziListinoProdotto(prodotto_id: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('listino_prodotto')
    .select(`
      *,
      listino:listino_id(id, codice, nome, tipo, provvigione_default, priorita, attivo)
    `)
    .eq('prodotto_id', prodotto_id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Errore caricamento prezzi listino prodotto:', error)
    return []
  }

  return data as PrezzoListinoProdotto[]
}

// CREATE: Aggiungi prezzo prodotto a un listino (dalla vista prodotto)
export async function addPrezzoListinoProdotto(prodotto_id: number, formData: FormData) {
  const supabase = await createClient()

  // Ottieni azienda_id
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return { error: 'Utente non autenticato' }
  }

  const { data: utenteAzienda } = await supabase
    .from('utente_azienda')
    .select('azienda_id')
    .eq('user_id', userData.user.id)
    .eq('attivo', true)
    .single()

  if (!utenteAzienda) {
    return { error: 'Nessuna azienda associata' }
  }

  const listino_id = parseInt(formData.get('listino_id') as string)
  const prezzo = parseFloat(formData.get('prezzo') as string)

  if (!listino_id || isNaN(prezzo)) {
    return { error: 'Listino e prezzo sono obbligatori' }
  }

  const listinoProdottoData = {
    azienda_id: utenteAzienda.azienda_id,
    listino_id,
    prodotto_id,
    prezzo,
    prezzo_minimo: formData.get('prezzo_minimo') ? parseFloat(formData.get('prezzo_minimo') as string) : null,
    sconto_max: formData.get('sconto_max') ? parseFloat(formData.get('sconto_max') as string) : null,
    provvigione_override: formData.get('provvigione_override') ? parseFloat(formData.get('provvigione_override') as string) : null,
    data_inizio: (formData.get('data_inizio') as string) || null,
    data_fine: (formData.get('data_fine') as string) || null,
    note: (formData.get('note') as string)?.trim() || null,
  }

  const { data, error } = await supabase
    .from('listino_prodotto')
    .insert([listinoProdottoData])
    .select(`
      *,
      listino:listino_id(id, codice, nome, tipo, provvigione_default, priorita, attivo)
    `)
    .single()

  if (error) {
    console.error('Errore aggiunta prezzo listino:', error)
    if (error.code === '23505') {
      return { error: 'Prodotto già presente in questo listino' }
    }
    return { error: error.message }
  }

  revalidatePath(`/dashboard/prodotti/${prodotto_id}`)
  return { success: true, data }
}

// UPDATE: Modifica prezzo prodotto in un listino (dalla vista prodotto)
export async function updatePrezzoListinoProdotto(id: number, prodotto_id: number, formData: FormData) {
  const supabase = await createClient()

  const prezzo = parseFloat(formData.get('prezzo') as string)

  if (isNaN(prezzo)) {
    return { error: 'Prezzo non valido' }
  }

  const updateData = {
    prezzo,
    prezzo_minimo: formData.get('prezzo_minimo') ? parseFloat(formData.get('prezzo_minimo') as string) : null,
    sconto_max: formData.get('sconto_max') ? parseFloat(formData.get('sconto_max') as string) : null,
    provvigione_override: formData.get('provvigione_override') ? parseFloat(formData.get('provvigione_override') as string) : null,
    data_inizio: (formData.get('data_inizio') as string) || null,
    data_fine: (formData.get('data_fine') as string) || null,
    note: (formData.get('note') as string)?.trim() || null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from('listino_prodotto')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      listino:listino_id(id, codice, nome, tipo, provvigione_default, priorita, attivo)
    `)
    .single()

  if (error) {
    console.error('Errore aggiornamento prezzo listino:', error)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/prodotti/${prodotto_id}`)
  return { success: true, data }
}

// DELETE: Rimuovi prezzo prodotto da un listino (dalla vista prodotto)
export async function deletePrezzoListinoProdotto(id: number, prodotto_id: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('listino_prodotto')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Errore eliminazione prezzo listino:', error)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/prodotti/${prodotto_id}`)
  return { success: true }
}

// BULK IMPORT: Importa prezzi da CSV/array
export async function importPrezziListino(
  listino_id: number,
  prezzi: Array<{
    prodotto_id: number
    prezzo: number
    prezzo_minimo?: number
    sconto_max?: number
    provvigione_override?: number
  }>
) {
  const supabase = await createClient()

  // Ottieni azienda_id
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return { error: 'Utente non autenticato' }
  }

  const { data: utenteAzienda } = await supabase
    .from('utente_azienda')
    .select('azienda_id')
    .eq('user_id', userData.user.id)
    .eq('attivo', true)
    .single()

  if (!utenteAzienda) {
    return { error: 'Nessuna azienda associata' }
  }

  // Prepara i dati per l'inserimento
  const prezziData = prezzi.map(p => ({
    azienda_id: utenteAzienda.azienda_id,
    listino_id,
    prodotto_id: p.prodotto_id,
    prezzo: p.prezzo,
    prezzo_minimo: p.prezzo_minimo || null,
    sconto_max: p.sconto_max || null,
    provvigione_override: p.provvigione_override || null,
  }))

  // Usa upsert per aggiornare se esiste, inserire se non esiste
  const { error } = await supabase
    .from('listino_prodotto')
    .upsert(prezziData, {
      onConflict: 'listino_id,prodotto_id',
      ignoreDuplicates: false,
    })

  if (error) {
    console.error('Errore import prezzi:', error)
    return { error: error.message }
  }

  revalidatePath(`/dashboard/configurazioni/listini/${listino_id}`)
  return { success: true, count: prezzi.length }
}
