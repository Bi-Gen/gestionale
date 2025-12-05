import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getMovimentoById } from '@/app/actions/magazzino'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

export default async function MovimentoDettaglioPage({
  params,
}: {
  params: { id: string }
}) {
  const movimentoId = parseInt(params.id)

  if (isNaN(movimentoId)) {
    notFound()
  }

  const movimento = await getMovimentoById(movimentoId)

  if (!movimento) {
    notFound()
  }

  const dataMovimento = format(new Date(movimento.data_movimento), 'dd MMMM yyyy', { locale: it })
  const dataCreazione = format(new Date(movimento.created_at), 'dd/MM/yyyy HH:mm', { locale: it })
  const isTrasferimento = movimento.causale.tipo === 'trasferimento'
  const tipoOperazione = movimento.segno === 1 ? 'CARICO' : 'SCARICO'
  const badgeColor = movimento.segno === 1
    ? 'bg-green-100 text-green-800'
    : 'bg-red-100 text-red-800'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Dettaglio Movimento {movimento.documento_numero}
          </h1>
          <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}>
                {tipoOperazione}
              </span>
              <span className="ml-2">{movimento.causale.codice} - {movimento.causale.descrizione}</span>
            </div>
          </div>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <Link
            href="/dashboard/magazzino/movimenti"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Torna ai Movimenti
          </Link>
        </div>
      </div>

      {/* Informazioni Principali */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Informazioni Generali
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Data Movimento</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {dataMovimento}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Documento</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {movimento.documento_numero}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Causale</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {movimento.causale.codice} - {movimento.causale.descrizione}
                {isTrasferimento && (
                  <span className="ml-2 text-xs text-blue-600">(Trasferimento)</span>
                )}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Data Creazione</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {dataCreazione}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Prodotto */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Prodotto
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Codice</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <Link
                  href={`/dashboard/prodotti/${movimento.prodotto.id}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {movimento.prodotto.codice}
                </Link>
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Nome</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {movimento.prodotto.nome}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Quantità</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <span className="font-semibold">{movimento.quantita}</span>
                {movimento.prodotto.unita_misura && (
                  <span className="ml-1 text-gray-500">{movimento.prodotto.unita_misura}</span>
                )}
              </dd>
            </div>
            {movimento.costo_unitario && (
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Costo Unitario</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  €{movimento.costo_unitario.toFixed(2)}
                </dd>
              </div>
            )}
            {movimento.costo_totale && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Costo Totale</dt>
                <dd className="mt-1 text-sm font-semibold text-gray-900 sm:col-span-2 sm:mt-0">
                  €{movimento.costo_totale.toFixed(2)}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Magazzino */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {isTrasferimento ? 'Magazzini' : 'Magazzino'}
          </h3>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                {isTrasferimento ? 'Magazzino Origine' : 'Magazzino'}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {movimento.magazzino.codice} - {movimento.magazzino.nome}
              </dd>
            </div>
            {isTrasferimento && movimento.magazzino_destinazione && (
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Magazzino Destinazione</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {movimento.magazzino_destinazione.codice} - {movimento.magazzino_destinazione.nome}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Soggetto (se presente) */}
      {movimento.soggetto && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {movimento.causale.codice === 'VEN' || movimento.causale.codice === 'RES'
                ? 'Cliente'
                : movimento.causale.codice === 'ACQ' || movimento.causale.codice === 'RESF'
                ? 'Fornitore'
                : 'Soggetto'}
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Ragione Sociale</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {movimento.soggetto.ragione_sociale}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* Ordine di Riferimento (se presente) */}
      {movimento.ordine && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Ordine di Riferimento
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Numero Ordine</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <Link
                    href={`/dashboard/ordini/${movimento.ordine.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {movimento.ordine.numero_ordine}
                  </Link>
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Data Ordine</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {format(new Date(movimento.ordine.data_ordine), 'dd MMMM yyyy', { locale: it })}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Tipo Ordine</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  <span className="capitalize">{movimento.ordine.tipo}</span>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* Note (se presenti) */}
      {movimento.note && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Note
            </h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <p className="text-sm text-gray-900 whitespace-pre-wrap">
              {movimento.note}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
