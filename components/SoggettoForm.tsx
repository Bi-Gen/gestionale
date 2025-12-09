'use client'

import { useState, useEffect } from 'react'
import { Soggetto } from '@/app/actions/soggetti'
import { TipoSoggetto } from '@/app/actions/tipi-soggetto'
import SelectConCreazione from './SelectConCreazione'

type AgenteOption = {
  id: string | number
  codice_agente?: string
  ragione_sociale: string
  nome?: string
  cognome?: string
  provvigione_percentuale?: number
}

type CategoriaClienteOption = {
  id: number
  codice: string
  nome: string
  listino_id?: number
  sconto_default: number
  colore: string
}

type ListinoOption = {
  id: number
  codice: string
  nome: string
  provvigione_default?: number
}

type CategoriaFornitoreOption = {
  id: number
  codice: string
  nome: string
  colore?: string
}

type SoggettoFormProps = {
  soggetto?: Soggetto
  tipiSoggetto: TipoSoggetto[]
  tipoPreselezionato?: TipoSoggetto
  agenti?: AgenteOption[]
  categorieCliente?: CategoriaClienteOption[]
  categorieFornitore?: CategoriaFornitoreOption[]
  listini?: ListinoOption[]
  returnUrl?: string
  action: (formData: FormData) => Promise<void>
  submitLabel: string
}

export default function SoggettoForm({
  soggetto,
  tipiSoggetto,
  tipoPreselezionato,
  agenti = [],
  categorieCliente = [],
  categorieFornitore = [],
  listini = [],
  returnUrl,
  action,
  submitLabel
}: SoggettoFormProps) {
  // Stati locali per permettere quick create
  const [localTipiSoggetto, setLocalTipiSoggetto] = useState<TipoSoggetto[]>(tipiSoggetto)
  const [localCategorieCliente, setLocalCategorieCliente] = useState<CategoriaClienteOption[]>(categorieCliente)
  const [localCategorieFornitore, setLocalCategorieFornitore] = useState<CategoriaFornitoreOption[]>(categorieFornitore)
  const [localListini, setLocalListini] = useState<ListinoOption[]>(listini)

  const [tipoPersona, setTipoPersona] = useState<'fisica' | 'giuridica'>(
    soggetto?.tipo_persona || 'giuridica'
  )

  // Determine initial tipo_soggetto_id with fallback logic
  const getInitialTipoSoggettoId = () => {
    // First try: use tipo_soggetto_id if available
    if (soggetto?.tipo_soggetto_id) {
      return soggetto.tipo_soggetto_id.toString()
    }

    // Second try: use tipoPreselezionato if provided (for new records)
    if (tipoPreselezionato?.id) {
      return tipoPreselezionato.id.toString()
    }

    // Third try: fallback to old tipo array (for existing records without tipo_soggetto_id)
    if (soggetto?.tipo && Array.isArray(soggetto.tipo)) {
      // Map old tipo array values to new tipo_soggetto codes
      let codiceTipo: string | undefined
      if (soggetto.tipo.includes('cliente')) codiceTipo = 'CLI'
      else if (soggetto.tipo.includes('fornitore')) codiceTipo = 'FOR'
      else if (soggetto.tipo.includes('agente')) codiceTipo = 'AGE'

      if (codiceTipo) {
        const tipoFound = tipiSoggetto.find(t => t.codice === codiceTipo)
        if (tipoFound) return tipoFound.id.toString()
      }
    }

    return ''
  }

  const [tipoSoggettoId, setTipoSoggettoId] = useState(() => getInitialTipoSoggettoId())
  const [attivo, setAttivo] = useState(soggetto?.attivo ?? true)
  const [agenteId, setAgenteId] = useState<string>(soggetto?.agente_id?.toString() || '')
  const [categoriaClienteId, setCategoriaClienteId] = useState<string>(
    soggetto?.categoria_cliente_id?.toString() || ''
  )
  const [listinoId, setListinoId] = useState<string>(
    soggetto?.listino_id?.toString() || ''
  )
  const [scontoPercentuale, setScontoPercentuale] = useState<string>(
    soggetto?.sconto_percentuale?.toString() || ''
  )
  const [provvigioneAgente, setProvvigioneAgente] = useState<string>(
    soggetto?.provvigione_agente_perc?.toString() || ''
  )

  // Flag per permettere override manuale dei campi auto-compilati
  const [overrideManuale, setOverrideManuale] = useState<boolean>(false)

  // Debug: log the initial values
  useEffect(() => {
    console.log('SoggettoForm Debug:', {
      tipoPreselezionato,
      soggetto,
      tipoSoggettoId,
      tipiSoggetto: tipiSoggetto.length
    })
  }, [])

  // Get selected tipo_soggetto codice for backward compatibility
  const selectedTipoSoggetto = localTipiSoggetto.find(t => t.id === parseInt(tipoSoggettoId))

  // Check if selected type is Cliente or Fornitore
  const isCliente = selectedTipoSoggetto?.codice === 'CLI'
  const isFornitore = selectedTipoSoggetto?.codice === 'FOR'

  // State for categoria fornitore
  const [categoriaFornitoreId, setCategoriaFornitoreId] = useState<string>(
    soggetto?.categoria_fornitore_id?.toString() || ''
  )

  // Handler per cambio categoria con auto-fill
  const handleCategoriaChange = (catId: string) => {
    setCategoriaClienteId(catId)

    // Se override manuale è attivo, non auto-compilare
    if (overrideManuale) return

    if (catId) {
      const categoria = localCategorieCliente.find(c => c.id === parseInt(catId))
      if (categoria) {
        // Auto-fill listino se la categoria ne ha uno associato
        if (categoria.listino_id) {
          setListinoId(categoria.listino_id.toString())
          // Auto-fill provvigione dal listino
          const listino = localListini.find(l => l.id === categoria.listino_id)
          if (listino?.provvigione_default !== undefined && listino?.provvigione_default !== null) {
            setProvvigioneAgente(listino.provvigione_default.toString())
          }
        } else {
          // Nessun listino associato, reset
          setListinoId('')
          setProvvigioneAgente('')
        }
        // Auto-fill sconto se la categoria ha uno sconto default
        if (categoria.sconto_default !== undefined && categoria.sconto_default !== null) {
          setScontoPercentuale(categoria.sconto_default.toString())
        }
      }
    } else {
      // Nessuna categoria selezionata, reset campi
      setListinoId('')
      setProvvigioneAgente('')
      setScontoPercentuale('')
    }
  }

  // Handler per cambio listino diretto (solo se override attivo)
  const handleListinoChange = (listId: string | number | undefined) => {
    if (!overrideManuale) return // Non permettere modifica se non in override

    setListinoId(listId?.toString() || '')
    if (listId) {
      const id = typeof listId === 'string' ? parseInt(listId) : listId
      const listino = localListini.find(l => l.id === id)
      if (listino?.provvigione_default !== undefined && listino?.provvigione_default !== null) {
        setProvvigioneAgente(listino.provvigione_default.toString())
      }
    }
  }

  return (
    <form action={action} className="space-y-6">
      {/* Hidden fields */}
      <input type="hidden" name="tipo_soggetto_codice" value={selectedTipoSoggetto?.codice || ''} />
      <input type="hidden" name="attivo" value={attivo.toString()} />
      <input type="hidden" name="tipo_persona" value={tipoPersona} />
      {returnUrl && <input type="hidden" name="return_url" value={returnUrl} />}

      {/* Tipo Soggetto */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tipo Soggetto</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tipo con Quick Create */}
          <SelectConCreazione<TipoSoggetto>
            name="tipo_soggetto_id"
            label="Tipo"
            entityName="Tipo Soggetto"
            options={localTipiSoggetto.filter(t => t.attivo)}
            valueField="id"
            displayField="nome"
            value={tipoSoggettoId ? parseInt(tipoSoggettoId) : undefined}
            onChange={(val) => setTipoSoggettoId(val?.toString() || '')}
            placeholder="Seleziona tipo..."
            required
            createUrl="/dashboard/configurazioni/tipi-soggetto/nuovo"
            channelName="tipo-soggetto-created"
            onCreated={(item) => setLocalTipiSoggetto(prev => [...prev, item])}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo Persona
            </label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="giuridica"
                  checked={tipoPersona === 'giuridica'}
                  onChange={(e) => setTipoPersona(e.target.value as 'giuridica')}
                  className="mr-2"
                />
                Giuridica
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="fisica"
                  checked={tipoPersona === 'fisica'}
                  onChange={(e) => setTipoPersona(e.target.value as 'fisica')}
                  className="mr-2"
                />
                Fisica
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Anagrafica */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Anagrafica</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={tipoPersona === 'fisica' ? '' : 'md:col-span-2'}>
            <label htmlFor="ragione_sociale" className="block text-sm font-medium text-gray-700 mb-1">
              {tipoPersona === 'fisica' ? 'Denominazione' : 'Ragione Sociale'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="ragione_sociale"
              name="ragione_sociale"
              defaultValue={soggetto?.ragione_sociale}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {tipoPersona === 'fisica' && (
            <>
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  defaultValue={soggetto?.nome}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="cognome" className="block text-sm font-medium text-gray-700 mb-1">
                  Cognome
                </label>
                <input
                  type="text"
                  id="cognome"
                  name="cognome"
                  defaultValue={soggetto?.cognome}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Dati Fiscali */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Dati Fiscali</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="partita_iva" className="block text-sm font-medium text-gray-700 mb-1">
              Partita IVA
            </label>
            <input
              type="text"
              id="partita_iva"
              name="partita_iva"
              defaultValue={soggetto?.partita_iva}
              maxLength={11}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="codice_fiscale" className="block text-sm font-medium text-gray-700 mb-1">
              Codice Fiscale
            </label>
            <input
              type="text"
              id="codice_fiscale"
              name="codice_fiscale"
              defaultValue={soggetto?.codice_fiscale}
              maxLength={16}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="codice_univoco" className="block text-sm font-medium text-gray-700 mb-1">
              Codice Univoco SDI
            </label>
            <input
              type="text"
              id="codice_univoco"
              name="codice_univoco"
              defaultValue={soggetto?.codice_univoco}
              maxLength={7}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="pec" className="block text-sm font-medium text-gray-700 mb-1">
              PEC
            </label>
            <input
              type="email"
              id="pec"
              name="pec"
              defaultValue={soggetto?.pec}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Indirizzo */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Indirizzo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="indirizzo" className="block text-sm font-medium text-gray-700 mb-1">
              Indirizzo
            </label>
            <input
              type="text"
              id="indirizzo"
              name="indirizzo"
              defaultValue={soggetto?.indirizzo}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="civico" className="block text-sm font-medium text-gray-700 mb-1">
              Civico
            </label>
            <input
              type="text"
              id="civico"
              name="civico"
              defaultValue={soggetto?.civico}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="cap" className="block text-sm font-medium text-gray-700 mb-1">
              CAP
            </label>
            <input
              type="text"
              id="cap"
              name="cap"
              defaultValue={soggetto?.cap}
              maxLength={5}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="citta" className="block text-sm font-medium text-gray-700 mb-1">
              Città
            </label>
            <input
              type="text"
              id="citta"
              name="citta"
              defaultValue={soggetto?.citta}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="provincia" className="block text-sm font-medium text-gray-700 mb-1">
              Provincia
            </label>
            <input
              type="text"
              id="provincia"
              name="provincia"
              defaultValue={soggetto?.provincia}
              maxLength={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="paese" className="block text-sm font-medium text-gray-700 mb-1">
              Paese
            </label>
            <input
              type="text"
              id="paese"
              name="paese"
              defaultValue={soggetto?.paese || 'IT'}
              maxLength={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Contatti */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Contatti</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-1">
              Telefono
            </label>
            <input
              type="tel"
              id="telefono"
              name="telefono"
              defaultValue={soggetto?.telefono}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="cellulare" className="block text-sm font-medium text-gray-700 mb-1">
              Cellulare
            </label>
            <input
              type="tel"
              id="cellulare"
              name="cellulare"
              defaultValue={soggetto?.cellulare}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              defaultValue={soggetto?.email}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="sito_web" className="block text-sm font-medium text-gray-700 mb-1">
              Sito Web
            </label>
            <input
              type="url"
              id="sito_web"
              name="sito_web"
              defaultValue={soggetto?.sito_web}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Dati Commerciali - Solo per Clienti */}
      {isCliente && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Dati Commerciali</h3>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={overrideManuale}
                onChange={(e) => setOverrideManuale(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-gray-600">Modifica manuale</span>
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Categoria Cliente con Quick Create */}
            <SelectConCreazione<CategoriaClienteOption>
              name="categoria_cliente_id"
              label="Categoria Cliente"
              entityName="Categoria Cliente"
              options={localCategorieCliente}
              valueField="id"
              displayField="nome"
              value={categoriaClienteId ? parseInt(categoriaClienteId) : undefined}
              onChange={(val) => handleCategoriaChange(val?.toString() || '')}
              placeholder="Nessuna categoria"
              helpText="Selezionando una categoria verranno precompilati listino, provvigione e sconto"
              createUrl="/dashboard/configurazioni/categorie-cliente/nuovo"
              channelName="categoria-cliente-created"
              onCreated={(item) => setLocalCategorieCliente(prev => [...prev, item])}
            />

            {/* Listino - Read-only se non in override */}
            <div>
              <label htmlFor="listino_display" className="block text-sm font-medium text-gray-700 mb-1">
                Listino Prezzi
                {!overrideManuale && listinoId && (
                  <span className="ml-2 text-xs text-blue-600">(auto)</span>
                )}
              </label>
              {overrideManuale ? (
                <SelectConCreazione<ListinoOption>
                  name="listino_id"
                  label=""
                  entityName="Listino"
                  options={localListini}
                  valueField="id"
                  displayField="nome"
                  value={listinoId ? parseInt(listinoId) : undefined}
                  onChange={(val) => handleListinoChange(val)}
                  placeholder="Seleziona listino"
                  createUrl="/dashboard/configurazioni/listini/nuovo"
                  channelName="listino-created"
                  onCreated={(item) => setLocalListini(prev => [...prev, item])}
                />
              ) : (
                <>
                  <input type="hidden" name="listino_id" value={listinoId} />
                  <input
                    type="text"
                    id="listino_display"
                    value={listinoId ? localListini.find(l => l.id === parseInt(listinoId))?.nome || '' : ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-700"
                    placeholder="Determinato dalla categoria"
                  />
                </>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Listino prezzi per questo cliente
              </p>
            </div>

            {/* Provvigione - Read-only se non in override */}
            <div>
              <label htmlFor="provvigione_agente_perc" className="block text-sm font-medium text-gray-700">
                Provvigione %
                {!overrideManuale && provvigioneAgente && (
                  <span className="ml-2 text-xs text-blue-600">(auto)</span>
                )}
              </label>
              <input
                type="number"
                name="provvigione_agente_perc"
                id="provvigione_agente_perc"
                value={provvigioneAgente}
                onChange={(e) => overrideManuale && setProvvigioneAgente(e.target.value)}
                disabled={!overrideManuale}
                min="0"
                max="100"
                step="0.01"
                className={`mt-1 block w-full rounded-md border px-3 py-2 ${
                  overrideManuale
                    ? 'border-gray-300 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500'
                    : 'border-gray-200 bg-gray-50 text-gray-700'
                }`}
                placeholder="Determinata dal listino"
              />
              <p className="mt-1 text-xs text-gray-500">
                Provvigione default per questo cliente
              </p>
            </div>

            {/* Sconto - Read-only se non in override */}
            <div>
              <label htmlFor="sconto_percentuale" className="block text-sm font-medium text-gray-700 mb-1">
                Sconto Cliente %
                {!overrideManuale && scontoPercentuale && (
                  <span className="ml-2 text-xs text-blue-600">(auto)</span>
                )}
              </label>
              <input
                type="number"
                id="sconto_percentuale"
                name="sconto_percentuale"
                value={scontoPercentuale}
                onChange={(e) => overrideManuale && setScontoPercentuale(e.target.value)}
                disabled={!overrideManuale}
                min="0"
                max="100"
                step="0.01"
                className={`w-full px-3 py-2 border rounded-md ${
                  overrideManuale
                    ? 'border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    : 'border-gray-200 bg-gray-50 text-gray-700'
                }`}
                placeholder="Determinato dalla categoria"
              />
              <p className="mt-1 text-xs text-gray-500">
                Sconto percentuale applicato
              </p>
            </div>

            {/* Agente */}
            {agenti.length > 0 && (
              <div>
                <label htmlFor="agente_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Agente Assegnato
                </label>
                <select
                  id="agente_id"
                  name="agente_id"
                  value={agenteId}
                  onChange={(e) => setAgenteId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Nessun agente</option>
                  {agenti.map((agente) => (
                    <option key={agente.id} value={agente.id}>
                      {agente.codice_agente ? `[${agente.codice_agente}] ` : ''}
                      {agente.ragione_sociale}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Agente di vendita responsabile
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dati Commerciali - Solo per Fornitori */}
      {isFornitore && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Dati Commerciali Fornitore</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Categoria Fornitore con Quick Create */}
            <SelectConCreazione<CategoriaFornitoreOption>
              name="categoria_fornitore_id"
              label="Categoria Fornitore"
              entityName="Categoria Fornitore"
              options={localCategorieFornitore}
              valueField="id"
              displayField="nome"
              value={categoriaFornitoreId ? parseInt(categoriaFornitoreId) : undefined}
              onChange={(val) => setCategoriaFornitoreId(val?.toString() || '')}
              placeholder="Nessuna categoria"
              helpText={localCategorieFornitore.length === 0 ? 'Clicca + per creare una categoria' : undefined}
              createUrl="/dashboard/configurazioni/categorie-fornitore/nuovo"
              channelName="categoria-fornitore-created"
              onCreated={(item) => setLocalCategorieFornitore(prev => [...prev, item])}
            />

            {/* Giorni Consegna */}
            <div>
              <label htmlFor="giorni_consegna" className="block text-sm font-medium text-gray-700 mb-1">
                Giorni Consegna
              </label>
              <input
                type="number"
                id="giorni_consegna"
                name="giorni_consegna"
                defaultValue={soggetto?.giorni_consegna}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Tempo medio di consegna in giorni
              </p>
            </div>

            {/* Sconto Fornitore */}
            <div>
              <label htmlFor="sconto_fornitore" className="block text-sm font-medium text-gray-700 mb-1">
                Sconto Abituale %
              </label>
              <input
                type="number"
                id="sconto_fornitore"
                name="sconto_fornitore"
                defaultValue={soggetto?.sconto_fornitore}
                min="0"
                max="100"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Sconto abituale ottenuto da questo fornitore
              </p>
            </div>

            {/* Giorni Pagamento */}
            <div>
              <label htmlFor="giorni_pagamento" className="block text-sm font-medium text-gray-700 mb-1">
                Giorni Pagamento
              </label>
              <input
                type="number"
                id="giorni_pagamento"
                name="giorni_pagamento"
                defaultValue={soggetto?.giorni_pagamento || 30}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                Termini di pagamento concordati
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Note */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Note</h3>
        <div>
          <textarea
            id="note"
            name="note"
            rows={4}
            defaultValue={soggetto?.note}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Status */}
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Stato</h3>
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={attivo}
              onChange={(e) => setAttivo(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Attivo</span>
          </label>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-4">
        <a
          href={returnUrl || "/dashboard/soggetti"}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
        >
          Annulla
        </a>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
