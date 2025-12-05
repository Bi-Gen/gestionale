'use client'

import { useState } from 'react'
import { deleteCategoriaFornitore } from '@/app/actions/categorie-fornitore'

export default function DeleteCategoriaFornitoreButton({
  id,
  nome,
}: {
  id: number
  nome: string
}) {
  const [isConfirming, setIsConfirming] = useState(false)

  const handleDelete = async () => {
    await deleteCategoriaFornitore(id)
  }

  if (isConfirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Confermi?</span>
        <button
          onClick={handleDelete}
          className="text-red-600 hover:text-red-900 text-xs font-medium"
        >
          Sì
        </button>
        <button
          onClick={() => setIsConfirming(false)}
          className="text-gray-600 hover:text-gray-900 text-xs font-medium"
        >
          No
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setIsConfirming(true)}
      className="text-red-600 hover:text-red-900"
      title={`Elimina ${nome}`}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
    </button>
  )
}
