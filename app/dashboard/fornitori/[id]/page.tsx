import { getFornitore } from '@/app/actions/fornitori'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function DettaglioFornitorePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  const fornitore = await getFornitore(id)

  if (!fornitore) {
    redirect('/dashboard/fornitori?error=Fornitore non trovato')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/dashboard/fornitori"
            className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
          >
            ← Torna ai Fornitori
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dettaglio Fornitore
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

        {/* Informazioni Fornitore */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Informazioni Fornitore</h2>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Ragione Sociale</dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900">{fornitore.ragione_sociale}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Partita IVA</dt>
              <dd className="mt-1 text-sm text-gray-900">{fornitore.partita_iva || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{fornitore.email || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Telefono</dt>
              <dd className="mt-1 text-sm text-gray-900">{fornitore.telefono || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Indirizzo</dt>
              <dd className="mt-1 text-sm text-gray-900">{fornitore.indirizzo || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Città</dt>
              <dd className="mt-1 text-sm text-gray-900">{fornitore.citta || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">CAP</dt>
              <dd className="mt-1 text-sm text-gray-900">{fornitore.cap || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Provincia</dt>
              <dd className="mt-1 text-sm text-gray-900">{fornitore.provincia || '-'}</dd>
            </div>
            {fornitore.note && (
              <div className="md:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Note</dt>
                <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{fornitore.note}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Azioni */}
        <div className="flex gap-4 justify-end">
          <Link
            href="/dashboard/fornitori"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Chiudi
          </Link>
          <Link
            href={`/dashboard/fornitori/${id}/modifica`}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Modifica Fornitore
          </Link>
        </div>
      </main>
    </div>
  )
}
