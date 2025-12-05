'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getRegioni, getProvinceByRegione, getComuniByProvincia, type Regione, type Provincia, type Comune } from '@/app/actions/geografia'
import { getAgentiAttivi, type AgenteLista } from '@/app/actions/agenti'
import { getCategorieClienteAttive } from '@/app/actions/categorie-cliente'
import { getListiniAttivi } from '@/app/actions/listini'

type CategoriaCliente = {
  id: number
  codice: string
  nome: string
  listino_id?: number
  sconto_default: number
  colore: string
}

type Listino = {
  id: number
  codice: string
  nome: string
}

interface ClienteFormProps {
  action: any
  initialData?: any
  submitLabel?: string
}

export default function ClienteForm({ action, initialData, submitLabel = 'Salva Cliente' }: ClienteFormProps) {
  // Stati per geografia
  const [regioni, setRegioni] = useState<Regione[]>([])
  const [province, setProvince] = useState<Provincia[]>([])
  const [comuni, setComuni] = useState<Comune[]>([])
  const [agenti, setAgenti] = useState<AgenteLista[]>([])
  const [categorieCliente, setCategorieCliente] = useState<CategoriaCliente[]>([])
  const [listini, setListini] = useState<Listino[]>([])
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  const [selectedRegione, setSelectedRegione] = useState(initialData?.regione_id || '')
  const [selectedProvincia, setSelectedProvincia] = useState(initialData?.provincia_id || '')
  const [selectedComune, setSelectedComune] = useState(initialData?.comune_id || '')

  // Stati per categoria e listino con auto-fill
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<string>(initialData?.categoria_cliente_id?.toString() || '')
  const [selectedListinoId, setSelectedListinoId] = useState<string>(initialData?.listino_id?.toString() || '')
  const [scontoPercentuale, setScontoPercentuale] = useState<string>(initialData?.sconto_percentuale?.toString() || '')

  // Carica province e comuni iniziali se ci sono dati in edit mode
  useEffect(() => {
    const loadInitialGeoData = async () => {
      const regioniData = await getRegioni()
      setRegioni(regioniData)

      // Carica agenti attivi
      const agentiData = await getAgentiAttivi()
      setAgenti(agentiData)

      // Carica categorie cliente attive
      const categorieData = await getCategorieClienteAttive()
      setCategorieCliente(categorieData as CategoriaCliente[])

      // Carica listini vendita attivi
      const listiniData = await getListiniAttivi('vendita')
      setListini(listiniData as Listino[])

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

  // Handler per cambio categoria con auto-fill listino e sconto
  const handleCategoriaChange = (categoriaId: string) => {
    setSelectedCategoriaId(categoriaId)

    if (categoriaId) {
      const categoria = categorieCliente.find(c => c.id === parseInt(categoriaId))
      if (categoria) {
        // Auto-fill listino se la categoria ne ha uno associato
        if (categoria.listino_id) {
          setSelectedListinoId(categoria.listino_id.toString())
        }
        // Auto-fill sconto se la categoria ha uno sconto default
        if (categoria.sconto_default !== undefined && categoria.sconto_default !== null) {
          setScontoPercentuale(categoria.sconto_default.toString())
        }
      }
    }
  }

  return (
    <form action={action} className="space-y-8">
      {/* ========================================= */}
      {/* SEZIONE 1: DATI ANAGRAFICI */}
      {/* ========================================= */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          👤 Dati Anagrafici
        </h2>

        <div className="space-y-6">
          {/* Tipo Persona */}
          <div>
            <label htmlFor="tipo_persona" className="block text-sm font-medium text-gray-700">
              Tipo Soggetto
            </label>
            <select
              name="tipo_persona"
              id="tipo_persona"
              defaultValue={initialData?.tipo_persona || 'giuridica'}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="giuridica">Persona Giuridica (Azienda)</option>
              <option value="fisica">Persona Fisica</option>
            </select>
          </div>

          {/* Ragione Sociale */}
          <div>
            <label htmlFor="ragione_sociale" className="block text-sm font-medium text-gray-700">
              Ragione Sociale / Nome Completo *
            </label>
            <input
              type="text"
              name="ragione_sociale"
              id="ragione_sociale"
              required
              placeholder="Es: Rossi Mario Srl"
              defaultValue={initialData?.ragione_sociale}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          {/* Nome e Cognome (per persone fisiche) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
                Nome
              </label>
              <input
                type="text"
                name="nome"
                id="nome"
                placeholder="Mario"
                defaultValue={initialData?.nome}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Per persone fisiche</p>
            </div>

            <div>
              <label htmlFor="cognome" className="block text-sm font-medium text-gray-700">
                Cognome
              </label>
              <input
                type="text"
                name="cognome"
                id="cognome"
                placeholder="Rossi"
                defaultValue={initialData?.cognome}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Per persone fisiche</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* SEZIONE 2: DATI FISCALI */}
      {/* ========================================= */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-yellow-300">
          🧾 Dati Fiscali
        </h2>

        <div className="space-y-6">
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
                placeholder="RSSMRA80A01H501U"
                defaultValue={initialData?.codice_fiscale}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 uppercase focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">16 caratteri alfanumerici</p>
            </div>
          </div>

          {/* Codice Univoco SDI e PEC */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="codice_univoco" className="block text-sm font-medium text-gray-700">
                Codice Univoco (SDI)
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
              <p className="mt-1 text-xs text-gray-500">7 caratteri per fatturazione elettronica</p>
            </div>

            <div>
              <label htmlFor="pec" className="block text-sm font-medium text-gray-700">
                Email PEC
              </label>
              <input
                type="email"
                name="pec"
                id="pec"
                placeholder="pec@example.it"
                defaultValue={initialData?.pec}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">PEC certificata</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* SEZIONE 3: CONTATTI */}
      {/* ========================================= */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-blue-300">
          📞 Contatti
        </h2>

        <div className="space-y-6">
          {/* Email e Sito Web */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                placeholder="info@cliente.it"
                defaultValue={initialData?.email}
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
                placeholder="https://www.cliente.it"
                defaultValue={initialData?.sito_web}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Telefono, Cellulare, Fax */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                Telefono
              </label>
              <input
                type="tel"
                name="telefono"
                id="telefono"
                placeholder="+39 02 1234567"
                defaultValue={initialData?.telefono}
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
                defaultValue={initialData?.cellulare}
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
                defaultValue={initialData?.fax}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* SEZIONE 4: INDIRIZZO */}
      {/* ========================================= */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-green-300">
          📍 Indirizzo
        </h2>

        <div className="space-y-6">
          {/* Indirizzo e Civico */}
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
                defaultValue={initialData?.indirizzo}
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
                defaultValue={initialData?.civico}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Geografia */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                <option value="">Seleziona</option>
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
                <option value="">Seleziona</option>
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
                <option value="">Seleziona</option>
                {comuni.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>

            {/* CAP */}
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

          {/* Hidden fields per backward compatibility */}
          <input type="hidden" name="citta" id="citta" value={comuni.find(c => c.id === Number(selectedComune))?.nome || ''} />
          <input type="hidden" name="provincia" value={province.find(p => p.id === Number(selectedProvincia))?.sigla || ''} />
        </div>
      </div>

      {/* ========================================= */}
      {/* SEZIONE 5: DATI COMMERCIALI */}
      {/* ========================================= */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-purple-300">
          💼 Dati Commerciali
        </h2>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Categoria Cliente */}
            <div>
              <label htmlFor="categoria_cliente_id" className="block text-sm font-medium text-gray-700">
                Categoria Cliente
              </label>
              <select
                name="categoria_cliente_id"
                id="categoria_cliente_id"
                value={selectedCategoriaId}
                onChange={(e) => handleCategoriaChange(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="">Nessuna categoria</option>
                {categorieCliente.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    [{cat.codice}] {cat.nome}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Selezionando una categoria verranno precompilati listino e sconto
              </p>
            </div>

            {/* Listino Prezzi */}
            <div>
              <label htmlFor="listino_id" className="block text-sm font-medium text-gray-700">
                Listino Prezzi
              </label>
              <select
                name="listino_id"
                id="listino_id"
                value={selectedListinoId}
                onChange={(e) => setSelectedListinoId(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="">Listino base</option>
                {listini.map((listino) => (
                  <option key={listino.id} value={listino.id}>
                    [{listino.codice}] {listino.nome}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">Listino prezzi applicato a questo cliente</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Zona Vendita */}
            <div>
              <label htmlFor="zona_vendita" className="block text-sm font-medium text-gray-700">
                Zona Vendita
              </label>
              <input
                type="text"
                name="zona_vendita"
                id="zona_vendita"
                placeholder="Nord-Ovest"
                defaultValue={initialData?.zona_vendita}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            {/* Sconto Percentuale */}
            <div>
              <label htmlFor="sconto_percentuale" className="block text-sm font-medium text-gray-700">
                Sconto %
              </label>
              <input
                type="number"
                name="sconto_percentuale"
                id="sconto_percentuale"
                min="0"
                max="100"
                step="0.01"
                placeholder="5.00"
                value={scontoPercentuale}
                onChange={(e) => setScontoPercentuale(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Sconto fisso applicabile</p>
            </div>

            {/* Fido Massimo */}
            <div>
              <label htmlFor="fido_massimo" className="block text-sm font-medium text-gray-700">
                Fido Massimo (€)
              </label>
              <input
                type="number"
                name="fido_massimo"
                id="fido_massimo"
                min="0"
                step="0.01"
                placeholder="5000.00"
                defaultValue={initialData?.fido_massimo}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Limite massimo di credito</p>
            </div>
          </div>

          {/* Agente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="agente_id" className="block text-sm font-medium text-gray-700">
                Agente Assegnato
              </label>
              <select
                name="agente_id"
                id="agente_id"
                defaultValue={initialData?.agente_id || ''}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="">Nessun agente</option>
                {agenti.map((agente) => (
                  <option key={agente.id} value={agente.id}>
                    {agente.codice_agente ? `[${agente.codice_agente}] ` : ''}
                    {agente.ragione_sociale}
                    {agente.area_geografica ? ` - ${agente.area_geografica}` : ''}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">Agente di vendita responsabile</p>
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
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-orange-300">
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
              <p className="mt-1 text-xs text-gray-500">Termini di pagamento concordati (giorni)</p>
            </div>
          </div>

          {/* Banca e IBAN */}
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
                SWIFT/BIC
              </label>
              <input
                type="text"
                name="swift_bic"
                id="swift_bic"
                maxLength={11}
                placeholder="BCITITMMXXX"
                defaultValue={initialData?.swift_bic}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 uppercase focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>

          {/* IBAN */}
          <div>
            <label htmlFor="iban" className="block text-sm font-medium text-gray-700">
              IBAN
            </label>
            <input
              type="text"
              name="iban"
              id="iban"
              maxLength={34}
              placeholder="IT60 X054 2811 1010 0000 0123 456"
              defaultValue={initialData?.iban}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 uppercase focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
            <p className="mt-1 text-xs text-gray-500">Formato italiano: IT + 27 caratteri</p>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* SEZIONE 7: REFERENTE */}
      {/* ========================================= */}
      <div className="bg-pink-50 border border-pink-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-pink-300">
          👔 Referente Aziendale
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="referente" className="block text-sm font-medium text-gray-700">
              Nome Referente
            </label>
            <input
              type="text"
              name="referente"
              id="referente"
              placeholder="Mario Bianchi"
              defaultValue={initialData?.referente}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="referente_telefono" className="block text-sm font-medium text-gray-700">
              Telefono Referente
            </label>
            <input
              type="tel"
              name="referente_telefono"
              id="referente_telefono"
              placeholder="+39 333 1234567"
              defaultValue={initialData?.referente_telefono}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="referente_email" className="block text-sm font-medium text-gray-700">
              Email Referente
            </label>
            <input
              type="email"
              name="referente_email"
              id="referente_email"
              placeholder="m.bianchi@cliente.it"
              defaultValue={initialData?.referente_email}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* SEZIONE 8: NOTE */}
      {/* ========================================= */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          📝 Note
        </h2>

        <div>
          <label htmlFor="note" className="block text-sm font-medium text-gray-700">
            Note
          </label>
          <textarea
            name="note"
            id="note"
            rows={4}
            placeholder="Note aggiuntive sul cliente..."
            defaultValue={initialData?.note}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-4 justify-end">
        <Link
          href="/dashboard/clienti"
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
