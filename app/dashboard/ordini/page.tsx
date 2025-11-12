import { getOrdini } from '@/app/actions/ordini'
import Link from 'next/link'
import DeleteOrdineButton from './DeleteOrdineButton'

export default async function OrdiniPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string; tipo?: 'vendita' | 'acquisto' }>
}) {
  const params = await searchParams
  const tipo = params.tipo || 'vendita'
  const ordini = await getOrdini(tipo)

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <Link
                href="/dashboard"
                className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
              >
                ← Torna alla Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Ordini</h1>
            </div>
            <Link
              href="/dashboard/ordini/nuovo"
              className="px-4 py-2 bg-orange-600 text-white font-medium rounded-md hover:bg-orange-700 transition-colors"
            >
              + Nuovo Ordine
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {params.success && (
          <div className="mb-4 rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-700">{params.success}</p>
          </div>
        )}
        {params.error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{params.error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <Link
              href="/dashboard/ordini?tipo=vendita"
              className={`${
                tipo === 'vendita'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Ordini di Vendita
            </Link>
            <Link
              href="/dashboard/ordini?tipo=acquisto"
              className={`${
                tipo === 'acquisto'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Ordini di Acquisto
            </Link>
          </nav>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {ordini.length === 0 ? (
            <div className="text-center py-12">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                Nessun ordine di {tipo}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Inizia creando il tuo primo ordine.
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard/ordini/nuovo"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700"
                >
                  + Nuovo Ordine
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Numero
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {tipo === 'vendita' ? 'Cliente' : 'Fornitore'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Totale
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {ordini.map((ordine) => (
                    <tr key={ordine.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/dashboard/ordini/${ordine.id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-900"
                        >
                          {ordine.numero_ordine}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(ordine.data_ordine).toLocaleDateString('it-IT')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">-</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {ordine.stato}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          € {ordine.totale.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/dashboard/ordini/${ordine.id}`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Dettaglio
                        </Link>
                        <DeleteOrdineButton id={ordine.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
