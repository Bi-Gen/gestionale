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

    const comuni = await response.json()

    let insertedRegioni = 0
    let insertedProvince = 0
    let insertedComuni = 0

    // Mappa per tenere traccia di regioni e province già inserite
    const regioniMap = new Map<string, number>()
    const provinceMap = new Map<string, number>()

    // Process comuni dal dataset
    for (const comune of comuni) {
      // 1. Inserisci/ottieni regione
      if (!regioniMap.has(comune.regione.codice)) {
        const { data: existingRegione } = await supabase
          .from('regioni')
          .select('id')
          .eq('codice', comune.regione.codice)
          .single()

        if (existingRegione) {
          regioniMap.set(comune.regione.codice, existingRegione.id)
        } else {
          const { data: newRegione, error } = await supabase
            .from('regioni')
            .insert({
              codice: comune.regione.codice,
              nome: comune.regione.nome
            })
            .select('id')
            .single()

          if (!error && newRegione) {
            regioniMap.set(comune.regione.codice, newRegione.id)
            insertedRegioni++
          }
        }
      }

      // 2. Inserisci/ottieni provincia
      const provinceKey = `${comune.provincia.codice}-${comune.provincia.nome}`
      if (!provinceMap.has(provinceKey)) {
        const { data: existingProvincia } = await supabase
          .from('province')
          .select('id')
          .eq('codice', comune.provincia.codice)
          .single()

        if (existingProvincia) {
          provinceMap.set(provinceKey, existingProvincia.id)
        } else {
          const regioneId = regioniMap.get(comune.regione.codice)
          if (regioneId) {
            const { data: newProvincia, error } = await supabase
              .from('province')
              .insert({
                codice: comune.provincia.codice,
                nome: comune.provincia.nome,
                sigla: comune.sigla,
                regione_id: regioneId
              })
              .select('id')
              .single()

            if (!error && newProvincia) {
              provinceMap.set(provinceKey, newProvincia.id)
              insertedProvince++
            }
          }
        }
      }

      // 3. Inserisci comune
      const provinciaId = provinceMap.get(provinceKey)
      if (provinciaId) {
        const { error } = await supabase
          .from('comuni')
          .upsert({
            codice: comune.codice,
            nome: comune.nome,
            provincia_id: provinciaId,
            cap: comune.cap ? comune.cap[0] : null // Prendi il primo CAP se array
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
