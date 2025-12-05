'use client'

import { useState } from 'react'
import { eliminaFattura } from '@/app/actions/fatture'
import { useRouter } from 'next/navigation'

interface Props {
  fatturaId: number
  numeroDocumento: string
  tipoOperazione: string
}

export default function EliminaFatturaButton({ fatturaId, numeroDocumento, tipoOperazione }: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleElimina = async () => {
    if (!confirm(`ATTENZIONE!\n\nSei sicuro di voler eliminare la fattura ${numeroDocumento}?\n\nQuesta azione è irreversibile.`)) {
      return
    }

    setIsLoading(true)

    try {
      const result = await eliminaFattura(fatturaId)

      if (result.success) {
        alert(result.message)
        router.push(`/dashboard/fatture/${tipoOperazione}`)
        router.refresh()
      } else {
        alert(`Errore: ${result.error}`)
      }
    } catch (error) {
      console.error('Errore eliminazione:', error)
      alert('Errore durante l\'eliminazione')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={handleElimina}
      disabled={isLoading}
      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Eliminazione...
        </>
      ) : (
        <>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Elimina
        </>
      )}
    </button>
  )
}
