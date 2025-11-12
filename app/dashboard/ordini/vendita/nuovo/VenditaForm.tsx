'use client'

import { createOrdine } from '@/app/actions/ordini'
import Link from 'next/link'
import { type Cliente } from '@/app/actions/clienti'

export default function VenditaForm({
  clienti,
  numeroOrdine,
}: {
  clienti: Cliente[]
  numeroOrdine: string
}) {
  return (
    <form action={createOrdine} className="space-y-6">
      {/* Campo hidden per il tipo */}
      <input type="hidden" name="tipo" value="vendita" />

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
        <label htmlFor="cliente_id" className="block text-sm font-medium text-gray-700">
          Cliente *
        </label>
        <select
          name="cliente_id"
          id="cliente_id"
          required
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
          href="/dashboard/ordini/vendita"
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Annulla
        </Link>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Crea Ordine di Vendita
        </button>
      </div>
    </form>
  )
}
