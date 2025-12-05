import { getSoggetti, getSoggettiByTipoCodice } from '@/app/actions/soggetti'
import { getTipiSoggetto } from '@/app/actions/tipi-soggetto'
import Link from 'next/link'
import DeleteSoggettoButton from './DeleteSoggettoButton'

export default async function SoggettiPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; success?: string; error?: string }>
}) {
  const query = await searchParams
  const tipiSoggetto = await getTipiSoggetto()

  // Get filtered tipo_soggetto_id if tipo param is provided
  const tipoFiltrato = query.tipo
    ? tipiSoggetto.find(t => t.codice === query.tipo)
    : undefined

  // Check if we're viewing clients (to show extra columns)
  const isClienti = query.tipo === 'CLI'

  // Use getSoggettiByTipoCodice for CLI (includes categoria and agente), otherwise getSoggetti
  const soggetti = isClienti
    ? await getSoggettiByTipoCodice('CLI')
    : await getSoggetti(tipoFiltrato?.id)

  // Genera titolo plurale dal nome del tipo (aggiunge 'i' alla fine)
  const getTitoloPluralized = (tipo: typeof tipoFiltrato) => {
    if (!tipo) return 'Tutti i Soggetti'
    // Gestione plurale italiano base
    const nome = tipo.nome
    if (nome.endsWith('e')) return nome.slice(0, -1) + 'i' // Agente -> Agenti, Fornitore -> Fornitori
    if (nome.endsWith('a')) return nome.slice(0, -1) + 'he' // Banca -> Banche
    return nome + 'i' // Cliente -> Clienti
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getTitoloPluralized(tipoFiltrato)}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {tipoFiltrato
              ? `Gestisci i tuoi ${getTitoloPluralized(tipoFiltrato).toLowerCase()}`
              : 'Gestisci tutti i soggetti della tua azienda'}
          </p>
        </div>
        <Link
          href={`/dashboard/soggetti/nuovo${query.tipo ? `?tipo=${query.tipo}&return=/dashboard/soggetti?tipo=${query.tipo}` : ''}`}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          + Nuovo {tipoFiltrato ? tipoFiltrato.nome : 'Soggetto'}
        </Link>
      </div>

      {query.success && (
        <div className="mb-4 rounded-md bg-green-50 p-4 border border-green-200">
          <p className="text-sm text-green-700">{query.success}</p>
        </div>
      )}

      {query.error && (
        <div className="mb-4 rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-700">{query.error}</p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="mb-4 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <Link
            href="/dashboard/soggetti"
            className={`${
              !query.tipo
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Tutti
          </Link>
          {tipiSoggetto
            .filter(t => t.attivo)
            .map((tipo) => {
              // Mappa codice → label (plurale per tipi principali, nome per altri)
              const label = {
                CLI: 'Clienti',
                FOR: 'Fornitori',
                AGE: 'Agenti',
              }[tipo.codice] || tipo.nome

              return (
                <Link
                  key={tipo.id}
                  href={`/dashboard/soggetti?tipo=${tipo.codice}`}
                  className={`${
                    query.tipo === tipo.codice
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                >
                  {label}
                </Link>
              )
            })}
        </nav>
      </div>

      {soggetti.length === 0 ? (
        <div className="bg-white shadow-sm rounded-lg p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Nessun soggetto trovato
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Inizia creando il primo soggetto.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/soggetti/nuovo"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              + Nuovo Soggetto
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ragione Sociale
                </th>
                {!query.tipo && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                )}
                {isClienti && (
                  <>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agente
                    </th>
                  </>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Telefono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Città
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stato
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Azioni
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {soggetti.map((soggetto) => (
                <tr key={soggetto.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {soggetto.ragione_sociale}
                    </div>
                    {soggetto.partita_iva && (
                      <div className="text-sm text-gray-500">
                        P.IVA: {soggetto.partita_iva}
                      </div>
                    )}
                  </td>
                  {!query.tipo && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      {soggetto.tipo_soggetto && (
                        <span
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: soggetto.tipo_soggetto.colore
                              ? `${soggetto.tipo_soggetto.colore}20`
                              : '#e5e7eb',
                            color: soggetto.tipo_soggetto.colore || '#374151',
                          }}
                        >
                          {soggetto.tipo_soggetto.nome}
                        </span>
                      )}
                    </td>
                  )}
                  {isClienti && (
                    <>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {soggetto.categoria_cliente ? (
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: soggetto.categoria_cliente.colore
                                ? `${soggetto.categoria_cliente.colore}20`
                                : '#e5e7eb',
                              color: soggetto.categoria_cliente.colore || '#374151',
                            }}
                          >
                            {soggetto.categoria_cliente.nome}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {soggetto.agente ? (
                          <Link
                            href={`/dashboard/soggetti/${soggetto.agente.id}`}
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {soggetto.agente.ragione_sociale}
                          </Link>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                    </>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {soggetto.email || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {soggetto.telefono || soggetto.cellulare || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {soggetto.citta || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {soggetto.attivo ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Attivo
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Inattivo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end items-center gap-3">
                      <Link
                        href={`/dashboard/soggetti/${soggetto.id}`}
                        className="text-blue-600 hover:text-blue-900"
                        title="Visualizza dettagli"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </Link>
                      <Link
                        href={`/dashboard/soggetti/${soggetto.id}/modifica?return=/dashboard/soggetti${query.tipo ? `?tipo=${query.tipo}` : ''}`}
                        className="text-green-600 hover:text-green-900"
                        title="Modifica"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                          />
                        </svg>
                      </Link>
                      <DeleteSoggettoButton
                        id={soggetto.id}
                        nome={soggetto.ragione_sociale}
                        returnUrl={`/dashboard/soggetti${query.tipo ? `?tipo=${query.tipo}` : ''}`}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
