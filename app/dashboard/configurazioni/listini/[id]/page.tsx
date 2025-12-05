import { getListino, getListinoProdotti, getListinoProdottiCount } from '@/app/actions/listini'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import AddProdottoModal from './AddProdottoModal'
import ListinoProdottiTable from './ListinoProdottiTable'

export default async function DettaglioListinoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const { id } = await params
  const search = await searchParams
  const listinoId = parseInt(id)

  const [listino, prodotti, count] = await Promise.all([
    getListino(listinoId),
    getListinoProdotti(listinoId),
    getListinoProdottiCount(listinoId),
  ])

  if (!listino) {
    notFound()
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard/configurazioni" className="hover:text-gray-700">
            Configurazioni
          </Link>
          <span>/</span>
          <Link href="/dashboard/configurazioni/listini" className="hover:text-gray-700">
            Listini
          </Link>
          <span>/</span>
          <span className="text-gray-900">{listino.codice}</span>
        </nav>

        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{listino.nome}</h1>
              {listino.tipo === 'vendita' ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Vendita
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  Acquisto
                </span>
              )}
              {listino.predefinito && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Predefinito
                </span>
              )}
              {!listino.attivo && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  Inattivo
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Codice: {listino.codice} | {count} prodotti
            </p>
            {listino.descrizione && (
              <p className="text-sm text-gray-500 mt-1">{listino.descrizione}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Link
              href={`/dashboard/configurazioni/listini/${listinoId}/modifica`}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
            >
              Modifica Listino
            </Link>
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white shadow-sm rounded-lg p-4">
          <p className="text-sm text-gray-500">Valuta</p>
          <p className="text-lg font-semibold text-gray-900">
            {listino.valuta_rel?.codice || 'EUR'}{' '}
            {listino.valuta_rel?.simbolo && (
              <span className="text-gray-500">({listino.valuta_rel.simbolo})</span>
            )}
          </p>
        </div>
        <div className="bg-white shadow-sm rounded-lg p-4">
          <p className="text-sm text-gray-500">Provvigione Default</p>
          <p className="text-lg font-semibold text-gray-900">{listino.provvigione_default}%</p>
        </div>
        <div className="bg-white shadow-sm rounded-lg p-4">
          <p className="text-sm text-gray-500">Priorita</p>
          <p className="text-lg font-semibold text-gray-900">{listino.priorita}</p>
        </div>
        <div className="bg-white shadow-sm rounded-lg p-4">
          <p className="text-sm text-gray-500">Fornitore</p>
          <p className="text-lg font-semibold text-gray-900">
            {listino.fornitore?.ragione_sociale || '-'}
          </p>
        </div>
      </div>

      {/* Messages */}
      {search.success && (
        <div className="mb-4 rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-700">{search.success}</p>
        </div>
      )}
      {search.error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{search.error}</p>
        </div>
      )}

      {/* Prodotti Section */}
      <div className="bg-white shadow-sm rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Prodotti nel Listino</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Gestisci i prezzi dei prodotti per questo listino
            </p>
          </div>
          <AddProdottoModal listinoId={listinoId} tipoListino={listino.tipo} />
        </div>

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
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Nessun prodotto nel listino
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Inizia aggiungendo prodotti a questo listino prezzi.
            </p>
          </div>
        ) : (
          <ListinoProdottiTable
            prodotti={prodotti}
            listinoId={listinoId}
            tipoListino={listino.tipo}
            provvigioneDefault={listino.provvigione_default}
          />
        )}
      </div>
    </div>
  )
}
