'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AliquotaIva = {
  id: number
  codice: string
  descrizione: string
  percentuale: number
  predefinita: boolean
  attiva: boolean
  created_at: string
}

// GET: Lista aliquote IVA
export async function getAliquoteIva() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('aliquota_iva')
    .select('*')
    .order('percentuale', { ascending: false })

  if (error) {
    console.error('Errore caricamento aliquote IVA:', error)
    return []
  }

  return data as AliquotaIva[]
}

// GET: Singola aliquota IVA
export async function getAliquotaIva(id: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('aliquota_iva')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Errore caricamento aliquota IVA:', error)
    return null
  }

  return data as AliquotaIva
}

// CREATE
export async function createAliquotaIva(formData: FormData) {
  const supabase = await createClient()

  // Ottieni azienda_id dell'utente corrente
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return redirect('/dashboard/configurazioni/codici-iva?error=Utente non autenticato')
  }

  const { data: utenteAzienda } = await supabase
    .from('utente_azienda')
    .select('azienda_id')
    .eq('user_id', userData.user.id)
    .eq('attivo', true)
    .single()

  if (!utenteAzienda) {
    return redirect('/dashboard/configurazioni/codici-iva?error=Nessuna azienda associata')
  }

  const aliquotaData = {
    azienda_id: utenteAzienda.azienda_id,
    codice: formData.get('codice') as string,
    descrizione: formData.get('descrizione') as string,
    percentuale: parseFloat(formData.get('percentuale') as string),
    predefinita: formData.get('predefinita') === 'true',
    attiva: formData.get('attiva') === 'true',
  }

  // Validazione base
  if (!aliquotaData.codice || !aliquotaData.descrizione) {
    return redirect('/dashboard/configurazioni/codici-iva?error=Codice e descrizione sono obbligatori')
  }

  if (isNaN(aliquotaData.percentuale)) {
    return redirect('/dashboard/configurazioni/codici-iva?error=Percentuale non valida')
  }

  const { error } = await supabase
    .from('aliquota_iva')
    .insert([aliquotaData])

  if (error) {
    console.error('Errore creazione aliquota IVA:', error)
    return redirect(`/dashboard/configurazioni/codici-iva?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/codici-iva')
  redirect('/dashboard/configurazioni/codici-iva?success=Aliquota IVA creata con successo')
}

// UPDATE
export async function updateAliquotaIva(id: number, formData: FormData) {
  const supabase = await createClient()

  const aliquotaData = {
    codice: formData.get('codice') as string,
    descrizione: formData.get('descrizione') as string,
    percentuale: parseFloat(formData.get('percentuale') as string),
    predefinita: formData.get('predefinita') === 'true',
    attiva: formData.get('attiva') === 'true',
  }

  // Validazione base
  if (!aliquotaData.codice || !aliquotaData.descrizione) {
    return redirect(`/dashboard/configurazioni/codici-iva/${id}/modifica?error=Codice e descrizione sono obbligatori`)
  }

  if (isNaN(aliquotaData.percentuale)) {
    return redirect(`/dashboard/configurazioni/codici-iva/${id}/modifica?error=Percentuale non valida`)
  }

  const { error } = await supabase
    .from('aliquota_iva')
    .update(aliquotaData)
    .eq('id', id)

  if (error) {
    console.error('Errore aggiornamento aliquota IVA:', error)
    return redirect(`/dashboard/configurazioni/codici-iva/${id}/modifica?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/codici-iva')
  redirect('/dashboard/configurazioni/codici-iva?success=Aliquota IVA aggiornata con successo')
}

// DELETE
export async function deleteAliquotaIva(id: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('aliquota_iva')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Errore eliminazione aliquota IVA:', error)
    return redirect(`/dashboard/configurazioni/codici-iva?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/codici-iva')
  redirect('/dashboard/configurazioni/codici-iva?success=Aliquota IVA eliminata con successo')
}
