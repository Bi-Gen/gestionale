'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { movimentoSchema, type MovimentoFormData } from '@/lib/validations/movimenti'
import { createMovimento, type Causale, type Magazzino, type OrdinePerReso } from '@/app/actions/magazzino'

type Prodotto = {
  id: number
  codice: string
  nome: string
}

type Soggetto = {
  id: number
  ragione_sociale: string
  tipo?: string[]
}

type MovimentoFormProps = {
  causali: Causale[]
  prodotti: Prodotto[]
  magazzini: Magazzino[]
  soggetti: Soggetto[]
}

export default function MovimentoFormAdvanced({
  causali,
  prodotti: prodottiIniziali,
  magazzini,
  soggetti: soggettiIniziali,
}: MovimentoFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [soggettiFiltrati, setSoggettiFiltrati] = useState<Soggetto[]>(soggettiIniziali)
  const [prodottiFiltrati, setProdottiFiltrati] = useState<Prodotto[]>(prodottiIniziali)
  const [loadingProdotti, setLoadingProdotti] = useState(false)

  // Nuovi stati per ordini
  const [ordiniDisponibili, setOrdiniDisponibili] = useState<OrdinePerReso[]>([])
  const [loadingOrdini, setLoadingOrdini] = useState(false)
  const [ordineSelezionato, setOrdineSelezionato] = useState<OrdinePerReso | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MovimentoFormData & { ordine_id?: number }>({
    resolver: zodResolver(movimentoSchema) as any,
    defaultValues: {
      data_movimento: new Date().toISOString().split('T')[0],
    },
  })

  const causaleSelezionata = watch('causale_codice')
  const soggettoSelezionato = watch('soggetto_id')
  const ordineId = watch('ordine_id' as any)
  const prodottoId = watch('prodotto_id')

  const causale = causali.find(c => c.codice === causaleSelezionata)
  const isTrasferimento = causale?.tipo === 'trasferimento'
  const isCarico = causale?.segno === 1
  const isReso = ['RES', 'RESF'].includes(causaleSelezionata || '')

  const getTipoSoggetto = (causaleCode: string): 'cliente' | 'fornitore' | 'tutti' => {
    const causaliClienti = ['VEN', 'RES']
    const causaliFornitori = ['ACQ', 'RESF']
    if (causaliClienti.includes(causaleCode)) return 'cliente'
    if (causaliFornitori.includes(causaleCode)) return 'fornitore'
    return 'tutti'
  }

  // Filtra soggetti quando cambia causale
  useEffect(() => {
    if (!causaleSelezionata) {
      setSoggettiFiltrati(soggettiIniziali)
      return
    }

    const tipoSoggetto = getTipoSoggetto(causaleSelezionata)
    if (tipoSoggetto === 'tutti') {
      setSoggettiFiltrati(soggettiIniziali)
    } else {
      const filtrati = soggettiIniziali.filter(s =>
        s.tipo && s.tipo.includes(tipoSoggetto)
      )
      setSoggettiFiltrati(filtrati)
    }

    setValue('soggetto_id', undefined)
    setValue('ordine_id' as any, undefined)
    setProdottiFiltrati(prodottiIniziali)
    setOrdiniDisponibili([])
    setOrdineSelezionato(null)
  }, [causaleSelezionata, soggettiIniziali, setValue, prodottiIniziali])

  // Carica ordini quando si seleziona un soggetto per un reso
  useEffect(() => {
    if (!soggettoSelezionato || !isReso) {
      setOrdiniDisponibili([])
      return
    }

    const tipoOrdine = causaleSelezionata === 'RESF' ? 'acquisto' : 'vendita'

    setLoadingOrdini(true)
    fetch(`/api/magazzino/ordini-reso?tipo=${tipoOrdine}&soggetto_id=${soggettoSelezionato}`)
      .then(res => res.json())
      .then(data => {
        setOrdiniDisponibili(data || [])
      })
      .catch(err => {
        console.error('Errore caricamento ordini:', err)
        setOrdiniDisponibili([])
      })
      .finally(() => setLoadingOrdini(false))
  }, [soggettoSelezionato, causaleSelezionata, isReso])

  // Quando si seleziona un ordine, filtra prodotti
  useEffect(() => {
    if (!ordineId || !isReso) {
      if (isReso) {
        setProdottiFiltrati([])
      } else {
        setProdottiFiltrati(prodottiIniziali)
      }
      setOrdineSelezionato(null)
      return
    }

    const ordine = ordiniDisponibili.find(o => o.id === Number(ordineId))
    if (!ordine) return

    setOrdineSelezionato(ordine)

    // Filtra prodotti dell'ordine
    const prodottiOrdine = ordine.dettagli_ordini.map(d => ({
      id: d.prodotto_id,
      codice: d.prodotto.codice,
      nome: d.prodotto.nome,
    }))

    setProdottiFiltrati(prodottiOrdine)
    setValue('prodotto_id', undefined as any)
  }, [ordineId, ordiniDisponibili, isReso, setValue, prodottiIniziali])

  // Pre-compila prezzo e quantità quando si seleziona prodotto da ordine
  useEffect(() => {
    if (!prodottoId || !ordineSelezionato) return

    const dettaglio = ordineSelezionato.dettagli_ordini.find(
      d => d.prodotto_id === Number(prodottoId)
    )

    if (dettaglio) {
      setValue('costo_unitario', dettaglio.prezzo_unitario)
      setValue('quantita', dettaglio.quantita)
    }
  }, [prodottoId, ordineSelezionato, setValue])

  const onSubmit = async (data: MovimentoFormData & { ordine_id?: number }) => {
    setIsSubmitting(true)
    setError(null)

    try {
      await createMovimento({
        prodotto_id: data.prodotto_id,
        magazzino_id: data.magazzino_id,
        causale_codice: data.causale_codice,
        quantita: data.quantita,
        data_movimento: data.data_movimento,
        costo_unitario: data.costo_unitario,
        magazzino_destinazione_id: data.magazzino_destinazione_id,
        soggetto_id: data.soggetto_id,
        note: data.note,
        documento_tipo: data.ordine_id ? 'ordine' : undefined,
        documento_id: data.ordine_id,
      })

      router.push('/dashboard/magazzino/movimenti?success=Movimento+registrato+con+successo')
    } catch (err) {
      console.error('Errore creazione movimento:', err)
      setError(err instanceof Error ? err.message : 'Errore durante la creazione del movimento')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Causale */}
        <div className="sm:col-span-2">
          <label htmlFor="causale_codice" className="block text-sm font-medium text-gray-700">
            Causale Movimento *
          </label>
          <select
            {...register('causale_codice')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Seleziona causale...</option>
            {causali
              .filter((c, index, self) =>
                index === self.findIndex(t => t.codice === c.codice)
              )
              .map((causale) => (
                <option key={causale.id} value={causale.codice}>
                  {causale.codice} - {causale.descrizione} ({causale.segno === 1 ? 'CARICO' : 'SCARICO'})
                </option>
              ))}
          </select>
          {errors.causale_codice && (
            <p className="mt-1 text-sm text-red-600">{errors.causale_codice.message}</p>
          )}
        </div>

        {/* Data Movimento */}
        <div>
          <label htmlFor="data_movimento" className="block text-sm font-medium text-gray-700">
            Data Movimento *
          </label>
          <input
            type="date"
            {...register('data_movimento')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.data_movimento && (
            <p className="mt-1 text-sm text-red-600">{errors.data_movimento.message}</p>
          )}
        </div>

        {/* Soggetto */}
        <div>
          <label htmlFor="soggetto_id" className="block text-sm font-medium text-gray-700">
            {causale && ['VEN', 'RES'].includes(causale.codice) && 'Cliente'}
            {causale && ['ACQ', 'RESF'].includes(causale.codice) && 'Fornitore'}
            {(!causale || !['VEN', 'RES', 'ACQ', 'RESF'].includes(causale.codice)) && 'Soggetto'}
            {isReso && ' *'}
          </label>
          <select
            {...register('soggetto_id')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Nessuno</option>
            {soggettiFiltrati.map((soggetto) => (
              <option key={soggetto.id} value={soggetto.id}>
                {soggetto.ragione_sociale}
              </option>
            ))}
          </select>
          {soggettiFiltrati.length === 0 && causaleSelezionata && (
            <p className="mt-1 text-sm text-yellow-600">
              Nessun soggetto disponibile per questa causale
            </p>
          )}
        </div>

        {/* Ordine di Riferimento (solo per resi) */}
        {isReso && soggettoSelezionato && (
          <div className="sm:col-span-2">
            <label htmlFor="ordine_id" className="block text-sm font-medium text-gray-700">
              Ordine di Riferimento * {loadingOrdini && '(Caricamento...)'}
            </label>
            <select
              {...register('ordine_id' as any)}
              disabled={loadingOrdini || ordiniDisponibili.length === 0}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">Seleziona ordine...</option>
              {ordiniDisponibili.map((ordine) => (
                <option key={ordine.id} value={ordine.id}>
                  {ordine.numero_ordine} - {new Date(ordine.data_ordine).toLocaleDateString('it-IT')} - €{ordine.totale.toFixed(2)}
                </option>
              ))}
            </select>
            {ordiniDisponibili.length === 0 && !loadingOrdini && (
              <p className="mt-1 text-sm text-yellow-600">
                Nessun ordine evaso trovato per questo {causaleSelezionata === 'RESF' ? 'fornitore' : 'cliente'}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Seleziona l&apos;ordine da cui stai facendo il reso per pre-compilare prodotti e prezzi
            </p>
          </div>
        )}

        {/* Prodotto */}
        <div className="sm:col-span-2">
          <label htmlFor="prodotto_id" className="block text-sm font-medium text-gray-700">
            Prodotto * {loadingProdotti && '(Caricamento...)'}
            {isReso && ordineSelezionato && (
              <span className="ml-2 text-xs text-blue-600">
                (Prodotti dell&apos;ordine {ordineSelezionato.numero_ordine})
              </span>
            )}
          </label>
          <select
            {...register('prodotto_id')}
            disabled={loadingProdotti || (isReso && !ordineId)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
          >
            <option value="">Seleziona prodotto...</option>
            {prodottiFiltrati.map((prodotto) => (
              <option key={prodotto.id} value={prodotto.id}>
                {prodotto.codice} - {prodotto.nome}
              </option>
            ))}
          </select>
          {isReso && !ordineId && (
            <p className="mt-1 text-sm text-yellow-600">
              Seleziona prima un ordine di riferimento
            </p>
          )}
          {errors.prodotto_id && (
            <p className="mt-1 text-sm text-red-600">{errors.prodotto_id.message}</p>
          )}
        </div>

        {/* Magazzino */}
        <div>
          <label htmlFor="magazzino_id" className="block text-sm font-medium text-gray-700">
            Magazzino {isTrasferimento ? 'Origine' : ''} *
          </label>
          <select
            {...register('magazzino_id')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Seleziona magazzino...</option>
            {magazzini.map((magazzino) => (
              <option key={magazzino.id} value={magazzino.id}>
                {magazzino.codice} - {magazzino.nome}
              </option>
            ))}
          </select>
          {errors.magazzino_id && (
            <p className="mt-1 text-sm text-red-600">{errors.magazzino_id.message}</p>
          )}
        </div>

        {/* Quantità */}
        <div>
          <label htmlFor="quantita" className="block text-sm font-medium text-gray-700">
            Quantità *
            {ordineSelezionato && prodottoId && (
              <span className="ml-2 text-xs text-green-600">
                Pre-compilato dall&apos;ordine
              </span>
            )}
          </label>
          <input
            type="number"
            step="0.001"
            {...register('quantita')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.quantita && (
            <p className="mt-1 text-sm text-red-600">{errors.quantita.message}</p>
          )}
        </div>

        {/* Costo Unitario */}
        {isCarico && (
          <div className="sm:col-span-2">
            <label htmlFor="costo_unitario" className="block text-sm font-medium text-gray-700">
              Costo Unitario
              {ordineSelezionato && prodottoId && (
                <span className="ml-2 text-xs text-green-600">
                  Pre-compilato dall&apos;ordine
                </span>
              )}
            </label>
            <input
              type="number"
              step="0.01"
              {...register('costo_unitario')}
              placeholder="Opzionale"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.costo_unitario && (
              <p className="mt-1 text-sm text-red-600">{errors.costo_unitario.message}</p>
            )}
          </div>
        )}

        {/* Note */}
        <div className="sm:col-span-2">
          <label htmlFor="note" className="block text-sm font-medium text-gray-700">
            Note
          </label>
          <textarea
            {...register('note')}
            rows={3}
            placeholder="Note opzionali sul movimento..."
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Pulsanti */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Annulla
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Salvataggio...' : 'Registra Movimento'}
        </button>
      </div>
    </form>
  )
}
