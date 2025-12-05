'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type Famiglia = {
  id: number
  codice: string
  nome: string
  descrizione?: string
  macrofamiglia_id?: number
  ordinamento: number
  attivo: boolean
  created_at: string
  updated_at: string
  macrofamiglia?: {
    id: number
    nome: string
  }
}

// GET: Lista famiglie
export async function getFamiglie() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('famiglie')
    .select(`
      *,
      macrofamiglia:macrofamiglie(id, nome)
    `)
    .order('ordinamento', { ascending: true })

  if (error) {
    console.error('Errore caricamento famiglie:', error)
    return []
  }

  return data as Famiglia[]
}

// GET: Singola famiglia
export async function getFamiglia(id: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('famiglie')
    .select(`
      *,
      macrofamiglia:macrofamiglie(id, nome)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Errore caricamento famiglia:', error)
    return null
  }

  return data as Famiglia
}

// CREATE
export async function createFamiglia(formData: FormData) {
  const supabase = await createClient()

  // Ottieni azienda_id dell'utente corrente
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return redirect('/dashboard/configurazioni/famiglie?error=Utente non autenticato')
  }

  const { data: utenteAzienda } = await supabase
    .from('utente_azienda')
    .select('azienda_id')
    .eq('user_id', userData.user.id)
    .eq('attivo', true)
    .single()

  if (!utenteAzienda) {
    return redirect('/dashboard/configurazioni/famiglie?error=Nessuna azienda associata')
  }

  const macrofamigliaId = formData.get('macrofamiglia_id')

  const famigliaData = {
    azienda_id: utenteAzienda.azienda_id,
    codice: formData.get('codice') as string,
    nome: formData.get('nome') as string,
    descrizione: formData.get('descrizione') as string || null,
    macrofamiglia_id: macrofamigliaId ? parseInt(macrofamigliaId as string) : null,
    ordinamento: parseInt(formData.get('ordinamento') as string) || 0,
    attivo: formData.get('attivo') === 'true',
  }

  // Validazione base
  if (!famigliaData.codice || !famigliaData.nome) {
    return redirect('/dashboard/configurazioni/famiglie?error=Codice e nome sono obbligatori')
  }

  const { error } = await supabase
    .from('famiglie')
    .insert([famigliaData])

  if (error) {
    console.error('Errore creazione famiglia:', error)
    return redirect(`/dashboard/configurazioni/famiglie?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/famiglie')
  redirect('/dashboard/configurazioni/famiglie?success=Famiglia creata con successo')
}

// UPDATE
export async function updateFamiglia(id: number, formData: FormData) {
  const supabase = await createClient()

  const macrofamigliaId = formData.get('macrofamiglia_id')

  const famigliaData = {
    codice: formData.get('codice') as string,
    nome: formData.get('nome') as string,
    descrizione: formData.get('descrizione') as string || null,
    macrofamiglia_id: macrofamigliaId ? parseInt(macrofamigliaId as string) : null,
    ordinamento: parseInt(formData.get('ordinamento') as string) || 0,
    attivo: formData.get('attivo') === 'true',
  }

  // Validazione base
  if (!famigliaData.codice || !famigliaData.nome) {
    return redirect(`/dashboard/configurazioni/famiglie/${id}/modifica?error=Codice e nome sono obbligatori`)
  }

  const { error } = await supabase
    .from('famiglie')
    .update(famigliaData)
    .eq('id', id)

  if (error) {
    console.error('Errore aggiornamento famiglia:', error)
    return redirect(`/dashboard/configurazioni/famiglie/${id}/modifica?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/famiglie')
  redirect('/dashboard/configurazioni/famiglie?success=Famiglia aggiornata con successo')
}

// DELETE
export async function deleteFamiglia(id: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('famiglie')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Errore eliminazione famiglia:', error)
    return redirect(`/dashboard/configurazioni/famiglie?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/famiglie')
  redirect('/dashboard/configurazioni/famiglie?success=Famiglia eliminata con successo')
}
