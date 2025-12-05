'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { validateAgenteFormData } from '@/lib/validations/agenti'

export type Agente = {
  id: string

  // Identificazione
  codice_agente?: string

  // Dati Anagrafici
  tipo_persona: 'fisica' | 'giuridica'
  ragione_sociale: string
  nome?: string
  cognome?: string

  // Dati Fiscali
  partita_iva?: string
  codice_fiscale?: string
  codice_univoco?: string
  pec?: string

  // Contatti
  email?: string
  sito_web?: string
  telefono?: string
  cellulare?: string
  fax?: string

  // Indirizzo
  indirizzo?: string
  civico?: string
  comune_id?: number
  citta?: string
  cap?: string
  provincia?: string
  paese?: string

  // Dati Agente
  area_geografica?: string
  provvigione_percentuale?: number
  attivo_come_agente: boolean

  // Pagamenti
  giorni_pagamento?: number
  banca?: string
  iban?: string
  swift_bic?: string

  // Note
  note?: string

  // Statistiche (da vista)
  numero_clienti?: number
  fido_totale_clienti?: number

  // Dati geografici (da JOIN)
  comuni?: {
    id: number
    nome: string
    cap: string
    provincia_id: number
    province?: {
      id: number
      nome: string
      sigla: string
      regione_id: number
      regioni?: {
        id: number
        nome: string
      }
    }
  }

  created_at: string
  updated_at: string
}

export async function getAgenti(): Promise<Agente[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Usa la vista con statistiche per la lista
  const { data, error } = await supabase
    .from('vista_agenti')
    .select('*')
    .order('ragione_sociale', { ascending: true })

  if (error) {
    console.error('Error fetching agenti:', error)
    return []
  }

  return data || []
}

export async function getAgentiAttivi(): Promise<Agente[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Solo agenti attivi per dropdown selezione
  const { data, error } = await supabase
    .from('soggetto')
    .select('id, codice_agente, ragione_sociale, nome, cognome, area_geografica, provvigione_percentuale')
    .contains('tipo', ['agente'])
    .eq('attivo_come_agente', true)
    .order('ragione_sociale', { ascending: true })

  if (error) {
    console.error('Error fetching agenti attivi:', error)
    return []
  }

  return data || []
}

export async function getAgente(id: string): Promise<Agente | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data, error } = await supabase
    .from('soggetto')
    .select(`
      *,
      comuni:comune_id (
        id,
        nome,
        cap,
        provincia_id,
        province:provincia_id (
          id,
          nome,
          sigla,
          regione_id,
          regioni:regione_id (
            id,
            nome
          )
        )
      )
    `)
    .eq('id', id)
    .contains('tipo', ['agente'])
    .single()

  if (error) {
    console.error('Error fetching agente:', error)
    return null
  }

  return data
}

export async function createAgente(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get azienda_id from utente_azienda
  const { data: utenteAzienda } = await supabase
    .from('utente_azienda')
    .select('azienda_id')
    .eq('user_id', user.id)
    .single()

  if (!utenteAzienda) {
    redirect('/login?error=Nessuna azienda associata')
  }

  // Validazione con Zod
  const validation = validateAgenteFormData(formData)

  if (!validation.success) {
    const errors = validation.error.issues.map(err => err.message).join(', ')
    redirect(`/dashboard/agenti/nuovo?error=${encodeURIComponent(errors)}`)
  }

  const agente = {
    azienda_id: utenteAzienda.azienda_id,
    tipo: ['agente'],
    ...validation.data,
    // Converti stringhe in numeri per campi numerici
    provvigione_percentuale: validation.data.provvigione_percentuale
      ? parseFloat(validation.data.provvigione_percentuale)
      : null,
    giorni_pagamento: validation.data.giorni_pagamento
      ? parseInt(validation.data.giorni_pagamento)
      : 30,
    comune_id: validation.data.comune_id
      ? parseInt(validation.data.comune_id)
      : null,
  }

  const { error } = await supabase
    .from('soggetto')
    .insert([agente])

  if (error) {
    console.error('Error creating agente:', error)
    redirect(`/dashboard/agenti/nuovo?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/agenti')
  redirect('/dashboard/agenti?success=Agente creato con successo')
}

export async function updateAgente(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Validazione con Zod
  const validation = validateAgenteFormData(formData)

  if (!validation.success) {
    const errors = validation.error.issues.map(err => err.message).join(', ')
    redirect(`/dashboard/agenti/${id}/modifica?error=${encodeURIComponent(errors)}`)
  }

  const updates = {
    ...validation.data,
    // Converti stringhe in numeri per campi numerici
    provvigione_percentuale: validation.data.provvigione_percentuale
      ? parseFloat(validation.data.provvigione_percentuale)
      : null,
    giorni_pagamento: validation.data.giorni_pagamento
      ? parseInt(validation.data.giorni_pagamento)
      : 30,
    comune_id: validation.data.comune_id
      ? parseInt(validation.data.comune_id)
      : null,
  }

  const { error } = await supabase
    .from('soggetto')
    .update(updates)
    .eq('id', id)
    .contains('tipo', ['agente'])

  if (error) {
    console.error('Error updating agente:', error)
    redirect(`/dashboard/agenti/${id}/modifica?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/agenti')
  redirect('/dashboard/agenti?success=Agente aggiornato con successo')
}

export async function deleteAgente(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verifica se ci sono clienti assegnati a questo agente
  const { data: clientiAssegnati } = await supabase
    .from('soggetto')
    .select('id')
    .eq('agente_id', id)
    .limit(1)

  if (clientiAssegnati && clientiAssegnati.length > 0) {
    redirect(`/dashboard/agenti?error=${encodeURIComponent('Impossibile eliminare: ci sono clienti assegnati a questo agente')}`)
  }

  const { error } = await supabase
    .from('soggetto')
    .delete()
    .eq('id', id)
    .contains('tipo', ['agente'])

  if (error) {
    console.error('Error deleting agente:', error)
    redirect(`/dashboard/agenti?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/agenti')
  redirect('/dashboard/agenti?success=Agente eliminato con successo')
}
