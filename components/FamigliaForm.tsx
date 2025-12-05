'use client'

import { Famiglia } from '@/app/actions/famiglie'
import { Macrofamiglia } from '@/app/actions/macrofamiglie'
import { useState } from 'react'

type FamigliaFormProps = {
  famiglia?: Famiglia
  macrofamiglie: Macrofamiglia[]
  action: (formData: FormData) => Promise<void>
  submitLabel: string
}

export default function FamigliaForm({
  famiglia,
  macrofamiglie,
  action,
  submitLabel,
}: FamigliaFormProps) {
  const [attivo, setAttivo] = useState(famiglia?.attivo ?? true)

  return (
    <form action={action} className="space-y-6">
      {/* Codice */}
      <div>
        <label htmlFor="codice" className="block text-sm font-medium text-gray-700">
          Codice <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="codice"
          name="codice"
          defaultValue={famiglia?.codice}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="es: TOVAGLIE"
        />
        <p className="mt-1 text-sm text-gray-500">
          Codice identificativo univoco
        </p>
      </div>

      {/* Nome */}
      <div>
        <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
          Nome <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="nome"
          name="nome"
          defaultValue={famiglia?.nome}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="es: Tovaglie"
        />
        <p className="mt-1 text-sm text-gray-500">
          Nome visualizzato nell&apos;interfaccia
        </p>
      </div>

      {/* Macrofamiglia */}
      <div>
        <label htmlFor="macrofamiglia_id" className="block text-sm font-medium text-gray-700">
          Macrofamiglia
        </label>
        <select
          id="macrofamiglia_id"
          name="macrofamiglia_id"
          defaultValue={famiglia?.macrofamiglia_id || ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">-- Nessuna --</option>
          {macrofamiglie.map((macro) => (
            <option key={macro.id} value={macro.id}>
              {macro.nome}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">
          Macrofamiglia di appartenenza (opzionale)
        </p>
      </div>

      {/* Descrizione */}
      <div>
        <label htmlFor="descrizione" className="block text-sm font-medium text-gray-700">
          Descrizione
        </label>
        <textarea
          id="descrizione"
          name="descrizione"
          rows={3}
          defaultValue={famiglia?.descrizione || ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Descrizione opzionale della famiglia"
        />
      </div>

      {/* Ordinamento */}
      <div>
        <label htmlFor="ordinamento" className="block text-sm font-medium text-gray-700">
          Ordinamento
        </label>
        <input
          type="number"
          id="ordinamento"
          name="ordinamento"
          defaultValue={famiglia?.ordinamento || 0}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="0"
        />
        <p className="mt-1 text-sm text-gray-500">
          Ordine di visualizzazione (valori più bassi appaiono prima)
        </p>
      </div>

      {/* Attivo */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="attivo"
          name="attivo"
          value="true"
          checked={attivo}
          onChange={(e) => setAttivo(e.target.checked)}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="attivo" className="ml-2 block text-sm text-gray-700">
          Famiglia attiva
        </label>
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
          href="/dashboard/configurazioni/famiglie"
          className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 font-medium text-center transition-colors"
        >
          Annulla
        </a>
      </div>
    </form>
  )
}
