'use client'

import { MetodoPagamento } from '@/app/actions/metodi-pagamento'
import { useState } from 'react'

type MetodoPagamentoFormProps = {
  metodo?: MetodoPagamento
  action: (formData: FormData) => Promise<void>
  submitLabel: string
}

export default function MetodoPagamentoForm({
  metodo,
  action,
  submitLabel,
}: MetodoPagamentoFormProps) {
  const [attivo, setAttivo] = useState(metodo?.attivo ?? true)
  const [predefinito, setPredefinito] = useState(metodo?.predefinito ?? false)
  const [richiedeIban, setRichiedeIban] = useState(metodo?.richiede_iban ?? false)

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
          defaultValue={metodo?.codice}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="es: BON30"
        />
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
          defaultValue={metodo?.nome}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="es: Bonifico 30 giorni"
        />
      </div>

      {/* Tipo */}
      <div>
        <label htmlFor="tipo" className="block text-sm font-medium text-gray-700">
          Tipo
        </label>
        <select
          id="tipo"
          name="tipo"
          defaultValue={metodo?.tipo || ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">-- Seleziona tipo --</option>
          <option value="contanti">Contanti</option>
          <option value="bonifico">Bonifico</option>
          <option value="assegno">Assegno</option>
          <option value="carta">Carta</option>
          <option value="rid">RID</option>
          <option value="paypal">PayPal</option>
          <option value="altro">Altro</option>
        </select>
      </div>

      {/* Giorni scadenza */}
      <div>
        <label htmlFor="giorni_scadenza" className="block text-sm font-medium text-gray-700">
          Giorni scadenza
        </label>
        <input
          type="number"
          id="giorni_scadenza"
          name="giorni_scadenza"
          defaultValue={metodo?.giorni_scadenza || 0}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="0"
        />
        <p className="mt-1 text-sm text-gray-500">
          Giorni dalla data fattura (0 = immediato)
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
          defaultValue={metodo?.descrizione || ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Descrizione opzionale del metodo di pagamento"
        />
      </div>

      {/* Flags */}
      <div className="space-y-3">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="richiede_iban"
            name="richiede_iban"
            value="true"
            checked={richiedeIban}
            onChange={(e) => setRichiedeIban(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="richiede_iban" className="ml-2 block text-sm text-gray-700">
            Richiede IBAN
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="predefinito"
            name="predefinito"
            value="true"
            checked={predefinito}
            onChange={(e) => setPredefinito(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="predefinito" className="ml-2 block text-sm text-gray-700">
            Metodo predefinito
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
            Metodo attivo
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
          href="/dashboard/configurazioni/codici-pagamento"
          className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 font-medium text-center transition-colors"
        >
          Annulla
        </a>
      </div>
    </form>
  )
}
