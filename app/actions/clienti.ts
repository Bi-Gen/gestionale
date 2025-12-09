'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { validateClienteFormData } from '@/lib/validations/clienti'

export type Cliente = {
  id: string
  ragione_sociale: string
  tipo_persona?: string
  nome?: string
  cognome?: string
  partita_iva?: string
  codice_fiscale?: string
  codice_univoco?: string
  pec?: string
  email?: string
  sito_web?: string
  telefono?: string
  cellulare?: string
  fax?: string
  indirizzo?: string
  civico?: string
  citta?: string
  cap?: string
  provincia?: string
  paese?: string
  comune_id?: number
  provincia_id?: number
  regione_id?: number
  categoria_cliente?: string
  categoria_cliente_id?: number
  listino_id?: number
  zona_vendita?: string
  sconto_percentuale?: number
  fido_massimo?: number
  agente_id?: string
  valuta?: string
  aliquota_iva?: number
  giorni_pagamento?: number
  banca?: string
  iban?: string
  swift_bic?: string
  referente?: string
  referente_telefono?: string
  referente_email?: string
  note?: string
  // Trasporto
  trasportatore_id?: number
  incoterm_default_id?: number
  // Pagamento
  metodo_pagamento_id?: number
  created_at: string
  updated_at: string
  agente?: {
    id: string
    codice_agente?: string
    ragione_sociale: string
    email?: string
  }
  trasportatore?: {
    id: number
    ragione_sociale: string
    costo_trasporto_kg?: number
    peso_minimo_fatturabile?: number
    costo_minimo_trasporto?: number
  }
  incoterm?: {
    id: number
    codice: string
    nome: string
    trasporto_a_carico: 'venditore' | 'compratore' | 'condiviso'
  }
  metodo_pagamento?: {
    id: number
    codice: string
    nome: string
    giorni_scadenza?: number
  }
  sedi?: Array<{
    id: number
    codice?: string
    denominazione: string
    indirizzo?: string
    civico?: string
    cap?: string
    citta?: string
    provincia?: string
    trasportatore_id?: number
    predefinito: boolean
    per_spedizione: boolean
    per_fatturazione: boolean
    trasportatore?: {
      id: number
      ragione_sociale: string
      costo_trasporto_kg?: number
    }
  }>
}

export async function getClienti(): Promise<Cliente[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Query clienti con relazioni base e sedi
  const { data, error } = await supabase
    .from('soggetto')
    .select(`
      *,
      trasportatore:trasportatore_id(
        id,
        ragione_sociale,
        costo_trasporto_kg,
        peso_minimo_fatturabile,
        costo_minimo_trasporto
      ),
      incoterm:incoterm_default_id(
        id,
        codice,
        nome,
        trasporto_a_carico
      ),
      metodo_pagamento:metodo_pagamento_id(
        id,
        codice,
        nome,
        giorni_scadenza
      ),
      sedi:sede_cliente(
        id,
        codice,
        denominazione,
        indirizzo,
        civico,
        cap,
        citta,
        provincia,
        trasportatore_id,
        predefinito,
        per_spedizione,
        per_fatturazione,
        trasportatore:trasportatore_id(
          id,
          ragione_sociale,
          costo_trasporto_kg
        )
      )
    `)
    .contains('tipo', ['cliente'])
    .order('ragione_sociale', { ascending: true })

  if (error) {
    console.error('Error fetching clienti:', error)
    return []
  }

  return data || []
}

export async function getCliente(id: string): Promise<Cliente | null> {
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
        provincia_id,
        province:provincia_id (
          id,
          nome,
          sigla,
          regione_id
        )
      )
    `)
    .eq('id', id)
    .contains('tipo', ['cliente'])
    .single()

  if (error) {
    console.error('Error fetching cliente:', error)
    return null
  }

  // Se il cliente ha un agente assegnato, recuperalo separatamente
  if (data && data.agente_id) {
    const { data: agenteData } = await supabase
      .from('soggetto')
      .select('id, codice_agente, ragione_sociale, email')
      .eq('id', data.agente_id)
      .contains('tipo', ['agente'])
      .single()

    if (agenteData) {
      data.agente = agenteData
    }
  }

  // Estrai i dati geografici se presenti
  if (data && data.comuni) {
    return {
      ...data,
      regione_id: data.comuni.province?.regione_id,
      provincia_id: data.comuni.provincia_id,
      comune_id: data.comuni.id,
    }
  }

  return data
}

export async function createCliente(formData: FormData) {
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
  const validation = validateClienteFormData(formData)

  if (!validation.success) {
    const errors = validation.error.issues.map(err => err.message).join(', ')
    redirect(`/dashboard/clienti/nuovo?error=${encodeURIComponent(errors)}`)
  }

  const cliente = {
    azienda_id: utenteAzienda.azienda_id,
    tipo: ['cliente'],
    ...validation.data,
    // Converti stringhe in numeri per campi numerici
    sconto_percentuale: validation.data.sconto_percentuale ? parseFloat(validation.data.sconto_percentuale) : null,
    fido_massimo: validation.data.fido_massimo ? parseFloat(validation.data.fido_massimo) : null,
    aliquota_iva: validation.data.aliquota_iva ? parseFloat(validation.data.aliquota_iva) : 22.00,
    giorni_pagamento: validation.data.giorni_pagamento ? parseInt(validation.data.giorni_pagamento) : 30,
    comune_id: validation.data.comune_id ? parseInt(validation.data.comune_id) : null,
    categoria_cliente_id: validation.data.categoria_cliente_id ? parseInt(validation.data.categoria_cliente_id) : null,
    listino_id: validation.data.listino_id ? parseInt(validation.data.listino_id) : null,
  }

  const { error } = await supabase
    .from('soggetto')
    .insert([cliente])

  if (error) {
    console.error('Error creating cliente:', error)
    redirect(`/dashboard/clienti/nuovo?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/clienti')
  redirect('/dashboard/clienti?success=Cliente creato con successo')
}

export async function updateCliente(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Validazione con Zod
  const validation = validateClienteFormData(formData)

  if (!validation.success) {
    const errors = validation.error.issues.map(err => err.message).join(', ')
    redirect(`/dashboard/clienti/${id}/modifica?error=${encodeURIComponent(errors)}`)
  }

  const updates = {
    ...validation.data,
    // Converti stringhe in numeri per campi numerici
    sconto_percentuale: validation.data.sconto_percentuale ? parseFloat(validation.data.sconto_percentuale) : null,
    fido_massimo: validation.data.fido_massimo ? parseFloat(validation.data.fido_massimo) : null,
    aliquota_iva: validation.data.aliquota_iva ? parseFloat(validation.data.aliquota_iva) : 22.00,
    giorni_pagamento: validation.data.giorni_pagamento ? parseInt(validation.data.giorni_pagamento) : 30,
    comune_id: validation.data.comune_id ? parseInt(validation.data.comune_id) : null,
    categoria_cliente_id: validation.data.categoria_cliente_id ? parseInt(validation.data.categoria_cliente_id) : null,
    listino_id: validation.data.listino_id ? parseInt(validation.data.listino_id) : null,
  }

  const { error } = await supabase
    .from('soggetto')
    .update(updates)
    .eq('id', id)
    .contains('tipo', ['cliente'])

  if (error) {
    console.error('Error updating cliente:', error)
    redirect(`/dashboard/clienti/${id}/modifica?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/clienti')
  redirect('/dashboard/clienti?success=Cliente aggiornato con successo')
}

export async function deleteCliente(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { error } = await supabase
    .from('soggetto')
    .delete()
    .eq('id', id)
    .contains('tipo', ['cliente'])

  if (error) {
    console.error('Error deleting cliente:', error)
    redirect(`/dashboard/clienti?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/clienti')
  redirect('/dashboard/clienti?success=Cliente eliminato con successo')
}
