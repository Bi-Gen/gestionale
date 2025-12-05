'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type CausaleDocumento = {
  id: number
  azienda_id: string
  codice: string
  descrizione: string
  tipo_documento: string
  tipo_operazione: 'vendita' | 'acquisto'
  segno: number
  genera_movimento_magazzino: boolean
  genera_movimento_contabile: boolean
  numerazione_separata: boolean
  attivo: boolean
  created_at: string
}

// GET: Lista causali documento
export async function getCausaliDocumento() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('causale_documento')
    .select('*')
    .order('tipo_documento', { ascending: true })
    .order('codice', { ascending: true })

  if (error) {
    console.error('Errore caricamento causali documento:', error)
    return []
  }

  return data as CausaleDocumento[]
}

// GET: Singola causale documento
export async function getCausaleDocumento(id: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('causale_documento')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Errore caricamento causale documento:', error)
    return null
  }

  return data as CausaleDocumento
}

// CREATE
export async function createCausaleDocumento(formData: FormData) {
  const supabase = await createClient()

  // Ottieni azienda_id dell'utente corrente
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return redirect('/dashboard/configurazioni/causali-documento?error=Utente non autenticato')
  }

  const { data: utenteAzienda } = await supabase
    .from('utente_azienda')
    .select('azienda_id')
    .eq('user_id', userData.user.id)
    .eq('attivo', true)
    .single()

  if (!utenteAzienda) {
    return redirect('/dashboard/configurazioni/causali-documento?error=Nessuna azienda associata')
  }

  const causaleData = {
    azienda_id: utenteAzienda.azienda_id,
    codice: formData.get('codice') as string,
    descrizione: formData.get('descrizione') as string,
    tipo_documento: formData.get('tipo_documento') as string,
    tipo_operazione: formData.get('tipo_operazione') as 'vendita' | 'acquisto',
    segno: formData.get('tipo_operazione') === 'vendita' ? 1 : -1,
    genera_movimento_magazzino: formData.get('genera_movimento_magazzino') === 'true',
    genera_movimento_contabile: formData.get('genera_movimento_contabile') === 'true',
    numerazione_separata: formData.get('numerazione_separata') === 'true',
    attivo: formData.get('attivo') === 'true',
  }

  // Validazione base
  if (!causaleData.codice || !causaleData.descrizione || !causaleData.tipo_documento) {
    return redirect('/dashboard/configurazioni/causali-documento?error=Codice, descrizione e tipo documento sono obbligatori')
  }

  const { error } = await supabase
    .from('causale_documento')
    .insert([causaleData])

  if (error) {
    console.error('Errore creazione causale documento:', error)
    return redirect(`/dashboard/configurazioni/causali-documento?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/causali-documento')
  redirect('/dashboard/configurazioni/causali-documento?success=Causale documento creata con successo')
}

// UPDATE
export async function updateCausaleDocumento(id: number, formData: FormData) {
  const supabase = await createClient()

  const causaleData = {
    codice: formData.get('codice') as string,
    descrizione: formData.get('descrizione') as string,
    tipo_documento: formData.get('tipo_documento') as string,
    tipo_operazione: formData.get('tipo_operazione') as 'vendita' | 'acquisto',
    segno: formData.get('tipo_operazione') === 'vendita' ? 1 : -1,
    genera_movimento_magazzino: formData.get('genera_movimento_magazzino') === 'true',
    genera_movimento_contabile: formData.get('genera_movimento_contabile') === 'true',
    numerazione_separata: formData.get('numerazione_separata') === 'true',
    attivo: formData.get('attivo') === 'true',
  }

  // Validazione base
  if (!causaleData.codice || !causaleData.descrizione || !causaleData.tipo_documento) {
    return redirect(`/dashboard/configurazioni/causali-documento/${id}/modifica?error=Codice, descrizione e tipo documento sono obbligatori`)
  }

  const { error } = await supabase
    .from('causale_documento')
    .update(causaleData)
    .eq('id', id)

  if (error) {
    console.error('Errore aggiornamento causale documento:', error)
    return redirect(`/dashboard/configurazioni/causali-documento/${id}/modifica?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/causali-documento')
  redirect('/dashboard/configurazioni/causali-documento?success=Causale documento aggiornata con successo')
}

// DELETE
export async function deleteCausaleDocumento(id: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('causale_documento')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Errore eliminazione causale documento:', error)
    return redirect(`/dashboard/configurazioni/causali-documento?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/causali-documento')
  redirect('/dashboard/configurazioni/causali-documento?success=Causale documento eliminata con successo')
}
