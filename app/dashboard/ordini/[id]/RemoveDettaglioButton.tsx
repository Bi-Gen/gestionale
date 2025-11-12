'use client'

import { removeDettaglioOrdine } from '@/app/actions/ordini'

export default function RemoveDettaglioButton({
  ordineId,
  dettaglioId,
}: {
  ordineId: string
  dettaglioId: string
}) {
  const handleRemove = async () => {
    if (confirm('Sei sicuro di voler rimuovere questo prodotto?')) {
      await removeDettaglioOrdine(ordineId, dettaglioId)
    }
  }

  return (
    <button
      onClick={handleRemove}
      className="text-red-600 hover:text-red-900"
    >
      Rimuovi
    </button>
  )
}
