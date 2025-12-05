'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type Valuta = {
  id: number
  azienda_id: string
  codice: string
  nome: string
  simbolo: string
  tasso_cambio: number
  data_aggiornamento: string
  predefinita: boolean
  attiva: boolean
  created_at: string
  updated_at: string
}

// GET: Lista valute
export async function getValute() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('valuta')
    .select('*')
    .order('predefinita', { ascending: false })
    .order('nome', { ascending: true })

  if (error) {
    console.error('Errore caricamento valute:', error)
    return []
  }

  return data as Valuta[]
}

// GET: Singola valuta
export async function getValuta(id: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('valuta')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Errore caricamento valuta:', error)
    return null
  }

  return data as Valuta
}

// CREATE
export async function createValuta(formData: FormData) {
  const supabase = await createClient()

  // Ottieni azienda_id dell'utente corrente
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return redirect('/dashboard/configurazioni/valute?error=Utente non autenticato')
  }

  const { data: utenteAzienda } = await supabase
    .from('utente_azienda')
    .select('azienda_id')
    .eq('user_id', userData.user.id)
    .eq('attivo', true)
    .single()

  if (!utenteAzienda) {
    return redirect('/dashboard/configurazioni/valute?error=Nessuna azienda associata')
  }

  const valutaData = {
    azienda_id: utenteAzienda.azienda_id,
    codice: formData.get('codice') as string,
    nome: formData.get('nome') as string,
    simbolo: formData.get('simbolo') as string,
    tasso_cambio: parseFloat(formData.get('tasso_cambio') as string) || 1,
    data_aggiornamento: formData.get('data_aggiornamento') as string || new Date().toISOString().split('T')[0],
    predefinita: formData.get('predefinita') === 'true',
    attiva: formData.get('attiva') === 'true',
  }

  // Validazione base
  if (!valutaData.codice || !valutaData.nome || !valutaData.simbolo) {
    return redirect('/dashboard/configurazioni/valute?error=Codice, nome e simbolo sono obbligatori')
  }

  const { error } = await supabase
    .from('valuta')
    .insert([valutaData])

  if (error) {
    console.error('Errore creazione valuta:', error)
    return redirect(`/dashboard/configurazioni/valute?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/valute')
  redirect('/dashboard/configurazioni/valute?success=Valuta creata con successo')
}

// UPDATE
export async function updateValuta(id: number, formData: FormData) {
  const supabase = await createClient()

  const valutaData = {
    codice: formData.get('codice') as string,
    nome: formData.get('nome') as string,
    simbolo: formData.get('simbolo') as string,
    tasso_cambio: parseFloat(formData.get('tasso_cambio') as string) || 1,
    data_aggiornamento: formData.get('data_aggiornamento') as string || new Date().toISOString().split('T')[0],
    predefinita: formData.get('predefinita') === 'true',
    attiva: formData.get('attiva') === 'true',
    updated_at: new Date().toISOString(),
  }

  // Validazione base
  if (!valutaData.codice || !valutaData.nome || !valutaData.simbolo) {
    return redirect(`/dashboard/configurazioni/valute/${id}/modifica?error=Codice, nome e simbolo sono obbligatori`)
  }

  const { error } = await supabase
    .from('valuta')
    .update(valutaData)
    .eq('id', id)

  if (error) {
    console.error('Errore aggiornamento valuta:', error)
    return redirect(`/dashboard/configurazioni/valute/${id}/modifica?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/valute')
  redirect('/dashboard/configurazioni/valute?success=Valuta aggiornata con successo')
}

// DELETE
export async function deleteValuta(id: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('valuta')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Errore eliminazione valuta:', error)
    return redirect(`/dashboard/configurazioni/valute?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/valute')
  redirect('/dashboard/configurazioni/valute?success=Valuta eliminata con successo')
}
