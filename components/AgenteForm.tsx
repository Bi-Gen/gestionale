'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getRegioni, getProvinceByRegione, getComuniByProvincia, type Regione, type Provincia, type Comune } from '@/app/actions/geografia'

interface AgenteFormProps {
  action: any
  initialData?: any
  submitLabel?: string
}

export default function AgenteForm({ action, initialData, submitLabel = 'Salva Agente' }: AgenteFormProps) {
  // Stati per geografia
  const [regioni, setRegioni] = useState<Regione[]>([])
  const [province, setProvince] = useState<Provincia[]>([])
  const [comuni, setComuni] = useState<Comune[]>([])
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const [selectedRegione, setSelectedRegione] = useState(initialData?.regione_id || '')
  const [selectedProvincia, setSelectedProvincia] = useState(initialData?.provincia_id || '')
  const [selectedComune, setSelectedComune] = useState(initialData?.comune_id || '')

  // Carica dati geografici iniziali
  useEffect(() => {
    const loadInitialGeoData = async () => {
      const regioniData = await getRegioni()
      setRegioni(regioniData)

      if (initialData?.regione_id) {
        const provinceData = await getProvinceByRegione(Number(initialData.regione_id))
        setProvince(provinceData)

        if (initialData?.provincia_id) {
          const comuniData = await getComuniByProvincia(Number(initialData.provincia_id))
          setComuni(comuniData)
        }
      }
      setIsInitialLoad(false)
    }

    loadInitialGeoData()
  }, [])

  // Carica province quando cambia regione
  useEffect(() => {
    if (!isInitialLoad && selectedRegione) {
      setProvince([])
      setComuni([])
      setSelectedProvincia('')
      setSelectedComune('')
      getProvinceByRegione(Number(selectedRegione)).then(setProvince)
    }
  }, [selectedRegione, isInitialLoad])

  // Carica comuni quando cambia provincia
  useEffect(() => {
    if (!isInitialLoad && selectedProvincia) {
      setComuni([])
      setSelectedComune('')
      getComuniByProvincia(Number(selectedProvincia)).then(setComuni)
    }
  }, [selectedProvincia, isInitialLoad])

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
    <form action={action} className="space-y-8">
      {/* SEZIONE 1: DATI ANAGRAFICI */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          👤 Dati Anagrafici
        </h2>
        <div className="space-y-6">
          {/* Tipo Persona sempre "giuridica" per agenti (hidden) */}
          <input type="hidden" name="tipo_persona" value="giuridica" />

          {/* Codice Agente */}
          <div>
            <label htmlFor="codice_agente" className="block text-sm font-medium text-gray-700">
              Codice Agente
            </label>
            <input
              type="text"
              name="codice_agente"
              id="codice_agente"
              placeholder="AG001 (auto-generato se vuoto)"
              defaultValue={initialData?.codice_agente || ''}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Lascia vuoto per auto-generazione automatica</p>
          </div>

          {/* Ragione Sociale */}
          <div>
            <label htmlFor="ragione_sociale" className="block text-sm font-medium text-gray-700">
              Ragione Sociale <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="ragione_sociale"
              id="ragione_sociale"
              required
              placeholder="Agenzia Commerciale Rossi Srl"
              defaultValue={initialData?.ragione_sociale || ''}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Nome della società agente</p>
          </div>
        </div>
      </div>

      {/* SEZIONE 2: DATI FISCALI */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-yellow-300">
          🧾 Dati Fiscali e Fatturazione
        </h2>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="partita_iva" className="block text-sm font-medium text-gray-700">
                Partita IVA <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="partita_iva"
                id="partita_iva"
                required
                maxLength={11}
                placeholder="12345678901"
                defaultValue={initialData?.partita_iva || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">11 cifre - obbligatoria</p>
            </div>

            <div>
              <label htmlFor="codice_fiscale" className="block text-sm font-medium text-gray-700">
                Codice Fiscale
              </label>
              <input
                type="text"
                name="codice_fiscale"
                id="codice_fiscale"
                maxLength={16}
                placeholder="RSSMRA80A01H501U"
                defaultValue={initialData?.codice_fiscale || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 uppercase focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">16 caratteri</p>
            </div>

            <div>
              <label htmlFor="codice_univoco" className="block text-sm font-medium text-gray-700">
                Codice Univoco SDI
              </label>
              <input
                type="text"
                name="codice_univoco"
                id="codice_univoco"
                maxLength={7}
                placeholder="A1B2C3D"
                defaultValue={initialData?.codice_univoco || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 uppercase focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">7 caratteri (per fatturazione elettronica)</p>
            </div>

            <div>
              <label htmlFor="pec" className="block text-sm font-medium text-gray-700">
                Email PEC
              </label>
              <input
                type="email"
                name="pec"
                id="pec"
                placeholder="agenzia@pec.it"
                defaultValue={initialData?.pec || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* SEZIONE 3: CONTATTI */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-blue-300">
          📞 Contatti
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="agente@example.com"
              defaultValue={initialData?.email || ''}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="sito_web" className="block text-sm font-medium text-gray-700">
              Sito Web
            </label>
            <input
              type="url"
              name="sito_web"
              id="sito_web"
              placeholder="https://www.example.com"
              defaultValue={initialData?.sito_web || ''}
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
              placeholder="+39 02 12345678"
              defaultValue={initialData?.telefono || ''}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="cellulare" className="block text-sm font-medium text-gray-700">
              Cellulare
            </label>
            <input
              type="tel"
              name="cellulare"
              id="cellulare"
              placeholder="+39 333 1234567"
              defaultValue={initialData?.cellulare || ''}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="fax" className="block text-sm font-medium text-gray-700">
              Fax
            </label>
            <input
              type="tel"
              name="fax"
              id="fax"
              placeholder="+39 02 7654321"
              defaultValue={initialData?.fax || ''}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* SEZIONE 4: INDIRIZZO */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-green-300">
          📍 Indirizzo
        </h2>
        <div className="space-y-6">
          {/* Via e Civico */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-3">
              <label htmlFor="indirizzo" className="block text-sm font-medium text-gray-700">
                Via/Piazza
              </label>
              <input
                type="text"
                name="indirizzo"
                id="indirizzo"
                placeholder="Via Roma"
                defaultValue={initialData?.indirizzo || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="civico" className="block text-sm font-medium text-gray-700">
                N. Civico
              </label>
              <input
                type="text"
                name="civico"
                id="civico"
                placeholder="123"
                defaultValue={initialData?.civico || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Geografia Cascata */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                <option value="">Seleziona</option>
                {regioni.map(r => (
                  <option key={r.id} value={r.id}>{r.nome}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="provincia" className="block text-sm font-medium text-gray-700">
                Provincia
              </label>
              <select
                id="provincia"
                value={selectedProvincia}
                onChange={(e) => setSelectedProvincia(e.target.value)}
                disabled={!selectedRegione}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">Seleziona</option>
                {province.map(p => (
                  <option key={p.id} value={p.id}>{p.nome} ({p.sigla})</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="comune_id" className="block text-sm font-medium text-gray-700">
                Comune
              </label>
              <select
                name="comune_id"
                id="comune_id"
                value={selectedComune}
                onChange={(e) => handleComuneChange(e.target.value)}
                disabled={!selectedProvincia}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 disabled:bg-gray-100"
              >
                <option value="">Seleziona</option>
                {comuni.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

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
                placeholder="Auto"
                defaultValue={initialData?.cap}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Hidden fields */}
          <input type="hidden" name="citta" value={comuni.find(c => c.id === Number(selectedComune))?.nome || ''} />
          <input type="hidden" name="provincia" value={province.find(p => p.id === Number(selectedProvincia))?.sigla || ''} />
        </div>
      </div>

      {/* SEZIONE 5: DATI AGENTE */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-purple-300">
          💼 Dati Agente
        </h2>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="area_geografica" className="block text-sm font-medium text-gray-700">
                Area Geografica
              </label>
              <input
                type="text"
                name="area_geografica"
                id="area_geografica"
                placeholder="Nord Italia, Lombardia..."
                defaultValue={initialData?.area_geografica || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Zona di competenza</p>
            </div>

            <div>
              <label htmlFor="provvigione_percentuale" className="block text-sm font-medium text-gray-700">
                Provvigione %
              </label>
              <input
                type="number"
                name="provvigione_percentuale"
                id="provvigione_percentuale"
                min="0"
                max="100"
                step="0.01"
                placeholder="5.00"
                defaultValue={initialData?.provvigione_percentuale || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">% su vendite (0-100)</p>
            </div>

            <div>
              <label htmlFor="attivo_come_agente" className="block text-sm font-medium text-gray-700">
                Stato
              </label>
              <select
                name="attivo_come_agente"
                id="attivo_come_agente"
                defaultValue={initialData?.attivo_come_agente !== false ? 'true' : 'false'}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="true">✅ Attivo</option>
                <option value="false">❌ Non Attivo</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* SEZIONE 6: PAGAMENTI */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-orange-300">
          💰 Dati Pagamento
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="giorni_pagamento" className="block text-sm font-medium text-gray-700">
              Giorni Pagamento Provvigioni
            </label>
            <input
              type="number"
              name="giorni_pagamento"
              id="giorni_pagamento"
              min="0"
              placeholder="30"
              defaultValue={initialData?.giorni_pagamento || '30'}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="banca" className="block text-sm font-medium text-gray-700">
              Banca
            </label>
            <input
              type="text"
              name="banca"
              id="banca"
              placeholder="Intesa Sanpaolo"
              defaultValue={initialData?.banca || ''}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="iban" className="block text-sm font-medium text-gray-700">
              IBAN
            </label>
            <input
              type="text"
              name="iban"
              id="iban"
              placeholder="IT60X0542811101000000123456"
              defaultValue={initialData?.iban || ''}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 uppercase focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="swift_bic" className="block text-sm font-medium text-gray-700">
              SWIFT/BIC
            </label>
            <input
              type="text"
              name="swift_bic"
              id="swift_bic"
              placeholder="BPMOIT22XXX"
              defaultValue={initialData?.swift_bic || ''}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 uppercase focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* SEZIONE 7: NOTE */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          📝 Note
        </h2>
        <div>
          <label htmlFor="note" className="block text-sm font-medium text-gray-700">
            Note Interne
          </label>
          <textarea
            name="note"
            id="note"
            rows={4}
            placeholder="Informazioni aggiuntive sull'agente..."
            defaultValue={initialData?.note || ''}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>
      </div>

      {/* AZIONI */}
      <div className="flex justify-end gap-3 pt-4">
        <Link
          href="/dashboard/agenti"
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
