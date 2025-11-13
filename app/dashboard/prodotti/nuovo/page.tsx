import { createProdotto } from '@/app/actions/prodotti'
import { getFornitori } from '@/app/actions/fornitori'
import Link from 'next/link'

export default async function NuovoProdottoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const fornitori = await getFornitori()

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
          <h1 className="text-2xl font-bold text-gray-900">Nuovo Prodotto</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {params.error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 border border-red-200">
            <p className="text-sm text-red-700">{params.error}</p>
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg p-6">
          <form action={createProdotto} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="codice" className="block text-sm font-medium text-gray-700">
                  Codice Prodotto *
                </label>
                <input
                  type="text"
                  name="codice"
                  id="codice"
                  required
                  placeholder="PROD001"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="categoria" className="block text-sm font-medium text-gray-700">
                  Categoria
                </label>
                <input
                  type="text"
                  name="categoria"
                  id="categoria"
                  placeholder="Elettronica"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
                Nome Prodotto *
              </label>
              <input
                type="text"
                name="nome"
                id="nome"
                required
                placeholder="Nome del prodotto"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="descrizione" className="block text-sm font-medium text-gray-700">
                Descrizione
              </label>
              <textarea
                name="descrizione"
                id="descrizione"
                rows={3}
                placeholder="Descrizione dettagliata del prodotto"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="prezzo_acquisto" className="block text-sm font-medium text-gray-700">
                  Prezzo Acquisto (€)
                </label>
                <input
                  type="number"
                  name="prezzo_acquisto"
                  id="prezzo_acquisto"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="prezzo_vendita" className="block text-sm font-medium text-gray-700">
                  Prezzo Vendita (€) *
                </label>
                <input
                  type="number"
                  name="prezzo_vendita"
                  id="prezzo_vendita"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="quantita_magazzino" className="block text-sm font-medium text-gray-700">
                  Quantità Magazzino
                </label>
                <input
                  type="number"
                  name="quantita_magazzino"
                  id="quantita_magazzino"
                  min="0"
                  defaultValue="0"
                  placeholder="0"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="unita_misura" className="block text-sm font-medium text-gray-700">
                  Unità di Misura
                </label>
                <select
                  name="unita_misura"
                  id="unita_misura"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="pz">Pezzi (pz)</option>
                  <option value="kg">Kilogrammi (kg)</option>
                  <option value="lt">Litri (lt)</option>
                  <option value="mt">Metri (mt)</option>
                  <option value="mq">Metri quadri (mq)</option>
                  <option value="cf">Confezioni (cf)</option>
                </select>
              </div>

              <div>
                <label htmlFor="fornitore_id" className="block text-sm font-medium text-gray-700">
                  Fornitore Principale
                </label>
                <select
                  name="fornitore_id"
                  id="fornitore_id"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                >
                  <option value="">Nessun fornitore</option>
                  {fornitori.map((fornitore) => (
                    <option key={fornitore.id} value={fornitore.id}>
                      {fornitore.ragione_sociale}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700">
                Note
              </label>
              <textarea
                name="note"
                id="note"
                rows={3}
                placeholder="Note aggiuntive"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-4 justify-end">
              <Link
                href="/dashboard/prodotti"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annulla
              </Link>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors"
              >
                Salva Prodotto
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
