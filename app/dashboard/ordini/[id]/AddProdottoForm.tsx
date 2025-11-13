'use client'

import { type Prodotto } from '@/app/actions/prodotti'
import { useState } from 'react'

type AddProdottoFormProps = {
  prodotti: Prodotto[]
  tipoOrdine: 'vendita' | 'acquisto'
  addDettaglioAction: (formData: FormData) => void
}

export default function AddProdottoForm({
  prodotti,
  tipoOrdine,
  addDettaglioAction
}: AddProdottoFormProps) {
  const [prezzoUnitario, setPrezzoUnitario] = useState<number>(0)

  const handleProdottoChange = (prodottoId: string) => {
    const selectedProdotto = prodotti.find(p => p.id === prodottoId)
    if (selectedProdotto) {
      const prezzo = tipoOrdine === 'vendita'
        ? selectedProdotto.prezzo_vendita
        : (selectedProdotto.prezzo_acquisto || selectedProdotto.prezzo_vendita)
      setPrezzoUnitario(prezzo)
    }
  }

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Aggiungi Prodotto</h2>
      <form action={addDettaglioAction} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="prodotto_id" className="block text-sm font-medium text-gray-700">
              Prodotto *
            </label>
            <select
              name="prodotto_id"
              id="prodotto_id"
              required
              onChange={(e) => handleProdottoChange(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
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
              step="0.01"
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
              value={prezzoUnitario}
              onChange={(e) => setPrezzoUnitario(parseFloat(e.target.value) || 0)}
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
  )
}
