import { getGeografiaStats, getRegioni, getProvince, getComuni } from '@/app/actions/geografia'
import SyncGeografiaButton from './SyncGeografiaButton'
import SearchComuni from './SearchComuni'

export default async function GeografiaPage() {
  const [stats, regioni, province, comuni] = await Promise.all([
    getGeografiaStats(),
    getRegioni(),
    getProvince(),
    getComuni()
  ])

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dati Geografici</h1>
        <p className="text-sm text-gray-600 mt-1">
          Gestisci regioni, province e comuni italiani
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Regioni</p>
              <p className="text-3xl font-bold text-blue-600">{stats.regioni}</p>
            </div>
            <div className="text-4xl">🗺️</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Province</p>
              <p className="text-3xl font-bold text-green-600">{stats.province}</p>
            </div>
            <div className="text-4xl">📍</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Comuni</p>
              <p className="text-3xl font-bold text-purple-600">{stats.comuni.toLocaleString()}</p>
            </div>
            <div className="text-4xl">🏘️</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-2">Sincronizza</p>
              <SyncGeografiaButton />
            </div>
            <div className="text-4xl">🔄</div>
          </div>
        </div>
      </div>

      {/* Search Comuni */}
      <div className="mb-6">
        <SearchComuni />
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button className="px-6 py-3 border-b-2 border-blue-600 text-blue-600 font-medium">
              Regioni ({regioni.length})
            </button>
            <button className="px-6 py-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300">
              Province ({province.length})
            </button>
            <button className="px-6 py-3 border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300">
              Comuni (primi 100)
            </button>
          </nav>
        </div>

        {/* Regioni Table */}
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Codice</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Province</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {regioni.map((regione) => {
                  const provinceCount = province.filter(p => p.regione_id === regione.id).length
                  return (
                    <tr key={regione.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {regione.codice}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {regione.nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                        {provinceCount}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
