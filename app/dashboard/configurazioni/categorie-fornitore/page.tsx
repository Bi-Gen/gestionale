import { getCategorieFornitore } from '@/app/actions/categorie-fornitore'
import Link from 'next/link'
import DeleteCategoriaFornitoreButton from './DeleteCategoriaFornitoreButton'

export default async function CategorieFornitoriPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const params = await searchParams
  const categorie = await getCategorieFornitore()

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorie Fornitore</h1>
          <p className="text-sm text-gray-600 mt-1">
            Classifica i fornitori per organizzazione e report
          </p>
        </div>
        <Link
          href="/dashboard/configurazioni/categorie-fornitore/nuovo"
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          + Nuova Categoria
        </Link>
      </div>

      {/* Messages */}
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

      {/* Table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {categorie.length === 0 ? (
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
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Nessuna categoria
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Inizia creando la prima categoria fornitore.
            </p>
            <div className="mt-6">
              <Link
                href="/dashboard/configurazioni/categorie-fornitore/nuovo"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                + Nuova Categoria
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priorità
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stato
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {categorie.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: cat.colore }}
                        />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {cat.codice}
                          </div>
                          <div className="text-sm text-gray-500">{cat.nome}</div>
                          {cat.descrizione && (
                            <div className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
                              {cat.descrizione}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {cat.priorita}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {cat.attivo ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Attivo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Inattivo
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/dashboard/configurazioni/categorie-fornitore/${cat.id}/modifica`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Modifica"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <DeleteCategoriaFornitoreButton
                          id={cat.id}
                          nome={cat.nome}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
