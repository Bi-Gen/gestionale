import { getOrdine } from '@/app/actions/ordini'
import { getClienti } from '@/app/actions/clienti'
import { getFornitori } from '@/app/actions/fornitori'
import { getProdotti } from '@/app/actions/prodotti'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import ModificaOrdineCompleto from './ModificaOrdineCompleto'

export default async function ModificaOrdinePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  const ordine = await getOrdine(id)

  if (!ordine) {
    redirect('/dashboard/ordini?error=Ordine non trovato')
  }

  const clienti = await getClienti()
  const fornitori = await getFornitori()
  const prodotti = await getProdotti()

  // Serializza i dati per il Client Component
  const clientiSerialized = JSON.parse(JSON.stringify(clienti))
  const fornitoriSerialized = JSON.parse(JSON.stringify(fornitori))
  const prodottiSerialized = JSON.parse(JSON.stringify(prodotti))
  const dettagliSerialized = JSON.parse(JSON.stringify(ordine.dettagli || []))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href={ordine.tipo === 'vendita' ? '/dashboard/ordini/vendita' : '/dashboard/ordini/acquisto'}
            className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
          >
            ← Torna agli Ordini {ordine.tipo === 'vendita' ? 'di Vendita' : 'di Acquisto'}
          </Link>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Modifica Ordine {ordine.numero_ordine}
            </h1>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
              ordine.tipo === 'vendita' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
            }`}>
              {ordine.tipo === 'vendita' ? 'Vendita' : 'Acquisto'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {query.error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 border border-red-200">
            <p className="text-sm text-red-700">{query.error}</p>
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg p-6">
          <ModificaOrdineCompleto
            ordine={ordine}
            clienti={clientiSerialized}
            fornitori={fornitoriSerialized}
            prodotti={prodottiSerialized}
            dettagliEsistenti={dettagliSerialized}
          />
        </div>
      </main>
    </div>
  )
}
