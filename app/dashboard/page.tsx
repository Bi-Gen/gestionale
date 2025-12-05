import Link from 'next/link'

export default async function DashboardPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard
        </h2>
        <p className="text-gray-600">
          Benvenuto in All in One. Seleziona una sezione dalla sidebar per iniziare.
        </p>
      </div>

      {/* Quick Access Cards - Solo sezioni attive */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/dashboard/soggetti"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="text-3xl">👥</div>
            <h3 className="text-xl font-semibold text-gray-900">Soggetti</h3>
          </div>
          <p className="text-gray-600">Gestisci clienti, fornitori e agenti</p>
        </Link>

        <Link
          href="/dashboard/prodotti"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="text-3xl">📦</div>
            <h3 className="text-xl font-semibold text-gray-900">Prodotti</h3>
          </div>
          <p className="text-gray-600">Gestisci anagrafica articoli</p>
        </Link>

        <Link
          href="/dashboard/configurazioni"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="text-3xl">⚙️</div>
            <h3 className="text-xl font-semibold text-gray-900">Configurazioni</h3>
          </div>
          <p className="text-gray-600">Imposta categorie, listini, IVA e altro</p>
        </Link>
      </div>

      {/* Sezioni in sviluppo */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-500 mb-4">Prossimamente</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 opacity-60">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🛒</div>
              <span className="text-gray-500">Ordini</span>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 opacity-60">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🧾</div>
              <span className="text-gray-500">Fatture</span>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 opacity-60">
            <div className="flex items-center gap-3">
              <div className="text-2xl">📊</div>
              <span className="text-gray-500">Magazzino</span>
            </div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 opacity-60">
            <div className="flex items-center gap-3">
              <div className="text-2xl">💰</div>
              <span className="text-gray-500">Contabilità</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
