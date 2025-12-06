import { getProdotto } from '@/app/actions/prodotti'
import { getFornitori } from '@/app/actions/fornitori'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function DettaglioProdottoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  const prodotto = await getProdotto(id)
  const fornitori = await getFornitori()

  if (!prodotto) {
    redirect('/dashboard/prodotti?error=Prodotto non trovato')
  }

  // Trova il fornitore associato
  const fornitore = fornitori.find(f => String(f.id) === String(prodotto.fornitore_principale_id))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/dashboard/prodotti"
            className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
          >
            ← Torna ai Prodotti
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dettaglio Prodotto
            </h1>
            <p className="text-sm text-gray-500 mt-1">Visualizzazione in sola lettura</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {query.success && (
          <div className="mb-4 rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-700">{query.success}</p>
          </div>
        )}
        {query.error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{query.error}</p>
          </div>
        )}

        {/* SEZIONE 1: IDENTIFICAZIONE */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">📦 Identificazione Prodotto</h2>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Codice Prodotto</dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900">{prodotto.codice}</dd>
            </div>
            {prodotto.sku && (
              <div>
                <dt className="text-sm font-medium text-gray-500">SKU</dt>
                <dd className="mt-1 text-sm text-gray-900">{prodotto.sku}</dd>
              </div>
            )}
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Nome</dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900">{prodotto.nome}</dd>
            </div>
            {prodotto.descrizione_breve && (
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Descrizione Breve</dt>
                <dd className="mt-1 text-sm text-gray-900">{prodotto.descrizione_breve}</dd>
              </div>
            )}
            {prodotto.descrizione && (
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Descrizione Completa</dt>
                <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">{prodotto.descrizione}</dd>
              </div>
            )}
            {prodotto.macrofamiglia_id && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Macrofamiglia</dt>
                <dd className="mt-1 text-sm text-gray-900">ID: {prodotto.macrofamiglia_id}</dd>
              </div>
            )}
            {prodotto.famiglia_id && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Famiglia</dt>
                <dd className="mt-1 text-sm text-gray-900">ID: {prodotto.famiglia_id}</dd>
              </div>
            )}
            {prodotto.linea_id && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Linea</dt>
                <dd className="mt-1 text-sm text-gray-900">ID: {prodotto.linea_id}</dd>
              </div>
            )}
            {prodotto.codice_ean && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Codice EAN (Barcode)</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{prodotto.codice_ean}</dd>
              </div>
            )}
            {prodotto.codice_fornitore && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Codice Fornitore</dt>
                <dd className="mt-1 text-sm text-gray-900">{prodotto.codice_fornitore}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* SEZIONE 2: PREZZI E COSTI */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">💰 Prezzi e Costi</h2>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {prodotto.costo_ultimo && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Costo Ultimo</dt>
                <dd className="mt-1 text-sm text-gray-900">€ {prodotto.costo_ultimo.toFixed(2)}</dd>
              </div>
            )}
            {prodotto.costo_medio && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Costo Medio</dt>
                <dd className="mt-1 text-sm text-gray-900">€ {prodotto.costo_medio.toFixed(2)}</dd>
              </div>
            )}
            {prodotto.prezzo_acquisto && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Prezzo Acquisto</dt>
                <dd className="mt-1 text-sm text-gray-900">€ {prodotto.prezzo_acquisto.toFixed(2)}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Prezzo Vendita</dt>
              <dd className="mt-1 text-sm font-semibold text-green-700">€ {prodotto.prezzo_vendita.toFixed(2)}</dd>
            </div>
            {prodotto.margine_percentuale && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Margine %</dt>
                <dd className="mt-1 text-sm text-gray-900">{prodotto.margine_percentuale.toFixed(2)}%</dd>
              </div>
            )}
            {prodotto.sconto_massimo && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Sconto Massimo</dt>
                <dd className="mt-1 text-sm text-gray-900">{prodotto.sconto_massimo.toFixed(2)}%</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Aliquota IVA</dt>
              <dd className="mt-1 text-sm text-gray-900">{prodotto.aliquota_iva || 22}%</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Valuta</dt>
              <dd className="mt-1 text-sm font-semibold text-blue-700">{prodotto.valuta || 'EUR'}</dd>
            </div>
          </dl>

          {/* Nota listini */}
          <p className="mt-6 pt-6 border-t border-gray-200 text-xs text-gray-500">
            💡 I listini prezzi si gestiscono da Configurazioni → Listini
          </p>
        </div>

        {/* SEZIONE 3: FORNITORE */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">🚚 Fornitore</h2>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Fornitore Principale</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {fornitore ? (
                  <Link href={`/dashboard/fornitori/${fornitore.id}`} className="text-blue-600 hover:text-blue-700 font-medium">
                    {fornitore.ragione_sociale}
                  </Link>
                ) : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Lead Time</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {prodotto.tempo_riordino_giorni ? `${prodotto.tempo_riordino_giorni} giorni` : '7 giorni (default)'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Quantità Minima Ordine</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {prodotto.quantita_minima_ordine || 1} {prodotto.unita_misura || 'PZ'}
              </dd>
            </div>
          </dl>
        </div>

        {/* SEZIONE 4: MAGAZZINO */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">📊 Magazzino e Giacenze</h2>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Unità di Misura</dt>
              <dd className="mt-1 text-sm text-gray-900">{prodotto.unita_misura || 'PZ'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Quantità Attuale</dt>
              <dd className={`mt-1 text-sm font-semibold ${
                prodotto.quantita_magazzino && prodotto.giacenza_minima && prodotto.quantita_magazzino < prodotto.giacenza_minima
                  ? 'text-red-700'
                  : 'text-gray-900'
              }`}>
                {prodotto.quantita_magazzino || 0} {prodotto.unita_misura || 'PZ'}
              </dd>
            </div>
            {prodotto.ubicazione && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Ubicazione</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{prodotto.ubicazione}</dd>
              </div>
            )}
            {prodotto.giacenza_minima && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Giacenza Minima</dt>
                <dd className="mt-1 text-sm text-gray-900">{prodotto.giacenza_minima} {prodotto.unita_misura || 'PZ'}</dd>
              </div>
            )}
            {prodotto.punto_riordino && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Punto di Riordino</dt>
                <dd className="mt-1 text-sm text-orange-700 font-medium">{prodotto.punto_riordino} {prodotto.unita_misura || 'PZ'}</dd>
              </div>
            )}
            {prodotto.giacenza_massima && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Giacenza Massima</dt>
                <dd className="mt-1 text-sm text-gray-900">{prodotto.giacenza_massima} {prodotto.unita_misura || 'PZ'}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* SEZIONE 5: MISURE E DIMENSIONI */}
        {(prodotto.peso_kg || prodotto.volume_m3 || prodotto.lunghezza_cm || prodotto.larghezza_cm || prodotto.altezza_cm) && (
          <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
            <div className="mb-4 pb-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">📏 Misure e Dimensioni</h2>
            </div>
            <dl className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {prodotto.peso_kg && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Peso</dt>
                  <dd className="mt-1 text-sm text-gray-900">{prodotto.peso_kg} kg</dd>
                </div>
              )}
              {prodotto.volume_m3 && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Volume</dt>
                  <dd className="mt-1 text-sm text-gray-900">{prodotto.volume_m3} m³</dd>
                </div>
              )}
              {prodotto.colli && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">N° Colli</dt>
                  <dd className="mt-1 text-sm text-gray-900">{prodotto.colli}</dd>
                </div>
              )}
              {(prodotto.lunghezza_cm || prodotto.larghezza_cm || prodotto.altezza_cm) && (
                <div className="md:col-span-4">
                  <dt className="text-sm font-medium text-gray-500">Dimensioni (L x l x h)</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {prodotto.lunghezza_cm || '-'} × {prodotto.larghezza_cm || '-'} × {prodotto.altezza_cm || '-'} cm
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* SEZIONE 6: GESTIONE AVANZATA */}
        {(prodotto.gestione_lotti || prodotto.gestione_seriali || prodotto.gestione_scadenze) && (
          <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
            <div className="mb-4 pb-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">⚙️ Gestione Avanzata</h2>
            </div>
            <dl className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <dt className="text-sm font-medium text-gray-500">Gestione Lotti</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {prodotto.gestione_lotti ? (
                    <span className="text-green-700 font-medium">✓ Attiva</span>
                  ) : (
                    <span className="text-gray-400">Non attiva</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Gestione Seriali</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {prodotto.gestione_seriali ? (
                    <span className="text-green-700 font-medium">✓ Attiva</span>
                  ) : (
                    <span className="text-gray-400">Non attiva</span>
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Gestione Scadenze</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {prodotto.gestione_scadenze ? (
                    <span className="text-green-700 font-medium">✓ Attiva</span>
                  ) : (
                    <span className="text-gray-400">Non attiva</span>
                  )}
                </dd>
              </div>
              {prodotto.giorni_scadenza && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Giorni Validità</dt>
                  <dd className="mt-1 text-sm text-gray-900">{prodotto.giorni_scadenza} giorni</dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* SEZIONE 7: VENDITA E VISIBILITÀ */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">🛒 Vendita e Visibilità</h2>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Vendibile</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {prodotto.vendibile ? (
                  <span className="text-green-700 font-medium">✓ Sì</span>
                ) : (
                  <span className="text-red-700">✗ No</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Acquistabile</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {prodotto.acquistabile ? (
                  <span className="text-green-700 font-medium">✓ Sì</span>
                ) : (
                  <span className="text-red-700">✗ No</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Visibile in Catalogo</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {prodotto.visibile_catalogo ? (
                  <span className="text-green-700 font-medium">✓ Sì</span>
                ) : (
                  <span className="text-red-700">✗ No</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Visibile in E-commerce</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {prodotto.visibile_ecommerce ? (
                  <span className="text-green-700 font-medium">✓ Sì</span>
                ) : (
                  <span className="text-gray-400">No</span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {/* SEZIONE 8: NOTE E IMMAGINI */}
        {(prodotto.note || prodotto.note_interne || prodotto.immagine_url) && (
          <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
            <div className="mb-4 pb-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">📝 Note e Immagini</h2>
            </div>
            <dl className="space-y-4">
              {prodotto.note && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Note (pubbliche)</dt>
                  <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">{prodotto.note}</dd>
                </div>
              )}
              {prodotto.note_interne && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Note Interne (riservate)</dt>
                  <dd className="mt-1 text-sm text-gray-900 bg-amber-50 p-3 rounded-md whitespace-pre-wrap border border-amber-200">{prodotto.note_interne}</dd>
                </div>
              )}
              {prodotto.immagine_url && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Immagine Principale</dt>
                  <dd className="mt-1">
                    <img src={prodotto.immagine_url} alt={prodotto.nome} className="max-w-md rounded-lg border border-gray-200" />
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}

        {/* Azioni */}
        <div className="flex gap-4 justify-end">
          <Link
            href="/dashboard/prodotti"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Chiudi
          </Link>
          <Link
            href={`/dashboard/prodotti/${id}/modifica`}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Modifica Prodotto
          </Link>
        </div>
      </main>
    </div>
  )
}
