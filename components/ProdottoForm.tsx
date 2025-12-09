'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Fornitore } from '@/app/actions/fornitori'
import type { Macrofamiglia } from '@/app/actions/macrofamiglie'
import type { Famiglia } from '@/app/actions/famiglie'
import type { LineaProdotto } from '@/app/actions/linee'
import type { PrezzoListinoProdotto } from '@/app/actions/listini'
import SelectConCreazione from './SelectConCreazione'
import PrezziListinoProdotto from './PrezziListinoProdotto'

type ListinoOption = {
  id: number
  codice: string
  nome: string
  tipo: 'vendita' | 'acquisto'
}

interface ProdottoFormProps {
  action: any
  fornitori: Fornitore[]
  macrofamiglie?: Macrofamiglia[]
  famiglie?: Famiglia[]
  linee?: LineaProdotto[]
  initialData?: any
  submitLabel?: string
  prezziListino?: PrezzoListinoProdotto[]
  listiniDisponibili?: ListinoOption[]
  isNuovoProdotto?: boolean
}

export default function ProdottoForm({
  action,
  fornitori,
  macrofamiglie = [],
  famiglie = [],
  linee = [],
  initialData,
  submitLabel = 'Salva Prodotto',
  prezziListino = [],
  listiniDisponibili = [],
  isNuovoProdotto = false,
}: ProdottoFormProps) {
  // Stati per validazione client-side
  const [eanError, setEanError] = useState('')
  const [selectedMacrofamiglia, setSelectedMacrofamiglia] = useState<number | undefined>(initialData?.macrofamiglia_id)

  // Stati locali per le liste (aggiornati dopo quick create)
  const [localMacrofamiglie, setLocalMacrofamiglie] = useState(macrofamiglie)
  const [localFamiglie, setLocalFamiglie] = useState(famiglie)
  const [localLinee, setLocalLinee] = useState(linee)

  // Filtra famiglie in base alla macrofamiglia selezionata
  const famiglieFiltrate = selectedMacrofamiglia
    ? localFamiglie.filter(f => f.macrofamiglia_id === selectedMacrofamiglia)
    : localFamiglie

  // Validazione Codice EAN
  const validateEAN = (value: string) => {
    if (!value) {
      setEanError('')
      return
    }
    const eanRegex = /^\d{8}$|^\d{13}$/
    if (!eanRegex.test(value)) {
      setEanError('Codice EAN non valido (8 o 13 cifre)')
    } else {
      setEanError('')
    }
  }

  return (
    <form action={action} className="space-y-8">
      {/* ========================================= */}
      {/* SEZIONE 1: IDENTIFICAZIONE PRODOTTO */}
      {/* ========================================= */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          📦 Identificazione Prodotto
        </h2>

        <div className="space-y-6">
          {/* Codice e SKU */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="codice" className="block text-sm font-medium text-gray-700">
                Codice Prodotto *
              </label>
              <input
                type="text"
                name="codice"
                id="codice"
                required
                placeholder="PROD001"
                defaultValue={initialData?.codice}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="sku" className="block text-sm font-medium text-gray-700">
                SKU
              </label>
              <input
                type="text"
                name="sku"
                id="sku"
                placeholder="SKU-001"
                defaultValue={initialData?.sku}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Nome */}
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700">
              Nome Prodotto *
            </label>
            <input
              type="text"
              name="nome"
              id="nome"
              required
              placeholder="Nome del prodotto"
              defaultValue={initialData?.nome}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          {/* Descrizione Breve */}
          <div>
            <label htmlFor="descrizione_breve" className="block text-sm font-medium text-gray-700">
              Descrizione Breve
            </label>
            <input
              type="text"
              name="descrizione_breve"
              id="descrizione_breve"
              maxLength={500}
              placeholder="Descrizione breve per cataloghi (max 500 caratteri)"
              defaultValue={initialData?.descrizione_breve}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          {/* Descrizione Completa */}
          <div>
            <label htmlFor="descrizione" className="block text-sm font-medium text-gray-700">
              Descrizione Completa
            </label>
            <textarea
              name="descrizione"
              id="descrizione"
              rows={4}
              placeholder="Descrizione dettagliata del prodotto"
              defaultValue={initialData?.descrizione}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          {/* Classificazione Estesa con Quick Create */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Macrofamiglia */}
            <SelectConCreazione<Macrofamiglia>
              name="macrofamiglia_id"
              label="Macrofamiglia"
              entityName="Macrofamiglia"
              options={localMacrofamiglie}
              valueField="id"
              displayField="nome"
              defaultValue={initialData?.macrofamiglia_id}
              onChange={(val) => setSelectedMacrofamiglia(val as number | undefined)}
              placeholder="Seleziona macrofamiglia"
              createUrl="/dashboard/configurazioni/macrofamiglie/nuovo"
              channelName="macrofamiglia-created"
              onCreated={(item) => setLocalMacrofamiglie(prev => [...prev, item])}
            />

            {/* Famiglia */}
            <SelectConCreazione<Famiglia>
              name="famiglia_id"
              label="Famiglia"
              entityName="Famiglia"
              options={famiglieFiltrate}
              valueField="id"
              displayField="nome"
              defaultValue={initialData?.famiglia_id}
              placeholder="Seleziona famiglia"
              helpText={selectedMacrofamiglia && famiglieFiltrate.length === 0 ? 'Nessuna famiglia per questa macrofamiglia' : undefined}
              createUrl="/dashboard/configurazioni/famiglie/nuovo"
              channelName="famiglia-created"
              onCreated={(item) => setLocalFamiglie(prev => [...prev, item])}
            />

            {/* Linea */}
            <SelectConCreazione<LineaProdotto>
              name="linea_id"
              label="Linea"
              entityName="Linea"
              options={localLinee}
              valueField="id"
              displayField="nome"
              defaultValue={initialData?.linea_id}
              placeholder="Seleziona linea"
              createUrl="/dashboard/configurazioni/linee/nuovo"
              channelName="linea-created"
              onCreated={(item) => setLocalLinee(prev => [...prev, item])}
            />

            {/* Misura (campo semplice, nessun quick create) */}
            <div>
              <label htmlFor="misura" className="block text-sm font-medium text-gray-700">
                Misura
              </label>
              <input
                type="text"
                name="misura"
                id="misura"
                placeholder="100x100, XL, 500ml"
                defaultValue={initialData?.misura}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Codici Alternativi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="codice_ean" className="block text-sm font-medium text-gray-700">
                Codice EAN (Barcode)
              </label>
              <input
                type="text"
                name="codice_ean"
                id="codice_ean"
                placeholder="8001234567890 (8 o 13 cifre)"
                defaultValue={initialData?.codice_ean}
                onBlur={(e) => validateEAN(e.target.value)}
                className={`mt-1 block w-full rounded-md border ${eanError ? 'border-red-500' : 'border-gray-300'} px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500`}
              />
              {eanError && <p className="mt-1 text-sm text-red-600">{eanError}</p>}
            </div>

            <div>
              <label htmlFor="ean_proprietario" className="block text-sm font-medium text-gray-700">
                Proprietario EAN
              </label>
              <input
                type="text"
                name="ean_proprietario"
                id="ean_proprietario"
                placeholder="Azienda proprietaria del codice EAN"
                defaultValue={initialData?.ean_proprietario}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="codice_fornitore" className="block text-sm font-medium text-gray-700">
                Codice Fornitore
              </label>
              <input
                type="text"
                name="codice_fornitore"
                id="codice_fornitore"
                placeholder="Codice usato dal fornitore"
                defaultValue={initialData?.codice_fornitore}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="codice_doganale" className="block text-sm font-medium text-gray-700">
                Codice Doganale (HS Code)
              </label>
              <input
                type="text"
                name="codice_doganale"
                id="codice_doganale"
                placeholder="Es: 6302.10.00"
                defaultValue={initialData?.codice_doganale}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="riferimento" className="block text-sm font-medium text-gray-700">
                Riferimento Interno
              </label>
              <input
                type="text"
                name="riferimento"
                id="riferimento"
                placeholder="REF-001"
                defaultValue={initialData?.riferimento}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* SEZIONE 2: COSTI E PREZZI DI RIFERIMENTO */}
      {/* ========================================= */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2 pb-2 border-b border-gray-200">
          💰 Costi e Prezzi di Riferimento
        </h2>

        {/* Info box esplicativo */}
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Come funziona la determinazione del prezzo:</strong>
          </p>
          <ol className="text-sm text-blue-700 mt-1 ml-4 list-decimal">
            <li>Prima si cerca nel <strong>listino assegnato al cliente</strong></li>
            <li>Se non trovato, si cerca nel <strong>listino predefinito</strong></li>
            <li>Come fallback, si usa il <strong>prezzo base</strong> definito qui sotto</li>
          </ol>
          <p className="text-xs text-blue-600 mt-2">
            I prezzi effettivi di vendita/acquisto si gestiscono nella sezione &quot;Prezzi Listino&quot; più in basso.
          </p>
        </div>

        <div className="space-y-6">
          {/* Sottosezione: Costi Interni (Read-Only) */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              Costi Interni (automatici - sola lettura)
            </h3>
            <p className="text-xs text-gray-500 mb-3 pl-4">
              Questi valori vengono aggiornati automaticamente dai movimenti di magazzino
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pl-4 border-l-2 border-orange-200">
              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Costo Ultimo Acquisto (€)
                </label>
                <div className="mt-1 block w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-gray-700">
                  {initialData?.costo_ultimo != null ? `€ ${Number(initialData.costo_ultimo).toFixed(2)}` : '—'}
                </div>
                <p className="mt-1 text-xs text-gray-400">Dall&apos;ultimo carico magazzino</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Costo Medio Ponderato (€)
                </label>
                <div className="mt-1 block w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-gray-700">
                  {initialData?.costo_medio != null ? `€ ${Number(initialData.costo_medio).toFixed(2)}` : '—'}
                </div>
                <p className="mt-1 text-xs text-gray-400">Media ponderata dei carichi</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500">
                  Margine Calcolato (%)
                </label>
                <div className="mt-1 block w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2 text-gray-700">
                  {initialData?.margine_percentuale != null ? `${Number(initialData.margine_percentuale).toFixed(2)}%` : '—'}
                </div>
                <p className="mt-1 text-xs text-gray-400">Su prezzo vendita base</p>
              </div>
            </div>
          </div>

          {/* Sottosezione: Costo Override (Opzionale) */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              Costo Manuale (opzionale)
            </h3>
            <p className="text-xs text-gray-500 mb-3 pl-4">
              Usa questo campo solo se vuoi impostare manualmente un costo di riferimento (es. prodotto nuovo senza movimenti)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4 border-l-2 border-yellow-200">
              <div>
                <label htmlFor="costo_override" className="block text-sm font-medium text-gray-700">
                  Costo Override (€)
                </label>
                <input
                  type="number"
                  name="costo_override"
                  id="costo_override"
                  step="0.01"
                  min="0"
                  placeholder="Lascia vuoto per usare costo automatico"
                  defaultValue={initialData?.costo_override}
                  className="mt-1 block w-full rounded-md border border-yellow-300 px-3 py-2 text-gray-900 focus:border-yellow-500 focus:outline-none focus:ring-yellow-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Se compilato, questo valore ha priorità sui costi automatici per il calcolo margini
                </p>
              </div>
            </div>
          </div>

          {/* Sottosezione: Prezzi Base (Fallback) */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Prezzi Base (Fallback)
            </h3>
            <p className="text-xs text-gray-500 mb-3 pl-4">
              Usati solo se il prodotto non è presente in nessun listino
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pl-4 border-l-2 border-green-200">
              <div>
                <label htmlFor="prezzo_acquisto" className="block text-sm font-medium text-gray-700">
                  Prezzo Acquisto Standard (€)
                </label>
                <input
                  type="number"
                  name="prezzo_acquisto"
                  id="prezzo_acquisto"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  defaultValue={initialData?.prezzo_acquisto}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">Prezzo di riferimento per ordini a fornitore</p>
              </div>

              <div>
                <label htmlFor="prezzo_vendita" className="block text-sm font-medium text-gray-700">
                  Prezzo Vendita Base (€) *
                </label>
                <input
                  type="number"
                  name="prezzo_vendita"
                  id="prezzo_vendita"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  defaultValue={initialData?.prezzo_vendita}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">Prezzo di fallback se non definito nei listini</p>
              </div>
            </div>
          </div>

          {/* Sottosezione: Parametri Fiscali e Limiti */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              Parametri Fiscali e Limiti
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pl-4 border-l-2 border-purple-200">
              <div>
                <label htmlFor="valuta" className="block text-sm font-medium text-gray-700">
                  Valuta
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
              </div>

              <div>
                <label htmlFor="sconto_massimo" className="block text-sm font-medium text-gray-700">
                  Sconto Massimo %
                </label>
                <input
                  type="number"
                  name="sconto_massimo"
                  id="sconto_massimo"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="0.00"
                  defaultValue={initialData?.sconto_massimo}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="aliquota_iva" className="block text-sm font-medium text-gray-700">
                  Aliquota IVA %
                </label>
                <input
                  type="number"
                  name="aliquota_iva"
                  id="aliquota_iva"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="22.00"
                  defaultValue={initialData?.aliquota_iva || '22'}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ========================================= */}
      {/* SEZIONE PREZZI LISTINO (solo in modifica) */}
      {/* ========================================= */}
      {initialData?.id && (
        <>
          {isNuovoProdotto && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <div className="flex-shrink-0 text-2xl">🎉</div>
              <div>
                <h3 className="font-semibold text-green-800">Prodotto creato con successo!</h3>
                <p className="text-sm text-green-700 mt-1">
                  Ora puoi completare la configurazione aggiungendo i prezzi per i vari listini.
                  Clicca su &quot;+ Aggiungi Prezzo&quot; nella sezione qui sotto per associare il prodotto ai listini di vendita o acquisto.
                </p>
              </div>
            </div>
          )}
          <PrezziListinoProdotto
            prodottoId={initialData.id}
            prezzi={prezziListino}
            listiniDisponibili={listiniDisponibili}
          />
        </>
      )}

      {/* ========================================= */}
      {/* SEZIONE 3: FORNITORE */}
      {/* ========================================= */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          🚚 Fornitore
        </h2>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label htmlFor="fornitore_principale_id" className="block text-sm font-medium text-gray-700">
                Fornitore Principale
              </label>
              <select
                name="fornitore_principale_id"
                id="fornitore_principale_id"
                defaultValue={initialData?.fornitore_principale_id}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="">Nessun fornitore</option>
                {fornitori.map((fornitore) => (
                  <option key={fornitore.id} value={fornitore.id}>
                    {fornitore.ragione_sociale}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="tempo_riordino_giorni" className="block text-sm font-medium text-gray-700">
                Lead Time (giorni)
              </label>
              <input
                type="number"
                name="tempo_riordino_giorni"
                id="tempo_riordino_giorni"
                min="0"
                placeholder="7"
                defaultValue={initialData?.tempo_riordino_giorni || '7'}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Tempo di riordino</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="quantita_minima_ordine" className="block text-sm font-medium text-gray-700">
                Quantità Minima Ordine (MOQ)
              </label>
              <input
                type="number"
                name="quantita_minima_ordine"
                id="quantita_minima_ordine"
                min="1"
                placeholder="1"
                defaultValue={initialData?.quantita_minima_ordine || '1'}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="transit_time_giorni" className="block text-sm font-medium text-gray-700">
                Transit Time (giorni)
              </label>
              <input
                type="number"
                name="transit_time_giorni"
                id="transit_time_giorni"
                min="0"
                placeholder="60"
                defaultValue={initialData?.transit_time_giorni}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Tempo di trasporto (es. nave)</p>
            </div>

            <div className="flex items-end">
              <div className="bg-blue-50 border border-blue-200 rounded-md px-3 py-2 w-full">
                <p className="text-xs text-blue-700 font-medium">Tempo Totale</p>
                <p className="text-sm text-blue-900">
                  {(parseInt(String(initialData?.tempo_riordino_giorni || 7)) + parseInt(String(initialData?.transit_time_giorni || 0)))} giorni
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* SEZIONE 4: MAGAZZINO */}
      {/* ========================================= */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          📊 Magazzino e Giacenze
        </h2>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="unita_misura" className="block text-sm font-medium text-gray-700">
                Unità di Misura
              </label>
              <select
                name="unita_misura"
                id="unita_misura"
                defaultValue={initialData?.unita_misura || 'PZ'}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              >
                <option value="PZ">Pezzi (PZ)</option>
                <option value="KG">Kilogrammi (KG)</option>
                <option value="LT">Litri (LT)</option>
                <option value="MT">Metri (MT)</option>
                <option value="MQ">Metri quadri (MQ)</option>
                <option value="CF">Confezioni (CF)</option>
              </select>
            </div>

            <div>
              <label htmlFor="quantita_magazzino" className="block text-sm font-medium text-gray-700">
                Quantità Attuale
              </label>
              <input
                type="number"
                name="quantita_magazzino"
                id="quantita_magazzino"
                step="0.001"
                min="0"
                placeholder="0"
                defaultValue={initialData?.quantita_magazzino || '0'}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="ubicazione" className="block text-sm font-medium text-gray-700">
                Ubicazione Magazzino
              </label>
              <input
                type="text"
                name="ubicazione"
                id="ubicazione"
                placeholder="A-12-3"
                defaultValue={initialData?.ubicazione}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="giacenza_minima" className="block text-sm font-medium text-gray-700">
                Giacenza Minima
              </label>
              <input
                type="number"
                name="giacenza_minima"
                id="giacenza_minima"
                step="0.001"
                min="0"
                placeholder="0"
                defaultValue={initialData?.giacenza_minima}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Scorta minima di sicurezza</p>
            </div>

            <div>
              <label htmlFor="punto_riordino" className="block text-sm font-medium text-gray-700">
                Punto di Riordino
              </label>
              <input
                type="number"
                name="punto_riordino"
                id="punto_riordino"
                step="0.001"
                min="0"
                placeholder="0"
                defaultValue={initialData?.punto_riordino}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Soglia per riordinare</p>
            </div>

            <div>
              <label htmlFor="giacenza_massima" className="block text-sm font-medium text-gray-700">
                Giacenza Massima
              </label>
              <input
                type="number"
                name="giacenza_massima"
                id="giacenza_massima"
                step="0.001"
                min="0"
                placeholder="0"
                defaultValue={initialData?.giacenza_massima}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Scorta massima consigliata</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* SEZIONE 5: MISURE E DIMENSIONI */}
      {/* ========================================= */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          📏 Misure e Dimensioni
        </h2>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label htmlFor="peso_kg" className="block text-sm font-medium text-gray-700">
                Peso (kg)
              </label>
              <input
                type="number"
                name="peso_kg"
                id="peso_kg"
                step="0.001"
                min="0"
                placeholder="0.000"
                defaultValue={initialData?.peso_kg}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="volume_m3" className="block text-sm font-medium text-gray-700">
                Volume (m³)
              </label>
              <input
                type="number"
                name="volume_m3"
                id="volume_m3"
                step="0.0001"
                min="0"
                placeholder="0.0000"
                defaultValue={initialData?.volume_m3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="colli" className="block text-sm font-medium text-gray-700">
                N° Colli
              </label>
              <input
                type="number"
                name="colli"
                id="colli"
                min="1"
                placeholder="1"
                defaultValue={initialData?.colli || '1'}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="lunghezza_cm" className="block text-sm font-medium text-gray-700">
                Lunghezza (cm)
              </label>
              <input
                type="number"
                name="lunghezza_cm"
                id="lunghezza_cm"
                step="0.01"
                min="0"
                placeholder="0.00"
                defaultValue={initialData?.lunghezza_cm}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="larghezza_cm" className="block text-sm font-medium text-gray-700">
                Larghezza (cm)
              </label>
              <input
                type="number"
                name="larghezza_cm"
                id="larghezza_cm"
                step="0.01"
                min="0"
                placeholder="0.00"
                defaultValue={initialData?.larghezza_cm}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="altezza_cm" className="block text-sm font-medium text-gray-700">
                Altezza (cm)
              </label>
              <input
                type="number"
                name="altezza_cm"
                id="altezza_cm"
                step="0.01"
                min="0"
                placeholder="0.00"
                defaultValue={initialData?.altezza_cm}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* SEZIONE 6: PACKAGING / CONFEZIONAMENTO */}
      {/* ========================================= */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          📦 Packaging / Confezionamento
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Definisci la struttura di confezionamento: PEZZO → CONFEZIONE → CARTONE → PALLET
        </p>

        <div className="space-y-6">
          {/* Livello 1: Confezione */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Livello 1: Confezione (Busta/Scatola)</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="pkg_nome_confezione" className="block text-xs font-medium text-gray-600">
                  Nome Confezione
                </label>
                <input
                  type="text"
                  name="pkg_nome_confezione"
                  id="pkg_nome_confezione"
                  placeholder="Busta, Scatola, Blister..."
                  defaultValue={initialData?.packaging?.nome_confezione || 'Confezione'}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="pkg_pezzi_per_confezione" className="block text-xs font-medium text-gray-600">
                  Pezzi per Confezione
                </label>
                <input
                  type="number"
                  name="pkg_pezzi_per_confezione"
                  id="pkg_pezzi_per_confezione"
                  min="1"
                  placeholder="25"
                  defaultValue={initialData?.packaging?.pezzi_per_confezione || '1'}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="pkg_confezione_peso_kg" className="block text-xs font-medium text-gray-600">
                  Peso Confezione (kg)
                </label>
                <input
                  type="number"
                  name="pkg_confezione_peso_kg"
                  id="pkg_confezione_peso_kg"
                  step="0.001"
                  min="0"
                  placeholder="0.5"
                  defaultValue={initialData?.packaging?.confezione_peso_kg}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Livello 2: Cartone */}
          <div className="bg-amber-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-amber-800 mb-3">Livello 2: Cartone</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label htmlFor="pkg_confezioni_per_cartone" className="block text-xs font-medium text-gray-600">
                  Confezioni per Cartone
                </label>
                <input
                  type="number"
                  name="pkg_confezioni_per_cartone"
                  id="pkg_confezioni_per_cartone"
                  min="1"
                  placeholder="4"
                  defaultValue={initialData?.packaging?.confezioni_per_cartone || '1'}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="pkg_cartone_lunghezza_cm" className="block text-xs font-medium text-gray-600">
                  Lungh. (cm)
                </label>
                <input
                  type="number"
                  name="pkg_cartone_lunghezza_cm"
                  id="pkg_cartone_lunghezza_cm"
                  step="0.1"
                  min="0"
                  placeholder="51"
                  defaultValue={initialData?.packaging?.cartone_lunghezza_cm}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="pkg_cartone_larghezza_cm" className="block text-xs font-medium text-gray-600">
                  Largh. (cm)
                </label>
                <input
                  type="number"
                  name="pkg_cartone_larghezza_cm"
                  id="pkg_cartone_larghezza_cm"
                  step="0.1"
                  min="0"
                  placeholder="27"
                  defaultValue={initialData?.packaging?.cartone_larghezza_cm}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="pkg_cartone_altezza_cm" className="block text-xs font-medium text-gray-600">
                  Alt. (cm)
                </label>
                <input
                  type="number"
                  name="pkg_cartone_altezza_cm"
                  id="pkg_cartone_altezza_cm"
                  step="0.1"
                  min="0"
                  placeholder="25"
                  defaultValue={initialData?.packaging?.cartone_altezza_cm}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="pkg_cartone_peso_kg" className="block text-xs font-medium text-gray-600">
                  Peso (kg)
                </label>
                <input
                  type="number"
                  name="pkg_cartone_peso_kg"
                  id="pkg_cartone_peso_kg"
                  step="0.1"
                  min="0"
                  placeholder="5.5"
                  defaultValue={initialData?.packaging?.cartone_peso_kg}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Livello 3: Pallet */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-3">Livello 3: Pallet</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="pkg_cartoni_per_pallet" className="block text-xs font-medium text-gray-600">
                  Cartoni per Pallet
                </label>
                <input
                  type="number"
                  name="pkg_cartoni_per_pallet"
                  id="pkg_cartoni_per_pallet"
                  min="1"
                  placeholder="54"
                  defaultValue={initialData?.packaging?.cartoni_per_pallet}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="pkg_cartoni_per_strato" className="block text-xs font-medium text-gray-600">
                  Cartoni per Strato
                </label>
                <input
                  type="number"
                  name="pkg_cartoni_per_strato"
                  id="pkg_cartoni_per_strato"
                  min="1"
                  placeholder="6"
                  defaultValue={initialData?.packaging?.cartoni_per_strato}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="pkg_strati_per_pallet" className="block text-xs font-medium text-gray-600">
                  Strati per Pallet
                </label>
                <input
                  type="number"
                  name="pkg_strati_per_pallet"
                  id="pkg_strati_per_pallet"
                  min="1"
                  placeholder="9"
                  defaultValue={initialData?.packaging?.strati_per_pallet}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Livello 4: Container */}
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-800 mb-3">Livello 4: Container</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pkg_pallet_per_container_20ft" className="block text-xs font-medium text-gray-600">
                  Pallet per Container 20ft
                </label>
                <input
                  type="number"
                  name="pkg_pallet_per_container_20ft"
                  id="pkg_pallet_per_container_20ft"
                  min="1"
                  placeholder="10"
                  defaultValue={initialData?.packaging?.pallet_per_container_20ft}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="pkg_pallet_per_container_40ft" className="block text-xs font-medium text-gray-600">
                  Pallet per Container 40ft
                </label>
                <input
                  type="number"
                  name="pkg_pallet_per_container_40ft"
                  id="pkg_pallet_per_container_40ft"
                  min="1"
                  placeholder="20"
                  defaultValue={initialData?.packaging?.pallet_per_container_40ft}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Riepilogo Calcolato */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-purple-800 mb-2">Riepilogo Calcolato</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-purple-600">Pezzi/Cartone:</span>
                <span className="ml-2 font-medium text-purple-900">
                  {(parseInt(String(initialData?.packaging?.pezzi_per_confezione || 1)) *
                    parseInt(String(initialData?.packaging?.confezioni_per_cartone || 1)))}
                </span>
              </div>
              <div>
                <span className="text-purple-600">Pezzi/Pallet:</span>
                <span className="ml-2 font-medium text-purple-900">
                  {initialData?.packaging?.cartoni_per_pallet ?
                    (parseInt(String(initialData?.packaging?.pezzi_per_confezione || 1)) *
                     parseInt(String(initialData?.packaging?.confezioni_per_cartone || 1)) *
                     parseInt(String(initialData?.packaging?.cartoni_per_pallet))) : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* SEZIONE 7: GESTIONE AVANZATA */}
      {/* ========================================= */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          ⚙️ Gestione Avanzata
        </h2>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="gestione_lotti"
              id="gestione_lotti"
              defaultChecked={initialData?.gestione_lotti}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="gestione_lotti" className="ml-2 block text-sm text-gray-900">
              Gestione Lotti
            </label>
            <span className="ml-2 text-xs text-gray-500">(Tracciabilità lotti di produzione)</span>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="gestione_seriali"
              id="gestione_seriali"
              defaultChecked={initialData?.gestione_seriali}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="gestione_seriali" className="ml-2 block text-sm text-gray-900">
              Gestione Numeri Seriali
            </label>
            <span className="ml-2 text-xs text-gray-500">(Per elettronica, garanzie)</span>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="gestione_scadenze"
              id="gestione_scadenze"
              defaultChecked={initialData?.gestione_scadenze}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="gestione_scadenze" className="ml-2 block text-sm text-gray-900">
              Gestione Scadenze
            </label>
            <span className="ml-2 text-xs text-gray-500">(Prodotti deperibili)</span>
          </div>

          <div className="ml-6">
            <label htmlFor="giorni_scadenza" className="block text-sm font-medium text-gray-700">
              Giorni Validità dalla Produzione
            </label>
            <input
              type="number"
              name="giorni_scadenza"
              id="giorni_scadenza"
              min="1"
              placeholder="30"
              defaultValue={initialData?.giorni_scadenza}
              className="mt-1 w-40 rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* SEZIONE 7: VENDITA E VISIBILITÀ */}
      {/* ========================================= */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          🛒 Vendita e Visibilità
        </h2>

        <div className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              name="vendibile"
              id="vendibile"
              defaultChecked={initialData?.vendibile !== false}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="vendibile" className="ml-2 block text-sm text-gray-900">
              Vendibile
            </label>
            <span className="ml-2 text-xs text-gray-500">(Prodotto può essere venduto)</span>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="acquistabile"
              id="acquistabile"
              defaultChecked={initialData?.acquistabile !== false}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="acquistabile" className="ml-2 block text-sm text-gray-900">
              Acquistabile
            </label>
            <span className="ml-2 text-xs text-gray-500">(Prodotto può essere acquistato)</span>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="visibile_catalogo"
              id="visibile_catalogo"
              defaultChecked={initialData?.visibile_catalogo !== false}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="visibile_catalogo" className="ml-2 block text-sm text-gray-900">
              Visibile in Catalogo
            </label>
            <span className="ml-2 text-xs text-gray-500">(Mostra nei cataloghi)</span>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="visibile_ecommerce"
              id="visibile_ecommerce"
              defaultChecked={initialData?.visibile_ecommerce}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="visibile_ecommerce" className="ml-2 block text-sm text-gray-900">
              Visibile in E-commerce
            </label>
            <span className="ml-2 text-xs text-gray-500">(Pubblica su e-commerce)</span>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* SEZIONE 8: NOTE E IMMAGINI */}
      {/* ========================================= */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">
          📝 Note e Immagini
        </h2>

        <div className="space-y-6">
          <div>
            <label htmlFor="note" className="block text-sm font-medium text-gray-700">
              Note (pubbliche)
            </label>
            <textarea
              name="note"
              id="note"
              rows={3}
              placeholder="Note visibili al cliente"
              defaultValue={initialData?.note}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="note_interne" className="block text-sm font-medium text-gray-700">
              Note Interne (riservate)
            </label>
            <textarea
              name="note_interne"
              id="note_interne"
              rows={3}
              placeholder="Note riservate uso interno"
              defaultValue={initialData?.note_interne}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 bg-gray-50 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="immagine_url" className="block text-sm font-medium text-gray-700">
              URL Immagine Principale
            </label>
            <input
              type="url"
              name="immagine_url"
              id="immagine_url"
              placeholder="https://esempio.it/immagine.jpg"
              defaultValue={initialData?.immagine_url}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Error Summary Popup */}
      {eanError && (
        <div className="fixed bottom-4 right-4 bg-red-50 border-2 border-red-200 rounded-lg p-4 shadow-lg max-w-md">
          <h3 className="font-semibold text-red-900 mb-2">⚠️ Correggi gli errori:</h3>
          <ul className="text-sm text-red-700">
            {eanError && <li>• Codice EAN: {eanError}</li>}
          </ul>
        </div>
      )}

      {/* Buttons */}
      <div className="flex gap-4 justify-end">
        <Link
          href="/dashboard/prodotti"
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Annulla
        </Link>
        <button
          type="submit"
          disabled={!!eanError}
          className="px-4 py-2 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}
