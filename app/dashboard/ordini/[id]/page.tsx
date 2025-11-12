import { getOrdine, addDettaglioOrdine, removeDettaglioOrdine } from '@/app/actions/ordini'
import { getProdotti } from '@/app/actions/prodotti'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import RemoveDettaglioButton from './RemoveDettaglioButton'

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
            <h1 className="text-2xl font-bold text-gray-900">
              Ordine {ordine.numero_ordine}
            </h1>
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
              ordine.stato === 'confermato' ? 'bg-green-100 text-green-800' :
              ordine.stato === 'evaso' ? 'bg-blue-100 text-blue-800' :
              ordine.stato === 'annullato' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {ordine.stato}
            </span>
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
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Aggiungi Prodotto</h2>
          <form action={addDettaglioWithId} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="prodotto_id" className="block text-sm font-medium text-gray-700">
                  Prodotto *
                </label>
                <select
                  name="prodotto_id"
                  id="prodotto_id"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  onChange={(e) => {
                    const select = e.target as HTMLSelectElement
                    const selectedProdotto = prodotti.find(p => p.id === select.value)
                    if (selectedProdotto) {
                      const prezzoInput = document.getElementById('prezzo_unitario') as HTMLInputElement
                      if (prezzoInput) {
                        prezzoInput.value = ordine.tipo === 'vendita'
                          ? selectedProdotto.prezzo_vendita.toString()
                          : (selectedProdotto.prezzo_acquisto || selectedProdotto.prezzo_vendita).toString()
                      }
                    }
                  }}
                >
                  <option value="">Seleziona prodotto</option>
                  {prodotti.map((prodotto) => (
                    <option key={prodotto.id} value={prodotto.id}>
                      {prodotto.codice} - {prodotto.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="quantita" className="block text-sm font-medium text-gray-700">
                  Quantità *
                </label>
                <input
                  type="number"
                  name="quantita"
                  id="quantita"
                  min="1"
                  required
                  defaultValue="1"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="prezzo_unitario" className="block text-sm font-medium text-gray-700">
                  Prezzo Unit. (€) *
                </label>
                <input
                  type="number"
                  name="prezzo_unitario"
                  id="prezzo_unitario"
                  step="0.01"
                  min="0"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 text-white font-medium rounded-md hover:bg-orange-700 transition-colors"
              >
                Aggiungi Prodotto
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
