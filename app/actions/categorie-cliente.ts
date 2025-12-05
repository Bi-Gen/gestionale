'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type CategoriaCliente = {
  id: number
  azienda_id: string
  codice: string
  nome: string
  descrizione?: string
  listino_id?: number
  sconto_default: number
  priorita: number
  colore: string
  attivo: boolean
  created_at: string
  updated_at: string
  // Relazioni
  listino?: {
    id: number
    codice: string
    nome: string
  }
  // Conteggio clienti
  clienti_count?: number
}

// GET: Lista categorie cliente
export async function getCategorieCliente() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categoria_cliente')
    .select(`
      *,
      listino:listino_id(id, codice, nome)
    `)
    .order('priorita', { ascending: false })
    .order('nome', { ascending: true })

  if (error) {
    console.error('Errore caricamento categorie cliente:', error)
    return []
  }

  return data as CategoriaCliente[]
}

// GET: Categorie attive (per dropdown)
export async function getCategorieClienteAttive() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categoria_cliente')
    .select('id, codice, nome, listino_id, sconto_default, colore')
    .eq('attivo', true)
    .order('priorita', { ascending: false })
    .order('nome', { ascending: true })

  if (error) {
    console.error('Errore caricamento categorie cliente attive:', error)
    return []
  }

  return data
}

// GET: Singola categoria
export async function getCategoriaCliente(id: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categoria_cliente')
    .select(`
      *,
      listino:listino_id(id, codice, nome)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Errore caricamento categoria cliente:', error)
    return null
  }

  return data as CategoriaCliente
}

// GET: Conteggio clienti per categoria
export async function getCategoriaClientiCount(categoria_id: number) {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('soggetto')
    .select('*', { count: 'exact', head: true })
    .eq('categoria_cliente_id', categoria_id)

  if (error) {
    console.error('Errore conteggio clienti categoria:', error)
    return 0
  }

  return count || 0
}

// CREATE
export async function createCategoriaCliente(formData: FormData) {
  const supabase = await createClient()

  // Ottieni azienda_id
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return redirect('/dashboard/configurazioni/categorie-cliente?error=Utente non autenticato')
  }

  const { data: utenteAzienda } = await supabase
    .from('utente_azienda')
    .select('azienda_id')
    .eq('user_id', userData.user.id)
    .eq('attivo', true)
    .single()

  if (!utenteAzienda) {
    return redirect('/dashboard/configurazioni/categorie-cliente?error=Nessuna azienda associata')
  }

  const categoriaData = {
    azienda_id: utenteAzienda.azienda_id,
    codice: (formData.get('codice') as string)?.toUpperCase().trim(),
    nome: (formData.get('nome') as string)?.trim(),
    descrizione: (formData.get('descrizione') as string)?.trim() || null,
    listino_id: formData.get('listino_id') ? parseInt(formData.get('listino_id') as string) : null,
    sconto_default: parseFloat(formData.get('sconto_default') as string) || 0,
    priorita: parseInt(formData.get('priorita') as string) || 0,
    colore: (formData.get('colore') as string) || '#6B7280',
    attivo: formData.get('attivo') !== 'false',
  }

  // Validazione
  if (!categoriaData.codice || !categoriaData.nome) {
    return redirect('/dashboard/configurazioni/categorie-cliente/nuovo?error=Codice e nome sono obbligatori')
  }

  const { error } = await supabase
    .from('categoria_cliente')
    .insert([categoriaData])

  if (error) {
    console.error('Errore creazione categoria cliente:', error)
    return redirect(`/dashboard/configurazioni/categorie-cliente/nuovo?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/categorie-cliente')
  redirect('/dashboard/configurazioni/categorie-cliente?success=Categoria creata con successo')
}

// UPDATE
export async function updateCategoriaCliente(id: number, formData: FormData) {
  const supabase = await createClient()

  const categoriaData = {
    codice: (formData.get('codice') as string)?.toUpperCase().trim(),
    nome: (formData.get('nome') as string)?.trim(),
    descrizione: (formData.get('descrizione') as string)?.trim() || null,
    listino_id: formData.get('listino_id') ? parseInt(formData.get('listino_id') as string) : null,
    sconto_default: parseFloat(formData.get('sconto_default') as string) || 0,
    priorita: parseInt(formData.get('priorita') as string) || 0,
    colore: (formData.get('colore') as string) || '#6B7280',
    attivo: formData.get('attivo') !== 'false',
    updated_at: new Date().toISOString(),
  }

  // Validazione
  if (!categoriaData.codice || !categoriaData.nome) {
    return redirect(`/dashboard/configurazioni/categorie-cliente/${id}/modifica?error=Codice e nome sono obbligatori`)
  }

  const { error } = await supabase
    .from('categoria_cliente')
    .update(categoriaData)
    .eq('id', id)

  if (error) {
    console.error('Errore aggiornamento categoria cliente:', error)
    return redirect(`/dashboard/configurazioni/categorie-cliente/${id}/modifica?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/categorie-cliente')
  revalidatePath(`/dashboard/configurazioni/categorie-cliente/${id}`)
  redirect('/dashboard/configurazioni/categorie-cliente?success=Categoria aggiornata con successo')
}

// DELETE
export async function deleteCategoriaCliente(id: number) {
  const supabase = await createClient()

  // Verifica se ci sono clienti con questa categoria
  const { count } = await supabase
    .from('soggetto')
    .select('*', { count: 'exact', head: true })
    .eq('categoria_cliente_id', id)

  if (count && count > 0) {
    return redirect(`/dashboard/configurazioni/categorie-cliente?error=Impossibile eliminare: ci sono ${count} clienti con questa categoria`)
  }

  const { error } = await supabase
    .from('categoria_cliente')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Errore eliminazione categoria cliente:', error)
    return redirect(`/dashboard/configurazioni/categorie-cliente?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/categorie-cliente')
  redirect('/dashboard/configurazioni/categorie-cliente?success=Categoria eliminata con successo')
}
