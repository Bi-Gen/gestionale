'use client'

import { updateOrdine } from '@/app/actions/ordini'
import Link from 'next/link'
import { type Ordine } from '@/app/actions/ordini'
import { type Cliente } from '@/app/actions/clienti'
import { type Fornitore } from '@/app/actions/fornitori'
import { type Prodotto } from '@/app/actions/prodotti'
import { useState } from 'react'

type DettaglioRiga = {
  id?: string // ID esistente se modifica di una riga esistente
  prodotto_id: string
  quantita: number
  prezzo_unitario: number
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
          prodotto_id: d.prodotto_id,
          quantita: d.quantita,
          prezzo_unitario: d.prezzo_unitario
        }))
      : [{ prodotto_id: '', quantita: 1, prezzo_unitario: 0 }]
  )

  const prodottiFiltrati = ordine.tipo === 'acquisto' && fornitoreSelezionato
    ? prodotti.filter(p => p.fornitore_id === fornitoreSelezionato)
    : prodotti

  const aggiungiRiga = () => {
    setDettagli([...dettagli, { prodotto_id: '', quantita: 1, prezzo_unitario: 0 }])
  }

  const rimuoviRiga = (index: number) => {
    if (dettagli.length > 1) {
      setDettagli(dettagli.filter((_, i) => i !== index))
    }
  }

  const aggiornaProdotto = (index: number, prodottoId: string) => {
    const prodotto = prodotti.find(p => p.id === prodottoId)
    const nuoviDettagli = [...dettagli]
    nuoviDettagli[index] = {
      ...nuoviDettagli[index],
      prodotto_id: prodottoId,
      prezzo_unitario: ordine.tipo === 'vendita'
        ? (prodotto?.prezzo_vendita || 0)
        : (prodotto?.prezzo_acquisto || prodotto?.prezzo_vendita || 0)
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

  const calcolaSubtotale = (dettaglio: DettaglioRiga) => {
    return dettaglio.quantita * dettaglio.prezzo_unitario
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

      {/* Cliente o Fornitore - MODIFICABILE */}
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

        <div className="space-y-3">
          {dettagli.map((dettaglio, index) => {
            const prodotto = prodotti.find(p => p.id === dettaglio.prodotto_id)
            return (
              <div key={index} className="grid grid-cols-12 gap-3 items-start p-3 bg-gray-50 rounded-md">
                <div className="col-span-5">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Prodotto
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
                    Quantità
                  </label>
                  <input
                    type="number"
                    name={`dettagli[${index}][quantita]`}
                    value={dettaglio.quantita}
                    onChange={(e) => aggiornaQuantita(index, parseFloat(e.target.value) || 0)}
                    min="0.01"
                    step="0.01"
                    required
                    className="block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Prezzo €
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
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Subtotale
                  </label>
                  <div className="px-2 py-1.5 text-sm font-medium text-gray-900">
                    € {calcolaSubtotale(dettaglio).toFixed(2)}
                  </div>
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
                {prodotto && (
                  <div className="col-span-12 text-xs text-gray-600">
                    {prodotto.unita_misura && `Unità: ${prodotto.unita_misura}`}
                    {prodotto.descrizione && ` • ${prodotto.descrizione}`}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-4 flex justify-end">
          <div className={`${
            ordine.tipo === 'vendita' ? 'bg-blue-50' : 'bg-orange-50'
          } px-4 py-2 rounded-md`}>
            <span className="text-sm font-medium text-gray-700">Totale Ordine: </span>
            <span className={`text-lg font-bold ${
              ordine.tipo === 'vendita' ? 'text-blue-600' : 'text-orange-600'
            }`}>€ {calcolaTotale().toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Stato */}
      <div>
        <label htmlFor="stato" className="block text-sm font-medium text-gray-700">
          Stato
        </label>
        <select
          name="stato"
          id="stato"
          defaultValue={ordine.stato}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        >
          <option value="bozza">Bozza</option>
          <option value="confermato">Confermato</option>
          <option value="evaso">Evaso</option>
          <option value="annullato">Annullato</option>
        </select>
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
