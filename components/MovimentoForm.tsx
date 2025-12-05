'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { movimentoSchema, type MovimentoFormData } from '@/lib/validations/movimenti'
import { createMovimento, type Causale, type Magazzino } from '@/app/actions/magazzino'

type Prodotto = {
  id: number
  codice: string
  nome: string
}

type Soggetto = {
  id: number
  ragione_sociale: string
}

type MovimentoFormProps = {
  causali: Causale[]
  prodotti: Prodotto[]
  magazzini: Magazzino[]
  soggetti: Soggetto[]
}

export default function MovimentoForm({
  causali,
  prodotti,
  magazzini,
  soggetti,
}: MovimentoFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<MovimentoFormData>({
    resolver: zodResolver(movimentoSchema) as any,
    defaultValues: {
      data_movimento: new Date().toISOString().split('T')[0],
    },
  })

  const causaleSelezionata = watch('causale_codice')
  const causale = causali.find(c => c.codice === causaleSelezionata)
  const isTrasferimento = causale?.tipo === 'trasferimento'
  const isCarico = causale?.segno === 1

  const onSubmit = async (data: MovimentoFormData) => {
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
                // Rimuovi duplicati per codice
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

        {/* Prodotto */}
        <div>
          <label htmlFor="prodotto_id" className="block text-sm font-medium text-gray-700">
            Prodotto *
          </label>
          <select
            {...register('prodotto_id')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Seleziona prodotto...</option>
            {prodotti.map((prodotto) => (
              <option key={prodotto.id} value={prodotto.id}>
                {prodotto.codice} - {prodotto.nome}
              </option>
            ))}
          </select>
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

        {/* Magazzino Destinazione (solo per trasferimenti) */}
        {isTrasferimento && (
          <div>
            <label htmlFor="magazzino_destinazione_id" className="block text-sm font-medium text-gray-700">
              Magazzino Destinazione *
            </label>
            <select
              {...register('magazzino_destinazione_id')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Seleziona magazzino...</option>
              {magazzini.map((magazzino) => (
                <option key={magazzino.id} value={magazzino.id}>
                  {magazzino.codice} - {magazzino.nome}
                </option>
              ))}
            </select>
            {errors.magazzino_destinazione_id && (
              <p className="mt-1 text-sm text-red-600">{errors.magazzino_destinazione_id.message}</p>
            )}
          </div>
        )}

        {/* Quantità */}
        <div>
          <label htmlFor="quantita" className="block text-sm font-medium text-gray-700">
            Quantità *
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

        {/* Costo Unitario (solo per carichi) */}
        {isCarico && (
          <div>
            <label htmlFor="costo_unitario" className="block text-sm font-medium text-gray-700">
              Costo Unitario
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

        {/* Soggetto (opzionale) */}
        <div>
          <label htmlFor="soggetto_id" className="block text-sm font-medium text-gray-700">
            Soggetto (Fornitore/Cliente)
          </label>
          <select
            {...register('soggetto_id')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Nessuno</option>
            {soggetti.map((soggetto) => (
              <option key={soggetto.id} value={soggetto.id}>
                {soggetto.ragione_sociale}
              </option>
            ))}
          </select>
          {errors.soggetto_id && (
            <p className="mt-1 text-sm text-red-600">{errors.soggetto_id.message}</p>
          )}
        </div>

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
          {errors.note && (
            <p className="mt-1 text-sm text-red-600">{errors.note.message}</p>
          )}
        </div>
      </div>

      {/* Pulsanti */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Annulla
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Salvataggio...' : 'Registra Movimento'}
        </button>
      </div>
    </form>
  )
}
