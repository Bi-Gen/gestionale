'use client'

import { evadiOrdine } from '@/app/actions/magazzino'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface EvadiOrdineButtonProps {
  ordineId: number
  tipo: 'vendita' | 'acquisto'
}

export default function EvadiOrdineButton({ ordineId, tipo }: EvadiOrdineButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleEvadi = async () => {
    const conferma = confirm(
      tipo === 'vendita'
        ? 'Evadere questo ordine di vendita? Verrà creato un movimento di scarico magazzino per ogni prodotto.'
        : 'Ricevere questo ordine di acquisto? Verrà creato un movimento di carico magazzino per ogni prodotto.'
    )

    if (!conferma) return

    setLoading(true)

    try {
      await evadiOrdine(ordineId)
      router.refresh()
    } catch (error: any) {
      alert(`Errore: ${error.message || 'Impossibile evadere l\'ordine'}`)
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleEvadi}
      disabled={loading}
      className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {tipo === 'vendita' ? 'Evadendo...' : 'Ricevendo...'}
        </span>
      ) : (
        <>
          {tipo === 'vendita' ? '📦 Evadi Ordine' : '📥 Ricevi Merce'}
        </>
      )}
    </button>
  )
}
