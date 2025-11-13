import { getOrdine } from '@/app/actions/ordini'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import ModificaOrdineForm from './ModificaOrdineForm'

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

  const redirectPath = ordine.tipo === 'acquisto'
    ? '/dashboard/ordini/acquisto'
    : '/dashboard/ordini/vendita'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href={`/dashboard/ordini/${id}`}
            className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
          >
            ← Torna all&apos;Ordine
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

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {query.error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 border border-red-200">
            <p className="text-sm text-red-700">{query.error}</p>
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Informazioni Cliente/Fornitore</h2>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-medium">
                {ordine.tipo === 'vendita' ? 'Cliente:' : 'Fornitore:'}
              </span>{' '}
              {ordine.tipo === 'vendita'
                ? (ordine.clienti as any)?.ragione_sociale || '-'
                : (ordine.fornitori as any)?.ragione_sociale || '-'
              }
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Cliente/Fornitore non può essere modificato. Per cambiarlo, crea un nuovo ordine.
            </p>
          </div>

          <ModificaOrdineForm ordine={ordine} redirectPath={redirectPath} />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            <strong>Nota:</strong> Questa pagina permette di modificare solo le informazioni base dell&apos;ordine.
            Per modificare i prodotti, usa il form nella{' '}
            <Link href={`/dashboard/ordini/${id}`} className="underline font-medium">
              pagina di dettaglio
            </Link>.
          </p>
        </div>
      </main>
    </div>
  )
}
