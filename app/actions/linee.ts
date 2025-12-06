'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type LineaProdotto = {
  id: number
  codice: string
  nome: string
  descrizione?: string
  ordinamento: number
  attivo: boolean
  created_at: string
  updated_at: string
}

// GET: Lista linee prodotto
export async function getLinee() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('linee_prodotto')
    .select('*')
    .eq('attivo', true)
    .order('ordinamento', { ascending: true })

  if (error) {
    console.error('Errore caricamento linee:', error)
    return []
  }

  return data as LineaProdotto[]
}

// GET: Singola linea
export async function getLinea(id: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('linee_prodotto')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Errore caricamento linea:', error)
    return null
  }

  return data as LineaProdotto
}

// CREATE
export async function createLinea(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: utenteAzienda } = await supabase
    .from('utente_azienda')
    .select('azienda_id')
    .eq('user_id', user.id)
    .single()

  if (!utenteAzienda) {
    redirect('/login?error=Nessuna azienda associata')
  }

  const linea = {
    azienda_id: utenteAzienda.azienda_id,
    codice: formData.get('codice') as string,
    nome: formData.get('nome') as string,
    descrizione: (formData.get('descrizione') as string) || null,
    ordinamento: parseInt(formData.get('ordinamento') as string) || 0,
    attivo: formData.get('attivo') === 'on',
  }

  const { error } = await supabase
    .from('linee_prodotto')
    .insert([linea])

  if (error) {
    console.error('Errore creazione linea:', error)
    redirect(`/dashboard/configurazioni/linee/nuovo?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/linee')
  redirect('/dashboard/configurazioni/linee?success=Linea creata con successo')
}

// UPDATE
export async function updateLinea(id: number, formData: FormData) {
  const supabase = await createClient()

  const updates = {
    codice: formData.get('codice') as string,
    nome: formData.get('nome') as string,
    descrizione: (formData.get('descrizione') as string) || null,
    ordinamento: parseInt(formData.get('ordinamento') as string) || 0,
    attivo: formData.get('attivo') === 'on',
  }

  const { error } = await supabase
    .from('linee_prodotto')
    .update(updates)
    .eq('id', id)

  if (error) {
    console.error('Errore aggiornamento linea:', error)
    redirect(`/dashboard/configurazioni/linee/${id}/modifica?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/linee')
  redirect('/dashboard/configurazioni/linee?success=Linea aggiornata con successo')
}

// DELETE
export async function deleteLinea(id: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('linee_prodotto')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Errore eliminazione linea:', error)
    redirect(`/dashboard/configurazioni/linee?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/linee')
  redirect('/dashboard/configurazioni/linee?success=Linea eliminata con successo')
}
