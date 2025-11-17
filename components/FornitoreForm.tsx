'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getRegioni, getProvinceByRegione, getComuniByProvincia, type Regione, type Provincia, type Comune } from '@/app/actions/geografia'

interface FornitoreFormProps {
  action: any
  initialData?: any
  submitLabel?: string
}

export default function FornitoreForm({ action, initialData, submitLabel = 'Salva Fornitore' }: FornitoreFormProps) {
  const [regioni, setRegioni] = useState<Regione[]>([])
  const [province, setProvince] = useState<Provincia[]>([])
  const [comuni, setComuni] = useState<Comune[]>([])

  const [selectedRegione, setSelectedRegione] = useState(initialData?.regione_id || '')
  const [selectedProvincia, setSelectedProvincia] = useState(initialData?.provincia_id || '')
  const [selectedComune, setSelectedComune] = useState(initialData?.comune_id || '')

  // Carica regioni all'avvio
  useEffect(() => {
    getRegioni().then(setRegioni)
  }, [])

  // Carica province quando cambia regione
  useEffect(() => {
    if (selectedRegione) {
      setProvince([])
      setComuni([])
      setSelectedProvincia('')
      setSelectedComune('')
      getProvinceByRegione(Number(selectedRegione)).then(setProvince)
    }
  }, [selectedRegione])

  // Carica comuni quando cambia provincia
  useEffect(() => {
    if (selectedProvincia) {
      setComuni([])
      setSelectedComune('')
      getComuniByProvincia(Number(selectedProvincia)).then(setComuni)
    }
  }, [selectedProvincia])

  // Auto-compila CAP quando seleziono comune
  const handleComuneChange = (comuneId: string) => {
    setSelectedComune(comuneId)
    const comune = comuni.find(c => c.id === Number(comuneId))
    if (comune?.cap) {
      const capInput = document.getElementById('cap') as HTMLInputElement
      if (capInput) capInput.value = comune.cap
    }
  }

  return (
    <form action={action} className="space-y-6">
      {/* Ragione Sociale */}
      <div>
        <label htmlFor="ragione_sociale" className="block text-sm font-medium text-gray-700">
          Ragione Sociale *
        </label>
        <input
          type="text"
          name="ragione_sociale"
          id="ragione_sociale"
          required
          defaultValue={initialData?.ragione_sociale}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>

      {/* P.IVA e Codice Fiscale */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="partita_iva" className="block text-sm font-medium text-gray-700">
            Partita IVA
          </label>
          <input
            type="text"
            name="partita_iva"
            id="partita_iva"
            pattern="\d{11}"
            maxLength={11}
            title="Partita IVA deve essere di 11 cifre"
            placeholder="12345678901"
            defaultValue={initialData?.partita_iva}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">11 cifre numeriche</p>
        </div>

        <div>
          <label htmlFor="codice_fiscale" className="block text-sm font-medium text-gray-700">
            Codice Fiscale
          </label>
          <input
            type="text"
            name="codice_fiscale"
            id="codice_fiscale"
            pattern="[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]"
            maxLength={16}
            title="Codice Fiscale formato: RSSMRA80A01H501U"
            placeholder="RSSMRA80A01H501U"
            defaultValue={initialData?.codice_fiscale}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 uppercase focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">16 caratteri alfanumerici</p>
        </div>
      </div>

      {/* Email e Telefono */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            defaultValue={initialData?.email}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
            Telefono
          </label>
          <input
            type="tel"
            name="telefono"
            id="telefono"
            defaultValue={initialData?.telefono}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Indirizzo */}
      <div>
        <label htmlFor="indirizzo" className="block text-sm font-medium text-gray-700">
          Indirizzo
        </label>
        <input
          type="text"
          name="indirizzo"
          id="indirizzo"
          defaultValue={initialData?.indirizzo}
          placeholder="Via Roma, 1"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>

      {/* GEOGRAFIA: Regione, Provincia, Comune */}
      <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-sm font-semibold text-gray-900">📍 Località</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Regione */}
          <div>
            <label htmlFor="regione" className="block text-sm font-medium text-gray-700">
              Regione
            </label>
            <select
              id="regione"
              value={selectedRegione}
              onChange={(e) => setSelectedRegione(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="">Seleziona regione</option>
              {regioni.map(r => (
                <option key={r.id} value={r.id}>{r.nome}</option>
              ))}
            </select>
          </div>

          {/* Provincia */}
          <div>
            <label htmlFor="provincia_select" className="block text-sm font-medium text-gray-700">
              Provincia
            </label>
            <select
              id="provincia_select"
              value={selectedProvincia}
              onChange={(e) => setSelectedProvincia(e.target.value)}
              disabled={!selectedRegione}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Seleziona provincia</option>
              {province.map(p => (
                <option key={p.id} value={p.id}>{p.nome} ({p.sigla})</option>
              ))}
            </select>
          </div>

          {/* Comune */}
          <div>
            <label htmlFor="comune" className="block text-sm font-medium text-gray-700">
              Comune
            </label>
            <select
              id="comune"
              name="comune_id"
              value={selectedComune}
              onChange={(e) => handleComuneChange(e.target.value)}
              disabled={!selectedProvincia}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Seleziona comune</option>
              {comuni.map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
        </div>

        {/* CAP (auto-compilato) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="cap" className="block text-sm font-medium text-gray-700">
              CAP
            </label>
            <input
              type="text"
              name="cap"
              id="cap"
              pattern="\d{5}"
              maxLength={5}
              placeholder="Auto-compilato"
              defaultValue={initialData?.cap}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Auto-compilato dalla selezione comune</p>
          </div>

          {/* Hidden fields for backward compatibility */}
          <input type="hidden" name="citta" id="citta" value={comuni.find(c => c.id === Number(selectedComune))?.nome || ''} />
          <input type="hidden" name="provincia" value={province.find(p => p.id === Number(selectedProvincia))?.sigla || ''} />
        </div>
      </div>

      {/* Note */}
      <div>
        <label htmlFor="note" className="block text-sm font-medium text-gray-700">
          Note
        </label>
        <textarea
          name="note"
          id="note"
          rows={3}
          defaultValue={initialData?.note}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-4 justify-end">
        <Link
          href="/dashboard/fornitori"
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Annulla
        </Link>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
