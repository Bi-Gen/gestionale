'use server'

import { createClient } from '@/lib/supabase/server'

export type Incoterm = {
  id: number
  codice: string
  nome: string
  descrizione?: string
  trasporto_a_carico: 'venditore' | 'compratore' | 'condiviso'
  assicurazione_a_carico: 'venditore' | 'compratore' | 'condiviso'
  dogana_export_a_carico: 'venditore' | 'compratore' | 'condiviso'
  dogana_import_a_carico: 'venditore' | 'compratore' | 'condiviso'
  ordine: number
  attivo: boolean
}

// GET: Lista incoterm attivi
export async function getIncotermsAttivi() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('incoterm')
    .select('*')
    .eq('attivo', true)
    .order('ordine', { ascending: true })

  if (error) {
    console.error('Errore recupero incoterms:', error)
    return []
  }

  return data as Incoterm[]
}

// GET: Singolo incoterm
export async function getIncoterm(id: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('incoterm')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Errore recupero incoterm:', error)
    return null
  }

  return data as Incoterm
}
