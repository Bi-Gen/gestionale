'use client'

import { useState } from 'react'
import { syncGeografiaFromAPI } from '@/app/actions/geografia'

export default function SyncGeografiaButton() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; stats?: any; error?: string } | null>(null)

  const handleSync = async () => {
    setLoading(true)
    setResult(null)

    const res = await syncGeografiaFromAPI()
    setResult(res)
    setLoading(false)

    if (res.success) {
      // Reload page to show updated data
      window.location.reload()
    }
  }

  return (
    <div>
      <button
        onClick={handleSync}
        disabled={loading}
        className={`
          px-4 py-2 rounded-md font-medium transition-colors text-sm
          ${loading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
          }
        `}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Sincronizzando...
          </span>
        ) : (
          'Sincronizza da API'
        )}
      </button>

      {result && (
        <div className={`mt-2 p-2 rounded text-xs ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {result.success ? (
            <div>
              <p className="font-medium">Sincronizzazione completata!</p>
              {result.stats && (
                <p className="text-xs mt-1">
                  Regioni: {result.stats.regioni}, Province: {result.stats.province}, Comuni: {result.stats.comuni}
                </p>
              )}
            </div>
          ) : (
            <p>Errore: {result.error}</p>
          )}
        </div>
      )}
    </div>
  )
}
