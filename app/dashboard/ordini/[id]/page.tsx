import { getOrdine } from '@/app/actions/ordini'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import EvadiOrdineButton from '@/components/EvadiOrdineButton'

export default async function DettaglioOrdinePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  const ordine = await getOrdine(id)

  if (!ordine) {
    redirect('/dashboard/ordini?error=Ordine non trovato')
  }

  // Calcola totali
  const totaleQuantita = ordine.dettagli?.reduce((sum: number, d: any) => sum + (d.quantita || 0), 0) || 0
  const totaleSconto = ordine.dettagli?.reduce((sum: number, d: any) => {
    const lordo = d.quantita * d.prezzo_unitario
    const sconto = lordo * ((d.sconto_percentuale || 0) / 100)
    return sum + sconto
  }, 0) || 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header compatto */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href={ordine.tipo === 'vendita' ? '/dashboard/ordini/vendita' : '/dashboard/ordini/acquisto'}
                className="text-blue-600 hover:text-blue-700 text-sm mb-1 inline-block"
              >
                ← Torna agli Ordini {ordine.tipo === 'vendita' ? 'di Vendita' : 'di Acquisto'}
              </Link>
              <div className="flex items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">{ordine.numero_ordine}</h1>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  ordine.tipo === 'vendita' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                }`}>
                  {ordine.tipo === 'vendita' ? 'Vendita' : 'Acquisto'}
                </span>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  ordine.stato === 'confermato' ? 'bg-green-100 text-green-800' :
                  ordine.stato === 'evaso' ? 'bg-purple-100 text-purple-800' :
                  ordine.stato === 'annullato' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {ordine.stato.charAt(0).toUpperCase() + ordine.stato.slice(1)}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              {ordine.stato !== 'evaso' && ordine.stato !== 'annullato' && (
                <>
                  <EvadiOrdineButton ordineId={parseInt(id)} tipo={ordine.tipo} />
                  <Link
                    href={`/dashboard/ordini/${id}/modifica`}
                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Modifica
                  </Link>
                </>
              )}
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

            {/* Card: Informazioni Ordine */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                Informazioni Ordine
              </h2>
              <dl className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">Data Ordine</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900">
                    {new Date(ordine.data_ordine).toLocaleDateString('it-IT', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">
                    {ordine.tipo === 'vendita' ? 'Cliente' : 'Fornitore'}
                  </dt>
                  <dd className="mt-1 text-sm font-semibold text-gray-900">
                    {ordine.tipo === 'vendita'
                      ? (ordine.cliente as any)?.ragione_sociale || '-'
                      : (ordine.fornitore as any)?.ragione_sociale || '-'
                    }
                  </dd>
                </div>
                {ordine.magazzino && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Magazzino</dt>
                    <dd className="mt-1 text-sm text-gray-900">{ordine.magazzino.nome}</dd>
                  </div>
                )}
              </dl>
              {ordine.note && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <dt className="text-xs font-medium text-gray-500 uppercase mb-1">Note</dt>
                  <dd className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md whitespace-pre-wrap">{ordine.note}</dd>
                </div>
              )}
            </div>

            {/* Card: Prodotti Ordine */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Prodotti Ordine</h2>
                <p className="text-sm text-gray-500 mt-1">{ordine.dettagli?.length || 0} prodotti</p>
              </div>

              {ordine.dettagli && ordine.dettagli.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {ordine.dettagli.map((dettaglio: any) => {
                    const sconto = dettaglio.sconto_percentuale || 0
                    const lordo = dettaglio.quantita * dettaglio.prezzo_unitario
                    const scontoEuro = lordo * (sconto / 100)
                    return (
                      <div key={dettaglio.id} className="p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                {dettaglio.prodotto?.codice}
                              </span>
                              <Link
                                href={`/dashboard/prodotti/${dettaglio.prodotto?.id}`}
                                className="text-sm font-medium text-gray-900 hover:text-blue-600"
                              >
                                {dettaglio.prodotto?.nome}
                              </Link>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                              <span>
                                <span className="font-medium text-gray-700">{dettaglio.quantita}</span>
                                {' '}{dettaglio.prodotto?.unita_misura || 'PZ'}
                              </span>
                              <span>
                                @ €{dettaglio.prezzo_unitario.toFixed(2)}/{dettaglio.prodotto?.unita_misura || 'PZ'}
                              </span>
                              {sconto > 0 && (
                                <span className="text-red-600">
                                  -{sconto.toFixed(1)}% (-€{scontoEuro.toFixed(2)})
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${ordine.tipo === 'vendita' ? 'text-blue-600' : 'text-orange-600'}`}>
                              €{dettaglio.subtotale.toFixed(2)}
                            </div>
                            {sconto > 0 && (
                              <div className="text-xs text-gray-400 line-through">
                                €{lordo.toFixed(2)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="px-6 py-12 text-center text-gray-500">
                  <h3 className="text-sm font-medium text-gray-900">Nessun prodotto</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Questo ordine non contiene ancora prodotti.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar (1/3) */}
          <div className="space-y-6">

            {/* Card: Riepilogo Totali */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                Riepilogo
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Articoli</span>
                  <span className="font-medium text-gray-900">{ordine.dettagli?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Quantità totale</span>
                  <span className="font-medium text-gray-900">{totaleQuantita}</span>
                </div>
                {totaleSconto > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">Sconti applicati</span>
                    <span className="font-medium text-red-600">-€{totaleSconto.toFixed(2)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-gray-200">
                  <div className={`rounded-lg p-4 text-center ${
                    ordine.tipo === 'vendita' ? 'bg-blue-50' : 'bg-orange-50'
                  }`}>
                    <dt className="text-xs font-medium text-gray-600 uppercase">Totale Ordine</dt>
                    <dd className={`text-3xl font-bold mt-1 ${
                      ordine.tipo === 'vendita' ? 'text-blue-700' : 'text-orange-700'
                    }`}>
                      €{ordine.totale.toFixed(2)}
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            {/* Card: Stato */}
            <div className="bg-white shadow-sm rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                Stato Ordine
              </h2>
              <div className={`rounded-lg p-4 text-center ${
                ordine.stato === 'confermato' ? 'bg-green-50' :
                ordine.stato === 'evaso' ? 'bg-purple-50' :
                ordine.stato === 'annullato' ? 'bg-red-50' :
                'bg-gray-50'
              }`}>
                <span className={`text-2xl font-bold ${
                  ordine.stato === 'confermato' ? 'text-green-700' :
                  ordine.stato === 'evaso' ? 'text-purple-700' :
                  ordine.stato === 'annullato' ? 'text-red-700' :
                  'text-gray-700'
                }`}>
                  {ordine.stato.charAt(0).toUpperCase() + ordine.stato.slice(1)}
                </span>
              </div>
              {ordine.stato === 'bozza' && (
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Ordine in bozza - modificabile
                </p>
              )}
              {ordine.stato === 'confermato' && (
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Ordine confermato - pronto per evasione
                </p>
              )}
              {ordine.stato === 'evaso' && (
                <p className="text-xs text-purple-600 mt-3 text-center">
                  Ordine evaso - non modificabile
                </p>
              )}
            </div>

            {/* Card: Azioni rapide */}
            {ordine.stato !== 'evaso' && ordine.stato !== 'annullato' && (
              <div className="bg-white shadow-sm rounded-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
                  Azioni
                </h2>
                <div className="space-y-3">
                  <Link
                    href={`/dashboard/ordini/${id}/modifica`}
                    className="block w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors text-center"
                  >
                    Modifica Ordine
                  </Link>
                  <div className="w-full">
                    <EvadiOrdineButton ordineId={parseInt(id)} tipo={ordine.tipo} />
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer actions */}
        <div className="mt-8 flex gap-4 justify-end">
          <Link
            href={ordine.tipo === 'vendita' ? '/dashboard/ordini/vendita' : '/dashboard/ordini/acquisto'}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Chiudi
          </Link>
        </div>
      </main>
    </div>
  )
}
