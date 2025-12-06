'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// Tipo di risposta standard per quick create
export type QuickCreateResult<T> = {
  success: boolean
  data?: T
  error?: string
}

// Helper per ottenere azienda_id dell'utente
async function getAziendaId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: utenteAzienda } = await supabase
    .from('utente_azienda')
    .select('azienda_id')
    .eq('user_id', user.id)
    .single()

  return utenteAzienda?.azienda_id || null
}

// =====================================================
// MACROFAMIGLIA
// =====================================================
export async function quickCreateMacrofamiglia(formData: FormData): Promise<QuickCreateResult<{ id: number; codice: string; nome: string }>> {
  const supabase = await createClient()
  const aziendaId = await getAziendaId()

  console.log('quickCreateMacrofamiglia - aziendaId:', aziendaId)

  if (!aziendaId) {
    return { success: false, error: 'Utente non autenticato' }
  }

  const codice = formData.get('codice') as string
  const nome = formData.get('nome') as string

  console.log('quickCreateMacrofamiglia - codice:', codice, 'nome:', nome)

  if (!codice || !nome) {
    return { success: false, error: 'Codice e nome sono obbligatori' }
  }

  const insertData = { azienda_id: aziendaId, codice, nome, attivo: true }
  console.log('quickCreateMacrofamiglia - inserting:', insertData)

  const { data, error } = await supabase
    .from('macrofamiglie')
    .insert([insertData])
    .select('id, codice, nome')
    .single()

  console.log('quickCreateMacrofamiglia - result:', { data, error })

  if (error) {
    console.error('Errore creazione macrofamiglia:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/configurazioni/macrofamiglie')
  return { success: true, data }
}

// =====================================================
// FAMIGLIA
// =====================================================
export async function quickCreateFamiglia(formData: FormData): Promise<QuickCreateResult<{ id: number; codice: string; nome: string; macrofamiglia_id: number }>> {
  const supabase = await createClient()
  const aziendaId = await getAziendaId()

  if (!aziendaId) {
    return { success: false, error: 'Utente non autenticato' }
  }

  const codice = formData.get('codice') as string
  const nome = formData.get('nome') as string
  const macrofamigliaId = formData.get('macrofamiglia_id') as string

  if (!codice || !nome) {
    return { success: false, error: 'Codice e nome sono obbligatori' }
  }

  const insertData: Record<string, unknown> = {
    azienda_id: aziendaId,
    codice,
    nome,
    attivo: true
  }

  if (macrofamigliaId) {
    insertData.macrofamiglia_id = parseInt(macrofamigliaId)
  }

  const { data, error } = await supabase
    .from('famiglie')
    .insert([insertData])
    .select('id, codice, nome, macrofamiglia_id')
    .single()

  if (error) {
    console.error('Errore creazione famiglia:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/configurazioni/famiglie')
  return { success: true, data }
}

// =====================================================
// LINEA PRODOTTO
// =====================================================
export async function quickCreateLinea(formData: FormData): Promise<QuickCreateResult<{ id: number; codice: string; nome: string }>> {
  const supabase = await createClient()
  const aziendaId = await getAziendaId()

  if (!aziendaId) {
    return { success: false, error: 'Utente non autenticato' }
  }

  const codice = formData.get('codice') as string
  const nome = formData.get('nome') as string

  if (!codice || !nome) {
    return { success: false, error: 'Codice e nome sono obbligatori' }
  }

  const { data, error } = await supabase
    .from('linee_prodotto')
    .insert([{ azienda_id: aziendaId, codice, nome, attivo: true, ordinamento: 0 }])
    .select('id, codice, nome')
    .single()

  if (error) {
    console.error('Errore creazione linea:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/configurazioni/linee')
  return { success: true, data }
}

// =====================================================
// CATEGORIA CLIENTE
// =====================================================
export async function quickCreateCategoriaCliente(formData: FormData): Promise<QuickCreateResult<{ id: number; codice: string; nome: string }>> {
  const supabase = await createClient()
  const aziendaId = await getAziendaId()

  if (!aziendaId) {
    return { success: false, error: 'Utente non autenticato' }
  }

  const codice = formData.get('codice') as string
  const nome = formData.get('nome') as string

  if (!codice || !nome) {
    return { success: false, error: 'Codice e nome sono obbligatori' }
  }

  const { data, error } = await supabase
    .from('categorie_cliente')
    .insert([{ azienda_id: aziendaId, codice, nome }])
    .select('id, codice, nome')
    .single()

  if (error) {
    console.error('Errore creazione categoria cliente:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/configurazioni/categorie-cliente')
  return { success: true, data }
}

// =====================================================
// CATEGORIA FORNITORE
// =====================================================
export async function quickCreateCategoriaFornitore(formData: FormData): Promise<QuickCreateResult<{ id: number; codice: string; nome: string }>> {
  const supabase = await createClient()
  const aziendaId = await getAziendaId()

  if (!aziendaId) {
    return { success: false, error: 'Utente non autenticato' }
  }

  const codice = formData.get('codice') as string
  const nome = formData.get('nome') as string

  if (!codice || !nome) {
    return { success: false, error: 'Codice e nome sono obbligatori' }
  }

  const { data, error } = await supabase
    .from('categorie_fornitore')
    .insert([{ azienda_id: aziendaId, codice, nome }])
    .select('id, codice, nome')
    .single()

  if (error) {
    console.error('Errore creazione categoria fornitore:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/configurazioni/categorie-fornitore')
  return { success: true, data }
}

// =====================================================
// CODICE PAGAMENTO
// =====================================================
export async function quickCreateCodicePagamento(formData: FormData): Promise<QuickCreateResult<{ id: number; codice: string; descrizione: string }>> {
  const supabase = await createClient()
  const aziendaId = await getAziendaId()

  if (!aziendaId) {
    return { success: false, error: 'Utente non autenticato' }
  }

  const codice = formData.get('codice') as string
  const descrizione = formData.get('descrizione') as string
  const giorniScadenza = formData.get('giorni_scadenza') as string

  if (!codice || !descrizione) {
    return { success: false, error: 'Codice e descrizione sono obbligatori' }
  }

  const { data, error } = await supabase
    .from('codici_pagamento')
    .insert([{
      azienda_id: aziendaId,
      codice,
      descrizione,
      giorni_scadenza: giorniScadenza ? parseInt(giorniScadenza) : 30
    }])
    .select('id, codice, descrizione')
    .single()

  if (error) {
    console.error('Errore creazione codice pagamento:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/configurazioni/codici-pagamento')
  return { success: true, data }
}

// =====================================================
// LISTINO
// =====================================================
export async function quickCreateListino(formData: FormData): Promise<QuickCreateResult<{ id: number; codice: string; nome: string }>> {
  const supabase = await createClient()
  const aziendaId = await getAziendaId()

  if (!aziendaId) {
    return { success: false, error: 'Utente non autenticato' }
  }

  const codice = formData.get('codice') as string
  const nome = formData.get('nome') as string
  const tipo = formData.get('tipo') as string || 'vendita'

  if (!codice || !nome) {
    return { success: false, error: 'Codice e nome sono obbligatori' }
  }

  const { data, error } = await supabase
    .from('listino')
    .insert([{
      azienda_id: aziendaId,
      codice,
      nome,
      tipo,
      attivo: true
    }])
    .select('id, codice, nome')
    .single()

  if (error) {
    console.error('Errore creazione listino:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/configurazioni/listini')
  return { success: true, data }
}

// =====================================================
// CAUSALE DOCUMENTO
// =====================================================
export async function quickCreateCausaleDocumento(formData: FormData): Promise<QuickCreateResult<{ id: number; codice: string; descrizione: string }>> {
  const supabase = await createClient()
  const aziendaId = await getAziendaId()

  if (!aziendaId) {
    return { success: false, error: 'Utente non autenticato' }
  }

  const codice = formData.get('codice') as string
  const descrizione = formData.get('descrizione') as string
  const tipoDocumento = formData.get('tipo_documento') as string

  if (!codice || !descrizione) {
    return { success: false, error: 'Codice e descrizione sono obbligatori' }
  }

  const { data, error } = await supabase
    .from('causali_documento')
    .insert([{
      azienda_id: aziendaId,
      codice,
      descrizione,
      tipo_documento: tipoDocumento || 'ordine'
    }])
    .select('id, codice, descrizione')
    .single()

  if (error) {
    console.error('Errore creazione causale documento:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/configurazioni/causali-documento')
  return { success: true, data }
}

// =====================================================
// CAUSALE MOVIMENTO
// =====================================================
export async function quickCreateCausaleMovimento(formData: FormData): Promise<QuickCreateResult<{ id: number; codice: string; descrizione: string }>> {
  const supabase = await createClient()
  const aziendaId = await getAziendaId()

  if (!aziendaId) {
    return { success: false, error: 'Utente non autenticato' }
  }

  const codice = formData.get('codice') as string
  const descrizione = formData.get('descrizione') as string
  const tipoMovimento = formData.get('tipo_movimento') as string

  if (!codice || !descrizione) {
    return { success: false, error: 'Codice e descrizione sono obbligatori' }
  }

  const { data, error } = await supabase
    .from('causali_movimento')
    .insert([{
      azienda_id: aziendaId,
      codice,
      descrizione,
      tipo_movimento: tipoMovimento || 'carico'
    }])
    .select('id, codice, descrizione')
    .single()

  if (error) {
    console.error('Errore creazione causale movimento:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/configurazioni/causali-movimento')
  return { success: true, data }
}

// =====================================================
// MAGAZZINO
// =====================================================
export async function quickCreateMagazzino(formData: FormData): Promise<QuickCreateResult<{ id: number; codice: string; nome: string }>> {
  const supabase = await createClient()
  const aziendaId = await getAziendaId()

  if (!aziendaId) {
    return { success: false, error: 'Utente non autenticato' }
  }

  const codice = formData.get('codice') as string
  const nome = formData.get('nome') as string

  if (!codice || !nome) {
    return { success: false, error: 'Codice e nome sono obbligatori' }
  }

  const { data, error } = await supabase
    .from('magazzino')
    .insert([{
      azienda_id: aziendaId,
      codice,
      nome,
      attivo: true
    }])
    .select('id, codice, nome')
    .single()

  if (error) {
    console.error('Errore creazione magazzino:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard/configurazioni/magazzini')
  return { success: true, data }
}
