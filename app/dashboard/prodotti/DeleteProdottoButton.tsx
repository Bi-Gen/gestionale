'use client'

import { deleteProdotto } from '@/app/actions/prodotti'

export default function DeleteProdottoButton({ id }: { id: string }) {
  const handleDelete = async () => {
    if (confirm('Sei sicuro di voler eliminare questo prodotto?')) {
      await deleteProdotto(id)
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
