'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { validateProdottoFormData } from '@/lib/validations/prodotti'

export type Prodotto = {
  id: string
  codice: string
  nome: string
  descrizione?: string
  prezzo_acquisto?: number
  prezzo_vendita: number
  quantita_magazzino?: number
  unita_misura?: string
  fornitore_id?: string
  categoria?: string
  note?: string
  created_at: string
  updated_at: string
}

export async function getProdotti(): Promise<Prodotto[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data, error } = await supabase
    .from('prodotti')
    .select('*')
    .order('nome', { ascending: true })

  if (error) {
    console.error('Error fetching prodotti:', error)
    return []
  }

  return data || []
}

export async function getProdotto(id: string): Promise<Prodotto | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data, error } = await supabase
    .from('prodotti')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching prodotto:', error)
    return null
  }

  return data
}

export async function createProdotto(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const validation = validateProdottoFormData(formData)

  if (!validation.success) {
    const errors = validation.error.issues.map(err => err.message).join(', ')
    redirect(`/dashboard/prodotti/nuovo?error=${encodeURIComponent(errors)}`)
  }

  const prodotto = {
    codice: validation.data.codice,
    nome: validation.data.nome,
    descrizione: validation.data.descrizione || null,
    prezzo_acquisto: validation.data.prezzo_acquisto ? parseFloat(validation.data.prezzo_acquisto) : null,
    prezzo_vendita: parseFloat(validation.data.prezzo_vendita),
    quantita_magazzino: validation.data.quantita_magazzino ? parseInt(validation.data.quantita_magazzino) : 0,
    unita_misura: validation.data.unita_misura || 'pz',
    fornitore_id: validation.data.fornitore_id || null,
    categoria: validation.data.categoria || null,
    note: validation.data.note || null,
    user_id: user.id,
  }

  const { error } = await supabase
    .from('prodotti')
    .insert([prodotto])

  if (error) {
    console.error('Error creating prodotto:', error)
    redirect(`/dashboard/prodotti/nuovo?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/prodotti')
  redirect('/dashboard/prodotti?success=Prodotto creato con successo')
}

export async function updateProdotto(id: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const validation = validateProdottoFormData(formData)

  if (!validation.success) {
    const errors = validation.error.issues.map(err => err.message).join(', ')
    redirect(`/dashboard/prodotti/${id}/modifica?error=${encodeURIComponent(errors)}`)
  }

  const updates = {
    codice: validation.data.codice,
    nome: validation.data.nome,
    descrizione: validation.data.descrizione || null,
    prezzo_acquisto: validation.data.prezzo_acquisto ? parseFloat(validation.data.prezzo_acquisto) : null,
    prezzo_vendita: parseFloat(validation.data.prezzo_vendita),
    quantita_magazzino: validation.data.quantita_magazzino ? parseInt(validation.data.quantita_magazzino) : 0,
    unita_misura: validation.data.unita_misura || 'pz',
    fornitore_id: validation.data.fornitore_id || null,
    categoria: validation.data.categoria || null,
    note: validation.data.note || null,
  }

  const { error } = await supabase
    .from('prodotti')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating prodotto:', error)
    redirect(`/dashboard/prodotti/${id}/modifica?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/prodotti')
  redirect('/dashboard/prodotti?success=Prodotto aggiornato con successo')
}

export async function deleteProdotto(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { error } = await supabase
    .from('prodotti')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting prodotto:', error)
    redirect(`/dashboard/prodotti?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/prodotti')
  redirect('/dashboard/prodotti?success=Prodotto eliminato con successo')
}
