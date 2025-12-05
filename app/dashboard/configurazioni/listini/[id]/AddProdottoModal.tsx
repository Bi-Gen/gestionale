'use client'

import { useState, useEffect } from 'react'
import { addProdottoToListino } from '@/app/actions/listini'

type Prodotto = {
  id: number
  codice: string
  descrizione: string
  prezzo_vendita?: number
  prezzo_acquisto?: number
}

export default function AddProdottoModal({
  listinoId,
  tipoListino,
}: {
  listinoId: number
  tipoListino: 'vendita' | 'acquisto'
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [prodotti, setProdotti] = useState<Prodotto[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedProdotto, setSelectedProdotto] = useState<Prodotto | null>(null)

  // Carica prodotti quando si apre il modal
  useEffect(() => {
    if (isOpen) {
      loadProdotti()
    }
  }, [isOpen])

  const loadProdotti = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/prodotti')
      if (response.ok) {
        const data = await response.json()
        setProdotti(data)
      }
    } catch (error) {
      console.error('Errore caricamento prodotti:', error)
    }
    setLoading(false)
  }

  const filteredProdotti = prodotti.filter(
    (p) =>
      p.codice.toLowerCase().includes(search.toLowerCase()) ||
      p.descrizione.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = async (formData: FormData) => {
    await addProdottoToListino(listinoId, formData)
  }

  const getPrezzoSuggerito = () => {
    if (!selectedProdotto) return ''
    if (tipoListino === 'vendita') {
      return selectedProdotto.prezzo_vendita?.toString() || ''
    } else {
      return selectedProdotto.prezzo_acquisto?.toString() || ''
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
      >
        + Aggiungi Prodotto
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Aggiungi Prodotto al Listino
              </h3>
              <button
                onClick={() => {
                  setIsOpen(false)
                  setSelectedProdotto(null)
                  setSearch('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <form action={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-130px)]">
              {!selectedProdotto ? (
                <>
                  {/* Ricerca Prodotto */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cerca Prodotto
                    </label>
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Cerca per codice o descrizione..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Lista Prodotti */}
                  <div className="border border-gray-200 rounded-md max-h-80 overflow-y-auto">
                    {loading ? (
                      <div className="p-4 text-center text-gray-500">Caricamento...</div>
                    ) : filteredProdotti.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        {search ? 'Nessun prodotto trovato' : 'Nessun prodotto disponibile'}
                      </div>
                    ) : (
                      filteredProdotti.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedProdotto(p)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-0 flex justify-between items-center"
                        >
                          <div>
                            <span className="font-medium text-gray-900">{p.codice}</span>
                            <span className="mx-2 text-gray-400">-</span>
                            <span className="text-gray-600">{p.descrizione}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {tipoListino === 'vendita'
                              ? p.prezzo_vendita?.toFixed(2) || '-'
                              : p.prezzo_acquisto?.toFixed(2) || '-'}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Prodotto Selezionato */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-md flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{selectedProdotto.codice}</p>
                      <p className="text-sm text-gray-600">{selectedProdotto.descrizione}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedProdotto(null)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Cambia
                    </button>
                  </div>
                  <input type="hidden" name="prodotto_id" value={selectedProdotto.id} />

                  {/* Form Prezzo */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prezzo <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="prezzo"
                        defaultValue={getPrezzoSuggerito()}
                        required
                        min="0"
                        step="0.0001"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prezzo Minimo
                      </label>
                      <input
                        type="number"
                        name="prezzo_minimo"
                        min="0"
                        step="0.0001"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sconto Max (%)
                      </label>
                      <input
                        type="number"
                        name="sconto_max"
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Provvigione Override (%)
                      </label>
                      <input
                        type="number"
                        name="provvigione_override"
                        min="0"
                        max="100"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Sovrascrive la provvigione default del listino
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data Inizio Validita
                      </label>
                      <input
                        type="date"
                        name="data_inizio"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Data Fine Validita
                      </label>
                      <input
                        type="date"
                        name="data_fine"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Note
                      </label>
                      <textarea
                        name="note"
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Footer */}
              {selectedProdotto && (
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false)
                      setSelectedProdotto(null)
                      setSearch('')
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50"
                  >
                    Annulla
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700"
                  >
                    Aggiungi al Listino
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </>
  )
}
