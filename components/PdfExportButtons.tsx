'use client'

import { useState } from 'react'

type Props = {
  ordineId: string
  tipo: 'vendita' | 'acquisto'
}

export default function PdfExportButtons({ ordineId, tipo }: Props) {
  const [numeroFattura, setNumeroFattura] = useState('')
  const [loading, setLoading] = useState<string | null>(null)

  const downloadPdf = async (tipo: string, extraParams?: string) => {
    setLoading(tipo)
    try {
      const url = `/api/pdf/${tipo}?id=${ordineId}${extraParams || ''}`
      const response = await fetch(url)

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || 'Errore nella generazione del PDF')
        return
      }

      // Scarica il file
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl

      // Estrai il nome file dall'header Content-Disposition
      const contentDisposition = response.headers.get('Content-Disposition')
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/)
      const filename = filenameMatch ? filenameMatch[1] : `${tipo}.pdf`

      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch (error) {
      console.error('Errore download PDF:', error)
      alert('Errore nella generazione del PDF')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-3">
      {/* Riepilogo Ordine */}
      <button
        onClick={() => downloadPdf('riepilogo-ordine')}
        disabled={loading !== null}
        className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading === 'riepilogo-ordine' ? (
          <>
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generazione...
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Riepilogo Ordine
          </>
        )}
      </button>

      {/* DDT (solo vendita) */}
      {tipo === 'vendita' && (
        <button
          onClick={() => downloadPdf('ddt')}
          disabled={loading !== null}
          className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading === 'ddt' ? (
            <>
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generazione...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              DDT Trasporto
            </>
          )}
        </button>
      )}

      {/* Proforma (solo vendita) */}
      {tipo === 'vendita' && (
        <div className="pt-2 border-t border-gray-200">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            N. Fattura (opzionale)
          </label>
          <input
            type="text"
            value={numeroFattura}
            onChange={(e) => setNumeroFattura(e.target.value)}
            placeholder="es. 2025/001"
            className="w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm mb-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
          />
          <button
            onClick={() => downloadPdf('proforma', numeroFattura ? `&numero_fattura=${encodeURIComponent(numeroFattura)}` : '')}
            disabled={loading !== null}
            className="w-full px-4 py-2 bg-amber-600 text-white font-medium rounded-md hover:bg-amber-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading === 'proforma' ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generazione...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Fattura Proforma
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
