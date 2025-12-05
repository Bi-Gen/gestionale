'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'

type Valuta = {
  id: number
  codice: string
  nome: string
  simbolo: string
}

type Fornitore = {
  id: number
  ragione_sociale: string
}

type ListinoData = {
  id?: number
  codice: string
  nome: string
  descrizione?: string
  tipo: 'vendita' | 'acquisto'
  valuta_id?: number
  provvigione_default: number
  fornitore_id?: number
  priorita: number
  data_inizio?: string
  data_fine?: string
  predefinito: boolean
  attivo: boolean
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? 'Salvataggio...' : isEdit ? 'Aggiorna Listino' : 'Crea Listino'}
    </button>
  )
}

export default function ListinoForm({
  listino,
  valute,
  fornitori,
  action,
  error,
  tipoPreselezionato,
}: {
  listino?: ListinoData
  valute: Valuta[]
  fornitori: Fornitore[]
  action: (formData: FormData) => Promise<void>
  error?: string
  tipoPreselezionato?: 'vendita' | 'acquisto'
}) {
  const isEdit = !!listino?.id
  // Per modifica usa il tipo esistente, per nuovo usa il preselezionato o stringa vuota
  const [tipoListino, setTipoListino] = useState<'vendita' | 'acquisto' | ''>(
    listino?.tipo || tipoPreselezionato || ''
  )

  return (
    <form action={action} className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Dati Principali */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Dati Principali</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Codice */}
          <div>
            <label htmlFor="codice" className="block text-sm font-medium text-gray-700 mb-1">
              Codice <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="codice"
              name="codice"
              defaultValue={listino?.codice || ''}
              required
              maxLength={20}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 uppercase"
              placeholder="es. LIST01, PROMO2024"
            />
          </div>

          {/* Nome */}
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
              Nome <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="nome"
              name="nome"
              defaultValue={listino?.nome || ''}
              required
              maxLength={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="es. Listino Base, Promozione Estate 2024"
            />
          </div>

          {/* Tipo */}
          <div>
            <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">
              Tipo <span className="text-red-500">*</span>
            </label>
            <select
              id="tipo"
              name="tipo"
              value={tipoListino}
              onChange={(e) => setTipoListino(e.target.value as 'vendita' | 'acquisto' | '')}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              {tipoListino === '' && (
                <option value="">-- Seleziona tipo --</option>
              )}
              <option value="vendita">Vendita</option>
              <option value="acquisto">Acquisto</option>
            </select>
          </div>

          {/* Valuta */}
          <div>
            <label htmlFor="valuta_id" className="block text-sm font-medium text-gray-700 mb-1">
              Valuta
            </label>
            <select
              id="valuta_id"
              name="valuta_id"
              defaultValue={listino?.valuta_id || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Seleziona valuta --</option>
              {valute.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.codice} - {v.nome} ({v.simbolo})
                </option>
              ))}
            </select>
          </div>

          {/* Descrizione */}
          <div className="md:col-span-2">
            <label htmlFor="descrizione" className="block text-sm font-medium text-gray-700 mb-1">
              Descrizione
            </label>
            <textarea
              id="descrizione"
              name="descrizione"
              defaultValue={listino?.descrizione || ''}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descrizione opzionale del listino"
            />
          </div>
        </div>
      </div>

      {/* Impostazioni Commerciali */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Impostazioni Commerciali</h2>

        <div className={`grid grid-cols-1 ${tipoListino === 'acquisto' ? 'md:grid-cols-2' : tipoListino === 'vendita' ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-4`}>
          {/* Provvigione Default - solo per vendita */}
          {(tipoListino === 'vendita' || tipoListino === '') && (
            <div>
              <label htmlFor="provvigione_default" className="block text-sm font-medium text-gray-700 mb-1">
                Provvigione Default (%)
              </label>
              <input
                type="number"
                id="provvigione_default"
                name="provvigione_default"
                defaultValue={listino?.provvigione_default ?? 0}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Provvigione agente per vendite con questo listino
              </p>
            </div>
          )}

          {/* Priorita */}
          <div>
            <label htmlFor="priorita" className="block text-sm font-medium text-gray-700 mb-1">
              Priorita
            </label>
            <input
              type="number"
              id="priorita"
              name="priorita"
              defaultValue={listino?.priorita ?? 0}
              min="0"
              max="999"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Numero piu alto = priorita maggiore
            </p>
          </div>

          {/* Fornitore - solo per listini acquisto */}
          {tipoListino === 'acquisto' && (
            <div>
              <label htmlFor="fornitore_id" className="block text-sm font-medium text-gray-700 mb-1">
                Fornitore Associato
              </label>
              <select
                id="fornitore_id"
                name="fornitore_id"
                defaultValue={listino?.fornitore_id || ''}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Nessun fornitore --</option>
                {fornitori.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.ragione_sociale}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Listino prezzi specifico di questo fornitore
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Validita Temporale */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Validita Temporale</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Data Inizio */}
          <div>
            <label htmlFor="data_inizio" className="block text-sm font-medium text-gray-700 mb-1">
              Data Inizio Validita
            </label>
            <input
              type="date"
              id="data_inizio"
              name="data_inizio"
              defaultValue={listino?.data_inizio || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Data Fine */}
          <div>
            <label htmlFor="data_fine" className="block text-sm font-medium text-gray-700 mb-1">
              Data Fine Validita
            </label>
            <input
              type="date"
              id="data_fine"
              name="data_fine"
              defaultValue={listino?.data_fine || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Lascia vuoto per listini senza scadenza
        </p>
      </div>

      {/* Stato */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Stato</h2>

        <div className="flex flex-wrap gap-6">
          {/* Attivo */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="attivo"
              value="true"
              defaultChecked={listino?.attivo ?? true}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Attivo</span>
          </label>

          {/* Predefinito */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="predefinito"
              value="true"
              defaultChecked={listino?.predefinito ?? false}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Listino Predefinito</span>
          </label>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Il listino predefinito viene usato quando il cliente non ha un listino specifico assegnato
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link
          href="/dashboard/configurazioni/listini"
          className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
        >
          Annulla
        </Link>
        <SubmitButton isEdit={isEdit} />
      </div>
    </form>
  )
}
