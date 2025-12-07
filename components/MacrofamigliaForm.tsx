'use client'

import { Macrofamiglia } from '@/app/actions/macrofamiglie'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

type MacrofamigliaFormProps = {
  macrofamiglia?: Macrofamiglia
  action: (formData: FormData) => Promise<void>
  submitLabel: string
}

export default function MacrofamigliaForm({
  macrofamiglia,
  action,
  submitLabel,
}: MacrofamigliaFormProps) {
  const [attivo, setAttivo] = useState(macrofamiglia?.attivo ?? true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()

  // Modalità popup (aperta da SelectConCreazione)
  const isPopup = searchParams.get('popup') === 'true'
  const channelName = searchParams.get('channel')

  // Gestione submit in modalità popup
  const handlePopupSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)

    try {
      const response = await fetch('/api/quick-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityType: 'macrofamiglia',
          codice: formData.get('codice'),
          nome: formData.get('nome'),
          descrizione: formData.get('descrizione'),
          ordinamento: parseInt(formData.get('ordinamento') as string) || 0,
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
        setError(result.error || 'Errore durante la creazione')
      }
    } catch (err) {
      setError('Errore di connessione')
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
      {/* Errore in modalità popup */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Codice */}
      <div>
        <label htmlFor="codice" className="block text-sm font-medium text-gray-700">
          Codice <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="codice"
          name="codice"
          defaultValue={macrofamiglia?.codice}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="es: TESSILE"
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
          defaultValue={macrofamiglia?.nome}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="es: Tessile"
        />
        <p className="mt-1 text-sm text-gray-500">
          Nome visualizzato nell&apos;interfaccia
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
          defaultValue={macrofamiglia?.descrizione || ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Descrizione opzionale della macrofamiglia"
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
          defaultValue={macrofamiglia?.ordinamento || 0}
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
          Macrofamiglia attiva
        </label>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-medium transition-colors disabled:bg-blue-400"
        >
          {isSubmitting ? 'Creazione...' : submitLabel}
        </button>
        {isPopup ? (
          <button
            type="button"
            onClick={() => window.close()}
            disabled={isSubmitting}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 font-medium text-center transition-colors"
          >
            Annulla
          </button>
        ) : (
          <a
            href="/dashboard/configurazioni/macrofamiglie"
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 font-medium text-center transition-colors"
          >
            Annulla
          </a>
        )}
      </div>
    </form>
  )
}
