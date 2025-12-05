'use client'

import { useState } from 'react'
import { removeProdottoFromListino, updateListinoProdotto } from '@/app/actions/listini'
import type { ListinoProdotto } from '@/app/actions/listini'

export default function ListinoProdottiTable({
  prodotti,
  listinoId,
  tipoListino,
  provvigioneDefault,
}: {
  prodotti: ListinoProdotto[]
  listinoId: number
  tipoListino: 'vendita' | 'acquisto'
  provvigioneDefault: number
}) {
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const formatCurrency = (value: number | undefined | null) => {
    if (value == null) return '-'
    return new Intl.NumberFormat('it-IT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(value)
  }

  const handleUpdate = async (id: number, formData: FormData) => {
    await updateListinoProdotto(id, listinoId, formData)
  }

  const handleDelete = async (id: number) => {
    await removeProdottoFromListino(id, listinoId)
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Prodotto
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Prezzo
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Prezzo Min
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Sconto Max
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Provvigione
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
              Validita
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Azioni
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {prodotti.map((lp) => (
            <tr key={lp.id} className="hover:bg-gray-50">
              {editingId === lp.id ? (
                <EditRow
                  lp={lp}
                  onSave={handleUpdate}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <>
                  <td className="px-6 py-4">
                    <div>
                      <span className="text-sm font-medium text-gray-900">
                        {lp.prodotto?.codice}
                      </span>
                      <p className="text-sm text-gray-500 truncate max-w-xs">
                        {lp.prodotto?.descrizione}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(lp.prezzo)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {formatCurrency(lp.prezzo_minimo)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {lp.sconto_max != null ? `${lp.sconto_max}%` : '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {lp.provvigione_override != null ? (
                        <span className="font-medium text-blue-600">
                          {lp.provvigione_override}%
                        </span>
                      ) : (
                        `${provvigioneDefault}%`
                      )}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    {lp.data_inizio || lp.data_fine ? (
                      <span className="text-xs text-gray-500">
                        {lp.data_inizio || '...'} - {lp.data_fine || '...'}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">Sempre</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingId(lp.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Modifica"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(lp.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Rimuovi"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Conferma rimozione
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Sei sicuro di voler rimuovere questo prodotto dal listino?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 font-medium"
              >
                Rimuovi
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 font-medium"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function EditRow({
  lp,
  onSave,
  onCancel,
}: {
  lp: ListinoProdotto
  onSave: (id: number, formData: FormData) => Promise<void>
  onCancel: () => void
}) {
  return (
    <td colSpan={7} className="px-6 py-4 bg-blue-50">
      <form
        action={(formData) => onSave(lp.id, formData)}
        className="space-y-4"
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="font-medium text-gray-900">{lp.prodotto?.codice}</span>
            <span className="mx-2 text-gray-400">-</span>
            <span className="text-gray-600">{lp.prodotto?.descrizione}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Prezzo *
            </label>
            <input
              type="number"
              name="prezzo"
              defaultValue={lp.prezzo}
              required
              min="0"
              step="0.0001"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Prezzo Minimo
            </label>
            <input
              type="number"
              name="prezzo_minimo"
              defaultValue={lp.prezzo_minimo || ''}
              min="0"
              step="0.0001"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Sconto Max (%)
            </label>
            <input
              type="number"
              name="sconto_max"
              defaultValue={lp.sconto_max || ''}
              min="0"
              max="100"
              step="0.01"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Provvigione (%)
            </label>
            <input
              type="number"
              name="provvigione_override"
              defaultValue={lp.provvigione_override || ''}
              min="0"
              max="100"
              step="0.01"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Data Inizio
            </label>
            <input
              type="date"
              name="data_inizio"
              defaultValue={lp.data_inizio || ''}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Data Fine
            </label>
            <input
              type="date"
              name="data_fine"
              defaultValue={lp.data_fine || ''}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Note
            </label>
            <input
              type="text"
              name="note"
              defaultValue={lp.note || ''}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Annulla
          </button>
          <button
            type="submit"
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Salva
          </button>
        </div>
      </form>
    </td>
  )
}
