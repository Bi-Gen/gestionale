'use client'

import { useState } from 'react'
import { createSedeCliente, updateSedeCliente, deleteSedeCliente, setSedeClientePredefinita, type SedeCliente } from '@/app/actions/sedi-cliente'

type TrasportatoreOption = {
  id: number
  ragione_sociale: string
  costo_trasporto_kg?: number
}

type SediClienteManagerProps = {
  clienteId: number
  sedi: SedeCliente[]
  trasportatori?: TrasportatoreOption[]
  onUpdate?: () => void
}

type SedeFormData = {
  codice: string
  denominazione: string
  indirizzo: string
  civico: string
  cap: string
  citta: string
  provincia: string
  paese: string
  trasportatore_id: string
  note_consegna: string
  predefinito: boolean
  per_spedizione: boolean
  per_fatturazione: boolean
}

const emptySedeForm: SedeFormData = {
  codice: '',
  denominazione: '',
  indirizzo: '',
  civico: '',
  cap: '',
  citta: '',
  provincia: '',
  paese: 'Italia',
  trasportatore_id: '',
  note_consegna: '',
  predefinito: false,
  per_spedizione: true,
  per_fatturazione: false
}

export default function SediClienteManager({
  clienteId,
  sedi,
  trasportatori = [],
  onUpdate
}: SediClienteManagerProps) {
  const [localSedi, setLocalSedi] = useState<SedeCliente[]>(sedi)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState<SedeFormData>(emptySedeForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setFormData(emptySedeForm)
    setIsAdding(false)
    setEditingId(null)
    setError(null)
  }

  const handleAdd = () => {
    setIsAdding(true)
    setEditingId(null)
    setFormData(emptySedeForm)
    setError(null)
  }

  const handleEdit = (sede: SedeCliente) => {
    setEditingId(sede.id)
    setIsAdding(false)
    setFormData({
      codice: sede.codice || '',
      denominazione: sede.denominazione,
      indirizzo: sede.indirizzo || '',
      civico: sede.civico || '',
      cap: sede.cap || '',
      citta: sede.citta || '',
      provincia: sede.provincia || '',
      paese: sede.paese || 'Italia',
      trasportatore_id: sede.trasportatore_id?.toString() || '',
      note_consegna: sede.note_consegna || '',
      predefinito: sede.predefinito,
      per_spedizione: sede.per_spedizione,
      per_fatturazione: sede.per_fatturazione
    })
    setError(null)
  }

  const handleSave = async () => {
    if (!formData.denominazione.trim()) {
      setError('La denominazione è obbligatoria')
      return
    }

    setLoading(true)
    setError(null)

    const formDataObj = new FormData()
    formDataObj.append('cliente_id', clienteId.toString())
    formDataObj.append('codice', formData.codice)
    formDataObj.append('denominazione', formData.denominazione)
    formDataObj.append('indirizzo', formData.indirizzo)
    formDataObj.append('civico', formData.civico)
    formDataObj.append('cap', formData.cap)
    formDataObj.append('citta', formData.citta)
    formDataObj.append('provincia', formData.provincia)
    formDataObj.append('paese', formData.paese)
    formDataObj.append('trasportatore_id', formData.trasportatore_id)
    formDataObj.append('note_consegna', formData.note_consegna)
    formDataObj.append('predefinito', formData.predefinito.toString())
    formDataObj.append('per_spedizione', formData.per_spedizione.toString())
    formDataObj.append('per_fatturazione', formData.per_fatturazione.toString())

    try {
      if (editingId) {
        const result = await updateSedeCliente(editingId, formDataObj)
        if (result.success && result.data) {
          setLocalSedi(localSedi.map(s => s.id === editingId ? { ...s, ...result.data } : s))
        } else {
          setError(result.error || 'Errore durante l\'aggiornamento')
          setLoading(false)
          return
        }
      } else {
        const result = await createSedeCliente(formDataObj)
        if (result.success && result.data) {
          setLocalSedi([...localSedi, result.data as SedeCliente])
        } else {
          setError(result.error || 'Errore durante la creazione')
          setLoading(false)
          return
        }
      }
      resetForm()
      onUpdate?.()
    } catch (err) {
      setError('Errore durante il salvataggio')
    }
    setLoading(false)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questa sede?')) return

    setLoading(true)
    const result = await deleteSedeCliente(id)
    if (result.success) {
      setLocalSedi(localSedi.filter(s => s.id !== id))
      onUpdate?.()
    } else {
      setError(result.error || 'Errore durante l\'eliminazione')
    }
    setLoading(false)
  }

  const handleSetPredefinita = async (id: number) => {
    setLoading(true)
    const result = await setSedeClientePredefinita(id, clienteId)
    if (result.success) {
      setLocalSedi(localSedi.map(s => ({
        ...s,
        predefinito: s.id === id
      })))
      onUpdate?.()
    } else {
      setError(result.error || 'Errore durante l\'impostazione')
    }
    setLoading(false)
  }

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Sedi / Indirizzi di Spedizione</h3>
        {!isAdding && !editingId && (
          <button
            type="button"
            onClick={handleAdd}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            + Aggiungi Sede
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Lista Sedi Esistenti */}
      {localSedi.length > 0 && !isAdding && !editingId && (
        <div className="space-y-3 mb-4">
          {localSedi.map((sede) => (
            <div
              key={sede.id}
              className={`p-4 border rounded-lg ${
                sede.predefinito ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{sede.denominazione}</span>
                    {sede.codice && <span className="text-xs text-gray-500">[{sede.codice}]</span>}
                    {sede.predefinito && (
                      <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded">Predefinita</span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {sede.indirizzo} {sede.civico}, {sede.cap} {sede.citta} {sede.provincia && `(${sede.provincia})`}
                  </div>
                  <div className="flex gap-2 mt-2">
                    {sede.per_spedizione && (
                      <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">Spedizione</span>
                    )}
                    {sede.per_fatturazione && (
                      <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">Fatturazione</span>
                    )}
                    {sede.trasportatore && (
                      <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded">
                        Trasp: {sede.trasportatore.ragione_sociale}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!sede.predefinito && (
                    <button
                      type="button"
                      onClick={() => handleSetPredefinita(sede.id)}
                      disabled={loading}
                      className="px-2 py-1 text-xs border border-blue-300 text-blue-600 rounded hover:bg-blue-50 disabled:opacity-50"
                      title="Imposta come predefinita"
                    >
                      Predefinita
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleEdit(sede)}
                    disabled={loading}
                    className="px-2 py-1 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    Modifica
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(sede.id)}
                    disabled={loading}
                    className="px-2 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50 disabled:opacity-50"
                  >
                    Elimina
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {localSedi.length === 0 && !isAdding && (
        <p className="text-gray-500 text-sm mb-4">
          Nessuna sede aggiuntiva configurata. L&apos;indirizzo principale del cliente verrà utilizzato per le spedizioni.
        </p>
      )}

      {/* Form Aggiunta/Modifica */}
      {(isAdding || editingId) && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            {editingId ? 'Modifica Sede' : 'Nuova Sede'}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Codice</label>
                <input
                  type="text"
                  value={formData.codice}
                  onChange={(e) => setFormData({ ...formData, codice: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Es: SEDE001"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Denominazione *</label>
                <input
                  type="text"
                  value={formData.denominazione}
                  onChange={(e) => setFormData({ ...formData, denominazione: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Es: Magazzino Nord, Filiale Milano..."
                  required
                />
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-4 gap-4">
              <div className="col-span-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">Indirizzo</label>
                <input
                  type="text"
                  value={formData.indirizzo}
                  onChange={(e) => setFormData({ ...formData, indirizzo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Via/Piazza..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Civico</label>
                <input
                  type="text"
                  value={formData.civico}
                  onChange={(e) => setFormData({ ...formData, civico: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>

            <div className="md:col-span-2 grid grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">CAP</label>
                <input
                  type="text"
                  value={formData.cap}
                  onChange={(e) => setFormData({ ...formData, cap: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  maxLength={5}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Città</label>
                <input
                  type="text"
                  value={formData.citta}
                  onChange={(e) => setFormData({ ...formData, citta: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Provincia</label>
                <input
                  type="text"
                  value={formData.provincia}
                  onChange={(e) => setFormData({ ...formData, provincia: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  maxLength={2}
                />
              </div>
            </div>

            {/* Trasportatore */}
            {trasportatori.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Trasportatore dedicato</label>
                <select
                  value={formData.trasportatore_id}
                  onChange={(e) => setFormData({ ...formData, trasportatore_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                  <option value="">Usa trasportatore cliente</option>
                  {trasportatori.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.ragione_sociale} {t.costo_trasporto_kg ? `(${t.costo_trasporto_kg.toFixed(2)} €/kg)` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Note Consegna */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Note Consegna</label>
              <input
                type="text"
                value={formData.note_consegna}
                onChange={(e) => setFormData({ ...formData, note_consegna: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Es: Citofono 5, Orari 8-12..."
              />
            </div>

            {/* Flags */}
            <div className="md:col-span-2 flex flex-wrap gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.per_spedizione}
                  onChange={(e) => setFormData({ ...formData, per_spedizione: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-700">Per spedizione</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.per_fatturazione}
                  onChange={(e) => setFormData({ ...formData, per_fatturazione: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-700">Per fatturazione</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.predefinito}
                  onChange={(e) => setFormData({ ...formData, predefinito: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-700">Sede predefinita</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Salvataggio...' : 'Salva'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={loading}
              className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Annulla
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
