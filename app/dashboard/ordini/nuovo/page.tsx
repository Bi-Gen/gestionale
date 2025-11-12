import { createOrdine } from '@/app/actions/ordini'
import { getClienti } from '@/app/actions/clienti'
import { getFornitori } from '@/app/actions/fornitori'
import Link from 'next/link'

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
          <form action={createOrdine} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="numero_ordine" className="block text-sm font-medium text-gray-700">
                  Numero Ordine *
                </label>
                <input
                  type="text"
                  name="numero_ordine"
                  id="numero_ordine"
                  required
                  defaultValue={numeroOrdine}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="data_ordine" className="block text-sm font-medium text-gray-700">
                  Data Ordine *
                </label>
                <input
                  type="date"
                  name="data_ordine"
                  id="data_ordine"
                  required
                  defaultValue={new Date().toISOString().split('T')[0]}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">
                Tipo Ordine *
              </label>
              <select
                name="tipo"
                id="tipo"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                onChange={(e) => {
                  const clienteField = document.getElementById('cliente_id_field')
                  const fornitoreField = document.getElementById('fornitore_id_field')
                  if (e.target.value === 'vendita') {
                    clienteField?.classList.remove('hidden')
                    fornitoreField?.classList.add('hidden')
                  } else {
                    clienteField?.classList.add('hidden')
                    fornitoreField?.classList.remove('hidden')
                  }
                }}
              >
                <option value="vendita">Ordine di Vendita (a Cliente)</option>
                <option value="acquisto">Ordine di Acquisto (da Fornitore)</option>
              </select>
            </div>

            <div id="cliente_id_field">
              <label htmlFor="cliente_id" className="block text-sm font-medium text-gray-700">
                Cliente *
              </label>
              <select
                name="cliente_id"
                id="cliente_id"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="">Seleziona un cliente</option>
                {clienti.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.ragione_sociale}
                  </option>
                ))}
              </select>
            </div>

            <div id="fornitore_id_field" className="hidden">
              <label htmlFor="fornitore_id" className="block text-sm font-medium text-gray-700">
                Fornitore *
              </label>
              <select
                name="fornitore_id"
                id="fornitore_id"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="">Seleziona un fornitore</option>
                {fornitori.map((fornitore) => (
                  <option key={fornitore.id} value={fornitore.id}>
                    {fornitore.ragione_sociale}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="stato" className="block text-sm font-medium text-gray-700">
                Stato
              </label>
              <select
                name="stato"
                id="stato"
                defaultValue="bozza"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="bozza">Bozza</option>
                <option value="confermato">Confermato</option>
                <option value="evaso">Evaso</option>
                <option value="annullato">Annullato</option>
              </select>
            </div>

            <div>
              <label htmlFor="note" className="block text-sm font-medium text-gray-700">
                Note
              </label>
              <textarea
                name="note"
                id="note"
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-4 justify-end">
              <Link
                href="/dashboard/ordini"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annulla
              </Link>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 text-white font-medium rounded-md hover:bg-orange-700 transition-colors"
              >
                Crea Ordine
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
