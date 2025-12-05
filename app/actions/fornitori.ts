'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { validateFornitoreFormData } from '@/lib/validations/fornitori'

export type Fornitore = {
  id: string
  ragione_sociale: string
  tipo_persona?: string
  partita_iva?: string
  codice_fiscale?: string
  codice_univoco?: string
  pec?: string
  email?: string
  telefono?: string
  cellulare?: string
  sito_web?: string
  indirizzo?: string
  citta?: string
  cap?: string
  provincia?: string
  paese?: string
  comune_id?: number
  provincia_id?: number
  regione_id?: number
  categoria_fornitore_id?: number
  giorni_consegna?: number
  sconto_fornitore?: number
  valuta?: string
  aliquota_iva?: number
  giorni_pagamento?: number
  iban?: string
  banca?: string
  swift_bic?: string
  referente?: string
  referente_telefono?: string
  referente_email?: string
  note?: string
  created_at: string
  updated_at: string
}

export async function getFornitori(): Promise<Fornitore[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data, error } = await supabase
    .from('soggetto')
    .select('*')
    .contains('tipo', ['fornitore'])
    .order('ragione_sociale', { ascending: true })

  if (error) {
    console.error('Error fetching fornitori:', error)
    return []
  }

  return data || []
}

export async function getFornitore(id: string): Promise<Fornitore | null> {
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
    .contains('tipo', ['fornitore'])
    .single()

  if (error) {
    console.error('Error fetching fornitore:', error)
    return null
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

export async function createFornitore(formData: FormData) {
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
  const validation = validateFornitoreFormData(formData)

  if (!validation.success) {
    const errors = validation.error.issues.map(err => err.message).join(', ')
    redirect(`/dashboard/fornitori/nuovo?error=${encodeURIComponent(errors)}`)
  }

  const fornitore = {
    azienda_id: utenteAzienda.azienda_id,
    tipo: ['fornitore'],
    ...validation.data,
    // Converti stringhe in numeri per campi numerici
    giorni_consegna: validation.data.giorni_consegna ? parseInt(validation.data.giorni_consegna) : null,
    giorni_pagamento: validation.data.giorni_pagamento ? parseInt(validation.data.giorni_pagamento) : 30,
    sconto_fornitore: validation.data.sconto_fornitore ? parseFloat(validation.data.sconto_fornitore) : null,
    aliquota_iva: validation.data.aliquota_iva ? parseFloat(validation.data.aliquota_iva) : 22.00,
  }

  const { error } = await supabase
    .from('soggetto')
    .insert([fornitore])

  if (error) {
    console.error('Error creating fornitore:', error)
    redirect(`/dashboard/fornitori/nuovo?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/fornitori')
  redirect('/dashboard/fornitori?success=Fornitore creato con successo')
}

export async function updateFornitore(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Validazione con Zod
  const validation = validateFornitoreFormData(formData)

  if (!validation.success) {
    const errors = validation.error.issues.map(err => err.message).join(', ')
    redirect(`/dashboard/fornitori/${id}/modifica?error=${encodeURIComponent(errors)}`)
  }

  const fornitore = {
    ...validation.data,
    // Converti stringhe in numeri per campi numerici
    giorni_consegna: validation.data.giorni_consegna ? parseInt(validation.data.giorni_consegna) : null,
    giorni_pagamento: validation.data.giorni_pagamento ? parseInt(validation.data.giorni_pagamento) : 30,
    sconto_fornitore: validation.data.sconto_fornitore ? parseFloat(validation.data.sconto_fornitore) : null,
    aliquota_iva: validation.data.aliquota_iva ? parseFloat(validation.data.aliquota_iva) : 22.00,
  }

  const { error } = await supabase
    .from('soggetto')
    .update(fornitore)
    .eq('id', id)
    .contains('tipo', ['fornitore'])

  if (error) {
    console.error('Error updating fornitore:', error)
    redirect(`/dashboard/fornitori/${id}/modifica?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/fornitori')
  redirect('/dashboard/fornitori?success=Fornitore aggiornato con successo')
}

export async function deleteFornitore(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { error } = await supabase
    .from('soggetto')
    .delete()
    .eq('id', id)
    .contains('tipo', ['fornitore'])

  if (error) {
    console.error('Error deleting fornitore:', error)
    redirect(`/dashboard/fornitori?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/fornitori')
  redirect('/dashboard/fornitori?success=Fornitore eliminato con successo')
}
