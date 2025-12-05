'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type CategoriaFornitore = {
  id: number
  azienda_id: string
  codice: string
  nome: string
  descrizione?: string
  priorita: number
  colore: string
  attivo: boolean
  conto_costo_default_id?: number
  // Join con piano_conti (include tipo_costo dal conto)
  piano_conti?: {
    id: number
    codice: string
    descrizione: string
    tipo_costo?: string
  }
  created_at: string
  updated_at: string
  // Conteggio fornitori
  fornitori_count?: number
}

// GET: Lista categorie fornitore
export async function getCategorieFornitore() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categoria_fornitore')
    .select(`
      *,
      piano_conti:conto_costo_default_id (
        id,
        codice,
        descrizione,
        tipo_costo
      )
    `)
    .order('priorita', { ascending: false })
    .order('nome', { ascending: true })

  if (error) {
    console.error('Errore caricamento categorie fornitore:', error)
    return []
  }

  return data as CategoriaFornitore[]
}

// GET: Categorie attive (per dropdown)
export async function getCategorieFornitoreAttive() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categoria_fornitore')
    .select('id, codice, nome, colore')
    .eq('attivo', true)
    .order('priorita', { ascending: false })
    .order('nome', { ascending: true })

  if (error) {
    console.error('Errore caricamento categorie fornitore attive:', error)
    return []
  }

  return data
}

// GET: Singola categoria
export async function getCategoriaFornitore(id: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('categoria_fornitore')
    .select(`
      *,
      piano_conti:conto_costo_default_id (
        id,
        codice,
        descrizione,
        tipo_costo
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Errore caricamento categoria fornitore:', error)
    return null
  }

  return data as CategoriaFornitore
}

// GET: Conti costi per dropdown (piano conti con natura 'C')
export async function getContiCosti() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('piano_conti')
    .select('id, codice, descrizione, tipo_costo')
    .eq('natura', 'C') // Solo conti costi
    .eq('attivo', true)
    .gt('livello', 1)  // Escludi il conto macro "COSTI"
    .order('codice', { ascending: true })

  if (error) {
    console.error('Errore caricamento conti costi:', error)
    return []
  }

  return data || []
}

// GET: Conteggio fornitori per categoria
export async function getCategoriaFornitoriCount(categoria_id: number) {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('soggetto')
    .select('*', { count: 'exact', head: true })
    .eq('categoria_fornitore_id', categoria_id)

  if (error) {
    console.error('Errore conteggio fornitori categoria:', error)
    return 0
  }

  return count || 0
}

// CREATE
export async function createCategoriaFornitore(formData: FormData) {
  const supabase = await createClient()

  // Ottieni azienda_id
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return redirect('/dashboard/configurazioni/categorie-fornitore?error=Utente non autenticato')
  }

  const { data: utenteAzienda } = await supabase
    .from('utente_azienda')
    .select('azienda_id')
    .eq('user_id', userData.user.id)
    .eq('attivo', true)
    .single()

  if (!utenteAzienda) {
    return redirect('/dashboard/configurazioni/categorie-fornitore?error=Nessuna azienda associata')
  }

  const contoCostoId = formData.get('conto_costo_default_id') as string
  const categoriaData = {
    azienda_id: utenteAzienda.azienda_id,
    codice: (formData.get('codice') as string)?.toUpperCase().trim(),
    nome: (formData.get('nome') as string)?.trim(),
    descrizione: (formData.get('descrizione') as string)?.trim() || null,
    priorita: parseInt(formData.get('priorita') as string) || 0,
    colore: (formData.get('colore') as string) || '#6B7280',
    conto_costo_default_id: contoCostoId ? parseInt(contoCostoId) : null,
    attivo: formData.get('attivo') !== 'false',
  }

  // Validazione
  if (!categoriaData.codice || !categoriaData.nome) {
    return redirect('/dashboard/configurazioni/categorie-fornitore/nuovo?error=Codice e nome sono obbligatori')
  }

  const { error } = await supabase
    .from('categoria_fornitore')
    .insert([categoriaData])

  if (error) {
    console.error('Errore creazione categoria fornitore:', error)
    return redirect(`/dashboard/configurazioni/categorie-fornitore/nuovo?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/categorie-fornitore')
  redirect('/dashboard/configurazioni/categorie-fornitore?success=Categoria creata con successo')
}

// UPDATE
export async function updateCategoriaFornitore(id: number, formData: FormData) {
  const supabase = await createClient()

  const contoCostoId = formData.get('conto_costo_default_id') as string
  const categoriaData = {
    codice: (formData.get('codice') as string)?.toUpperCase().trim(),
    nome: (formData.get('nome') as string)?.trim(),
    descrizione: (formData.get('descrizione') as string)?.trim() || null,
    priorita: parseInt(formData.get('priorita') as string) || 0,
    colore: (formData.get('colore') as string) || '#6B7280',
    conto_costo_default_id: contoCostoId ? parseInt(contoCostoId) : null,
    attivo: formData.get('attivo') !== 'false',
    updated_at: new Date().toISOString(),
  }

  // Validazione
  if (!categoriaData.codice || !categoriaData.nome) {
    return redirect(`/dashboard/configurazioni/categorie-fornitore/${id}/modifica?error=Codice e nome sono obbligatori`)
  }

  const { error } = await supabase
    .from('categoria_fornitore')
    .update(categoriaData)
    .eq('id', id)

  if (error) {
    console.error('Errore aggiornamento categoria fornitore:', error)
    return redirect(`/dashboard/configurazioni/categorie-fornitore/${id}/modifica?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/categorie-fornitore')
  revalidatePath(`/dashboard/configurazioni/categorie-fornitore/${id}`)
  redirect('/dashboard/configurazioni/categorie-fornitore?success=Categoria aggiornata con successo')
}

// DELETE
export async function deleteCategoriaFornitore(id: number) {
  const supabase = await createClient()

  // Verifica se ci sono fornitori con questa categoria
  const { count } = await supabase
    .from('soggetto')
    .select('*', { count: 'exact', head: true })
    .eq('categoria_fornitore_id', id)

  if (count && count > 0) {
    return redirect(`/dashboard/configurazioni/categorie-fornitore?error=Impossibile eliminare: ci sono ${count} fornitori con questa categoria`)
  }

  const { error } = await supabase
    .from('categoria_fornitore')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Errore eliminazione categoria fornitore:', error)
    return redirect(`/dashboard/configurazioni/categorie-fornitore?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/categorie-fornitore')
  redirect('/dashboard/configurazioni/categorie-fornitore?success=Categoria eliminata con successo')
}
