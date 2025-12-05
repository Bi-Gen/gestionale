'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type TipoSoggetto = {
  id: number
  codice: string
  nome: string
  descrizione?: string
  colore?: string
  icona?: string
  attivo: boolean
  di_sistema: boolean
  created_at: string
  updated_at: string
}

// GET: Lista tipi soggetto
export async function getTipiSoggetto() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tipi_soggetto')
    .select('*')
    .order('nome', { ascending: true })

  if (error) {
    console.error('Errore caricamento tipi soggetto:', error)
    return []
  }

  return data as TipoSoggetto[]
}

// GET: Singolo tipo soggetto
export async function getTipoSoggetto(id: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tipi_soggetto')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Errore caricamento tipo soggetto:', error)
    return null
  }

  return data as TipoSoggetto
}

// CREATE
export async function createTipoSoggetto(formData: FormData) {
  const supabase = await createClient()

  // Ottieni azienda_id dell'utente corrente
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return redirect('/dashboard/configurazioni/tipi-soggetto?error=Utente non autenticato')
  }

  const { data: utenteAzienda } = await supabase
    .from('utente_azienda')
    .select('azienda_id')
    .eq('user_id', userData.user.id)
    .eq('attivo', true)
    .single()

  if (!utenteAzienda) {
    return redirect('/dashboard/configurazioni/tipi-soggetto?error=Nessuna azienda associata')
  }

  const tipoData = {
    azienda_id: utenteAzienda.azienda_id,
    codice: formData.get('codice') as string,
    nome: formData.get('nome') as string,
    descrizione: formData.get('descrizione') as string || null,
    colore: formData.get('colore') as string || null,
    icona: formData.get('icona') as string || null,
    attivo: formData.get('attivo') === 'true',
  }

  // Validazione base
  if (!tipoData.codice || !tipoData.nome) {
    return redirect('/dashboard/configurazioni/tipi-soggetto?error=Codice e nome sono obbligatori')
  }

  const { error } = await supabase
    .from('tipi_soggetto')
    .insert([tipoData])

  if (error) {
    console.error('Errore creazione tipo soggetto:', error)
    return redirect(`/dashboard/configurazioni/tipi-soggetto?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/tipi-soggetto')
  redirect('/dashboard/configurazioni/tipi-soggetto?success=Tipo soggetto creato con successo')
}

// UPDATE
export async function updateTipoSoggetto(id: number, formData: FormData) {
  const supabase = await createClient()

  const tipoData = {
    codice: formData.get('codice') as string,
    nome: formData.get('nome') as string,
    descrizione: formData.get('descrizione') as string || null,
    colore: formData.get('colore') as string || null,
    icona: formData.get('icona') as string || null,
    attivo: formData.get('attivo') === 'true',
  }

  // Validazione base
  if (!tipoData.codice || !tipoData.nome) {
    return redirect(`/dashboard/configurazioni/tipi-soggetto/${id}/modifica?error=Codice e nome sono obbligatori`)
  }

  const { error } = await supabase
    .from('tipi_soggetto')
    .update(tipoData)
    .eq('id', id)

  if (error) {
    console.error('Errore aggiornamento tipo soggetto:', error)
    return redirect(`/dashboard/configurazioni/tipi-soggetto/${id}/modifica?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/tipi-soggetto')
  redirect('/dashboard/configurazioni/tipi-soggetto?success=Tipo soggetto aggiornato con successo')
}

// DELETE
export async function deleteTipoSoggetto(id: number) {
  const supabase = await createClient()

  // Verifica che non sia un tipo di sistema
  const { data: tipo } = await supabase
    .from('tipi_soggetto')
    .select('di_sistema')
    .eq('id', id)
    .single()

  if (tipo?.di_sistema) {
    return redirect('/dashboard/configurazioni/tipi-soggetto?error=Impossibile eliminare un tipo di sistema')
  }

  const { error } = await supabase
    .from('tipi_soggetto')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Errore eliminazione tipo soggetto:', error)
    return redirect(`/dashboard/configurazioni/tipi-soggetto?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/tipi-soggetto')
  redirect('/dashboard/configurazioni/tipi-soggetto?success=Tipo soggetto eliminato con successo')
}
