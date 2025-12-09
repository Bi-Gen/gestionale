'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type SedeCliente = {
  id: number
  cliente_id: number
  codice?: string
  denominazione: string
  indirizzo?: string
  civico?: string
  cap?: string
  citta?: string
  provincia?: string
  paese?: string
  trasportatore_id?: number
  note_consegna?: string
  predefinito: boolean
  per_spedizione: boolean
  per_fatturazione: boolean
  attivo: boolean
  created_at: string
  updated_at: string
  trasportatore?: {
    id: number
    ragione_sociale: string
    costo_trasporto_kg?: number
  }
}

// GET: Lista sedi di un cliente
export async function getSediCliente(clienteId: number): Promise<SedeCliente[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sede_cliente')
    .select(`
      *,
      trasportatore:trasportatore_id(
        id,
        ragione_sociale,
        costo_trasporto_kg
      )
    `)
    .eq('cliente_id', clienteId)
    .eq('attivo', true)
    .order('predefinito', { ascending: false })
    .order('denominazione', { ascending: true })

  if (error) {
    console.error('Errore recupero sedi cliente:', error)
    return []
  }

  return data as SedeCliente[]
}

// GET: Singola sede
export async function getSedeCliente(id: number): Promise<SedeCliente | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sede_cliente')
    .select(`
      *,
      trasportatore:trasportatore_id(
        id,
        ragione_sociale,
        costo_trasporto_kg
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Errore recupero sede:', error)
    return null
  }

  return data as SedeCliente
}

// CREATE
export async function createSedeCliente(formData: FormData) {
  const supabase = await createClient()

  const sedeData = {
    cliente_id: parseInt(formData.get('cliente_id') as string),
    codice: formData.get('codice') as string || null,
    denominazione: formData.get('denominazione') as string,
    indirizzo: formData.get('indirizzo') as string || null,
    civico: formData.get('civico') as string || null,
    cap: formData.get('cap') as string || null,
    citta: formData.get('citta') as string || null,
    provincia: formData.get('provincia') as string || null,
    paese: formData.get('paese') as string || 'Italia',
    trasportatore_id: formData.get('trasportatore_id') ? parseInt(formData.get('trasportatore_id') as string) : null,
    note_consegna: formData.get('note_consegna') as string || null,
    predefinito: formData.get('predefinito') === 'true',
    per_spedizione: formData.get('per_spedizione') !== 'false', // default true
    per_fatturazione: formData.get('per_fatturazione') === 'true',
    attivo: true
  }

  const { data, error } = await supabase
    .from('sede_cliente')
    .insert([sedeData])
    .select()
    .single()

  if (error) {
    console.error('Errore creazione sede:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/dashboard/soggetti/${sedeData.cliente_id}/modifica`)
  return { success: true, data }
}

// UPDATE
export async function updateSedeCliente(id: number, formData: FormData) {
  const supabase = await createClient()

  const sedeData = {
    codice: formData.get('codice') as string || null,
    denominazione: formData.get('denominazione') as string,
    indirizzo: formData.get('indirizzo') as string || null,
    civico: formData.get('civico') as string || null,
    cap: formData.get('cap') as string || null,
    citta: formData.get('citta') as string || null,
    provincia: formData.get('provincia') as string || null,
    paese: formData.get('paese') as string || 'Italia',
    trasportatore_id: formData.get('trasportatore_id') ? parseInt(formData.get('trasportatore_id') as string) : null,
    note_consegna: formData.get('note_consegna') as string || null,
    predefinito: formData.get('predefinito') === 'true',
    per_spedizione: formData.get('per_spedizione') !== 'false',
    per_fatturazione: formData.get('per_fatturazione') === 'true'
  }

  const { data, error } = await supabase
    .from('sede_cliente')
    .update(sedeData)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Errore aggiornamento sede:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/dashboard/soggetti`)
  return { success: true, data }
}

// DELETE (soft delete - imposta attivo = false)
export async function deleteSedeCliente(id: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sede_cliente')
    .update({ attivo: false })
    .eq('id', id)

  if (error) {
    console.error('Errore eliminazione sede:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/dashboard/soggetti`)
  return { success: true }
}

// SET PREDEFINITO
export async function setSedeClientePredefinita(id: number, clienteId: number) {
  const supabase = await createClient()

  // Il trigger in DB gestisce automaticamente la rimozione del flag dalle altre sedi
  const { error } = await supabase
    .from('sede_cliente')
    .update({ predefinito: true })
    .eq('id', id)

  if (error) {
    console.error('Errore impostazione sede predefinita:', error)
    return { success: false, error: error.message }
  }

  revalidatePath(`/dashboard/soggetti/${clienteId}/modifica`)
  return { success: true }
}
