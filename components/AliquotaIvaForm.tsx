'use client'

import { AliquotaIva } from '@/app/actions/aliquote-iva'
import { useState } from 'react'

type AliquotaIvaFormProps = {
  aliquota?: AliquotaIva
  action: (formData: FormData) => Promise<void>
  submitLabel: string
}

export default function AliquotaIvaForm({
  aliquota,
  action,
  submitLabel,
}: AliquotaIvaFormProps) {
  const [attiva, setAttiva] = useState(aliquota?.attiva ?? true)
  const [predefinita, setPredefinita] = useState(aliquota?.predefinita ?? false)

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
          defaultValue={aliquota?.codice}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="es: IVA22"
        />
      </div>

      {/* Descrizione */}
      <div>
        <label htmlFor="descrizione" className="block text-sm font-medium text-gray-700">
          Descrizione <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="descrizione"
          name="descrizione"
          defaultValue={aliquota?.descrizione}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="es: IVA ordinaria 22%"
        />
      </div>

      {/* Percentuale */}
      <div>
        <label htmlFor="percentuale" className="block text-sm font-medium text-gray-700">
          Percentuale <span className="text-red-500">*</span>
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <input
            type="number"
            step="0.01"
            id="percentuale"
            name="percentuale"
            defaultValue={aliquota?.percentuale || ''}
            required
            className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-12 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="22.00"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">%</span>
          </div>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Percentuale IVA (es: 22.00 per IVA 22%)
        </p>
      </div>

      {/* Flags */}
      <div className="space-y-3">
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
            Aliquota predefinita
          </label>
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
            Aliquota attiva
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
          href="/dashboard/configurazioni/codici-iva"
          className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 font-medium text-center transition-colors"
        >
          Annulla
        </a>
      </div>
    </form>
  )
}
