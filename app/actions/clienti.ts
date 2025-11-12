'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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

  const cliente = {
    ragione_sociale: formData.get('ragione_sociale') as string,
    partita_iva: formData.get('partita_iva') as string || null,
    codice_fiscale: formData.get('codice_fiscale') as string || null,
    email: formData.get('email') as string || null,
    telefono: formData.get('telefono') as string || null,
    indirizzo: formData.get('indirizzo') as string || null,
    citta: formData.get('citta') as string || null,
    cap: formData.get('cap') as string || null,
    provincia: formData.get('provincia') as string || null,
    note: formData.get('note') as string || null,
    user_id: user.id,
  }

  const { error } = await supabase
    .from('clienti')
    .insert([cliente])

  if (error) {
    console.error('Error creating cliente:', error)
    redirect(`/dashboard/clienti?error=${encodeURIComponent(error.message)}`)
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

  const updates = {
    ragione_sociale: formData.get('ragione_sociale') as string,
    partita_iva: formData.get('partita_iva') as string || null,
    codice_fiscale: formData.get('codice_fiscale') as string || null,
    email: formData.get('email') as string || null,
    telefono: formData.get('telefono') as string || null,
    indirizzo: formData.get('indirizzo') as string || null,
    citta: formData.get('citta') as string || null,
    cap: formData.get('cap') as string || null,
    provincia: formData.get('provincia') as string || null,
    note: formData.get('note') as string || null,
  }

  const { error } = await supabase
    .from('clienti')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating cliente:', error)
    redirect(`/dashboard/clienti?error=${encodeURIComponent(error.message)}`)
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
