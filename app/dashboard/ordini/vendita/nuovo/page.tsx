import { getClienti } from '@/app/actions/clienti'
import { getProdotti } from '@/app/actions/prodotti'
import Link from 'next/link'
import VenditaForm from './VenditaForm'

export default async function NuovoOrdineVenditaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const clienti = await getClienti()
  const prodotti = await getProdotti()

  // Genera numero ordine automatico
  const numeroOrdine = `ORD-V-${Date.now()}`

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/dashboard/ordini/vendita"
            className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
          >
            ← Torna agli Ordini di Vendita
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Nuovo Ordine di Vendita</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {params.error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 border border-red-200">
            <p className="text-sm text-red-700">{params.error}</p>
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg p-6">
          <VenditaForm clienti={clienti} prodotti={prodotti} numeroOrdine={numeroOrdine} />
        </div>
      </main>
    </div>
  )
}
