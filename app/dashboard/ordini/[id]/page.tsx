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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href={ordine.tipo === 'vendita' ? '/dashboard/ordini/vendita' : '/dashboard/ordini/acquisto'}
            className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
          >
            ← Torna agli Ordini {ordine.tipo === 'vendita' ? 'di Vendita' : 'di Acquisto'}
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dettaglio Ordine
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

        {/* Informazioni Ordine - SOLA LETTURA */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Informazioni Ordine</h2>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Numero Ordine</dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900">{ordine.numero_ordine}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Tipo</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  ordine.tipo === 'vendita' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                }`}>
                  {ordine.tipo === 'vendita' ? 'Vendita' : 'Acquisto'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Data Ordine</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(ordine.data_ordine).toLocaleDateString('it-IT', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                {ordine.tipo === 'vendita' ? 'Cliente' : 'Fornitore'}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900">
                {ordine.tipo === 'vendita'
                  ? (ordine.cliente as any)?.ragione_sociale || '-'
                  : (ordine.fornitore as any)?.ragione_sociale || '-'
                }
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Stato</dt>
              <dd className="mt-1">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  ordine.stato === 'confermato' ? 'bg-green-100 text-green-800' :
                  ordine.stato === 'evaso' ? 'bg-blue-100 text-blue-800' :
                  ordine.stato === 'annullato' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {ordine.stato.charAt(0).toUpperCase() + ordine.stato.slice(1)}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Totale Ordine</dt>
              <dd className="mt-1 text-lg font-bold text-gray-900">€ {ordine.totale.toFixed(2)}</dd>
            </div>
            {ordine.note && (
              <div className="md:col-span-3">
                <dt className="text-sm font-medium text-gray-500">Note</dt>
                <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{ordine.note}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Prodotti */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900">Prodotti Ordine</h2>
            <p className="text-sm text-gray-600 mt-1">Elenco dei prodotti in questo ordine</p>
          </div>

          {ordine.dettagli && ordine.dettagli.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Codice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Prodotto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Quantità
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Prezzo Unit.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sconto %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Subtotale
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ordine.dettagli.map((dettaglio: any) => {
                  const sconto = dettaglio.sconto_percentuale || 0
                  return (
                    <tr key={dettaglio.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {dettaglio.prodotto?.codice}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {dettaglio.prodotto?.nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {dettaglio.quantita} {dettaglio.prodotto?.unita_misura}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        € {dettaglio.prezzo_unitario.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {sconto > 0 ? (
                          <span className="text-red-600 font-medium">{sconto.toFixed(2)}%</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        € {dettaglio.subtotale.toFixed(2)}
                      </td>
                    </tr>
                  )
                })}
                <tr className="bg-gray-50">
                  <td colSpan={5} className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                    TOTALE:
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    € {ordine.totale.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-12 text-center text-gray-500">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun prodotto</h3>
              <p className="mt-1 text-sm text-gray-500">
                Questo ordine non contiene ancora prodotti.
              </p>
            </div>
          )}
        </div>

        {/* Azioni */}
        <div className="flex gap-4 justify-end">
          <Link
            href={ordine.tipo === 'vendita' ? '/dashboard/ordini/vendita' : '/dashboard/ordini/acquisto'}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Chiudi
          </Link>
          {ordine.stato !== 'evaso' && ordine.stato !== 'annullato' && (
            <>
              <EvadiOrdineButton ordineId={parseInt(id)} tipo={ordine.tipo} />
              <Link
                href={`/dashboard/ordini/${id}/modifica`}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Modifica Ordine
              </Link>
            </>
          )}
          {ordine.stato === 'evaso' && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-md cursor-not-allowed" title="Gli ordini evasi non possono essere modificati">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              Ordine Evaso - Non Modificabile
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
