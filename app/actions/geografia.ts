'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type Regione = {
  id: number
  codice: string
  nome: string
  created_at?: string
  updated_at?: string
}

export type Provincia = {
  id: number
  codice: string
  nome: string
  sigla: string
  regione_id: number
  created_at?: string
  updated_at?: string
}

export type Comune = {
  id: number
  codice: string
  nome: string
  provincia_id: number
  cap?: string
  created_at?: string
  updated_at?: string
}

// ==================== REGIONI ====================

export async function getRegioni(): Promise<Regione[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('regioni')
    .select('*')
    .order('nome')

  if (error) {
    console.error('Error fetching regioni:', error)
    return []
  }

  return data || []
}

export async function getRegioneById(id: number): Promise<Regione | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('regioni')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching regione:', error)
    return null
  }

  return data
}

// ==================== PROVINCE ====================

export async function getProvince(): Promise<Provincia[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('province')
    .select('*')
    .order('nome')

  if (error) {
    console.error('Error fetching province:', error)
    return []
  }

  return data || []
}

export async function getProvinceByRegione(regioneId: number): Promise<Provincia[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('province')
    .select('*')
    .eq('regione_id', regioneId)
    .order('nome')

  if (error) {
    console.error('Error fetching province by regione:', error)
    return []
  }

  return data || []
}

// ==================== COMUNI ====================

export async function getComuni(): Promise<Comune[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('comuni')
    .select('*')
    .order('nome')
    .limit(100) // Limito per performance

  if (error) {
    console.error('Error fetching comuni:', error)
    return []
  }

  return data || []
}

export async function getComuniByProvincia(provinciaId: number): Promise<Comune[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('comuni')
    .select('*')
    .eq('provincia_id', provinciaId)
    .order('nome')

  if (error) {
    console.error('Error fetching comuni by provincia:', error)
    return []
  }

  return data || []
}

export async function searchComuni(query: string): Promise<Comune[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('comuni')
    .select('*')
    .ilike('nome', `%${query}%`)
    .order('nome')
    .limit(50)

  if (error) {
    console.error('Error searching comuni:', error)
    return []
  }

  return data || []
}

// ==================== SYNC FROM API ====================

export async function syncGeografiaFromAPI() {
  const supabase = await createClient()

  try {
    // Fetch data from external API (esempio con dataset italiano)
    const response = await fetch('https://axqvoqvbfjpaamphztgd.functions.supabase.co/comuni-json', {
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error('Failed to fetch from API')
    }

    const data = await response.json()

    // Process and insert data
    // Questo è un esempio - adatta in base alla struttura dell'API
    let insertedRegioni = 0
    let insertedProvince = 0
    let insertedComuni = 0

    // Inserisci regioni (esempio)
    if (data.regioni) {
      for (const regione of data.regioni) {
        const { error } = await supabase
          .from('regioni')
          .upsert({
            codice: regione.codice,
            nome: regione.nome
          }, {
            onConflict: 'codice'
          })

        if (!error) insertedRegioni++
      }
    }

    // Inserisci province
    if (data.province) {
      for (const provincia of data.province) {
        const { error } = await supabase
          .from('province')
          .upsert({
            codice: provincia.codice,
            nome: provincia.nome,
            sigla: provincia.sigla,
            regione_id: provincia.regione_id
          }, {
            onConflict: 'codice'
          })

        if (!error) insertedProvince++
      }
    }

    // Inserisci comuni
    if (data.comuni) {
      for (const comune of data.comuni) {
        const { error } = await supabase
          .from('comuni')
          .upsert({
            codice: comune.codice,
            nome: comune.nome,
            provincia_id: comune.provincia_id,
            cap: comune.cap
          }, {
            onConflict: 'codice'
          })

        if (!error) insertedComuni++
      }
    }

    revalidatePath('/dashboard/geografia')

    return {
      success: true,
      stats: {
        regioni: insertedRegioni,
        province: insertedProvince,
        comuni: insertedComuni
      }
    }
  } catch (error) {
    console.error('Error syncing geografia:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// ==================== STATS ====================

export async function getGeografiaStats() {
  const supabase = await createClient()

  const [regioni, province, comuni] = await Promise.all([
    supabase.from('regioni').select('*', { count: 'exact', head: true }),
    supabase.from('province').select('*', { count: 'exact', head: true }),
    supabase.from('comuni').select('*', { count: 'exact', head: true })
  ])

  return {
    regioni: regioni.count || 0,
    province: province.count || 0,
    comuni: comuni.count || 0
  }
}
