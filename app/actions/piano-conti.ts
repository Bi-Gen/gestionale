'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type PianoConto = {
  id: number
  azienda_id: string
  codice: string
  descrizione: string
  livello: number
  parent_id?: number
  path?: string
  tipo_conto: 'patrimoniale' | 'economico'
  natura: 'A' | 'P' | 'C' | 'R' | 'O'
  tipo_costo?: string
  conto_cliente: boolean
  conto_fornitore: boolean
  conto_banca: boolean
  conto_cassa: boolean
  attivo: boolean
  modificabile: boolean
  note?: string
  created_at: string
  updated_at: string
  // Join
  parent?: {
    id: number
    codice: string
    descrizione: string
  }
  // Conteggio figli
  children_count?: number
}

// GET: Lista piano conti (gerarchico)
export async function getPianoConti() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('piano_conti')
    .select(`
      *,
      parent:parent_id (
        id,
        codice,
        descrizione
      )
    `)
    .eq('attivo', true)
    .order('codice', { ascending: true })

  if (error) {
    console.error('Errore caricamento piano conti:', error)
    return []
  }

  return data as PianoConto[]
}

// GET: Lista piano conti per dropdown (solo livello > 1)
export async function getPianoContiDropdown(natura?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('piano_conti')
    .select('id, codice, descrizione, natura, livello, tipo_costo')
    .eq('attivo', true)
    .order('codice', { ascending: true })

  if (natura) {
    query = query.eq('natura', natura)
  }

  const { data, error } = await query

  if (error) {
    console.error('Errore caricamento piano conti dropdown:', error)
    return []
  }

  return data
}

// GET: Lista conti per calcolo codice (codice, parent_id, natura)
export async function getContiPerCodice() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('piano_conti')
    .select('codice, parent_id, natura')
    .eq('attivo', true)
    .order('codice', { ascending: true })

  if (error) {
    console.error('Errore caricamento conti per codice:', error)
    return []
  }

  return data
}

// GET: Conti parent disponibili (per select genitore)
export async function getContiParent(excludeId?: number) {
  const supabase = await createClient()

  let query = supabase
    .from('piano_conti')
    .select('id, codice, descrizione, livello, natura')
    .eq('attivo', true)
    .lt('livello', 5) // Max livello 4 può avere figli
    .order('codice', { ascending: true })

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Errore caricamento conti parent:', error)
    return []
  }

  return data
}

// GET: Singolo conto
export async function getConto(id: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('piano_conti')
    .select(`
      *,
      parent:parent_id (
        id,
        codice,
        descrizione,
        natura,
        tipo_conto
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Errore caricamento conto:', error)
    return null
  }

  return data as PianoConto
}

// CREATE
export async function createConto(formData: FormData) {
  const supabase = await createClient()

  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return redirect('/dashboard/configurazioni/piano-conti?error=Utente non autenticato')
  }

  const { data: utenteAzienda } = await supabase
    .from('utente_azienda')
    .select('azienda_id')
    .eq('user_id', userData.user.id)
    .eq('attivo', true)
    .single()

  if (!utenteAzienda) {
    return redirect('/dashboard/configurazioni/piano-conti?error=Nessuna azienda associata')
  }

  const parentId = formData.get('parent_id') as string
  const natura = formData.get('natura') as string

  // Determina livello e path
  let livello = 1
  let path = formData.get('codice') as string

  if (parentId) {
    const { data: parent } = await supabase
      .from('piano_conti')
      .select('livello, path, codice')
      .eq('id', parseInt(parentId))
      .single()

    if (parent) {
      livello = parent.livello + 1
      path = parent.path ? `${parent.path}.${formData.get('codice')}` : formData.get('codice') as string
    }
  }

  const contoData = {
    azienda_id: utenteAzienda.azienda_id,
    codice: (formData.get('codice') as string)?.trim(),
    descrizione: (formData.get('descrizione') as string)?.trim(),
    livello,
    parent_id: parentId ? parseInt(parentId) : null,
    path,
    tipo_conto: formData.get('tipo_conto') as string || 'economico',
    natura,
    tipo_costo: natura === 'C' ? (formData.get('tipo_costo') as string || null) : null,
    conto_cliente: formData.get('conto_cliente') === 'true',
    conto_fornitore: formData.get('conto_fornitore') === 'true',
    conto_banca: formData.get('conto_banca') === 'true',
    conto_cassa: formData.get('conto_cassa') === 'true',
    note: (formData.get('note') as string)?.trim() || null,
    attivo: true,
    modificabile: true,
  }

  // Validazione
  if (!contoData.codice || !contoData.descrizione) {
    return redirect('/dashboard/configurazioni/piano-conti/nuovo?error=Codice e descrizione sono obbligatori')
  }

  const { error } = await supabase
    .from('piano_conti')
    .insert([contoData])

  if (error) {
    console.error('Errore creazione conto:', error)
    return redirect(`/dashboard/configurazioni/piano-conti/nuovo?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/piano-conti')
  redirect('/dashboard/configurazioni/piano-conti?success=Conto creato con successo')
}

// UPDATE
export async function updateConto(id: number, formData: FormData) {
  const supabase = await createClient()

  // Verifica modificabilità
  const { data: existing } = await supabase
    .from('piano_conti')
    .select('modificabile')
    .eq('id', id)
    .single()

  if (existing && !existing.modificabile) {
    return redirect(`/dashboard/configurazioni/piano-conti/${id}/modifica?error=Questo conto non è modificabile`)
  }

  const natura = formData.get('natura') as string

  const contoData = {
    codice: (formData.get('codice') as string)?.trim(),
    descrizione: (formData.get('descrizione') as string)?.trim(),
    tipo_conto: formData.get('tipo_conto') as string,
    natura,
    tipo_costo: natura === 'C' ? (formData.get('tipo_costo') as string || null) : null,
    conto_cliente: formData.get('conto_cliente') === 'true',
    conto_fornitore: formData.get('conto_fornitore') === 'true',
    conto_banca: formData.get('conto_banca') === 'true',
    conto_cassa: formData.get('conto_cassa') === 'true',
    note: (formData.get('note') as string)?.trim() || null,
    updated_at: new Date().toISOString(),
  }

  if (!contoData.codice || !contoData.descrizione) {
    return redirect(`/dashboard/configurazioni/piano-conti/${id}/modifica?error=Codice e descrizione sono obbligatori`)
  }

  const { error } = await supabase
    .from('piano_conti')
    .update(contoData)
    .eq('id', id)

  if (error) {
    console.error('Errore aggiornamento conto:', error)
    return redirect(`/dashboard/configurazioni/piano-conti/${id}/modifica?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/piano-conti')
  redirect('/dashboard/configurazioni/piano-conti?success=Conto aggiornato con successo')
}

// DELETE (soft delete - disattiva)
export async function deleteConto(id: number) {
  const supabase = await createClient()

  // Verifica se ha figli
  const { count: childrenCount } = await supabase
    .from('piano_conti')
    .select('*', { count: 'exact', head: true })
    .eq('parent_id', id)
    .eq('attivo', true)

  if (childrenCount && childrenCount > 0) {
    return redirect(`/dashboard/configurazioni/piano-conti?error=Impossibile eliminare: il conto ha ${childrenCount} sottoconti`)
  }

  // Verifica se ha movimenti
  const { count: movimentiCount } = await supabase
    .from('movimento_contabile')
    .select('*', { count: 'exact', head: true })
    .eq('conto_id', id)

  if (movimentiCount && movimentiCount > 0) {
    return redirect(`/dashboard/configurazioni/piano-conti?error=Impossibile eliminare: il conto ha ${movimentiCount} movimenti contabili`)
  }

  // Verifica modificabilità
  const { data: existing } = await supabase
    .from('piano_conti')
    .select('modificabile')
    .eq('id', id)
    .single()

  if (existing && !existing.modificabile) {
    return redirect('/dashboard/configurazioni/piano-conti?error=Questo conto non è eliminabile')
  }

  // Soft delete
  const { error } = await supabase
    .from('piano_conti')
    .update({ attivo: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('Errore eliminazione conto:', error)
    return redirect(`/dashboard/configurazioni/piano-conti?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/configurazioni/piano-conti')
  redirect('/dashboard/configurazioni/piano-conti?success=Conto eliminato con successo')
}
