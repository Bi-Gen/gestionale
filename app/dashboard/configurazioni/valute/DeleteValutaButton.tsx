'use client'

import { deleteValuta } from '@/app/actions/valute'
import { useState } from 'react'

export default function DeleteValutaButton({
  id,
  nome,
}: {
  id: number
  nome: string
}) {
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = async () => {
    await deleteValuta(id)
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="text-red-600 hover:text-red-900"
        title="Elimina"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Conferma eliminazione
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Sei sicuro di voler eliminare la valuta &quot;{nome}&quot;? Questa
              azione non può essere annullata.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-medium"
              >
                Elimina
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 font-medium"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
