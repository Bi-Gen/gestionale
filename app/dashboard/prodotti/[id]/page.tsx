import { getProdotto } from '@/app/actions/prodotti'
import { getFornitori } from '@/app/actions/fornitori'
import { getMacrofamiglie } from '@/app/actions/macrofamiglie'
import { getFamiglie } from '@/app/actions/famiglie'
import { getLinee } from '@/app/actions/linee'
import { getUltimoCostoAcquisto } from '@/app/actions/magazzino'
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

  const [prodotto, fornitori, macrofamiglie, famiglie, linee, ultimoCostoAcquisto] = await Promise.all([
    getProdotto(id),
    getFornitori(),
    getMacrofamiglie(),
    getFamiglie(),
    getLinee(),
    getUltimoCostoAcquisto(parseInt(id)),
  ])

  if (!prodotto) {
    redirect('/dashboard/prodotti?error=Prodotto non trovato')
  }

  // Trova entità correlate
  const fornitore = fornitori.find(f => String(f.id) === String(prodotto.fornitore_principale_id))
  const macrofamiglia = macrofamiglie.find(m => m.id === prodotto.macrofamiglia_id)
  const famiglia = famiglie.find(f => f.id === prodotto.famiglia_id)
  const linea = linee.find(l => l.id === prodotto.linea_id)

  // Calcoli packaging
  const pezziPerCartone = (prodotto.pkg_pezzi_per_confezione || 1) * (prodotto.pkg_confezioni_per_cartone || 1)
  const pezziPerPallet = prodotto.pkg_cartoni_per_pallet ? pezziPerCartone * prodotto.pkg_cartoni_per_pallet : null
  const volumeCartoneM3 = prodotto.pkg_cartone_lunghezza_cm && prodotto.pkg_cartone_larghezza_cm && prodotto.pkg_cartone_altezza_cm
    ? (prodotto.pkg_cartone_lunghezza_cm * prodotto.pkg_cartone_larghezza_cm * prodotto.pkg_cartone_altezza_cm) / 1000000
    : null
  const pesoPerPallet = prodotto.pkg_cartoni_per_pallet && prodotto.pkg_cartone_peso_kg
    ? prodotto.pkg_cartoni_per_pallet * prodotto.pkg_cartone_peso_kg
    : null

  const hasPackaging = prodotto.pkg_pezzi_per_confezione || prodotto.pkg_confezioni_per_cartone || prodotto.pkg_cartoni_per_pallet

  // Calcola margine reale basato sul costo ultimo da movimenti
  const costoReale = ultimoCostoAcquisto?.costo_unitario ?? prodotto.costo_ultimo
  const margineReale = costoReale && prodotto.prezzo_vendita > 0
    ? ((prodotto.prezzo_vendita - costoReale) / prodotto.prezzo_vendita) * 100
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header compatto */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/dashboard/prodotti"
                className="text-blue-600 hover:text-blue-700 text-sm mb-1 inline-block"
              >
                ← Torna ai Prodotti
              </Link>
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">{prodotto.nome}</h1>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-mono rounded-full">
                  {prodotto.codice}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/dashboard/prodotti/${id}/modifica`}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Modifica
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {query.success && (
          <div className="mb-4 rounded-md bg-green-50 p-4 border border-green-200">
            <p className="text-sm text-green-700">{query.success}</p>
          </div>
        )}
        {query.error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 border border-red-200">
            <p className="text-sm text-red-700">{query.error}</p>
          </div>
        )}

        {/* Layout a 2 colonne */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Colonna principale (2/3) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Card: Identificazione */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                Identificazione
              </h2>

              {/* Descrizioni */}
              {prodotto.descrizione_breve && (
                <p className="text-gray-600 mb-4">{prodotto.descrizione_breve}</p>
              )}
              {prodotto.descrizione && (
                <div className="bg-gray-50 p-3 rounded-md mb-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{prodotto.descrizione}</p>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {prodotto.sku && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">SKU</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900">{prodotto.sku}</dd>
                  </div>
                )}
                {prodotto.codice_ean && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">EAN</dt>
                    <dd className="mt-1 text-sm font-mono text-gray-900">{prodotto.codice_ean}</dd>
                  </div>
                )}
                {prodotto.codice_fornitore && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Cod. Fornitore</dt>
                    <dd className="mt-1 text-sm text-gray-900">{prodotto.codice_fornitore}</dd>
                  </div>
                )}
                {prodotto.codice_doganale && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">HS Code</dt>
                    <dd className="mt-1 text-sm text-gray-900">{prodotto.codice_doganale}</dd>
                  </div>
                )}
                {prodotto.misura && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Misura</dt>
                    <dd className="mt-1 text-sm text-gray-900">{prodotto.misura}</dd>
                  </div>
                )}
              </div>

              {/* Classificazioni */}
              {(macrofamiglia || famiglia || linea) && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <dt className="text-xs font-medium text-gray-500 uppercase mb-2">Classificazione</dt>
                  <div className="flex flex-wrap gap-2">
                    {macrofamiglia && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                        {macrofamiglia.nome}
                      </span>
                    )}
                    {famiglia && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {famiglia.nome}
                      </span>
                    )}
                    {linea && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        {linea.nome}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Card: Packaging */}
            {hasPackaging && (
              <div className="bg-white shadow-sm rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                  Packaging / Confezionamento
                </h2>

                <div className="space-y-4">
                  {/* Livelli packaging */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Confezione */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">Confezione</h3>
                      <p className="text-2xl font-bold text-gray-900">
                        {prodotto.pkg_pezzi_per_confezione || 1}
                        <span className="text-sm font-normal text-gray-500 ml-1">pz</span>
                      </p>
                      {prodotto.pkg_nome_confezione && prodotto.pkg_nome_confezione !== 'Confezione' && (
                        <p className="text-xs text-gray-500 mt-1">{prodotto.pkg_nome_confezione}</p>
                      )}
                    </div>

                    {/* Cartone */}
                    <div className="bg-amber-50 rounded-lg p-4">
                      <h3 className="text-xs font-medium text-amber-700 uppercase mb-2">Cartone</h3>
                      <p className="text-2xl font-bold text-amber-900">
                        {prodotto.pkg_confezioni_per_cartone || 1}
                        <span className="text-sm font-normal text-amber-600 ml-1">conf</span>
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        = {pezziPerCartone} pz/cartone
                      </p>
                    </div>

                    {/* Pallet */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="text-xs font-medium text-blue-700 uppercase mb-2">Pallet</h3>
                      {prodotto.pkg_cartoni_per_pallet ? (
                        <>
                          <p className="text-2xl font-bold text-blue-900">
                            {prodotto.pkg_cartoni_per_pallet}
                            <span className="text-sm font-normal text-blue-600 ml-1">cart</span>
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            = {pezziPerPallet?.toLocaleString()} pz/pallet
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-400">Non configurato</p>
                      )}
                    </div>
                  </div>

                  {/* Dimensioni cartone */}
                  {(prodotto.pkg_cartone_lunghezza_cm || prodotto.pkg_cartone_peso_kg) && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-xs font-medium text-gray-500 uppercase mb-3">Dimensioni Cartone</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {prodotto.pkg_cartone_lunghezza_cm && prodotto.pkg_cartone_larghezza_cm && prodotto.pkg_cartone_altezza_cm && (
                          <div>
                            <dt className="text-xs text-gray-500">Dimensioni (LxPxH)</dt>
                            <dd className="text-sm font-medium text-gray-900">
                              {prodotto.pkg_cartone_lunghezza_cm} x {prodotto.pkg_cartone_larghezza_cm} x {prodotto.pkg_cartone_altezza_cm} cm
                            </dd>
                          </div>
                        )}
                        {volumeCartoneM3 && (
                          <div>
                            <dt className="text-xs text-gray-500">Volume</dt>
                            <dd className="text-sm font-medium text-gray-900">{volumeCartoneM3.toFixed(4)} m³</dd>
                          </div>
                        )}
                        {prodotto.pkg_cartone_peso_kg && (
                          <div>
                            <dt className="text-xs text-gray-500">Peso Cartone</dt>
                            <dd className="text-sm font-medium text-gray-900">{prodotto.pkg_cartone_peso_kg} kg</dd>
                          </div>
                        )}
                        {pesoPerPallet && (
                          <div>
                            <dt className="text-xs text-gray-500">Peso Pallet</dt>
                            <dd className="text-sm font-medium text-gray-900">{pesoPerPallet.toFixed(1)} kg</dd>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Container */}
                  {(prodotto.pkg_pallet_per_container_20ft || prodotto.pkg_pallet_per_container_40ft) && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h3 className="text-xs font-medium text-green-700 uppercase mb-3">Container</h3>
                      <div className="grid grid-cols-2 gap-4">
                        {prodotto.pkg_pallet_per_container_20ft && (
                          <div>
                            <dt className="text-xs text-green-600">Container 20ft</dt>
                            <dd className="text-lg font-bold text-green-900">{prodotto.pkg_pallet_per_container_20ft} pallet</dd>
                          </div>
                        )}
                        {prodotto.pkg_pallet_per_container_40ft && (
                          <div>
                            <dt className="text-xs text-green-600">Container 40ft</dt>
                            <dd className="text-lg font-bold text-green-900">{prodotto.pkg_pallet_per_container_40ft} pallet</dd>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Card: Note */}
            {(prodotto.note || prodotto.note_interne) && (
              <div className="bg-white shadow-sm rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                  Note
                </h2>
                <div className="space-y-4">
                  {prodotto.note && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase mb-1">Note pubbliche</dt>
                      <dd className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">{prodotto.note}</dd>
                    </div>
                  )}
                  {prodotto.note_interne && (
                    <div>
                      <dt className="text-xs font-medium text-amber-600 uppercase mb-1">Note interne</dt>
                      <dd className="text-sm text-gray-700 bg-amber-50 p-3 rounded-md border border-amber-200 whitespace-pre-wrap">{prodotto.note_interne}</dd>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar (1/3) */}
          <div className="space-y-6">

            {/* Card: Prezzi */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                Prezzi
              </h2>
              <div className="space-y-4">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <dt className="text-xs font-medium text-green-600 uppercase">Prezzo Vendita</dt>
                  <dd className="text-3xl font-bold text-green-700 mt-1">
                    € {prodotto.prezzo_vendita.toFixed(2)}
                  </dd>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {ultimoCostoAcquisto ? (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <dt className="text-xs text-gray-500">Costo Ultimo</dt>
                      <dd className="text-lg font-semibold text-gray-900">€ {ultimoCostoAcquisto.costo_unitario.toFixed(2)}</dd>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(ultimoCostoAcquisto.data_movimento).toLocaleDateString('it-IT')}
                      </p>
                    </div>
                  ) : prodotto.costo_ultimo != null ? (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <dt className="text-xs text-gray-500">Costo Ultimo</dt>
                      <dd className="text-lg font-semibold text-gray-900">€ {prodotto.costo_ultimo.toFixed(2)}</dd>
                    </div>
                  ) : null}
                  {prodotto.costo_medio != null && (
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <dt className="text-xs text-gray-500">Costo Medio</dt>
                      <dd className="text-lg font-semibold text-gray-900">€ {prodotto.costo_medio.toFixed(2)}</dd>
                    </div>
                  )}
                </div>

                {margineReale != null && (
                  <div className="flex items-center justify-between py-2 border-t border-gray-100">
                    <span className="text-sm text-gray-500">Margine</span>
                    <span className={`text-sm font-semibold ${margineReale > 20 ? 'text-green-600' : margineReale > 10 ? 'text-amber-600' : 'text-red-600'}`}>
                      {margineReale.toFixed(1)}%
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between py-2 border-t border-gray-100">
                  <span className="text-sm text-gray-500">IVA</span>
                  <span className="text-sm font-medium text-gray-900">{prodotto.aliquota_iva || 22}%</span>
                </div>

                <div className="flex items-center justify-between py-2 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Valuta</span>
                  <span className="text-sm font-medium text-gray-900">{prodotto.valuta || 'EUR'}</span>
                </div>
              </div>
            </div>

            {/* Card: Magazzino */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                Magazzino
              </h2>
              <div className="space-y-4">
                <div className={`rounded-lg p-4 text-center ${
                  prodotto.quantita_magazzino && prodotto.giacenza_minima && prodotto.quantita_magazzino < prodotto.giacenza_minima
                    ? 'bg-red-50'
                    : prodotto.quantita_magazzino && prodotto.punto_riordino && prodotto.quantita_magazzino < prodotto.punto_riordino
                      ? 'bg-amber-50'
                      : 'bg-blue-50'
                }`}>
                  <dt className="text-xs font-medium text-gray-600 uppercase">Giacenza</dt>
                  <dd className={`text-3xl font-bold mt-1 ${
                    prodotto.quantita_magazzino && prodotto.giacenza_minima && prodotto.quantita_magazzino < prodotto.giacenza_minima
                      ? 'text-red-700'
                      : prodotto.quantita_magazzino && prodotto.punto_riordino && prodotto.quantita_magazzino < prodotto.punto_riordino
                        ? 'text-amber-700'
                        : 'text-blue-700'
                  }`}>
                    {prodotto.quantita_magazzino || 0}
                    <span className="text-lg font-normal ml-1">{prodotto.unita_misura || 'PZ'}</span>
                  </dd>
                </div>

                <div className="space-y-2">
                  {prodotto.giacenza_minima != null && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-gray-500">Minimo</span>
                      <span className="text-sm font-medium text-gray-900">{prodotto.giacenza_minima} {prodotto.unita_misura || 'PZ'}</span>
                    </div>
                  )}
                  {prodotto.punto_riordino != null && (
                    <div className="flex items-center justify-between py-2 border-t border-gray-100">
                      <span className="text-sm text-gray-500">Riordino</span>
                      <span className="text-sm font-medium text-amber-600">{prodotto.punto_riordino} {prodotto.unita_misura || 'PZ'}</span>
                    </div>
                  )}
                  {prodotto.giacenza_massima != null && (
                    <div className="flex items-center justify-between py-2 border-t border-gray-100">
                      <span className="text-sm text-gray-500">Massimo</span>
                      <span className="text-sm font-medium text-gray-900">{prodotto.giacenza_massima} {prodotto.unita_misura || 'PZ'}</span>
                    </div>
                  )}
                  {prodotto.ubicazione && (
                    <div className="flex items-center justify-between py-2 border-t border-gray-100">
                      <span className="text-sm text-gray-500">Ubicazione</span>
                      <span className="text-sm font-mono font-medium text-gray-900">{prodotto.ubicazione}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card: Fornitore */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                Fornitore
              </h2>
              <div className="space-y-3">
                <div>
                  <dt className="text-xs text-gray-500 uppercase">Fornitore Principale</dt>
                  <dd className="mt-1">
                    {fornitore ? (
                      <Link href={`/dashboard/fornitori/${fornitore.id}`} className="text-blue-600 hover:text-blue-700 font-medium">
                        {fornitore.ragione_sociale}
                      </Link>
                    ) : (
                      <span className="text-gray-400">Non assegnato</span>
                    )}
                  </dd>
                </div>
                <div className="flex items-center justify-between py-2 border-t border-gray-100">
                  <span className="text-sm text-gray-500">Lead Time</span>
                  <span className="text-sm font-medium text-gray-900">{prodotto.tempo_riordino_giorni || 7} gg</span>
                </div>
                {prodotto.transit_time_giorni != null && (
                  <div className="flex items-center justify-between py-2 border-t border-gray-100">
                    <span className="text-sm text-gray-500">Transit Time</span>
                    <span className="text-sm font-medium text-gray-900">{prodotto.transit_time_giorni} gg</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2 border-t border-gray-100">
                  <span className="text-sm text-gray-500">MOQ</span>
                  <span className="text-sm font-medium text-gray-900">{prodotto.quantita_minima_ordine || 1} {prodotto.unita_misura || 'PZ'}</span>
                </div>
              </div>
            </div>

            {/* Card: Stato */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                Stato
              </h2>
              <div className="flex flex-wrap gap-2">
                {prodotto.vendibile !== false && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">Vendibile</span>
                )}
                {prodotto.acquistabile !== false && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">Acquistabile</span>
                )}
                {prodotto.visibile_catalogo !== false && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">In Catalogo</span>
                )}
                {prodotto.visibile_ecommerce && (
                  <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">E-commerce</span>
                )}
                {prodotto.gestione_lotti && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">Lotti</span>
                )}
                {prodotto.gestione_seriali && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">Seriali</span>
                )}
                {prodotto.gestione_scadenze && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">Scadenze</span>
                )}
              </div>

              {prodotto.giorni_scadenza != null && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Validità</span>
                    <span className="text-sm font-medium text-gray-900">{prodotto.giorni_scadenza} giorni</span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-8 flex gap-4 justify-end">
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
