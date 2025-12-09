'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type Soggetto = {
  id: number
  azienda_id: string
  tipo_soggetto_id: number
  tipo?: string[] // Old tipo array for backward compatibility
  tipo_persona: 'fisica' | 'giuridica'
  ragione_sociale: string
  nome?: string
  cognome?: string
  partita_iva?: string
  codice_fiscale?: string
  codice_univoco?: string
  pec?: string
  indirizzo?: string
  civico?: string
  cap?: string
  citta?: string
  provincia?: string
  paese?: string
  comune_id?: number
  telefono?: string
  cellulare?: string
  fax?: string
  email?: string
  sito_web?: string
  referente?: string
  referente_telefono?: string
  referente_email?: string
  categoria_cliente_text?: string // Vecchio campo testuale (deprecato)
  categoria_cliente_id?: number // Nuova FK alla tabella categoria_cliente
  listino_id?: number
  zona_vendita?: string
  agente_id?: number
  sconto_percentuale?: number
  provvigione_agente_perc?: number
  fido_massimo?: number
  fido_utilizzato?: number
  pagamento_id?: number
  giorni_pagamento?: number
  banca?: string
  iban?: string
  swift_bic?: string
  categoria_fornitore?: string // Deprecato, usare categoria_fornitore_id
  categoria_fornitore_id?: number
  giorni_consegna?: number
  sconto_fornitore?: number
  note?: string
  allegati?: any
  attivo: boolean
  privato: boolean
  da_fatturare: boolean
  soggetto_gruppo: boolean
  created_at: string
  updated_at: string
  tipo_soggetto?: {
    id: number
    codice: string
    nome: string
    colore?: string
  }
  comune?: {
    id: number
    nome: string
    cap: string
    provincia: {
      nome: string
      sigla: string
    }
  }
  categoria_cliente?: {
    id: number
    codice: string
    nome: string
    colore?: string
  }
  agente?: {
    id: number
    codice_agente?: string
    ragione_sociale: string
  }
}

// GET: Lista soggetti
export async function getSoggetti(tipo_soggetto_id?: number) {
  const supabase = await createClient()

  let query = supabase
    .from('soggetto')
    .select(`
      *,
      tipo_soggetto:tipo_soggetto_id(id, codice, nome, colore),
      comune:comune_id(
        id,
        nome,
        cap,
        provincia:provincia_id(nome, sigla)
      )
    `)
    .order('ragione_sociale', { ascending: true })

  // Filter by tipo_soggetto if provided
  if (tipo_soggetto_id) {
    query = query.eq('tipo_soggetto_id', tipo_soggetto_id)
  }

  const { data, error } = await query

  if (error) {
    console.error('Errore caricamento soggetti:', error)
    return []
  }

  return data as Soggetto[]
}

// GET: Lista soggetti by codice tipo (usa tipo_soggetto_id)
export async function getSoggettiByTipoCodice(tipoCodice: 'CLI' | 'FOR' | 'AGE') {
  const supabase = await createClient()

  // Prima ottieni l'ID del tipo soggetto dal codice
  const { data: tipoSoggetto } = await supabase
    .from('tipi_soggetto')
    .select('id')
    .eq('codice', tipoCodice)
    .single()

  if (!tipoSoggetto) {
    console.error(`Tipo soggetto ${tipoCodice} non trovato`)
    return []
  }

  const { data, error } = await supabase
    .from('soggetto')
    .select(`
      *,
      tipo_soggetto:tipo_soggetto_id(id, codice, nome, colore),
      comune:comune_id(
        id,
        nome,
        cap,
        provincia:provincia_id(nome, sigla)
      ),
      categoria_cliente:categoria_cliente_id(id, codice, nome, colore)
    `)
    .eq('tipo_soggetto_id', tipoSoggetto.id)
    .order('ragione_sociale', { ascending: true })

  if (error) {
    console.error('Errore caricamento soggetti:', error)
    return []
  }

  // Recupera gli agenti separatamente (self-reference)
  const agentiIds = data
    .filter(s => s.agente_id)
    .map(s => s.agente_id)

  let agentiMap: Record<number, { id: number; codice_agente?: string; ragione_sociale: string }> = {}

  if (agentiIds.length > 0) {
    const { data: agentiData } = await supabase
      .from('soggetto')
      .select('id, codice_agente, ragione_sociale')
      .in('id', agentiIds)

    if (agentiData) {
      agentiMap = agentiData.reduce((acc, agente) => {
        acc[agente.id] = agente
        return acc
      }, {} as typeof agentiMap)
    }
  }

  // Combina i dati
  const result = data.map(soggetto => ({
    ...soggetto,
    agente: soggetto.agente_id ? agentiMap[soggetto.agente_id] : undefined
  }))

  return result as Soggetto[]
}

// GET: Singolo soggetto
export async function getSoggetto(id: number) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('soggetto')
    .select(`
      *,
      tipo_soggetto:tipo_soggetto_id(id, codice, nome, colore),
      comune:comune_id(
        id,
        nome,
        cap,
        provincia:provincia_id(nome, sigla)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Errore caricamento soggetto:', error)
    return null
  }

  // Debug log to check tipo field
  console.log('getSoggetto result:', {
    id: data.id,
    ragione_sociale: data.ragione_sociale,
    tipo: data.tipo,
    tipo_soggetto_id: data.tipo_soggetto_id
  })

  return data as Soggetto
}

// CREATE
export async function createSoggetto(formData: FormData) {
  const supabase = await createClient()

  // Get user's azienda_id
  const { data: userData } = await supabase.auth.getUser()
  if (!userData.user) {
    return redirect('/dashboard/soggetti?error=Utente non autenticato')
  }

  const { data: utenteAzienda } = await supabase
    .from('utente_azienda')
    .select('azienda_id')
    .eq('user_id', userData.user.id)
    .eq('attivo', true)
    .single()

  if (!utenteAzienda) {
    return redirect('/dashboard/soggetti?error=Nessuna azienda associata')
  }

  const soggettoData = {
    azienda_id: utenteAzienda.azienda_id,
    tipo_soggetto_id: parseInt(formData.get('tipo_soggetto_id') as string),
    tipo_persona: formData.get('tipo_persona') as 'fisica' | 'giuridica',
    ragione_sociale: formData.get('ragione_sociale') as string,
    nome: formData.get('nome') as string || null,
    cognome: formData.get('cognome') as string || null,
    partita_iva: formData.get('partita_iva') as string || null,
    codice_fiscale: formData.get('codice_fiscale') as string || null,
    codice_univoco: formData.get('codice_univoco') as string || null,
    pec: formData.get('pec') as string || null,
    indirizzo: formData.get('indirizzo') as string || null,
    civico: formData.get('civico') as string || null,
    cap: formData.get('cap') as string || null,
    citta: formData.get('citta') as string || null,
    provincia: formData.get('provincia') as string || null,
    paese: formData.get('paese') as string || 'IT',
    comune_id: formData.get('comune_id') ? parseInt(formData.get('comune_id') as string) : null,
    telefono: formData.get('telefono') as string || null,
    cellulare: formData.get('cellulare') as string || null,
    fax: formData.get('fax') as string || null,
    email: formData.get('email') as string || null,
    sito_web: formData.get('sito_web') as string || null,
    referente: formData.get('referente') as string || null,
    referente_telefono: formData.get('referente_telefono') as string || null,
    referente_email: formData.get('referente_email') as string || null,
    categoria_cliente: formData.get('categoria_cliente') as string || null,
    categoria_cliente_id: formData.get('categoria_cliente_id') ? parseInt(formData.get('categoria_cliente_id') as string) : null,
    listino_id: formData.get('listino_id') ? parseInt(formData.get('listino_id') as string) : null,
    zona_vendita: formData.get('zona_vendita') as string || null,
    sconto_percentuale: formData.get('sconto_percentuale') ? parseFloat(formData.get('sconto_percentuale') as string) : 0,
    fido_massimo: formData.get('fido_massimo') ? parseFloat(formData.get('fido_massimo') as string) : 0,
    giorni_pagamento: formData.get('giorni_pagamento') ? parseInt(formData.get('giorni_pagamento') as string) : 30,
    banca: formData.get('banca') as string || null,
    iban: formData.get('iban') as string || null,
    swift_bic: formData.get('swift_bic') as string || null,
    categoria_fornitore_id: formData.get('categoria_fornitore_id') ? parseInt(formData.get('categoria_fornitore_id') as string) : null,
    giorni_consegna: formData.get('giorni_consegna') ? parseInt(formData.get('giorni_consegna') as string) : null,
    sconto_fornitore: formData.get('sconto_fornitore') ? parseFloat(formData.get('sconto_fornitore') as string) : 0,
    note: formData.get('note') as string || null,
    attivo: formData.get('attivo') === 'true',
    // Agente assegnato (solo per clienti)
    agente_id: formData.get('agente_id') ? parseInt(formData.get('agente_id') as string) : null,
    // Set tipo array for backward compatibility
    tipo: formData.get('tipo_soggetto_codice') === 'CLI' ? ['cliente'] :
          formData.get('tipo_soggetto_codice') === 'FOR' ? ['fornitore'] :
          formData.get('tipo_soggetto_codice') === 'AGE' ? ['agente'] : ['cliente']
  }

  // Validation
  if (!soggettoData.tipo_soggetto_id || !soggettoData.ragione_sociale) {
    return redirect('/dashboard/soggetti/nuovo?error=Tipo soggetto e ragione sociale sono obbligatori')
  }

  const { error } = await supabase
    .from('soggetto')
    .insert([soggettoData])

  if (error) {
    console.error('Errore creazione soggetto:', error)
    const returnUrl = formData.get('return_url') as string || '/dashboard/soggetti'
    return redirect(`/dashboard/soggetti/nuovo?tipo=${soggettoData.tipo_soggetto_id}&return=${encodeURIComponent(returnUrl)}&error=${encodeURIComponent(error.message)}`)
  }

  const returnUrl = formData.get('return_url') as string || '/dashboard/soggetti'
  revalidatePath('/dashboard/soggetti')
  revalidatePath('/dashboard/clienti')
  revalidatePath('/dashboard/fornitori')
  redirect(`${returnUrl}?success=Soggetto creato con successo`)
}

// UPDATE
export async function updateSoggetto(id: number, formData: FormData) {
  const supabase = await createClient()

  const soggettoData = {
    tipo_soggetto_id: parseInt(formData.get('tipo_soggetto_id') as string),
    tipo_persona: formData.get('tipo_persona') as 'fisica' | 'giuridica',
    ragione_sociale: formData.get('ragione_sociale') as string,
    nome: formData.get('nome') as string || null,
    cognome: formData.get('cognome') as string || null,
    partita_iva: formData.get('partita_iva') as string || null,
    codice_fiscale: formData.get('codice_fiscale') as string || null,
    codice_univoco: formData.get('codice_univoco') as string || null,
    pec: formData.get('pec') as string || null,
    indirizzo: formData.get('indirizzo') as string || null,
    civico: formData.get('civico') as string || null,
    cap: formData.get('cap') as string || null,
    citta: formData.get('citta') as string || null,
    provincia: formData.get('provincia') as string || null,
    paese: formData.get('paese') as string || 'IT',
    comune_id: formData.get('comune_id') ? parseInt(formData.get('comune_id') as string) : null,
    telefono: formData.get('telefono') as string || null,
    cellulare: formData.get('cellulare') as string || null,
    fax: formData.get('fax') as string || null,
    email: formData.get('email') as string || null,
    sito_web: formData.get('sito_web') as string || null,
    referente: formData.get('referente') as string || null,
    referente_telefono: formData.get('referente_telefono') as string || null,
    referente_email: formData.get('referente_email') as string || null,
    categoria_cliente: formData.get('categoria_cliente') as string || null,
    categoria_cliente_id: formData.get('categoria_cliente_id') ? parseInt(formData.get('categoria_cliente_id') as string) : null,
    listino_id: formData.get('listino_id') ? parseInt(formData.get('listino_id') as string) : null,
    zona_vendita: formData.get('zona_vendita') as string || null,
    sconto_percentuale: formData.get('sconto_percentuale') ? parseFloat(formData.get('sconto_percentuale') as string) : 0,
    fido_massimo: formData.get('fido_massimo') ? parseFloat(formData.get('fido_massimo') as string) : 0,
    giorni_pagamento: formData.get('giorni_pagamento') ? parseInt(formData.get('giorni_pagamento') as string) : 30,
    banca: formData.get('banca') as string || null,
    iban: formData.get('iban') as string || null,
    swift_bic: formData.get('swift_bic') as string || null,
    categoria_fornitore_id: formData.get('categoria_fornitore_id') ? parseInt(formData.get('categoria_fornitore_id') as string) : null,
    giorni_consegna: formData.get('giorni_consegna') ? parseInt(formData.get('giorni_consegna') as string) : null,
    sconto_fornitore: formData.get('sconto_fornitore') ? parseFloat(formData.get('sconto_fornitore') as string) : 0,
    note: formData.get('note') as string || null,
    attivo: formData.get('attivo') === 'true',
    // Agente assegnato (solo per clienti)
    agente_id: formData.get('agente_id') ? parseInt(formData.get('agente_id') as string) : null,
    // Update tipo array for backward compatibility
    tipo: formData.get('tipo_soggetto_codice') === 'CLI' ? ['cliente'] :
          formData.get('tipo_soggetto_codice') === 'FOR' ? ['fornitore'] :
          formData.get('tipo_soggetto_codice') === 'AGE' ? ['agente'] : ['cliente']
  }

  // Validation
  if (!soggettoData.tipo_soggetto_id || !soggettoData.ragione_sociale) {
    return redirect(`/dashboard/soggetti/${id}/modifica?error=Tipo soggetto e ragione sociale sono obbligatori`)
  }

  const { error } = await supabase
    .from('soggetto')
    .update(soggettoData)
    .eq('id', id)

  if (error) {
    console.error('Errore aggiornamento soggetto:', error)
    const returnUrl = formData.get('return_url') as string || '/dashboard/soggetti'
    return redirect(`/dashboard/soggetti/${id}/modifica?tipo=${soggettoData.tipo_soggetto_id}&return=${encodeURIComponent(returnUrl)}&error=${encodeURIComponent(error.message)}`)
  }

  const returnUrl = formData.get('return_url') as string || '/dashboard/soggetti'
  revalidatePath('/dashboard/soggetti')
  revalidatePath(`/dashboard/soggetti/${id}`)
  revalidatePath('/dashboard/clienti')
  revalidatePath('/dashboard/fornitori')
  redirect(`${returnUrl}?success=Soggetto aggiornato con successo`)
}

// DELETE
export async function deleteSoggetto(id: number) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('soggetto')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Errore eliminazione soggetto:', error)
    return redirect(`/dashboard/soggetti?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/soggetti')
  revalidatePath('/dashboard/clienti')
  revalidatePath('/dashboard/fornitori')
  redirect('/dashboard/soggetti?success=Soggetto eliminato con successo')
}
