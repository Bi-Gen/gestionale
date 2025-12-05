import { getSoggetto } from '@/app/actions/soggetti'
import { getTipiSoggetto } from '@/app/actions/tipi-soggetto'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function DettaglioSoggettoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ success?: string; error?: string; return?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  const soggetto = await getSoggetto(parseInt(id))

  if (!soggetto) {
    redirect('/dashboard/soggetti?error=Soggetto non trovato')
  }

  const tipiSoggetto = await getTipiSoggetto()
  const tipoSoggetto = tipiSoggetto.find(t => t.id === soggetto.tipo_soggetto_id)

  const returnUrl = query.return || '/dashboard/soggetti'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href={returnUrl}
            className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block"
          >
            ← Torna indietro
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dettaglio Soggetto
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

        {/* SEZIONE 1: TIPO SOGGETTO */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Tipo Soggetto</h2>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Tipo</dt>
              <dd className="mt-1 text-sm text-gray-900">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {tipoSoggetto?.nome || 'Non specificato'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Tipo Persona</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {soggetto.tipo_persona === 'fisica' ? 'Persona Fisica' : 'Persona Giuridica (Azienda)'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Stato</dt>
              <dd className="mt-1">
                {soggetto.attivo !== false ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Attivo
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Inattivo
                  </span>
                )}
              </dd>
            </div>
          </dl>
        </div>

        {/* SEZIONE 2: DATI ANAGRAFICI */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Dati Anagrafici</h2>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={soggetto.tipo_persona === 'fisica' ? '' : 'md:col-span-2'}>
              <dt className="text-sm font-medium text-gray-500">
                {soggetto.tipo_persona === 'fisica' ? 'Denominazione' : 'Ragione Sociale'}
              </dt>
              <dd className="mt-1 text-sm font-semibold text-gray-900">{soggetto.ragione_sociale}</dd>
            </div>
            {soggetto.tipo_persona === 'fisica' && (
              <>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Nome</dt>
                  <dd className="mt-1 text-sm text-gray-900">{soggetto.nome || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Cognome</dt>
                  <dd className="mt-1 text-sm text-gray-900">{soggetto.cognome || '-'}</dd>
                </div>
              </>
            )}
          </dl>
        </div>

        {/* SEZIONE 3: DATI FISCALI */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Dati Fiscali</h2>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Partita IVA</dt>
              <dd className="mt-1 text-sm text-gray-900">{soggetto.partita_iva || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Codice Fiscale</dt>
              <dd className="mt-1 text-sm text-gray-900">{soggetto.codice_fiscale || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Codice Univoco SDI</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">{soggetto.codice_univoco || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">PEC</dt>
              <dd className="mt-1 text-sm text-gray-900">{soggetto.pec || '-'}</dd>
            </div>
          </dl>
        </div>

        {/* SEZIONE 4: INDIRIZZO */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Indirizzo</h2>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Indirizzo</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {soggetto.indirizzo || '-'} {soggetto.civico ? `n. ${soggetto.civico}` : ''}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Città</dt>
              <dd className="mt-1 text-sm text-gray-900">{soggetto.citta || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">CAP</dt>
              <dd className="mt-1 text-sm text-gray-900">{soggetto.cap || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Provincia</dt>
              <dd className="mt-1 text-sm text-gray-900">{soggetto.provincia || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Paese</dt>
              <dd className="mt-1 text-sm text-gray-900">{soggetto.paese || 'IT'}</dd>
            </div>
          </dl>
        </div>

        {/* SEZIONE 5: CONTATTI */}
        <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Contatti</h2>
          </div>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <dt className="text-sm font-medium text-gray-500">Telefono</dt>
              <dd className="mt-1 text-sm text-gray-900">{soggetto.telefono || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Cellulare</dt>
              <dd className="mt-1 text-sm text-gray-900">{soggetto.cellulare || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{soggetto.email || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Sito Web</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {soggetto.sito_web ? (
                  <a href={soggetto.sito_web} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-700 hover:underline">
                    {soggetto.sito_web}
                  </a>
                ) : '-'}
              </dd>
            </div>
          </dl>
        </div>

        {/* SEZIONE 6: NOTE */}
        {soggetto.note && (
          <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
            <div className="mb-4 pb-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Note</h2>
            </div>
            <div className="text-sm text-gray-900 bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
              {soggetto.note}
            </div>
          </div>
        )}

        {/* Azioni */}
        <div className="flex gap-4 justify-end">
          <Link
            href={returnUrl}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Chiudi
          </Link>
          <Link
            href={`/dashboard/soggetti/${id}/modifica?return=${encodeURIComponent(returnUrl)}`}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            Modifica Soggetto
          </Link>
        </div>
      </main>
    </div>
  )
}
