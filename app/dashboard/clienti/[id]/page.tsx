import { getCliente } from '@/app/actions/clienti'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function DettaglioClientePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  const cliente = await getCliente(id)

  if (!cliente) {
    redirect('/dashboard/clienti?error=Cliente non trovato')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/dashboard/clienti"
            className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
          >
            ← Torna ai Clienti
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dettaglio Cliente
            </h1>
            <p className="text-sm text-gray-500 mt-1">Visualizzazione in sola lettura</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {query.success && (
          <div className="mb-4 rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-700">{query.success}</p>
          </div>
        )}
        {query.error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-700">{query.error}</p>
          </div>
        )}

        {/* SEZIONE 1: DATI ANAGRAFICI */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">👤 Dati Anagrafici</h2>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Tipo Soggetto</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {cliente.tipo_persona === 'fisica' ? 'Persona Fisica' : 'Persona Giuridica (Azienda)'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Ragione Sociale</dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900">{cliente.ragione_sociale}</dd>
            </div>
            {cliente.tipo_persona === 'fisica' && (
              <>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Nome</dt>
                  <dd className="mt-1 text-sm text-gray-900">{cliente.nome || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Cognome</dt>
                  <dd className="mt-1 text-sm text-gray-900">{cliente.cognome || '-'}</dd>
                </div>
              </>
            )}
          </dl>
        </div>

        {/* SEZIONE 2: DATI FISCALI */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">🧾 Dati Fiscali e Fatturazione</h2>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Partita IVA</dt>
              <dd className="mt-1 text-sm text-gray-900">{cliente.partita_iva || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Codice Fiscale</dt>
              <dd className="mt-1 text-sm text-gray-900">{cliente.codice_fiscale || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Codice Univoco SDI</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{cliente.codice_univoco || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email PEC</dt>
              <dd className="mt-1 text-sm text-gray-900">{cliente.pec || '-'}</dd>
            </div>
          </dl>
        </div>

        {/* SEZIONE 3: CONTATTI */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">📞 Contatti</h2>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{cliente.email || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Sito Web</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {cliente.sito_web ? (
                  <a href={cliente.sito_web} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 hover:underline">
                    {cliente.sito_web}
                  </a>
                ) : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Telefono</dt>
              <dd className="mt-1 text-sm text-gray-900">{cliente.telefono || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Cellulare</dt>
              <dd className="mt-1 text-sm text-gray-900">{cliente.cellulare || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Fax</dt>
              <dd className="mt-1 text-sm text-gray-900">{cliente.fax || '-'}</dd>
            </div>
          </dl>
        </div>

        {/* SEZIONE 4: INDIRIZZO */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">📍 Indirizzo</h2>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Indirizzo</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {cliente.indirizzo || '-'} {cliente.civico ? `n. ${cliente.civico}` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Città</dt>
              <dd className="mt-1 text-sm text-gray-900">{cliente.citta || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">CAP</dt>
              <dd className="mt-1 text-sm text-gray-900">{cliente.cap || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Provincia</dt>
              <dd className="mt-1 text-sm text-gray-900">{cliente.provincia || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Paese</dt>
              <dd className="mt-1 text-sm text-gray-900">{cliente.paese || 'IT'}</dd>
            </div>
          </dl>
        </div>

        {/* SEZIONE 5: DATI COMMERCIALI */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">💼 Dati Commerciali</h2>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Categoria Cliente</dt>
              <dd className="mt-1 text-sm text-gray-900">{cliente.categoria_cliente || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Zona Vendita</dt>
              <dd className="mt-1 text-sm text-gray-900">{cliente.zona_vendita || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Sconto Abituale</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {cliente.sconto_percentuale ? `${cliente.sconto_percentuale}%` : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Fido Massimo</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {cliente.fido_massimo ? `€ ${parseFloat(cliente.fido_massimo).toLocaleString('it-IT', { minimumFractionDigits: 2 })}` : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Agente Assegnato</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {cliente.agente ? (
                  <div>
                    <span className="font-medium text-blue-700">
                      {cliente.agente.codice_agente ? `[${cliente.agente.codice_agente}] ` : ''}
                      {cliente.agente.ragione_sociale}
                    </span>
                    {cliente.agente.email && (
                      <div className="text-xs text-gray-500 mt-1">{cliente.agente.email}</div>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400">Nessun agente</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Valuta Predefinita</dt>
              <dd className="mt-1 text-sm font-semibold text-blue-700">{cliente.valuta || 'EUR'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Aliquota IVA</dt>
              <dd className="mt-1 text-sm text-gray-900">{cliente.aliquota_iva || 22}%</dd>
            </div>
          </dl>
        </div>

        {/* SEZIONE 6: PAGAMENTI */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">💰 Dati Pagamento</h2>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Giorni Pagamento</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {cliente.giorni_pagamento ? `${cliente.giorni_pagamento} giorni` : '30 giorni (default)'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Banca</dt>
              <dd className="mt-1 text-sm text-gray-900">{cliente.banca || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">IBAN</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{cliente.iban || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">SWIFT/BIC</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{cliente.swift_bic || '-'}</dd>
            </div>
          </dl>
        </div>

        {/* SEZIONE 7: REFERENTE */}
        {(cliente.referente || cliente.referente_telefono || cliente.referente_email) && (
          <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
            <div className="mb-4 pb-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">👔 Referente</h2>
            </div>
            <dl className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <dt className="text-sm font-medium text-gray-500">Nome Referente</dt>
                <dd className="mt-1 text-sm text-gray-900">{cliente.referente || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Telefono Referente</dt>
                <dd className="mt-1 text-sm text-gray-900">{cliente.referente_telefono || '-'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email Referente</dt>
                <dd className="mt-1 text-sm text-gray-900">{cliente.referente_email || '-'}</dd>
              </div>
            </dl>
          </div>
        )}

        {/* SEZIONE 8: NOTE */}
        {cliente.note && (
          <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
            <div className="mb-4 pb-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">📝 Note</h2>
            </div>
            <div className="text-sm text-gray-900 bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
              {cliente.note}
            </div>
          </div>
        )}

        {/* Azioni */}
        <div className="flex gap-4 justify-end">
          <Link
            href="/dashboard/clienti"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Chiudi
          </Link>
          <Link
            href={`/dashboard/clienti/${id}/modifica`}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Modifica Cliente
          </Link>
        </div>
      </main>
    </div>
  )
}
