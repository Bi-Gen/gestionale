'use client'

import { CausaleDocumento } from '@/app/actions/causali-documento'
import { useState } from 'react'

type CausaleDocumentoFormProps = {
  causale?: CausaleDocumento
  action: (formData: FormData) => Promise<void>
  submitLabel: string
}

export default function CausaleDocumentoForm({
  causale,
  action,
  submitLabel,
}: CausaleDocumentoFormProps) {
  const [attivo, setAttivo] = useState(causale?.attivo ?? true)
  const [generaMagazzino, setGeneraMagazzino] = useState(causale?.genera_movimento_magazzino ?? false)
  const [generaContabile, setGeneraContabile] = useState(causale?.genera_movimento_contabile ?? false)
  const [numerazioneSeparata, setNumerazioneSeparata] = useState(causale?.numerazione_separata ?? true)

  return (
    <form action={action} className="space-y-6">
      {/* Codice e Tipo Documento */}
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
            maxLength={20}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
            placeholder="es: ORD_VEN"
          />
        </div>

        <div>
          <label htmlFor="tipo_documento" className="block text-sm font-medium text-gray-700">
            Tipo Documento <span className="text-red-500">*</span>
          </label>
          <select
            id="tipo_documento"
            name="tipo_documento"
            defaultValue={causale?.tipo_documento || 'ordine'}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ordine">Ordine</option>
            <option value="fattura">Fattura</option>
            <option value="ddt">DDT</option>
            <option value="preventivo">Preventivo</option>
            <option value="nota_credito">Nota di Credito</option>
          </select>
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
          placeholder="es: Ordine Cliente"
        />
      </div>

      {/* Tipo Operazione */}
      <div>
        <label htmlFor="tipo_operazione" className="block text-sm font-medium text-gray-700">
          Tipo Operazione <span className="text-red-500">*</span>
        </label>
        <select
          id="tipo_operazione"
          name="tipo_operazione"
          defaultValue={causale?.tipo_operazione || 'vendita'}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="vendita">Vendita</option>
          <option value="acquisto">Acquisto</option>
        </select>
      </div>

      {/* Flags */}
      <div className="space-y-3 border-t pt-4">
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              id="genera_movimento_magazzino"
              name="genera_movimento_magazzino"
              value="true"
              checked={generaMagazzino}
              onChange={(e) => setGeneraMagazzino(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          <div className="ml-3">
            <label htmlFor="genera_movimento_magazzino" className="text-sm font-medium text-gray-700">
              Genera movimento magazzino
            </label>
            <p className="text-xs text-gray-500">
              Crea automaticamente movimenti di carico/scarico
            </p>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              id="genera_movimento_contabile"
              name="genera_movimento_contabile"
              value="true"
              checked={generaContabile}
              onChange={(e) => setGeneraContabile(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          <div className="ml-3">
            <label htmlFor="genera_movimento_contabile" className="text-sm font-medium text-gray-700">
              Genera movimento contabile
            </label>
            <p className="text-xs text-gray-500">
              Crea automaticamente scritture in prima nota
            </p>
          </div>
        </div>

        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              type="checkbox"
              id="numerazione_separata"
              name="numerazione_separata"
              value="true"
              checked={numerazioneSeparata}
              onChange={(e) => setNumerazioneSeparata(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
          <div className="ml-3">
            <label htmlFor="numerazione_separata" className="text-sm font-medium text-gray-700">
              Numerazione separata
            </label>
            <p className="text-xs text-gray-500">
              Usa un contatore numerazione dedicato
            </p>
          </div>
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
          href="/dashboard/configurazioni/causali-documento"
          className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 font-medium text-center transition-colors"
        >
          Annulla
        </a>
      </div>
    </form>
  )
}
