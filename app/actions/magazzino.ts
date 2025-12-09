'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type Magazzino = {
  id: number
  azienda_id: string
  codice: string
  nome: string
  descrizione?: string
  indirizzo?: string
  citta?: string
  provincia?: string
  cap?: string
  responsabile_id?: number
  principale: boolean
  gestione_ubicazioni: boolean
  attivo: boolean
  created_at: string
  updated_at: string
}

export type MovimentoMagazzino = {
  id: number
  azienda_id: string
  prodotto_id: number
  magazzino_id: number
  causale_id: number
  lotto_id?: number
  data_movimento: string
  quantita: number
  segno: number
  costo_unitario?: number
  costo_totale?: number
  magazzino_destinazione_id?: number
  documento_tipo?: string
  documento_id?: number
  documento_numero?: string
  soggetto_id?: number
  note?: string
  created_by: string
  created_at: string
}

export type Causale = {
  id: number
  codice: string
  descrizione: string
  tipo: string
  segno: number
  aggiorna_costo_medio: boolean
  richiede_documento: boolean
  visibile: boolean
  attivo: boolean
}

// =====================================================
// GET: Lista magazzini
// =====================================================

export async function getMagazzini(): Promise<Magazzino[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data, error } = await supabase
    .from('magazzino')
    .select('*')
    .eq('attivo', true)
    .order('principale', { ascending: false })
    .order('nome', { ascending: true })

  if (error) {
    console.error('Error fetching magazzini:', error)
    console.error('Error details:', JSON.stringify(error))
    return []
  }

  console.log('Magazzini trovati:', data?.length || 0)
  return data || []
}

// =====================================================
// GET: Magazzino principale
// =====================================================

export async function getMagazzinoPrincipale(): Promise<Magazzino | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data, error } = await supabase
    .from('magazzino')
    .select('*')
    .eq('principale', true)
    .eq('attivo', true)
    .single()

  if (error) {
    console.error('Error fetching magazzino principale:', error)
    return null
  }

  return data
}

// =====================================================
// GET: Lista causali movimento
// =====================================================

export async function getCausali(): Promise<Causale[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data, error } = await supabase
    .from('causale_movimento')
    .select('*')
    .eq('attivo', true)
    .eq('visibile', true)
    .order('codice', { ascending: true })

  if (error) {
    console.error('Error fetching causali:', error)
    return []
  }

  return data || []
}

// =====================================================
// GET: Causale per codice
// =====================================================

export async function getCausaleByCodice(codice: string): Promise<Causale | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('causale_movimento')
    .select('*')
    .eq('codice', codice)
    .eq('attivo', true)
    .single()

  if (error) {
    console.error(`Error fetching causale ${codice}:`, error)
    return null
  }

  return data
}

// =====================================================
// GET: Giacenza prodotto per magazzino
// =====================================================

export async function getGiacenza(prodottoId: number, magazzinoId: number): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('giacenza_per_magazzino')
    .select('giacenza')
    .eq('prodotto_id', prodottoId)
    .eq('magazzino_id', magazzinoId)
    .single()

  if (error) {
    // Se non c'è la vista materializzata, calcola manualmente
    const { data: movimenti } = await supabase
      .from('movimento_magazzino')
      .select('quantita, segno')
      .eq('prodotto_id', prodottoId)
      .eq('magazzino_id', magazzinoId)

    if (!movimenti) return 0

    return movimenti.reduce((sum, m) => sum + (m.quantita * m.segno), 0)
  }

  return data?.giacenza || 0
}

// =====================================================
// CREATE: Movimento magazzino
// =====================================================

type CreateMovimentoParams = {
  prodotto_id: number
  magazzino_id: number
  causale_codice: string // 'ACQ', 'VEN', 'CAR', 'SCA', etc.
  quantita: number
  data_movimento?: string // default: oggi
  costo_unitario?: number // opzionale, usa costo_medio prodotto se null
  documento_tipo?: string // 'ordine', 'fattura', 'ddt'
  documento_id?: number
  documento_numero?: string
  soggetto_id?: number // cliente_id o fornitore_id
  magazzino_destinazione_id?: number // per trasferimenti
  lotto_id?: number
  note?: string
}

export async function createMovimento(params: CreateMovimentoParams) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get azienda_id
  const { data: utenteAzienda } = await supabase
    .from('utente_azienda')
    .select('azienda_id')
    .eq('user_id', user.id)
    .single()

  if (!utenteAzienda) {
    throw new Error('Nessuna azienda associata')
  }

  // Get causale
  const causale = await getCausaleByCodice(params.causale_codice)
  if (!causale) {
    throw new Error(`Causale ${params.causale_codice} non trovata`)
  }

  // Genera numero documento se non fornito (per movimenti manuali)
  let numeroDocumento = params.documento_numero
  if (!numeroDocumento) {
    // Conta i movimenti dell'anno corrente per questa azienda
    const anno = new Date().getFullYear()
    const { count } = await supabase
      .from('movimento_magazzino')
      .select('*', { count: 'exact', head: true })
      .eq('azienda_id', utenteAzienda.azienda_id)
      .gte('data_movimento', `${anno}-01-01`)
      .lte('data_movimento', `${anno}-12-31`)

    const progressivo = (count || 0) + 1
    numeroDocumento = `MOV-${anno}-${String(progressivo).padStart(5, '0')}`
  }

  // Prepara il movimento
  const movimento = {
    azienda_id: utenteAzienda.azienda_id,
    prodotto_id: params.prodotto_id,
    magazzino_id: params.magazzino_id,
    causale_id: causale.id,
    quantita: params.quantita,
    segno: causale.segno,
    data_movimento: params.data_movimento || new Date().toISOString().split('T')[0],
    costo_unitario: params.costo_unitario || null, // Il trigger lo recupera se null
    documento_tipo: params.documento_tipo || 'movimento_manuale',
    documento_id: params.documento_id || null,
    documento_numero: numeroDocumento,
    soggetto_id: params.soggetto_id || null,
    magazzino_destinazione_id: params.magazzino_destinazione_id || null,
    lotto_id: params.lotto_id || null,
    note: params.note || null,
    created_by: user.id,
  }

  const { data, error } = await supabase
    .from('movimento_magazzino')
    .insert([movimento])
    .select()
    .single()

  if (error) {
    console.error('Error creating movimento:', error)
    throw new Error(error.message)
  }

  return data
}

// =====================================================
// EVADI ORDINE: Crea movimenti per tutte le righe
// =====================================================

export async function evadiOrdine(ordineId: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Recupera ordine
  const { data: ordine, error: ordineError } = await supabase
    .from('ordini')
    .select('*, dettagli_ordini(*)')
    .eq('id', ordineId)
    .single()

  if (ordineError || !ordine) {
    throw new Error('Ordine non trovato')
  }

  // Determina la causale in base al tipo ordine
  const causaleCodice = ordine.tipo === 'vendita' ? 'VEN' : 'ACQ'
  const soggettoId = ordine.tipo === 'vendita' ? ordine.cliente_id : ordine.fornitore_id

  // Verifica giacenza per ordini di vendita
  if (ordine.tipo === 'vendita' && ordine.magazzino_id) {
    for (const dettaglio of ordine.dettagli_ordini) {
      const giacenza = await getGiacenza(dettaglio.prodotto_id, ordine.magazzino_id)
      if (giacenza < dettaglio.quantita) {
        throw new Error(
          `Giacenza insufficiente per prodotto ID ${dettaglio.prodotto_id}. ` +
          `Disponibile: ${giacenza}, Richiesto: ${dettaglio.quantita}`
        )
      }
    }
  }

  // Crea un movimento per ogni riga dell'ordine
  const movimenti = []
  for (const dettaglio of ordine.dettagli_ordini) {
    try {
      const movimento = await createMovimento({
        prodotto_id: dettaglio.prodotto_id,
        magazzino_id: ordine.magazzino_id || 1, // Usa magazzino principale se null
        causale_codice: causaleCodice,
        quantita: dettaglio.quantita,
        data_movimento: ordine.data_ordine,
        costo_unitario: dettaglio.prezzo_unitario,
        documento_tipo: 'ordine',
        documento_id: ordineId,
        documento_numero: ordine.numero_ordine,
        soggetto_id: soggettoId,
      })
      movimenti.push(movimento)

      // Se è un acquisto e il flag aggiorna_prezzo_listino è true, aggiorna il prezzo_acquisto
      if (ordine.tipo === 'acquisto' && dettaglio.aggiorna_prezzo_listino) {
        const { error: aggiornaError } = await supabase.rpc('aggiorna_prezzo_acquisto', {
          p_prodotto_id: dettaglio.prodotto_id,
          p_nuovo_prezzo_acquisto: dettaglio.prezzo_unitario
        })

        if (aggiornaError) {
          console.error(`Error aggiornando prezzo_acquisto per prodotto ${dettaglio.prodotto_id}:`, aggiornaError)
          // Non blocchiamo l'evasione per questo errore, logghiamo solo
        } else {
          console.log(`Prezzo listino aggiornato per prodotto ${dettaglio.prodotto_id}: €${dettaglio.prezzo_unitario}`)
        }
      }
    } catch (error) {
      console.error(`Error creating movimento for dettaglio ${dettaglio.id}:`, error)
      throw error
    }
  }

  // Aggiorna stato ordine a 'evaso'
  const { error: updateError } = await supabase
    .from('ordini')
    .update({ stato: 'evaso' })
    .eq('id', ordineId)

  if (updateError) {
    console.error('Error updating ordine stato:', updateError)
    throw new Error(updateError.message)
  }

  revalidatePath(`/dashboard/ordini/${ordineId}`)
  revalidatePath('/dashboard/ordini')
  revalidatePath('/dashboard/ordini/vendita')
  revalidatePath('/dashboard/ordini/acquisto')

  return movimenti
}

// =====================================================
// VERIFICA GIACENZA: Controlla se ordine può essere evaso
// =====================================================

export async function verificaGiacenzaOrdine(ordineId: number): Promise<{
  disponibile: boolean
  dettagli: Array<{
    prodotto_id: number
    quantita_richiesta: number
    giacenza_disponibile: number
    sufficiente: boolean
  }>
}> {
  const supabase = await createClient()

  // Recupera ordine
  const { data: ordine } = await supabase
    .from('ordini')
    .select('*, dettagli_ordini(*)')
    .eq('id', ordineId)
    .single()

  if (!ordine || ordine.tipo !== 'vendita') {
    return { disponibile: false, dettagli: [] }
  }

  const magazzinoId = ordine.magazzino_id || 1

  const dettagli = []
  let tuttiDisponibili = true

  for (const dettaglio of ordine.dettagli_ordini) {
    const giacenza = await getGiacenza(dettaglio.prodotto_id, magazzinoId)
    const sufficiente = giacenza >= dettaglio.quantita

    if (!sufficiente) {
      tuttiDisponibili = false
    }

    dettagli.push({
      prodotto_id: dettaglio.prodotto_id,
      quantita_richiesta: dettaglio.quantita,
      giacenza_disponibile: giacenza,
      sufficiente,
    })
  }

  return {
    disponibile: tuttiDisponibili,
    dettagli,
  }
}

// =====================================================
// GET: Lista movimenti magazzino con filtri
// =====================================================

export type MovimentoMagazzinoConDettagli = MovimentoMagazzino & {
  prodotto: {
    codice: string
    nome: string
    unita_misura?: string
  }
  magazzino: {
    codice: string
    nome: string
  }
  causale_movimento: {
    codice: string
    descrizione: string
    tipo: string
  }
  soggetto?: {
    ragione_sociale: string
  }
}

type GetMovimentiParams = {
  prodotto_id?: number
  magazzino_id?: number
  data_da?: string
  data_a?: string
  tipo?: string // 'carico' | 'scarico'
  limit?: number
}

export async function getMovimenti(params: GetMovimentiParams = {}): Promise<MovimentoMagazzinoConDettagli[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Prima recuperiamo i movimenti base
  let baseQuery = supabase
    .from('movimento_magazzino')
    .select('*')
    .order('data_movimento', { ascending: false })
    .order('created_at', { ascending: false })

  // Applica filtri
  if (params.prodotto_id) {
    baseQuery = baseQuery.eq('prodotto_id', params.prodotto_id)
  }

  if (params.magazzino_id) {
    baseQuery = baseQuery.eq('magazzino_id', params.magazzino_id)
  }

  if (params.data_da) {
    baseQuery = baseQuery.gte('data_movimento', params.data_da)
  }

  if (params.data_a) {
    baseQuery = baseQuery.lte('data_movimento', params.data_a)
  }

  if (params.tipo === 'carico') {
    baseQuery = baseQuery.eq('segno', 1)
  } else if (params.tipo === 'scarico') {
    baseQuery = baseQuery.eq('segno', -1)
  }

  if (params.limit) {
    baseQuery = baseQuery.limit(params.limit)
  }

  const { data: movimenti, error } = await baseQuery

  if (error) {
    console.error('Error fetching movimenti:', error)
    return []
  }

  if (!movimenti || movimenti.length === 0) {
    return []
  }

  // Recupera i dati collegati
  const prodottiIds = [...new Set(movimenti.map(m => m.prodotto_id))]
  const magazzinoIds = [...new Set(movimenti.map(m => m.magazzino_id))]
  const causaleIds = [...new Set(movimenti.map(m => m.causale_id))]
  const soggettoIds = [...new Set(movimenti.map(m => m.soggetto_id).filter(Boolean))]

  const [prodotti, magazzini, causali, soggetti] = await Promise.all([
    supabase.from('prodotto').select('id, codice, nome, unita_misura').in('id', prodottiIds),
    supabase.from('magazzino').select('id, codice, nome').in('id', magazzinoIds),
    supabase.from('causale_movimento').select('id, codice, descrizione, tipo').in('id', causaleIds),
    soggettoIds.length > 0
      ? supabase.from('soggetto').select('id, ragione_sociale').in('id', soggettoIds)
      : Promise.resolve({ data: [], error: null })
  ])

  // Crea mappe per lookup rapido
  const prodottiMap = new Map((prodotti.data || []).map(p => [p.id, p]))
  const magazziniMap = new Map((magazzini.data || []).map(m => [m.id, m]))
  const causaliMap = new Map((causali.data || []).map(c => [c.id, c]))
  const soggettiMap = new Map((soggetti.data || []).map(s => [s.id, s]))

  // Combina i dati
  return movimenti.map(movimento => ({
    ...movimento,
    prodotto: prodottiMap.get(movimento.prodotto_id) || { codice: '', nome: '', unita_misura: '' },
    magazzino: magazziniMap.get(movimento.magazzino_id) || { codice: '', nome: '' },
    causale_movimento: causaliMap.get(movimento.causale_id) || { codice: '', descrizione: '', tipo: '' },
    soggetto: movimento.soggetto_id ? soggettiMap.get(movimento.soggetto_id) : undefined
  })) as MovimentoMagazzinoConDettagli[]
}

// =====================================================
// GET: Soggetti filtrati per tipo (clienti o fornitori)
// =====================================================

export async function getSoggettiByTipo(tipo?: 'cliente' | 'fornitore'): Promise<Array<{id: number, ragione_sociale: string, tipo: string[]}>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let query = supabase
    .from('soggetto')
    .select('id, ragione_sociale, tipo')
    .eq('attivo', true)
    .order('ragione_sociale', { ascending: true })

  if (tipo) {
    // Usa @> per controllare se l'array contiene il tipo
    query = query.contains('tipo', [tipo])
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching soggetti:', error)
    return []
  }

  return data || []
}

// =====================================================
// GET: Prodotti venduti/acquistati da un soggetto
// =====================================================

export async function getProdottiBysoggetto(soggettoId: number, tipoOperazione: 'vendita' | 'acquisto'): Promise<Array<{id: number, codice: string, nome: string}>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Query sui movimenti per trovare i prodotti movimentati con questo soggetto
  const causaleSegno = tipoOperazione === 'acquisto' ? 1 : -1

  const { data, error } = await supabase
    .from('movimento_magazzino')
    .select(`
      prodotto_id,
      prodotto!prodotto_id (
        id,
        codice,
        nome
      )
    `)
    .eq('soggetto_id', soggettoId)
    .eq('segno', causaleSegno)

  if (error) {
    console.error('Error fetching prodotti by soggetto:', error)
    return []
  }

  // Estrai prodotti unici
  const prodottiMap = new Map<number, {id: number, codice: string, nome: string}>()

  data?.forEach((movimento: any) => {
    if (movimento.prodotto && !prodottiMap.has(movimento.prodotto.id)) {
      prodottiMap.set(movimento.prodotto.id, {
        id: movimento.prodotto.id,
        codice: movimento.prodotto.codice,
        nome: movimento.prodotto.nome
      })
    }
  })

  return Array.from(prodottiMap.values()).sort((a, b) => a.codice.localeCompare(b.codice))
}

// =====================================================
// GET: Ordini evasi per reso (filtra per tipo e soggetto)
// =====================================================

export type OrdinePerReso = {
  id: number
  numero_ordine: string
  data_ordine: string
  tipo: string
  totale: number
  dettagli_ordini: Array<{
    id: number
    prodotto_id: number
    prodotto: {
      codice: string
      nome: string
    }
    quantita: number
    prezzo_unitario: number
  }>
}

export async function getOrdiniPerReso(
  tipoOrdine: 'acquisto' | 'vendita',
  soggettoId?: number
): Promise<OrdinePerReso[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let query = supabase
    .from('ordini')
    .select(`
      id,
      numero_ordine,
      data_ordine,
      tipo,
      totale,
      dettagli_ordini (
        id,
        prodotto_id,
        prodotto:prodotto_id (
          codice,
          nome
        ),
        quantita,
        prezzo_unitario
      )
    `)
    .eq('tipo', tipoOrdine)
    .eq('stato', 'evaso') // Solo ordini evasi
    .order('data_ordine', { ascending: false })
    .limit(50)

  if (soggettoId) {
    const colonna = tipoOrdine === 'acquisto' ? 'fornitore_id' : 'cliente_id'
    query = query.eq(colonna, soggettoId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching ordini per reso:', error)
    return []
  }

  return (data || []) as unknown as OrdinePerReso[]
}

// =====================================================
// GET: Ultimo costo acquisto da movimenti
// =====================================================

export type UltimoCostoAcquisto = {
  costo_unitario: number
  data_movimento: string
  documento_numero?: string
  soggetto_ragione_sociale?: string
}

export async function getUltimoCostoAcquisto(prodottoId: number): Promise<UltimoCostoAcquisto | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Trova l'ultimo movimento di carico da ORDINE DI ACQUISTO (non resi o movimenti manuali)
  // - segno = 1 (carico)
  // - documento_numero inizia con 'ORD-A' (ordine acquisto, esclude MOV- e altri)
  const { data: movimento, error } = await supabase
    .from('movimento_magazzino')
    .select(`
      costo_unitario,
      data_movimento,
      documento_numero,
      soggetto_id
    `)
    .eq('prodotto_id', prodottoId)
    .eq('segno', 1) // Solo carichi
    .like('documento_numero', 'ORD-A%') // Solo ordini di ACQUISTO (esclude MOV-, ORD-V, ecc.)
    .not('costo_unitario', 'is', null) // Solo movimenti con costo
    .order('created_at', { ascending: false }) // Ordina per timestamp creazione (più preciso)
    .limit(1)
    .single()

  if (error || !movimento || !movimento.costo_unitario) {
    return null
  }

  // Se c'è un soggetto, recupera la ragione sociale
  let soggettoRagioneSociale: string | undefined
  if (movimento.soggetto_id) {
    const { data: soggetto } = await supabase
      .from('soggetto')
      .select('ragione_sociale')
      .eq('id', movimento.soggetto_id)
      .single()

    if (soggetto) {
      soggettoRagioneSociale = soggetto.ragione_sociale
    }
  }

  return {
    costo_unitario: movimento.costo_unitario,
    data_movimento: movimento.data_movimento,
    documento_numero: movimento.documento_numero || undefined,
    soggetto_ragione_sociale: soggettoRagioneSociale,
  }
}

// =====================================================
// GET: Ultima vendita prodotto (da movimenti ORD-V%)
// =====================================================

export type UltimaVendita = {
  prezzo_unitario: number
  data_movimento: string
  documento_numero?: string
  soggetto_ragione_sociale?: string
}

export async function getUltimaVendita(prodottoId: number): Promise<UltimaVendita | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Trova l'ultimo movimento di scarico da ORDINE DI VENDITA
  // - segno = -1 (scarico)
  // - documento_numero inizia con 'ORD-V' (ordine vendita)
  const { data: movimento, error } = await supabase
    .from('movimento_magazzino')
    .select(`
      costo_unitario,
      data_movimento,
      documento_numero,
      soggetto_id
    `)
    .eq('prodotto_id', prodottoId)
    .eq('segno', -1) // Solo scarichi
    .like('documento_numero', 'ORD-V%') // Solo ordini di VENDITA
    .not('costo_unitario', 'is', null) // Solo movimenti con prezzo
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (error || !movimento || !movimento.costo_unitario) {
    return null
  }

  // Se c'è un soggetto, recupera la ragione sociale
  let soggettoRagioneSociale: string | undefined
  if (movimento.soggetto_id) {
    const { data: soggetto } = await supabase
      .from('soggetto')
      .select('ragione_sociale')
      .eq('id', movimento.soggetto_id)
      .single()

    if (soggetto) {
      soggettoRagioneSociale = soggetto.ragione_sociale
    }
  }

  return {
    prezzo_unitario: movimento.costo_unitario, // In vendita, costo_unitario = prezzo vendita
    data_movimento: movimento.data_movimento,
    documento_numero: movimento.documento_numero || undefined,
    soggetto_ragione_sociale: soggettoRagioneSociale,
  }
}

// =====================================================
// GET: Statistiche prezzi prodotto (medie)
// =====================================================

export type StatistichePrezziProdotto = {
  costo_medio_acquisti: number | null
  prezzo_medio_vendite: number | null
  margine_medio_percentuale: number | null
  totale_acquisti: number
  totale_vendite: number
}

export async function getStatistichePrezziProdotto(prodottoId: number): Promise<StatistichePrezziProdotto> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      costo_medio_acquisti: null,
      prezzo_medio_vendite: null,
      margine_medio_percentuale: null,
      totale_acquisti: 0,
      totale_vendite: 0,
    }
  }

  // Query per media acquisti (ORD-A%)
  const { data: acquisti } = await supabase
    .from('movimento_magazzino')
    .select('costo_unitario, quantita')
    .eq('prodotto_id', prodottoId)
    .eq('segno', 1)
    .like('documento_numero', 'ORD-A%')
    .not('costo_unitario', 'is', null)

  // Query per media vendite (ORD-V%)
  const { data: vendite } = await supabase
    .from('movimento_magazzino')
    .select('costo_unitario, quantita')
    .eq('prodotto_id', prodottoId)
    .eq('segno', -1)
    .like('documento_numero', 'ORD-V%')
    .not('costo_unitario', 'is', null)

  // Calcola media ponderata acquisti
  let costoMedioAcquisti: number | null = null
  let totaleAcquisti = 0
  if (acquisti && acquisti.length > 0) {
    let sommaValori = 0
    let sommaQuantita = 0
    for (const m of acquisti) {
      const qta = Math.abs(m.quantita || 1)
      sommaValori += (m.costo_unitario || 0) * qta
      sommaQuantita += qta
    }
    if (sommaQuantita > 0) {
      costoMedioAcquisti = sommaValori / sommaQuantita
    }
    totaleAcquisti = acquisti.length
  }

  // Calcola media ponderata vendite
  let prezzoMedioVendite: number | null = null
  let totaleVendite = 0
  if (vendite && vendite.length > 0) {
    let sommaValori = 0
    let sommaQuantita = 0
    for (const m of vendite) {
      const qta = Math.abs(m.quantita || 1)
      sommaValori += (m.costo_unitario || 0) * qta
      sommaQuantita += qta
    }
    if (sommaQuantita > 0) {
      prezzoMedioVendite = sommaValori / sommaQuantita
    }
    totaleVendite = vendite.length
  }

  // Calcola margine medio
  let margineMedioPercentuale: number | null = null
  if (costoMedioAcquisti && prezzoMedioVendite && prezzoMedioVendite > 0) {
    margineMedioPercentuale = ((prezzoMedioVendite - costoMedioAcquisti) / prezzoMedioVendite) * 100
  }

  return {
    costo_medio_acquisti: costoMedioAcquisti,
    prezzo_medio_vendite: prezzoMedioVendite,
    margine_medio_percentuale: margineMedioPercentuale,
    totale_acquisti: totaleAcquisti,
    totale_vendite: totaleVendite,
  }
}

// =====================================================
// GET: Giacenze per tutti i prodotti
// =====================================================

export type GiacenzaProdotto = {
  id: number
  codice: string
  nome: string
  quantita_magazzino: number
  unita_misura?: string
  costo_medio?: number
  prezzo_vendita?: number
  valore_giacenza?: number
  punto_riordino?: number
  giacenza_minima?: number
  sotto_scorta: boolean
}

export async function getGiacenze(): Promise<GiacenzaProdotto[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data, error } = await supabase
    .from('prodotto')
    .select('id, codice, nome, quantita_magazzino, unita_misura, costo_medio, prezzo_vendita, punto_riordino, giacenza_minima')
    .eq('attivo', true)
    .order('codice', { ascending: true })

  if (error) {
    console.error('Error fetching giacenze:', error)
    return []
  }

  return (data || []).map(p => ({
    ...p,
    valore_giacenza: p.quantita_magazzino && p.costo_medio
      ? Number((p.quantita_magazzino * p.costo_medio).toFixed(2))
      : 0,
    sotto_scorta: p.punto_riordino ? p.quantita_magazzino < p.punto_riordino : false
  }))
}

// =====================================================
// GET: Dettaglio singolo movimento
// =====================================================

export type MovimentoDettaglio = {
  id: number
  azienda_id: string
  data_movimento: string
  quantita: number
  segno: number
  costo_unitario?: number
  costo_totale?: number
  documento_tipo?: string
  documento_numero?: string
  note?: string
  created_at: string
  prodotto: {
    id: number
    codice: string
    nome: string
    unita_misura?: string
  }
  magazzino: {
    id: number
    codice: string
    nome: string
  }
  magazzino_destinazione?: {
    id: number
    codice: string
    nome: string
  }
  causale: {
    id: number
    codice: string
    descrizione: string
    tipo: string
    segno: number
  }
  soggetto?: {
    id: number
    ragione_sociale: string
  }
  ordine?: {
    id: number
    numero_ordine: string
    data_ordine: string
    tipo: string
  }
}

export async function getMovimentoById(id: number): Promise<MovimentoDettaglio | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Recupera il movimento
  const { data: movimento, error: movimentoError } = await supabase
    .from('movimento_magazzino')
    .select('*')
    .eq('id', id)
    .single()

  if (movimentoError || !movimento) {
    console.error('Error fetching movimento:', movimentoError)
    return null
  }

  // Recupera dati correlati separatamente
  const [prodottoRes, magazzinoRes, causaleRes, soggettoRes, ordineRes, magazzinoDestRes] = await Promise.all([
    supabase.from('prodotto').select('id, codice, nome, unita_misura').eq('id', movimento.prodotto_id).single(),
    supabase.from('magazzino').select('id, codice, nome').eq('id', movimento.magazzino_id).single(),
    supabase.from('causale_movimento').select('id, codice, descrizione, tipo, segno').eq('id', movimento.causale_id).single(),
    movimento.soggetto_id ? supabase.from('soggetto').select('id, ragione_sociale').eq('id', movimento.soggetto_id).single() : Promise.resolve({ data: null, error: null }),
    movimento.documento_tipo === 'ordine' && movimento.documento_id
      ? supabase.from('ordini').select('id, numero_ordine, data_ordine, tipo').eq('id', movimento.documento_id).single()
      : Promise.resolve({ data: null, error: null }),
    movimento.magazzino_destinazione_id
      ? supabase.from('magazzino').select('id, codice, nome').eq('id', movimento.magazzino_destinazione_id).single()
      : Promise.resolve({ data: null, error: null })
  ])

  return {
    id: movimento.id,
    azienda_id: movimento.azienda_id,
    data_movimento: movimento.data_movimento,
    quantita: movimento.quantita,
    segno: movimento.segno,
    costo_unitario: movimento.costo_unitario,
    costo_totale: movimento.costo_totale,
    documento_tipo: movimento.documento_tipo,
    documento_numero: movimento.documento_numero,
    note: movimento.note,
    created_at: movimento.created_at,
    prodotto: prodottoRes.data!,
    magazzino: magazzinoRes.data!,
    magazzino_destinazione: magazzinoDestRes.data || undefined,
    causale: causaleRes.data!,
    soggetto: soggettoRes.data || undefined,
    ordine: ordineRes.data || undefined,
  }
}

// =====================================================
// GET: Giacenza impegnata (da ordini non evasi)
// =====================================================

export type GiacenzaCompleta = {
  giacenza_reale: number
  giacenza_impegnata_vendita: number // Quantità impegnata da ordini vendita non evasi
  giacenza_impegnata_acquisto: number // Quantità in arrivo da ordini acquisto non evasi
  giacenza_disponibile: number // giacenza_reale - impegnata_vendita
  giacenza_prevista: number // giacenza_disponibile + in_arrivo
}

export async function getGiacenzaCompleta(
  prodottoId: number,
  magazzinoId?: number
): Promise<GiacenzaCompleta> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return {
      giacenza_reale: 0,
      giacenza_impegnata_vendita: 0,
      giacenza_impegnata_acquisto: 0,
      giacenza_disponibile: 0,
      giacenza_prevista: 0,
    }
  }

  // 1. Recupera giacenza reale dal prodotto
  const { data: prodotto } = await supabase
    .from('prodotto')
    .select('quantita_magazzino')
    .eq('id', prodottoId)
    .single()

  const giacenzaReale = prodotto?.quantita_magazzino || 0

  // 2. Somma quantità impegnata da ordini VENDITA non evasi (bozza, confermato)
  let queryVendita = supabase
    .from('dettagli_ordini')
    .select(`
      quantita,
      ordini!inner (
        id,
        tipo,
        stato,
        magazzino_id
      )
    `)
    .eq('prodotto_id', prodottoId)
    .eq('ordini.tipo', 'vendita')
    .in('ordini.stato', ['bozza', 'confermato'])

  if (magazzinoId) {
    queryVendita = queryVendita.eq('ordini.magazzino_id', magazzinoId)
  }

  const { data: dettagliVendita } = await queryVendita

  const impegnataVendita = (dettagliVendita || []).reduce(
    (sum, d: any) => sum + (d.quantita || 0),
    0
  )

  // 3. Somma quantità in arrivo da ordini ACQUISTO non evasi (bozza, confermato)
  let queryAcquisto = supabase
    .from('dettagli_ordini')
    .select(`
      quantita,
      ordini!inner (
        id,
        tipo,
        stato,
        magazzino_id
      )
    `)
    .eq('prodotto_id', prodottoId)
    .eq('ordini.tipo', 'acquisto')
    .in('ordini.stato', ['bozza', 'confermato'])

  if (magazzinoId) {
    queryAcquisto = queryAcquisto.eq('ordini.magazzino_id', magazzinoId)
  }

  const { data: dettagliAcquisto } = await queryAcquisto

  const impegnataAcquisto = (dettagliAcquisto || []).reduce(
    (sum, d: any) => sum + (d.quantita || 0),
    0
  )

  // Calcola giacenze derivate
  const giacenzaDisponibile = giacenzaReale - impegnataVendita
  const giacenzaPrevista = giacenzaDisponibile + impegnataAcquisto

  return {
    giacenza_reale: giacenzaReale,
    giacenza_impegnata_vendita: impegnataVendita,
    giacenza_impegnata_acquisto: impegnataAcquisto,
    giacenza_disponibile: giacenzaDisponibile,
    giacenza_prevista: giacenzaPrevista,
  }
}
