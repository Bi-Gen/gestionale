'use client'

import {
  createOrdine,
  getInfoProdottoVendita,
  type PrezzoCliente,
  type StatisticheVenditaProdotto,
  type GiacenzaCompleta
} from '@/app/actions/ordini'
import Link from 'next/link'
import { type Cliente } from '@/app/actions/clienti'
import { type Prodotto } from '@/app/actions/prodotti'
import { type Magazzino } from '@/app/actions/magazzino'
import { useState, useEffect, useCallback } from 'react'

type TrasportatoreOption = {
  id: number
  ragione_sociale: string
  costo_trasporto_kg?: number
}

type IncotermOption = {
  id: number
  codice: string
  nome: string
  trasporto_a_carico: 'venditore' | 'compratore' | 'condiviso'
}

type DettaglioRiga = {
  prodotto_id: string
  quantita: number
  prezzo_unitario: number
  prezzo_listino_originale?: number  // Prezzo originale dal listino per confronto
  sconto_percentuale: number
  // Info prezzo dal listino
  listino_info?: {
    listino_codice: string | null
    fonte: string
    sconto_max: number | null
    provvigione: number | null
  }
  // Statistiche storiche
  statistiche?: StatisticheVenditaProdotto | null
  // Giacenza completa
  giacenza?: GiacenzaCompleta | null
}

export default function VenditaForm({
  clienti,
  prodotti,
  magazzini,
  trasportatori = [],
  incoterms = [],
  numeroOrdine,
}: {
  clienti: Cliente[]
  prodotti: Prodotto[]
  magazzini: Magazzino[]
  trasportatori?: TrasportatoreOption[]
  incoterms?: IncotermOption[]
  numeroOrdine: string
}) {
  const [dettagli, setDettagli] = useState<DettaglioRiga[]>([
    { prodotto_id: '', quantita: 1, prezzo_unitario: 0, sconto_percentuale: 0 }
  ])
  const [selectedClienteId, setSelectedClienteId] = useState<string>('')
  const [selectedSedeId, setSelectedSedeId] = useState<string>('')
  const [loadingPrezzi, setLoadingPrezzi] = useState<boolean>(false)

  // Funzione per recuperare prezzo, statistiche e giacenza
  const fetchInfoProdotto = useCallback(async (
    prodottoId: string,
    clienteId: string
  ): Promise<{ prezzo: PrezzoCliente | null, statistiche: StatisticheVenditaProdotto | null, giacenza: GiacenzaCompleta | null }> => {
    if (!prodottoId || !clienteId) return { prezzo: null, statistiche: null, giacenza: null }

    try {
      const info = await getInfoProdottoVendita(
        parseInt(prodottoId),
        parseInt(clienteId)
      )
      return info
    } catch (error) {
      console.error('Errore recupero info prodotto:', error)
      return { prezzo: null, statistiche: null, giacenza: null }
    }
  }, [])

  // Quando cambia il cliente, aggiorna prezzi e statistiche di tutti i prodotti
  useEffect(() => {
    const aggiornaInfoBulk = async () => {
      if (!selectedClienteId) return

      const prodottiSelezionati = dettagli.filter(d => d.prodotto_id)
      if (prodottiSelezionati.length === 0) return

      setLoadingPrezzi(true)

      const nuoviDettagli = await Promise.all(
        dettagli.map(async (dettaglio) => {
          if (!dettaglio.prodotto_id) return dettaglio

          const { prezzo: prezzoInfo, statistiche, giacenza } = await fetchInfoProdotto(dettaglio.prodotto_id, selectedClienteId)
          const prodotto = prodotti.find(p => p.id.toString() === dettaglio.prodotto_id)

          if (prezzoInfo && prezzoInfo.prezzo !== null) {
            return {
              ...dettaglio,
              prezzo_unitario: prezzoInfo.prezzo,
              prezzo_listino_originale: prezzoInfo.prezzo,
              listino_info: {
                listino_codice: prezzoInfo.listino_codice,
                fonte: prezzoInfo.fonte,
                sconto_max: prezzoInfo.sconto_max,
                provvigione: prezzoInfo.provvigione
              },
              statistiche,
              giacenza
            }
          } else if (prodotto) {
            // Fallback al prezzo base se non trovato nel listino
            const prezzoBase = prodotto.prezzo_vendita || 0
            return {
              ...dettaglio,
              prezzo_unitario: prezzoBase,
              prezzo_listino_originale: prezzoBase,
              listino_info: {
                listino_codice: null,
                fonte: 'prezzo_base',
                sconto_max: null,
                provvigione: null
              },
              statistiche,
              giacenza
            }
          }
          return dettaglio
        })
      )

      setDettagli(nuoviDettagli)
      setLoadingPrezzi(false)
    }

    aggiornaInfoBulk()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClienteId])

  const aggiungiRiga = () => {
    setDettagli([...dettagli, { prodotto_id: '', quantita: 1, prezzo_unitario: 0, sconto_percentuale: 0 }])
  }

  const rimuoviRiga = (index: number) => {
    if (dettagli.length > 1) {
      setDettagli(dettagli.filter((_, i) => i !== index))
    }
  }

  const aggiornaProdotto = async (index: number, prodottoId: string) => {
    const prodotto = prodotti.find(p => p.id.toString() === prodottoId)

    if (!prodotto) {
      console.error('Prodotto non trovato per ID:', prodottoId)
      return
    }

    const nuoviDettagli = [...dettagli]

    // Se c'è un cliente selezionato, cerca prezzo, statistiche e giacenza
    if (selectedClienteId) {
      const { prezzo: prezzoInfo, statistiche, giacenza } = await fetchInfoProdotto(prodottoId, selectedClienteId)

      if (prezzoInfo && prezzoInfo.prezzo !== null) {
        nuoviDettagli[index] = {
          ...nuoviDettagli[index],
          prodotto_id: prodottoId,
          prezzo_unitario: prezzoInfo.prezzo,
          prezzo_listino_originale: prezzoInfo.prezzo,
          sconto_percentuale: 0,
          listino_info: {
            listino_codice: prezzoInfo.listino_codice,
            fonte: prezzoInfo.fonte,
            sconto_max: prezzoInfo.sconto_max,
            provvigione: prezzoInfo.provvigione
          },
          statistiche,
          giacenza
        }
        setDettagli(nuoviDettagli)
        return
      }
    }

    // Fallback: usa prezzo_vendita base
    const prezzoSuggerito = prodotto.prezzo_vendita || 0

    nuoviDettagli[index] = {
      ...nuoviDettagli[index],
      prodotto_id: prodottoId,
      prezzo_unitario: prezzoSuggerito,
      prezzo_listino_originale: prezzoSuggerito,
      sconto_percentuale: 0,
      listino_info: {
        listino_codice: null,
        fonte: 'prezzo_base',
        sconto_max: null,
        provvigione: null
      },
      statistiche: null,
      giacenza: null
    }
    setDettagli(nuoviDettagli)
  }

  // Reset prezzo al valore listino originale
  const resetPrezzoListino = (index: number) => {
    const dettaglio = dettagli[index]
    if (dettaglio.prezzo_listino_originale !== undefined) {
      const nuoviDettagli = [...dettagli]
      nuoviDettagli[index].prezzo_unitario = dettaglio.prezzo_listino_originale
      setDettagli(nuoviDettagli)
    }
  }

  const aggiornaQuantita = (index: number, quantita: number) => {
    const nuoviDettagli = [...dettagli]
    nuoviDettagli[index].quantita = quantita
    setDettagli(nuoviDettagli)
  }

  const aggiornaPrezzo = (index: number, prezzo: number) => {
    const nuoviDettagli = [...dettagli]
    nuoviDettagli[index].prezzo_unitario = prezzo
    setDettagli(nuoviDettagli)
  }

  const aggiornaSconto = (index: number, sconto: number) => {
    const dettaglio = dettagli[index]
    const prodotto = prodotti.find(p => p.id.toString() === dettaglio.prodotto_id)
    // Priorità: sconto_max dal listino > sconto_massimo prodotto > 100
    const scontoMassimo = dettaglio.listino_info?.sconto_max ?? prodotto?.sconto_massimo ?? 100

    const nuoviDettagli = [...dettagli]
    nuoviDettagli[index].sconto_percentuale = Math.min(Math.max(sconto, 0), scontoMassimo)
    setDettagli(nuoviDettagli)
  }

  const calcolaSubtotale = (dettaglio: DettaglioRiga) => {
    const lordo = dettaglio.quantita * dettaglio.prezzo_unitario
    const sconto = lordo * (dettaglio.sconto_percentuale / 100)
    return lordo - sconto
  }

  const calcolaTotale = () => {
    return dettagli.reduce((sum, d) => sum + calcolaSubtotale(d), 0)
  }

  // Calcola il peso totale dell'ordine in kg
  const calcolaPesoTotale = () => {
    return dettagli.reduce((sum, dettaglio) => {
      if (!dettaglio.prodotto_id) return sum
      const prodotto = prodotti.find(p => p.id.toString() === dettaglio.prodotto_id)
      const pesoUnitario = prodotto?.peso_kg || 0
      return sum + (dettaglio.quantita * pesoUnitario)
    }, 0)
  }

  // Calcola il costo di trasporto basato sulle tariffe del trasportatore
  const calcolaCostoTrasporto = (trasportatore: { costo_trasporto_kg?: number; peso_minimo_fatturabile?: number; costo_minimo_trasporto?: number } | undefined | null) => {
    if (!trasportatore?.costo_trasporto_kg) return null

    const pesoTotale = calcolaPesoTotale()
    const costoKg = trasportatore.costo_trasporto_kg
    const pesoMinimo = trasportatore.peso_minimo_fatturabile || 0
    const costoMinimo = trasportatore.costo_minimo_trasporto || 0

    // Applica peso minimo fatturabile
    const pesoEffettivo = Math.max(pesoTotale, pesoMinimo)
    let costoCalcolato = pesoEffettivo * costoKg

    // Applica costo minimo
    if (costoCalcolato < costoMinimo) {
      costoCalcolato = costoMinimo
    }

    return {
      pesoTotale,
      pesoEffettivo,
      costoCalcolato: Math.round(costoCalcolato * 100) / 100
    }
  }

  return (
    <form action={createOrdine} className="space-y-6">
      {/* Campo hidden per il tipo */}
      <input type="hidden" name="tipo" value="vendita" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="numero_ordine" className="block text-sm font-medium text-gray-700">
            Numero Ordine *
          </label>
          <input
            type="text"
            name="numero_ordine"
            id="numero_ordine"
            required
            defaultValue={numeroOrdine}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="data_ordine" className="block text-sm font-medium text-gray-700">
            Data Ordine *
          </label>
          <input
            type="date"
            name="data_ordine"
            id="data_ordine"
            required
            defaultValue={new Date().toISOString().split('T')[0]}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="cliente_id" className="block text-sm font-medium text-gray-700">
            Cliente *
          </label>
          <select
            name="cliente_id"
            id="cliente_id"
            required
            value={selectedClienteId}
            onChange={(e) => setSelectedClienteId(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="">Seleziona un cliente</option>
            {clienti.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.ragione_sociale}
              </option>
            ))}
          </select>
          {loadingPrezzi && (
            <p className="mt-1 text-xs text-blue-600">Aggiornamento prezzi listino...</p>
          )}
        </div>

        <div>
          <label htmlFor="magazzino_id" className="block text-sm font-medium text-gray-700">
            Magazzino
          </label>
          <select
            name="magazzino_id"
            id="magazzino_id"
            defaultValue={magazzini.find(m => m.principale)?.id || ''}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="">Magazzino principale</option>
            {magazzini.map((magazzino) => (
              <option key={magazzino.id} value={magazzino.id}>
                {magazzino.codice} - {magazzino.nome} {magazzino.principale && '(Principale)'}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            Da quale magazzino scaricare i prodotti
          </p>
        </div>
      </div>

      {/* Sezione Prodotti */}
      <div className="border-t pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Prodotti *</h3>
          <button
            type="button"
            onClick={aggiungiRiga}
            className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            + Aggiungi Prodotto
          </button>
        </div>

        <div className="space-y-4">
          {dettagli.map((dettaglio, index) => {
            const prodotto = prodotti.find(p => p.id.toString() === dettaglio.prodotto_id)
            // Usa giacenza dal dettaglio se disponibile, altrimenti fallback a prodotto
            const giacenzaReale = dettaglio.giacenza?.giacenza_reale ?? prodotto?.quantita_magazzino ?? 0
            const giacenzaImpegnata = dettaglio.giacenza?.giacenza_impegnata_vendita ?? 0
            const giacenzaInArrivo = dettaglio.giacenza?.giacenza_impegnata_acquisto ?? 0
            const giacenzaDisponibile = dettaglio.giacenza?.giacenza_disponibile ?? giacenzaReale
            // Priorità: sconto_max dal listino > sconto_massimo prodotto > 100
            const scontoMassimo = dettaglio.listino_info?.sconto_max ?? prodotto?.sconto_massimo ?? 100
            const sconto = dettaglio.quantita * dettaglio.prezzo_unitario * (dettaglio.sconto_percentuale / 100)
            const giacenzaInsufficiente = dettaglio.quantita > giacenzaDisponibile

            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
                {/* Prima riga: Prodotto e Quantità */}
                <div className="grid grid-cols-12 gap-3 mb-3">
                  <div className="col-span-6">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Prodotto *
                    </label>
                    <select
                      name={`dettagli[${index}][prodotto_id]`}
                      value={dettaglio.prodotto_id}
                      onChange={(e) => aggiornaProdotto(index, e.target.value)}
                      required
                      className="block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    >
                      <option value="">Seleziona prodotto</option>
                      {prodotti.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.codice} - {p.nome}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Quantità *
                    </label>
                    <input
                      type="number"
                      name={`dettagli[${index}][quantita]`}
                      value={dettaglio.quantita}
                      onChange={(e) => aggiornaQuantita(index, parseFloat(e.target.value) || 0)}
                      min="0.01"
                      step="0.01"
                      required
                      className={`block w-full rounded-md border px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 ${
                        giacenzaInsufficiente ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {giacenzaInsufficiente && (
                      <p className="text-xs text-red-600 mt-1">Disponibile: {giacenzaDisponibile}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Prezzo € *
                      {dettaglio.prezzo_listino_originale !== undefined &&
                       dettaglio.prezzo_unitario !== dettaglio.prezzo_listino_originale && (
                        <span className="ml-1 text-orange-600 font-normal">(modificato)</span>
                      )}
                    </label>
                    <div className="flex gap-1">
                      <input
                        type="number"
                        name={`dettagli[${index}][prezzo_unitario]`}
                        value={dettaglio.prezzo_unitario}
                        onChange={(e) => aggiornaPrezzo(index, parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        required
                        className={`block w-full rounded-md border px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 ${
                          dettaglio.prezzo_listino_originale !== undefined &&
                          dettaglio.prezzo_unitario !== dettaglio.prezzo_listino_originale
                            ? 'border-orange-400 bg-orange-50'
                            : 'border-gray-300'
                        }`}
                      />
                      {dettaglio.prezzo_listino_originale !== undefined &&
                       dettaglio.prezzo_unitario !== dettaglio.prezzo_listino_originale && (
                        <button
                          type="button"
                          onClick={() => resetPrezzoListino(index)}
                          className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                          title={`Ripristina €${dettaglio.prezzo_listino_originale.toFixed(2)}`}
                        >
                          ↺
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Sconto %
                    </label>
                    <input
                      type="number"
                      name={`dettagli[${index}][sconto_percentuale]`}
                      value={dettaglio.sconto_percentuale}
                      onChange={(e) => aggiornaSconto(index, parseFloat(e.target.value) || 0)}
                      min="0"
                      max={scontoMassimo}
                      step="0.01"
                      className={`block w-full rounded-md border px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 ${
                        dettaglio.sconto_percentuale > scontoMassimo ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {scontoMassimo < 100 && (
                      <p className="text-xs text-gray-500 mt-1">Max: {scontoMassimo}%</p>
                    )}
                  </div>
                  <div className="col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={() => rimuoviRiga(index)}
                      disabled={dettagli.length === 1}
                      className="w-full px-2 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                      title="Rimuovi"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Info prodotto */}
                {prodotto && (
                  <div className="space-y-2 text-xs">
                    {/* Info Giacenza Completa */}
                    <div className="flex flex-wrap gap-4 text-gray-600 p-2 bg-gray-50 rounded">
                      <span>Unità: {prodotto.unita_misura || 'PZ'}</span>
                      <span className="text-gray-700">
                        Reale: <span className="font-medium">{giacenzaReale}</span>
                      </span>
                      {giacenzaImpegnata > 0 && (
                        <span className="text-orange-600">
                          Impegnata: <span className="font-medium">-{giacenzaImpegnata}</span>
                        </span>
                      )}
                      <span className={giacenzaDisponibile > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                        Disponibile: {giacenzaDisponibile}
                      </span>
                      {giacenzaInArrivo > 0 && (
                        <span className="text-blue-600">
                          In arrivo: <span className="font-medium">+{giacenzaInArrivo}</span>
                        </span>
                      )}
                    </div>

                    {/* Info Listino applicato */}
                    {dettaglio.listino_info && (
                      <div className={`flex items-center gap-2 p-2 rounded ${
                        dettaglio.listino_info.fonte === 'listino_cliente' ? 'bg-green-50 text-green-800' :
                        dettaglio.listino_info.fonte === 'listino_categoria' ? 'bg-blue-50 text-blue-800' :
                        dettaglio.listino_info.fonte === 'listino_default' ? 'bg-yellow-50 text-yellow-800' :
                        'bg-gray-50 text-gray-700'
                      }`}>
                        <span className="font-medium">Prezzo da:</span>
                        {dettaglio.listino_info.fonte === 'listino_cliente' && (
                          <span>Listino Cliente {dettaglio.listino_info.listino_codice && `(${dettaglio.listino_info.listino_codice})`}</span>
                        )}
                        {dettaglio.listino_info.fonte === 'listino_categoria' && (
                          <span>Listino Categoria {dettaglio.listino_info.listino_codice && `(${dettaglio.listino_info.listino_codice})`}</span>
                        )}
                        {dettaglio.listino_info.fonte === 'listino_default' && (
                          <span>Listino Predefinito {dettaglio.listino_info.listino_codice && `(${dettaglio.listino_info.listino_codice})`}</span>
                        )}
                        {dettaglio.listino_info.fonte === 'prezzo_base' && (
                          <span>Prezzo Base Prodotto</span>
                        )}
                        {dettaglio.listino_info.sconto_max !== null && (
                          <span className="ml-auto">Sconto Max: {dettaglio.listino_info.sconto_max}%</span>
                        )}
                      </div>
                    )}

                    {/* Panel Statistiche e Supporto Decisionale */}
                    {dettaglio.statistiche && dettaglio.statistiche.numero_vendite > 0 ? (
                      <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                        <div className="text-xs font-semibold text-purple-800 mb-2">
                          Analisi Storica (ultimi 12 mesi)
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                          {/* Costi */}
                          <div className="bg-white p-2 rounded shadow-sm">
                            <div className="text-gray-500 mb-1">Costi</div>
                            <div className="space-y-1">
                              {dettaglio.statistiche.costo_ultimo !== null && (
                                <div>Ultimo: <span className="font-medium text-gray-900">€{dettaglio.statistiche.costo_ultimo.toFixed(2)}</span></div>
                              )}
                              {dettaglio.statistiche.costo_medio !== null && (
                                <div>Medio: <span className="font-medium text-gray-900">€{dettaglio.statistiche.costo_medio.toFixed(2)}</span></div>
                              )}
                            </div>
                          </div>

                          {/* Prezzi Vendita Storici */}
                          <div className="bg-white p-2 rounded shadow-sm">
                            <div className="text-gray-500 mb-1">Vendite ({dettaglio.statistiche.numero_vendite})</div>
                            <div className="space-y-1">
                              {dettaglio.statistiche.prezzo_medio_vendita !== null && (
                                <div>Medio: <span className="font-medium text-blue-700">€{dettaglio.statistiche.prezzo_medio_vendita.toFixed(2)}</span></div>
                              )}
                              {dettaglio.statistiche.prezzo_min_vendita !== null && dettaglio.statistiche.prezzo_max_vendita !== null && (
                                <div className="text-gray-500">
                                  Min/Max: €{dettaglio.statistiche.prezzo_min_vendita.toFixed(2)} - €{dettaglio.statistiche.prezzo_max_vendita.toFixed(2)}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Margini */}
                          <div className="bg-white p-2 rounded shadow-sm">
                            <div className="text-gray-500 mb-1">Margine Medio</div>
                            <div className="space-y-1">
                              {dettaglio.statistiche.margine_medio_percentuale !== null && (
                                <div className={`font-bold text-lg ${
                                  dettaglio.statistiche.margine_medio_percentuale >= 20 ? 'text-green-600' :
                                  dettaglio.statistiche.margine_medio_percentuale >= 10 ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {dettaglio.statistiche.margine_medio_percentuale.toFixed(1)}%
                                </div>
                              )}
                              {dettaglio.statistiche.margine_medio_euro !== null && (
                                <div className="text-gray-600">€{dettaglio.statistiche.margine_medio_euro.toFixed(2)}/pz</div>
                              )}
                            </div>
                          </div>

                          {/* Ultima Vendita */}
                          <div className="bg-white p-2 rounded shadow-sm">
                            <div className="text-gray-500 mb-1">Ultima Vendita</div>
                            <div className="space-y-1">
                              {dettaglio.statistiche.ultima_vendita_prezzo !== null && (
                                <div>€{dettaglio.statistiche.ultima_vendita_prezzo.toFixed(2)}</div>
                              )}
                              {dettaglio.statistiche.ultima_vendita_data && (
                                <div className="text-gray-500">{new Date(dettaglio.statistiche.ultima_vendita_data).toLocaleDateString('it-IT')}</div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Ultima vendita a questo cliente */}
                        {dettaglio.statistiche.ultima_vendita_cliente_prezzo !== null && (
                          <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                            <span className="text-green-800 font-medium">Storico cliente:</span>
                            <span className="ml-2">Ultima vendita a €{dettaglio.statistiche.ultima_vendita_cliente_prezzo.toFixed(2)}</span>
                            {dettaglio.statistiche.ultima_vendita_cliente_data && (
                              <span className="text-green-600 ml-1">
                                ({new Date(dettaglio.statistiche.ultima_vendita_cliente_data).toLocaleDateString('it-IT')})
                              </span>
                            )}
                          </div>
                        )}

                        {/* Confronto margine attuale vs medio */}
                        {dettaglio.statistiche.costo_ultimo !== null && dettaglio.prezzo_unitario > 0 && (
                          <div className="mt-2 p-2 bg-white rounded border">
                            {(() => {
                              const margineAttuale = ((dettaglio.prezzo_unitario - dettaglio.statistiche.costo_ultimo!) / dettaglio.statistiche.costo_ultimo!) * 100
                              const margineMedio = dettaglio.statistiche.margine_medio_percentuale || 0
                              const differenza = margineAttuale - margineMedio
                              return (
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-600">Margine attuale:</span>
                                  <div className="flex items-center gap-2">
                                    <span className={`font-bold ${
                                      margineAttuale >= 20 ? 'text-green-600' :
                                      margineAttuale >= 10 ? 'text-yellow-600' :
                                      'text-red-600'
                                    }`}>
                                      {margineAttuale.toFixed(1)}%
                                    </span>
                                    {margineMedio > 0 && (
                                      <span className={`text-xs px-2 py-0.5 rounded ${
                                        differenza >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                      }`}>
                                        {differenza >= 0 ? '+' : ''}{differenza.toFixed(1)}% vs media
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )
                            })()}
                          </div>
                        )}

                        {/* Prezzo Suggerito e Provvigione */}
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                          {/* Prezzo Suggerito basato su margine medio */}
                          {dettaglio.statistiche.costo_ultimo !== null && dettaglio.statistiche.margine_medio_percentuale !== null && (
                            <div className="p-2 bg-amber-50 rounded border border-amber-200">
                              {(() => {
                                const prezzoSuggerito = dettaglio.statistiche.costo_ultimo! * (1 + dettaglio.statistiche.margine_medio_percentuale! / 100)
                                const differenzaPrezzo = dettaglio.prezzo_unitario - prezzoSuggerito
                                return (
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className="text-amber-800 font-medium text-xs">Prezzo suggerito:</span>
                                      <span className="ml-2 font-bold text-amber-900">€{prezzoSuggerito.toFixed(2)}</span>
                                    </div>
                                    {Math.abs(differenzaPrezzo) > 0.01 && (
                                      <span className={`text-xs px-2 py-0.5 rounded ${
                                        differenzaPrezzo >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                      }`}>
                                        {differenzaPrezzo >= 0 ? '+' : ''}€{differenzaPrezzo.toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                )
                              })()}
                              <div className="text-xs text-amber-600 mt-1">
                                (Costo €{dettaglio.statistiche.costo_ultimo!.toFixed(2)} + {dettaglio.statistiche.margine_medio_percentuale}% margine medio)
                              </div>
                            </div>
                          )}

                          {/* Calcolo Provvigione Agente */}
                          {dettaglio.listino_info?.provvigione !== null && dettaglio.listino_info?.provvigione !== undefined && dettaglio.listino_info.provvigione > 0 && (
                            <div className="p-2 bg-pink-50 rounded border border-pink-200">
                              {(() => {
                                const subtotaleRiga = calcolaSubtotale(dettaglio)
                                const costoProvvigione = subtotaleRiga * (dettaglio.listino_info!.provvigione! / 100)
                                const margineDopoProvvigione = dettaglio.statistiche?.costo_ultimo !== null
                                  ? subtotaleRiga - dettaglio.statistiche!.costo_ultimo! * dettaglio.quantita - costoProvvigione
                                  : null
                                return (
                                  <>
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <span className="text-pink-800 font-medium text-xs">Provvigione agente:</span>
                                        <span className="ml-2 font-bold text-pink-900">€{costoProvvigione.toFixed(2)}</span>
                                      </div>
                                      <span className="text-xs text-pink-600">{dettaglio.listino_info!.provvigione}%</span>
                                    </div>
                                    {margineDopoProvvigione !== null && (
                                      <div className="text-xs text-pink-600 mt-1">
                                        Margine netto riga: <span className={`font-medium ${margineDopoProvvigione >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                          €{margineDopoProvvigione.toFixed(2)}
                                        </span>
                                      </div>
                                    )}
                                  </>
                                )
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Fallback: mostra riferimenti base se non ci sono statistiche */
                      <div className="flex gap-4 p-2 bg-blue-50 rounded text-blue-900">
                        <span className="font-medium">Riferimenti:</span>
                        <span>Prezzo Base: €{prodotto.prezzo_vendita.toFixed(2)}</span>
                        {prodotto.prezzo_acquisto && <span>Acquisto: €{prodotto.prezzo_acquisto.toFixed(2)}</span>}
                        {prodotto.costo_ultimo && <span>Costo Ultimo: €{prodotto.costo_ultimo.toFixed(2)}</span>}
                        {prodotto.margine_percentuale && <span>Margine: {prodotto.margine_percentuale}%</span>}
                      </div>
                    )}

                    {/* Warning giacenza insufficiente */}
                    {giacenzaInsufficiente && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded text-red-800">
                        ATTENZIONE: Giacenza insufficiente! Disponibile: {giacenzaDisponibile} {prodotto.unita_misura || 'PZ'}, Richiesto: {dettaglio.quantita}. L&apos;evasione dell&apos;ordine fallirà.
                      </div>
                    )}

                    {/* Warning giacenza bassa */}
                    {!giacenzaInsufficiente && prodotto.punto_riordino && giacenzaDisponibile <= prodotto.punto_riordino && (
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                        ⚠️ Attenzione: Dopo questa vendita, la giacenza sarà sotto il punto di riordino ({prodotto.punto_riordino})
                      </div>
                    )}

                    {/* Calcolo prezzi */}
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded font-medium">
                      <div className="flex gap-4">
                        <span>Lordo: €{(dettaglio.quantita * dettaglio.prezzo_unitario).toFixed(2)}</span>
                        {dettaglio.sconto_percentuale > 0 && (
                          <span className="text-red-600">Sconto ({dettaglio.sconto_percentuale}%): -€{sconto.toFixed(2)}</span>
                        )}
                      </div>
                      <span className="text-lg text-blue-600">
                        Subtotale: €{calcolaSubtotale(dettaglio).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex justify-end">
          <div className="bg-blue-50 px-6 py-3 rounded-md border-2 border-blue-200">
            <span className="text-sm font-medium text-gray-700">Totale Ordine: </span>
            <span className="text-2xl font-bold text-blue-600">€ {calcolaTotale().toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Sezione Spedizione e Condizioni (Read-Only da cliente) */}
      {selectedClienteId && (() => {
        const cliente = clienti.find(c => c.id.toString() === selectedClienteId)
        if (!cliente) return null

        const hasTrasporto = cliente.trasportatore || cliente.incoterm
        const hasPagamento = cliente.metodo_pagamento
        const hasSedi = cliente.sedi && cliente.sedi.length > 0

        // Determina il trasportatore effettivo (dalla sede selezionata o dal cliente)
        const sedeSelezionata = cliente.sedi?.find(s => s.id.toString() === selectedSedeId)
        const trasportatoreEffettivo = sedeSelezionata?.trasportatore || cliente.trasportatore
        const trasportatoreIdEffettivo = sedeSelezionata?.trasportatore_id || cliente.trasportatore_id

        return (
          <div className="space-y-4">
            {/* Sede di Spedizione */}
            <div className="border border-green-200 rounded-lg p-4 bg-green-50">
              <h3 className="text-sm font-medium text-green-900 mb-3">Indirizzo di Spedizione</h3>
              {hasSedi ? (
                <div>
                  <select
                    value={selectedSedeId}
                    onChange={(e) => setSelectedSedeId(e.target.value)}
                    className="block w-full rounded-md border border-green-300 px-3 py-2 text-gray-900 bg-white focus:border-green-500 focus:outline-none focus:ring-green-500"
                  >
                    <option value="">Sede Principale (indirizzo cliente)</option>
                    {cliente.sedi?.filter(s => s.per_spedizione !== false).map((sede) => (
                      <option key={sede.id} value={sede.id}>
                        {sede.denominazione} - {sede.citta} {sede.provincia && `(${sede.provincia})`}
                        {sede.predefinito && ' ★'}
                      </option>
                    ))}
                  </select>
                  {sedeSelezionata ? (
                    <div className="mt-2 text-sm text-gray-700">
                      <span className="font-medium">Indirizzo:</span> {sedeSelezionata.indirizzo} {sedeSelezionata.civico}, {sedeSelezionata.cap} {sedeSelezionata.citta} {sedeSelezionata.provincia && `(${sedeSelezionata.provincia})`}
                    </div>
                  ) : (
                    <div className="mt-2 text-sm text-gray-700">
                      <span className="font-medium">Indirizzo:</span> {cliente.indirizzo} {cliente.civico}, {cliente.cap} {cliente.citta} {cliente.provincia && `(${cliente.provincia})`}
                    </div>
                  )}
                  <input type="hidden" name="sede_cliente_id" value={selectedSedeId || ''} />
                </div>
              ) : (
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Indirizzo:</span> {cliente.indirizzo} {cliente.civico}, {cliente.cap} {cliente.citta} {cliente.provincia && `(${cliente.provincia})`}
                </div>
              )}
            </div>

            {/* Trasporto */}
            {(hasTrasporto || sedeSelezionata?.trasportatore) && (() => {
              const costoTrasportoInfo = calcolaCostoTrasporto(trasportatoreEffettivo)

              return (
                <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                  <h3 className="text-sm font-medium text-orange-900 mb-3">Trasporto</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">Trasportatore</dt>
                      <dd className="mt-1 text-sm font-medium text-gray-900">
                        {trasportatoreEffettivo?.ragione_sociale || <span className="text-gray-400 italic">Non assegnato</span>}
                      </dd>
                      {trasportatoreEffettivo?.costo_trasporto_kg && (
                        <dd className="text-xs text-gray-500">{trasportatoreEffettivo.costo_trasporto_kg.toFixed(2)} €/kg</dd>
                      )}
                      {sedeSelezionata?.trasportatore && (
                        <dd className="text-xs text-orange-600 mt-1">Trasportatore dedicato sede</dd>
                      )}
                      <input type="hidden" name="trasportatore_id" value={trasportatoreIdEffettivo || ''} />
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">Termini di Resa</dt>
                      {cliente.incoterm ? (
                        <>
                          <dd className="mt-1 text-sm font-medium text-gray-900">{cliente.incoterm.nome}</dd>
                          <dd className={`text-xs px-2 py-0.5 rounded inline-block mt-1 ${
                            cliente.incoterm.trasporto_a_carico === 'compratore'
                              ? 'text-green-700 bg-green-100'
                              : 'text-orange-700 bg-orange-100'
                          }`}>
                            {cliente.incoterm.trasporto_a_carico === 'compratore' ? 'Cliente paga' : 'Noi paghiamo'}
                          </dd>
                        </>
                      ) : (
                        <dd className="mt-1 text-sm text-gray-400 italic">Non definito</dd>
                      )}
                      <input type="hidden" name="incoterm_id" value={cliente.incoterm_default_id || ''} />
                    </div>
                    {/* Calcolo Costo Trasporto */}
                    <div className="bg-white rounded-lg p-3 border border-orange-300">
                      <dt className="text-xs font-medium text-gray-500 uppercase mb-2">Stima Costo Trasporto</dt>
                      {costoTrasportoInfo ? (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-gray-600">
                            <span>Peso ordine:</span>
                            <span className="font-medium">{costoTrasportoInfo.pesoTotale.toFixed(2)} kg</span>
                          </div>
                          {costoTrasportoInfo.pesoEffettivo > costoTrasportoInfo.pesoTotale && (
                            <div className="flex justify-between text-xs text-orange-600">
                              <span>Peso minimo:</span>
                              <span className="font-medium">{costoTrasportoInfo.pesoEffettivo.toFixed(2)} kg</span>
                            </div>
                          )}
                          <div className="flex justify-between text-sm font-bold text-orange-700 pt-1 border-t border-orange-200">
                            <span>Costo stimato:</span>
                            <span>€ {costoTrasportoInfo.costoCalcolato.toFixed(2)}</span>
                          </div>
                          <input type="hidden" name="costo_trasporto_stimato" value={costoTrasportoInfo.costoCalcolato} />
                        </div>
                      ) : (
                        <dd className="text-xs text-gray-400 italic">Tariffa non configurata</dd>
                      )}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Metodo Pagamento */}
            {hasPagamento && (
              <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                <h3 className="text-sm font-medium text-purple-900 mb-3">Metodo di Pagamento</h3>
                <div className="text-sm">
                  <span className="font-medium text-gray-900">{cliente.metodo_pagamento?.nome}</span>
                  {cliente.metodo_pagamento?.giorni_scadenza !== undefined && cliente.metodo_pagamento.giorni_scadenza > 0 && (
                    <span className="text-gray-500 ml-2">({cliente.metodo_pagamento.giorni_scadenza} giorni)</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })()}

      <div>
        <label htmlFor="stato" className="block text-sm font-medium text-gray-700">
          Stato *
        </label>
        <select
          name="stato"
          id="stato"
          defaultValue="bozza"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        >
          <option value="bozza">Bozza</option>
          <option value="confermato">Confermato</option>
        </select>
        <p className="mt-1 text-xs text-gray-500">
          Per evadere l&apos;ordine e scaricare il magazzino, usa il bottone &quot;Evadi Ordine&quot; dalla pagina di dettaglio dopo aver salvato l&apos;ordine
        </p>
      </div>

      <div>
        <label htmlFor="note" className="block text-sm font-medium text-gray-700">
          Note
        </label>
        <textarea
          name="note"
          id="note"
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>

      <div className="flex gap-4 justify-end">
        <Link
          href="/dashboard/ordini/vendita"
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Annulla
        </Link>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Crea Ordine di Vendita
        </button>
      </div>
    </form>
  )
}
