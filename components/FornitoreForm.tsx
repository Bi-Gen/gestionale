'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getRegioni, getProvinceByRegione, getComuniByProvincia, type Regione, type Provincia, type Comune } from '@/app/actions/geografia'

type CategoriaFornitore = {
  id: number
  codice: string
  nome: string
  colore?: string
}

interface FornitoreFormProps {
  action: any
  initialData?: any
  submitLabel?: string
  categorieFornitore?: CategoriaFornitore[]
}

export default function FornitoreForm({ action, initialData, submitLabel = 'Salva Fornitore', categorieFornitore = [] }: FornitoreFormProps) {
  const [regioni, setRegioni] = useState<Regione[]>([])
  const [province, setProvince] = useState<Provincia[]>([])
  const [comuni, setComuni] = useState<Comune[]>([])

  const [selectedRegione, setSelectedRegione] = useState(initialData?.regione_id || '')
  const [selectedProvincia, setSelectedProvincia] = useState(initialData?.provincia_id || '')
  const [selectedComune, setSelectedComune] = useState(initialData?.comune_id || '')
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Stati per validazione client-side
  const [ibanError, setIbanError] = useState('')
  const [cfError, setCfError] = useState('')
  const [pivaError, setPivaError] = useState('')

  // Carica regioni all'avvio
  useEffect(() => {
    getRegioni().then(setRegioni)
  }, [])

  // Carica province e comuni iniziali se ci sono dati in edit mode
  useEffect(() => {
    const loadInitialGeoData = async () => {
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

  // Carica province quando cambia regione (solo dopo caricamento iniziale)
  useEffect(() => {
    if (!isInitialLoad && selectedRegione) {
      setProvince([])
      setComuni([])
      setSelectedProvincia('')
      setSelectedComune('')
      getProvinceByRegione(Number(selectedRegione)).then(setProvince)
    }
  }, [selectedRegione, isInitialLoad])

  // Carica comuni quando cambia provincia (solo dopo caricamento iniziale)
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

  // Validazione IBAN
  const validateIban = (value: string) => {
    if (!value) {
      setIbanError('')
      return
    }
    const cleanIban = value.replace(/\s/g, '').toUpperCase()
    const ibanRegex = /^IT\d{2}[A-Z]\d{10}[A-Z0-9]{12}$/
    if (!ibanRegex.test(cleanIban)) {
      setIbanError('IBAN non valido (formato italiano: IT + 27 caratteri)')
    } else {
      setIbanError('')
    }
  }

  // Validazione Codice Fiscale
  const validateCF = (value: string) => {
    if (!value) {
      setCfError('')
      return
    }
    const cfRegex = /^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/
    if (!cfRegex.test(value.toUpperCase())) {
      setCfError('Formato non valido (es: RSSMRA80A01H501U)')
    } else {
      setCfError('')
    }
  }

  // Validazione Partita IVA
  const validatePIVA = (value: string) => {
    if (!value) {
      setPivaError('')
      return
    }
    if (!/^\d{11}$/.test(value)) {
      setPivaError('Deve essere di 11 cifre numeriche')
    } else {
      setPivaError('')
    }
  }

  return (
    <form action={action} className="space-y-8">
      {/* ========================================= */}
      {/* SEZIONE 1: DATI ANAGRAFICI */}
      {/* ========================================= */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          📋 Dati Anagrafici
        </h2>

        <div className="space-y-6">
          {/* Tipo Persona */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo Soggetto
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="tipo_persona"
                  value="giuridica"
                  defaultChecked={!initialData?.tipo_persona || initialData?.tipo_persona === 'giuridica'}
                  className="mr-2"
                />
                <span className="text-sm">Persona Giuridica (Azienda)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="tipo_persona"
                  value="fisica"
                  defaultChecked={initialData?.tipo_persona === 'fisica'}
                  className="mr-2"
                />
                <span className="text-sm">Persona Fisica</span>
              </label>
            </div>
          </div>

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
              placeholder="es: Tech Distribution SpA"
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
                maxLength={11}
                placeholder="12345678901"
                defaultValue={initialData?.partita_iva}
                onBlur={(e) => validatePIVA(e.target.value)}
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 ${
                  pivaError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {pivaError && <p className="mt-1 text-xs text-red-600">{pivaError}</p>}
              {!pivaError && <p className="mt-1 text-xs text-gray-500">11 cifre numeriche</p>}
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
                defaultValue={initialData?.codice_fiscale}
                onBlur={(e) => validateCF(e.target.value)}
                className={`mt-1 block w-full rounded-md border px-3 py-2 text-gray-900 uppercase focus:outline-none focus:ring-2 ${
                  cfError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {cfError && <p className="mt-1 text-xs text-red-600">{cfError}</p>}
              {!cfError && <p className="mt-1 text-xs text-gray-500">16 caratteri alfanumerici</p>}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* SEZIONE 2: FATTURAZIONE ELETTRONICA */}
      {/* ========================================= */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-blue-300">
          ⚡ Fatturazione Elettronica
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Codice Univoco SDI */}
          <div>
            <label htmlFor="codice_univoco" className="block text-sm font-medium text-gray-700">
              Codice Univoco SDI
            </label>
            <input
              type="text"
              name="codice_univoco"
              id="codice_univoco"
              maxLength={7}
              placeholder="ABCDEFG"
              defaultValue={initialData?.codice_univoco}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 uppercase focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">7 caratteri alfanumerici per Sistema Di Interscambio</p>
          </div>

          {/* Email PEC */}
          <div>
            <label htmlFor="pec" className="block text-sm font-medium text-gray-700">
              Email PEC
            </label>
            <input
              type="email"
              name="pec"
              id="pec"
              placeholder="fornitori@pec.techdist.it"
              defaultValue={initialData?.pec}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Posta Elettronica Certificata</p>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* SEZIONE 3: CONTATTI */}
      {/* ========================================= */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          📞 Contatti
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              placeholder="info@techdist.it"
              defaultValue={initialData?.email}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          {/* Telefono */}
          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
              Telefono
            </label>
            <input
              type="tel"
              name="telefono"
              id="telefono"
              placeholder="02-12345678"
              defaultValue={initialData?.telefono}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          {/* Cellulare */}
          <div>
            <label htmlFor="cellulare" className="block text-sm font-medium text-gray-700">
              Cellulare
            </label>
            <input
              type="tel"
              name="cellulare"
              id="cellulare"
              placeholder="333-1234567"
              defaultValue={initialData?.cellulare}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          {/* Sito Web */}
          <div>
            <label htmlFor="sito_web" className="block text-sm font-medium text-gray-700">
              Sito Web
            </label>
            <input
              type="url"
              name="sito_web"
              id="sito_web"
              placeholder="https://www.techdist.it"
              defaultValue={initialData?.sito_web}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* SEZIONE 4: INDIRIZZO */}
      {/* ========================================= */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          📍 Indirizzo
        </h2>

        <div className="space-y-6">
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
              placeholder="Via Roma, 100"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          {/* Cascata Geografia */}
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

          {/* CAP e Paese */}
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

            <div>
              <label htmlFor="paese" className="block text-sm font-medium text-gray-700">
                Paese
              </label>
              <input
                type="text"
                name="paese"
                id="paese"
                maxLength={2}
                defaultValue={initialData?.paese || 'IT'}
                placeholder="IT"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 uppercase focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Codice ISO (IT, FR, DE...)</p>
            </div>
          </div>

          {/* Hidden fields per backward compatibility - calcolati automaticamente dalla selezione */}
          <input type="hidden" name="citta" id="citta" value={comuni.find(c => c.id === Number(selectedComune))?.nome || ''} />
          <input type="hidden" name="provincia" value={province.find(p => p.id === Number(selectedProvincia))?.sigla || ''} />
        </div>
      </div>

      {/* ========================================= */}
      {/* SEZIONE 5: DATI COMMERCIALI */}
      {/* ========================================= */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-green-300">
          💼 Dati Commerciali
        </h2>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Categoria Fornitore */}
            <div>
              <label htmlFor="categoria_fornitore_id" className="block text-sm font-medium text-gray-700">
                Categoria
              </label>
              <select
                name="categoria_fornitore_id"
                id="categoria_fornitore_id"
                defaultValue={initialData?.categoria_fornitore_id || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="">Seleziona categoria</option>
                {categorieFornitore.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.codice} - {cat.nome}
                  </option>
                ))}
              </select>
              {categorieFornitore.length === 0 && (
                <p className="mt-1 text-xs text-amber-600">
                  Nessuna categoria disponibile. Creale in Configurazioni → Categorie Fornitore
                </p>
              )}
            </div>

            {/* Giorni Consegna */}
            <div>
              <label htmlFor="giorni_consegna" className="block text-sm font-medium text-gray-700">
                Giorni Consegna
              </label>
              <input
                type="number"
                name="giorni_consegna"
                id="giorni_consegna"
                min="0"
                placeholder="5"
                defaultValue={initialData?.giorni_consegna}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Tempo medio di consegna</p>
            </div>

            {/* Sconto Fornitore */}
            <div>
              <label htmlFor="sconto_fornitore" className="block text-sm font-medium text-gray-700">
                Sconto % Abituale
              </label>
              <input
                type="number"
                name="sconto_fornitore"
                id="sconto_fornitore"
                min="0"
                max="100"
                step="0.01"
                placeholder="5.00"
                defaultValue={initialData?.sconto_fornitore}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Sconto ottenuto da questo fornitore</p>
            </div>
          </div>

          {/* Valuta e IVA */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="valuta" className="block text-sm font-medium text-gray-700">
                Valuta Predefinita
              </label>
              <select
                name="valuta"
                id="valuta"
                defaultValue={initialData?.valuta || 'EUR'}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="EUR">EUR (€)</option>
                <option value="USD">USD ($)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CHF">CHF (Fr)</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">Valuta utilizzata per transazioni</p>
            </div>

            <div>
              <label htmlFor="aliquota_iva" className="block text-sm font-medium text-gray-700">
                Aliquota IVA %
              </label>
              <input
                type="number"
                name="aliquota_iva"
                id="aliquota_iva"
                min="0"
                max="100"
                step="0.01"
                placeholder="22.00"
                defaultValue={initialData?.aliquota_iva || '22'}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Aliquota IVA predefinita</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* SEZIONE 6: PAGAMENTI */}
      {/* ========================================= */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-yellow-300">
          💰 Condizioni di Pagamento
        </h2>

        <div className="space-y-6">
          {/* Giorni Pagamento */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="giorni_pagamento" className="block text-sm font-medium text-gray-700">
                Giorni Pagamento
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
              <p className="mt-1 text-xs text-gray-500">Termini di pagamento concordati</p>
            </div>
          </div>

          {/* IBAN con validazione */}
          <div>
            <label htmlFor="iban" className="block text-sm font-medium text-gray-700">
              IBAN
            </label>
            <input
              type="text"
              name="iban"
              id="iban"
              maxLength={27}
              placeholder="IT60X0542811101000000123456"
              defaultValue={initialData?.iban}
              onBlur={(e) => validateIban(e.target.value)}
              className={`mt-1 block w-full rounded-md border px-3 py-2 text-gray-900 uppercase focus:outline-none focus:ring-2 ${
                ibanError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
            />
            {ibanError && (
              <p className="mt-1 text-xs text-red-600">
                {ibanError}
              </p>
            )}
            {!ibanError && (
              <p className="mt-1 text-xs text-gray-500">
                Coordinate bancarie per bonifici (puoi lasciare spazi)
              </p>
            )}
          </div>

          {/* Banca e SWIFT */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="banca" className="block text-sm font-medium text-gray-700">
                Banca
              </label>
              <input
                type="text"
                name="banca"
                id="banca"
                placeholder="Intesa Sanpaolo"
                defaultValue={initialData?.banca}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="swift_bic" className="block text-sm font-medium text-gray-700">
                SWIFT / BIC
              </label>
              <input
                type="text"
                name="swift_bic"
                id="swift_bic"
                maxLength={11}
                placeholder="BCITITMM"
                defaultValue={initialData?.swift_bic}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 uppercase focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Solo per bonifici internazionali</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* SEZIONE 7: REFERENTE */}
      {/* ========================================= */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          👤 Referente Principale
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Nome Referente */}
          <div>
            <label htmlFor="referente" className="block text-sm font-medium text-gray-700">
              Nome Referente
            </label>
            <input
              type="text"
              name="referente"
              id="referente"
              placeholder="Mario Bianchi - Ufficio Vendite"
              defaultValue={initialData?.referente}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          {/* Telefono Referente */}
          <div>
            <label htmlFor="referente_telefono" className="block text-sm font-medium text-gray-700">
              Telefono Referente
            </label>
            <input
              type="tel"
              name="referente_telefono"
              id="referente_telefono"
              placeholder="333-1234567"
              defaultValue={initialData?.referente_telefono}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          {/* Email Referente */}
          <div>
            <label htmlFor="referente_email" className="block text-sm font-medium text-gray-700">
              Email Referente
            </label>
            <input
              type="email"
              name="referente_email"
              id="referente_email"
              placeholder="mario.bianchi@techdist.it"
              defaultValue={initialData?.referente_email}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* SEZIONE 8: NOTE */}
      {/* ========================================= */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          📝 Note
        </h2>

        <div>
          <label htmlFor="note" className="block text-sm font-medium text-gray-700">
            Note aggiuntive
          </label>
          <textarea
            name="note"
            id="note"
            rows={4}
            defaultValue={initialData?.note}
            placeholder="Note, osservazioni, condizioni speciali..."
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 justify-end bg-gray-50 p-6 rounded-lg border border-gray-200">
        <Link
          href="/dashboard/fornitori"
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
        >
          Annulla
        </Link>
        <button
          type="submit"
          disabled={!!ibanError || !!cfError || !!pivaError}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors shadow-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {submitLabel}
        </button>
      </div>

      {/* Errori di validazione */}
      {(ibanError || cfError || pivaError) && (
        <div className="fixed bottom-4 right-4 bg-red-50 border-2 border-red-200 rounded-lg p-4 shadow-lg max-w-md">
          <h3 className="text-sm font-semibold text-red-800 mb-2">⚠️ Correggi gli errori prima di salvare:</h3>
          <ul className="text-xs text-red-700 space-y-1">
            {pivaError && <li>• Partita IVA: {pivaError}</li>}
            {cfError && <li>• Codice Fiscale: {cfError}</li>}
            {ibanError && <li>• IBAN: {ibanError}</li>}
          </ul>
        </div>
      )}
    </form>
  )
}
