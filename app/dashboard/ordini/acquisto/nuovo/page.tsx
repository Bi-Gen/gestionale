import { getFornitori } from '@/app/actions/fornitori'
import { getProdotti } from '@/app/actions/prodotti'
import { getMagazzini } from '@/app/actions/magazzino'
import Link from 'next/link'
import AcquistoForm from './AcquistoForm'

export default async function NuovoOrdineAcquistoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const fornitori = await getFornitori()
  const prodotti = await getProdotti()
  const magazzini = await getMagazzini()

  // Genera numero ordine automatico
  const numeroOrdine = `ORD-A-${Date.now()}`

  // Serializza i dati per assicurarci che siano passabili al Client Component
  const fornitoriSerialized = JSON.parse(JSON.stringify(fornitori))
  const prodottiSerialized = JSON.parse(JSON.stringify(prodotti))
  const magazziniSerialized = JSON.parse(JSON.stringify(magazzini))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/dashboard/ordini/acquisto"
            className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
          >
            ← Torna agli Ordini di Acquisto
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Nuovo Ordine di Acquisto</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {params.error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 border border-red-200">
            <p className="text-sm text-red-700">{params.error}</p>
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg p-6">
          <AcquistoForm
            fornitori={fornitoriSerialized}
            prodotti={prodottiSerialized}
            magazzini={magazziniSerialized}
            numeroOrdine={numeroOrdine}
          />
        </div>
      </main>
    </div>
  )
}
