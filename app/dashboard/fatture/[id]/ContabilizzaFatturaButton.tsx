'use client'

import { useState } from 'react'
import { contabilizzaFattura } from '@/app/actions/fatture'
import { useRouter } from 'next/navigation'

interface Props {
  fatturaId: number
  numeroDocumento: string
}

export default function ContabilizzaFatturaButton({ fatturaId, numeroDocumento }: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleContabilizza = async () => {
    if (!confirm(`Confermi di voler contabilizzare la fattura ${numeroDocumento}?\n\nQuesta azione genererà i movimenti contabili in partita doppia e non potrà essere annullata.`)) {
      return
    }

    setIsLoading(true)

    try {
      const result = await contabilizzaFattura(fatturaId)

      if (result.success) {
        alert(result.message)
        router.refresh()
      } else {
        alert(`Errore: ${result.error}`)
      }
    } catch (error) {
      console.error('Errore contabilizzazione:', error)
      alert('Errore durante la contabilizzazione')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleContabilizza}
      disabled={isLoading}
      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Contabilizzazione...
        </>
      ) : (
        <>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Contabilizza
        </>
      )}
    </button>
  )
}
