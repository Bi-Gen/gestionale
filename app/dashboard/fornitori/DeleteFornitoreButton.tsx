'use client'

import { deleteFornitore } from '@/app/actions/fornitori'

export default function DeleteFornitoreButton({ id }: { id: string }) {
  const handleDelete = async () => {
    if (confirm('Sei sicuro di voler eliminare questo fornitore?')) {
      await deleteFornitore(id)
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="text-red-600 hover:text-red-900"
    >
      Elimina
    </button>
  )
}
