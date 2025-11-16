import Link from 'next/link'

export default async function DashboardPage() {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard
        </h2>
        <p className="text-gray-600">
          Benvenuto nel gestionale. Seleziona una sezione dalla sidebar per iniziare.
        </p>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/dashboard/ordini"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="text-3xl">🛒</div>
            <h3 className="text-xl font-semibold text-gray-900">Ordini</h3>
          </div>
          <p className="text-gray-600">Gestisci ordini di acquisto e vendita</p>
        </Link>

        <Link
          href="/dashboard/fatture"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="text-3xl">🧾</div>
            <h3 className="text-xl font-semibold text-gray-900">Fatture</h3>
          </div>
          <p className="text-gray-600">In arrivo prossimamente</p>
        </Link>

        <Link
          href="/dashboard/prima-nota"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="text-3xl">📝</div>
            <h3 className="text-xl font-semibold text-gray-900">Prima Nota</h3>
          </div>
          <p className="text-gray-600">In arrivo prossimamente</p>
        </Link>

        <Link
          href="/dashboard/trasferimenti"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center gap-4 mb-3">
            <div className="text-3xl">🚚</div>
            <h3 className="text-xl font-semibold text-gray-900">Trasferimenti</h3>
          </div>
          <p className="text-gray-600">In arrivo prossimamente</p>
        </Link>
      </div>
    </div>
  )
}
