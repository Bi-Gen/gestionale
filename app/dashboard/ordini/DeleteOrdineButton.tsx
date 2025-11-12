'use client'

import { deleteOrdine } from '@/app/actions/ordini'

export default function DeleteOrdineButton({ id }: { id: string }) {
  const handleDelete = async () => {
    if (confirm('Sei sicuro di voler eliminare questo ordine?')) {
      await deleteOrdine(id)
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
