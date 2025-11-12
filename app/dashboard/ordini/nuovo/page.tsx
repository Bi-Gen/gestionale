import { getClienti } from '@/app/actions/clienti'
import { getFornitori } from '@/app/actions/fornitori'
import Link from 'next/link'
import OrdineForm from './OrdineForm'

export default async function NuovoOrdinePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const clienti = await getClienti()
  const fornitori = await getFornitori()

  // Genera numero ordine automatico
  const numeroOrdine = `ORD-${Date.now()}`

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/dashboard/ordini"
            className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
          >
            ← Torna agli Ordini
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Nuovo Ordine</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {params.error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 border border-red-200">
            <p className="text-sm text-red-700">{params.error}</p>
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg p-6">
          <OrdineForm
            clienti={clienti}
            fornitori={fornitori}
            numeroOrdine={numeroOrdine}
          />
        </div>
      </main>
    </div>
  )
}
