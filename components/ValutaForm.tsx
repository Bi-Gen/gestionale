'use client'

import { Valuta } from '@/app/actions/valute'
import { useState } from 'react'

type ValutaFormProps = {
  valuta?: Valuta
  action: (formData: FormData) => Promise<void>
  submitLabel: string
}

export default function ValutaForm({
  valuta,
  action,
  submitLabel,
}: ValutaFormProps) {
  const [attiva, setAttiva] = useState(valuta?.attiva ?? true)
  const [predefinita, setPredefinita] = useState(valuta?.predefinita ?? false)

  const today = new Date().toISOString().split('T')[0]

  return (
    <form action={action} className="space-y-6">
      {/* Codice e Nome */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="codice" className="block text-sm font-medium text-gray-700">
            Codice ISO <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="codice"
            name="codice"
            defaultValue={valuta?.codice}
            required
            maxLength={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
            placeholder="es: EUR"
          />
          <p className="mt-1 text-xs text-gray-500">
            Codice ISO 4217 (3 lettere)
          </p>
        </div>

        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
            Nome <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="nome"
            name="nome"
            defaultValue={valuta?.nome}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="es: Euro"
          />
        </div>
      </div>

      {/* Simbolo */}
      <div>
        <label htmlFor="simbolo" className="block text-sm font-medium text-gray-700">
          Simbolo <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="simbolo"
          name="simbolo"
          defaultValue={valuta?.simbolo}
          required
          maxLength={5}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="es: €"
        />
        <p className="mt-1 text-xs text-gray-500">
          Simbolo della valuta (€, $, £, etc.)
        </p>
      </div>

      {/* Tasso cambio e Data aggiornamento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="tasso_cambio" className="block text-sm font-medium text-gray-700">
            Tasso di cambio <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            step="0.000001"
            id="tasso_cambio"
            name="tasso_cambio"
            defaultValue={valuta?.tasso_cambio || 1}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="1.00"
          />
          <p className="mt-1 text-xs text-gray-500">
            Tasso rispetto alla valuta predefinita (1.00 = parità)
          </p>
        </div>

        <div>
          <label htmlFor="data_aggiornamento" className="block text-sm font-medium text-gray-700">
            Data aggiornamento
          </label>
          <input
            type="date"
            id="data_aggiornamento"
            name="data_aggiornamento"
            defaultValue={valuta?.data_aggiornamento || today}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Data ultimo aggiornamento tasso
          </p>
        </div>
      </div>

      {/* Flags */}
      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="predefinita"
            name="predefinita"
            value="true"
            checked={predefinita}
            onChange={(e) => setPredefinita(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="predefinita" className="ml-2 block text-sm text-gray-700">
            Valuta predefinita
          </label>
          <p className="ml-2 text-xs text-gray-500">
            (usata come base per i tassi di cambio)
          </p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="attiva"
            name="attiva"
            value="true"
            checked={attiva}
            onChange={(e) => setAttiva(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="attiva" className="ml-2 block text-sm text-gray-700">
            Valuta attiva
          </label>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors"
        >
          {submitLabel}
        </button>
        <a
          href="/dashboard/configurazioni/valute"
          className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 font-medium text-center transition-colors"
        >
          Annulla
        </a>
      </div>
    </form>
  )
}
