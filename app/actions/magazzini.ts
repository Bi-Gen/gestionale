'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type Magazzino = {
  id: number
  azienda_id: string
  codice: string
  nome: string
  descrizione?: string
  indirizzo?: string
  citta?: string
  provincia?: string
  cap?: string
  responsabile_id?: number
  telefono?: string
  email?: string
  principale: boolean
  gestione_ubicazioni: boolean
  attivo: boolean
  created_at: string
  updated_at: string
}

// GET: Lista magazzini
export async function getMagazzini() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('magazzino')
    .select('*')
    .order('principale', { ascending: false })
    .order('nome', { ascending: true })

  if (error) {
    console.error('Errore caricamento magazzini:', error)
    return []
  }

  return data as Magazzino[]
}

// GET: Singolo magazzino
export async function getMagazzino(id: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('magazzino')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Errore caricamento magazzino:', error)
    return null
  }

  return data as Magazzino
}

// CREATE
export async function createMagazzino(formData: FormData) {
  const supabase = await createClient()

  // Ottieni azienda_id dell'utente corrente
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return redirect('/dashboard/configurazioni/magazzini?error=Utente non autenticato')
  }

  const { data: utenteAzienda } = await supabase
    .from('utente_azienda')
    .select('azienda_id')
    .eq('user_id', userData.user.id)
    .eq('attivo', true)
    .single()

  if (!utenteAzienda) {
    return redirect('/dashboard/configurazioni/magazzini?error=Nessuna azienda associata')
  }

  const magazzinoData = {
    azienda_id: utenteAzienda.azienda_id,
    codice: formData.get('codice') as string,
    nome: formData.get('nome') as string,
    descrizione: formData.get('descrizione') as string || null,
    indirizzo: formData.get('indirizzo') as string || null,
    citta: formData.get('citta') as string || null,
    provincia: formData.get('provincia') as string || null,
    cap: formData.get('cap') as string || null,
    telefono: formData.get('telefono') as string || null,
    email: formData.get('email') as string || null,
    principale: formData.get('principale') === 'true',
    gestione_ubicazioni: formData.get('gestione_ubicazioni') === 'true',
    attivo: formData.get('attivo') === 'true',
  }

  // Validazione base
  if (!magazzinoData.codice || !magazzinoData.nome) {
    return redirect('/dashboard/configurazioni/magazzini?error=Codice e nome sono obbligatori')
  }

  const { error } = await supabase
    .from('magazzino')
    .insert([magazzinoData])

  if (error) {
    console.error('Errore creazione magazzino:', error)
    return redirect(`/dashboard/configurazioni/magazzini?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/magazzini')
  redirect('/dashboard/configurazioni/magazzini?success=Magazzino creato con successo')
}

// UPDATE
export async function updateMagazzino(id: number, formData: FormData) {
  const supabase = await createClient()

  const magazzinoData = {
    codice: formData.get('codice') as string,
    nome: formData.get('nome') as string,
    descrizione: formData.get('descrizione') as string || null,
    indirizzo: formData.get('indirizzo') as string || null,
    citta: formData.get('citta') as string || null,
    provincia: formData.get('provincia') as string || null,
    cap: formData.get('cap') as string || null,
    telefono: formData.get('telefono') as string || null,
    email: formData.get('email') as string || null,
    principale: formData.get('principale') === 'true',
    gestione_ubicazioni: formData.get('gestione_ubicazioni') === 'true',
    attivo: formData.get('attivo') === 'true',
    updated_at: new Date().toISOString(),
  }

  // Validazione base
  if (!magazzinoData.codice || !magazzinoData.nome) {
    return redirect(`/dashboard/configurazioni/magazzini/${id}/modifica?error=Codice e nome sono obbligatori`)
  }

  const { error } = await supabase
    .from('magazzino')
    .update(magazzinoData)
    .eq('id', id)

  if (error) {
    console.error('Errore aggiornamento magazzino:', error)
    return redirect(`/dashboard/configurazioni/magazzini/${id}/modifica?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/magazzini')
  redirect('/dashboard/configurazioni/magazzini?success=Magazzino aggiornato con successo')
}

// DELETE
export async function deleteMagazzino(id: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('magazzino')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Errore eliminazione magazzino:', error)
    return redirect(`/dashboard/configurazioni/magazzini?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/magazzini')
  redirect('/dashboard/configurazioni/magazzini?success=Magazzino eliminato con successo')
}
