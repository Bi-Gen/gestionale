'use client'

import { useState, useMemo, useEffect } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'

const NATURE_CONTO = [
  { value: 'A', label: 'Attivo', tipo: 'patrimoniale' },
  { value: 'P', label: 'Passivo', tipo: 'patrimoniale' },
  { value: 'C', label: 'Costi', tipo: 'economico' },
  { value: 'R', label: 'Ricavi', tipo: 'economico' },
  { value: 'O', label: 'Ordine', tipo: 'patrimoniale' },
]

const TIPI_COSTO = [
  { value: 'merce', label: 'Merce (COGS)' },
  { value: 'servizi', label: 'Servizi' },
  { value: 'trasporti', label: 'Trasporti' },
  { value: 'utility', label: 'Utility' },
  { value: 'finanziari', label: 'Finanziari' },
  { value: 'commerciale', label: 'Commerciale' },
  { value: 'altro', label: 'Altro' },
]

type ContoParent = {
  id: number
  codice: string
  descrizione: string
  livello: number
  natura: string
}

type ContoEsistente = {
  codice: string
  parent_id: number | null
  natura: string
}

type ContoData = {
  id?: number
  codice: string
  descrizione: string
  livello: number
  parent_id?: number
  tipo_conto: string
  natura: string
  tipo_costo?: string
  conto_cliente: boolean
  conto_fornitore: boolean
  conto_banca: boolean
  conto_cassa: boolean
  note?: string
  modificabile: boolean
}

function SubmitButton({ isEdit, disabled }: { isEdit: boolean; disabled?: boolean }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
    >
      {pending ? 'Salvataggio...' : isEdit ? 'Aggiorna Conto' : 'Crea Conto'}
    </button>
  )
}

// Funzione per calcolare il prossimo codice
function calcolaProssimoCodice(
  contiEsistenti: ContoEsistente[],
  parentId: string | null,
  natura: string,
  parentCodice?: string
): string {
  // Filtra conti con stesso parent e natura
  const contiFratelli = contiEsistenti.filter(c => {
    const stessoParent = parentId
      ? c.parent_id === parseInt(parentId)
      : c.parent_id === null
    return stessoParent && c.natura === natura
  })

  if (contiFratelli.length === 0) {
    // Primo figlio
    if (parentCodice) {
      return `${parentCodice}.01`
    }
    // Primo conto di primo livello per questa natura
    const prefissi: Record<string, number> = { A: 1, P: 2, C: 3, R: 4, O: 5 }
    return `${prefissi[natura] || 9}`
  }

  // Trova il numero più alto
  let maxNum = 0
  contiFratelli.forEach(c => {
    const parts = c.codice.split('.')
    const lastPart = parts[parts.length - 1]
    const num = parseInt(lastPart, 10)
    if (!isNaN(num) && num > maxNum) {
      maxNum = num
    }
  })

  const nextNum = (maxNum + 1).toString().padStart(2, '0')

  if (parentCodice) {
    return `${parentCodice}.${nextNum}`
  }

  return nextNum
}

export default function PianoContiForm({
  conto,
  contiParent = [],
  contiEsistenti = [],
  action,
  error,
}: {
  conto?: ContoData
  contiParent?: ContoParent[]
  contiEsistenti?: ContoEsistente[]
  action: (formData: FormData) => Promise<void>
  error?: string
}) {
  const isEdit = !!conto?.id
  const isReadOnly = isEdit && !conto?.modificabile

  const [natura, setNatura] = useState(conto?.natura || 'C')
  const [parentId, setParentId] = useState(conto?.parent_id?.toString() || '')

  // Filtra parent per natura compatibile
  const parentsFiltrati = contiParent.filter(p => {
    // Se stiamo modificando, escludi se stesso
    if (conto?.id && p.id === conto.id) return false
    // Filtra per natura compatibile
    return p.natura === natura
  })

  // Trova il codice del parent selezionato
  const parentSelezionato = parentsFiltrati.find(p => p.id.toString() === parentId)

  // Calcola il codice automatico per nuovi conti
  const codiceAutomatico = useMemo(() => {
    if (isEdit) return conto?.codice || ''
    return calcolaProssimoCodice(
      contiEsistenti,
      parentId || null,
      natura,
      parentSelezionato?.codice
    )
  }, [isEdit, conto?.codice, contiEsistenti, parentId, natura, parentSelezionato?.codice])

  // Determina tipo_conto dalla natura
  const tipoConto = ['A', 'P', 'O'].includes(natura) ? 'patrimoniale' : 'economico'

  return (
    <form action={action} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {isReadOnly && (
        <div className="rounded-md bg-yellow-50 p-4">
          <p className="text-sm text-yellow-700">
            Questo conto è di sistema e non può essere modificato.
          </p>
        </div>
      )}

      {/* Dati Principali */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Dati Conto</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Natura */}
          <div>
            <label htmlFor="natura" className="block text-sm font-medium text-gray-700 mb-1">
              Natura <span className="text-red-500">*</span>
            </label>
            <select
              id="natura"
              name="natura"
              value={natura}
              onChange={(e) => {
                setNatura(e.target.value)
                setParentId('') // Reset parent quando cambia natura
              }}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            >
              {NATURE_CONTO.map((n) => (
                <option key={n.value} value={n.value}>
                  {n.value} - {n.label}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo Conto (auto) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo Conto
            </label>
            <input
              type="text"
              value={tipoConto === 'patrimoniale' ? 'Patrimoniale' : 'Economico'}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
            />
            <input type="hidden" name="tipo_conto" value={tipoConto} />
          </div>

          {/* Conto Parent */}
          <div>
            <label htmlFor="parent_id" className="block text-sm font-medium text-gray-700 mb-1">
              Conto Padre
            </label>
            <select
              id="parent_id"
              name="parent_id"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
            >
              <option value="">-- Nessuno (Livello 1) --</option>
              {parentsFiltrati.map((p) => (
                <option key={p.id} value={p.id.toString()}>
                  {'  '.repeat(p.livello - 1)}{p.codice} - {p.descrizione}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Lascia vuoto per creare un conto di primo livello
            </p>
          </div>

          {/* Codice */}
          <div>
            <label htmlFor="codice" className="block text-sm font-medium text-gray-700 mb-1">
              Codice <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="codice"
              name="codice"
              value={codiceAutomatico}
              readOnly
              required
              maxLength={20}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-700 font-mono"
            />
            {!isEdit && (
              <p className="mt-1 text-xs text-gray-500">
                Codice generato automaticamente
              </p>
            )}
          </div>

          {/* Descrizione */}
          <div className="md:col-span-2">
            <label htmlFor="descrizione" className="block text-sm font-medium text-gray-700 mb-1">
              Descrizione <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="descrizione"
              name="descrizione"
              defaultValue={conto?.descrizione || ''}
              required
              maxLength={255}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              placeholder="es. Provvigioni Agenti"
            />
          </div>

          {/* Tipo Costo (solo per natura C) */}
          {natura === 'C' && (
            <div>
              <label htmlFor="tipo_costo" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo Costo
              </label>
              <select
                id="tipo_costo"
                name="tipo_costo"
                defaultValue={conto?.tipo_costo || ''}
                disabled={isReadOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              >
                <option value="">-- Non specificato --</option>
                {TIPI_COSTO.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Per classificare i costi nelle analisi
              </p>
            </div>
          )}

          {/* Note */}
          <div className={natura === 'C' ? '' : 'md:col-span-2'}>
            <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
              Note
            </label>
            <textarea
              id="note"
              name="note"
              defaultValue={conto?.note || ''}
              rows={2}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
              placeholder="Note opzionali"
            />
          </div>
        </div>
      </div>

      {/* Caratteristiche Speciali */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Caratteristiche Speciali</h2>

        {/* Avviso informativo */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Nota:</strong> Queste flag servono per identificare conti patrimoniali con funzioni specifiche
            nel sistema (es. per registrazioni automatiche fatture, incassi/pagamenti, report liquidità).
            <br />
            <span className="text-blue-600">Per i conti economici (Costi/Ricavi) generalmente non serve flaggare nulla.</span>
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="conto_cliente"
              value="true"
              defaultChecked={conto?.conto_cliente}
              disabled={isReadOnly}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Mastro Clienti</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="conto_fornitore"
              value="true"
              defaultChecked={conto?.conto_fornitore}
              disabled={isReadOnly}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Mastro Fornitori</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="conto_banca"
              value="true"
              defaultChecked={conto?.conto_banca}
              disabled={isReadOnly}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Conto Banca</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="conto_cassa"
              value="true"
              defaultChecked={conto?.conto_cassa}
              disabled={isReadOnly}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Conto Cassa</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Link
          href="/dashboard/configurazioni/piano-conti"
          className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 transition-colors"
        >
          {isReadOnly ? 'Indietro' : 'Annulla'}
        </Link>
        {!isReadOnly && <SubmitButton isEdit={isEdit} />}
      </div>
    </form>
  )
}
