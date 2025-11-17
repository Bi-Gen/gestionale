'use client'

import { useState } from 'react'
import { searchComuni, type Comune } from '@/app/actions/geografia'

export default function SearchComuni() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Comune[]>([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery)

    if (searchQuery.length < 2) {
      setResults([])
      return
    }

    setLoading(true)
    const comuni = await searchComuni(searchQuery)
    setResults(comuni)
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Ricerca Comuni</h3>

      <div className="relative">
        <input
          type="text"
          placeholder="Cerca comune per nome..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {loading && (
          <div className="absolute right-3 top-3">
            <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        )}
      </div>

      {results.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">
            Trovati {results.length} comuni
          </p>
          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Comune
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    CAP
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Codice
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((comune) => (
                  <tr key={comune.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {comune.nome}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {comune.cap || '-'}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-500 font-mono">
                      {comune.codice}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {query.length >= 2 && results.length === 0 && !loading && (
        <p className="mt-4 text-sm text-gray-500">
          Nessun comune trovato
        </p>
      )}
    </div>
  )
}
