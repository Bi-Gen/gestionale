'use client'

import { CausaleMovimento } from '@/app/actions/causali-movimento'
import { useState } from 'react'

type CausaleMovimentoFormProps = {
  causale?: CausaleMovimento
  action: (formData: FormData) => Promise<void>
  submitLabel: string
}

export default function CausaleMovimentoForm({
  causale,
  action,
  submitLabel,
}: CausaleMovimentoFormProps) {
  const [attivo, setAttivo] = useState(causale?.attivo ?? true)
  const [visibile, setVisibile] = useState(causale?.visibile ?? true)
  const [aggiornaCostoMedio, setAggiornaCostoMedio] = useState(
    causale?.aggiorna_costo_medio ?? false
  )
  const [richiedeDocumento, setRichiedeDocumento] = useState(
    causale?.richiede_documento ?? false
  )

  return (
    <form action={action} className="space-y-6">
      {/* Codice e Tipo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="codice" className="block text-sm font-medium text-gray-700">
            Codice <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="codice"
            name="codice"
            defaultValue={causale?.codice}
            required
            maxLength={10}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
            placeholder="es: CAR"
          />
        </div>

        <div>
          <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">
            Tipo <span className="text-red-500">*</span>
          </label>
          <select
            id="tipo"
            name="tipo"
            defaultValue={causale?.tipo || 'carico'}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="carico">Carico (+)</option>
            <option value="scarico">Scarico (-)</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Carico aumenta giacenze, Scarico diminuisce
          </p>
        </div>
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
          defaultValue={causale?.descrizione}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="es: Carico manuale da inventario"
        />
      </div>

      {/* Flags */}
      <div className="space-y-3 border-t pt-4">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              id="aggiorna_costo_medio"
              name="aggiorna_costo_medio"
              value="true"
              checked={aggiornaCostoMedio}
              onChange={(e) => setAggiornaCostoMedio(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          <div className="ml-3">
            <label htmlFor="aggiorna_costo_medio" className="text-sm font-medium text-gray-700">
              Aggiorna costo medio
            </label>
            <p className="text-xs text-gray-500">
              Ricalcola il costo medio ponderato del prodotto
            </p>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              id="richiede_documento"
              name="richiede_documento"
              value="true"
              checked={richiedeDocumento}
              onChange={(e) => setRichiedeDocumento(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          <div className="ml-3">
            <label htmlFor="richiede_documento" className="text-sm font-medium text-gray-700">
              Richiede documento
            </label>
            <p className="text-xs text-gray-500">
              Obbliga l'inserimento di riferimenti documentali
            </p>
          </div>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="visibile"
            name="visibile"
            value="true"
            checked={visibile}
            onChange={(e) => setVisibile(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="visibile" className="ml-2 block text-sm text-gray-700">
            Visibile negli elenchi
          </label>
        </div>

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
            Causale attiva
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
          href="/dashboard/configurazioni/causali-movimento"
          className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 font-medium text-center transition-colors"
        >
          Annulla
        </a>
      </div>
    </form>
  )
}
