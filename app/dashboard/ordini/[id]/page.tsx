import { getOrdine, addDettaglioOrdine, removeDettaglioOrdine } from '@/app/actions/ordini'
import { getProdotti } from '@/app/actions/prodotti'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import RemoveDettaglioButton from './RemoveDettaglioButton'
import AddProdottoForm from './AddProdottoForm'

export default async function DettaglioOrdinePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  const ordine = await getOrdine(id)
  const prodotti = await getProdotti()

  if (!ordine) {
    redirect('/dashboard/ordini?error=Ordine non trovato')
  }

  // Serializza i dati per il Client Component
  const prodottiSerialized = JSON.parse(JSON.stringify(prodotti))
  const addDettaglioWithId = addDettaglioOrdine.bind(null, id)

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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Ordine {ordine.numero_ordine}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                ordine.stato === 'confermato' ? 'bg-green-100 text-green-800' :
                ordine.stato === 'evaso' ? 'bg-blue-100 text-blue-800' :
                ordine.stato === 'annullato' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {ordine.stato}
              </span>
              <Link
                href={`/dashboard/ordini/${id}/modifica`}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                Modifica Ordine
              </Link>
            </div>
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

        {/* Informazioni Ordine */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Informazioni Ordine</h2>
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Tipo</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">{ordine.tipo}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Data</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {new Date(ordine.data_ordine).toLocaleDateString('it-IT')}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">
                {ordine.tipo === 'vendita' ? 'Cliente' : 'Fornitore'}
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {ordine.tipo === 'vendita'
                  ? (ordine.clienti as any)?.ragione_sociale || '-'
                  : (ordine.fornitori as any)?.ragione_sociale || '-'
                }
              </dd>
            </div>
            {ordine.note && (
              <div className="md:col-span-3">
                <dt className="text-sm font-medium text-gray-500">Note</dt>
                <dd className="mt-1 text-sm text-gray-900">{ordine.note}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Prodotti */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Prodotti</h2>
          </div>

          {ordine.dettagli && ordine.dettagli.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Codice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Prodotto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Quantità
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Prezzo Unit.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Subtotale
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Azioni
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ordine.dettagli.map((dettaglio: any) => (
                  <tr key={dettaglio.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dettaglio.prodotti?.codice}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dettaglio.prodotti?.nome}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {dettaglio.quantita} {dettaglio.prodotti?.unita_misura}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      € {dettaglio.prezzo_unitario.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      € {dettaglio.subtotale.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <RemoveDettaglioButton ordineId={id} dettaglioId={dettaglio.id} />
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-50">
                  <td colSpan={4} className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                    TOTALE:
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                    € {ordine.totale.toFixed(2)}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-12 text-center text-gray-500">
              Nessun prodotto aggiunto. Usa il form qui sotto per aggiungere prodotti.
            </div>
          )}
        </div>

        {/* Form Aggiungi Prodotto */}
        <AddProdottoForm
          prodotti={prodottiSerialized}
          tipoOrdine={ordine.tipo}
          addDettaglioAction={addDettaglioWithId}
        />
      </main>
    </div>
  )
}
