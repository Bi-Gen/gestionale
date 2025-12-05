'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type Macrofamiglia = {
  id: number
  codice: string
  nome: string
  descrizione?: string
  ordinamento: number
  attivo: boolean
  created_at: string
  updated_at: string
}

// GET: Lista macrofamiglie
export async function getMacrofamiglie() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('macrofamiglie')
    .select('*')
    .order('ordinamento', { ascending: true })

  if (error) {
    console.error('Errore caricamento macrofamiglie:', error)
    return []
  }

  return data as Macrofamiglia[]
}

// GET: Singola macrofamiglia
export async function getMacrofamiglia(id: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('macrofamiglie')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Errore caricamento macrofamiglia:', error)
    return null
  }

  return data as Macrofamiglia
}

// CREATE
export async function createMacrofamiglia(formData: FormData) {
  const supabase = await createClient()

  // Ottieni azienda_id dell'utente corrente
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return redirect('/dashboard/configurazioni/macrofamiglie?error=Utente non autenticato')
  }

  const { data: utenteAzienda } = await supabase
    .from('utente_azienda')
    .select('azienda_id')
    .eq('user_id', userData.user.id)
    .eq('attivo', true)
    .single()

  if (!utenteAzienda) {
    return redirect('/dashboard/configurazioni/macrofamiglie?error=Nessuna azienda associata')
  }

  const macrofamigliaData = {
    azienda_id: utenteAzienda.azienda_id,
    codice: formData.get('codice') as string,
    nome: formData.get('nome') as string,
    descrizione: formData.get('descrizione') as string || null,
    ordinamento: parseInt(formData.get('ordinamento') as string) || 0,
    attivo: formData.get('attivo') === 'true',
  }

  // Validazione base
  if (!macrofamigliaData.codice || !macrofamigliaData.nome) {
    return redirect('/dashboard/configurazioni/macrofamiglie?error=Codice e nome sono obbligatori')
  }

  const { error } = await supabase
    .from('macrofamiglie')
    .insert([macrofamigliaData])

  if (error) {
    console.error('Errore creazione macrofamiglia:', error)
    return redirect(`/dashboard/configurazioni/macrofamiglie?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/macrofamiglie')
  redirect('/dashboard/configurazioni/macrofamiglie?success=Macrofamiglia creata con successo')
}

// UPDATE
export async function updateMacrofamiglia(id: number, formData: FormData) {
  const supabase = await createClient()

  const macrofamigliaData = {
    codice: formData.get('codice') as string,
    nome: formData.get('nome') as string,
    descrizione: formData.get('descrizione') as string || null,
    ordinamento: parseInt(formData.get('ordinamento') as string) || 0,
    attivo: formData.get('attivo') === 'true',
  }

  // Validazione base
  if (!macrofamigliaData.codice || !macrofamigliaData.nome) {
    return redirect(`/dashboard/configurazioni/macrofamiglie/${id}/modifica?error=Codice e nome sono obbligatori`)
  }

  const { error } = await supabase
    .from('macrofamiglie')
    .update(macrofamigliaData)
    .eq('id', id)

  if (error) {
    console.error('Errore aggiornamento macrofamiglia:', error)
    return redirect(`/dashboard/configurazioni/macrofamiglie/${id}/modifica?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/macrofamiglie')
  redirect('/dashboard/configurazioni/macrofamiglie?success=Macrofamiglia aggiornata con successo')
}

// DELETE
export async function deleteMacrofamiglia(id: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('macrofamiglie')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Errore eliminazione macrofamiglia:', error)
    return redirect(`/dashboard/configurazioni/macrofamiglie?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/macrofamiglie')
  redirect('/dashboard/configurazioni/macrofamiglie?success=Macrofamiglia eliminata con successo')
}
