import { getProdotti } from '@/app/actions/prodotti'
import Link from 'next/link'
import DeleteProdottoButton from './DeleteProdottoButton'

export default async function ProdottiPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const prodotti = await getProdotti()
  const params = await searchParams

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
              <h1 className="text-2xl font-bold text-gray-900">Anagrafica Prodotti</h1>
            </div>
            <Link
              href="/dashboard/prodotti/nuovo"
              className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
            >
              + Nuovo Prodotto
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

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          {prodotti.length === 0 ? (
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
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nessun prodotto</h3>
              <p className="mt-1 text-sm text-gray-500">
                Inizia aggiungendo il tuo primo prodotto.
              </p>
              <div className="mt-6">
                <Link
                  href="/dashboard/prodotti/nuovo"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  + Nuovo Prodotto
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Codice
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prezzo Vendita
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Giacenza
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {prodotti.map((prodotto) => (
                    <tr key={prodotto.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {prodotto.codice}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{prodotto.nome}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{prodotto.categoria || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          € {prodotto.prezzo_vendita.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {prodotto.quantita_magazzino || 0} {prodotto.unita_misura || 'pz'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/dashboard/prodotti/${prodotto.id}/modifica`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Modifica
                        </Link>
                        <DeleteProdottoButton id={prodotto.id} />
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
