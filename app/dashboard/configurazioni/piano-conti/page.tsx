import Link from 'next/link'
import { getPianoConti } from '@/app/actions/piano-conti'
import DeleteContoButton from './DeleteContoButton'

// Colori per natura
const NATURA_COLORS: Record<string, string> = {
  A: 'bg-blue-100 text-blue-800',
  P: 'bg-purple-100 text-purple-800',
  C: 'bg-red-100 text-red-800',
  R: 'bg-green-100 text-green-800',
  O: 'bg-gray-100 text-gray-800',
}

const NATURA_LABELS: Record<string, string> = {
  A: 'Attivo',
  P: 'Passivo',
  C: 'Costi',
  R: 'Ricavi',
  O: 'Ordine',
}

export default async function PianoContiPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>
}) {
  const params = await searchParams
  const conti = await getPianoConti()

  // Raggruppa per natura per una visualizzazione organizzata
  const contiPerNatura = conti.reduce((acc, conto) => {
    if (!acc[conto.natura]) acc[conto.natura] = []
    acc[conto.natura].push(conto)
    return acc
  }, {} as Record<string, typeof conti>)

  // Conta figli per ogni conto
  const childrenCount = conti.reduce((acc, conto) => {
    if (conto.parent_id) {
      acc[conto.parent_id] = (acc[conto.parent_id] || 0) + 1
    }
    return acc
  }, {} as Record<number, number>)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Piano dei Conti</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gestisci i conti per la contabilità generale
          </p>
        </div>
        <Link
          href="/dashboard/configurazioni/piano-conti/nuovo"
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors"
        >
          + Nuovo Conto
        </Link>
      </div>

      {/* Messages */}
      {params.success && (
        <div className="mb-4 rounded-md bg-green-50 p-4">
          <p className="text-sm text-green-700">{params.success}</p>
        </div>
      )}
      {params.error && (
        <div className="mb-4 rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{params.error}</p>
        </div>
      )}

      {/* Legenda */}
      <div className="mb-4 flex flex-wrap gap-2">
        {Object.entries(NATURA_LABELS).map(([key, label]) => (
          <span
            key={key}
            className={`px-2 py-1 rounded text-xs font-medium ${NATURA_COLORS[key]}`}
          >
            {key} = {label}
          </span>
        ))}
      </div>

      {/* Lista Conti per Natura */}
      {conti.length === 0 ? (
        <div className="bg-white shadow-sm rounded-lg p-8 text-center">
          <p className="text-gray-500">Nessun conto presente.</p>
          <Link
            href="/dashboard/configurazioni/piano-conti/nuovo"
            className="mt-4 inline-block text-blue-600 hover:text-blue-800"
          >
            Crea il primo conto
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {['A', 'P', 'C', 'R', 'O'].map((natura) => {
            const contiNatura = contiPerNatura[natura] || []
            if (contiNatura.length === 0) return null

            return (
              <div key={natura} className="bg-white shadow-sm rounded-lg overflow-hidden">
                <div className={`px-4 py-3 ${NATURA_COLORS[natura]} border-b`}>
                  <h2 className="font-semibold">
                    {NATURA_LABELS[natura]} ({contiNatura.length} conti)
                  </h2>
                </div>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Codice
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Descrizione
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Livello
                      </th>
                      {natura === 'C' && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Tipo Costo
                        </th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Flags
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Azioni
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {contiNatura.map((conto) => (
                      <tr key={conto.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className="font-mono text-sm"
                            style={{ paddingLeft: `${(conto.livello - 1) * 16}px` }}
                          >
                            {conto.livello > 1 && <span className="text-gray-400 mr-1">└</span>}
                            {conto.codice}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-900">{conto.descrizione}</span>
                          {!conto.modificabile && (
                            <span className="ml-2 text-xs text-gray-400">(sistema)</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="text-sm text-gray-500">Liv. {conto.livello}</span>
                        </td>
                        {natura === 'C' && (
                          <td className="px-4 py-3 whitespace-nowrap">
                            {conto.tipo_costo ? (
                              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                                {conto.tipo_costo}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        )}
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex gap-1">
                            {conto.conto_cliente && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded" title="Mastro Clienti">CLI</span>
                            )}
                            {conto.conto_fornitore && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-1 rounded" title="Mastro Fornitori">FOR</span>
                            )}
                            {conto.conto_banca && (
                              <span className="text-xs bg-green-100 text-green-700 px-1 rounded" title="Conto Banca">BAN</span>
                            )}
                            {conto.conto_cassa && (
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-1 rounded" title="Conto Cassa">CAS</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                          <Link
                            href={`/dashboard/configurazioni/piano-conti/${conto.id}/modifica`}
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            {conto.modificabile ? 'Modifica' : 'Dettagli'}
                          </Link>
                          {conto.modificabile && (
                            <DeleteContoButton
                              id={conto.id}
                              codice={conto.codice}
                              hasChildren={!!childrenCount[conto.id]}
                            />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
