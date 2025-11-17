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
    // Fetch da GitHub - dataset comuni italiani aggiornato
    const response = await fetch('https://raw.githubusercontent.com/matteocontrini/comuni-json/master/comuni.json', {
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error('Failed to fetch from API')
    }

    const comuniData = await response.json()

    // Step 1: Estrai e inserisci tutte le regioni uniche (BATCH)
    const regioniUniche = new Map<string, any>()
    comuniData.forEach((c: any) => {
      if (!regioniUniche.has(c.regione.codice)) {
        regioniUniche.set(c.regione.codice, {
          codice: c.regione.codice,
          nome: c.regione.nome
        })
      }
    })

    const regioniArray = Array.from(regioniUniche.values())
    const { data: insertedRegioni } = await supabase
      .from('regioni')
      .upsert(regioniArray, { onConflict: 'codice' })
      .select('id, codice')

    // Crea mappa codice -> id per regioni
    const regioniMap = new Map<string, number>()
    insertedRegioni?.forEach((r: any) => regioniMap.set(r.codice, r.id))

    // Step 2: Estrai e inserisci tutte le province uniche (BATCH)
    const provinceUniche = new Map<string, any>()
    comuniData.forEach((c: any) => {
      if (!provinceUniche.has(c.provincia.codice)) {
        const regioneId = regioniMap.get(c.regione.codice)
        if (regioneId) {
          provinceUniche.set(c.provincia.codice, {
            codice: c.provincia.codice,
            nome: c.provincia.nome,
            sigla: c.sigla,
            regione_id: regioneId
          })
        }
      }
    })

    const provinceArray = Array.from(provinceUniche.values())
    const { data: insertedProvince } = await supabase
      .from('province')
      .upsert(provinceArray, { onConflict: 'codice' })
      .select('id, codice')

    // Crea mappa codice -> id per province
    const provinceMap = new Map<string, number>()
    insertedProvince?.forEach((p: any) => provinceMap.set(p.codice, p.id))

    // Step 3: Inserisci comuni in batch da 500
    const BATCH_SIZE = 500
    let insertedComuni = 0

    for (let i = 0; i < comuniData.length; i += BATCH_SIZE) {
      const batch = comuniData.slice(i, i + BATCH_SIZE)
      const comuniBatch = batch
        .map((c: any) => {
          const provinciaId = provinceMap.get(c.provincia.codice)
          if (!provinciaId) return null

          return {
            codice: c.codice,
            nome: c.nome,
            provincia_id: provinciaId,
            cap: Array.isArray(c.cap) ? c.cap[0] : c.cap
          }
        })
        .filter(Boolean)

      const { error, count } = await supabase
        .from('comuni')
        .upsert(comuniBatch, { onConflict: 'codice' })

      if (!error) {
        insertedComuni += count || comuniBatch.length
      }
    }

    revalidatePath('/dashboard/geografia')

    return {
      success: true,
      stats: {
        regioni: regioniArray.length,
        province: provinceArray.length,
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
