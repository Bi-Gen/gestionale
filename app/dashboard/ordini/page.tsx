import Link from 'next/link'

export default function OrdiniPage() {
  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Gestione Ordini</h1>
        <p className="text-sm text-gray-600 mt-1">Seleziona il tipo di ordine da gestire</p>
      </div>

      {/* Content */}
      <div className="max-w-4xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Ordini di Vendita */}
          <Link
            href="/dashboard/ordini/vendita"
            className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-8 border-2 border-transparent hover:border-blue-500"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Ordini di Vendita
            </h2>
            <p className="text-gray-600 mb-4">
              Gestisci gli ordini dei tuoi clienti
            </p>
            <span className="text-blue-600 font-medium inline-flex items-center">
              Vai agli ordini di vendita
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          </Link>

          {/* Card Ordini di Acquisto */}
          <Link
            href="/dashboard/ordini/acquisto"
            className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-8 border-2 border-transparent hover:border-orange-500"
          >
            <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-lg mb-4">
              <svg
                className="w-8 h-8 text-orange-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Ordini di Acquisto
            </h2>
            <p className="text-gray-600 mb-4">
              Gestisci gli ordini ai tuoi fornitori
            </p>
            <span className="text-orange-600 font-medium inline-flex items-center">
              Vai agli ordini di acquisto
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}
