import { getListini } from '@/app/actions/listini'
import Link from 'next/link'
import DeleteListinoButton from './DeleteListinoButton'

export default async function ListiniPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string; tipo?: string }>
}) {
  const params = await searchParams
  const listini = await getListini(params.tipo as 'vendita' | 'acquisto' | undefined)

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Listini</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gestisci i listini prezzi di vendita e acquisto
          </p>
        </div>
        <Link
          href={`/dashboard/configurazioni/listini/nuovo${params.tipo ? `?tipo=${params.tipo}` : ''}`}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          + Nuovo Listino
        </Link>
      </div>

      {/* Filtri */}
      <div className="mb-4 flex gap-2">
        <Link
          href="/dashboard/configurazioni/listini"
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            !params.tipo
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Tutti
        </Link>
        <Link
          href="/dashboard/configurazioni/listini?tipo=vendita"
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            params.tipo === 'vendita'
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Vendita
        </Link>
        <Link
          href="/dashboard/configurazioni/listini?tipo=acquisto"
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            params.tipo === 'acquisto'
              ? 'bg-orange-100 text-orange-700'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Acquisto
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
        {listini.length === 0 ? (
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
              Nessun listino
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Inizia creando il tuo primo listino prezzi.
            </p>
            <div className="mt-6">
              <Link
                href={`/dashboard/configurazioni/listini/nuovo${params.tipo ? `?tipo=${params.tipo}` : ''}`}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                + Nuovo Listino
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Codice / Nome
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valuta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Provvigione
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priorita
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
                {listini.map((listino) => (
                  <tr key={listino.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">
                            {listino.codice}
                          </span>
                          {listino.predefinito && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              Predefinito
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">{listino.nome}</span>
                        {listino.descrizione && (
                          <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
                            {listino.descrizione}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {listino.tipo === 'vendita' ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Vendita
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Acquisto
                        </span>
                      )}
                      {listino.fornitore && (
                        <div className="text-xs text-gray-500 mt-1">
                          {listino.fornitore.ragione_sociale}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {listino.valuta_rel?.codice || listino.valuta || 'EUR'}
                      </span>
                      {listino.valuta_rel?.simbolo && (
                        <span className="text-gray-500 ml-1">
                          ({listino.valuta_rel.simbolo})
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {listino.provvigione_default}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {listino.priorita}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {listino.attivo ? (
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
                          href={`/dashboard/configurazioni/listini/${listino.id}`}
                          className="text-gray-600 hover:text-gray-900"
                          title="Visualizza prezzi"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                        <Link
                          href={`/dashboard/configurazioni/listini/${listino.id}/modifica`}
                          className="text-blue-600 hover:text-blue-900"
                          title="Modifica"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </Link>
                        <DeleteListinoButton
                          id={listino.id}
                          nome={listino.nome}
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
