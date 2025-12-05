'use client'

import { deleteConto } from '@/app/actions/piano-conti'

export default function DeleteContoButton({
  id,
  codice,
  hasChildren
}: {
  id: number
  codice: string
  hasChildren: boolean
}) {
  if (hasChildren) {
    return (
      <span className="text-gray-400 cursor-not-allowed" title="Ha sottoconti">
        Elimina
      </span>
    )
  }

  const handleDelete = async () => {
    if (confirm(`Eliminare il conto "${codice}"?`)) {
      await deleteConto(id)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      className="text-red-600 hover:text-red-900"
    >
      Elimina
    </button>
  )
}
