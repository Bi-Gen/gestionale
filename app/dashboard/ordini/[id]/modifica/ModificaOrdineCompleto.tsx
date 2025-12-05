'use client'

import { updateOrdine } from '@/app/actions/ordini'
import Link from 'next/link'
import { type Ordine } from '@/app/actions/ordini'
import { type Cliente } from '@/app/actions/clienti'
import { type Fornitore } from '@/app/actions/fornitori'
import { type Prodotto } from '@/app/actions/prodotti'
import { useState, useEffect } from 'react'

type DettaglioRiga = {
  id?: string
  prodotto_id: string
  quantita: number
  prezzo_unitario: number
  sconto_percentuale: number
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
  const [dettagli, setDettagli] = useState<DettaglioRiga[]>(
    dettagliEsistenti.length > 0
      ? dettagliEsistenti.map(d => ({
          id: d.id,
          prodotto_id: d.prodotto_id.toString(), // Converti a stringa per matching
          quantita: d.quantita,
          prezzo_unitario: d.prezzo_unitario,
          sconto_percentuale: d.sconto_percentuale || 0
        }))
      : [{ prodotto_id: '', quantita: 1, prezzo_unitario: 0, sconto_percentuale: 0 }]
  )

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

  const aggiungiRiga = () => {
    setDettagli([...dettagli, { prodotto_id: '', quantita: 1, prezzo_unitario: 0, sconto_percentuale: 0 }])
  }

  const rimuoviRiga = (index: number) => {
    if (dettagli.length > 1) {
      setDettagli(dettagli.filter((_, i) => i !== index))
    }
  }

  const aggiornaProdotto = (index: number, prodottoId: string) => {
    const prodotto = prodotti.find(p => p.id.toString() === prodottoId)

    if (!prodotto) {
      console.error('Prodotto non trovato per ID:', prodottoId)
      return
    }

    const nuoviDettagli = [...dettagli]

    const prezzoSuggerito = ordine.tipo === 'vendita'
      ? (prodotto.prezzo_vendita || 0)
      : (prodotto.costo_ultimo || prodotto.costo_medio || prodotto.prezzo_acquisto || 0)

    nuoviDettagli[index] = {
      ...nuoviDettagli[index],
      prodotto_id: prodottoId,
      prezzo_unitario: prezzoSuggerito,
      sconto_percentuale: 0
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
            defaultValue={ordine.cliente_id || ''}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="">Seleziona un cliente</option>
            {clienti.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.ragione_sociale}
              </option>
            ))}
          </select>
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

                    {/* Info prezzi/costi */}
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
