import { getAgente } from '@/app/actions/agenti'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function DettaglioAgentePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  const agente = await getAgente(id)

  if (!agente) {
    redirect('/dashboard/agenti?error=Agente non trovato')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/dashboard/agenti"
            className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
          >
            ← Torna agli Agenti
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Dettaglio Agente
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {agente.codice_agente && (
                  <span className="font-mono font-semibold text-blue-700 mr-2">
                    [{agente.codice_agente}]
                  </span>
                )}
                Visualizzazione in sola lettura
              </p>
            </div>
            <div>
              {agente.attivo_come_agente ? (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  ✅ Attivo
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  ❌ Non Attivo
                </span>
              )}
            </div>
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
          <dl className="grid grid-cols-1 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Ragione Sociale</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">{agente.ragione_sociale}</dd>
              <p className="mt-1 text-xs text-gray-500">Società agente</p>
            </div>
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
              <dd className="mt-1 text-sm text-gray-900">{agente.partita_iva || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Codice Fiscale</dt>
              <dd className="mt-1 text-sm text-gray-900">{agente.codice_fiscale || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Codice Univoco SDI</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{agente.codice_univoco || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email PEC</dt>
              <dd className="mt-1 text-sm text-gray-900">{agente.pec || '-'}</dd>
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
              <dd className="mt-1 text-sm text-gray-900">{agente.email || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Sito Web</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {agente.sito_web ? (
                  <a href={agente.sito_web} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 hover:underline">
                    {agente.sito_web}
                  </a>
                ) : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Telefono</dt>
              <dd className="mt-1 text-sm text-gray-900">{agente.telefono || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Cellulare</dt>
              <dd className="mt-1 text-sm text-gray-900">{agente.cellulare || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Fax</dt>
              <dd className="mt-1 text-sm text-gray-900">{agente.fax || '-'}</dd>
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
                {agente.indirizzo || '-'} {agente.civico ? `n. ${agente.civico}` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Città</dt>
              <dd className="mt-1 text-sm text-gray-900">{agente.citta || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">CAP</dt>
              <dd className="mt-1 text-sm text-gray-900">{agente.cap || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Provincia</dt>
              <dd className="mt-1 text-sm text-gray-900">{agente.provincia || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Paese</dt>
              <dd className="mt-1 text-sm text-gray-900">{agente.paese || 'IT'}</dd>
            </div>
          </dl>
        </div>

        {/* SEZIONE 5: DATI AGENTE */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">💼 Dati Agente</h2>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Area Geografica</dt>
              <dd className="mt-1 text-sm text-gray-900">{agente.area_geografica || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Provvigione Percentuale</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {agente.provvigione_percentuale ? `${agente.provvigione_percentuale}%` : '-'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Stato</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {agente.attivo_come_agente ? (
                  <span className="text-green-700 font-medium">Attivo</span>
                ) : (
                  <span className="text-gray-500">Non Attivo</span>
                )}
              </dd>
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
                {agente.giorni_pagamento ? `${agente.giorni_pagamento} giorni` : '30 giorni (default)'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Banca</dt>
              <dd className="mt-1 text-sm text-gray-900">{agente.banca || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">IBAN</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{agente.iban || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">SWIFT/BIC</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{agente.swift_bic || '-'}</dd>
            </div>
          </dl>
        </div>

        {/* SEZIONE 7: NOTE */}
        {agente.note && (
          <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
            <div className="mb-4 pb-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">📝 Note</h2>
            </div>
            <div className="text-sm text-gray-900 bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
              {agente.note}
            </div>
          </div>
        )}

        {/* Azioni */}
        <div className="flex gap-4 justify-end">
          <Link
            href="/dashboard/agenti"
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Chiudi
          </Link>
          <Link
            href={`/dashboard/agenti/${id}/modifica`}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Modifica Agente
          </Link>
        </div>
      </main>
    </div>
  )
}
