'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type ContoCosto = {
  id: number
  codice: string
  descrizione: string
  tipo_costo?: string
}

type CategoriaData = {
  id?: number
  codice: string
  nome: string
  descrizione?: string
  priorita: number
  colore: string
  attivo: boolean
  conto_costo_default_id?: number
}

function SubmitButton({ isEdit, isSubmitting }: { isEdit: boolean; isSubmitting: boolean }) {
  const { pending } = useFormStatus()
  const loading = pending || isSubmitting

  return (
    <button
      type="submit"
      disabled={loading}
      className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
    >
      {loading ? 'Salvataggio...' : isEdit ? 'Aggiorna Categoria' : 'Crea Categoria'}
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

export default function CategoriaFornitoreForm({
  categoria,
  contiCosti = [],
  action,
  error,
}: {
  categoria?: CategoriaData
  contiCosti?: ContoCosto[]
  action: (formData: FormData) => Promise<void>
  error?: string
}) {
  const isEdit = !!categoria?.id
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [popupError, setPopupError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  // Modalità popup (aperta da SelectConCreazione)
  const isPopup = searchParams.get('popup') === 'true'
  const channelName = searchParams.get('channel')

  // Gestione submit in modalità popup
  const handlePopupSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPopupError(null)
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)

    try {
      const response = await fetch('/api/quick-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'categoria_fornitore',
          codice: formData.get('codice'),
          nome: formData.get('nome'),
          descrizione: formData.get('descrizione'),
          priorita: parseInt(formData.get('priorita') as string) || 0,
          colore: formData.get('colore') || '#6B7280',
        })
      })

      const result = await response.json()

      if (result.success && result.data) {
        // Invia messaggio al BroadcastChannel
        if (channelName) {
          const channel = new BroadcastChannel(channelName)
          channel.postMessage({ type: 'created', item: result.data })
          channel.close()
        }
        // Chiudi la finestra popup
        window.close()
      } else {
        setPopupError(result.error || 'Errore durante la creazione')
      }
    } catch (err) {
      setPopupError('Errore di connessione')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form
      action={isPopup ? undefined : action}
      onSubmit={isPopup ? handlePopupSubmit : undefined}
      className="space-y-6"
    >
      {/* Error message */}
      {(error || popupError) && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error || popupError}</p>
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
              placeholder="es. MATPRIME, SERV, TRASP"
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
              placeholder="es. Materie Prime, Servizi, Trasporti"
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

          {/* Priorita */}
          <div>
            <label htmlFor="priorita" className="block text-sm font-medium text-gray-700 mb-1">
              Priorità
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
              Per ordinamento nella lista (valori più alti appaiono prima)
            </p>
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
                    className="sr-only peer"
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

      {/* Contabilità */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Contabilità</h2>
        <p className="text-sm text-gray-500 mb-4">
          Il conto selezionato determina automaticamente il tipo di costo per le analisi
        </p>

        <div>
          <label htmlFor="conto_costo_default_id" className="block text-sm font-medium text-gray-700 mb-1">
            Conto Costi Default
          </label>
          <select
            id="conto_costo_default_id"
            name="conto_costo_default_id"
            defaultValue={categoria?.conto_costo_default_id?.toString() || ''}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">-- Nessuno --</option>
            {contiCosti.map((conto) => (
              <option key={conto.id} value={conto.id.toString()}>
                {conto.codice} - {conto.descrizione} {conto.tipo_costo ? `(${conto.tipo_costo})` : ''}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Conto usato per contabilizzare le fatture di questa categoria fornitore
          </p>
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
        {isPopup ? (
          <button
            type="button"
            onClick={() => window.close()}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
          >
            Annulla
          </button>
        ) : (
          <Link
            href="/dashboard/configurazioni/categorie-fornitore"
            className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
          >
            Annulla
          </Link>
        )}
        <SubmitButton isEdit={isEdit} isSubmitting={isSubmitting} />
      </div>
    </form>
  )
}
