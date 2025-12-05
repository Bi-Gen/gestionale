'use client'

import { createOrdine } from '@/app/actions/ordini'
import Link from 'next/link'
import { type Cliente } from '@/app/actions/clienti'
import { type Prodotto } from '@/app/actions/prodotti'
import { type Magazzino } from '@/app/actions/magazzino'
import { useState, useEffect } from 'react'

type DettaglioRiga = {
  prodotto_id: string
  quantita: number
  prezzo_unitario: number
  sconto_percentuale: number
}

export default function VenditaForm({
  clienti,
  prodotti,
  magazzini,
  numeroOrdine,
}: {
  clienti: Cliente[]
  prodotti: Prodotto[]
  magazzini: Magazzino[]
  numeroOrdine: string
}) {
  const [dettagli, setDettagli] = useState<DettaglioRiga[]>([
    { prodotto_id: '', quantita: 1, prezzo_unitario: 0, sconto_percentuale: 0 }
  ])

  // Debug: mostra i dati dei prodotti
  useEffect(() => {
    if (prodotti.length > 0) {
      console.log('Prodotti ricevuti (vendita):', prodotti[0])
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
    console.log('Prodotto selezionato (vendita):', prodotto)

    if (!prodotto) {
      console.error('Prodotto non trovato per ID:', prodottoId)
      return
    }

    const nuoviDettagli = [...dettagli]

    // Per vendita: usa prezzo_vendita
    const prezzoSuggerito = prodotto.prezzo_vendita || 0

    console.log('Dati prodotto vendita:', {
      prezzo_vendita: prodotto.prezzo_vendita,
      giacenza: prodotto.quantita_magazzino,
      sconto_massimo: prodotto.sconto_massimo
    })

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
            const giacenzaDisponibile = prodotto?.quantita_magazzino || 0
            const scontoMassimo = prodotto?.sconto_massimo || 100
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
                      <span className={giacenzaDisponibile > 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                        Giacenza disponibile: {giacenzaDisponibile} {prodotto.unita_misura || 'PZ'}
                      </span>
                    </div>

                    {/* Prezzi disponibili */}
                    <div className="flex gap-4 p-2 bg-blue-50 rounded text-blue-900">
                      <span className="font-medium">Prezzi:</span>
                      <span>Vendita: €{prodotto.prezzo_vendita.toFixed(2)}</span>
                      {prodotto.prezzo_acquisto && <span>Acquisto: €{prodotto.prezzo_acquisto.toFixed(2)}</span>}
                      {prodotto.costo_ultimo && <span>Costo Ultimo: €{prodotto.costo_ultimo.toFixed(2)}</span>}
                      {prodotto.margine_percentuale && <span>Margine: {prodotto.margine_percentuale}%</span>}
                    </div>

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
