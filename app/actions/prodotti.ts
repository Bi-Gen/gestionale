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
  descrizione_breve?: string
  sku?: string
  barcode?: string
  codice_ean?: string
  codice_fornitore?: string
  codice_doganale?: string
  riferimento?: string
  ean_proprietario?: string
  // Classificazione (solo FK)
  macrofamiglia_id?: number
  famiglia_id?: number
  linea_id?: number
  misura?: string
  costo_ultimo?: number    // Read-only, aggiornato dai movimenti
  costo_medio?: number     // Read-only, calcolato dal sistema
  costo_override?: number  // Costo manuale opzionale
  prezzo_acquisto?: number
  prezzo_vendita: number
  aliquota_iva?: number
  valuta?: string
  quantita_magazzino?: number
  giacenza_minima?: number
  giacenza_massima?: number
  punto_riordino?: number
  quantita_minima_ordine?: number
  tempo_riordino_giorni?: number
  transit_time_giorni?: number
  sconto_massimo?: number
  margine_percentuale?: number
  unita_misura?: string
  ubicazione?: string
  fornitore_principale_id?: number
  // Dimensioni e peso
  peso_kg?: number
  volume_m3?: number
  colli?: number
  lunghezza_cm?: number
  larghezza_cm?: number
  altezza_cm?: number
  // Gestione tracciabilità
  gestione_lotti?: boolean
  gestione_seriali?: boolean
  gestione_scadenze?: boolean
  giorni_scadenza?: number
  // Flag visibilità
  vendibile?: boolean
  acquistabile?: boolean
  visibile_catalogo?: boolean
  visibile_ecommerce?: boolean
  // Note e immagini
  note?: string
  note_interne?: string
  immagine_url?: string
  // Packaging (da tabella satellite)
  packaging?: PackagingProdotto
  created_at: string
  updated_at: string
}

export type PackagingProdotto = {
  id?: number
  prodotto_id?: number
  nome_confezione?: string
  pezzi_per_confezione?: number
  confezione_peso_kg?: number
  confezioni_per_cartone?: number
  cartone_lunghezza_cm?: number
  cartone_larghezza_cm?: number
  cartone_altezza_cm?: number
  cartone_peso_kg?: number
  cartoni_per_pallet?: number
  cartoni_per_strato?: number
  strati_per_pallet?: number
  pallet_per_container_20ft?: number
  pallet_per_container_40ft?: number
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
    codice_doganale: validation.data.codice_doganale || null,
    riferimento: validation.data.riferimento || null,
    ean_proprietario: validation.data.ean_proprietario || null,
    sku: validation.data.sku || null,

    // Classificazione (solo FK)
    macrofamiglia_id: validation.data.macrofamiglia_id ? parseInt(validation.data.macrofamiglia_id) : null,
    famiglia_id: validation.data.famiglia_id ? parseInt(validation.data.famiglia_id) : null,
    linea_id: validation.data.linea_id ? parseInt(validation.data.linea_id) : null,
    misura: validation.data.misura || null,

    // Prezzi e costi
    // NOTA: costo_ultimo, costo_medio, margine_percentuale sono gestiti automaticamente dal sistema
    costo_override: validation.data.costo_override ? parseFloat(validation.data.costo_override) : null,
    prezzo_acquisto: validation.data.prezzo_acquisto ? parseFloat(validation.data.prezzo_acquisto) : null,
    prezzo_vendita: parseFloat(validation.data.prezzo_vendita),
    sconto_massimo: validation.data.sconto_massimo ? parseFloat(validation.data.sconto_massimo) : null,
    aliquota_iva: validation.data.aliquota_iva ? parseFloat(validation.data.aliquota_iva) : 22.00,
    valuta: validation.data.valuta || 'EUR',

    // Fornitore
    fornitore_principale_id: validation.data.fornitore_principale_id ? parseInt(validation.data.fornitore_principale_id) : null,
    tempo_riordino_giorni: validation.data.tempo_riordino_giorni ? parseInt(validation.data.tempo_riordino_giorni) : 7,
    transit_time_giorni: validation.data.transit_time_giorni ? parseInt(validation.data.transit_time_giorni) : null,
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

  // Inserisci prodotto
  const { data: newProdotto, error } = await supabase
    .from('prodotto')
    .insert([prodotto])
    .select('id')
    .single()

  if (error) {
    console.error('Error creating prodotto:', error)
    redirect(`/dashboard/prodotti/nuovo?error=${encodeURIComponent(error.message)}`)
  }

  // Inserisci packaging se presente
  const hasPackaging = validation.data.pkg_pezzi_per_confezione ||
                       validation.data.pkg_confezioni_per_cartone ||
                       validation.data.pkg_cartoni_per_pallet

  if (hasPackaging && newProdotto) {
    const packaging = {
      prodotto_id: newProdotto.id,
      nome_confezione: validation.data.pkg_nome_confezione || 'Confezione',
      pezzi_per_confezione: validation.data.pkg_pezzi_per_confezione ? parseInt(validation.data.pkg_pezzi_per_confezione) : 1,
      confezione_peso_kg: validation.data.pkg_confezione_peso_kg ? parseFloat(validation.data.pkg_confezione_peso_kg) : null,
      confezioni_per_cartone: validation.data.pkg_confezioni_per_cartone ? parseInt(validation.data.pkg_confezioni_per_cartone) : 1,
      cartone_lunghezza_cm: validation.data.pkg_cartone_lunghezza_cm ? parseFloat(validation.data.pkg_cartone_lunghezza_cm) : null,
      cartone_larghezza_cm: validation.data.pkg_cartone_larghezza_cm ? parseFloat(validation.data.pkg_cartone_larghezza_cm) : null,
      cartone_altezza_cm: validation.data.pkg_cartone_altezza_cm ? parseFloat(validation.data.pkg_cartone_altezza_cm) : null,
      cartone_peso_kg: validation.data.pkg_cartone_peso_kg ? parseFloat(validation.data.pkg_cartone_peso_kg) : null,
      cartoni_per_pallet: validation.data.pkg_cartoni_per_pallet ? parseInt(validation.data.pkg_cartoni_per_pallet) : null,
      cartoni_per_strato: validation.data.pkg_cartoni_per_strato ? parseInt(validation.data.pkg_cartoni_per_strato) : null,
      strati_per_pallet: validation.data.pkg_strati_per_pallet ? parseInt(validation.data.pkg_strati_per_pallet) : null,
      pallet_per_container_20ft: validation.data.pkg_pallet_per_container_20ft ? parseInt(validation.data.pkg_pallet_per_container_20ft) : null,
      pallet_per_container_40ft: validation.data.pkg_pallet_per_container_40ft ? parseInt(validation.data.pkg_pallet_per_container_40ft) : null,
    }

    const { error: pkgError } = await supabase
      .from('packaging_prodotto')
      .insert([packaging])

    if (pkgError) {
      console.error('Error creating packaging:', pkgError)
      // Non blocchiamo, il prodotto è già creato
    }
  }

  revalidatePath('/dashboard/prodotti')
  // Redirect alla pagina modifica per permettere di aggiungere prezzi listino
  redirect(`/dashboard/prodotti/${newProdotto.id}/modifica?nuovo=true`)
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
    codice_doganale: validation.data.codice_doganale || null,
    riferimento: validation.data.riferimento || null,
    ean_proprietario: validation.data.ean_proprietario || null,
    sku: validation.data.sku || null,

    // Classificazione (solo FK)
    macrofamiglia_id: validation.data.macrofamiglia_id ? parseInt(validation.data.macrofamiglia_id) : null,
    famiglia_id: validation.data.famiglia_id ? parseInt(validation.data.famiglia_id) : null,
    linea_id: validation.data.linea_id ? parseInt(validation.data.linea_id) : null,
    misura: validation.data.misura || null,

    // Prezzi e costi
    // NOTA: costo_ultimo, costo_medio, margine_percentuale sono gestiti automaticamente dal sistema
    costo_override: validation.data.costo_override ? parseFloat(validation.data.costo_override) : null,
    prezzo_acquisto: validation.data.prezzo_acquisto ? parseFloat(validation.data.prezzo_acquisto) : null,
    prezzo_vendita: parseFloat(validation.data.prezzo_vendita),
    sconto_massimo: validation.data.sconto_massimo ? parseFloat(validation.data.sconto_massimo) : null,
    aliquota_iva: validation.data.aliquota_iva ? parseFloat(validation.data.aliquota_iva) : 22.00,
    valuta: validation.data.valuta || 'EUR',

    // Fornitore
    fornitore_principale_id: validation.data.fornitore_principale_id ? parseInt(validation.data.fornitore_principale_id) : null,
    tempo_riordino_giorni: validation.data.tempo_riordino_giorni ? parseInt(validation.data.tempo_riordino_giorni) : 7,
    transit_time_giorni: validation.data.transit_time_giorni ? parseInt(validation.data.transit_time_giorni) : null,
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

  // Aggiorna o crea packaging
  const hasPackaging = validation.data.pkg_pezzi_per_confezione ||
                       validation.data.pkg_confezioni_per_cartone ||
                       validation.data.pkg_cartoni_per_pallet

  if (hasPackaging) {
    const packaging = {
      prodotto_id: parseInt(id),
      nome_confezione: validation.data.pkg_nome_confezione || 'Confezione',
      pezzi_per_confezione: validation.data.pkg_pezzi_per_confezione ? parseInt(validation.data.pkg_pezzi_per_confezione) : 1,
      confezione_peso_kg: validation.data.pkg_confezione_peso_kg ? parseFloat(validation.data.pkg_confezione_peso_kg) : null,
      confezioni_per_cartone: validation.data.pkg_confezioni_per_cartone ? parseInt(validation.data.pkg_confezioni_per_cartone) : 1,
      cartone_lunghezza_cm: validation.data.pkg_cartone_lunghezza_cm ? parseFloat(validation.data.pkg_cartone_lunghezza_cm) : null,
      cartone_larghezza_cm: validation.data.pkg_cartone_larghezza_cm ? parseFloat(validation.data.pkg_cartone_larghezza_cm) : null,
      cartone_altezza_cm: validation.data.pkg_cartone_altezza_cm ? parseFloat(validation.data.pkg_cartone_altezza_cm) : null,
      cartone_peso_kg: validation.data.pkg_cartone_peso_kg ? parseFloat(validation.data.pkg_cartone_peso_kg) : null,
      cartoni_per_pallet: validation.data.pkg_cartoni_per_pallet ? parseInt(validation.data.pkg_cartoni_per_pallet) : null,
      cartoni_per_strato: validation.data.pkg_cartoni_per_strato ? parseInt(validation.data.pkg_cartoni_per_strato) : null,
      strati_per_pallet: validation.data.pkg_strati_per_pallet ? parseInt(validation.data.pkg_strati_per_pallet) : null,
      pallet_per_container_20ft: validation.data.pkg_pallet_per_container_20ft ? parseInt(validation.data.pkg_pallet_per_container_20ft) : null,
      pallet_per_container_40ft: validation.data.pkg_pallet_per_container_40ft ? parseInt(validation.data.pkg_pallet_per_container_40ft) : null,
    }

    // Upsert: insert o update
    const { error: pkgError } = await supabase
      .from('packaging_prodotto')
      .upsert([packaging], { onConflict: 'prodotto_id' })

    if (pkgError) {
      console.error('Error updating packaging:', pkgError)
    }
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
