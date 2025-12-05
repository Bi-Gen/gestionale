'use client'

import { useFormStatus } from 'react-dom'
import Link from 'next/link'

type Listino = {
  id: number
  codice: string
  nome: string
}

type CategoriaData = {
  id?: number
  codice: string
  nome: string
  descrizione?: string
  listino_id?: number
  sconto_default: number
  priorita: number
  colore: string
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
      {pending ? 'Salvataggio...' : isEdit ? 'Aggiorna Categoria' : 'Crea Categoria'}
    </button>
  )
}

const COLORI_PREDEFINITI = [
  '#EF4444', // red
  '#F97316', // orange
  '#F59E0B', // amber
  '#EAB308', // yellow
  '#84CC16', // lime
  '#22C55E', // green
  '#10B981', // emerald
  '#14B8A6', // teal
  '#06B6D4', // cyan
  '#0EA5E9', // sky
  '#3B82F6', // blue
  '#6366F1', // indigo
  '#8B5CF6', // violet
  '#A855F7', // purple
  '#D946EF', // fuchsia
  '#EC4899', // pink
  '#6B7280', // gray
]

export default function CategoriaClienteForm({
  categoria,
  listini,
  action,
  error,
}: {
  categoria?: CategoriaData
  listini: Listino[]
  action: (formData: FormData) => Promise<void>
  error?: string
}) {
  const isEdit = !!categoria?.id

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
        <h2 className="text-lg font-medium text-gray-900 mb-4">Dati Categoria</h2>

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
              defaultValue={categoria?.codice || ''}
              required
              maxLength={20}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 uppercase"
              placeholder="es. PREM, STD, RIV"
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
              defaultValue={categoria?.nome || ''}
              required
              maxLength={100}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="es. Premium, Standard, Rivenditore"
            />
          </div>

          {/* Descrizione */}
          <div className="md:col-span-2">
            <label htmlFor="descrizione" className="block text-sm font-medium text-gray-700 mb-1">
              Descrizione
            </label>
            <textarea
              id="descrizione"
              name="descrizione"
              defaultValue={categoria?.descrizione || ''}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Descrizione opzionale della categoria"
            />
          </div>

          {/* Colore */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Colore
            </label>
            <div className="flex flex-wrap gap-2">
              {COLORI_PREDEFINITI.map((colore) => (
                <label key={colore} className="cursor-pointer">
                  <input
                    type="radio"
                    name="colore"
                    value={colore}
                    defaultChecked={categoria?.colore === colore || (!categoria && colore === '#6B7280')}
                    className="sr-only"
                  />
                  <div
                    className="w-8 h-8 rounded-full border-2 border-transparent hover:border-gray-400 transition-colors peer-checked:ring-2 peer-checked:ring-offset-2 peer-checked:ring-blue-500"
                    style={{ backgroundColor: colore }}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Impostazioni Default */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Impostazioni Default</h2>
        <p className="text-sm text-gray-500 mb-4">
          Questi valori verranno applicati automaticamente ai nuovi clienti di questa categoria
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Listino Default */}
          <div>
            <label htmlFor="listino_id" className="block text-sm font-medium text-gray-700 mb-1">
              Listino Default
            </label>
            <select
              id="listino_id"
              name="listino_id"
              defaultValue={categoria?.listino_id || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Nessun listino --</option>
              {listini.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.codice} - {l.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Sconto Default */}
          <div>
            <label htmlFor="sconto_default" className="block text-sm font-medium text-gray-700 mb-1">
              Sconto Default (%)
            </label>
            <input
              type="number"
              id="sconto_default"
              name="sconto_default"
              defaultValue={categoria?.sconto_default ?? 0}
              min="0"
              max="100"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Priorita */}
          <div>
            <label htmlFor="priorita" className="block text-sm font-medium text-gray-700 mb-1">
              Priorita
            </label>
            <input
              type="number"
              id="priorita"
              name="priorita"
              defaultValue={categoria?.priorita ?? 0}
              min="0"
              max="999"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">
              Per ordinamento nella lista
            </p>
          </div>
        </div>
      </div>

      {/* Stato */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Stato</h2>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="attivo"
            value="true"
            defaultChecked={categoria?.attivo ?? true}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700">Attivo</span>
        </label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link
          href="/dashboard/configurazioni/categorie-cliente"
          className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
        >
          Annulla
        </Link>
        <SubmitButton isEdit={isEdit} />
      </div>
    </form>
  )
}
