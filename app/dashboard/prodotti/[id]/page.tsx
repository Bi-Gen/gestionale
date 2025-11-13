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
  const fornitore = fornitori.find(f => f.id === prodotto.fornitore_id)

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

        {/* Informazioni Prodotto */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Informazioni Prodotto</h2>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Codice</dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900">{prodotto.codice}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Nome</dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900">{prodotto.nome}</dd>
            </div>
            {prodotto.descrizione && (
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Descrizione</dt>
                <dd className="mt-1 text-sm text-gray-900">{prodotto.descrizione}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Prezzo Acquisto</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {prodotto.prezzo_acquisto ? `€ ${prodotto.prezzo_acquisto.toFixed(2)}` : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Prezzo Vendita</dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900">€ {prodotto.prezzo_vendita.toFixed(2)}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Quantità Magazzino</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {prodotto.quantita_magazzino || 0} {prodotto.unita_misura || 'pz'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Unità di Misura</dt>
              <dd className="mt-1 text-sm text-gray-900">{prodotto.unita_misura || '-'}</dd>
            </div>
            {prodotto.categoria && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Categoria</dt>
                <dd className="mt-1 text-sm text-gray-900">{prodotto.categoria}</dd>
              </div>
            )}
            {fornitore && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Fornitore</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <Link href={`/dashboard/fornitori/${fornitore.id}`} className="text-blue-600 hover:text-blue-900">
                    {fornitore.ragione_sociale}
                  </Link>
                </dd>
              </div>
            )}
            {prodotto.note && (
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Note</dt>
                <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{prodotto.note}</dd>
              </div>
            )}
          </dl>
        </div>

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
