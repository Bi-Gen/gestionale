'use client'

import {
  updateOrdine,
  getInfoProdottoVendita,
  type Ordine,
  type PrezzoCliente,
  type StatisticheVenditaProdotto
} from '@/app/actions/ordini'
import Link from 'next/link'
import { type Cliente } from '@/app/actions/clienti'
import { type Fornitore } from '@/app/actions/fornitori'
import { type Prodotto } from '@/app/actions/prodotti'
import { useState, useEffect, useCallback } from 'react'

type DettaglioRiga = {
  id?: string
  prodotto_id: string
  quantita: number
  prezzo_unitario: number
  prezzo_listino_originale?: number
  sconto_percentuale: number
  listino_info?: {
    listino_codice: string | null
    fonte: string
    sconto_max: number | null
    provvigione: number | null
  }
  statistiche?: StatisticheVenditaProdotto | null
}

export default function ModificaOrdineCompleto({
  ordine,
  clienti,
  fornitori,
  prodotti,
  dettagliEsistenti
}: {
  ordine: Ordine
  clienti: Cliente[]
  fornitori: Fornitore[]
  prodotti: Prodotto[]
  dettagliEsistenti: any[]
}) {
  const [fornitoreSelezionato, setFornitoreSelezionato] = useState<string>(ordine.fornitore_id || '')
  const [selectedClienteId, setSelectedClienteId] = useState<string>(ordine.cliente_id || '')
  const [loadingPrezzi, setLoadingPrezzi] = useState(false)
  const [dettagli, setDettagli] = useState<DettaglioRiga[]>(
    dettagliEsistenti.length > 0
      ? dettagliEsistenti.map(d => ({
          id: d.id,
          prodotto_id: d.prodotto_id.toString(),
          quantita: d.quantita,
          prezzo_unitario: d.prezzo_unitario,
          prezzo_listino_originale: d.prezzo_unitario,
          sconto_percentuale: d.sconto_percentuale || 0
        }))
      : [{ prodotto_id: '', quantita: 1, prezzo_unitario: 0, sconto_percentuale: 0 }]
  )

  // Funzione per recuperare prezzo e statistiche (solo per vendita)
  const fetchInfoProdotto = useCallback(async (
    prodottoId: string,
    clienteId: string
  ): Promise<{ prezzo: PrezzoCliente | null, statistiche: StatisticheVenditaProdotto | null }> => {
    if (!prodottoId || !clienteId) return { prezzo: null, statistiche: null }

    try {
      const info = await getInfoProdottoVendita(
        parseInt(prodottoId),
        parseInt(clienteId)
      )
      return info
    } catch (error) {
      console.error('Errore recupero info prodotto:', error)
      return { prezzo: null, statistiche: null }
    }
  }, [])

  const prodottiFiltrati = ordine.tipo === 'acquisto' && fornitoreSelezionato
    ? prodotti.filter(p => p.fornitore_principale_id === parseInt(fornitoreSelezionato))
    : prodotti

  // Debug: verifica prodotti caricati
  useEffect(() => {
    if (prodotti.length > 0) {
      console.log('🔍 DEBUG ModificaOrdine - Primo prodotto:', prodotti[0])
      console.log('🔍 Giacenza primo prodotto:', prodotti[0]?.quantita_magazzino)
    }
  }, [prodotti])

  // Quando cambia il cliente (vendita), aggiorna prezzi e statistiche
  useEffect(() => {
    const aggiornaInfoBulk = async () => {
      if (!selectedClienteId || ordine.tipo !== 'vendita') return

      const prodottiSelezionati = dettagli.filter(d => d.prodotto_id)
      if (prodottiSelezionati.length === 0) return

      setLoadingPrezzi(true)

      const nuoviDettagli = await Promise.all(
        dettagli.map(async (dettaglio) => {
          if (!dettaglio.prodotto_id) return dettaglio

          const { prezzo: prezzoInfo, statistiche } = await fetchInfoProdotto(dettaglio.prodotto_id, selectedClienteId)
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
              statistiche
            }
          } else if (prodotto) {
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
              statistiche
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

    // Per ordini di VENDITA con cliente selezionato, recupera prezzo e statistiche
    if (ordine.tipo === 'vendita' && selectedClienteId) {
      const { prezzo: prezzoInfo, statistiche } = await fetchInfoProdotto(prodottoId, selectedClienteId)

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
          statistiche
        }
        setDettagli(nuoviDettagli)
        return
      }
    }

    // Fallback: usa prezzo base
    const prezzoSuggerito = ordine.tipo === 'vendita'
      ? (prodotto.prezzo_vendita || 0)
      : (prodotto.costo_ultimo || prodotto.costo_medio || prodotto.prezzo_acquisto || 0)

    nuoviDettagli[index] = {
      ...nuoviDettagli[index],
      prodotto_id: prodottoId,
      prezzo_unitario: prezzoSuggerito,
      prezzo_listino_originale: prezzoSuggerito,
      sconto_percentuale: 0,
      listino_info: ordine.tipo === 'vendita' ? {
        listino_codice: null,
        fonte: 'prezzo_base',
        sconto_max: null,
        provvigione: null
      } : undefined,
      statistiche: null
    }
    setDettagli(nuoviDettagli)
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
    const scontoMassimo = prodotto?.sconto_massimo || 100

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

  const updateOrdineWithId = updateOrdine.bind(null, ordine.id)

  return (
    <form action={updateOrdineWithId} className="space-y-6">
      {/* Campi hidden */}
      <input type="hidden" name="tipo" value={ordine.tipo} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Numero Ordine - READONLY */}
        <div>
          <label htmlFor="numero_ordine" className="block text-sm font-medium text-gray-700">
            Numero Ordine *
          </label>
          <input
            type="text"
            name="numero_ordine"
            id="numero_ordine"
            required
            value={ordine.numero_ordine}
            readOnly
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-500 bg-gray-100 cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500">Il numero ordine non può essere modificato</p>
        </div>

        {/* Data Ordine - READONLY */}
        <div>
          <label htmlFor="data_ordine" className="block text-sm font-medium text-gray-700">
            Data Ordine *
          </label>
          <input
            type="date"
            name="data_ordine"
            id="data_ordine"
            required
            value={ordine.data_ordine}
            readOnly
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-500 bg-gray-100 cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500">La data ordine non può essere modificata</p>
        </div>
      </div>

      {/* Cliente o Fornitore */}
      {ordine.tipo === 'vendita' ? (
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
            <p className="mt-1 text-sm text-blue-600">Aggiornamento prezzi in corso...</p>
          )}
        </div>
      ) : (
        <div>
          <label htmlFor="fornitore_id" className="block text-sm font-medium text-gray-700">
            Fornitore *
          </label>
          <select
            name="fornitore_id"
            id="fornitore_id"
            required
            value={fornitoreSelezionato}
            onChange={(e) => setFornitoreSelezionato(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="">Seleziona un fornitore</option>
            {fornitori.map((fornitore) => (
              <option key={fornitore.id} value={fornitore.id}>
                {fornitore.ragione_sociale}
              </option>
            ))}
          </select>
          {fornitoreSelezionato && (
            <p className="mt-1 text-sm text-gray-600">
              Mostrando solo prodotti di questo fornitore
            </p>
          )}
        </div>
      )}

      {/* Prodotti */}
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
            const giacenzaDisponibile = prodotto?.quantita_magazzino || 0
            const quantitaMinima = prodotto?.quantita_minima_ordine || 1
            const giacenzaMassima = prodotto?.giacenza_massima
            const scontoMassimo = prodotto?.sconto_massimo || 100
            const sconto = dettaglio.quantita * dettaglio.prezzo_unitario * (dettaglio.sconto_percentuale / 100)
            const giacenzaInsufficiente = ordine.tipo === 'vendita' && dettaglio.quantita > giacenzaDisponibile

            return (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
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
                      {prodottiFiltrati.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.codice} - {p.nome}
                        </option>
                      ))}
                    </select>
                    {ordine.tipo === 'acquisto' && fornitoreSelezionato && prodottiFiltrati.length === 0 && (
                      <p className="text-xs text-red-600 mt-1">
                        Nessun prodotto associato a questo fornitore
                      </p>
                    )}
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
                      min={ordine.tipo === 'acquisto' ? quantitaMinima : 0.01}
                      step="0.01"
                      required
                      className={`block w-full rounded-md border px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 ${
                        giacenzaInsufficiente || (ordine.tipo === 'acquisto' && dettaglio.quantita < quantitaMinima)
                          ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {ordine.tipo === 'acquisto' && dettaglio.quantita < quantitaMinima && (
                      <p className="text-xs text-red-600 mt-1">Min: {quantitaMinima}</p>
                    )}
                    {giacenzaInsufficiente && (
                      <p className="text-xs text-red-600 mt-1">Disponibile: {giacenzaDisponibile}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Prezzo € *
                    </label>
                    <input
                      type="number"
                      name={`dettagli[${index}][prezzo_unitario]`}
                      value={dettaglio.prezzo_unitario}
                      onChange={(e) => aggiornaPrezzo(index, parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      required
                      className="block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                    />
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
                    <div className="flex gap-4 text-gray-600">
                      <span>Unità: {prodotto.unita_misura || 'PZ'}</span>
                      {ordine.tipo === 'acquisto' && (
                        <>
                          {prodotto.giacenza_minima && <span>Giacenza min: {prodotto.giacenza_minima}</span>}
                          {giacenzaMassima && <span>Giacenza max: {giacenzaMassima}</span>}
                        </>
                      )}
                      <span className={giacenzaDisponibile > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        Giacenza: {giacenzaDisponibile}
                      </span>
                    </div>

                    {/* Info listino applicato (solo vendita) */}
                    {ordine.tipo === 'vendita' && dettaglio.listino_info && (
                      <div className={`p-2 rounded text-xs ${
                        dettaglio.listino_info.fonte === 'listino_cliente' ? 'bg-green-50 text-green-800 border border-green-200' :
                        dettaglio.listino_info.fonte === 'listino_categoria' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                        dettaglio.listino_info.fonte === 'listino_default' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                        'bg-gray-50 text-gray-700 border border-gray-200'
                      }`}>
                        <span className="font-medium">Listino:</span>
                        <span className="ml-2">
                          {dettaglio.listino_info.fonte === 'listino_cliente' && `Cliente (${dettaglio.listino_info.listino_codice || 'N/D'})`}
                          {dettaglio.listino_info.fonte === 'listino_categoria' && `Categoria (${dettaglio.listino_info.listino_codice || 'N/D'})`}
                          {dettaglio.listino_info.fonte === 'listino_default' && `Predefinito (${dettaglio.listino_info.listino_codice || 'N/D'})`}
                          {dettaglio.listino_info.fonte === 'prezzo_base' && 'Prezzo Base Prodotto'}
                        </span>
                        {dettaglio.listino_info.sconto_max != null && (
                          <span className="ml-3 text-gray-600">Max sconto: {dettaglio.listino_info.sconto_max}%</span>
                        )}
                      </div>
                    )}

                    {/* Panel Statistiche (solo vendita con statistiche) */}
                    {ordine.tipo === 'vendita' && dettaglio.statistiche && dettaglio.statistiche.numero_vendite > 0 ? (
                      <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                        <div className="text-xs font-semibold text-purple-800 mb-2">Analisi Storica</div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          {/* Costi */}
                          <div className="bg-white p-2 rounded shadow-sm">
                            <div className="text-gray-500 mb-1">Costi</div>
                            {dettaglio.statistiche.costo_ultimo !== null && (
                              <div>Ultimo: <span className="font-medium">€{dettaglio.statistiche.costo_ultimo.toFixed(2)}</span></div>
                            )}
                            {dettaglio.statistiche.costo_medio !== null && (
                              <div>Medio: <span className="font-medium">€{dettaglio.statistiche.costo_medio.toFixed(2)}</span></div>
                            )}
                          </div>

                          {/* Vendite */}
                          <div className="bg-white p-2 rounded shadow-sm">
                            <div className="text-gray-500 mb-1">Vendite ({dettaglio.statistiche.numero_vendite})</div>
                            {dettaglio.statistiche.prezzo_medio_vendita !== null && (
                              <div>Medio: <span className="font-medium text-blue-700">€{dettaglio.statistiche.prezzo_medio_vendita.toFixed(2)}</span></div>
                            )}
                          </div>

                          {/* Margine */}
                          <div className="bg-white p-2 rounded shadow-sm">
                            <div className="text-gray-500 mb-1">Margine Medio</div>
                            {dettaglio.statistiche.margine_medio_percentuale !== null && (
                              <div className={`font-bold ${
                                dettaglio.statistiche.margine_medio_percentuale >= 20 ? 'text-green-600' :
                                dettaglio.statistiche.margine_medio_percentuale >= 10 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {dettaglio.statistiche.margine_medio_percentuale.toFixed(1)}%
                              </div>
                            )}
                          </div>

                          {/* Ultima Vendita */}
                          <div className="bg-white p-2 rounded shadow-sm">
                            <div className="text-gray-500 mb-1">Ultima Vendita</div>
                            {dettaglio.statistiche.ultima_vendita_prezzo !== null && (
                              <div>€{dettaglio.statistiche.ultima_vendita_prezzo.toFixed(2)}</div>
                            )}
                          </div>
                        </div>

                        {/* Margine attuale */}
                        {dettaglio.statistiche.costo_ultimo !== null && dettaglio.prezzo_unitario > 0 && (
                          <div className="mt-2 p-2 bg-white rounded border text-xs">
                            {(() => {
                              const margineAttuale = ((dettaglio.prezzo_unitario - dettaglio.statistiche.costo_ultimo!) / dettaglio.statistiche.costo_ultimo!) * 100
                              return (
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-600">Margine attuale:</span>
                                  <span className={`font-bold ${
                                    margineAttuale >= 20 ? 'text-green-600' : margineAttuale >= 10 ? 'text-yellow-600' : 'text-red-600'
                                  }`}>
                                    {margineAttuale.toFixed(1)}%
                                  </span>
                                </div>
                              )
                            })()}
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Fallback: info prezzi base */
                      <div className={`flex gap-4 p-2 rounded ${ordine.tipo === 'vendita' ? 'bg-blue-50 text-blue-900' : 'bg-orange-50 text-orange-900'}`}>
                        <span className="font-medium">{ordine.tipo === 'vendita' ? 'Prezzi:' : 'Costi:'}</span>
                        {ordine.tipo === 'vendita' ? (
                          <>
                            <span>Vendita: €{prodotto.prezzo_vendita.toFixed(2)}</span>
                            {prodotto.costo_ultimo && <span>Costo: €{prodotto.costo_ultimo.toFixed(2)}</span>}
                            {prodotto.margine_percentuale && <span>Margine: {prodotto.margine_percentuale}%</span>}
                          </>
                        ) : (
                          <>
                            {prodotto.costo_ultimo && <span>Ultimo: €{prodotto.costo_ultimo.toFixed(2)}</span>}
                            {prodotto.costo_medio && <span>Medio: €{prodotto.costo_medio.toFixed(2)}</span>}
                            {prodotto.prezzo_acquisto && <span>Listino: €{prodotto.prezzo_acquisto.toFixed(2)}</span>}
                          </>
                        )}
                      </div>
                    )}

                    {/* Warning */}
                    {giacenzaInsufficiente && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded text-red-800">
                        ⚠️ ATTENZIONE: Giacenza insufficiente! Disponibile: {giacenzaDisponibile}
                      </div>
                    )}

                    {ordine.tipo === 'acquisto' && giacenzaMassima && (giacenzaDisponibile + dettaglio.quantita > giacenzaMassima) && (
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                        ⚠️ La giacenza totale ({giacenzaDisponibile + dettaglio.quantita}) supererà il massimo ({giacenzaMassima})
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
                      <span className={`text-lg ${ordine.tipo === 'vendita' ? 'text-blue-600' : 'text-orange-600'}`}>
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
          <div className={`px-6 py-3 rounded-md border-2 ${
            ordine.tipo === 'vendita' ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'
          }`}>
            <span className="text-sm font-medium text-gray-700">Totale Ordine: </span>
            <span className={`text-2xl font-bold ${ordine.tipo === 'vendita' ? 'text-blue-600' : 'text-orange-600'}`}>
              € {calcolaTotale().toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Stato */}
      <div>
        <label htmlFor="stato" className="block text-sm font-medium text-gray-700">
          Stato
        </label>
        {ordine.stato === 'evaso' ? (
          <>
            <input
              type="text"
              value="Evaso"
              readOnly
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-500 bg-gray-100 cursor-not-allowed"
            />
            <input type="hidden" name="stato" value="evaso" />
            <p className="mt-1 text-xs text-gray-500">
              ✅ Ordine evaso. Lo stato non può essere modificato.
            </p>
          </>
        ) : (
          <>
            <select
              name="stato"
              id="stato"
              defaultValue={ordine.stato}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            >
              <option value="bozza">Bozza</option>
              <option value="confermato">Confermato</option>
              <option value="annullato">Annullato</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Per evadere l&apos;ordine, usa il pulsante &quot;Evadi Ordine&quot; o &quot;Ricevi Merce&quot;
            </p>
          </>
        )}
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
          defaultValue={ordine.note || ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
      </div>

      {/* Azioni */}
      <div className="flex gap-4 justify-end">
        <Link
          href={ordine.tipo === 'vendita' ? '/dashboard/ordini/vendita' : '/dashboard/ordini/acquisto'}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Annulla
        </Link>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          Salva Modifiche
        </button>
      </div>
    </form>
  )
}
