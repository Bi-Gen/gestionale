'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type MetodoPagamento = {
  id: number
  codice: string
  nome: string
  descrizione?: string
  tipo?: string
  giorni_scadenza: number
  richiede_iban: boolean
  predefinito: boolean
  attivo: boolean
  created_at: string
}

// GET: Lista metodi pagamento attivi (per select)
export async function getMetodiPagamentoAttivi() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('metodo_pagamento')
    .select('*')
    .eq('attivo', true)
    .order('predefinito', { ascending: false })
    .order('nome', { ascending: true })

  if (error) {
    console.error('Errore caricamento metodi pagamento:', error)
    return []
  }

  return data as MetodoPagamento[]
}

// GET: Lista metodi pagamento
export async function getMetodiPagamento() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('metodo_pagamento')
    .select('*')
    .order('predefinito', { ascending: false })
    .order('nome', { ascending: true })

  if (error) {
    console.error('Errore caricamento metodi pagamento:', error)
    return []
  }

  return data as MetodoPagamento[]
}

// GET: Singolo metodo pagamento
export async function getMetodoPagamento(id: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('metodo_pagamento')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Errore caricamento metodo pagamento:', error)
    return null
  }

  return data as MetodoPagamento
}

// CREATE
export async function createMetodoPagamento(formData: FormData) {
  const supabase = await createClient()

  // Ottieni azienda_id dell'utente corrente
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return redirect('/dashboard/configurazioni/codici-pagamento?error=Utente non autenticato')
  }

  const { data: utenteAzienda } = await supabase
    .from('utente_azienda')
    .select('azienda_id')
    .eq('user_id', userData.user.id)
    .eq('attivo', true)
    .single()

  if (!utenteAzienda) {
    return redirect('/dashboard/configurazioni/codici-pagamento?error=Nessuna azienda associata')
  }

  const metodoPagamentoData = {
    azienda_id: utenteAzienda.azienda_id,
    codice: formData.get('codice') as string,
    nome: formData.get('nome') as string,
    descrizione: formData.get('descrizione') as string || null,
    tipo: formData.get('tipo') as string || null,
    giorni_scadenza: parseInt(formData.get('giorni_scadenza') as string) || 0,
    richiede_iban: formData.get('richiede_iban') === 'true',
    predefinito: formData.get('predefinito') === 'true',
    attivo: formData.get('attivo') === 'true',
  }

  // Validazione base
  if (!metodoPagamentoData.codice || !metodoPagamentoData.nome) {
    return redirect('/dashboard/configurazioni/codici-pagamento?error=Codice e nome sono obbligatori')
  }

  const { error } = await supabase
    .from('metodo_pagamento')
    .insert([metodoPagamentoData])

  if (error) {
    console.error('Errore creazione metodo pagamento:', error)
    return redirect(`/dashboard/configurazioni/codici-pagamento?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/codici-pagamento')
  redirect('/dashboard/configurazioni/codici-pagamento?success=Metodo pagamento creato con successo')
}

// UPDATE
export async function updateMetodoPagamento(id: number, formData: FormData) {
  const supabase = await createClient()

  const metodoPagamentoData = {
    codice: formData.get('codice') as string,
    nome: formData.get('nome') as string,
    descrizione: formData.get('descrizione') as string || null,
    tipo: formData.get('tipo') as string || null,
    giorni_scadenza: parseInt(formData.get('giorni_scadenza') as string) || 0,
    richiede_iban: formData.get('richiede_iban') === 'true',
    predefinito: formData.get('predefinito') === 'true',
    attivo: formData.get('attivo') === 'true',
  }

  // Validazione base
  if (!metodoPagamentoData.codice || !metodoPagamentoData.nome) {
    return redirect(`/dashboard/configurazioni/codici-pagamento/${id}/modifica?error=Codice e nome sono obbligatori`)
  }

  const { error } = await supabase
    .from('metodo_pagamento')
    .update(metodoPagamentoData)
    .eq('id', id)

  if (error) {
    console.error('Errore aggiornamento metodo pagamento:', error)
    return redirect(`/dashboard/configurazioni/codici-pagamento/${id}/modifica?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/codici-pagamento')
  redirect('/dashboard/configurazioni/codici-pagamento?success=Metodo pagamento aggiornato con successo')
}

// DELETE
export async function deleteMetodoPagamento(id: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('metodo_pagamento')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Errore eliminazione metodo pagamento:', error)
    return redirect(`/dashboard/configurazioni/codici-pagamento?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/codici-pagamento')
  redirect('/dashboard/configurazioni/codici-pagamento?success=Metodo pagamento eliminato con successo')
}
