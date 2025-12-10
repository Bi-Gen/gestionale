'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type CausaleMovimento = {
  id: number
  azienda_id: string
  codice: string
  descrizione: string
  tipo: 'carico' | 'scarico'
  segno: number
  aggiorna_costo_medio: boolean
  richiede_documento: boolean
  visibile: boolean
  attivo: boolean
  di_sistema: boolean
  created_at: string
}

// GET: Lista causali movimento
export async function getCausaliMovimento() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('causale_movimento')
    .select('*')
    .order('tipo', { ascending: true })
    .order('codice', { ascending: true })

  if (error) {
    console.error('Errore caricamento causali movimento:', error)
    return []
  }

  return data as CausaleMovimento[]
}

// GET: Singola causale movimento
export async function getCausaleMovimento(id: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('causale_movimento')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Errore caricamento causale movimento:', error)
    return null
  }

  return data as CausaleMovimento
}

// CREATE
export async function createCausaleMovimento(formData: FormData) {
  const supabase = await createClient()

  // Ottieni azienda_id dell'utente corrente
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return redirect('/dashboard/configurazioni/causali-movimento?error=Utente non autenticato')
  }

  const { data: utenteAzienda } = await supabase
    .from('utente_azienda')
    .select('azienda_id')
    .eq('user_id', userData.user.id)
    .eq('attivo', true)
    .single()

  if (!utenteAzienda) {
    return redirect('/dashboard/configurazioni/causali-movimento?error=Nessuna azienda associata')
  }

  const tipo = formData.get('tipo') as 'carico' | 'scarico'

  const causaleData = {
    azienda_id: utenteAzienda.azienda_id,
    codice: formData.get('codice') as string,
    descrizione: formData.get('descrizione') as string,
    tipo: tipo,
    segno: tipo === 'carico' ? 1 : -1,
    aggiorna_costo_medio: formData.get('aggiorna_costo_medio') === 'true',
    richiede_documento: formData.get('richiede_documento') === 'true',
    visibile: formData.get('visibile') === 'true',
    attivo: formData.get('attivo') === 'true',
  }

  // Validazione base
  if (!causaleData.codice || !causaleData.descrizione || !causaleData.tipo) {
    return redirect('/dashboard/configurazioni/causali-movimento?error=Codice, descrizione e tipo sono obbligatori')
  }

  const { error } = await supabase
    .from('causale_movimento')
    .insert([causaleData])

  if (error) {
    console.error('Errore creazione causale movimento:', error)
    return redirect(`/dashboard/configurazioni/causali-movimento?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/causali-movimento')
  redirect('/dashboard/configurazioni/causali-movimento?success=Causale movimento creata con successo')
}

// UPDATE
export async function updateCausaleMovimento(id: number, formData: FormData) {
  const supabase = await createClient()

  const tipo = formData.get('tipo') as 'carico' | 'scarico'

  const causaleData = {
    codice: formData.get('codice') as string,
    descrizione: formData.get('descrizione') as string,
    tipo: tipo,
    segno: tipo === 'carico' ? 1 : -1,
    aggiorna_costo_medio: formData.get('aggiorna_costo_medio') === 'true',
    richiede_documento: formData.get('richiede_documento') === 'true',
    visibile: formData.get('visibile') === 'true',
    attivo: formData.get('attivo') === 'true',
  }

  // Validazione base
  if (!causaleData.codice || !causaleData.descrizione || !causaleData.tipo) {
    return redirect(`/dashboard/configurazioni/causali-movimento/${id}/modifica?error=Codice, descrizione e tipo sono obbligatori`)
  }

  const { error } = await supabase
    .from('causale_movimento')
    .update(causaleData)
    .eq('id', id)

  if (error) {
    console.error('Errore aggiornamento causale movimento:', error)
    return redirect(`/dashboard/configurazioni/causali-movimento/${id}/modifica?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/causali-movimento')
  redirect('/dashboard/configurazioni/causali-movimento?success=Causale movimento aggiornata con successo')
}

// DELETE
export async function deleteCausaleMovimento(id: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('causale_movimento')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Errore eliminazione causale movimento:', error)
    return redirect(`/dashboard/configurazioni/causali-movimento?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/causali-movimento')
  redirect('/dashboard/configurazioni/causali-movimento?success=Causale movimento eliminata con successo')
}
