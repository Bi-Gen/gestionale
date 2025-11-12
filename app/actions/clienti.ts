'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { validateClienteFormData } from '@/lib/validations/clienti'

export type Cliente = {
  id: string
  ragione_sociale: string
  partita_iva?: string
  codice_fiscale?: string
  email?: string
  telefono?: string
  indirizzo?: string
  citta?: string
  cap?: string
  provincia?: string
  note?: string
  created_at: string
  updated_at: string
}

export async function getClienti(): Promise<Cliente[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data, error } = await supabase
    .from('clienti')
    .select('*')
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
    .from('clienti')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching cliente:', error)
    return null
  }

  return data
}

export async function createCliente(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Validazione con Zod
  const validation = validateClienteFormData(formData)

  if (!validation.success) {
    const errors = validation.error.issues.map(err => err.message).join(', ')
    redirect(`/dashboard/clienti/nuovo?error=${encodeURIComponent(errors)}`)
  }

  const cliente = {
    ...validation.data,
    user_id: user.id,
  }

  const { error } = await supabase
    .from('clienti')
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

  const { error } = await supabase
    .from('clienti')
    .update(validation.data)
    .eq('id', id)
    .eq('user_id', user.id)

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
    .from('clienti')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting cliente:', error)
    redirect(`/dashboard/clienti?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/clienti')
  redirect('/dashboard/clienti?success=Cliente eliminato con successo')
}
