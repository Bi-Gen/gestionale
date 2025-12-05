'use client'

import { Magazzino } from '@/app/actions/magazzini'
import { useState } from 'react'

type MagazzinoFormProps = {
  magazzino?: Magazzino
  action: (formData: FormData) => Promise<void>
  submitLabel: string
}

export default function MagazzinoForm({
  magazzino,
  action,
  submitLabel,
}: MagazzinoFormProps) {
  const [attivo, setAttivo] = useState(magazzino?.attivo ?? true)
  const [principale, setPrincipale] = useState(magazzino?.principale ?? false)
  const [gestioneUbicazioni, setGestioneUbicazioni] = useState(
    magazzino?.gestione_ubicazioni ?? false
  )

  return (
    <form action={action} className="space-y-6">
      {/* Codice e Nome */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="codice" className="block text-sm font-medium text-gray-700">
            Codice <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="codice"
            name="codice"
            defaultValue={magazzino?.codice}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="es: MAG01"
          />
        </div>

        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
            Nome <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="nome"
            name="nome"
            defaultValue={magazzino?.nome}
            required
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="es: Magazzino Principale"
          />
        </div>
      </div>

      {/* Descrizione */}
      <div>
        <label htmlFor="descrizione" className="block text-sm font-medium text-gray-700">
          Descrizione
        </label>
        <textarea
          id="descrizione"
          name="descrizione"
          rows={2}
          defaultValue={magazzino?.descrizione || ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Descrizione opzionale del magazzino"
        />
      </div>

      {/* Indirizzo */}
      <div>
        <label htmlFor="indirizzo" className="block text-sm font-medium text-gray-700">
          Indirizzo
        </label>
        <input
          type="text"
          id="indirizzo"
          name="indirizzo"
          defaultValue={magazzino?.indirizzo || ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Via, numero civico"
        />
      </div>

      {/* Città, Provincia, CAP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="citta" className="block text-sm font-medium text-gray-700">
            Città
          </label>
          <input
            type="text"
            id="citta"
            name="citta"
            defaultValue={magazzino?.citta || ''}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Città"
          />
        </div>

        <div>
          <label htmlFor="provincia" className="block text-sm font-medium text-gray-700">
            Provincia
          </label>
          <input
            type="text"
            id="provincia"
            name="provincia"
            defaultValue={magazzino?.provincia || ''}
            maxLength={2}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase"
            placeholder="es: MI"
          />
        </div>

        <div>
          <label htmlFor="cap" className="block text-sm font-medium text-gray-700">
            CAP
          </label>
          <input
            type="text"
            id="cap"
            name="cap"
            defaultValue={magazzino?.cap || ''}
            maxLength={5}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="00000"
          />
        </div>
      </div>

      {/* Telefono ed Email */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
            Telefono
          </label>
          <input
            type="tel"
            id="telefono"
            name="telefono"
            defaultValue={magazzino?.telefono || ''}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="+39 ..."
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            id="email"
            name="email"
            defaultValue={magazzino?.email || ''}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="magazzino@example.com"
          />
        </div>
      </div>

      {/* Flags */}
      <div className="space-y-3 border-t pt-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="principale"
            name="principale"
            value="true"
            checked={principale}
            onChange={(e) => setPrincipale(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="principale" className="ml-2 block text-sm text-gray-700">
            Magazzino principale
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="gestione_ubicazioni"
            name="gestione_ubicazioni"
            value="true"
            checked={gestioneUbicazioni}
            onChange={(e) => setGestioneUbicazioni(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="gestione_ubicazioni" className="ml-2 block text-sm text-gray-700">
            Gestione ubicazioni
          </label>
          <p className="ml-2 text-xs text-gray-500">
            (scaffali, piani, etc.)
          </p>
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
            Magazzino attivo
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
          href="/dashboard/configurazioni/magazzini"
          className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 font-medium text-center transition-colors"
        >
          Annulla
        </a>
      </div>
    </form>
  )
}
