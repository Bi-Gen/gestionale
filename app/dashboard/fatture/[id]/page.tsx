import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getFatturaById } from '@/app/actions/fatture'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import ContabilizzaFatturaButton from './ContabilizzaFatturaButton'
import EliminaFatturaButton from './EliminaFatturaButton'

export default async function FatturaDettaglioPage({
  params,
}: {
  params: { id: string }
}) {
  const fatturaId = parseInt(params.id)

  if (isNaN(fatturaId)) {
    notFound()
  }

  const result = await getFatturaById(fatturaId)

  if (!result.success || !result.data) {
    notFound()
  }

  const fattura = result.data
  const dettagli = fattura.dettagli || []

  const dataFattura = format(new Date(fattura.data_documento), 'dd MMMM yyyy', { locale: it })
  const dataCreazione = format(new Date(fattura.created_at), 'dd/MM/yyyy HH:mm', { locale: it })
  const tipoOperazione = fattura.tipo_operazione === 'vendita' ? 'VENDITA' : 'ACQUISTO'
  const badgeColor = fattura.tipo_operazione === 'vendita'
    ? 'bg-green-100 text-green-800'
    : 'bg-blue-100 text-blue-800'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            Fattura {fattura.numero_documento}
          </h1>
          <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeColor}`}>
                {tipoOperazione}
              </span>
              <span className="ml-2">{fattura.causale_descrizione}</span>
            </div>
            {fattura.contabilizzato && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✓ Contabilizzata
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0 gap-3">
          <Link
            href={`/dashboard/fatture/${fattura.tipo_operazione}`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Torna alle Fatture
          </Link>
          {!fattura.contabilizzato && (
            <>
              <ContabilizzaFatturaButton fatturaId={fattura.id} numeroDocumento={fattura.numero_documento} />
              <EliminaFatturaButton fatturaId={fattura.id} numeroDocumento={fattura.numero_documento} tipoOperazione={fattura.tipo_operazione} />
            </>
          )}
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
              <dt className="text-sm font-medium text-gray-500">Data Documento</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {dataFattura}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Numero Documento</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {fattura.numero_documento}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                {tipoOperazione === 'VENDITA' ? 'Cliente' : 'Fornitore'}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                <div>
                  <div className="font-medium">{fattura.soggetto_nome}</div>
                  {fattura.soggetto_piva && (
                    <div className="text-gray-500">P.IVA: {fattura.soggetto_piva}</div>
                  )}
                  {fattura.soggetto_cf && (
                    <div className="text-gray-500">CF: {fattura.soggetto_cf}</div>
                  )}
                </div>
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Regime IVA</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 capitalize">
                {fattura.regime_iva || 'Ordinario'}
                {fattura.split_payment && <span className="ml-2 text-xs text-blue-600">(Split Payment)</span>}
                {fattura.reverse_charge && <span className="ml-2 text-xs text-blue-600">(Reverse Charge)</span>}
              </dd>
            </div>
            {fattura.metodo_pagamento_nome && (
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Metodo Pagamento</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                  {fattura.metodo_pagamento_nome}
                </dd>
              </div>
            )}
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Data Creazione</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {dataCreazione}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Dettagli Fattura */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Dettaglio Righe
          </h3>
        </div>
        <div className="border-t border-gray-200 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prodotto
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantità
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Prezzo Unit.
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sconto
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Imponibile
                </th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IVA
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Totale
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dettagli.map((dettaglio: any, index: number) => (
                <tr key={dettaglio.id || index}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {dettaglio.prodotto?.codice || '-'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {dettaglio.descrizione || dettaglio.prodotto?.nome || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                    {dettaglio.quantita} {dettaglio.unita_misura || dettaglio.prodotto?.unita_misura || ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    €{parseFloat(dettaglio.prezzo_unitario || '0').toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                    {dettaglio.sconto_percentuale > 0 && `${dettaglio.sconto_percentuale}%`}
                    {dettaglio.sconto_importo > 0 && `€${parseFloat(dettaglio.sconto_importo).toFixed(2)}`}
                    {!dettaglio.sconto_percentuale && !dettaglio.sconto_importo && '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                    €{parseFloat(dettaglio.imponibile || '0').toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-xs text-gray-500">
                      {dettaglio.aliquota_iva?.percentuale || 0}%
                    </span>
                    <div className="text-xs text-gray-900">
                      €{parseFloat(dettaglio.iva || '0').toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                    €{parseFloat(dettaglio.totale || '0').toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={4} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                  Totale Imponibile:
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                  €{parseFloat(fattura.imponibile || '0').toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                  IVA
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                  €{parseFloat(fattura.iva || '0').toFixed(2)}
                </td>
              </tr>
              <tr>
                <td colSpan={6} className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                  TOTALE FATTURA:
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-lg font-bold text-blue-600">
                  €{parseFloat(fattura.totale || '0').toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Note */}
      {fattura.note && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Note
            </h3>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <p className="text-sm text-gray-900 whitespace-pre-wrap">
              {fattura.note}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
