'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { validateFornitoreFormData } from '@/lib/validations/fornitori'

export type Fornitore = {
  id: string
  ragione_sociale: string
  partita_iva?: string
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

export async function getClienti(): Promise<Fornitore[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data, error } = await supabase
    .from('fornitori')
    .select('*')
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
    .from('fornitori')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching fornitore:', error)
    return null
  }

  return data
}

export async function createFornitore(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Validazione con Zod
  const validation = validateFornitoreFormData(formData)

  if (!validation.success) {
    const errors = validation.error.issues.map(err => err.message).join(', ')
    redirect(`/dashboard/fornitori/nuovo?error=${encodeURIComponent(errors)}`)
  }

  const fornitore = {
    ...validation.data,
    user_id: user.id,
  }

  const { error } = await supabase
    .from('fornitori')
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

  const { error } = await supabase
    .from('fornitori')
    .update(validation.data)
    .eq('id', id)
    .eq('user_id', user.id)

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
    .from('fornitori')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting fornitore:', error)
    redirect(`/dashboard/fornitori?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/fornitori')
  redirect('/dashboard/fornitori?success=Fornitore eliminato con successo')
}
