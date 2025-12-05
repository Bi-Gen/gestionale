'use client'

import { TipoSoggetto } from '@/app/actions/tipi-soggetto'
import { useState } from 'react'

type TipoSoggettoFormProps = {
  tipo?: TipoSoggetto
  action: (formData: FormData) => Promise<void>
  submitLabel: string
}

export default function TipoSoggettoForm({
  tipo,
  action,
  submitLabel,
}: TipoSoggettoFormProps) {
  const [attivo, setAttivo] = useState(tipo?.attivo ?? true)

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
          defaultValue={tipo?.codice}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="es: broker"
        />
        <p className="mt-1 text-sm text-gray-500">
          Codice identificativo univoco (es: cliente, fornitore, agente)
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
          defaultValue={tipo?.nome}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="es: Broker"
        />
        <p className="mt-1 text-sm text-gray-500">
          Nome visualizzato dell'interfaccia
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
          defaultValue={tipo?.descrizione || ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Descrizione opzionale del tipo di soggetto"
        />
      </div>

      {/* Colore e Icona */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Colore */}
        <div>
          <label htmlFor="colore" className="block text-sm font-medium text-gray-700">
            Colore
          </label>
          <div className="mt-1 flex gap-2">
            <input
              type="color"
              id="colore"
              name="colore"
              defaultValue={tipo?.colore || '#3B82F6'}
              className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
            />
            <input
              type="text"
              value={tipo?.colore || '#3B82F6'}
              readOnly
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 bg-gray-50 text-sm"
            />
          </div>
          <p className="mt-1 text-sm text-gray-500">
            Colore utilizzato per evidenziare questo tipo nell'interfaccia
          </p>
        </div>

        {/* Icona */}
        <div>
          <label htmlFor="icona" className="block text-sm font-medium text-gray-700">
            Icona
          </label>
          <input
            type="text"
            id="icona"
            name="icona"
            defaultValue={tipo?.icona || ''}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="es: user, building, truck"
          />
          <p className="mt-1 text-sm text-gray-500">
            Nome icona (opzionale)
          </p>
        </div>
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
          Tipo attivo
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
          href="/dashboard/configurazioni/tipi-soggetto"
          className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 font-medium text-center transition-colors"
        >
          Annulla
        </a>
      </div>
    </form>
  )
}
