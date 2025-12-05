'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { validateProdottoFormData } from '@/lib/validations/prodotti'

export type Prodotto = {
  id: string | number
  codice: string
  nome: string
  descrizione?: string
  costo_ultimo?: number
  costo_medio?: number
  prezzo_acquisto?: number
  prezzo_vendita: number
  quantita_magazzino?: number
  giacenza_minima?: number
  giacenza_massima?: number
  punto_riordino?: number
  quantita_minima_ordine?: number
  sconto_massimo?: number
  unita_misura?: string
  fornitore_principale_id?: number
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
    .from('prodotto')
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
    .from('prodotto')
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

  // Get azienda_id from utente_azienda
  const { data: utenteAzienda } = await supabase
    .from('utente_azienda')
    .select('azienda_id')
    .eq('user_id', user.id)
    .single()

  if (!utenteAzienda) {
    redirect('/login?error=Nessuna azienda associata')
  }

  const prodotto = {
    azienda_id: utenteAzienda.azienda_id,

    // Identificazione
    codice: validation.data.codice,
    nome: validation.data.nome,
    descrizione: validation.data.descrizione || null,
    descrizione_breve: validation.data.descrizione_breve || null,
    codice_ean: validation.data.codice_ean || null,
    codice_fornitore: validation.data.codice_fornitore || null,
    sku: validation.data.sku || null,

    // Classificazione
    categoria: validation.data.categoria || null,
    sottocategoria: validation.data.sottocategoria || null,
    famiglia: validation.data.famiglia || null,

    // Prezzi e costi
    costo_ultimo: validation.data.costo_ultimo ? parseFloat(validation.data.costo_ultimo) : null,
    costo_medio: validation.data.costo_medio ? parseFloat(validation.data.costo_medio) : null,
    prezzo_acquisto: validation.data.prezzo_acquisto ? parseFloat(validation.data.prezzo_acquisto) : null,
    prezzo_vendita: parseFloat(validation.data.prezzo_vendita),
    prezzo_listino1: validation.data.prezzo_listino1 ? parseFloat(validation.data.prezzo_listino1) : null,
    prezzo_listino2: validation.data.prezzo_listino2 ? parseFloat(validation.data.prezzo_listino2) : null,
    prezzo_listino3: validation.data.prezzo_listino3 ? parseFloat(validation.data.prezzo_listino3) : null,
    prezzo_listino4: validation.data.prezzo_listino4 ? parseFloat(validation.data.prezzo_listino4) : null,
    prezzo_listino5: validation.data.prezzo_listino5 ? parseFloat(validation.data.prezzo_listino5) : null,
    margine_percentuale: validation.data.margine_percentuale ? parseFloat(validation.data.margine_percentuale) : null,
    sconto_massimo: validation.data.sconto_massimo ? parseFloat(validation.data.sconto_massimo) : null,
    aliquota_iva: validation.data.aliquota_iva ? parseFloat(validation.data.aliquota_iva) : 22.00,
    valuta: validation.data.valuta || 'EUR',

    // Fornitore
    fornitore_principale_id: validation.data.fornitore_principale_id ? parseInt(validation.data.fornitore_principale_id) : null,
    tempo_riordino_giorni: validation.data.tempo_riordino_giorni ? parseInt(validation.data.tempo_riordino_giorni) : 7,
    quantita_minima_ordine: validation.data.quantita_minima_ordine ? parseInt(validation.data.quantita_minima_ordine) : 1,

    // Magazzino
    unita_misura: validation.data.unita_misura || 'PZ',
    quantita_magazzino: validation.data.quantita_magazzino ? parseFloat(validation.data.quantita_magazzino) : 0,
    giacenza_minima: validation.data.giacenza_minima ? parseFloat(validation.data.giacenza_minima) : null,
    giacenza_massima: validation.data.giacenza_massima ? parseFloat(validation.data.giacenza_massima) : null,
    punto_riordino: validation.data.punto_riordino ? parseFloat(validation.data.punto_riordino) : null,
    ubicazione: validation.data.ubicazione || null,

    // Misure e dimensioni
    peso_kg: validation.data.peso_kg ? parseFloat(validation.data.peso_kg) : null,
    volume_m3: validation.data.volume_m3 ? parseFloat(validation.data.volume_m3) : null,
    lunghezza_cm: validation.data.lunghezza_cm ? parseFloat(validation.data.lunghezza_cm) : null,
    larghezza_cm: validation.data.larghezza_cm ? parseFloat(validation.data.larghezza_cm) : null,
    altezza_cm: validation.data.altezza_cm ? parseFloat(validation.data.altezza_cm) : null,
    colli: validation.data.colli ? parseInt(validation.data.colli) : 1,

    // Gestione avanzata
    gestione_lotti: validation.data.gestione_lotti || false,
    gestione_seriali: validation.data.gestione_seriali || false,
    gestione_scadenze: validation.data.gestione_scadenze || false,
    giorni_scadenza: validation.data.giorni_scadenza ? parseInt(validation.data.giorni_scadenza) : null,

    // Vendita
    vendibile: validation.data.vendibile !== false,
    acquistabile: validation.data.acquistabile !== false,
    visibile_catalogo: validation.data.visibile_catalogo !== false,
    visibile_ecommerce: validation.data.visibile_ecommerce || false,

    // Note
    note: validation.data.note || null,
    note_interne: validation.data.note_interne || null,
    immagine_url: validation.data.immagine_url || null,
  }

  const { error } = await supabase
    .from('prodotto')
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
    // Identificazione
    codice: validation.data.codice,
    nome: validation.data.nome,
    descrizione: validation.data.descrizione || null,
    descrizione_breve: validation.data.descrizione_breve || null,
    codice_ean: validation.data.codice_ean || null,
    codice_fornitore: validation.data.codice_fornitore || null,
    sku: validation.data.sku || null,

    // Classificazione
    categoria: validation.data.categoria || null,
    sottocategoria: validation.data.sottocategoria || null,
    famiglia: validation.data.famiglia || null,

    // Prezzi e costi
    costo_ultimo: validation.data.costo_ultimo ? parseFloat(validation.data.costo_ultimo) : null,
    costo_medio: validation.data.costo_medio ? parseFloat(validation.data.costo_medio) : null,
    prezzo_acquisto: validation.data.prezzo_acquisto ? parseFloat(validation.data.prezzo_acquisto) : null,
    prezzo_vendita: parseFloat(validation.data.prezzo_vendita),
    prezzo_listino1: validation.data.prezzo_listino1 ? parseFloat(validation.data.prezzo_listino1) : null,
    prezzo_listino2: validation.data.prezzo_listino2 ? parseFloat(validation.data.prezzo_listino2) : null,
    prezzo_listino3: validation.data.prezzo_listino3 ? parseFloat(validation.data.prezzo_listino3) : null,
    prezzo_listino4: validation.data.prezzo_listino4 ? parseFloat(validation.data.prezzo_listino4) : null,
    prezzo_listino5: validation.data.prezzo_listino5 ? parseFloat(validation.data.prezzo_listino5) : null,
    margine_percentuale: validation.data.margine_percentuale ? parseFloat(validation.data.margine_percentuale) : null,
    sconto_massimo: validation.data.sconto_massimo ? parseFloat(validation.data.sconto_massimo) : null,
    aliquota_iva: validation.data.aliquota_iva ? parseFloat(validation.data.aliquota_iva) : 22.00,
    valuta: validation.data.valuta || 'EUR',

    // Fornitore
    fornitore_principale_id: validation.data.fornitore_principale_id ? parseInt(validation.data.fornitore_principale_id) : null,
    tempo_riordino_giorni: validation.data.tempo_riordino_giorni ? parseInt(validation.data.tempo_riordino_giorni) : 7,
    quantita_minima_ordine: validation.data.quantita_minima_ordine ? parseInt(validation.data.quantita_minima_ordine) : 1,

    // Magazzino
    unita_misura: validation.data.unita_misura || 'PZ',
    quantita_magazzino: validation.data.quantita_magazzino ? parseFloat(validation.data.quantita_magazzino) : 0,
    giacenza_minima: validation.data.giacenza_minima ? parseFloat(validation.data.giacenza_minima) : null,
    giacenza_massima: validation.data.giacenza_massima ? parseFloat(validation.data.giacenza_massima) : null,
    punto_riordino: validation.data.punto_riordino ? parseFloat(validation.data.punto_riordino) : null,
    ubicazione: validation.data.ubicazione || null,

    // Misure e dimensioni
    peso_kg: validation.data.peso_kg ? parseFloat(validation.data.peso_kg) : null,
    volume_m3: validation.data.volume_m3 ? parseFloat(validation.data.volume_m3) : null,
    lunghezza_cm: validation.data.lunghezza_cm ? parseFloat(validation.data.lunghezza_cm) : null,
    larghezza_cm: validation.data.larghezza_cm ? parseFloat(validation.data.larghezza_cm) : null,
    altezza_cm: validation.data.altezza_cm ? parseFloat(validation.data.altezza_cm) : null,
    colli: validation.data.colli ? parseInt(validation.data.colli) : 1,

    // Gestione avanzata
    gestione_lotti: validation.data.gestione_lotti || false,
    gestione_seriali: validation.data.gestione_seriali || false,
    gestione_scadenze: validation.data.gestione_scadenze || false,
    giorni_scadenza: validation.data.giorni_scadenza ? parseInt(validation.data.giorni_scadenza) : null,

    // Vendita
    vendibile: validation.data.vendibile !== false,
    acquistabile: validation.data.acquistabile !== false,
    visibile_catalogo: validation.data.visibile_catalogo !== false,
    visibile_ecommerce: validation.data.visibile_ecommerce || false,

    // Note
    note: validation.data.note || null,
    note_interne: validation.data.note_interne || null,
    immagine_url: validation.data.immagine_url || null,
  }

  const { error } = await supabase
    .from('prodotto')
    .update(updates)
    .eq('id', id)

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
    .from('prodotto')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting prodotto:', error)
    redirect(`/dashboard/prodotti?error=${encodeURIComponent(error.message)}`)
  }

  revalidatePath('/dashboard/prodotti')
  redirect('/dashboard/prodotti?success=Prodotto eliminato con successo')
}
