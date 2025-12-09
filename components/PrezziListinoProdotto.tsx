'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  PrezzoListinoProdotto,
  addPrezzoListinoProdotto,
  updatePrezzoListinoProdotto,
  deletePrezzoListinoProdotto,
} from '@/app/actions/listini'
import { quickCreateListino } from '@/app/actions/quick-create'

type ListinoOption = {
  id: number
  codice: string
  nome: string
  tipo: 'vendita' | 'acquisto'
}

type Props = {
  prodottoId: number
  prezzi: PrezzoListinoProdotto[]
  listiniDisponibili: ListinoOption[]
}

export default function PrezziListinoProdotto({
  prodottoId,
  prezzi: initialPrezzi,
  listiniDisponibili: initialListini,
}: Props) {
  const [prezzi, setPrezzi] = useState<PrezzoListinoProdotto[]>(initialPrezzi)
  const [listiniDisponibili, setListiniDisponibili] = useState<ListinoOption[]>(initialListini)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPrezzo, setEditingPrezzo] = useState<PrezzoListinoProdotto | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'vendita' | 'acquisto'>('vendita')
  const [isMounted, setIsMounted] = useState(false)

  // Quick Create Listino
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false)
  const [quickCreateError, setQuickCreateError] = useState<string | null>(null)
  const [isCreatingListino, setIsCreatingListino] = useState(false)

  // Per React Portal - solo client-side
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Filtra prezzi per tipo
  const prezziVendita = prezzi.filter((p) => p.listino?.tipo === 'vendita')
  const prezziAcquisto = prezzi.filter((p) => p.listino?.tipo === 'acquisto')
  const prezziAttivi = activeTab === 'vendita' ? prezziVendita : prezziAcquisto

  // Listini disponibili per aggiungere (non già presenti)
  const listiniUsati = prezzi.map((p) => p.listino_id)
  const listiniLiberi = listiniDisponibili.filter(
    (l) => !listiniUsati.includes(l.id) && l.tipo === activeTab
  )

  const handleOpenModal = (prezzo?: PrezzoListinoProdotto) => {
    setEditingPrezzo(prezzo || null)
    setError(null)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingPrezzo(null)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      if (editingPrezzo) {
        const result = await updatePrezzoListinoProdotto(
          editingPrezzo.id,
          prodottoId,
          formData
        )
        if (result.error) {
          setError(result.error)
        } else if (result.data) {
          setPrezzi((prev) =>
            prev.map((p) => (p.id === editingPrezzo.id ? result.data! : p))
          )
          handleCloseModal()
        }
      } else {
        const result = await addPrezzoListinoProdotto(prodottoId, formData)
        if (result.error) {
          setError(result.error)
        } else if (result.data) {
          setPrezzi((prev) => [result.data!, ...prev])
          handleCloseModal()
        }
      }
    } catch {
      setError('Errore durante il salvataggio')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (prezzo: PrezzoListinoProdotto) => {
    if (
      !confirm(
        `Vuoi rimuovere il prezzo dal listino "${prezzo.listino?.nome}"?`
      )
    ) {
      return
    }

    try {
      const result = await deletePrezzoListinoProdotto(prezzo.id, prodottoId)
      if (result.error) {
        alert(result.error)
      } else {
        setPrezzi((prev) => prev.filter((p) => p.id !== prezzo.id))
      }
    } catch {
      alert('Errore durante l\'eliminazione')
    }
  }

  const formatDate = (date?: string) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('it-IT')
  }

  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return '-'
    return `${price.toFixed(2)}`
  }

  // Quick Create Listino
  const handleQuickCreateListino = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsCreatingListino(true)
    setQuickCreateError(null)

    const formData = new FormData(e.currentTarget)
    // Imposta il tipo in base al tab attivo
    formData.set('tipo', activeTab)

    try {
      const result = await quickCreateListino(formData)
      if (result.success && result.data) {
        // Aggiungi il nuovo listino alla lista
        const newListino: ListinoOption = {
          id: result.data.id,
          codice: result.data.codice,
          nome: result.data.nome,
          tipo: activeTab,
        }
        setListiniDisponibili((prev) => [...prev, newListino])
        setIsQuickCreateOpen(false)
        // Apri direttamente il modal per aggiungere il prezzo
        setIsModalOpen(true)
      } else {
        setQuickCreateError(result.error || 'Errore durante la creazione')
      }
    } catch {
      setQuickCreateError('Errore durante la creazione del listino')
    } finally {
      setIsCreatingListino(false)
    }
  }

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <div className="mb-4 pb-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          Prezzi Listino
        </h2>
        <div className="flex gap-2">
          {listiniLiberi.length === 0 ? (
            <button
              type="button"
              onClick={() => setIsQuickCreateOpen(true)}
              className="px-3 py-1.5 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
            >
              + Crea Listino
            </button>
          ) : (
            <button
              type="button"
              onClick={() => handleOpenModal()}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              + Aggiungi Prezzo
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-4 border-b border-gray-200">
        <button
          type="button"
          onClick={() => setActiveTab('vendita')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'vendita'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Vendita ({prezziVendita.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('acquisto')}
          className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'acquisto'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Acquisto ({prezziAcquisto.length})
        </button>
      </div>

      {/* Tabella prezzi */}
      {prezziAttivi.length === 0 ? (
        <p className="text-sm text-gray-500 py-4 text-center">
          Nessun prezzo configurato per i listini di {activeTab}.
          {listiniLiberi.length > 0 && (
            <button
              type="button"
              onClick={() => handleOpenModal()}
              className="ml-1 text-blue-600 hover:text-blue-700"
            >
              Aggiungi il primo prezzo
            </button>
          )}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Listino
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Prezzo
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Min
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Sconto Max
                </th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                  Validita
                </th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {prezziAttivi.map((prezzo) => (
                <tr key={prezzo.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">
                      {prezzo.listino?.nome}
                    </div>
                    <div className="text-xs text-gray-500">
                      {prezzo.listino?.codice}
                      {!prezzo.listino?.attivo && (
                        <span className="ml-1 text-red-500">(inattivo)</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                    {formatPrice(prezzo.prezzo)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-500">
                    {formatPrice(prezzo.prezzo_minimo)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-500">
                    {prezzo.sconto_max !== null && prezzo.sconto_max !== undefined
                      ? `${prezzo.sconto_max}%`
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-500">
                    {prezzo.data_inizio || prezzo.data_fine ? (
                      <span>
                        {formatDate(prezzo.data_inizio)} -{' '}
                        {formatDate(prezzo.data_fine)}
                      </span>
                    ) : (
                      <span className="text-gray-400">Sempre</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => handleOpenModal(prezzo)}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Modifica
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(prezzo)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Elimina
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal - reso via Portal per evitare form annidati */}
      {isModalOpen && isMounted && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingPrezzo ? 'Modifica Prezzo Listino' : 'Aggiungi Prezzo Listino'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Listino (solo per nuovo) */}
              {!editingPrezzo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Listino <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="listino_id"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleziona listino...</option>
                    {listiniLiberi.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.codice} - {l.nome}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editingPrezzo && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Listino
                  </label>
                  <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                    {editingPrezzo.listino?.codice} - {editingPrezzo.listino?.nome}
                  </p>
                </div>
              )}

              {/* Prezzo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prezzo <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="prezzo"
                  step="0.0001"
                  min="0"
                  required
                  defaultValue={editingPrezzo?.prezzo || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>

              {/* Prezzo minimo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prezzo Minimo
                </label>
                <input
                  type="number"
                  name="prezzo_minimo"
                  step="0.0001"
                  min="0"
                  defaultValue={editingPrezzo?.prezzo_minimo || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Opzionale"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Prezzo sotto il quale non si puo scendere
                </p>
              </div>

              {/* Sconto Max */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sconto Max (%)
                </label>
                <input
                  type="number"
                  name="sconto_max"
                  step="0.01"
                  min="0"
                  max="100"
                  defaultValue={editingPrezzo?.sconto_max || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="es. 20"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Sconto massimo applicabile su questo prezzo
                </p>
              </div>

              {/* Date validita */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valido da
                  </label>
                  <input
                    type="date"
                    name="data_inizio"
                    defaultValue={editingPrezzo?.data_inizio || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valido fino
                  </label>
                  <input
                    type="date"
                    name="data_fine"
                    defaultValue={editingPrezzo?.data_fine || ''}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note
                </label>
                <textarea
                  name="note"
                  rows={2}
                  defaultValue={editingPrezzo?.note || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Note opzionali..."
                />
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
                >
                  {isSubmitting
                    ? 'Salvataggio...'
                    : editingPrezzo
                      ? 'Aggiorna'
                      : 'Aggiungi'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Quick Create Listino */}
      {isQuickCreateOpen && isMounted && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Crea Nuovo Listino {activeTab === 'vendita' ? 'Vendita' : 'Acquisto'}
              </h3>
            </div>

            <form onSubmit={handleQuickCreateListino} className="p-6 space-y-4">
              {quickCreateError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-700">{quickCreateError}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Codice <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="codice"
                  required
                  maxLength={20}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="es. LST-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="nome"
                  required
                  maxLength={100}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="es. Listino Base"
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-600">
                  Tipo: <span className="font-medium">{activeTab === 'vendita' ? 'Vendita' : 'Acquisto'}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Il tipo viene impostato automaticamente in base al tab selezionato
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsQuickCreateOpen(false)
                    setQuickCreateError(null)
                  }}
                  disabled={isCreatingListino}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
                >
                  Annulla
                </button>
                <button
                  type="submit"
                  disabled={isCreatingListino}
                  className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:bg-green-400 transition-colors"
                >
                  {isCreatingListino ? 'Creazione...' : 'Crea Listino'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
